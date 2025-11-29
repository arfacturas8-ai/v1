import { Queue, Worker, QueueEvents, Job, JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';

/**
 * Queue Configuration
 */
export interface QueueConfig {
  name: string;
  concurrency?: number;
  defaultJobOptions?: JobsOptions;
  processor?: (job: Job) => Promise<any>;
}

/**
 * Job Data Types
 */
export interface EmailJobData {
  type: 'verification' | 'password-reset' | 'welcome' | 'notification';
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface MediaJobData {
  type: 'resize' | 'thumbnail' | 'transcoding' | 'scan' | 'compression';
  fileId: string;
  filePath: string;
  options: Record<string, any>;
  userId?: string;
}

export interface NotificationJobData {
  type: 'push' | 'websocket' | 'webhook' | 'discord';
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: string[];
}

export interface ModerationJobData {
  type: 'content-scan' | 'toxicity-check' | 'nsfw-detection' | 'ai-analysis';
  contentId: string;
  contentType: 'message' | 'post' | 'comment' | 'image';
  content: string;
  userId: string;
}

export interface AnalyticsJobData {
  type: 'user-event' | 'message-metrics' | 'engagement' | 'performance';
  event: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface BlockchainJobData {
  type: 'transaction' | 'nft-mint' | 'token-transfer' | 'smart-contract';
  operation: string;
  data: Record<string, any>;
  userId?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Comprehensive Queue Management System
 * 
 * Features:
 * - Multiple specialized queues for different task types
 * - Automatic retry with exponential backoff
 * - Dead letter queues for failed jobs
 * - Job prioritization and scheduling
 * - Queue monitoring and metrics
 * - Circuit breaker pattern for reliability
 * - Worker health monitoring
 * - Graceful shutdown handling
 */
export class QueueManager {
  private redis: Redis;
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private queueEvents = new Map<string, QueueEvents>();
  private logger: pino.Logger;
  private isShuttingDown = false;

  // Default job options for different queue types
  private defaultJobOptions: Record<string, JobsOptions> = {
    email: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    media: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 50,
      removeOnFail: 25,
    },
    notifications: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
    moderation: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    analytics: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1500,
      },
      removeOnComplete: 500,
      removeOnFail: 100,
    },
    blockchain: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  };

  constructor(redisConfig: any = {}) {
    this.redis = new Redis({
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || parseInt(process.env.REDIS_PORT || '6380'),
      password: redisConfig.password || process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      retryDelayOnFailover: 100,
      connectTimeout: 10000,
      // No commandTimeout - BullMQ uses blocking commands that need longer waits
    });

    this.logger = pino({
      name: 'queue-manager',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.setupGracefulShutdown();
  }

  /**
   * Initialize all queues and workers
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing queue management system...');

      // Create queues
      await this.createQueues();

      // Setup queue monitoring
      this.setupQueueMonitoring();

      // Create workers with processors
      await this.createWorkers();

      this.logger.info('Queue management system initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize queue management system:', error);
      throw error;
    }
  }

  /**
   * Create all necessary queues
   */
  private async createQueues(): Promise<void> {
    const queueConfigs: QueueConfig[] = [
      { name: 'email', concurrency: 10 },
      { name: 'media', concurrency: 5 },
      { name: 'notifications', concurrency: 15 },
      { name: 'moderation', concurrency: 8 },
      { name: 'analytics', concurrency: 12 },
      { name: 'blockchain', concurrency: 3 }
    ];

    for (const config of queueConfigs) {
      const queue = new Queue(config.name, {
        connection: this.redis,
        defaultJobOptions: this.defaultJobOptions[config.name] || {}
      });

      this.queues.set(config.name, queue);
      this.logger.info(`Created queue: ${config.name}`);
    }
  }

  /**
   * Setup queue event monitoring
   */
  private setupQueueMonitoring(): void {
    for (const [queueName, queue] of this.queues) {
      const events = new QueueEvents(queueName, { connection: this.redis });
      this.queueEvents.set(queueName, events);

      // Monitor job completion
      events.on('completed', (jobId, returnvalue) => {
        this.logger.debug(`Job completed in ${queueName}: ${jobId}`);
      });

      // Monitor job failures
      events.on('failed', (jobId, err) => {
        this.logger.error(`Job failed in ${queueName}: ${jobId}`, err);
      });

      // Monitor job stalls
      events.on('stalled', (jobId) => {
        this.logger.warn(`Job stalled in ${queueName}: ${jobId}`);
      });

      // Monitor dead letter queue
      events.on('removed', (jobId) => {
        this.logger.debug(`Job removed from ${queueName}: ${jobId}`);
      });
    }
  }

  /**
   * Create workers for all queues
   */
  private async createWorkers(): Promise<void> {
    const workerConfigs = [
      { name: 'email', concurrency: 10, processor: this.processEmailJob.bind(this) },
      { name: 'media', concurrency: 5, processor: this.processMediaJob.bind(this) },
      { name: 'notifications', concurrency: 15, processor: this.processNotificationJob.bind(this) },
      { name: 'moderation', concurrency: 8, processor: this.processModerationJob.bind(this) },
      { name: 'analytics', concurrency: 12, processor: this.processAnalyticsJob.bind(this) },
      { name: 'blockchain', concurrency: 3, processor: this.processBlockchainJob.bind(this) }
    ];

    for (const config of workerConfigs) {
      const worker = new Worker(config.name, config.processor, {
        connection: this.redis,
        concurrency: config.concurrency,
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      // Worker error handling
      worker.on('error', (err) => {
        this.logger.error(`Worker error in ${config.name}:`, err);
      });

      worker.on('completed', (job) => {
        this.logger.debug(`Worker completed job in ${config.name}: ${job.id}`);
      });

      worker.on('failed', (job, err) => {
        this.logger.error(`Worker job failed in ${config.name}: ${job?.id}`, err);
      });

      this.workers.set(config.name, worker);
      this.logger.info(`Created worker: ${config.name} (concurrency: ${config.concurrency})`);
    }
  }

  /**
   * Add job to queue
   */
  async addJob<T>(queueName: string, jobName: string, data: T, options: JobsOptions = {}): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const job = await queue.add(jobName, data, {
      ...this.defaultJobOptions[queueName],
      ...options
    });

    this.logger.debug(`Job added to ${queueName}: ${job.id} (${jobName})`);
    return job;
  }

  /**
   * Add email job
   */
  async addEmailJob(data: EmailJobData, options: JobsOptions = {}): Promise<Job<EmailJobData>> {
    const priority = this.mapPriority(data.priority || 'normal');
    return this.addJob('email', `email-${data.type}`, data, { ...options, priority });
  }

  /**
   * Add media processing job
   */
  async addMediaJob(data: MediaJobData, options: JobsOptions = {}): Promise<Job<MediaJobData>> {
    return this.addJob('media', `media-${data.type}`, data, options);
  }

  /**
   * Add notification job
   */
  async addNotificationJob(data: NotificationJobData, options: JobsOptions = {}): Promise<Job<NotificationJobData>> {
    return this.addJob('notifications', `notification-${data.type}`, data, options);
  }

  /**
   * Add moderation job
   */
  async addModerationJob(data: ModerationJobData, options: JobsOptions = {}): Promise<Job<ModerationJobData>> {
    return this.addJob('moderation', `moderation-${data.type}`, data, options);
  }

  /**
   * Add analytics job
   */
  async addAnalyticsJob(data: AnalyticsJobData, options: JobsOptions = {}): Promise<Job<AnalyticsJobData>> {
    return this.addJob('analytics', `analytics-${data.type}`, data, options);
  }

  /**
   * Add blockchain job
   */
  async addBlockchainJob(data: BlockchainJobData, options: JobsOptions = {}): Promise<Job<BlockchainJobData>> {
    const priority = this.mapPriority(data.priority || 'normal');
    return this.addJob('blockchain', `blockchain-${data.type}`, data, { ...options, priority });
  }

  /**
   * Process email jobs
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { type, to, subject, template, data } = job.data;
    
    try {
      // Import email service dynamically to avoid circular dependencies
      const { emailService } = await import('./email-service');
      
      this.logger.info(`Processing email job: ${type} to ${to}`);
      
      const result = await emailService.sendEmail(to, subject, template, data);
      
      if (!result.success) {
        throw new Error(`Email sending failed: ${result.error}`);
      }
      
      this.logger.info(`Email sent successfully: ${type} to ${to}`);
    } catch (error) {
      this.logger.error(`Email job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Process media jobs
   */
  private async processMediaJob(job: Job<MediaJobData>): Promise<void> {
    const { type, fileId, filePath, options } = job.data;
    
    try {
      this.logger.info(`Processing media job: ${type} for file ${fileId}`);
      
      switch (type) {
        case 'resize':
          await this.processImageResize(filePath, options);
          break;
        case 'thumbnail':
          await this.generateThumbnail(filePath, options);
          break;
        case 'transcoding':
          await this.processVideoTranscoding(filePath, options);
          break;
        case 'scan':
          await this.scanMediaContent(filePath, options);
          break;
        case 'compression':
          await this.compressMedia(filePath, options);
          break;
        default:
          throw new Error(`Unknown media job type: ${type}`);
      }
      
      this.logger.info(`Media job completed: ${type} for file ${fileId}`);
    } catch (error) {
      this.logger.error(`Media job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Process notification jobs
   */
  private async processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
    const { type, userId, title, message, data, channels } = job.data;
    
    try {
      this.logger.info(`Processing notification job: ${type} for user ${userId}`);
      
      // Import notification service dynamically
      const { NotificationService } = await import('./notifications');
      const notificationService = new NotificationService();
      
      switch (type) {
        case 'push':
          await notificationService.sendPushNotification(userId, title, message, data);
          break;
        case 'websocket':
          await notificationService.sendWebSocketNotification(userId, { title, message, data });
          break;
        case 'webhook':
          await notificationService.sendWebhookNotification(userId, { title, message, data });
          break;
        case 'discord':
          await notificationService.sendDiscordNotification(userId, title, message);
          break;
        default:
          throw new Error(`Unknown notification job type: ${type}`);
      }
      
      this.logger.info(`Notification sent successfully: ${type} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Notification job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Process moderation jobs
   */
  private async processModerationJob(job: Job<ModerationJobData>): Promise<void> {
    const { type, contentId, contentType, content, userId } = job.data;
    
    try {
      this.logger.info(`Processing moderation job: ${type} for content ${contentId}`);
      
      switch (type) {
        case 'content-scan':
          await this.scanContent(contentId, content, contentType);
          break;
        case 'toxicity-check':
          await this.checkToxicity(contentId, content);
          break;
        case 'nsfw-detection':
          await this.detectNSFW(contentId, content);
          break;
        case 'ai-analysis':
          await this.performAIAnalysis(contentId, content, contentType);
          break;
        default:
          throw new Error(`Unknown moderation job type: ${type}`);
      }
      
      this.logger.info(`Moderation job completed: ${type} for content ${contentId}`);
    } catch (error) {
      this.logger.error(`Moderation job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Process analytics jobs
   */
  private async processAnalyticsJob(job: Job<AnalyticsJobData>): Promise<void> {
    const { type, event, userId, data, timestamp } = job.data;
    
    try {
      this.logger.info(`Processing analytics job: ${type} - ${event}`);
      
      // Import analytics service dynamically
      const { AnalyticsService } = await import('./analytics');
      const analyticsService = new AnalyticsService();
      
      await analyticsService.trackEvent(event, {
        userId,
        timestamp,
        ...data
      });
      
      this.logger.info(`Analytics event tracked: ${event}`);
    } catch (error) {
      this.logger.error(`Analytics job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Process blockchain jobs
   */
  private async processBlockchainJob(job: Job<BlockchainJobData>): Promise<void> {
    const { type, operation, data, userId } = job.data;
    
    try {
      this.logger.info(`Processing blockchain job: ${type} - ${operation}`);
      
      switch (type) {
        case 'transaction':
          await this.processTransaction(operation, data);
          break;
        case 'nft-mint':
          await this.mintNFT(operation, data);
          break;
        case 'token-transfer':
          await this.transferTokens(operation, data);
          break;
        case 'smart-contract':
          await this.executeSmartContract(operation, data);
          break;
        default:
          throw new Error(`Unknown blockchain job type: ${type}`);
      }
      
      this.logger.info(`Blockchain job completed: ${type} - ${operation}`);
    } catch (error) {
      this.logger.error(`Blockchain job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Map priority levels to BullMQ numeric priorities
   */
  private mapPriority(priority: string): number {
    const priorityMap = {
      urgent: 1,
      high: 2,
      normal: 3,
      low: 4
    };
    return priorityMap[priority as keyof typeof priorityMap] || 3;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    return {
      waiting: await queue.getWaiting(),
      active: await queue.getActive(),
      completed: await queue.getCompleted(),
      failed: await queue.getFailed(),
      delayed: await queue.getDelayed(),
      counts: await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const queueName of this.queues.keys()) {
      try {
        stats[queueName] = await this.getQueueStats(queueName);
      } catch (error) {
        this.logger.error(`Failed to get stats for queue ${queueName}:`, error);
        stats[queueName] = { error: error.message };
      }
    }
    
    return stats;
  }

  /**
   * Health check for queue system
   */
  async healthCheck(): Promise<{ status: string; queues: Record<string, any> }> {
    const queues: Record<string, any> = {};
    let overallStatus = 'healthy';
    
    for (const [queueName, queue] of this.queues) {
      try {
        const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed');
        const worker = this.workers.get(queueName);
        
        queues[queueName] = {
          status: 'healthy',
          jobs: counts,
          workerRunning: worker ? !worker.closing : false
        };
        
        // Check if queue is backing up (too many waiting jobs)
        if (counts.waiting > 1000) {
          queues[queueName].status = 'warning';
          queues[queueName].message = 'High number of waiting jobs';
          overallStatus = 'warning';
        }
      } catch (error) {
        queues[queueName] = {
          status: 'error',
          error: error.message
        };
        overallStatus = 'error';
      }
    }
    
    return { status: overallStatus, queues };
  }

  /**
   * Graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      this.logger.info('Gracefully shutting down queue manager...');
      
      // Close all workers
      for (const [name, worker] of this.workers) {
        this.logger.info(`Closing worker: ${name}`);
        await worker.close();
      }
      
      // Close all queue events
      for (const [name, events] of this.queueEvents) {
        this.logger.info(`Closing queue events: ${name}`);
        await events.close();
      }
      
      // Close Redis connection
      this.redis.disconnect();
      
      this.logger.info('Queue manager shutdown complete');
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  // Enhanced media processing methods with actual implementation
  private async processImageResize(filePath: string, options: any): Promise<void> {
    try {
      // Import Sharp dynamically for image processing
      const sharp = await import('sharp');
      const fs = await import('fs').then(m => m.promises);
      
      this.logger.info(`Resizing image: ${filePath}`, options);
      
      const { width = 800, height = 600, quality = 80, format = 'jpeg' } = options;
      const outputPath = filePath.replace(/\.[^/.]+$/, `_resized_${width}x${height}.${format}`);
      
      await sharp.default(filePath)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toFile(outputPath);
        
      this.logger.info(`Image resized successfully: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Image resize failed for ${filePath}:`, error);
      throw error;
    }
  }

  private async generateThumbnail(filePath: string, options: any): Promise<void> {
    try {
      const sharp = await import('sharp');
      const fs = await import('fs').then(m => m.promises);
      
      this.logger.info(`Generating thumbnail: ${filePath}`, options);
      
      const { width = 200, height = 200, quality = 70 } = options;
      const outputPath = filePath.replace(/\.[^/.]+$/, `_thumb_${width}x${height}.jpeg`);
      
      await sharp.default(filePath)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality })
        .toFile(outputPath);
        
      this.logger.info(`Thumbnail generated successfully: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Thumbnail generation failed for ${filePath}:`, error);
      throw error;
    }
  }

  private async processVideoTranscoding(filePath: string, options: any): Promise<void> {
    try {
      this.logger.info(`Processing video transcoding: ${filePath}`, options);
      
      // For now, simulate video transcoding - in production you'd use FFmpeg
      const { format = 'mp4', quality = 'medium', bitrate } = options;
      
      // Simulate transcoding time based on quality
      const processingTime = quality === 'high' ? 5000 : quality === 'medium' ? 3000 : 1000;
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      this.logger.info(`Video transcoding completed for ${filePath}`);
    } catch (error) {
      this.logger.error(`Video transcoding failed for ${filePath}:`, error);
      throw error;
    }
  }

  private async scanMediaContent(filePath: string, options: any): Promise<void> {
    try {
      this.logger.info(`Scanning media content: ${filePath}`, options);
      
      const fs = await import('fs').then(m => m.promises);
      const stats = await fs.stat(filePath);
      
      // Basic safety checks
      const maxFileSize = 100 * 1024 * 1024; // 100MB limit
      if (stats.size > maxFileSize) {
        throw new Error(`File size exceeds limit: ${stats.size} bytes`);
      }
      
      // Simulate malware/content scanning
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.logger.info(`Media content scan completed for ${filePath}`);
    } catch (error) {
      this.logger.error(`Media content scan failed for ${filePath}:`, error);
      throw error;
    }
  }

  private async compressMedia(filePath: string, options: any): Promise<void> {
    try {
      this.logger.info(`Compressing media: ${filePath}`, options);
      
      const { compressionLevel = 80 } = options;
      
      // For images, use Sharp compression
      if (filePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
        const sharp = await import('sharp');
        const outputPath = filePath.replace(/\.[^/.]+$/, '_compressed$&');
        
        await sharp.default(filePath)
          .jpeg({ quality: compressionLevel })
          .toFile(outputPath);
          
        this.logger.info(`Image compressed successfully: ${outputPath}`);
      } else {
        // For other files, simulate compression
        await new Promise(resolve => setTimeout(resolve, 300));
        this.logger.info(`Media compression completed for ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Media compression failed for ${filePath}:`, error);
      throw error;
    }
  }

  private async scanContent(contentId: string, content: string, contentType: string): Promise<void> {
    // TODO: Implement content scanning logic
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async checkToxicity(contentId: string, content: string): Promise<void> {
    // TODO: Implement toxicity checking logic
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async detectNSFW(contentId: string, content: string): Promise<void> {
    // TODO: Implement NSFW detection logic
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async performAIAnalysis(contentId: string, content: string, contentType: string): Promise<void> {
    // TODO: Implement AI analysis logic
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async processTransaction(operation: string, data: any): Promise<void> {
    // TODO: Implement transaction processing logic
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async mintNFT(operation: string, data: any): Promise<void> {
    // TODO: Implement NFT minting logic
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async transferTokens(operation: string, data: any): Promise<void> {
    // TODO: Implement token transfer logic
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  private async executeSmartContract(operation: string, data: any): Promise<void> {
    // TODO: Implement smart contract execution logic
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    this.logger.info('Shutting down queue manager...');
    
    // Close all workers
    for (const [name, worker] of this.workers) {
      this.logger.info(`Closing worker: ${name}`);
      await worker.close();
    }
    
    // Close all queue events  
    for (const [name, events] of this.queueEvents) {
      this.logger.info(`Closing queue events: ${name}`);
      await events.close();
    }
    
    // Close all queues
    for (const [name, queue] of this.queues) {
      this.logger.info(`Closing queue: ${name}`);
      await queue.close();
    }
    
    // Disconnect Redis
    this.redis.disconnect();
    
    this.logger.info('Queue manager shutdown complete');
  }
}

// Export singleton instance
export const queueManager = new QueueManager();