import { Queue, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';

/**
 * Queue Metrics Interface
 */
export interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  processing: boolean;
  throughput: {
    completed: number;
    failed: number;
    period: string;
  };
  averageProcessingTime: number;
  failureRate: number;
  workers: {
    active: number;
    total: number;
  };
}

/**
 * Job Failure Info
 */
export interface JobFailureInfo {
  jobId: string;
  queueName: string;
  jobName: string;
  failedAt: Date;
  failureReason: string;
  attempts: number;
  maxAttempts: number;
  data: any;
  stackTrace?: string;
}

/**
 * Queue Health Status
 */
export interface QueueHealthStatus {
  queue: string;
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  recommendations: string[];
  metrics: QueueMetrics;
}

/**
 * Dead Letter Queue Management
 */
export interface DeadLetterJobInfo {
  jobId: string;
  queueName: string;
  jobName: string;
  failedAt: Date;
  finalFailureReason: string;
  totalAttempts: number;
  data: any;
  processingHistory: any[];
}

/**
 * Queue Monitoring and Management Service
 * 
 * Features:
 * - Real-time queue metrics collection
 * - Dead letter queue management
 * - Queue health monitoring with alerts
 * - Automatic scaling recommendations
 * - Job failure analysis and reporting
 * - Performance optimization insights
 * - Circuit breaker implementation
 * - Queue maintenance operations
 */
export class QueueMonitoringService {
  private redis: Redis;
  private logger: pino.Logger;
  private queues = new Map<string, Queue>();
  private queueEvents = new Map<string, QueueEvents>();
  private metrics = new Map<string, QueueMetrics>();
  private circuitBreakers = new Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>();
  private deadLetterQueue: Queue;
  
  // Monitoring intervals
  private metricsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  
  // Thresholds for health monitoring
  private readonly HEALTH_THRESHOLDS = {
    MAX_WAITING_JOBS: 1000,
    MAX_FAILURE_RATE: 0.1, // 10%
    MIN_THROUGHPUT: 1, // jobs per minute
    MAX_PROCESSING_TIME: 300000, // 5 minutes
    CIRCUIT_BREAKER_FAILURES: 5,
    CIRCUIT_BREAKER_TIMEOUT: 300000 // 5 minutes
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
      name: 'queue-monitoring',
      level: process.env.LOG_LEVEL || 'info'
    });

    // Initialize dead letter queue
    this.deadLetterQueue = new Queue('dead-letter', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: false, // Keep all dead letter jobs
        removeOnFail: false,
      }
    });

    this.startMonitoring();
  }

  /**
   * Register a queue for monitoring
   */
  registerQueue(queueName: string, queue: Queue): void {
    this.queues.set(queueName, queue);
    
    // Setup queue events monitoring
    const events = new QueueEvents(queueName, { connection: this.redis });
    this.queueEvents.set(queueName, events);

    // Initialize metrics
    this.metrics.set(queueName, {
      name: queueName,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: false,
      processing: false,
      throughput: { completed: 0, failed: 0, period: '1min' },
      averageProcessingTime: 0,
      failureRate: 0,
      workers: { active: 0, total: 0 }
    });

    this.setupQueueEventHandlers(queueName, events);
    this.logger.info(`Registered queue for monitoring: ${queueName}`);
  }

  /**
   * Setup event handlers for a queue
   */
  private setupQueueEventHandlers(queueName: string, events: QueueEvents): void {
    // Job completed
    events.on('completed', async (jobId, returnvalue) => {
      this.logger.debug(`Job completed in ${queueName}: ${jobId}`);
      await this.updateCompletionMetrics(queueName, jobId);
      this.recordCircuitBreakerSuccess(queueName);
    });

    // Job failed
    events.on('failed', async (jobId, err) => {
      this.logger.error(`Job failed in ${queueName}: ${jobId}`, err);
      await this.handleJobFailure(queueName, jobId, err);
      this.recordCircuitBreakerFailure(queueName);
    });

    // Job stalled
    events.on('stalled', async (jobId) => {
      this.logger.warn(`Job stalled in ${queueName}: ${jobId}`);
      await this.handleStalledJob(queueName, jobId);
    });

    // Job progress
    events.on('progress', (jobId, progress) => {
      this.logger.debug(`Job progress in ${queueName}: ${jobId} - ${progress}%`);
    });

    // Queue drained
    events.on('drained', () => {
      this.logger.info(`Queue drained: ${queueName}`);
    });
  }

  /**
   * Start monitoring services
   */
  private startMonitoring(): void {
    // Collect metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectMetrics().catch(err => {
        this.logger.error('Failed to collect metrics:', err);
      });
    }, 30000);

    // Health checks every 2 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks().catch(err => {
        this.logger.error('Failed to perform health checks:', err);
      });
    }, 120000);

    this.logger.info('Queue monitoring services started');
  }

  /**
   * Collect comprehensive metrics for all queues
   */
  private async collectMetrics(): Promise<void> {
    for (const [queueName, queue] of this.queues) {
      try {
        const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
        const isPaused = await queue.isPaused();
        
        // Calculate throughput (jobs completed in last minute)
        const completedJobs = await queue.getJobs(['completed'], 0, -1, true);
        const oneMinuteAgo = Date.now() - 60000;
        const recentCompletedJobs = completedJobs.filter(job => 
          job.finishedOn && job.finishedOn > oneMinuteAgo
        );

        // Calculate average processing time
        const processingTimes = recentCompletedJobs
          .filter(job => job.processedOn && job.finishedOn)
          .map(job => job.finishedOn! - job.processedOn!);
        
        const averageProcessingTime = processingTimes.length > 0
          ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
          : 0;

        // Calculate failure rate
        const totalProcessed = counts.completed + counts.failed;
        const failureRate = totalProcessed > 0 ? counts.failed / totalProcessed : 0;

        // Update metrics
        const metrics: QueueMetrics = {
          name: queueName,
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
          paused: isPaused,
          processing: counts.active > 0,
          throughput: {
            completed: recentCompletedJobs.length,
            failed: 0, // TODO: Calculate failed jobs in last minute
            period: '1min'
          },
          averageProcessingTime,
          failureRate,
          workers: {
            active: counts.active,
            total: 0 // TODO: Get worker count from worker registry
          }
        };

        this.metrics.set(queueName, metrics);
        
        // Log metrics periodically (every 5 minutes)
        if (Date.now() % 300000 < 30000) {
          this.logger.info(`Queue metrics for ${queueName}:`, metrics);
        }
      } catch (error) {
        this.logger.error(`Failed to collect metrics for queue ${queueName}:`, error);
      }
    }
  }

  /**
   * Perform health checks on all queues
   */
  private async performHealthChecks(): Promise<void> {
    for (const [queueName, metrics] of this.metrics) {
      const healthStatus = await this.assessQueueHealth(queueName, metrics);
      
      if (healthStatus.status !== 'healthy') {
        this.logger.warn(`Queue health issue detected for ${queueName}:`, healthStatus);
        
        // Send alerts for critical issues
        if (healthStatus.status === 'error') {
          await this.sendHealthAlert(healthStatus);
        }
        
        // Apply automatic remediation if possible
        await this.applyAutoRemediation(healthStatus);
      }
    }
  }

  /**
   * Assess queue health and provide recommendations
   */
  private async assessQueueHealth(queueName: string, metrics: QueueMetrics): Promise<QueueHealthStatus> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    // Check for high number of waiting jobs
    if (metrics.waiting > this.HEALTH_THRESHOLDS.MAX_WAITING_JOBS) {
      issues.push(`High number of waiting jobs: ${metrics.waiting}`);
      recommendations.push('Consider increasing worker concurrency or adding more worker instances');
      status = 'warning';
    }

    // Check failure rate
    if (metrics.failureRate > this.HEALTH_THRESHOLDS.MAX_FAILURE_RATE) {
      issues.push(`High failure rate: ${(metrics.failureRate * 100).toFixed(2)}%`);
      recommendations.push('Investigate job failures and improve error handling');
      status = 'error';
    }

    // Check processing time
    if (metrics.averageProcessingTime > this.HEALTH_THRESHOLDS.MAX_PROCESSING_TIME) {
      issues.push(`Slow processing time: ${(metrics.averageProcessingTime / 1000).toFixed(2)}s`);
      recommendations.push('Optimize job processing logic or break down large jobs');
      status = 'warning';
    }

    // Check throughput
    if (metrics.throughput.completed < this.HEALTH_THRESHOLDS.MIN_THROUGHPUT) {
      issues.push(`Low throughput: ${metrics.throughput.completed} jobs/min`);
      recommendations.push('Check worker health and queue configuration');
      status = 'warning';
    }

    // Check if queue is paused
    if (metrics.paused) {
      issues.push('Queue is paused');
      recommendations.push('Resume queue processing');
      status = 'error';
    }

    // Check circuit breaker status
    const circuitBreaker = this.circuitBreakers.get(queueName);
    if (circuitBreaker?.isOpen) {
      issues.push('Circuit breaker is open');
      recommendations.push('Wait for circuit breaker to reset or manually reset it');
      status = 'error';
    }

    return {
      queue: queueName,
      status,
      issues,
      recommendations,
      metrics
    };
  }

  /**
   * Handle job failure and move to dead letter queue if necessary
   */
  private async handleJobFailure(queueName: string, jobId: string, error: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) return;

      const job = await Job.fromId(queue, jobId);
      if (!job) return;

      const failureInfo: JobFailureInfo = {
        jobId,
        queueName,
        jobName: job.name,
        failedAt: new Date(),
        failureReason: error,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts || 1,
        data: job.data,
        stackTrace: job.stacktrace ? job.stacktrace.join('\n') : undefined
      };

      // Check if this job has exhausted all retry attempts
      if (job.attemptsMade >= (job.opts.attempts || 1)) {
        await this.moveToDeadLetterQueue(failureInfo, job);
        this.logger.error(`Job moved to dead letter queue: ${jobId} from ${queueName}`);
      }

      // Store failure info for analysis
      await this.storeJobFailureInfo(failureInfo);
      
    } catch (error) {
      this.logger.error(`Failed to handle job failure for ${jobId}:`, error);
    }
  }

  /**
   * Handle stalled job
   */
  private async handleStalledJob(queueName: string, jobId: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) return;

      const job = await Job.fromId(queue, jobId);
      if (!job) return;

      this.logger.warn(`Stalled job detected: ${jobId} in ${queueName}`, {
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn,
        data: job.data
      });

      // Optionally restart stalled jobs
      // await job.retry();
      
    } catch (error) {
      this.logger.error(`Failed to handle stalled job ${jobId}:`, error);
    }
  }

  /**
   * Move failed job to dead letter queue
   */
  private async moveToDeadLetterQueue(failureInfo: JobFailureInfo, originalJob: Job): Promise<void> {
    try {
      const deadLetterJobInfo: DeadLetterJobInfo = {
        jobId: failureInfo.jobId,
        queueName: failureInfo.queueName,
        jobName: failureInfo.jobName,
        failedAt: failureInfo.failedAt,
        finalFailureReason: failureInfo.failureReason,
        totalAttempts: failureInfo.attempts,
        data: failureInfo.data,
        processingHistory: originalJob.opts as any // Store processing history
      };

      await this.deadLetterQueue.add('dead-letter-job', deadLetterJobInfo, {
        removeOnComplete: false,
        removeOnFail: false,
      });

      this.logger.info(`Job added to dead letter queue: ${failureInfo.jobId}`);
    } catch (error) {
      this.logger.error(`Failed to move job to dead letter queue:`, error);
    }
  }

  /**
   * Store job failure information for analysis
   */
  private async storeJobFailureInfo(failureInfo: JobFailureInfo): Promise<void> {
    try {
      const key = `queue:failures:${failureInfo.queueName}:${Date.now()}`;
      await this.redis.setex(key, 86400 * 7, JSON.stringify(failureInfo)); // Keep for 7 days
      
      // Also add to a sorted set for easy querying
      await this.redis.zadd(
        `queue:failures:index:${failureInfo.queueName}`,
        Date.now(),
        failureInfo.jobId
      );
    } catch (error) {
      this.logger.error('Failed to store job failure info:', error);
    }
  }

  /**
   * Update completion metrics
   */
  private async updateCompletionMetrics(queueName: string, jobId: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) return;

      const job = await Job.fromId(queue, jobId);
      if (!job || !job.processedOn || !job.finishedOn) return;

      const processingTime = job.finishedOn - job.processedOn;
      
      // Store processing time for metrics calculation
      const key = `queue:processing-times:${queueName}`;
      await this.redis.lpush(key, processingTime.toString());
      await this.redis.ltrim(key, 0, 999); // Keep last 1000 processing times
      await this.redis.expire(key, 3600); // Expire after 1 hour
      
    } catch (error) {
      this.logger.error(`Failed to update completion metrics for ${jobId}:`, error);
    }
  }

  /**
   * Circuit breaker logic
   */
  private recordCircuitBreakerFailure(queueName: string): void {
    let breaker = this.circuitBreakers.get(queueName);
    
    if (!breaker) {
      breaker = { failures: 0, lastFailure: new Date(), isOpen: false };
      this.circuitBreakers.set(queueName, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = new Date();
    
    if (breaker.failures >= this.HEALTH_THRESHOLDS.CIRCUIT_BREAKER_FAILURES) {
      breaker.isOpen = true;
      this.logger.warn(`Circuit breaker opened for queue: ${queueName}`);
    }
  }

  private recordCircuitBreakerSuccess(queueName: string): void {
    const breaker = this.circuitBreakers.get(queueName);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  }

  /**
   * Send health alert
   */
  private async sendHealthAlert(healthStatus: QueueHealthStatus): Promise<void> {
    // TODO: Implement alerting mechanism (email, Slack, webhook, etc.)
    this.logger.error('QUEUE HEALTH ALERT:', {
      queue: healthStatus.queue,
      status: healthStatus.status,
      issues: healthStatus.issues,
      recommendations: healthStatus.recommendations
    });
  }

  /**
   * Apply automatic remediation
   */
  private async applyAutoRemediation(healthStatus: QueueHealthStatus): Promise<void> {
    const queue = this.queues.get(healthStatus.queue);
    if (!queue) return;

    try {
      // Resume paused queues
      if (healthStatus.metrics.paused) {
        await queue.resume();
        this.logger.info(`Auto-resumed paused queue: ${healthStatus.queue}`);
      }

      // Reset circuit breaker if timeout has passed
      const circuitBreaker = this.circuitBreakers.get(healthStatus.queue);
      if (circuitBreaker?.isOpen) {
        const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure.getTime();
        if (timeSinceLastFailure > this.HEALTH_THRESHOLDS.CIRCUIT_BREAKER_TIMEOUT) {
          circuitBreaker.isOpen = false;
          circuitBreaker.failures = 0;
          this.logger.info(`Auto-reset circuit breaker for queue: ${healthStatus.queue}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to apply auto-remediation for ${healthStatus.queue}:`, error);
    }
  }

  /**
   * Get metrics for a specific queue
   */
  getQueueMetrics(queueName: string): QueueMetrics | undefined {
    return this.metrics.get(queueName);
  }

  /**
   * Get metrics for all queues
   */
  getAllMetrics(): Record<string, QueueMetrics> {
    const result: Record<string, QueueMetrics> = {};
    for (const [queueName, metrics] of this.metrics) {
      result[queueName] = metrics;
    }
    return result;
  }

  /**
   * Get dead letter queue jobs
   */
  async getDeadLetterJobs(limit = 50): Promise<DeadLetterJobInfo[]> {
    try {
      const jobs = await this.deadLetterQueue.getJobs(['completed', 'failed'], 0, limit - 1);
      return jobs.map(job => job.data);
    } catch (error) {
      this.logger.error('Failed to get dead letter jobs:', error);
      return [];
    }
  }

  /**
   * Retry job from dead letter queue
   */
  async retryDeadLetterJob(jobId: string): Promise<boolean> {
    try {
      const jobs = await this.deadLetterQueue.getJobs(['completed', 'failed']);
      const deadLetterJob = jobs.find(job => job.data.jobId === jobId);
      
      if (!deadLetterJob) {
        this.logger.warn(`Dead letter job not found: ${jobId}`);
        return false;
      }

      const jobInfo: DeadLetterJobInfo = deadLetterJob.data;
      const originalQueue = this.queues.get(jobInfo.queueName);
      
      if (!originalQueue) {
        this.logger.warn(`Original queue not found: ${jobInfo.queueName}`);
        return false;
      }

      // Add job back to original queue
      await originalQueue.add(jobInfo.jobName, jobInfo.data);
      
      // Remove from dead letter queue
      await deadLetterJob.remove();
      
      this.logger.info(`Retried dead letter job: ${jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to retry dead letter job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get queue health status
   */
  async getQueueHealthStatus(queueName: string): Promise<QueueHealthStatus | null> {
    const metrics = this.metrics.get(queueName);
    if (!metrics) {
      return null;
    }
    return this.assessQueueHealth(queueName, metrics);
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<{ status: string; queues: QueueHealthStatus[] }> {
    const healthStatuses: QueueHealthStatus[] = [];
    let overallStatus = 'healthy';

    for (const [queueName, metrics] of this.metrics) {
      const healthStatus = await this.assessQueueHealth(queueName, metrics);
      healthStatuses.push(healthStatus);
      
      if (healthStatus.status === 'error') {
        overallStatus = 'error';
      } else if (healthStatus.status === 'warning' && overallStatus === 'healthy') {
        overallStatus = 'warning';
      }
    }

    return {
      status: overallStatus,
      queues: healthStatuses
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all queue events
    for (const [name, events] of this.queueEvents) {
      await events.close();
    }

    // Close dead letter queue
    await this.deadLetterQueue.close();

    // Disconnect Redis
    this.redis.disconnect();

    this.logger.info('Queue monitoring service shut down');
  }
}

export const queueMonitoringService = new QueueMonitoringService();