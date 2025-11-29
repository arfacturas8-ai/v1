import { FastifyInstance } from 'fastify';
import { PrismaClient, QueueStatus, NotificationPriority } from '@prisma/client';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  retryCount?: number;
  maxRetries?: number;
}

interface BulkNotificationJobData {
  notifications: NotificationJobData[];
  batchId: string;
}

/**
 * Notification Queue Service
 * Handles queuing, scheduling, and batch processing of notifications
 */
export class NotificationQueueService {
  private app: FastifyInstance;
  private prisma: PrismaClient;
  private redis: IORedis;
  private notificationQueue: Queue;
  private bulkNotificationQueue: Queue;
  private worker: Worker;
  private bulkWorker: Worker;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.prisma = (app as any).prisma;
    this.initializeRedis();
    this.initializeQueues();
    this.startWorkers();
    this.setupCleanupJobs();
  }

  private initializeRedis() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      lazyConnect: true,
    };

    this.redis = new IORedis(redisConfig);
    
    this.redis.on('error', (error) => {
      this.app.log.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.app.log.info('Connected to Redis for notification queue');
    });
  }

  private initializeQueues() {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
    };

    // Individual notification queue
    this.notificationQueue = new Queue('notifications', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Bulk notification queue for large batches
    this.bulkNotificationQueue = new Queue('bulk-notifications', {
      connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.app.log.info('Notification queues initialized');
  }

  private startWorkers() {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
    };

    // Worker for individual notifications
    this.worker = new Worker(
      'notifications',
      async (job: Job<NotificationJobData>) => {
        return await this.processNotificationJob(job);
      },
      {
        connection,
        concurrency: 5,
        limiter: {
          max: 100,
          duration: 60000, // 100 jobs per minute
        },
      }
    );

    // Worker for bulk notifications
    this.bulkWorker = new Worker(
      'bulk-notifications',
      async (job: Job<BulkNotificationJobData>) => {
        return await this.processBulkNotificationJob(job);
      },
      {
        connection,
        concurrency: 2,
        limiter: {
          max: 10,
          duration: 60000, // 10 bulk jobs per minute
        },
      }
    );

    // Event handlers
    this.worker.on('completed', (job) => {
      this.app.log.info(`Notification job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.app.log.error(`Notification job ${job?.id} failed:`, err);
    });

    this.bulkWorker.on('completed', (job) => {
      this.app.log.info(`Bulk notification job ${job.id} completed`);
    });

    this.bulkWorker.on('failed', (job, err) => {
      this.app.log.error(`Bulk notification job ${job?.id} failed:`, err);
    });

    this.app.log.info('Notification workers started');
  }

  private setupCleanupJobs() {
    // Schedule cleanup of old queue entries
    setInterval(async () => {
      await this.cleanupOldQueueEntries();
    }, 60 * 60 * 1000); // Run every hour

    // Schedule processing of scheduled notifications
    setInterval(async () => {
      await this.processScheduledNotifications();
    }, 60 * 1000); // Run every minute
  }

  /**
   * Queue a single notification
   */
  async queueNotification(notificationData: NotificationJobData, options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }) {
    try {
      // Create queue entry in database
      const queueEntry = await this.prisma.notificationQueue.create({
        data: {
          userId: notificationData.userId,
          type: notificationData.type as any,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
          priority: notificationData.priority || NotificationPriority.NORMAL,
          scheduledAt: notificationData.scheduledAt,
          status: notificationData.scheduledAt && notificationData.scheduledAt > new Date() 
            ? QueueStatus.SCHEDULED 
            : QueueStatus.PENDING,
          maxRetries: notificationData.maxRetries || 3,
        },
      });

      // Add to Bull queue if not scheduled for future
      if (!notificationData.scheduledAt || notificationData.scheduledAt <= new Date()) {
        const job = await this.notificationQueue.add(
          'process-notification',
          { ...notificationData, queueEntryId: queueEntry.id },
          {
            delay: options?.delay,
            priority: this.mapPriorityToNumber(notificationData.priority),
            attempts: options?.attempts || 3,
          }
        );

        // Update queue entry with job ID
        await this.prisma.notificationQueue.update({
          where: { id: queueEntry.id },
          data: { status: QueueStatus.PROCESSING },
        });

        return { success: true, queueEntryId: queueEntry.id, jobId: job.id };
      }

      return { success: true, queueEntryId: queueEntry.id, scheduled: true };
    } catch (error) {
      this.app.log.error('Error queuing notification:', error);
      throw new Error('Failed to queue notification');
    }
  }

  /**
   * Queue bulk notifications
   */
  async queueBulkNotifications(notifications: NotificationJobData[], options?: {
    batchSize?: number;
    delay?: number;
  }) {
    try {
      const batchSize = options?.batchSize || 50;
      const batchId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Split notifications into batches
      const batches = [];
      for (let i = 0; i < notifications.length; i += batchSize) {
        batches.push(notifications.slice(i, i + batchSize));
      }

      const jobs = [];
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const job = await this.bulkNotificationQueue.add(
          'process-bulk',
          {
            notifications: batch,
            batchId: `${batchId}-${i}`,
          },
          {
            delay: options?.delay,
            priority: 50, // Medium priority for bulk jobs
          }
        );
        jobs.push(job.id);
      }

      return { 
        success: true, 
        batchId, 
        totalBatches: batches.length,
        totalNotifications: notifications.length,
        jobIds: jobs 
      };
    } catch (error) {
      this.app.log.error('Error queuing bulk notifications:', error);
      throw new Error('Failed to queue bulk notifications');
    }
  }

  /**
   * Process a single notification job
   */
  private async processNotificationJob(job: Job<NotificationJobData & { queueEntryId?: string }>) {
    const { queueEntryId, ...notificationData } = job.data;

    try {
      // Update queue entry status
      if (queueEntryId) {
        await this.prisma.notificationQueue.update({
          where: { id: queueEntryId },
          data: { status: QueueStatus.PROCESSING },
        });
      }

      // Get the push notification service
      const pushService = (this.app as any).pushNotificationService;
      if (!pushService) {
        throw new Error('Push notification service not available');
      }

      // Send the notification
      const result = await pushService.sendNotification(notificationData);

      // Update queue entry status
      if (queueEntryId) {
        await this.prisma.notificationQueue.update({
          where: { id: queueEntryId },
          data: { 
            status: result.success ? QueueStatus.COMPLETED : QueueStatus.FAILED,
            processedAt: new Date(),
            error: result.success ? null : result.reason || 'Unknown error',
          },
        });
      }

      return result;
    } catch (error) {
      // Update queue entry with error
      if (queueEntryId) {
        await this.prisma.notificationQueue.update({
          where: { id: queueEntryId },
          data: { 
            status: QueueStatus.FAILED,
            processedAt: new Date(),
            error: String(error),
            retryCount: { increment: 1 },
          },
        });
      }

      this.app.log.error('Error processing notification job:', error);
      throw error;
    }
  }

  /**
   * Process a bulk notification job
   */
  private async processBulkNotificationJob(job: Job<BulkNotificationJobData>) {
    const { notifications, batchId } = job.data;

    try {
      this.app.log.info(`Processing bulk notification batch ${batchId} with ${notifications.length} notifications`);

      const results = [];
      for (const notification of notifications) {
        try {
          // Create individual queue entry
          const queueEntry = await this.prisma.notificationQueue.create({
            data: {
              userId: notification.userId,
              type: notification.type as any,
              title: notification.title,
              body: notification.body,
              data: notification.data,
              priority: notification.priority || NotificationPriority.NORMAL,
              status: QueueStatus.PROCESSING,
            },
          });

          // Process immediately
          const pushService = (this.app as any).pushNotificationService;
          const result = await pushService.sendNotification(notification);

          // Update queue entry
          await this.prisma.notificationQueue.update({
            where: { id: queueEntry.id },
            data: { 
              status: result.success ? QueueStatus.COMPLETED : QueueStatus.FAILED,
              processedAt: new Date(),
              error: result.success ? null : result.reason || 'Unknown error',
            },
          });

          results.push({ success: result.success, userId: notification.userId });
        } catch (error) {
          this.app.log.error(`Error processing notification for user ${notification.userId}:`, error);
          results.push({ success: false, userId: notification.userId, error: String(error) });
        }

        // Small delay between notifications to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      this.app.log.info(`Bulk batch ${batchId} completed: ${successful} successful, ${failed} failed`);
      
      return { batchId, total: notifications.length, successful, failed, results };
    } catch (error) {
      this.app.log.error(`Error processing bulk notification batch ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Process scheduled notifications that are due
   */
  private async processScheduledNotifications() {
    try {
      const dueNotifications = await this.prisma.notificationQueue.findMany({
        where: {
          status: QueueStatus.SCHEDULED,
          scheduledAt: {
            lte: new Date(),
          },
        },
        take: 100, // Process max 100 at a time
      });

      for (const notification of dueNotifications) {
        try {
          // Add to queue for immediate processing
          await this.notificationQueue.add(
            'process-notification',
            {
              userId: notification.userId,
              type: notification.type,
              title: notification.title,
              body: notification.body,
              data: notification.data,
              priority: notification.priority,
              queueEntryId: notification.id,
            },
            {
              priority: this.mapPriorityToNumber(notification.priority),
            }
          );

          // Update status to processing
          await this.prisma.notificationQueue.update({
            where: { id: notification.id },
            data: { status: QueueStatus.PROCESSING },
          });
        } catch (error) {
          this.app.log.error(`Error processing scheduled notification ${notification.id}:`, error);
        }
      }

      if (dueNotifications.length > 0) {
        this.app.log.info(`Processed ${dueNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      this.app.log.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Clean up old queue entries
   */
  private async cleanupOldQueueEntries() {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const deleted = await this.prisma.notificationQueue.deleteMany({
        where: {
          OR: [
            {
              status: QueueStatus.COMPLETED,
              processedAt: { lt: cutoffDate },
            },
            {
              status: QueueStatus.FAILED,
              retryCount: { gte: 3 },
              createdAt: { lt: cutoffDate },
            },
          ],
        },
      });

      if (deleted.count > 0) {
        this.app.log.info(`Cleaned up ${deleted.count} old queue entries`);
      }
    } catch (error) {
      this.app.log.error('Error cleaning up queue entries:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const [queueStats, bullStats] = await Promise.all([
        // Database queue stats
        this.prisma.notificationQueue.groupBy({
          by: ['status'],
          _count: true,
        }),
        // Bull queue stats
        Promise.all([
          this.notificationQueue.getWaiting(),
          this.notificationQueue.getActive(),
          this.notificationQueue.getCompleted(),
          this.notificationQueue.getFailed(),
        ]),
      ]);

      const [waiting, active, completed, failed] = bullStats;

      return {
        database: queueStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count;
          return acc;
        }, {} as Record<string, number>),
        queue: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
        },
      };
    } catch (error) {
      this.app.log.error('Error getting queue stats:', error);
      throw new Error('Failed to get queue stats');
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(maxAge?: number) {
    try {
      const cutoffDate = maxAge 
        ? new Date(Date.now() - maxAge * 60 * 60 * 1000)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default 24 hours

      const failedNotifications = await this.prisma.notificationQueue.findMany({
        where: {
          status: QueueStatus.FAILED,
          retryCount: { lt: 3 },
          createdAt: { gte: cutoffDate },
        },
        take: 50, // Limit retries
      });

      let retried = 0;
      for (const notification of failedNotifications) {
        try {
          await this.queueNotification({
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            data: notification.data as any,
            priority: notification.priority,
            retryCount: notification.retryCount + 1,
          });

          // Mark original as cancelled
          await this.prisma.notificationQueue.update({
            where: { id: notification.id },
            data: { status: QueueStatus.CANCELLED },
          });

          retried++;
        } catch (error) {
          this.app.log.error(`Error retrying notification ${notification.id}:`, error);
        }
      }

      return { retried, total: failedNotifications.length };
    } catch (error) {
      this.app.log.error('Error retrying failed notifications:', error);
      throw new Error('Failed to retry notifications');
    }
  }

  private mapPriorityToNumber(priority?: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 100;
      case NotificationPriority.HIGH:
        return 75;
      case NotificationPriority.NORMAL:
        return 50;
      case NotificationPriority.LOW:
        return 25;
      default:
        return 50;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      this.app.log.info('Shutting down notification queue service...');
      
      await Promise.all([
        this.worker.close(),
        this.bulkWorker.close(),
        this.notificationQueue.close(),
        this.bulkNotificationQueue.close(),
        this.redis.disconnect(),
      ]);

      this.app.log.info('Notification queue service shut down successfully');
    } catch (error) {
      this.app.log.error('Error shutting down notification queue service:', error);
    }
  }
}

export function createNotificationQueueService(app: FastifyInstance) {
  return new NotificationQueueService(app);
}