import { Logger } from 'pino';
import { CrashProofRedisConnection } from './queue-connection';
import { CrashProofQueue } from './crash-proof-queue';
import { CronScheduler } from './cron-scheduler';
import { AlertingSystem, AlertSeverity, AlertType } from './alerting-system';
import { 
  QueueConfig, 
  WorkerConfig, 
  JobPriority, 
  CronJobConfig, 
  AlertConfig,
  HealthStatus,
  JobMetrics,
  DeduplicationConfig,
  CircuitBreakerConfig,
  JobRecoveryConfig,
  RateLimitConfig,
  BatchProcessingConfig
} from './queue-types';
import { Job } from 'bullmq';

export interface QueueManagerConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queues: {
    [queueName: string]: {
      config: QueueConfig;
      workerConfig: WorkerConfig;
      processor: (job: Job) => Promise<any>;
      deduplication?: DeduplicationConfig;
      circuitBreaker?: CircuitBreakerConfig;
      jobRecovery?: JobRecoveryConfig;
      rateLimit?: RateLimitConfig;
      batchProcessing?: BatchProcessingConfig;
    };
  };
  cron: {
    enabled: boolean;
    jobs: CronJobConfig[];
  };
  alerting: AlertConfig;
}

export class QueueManager {
  private redisConnection: CrashProofRedisConnection;
  private queues: Map<string, CrashProofQueue> = new Map();
  private cronScheduler: CronScheduler;
  private alertingSystem: AlertingSystem;
  private isInitialized = false;
  private isShuttingDown = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: QueueManagerConfig,
    private logger: Logger
  ) {
    this.redisConnection = new CrashProofRedisConnection(
      {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: false,
        keepAlive: 30000,
        family: 4,
        connectTimeout: 10000,
        commandTimeout: 5000
      },
      logger
    );

    this.cronScheduler = new CronScheduler(logger);
    this.alertingSystem = new AlertingSystem(config.alerting, logger);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Queue manager already initialized');
      return;
    }

    try {
      this.logger.info('Initializing CRYB Queue Manager...');

      // Initialize Redis connection
      await this.redisConnection.connect();
      this.logger.info('Redis connection established');

      // Initialize all queues
      for (const [queueName, queueSetup] of Object.entries(this.config.queues)) {
        await this.initializeQueue(queueName, queueSetup);
      }

      // Start cron scheduler if enabled
      if (this.config.cron.enabled) {
        this.cronScheduler.start();
        
        // Add cron jobs
        for (const cronConfig of this.config.cron.jobs) {
          const targetQueue = this.queues.get(this.getQueueForJobType(cronConfig.jobType));
          if (targetQueue) {
            this.cronScheduler.addCronJob(cronConfig, targetQueue);
          } else {
            this.logger.warn(`No queue found for cron job '${cronConfig.name}' with job type '${cronConfig.jobType}'`);
          }
        }
      }

      // Setup periodic health checks and metrics collection
      this.setupMonitoring();

      // Setup Redis connection monitoring
      this.redisConnection.onConnectionChange((connected) => {
        if (!connected) {
          this.alertingSystem.createAlert(
            AlertType.REDIS_CONNECTION_LOST,
            AlertSeverity.CRITICAL,
            'Redis Connection Lost',
            'Connection to Redis server has been lost',
            { timestamp: new Date().toISOString() }
          );
        }
      });

      this.isInitialized = true;
      this.logger.info('Queue Manager initialized successfully');

      // Create initialization success alert
      await this.alertingSystem.createAlert(
        AlertType.WORKER_CRASHED, // Using as general system alert
        AlertSeverity.INFO,
        'Queue Manager Initialized',
        'CRYB Queue Manager has been initialized successfully',
        { 
          queuesInitialized: Array.from(this.queues.keys()),
          cronEnabled: this.config.cron.enabled,
          cronJobs: this.config.cron.jobs.length
        }
      );

    } catch (error) {
      this.logger.error('Failed to initialize Queue Manager:', error);
      
      await this.alertingSystem.createAlert(
        AlertType.WORKER_CRASHED,
        AlertSeverity.CRITICAL,
        'Queue Manager Initialization Failed',
        'Failed to initialize CRYB Queue Manager',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      throw error;
    }
  }

  private async initializeQueue(
    queueName: string, 
    queueSetup: QueueManagerConfig['queues'][string]
  ): Promise<void> {
    try {
      const queue = new CrashProofQueue(
        queueName,
        this.redisConnection,
        queueSetup.config,
        queueSetup.workerConfig,
        queueSetup.processor,
        this.logger.child({ queue: queueName }),
        queueSetup.circuitBreaker,
        queueSetup.deduplication,
        queueSetup.jobRecovery,
        queueSetup.rateLimit,
        queueSetup.batchProcessing
      );

      await queue.initialize();
      this.queues.set(queueName, queue);
      
      this.logger.info(`Queue '${queueName}' initialized successfully`);
    } catch (error) {
      this.logger.error(`Failed to initialize queue '${queueName}':`, error);
      throw error;
    }
  }

  private setupMonitoring(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('Health check failed:', error);
      }
    }, 30000);

    // Metrics collection every 60 seconds
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectAndCheckMetrics();
      } catch (error) {
        this.logger.error('Metrics collection failed:', error);
      }
    }, 60000);

    // Dead letter queue monitoring every 5 minutes
    setInterval(async () => {
      try {
        await this.monitorDeadLetterQueues();
      } catch (error) {
        this.logger.error('Dead letter queue monitoring failed:', error);
      }
    }, 300000);

    // Cleanup old jobs every hour
    setInterval(async () => {
      try {
        await this.cleanupOldJobs();
      } catch (error) {
        this.logger.error('Job cleanup failed:', error);
      }
    }, 3600000);
  }

  private async performHealthCheck(): Promise<void> {
    const healthStatus: HealthStatus = {
      queue: {
        connected: true,
        queueLength: 0,
        processing: 0,
        failed: 0,
        delayed: 0
      },
      redis: await this.redisConnection.healthCheck(),
      workers: {
        active: 0,
        total: this.queues.size,
        healthy: 0
      },
      circuitBreaker: {
        state: 'CLOSED',
        failureCount: 0
      }
    };

    let totalQueueLength = 0;
    let totalProcessing = 0;
    let totalFailed = 0;
    let healthyWorkers = 0;

    for (const [queueName, queue] of this.queues) {
      try {
        const queueHealth = await queue.getHealthStatus();
        totalQueueLength += queueHealth.queue.queueLength;
        totalProcessing += queueHealth.queue.processing;
        totalFailed += queueHealth.queue.failed;
        
        if (queueHealth.workers.healthy > 0) {
          healthyWorkers++;
        }

        // Check individual queue health
        if (queueHealth.circuitBreaker.state === 'OPEN') {
          await this.alertingSystem.createAlert(
            AlertType.CIRCUIT_BREAKER_OPEN,
            AlertSeverity.HIGH,
            `Circuit Breaker Open - ${queueName}`,
            `Circuit breaker for queue '${queueName}' is open`,
            queueHealth.circuitBreaker,
            queueName
          );
        }
        
      } catch (error) {
        this.logger.error(`Health check failed for queue '${queueName}':`, error);
      }
    }

    healthStatus.queue.queueLength = totalQueueLength;
    healthStatus.queue.processing = totalProcessing;
    healthStatus.queue.failed = totalFailed;
    healthStatus.workers.healthy = healthyWorkers;
    healthStatus.workers.active = healthyWorkers;

    // Check overall health thresholds
    this.alertingSystem.checkMetricsThresholds(undefined, healthStatus);
  }

  private async collectAndCheckMetrics(): Promise<void> {
    for (const [queueName, queue] of this.queues) {
      try {
        const metrics = await queue.getMetrics();
        
        // Log metrics for monitoring
        this.logger.info(`Queue '${queueName}' metrics:`, metrics);
        
        // Check thresholds
        this.alertingSystem.checkMetricsThresholds(metrics);
        
      } catch (error) {
        this.logger.error(`Failed to collect metrics for queue '${queueName}':`, error);
      }
    }
  }

  private async monitorDeadLetterQueues(): Promise<void> {
    for (const [queueName, queue] of this.queues) {
      try {
        // Attempt to retry some dead letter jobs
        const retriedCount = await queue.retryDeadLetterJobs(5);
        
        if (retriedCount > 0) {
          this.logger.info(`Retried ${retriedCount} dead letter jobs for queue '${queueName}'`);
          
          await this.alertingSystem.createAlert(
            AlertType.DEAD_LETTER_QUEUE_FULL,
            AlertSeverity.INFO,
            `Dead Letter Jobs Retried - ${queueName}`,
            `Successfully retried ${retriedCount} dead letter jobs`,
            { retriedCount, queueName }
          );
        }
        
      } catch (error) {
        this.logger.error(`Dead letter queue monitoring failed for '${queueName}':`, error);
      }
    }
  }

  private async cleanupOldJobs(): Promise<void> {
    for (const [queueName, queue] of this.queues) {
      try {
        const cleaned = await queue.cleanupCompletedJobs(24 * 60 * 60 * 1000); // 24 hours
        
        if (cleaned > 0) {
          this.logger.info(`Cleaned up ${cleaned} old jobs from queue '${queueName}'`);
        }
        
      } catch (error) {
        this.logger.error(`Job cleanup failed for queue '${queueName}':`, error);
      }
    }
  }

  private getQueueForJobType(jobType: string): string {
    // Map job types to queue names based on your business logic
    const jobTypeToQueue: Record<string, string> = {
      'process-message': 'messages',
      'send-notification': 'notifications',
      'process-media': 'media',
      'analyze-content': 'analytics',
      'moderate-content': 'moderation',
      'process-blockchain': 'blockchain',
      'send-email': 'notifications',
      'cleanup-old-data': 'maintenance',
      'generate-report': 'reports',
      'backup-data': 'maintenance',
      'sync-data': 'sync'
    };

    return jobTypeToQueue[jobType] || 'default';
  }

  // Public API methods

  async addJob(
    queueName: string,
    jobType: string,
    data: any,
    options: {
      priority?: JobPriority;
      delay?: number;
      repeat?: { pattern: string; tz?: string };
      jobId?: string;
      attempts?: number;
    } = {}
  ): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return await queue.addJob(jobType, data, options);
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.pauseQueue();
    this.logger.info(`Queue '${queueName}' paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.resumeQueue();
    this.logger.info(`Queue '${queueName}' resumed`);
  }

  async drainQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.drainQueue();
    this.logger.info(`Queue '${queueName}' drained`);
  }

  async getQueueMetrics(queueName: string): Promise<JobMetrics> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return await queue.getMetrics();
  }

  async getAllQueueMetrics(): Promise<Record<string, JobMetrics>> {
    const allMetrics: Record<string, JobMetrics> = {};
    
    for (const [queueName, queue] of this.queues) {
      try {
        allMetrics[queueName] = await queue.getMetrics();
      } catch (error) {
        this.logger.error(`Failed to get metrics for queue '${queueName}':`, error);
      }
    }
    
    return allMetrics;
  }

  async getHealthStatus(): Promise<HealthStatus & { queues: Record<string, HealthStatus> }> {
    const overallHealth: HealthStatus = {
      queue: { connected: true, queueLength: 0, processing: 0, failed: 0, delayed: 0 },
      redis: await this.redisConnection.healthCheck(),
      workers: { active: 0, total: this.queues.size, healthy: 0 },
      circuitBreaker: { state: 'CLOSED', failureCount: 0 }
    };

    const queueHealths: Record<string, HealthStatus> = {};

    for (const [queueName, queue] of this.queues) {
      try {
        const queueHealth = await queue.getHealthStatus();
        queueHealths[queueName] = queueHealth;
        
        // Aggregate metrics
        overallHealth.queue.queueLength += queueHealth.queue.queueLength;
        overallHealth.queue.processing += queueHealth.queue.processing;
        overallHealth.queue.failed += queueHealth.queue.failed;
        overallHealth.queue.delayed += queueHealth.queue.delayed;
        overallHealth.workers.active += queueHealth.workers.active;
        overallHealth.workers.healthy += queueHealth.workers.healthy;
        
      } catch (error) {
        this.logger.error(`Failed to get health status for queue '${queueName}':`, error);
      }
    }

    return { ...overallHealth, queues: queueHealths };
  }

  // Cron job management
  addCronJob(config: CronJobConfig): void {
    const targetQueue = this.queues.get(this.getQueueForJobType(config.jobType));
    if (!targetQueue) {
      throw new Error(`No queue found for job type '${config.jobType}'`);
    }

    this.cronScheduler.addCronJob(config, targetQueue);
  }

  removeCronJob(name: string): boolean {
    return this.cronScheduler.removeCronJob(name);
  }

  enableCronJob(name: string): boolean {
    return this.cronScheduler.enableCronJob(name);
  }

  disableCronJob(name: string): boolean {
    return this.cronScheduler.disableCronJob(name);
  }

  getCronJobs(): any[] {
    return this.cronScheduler.getAllCronJobs();
  }

  getCronJobStatus(name: string): any {
    return this.cronScheduler.getCronJobStatus(name);
  }

  // Alert management
  getActiveAlerts(): any[] {
    return this.alertingSystem.getActiveAlerts();
  }

  getAlertHistory(limit?: number): any[] {
    return this.alertingSystem.getAlertHistory(limit);
  }

  getAlertStats(): any {
    return this.alertingSystem.getAlertStats();
  }

  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    return await this.alertingSystem.resolveAlert(alertId, resolvedBy);
  }

  suppressAlertType(type: any, durationMinutes: number): void {
    this.alertingSystem.suppressAlertType(type, durationMinutes);
  }

  async testAlertChannel(channelName: string): Promise<boolean> {
    return await this.alertingSystem.testChannel(channelName);
  }

  // System management
  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  isShuttingDown(): boolean {
    return this.isShuttingDown;
  }

  async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Starting graceful shutdown of Queue Manager...');

    try {
      // Stop monitoring intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      // Stop cron scheduler
      await this.cronScheduler.gracefulShutdown();

      // Gracefully shutdown all queues
      const shutdownPromises = Array.from(this.queues.entries()).map(async ([queueName, queue]) => {
        try {
          await queue.gracefulShutdown();
          this.logger.info(`Queue '${queueName}' shut down successfully`);
        } catch (error) {
          this.logger.error(`Error shutting down queue '${queueName}':`, error);
        }
      });

      await Promise.all(shutdownPromises);

      // Disconnect from Redis
      await this.redisConnection.disconnect();

      // Final alert
      await this.alertingSystem.createAlert(
        AlertType.WORKER_CRASHED,
        AlertSeverity.INFO,
        'Queue Manager Shutdown',
        'CRYB Queue Manager has been shut down gracefully',
        { timestamp: new Date().toISOString() }
      );

      this.logger.info('Queue Manager shutdown completed successfully');

    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      throw error;
    }
  }

  // Emergency shutdown (force stop)
  async emergencyShutdown(): Promise<void> {
    this.logger.warn('Emergency shutdown initiated');
    
    try {
      // Force stop everything immediately
      if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
      if (this.metricsInterval) clearInterval(this.metricsInterval);
      
      this.cronScheduler.stop();
      
      // Force disconnect Redis
      await this.redisConnection.disconnect();
      
      this.logger.info('Emergency shutdown completed');
    } catch (error) {
      this.logger.error('Error during emergency shutdown:', error);
    }
  }

  // Utility methods for debugging and monitoring
  async getSystemStats(): Promise<{
    uptime: number;
    totalQueues: number;
    totalJobs: {
      processed: number;
      failed: number;
      active: number;
      waiting: number;
    };
    redis: {
      connected: boolean;
      latency?: number;
    };
    cron: {
      totalJobs: number;
      activeJobs: number;
      totalRuns: number;
    };
    alerts: {
      active: number;
      total: number;
    };
  }> {
    const allMetrics = await this.getAllQueueMetrics();
    const cronStats = this.cronScheduler.getSchedulerStats();
    const alertStats = this.alertingSystem.getAlertStats();
    const redisHealth = await this.redisConnection.healthCheck();

    const totalJobs = {
      processed: 0,
      failed: 0,
      active: 0,
      waiting: 0
    };

    Object.values(allMetrics).forEach(metrics => {
      totalJobs.processed += metrics.totalProcessed;
      totalJobs.failed += metrics.totalFailed;
      totalJobs.active += metrics.activeJobs;
      totalJobs.waiting += metrics.queueLength;
    });

    return {
      uptime: process.uptime(),
      totalQueues: this.queues.size,
      totalJobs,
      redis: {
        connected: redisHealth.connected,
        latency: redisHealth.latency
      },
      cron: {
        totalJobs: cronStats.totalJobs,
        activeJobs: cronStats.enabledJobs,
        totalRuns: cronStats.totalRuns
      },
      alerts: {
        active: alertStats.active,
        total: alertStats.total
      }
    };
  }
}