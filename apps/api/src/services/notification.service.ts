import { prisma } from '@cryb/database';
import { emailService } from './email.service';
import Redis from 'ioredis';
import { io } from '../index';

interface NotificationPayload {
  userId: string;
  type: 'POST_REPLY' | 'COMMENT_REPLY' | 'MENTION' | 'FOLLOW' | 'LIKE' | 'MODERATION' | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
}

export class NotificationService {
  private redis: Redis;
  private pubClient: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
    this.pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
  }

  async createNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Save to database
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          actionUrl: payload.actionUrl,
          metadata: payload.metadata || {},
          read: false,
          createdAt: new Date()
        }
      });

      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          email: true,
          username: true,
          emailNotifications: true,
          pushNotifications: true
        }
      });

      if (!user) return;

      // Send real-time notification via Socket.IO
      await this.sendRealtimeNotification(payload.userId, notification);

      // Send push notification if enabled
      if (user.pushNotifications) {
        await this.sendPushNotification(payload.userId, notification);
      }

      // Send email notification if enabled
      if (user.emailNotifications && user.email) {
        await emailService.sendNotificationEmail(
          user.email,
          user.username,
          {
            title: payload.title,
            message: payload.message,
            actionUrl: payload.actionUrl
          }
        );
      }

      // Update unread count in Redis
      await this.updateUnreadCount(payload.userId);

    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  async createBulkNotifications(userIds: string[], payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
    const notifications = userIds.map(userId => ({
      ...payload,
      userId,
      read: false,
      createdAt: new Date()
    }));

    try {
      // Bulk insert notifications
      await prisma.notification.createMany({
        data: notifications
      });

      // Send real-time notifications
      for (const userId of userIds) {
        await this.sendRealtimeNotification(userId, { ...payload, userId });
        await this.updateUnreadCount(userId);
      }

      // Get users with email notifications enabled
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          emailNotifications: true,
          email: { not: null }
        },
        select: {
          email: true,
          username: true
        }
      });

      // Send bulk emails
      if (users.length > 0) {
        await emailService.sendBulkEmails(
          users as any,
          {
            title: payload.title,
            message: payload.message,
            actionUrl: payload.actionUrl
          }
        );
      }

    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
    }
  }

  private async sendRealtimeNotification(userId: string, notification: any): Promise<void> {
    try {
      // Publish to Redis for Socket.IO
      await this.pubClient.publish(
        `notification:${userId}`,
        JSON.stringify(notification)
      );

      // Emit directly if user is connected
      if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
      }
    } catch (error) {
      console.error('Failed to send realtime notification:', error);
    }
  }

  private async sendPushNotification(userId: string, notification: any): Promise<void> {
    try {
      // Get user's push tokens
      const pushTokens = await prisma.pushToken.findMany({
        where: { userId, active: true }
      });

      if (pushTokens.length === 0) return;

      // Send via FCM/APNS (placeholder implementation)
      for (const token of pushTokens) {
        if (token.platform === 'FCM' && process.env.FCM_ENABLED === 'true') {
          // FCM implementation would go here
          console.log(`📱 Push notification sent to FCM token: ${token.token.substring(0, 10)}...`);
        } else if (token.platform === 'APNS' && process.env.APNS_ENABLED === 'true') {
          // APNS implementation would go here
          console.log(`📱 Push notification sent to APNS token: ${token.token.substring(0, 10)}...`);
        }
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      if (result.count > 0) {
        await this.updateUnreadCount(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      await this.redis.set(`unread_count:${userId}`, '0');
      
      // Notify client
      if (io) {
        io.to(`user:${userId}`).emit('unreadCountUpdate', { count: 0 });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({
          where: { userId }
        })
      ]);

      const unreadCount = await this.getUnreadCount(userId);

      return {
        notifications,
        total,
        unreadCount,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Try Redis cache first
      const cached = await this.redis.get(`unread_count:${userId}`);
      if (cached !== null) {
        return parseInt(cached);
      }

      // Fallback to database
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });

      // Cache for 5 minutes
      await this.redis.setex(`unread_count:${userId}`, 300, count.toString());
      
      return count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  private async updateUnreadCount(userId: string): Promise<void> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });

      await this.redis.setex(`unread_count:${userId}`, 300, count.toString());
      
      // Notify client
      if (io) {
        io.to(`user:${userId}`).emit('unreadCountUpdate', { count });
      }
    } catch (error) {
      console.error('Failed to update unread count:', error);
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId
        }
      });

      if (result.count > 0) {
        await this.updateUnreadCount(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  async updateUserPreferences(
    userId: string, 
    preferences: { 
      emailNotifications?: boolean; 
      pushNotifications?: boolean;
      notificationTypes?: string[];
    }
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: preferences
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  // Helper methods for common notification scenarios
  async notifyPostReply(postAuthorId: string, replierUsername: string, postTitle: string, postId: string): Promise<void> {
    await this.createNotification({
      userId: postAuthorId,
      type: 'POST_REPLY',
      title: 'New reply to your post',
      message: `${replierUsername} replied to your post "${postTitle}"`,
      actionUrl: `/posts/${postId}`
    });
  }

  async notifyMention(userId: string, mentionerUsername: string, context: string, url: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'MENTION',
      title: 'You were mentioned',
      message: `${mentionerUsername} mentioned you in ${context}`,
      actionUrl: url
    });
  }

  async notifyFollow(userId: string, followerUsername: string, followerId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'FOLLOW',
      title: 'New follower',
      message: `${followerUsername} started following you`,
      actionUrl: `/profile/${followerId}`
    });
  }

  async notifyModerationAction(userId: string, action: string, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'MODERATION',
      title: 'Moderation Notice',
      message: `Your content was ${action}. Reason: ${reason}`,
      actionUrl: '/guidelines'
    });
  }
}

export const notificationService = new NotificationService();