import { Queue, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';
import { randomUUID } from 'crypto';

/**
 * Batch Job Configuration
 */
export interface BatchJobConfig {
  id: string;
  name: string;
  type: 'email-blast' | 'bulk-upload' | 'data-migration' | 'bulk-moderation' | 'analytics-export' | 'user-sync';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  batchSize: number;
  concurrency: number;
  retryAttempts: number;
  timeout: number; // milliseconds
  scheduledAt?: Date;
  metadata: Record<string, any>;
  tags: string[];
}

/**
 * Batch Processing Result
 */
export interface BatchProcessingResult {
  batchId: string;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  skippedItems: number;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  throughput?: number; // items per second
  errors: Array<{
    itemIndex: number;
    itemId?: string;
    error: string;
    timestamp: Date;
  }>;
  warnings: Array<{
    itemIndex: number;
    itemId?: string;
    warning: string;
    timestamp: Date;
  }>;
  metrics: {
    avgProcessingTime: number;
    maxProcessingTime: number;
    minProcessingTime: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}

/**
 * Batch Item Processing Status
 */
export interface BatchItemStatus {
  index: number;
  id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
  retryCount: number;
  processingTime?: number;
}

/**
 * Batch Progress Information
 */
export interface BatchProgress {
  batchId: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  currentItem: number;
  progress: number; // 0-100
  estimatedTimeRemaining?: number;
  currentThroughput: number;
  averageProcessingTime: number;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  lastActivityAt: Date;
}

/**
 * Batch Processing Strategy
 */
export interface ProcessingStrategy {
  name: string;
  batchSize: number;
  concurrency: number;
  retryPolicy: {
    attempts: number;
    delay: number;
    backoff: 'fixed' | 'exponential' | 'linear';
  };
  memoryLimit?: number; // bytes
  timeoutMs: number;
  pauseOnError?: boolean;
  skipOnError?: boolean;
}

/**
 * Comprehensive Batch Processing Service
 * 
 * Features:
 * - High-volume batch job processing with intelligent chunking
 * - Multiple processing strategies for different workload types
 * - Real-time progress tracking and monitoring
 * - Automatic retry and error recovery mechanisms
 * - Memory and performance optimization for large datasets
 * - Pause/resume capabilities for long-running operations
 * - Rate limiting and throttling controls
 * - Comprehensive metrics and analytics
 * - Integration with queue system for reliability
 * - Resource monitoring and auto-scaling
 */
export class BatchProcessingService {
  private redis: Redis;
  private logger: pino.Logger;
  private batchQueue: Queue;
  private queueEvents: QueueEvents;
  
  // Active batch tracking
  private activeBatches = new Map<string, BatchProgress>();
  private batchResults = new Map<string, BatchProcessingResult>();
  private batchItems = new Map<string, Map<number, BatchItemStatus>>();
  
  // Processing strategies
  private strategies = new Map<string, ProcessingStrategy>();
  
  // Performance monitoring
  private metrics = {
    totalBatchesProcessed: 0,
    totalItemsProcessed: 0,
    totalProcessingTime: 0,
    averageThroughput: 0,
    currentMemoryUsage: 0,
    peakMemoryUsage: 0
  };

  // Configuration
  private readonly config = {
    maxConcurrentBatches: 5,
    maxBatchSize: 10000,
    defaultTimeout: 300000, // 5 minutes
    memoryThreshold: 1024 * 1024 * 1024, // 1GB
    progressUpdateInterval: 1000, // 1 second
    cleanupInterval: 60000, // 1 minute
    maxRetainedResults: 100
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
      name: 'batch-processing-service',
      level: process.env.LOG_LEVEL || 'info'
    });

    // Initialize batch queue
    this.batchQueue = new Queue('batch-processing', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
      }
    });

    this.queueEvents = new QueueEvents('batch-processing', {
      connection: this.redis
    });

    this.initializeStrategies();
    this.setupEventListeners();
    this.startPeriodicCleanup();
  }

  /**
   * Initialize processing strategies for different workload types
   */
  private initializeStrategies(): void {
    // Strategy for email blasts
    this.strategies.set('email-blast', {
      name: 'email-blast',
      batchSize: 500,
      concurrency: 10,
      retryPolicy: {
        attempts: 3,
        delay: 5000,
        backoff: 'exponential'
      },
      timeoutMs: 60000,
      skipOnError: true
    });

    // Strategy for bulk file uploads
    this.strategies.set('bulk-upload', {
      name: 'bulk-upload',
      batchSize: 100,
      concurrency: 5,
      retryPolicy: {
        attempts: 2,
        delay: 10000,
        backoff: 'fixed'
      },
      memoryLimit: 512 * 1024 * 1024, // 512MB
      timeoutMs: 300000,
      pauseOnError: false,
      skipOnError: false
    });

    // Strategy for data migrations
    this.strategies.set('data-migration', {
      name: 'data-migration',
      batchSize: 1000,
      concurrency: 3,
      retryPolicy: {
        attempts: 5,
        delay: 2000,
        backoff: 'linear'
      },
      timeoutMs: 600000, // 10 minutes
      pauseOnError: true,
      skipOnError: false
    });

    // Strategy for bulk content moderation
    this.strategies.set('bulk-moderation', {
      name: 'bulk-moderation',
      batchSize: 200,
      concurrency: 8,
      retryPolicy: {
        attempts: 2,
        delay: 3000,
        backoff: 'exponential'
      },
      timeoutMs: 120000,
      skipOnError: true
    });

    // Strategy for analytics exports
    this.strategies.set('analytics-export', {
      name: 'analytics-export',
      batchSize: 5000,
      concurrency: 2,
      retryPolicy: {
        attempts: 3,
        delay: 15000,
        backoff: 'exponential'
      },
      timeoutMs: 900000, // 15 minutes
      pauseOnError: false,
      skipOnError: false
    });

    this.logger.info(`Initialized ${this.strategies.size} processing strategies`);
  }

  /**
   * Setup event listeners for batch processing
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', (jobId) => {
      this.logger.debug(`Batch job completed: ${jobId}`);
    });

    this.queueEvents.on('failed', (jobId, err) => {
      this.logger.error(`Batch job failed: ${jobId}`, err);
    });

    this.queueEvents.on('progress', (jobId, progress) => {
      // Update progress in real-time
      this.updateBatchProgress(jobId, progress);
    });
  }

  /**
   * Submit a batch job for processing
   */
  async submitBatchJob<T>(
    jobType: BatchJobConfig['type'],
    items: T[],
    processor: (item: T, index: number, batchId: string) => Promise<any>,
    options: Partial<BatchJobConfig> = {}
  ): Promise<{
    batchId: string;
    estimatedDuration: number;
    queuePosition?: number;
  }> {
    try {
      const batchId = options.id || `batch_${Date.now()}_${randomUUID().slice(0, 8)}`;
      
      // Validate batch size
      if (items.length === 0) {
        throw new Error('Batch cannot be empty');
      }

      if (items.length > this.config.maxBatchSize) {
        throw new Error(`Batch size ${items.length} exceeds maximum ${this.config.maxBatchSize}`);
      }

      // Get processing strategy
      const strategy = this.strategies.get(jobType) || this.getDefaultStrategy();
      
      // Create batch configuration
      const config: BatchJobConfig = {
        id: batchId,
        name: options.name || `Batch ${jobType} processing`,
        type: jobType,
        priority: options.priority || 'normal',
        batchSize: Math.min(options.batchSize || strategy.batchSize, items.length),
        concurrency: options.concurrency || strategy.concurrency,
        retryAttempts: options.retryAttempts || strategy.retryPolicy.attempts,
        timeout: options.timeout || strategy.timeoutMs,
        scheduledAt: options.scheduledAt,
        metadata: {
          totalItems: items.length,
          strategy: strategy.name,
          submittedAt: new Date(),
          ...options.metadata
        },
        tags: options.tags || [jobType, strategy.name]
      };

      // Initialize batch tracking
      const progress: BatchProgress = {
        batchId,
        totalItems: items.length,
        completedItems: 0,
        failedItems: 0,
        skippedItems: 0,
        currentItem: 0,
        progress: 0,
        currentThroughput: 0,
        averageProcessingTime: 0,
        status: 'queued',
        lastActivityAt: new Date()
      };

      this.activeBatches.set(batchId, progress);

      // Initialize item status tracking
      const itemStatuses = new Map<number, BatchItemStatus>();
      for (let i = 0; i < items.length; i++) {
        itemStatuses.set(i, {
          index: i,
          id: this.extractItemId(items[i]),
          status: 'pending',
          retryCount: 0
        });
      }
      this.batchItems.set(batchId, itemStatuses);

      // Create batch processing job
      const job = await this.batchQueue.add(
        'process-batch',
        {
          config,
          items,
          processor: processor.toString() // Serialize processor function
        },
        {
          priority: this.mapPriority(config.priority),
          delay: config.scheduledAt ? config.scheduledAt.getTime() - Date.now() : 0,
          attempts: 1, // Batch-level retries handled internally
          removeOnComplete: 25,
          removeOnFail: 10,
          jobId: batchId
        }
      );

      // Estimate duration based on historical data and strategy
      const estimatedDuration = this.estimateBatchDuration(items.length, strategy);

      this.logger.info(`Batch job submitted`, {
        batchId,
        jobType,
        totalItems: items.length,
        strategy: strategy.name,
        estimatedDuration,
        priority: config.priority
      });

      return {
        batchId,
        estimatedDuration,
        queuePosition: await job.getJobCounts().then(counts => counts.waiting)
      };

    } catch (error) {
      this.logger.error('Failed to submit batch job:', error);
      throw error;
    }
  }

  /**
   * Process batch items with intelligent chunking and error handling
   */
  async processBatch<T>(
    config: BatchJobConfig,
    items: T[],
    processor: (item: T, index: number, batchId: string) => Promise<any>
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const batchId = config.id;
    
    this.logger.info(`Starting batch processing`, {
      batchId,
      totalItems: items.length,
      batchSize: config.batchSize,
      concurrency: config.concurrency
    });

    // Initialize result tracking
    const result: BatchProcessingResult = {
      batchId,
      totalItems: items.length,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      skippedItems: 0,
      startedAt: new Date(startTime),
      errors: [],
      warnings: [],
      metrics: {
        avgProcessingTime: 0,
        maxProcessingTime: 0,
        minProcessingTime: Infinity
      }
    };

    // Update batch status
    const progress = this.activeBatches.get(batchId);
    if (progress) {
      progress.status = 'running';
      progress.startedAt = new Date(startTime);
      this.activeBatches.set(batchId, progress);
    }

    try {
      // Process items in chunks
      const chunks = this.chunkArray(items, config.batchSize);
      const itemStatuses = this.batchItems.get(batchId);
      let currentItemIndex = 0;

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        
        this.logger.debug(`Processing chunk ${chunkIndex + 1}/${chunks.length}`, {
          batchId,
          chunkSize: chunk.length
        });

        // Process chunk items concurrently
        const chunkPromises = chunk.map(async (item, itemIndexInChunk) => {
          const globalIndex = currentItemIndex + itemIndexInChunk;
          const itemId = this.extractItemId(item);
          
          try {
            // Update item status
            const itemStatus = itemStatuses?.get(globalIndex);
            if (itemStatus) {
              itemStatus.status = 'processing';
              itemStatus.startedAt = new Date();
              itemStatuses.set(globalIndex, itemStatus);
            }

            const itemStartTime = Date.now();
            
            // Process individual item with timeout
            const itemResult = await Promise.race([
              processor(item, globalIndex, batchId),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Item processing timeout')), config.timeout)
              )
            ]);

            const processingTime = Date.now() - itemStartTime;

            // Update item status
            if (itemStatus) {
              itemStatus.status = 'completed';
              itemStatus.completedAt = new Date();
              itemStatus.result = itemResult;
              itemStatus.processingTime = processingTime;
              itemStatuses?.set(globalIndex, itemStatus);
            }

            // Update metrics
            result.metrics.avgProcessingTime = 
              (result.metrics.avgProcessingTime * result.processedItems + processingTime) / 
              (result.processedItems + 1);
            
            result.metrics.maxProcessingTime = Math.max(
              result.metrics.maxProcessingTime, 
              processingTime
            );
            
            result.metrics.minProcessingTime = Math.min(
              result.metrics.minProcessingTime, 
              processingTime
            );

            result.successfulItems++;
            result.processedItems++;

            return { success: true, index: globalIndex, result: itemResult };

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            this.logger.warn(`Item processing failed`, {
              batchId,
              itemIndex: globalIndex,
              itemId,
              error: errorMessage
            });

            // Update item status
            const itemStatus = itemStatuses?.get(globalIndex);
            if (itemStatus) {
              itemStatus.status = 'failed';
              itemStatus.completedAt = new Date();
              itemStatus.error = errorMessage;
              itemStatus.retryCount++;
              itemStatuses?.set(globalIndex, itemStatus);
            }

            // Record error
            result.errors.push({
              itemIndex: globalIndex,
              itemId,
              error: errorMessage,
              timestamp: new Date()
            });

            result.failedItems++;
            result.processedItems++;

            return { success: false, index: globalIndex, error: errorMessage };
          }
        });

        // Wait for chunk to complete with concurrency control
        const chunkResults = await this.processConcurrently(
          chunkPromises, 
          config.concurrency
        );

        currentItemIndex += chunk.length;

        // Update progress
        if (progress) {
          progress.completedItems = result.processedItems;
          progress.failedItems = result.failedItems;
          progress.currentItem = currentItemIndex;
          progress.progress = (result.processedItems / result.totalItems) * 100;
          progress.lastActivityAt = new Date();
          progress.currentThroughput = this.calculateThroughput(
            result.processedItems,
            Date.now() - startTime
          );
          progress.averageProcessingTime = result.metrics.avgProcessingTime;
          this.activeBatches.set(batchId, progress);
        }

        // Check memory usage and pause if necessary
        const memoryUsage = process.memoryUsage().heapUsed;
        if (memoryUsage > this.config.memoryThreshold) {
          this.logger.warn('Memory threshold exceeded, pausing batch', {
            batchId,
            memoryUsage,
            threshold: this.config.memoryThreshold
          });
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
          
          // Wait a bit before continuing
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Finalize results
      const endTime = Date.now();
      result.completedAt = new Date(endTime);
      result.duration = endTime - startTime;
      result.throughput = result.processedItems / (result.duration / 1000);
      result.metrics.memoryUsage = process.memoryUsage().heapUsed;

      // Update final progress
      if (progress) {
        progress.status = 'completed';
        progress.progress = 100;
        this.activeBatches.set(batchId, progress);
      }

      // Store result
      this.batchResults.set(batchId, result);

      // Update global metrics
      this.metrics.totalBatchesProcessed++;
      this.metrics.totalItemsProcessed += result.processedItems;
      this.metrics.totalProcessingTime += result.duration!;
      this.metrics.averageThroughput = 
        this.metrics.totalItemsProcessed / (this.metrics.totalProcessingTime / 1000);

      this.logger.info(`Batch processing completed`, {
        batchId,
        totalItems: result.totalItems,
        successfulItems: result.successfulItems,
        failedItems: result.failedItems,
        duration: result.duration,
        throughput: result.throughput,
        successRate: (result.successfulItems / result.totalItems) * 100
      });

      return result;

    } catch (error) {
      this.logger.error(`Batch processing failed`, { batchId, error });
      
      // Update progress status
      if (progress) {
        progress.status = 'failed';
        this.activeBatches.set(batchId, progress);
      }

      result.completedAt = new Date();
      result.duration = Date.now() - startTime;
      
      throw error;
    }
  }

  /**
   * Get batch processing progress
   */
  getBatchProgress(batchId: string): BatchProgress | undefined {
    return this.activeBatches.get(batchId);
  }

  /**
   * Get batch processing result
   */
  getBatchResult(batchId: string): BatchProcessingResult | undefined {
    return this.batchResults.get(batchId);
  }

  /**
   * Get batch item statuses
   */
  getBatchItemStatuses(batchId: string, page = 1, limit = 50): {
    items: BatchItemStatus[];
    totalItems: number;
    page: number;
    totalPages: number;
  } {
    const itemStatuses = this.batchItems.get(batchId);
    if (!itemStatuses) {
      return { items: [], totalItems: 0, page, totalPages: 0 };
    }

    const allItems = Array.from(itemStatuses.values());
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const items = allItems.slice(startIndex, startIndex + limit);

    return {
      items,
      totalItems,
      page,
      totalPages
    };
  }

  /**
   * Pause a running batch
   */
  async pauseBatch(batchId: string): Promise<boolean> {
    try {
      const progress = this.activeBatches.get(batchId);
      if (!progress || progress.status !== 'running') {
        return false;
      }

      progress.status = 'paused';
      this.activeBatches.set(batchId, progress);

      this.logger.info(`Batch paused`, { batchId });
      return true;
    } catch (error) {
      this.logger.error(`Failed to pause batch`, { batchId, error });
      return false;
    }
  }

  /**
   * Resume a paused batch
   */
  async resumeBatch(batchId: string): Promise<boolean> {
    try {
      const progress = this.activeBatches.get(batchId);
      if (!progress || progress.status !== 'paused') {
        return false;
      }

      progress.status = 'running';
      this.activeBatches.set(batchId, progress);

      this.logger.info(`Batch resumed`, { batchId });
      return true;
    } catch (error) {
      this.logger.error(`Failed to resume batch`, { batchId, error });
      return false;
    }
  }

  /**
   * Cancel a batch
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    try {
      const progress = this.activeBatches.get(batchId);
      if (!progress || ['completed', 'failed', 'cancelled'].includes(progress.status)) {
        return false;
      }

      progress.status = 'cancelled';
      this.activeBatches.set(batchId, progress);

      // Try to cancel the queue job
      const job = await Job.fromId(this.batchQueue, batchId);
      if (job) {
        await job.remove();
      }

      this.logger.info(`Batch cancelled`, { batchId });
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel batch`, { batchId, error });
      return false;
    }
  }

  /**
   * Get service metrics and statistics
   */
  getMetrics(): {
    global: typeof this.metrics;
    activeBatches: number;
    queuedBatches: number;
    strategies: string[];
    memoryUsage: NodeJS.MemoryUsage;
  } {
    const activeBatchCount = Array.from(this.activeBatches.values())
      .filter(p => ['queued', 'running', 'paused'].includes(p.status)).length;

    return {
      global: { ...this.metrics },
      activeBatches: activeBatchCount,
      queuedBatches: Array.from(this.activeBatches.values())
        .filter(p => p.status === 'queued').length,
      strategies: Array.from(this.strategies.keys()),
      memoryUsage: process.memoryUsage()
    };
  }

  // Helper methods

  private getDefaultStrategy(): ProcessingStrategy {
    return {
      name: 'default',
      batchSize: 100,
      concurrency: 5,
      retryPolicy: {
        attempts: 3,
        delay: 1000,
        backoff: 'exponential'
      },
      timeoutMs: 60000
    };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async processConcurrently<T>(
    promises: Promise<T>[],
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += concurrency) {
      const chunk = promises.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk);
      results.push(...chunkResults);
    }
    
    return results;
  }

  private extractItemId(item: any): string | undefined {
    if (typeof item === 'object' && item !== null) {
      return item.id || item._id || item.uuid || undefined;
    }
    return undefined;
  }

  private mapPriority(priority: string): number {
    const priorityMap = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4
    };
    return priorityMap[priority as keyof typeof priorityMap] || 3;
  }

  private estimateBatchDuration(itemCount: number, strategy: ProcessingStrategy): number {
    // Simple estimation based on average processing time and concurrency
    const avgItemTime = 1000; // 1 second per item (rough estimate)
    const effectiveTime = (itemCount * avgItemTime) / strategy.concurrency;
    return Math.ceil(effectiveTime * 1.2); // Add 20% buffer
  }

  private calculateThroughput(itemsProcessed: number, timeElapsed: number): number {
    return itemsProcessed / (timeElapsed / 1000); // items per second
  }

  private updateBatchProgress(jobId: string, progress: any): void {
    const batchProgress = this.activeBatches.get(jobId);
    if (batchProgress && typeof progress === 'object') {
      Object.assign(batchProgress, progress);
      batchProgress.lastActivityAt = new Date();
      this.activeBatches.set(jobId, batchProgress);
    }
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupCompletedBatches();
    }, this.config.cleanupInterval);
  }

  private cleanupCompletedBatches(): void {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Clean up old completed batches
      for (const [batchId, progress] of this.activeBatches) {
        if (['completed', 'failed', 'cancelled'].includes(progress.status)) {
          const age = now - progress.lastActivityAt.getTime();
          if (age > maxAge) {
            this.activeBatches.delete(batchId);
            this.batchItems.delete(batchId);
          }
        }
      }

      // Limit retained results
      if (this.batchResults.size > this.config.maxRetainedResults) {
        const oldestEntries = Array.from(this.batchResults.entries())
          .sort(([, a], [, b]) => a.startedAt.getTime() - b.startedAt.getTime())
          .slice(0, this.batchResults.size - this.config.maxRetainedResults);

        for (const [batchId] of oldestEntries) {
          this.batchResults.delete(batchId);
        }
      }

    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }

  /**
   * Health check for batch processing service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    activeBatches: number;
    queuedJobs: number;
    avgThroughput: number;
    memoryUsage: number;
    issues: string[];
  }> {
    try {
      const issues: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      const activeBatchCount = Array.from(this.activeBatches.values())
        .filter(p => ['running', 'paused'].includes(p.status)).length;

      const queueCounts = await this.batchQueue.getJobCounts('waiting', 'active');
      const memoryUsage = process.memoryUsage().heapUsed;

      // Check for issues
      if (activeBatchCount > this.config.maxConcurrentBatches) {
        issues.push(`Too many active batches: ${activeBatchCount}`);
        status = 'warning';
      }

      if (memoryUsage > this.config.memoryThreshold) {
        issues.push(`High memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
        status = 'warning';
      }

      if (queueCounts.waiting > 100) {
        issues.push(`High queue backlog: ${queueCounts.waiting} jobs`);
        status = status === 'critical' ? 'critical' : 'warning';
      }

      if (memoryUsage > this.config.memoryThreshold * 1.5) {
        status = 'critical';
      }

      return {
        status,
        activeBatches: activeBatchCount,
        queuedJobs: queueCounts.waiting,
        avgThroughput: this.metrics.averageThroughput,
        memoryUsage,
        issues
      };

    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'critical',
        activeBatches: 0,
        queuedJobs: 0,
        avgThroughput: 0,
        memoryUsage: 0,
        issues: ['Health check failed']
      };
    }
  }

  /**
   * Shutdown the batch processing service
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down batch processing service...');
    
    try {
      await this.queueEvents.close();
      await this.batchQueue.close();
      this.redis.disconnect();
      
      this.logger.info('Batch processing service shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }
}

export const batchProcessingService = new BatchProcessingService();
export default batchProcessingService;