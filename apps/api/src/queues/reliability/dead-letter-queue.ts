import { Job, Queue, Worker, QueueEvents } from 'bullmq';
import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

export interface DeadLetterJobData {
  originalJobId: string;
  originalQueueName: string;
  originalJobData: any;
  originalJobOptions: any;
  failureReason: string;
  failureCount: number;
  firstFailedAt: Date;
  lastFailedAt: Date;
  stackTrace?: string;
  metadata: {
    processingHistory: ProcessingAttempt[];
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'transient' | 'permanent' | 'unknown';
  };
}

export interface ProcessingAttempt {
  attemptNumber: number;
  timestamp: Date;
  error: string;
  processingTime: number;
  workerId?: string;
  stackTrace?: string;
}

export interface RetryStrategy {
  name: string;
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential' | 'linear' | 'custom';
  baseDelay: number;
  maxDelay?: number;
  jitter?: boolean;
  customFunction?: (attempt: number) => number;
}

export interface DeadLetterAnalysis {
  jobId: string;
  rootCause: string;
  category: 'transient' | 'permanent' | 'unknown';
  recommendation: 'retry' | 'manual_fix' | 'discard' | 'escalate';
  confidence: number;
  similarFailures: number;
  patterns: string[];
}

export class DeadLetterQueueManager extends EventEmitter {
  private redis: Redis;
  private logger: Logger;
  private deadLetterQueue: Queue;
  private deadLetterWorker: Worker;
  private deadLetterEvents: QueueEvents;
  
  private retryStrategies: Map<string, RetryStrategy> = new Map();
  private analysisRules: Map<string, (job: DeadLetterJobData) => DeadLetterAnalysis> = new Map();
  
  private metrics = {
    jobsProcessed: 0,
    jobsRetried: 0,
    jobsDiscarded: 0,
    jobsEscalated: 0,
    categoryCounts: new Map<string, number>(),
    retrySuccess: 0,
    retryFailures: 0,
    processingTime: 0,
  };

  private static readonly DEFAULT_RETRY_STRATEGIES: RetryStrategy[] = [
    {
      name: 'immediate',
      maxAttempts: 3,
      backoffType: 'fixed',
      baseDelay: 1000,
    },
    {
      name: 'exponential',
      maxAttempts: 5,
      backoffType: 'exponential',
      baseDelay: 2000,
      maxDelay: 300000,
      jitter: true,
    },
    {
      name: 'linear',
      maxAttempts: 4,
      backoffType: 'linear',
      baseDelay: 5000,
      maxDelay: 60000,
    },
    {
      name: 'aggressive',
      maxAttempts: 10,
      backoffType: 'exponential',
      baseDelay: 500,
      maxDelay: 600000,
      jitter: true,
    },
  ];

  constructor(redis: Redis, logger: Logger, connectionOptions: any) {
    super();
    this.redis = redis;
    this.logger = logger;

    // Initialize default retry strategies
    DeadLetterQueueManager.DEFAULT_RETRY_STRATEGIES.forEach(strategy => {
      this.retryStrategies.set(strategy.name, strategy);
    });

    // Create dead letter queue
    this.deadLetterQueue = new Queue('dead-letter-queue', {
      connection: connectionOptions,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 500,
        attempts: 1, // Dead letter jobs are processed once
      },
    });

    // Create worker for processing dead letter jobs
    this.deadLetterWorker = new Worker(
      'dead-letter-queue',
      async (job) => await this.processDeadLetterJob(job),
      {
        connection: connectionOptions,
        concurrency: 2,
      }
    );

    // Create events listener
    this.deadLetterEvents = new QueueEvents('dead-letter-queue', {
      connection: connectionOptions,
    });

    this.setupEventHandlers();
    this.initializeAnalysisRules();
  }

  private setupEventHandlers(): void {
    this.deadLetterWorker.on('completed', (job) => {
      this.logger.info({
        jobId: job.id,
        originalJobId: job.data.originalJobId,
      }, 'Dead letter job processed successfully');
    });

    this.deadLetterWorker.on('failed', (job, err) => {
      this.logger.error({
        error: err,
        jobId: job?.id,
        originalJobId: job?.data?.originalJobId,
      }, 'Failed to process dead letter job');
    });

    this.deadLetterEvents.on('completed', ({ jobId }) => {
      this.emit('deadletter:processed', jobId);
    });

    this.deadLetterEvents.on('failed', ({ jobId, failedReason }) => {
      this.emit('deadletter:failed', { jobId, failedReason });
    });
  }

  private initializeAnalysisRules(): void {
    // Database connection failures
    this.analysisRules.set('database_connection', (job) => ({
      jobId: job.originalJobId,
      rootCause: 'Database connection failure',
      category: 'transient',
      recommendation: 'retry',
      confidence: 0.9,
      similarFailures: 0,
      patterns: ['ECONNREFUSED', 'connection timeout', 'pool exhausted'],
    }));

    // External API failures
    this.analysisRules.set('external_api', (job) => ({
      jobId: job.originalJobId,
      rootCause: 'External API failure',
      category: 'transient',
      recommendation: 'retry',
      confidence: 0.8,
      similarFailures: 0,
      patterns: ['HTTP 5xx', 'timeout', 'network error'],
    }));

    // Validation errors
    this.analysisRules.set('validation_error', (job) => ({
      jobId: job.originalJobId,
      rootCause: 'Data validation error',
      category: 'permanent',
      recommendation: 'manual_fix',
      confidence: 0.95,
      similarFailures: 0,
      patterns: ['validation failed', 'invalid input', 'schema error'],
    }));

    // Resource exhaustion
    this.analysisRules.set('resource_exhaustion', (job) => ({
      jobId: job.originalJobId,
      rootCause: 'Resource exhaustion',
      category: 'transient',
      recommendation: 'retry',
      confidence: 0.85,
      similarFailures: 0,
      patterns: ['out of memory', 'disk full', 'rate limit exceeded'],
    }));

    // Authentication/Authorization errors
    this.analysisRules.set('auth_error', (job) => ({
      jobId: job.originalJobId,
      rootCause: 'Authentication/Authorization error',
      category: 'permanent',
      recommendation: 'manual_fix',
      confidence: 0.9,
      similarFailures: 0,
      patterns: ['unauthorized', 'forbidden', 'token expired', 'invalid credentials'],
    }));

    // Business logic errors
    this.analysisRules.set('business_logic', (job) => ({
      jobId: job.originalJobId,
      rootCause: 'Business logic error',
      category: 'permanent',
      recommendation: 'escalate',
      confidence: 0.7,
      similarFailures: 0,
      patterns: ['business rule violation', 'invalid state', 'conflict'],
    }));
  }

  public async addToDeadLetterQueue(
    originalJob: Job,
    error: Error,
    processingAttempts: ProcessingAttempt[]
  ): Promise<void> {
    const deadLetterJobData: DeadLetterJobData = {
      originalJobId: originalJob.id!,
      originalQueueName: originalJob.queueName,
      originalJobData: originalJob.data,
      originalJobOptions: originalJob.opts,
      failureReason: error.message,
      failureCount: processingAttempts.length,
      firstFailedAt: processingAttempts[0]?.timestamp || new Date(),
      lastFailedAt: new Date(),
      stackTrace: error.stack,
      metadata: {
        processingHistory: processingAttempts,
        tags: this.extractTags(originalJob, error),
        priority: this.determinePriority(originalJob, error),
        category: this.categorizeFailure(error),
      },
    };

    try {
      await this.deadLetterQueue.add('process-dead-letter', deadLetterJobData, {
        priority: this.getPriorityValue(deadLetterJobData.metadata.priority),
        delay: this.calculateDelay(deadLetterJobData),
      });

      // Store additional metadata for analysis
      await this.storeFailureMetadata(deadLetterJobData);

      this.logger.warn({
        originalJobId: originalJob.id,
        queueName: originalJob.queueName,
        failureCount: processingAttempts.length,
        failureReason: error.message,
        category: deadLetterJobData.metadata.category,
      }, 'Job moved to dead letter queue');

      this.emit('job:dead-lettered', {
        originalJob,
        deadLetterJob: deadLetterJobData,
        error,
      });

    } catch (dlqError) {
      this.logger.error({
        error: dlqError,
        originalJobId: originalJob.id,
        queueName: originalJob.queueName,
      }, 'Failed to add job to dead letter queue');
      throw dlqError;
    }
  }

  private async processDeadLetterJob(job: Job<DeadLetterJobData>): Promise<void> {
    const startTime = Date.now();
    const dlJobData = job.data;

    try {
      this.logger.info({
        deadLetterJobId: job.id,
        originalJobId: dlJobData.originalJobId,
        originalQueue: dlJobData.originalQueueName,
        failureCount: dlJobData.failureCount,
      }, 'Processing dead letter job');

      // Analyze the failure
      const analysis = await this.analyzeFailure(dlJobData);

      // Update similar failures count
      analysis.similarFailures = await this.countSimilarFailures(analysis);

      // Store analysis results
      await this.storeAnalysis(dlJobData.originalJobId, analysis);

      // Execute recommendation
      await this.executeRecommendation(dlJobData, analysis);

      // Update metrics
      this.updateMetrics(dlJobData, analysis);

      this.logger.info({
        deadLetterJobId: job.id,
        originalJobId: dlJobData.originalJobId,
        recommendation: analysis.recommendation,
        rootCause: analysis.rootCause,
        processingTime: Date.now() - startTime,
      }, 'Dead letter job processed');

    } catch (error) {
      this.logger.error({
        error,
        deadLetterJobId: job.id,
        originalJobId: dlJobData.originalJobId,
      }, 'Failed to process dead letter job');
      throw error;
    }
  }

  private async analyzeFailure(dlJobData: DeadLetterJobData): Promise<DeadLetterAnalysis> {
    let bestAnalysis: DeadLetterAnalysis = {
      jobId: dlJobData.originalJobId,
      rootCause: 'Unknown error',
      category: 'unknown',
      recommendation: 'manual_fix',
      confidence: 0.1,
      similarFailures: 0,
      patterns: [],
    };

    // Apply analysis rules
    for (const [ruleName, analyzeFunction] of this.analysisRules) {
      try {
        const analysis = analyzeFunction(dlJobData);
        
        // Check if patterns match the failure
        const matchingPatterns = analysis.patterns.filter(pattern => 
          dlJobData.failureReason.toLowerCase().includes(pattern.toLowerCase()) ||
          dlJobData.stackTrace?.toLowerCase().includes(pattern.toLowerCase())
        );

        if (matchingPatterns.length > 0) {
          analysis.confidence *= (matchingPatterns.length / analysis.patterns.length);
          
          if (analysis.confidence > bestAnalysis.confidence) {
            bestAnalysis = analysis;
            bestAnalysis.patterns = matchingPatterns;
          }
        }
      } catch (error) {
        this.logger.warn({
          error,
          ruleName,
          originalJobId: dlJobData.originalJobId,
        }, 'Analysis rule failed');
      }
    }

    // Apply machine learning or pattern recognition here
    bestAnalysis = await this.enhanceAnalysisWithML(dlJobData, bestAnalysis);

    return bestAnalysis;
  }

  private async enhanceAnalysisWithML(
    dlJobData: DeadLetterJobData,
    analysis: DeadLetterAnalysis
  ): Promise<DeadLetterAnalysis> {
    try {
      // Get historical failure data
      const historicalFailures = await this.getHistoricalFailures(dlJobData.originalQueueName);
      
      // Simple pattern matching (in production, use proper ML)
      const errorPatterns = historicalFailures
        .filter(f => f.category === analysis.category)
        .map(f => f.rootCause);

      const patternCount = errorPatterns.filter(p => p === analysis.rootCause).length;
      
      if (patternCount > 5) {
        analysis.confidence = Math.min(analysis.confidence + 0.2, 1.0);
      }

      // Time-based analysis
      const recentFailures = historicalFailures
        .filter(f => new Date(f.timestamp).getTime() > Date.now() - 86400000) // Last 24 hours
        .length;

      if (recentFailures > 10 && analysis.category === 'transient') {
        analysis.recommendation = 'escalate';
        analysis.confidence = Math.min(analysis.confidence + 0.1, 1.0);
      }

    } catch (error) {
      this.logger.warn({
        error,
        originalJobId: dlJobData.originalJobId,
      }, 'ML enhancement failed');
    }

    return analysis;
  }

  private async executeRecommendation(
    dlJobData: DeadLetterJobData,
    analysis: DeadLetterAnalysis
  ): Promise<void> {
    switch (analysis.recommendation) {
      case 'retry':
        await this.retryJob(dlJobData, analysis);
        break;
      case 'manual_fix':
        await this.flagForManualReview(dlJobData, analysis);
        break;
      case 'discard':
        await this.discardJob(dlJobData, analysis);
        break;
      case 'escalate':
        await this.escalateJob(dlJobData, analysis);
        break;
    }
  }

  private async retryJob(dlJobData: DeadLetterJobData, analysis: DeadLetterAnalysis): Promise<void> {
    try {
      // Determine retry strategy based on failure category and history
      const strategyName = this.selectRetryStrategy(dlJobData, analysis);
      const strategy = this.retryStrategies.get(strategyName);

      if (!strategy) {
        throw new Error(`Retry strategy ${strategyName} not found`);
      }

      // Calculate delay based on strategy
      const delay = this.calculateRetryDelay(strategy, dlJobData.failureCount);

      // Re-queue the original job with retry metadata
      const retryQueue = new Queue(dlJobData.originalQueueName, {
        connection: this.redis,
      });

      await retryQueue.add(
        'retry-job',
        {
          ...dlJobData.originalJobData,
          _retryMetadata: {
            originalJobId: dlJobData.originalJobId,
            retryAttempt: dlJobData.failureCount + 1,
            strategy: strategyName,
            analysis: analysis,
            retriedAt: new Date().toISOString(),
          },
        },
        {
          ...dlJobData.originalJobOptions,
          delay,
          priority: this.getPriorityValue(dlJobData.metadata.priority),
        }
      );

      this.metrics.jobsRetried++;

      this.logger.info({
        originalJobId: dlJobData.originalJobId,
        strategy: strategyName,
        delay,
        retryAttempt: dlJobData.failureCount + 1,
      }, 'Job scheduled for retry');

      this.emit('job:retried', {
        originalJobId: dlJobData.originalJobId,
        strategy: strategyName,
        delay,
        analysis,
      });

    } catch (error) {
      this.logger.error({
        error,
        originalJobId: dlJobData.originalJobId,
      }, 'Failed to retry job');
      
      // Fallback to manual review
      await this.flagForManualReview(dlJobData, analysis);
    }
  }

  private async flagForManualReview(
    dlJobData: DeadLetterJobData,
    analysis: DeadLetterAnalysis
  ): Promise<void> {
    const reviewData = {
      jobId: dlJobData.originalJobId,
      queueName: dlJobData.originalQueueName,
      jobData: dlJobData.originalJobData,
      failureReason: dlJobData.failureReason,
      analysis,
      flaggedAt: new Date().toISOString(),
      priority: dlJobData.metadata.priority,
    };

    await this.redis.lpush('manual-review-queue', JSON.stringify(reviewData));
    
    // Set expiration for manual review items
    await this.redis.expire('manual-review-queue', 86400 * 7); // 7 days

    this.logger.info({
      originalJobId: dlJobData.originalJobId,
      rootCause: analysis.rootCause,
      priority: dlJobData.metadata.priority,
    }, 'Job flagged for manual review');

    this.emit('job:manual-review', {
      originalJobId: dlJobData.originalJobId,
      analysis,
    });
  }

  private async discardJob(dlJobData: DeadLetterJobData, analysis: DeadLetterAnalysis): Promise<void> {
    // Store discarded job info for audit
    await this.redis.set(
      `discarded-job:${dlJobData.originalJobId}`,
      JSON.stringify({
        ...dlJobData,
        analysis,
        discardedAt: new Date().toISOString(),
      }),
      'EX',
      86400 * 30 // Keep for 30 days
    );

    this.metrics.jobsDiscarded++;

    this.logger.info({
      originalJobId: dlJobData.originalJobId,
      rootCause: analysis.rootCause,
    }, 'Job discarded');

    this.emit('job:discarded', {
      originalJobId: dlJobData.originalJobId,
      analysis,
    });
  }

  private async escalateJob(dlJobData: DeadLetterJobData, analysis: DeadLetterAnalysis): Promise<void> {
    const escalationData = {
      jobId: dlJobData.originalJobId,
      queueName: dlJobData.originalQueueName,
      jobData: dlJobData.originalJobData,
      failureReason: dlJobData.failureReason,
      analysis,
      escalatedAt: new Date().toISOString(),
      severity: 'high',
    };

    // Send to escalation queue
    await this.redis.lpush('escalation-queue', JSON.stringify(escalationData));
    
    // Also send notification to operations team
    await this.sendEscalationNotification(escalationData);

    this.metrics.jobsEscalated++;

    this.logger.warn({
      originalJobId: dlJobData.originalJobId,
      rootCause: analysis.rootCause,
      similarFailures: analysis.similarFailures,
    }, 'Job escalated');

    this.emit('job:escalated', {
      originalJobId: dlJobData.originalJobId,
      analysis,
    });
  }

  private selectRetryStrategy(dlJobData: DeadLetterJobData, analysis: DeadLetterAnalysis): string {
    // Select strategy based on failure category and priority
    if (analysis.category === 'transient') {
      if (dlJobData.metadata.priority === 'critical') {
        return 'aggressive';
      }
      return 'exponential';
    }

    if (analysis.confidence < 0.7) {
      return 'linear'; // More conservative for uncertain cases
    }

    return 'immediate';
  }

  private calculateRetryDelay(strategy: RetryStrategy, attemptNumber: number): number {
    let delay: number;

    switch (strategy.backoffType) {
      case 'fixed':
        delay = strategy.baseDelay;
        break;
      case 'exponential':
        delay = strategy.baseDelay * Math.pow(2, attemptNumber - 1);
        break;
      case 'linear':
        delay = strategy.baseDelay * attemptNumber;
        break;
      case 'custom':
        delay = strategy.customFunction ? strategy.customFunction(attemptNumber) : strategy.baseDelay;
        break;
      default:
        delay = strategy.baseDelay;
    }

    // Apply maximum delay limit
    if (strategy.maxDelay) {
      delay = Math.min(delay, strategy.maxDelay);
    }

    // Apply jitter if enabled
    if (strategy.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(delay, 0);
  }

  private extractTags(job: Job, error: Error): string[] {
    const tags: string[] = [];

    // Extract tags from job data
    if (job.data.tags) {
      tags.push(...job.data.tags);
    }

    // Extract tags from error
    if (error.message.includes('timeout')) {
      tags.push('timeout');
    }
    if (error.message.includes('connection')) {
      tags.push('connection');
    }
    if (error.message.includes('validation')) {
      tags.push('validation');
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      tags.push('permission');
    }

    // Extract tags from queue name
    tags.push(`queue:${job.queueName}`);

    return [...new Set(tags)]; // Remove duplicates
  }

  private determinePriority(job: Job, error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Priority from job options
    if (job.opts.priority) {
      if (job.opts.priority >= 90) return 'critical';
      if (job.opts.priority >= 70) return 'high';
      if (job.opts.priority >= 40) return 'medium';
    }

    // Priority from queue name
    if (job.queueName.includes('critical') || job.queueName.includes('urgent')) {
      return 'critical';
    }
    if (job.queueName.includes('high') || job.queueName.includes('important')) {
      return 'high';
    }

    // Priority from error type
    if (error.message.includes('payment') || error.message.includes('security')) {
      return 'high';
    }

    return 'medium';
  }

  private categorizeFailure(error: Error): 'transient' | 'permanent' | 'unknown' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Transient failures
    const transientPatterns = [
      'timeout', 'econnrefused', 'enotfound', 'ehostunreach',
      'rate limit', 'throttled', 'service unavailable',
      'internal server error', 'bad gateway', 'gateway timeout',
      'temporarily unavailable', 'try again', 'busy'
    ];

    // Permanent failures
    const permanentPatterns = [
      'validation', 'invalid', 'forbidden', 'unauthorized',
      'not found', 'bad request', 'malformed', 'syntax error',
      'permission denied', 'access denied', 'schema error'
    ];

    for (const pattern of transientPatterns) {
      if (message.includes(pattern) || stack.includes(pattern)) {
        return 'transient';
      }
    }

    for (const pattern of permanentPatterns) {
      if (message.includes(pattern) || stack.includes(pattern)) {
        return 'permanent';
      }
    }

    return 'unknown';
  }

  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 50;
    }
  }

  private calculateDelay(dlJobData: DeadLetterJobData): number {
    // Delay processing based on priority and category
    if (dlJobData.metadata.priority === 'critical') {
      return 0; // Process immediately
    }

    if (dlJobData.metadata.category === 'transient') {
      return 30000; // 30 seconds
    }

    return 60000; // 1 minute for other cases
  }

  private async storeFailureMetadata(dlJobData: DeadLetterJobData): Promise<void> {
    const metadata = {
      timestamp: new Date().toISOString(),
      queueName: dlJobData.originalQueueName,
      category: dlJobData.metadata.category,
      priority: dlJobData.metadata.priority,
      failureReason: dlJobData.failureReason,
      rootCause: 'pending_analysis',
    };

    await this.redis.lpush('failure-metadata', JSON.stringify(metadata));
    await this.redis.ltrim('failure-metadata', 0, 9999); // Keep last 10k failures
  }

  private async storeAnalysis(jobId: string, analysis: DeadLetterAnalysis): Promise<void> {
    await this.redis.set(
      `analysis:${jobId}`,
      JSON.stringify(analysis),
      'EX',
      86400 * 7 // Keep for 7 days
    );
  }

  private async countSimilarFailures(analysis: DeadLetterAnalysis): Promise<number> {
    try {
      const failures = await this.redis.lrange('failure-metadata', 0, -1);
      let count = 0;

      for (const failureStr of failures) {
        const failure = JSON.parse(failureStr);
        if (failure.rootCause === analysis.rootCause) {
          count++;
        }
      }

      return count;
    } catch (error) {
      this.logger.warn({ error }, 'Failed to count similar failures');
      return 0;
    }
  }

  private async getHistoricalFailures(queueName: string): Promise<any[]> {
    try {
      const failures = await this.redis.lrange('failure-metadata', 0, -1);
      return failures
        .map(f => JSON.parse(f))
        .filter(f => f.queueName === queueName);
    } catch (error) {
      this.logger.warn({ error, queueName }, 'Failed to get historical failures');
      return [];
    }
  }

  private async sendEscalationNotification(escalationData: any): Promise<void> {
    // In production, integrate with alerting systems (PagerDuty, Slack, etc.)
    this.logger.error({
      escalation: escalationData,
    }, 'JOB ESCALATION - IMMEDIATE ATTENTION REQUIRED');
  }

  private updateMetrics(dlJobData: DeadLetterJobData, analysis: DeadLetterAnalysis): void {
    this.metrics.jobsProcessed++;
    
    const category = analysis.category;
    this.metrics.categoryCounts.set(category, (this.metrics.categoryCounts.get(category) || 0) + 1);

    switch (analysis.recommendation) {
      case 'retry':
        this.metrics.jobsRetried++;
        break;
      case 'discard':
        this.metrics.jobsDiscarded++;
        break;
      case 'escalate':
        this.metrics.jobsEscalated++;
        break;
    }
  }

  public async getManualReviewQueue(): Promise<any[]> {
    const items = await this.redis.lrange('manual-review-queue', 0, -1);
    return items.map(item => JSON.parse(item));
  }

  public async getEscalationQueue(): Promise<any[]> {
    const items = await this.redis.lrange('escalation-queue', 0, -1);
    return items.map(item => JSON.parse(item));
  }

  public async getFailureStatistics(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const failures = await this.redis.lrange('failure-metadata', 0, -1);
    const now = Date.now();
    const timeRangeMs = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
    }[timeRange];

    const recentFailures = failures
      .map(f => JSON.parse(f))
      .filter(f => now - new Date(f.timestamp).getTime() < timeRangeMs);

    const stats = {
      total: recentFailures.length,
      byCategory: {} as Record<string, number>,
      byQueue: {} as Record<string, number>,
      byRootCause: {} as Record<string, number>,
    };

    recentFailures.forEach(failure => {
      stats.byCategory[failure.category] = (stats.byCategory[failure.category] || 0) + 1;
      stats.byQueue[failure.queueName] = (stats.byQueue[failure.queueName] || 0) + 1;
      stats.byRootCause[failure.rootCause] = (stats.byRootCause[failure.rootCause] || 0) + 1;
    });

    return stats;
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      categoryCounts: Object.fromEntries(this.metrics.categoryCounts),
      averageProcessingTime: this.metrics.jobsProcessed > 0 
        ? this.metrics.processingTime / this.metrics.jobsProcessed 
        : 0,
      retrySuccessRate: this.metrics.jobsRetried > 0
        ? (this.metrics.retrySuccess / (this.metrics.retrySuccess + this.metrics.retryFailures)) * 100
        : 100,
    };
  }

  public addRetryStrategy(strategy: RetryStrategy): void {
    this.retryStrategies.set(strategy.name, strategy);
    this.logger.info({ strategyName: strategy.name }, 'Retry strategy added');
  }

  public addAnalysisRule(
    name: string,
    analyzeFunction: (job: DeadLetterJobData) => DeadLetterAnalysis
  ): void {
    this.analysisRules.set(name, analyzeFunction);
    this.logger.info({ ruleName: name }, 'Analysis rule added');
  }
}

export default DeadLetterQueueManager;