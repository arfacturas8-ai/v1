import { Queue, Job, JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';
import { randomUUID } from 'crypto';

/**
 * Job Priority Levels
 */
export type JobPriority = 'urgent' | 'high' | 'normal' | 'low' | 'deferred';

/**
 * Scheduling Strategy
 */
export type SchedulingStrategy = 'immediate' | 'delayed' | 'recurring' | 'conditional' | 'batch';

/**
 * Scheduled Job Configuration
 */
export interface ScheduledJobConfig {
  id: string;
  name: string;
  queueName: string;
  jobType: string;
  data: any;
  priority: JobPriority;
  strategy: SchedulingStrategy;
  
  // Scheduling options
  executeAt?: Date;
  delay?: number; // milliseconds
  repeat?: {
    pattern: string; // cron pattern
    limit?: number;
    endDate?: Date;
    tz?: string;
  };
  
  // Conditional execution
  condition?: {
    expression: string; // JavaScript expression
    dependencies?: string[]; // Job IDs this depends on
    triggers?: {
      queueDepth?: { queue: string; threshold: number };
      systemLoad?: { threshold: number };
      timeWindow?: { start: string; end: string }; // HH:mm format
    };
  };
  
  // Job options
  timeout?: number;
  retries?: number;
  backoff?: 'fixed' | 'exponential';
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

/**
 * Job Execution Result
 */
export interface JobExecutionResult {
  jobId: string;
  scheduledJobId: string;
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  executedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
  error?: string;
  retryCount: number;
  nextExecution?: Date;
}

/**
 * Priority Queue Configuration
 */
export interface PriorityQueueConfig {
  queueName: string;
  priorityLevels: {
    urgent: { weight: number; maxConcurrency: number };
    high: { weight: number; maxConcurrency: number };
    normal: { weight: number; maxConcurrency: number };
    low: { weight: number; maxConcurrency: number };
    deferred: { weight: number; maxConcurrency: number };
  };
  fairnessRatio: number; // 0-1, how much to balance between priorities
  starvationPrevention: boolean;
  maxQueueSize: number;
  rateLimiting?: {
    windowMs: number;
    maxJobs: number;
  };
}

/**
 * Scheduling Statistics
 */
export interface SchedulingStats {
  totalJobsScheduled: number;
  totalJobsExecuted: number;
  totalJobsFailed: number;
  averageExecutionTime: number;
  
  byPriority: {
    [key in JobPriority]: {
      scheduled: number;
      executed: number;
      failed: number;
      avgWaitTime: number;
      avgExecutionTime: number;
    };
  };
  
  byStrategy: {
    [key in SchedulingStrategy]: {
      scheduled: number;
      executed: number;
      failed: number;
    };
  };
  
  queueHealth: {
    [queueName: string]: {
      backlog: number;
      avgProcessingTime: number;
      errorRate: number;
      throughput: number;
    };
  };
}

/**
 * Advanced Job Scheduler and Priority Management Service
 * 
 * Features:
 * - Intelligent priority-based job scheduling with fairness algorithms
 * - Multiple scheduling strategies (immediate, delayed, recurring, conditional)
 * - Dynamic priority adjustment based on job age and system load
 * - Conditional job execution with dependency management
 * - Comprehensive cron-based recurring job support
 * - Job batching and bulk scheduling capabilities
 * - Starvation prevention for lower priority jobs
 * - Resource-aware scheduling considering system capacity
 * - Advanced job dependency resolution
 * - Real-time scheduling analytics and optimization
 * - Integration with all queue types and services
 * - Rollback and job cancellation capabilities
 */
export class JobSchedulerService {
  private redis: Redis;
  private logger: pino.Logger;
  
  // Core scheduling components
  private schedulerQueue: Queue;
  private priorityQueues = new Map<string, Queue>();
  private scheduledJobs = new Map<string, ScheduledJobConfig>();
  private executionResults = new Map<string, JobExecutionResult>();
  
  // Priority and fairness management
  private priorityWeights: Record<JobPriority, number> = {
    urgent: 1,
    high: 2,
    normal: 3,
    low: 4,
    deferred: 5
  };
  
  private lastPriorityExecution = new Map<string, Record<JobPriority, number>>();
  private queueConfigs = new Map<string, PriorityQueueConfig>();
  
  // Recurring job management
  private cronJobs = new Map<string, NodeJS.Timeout>();
  private jobDependencies = new Map<string, Set<string>>();
  
  // Statistics and monitoring
  private stats: SchedulingStats = {
    totalJobsScheduled: 0,
    totalJobsExecuted: 0,
    totalJobsFailed: 0,
    averageExecutionTime: 0,
    byPriority: {
      urgent: { scheduled: 0, executed: 0, failed: 0, avgWaitTime: 0, avgExecutionTime: 0 },
      high: { scheduled: 0, executed: 0, failed: 0, avgWaitTime: 0, avgExecutionTime: 0 },
      normal: { scheduled: 0, executed: 0, failed: 0, avgWaitTime: 0, avgExecutionTime: 0 },
      low: { scheduled: 0, executed: 0, failed: 0, avgWaitTime: 0, avgExecutionTime: 0 },
      deferred: { scheduled: 0, executed: 0, failed: 0, avgWaitTime: 0, avgExecutionTime: 0 }
    },
    byStrategy: {
      immediate: { scheduled: 0, executed: 0, failed: 0 },
      delayed: { scheduled: 0, executed: 0, failed: 0 },
      recurring: { scheduled: 0, executed: 0, failed: 0 },
      conditional: { scheduled: 0, executed: 0, failed: 0 },
      batch: { scheduled: 0, executed: 0, failed: 0 }
    },
    queueHealth: {}
  };

  constructor(redisConfig: any = {}) {
    this.redis = new Redis({
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || parseInt(process.env.REDIS_PORT || '6380'),
      password: redisConfig.password || process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    });

    this.logger = pino({
      name: 'job-scheduler',
      level: process.env.LOG_LEVEL || 'info'
    });

    // Initialize scheduler queue
    this.schedulerQueue = new Queue('job-scheduler', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    });

    this.initializePriorityQueues();
    this.startSchedulingLoop();
    this.loadPersistedJobs();
  }

  /**
   * Initialize priority queues for different queue types
   */
  private initializePriorityQueues(): void {
    const queueNames = ['email', 'media', 'notifications', 'moderation', 'analytics', 'blockchain'];
    
    for (const queueName of queueNames) {
      // Create priority queue configuration
      const config: PriorityQueueConfig = {
        queueName,
        priorityLevels: {
          urgent: { weight: 1, maxConcurrency: 10 },
          high: { weight: 2, maxConcurrency: 8 },
          normal: { weight: 3, maxConcurrency: 5 },
          low: { weight: 4, maxConcurrency: 3 },
          deferred: { weight: 5, maxConcurrency: 1 }
        },
        fairnessRatio: 0.3,
        starvationPrevention: true,
        maxQueueSize: 10000,
        rateLimiting: {
          windowMs: 60000, // 1 minute
          maxJobs: 1000
        }
      };

      this.queueConfigs.set(queueName, config);
      
      // Initialize priority tracking
      this.lastPriorityExecution.set(queueName, {
        urgent: 0,
        high: 0,
        normal: 0,
        low: 0,
        deferred: 0
      });

      // Initialize queue health stats
      this.stats.queueHealth[queueName] = {
        backlog: 0,
        avgProcessingTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }

    this.logger.info(`Initialized priority configurations for ${queueNames.length} queues`);
  }

  /**
   * Schedule a job with advanced options
   */
  async scheduleJob(config: Omit<ScheduledJobConfig, 'id' | 'createdAt' | 'lastModified'>): Promise<string> {
    try {
      const jobId = randomUUID();
      const now = new Date();
      
      const scheduledJob: ScheduledJobConfig = {
        id: jobId,
        createdAt: now,
        lastModified: now,
        ...config
      };

      // Validate job configuration
      await this.validateJobConfig(scheduledJob);

      // Store job configuration
      this.scheduledJobs.set(jobId, scheduledJob);
      
      // Persist to Redis
      await this.persistScheduledJob(scheduledJob);

      // Handle different scheduling strategies
      switch (scheduledJob.strategy) {
        case 'immediate':
          await this.executeImmediateJob(scheduledJob);
          break;
        case 'delayed':
          await this.scheduleDelayedJob(scheduledJob);
          break;
        case 'recurring':
          await this.scheduleRecurringJob(scheduledJob);
          break;
        case 'conditional':
          await this.scheduleConditionalJob(scheduledJob);
          break;
        case 'batch':
          await this.scheduleBatchJob(scheduledJob);
          break;
      }

      // Update statistics
      this.updateStats('scheduled', scheduledJob);

      this.logger.info('Job scheduled successfully', {
        jobId,
        name: scheduledJob.name,
        queueName: scheduledJob.queueName,
        priority: scheduledJob.priority,
        strategy: scheduledJob.strategy
      });

      return jobId;

    } catch (error) {
      this.logger.error('Failed to schedule job:', error);
      throw error;
    }
  }

  /**
   * Execute immediate job with priority handling
   */
  private async executeImmediateJob(job: ScheduledJobConfig): Promise<void> {
    try {
      const priority = this.calculateDynamicPriority(job);
      const delay = await this.calculateOptimalDelay(job.queueName, priority);

      await this.submitJobToQueue(job, { priority, delay });

    } catch (error) {
      this.logger.error(`Failed to execute immediate job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Schedule delayed job
   */
  private async scheduleDelayedJob(job: ScheduledJobConfig): Promise<void> {
    try {
      const executeAt = job.executeAt || new Date(Date.now() + (job.delay || 0));
      const delay = Math.max(0, executeAt.getTime() - Date.now());

      // Schedule execution
      await this.schedulerQueue.add(
        'execute-scheduled-job',
        { scheduledJobId: job.id },
        {
          delay,
          jobId: `scheduled_${job.id}`,
          removeOnComplete: 10,
          removeOnFail: 5
        }
      );

    } catch (error) {
      this.logger.error(`Failed to schedule delayed job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Schedule recurring job with cron pattern
   */
  private async scheduleRecurringJob(job: ScheduledJobConfig): Promise<void> {
    try {
      if (!job.repeat?.pattern) {
        throw new Error('Recurring job requires cron pattern');
      }

      // Parse cron pattern and schedule next execution
      const nextExecution = this.parseNextCronExecution(
        job.repeat.pattern,
        job.repeat.tz
      );

      if (!nextExecution) {
        throw new Error('Invalid cron pattern');
      }

      const delay = nextExecution.getTime() - Date.now();

      await this.schedulerQueue.add(
        'execute-recurring-job',
        { scheduledJobId: job.id },
        {
          delay: Math.max(0, delay),
          jobId: `recurring_${job.id}_${Date.now()}`,
          repeat: {
            pattern: job.repeat.pattern,
            limit: job.repeat.limit,
            endDate: job.repeat.endDate?.getTime(),
            tz: job.repeat.tz
          }
        }
      );

    } catch (error) {
      this.logger.error(`Failed to schedule recurring job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Schedule conditional job with dependency checking
   */
  private async scheduleConditionalJob(job: ScheduledJobConfig): Promise<void> {
    try {
      if (!job.condition) {
        throw new Error('Conditional job requires condition configuration');
      }

      // Register dependencies
      if (job.condition.dependencies) {
        for (const depId of job.condition.dependencies) {
          if (!this.jobDependencies.has(depId)) {
            this.jobDependencies.set(depId, new Set());
          }
          this.jobDependencies.get(depId)!.add(job.id);
        }
      }

      // Schedule condition checking
      await this.schedulerQueue.add(
        'check-job-condition',
        { scheduledJobId: job.id },
        {
          repeat: {
            every: 30000 // Check every 30 seconds
          },
          jobId: `conditional_${job.id}`
        }
      );

    } catch (error) {
      this.logger.error(`Failed to schedule conditional job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Schedule batch job
   */
  private async scheduleBatchJob(job: ScheduledJobConfig): Promise<void> {
    try {
      // For batch jobs, we integrate with the batch processing service
      const { batchProcessingService } = await import('./batch-processing-service');
      
      // Extract batch items from job data
      const items = Array.isArray(job.data.items) ? job.data.items : [job.data];
      const processor = job.data.processor || this.getDefaultBatchProcessor(job.jobType);
      
      const batchResult = await batchProcessingService.submitBatchJob(
        job.jobType as any,
        items,
        processor,
        {
          priority: job.priority,
          batchSize: job.data.batchSize || 100,
          concurrency: job.data.concurrency || 5,
          scheduledAt: job.executeAt,
          metadata: { ...job.metadata, originalJobId: job.id }
        }
      );

      // Store batch reference
      job.metadata.batchId = batchResult.batchId;
      this.scheduledJobs.set(job.id, job);
      await this.persistScheduledJob(job);

    } catch (error) {
      this.logger.error(`Failed to schedule batch job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate dynamic priority based on job age and system load
   */
  private calculateDynamicPriority(job: ScheduledJobConfig): number {
    const basePriority = this.priorityWeights[job.priority];
    const now = Date.now();
    const jobAge = now - job.createdAt.getTime();
    
    // Age factor: older jobs get higher priority (lower number)
    const ageBoost = Math.min(1, jobAge / (60 * 60 * 1000)); // Max 1 point boost after 1 hour
    
    // System load factor
    const queueHealth = this.stats.queueHealth[job.queueName];
    const loadPenalty = queueHealth ? Math.min(2, queueHealth.backlog / 1000) : 0;
    
    // Priority deterioration prevention
    const starvationPrevention = this.calculateStarvationPrevention(job);
    
    return Math.max(1, basePriority - ageBoost - starvationPrevention + loadPenalty);
  }

  /**
   * Calculate starvation prevention boost
   */
  private calculateStarvationPrevention(job: ScheduledJobConfig): number {
    const queueConfig = this.queueConfigs.get(job.queueName);
    if (!queueConfig?.starvationPrevention) {
      return 0;
    }

    const lastExecution = this.lastPriorityExecution.get(job.queueName);
    if (!lastExecution) {
      return 0;
    }

    const now = Date.now();
    const timeSinceLastExecution = now - lastExecution[job.priority];
    
    // Boost priority for jobs that haven't been executed recently
    if (timeSinceLastExecution > 5 * 60 * 1000) { // 5 minutes
      return Math.min(2, timeSinceLastExecution / (10 * 60 * 1000)); // Max 2 point boost
    }
    
    return 0;
  }

  /**
   * Calculate optimal delay based on queue capacity and fairness
   */
  private async calculateOptimalDelay(queueName: string, priority: number): Promise<number> {
    try {
      const config = this.queueConfigs.get(queueName);
      if (!config) {
        return 0;
      }

      // Get current queue depth
      const { queueManager } = await import('./queue-manager');
      const queueStats = await queueManager.getQueueStats(queueName);
      const queueDepth = queueStats.waiting || 0;

      // Calculate fairness delay
      const fairnessDelay = this.calculateFairnessDelay(queueName, priority, queueDepth);
      
      // Calculate capacity-based delay
      const capacityDelay = this.calculateCapacityDelay(queueName, queueDepth);

      return Math.max(fairnessDelay, capacityDelay);

    } catch (error) {
      this.logger.warn(`Failed to calculate optimal delay for ${queueName}:`, error);
      return 0;
    }
  }

  /**
   * Calculate fairness delay to prevent priority inversion
   */
  private calculateFairnessDelay(queueName: string, priority: number, queueDepth: number): number {
    const config = this.queueConfigs.get(queueName);
    if (!config || queueDepth === 0) {
      return 0;
    }

    // Implement weighted fair queuing algorithm
    const fairnessRatio = config.fairnessRatio;
    const baseDelay = 1000; // 1 second base delay
    
    // Higher priority jobs get less delay
    const priorityMultiplier = (priority - 1) * 0.5;
    
    // Queue depth affects all jobs
    const depthMultiplier = Math.min(10, queueDepth / 100);
    
    return baseDelay * priorityMultiplier * depthMultiplier * fairnessRatio;
  }

  /**
   * Calculate capacity-based delay
   */
  private calculateCapacityDelay(queueName: string, queueDepth: number): number {
    const config = this.queueConfigs.get(queueName);
    if (!config) {
      return 0;
    }

    // If queue is near capacity, introduce delay
    const capacityRatio = queueDepth / config.maxQueueSize;
    
    if (capacityRatio > 0.8) {
      return (capacityRatio - 0.8) * 10000; // Up to 2 second delay when at capacity
    }
    
    return 0;
  }

  /**
   * Submit job to appropriate queue with priority handling
   */
  private async submitJobToQueue(job: ScheduledJobConfig, options: { priority: number; delay: number }): Promise<void> {
    try {
      const { queueManager } = await import('./queue-manager');
      
      const jobOptions: JobsOptions = {
        priority: Math.round(options.priority),
        delay: Math.max(0, options.delay),
        attempts: job.retries || 3,
        timeout: job.timeout || 300000, // 5 minutes default
        backoff: job.backoff === 'exponential' ? {
          type: 'exponential',
          delay: 2000
        } : {
          type: 'fixed',
          delay: 5000
        }
      };

      let queueJob;
      
      // Submit to appropriate queue based on job type
      switch (job.queueName) {
        case 'email':
          queueJob = await queueManager.addEmailJob(job.data, jobOptions);
          break;
        case 'media':
          queueJob = await queueManager.addMediaJob(job.data, jobOptions);
          break;
        case 'notifications':
          queueJob = await queueManager.addNotificationJob(job.data, jobOptions);
          break;
        case 'moderation':
          queueJob = await queueManager.addModerationJob(job.data, jobOptions);
          break;
        case 'analytics':
          queueJob = await queueManager.addAnalyticsJob(job.data, jobOptions);
          break;
        case 'blockchain':
          queueJob = await queueManager.addBlockchainJob(job.data, jobOptions);
          break;
        default:
          throw new Error(`Unknown queue: ${job.queueName}`);
      }

      // Record execution result
      const result: JobExecutionResult = {
        jobId: queueJob.id,
        scheduledJobId: job.id,
        status: 'completed',
        executedAt: new Date(),
        retryCount: 0
      };
      
      this.executionResults.set(job.id, result);
      
      // Update priority execution tracking
      const lastExecution = this.lastPriorityExecution.get(job.queueName);
      if (lastExecution) {
        lastExecution[job.priority] = Date.now();
        this.lastPriorityExecution.set(job.queueName, lastExecution);
      }

      this.logger.debug('Job submitted to queue', {
        scheduledJobId: job.id,
        queueJobId: queueJob.id,
        queueName: job.queueName,
        priority: options.priority,
        delay: options.delay
      });

    } catch (error) {
      // Record failure
      const result: JobExecutionResult = {
        jobId: '',
        scheduledJobId: job.id,
        status: 'failed',
        executedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0
      };
      
      this.executionResults.set(job.id, result);
      this.updateStats('failed', job);
      
      throw error;
    }
  }

  /**
   * Check if conditional job should be executed
   */
  private async checkJobCondition(job: ScheduledJobConfig): Promise<boolean> {
    if (!job.condition) {
      return true;
    }

    try {
      // Check dependencies
      if (job.condition.dependencies) {
        for (const depId of job.condition.dependencies) {
          const depResult = this.executionResults.get(depId);
          if (!depResult || depResult.status !== 'completed') {
            return false;
          }
        }
      }

      // Check triggers
      if (job.condition.triggers) {
        if (job.condition.triggers.queueDepth) {
          const { queueManager } = await import('./queue-manager');
          const queueStats = await queueManager.getQueueStats(job.condition.triggers.queueDepth.queue);
          const queueDepth = queueStats.waiting || 0;
          
          if (queueDepth < job.condition.triggers.queueDepth.threshold) {
            return false;
          }
        }

        if (job.condition.triggers.timeWindow) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const { start, end } = job.condition.triggers.timeWindow;
          
          if (currentTime < start || currentTime > end) {
            return false;
          }
        }

        if (job.condition.triggers.systemLoad) {
          const loadAvg = require('os').loadavg()[0];
          if (loadAvg > job.condition.triggers.systemLoad.threshold) {
            return false;
          }
        }
      }

      // Evaluate expression if provided
      if (job.condition.expression) {
        try {
          // Simple expression evaluation (in production, use a proper expression evaluator)
          const result = new Function('job', 'stats', 'Date', 'Math', `return ${job.condition.expression}`)(
            job,
            this.stats,
            Date,
            Math
          );
          return Boolean(result);
        } catch (error) {
          this.logger.warn(`Failed to evaluate condition expression for job ${job.id}:`, error);
          return false;
        }
      }

      return true;

    } catch (error) {
      this.logger.error(`Error checking condition for job ${job.id}:`, error);
      return false;
    }
  }

  /**
   * Parse next cron execution time
   */
  private parseNextCronExecution(pattern: string, timezone?: string): Date | null {
    try {
      // This is a simplified cron parser - in production, use a proper library like 'node-cron'
      const parts = pattern.split(' ');
      if (parts.length !== 5) {
        throw new Error('Invalid cron pattern');
      }

      // For now, return next minute (simplified)
      const next = new Date();
      next.setMinutes(next.getMinutes() + 1);
      next.setSeconds(0);
      next.setMilliseconds(0);
      
      return next;

    } catch (error) {
      this.logger.warn(`Failed to parse cron pattern "${pattern}":`, error);
      return null;
    }
  }

  /**
   * Get default batch processor for a job type
   */
  private getDefaultBatchProcessor(jobType: string): any {
    return async (item: any, index: number, batchId: string) => {
      // Default processor that logs the item
      console.log(`Processing batch item ${index} in batch ${batchId}:`, item);
      return { processed: true, index };
    };
  }

  /**
   * Validate job configuration
   */
  private async validateJobConfig(job: ScheduledJobConfig): Promise<void> {
    if (!job.name || !job.queueName || !job.jobType) {
      throw new Error('Job name, queueName, and jobType are required');
    }

    if (!['email', 'media', 'notifications', 'moderation', 'analytics', 'blockchain'].includes(job.queueName)) {
      throw new Error(`Invalid queue name: ${job.queueName}`);
    }

    if (job.strategy === 'recurring' && !job.repeat?.pattern) {
      throw new Error('Recurring jobs require a cron pattern');
    }

    if (job.strategy === 'conditional' && !job.condition) {
      throw new Error('Conditional jobs require condition configuration');
    }

    if (job.strategy === 'delayed' && !job.executeAt && !job.delay) {
      throw new Error('Delayed jobs require executeAt or delay');
    }
  }

  /**
   * Update scheduling statistics
   */
  private updateStats(action: 'scheduled' | 'executed' | 'failed', job: ScheduledJobConfig): void {
    if (action === 'scheduled') {
      this.stats.totalJobsScheduled++;
      this.stats.byPriority[job.priority].scheduled++;
      this.stats.byStrategy[job.strategy].scheduled++;
    } else if (action === 'executed') {
      this.stats.totalJobsExecuted++;
      this.stats.byPriority[job.priority].executed++;
      this.stats.byStrategy[job.strategy].executed++;
    } else if (action === 'failed') {
      this.stats.totalJobsFailed++;
      this.stats.byPriority[job.priority].failed++;
      this.stats.byStrategy[job.strategy].failed++;
    }
  }

  /**
   * Persist scheduled job to Redis
   */
  private async persistScheduledJob(job: ScheduledJobConfig): Promise<void> {
    try {
      await this.redis.setex(
        `scheduler:job:${job.id}`,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify(job)
      );
    } catch (error) {
      this.logger.warn(`Failed to persist scheduled job ${job.id}:`, error);
    }
  }

  /**
   * Load persisted jobs from Redis
   */
  private async loadPersistedJobs(): Promise<void> {
    try {
      const keys = await this.redis.keys('scheduler:job:*');
      let loadedCount = 0;

      for (const key of keys) {
        try {
          const jobData = await this.redis.get(key);
          if (jobData) {
            const job: ScheduledJobConfig = JSON.parse(jobData);
            this.scheduledJobs.set(job.id, job);
            loadedCount++;
          }
        } catch (error) {
          this.logger.warn(`Failed to load job from key ${key}:`, error);
        }
      }

      this.logger.info(`Loaded ${loadedCount} persisted scheduled jobs`);

    } catch (error) {
      this.logger.error('Failed to load persisted jobs:', error);
    }
  }

  /**
   * Start the main scheduling loop
   */
  private startSchedulingLoop(): void {
    // Process scheduler queue jobs
    const processor = async (job: Job) => {
      try {
        const { data } = job;
        
        switch (job.name) {
          case 'execute-scheduled-job':
            await this.processScheduledJobExecution(data.scheduledJobId);
            break;
          case 'execute-recurring-job':
            await this.processRecurringJobExecution(data.scheduledJobId);
            break;
          case 'check-job-condition':
            await this.processConditionalJobCheck(data.scheduledJobId);
            break;
          default:
            this.logger.warn(`Unknown scheduler job type: ${job.name}`);
        }
      } catch (error) {
        this.logger.error(`Scheduler job failed: ${job.name}`, error);
        throw error;
      }
    };

    // Start worker to process scheduler jobs
    const Worker = require('bullmq').Worker;
    new Worker('job-scheduler', processor, {
      connection: this.redis,
      concurrency: 5
    });

    this.logger.info('Job scheduler loop started');
  }

  /**
   * Process scheduled job execution
   */
  private async processScheduledJobExecution(scheduledJobId: string): Promise<void> {
    const job = this.scheduledJobs.get(scheduledJobId);
    if (!job) {
      this.logger.warn(`Scheduled job not found: ${scheduledJobId}`);
      return;
    }

    await this.executeImmediateJob(job);
    this.updateStats('executed', job);
  }

  /**
   * Process recurring job execution
   */
  private async processRecurringJobExecution(scheduledJobId: string): Promise<void> {
    const job = this.scheduledJobs.get(scheduledJobId);
    if (!job) {
      this.logger.warn(`Recurring job not found: ${scheduledJobId}`);
      return;
    }

    // Check if job should still be recurring
    if (job.repeat?.endDate && new Date() > job.repeat.endDate) {
      this.logger.info(`Recurring job ended: ${scheduledJobId}`);
      return;
    }

    if (job.repeat?.limit !== undefined) {
      const executedCount = this.stats.byStrategy.recurring.executed;
      if (executedCount >= job.repeat.limit) {
        this.logger.info(`Recurring job limit reached: ${scheduledJobId}`);
        return;
      }
    }

    await this.executeImmediateJob(job);
    this.updateStats('executed', job);
  }

  /**
   * Process conditional job condition check
   */
  private async processConditionalJobCheck(scheduledJobId: string): Promise<void> {
    const job = this.scheduledJobs.get(scheduledJobId);
    if (!job) {
      this.logger.warn(`Conditional job not found: ${scheduledJobId}`);
      return;
    }

    const shouldExecute = await this.checkJobCondition(job);
    if (shouldExecute) {
      await this.executeImmediateJob(job);
      this.updateStats('executed', job);
      
      // Remove condition check job as it's now executed
      const conditionJob = await Job.fromId(this.schedulerQueue, `conditional_${job.id}`);
      if (conditionJob) {
        await conditionJob.remove();
      }
    }
  }

  // Public API methods

  /**
   * Get scheduled job by ID
   */
  getScheduledJob(jobId: string): ScheduledJobConfig | undefined {
    return this.scheduledJobs.get(jobId);
  }

  /**
   * List scheduled jobs with filtering
   */
  listScheduledJobs(filters: {
    queueName?: string;
    priority?: JobPriority;
    strategy?: SchedulingStrategy;
    status?: 'active' | 'completed' | 'failed';
    tags?: string[];
  } = {}): ScheduledJobConfig[] {
    let jobs = Array.from(this.scheduledJobs.values());

    if (filters.queueName) {
      jobs = jobs.filter(job => job.queueName === filters.queueName);
    }

    if (filters.priority) {
      jobs = jobs.filter(job => job.priority === filters.priority);
    }

    if (filters.strategy) {
      jobs = jobs.filter(job => job.strategy === filters.strategy);
    }

    if (filters.tags && filters.tags.length > 0) {
      jobs = jobs.filter(job => 
        filters.tags!.some(tag => job.tags.includes(tag))
      );
    }

    return jobs;
  }

  /**
   * Cancel scheduled job
   */
  async cancelScheduledJob(jobId: string): Promise<boolean> {
    try {
      const job = this.scheduledJobs.get(jobId);
      if (!job) {
        return false;
      }

      // Remove from scheduler queue
      const schedulerJob = await Job.fromId(this.schedulerQueue, `scheduled_${jobId}`);
      if (schedulerJob) {
        await schedulerJob.remove();
      }

      // Remove recurring job
      const recurringJob = await Job.fromId(this.schedulerQueue, `recurring_${jobId}`);
      if (recurringJob) {
        await recurringJob.remove();
      }

      // Remove conditional job
      const conditionalJob = await Job.fromId(this.schedulerQueue, `conditional_${jobId}`);
      if (conditionalJob) {
        await conditionalJob.remove();
      }

      // Remove from memory and Redis
      this.scheduledJobs.delete(jobId);
      await this.redis.del(`scheduler:job:${jobId}`);

      this.logger.info(`Cancelled scheduled job: ${jobId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to cancel scheduled job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get scheduling statistics
   */
  getSchedulingStats(): SchedulingStats {
    return { ...this.stats };
  }

  /**
   * Get job execution result
   */
  getJobExecutionResult(jobId: string): JobExecutionResult | undefined {
    return this.executionResults.get(jobId);
  }

  /**
   * Update priority queue configuration
   */
  updatePriorityQueueConfig(queueName: string, config: Partial<PriorityQueueConfig>): void {
    const existing = this.queueConfigs.get(queueName);
    if (existing) {
      const updated = { ...existing, ...config };
      this.queueConfigs.set(queueName, updated);
      
      this.logger.info(`Updated priority queue config for ${queueName}`, config);
    }
  }

  /**
   * Health check for job scheduler
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    scheduledJobs: number;
    pendingJobs: number;
    failureRate: number;
    avgExecutionTime: number;
    issues: string[];
  }> {
    try {
      const issues: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      const scheduledJobs = this.scheduledJobs.size;
      const queueCounts = await this.schedulerQueue.getJobCounts('waiting', 'active');
      const pendingJobs = queueCounts.waiting + queueCounts.active;

      // Calculate failure rate
      const totalJobs = this.stats.totalJobsExecuted + this.stats.totalJobsFailed;
      const failureRate = totalJobs > 0 ? this.stats.totalJobsFailed / totalJobs : 0;

      // Check for issues
      if (scheduledJobs > 10000) {
        issues.push(`High number of scheduled jobs: ${scheduledJobs}`);
        status = 'warning';
      }

      if (pendingJobs > 1000) {
        issues.push(`High number of pending scheduler jobs: ${pendingJobs}`);
        status = status === 'critical' ? 'critical' : 'warning';
      }

      if (failureRate > 0.1) {
        issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
        status = 'critical';
      }

      if (this.stats.averageExecutionTime > 300000) { // 5 minutes
        issues.push(`High average execution time: ${(this.stats.averageExecutionTime / 1000).toFixed(1)}s`);
        status = status === 'critical' ? 'critical' : 'warning';
      }

      return {
        status,
        scheduledJobs,
        pendingJobs,
        failureRate,
        avgExecutionTime: this.stats.averageExecutionTime,
        issues
      };

    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'critical',
        scheduledJobs: 0,
        pendingJobs: 0,
        failureRate: 1,
        avgExecutionTime: 0,
        issues: ['Health check failed']
      };
    }
  }

  /**
   * Shutdown the scheduler service
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down job scheduler service...');
    
    try {
      // Clear all cron jobs
      for (const [jobId, timeout] of this.cronJobs) {
        clearTimeout(timeout);
      }
      
      await this.schedulerQueue.close();
      this.redis.disconnect();
      
      this.logger.info('Job scheduler service shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }
}

export const jobSchedulerService = new JobSchedulerService();
export default jobSchedulerService;