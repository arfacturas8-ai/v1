import { FastifyInstance } from 'fastify';
import { pushNotificationConfig, getActivePushService } from '../config/push-notifications';

export class PushNotificationService {
  private app: FastifyInstance;
  private activeService: string;
  private notificationQueue: Map<string, any[]> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.activeService = getActivePushService();
    this.initializeService();
  }

  private initializeService() {
    this.app.log.info(`Push Notification Service initialized with: ${this.activeService}`);
    
    // Start batch processing
    if (this.activeService !== 'mock') {
      this.startBatchProcessing();
    }
  }

  private startBatchProcessing() {
    setInterval(() => {
      this.processBatch();
    }, pushNotificationConfig.settings.batchDelay);
  }

  private async processBatch() {
    if (this.notificationQueue.size === 0) return;

    const batch = Array.from(this.notificationQueue.entries()).slice(0, pushNotificationConfig.settings.batchSize);
    this.notificationQueue.clear();

    for (const [token, notifications] of batch) {
      await this.sendToDevice(token, notifications);
    }
  }

  async sendNotification(userId: string, notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    priority?: 'normal' | 'high' | 'critical';
    badge?: number;
    sound?: string;
  }) {
    try {
      // Get user's push tokens from database
      const pushTokens = await this.getUserPushTokens(userId);
      
      if (!pushTokens || pushTokens.length === 0) {
        this.app.log.warn(`No push tokens found for user ${userId}`);
        return { success: false, error: 'No push tokens' };
      }

      // Queue notifications for batch processing
      for (const token of pushTokens) {
        if (!this.notificationQueue.has(token)) {
          this.notificationQueue.set(token, []);
        }
        this.notificationQueue.get(token)!.push(notification);
      }

      // If critical priority, send immediately
      if (notification.priority === 'critical') {
        await this.processBatch();
      }

      return { success: true, queued: pushTokens.length };
    } catch (error) {
      this.app.log.error(`Push notification error: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  private async sendToDevice(token: string, notifications: any[]) {
    switch (this.activeService) {
      case 'expo':
        return this.sendViaExpo(token, notifications);
      case 'fcm':
        return this.sendViaFCM(token, notifications);
      case 'apns':
        return this.sendViaAPNS(token, notifications);
      default:
        return this.sendViaMock(token, notifications);
    }
  }

  private async sendViaExpo(token: string, notifications: any[]) {
    // Expo push notification implementation
    this.app.log.info(`[Expo] Sending ${notifications.length} notifications to ${token}`);
    
    // In production, you would use expo-server-sdk here
    // For now, we'll simulate success
    return { success: true, service: 'expo' };
  }

  private async sendViaFCM(token: string, notifications: any[]) {
    // FCM implementation
    this.app.log.info(`[FCM] Sending ${notifications.length} notifications to ${token}`);
    
    // In production, you would use firebase-admin here
    return { success: true, service: 'fcm' };
  }

  private async sendViaAPNS(token: string, notifications: any[]) {
    // APNS implementation
    this.app.log.info(`[APNS] Sending ${notifications.length} notifications to ${token}`);
    
    // In production, you would use node-apn here
    return { success: true, service: 'apns' };
  }

  private async sendViaMock(token: string, notifications: any[]) {
    // Mock implementation for development
    this.app.log.info(`[Mock] Would send ${notifications.length} notifications to ${token}`);
    
    for (const notification of notifications) {
      this.app.log.info(`[Mock Push] ${notification.title}: ${notification.body}`);
    }
    
    return { success: true, service: 'mock' };
  }

  private async getUserPushTokens(userId: string): Promise<string[]> {
    // In production, fetch from database
    // For now, return mock tokens for testing
    if (process.env.NODE_ENV === 'development') {
      return [`mock-token-${userId}`];
    }
    
    // Query database for user's push tokens
    try {
      const user = await (this.app as any).prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true }
      });
      
      return user?.pushTokens || [];
    } catch (error) {
      this.app.log.error(`Error fetching push tokens: ${error}`);
      return [];
    }
  }

  // Utility methods for sending specific notification types
  async sendMessageNotification(userId: string, senderId: string, senderName: string, messagePreview: string) {
    return this.sendNotification(userId, {
      title: `Message from ${senderName}`,
      body: messagePreview,
      data: { type: 'message', senderId },
      sound: 'message.wav'
    });
  }

  async sendFollowNotification(userId: string, followerId: string, followerName: string) {
    return this.sendNotification(userId, {
      title: 'New Follower',
      body: `${followerName} started following you`,
      data: { type: 'follow', followerId }
    });
  }

  async sendCallNotification(userId: string, callerId: string, callerName: string, channelId: string) {
    return this.sendNotification(userId, {
      title: 'Incoming Call',
      body: `${callerName} is calling you`,
      data: { type: 'call', callerId, channelId },
      priority: 'critical',
      sound: 'ringtone.wav'
    });
  }
}

export function createPushNotificationService(app: FastifyInstance) {
  return new PushNotificationService(app);
}