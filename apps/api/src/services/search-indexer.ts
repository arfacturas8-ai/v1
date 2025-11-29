import { Queue, Job } from 'bullmq';
import { CrashProofElasticsearchService } from './crash-proof-elasticsearch';
import { prisma } from '@cryb/database';
import { logger } from '../utils/logger';
import EventEmitter from 'events';

interface IndexingJob {
  type: 'message' | 'user' | 'server' | 'community' | 'bulk_messages';
  action: 'create' | 'update' | 'delete';
  id: string;
  data?: any;
  priority?: number;
  delay?: number;
  attempts?: number;
}

interface BulkIndexingJob {
  type: 'bulk_messages';
  messages: Array<{
    id: string;
    content: string;
    metadata: any;
  }>;
  batchSize?: number;
}

interface IndexingMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  retriedJobs: number;
  averageProcessingTime: number;
  lastProcessedAt: Date | null;
  queueSize: number;
}

export class SearchIndexingService extends EventEmitter {
  private queue: Queue;
  private elasticsearch: CrashProofElasticsearchService;
  private isProcessing = false;
  private metrics: IndexingMetrics = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    retriedJobs: 0,
    averageProcessingTime: 0,
    lastProcessedAt: null,
    queueSize: 0
  };
  private processingTimes: number[] = [];
  private maxProcessingTimesSamples = 100;

  constructor(
    elasticsearch: CrashProofElasticsearchService,
    redisConnection: any
  ) {
    super();
    this.elasticsearch = elasticsearch;
    
    // Create indexing queue with retry logic
    this.queue = new Queue('search-indexing', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      }
    });

    this.setupJobProcessors();
    this.setupEventHandlers();
    this.startMetricsCollection();
  }

  private setupJobProcessors(): void {
    // Process indexing jobs
    this.queue.process('index-content', 10, async (job: Job) => {
      return this.processIndexingJob(job);
    });

    // Process bulk indexing jobs
    this.queue.process('bulk-index', 5, async (job: Job) => {
      return this.processBulkIndexingJob(job);
    });

    // Process deletion jobs
    this.queue.process('delete-content', 20, async (job: Job) => {
      return this.processDeletionJob(job);
    });
  }

  private setupEventHandlers(): void {
    this.queue.on('completed', (job: Job, result: any) => {
      this.metrics.successfulJobs++;
      this.metrics.lastProcessedAt = new Date();
      this.updateProcessingTime(job);
      
      logger.debug('Indexing job completed', {
        jobId: job.id,
        type: job.data.type,
        processingTime: Date.now() - job.processedOn!
      });
    });

    this.queue.on('failed', (job: Job, err: Error) => {
      this.metrics.failedJobs++;
      
      logger.error('Indexing job failed', {
        jobId: job.id,
        type: job.data.type,
        error: err.message,
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts
      });

      this.emit('indexing_failed', {
        job: job.data,
        error: err,
        attemptsMade: job.attemptsMade
      });
    });

    this.queue.on('retries-exhausted', (job: Job, err: Error) => {
      logger.error('Indexing job exhausted all retries', {
        jobId: job.id,
        type: job.data.type,
        error: err.message,
        totalAttempts: job.attemptsMade
      });

      this.emit('indexing_exhausted', {
        job: job.data,
        error: err
      });
    });

    // Listen for Elasticsearch events
    this.elasticsearch.on('circuit_breaker_opened', () => {
      logger.warn('Elasticsearch circuit breaker opened - pausing indexing');
      this.pauseIndexing();
    });

    this.elasticsearch.on('reconnected', () => {
      logger.info('Elasticsearch reconnected - resuming indexing');
      this.resumeIndexing();
    });
  }

  /**
   * Index a single message
   */
  async indexMessage(messageId: string, priority: number = 0, delay: number = 0): Promise<void> {
    try {
      await this.queue.add('index-content', {
        type: 'message',
        action: 'create',
        id: messageId,
        priority,
        delay
      }, {
        priority: -priority, // BullMQ uses negative priorities (higher number = higher priority)
        delay
      });

      this.metrics.totalJobs++;
      this.updateQueueSize();
      
      logger.debug('Message indexing job queued', { messageId, priority, delay });
    } catch (error) {
      logger.error('Failed to queue message for indexing:', error);
      throw error;
    }
  }

  /**
   * Index multiple messages in bulk
   */
  async indexMessagesInBulk(messageIds: string[], batchSize: number = 50): Promise<void> {
    try {
      // Split into batches
      const batches = this.chunkArray(messageIds, batchSize);
      
      for (const [index, batch] of batches.entries()) {
        await this.queue.add('bulk-index', {
          type: 'bulk_messages',
          messageIds: batch,
          batchSize,
          batchNumber: index + 1,
          totalBatches: batches.length
        }, {
          delay: index * 1000 // Stagger bulk operations
        });

        this.metrics.totalJobs++;
      }

      this.updateQueueSize();
      
      logger.info('Bulk indexing jobs queued', {
        totalMessages: messageIds.length,
        batches: batches.length,
        batchSize
      });
    } catch (error) {
      logger.error('Failed to queue bulk indexing:', error);
      throw error;
    }
  }

  /**
   * Update indexed content
   */
  async updateIndexedContent(type: 'message' | 'user' | 'server', id: string, priority: number = 0): Promise<void> {
    try {
      await this.queue.add('index-content', {
        type,
        action: 'update',
        id,
        priority
      }, {
        priority: -priority
      });

      this.metrics.totalJobs++;
      this.updateQueueSize();
      
      logger.debug('Content update job queued', { type, id, priority });
    } catch (error) {
      logger.error('Failed to queue content update:', error);
      throw error;
    }
  }

  /**
   * Delete content from index
   */
  async deleteFromIndex(type: 'message' | 'user' | 'server', id: string, priority: number = 10): Promise<void> {
    try {
      await this.queue.add('delete-content', {
        type,
        action: 'delete',
        id,
        priority
      }, {
        priority: -priority
      });

      this.metrics.totalJobs++;
      this.updateQueueSize();
      
      logger.debug('Content deletion job queued', { type, id, priority });
    } catch (error) {
      logger.error('Failed to queue content deletion:', error);
      throw error;
    }
  }

  /**
   * Process individual indexing job
   */
  private async processIndexingJob(job: Job): Promise<any> {
    const startTime = Date.now();
    const { type, action, id } = job.data;

    try {
      switch (type) {
        case 'message':
          return await this.indexSingleMessage(id, action);
        case 'user':
          return await this.indexUser(id, action);
        case 'server':
          return await this.indexServer(id, action);
        default:
          throw new Error(`Unknown indexing type: ${type}`);
      }
    } finally {
      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);
    }
  }

  /**
   * Process bulk indexing job
   */
  private async processBulkIndexingJob(job: Job): Promise<any> {
    const startTime = Date.now();
    const { messageIds, batchNumber, totalBatches } = job.data;

    try {
      logger.info('Processing bulk indexing batch', {
        batchNumber,
        totalBatches,
        batchSize: messageIds.length
      });

      // Fetch messages from database
      const messages = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          channel: {
            select: {
              id: true,
              name: true,
              serverId: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              contentType: true,
              size: true
            }
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      });

      if (messages.length === 0) {
        logger.warn('No messages found for bulk indexing', { messageIds });
        return { indexed: 0, skipped: messageIds.length };
      }

      // Prepare bulk indexing data
      const bulkData = messages.map(message => ({
        id: message.id,
        content: message.content,
        metadata: {
          author: {
            id: message.user.id,
            username: message.user.username,
            displayName: message.user.displayName
          },
          channel: {
            id: message.channel.id,
            name: message.channel.name,
            serverId: message.channel.serverId
          },
          timestamp: message.createdAt.toISOString(),
          attachments: message.attachments || [],
          mentions: (message.mentions || []).map(m => ({
            userId: m.user.id,
            username: m.user.username
          }))
        }
      }));

      // Index in Elasticsearch
      const success = await this.elasticsearch.indexBulkMessages(bulkData);

      const result = {
        indexed: success ? messages.length : 0,
        skipped: success ? 0 : messages.length,
        batchNumber,
        totalBatches
      };

      logger.info('Bulk indexing batch completed', result);
      
      return result;
    } finally {
      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);
    }
  }

  /**
   * Process deletion job
   */
  private async processDeletionJob(job: Job): Promise<any> {
    const { type, id } = job.data;

    try {
      const indexName = this.getIndexName(type);
      
      // Delete from Elasticsearch
      await this.elasticsearch.deleteDocument(indexName, id);
      
      logger.info(`Deleted ${type} from index`, { type, id, indexName });
      return { deleted: true, id, type };
    } catch (error) {
      logger.error('Deletion job failed', { type, id, error });
      throw error;
    }
  }

  /**
   * Index a single message
   */
  private async indexSingleMessage(messageId: string, action: string): Promise<any> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          channel: {
            select: {
              id: true,
              name: true,
              serverId: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              contentType: true,
              size: true
            }
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      });

      if (!message) {
        logger.warn('Message not found for indexing', { messageId });
        return { indexed: false, reason: 'not_found' };
      }

      const metadata = {
        author: {
          id: message.user.id,
          username: message.user.username,
          displayName: message.user.displayName
        },
        channel: {
          id: message.channel.id,
          name: message.channel.name,
          serverId: message.channel.serverId
        },
        timestamp: message.createdAt.toISOString(),
        attachments: message.attachments || [],
        mentions: (message.mentions || []).map(m => ({
          userId: m.user.id,
          username: m.user.username
        }))
      };

      const success = await this.elasticsearch.indexMessage(messageId, message.content, metadata);
      
      return { 
        indexed: success, 
        messageId,
        action 
      };
    } catch (error) {
      logger.error('Failed to index single message', { messageId, error });
      throw error;
    }
  }

  /**
   * Index user content (placeholder)
   */
  private async indexUser(userId: string, action: string): Promise<any> {
    // TODO: Implement user indexing if needed
    logger.info('User indexing requested', { userId, action });
    return { indexed: true, userId, action };
  }

  /**
   * Index server content (placeholder)
   */
  private async indexServer(serverId: string, action: string): Promise<any> {
    // TODO: Implement server indexing if needed
    logger.info('Server indexing requested', { serverId, action });
    return { indexed: true, serverId, action };
  }

  /**
   * Reindex all messages from a date range
   */
  async reindexMessages(fromDate: Date, toDate: Date = new Date(), batchSize: number = 1000): Promise<void> {
    try {
      logger.info('Starting message reindexing', {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        batchSize
      });

      let skip = 0;
      let totalProcessed = 0;

      while (true) {
        const messages = await prisma.message.findMany({
          where: {
            createdAt: {
              gte: fromDate,
              lte: toDate
            }
          },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
          skip,
          take: batchSize
        });

        if (messages.length === 0) break;

        const messageIds = messages.map(m => m.id);
        await this.indexMessagesInBulk(messageIds, 100);

        totalProcessed += messages.length;
        skip += batchSize;

        logger.info('Reindexing progress', {
          processed: totalProcessed,
          batchSize: messages.length
        });

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info('Message reindexing completed', {
        totalProcessed,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      });

      this.emit('reindexing_completed', {
        totalProcessed,
        fromDate,
        toDate
      });
    } catch (error) {
      logger.error('Message reindexing failed', error);
      this.emit('reindexing_failed', error);
      throw error;
    }
  }

  /**
   * Pause indexing (for maintenance or when Elasticsearch is down)
   */
  async pauseIndexing(): Promise<void> {
    try {
      await this.queue.pause();
      this.isProcessing = false;
      logger.info('Search indexing paused');
      this.emit('indexing_paused');
    } catch (error) {
      logger.error('Failed to pause indexing:', error);
      throw error;
    }
  }

  /**
   * Resume indexing
   */
  async resumeIndexing(): Promise<void> {
    try {
      await this.queue.resume();
      this.isProcessing = true;
      logger.info('Search indexing resumed');
      this.emit('indexing_resumed');
    } catch (error) {
      logger.error('Failed to resume indexing:', error);
      throw error;
    }
  }

  /**
   * Get indexing metrics
   */
  getMetrics(): IndexingMetrics {
    return {
      ...this.metrics,
      queueSize: this.metrics.queueSize
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        total: 0
      };
    }
  }

  /**
   * Utility methods
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    if (this.processingTimes.length > this.maxProcessingTimesSamples) {
      this.processingTimes.shift();
    }
    
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  private updateProcessingTime(job: Job): void {
    if (job.processedOn && job.finishedOn) {
      const processingTime = job.finishedOn - job.processedOn;
      this.recordProcessingTime(processingTime);
    }
  }

  private async updateQueueSize(): Promise<void> {
    try {
      const stats = await this.getQueueStats();
      this.metrics.queueSize = stats.waiting + stats.active;
    } catch (error) {
      // Ignore errors when updating queue size
    }
  }

  private startMetricsCollection(): void {
    // Update queue size every 30 seconds
    setInterval(async () => {
      await this.updateQueueSize();
    }, 30000);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.queue.close();
      logger.info('Search indexing service cleaned up');
    } catch (error) {
      logger.error('Error cleaning up search indexing service:', error);
    }
  }
}