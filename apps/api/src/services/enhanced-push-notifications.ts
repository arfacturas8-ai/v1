import { FastifyInstance } from 'fastify';
import { PrismaClient, DeviceType, NotificationType, NotificationPriority, DeliveryStatus, PushProvider, QueueStatus } from '@prisma/client';
import { pushNotificationConfig, getActivePushService } from '../config/push-notifications';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import webpush from 'web-push';
import { BullMQ } from 'bullmq';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  badge?: number;
  sound?: string;
  imageUrl?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface NotificationTriggerData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  targetUsers?: string[];
}

export class EnhancedPushNotificationService {
  private app: FastifyInstance;
  private prisma: PrismaClient;
  private expo: Expo;
  private fcmApp?: admin.app.App;
  private notificationQueue: any;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.prisma = (app as any).prisma;
    this.expo = new Expo();
    this.initializeServices();
    this.setupQueue();
  }

  private async initializeServices() {
    try {
      await this.initializeFCM();
      await this.initializeWebPush();
      this.app.log.info('Push notification services initialized successfully');
    } catch (error) {
      this.app.log.error('Error initializing push notification services:', error);
    }
  }

  private async initializeFCM() {
    if (!pushNotificationConfig.fcm.enabled || pushNotificationConfig.fcm.useMock) {
      this.app.log.info('FCM disabled or using mock mode');
      return;
    }

    try {
      // Initialize Firebase Admin if not already initialized
      if (admin.apps.length === 0) {
        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: pushNotificationConfig.fcm.projectId,
            privateKey: pushNotificationConfig.fcm.privateKey.replace(/\\n/g, '\n'),
            clientEmail: pushNotificationConfig.fcm.clientEmail,
          }),
        });
        this.app.log.info('Firebase Admin SDK initialized');
      }
    } catch (error) {
      this.app.log.error('Error initializing FCM:', error);
    }
  }

  private async initializeWebPush() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:' + (process.env.SUPPORT_EMAIL || 'support@cryb.ai'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      this.app.log.info('Web Push VAPID keys configured');
    }
  }

  private setupQueue() {
    // Setup BullMQ for notification processing
    this.notificationQueue = new BullMQ('push-notifications', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD,
      },
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

    // Process notification jobs
    this.notificationQueue.process(async (job: any) => {
      const { notificationData } = job.data;
      return await this.processNotification(notificationData);
    });

    this.app.log.info('Notification queue initialized');
  }

  /**
   * Register a device for push notifications
   */
  async registerDevice(userId: string, deviceData: {
    token: string;
    type: DeviceType;
    model?: string;
    osVersion?: string;
    appVersion?: string;
  }) {
    try {
      // Check if device already exists
      const existingDevice = await this.prisma.pushDevice.findFirst({
        where: {
          deviceToken: deviceData.token,
          userId,
        },
      });

      if (existingDevice) {
        // Update existing device
        return await this.prisma.pushDevice.update({
          where: { id: existingDevice.id },
          data: {
            isActive: true,
            lastActiveAt: new Date(),
            deviceModel: deviceData.model,
            osVersion: deviceData.osVersion,
            appVersion: deviceData.appVersion,
          },
        });
      }

      // Create new device
      return await this.prisma.pushDevice.create({
        data: {
          userId,
          deviceToken: deviceData.token,
          deviceType: deviceData.type,
          deviceModel: deviceData.model,
          osVersion: deviceData.osVersion,
          appVersion: deviceData.appVersion,
        },
      });
    } catch (error) {
      this.app.log.error('Error registering device:', error);
      throw new Error('Failed to register device');
    }
  }

  /**
   * Unregister a device
   */
  async unregisterDevice(userId: string, deviceToken: string) {
    try {
      return await this.prisma.pushDevice.updateMany({
        where: {
          userId,
          deviceToken,
        },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      this.app.log.error('Error unregistering device:', error);
      throw new Error('Failed to unregister device');
    }
  }

  /**
   * Get or create notification preferences for a user
   */
  async getNotificationPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(userId: string, preferences: Partial<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    newMessageEnabled: boolean;
    mentionEnabled: boolean;
    replyEnabled: boolean;
    followEnabled: boolean;
    likeEnabled: boolean;
    commentEnabled: boolean;
    awardEnabled: boolean;
    systemEnabled: boolean;
    dmEnabled: boolean;
    voiceCallEnabled: boolean;
    serverInviteEnabled: boolean;
    communityInviteEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    timezone: string;
  }>) {
    try {
      return await this.prisma.notificationPreferences.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ...preferences,
        },
      });
    } catch (error) {
      this.app.log.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendNotification(notificationData: NotificationTriggerData) {
    try {
      // Check if user has notifications enabled
      const preferences = await this.getNotificationPreferences(notificationData.userId);
      if (!preferences.pushEnabled) {
        this.app.log.info(`Push notifications disabled for user ${notificationData.userId}`);
        return { success: false, reason: 'Push notifications disabled' };
      }

      // Check quiet hours
      if (await this.isQuietHours(notificationData.userId, preferences)) {
        if (notificationData.priority !== NotificationPriority.CRITICAL) {
          this.app.log.info(`Skipping notification due to quiet hours for user ${notificationData.userId}`);
          return { success: false, reason: 'Quiet hours active' };
        }
      }

      // Queue the notification for processing
      if (notificationData.scheduledAt && notificationData.scheduledAt > new Date()) {
        await this.queueScheduledNotification(notificationData);
      } else {
        await this.queueNotification(notificationData);
      }

      return { success: true };
    } catch (error) {
      this.app.log.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: NotificationTriggerData[]) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification);
        results.push({ ...notification, result });
      } catch (error) {
        results.push({ ...notification, result: { success: false, error: String(error) } });
      }
    }

    return results;
  }

  private async queueNotification(notificationData: NotificationTriggerData) {
    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        content: notificationData.body,
        data: notificationData.data,
      },
    });

    // Queue for processing
    await this.notificationQueue.add('process-notification', {
      notificationData: {
        ...notificationData,
        notificationId: notification.id,
      },
    });
  }

  private async queueScheduledNotification(notificationData: NotificationTriggerData) {
    // Create notification queue entry
    await this.prisma.notificationQueue.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        priority: notificationData.priority || NotificationPriority.NORMAL,
        scheduledAt: notificationData.scheduledAt,
        status: QueueStatus.SCHEDULED,
      },
    });

    // Schedule with BullMQ
    await this.notificationQueue.add(
      'process-notification',
      { notificationData },
      { delay: notificationData.scheduledAt!.getTime() - Date.now() }
    );
  }

  private async processNotification(notificationData: NotificationTriggerData & { notificationId?: string }) {
    try {
      // Get user's active devices
      const devices = await this.prisma.pushDevice.findMany({
        where: {
          userId: notificationData.userId,
          isActive: true,
        },
      });

      if (devices.length === 0) {
        this.app.log.warn(`No active devices found for user ${notificationData.userId}`);
        return { success: false, reason: 'No active devices' };
      }

      const deliveryPromises = devices.map(device => 
        this.sendToDevice(device, notificationData)
      );

      const results = await Promise.allSettled(deliveryPromises);
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      this.app.log.info(`Notification delivery: ${successful} successful, ${failed} failed`);
      
      return { success: successful > 0, delivered: successful, failed };
    } catch (error) {
      this.app.log.error('Error processing notification:', error);
      throw error;
    }
  }

  private async sendToDevice(device: any, notificationData: NotificationTriggerData & { notificationId?: string }) {
    // Create delivery record
    const delivery = await this.prisma.pushNotificationDelivery.create({
      data: {
        notificationId: notificationData.notificationId,
        deviceId: device.id,
        userId: notificationData.userId,
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        status: DeliveryStatus.PENDING,
        provider: this.getProviderForDevice(device.deviceType),
      },
    });

    try {
      let result;
      switch (device.deviceType) {
        case DeviceType.ANDROID:
          result = await this.sendViaFCM(device.deviceToken, notificationData);
          break;
        case DeviceType.IOS:
          result = await this.sendViaAPNS(device.deviceToken, notificationData);
          break;
        case DeviceType.WEB:
          result = await this.sendViaWebPush(device.deviceToken, notificationData);
          break;
        default:
          result = await this.sendViaExpo(device.deviceToken, notificationData);
      }

      // Update delivery status
      await this.prisma.pushNotificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: result.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
          sentAt: result.success ? new Date() : undefined,
          error: result.error,
          providerResponse: result.response,
        },
      });

      return result;
    } catch (error) {
      // Update delivery status
      await this.prisma.pushNotificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          error: String(error),
        },
      });
      throw error;
    }
  }

  private getProviderForDevice(deviceType: DeviceType): PushProvider {
    switch (deviceType) {
      case DeviceType.ANDROID:
        return PushProvider.FCM;
      case DeviceType.IOS:
        return PushProvider.APNS;
      case DeviceType.WEB:
        return PushProvider.WEB_PUSH;
      default:
        return PushProvider.EXPO;
    }
  }

  private async sendViaFCM(token: string, notification: NotificationTriggerData) {
    if (pushNotificationConfig.fcm.useMock) {
      return this.sendViaMock(token, notification, 'FCM');
    }

    try {
      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data ? this.stringifyData(notification.data) : undefined,
        android: {
          priority: this.mapPriorityToAndroid(notification.priority),
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      };

      const response = await admin.messaging().send(message);
      return { success: true, response };
    } catch (error) {
      this.app.log.error('FCM send error:', error);
      return { success: false, error: String(error) };
    }
  }

  private async sendViaAPNS(token: string, notification: NotificationTriggerData) {
    if (pushNotificationConfig.apns.useMock) {
      return this.sendViaMock(token, notification, 'APNS');
    }

    try {
      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      return { success: true, response };
    } catch (error) {
      this.app.log.error('APNS send error:', error);
      return { success: false, error: String(error) };
    }
  }

  private async sendViaWebPush(subscription: string, notification: NotificationTriggerData) {
    try {
      const subscriptionObject = JSON.parse(subscription);
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
      });

      const response = await webpush.sendNotification(subscriptionObject, payload);
      return { success: true, response };
    } catch (error) {
      this.app.log.error('Web Push send error:', error);
      return { success: false, error: String(error) };
    }
  }

  private async sendViaExpo(token: string, notification: NotificationTriggerData) {
    try {
      if (!Expo.isExpoPushToken(token)) {
        throw new Error('Invalid Expo push token');
      }

      const message: ExpoPushMessage = {
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: this.mapPriorityToExpo(notification.priority),
      };

      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      return { success: true, response: ticket };
    } catch (error) {
      this.app.log.error('Expo send error:', error);
      return { success: false, error: String(error) };
    }
  }

  private async sendViaMock(token: string, notification: NotificationTriggerData, provider: string) {
    this.app.log.info(`[${provider} Mock] Sending to ${token}:`);
    this.app.log.info(`  Title: ${notification.title}`);
    this.app.log.info(`  Body: ${notification.body}`);
    this.app.log.info(`  Data: ${JSON.stringify(notification.data)}`);
    return { success: true, response: 'mock-response' };
  }

  private async isQuietHours(userId: string, preferences: any): Promise<boolean> {
    if (!preferences.quietHoursEnabled || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const timezone = preferences.timezone || 'UTC';
    
    // Convert to user's timezone
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const currentTime = userTime.replace(':', '');
    const startTime = preferences.quietHoursStart.replace(':', '');
    const endTime = preferences.quietHoursEnd.replace(':', '');

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  private mapPriorityToAndroid(priority?: NotificationPriority): 'normal' | 'high' {
    switch (priority) {
      case NotificationPriority.HIGH:
      case NotificationPriority.CRITICAL:
        return 'high';
      default:
        return 'normal';
    }
  }

  private mapPriorityToExpo(priority?: NotificationPriority): 'default' | 'normal' | 'high' {
    switch (priority) {
      case NotificationPriority.HIGH:
      case NotificationPriority.CRITICAL:
        return 'high';
      case NotificationPriority.LOW:
        return 'default';
      default:
        return 'normal';
    }
  }

  private stringifyData(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }

  /**
   * Notification trigger methods for different events
   */

  async triggerNewMessage(senderId: string, recipientId: string, messageContent: string, channelId: string) {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true, username: true },
    });

    if (!sender) return;

    await this.sendNotification({
      userId: recipientId,
      type: NotificationType.MESSAGE,
      title: `Message from ${sender.displayName}`,
      body: messageContent.length > 100 ? messageContent.substring(0, 97) + '...' : messageContent,
      data: {
        senderId,
        channelId,
        type: 'message',
      },
      priority: NotificationPriority.NORMAL,
    });
  }

  async triggerMention(mentionerId: string, mentionedId: string, content: string, postId?: string, commentId?: string) {
    const mentioner = await this.prisma.user.findUnique({
      where: { id: mentionerId },
      select: { displayName: true, username: true },
    });

    if (!mentioner) return;

    await this.sendNotification({
      userId: mentionedId,
      type: NotificationType.MENTION,
      title: `${mentioner.displayName} mentioned you`,
      body: content.length > 100 ? content.substring(0, 97) + '...' : content,
      data: {
        mentionerId,
        postId,
        commentId,
        type: 'mention',
      },
      priority: NotificationPriority.HIGH,
    });
  }

  async triggerVoiceCall(callerId: string, recipientId: string, channelId: string) {
    const caller = await this.prisma.user.findUnique({
      where: { id: callerId },
      select: { displayName: true },
    });

    if (!caller) return;

    await this.sendNotification({
      userId: recipientId,
      type: NotificationType.VOICE_CALL,
      title: 'Incoming Voice Call',
      body: `${caller.displayName} is calling you`,
      data: {
        callerId,
        channelId,
        type: 'voice_call',
      },
      priority: NotificationPriority.CRITICAL,
    });
  }

  async triggerFollowNotification(followerId: string, followedId: string) {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { displayName: true },
    });

    if (!follower) return;

    await this.sendNotification({
      userId: followedId,
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      body: `${follower.displayName} started following you`,
      data: {
        followerId,
        type: 'follow',
      },
      priority: NotificationPriority.NORMAL,
    });
  }

  /**
   * Analytics and monitoring methods
   */

  async getDeliveryStats(userId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.pushNotificationDelivery.groupBy({
      by: ['status', 'provider'],
      where,
      _count: true,
    });

    return stats;
  }

  async getNotificationMetrics() {
    const [totalDevices, activeDevices, recentDeliveries] = await Promise.all([
      this.prisma.pushDevice.count(),
      this.prisma.pushDevice.count({ where: { isActive: true } }),
      this.prisma.pushNotificationDelivery.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      totalDevices,
      activeDevices,
      recentDeliveries,
    };
  }
}

export function createEnhancedPushNotificationService(app: FastifyInstance) {
  return new EnhancedPushNotificationService(app);
}