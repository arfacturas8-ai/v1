import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';

export interface NotificationData {
  userId: string;
  type: 'MENTION' | 'REPLY' | 'FOLLOW' | 'LIKE' | 'COMMENT' | 'AWARD' | 'SYSTEM' | 'DM';
  title: string;
  content: string;
  data?: any;
  actionUrl?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class NotificationService {
  private queue: Queue;

  constructor(notificationQueue: Queue) {
    this.queue = notificationQueue;
  }

  /**
   * Create a notification in database and queue for delivery
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          content: data.content,
          data: data.data || null,
          isRead: false
        }
      });

      // Queue notification for real-time delivery
      await this.queue.add('deliver-notification', {
        notificationId: notification.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        actionUrl: data.actionUrl,
        timestamp: new Date().toISOString()
      });

      console.log(`📨 Notification queued for user ${data.userId}: ${data.title}`);
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Send push notification to user's devices
   */
  async sendPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      await this.queue.add('push-notification', {
        userId,
        payload,
        timestamp: new Date().toISOString()
      });

      console.log(`📱 Push notification queued for user ${userId}`);
    } catch (error) {
      console.error('Failed to queue push notification:', error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId: string, subject: string, template: string, data: any): Promise<void> {
    try {
      await this.queue.add('email-notification', {
        userId,
        subject,
        template,
        data,
        timestamp: new Date().toISOString()
      });

      console.log(`📧 Email notification queued for user ${userId}: ${subject}`);
    } catch (error) {
      console.error('Failed to queue email notification:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true
        }
      });

      console.log(`✅ Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw new Error('Failed to update notification');
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      console.log(`✅ All notifications marked as read for user ${userId}`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw new Error('Failed to update notifications');
    }
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const offset = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.notification.count({
          where: { userId }
        })
      ]);

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: page > 1
        },
        unreadCount
      };
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      console.log(`🗑️ Notification ${notificationId} deleted`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Create mention notification
   */
  async notifyMention(mentionedUserId: string, mentionerUserId: string, content: string, location: string): Promise<void> {
    const mentioner = await prisma.user.findUnique({
      where: { id: mentionerUserId },
      select: { username: true, displayName: true }
    });

    if (!mentioner) return;

    await this.createNotification({
      userId: mentionedUserId,
      type: 'MENTION',
      title: 'You were mentioned',
      content: `${mentioner.displayName || mentioner.username} mentioned you: ${content.slice(0, 100)}...`,
      data: {
        mentionerId: mentionerUserId,
        location
      }
    });
  }

  /**
   * Create reply notification
   */
  async notifyReply(originalAuthorId: string, replierUserId: string, content: string, location: string): Promise<void> {
    if (originalAuthorId === replierUserId) return; // Don't notify self-replies

    const replier = await prisma.user.findUnique({
      where: { id: replierUserId },
      select: { username: true, displayName: true }
    });

    if (!replier) return;

    await this.createNotification({
      userId: originalAuthorId,
      type: 'REPLY',
      title: 'New reply to your message',
      content: `${replier.displayName || replier.username} replied: ${content.slice(0, 100)}...`,
      data: {
        replierId: replierUserId,
        location
      }
    });
  }

  /**
   * Create system notification
   */
  async notifySystem(userId: string, title: string, content: string, data?: any): Promise<void> {
    await this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      content,
      data
    });
  }

  /**
   * Notify user about server updates
   */
  async notifyServerUpdate(serverMembers: string[], title: string, content: string, data?: any): Promise<void> {
    const notificationPromises = serverMembers.map(userId =>
      this.createNotification({
        userId,
        type: 'SYSTEM',
        title,
        content,
        data
      })
    );

    await Promise.all(notificationPromises);
  }

  /**
   * Clean up old notifications (run periodically)
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      });

      console.log(`🧹 Cleaned up ${result.count} old notifications`);
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
    }
  }
}