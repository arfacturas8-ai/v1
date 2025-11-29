import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';

/**
 * Dead Letter Job Information
 */
export interface DeadLetterJob {
  id: string;
  originalQueueName: string;
  jobName: string;
  data: any;
  failureReason: string;
  failureHistory: Array<{
    attempt: number;
    failedAt: Date;
    error: string;
    stackTrace?: string;
    processingDuration?: number;
  }>;
  totalAttempts: number;
  maxAttempts: number;
  firstFailedAt: Date;
  lastFailedAt: Date;
  priority: number;
  delay: number;
  retryStrategies: string[];
  metadata: Record<string, any>;
  tags: string[];
}

/**
 * Retry Strategy Configuration
 */
export interface RetryStrategy {
  name: string;
  description: string;
  condition: (job: DeadLetterJob) => boolean;
  transform?: (jobData: any) => any;
  delay?: number;
  maxRetries?: number;
  priority?: number;
}

/**
 * Recovery Statistics
 */
export interface RecoveryStats {
  totalDeadLetterJobs: number;
  jobsByQueue: Record<string, number>;
  jobsByFailureType: Record<string, number>;
  recoverySuccess: {
    total: number;
    byStrategy: Record<string, number>;
  };
  recoveryFailures: {
    total: number;
    reasons: Record<string, number>;
  };
  avgTimeInDeadLetter: number;
  oldestJob?: Date;
  newestJob?: Date;
}

/**
 * Comprehensive Dead Letter Queue Handler
 * 
 * Features:
 * - Intelligent retry strategies based on failure patterns
 * - Automatic job recovery with exponential backoff
 * - Failure pattern analysis and recommendations
 * - Batch processing for mass recovery operations
 * - Dead letter queue cleanup and archival
 * - Alert system for critical failure patterns
 * - Recovery success tracking and optimization
 * - Integration with monitoring systems
 */
export class DeadLetterQueueHandler {
  private redis: Redis;
  private logger: pino.Logger;
  private deadLetterQueue: Queue;
  private archiveQueue: Queue;
  
  // Retry strategies registry
  private retryStrategies = new Map<string, RetryStrategy>();
  
  // Statistics tracking
  private stats = {
    totalProcessed: 0,
    totalRecovered: 0,
    totalArchived: 0,
    processingErrors: 0
  };

  // Configuration
  private readonly config = {
    maxJobAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    batchSize: 50,
    processingInterval: 5 * 60 * 1000, // 5 minutes
    maxRecoveryAttempts: 3,
    archiveAfterDays: 30,
    alertThreshold: {
      failureRate: 0.8, // 80% failure rate
      jobCount: 1000, // 1000+ jobs in DLQ
      criticalErrors: 50 // 50+ critical errors
    }
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
      name: 'dead-letter-queue-handler',
      level: process.env.LOG_LEVEL || 'info'
    });

    // Initialize queues
    this.deadLetterQueue = new Queue('dead-letter-queue', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      }
    });

    this.archiveQueue = new Queue('dead-letter-archive', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    });

    this.initializeRetryStrategies();
    this.startPeriodicProcessing();
  }

  /**
   * Initialize built-in retry strategies
   */
  private initializeRetryStrategies(): void {
    // Strategy for temporary network issues
    this.retryStrategies.set('network-retry', {
      name: 'network-retry',
      description: 'Retry jobs that failed due to network connectivity issues',
      condition: (job) => {
        const networkErrors = [
          'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 
          'ECONNRESET', 'ENETUNREACH', 'socket hang up'
        ];
        return networkErrors.some(error => 
          job.failureReason.toLowerCase().includes(error.toLowerCase())
        );
      },
      delay: 30000, // 30 seconds
      maxRetries: 3,
      priority: 2 // Higher priority
    });

    // Strategy for rate limit errors
    this.retryStrategies.set('rate-limit-retry', {
      name: 'rate-limit-retry',
      description: 'Retry jobs that failed due to rate limiting with exponential backoff',
      condition: (job) => {
        const rateLimitErrors = ['rate limit', '429', 'too many requests'];
        return rateLimitErrors.some(error => 
          job.failureReason.toLowerCase().includes(error.toLowerCase())
        );
      },
      delay: 300000, // 5 minutes
      maxRetries: 2,
      priority: 3 // Normal priority
    });

    // Strategy for temporary service unavailability
    this.retryStrategies.set('service-unavailable-retry', {
      name: 'service-unavailable-retry',
      description: 'Retry jobs when external services are temporarily unavailable',
      condition: (job) => {
        const serviceErrors = ['503', '502', '504', 'service unavailable', 'bad gateway'];
        return serviceErrors.some(error => 
          job.failureReason.toLowerCase().includes(error.toLowerCase())
        );
      },
      delay: 60000, // 1 minute
      maxRetries: 5,
      priority: 2
    });

    // Strategy for authentication errors (need manual intervention)
    this.retryStrategies.set('auth-manual', {
      name: 'auth-manual',
      description: 'Flag authentication errors for manual review',
      condition: (job) => {
        const authErrors = ['401', '403', 'unauthorized', 'forbidden', 'invalid token'];
        return authErrors.some(error => 
          job.failureReason.toLowerCase().includes(error.toLowerCase())
        );
      },
      // No automatic retry - requires manual intervention
      delay: 0,
      maxRetries: 0,
      priority: 1 // Low priority until manual fix
    });

    // Strategy for data validation errors
    this.retryStrategies.set('validation-retry', {
      name: 'validation-retry',
      description: 'Retry validation errors with data cleanup',
      condition: (job) => {
        const validationErrors = ['validation', 'invalid data', 'missing required'];
        return validationErrors.some(error => 
          job.failureReason.toLowerCase().includes(error.toLowerCase())
        );
      },
      transform: (jobData) => {
        // Clean up common data issues
        if (jobData.email) {
          jobData.email = jobData.email.trim().toLowerCase();
        }
        if (jobData.data && typeof jobData.data === 'object') {
          // Remove null/undefined values
          Object.keys(jobData.data).forEach(key => {
            if (jobData.data[key] == null) {
              delete jobData.data[key];
            }
          });
        }
        return jobData;
      },
      delay: 5000, // 5 seconds
      maxRetries: 1,
      priority: 3
    });

    this.logger.info(`Initialized ${this.retryStrategies.size} retry strategies`);
  }

  /**
   * Add a job to the dead letter queue
   */
  async addToDeadLetterQueue(
    originalQueueName: string,
    jobName: string,
    jobData: any,
    failureInfo: {
      reason: string;
      attempts: number;
      maxAttempts: number;
      failureHistory: Array<{
        attempt: number;
        error: string;
        failedAt: Date;
        stackTrace?: string;
        processingDuration?: number;
      }>;
      originalJob?: Job;
    }
  ): Promise<string> {
    try {
      const deadLetterJob: DeadLetterJob = {
        id: `dlq_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        originalQueueName,
        jobName,
        data: jobData,
        failureReason: failureInfo.reason,
        failureHistory: failureInfo.failureHistory,
        totalAttempts: failureInfo.attempts,
        maxAttempts: failureInfo.maxAttempts,
        firstFailedAt: failureInfo.failureHistory[0]?.failedAt || new Date(),
        lastFailedAt: new Date(),
        priority: failureInfo.originalJob?.opts.priority || 3,
        delay: failureInfo.originalJob?.opts.delay || 0,
        retryStrategies: this.identifyRetryStrategies({
          failureReason: failureInfo.reason,
          failureHistory: failureInfo.failureHistory
        } as any),
        metadata: {
          addedAt: new Date(),
          source: originalQueueName,
          jobType: jobName,
          attempts: failureInfo.attempts,
          maxAttempts: failureInfo.maxAttempts
        },
        tags: this.generateTags(failureInfo.reason, originalQueueName, jobName)
      };

      await this.deadLetterQueue.add('dead-letter-job', deadLetterJob, {
        removeOnComplete: false,
        removeOnFail: false,
      });

      // Store additional metadata in Redis for quick lookups
      await this.redis.setex(
        `dlq:meta:${deadLetterJob.id}`,
        this.config.maxJobAge / 1000,
        JSON.stringify({
          queueName: originalQueueName,
          jobName,
          failedAt: deadLetterJob.lastFailedAt,
          retryStrategies: deadLetterJob.retryStrategies,
          priority: deadLetterJob.priority
        })
      );

      // Update statistics
      await this.updateStats('job_added', originalQueueName);

      this.logger.info(`Job added to dead letter queue`, {
        deadLetterJobId: deadLetterJob.id,
        originalQueue: originalQueueName,
        jobName,
        totalAttempts: failureInfo.attempts,
        retryStrategies: deadLetterJob.retryStrategies
      });

      // Check if we need to send alerts
      await this.checkAndSendAlerts();

      return deadLetterJob.id;

    } catch (error) {
      this.logger.error('Failed to add job to dead letter queue:', error);
      throw error;
    }
  }

  /**
   * Identify applicable retry strategies for a failed job
   */
  private identifyRetryStrategies(job: Partial<DeadLetterJob>): string[] {
    const applicableStrategies: string[] = [];
    
    for (const [strategyName, strategy] of this.retryStrategies) {
      try {
        if (strategy.condition(job as DeadLetterJob)) {
          applicableStrategies.push(strategyName);
        }
      } catch (error) {
        this.logger.warn(`Error evaluating retry strategy ${strategyName}:`, error);
      }
    }
    
    return applicableStrategies;
  }

  /**
   * Generate tags for categorizing dead letter jobs
   */
  private generateTags(failureReason: string, queueName: string, jobName: string): string[] {
    const tags = [queueName, jobName];
    
    const lowerReason = failureReason.toLowerCase();
    
    // Error type tags
    if (lowerReason.includes('network') || lowerReason.includes('connection')) {
      tags.push('network-error');
    }
    if (lowerReason.includes('timeout')) {
      tags.push('timeout-error');
    }
    if (lowerReason.includes('auth') || lowerReason.includes('401') || lowerReason.includes('403')) {
      tags.push('auth-error');
    }
    if (lowerReason.includes('rate') || lowerReason.includes('429')) {
      tags.push('rate-limit-error');
    }
    if (lowerReason.includes('validation') || lowerReason.includes('invalid')) {
      tags.push('validation-error');
    }
    
    return tags;
  }

  /**
   * Process dead letter jobs with intelligent retry strategies
   */
  async processDeadLetterJobs(options: {
    limit?: number;
    strategy?: string;
    olderThan?: Date;
    queueName?: string;
    priority?: number;
  } = {}): Promise<{
    processed: number;
    recovered: number;
    archived: number;
    failed: number;
    results: Array<{
      jobId: string;
      action: 'recovered' | 'archived' | 'failed';
      strategy?: string;
      error?: string;
    }>;
  }> {
    const limit = options.limit || this.config.batchSize;
    const results: Array<{
      jobId: string;
      action: 'recovered' | 'archived' | 'failed';
      strategy?: string;
      error?: string;
    }> = [];

    try {
      this.logger.info('Starting dead letter queue processing', {
        limit,
        strategy: options.strategy,
        olderThan: options.olderThan,
        queueName: options.queueName
      });

      // Get jobs from dead letter queue
      const jobs = await this.deadLetterQueue.getJobs(['completed', 'failed'], 0, limit - 1);
      let processed = 0;
      let recovered = 0;
      let archived = 0;
      let failed = 0;

      for (const job of jobs) {
        try {
          const deadLetterJob: DeadLetterJob = job.data;
          
          // Apply filters
          if (options.queueName && deadLetterJob.originalQueueName !== options.queueName) {
            continue;
          }
          
          if (options.olderThan && deadLetterJob.lastFailedAt > options.olderThan) {
            continue;
          }

          if (options.priority && deadLetterJob.priority !== options.priority) {
            continue;
          }

          processed++;

          // Check if job should be archived due to age
          const jobAge = Date.now() - deadLetterJob.firstFailedAt.getTime();
          if (jobAge > this.config.archiveAfterDays * 24 * 60 * 60 * 1000) {
            await this.archiveJob(deadLetterJob);
            await job.remove();
            archived++;
            results.push({
              jobId: deadLetterJob.id,
              action: 'archived'
            });
            continue;
          }

          // Try to recover the job using retry strategies
          const recoveryResult = await this.attemptJobRecovery(deadLetterJob, options.strategy);
          
          if (recoveryResult.success) {
            await job.remove();
            recovered++;
            results.push({
              jobId: deadLetterJob.id,
              action: 'recovered',
              strategy: recoveryResult.strategy
            });
          } else {
            failed++;
            results.push({
              jobId: deadLetterJob.id,
              action: 'failed',
              error: recoveryResult.error
            });
          }

        } catch (error) {
          this.logger.error('Error processing dead letter job:', error);
          failed++;
          results.push({
            jobId: job.id || 'unknown',
            action: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      this.logger.info('Dead letter queue processing completed', {
        processed,
        recovered,
        archived,
        failed,
        successRate: processed > 0 ? (recovered / processed) * 100 : 0
      });

      // Update statistics
      this.stats.totalProcessed += processed;
      this.stats.totalRecovered += recovered;
      this.stats.totalArchived += archived;
      this.stats.processingErrors += failed;

      return {
        processed,
        recovered,
        archived,
        failed,
        results
      };

    } catch (error) {
      this.logger.error('Failed to process dead letter jobs:', error);
      throw error;
    }
  }

  /**
   * Attempt to recover a dead letter job using retry strategies
   */
  private async attemptJobRecovery(
    deadLetterJob: DeadLetterJob,
    preferredStrategy?: string
  ): Promise<{ success: boolean; strategy?: string; error?: string }> {
    try {
      // Check if we've exceeded max recovery attempts
      const recoveryAttempts = deadLetterJob.metadata.recoveryAttempts || 0;
      if (recoveryAttempts >= this.config.maxRecoveryAttempts) {
        return {
          success: false,
          error: `Exceeded maximum recovery attempts (${this.config.maxRecoveryAttempts})`
        };
      }

      // Select strategy to use
      let strategyToUse = preferredStrategy;
      if (!strategyToUse && deadLetterJob.retryStrategies.length > 0) {
        // Use the first applicable strategy
        strategyToUse = deadLetterJob.retryStrategies[0];
      }

      if (!strategyToUse) {
        return {
          success: false,
          error: 'No applicable retry strategy found'
        };
      }

      const strategy = this.retryStrategies.get(strategyToUse);
      if (!strategy) {
        return {
          success: false,
          error: `Strategy '${strategyToUse}' not found`
        };
      }

      // Skip strategies that don't allow retries
      if (strategy.maxRetries === 0) {
        return {
          success: false,
          error: `Strategy '${strategyToUse}' requires manual intervention`
        };
      }

      // Transform job data if strategy provides transformation
      let jobData = deadLetterJob.data;
      if (strategy.transform) {
        jobData = strategy.transform(jobData);
      }

      // Import queue manager to re-queue the job
      const { queueManager } = await import('./queue-manager');
      
      // Re-queue the job with strategy-specific options
      const jobOptions = {
        priority: strategy.priority || deadLetterJob.priority,
        delay: strategy.delay || 0,
        attempts: strategy.maxRetries || 1,
        backoff: {
          type: 'exponential' as const,
          delay: 2000
        }
      };

      // Re-add to original queue based on queue type
      let newJob;
      switch (deadLetterJob.originalQueueName) {
        case 'email':
          newJob = await queueManager.addEmailJob(jobData, jobOptions);
          break;
        case 'media':
          newJob = await queueManager.addMediaJob(jobData, jobOptions);
          break;
        case 'notifications':
          newJob = await queueManager.addNotificationJob(jobData, jobOptions);
          break;
        case 'moderation':
          newJob = await queueManager.addModerationJob(jobData, jobOptions);
          break;
        case 'analytics':
          newJob = await queueManager.addAnalyticsJob(jobData, jobOptions);
          break;
        case 'blockchain':
          newJob = await queueManager.addBlockchainJob(jobData, jobOptions);
          break;
        default:
          return {
            success: false,
            error: `Unknown queue type: ${deadLetterJob.originalQueueName}`
          };
      }

      // Update recovery attempts
      deadLetterJob.metadata.recoveryAttempts = recoveryAttempts + 1;
      deadLetterJob.metadata.lastRecoveryAttempt = new Date();
      deadLetterJob.metadata.recoveredJobId = newJob.id;

      this.logger.info('Successfully recovered dead letter job', {
        deadLetterJobId: deadLetterJob.id,
        newJobId: newJob.id,
        strategy: strategyToUse,
        originalQueue: deadLetterJob.originalQueueName,
        recoveryAttempt: recoveryAttempts + 1
      });

      return {
        success: true,
        strategy: strategyToUse
      };

    } catch (error) {
      this.logger.error('Failed to recover dead letter job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Archive old or unrecoverable jobs
   */
  private async archiveJob(deadLetterJob: DeadLetterJob): Promise<void> {
    try {
      const archiveData = {
        ...deadLetterJob,
        archivedAt: new Date(),
        archiveReason: 'Exceeded maximum age or recovery attempts'
      };

      await this.archiveQueue.add('archived-job', archiveData, {
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      this.logger.info('Job archived', {
        deadLetterJobId: deadLetterJob.id,
        originalQueue: deadLetterJob.originalQueueName,
        jobAge: Date.now() - deadLetterJob.firstFailedAt.getTime()
      });

    } catch (error) {
      this.logger.error('Failed to archive job:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive recovery statistics
   */
  async getRecoveryStats(): Promise<RecoveryStats> {
    try {
      const jobs = await this.deadLetterQueue.getJobs(['completed', 'failed']);
      const deadLetterJobs: DeadLetterJob[] = jobs.map(job => job.data);

      const totalDeadLetterJobs = deadLetterJobs.length;
      const jobsByQueue: Record<string, number> = {};
      const jobsByFailureType: Record<string, number> = {};
      
      let totalTimeInDeadLetter = 0;
      let oldestJob: Date | undefined;
      let newestJob: Date | undefined;

      for (const job of deadLetterJobs) {
        // Count by queue
        jobsByQueue[job.originalQueueName] = (jobsByQueue[job.originalQueueName] || 0) + 1;
        
        // Count by failure type
        const failureType = this.categorizeFailure(job.failureReason);
        jobsByFailureType[failureType] = (jobsByFailureType[failureType] || 0) + 1;
        
        // Calculate time in dead letter queue
        const timeInQueue = Date.now() - job.firstFailedAt.getTime();
        totalTimeInDeadLetter += timeInQueue;
        
        // Track oldest and newest
        if (!oldestJob || job.firstFailedAt < oldestJob) {
          oldestJob = job.firstFailedAt;
        }
        if (!newestJob || job.firstFailedAt > newestJob) {
          newestJob = job.firstFailedAt;
        }
      }

      return {
        totalDeadLetterJobs,
        jobsByQueue,
        jobsByFailureType,
        recoverySuccess: {
          total: this.stats.totalRecovered,
          byStrategy: {} // TODO: Implement strategy-specific tracking
        },
        recoveryFailures: {
          total: this.stats.processingErrors,
          reasons: {} // TODO: Implement failure reason tracking
        },
        avgTimeInDeadLetter: totalDeadLetterJobs > 0 ? totalTimeInDeadLetter / totalDeadLetterJobs : 0,
        oldestJob,
        newestJob
      };

    } catch (error) {
      this.logger.error('Failed to get recovery stats:', error);
      throw error;
    }
  }

  /**
   * Categorize failure reasons for analytics
   */
  private categorizeFailure(failureReason: string): string {
    const lowerReason = failureReason.toLowerCase();
    
    if (lowerReason.includes('network') || lowerReason.includes('connection')) {
      return 'network';
    }
    if (lowerReason.includes('timeout')) {
      return 'timeout';
    }
    if (lowerReason.includes('auth') || lowerReason.includes('401') || lowerReason.includes('403')) {
      return 'authentication';
    }
    if (lowerReason.includes('rate') || lowerReason.includes('429')) {
      return 'rate-limit';
    }
    if (lowerReason.includes('validation') || lowerReason.includes('invalid')) {
      return 'validation';
    }
    if (lowerReason.includes('service') || lowerReason.includes('502') || lowerReason.includes('503')) {
      return 'service-unavailable';
    }
    
    return 'other';
  }

  /**
   * Start periodic processing of dead letter jobs
   */
  private startPeriodicProcessing(): void {
    const processJobs = async () => {
      try {
        await this.processDeadLetterJobs({
          limit: this.config.batchSize
        });
      } catch (error) {
        this.logger.error('Periodic dead letter processing failed:', error);
      }
    };

    // Process jobs every 5 minutes
    setInterval(processJobs, this.config.processingInterval);
    
    this.logger.info('Started periodic dead letter queue processing', {
      interval: this.config.processingInterval,
      batchSize: this.config.batchSize
    });
  }

  /**
   * Update statistics
   */
  private async updateStats(action: string, queueName: string): Promise<void> {
    try {
      const key = `dlq:stats:${action}:${queueName}`;
      await this.redis.incr(key);
      await this.redis.expire(key, 24 * 60 * 60); // Expire after 24 hours
    } catch (error) {
      this.logger.warn('Failed to update stats:', error);
    }
  }

  /**
   * Check if alerts should be sent based on dead letter queue status
   */
  private async checkAndSendAlerts(): Promise<void> {
    try {
      const stats = await this.getRecoveryStats();
      const alerts: string[] = [];

      // Check job count threshold
      if (stats.totalDeadLetterJobs >= this.config.alertThreshold.jobCount) {
        alerts.push(`High dead letter queue count: ${stats.totalDeadLetterJobs} jobs`);
      }

      // Check failure rate
      const totalJobs = this.stats.totalProcessed;
      const failureRate = totalJobs > 0 ? this.stats.processingErrors / totalJobs : 0;
      if (failureRate >= this.config.alertThreshold.failureRate) {
        alerts.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
      }

      // Send alerts if any
      if (alerts.length > 0) {
        this.logger.error('Dead letter queue alerts triggered', {
          alerts,
          stats: {
            totalJobs: stats.totalDeadLetterJobs,
            failureRate: (failureRate * 100).toFixed(1) + '%',
            oldestJob: stats.oldestJob
          }
        });

        // TODO: Implement actual alerting mechanism (email, Slack, webhook, etc.)
      }

    } catch (error) {
      this.logger.error('Failed to check alerts:', error);
    }
  }

  /**
   * Health check for dead letter queue handler
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      totalDeadLetterJobs: number;
      processingRate: number;
      recoveryRate: number;
      avgProcessingTime: number;
    };
    issues: string[];
  }> {
    try {
      const stats = await this.getRecoveryStats();
      const issues: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      const processingRate = this.stats.totalProcessed > 0 ? 
        (this.stats.totalRecovered / this.stats.totalProcessed) * 100 : 0;
      
      const recoveryRate = stats.totalDeadLetterJobs > 0 ?
        (stats.recoverySuccess.total / stats.totalDeadLetterJobs) * 100 : 0;

      // Check for issues
      if (stats.totalDeadLetterJobs > this.config.alertThreshold.jobCount) {
        issues.push(`High job count: ${stats.totalDeadLetterJobs}`);
        status = 'warning';
      }

      if (processingRate < 50 && this.stats.totalProcessed > 10) {
        issues.push(`Low processing rate: ${processingRate.toFixed(1)}%`);
        status = status === 'critical' ? 'critical' : 'warning';
      }

      if (stats.totalDeadLetterJobs > this.config.alertThreshold.jobCount * 2) {
        status = 'critical';
      }

      return {
        status,
        metrics: {
          totalDeadLetterJobs: stats.totalDeadLetterJobs,
          processingRate,
          recoveryRate,
          avgProcessingTime: stats.avgTimeInDeadLetter
        },
        issues
      };

    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'critical',
        metrics: {
          totalDeadLetterJobs: 0,
          processingRate: 0,
          recoveryRate: 0,
          avgProcessingTime: 0
        },
        issues: ['Health check failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down dead letter queue handler...');
    
    try {
      await this.deadLetterQueue.close();
      await this.archiveQueue.close();
      this.redis.disconnect();
      
      this.logger.info('Dead letter queue handler shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }
}

export const deadLetterQueueHandler = new DeadLetterQueueHandler();
export default deadLetterQueueHandler;