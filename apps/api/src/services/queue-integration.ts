import { queueManager } from './queue-manager';
import { queueMonitoringService } from './queue-monitoring';
import pino from 'pino';

/**
 * Queue Integration Service
 * 
 * Provides high-level methods for integrating queue functionality
 * throughout the application. This service acts as a facade for
 * the queue system, making it easier to add jobs from various
 * parts of the application.
 */

const logger = pino({ name: 'queue-integration' });

/**
 * Email Integration
 */
export class EmailQueueIntegration {
  /**
   * Send verification email
   */
  static async sendVerificationEmail(
    email: string,
    username: string,
    verificationToken: string
  ): Promise<void> {
    try {
      await queueManager.addEmailJob({
        type: 'verification',
        to: email,
        subject: 'Verify Your Email - CRYB',
        template: 'verification',
        data: {
          username,
          verificationToken,
          verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`,
          expirationHours: 24,
          year: new Date().getFullYear()
        },
        priority: 'high'
      });
      
      logger.info(`Verification email queued for ${email}`);
    } catch (error) {
      logger.error(`Failed to queue verification email for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string
  ): Promise<void> {
    try {
      await queueManager.addEmailJob({
        type: 'password-reset',
        to: email,
        subject: 'Reset Your Password - CRYB',
        template: 'password-reset',
        data: {
          username,
          resetToken,
          resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
          expirationHours: 1,
          year: new Date().getFullYear()
        },
        priority: 'urgent'
      });
      
      logger.info(`Password reset email queued for ${email}`);
    } catch (error) {
      logger.error(`Failed to queue password reset email for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email: string, username: string): Promise<void> {
    try {
      await queueManager.addEmailJob({
        type: 'welcome',
        to: email,
        subject: 'Welcome to CRYB!',
        template: 'welcome',
        data: {
          username,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          year: new Date().getFullYear()
        },
        priority: 'normal'
      });
      
      logger.info(`Welcome email queued for ${email}`);
    } catch (error) {
      logger.error(`Failed to queue welcome email for ${email}:`, error);
      throw error;
    }
  }
}

/**
 * Media Processing Integration
 */
export class MediaQueueIntegration {
  /**
   * Process image resize
   */
  static async processImageResize(
    fileId: string,
    filePath: string,
    options: { width?: number; height?: number; quality?: number }
  ): Promise<void> {
    try {
      await queueManager.addMediaJob({
        type: 'resize',
        fileId,
        filePath,
        options
      });
      
      logger.info(`Image resize job queued for file ${fileId}`);
    } catch (error) {
      logger.error(`Failed to queue image resize for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Generate video thumbnail
   */
  static async generateVideoThumbnail(
    fileId: string,
    filePath: string,
    options: { timestamp?: number; width?: number; height?: number }
  ): Promise<void> {
    try {
      await queueManager.addMediaJob({
        type: 'thumbnail',
        fileId,
        filePath,
        options
      });
      
      logger.info(`Video thumbnail job queued for file ${fileId}`);
    } catch (error) {
      logger.error(`Failed to queue video thumbnail for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Process video transcoding
   */
  static async processVideoTranscoding(
    fileId: string,
    filePath: string,
    options: { format?: string; quality?: string; bitrate?: number }
  ): Promise<void> {
    try {
      await queueManager.addMediaJob({
        type: 'transcoding',
        fileId,
        filePath,
        options
      });
      
      logger.info(`Video transcoding job queued for file ${fileId}`);
    } catch (error) {
      logger.error(`Failed to queue video transcoding for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Scan media content for malicious content
   */
  static async scanMediaContent(
    fileId: string,
    filePath: string,
    userId?: string
  ): Promise<void> {
    try {
      await queueManager.addMediaJob({
        type: 'scan',
        fileId,
        filePath,
        options: { scanType: 'malicious-content' },
        userId
      });
      
      logger.info(`Media content scan job queued for file ${fileId}`);
    } catch (error) {
      logger.error(`Failed to queue media content scan for file ${fileId}:`, error);
      throw error;
    }
  }
}

/**
 * Notification Integration
 */
export class NotificationQueueIntegration {
  /**
   * Send push notification
   */
  static async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await queueManager.addNotificationJob({
        type: 'push',
        userId,
        title,
        message,
        data,
        channels: ['push']
      });
      
      logger.info(`Push notification queued for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to queue push notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send websocket notification
   */
  static async sendWebSocketNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await queueManager.addNotificationJob({
        type: 'websocket',
        userId,
        title,
        message,
        data,
        channels: ['websocket']
      });
      
      logger.info(`WebSocket notification queued for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to queue WebSocket notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send multi-channel notification
   */
  static async sendMultiChannelNotification(
    userId: string,
    title: string,
    message: string,
    channels: string[] = ['push', 'websocket'],
    data?: Record<string, any>
  ): Promise<void> {
    try {
      for (const channel of channels) {
        await queueManager.addNotificationJob({
          type: channel as any,
          userId,
          title,
          message,
          data,
          channels: [channel]
        });
      }
      
      logger.info(`Multi-channel notification queued for user ${userId} (channels: ${channels.join(', ')})`);
    } catch (error) {
      logger.error(`Failed to queue multi-channel notification for user ${userId}:`, error);
      throw error;
    }
  }
}

/**
 * Moderation Integration
 */
export class ModerationQueueIntegration {
  /**
   * Queue content for moderation
   */
  static async moderateContent(
    contentId: string,
    contentType: 'message' | 'post' | 'comment' | 'image',
    content: string,
    userId: string,
    moderationType: 'content-scan' | 'toxicity-check' | 'nsfw-detection' | 'ai-analysis' = 'content-scan'
  ): Promise<void> {
    try {
      await queueManager.addModerationJob({
        type: moderationType,
        contentId,
        contentType,
        content,
        userId
      });
      
      logger.info(`Content moderation job (${moderationType}) queued for content ${contentId}`);
    } catch (error) {
      logger.error(`Failed to queue content moderation for content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Queue comprehensive content analysis
   */
  static async analyzeContentComprehensively(
    contentId: string,
    contentType: 'message' | 'post' | 'comment' | 'image',
    content: string,
    userId: string
  ): Promise<void> {
    try {
      const analysisTypes = ['content-scan', 'toxicity-check', 'nsfw-detection', 'ai-analysis'];
      
      for (const analysisType of analysisTypes) {
        await queueManager.addModerationJob({
          type: analysisType as any,
          contentId,
          contentType,
          content,
          userId
        });
      }
      
      logger.info(`Comprehensive content analysis queued for content ${contentId}`);
    } catch (error) {
      logger.error(`Failed to queue comprehensive content analysis for content ${contentId}:`, error);
      throw error;
    }
  }
}

/**
 * Analytics Integration
 */
export class AnalyticsQueueIntegration {
  /**
   * Track user event
   */
  static async trackUserEvent(
    event: string,
    userId: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      await queueManager.addAnalyticsJob({
        type: 'user-event',
        event,
        userId,
        data,
        timestamp: new Date()
      });
      
      logger.debug(`User event queued: ${event} for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to queue user event ${event} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Track message metrics
   */
  static async trackMessageMetrics(
    messageId: string,
    userId: string,
    channelId: string,
    serverId?: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      await queueManager.addAnalyticsJob({
        type: 'message-metrics',
        event: 'message-sent',
        userId,
        data: {
          messageId,
          channelId,
          serverId,
          ...data
        },
        timestamp: new Date()
      });
      
      logger.debug(`Message metrics queued for message ${messageId}`);
    } catch (error) {
      logger.error(`Failed to queue message metrics for message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Track engagement metrics
   */
  static async trackEngagementMetrics(
    userId: string,
    action: string,
    targetType: string,
    targetId: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      await queueManager.addAnalyticsJob({
        type: 'engagement',
        event: `${targetType}-${action}`,
        userId,
        data: {
          action,
          targetType,
          targetId,
          ...data
        },
        timestamp: new Date()
      });
      
      logger.debug(`Engagement metrics queued: ${action} on ${targetType} ${targetId}`);
    } catch (error) {
      logger.error(`Failed to queue engagement metrics for ${action} on ${targetType} ${targetId}:`, error);
      throw error;
    }
  }
}

/**
 * Blockchain Integration
 */
export class BlockchainQueueIntegration {
  /**
   * Process blockchain transaction
   */
  static async processTransaction(
    operation: string,
    transactionData: Record<string, any>,
    userId?: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<void> {
    try {
      await queueManager.addBlockchainJob({
        type: 'transaction',
        operation,
        data: transactionData,
        userId,
        priority
      });
      
      logger.info(`Blockchain transaction queued: ${operation}`);
    } catch (error) {
      logger.error(`Failed to queue blockchain transaction ${operation}:`, error);
      throw error;
    }
  }

  /**
   * Process NFT minting
   */
  static async mintNFT(
    tokenData: Record<string, any>,
    userId: string
  ): Promise<void> {
    try {
      await queueManager.addBlockchainJob({
        type: 'nft-mint',
        operation: 'mint-nft',
        data: tokenData,
        userId,
        priority: 'high'
      });
      
      logger.info(`NFT minting job queued for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to queue NFT minting for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process token transfer
   */
  static async transferTokens(
    fromUserId: string,
    toUserId: string,
    amount: number,
    tokenType: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      await queueManager.addBlockchainJob({
        type: 'token-transfer',
        operation: 'transfer-tokens',
        data: {
          fromUserId,
          toUserId,
          amount,
          tokenType,
          ...data
        },
        userId: fromUserId,
        priority: 'high'
      });
      
      logger.info(`Token transfer queued: ${amount} ${tokenType} from ${fromUserId} to ${toUserId}`);
    } catch (error) {
      logger.error(`Failed to queue token transfer from ${fromUserId} to ${toUserId}:`, error);
      throw error;
    }
  }
}

/**
 * Queue System Health and Monitoring Integration
 */
export class QueueHealthIntegration {
  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<any> {
    try {
      return await queueMonitoringService.getSystemHealth();
    } catch (error) {
      logger.error('Failed to get system health:', error);
      throw error;
    }
  }

  /**
   * Get queue metrics
   */
  static async getQueueMetrics(queueName?: string): Promise<any> {
    try {
      if (queueName) {
        return queueMonitoringService.getQueueMetrics(queueName);
      } else {
        return queueMonitoringService.getAllMetrics();
      }
    } catch (error) {
      logger.error('Failed to get queue metrics:', error);
      throw error;
    }
  }

  /**
   * Get dead letter jobs
   */
  static async getDeadLetterJobs(limit = 50): Promise<any> {
    try {
      return await queueMonitoringService.getDeadLetterJobs(limit);
    } catch (error) {
      logger.error('Failed to get dead letter jobs:', error);
      throw error;
    }
  }

  /**
   * Retry dead letter job
   */
  static async retryDeadLetterJob(jobId: string): Promise<boolean> {
    try {
      return await queueMonitoringService.retryDeadLetterJob(jobId);
    } catch (error) {
      logger.error(`Failed to retry dead letter job ${jobId}:`, error);
      throw error;
    }
  }
}

/**
 * Main Queue Integration Facade
 */
export const QueueIntegration = {
  Email: EmailQueueIntegration,
  Media: MediaQueueIntegration,
  Notification: NotificationQueueIntegration,
  Moderation: ModerationQueueIntegration,
  Analytics: AnalyticsQueueIntegration,
  Blockchain: BlockchainQueueIntegration,
  Health: QueueHealthIntegration
};

export default QueueIntegration;