import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { DomainEvent, DomainEventManager } from './domain-events';
import { Command, CQRSManager } from './cqrs';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface SagaStep {
  id: string;
  name: string;
  command: Command;
  compensationCommand?: Command;
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    delay: number;
    backoffMultiplier?: number;
  };
}

export interface SagaDefinition {
  id: string;
  name: string;
  correlationProperty: string;
  steps: SagaStep[];
  timeout?: number;
  compensationStrategy: 'backward' | 'forward' | 'custom';
}

export interface SagaInstance {
  id: string;
  sagaId: string;
  correlationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensating' | 'compensated';
  currentStep: number;
  completedSteps: string[];
  failedSteps: string[];
  compensatedSteps: string[];
  data: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  lastUpdatedAt: Date;
  error?: string;
  retryCount: number;
  timeoutAt?: Date;
}

export interface SagaStepResult {
  stepId: string;
  success: boolean;
  result?: any;
  error?: string;
  compensationRequired: boolean;
}

export class SagaManager extends EventEmitter {
  private redis: Redis;
  private logger: Logger;
  private eventManager: DomainEventManager;
  private cqrsManager: CQRSManager;
  
  private sagaDefinitions: Map<string, SagaDefinition> = new Map();
  private runningInstances: Map<string, SagaInstance> = new Map();
  
  private metrics = {
    sagasStarted: 0,
    sagasCompleted: 0,
    sagasFailed: 0,
    sagasCompensated: 0,
    stepsExecuted: 0,
    stepsCompensated: 0,
    timeouts: 0,
    retries: 0,
    averageExecutionTime: 0,
  };

  private timeoutIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    redis: Redis,
    logger: Logger,
    eventManager: DomainEventManager,
    cqrsManager: CQRSManager
  ) {
    super();
    this.redis = redis;
    this.logger = logger;
    this.eventManager = eventManager;
    this.cqrsManager = cqrsManager;
    this.setupEventHandlers();
    this.startTimeoutMonitor();
  }

  private setupEventHandlers(): void {
    this.eventManager.on('event', async (event: DomainEvent) => {
      await this.handleEvent(event);
    });

    this.cqrsManager.on('command:executed', async ({ command, result }) => {
      await this.handleCommandResult(command, result, true);
    });

    this.cqrsManager.on('command:failed', async ({ command, error }) => {
      await this.handleCommandResult(command, { success: false, error }, false);
    });
  }

  public registerSaga(saga: SagaDefinition): void {
    this.sagaDefinitions.set(saga.id, saga);
    this.logger.info({
      sagaId: saga.id,
      sagaName: saga.name,
      stepCount: saga.steps.length,
      correlationProperty: saga.correlationProperty,
    }, 'Saga registered');
  }

  public async startSaga(
    sagaId: string,
    correlationId: string,
    initialData: Record<string, any> = {}
  ): Promise<SagaInstance> {
    const sagaDefinition = this.sagaDefinitions.get(sagaId);
    if (!sagaDefinition) {
      throw new Error(`Saga definition ${sagaId} not found`);
    }

    const instance: SagaInstance = {
      id: uuidv4(),
      sagaId,
      correlationId,
      status: 'pending',
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      compensatedSteps: [],
      data: initialData,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      retryCount: 0,
      timeoutAt: sagaDefinition.timeout 
        ? new Date(Date.now() + sagaDefinition.timeout * 1000)
        : undefined,
    };

    // Store instance
    await this.storeInstance(instance);
    this.runningInstances.set(instance.id, instance);

    // Start execution
    await this.executeNextStep(instance);

    // Set timeout if configured
    if (instance.timeoutAt) {
      this.scheduleTimeout(instance);
    }

    this.metrics.sagasStarted++;

    this.logger.info({
      instanceId: instance.id,
      sagaId,
      correlationId,
      timeoutAt: instance.timeoutAt,
    }, 'Saga instance started');

    this.emit('saga:started', instance);
    return instance;
  }

  private async executeNextStep(instance: SagaInstance): Promise<void> {
    const saga = this.sagaDefinitions.get(instance.sagaId);
    if (!saga) {
      throw new Error(`Saga definition ${instance.sagaId} not found`);
    }

    if (instance.currentStep >= saga.steps.length) {
      await this.completeSaga(instance);
      return;
    }

    const step = saga.steps[instance.currentStep];
    instance.status = 'running';
    instance.lastUpdatedAt = new Date();

    await this.storeInstance(instance);

    try {
      this.logger.info({
        instanceId: instance.id,
        stepId: step.id,
        stepName: step.name,
        currentStep: instance.currentStep,
      }, 'Executing saga step');

      // Prepare command with saga context
      const command: Command = {
        ...step.command,
        id: uuidv4(),
        metadata: {
          ...step.command.metadata,
          correlationId: instance.correlationId,
          causationId: instance.id,
          sagaInstanceId: instance.id,
          sagaStepId: step.id,
        },
      };

      // Execute command
      const result = await this.cqrsManager.executeCommand(command);
      
      if (result.success) {
        await this.handleStepSuccess(instance, step, result);
      } else {
        await this.handleStepFailure(instance, step, result.errors?.[0] || 'Unknown error');
      }

    } catch (error) {
      await this.handleStepFailure(instance, step, error instanceof Error ? error.message : String(error));
    }
  }

  private async handleStepSuccess(instance: SagaInstance, step: SagaStep, result: any): Promise<void> {
    instance.completedSteps.push(step.id);
    instance.currentStep++;
    instance.lastUpdatedAt = new Date();
    instance.retryCount = 0; // Reset retry count on success

    // Store step result in instance data
    instance.data[`step_${step.id}_result`] = result;

    await this.storeInstance(instance);
    this.metrics.stepsExecuted++;

    this.logger.info({
      instanceId: instance.id,
      stepId: step.id,
      stepName: step.name,
      currentStep: instance.currentStep,
    }, 'Saga step completed successfully');

    this.emit('saga:step:completed', { instance, step, result });

    // Execute next step
    await this.executeNextStep(instance);
  }

  private async handleStepFailure(instance: SagaInstance, step: SagaStep, error: string): Promise<void> {
    this.logger.error({
      instanceId: instance.id,
      stepId: step.id,
      stepName: step.name,
      error,
      retryCount: instance.retryCount,
    }, 'Saga step failed');

    // Check if retry is possible
    if (step.retryPolicy && instance.retryCount < step.retryPolicy.maxAttempts) {
      await this.retryStep(instance, step);
      return;
    }

    // No more retries, mark step as failed
    instance.failedSteps.push(step.id);
    instance.status = 'failed';
    instance.error = error;
    instance.lastUpdatedAt = new Date();

    await this.storeInstance(instance);

    this.emit('saga:step:failed', { instance, step, error });

    // Start compensation
    await this.startCompensation(instance);
  }

  private async retryStep(instance: SagaInstance, step: SagaStep): Promise<void> {
    if (!step.retryPolicy) return;

    instance.retryCount++;
    const delay = step.retryPolicy.delay * Math.pow(step.retryPolicy.backoffMultiplier || 1, instance.retryCount - 1);

    this.logger.info({
      instanceId: instance.id,
      stepId: step.id,
      retryCount: instance.retryCount,
      delayMs: delay,
    }, 'Retrying saga step');

    this.metrics.retries++;

    // Schedule retry
    setTimeout(async () => {
      try {
        await this.executeNextStep(instance);
      } catch (error) {
        this.logger.error({
          error,
          instanceId: instance.id,
          stepId: step.id,
        }, 'Saga step retry failed');
      }
    }, delay);
  }

  private async startCompensation(instance: SagaInstance): Promise<void> {
    const saga = this.sagaDefinitions.get(instance.sagaId);
    if (!saga) return;

    this.logger.info({
      instanceId: instance.id,
      sagaId: instance.sagaId,
      completedSteps: instance.completedSteps.length,
      compensationStrategy: saga.compensationStrategy,
    }, 'Starting saga compensation');

    instance.status = 'compensating';
    instance.lastUpdatedAt = new Date();
    await this.storeInstance(instance);

    this.emit('saga:compensation:started', instance);

    switch (saga.compensationStrategy) {
      case 'backward':
        await this.executeBackwardCompensation(instance);
        break;
      case 'forward':
        await this.executeForwardCompensation(instance);
        break;
      case 'custom':
        await this.executeCustomCompensation(instance);
        break;
    }
  }

  private async executeBackwardCompensation(instance: SagaInstance): Promise<void> {
    const saga = this.sagaDefinitions.get(instance.sagaId);
    if (!saga) return;

    // Compensate completed steps in reverse order
    const completedSteps = [...instance.completedSteps].reverse();

    for (const stepId of completedSteps) {
      const step = saga.steps.find(s => s.id === stepId);
      if (!step || !step.compensationCommand) {
        continue;
      }

      try {
        this.logger.info({
          instanceId: instance.id,
          stepId: step.id,
          stepName: step.name,
        }, 'Executing compensation command');

        const compensationCommand: Command = {
          ...step.compensationCommand,
          id: uuidv4(),
          metadata: {
            ...step.compensationCommand.metadata,
            correlationId: instance.correlationId,
            causationId: instance.id,
            sagaInstanceId: instance.id,
            sagaStepId: step.id,
            isCompensation: true,
          },
        };

        const result = await this.cqrsManager.executeCommand(compensationCommand);
        
        if (result.success) {
          instance.compensatedSteps.push(step.id);
          this.metrics.stepsCompensated++;
          
          this.logger.info({
            instanceId: instance.id,
            stepId: step.id,
          }, 'Compensation step completed successfully');
        } else {
          this.logger.error({
            instanceId: instance.id,
            stepId: step.id,
            error: result.errors?.[0],
          }, 'Compensation step failed');
        }

      } catch (error) {
        this.logger.error({
          error,
          instanceId: instance.id,
          stepId: step.id,
        }, 'Compensation execution failed');
      }
    }

    await this.completeCompensation(instance);
  }

  private async executeForwardCompensation(instance: SagaInstance): Promise<void> {
    // Forward compensation strategy: continue with remaining steps that can handle the failure
    // This is more complex and would depend on the specific business logic
    this.logger.warn({
      instanceId: instance.id,
    }, 'Forward compensation not implemented, falling back to backward compensation');
    
    await this.executeBackwardCompensation(instance);
  }

  private async executeCustomCompensation(instance: SagaInstance): Promise<void> {
    // Custom compensation would be handled by domain-specific logic
    this.logger.warn({
      instanceId: instance.id,
    }, 'Custom compensation not implemented, falling back to backward compensation');
    
    await this.executeBackwardCompensation(instance);
  }

  private async completeCompensation(instance: SagaInstance): Promise<void> {
    instance.status = 'compensated';
    instance.completedAt = new Date();
    instance.lastUpdatedAt = new Date();

    await this.storeInstance(instance);
    this.runningInstances.delete(instance.id);
    this.clearTimeout(instance.id);

    this.metrics.sagasCompensated++;

    this.logger.info({
      instanceId: instance.id,
      sagaId: instance.sagaId,
      compensatedSteps: instance.compensatedSteps.length,
      executionTime: instance.completedAt.getTime() - instance.startedAt.getTime(),
    }, 'Saga compensation completed');

    this.emit('saga:compensated', instance);
  }

  private async completeSaga(instance: SagaInstance): Promise<void> {
    instance.status = 'completed';
    instance.completedAt = new Date();
    instance.lastUpdatedAt = new Date();

    await this.storeInstance(instance);
    this.runningInstances.delete(instance.id);
    this.clearTimeout(instance.id);

    this.metrics.sagasCompleted++;
    
    const executionTime = instance.completedAt.getTime() - instance.startedAt.getTime();
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.sagasCompleted - 1) + executionTime) / 
      this.metrics.sagasCompleted;

    this.logger.info({
      instanceId: instance.id,
      sagaId: instance.sagaId,
      executionTime,
      completedSteps: instance.completedSteps.length,
    }, 'Saga completed successfully');

    this.emit('saga:completed', instance);
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    // Check if any running sagas are waiting for this event
    for (const instance of this.runningInstances.values()) {
      const saga = this.sagaDefinitions.get(instance.sagaId);
      if (!saga) continue;

      // Check if this event matches the saga's correlation property
      const correlationValue = event.data[saga.correlationProperty] || 
                              event.metadata[saga.correlationProperty as keyof typeof event.metadata];
      
      if (correlationValue === instance.correlationId) {
        // Update saga instance data with event data
        instance.data[`event_${event.type}`] = event.data;
        instance.lastUpdatedAt = new Date();
        await this.storeInstance(instance);

        this.emit('saga:event:received', { instance, event });
      }
    }
  }

  private async handleCommandResult(command: Command, result: any, success: boolean): Promise<void> {
    const sagaInstanceId = command.metadata.sagaInstanceId;
    if (!sagaInstanceId) return;

    const instance = this.runningInstances.get(sagaInstanceId);
    if (!instance) return;

    // This is handled by the step execution logic
    // Additional processing can be added here if needed
  }

  private async storeInstance(instance: SagaInstance): Promise<void> {
    await this.redis.set(
      `saga:instance:${instance.id}`,
      JSON.stringify(instance),
      'EX',
      86400 * 30 // Keep for 30 days
    );

    // Also index by correlation ID for easier lookup
    await this.redis.set(
      `saga:correlation:${instance.correlationId}:${instance.sagaId}`,
      instance.id,
      'EX',
      86400 * 30
    );
  }

  private async loadInstance(instanceId: string): Promise<SagaInstance | null> {
    const data = await this.redis.get(`saga:instance:${instanceId}`);
    if (!data) return null;

    const instance = JSON.parse(data) as SagaInstance;
    // Convert date strings back to Date objects
    instance.startedAt = new Date(instance.startedAt);
    instance.lastUpdatedAt = new Date(instance.lastUpdatedAt);
    if (instance.completedAt) instance.completedAt = new Date(instance.completedAt);
    if (instance.timeoutAt) instance.timeoutAt = new Date(instance.timeoutAt);

    return instance;
  }

  private scheduleTimeout(instance: SagaInstance): void {
    if (!instance.timeoutAt) return;

    const timeoutMs = instance.timeoutAt.getTime() - Date.now();
    if (timeoutMs <= 0) {
      // Already timed out
      this.handleTimeout(instance.id);
      return;
    }

    const timeoutId = setTimeout(() => {
      this.handleTimeout(instance.id);
    }, timeoutMs);

    this.timeoutIntervals.set(instance.id, timeoutId);
  }

  private clearTimeout(instanceId: string): void {
    const timeoutId = this.timeoutIntervals.get(instanceId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutIntervals.delete(instanceId);
    }
  }

  private async handleTimeout(instanceId: string): Promise<void> {
    const instance = this.runningInstances.get(instanceId) || await this.loadInstance(instanceId);
    if (!instance || instance.status === 'completed' || instance.status === 'compensated') {
      return;
    }

    this.logger.warn({
      instanceId,
      sagaId: instance.sagaId,
      currentStep: instance.currentStep,
      status: instance.status,
    }, 'Saga instance timed out');

    instance.status = 'failed';
    instance.error = 'Saga execution timed out';
    instance.lastUpdatedAt = new Date();

    await this.storeInstance(instance);
    this.metrics.timeouts++;

    this.emit('saga:timeout', instance);

    // Start compensation
    await this.startCompensation(instance);
  }

  private startTimeoutMonitor(): void {
    // Check for timed out sagas every minute
    setInterval(async () => {
      try {
        const now = Date.now();
        
        for (const instance of this.runningInstances.values()) {
          if (instance.timeoutAt && instance.timeoutAt.getTime() <= now) {
            await this.handleTimeout(instance.id);
          }
        }
      } catch (error) {
        this.logger.error({ error }, 'Error in timeout monitor');
      }
    }, 60000);
  }

  public async getSagaInstance(instanceId: string): Promise<SagaInstance | null> {
    return this.runningInstances.get(instanceId) || await this.loadInstance(instanceId);
  }

  public async getSagaByCorrelation(correlationId: string, sagaId: string): Promise<SagaInstance | null> {
    const instanceId = await this.redis.get(`saga:correlation:${correlationId}:${sagaId}`);
    if (!instanceId) return null;

    return await this.getSagaInstance(instanceId);
  }

  public async cancelSaga(instanceId: string, reason: string = 'Cancelled by user'): Promise<void> {
    const instance = await this.getSagaInstance(instanceId);
    if (!instance || instance.status === 'completed' || instance.status === 'compensated') {
      throw new Error('Cannot cancel saga in current state');
    }

    this.logger.info({
      instanceId,
      sagaId: instance.sagaId,
      reason,
    }, 'Cancelling saga instance');

    instance.status = 'failed';
    instance.error = reason;
    instance.lastUpdatedAt = new Date();

    await this.storeInstance(instance);
    this.emit('saga:cancelled', { instance, reason });

    // Start compensation
    await this.startCompensation(instance);
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      successRate: this.metrics.sagasStarted > 0
        ? ((this.metrics.sagasCompleted) / this.metrics.sagasStarted) * 100
        : 100,
      compensationRate: this.metrics.sagasStarted > 0
        ? (this.metrics.sagasCompensated / this.metrics.sagasStarted) * 100
        : 0,
      timeoutRate: this.metrics.sagasStarted > 0
        ? (this.metrics.timeouts / this.metrics.sagasStarted) * 100
        : 0,
      averageStepsPerSaga: this.metrics.sagasStarted > 0
        ? this.metrics.stepsExecuted / this.metrics.sagasStarted
        : 0,
      runningSagas: this.runningInstances.size,
      registeredSagas: this.sagaDefinitions.size,
    };
  }

  public listSagaDefinitions(): string[] {
    return Array.from(this.sagaDefinitions.keys());
  }

  public getSagaDefinition(sagaId: string): SagaDefinition | undefined {
    return this.sagaDefinitions.get(sagaId);
  }

  public getRunningInstances(): SagaInstance[] {
    return Array.from(this.runningInstances.values());
  }
}

export default SagaManager;