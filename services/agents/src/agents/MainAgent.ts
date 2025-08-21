import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { Logger } from 'pino';
import { SubAgent } from './SubAgent';

export interface AgentConfig {
  id: string;
  name: string;
  subAgents: SubAgentConfig[];
  redis: Redis;
  logger: Logger;
}

export interface SubAgentConfig {
  id: string;
  name: string;
  type: string;
}

export interface Task {
  id: string;
  type: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export interface AgentStatus {
  id: string;
  name: string;
  state: 'initializing' | 'ready' | 'busy' | 'idle' | 'error' | 'shutdown';
  subAgents: Record<string, SubAgentStatus>;
  tasksProcessed: number;
  errors: number;
  uptime: number;
}

export interface SubAgentStatus {
  id: string;
  state: string;
  tasksProcessed: number;
}

/**
 * Base class for all main agents
 */
export abstract class MainAgent extends EventEmitter {
  protected id: string;
  protected name: string;
  protected subAgents: Map<string, SubAgent> = new Map();
  protected redis: Redis;
  protected logger: Logger;
  protected state: 'initializing' | 'ready' | 'busy' | 'idle' | 'error' | 'shutdown' = 'initializing';
  protected tasksProcessed: number = 0;
  protected errors: number = 0;
  protected startTime: Date;
  protected taskQueue: Task[] = [];
  protected processing: boolean = false;

  constructor(config: AgentConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.redis = config.redis;
    this.logger = config.logger;
    this.startTime = new Date();

    // Initialize sub-agents
    this.initializeSubAgents(config.subAgents);
  }

  /**
   * Initialize sub-agents
   */
  protected abstract initializeSubAgents(configs: SubAgentConfig[]): void;

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    this.logger.info(`Starting ${this.name}...`);

    try {
      // Start all sub-agents
      const startPromises = Array.from(this.subAgents.values()).map(subAgent => 
        subAgent.start()
      );
      await Promise.all(startPromises);

      // Set up message listeners
      await this.setupMessageListeners();

      // Set up task processing
      this.startTaskProcessing();

      this.state = 'ready';
      this.logger.info(`✅ ${this.name} is ready with ${this.subAgents.size} sub-agents`);

      this.emit('ready', {
        agent: this.id,
        subAgents: Array.from(this.subAgents.keys())
      });

    } catch (error) {
      this.logger.error(`Failed to start ${this.name}:`, error);
      this.state = 'error';
      throw error;
    }
  }

  /**
   * Set up message listeners
   */
  protected async setupMessageListeners(): Promise<void> {
    // Subscribe to agent-specific channel
    const channel = `agent:${this.id}:messages`;
    
    // Use Redis pub/sub for real-time messaging
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(channel);

    subscriber.on('message', (channel, message) => {
      this.handleRedisMessage(JSON.parse(message));
    });

    this.logger.debug(`Listening on channel: ${channel}`);
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message: any): void {
    const { action, payload, correlationId } = message;

    this.logger.debug(`Received message: ${action}`);

    switch (action) {
      case 'execute':
        this.addTask(payload);
        break;
      
      case 'status':
        this.sendStatus(message.from, correlationId);
        break;
      
      case 'metrics':
        this.sendMetrics(message.from, correlationId);
        break;
      
      default:
        this.handleCustomMessage(message);
    }
  }

  /**
   * Handle Redis pub/sub messages
   */
  protected handleRedisMessage(message: any): void {
    // Override in subclasses for custom handling
    this.handleMessage(message);
  }

  /**
   * Handle custom messages (override in subclasses)
   */
  protected handleCustomMessage(message: any): void {
    this.logger.warn(`Unhandled message action: ${message.action}`);
  }

  /**
   * Add task to queue
   */
  protected addTask(task: Task): void {
    // Priority queue insertion
    if (task.priority === 'high') {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }

    this.logger.info(`Task added to queue: ${task.type} [${task.priority}]`);
    
    // Process immediately if not busy
    if (!this.processing) {
      this.processNextTask();
    }
  }

  /**
   * Start task processing loop
   */
  protected startTaskProcessing(): void {
    setInterval(() => {
      if (!this.processing && this.taskQueue.length > 0) {
        this.processNextTask();
      }
    }, 100); // Check every 100ms
  }

  /**
   * Process next task in queue
   */
  protected async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) {
      this.state = 'idle';
      return;
    }

    this.processing = true;
    this.state = 'busy';
    
    const task = this.taskQueue.shift()!;
    
    try {
      this.logger.info(`Processing task: ${task.type}`);
      
      const result = await this.executeTask(task);
      
      this.tasksProcessed++;
      this.state = 'idle';
      
      // Store result
      await this.storeTaskResult(task.id, result);
      
      // Emit completion event
      this.emit('task:completed', {
        task,
        result,
        agent: this.id
      });

    } catch (error) {
      this.errors++;
      this.logger.error(`Task failed:`, error);
      
      this.emit('task:failed', {
        task,
        error: error.message,
        agent: this.id
      });
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a task (must be implemented by subclasses)
   */
  abstract executeTask(task: Task): Promise<any>;

  /**
   * Store task result in Redis
   */
  protected async storeTaskResult(taskId: string, result: any): Promise<void> {
    const key = `task:result:${taskId}`;
    await this.redis.setex(key, 3600, JSON.stringify(result)); // Store for 1 hour
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    const subAgentStatuses: Record<string, SubAgentStatus> = {};
    
    for (const [id, subAgent] of this.subAgents) {
      subAgentStatuses[id] = subAgent.getStatus();
    }

    return {
      id: this.id,
      name: this.name,
      state: this.state,
      subAgents: subAgentStatuses,
      tasksProcessed: this.tasksProcessed,
      errors: this.errors,
      uptime: Date.now() - this.startTime.getTime()
    };
  }

  /**
   * Get agent metrics
   */
  async getMetrics(): Promise<any> {
    const metrics = {
      agent: this.id,
      tasksProcessed: this.tasksProcessed,
      errors: this.errors,
      errorRate: this.tasksProcessed > 0 ? this.errors / this.tasksProcessed : 0,
      queueDepth: this.taskQueue.length,
      uptime: Date.now() - this.startTime.getTime(),
      subAgents: {}
    };

    // Get metrics from sub-agents
    for (const [id, subAgent] of this.subAgents) {
      metrics.subAgents[id] = await subAgent.getMetrics();
    }

    return metrics;
  }

  /**
   * Scale agent by adjusting sub-agent replicas
   */
  async scale(replicas: number): Promise<void> {
    this.logger.info(`Scaling ${this.name} to ${replicas} replicas`);
    
    // Implementation would involve creating/destroying sub-agent instances
    // For now, just log the action
    
    this.emit('scaled', {
      agent: this.id,
      replicas
    });
  }

  /**
   * Send status to requester
   */
  protected sendStatus(to: string, correlationId: string): void {
    const status = this.getStatus();
    this.sendMessage(to, 'status', status, correlationId);
  }

  /**
   * Send metrics to requester
   */
  protected async sendMetrics(to: string, correlationId: string): Promise<void> {
    const metrics = await this.getMetrics();
    this.sendMessage(to, 'metrics', metrics, correlationId);
  }

  /**
   * Send message to another agent
   */
  protected sendMessage(to: string, action: string, payload: any, correlationId?: string): void {
    const message = {
      from: this.id,
      to,
      action,
      payload,
      correlationId: correlationId || this.generateCorrelationId(),
      timestamp: new Date()
    };

    // Publish to Redis
    this.redis.publish(`agent:${to}:messages`, JSON.stringify(message));
  }

  /**
   * Generate correlation ID
   */
  protected generateCorrelationId(): string {
    return `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get agent ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    this.logger.info(`Stopping ${this.name}...`);
    this.state = 'shutdown';

    // Stop all sub-agents
    const stopPromises = Array.from(this.subAgents.values()).map(subAgent => 
      subAgent.stop()
    );
    await Promise.all(stopPromises);

    this.logger.info(`✅ ${this.name} stopped`);
  }
}