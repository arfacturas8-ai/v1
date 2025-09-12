import { Queue, Worker, Job, QueueEvents, JobsOptions, WorkerOptions } from 'bullmq';
import { Logger } from 'pino';
import { CrashProofRedisConnection } from './queue-connection';
import { 
  JobPriority, 
  QueueConfig, 
  WorkerConfig, 
  JobData, 
  JobProgress, 
  JobMetrics,
  HealthStatus,
  DeduplicationConfig,
  CircuitBreakerConfig,
  JobRecoveryConfig,
  RateLimitConfig,
  BatchProcessingConfig
} from './queue-types';

export class CrashProofQueue {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents | null = null;
  private deadLetterQueue: Queue | null = null;
  private isShuttingDown = false;
  private circuitBreakerFailures = 0;
  private circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastCircuitBreakerReset = Date.now();
  private deduplicationCache = new Map<string, number>();
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  private jobMetrics: JobMetrics = {
    totalProcessed: 0,
    totalFailed: 0,
    averageProcessingTime: 0,
    queueLength: 0,
    activeJobs: 0,
    completedToday: 0,
    failedToday: 0,
    throughputPerMinute: 0
  };
  private processingTimes: number[] = [];
  private batchJobs: JobData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(
    private queueName: string,
    private redisConnection: CrashProofRedisConnection,
    private config: QueueConfig,
    private workerConfig: WorkerConfig,
    private jobProcessor: (job: Job) => Promise<any>,
    private logger: Logger,
    private circuitBreakerConfig: CircuitBreakerConfig = {
      failureThreshold: 10,
      resetTimeout: 60000,
      monitoringPeriod: 300000
    },
    private deduplicationConfig?: DeduplicationConfig,
    private jobRecoveryConfig: JobRecoveryConfig = {
      enableAutoRecovery: true,
      stalledJobTimeout: 30000,
      abandonedJobTimeout: 300000,
      recoveryCheckInterval: 60000
    },
    private rateLimitConfig?: RateLimitConfig,
    private batchConfig?: BatchProcessingConfig
  ) {
    this.setupMetricsCollection();
    this.setupJobRecovery();
  }

  async initialize(): Promise<void> {
    try {
      const redis = await this.redisConnection.connect();
      
      // Initialize main queue
      this.queue = new Queue(this.queueName, {
        connection: redis,
        defaultJobOptions: {
          ...this.config.defaultJobOptions,
          removeOnComplete: this.config.removeOnComplete,
          removeOnFail: this.config.removeOnFail,
          attempts: this.config.retryConfig.attempts,
          backoff: this.config.retryConfig.backoff
        }
      });

      // Initialize dead letter queue
      this.deadLetterQueue = new Queue(`${this.queueName}-dead-letter`, {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 1000
        }
      });

      // Initialize queue events for monitoring
      this.queueEvents = new QueueEvents(this.queueName, {
        connection: redis
      });

      // Initialize worker with crash-proof configuration
      this.worker = new Worker(
        this.queueName,
        this.createJobProcessor(),
        {
          connection: redis,
          concurrency: this.workerConfig.concurrency,
          removeOnComplete: this.workerConfig.removeOnComplete,
          removeOnFail: this.workerConfig.removeOnFail,
          settings: {
            stalledInterval: this.workerConfig.settings.stalledInterval,
            maxStalledCount: this.workerConfig.settings.maxStalledCount,
            retryProcessDelay: this.workerConfig.settings.retryProcessDelay
          },
          limiter: this.workerConfig.limiter
        }
      );

      await this.setupEventHandlers();
      this.logger.info(`Queue ${this.queueName} initialized successfully`);

    } catch (error) {
      this.logger.error(`Failed to initialize queue ${this.queueName}:`, error);
      throw error;
    }
  }

  private createJobProcessor() {
    return async (job: Job) => {
      const startTime = Date.now();
      
      try {
        // Check circuit breaker
        if (this.circuitBreakerState === 'OPEN') {
          if (Date.now() - this.lastCircuitBreakerReset > this.circuitBreakerConfig.resetTimeout) {
            this.circuitBreakerState = 'HALF_OPEN';
            this.logger.info('Circuit breaker moved to HALF_OPEN state');
          } else {
            throw new Error('Circuit breaker is OPEN - rejecting job');
          }
        }

        // Check rate limiting
        if (this.rateLimitConfig && !this.checkRateLimit(job.data)) {
          throw new Error('Rate limit exceeded');
        }

        // Check for duplicates
        if (this.deduplicationConfig && this.isDuplicate(job.data)) {
          this.logger.warn(`Duplicate job detected: ${job.id}`);
          return { status: 'duplicate', message: 'Job was deduplicated' };
        }

        // Handle batch processing
        if (this.batchConfig?.enabled) {
          return await this.handleBatchProcessing(job);
        }

        // Process job normally
        const result = await this.jobProcessor(job);
        
        // Record success metrics
        const processingTime = Date.now() - startTime;
        this.recordSuccessMetrics(processingTime);
        
        // Reset circuit breaker on success
        if (this.circuitBreakerState === 'HALF_OPEN') {
          this.circuitBreakerState = 'CLOSED';
          this.circuitBreakerFailures = 0;
          this.logger.info('Circuit breaker reset to CLOSED state');
        }

        return result;

      } catch (error) {
        const processingTime = Date.now() - startTime;
        this.recordFailureMetrics(processingTime, error);
        
        // Handle circuit breaker
        this.handleCircuitBreakerFailure();
        
        // Check if job should go to dead letter queue
        if (job.attemptsMade >= (job.opts.attempts || 1)) {
          await this.moveToDeadLetterQueue(job, error);
        }
        
        throw error;
      }
    };
  }

  private async handleBatchProcessing(job: Job): Promise<any> {
    if (!this.batchConfig) return;

    this.batchJobs.push({
      id: job.id || '',
      type: job.name,
      payload: job.data,
      createdAt: new Date().toISOString()
    });

    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Process batch if we've reached the batch size
    if (this.batchJobs.length >= this.batchConfig.batchSize) {
      return await this.processBatch();
    }

    // Set timer to process batch after max wait time
    this.batchTimer = setTimeout(async () => {
      if (this.batchJobs.length > 0) {
        await this.processBatch();
      }
    }, this.batchConfig.maxWaitTime);

    return { status: 'batched', batchSize: this.batchJobs.length };
  }

  private async processBatch(): Promise<any> {
    if (!this.batchConfig || this.batchJobs.length === 0) return;

    const jobsToProcess = [...this.batchJobs];
    this.batchJobs = [];

    try {
      const results = await this.batchConfig.processor(jobsToProcess);
      this.logger.info(`Processed batch of ${jobsToProcess.length} jobs`);
      return { status: 'batch_completed', processed: jobsToProcess.length, results };
    } catch (error) {
      this.logger.error('Batch processing failed:', error);
      // Re-add jobs to queue individually for retry
      for (const job of jobsToProcess) {
        await this.addJob(job.type, job.payload, { priority: JobPriority.HIGH });
      }
      throw error;
    }
  }

  private checkRateLimit(jobData: any): boolean {
    if (!this.rateLimitConfig) return true;

    const key = this.rateLimitConfig.keyGenerator 
      ? this.rateLimitConfig.keyGenerator(jobData)
      : 'default';

    const now = Date.now();
    const limiter = this.rateLimiters.get(key);

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + this.rateLimitConfig.windowMs
      });
      return true;
    }

    if (limiter.count >= this.rateLimitConfig.maxJobs) {
      return false;
    }

    limiter.count++;
    return true;
  }

  private isDuplicate(jobData: any): boolean {
    if (!this.deduplicationConfig || !this.deduplicationConfig.enabled) {
      return false;
    }

    const key = this.deduplicationConfig.keyGenerator(jobData);
    const now = Date.now();
    const lastSeen = this.deduplicationCache.get(key);

    if (!lastSeen || (now - lastSeen) > (this.deduplicationConfig.ttl * 1000)) {
      this.deduplicationCache.set(key, now);
      return false;
    }

    return true;
  }

  private handleCircuitBreakerFailure(): void {
    this.circuitBreakerFailures++;
    
    if (this.circuitBreakerFailures >= this.circuitBreakerConfig.failureThreshold) {
      this.circuitBreakerState = 'OPEN';
      this.lastCircuitBreakerReset = Date.now();
      this.logger.error(`Circuit breaker opened after ${this.circuitBreakerFailures} failures`);
    }
  }

  private recordSuccessMetrics(processingTime: number): void {
    this.jobMetrics.totalProcessed++;
    this.jobMetrics.completedToday++;
    this.processingTimes.push(processingTime);
    
    // Keep only last 1000 processing times for average calculation
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-1000);
    }
    
    this.jobMetrics.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  private recordFailureMetrics(processingTime: number, error: any): void {
    this.jobMetrics.totalFailed++;
    this.jobMetrics.failedToday++;
    this.logger.error(`Job failed after ${processingTime}ms:`, error);
  }

  private async moveToDeadLetterQueue(job: Job, error: any): Promise<void> {
    if (!this.deadLetterQueue) return;

    try {
      await this.deadLetterQueue.add('dead-letter-job', {
        originalJob: {
          id: job.id,
          name: job.name,
          data: job.data,
          opts: job.opts,
          attemptsMade: job.attemptsMade,
          finishedOn: job.finishedOn,
          processedOn: job.processedOn,
          timestamp: job.timestamp
        },
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        failedAt: new Date().toISOString(),
        queueName: this.queueName
      }, {
        removeOnComplete: 1000,
        removeOnFail: 1000
      });

      this.logger.warn(`Job ${job.id} moved to dead letter queue after ${job.attemptsMade} attempts`);
    } catch (dlqError) {
      this.logger.error('Failed to move job to dead letter queue:', dlqError);
    }
  }

  async addJob(
    jobType: string, 
    data: any, 
    options: {
      priority?: JobPriority;
      delay?: number;
      repeat?: { pattern: string; tz?: string };
      jobId?: string;
      attempts?: number;
      progress?: boolean;
    } = {}
  ): Promise<Job | null> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    // Check circuit breaker for new jobs
    if (this.circuitBreakerState === 'OPEN') {
      this.logger.warn('Circuit breaker is OPEN - rejecting new job');
      return null;
    }

    // Check for duplicates
    if (this.deduplicationConfig && this.isDuplicate(data)) {
      this.logger.warn(`Duplicate job rejected: ${jobType}`);
      return null;
    }

    const jobOptions: JobsOptions = {
      ...this.config.defaultJobOptions,
      priority: options.priority || JobPriority.NORMAL,
      delay: options.delay,
      repeat: options.repeat,
      jobId: options.jobId,
      attempts: options.attempts || this.config.retryConfig.attempts,
      backoff: this.config.retryConfig.backoff
    };

    try {
      const job = await this.queue.add(jobType, data, jobOptions);
      this.logger.info(`Job ${job.id} added to queue ${this.queueName}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${this.queueName}:`, error);
      throw error;
    }
  }

  async updateJobProgress(jobId: string, progress: JobProgress): Promise<void> {
    if (!this.queue) return;

    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.updateProgress(progress);
        this.logger.debug(`Updated progress for job ${jobId}: ${progress.percentage}%`);
      }
    } catch (error) {
      this.logger.error(`Failed to update job progress for ${jobId}:`, error);
    }
  }

  async getJobProgress(jobId: string): Promise<JobProgress | null> {
    if (!this.queue) return null;

    try {
      const job = await this.queue.getJob(jobId);
      return job?.progress as JobProgress || null;
    } catch (error) {
      this.logger.error(`Failed to get job progress for ${jobId}:`, error);
      return null;
    }
  }

  async pauseQueue(): Promise<void> {
    if (this.queue) {
      await this.queue.pause();
      this.logger.info(`Queue ${this.queueName} paused`);
    }
  }

  async resumeQueue(): Promise<void> {
    if (this.queue) {
      await this.queue.resume();
      this.logger.info(`Queue ${this.queueName} resumed`);
    }
  }

  async getMetrics(): Promise<JobMetrics> {
    if (!this.queue) return this.jobMetrics;

    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const failed = await this.queue.getFailed();
      const delayed = await this.queue.getDelayed();

      this.jobMetrics.queueLength = waiting.length;
      this.jobMetrics.activeJobs = active.length;

      return this.jobMetrics;
    } catch (error) {
      this.logger.error('Failed to get queue metrics:', error);
      return this.jobMetrics;
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const redisHealth = await this.redisConnection.healthCheck();
    const metrics = await this.getMetrics();

    return {
      queue: {
        connected: this.queue !== null,
        queueLength: metrics.queueLength,
        processing: metrics.activeJobs,
        failed: metrics.totalFailed,
        delayed: 0 // Would need to implement delayed job counting
      },
      redis: {
        connected: redisHealth.connected,
        latency: redisHealth.latency,
        memoryUsage: 0 // Would need Redis memory info
      },
      workers: {
        active: this.worker ? 1 : 0,
        total: 1,
        healthy: this.circuitBreakerState === 'CLOSED' ? 1 : 0
      },
      circuitBreaker: {
        state: this.circuitBreakerState,
        failureCount: this.circuitBreakerFailures,
        lastFailureTime: this.lastCircuitBreakerReset ? new Date(this.lastCircuitBreakerReset).toISOString() : undefined
      }
    };
  }

  async retryDeadLetterJobs(maxJobs: number = 10): Promise<number> {
    if (!this.deadLetterQueue || !this.queue) return 0;

    try {
      const deadJobs = await this.deadLetterQueue.getJobs(['completed'], 0, maxJobs - 1);
      let retriedCount = 0;

      for (const deadJob of deadJobs) {
        try {
          const originalJob = deadJob.data.originalJob;
          
          // Re-add to main queue with reduced attempts
          await this.queue.add(originalJob.name, originalJob.data, {
            ...originalJob.opts,
            attempts: Math.max(1, (originalJob.opts.attempts || 1) - 1),
            priority: JobPriority.HIGH // Give retry jobs higher priority
          });

          // Remove from dead letter queue
          await deadJob.remove();
          retriedCount++;
          
          this.logger.info(`Retried dead letter job: ${originalJob.id}`);
        } catch (retryError) {
          this.logger.error(`Failed to retry dead letter job ${deadJob.id}:`, retryError);
        }
      }

      return retriedCount;
    } catch (error) {
      this.logger.error('Failed to retry dead letter jobs:', error);
      return 0;
    }
  }

  private async setupEventHandlers(): Promise<void> {
    if (!this.worker || !this.queueEvents) return;

    // Worker events
    this.worker.on('completed', (job) => {
      this.logger.info(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed:`, err);
    });

    this.worker.on('error', (error) => {
      this.logger.error('Worker error:', error);
    });

    this.worker.on('stalled', (jobId) => {
      this.logger.warn(`Job ${jobId} stalled`);
    });

    // Queue events
    this.queueEvents.on('waiting', ({ jobId }) => {
      this.logger.debug(`Job ${jobId} is waiting`);
    });

    this.queueEvents.on('active', ({ jobId }) => {
      this.logger.debug(`Job ${jobId} started processing`);
    });

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.logger.debug(`Job ${jobId} completed with result:`, returnvalue);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(`Job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      this.logger.debug(`Job ${jobId} progress:`, data);
    });
  }

  private setupMetricsCollection(): void {
    // Reset daily metrics at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.jobMetrics.completedToday = 0;
      this.jobMetrics.failedToday = 0;
      
      // Set up daily reset interval
      setInterval(() => {
        this.jobMetrics.completedToday = 0;
        this.jobMetrics.failedToday = 0;
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    // Calculate throughput every minute
    setInterval(() => {
      const currentCompleted = this.jobMetrics.totalProcessed;
      // This is simplified - would need to track completed jobs in last minute
      this.jobMetrics.throughputPerMinute = this.jobMetrics.completedToday / 
        (Date.now() - new Date().setHours(0, 0, 0, 0)) * 60000;
    }, 60000);
  }

  private setupJobRecovery(): void {
    if (!this.jobRecoveryConfig.enableAutoRecovery) return;

    setInterval(async () => {
      await this.recoverStalledJobs();
      await this.recoverAbandonedJobs();
    }, this.jobRecoveryConfig.recoveryCheckInterval);
  }

  private async recoverStalledJobs(): Promise<void> {
    if (!this.queue) return;

    try {
      const stalledJobs = await this.queue.getJobs(['stalled']);
      
      for (const job of stalledJobs) {
        const stalledTime = Date.now() - (job.processedOn || job.timestamp);
        
        if (stalledTime > this.jobRecoveryConfig.stalledJobTimeout) {
          this.logger.warn(`Recovering stalled job: ${job.id}`);
          await job.retry();
        }
      }
    } catch (error) {
      this.logger.error('Error recovering stalled jobs:', error);
    }
  }

  private async recoverAbandonedJobs(): Promise<void> {
    if (!this.queue) return;

    try {
      const activeJobs = await this.queue.getJobs(['active']);
      
      for (const job of activeJobs) {
        const processingTime = Date.now() - (job.processedOn || job.timestamp);
        
        if (processingTime > this.jobRecoveryConfig.abandonedJobTimeout) {
          this.logger.warn(`Recovering abandoned job: ${job.id}`);
          await job.moveToFailed(new Error('Job abandoned - exceeded processing timeout'), '0');
        }
      }
    } catch (error) {
      this.logger.error('Error recovering abandoned jobs:', error);
    }
  }

  async gracefulShutdown(): Promise<void> {
    this.isShuttingDown = true;
    this.logger.info(`Starting graceful shutdown for queue ${this.queueName}`);

    try {
      // Stop accepting new jobs
      if (this.queue) {
        await this.queue.pause();
      }

      // Wait for active jobs to complete (with timeout)
      if (this.worker) {
        const activeJobs = await this.queue?.getActive() || [];
        
        if (activeJobs.length > 0) {
          this.logger.info(`Waiting for ${activeJobs.length} active jobs to complete...`);
          
          // Wait up to 30 seconds for jobs to complete
          const shutdownTimeout = setTimeout(() => {
            this.logger.warn('Shutdown timeout reached, forcing worker shutdown');
          }, 30000);

          // Monitor job completion
          while (activeJobs.length > 0 && !this.isShuttingDown) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const currentActive = await this.queue?.getActive() || [];
            if (currentActive.length === 0) break;
          }

          clearTimeout(shutdownTimeout);
        }

        await this.worker.close();
      }

      // Clean up batch processing
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        if (this.batchJobs.length > 0) {
          await this.processBatch();
        }
      }

      // Close queue and events
      if (this.queueEvents) {
        await this.queueEvents.close();
      }
      
      if (this.queue) {
        await this.queue.close();
      }

      if (this.deadLetterQueue) {
        await this.deadLetterQueue.close();
      }

      this.logger.info(`Queue ${this.queueName} shutdown completed`);
    } catch (error) {
      this.logger.error(`Error during graceful shutdown for queue ${this.queueName}:`, error);
      throw error;
    }
  }

  async cleanupCompletedJobs(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    if (!this.queue) return 0;

    try {
      const completed = await this.queue.getJobs(['completed']);
      let cleaned = 0;

      for (const job of completed) {
        const age = Date.now() - (job.finishedOn || job.timestamp);
        if (age > maxAge) {
          await job.remove();
          cleaned++;
        }
      }

      this.logger.info(`Cleaned up ${cleaned} completed jobs from ${this.queueName}`);
      return cleaned;
    } catch (error) {
      this.logger.error('Failed to cleanup completed jobs:', error);
      return 0;
    }
  }

  async drainQueue(): Promise<void> {
    if (!this.queue) return;

    try {
      await this.queue.drain();
      this.logger.info(`Queue ${this.queueName} drained successfully`);
    } catch (error) {
      this.logger.error(`Failed to drain queue ${this.queueName}:`, error);
      throw error;
    }
  }

  getQueueName(): string {
    return this.queueName;
  }

  isReady(): boolean {
    return this.queue !== null && this.worker !== null && this.redisConnection.isConnected();
  }
}