import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import webpush from 'web-push';

export interface NotificationData {
  userId: string;
  type: 'MENTION' | 'REPLY' | 'FOLLOW' | 'LIKE' | 'COMMENT' | 'AWARD' | 'SYSTEM' | 'DM' | 'FRIEND_REQUEST' | 'MESSAGE' | 'VOICE_CALL' | 'GROUP_INVITE' | 'SERVER_INVITE';
  title: string;
  content: string;
  data?: any;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: Array<'in_app' | 'push' | 'email'>;
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

export interface UserPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class NotificationService {
  private queue: Queue;
  private socketIo?: any;

  constructor(notificationQueue: Queue, socketIo?: any) {
    this.queue = notificationQueue;
    this.socketIo = socketIo;
    
    // Configure web push if environment variables are set
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_CONTACT || 'mailto:admin@cryb.ai',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  /**
   * Create a notification in database and queue for delivery
   */
  async createNotification(data: NotificationData): Promise<string> {
    try {
      // Get user preferences to determine delivery channels
      const userPrefs = await this.getUserNotificationPreferences(data.userId);
      const channels = data.channels || this.getDefaultChannelsForType(data.type);
      const enabledChannels = channels.filter(channel => 
        userPrefs[`${channel}Enabled` as keyof typeof userPrefs] !== false
      );

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          content: data.content,
          data: data.data || null,
          isRead: false,
          priority: data.priority || 'normal',
          actionUrl: data.actionUrl,
          channels: enabledChannels
        }
      });

      // Deliver notification through enabled channels
      await this.deliverNotification(notification.id, data, enabledChannels);

      console.log(`📨 Notification created for user ${data.userId}: ${data.title} via [${enabledChannels.join(', ')}]`);
      
      return notification.id;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Deliver notification through multiple channels
   */
  private async deliverNotification(notificationId: string, data: NotificationData, channels: Array<'in_app' | 'push' | 'email'>): Promise<void> {
    const deliveryPromises = [];

    // In-app real-time notification
    if (channels.includes('in_app')) {
      deliveryPromises.push(this.deliverInAppNotification(data));
    }

    // Push notification
    if (channels.includes('push')) {
      deliveryPromises.push(this.deliverPushNotification(data));
    }

    // Email notification
    if (channels.includes('email')) {
      deliveryPromises.push(this.deliverEmailNotification(data));
    }

    // Queue notification for processing
    deliveryPromises.push(
      this.queue.add('process-notification', {
        notificationId,
        userId: data.userId,
        type: data.type,
        priority: data.priority || 'normal',
        timestamp: new Date().toISOString()
      }, {
        priority: this.getPriorityScore(data.priority || 'normal')
      })
    );

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Deliver in-app real-time notification
   */
  private async deliverInAppNotification(data: NotificationData): Promise<void> {
    if (!this.socketIo) return;

    try {
      // Emit to user's socket rooms
      this.socketIo.to(`user:${data.userId}`).emit('notification', {
        type: data.type,
        title: data.title,
        content: data.content,
        data: data.data,
        actionUrl: data.actionUrl,
        priority: data.priority || 'normal',
        timestamp: new Date().toISOString()
      });

      // Also emit unread count update
      const unreadCount = await this.getUnreadCount(data.userId);
      this.socketIo.to(`user:${data.userId}`).emit('notificationUnreadCount', {
        count: unreadCount
      });

    } catch (error) {
      console.error('Failed to deliver in-app notification:', error);
    }
  }

  /**
   * Deliver push notification
   */
  private async deliverPushNotification(data: NotificationData): Promise<void> {
    try {
      await this.queue.add('push-notification', {
        userId: data.userId,
        payload: {
          title: data.title,
          body: data.content,
          icon: '/icons/notification-icon.png',
          badge: await this.getUnreadCount(data.userId),
          data: {
            type: data.type,
            actionUrl: data.actionUrl,
            ...data.data
          },
          actions: this.getNotificationActions(data.type)
        },
        priority: data.priority || 'normal',
        timestamp: new Date().toISOString()
      }, {
        priority: this.getPriorityScore(data.priority || 'normal')
      });
    } catch (error) {
      console.error('Failed to queue push notification:', error);
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmailNotification(data: NotificationData): Promise<void> {
    try {
      const template = this.getEmailTemplate(data.type, data);
      
      await this.queue.add('email-notification', {
        userId: data.userId,
        subject: template.subject,
        html: template.html,
        text: template.text,
        data: data.data,
        priority: data.priority || 'normal',
        timestamp: new Date().toISOString()
      }, {
        priority: this.getPriorityScore(data.priority || 'normal')
      });
    } catch (error) {
      console.error('Failed to queue email notification:', error);
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

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<any> {
    try {
      const preferences = await prisma.userNotificationPreferences.findUnique({
        where: { userId }
      });

      // Return default preferences if none exist
      return preferences || {
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        mentionsEnabled: true,
        repliesEnabled: true,
        friendRequestsEnabled: true,
        messagesEnabled: true,
        systemEnabled: true
      };
    } catch (error) {
      console.error('Failed to get user notification preferences:', error);
      return {
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        mentionsEnabled: true,
        repliesEnabled: true,
        friendRequestsEnabled: true,
        messagesEnabled: true,
        systemEnabled: true
      };
    }
  }

  /**
   * Get default delivery channels for notification type
   */
  private getDefaultChannelsForType(type: string): Array<'in_app' | 'push' | 'email'> {
    const channelMap: Record<string, Array<'in_app' | 'push' | 'email'>> = {
      'MENTION': ['in_app', 'push'],
      'REPLY': ['in_app', 'push'],
      'DM': ['in_app', 'push'],
      'MESSAGE': ['in_app', 'push'],
      'FRIEND_REQUEST': ['in_app', 'push', 'email'],
      'VOICE_CALL': ['in_app', 'push'],
      'GROUP_INVITE': ['in_app', 'push'],
      'SERVER_INVITE': ['in_app', 'push'],
      'SYSTEM': ['in_app', 'email'],
      'LIKE': ['in_app'],
      'COMMENT': ['in_app', 'push'],
      'FOLLOW': ['in_app'],
      'AWARD': ['in_app', 'push', 'email']
    };

    return channelMap[type] || ['in_app'];
  }

  /**
   * Get priority score for queue processing
   */
  private getPriorityScore(priority: string): number {
    const priorityMap: Record<string, number> = {
      'urgent': 10,
      'high': 8,
      'normal': 5,
      'low': 2
    };

    return priorityMap[priority] || 5;
  }

  /**
   * Get notification actions for push notifications
   */
  private getNotificationActions(type: string): Array<{action: string, title: string}> {
    const actionMap: Record<string, Array<{action: string, title: string}>> = {
      'FRIEND_REQUEST': [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' }
      ],
      'DM': [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View' }
      ],
      'MESSAGE': [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View' }
      ],
      'VOICE_CALL': [
        { action: 'answer', title: 'Answer' },
        { action: 'decline', title: 'Decline' }
      ],
      'GROUP_INVITE': [
        { action: 'join', title: 'Join' },
        { action: 'decline', title: 'Decline' }
      ]
    };

    return actionMap[type] || [{ action: 'view', title: 'View' }];
  }

  /**
   * Get email template for notification type
   */
  private getEmailTemplate(type: string, data: NotificationData): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://cryb.ai';
    
    const templates: Record<string, EmailTemplate> = {
      'FRIEND_REQUEST': {
        subject: 'New Friend Request on CRYB',
        html: `
          <h2>New Friend Request</h2>
          <p>${data.content}</p>
          <a href="${baseUrl}/friends" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Friend Requests</a>
        `
      },
      'SYSTEM': {
        subject: data.title,
        html: `
          <h2>${data.title}</h2>
          <p>${data.content}</p>
          ${data.actionUrl ? `<a href="${baseUrl}${data.actionUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Take Action</a>` : ''}
        `
      },
      'AWARD': {
        subject: 'You received an award on CRYB!',
        html: `
          <h2>Congratulations!</h2>
          <p>${data.content}</p>
          <a href="${baseUrl}/profile" style="background: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Your Profile</a>
        `
      }
    };

    return templates[type] || {
      subject: data.title,
      html: `
        <h2>${data.title}</h2>
        <p>${data.content}</p>
        ${data.actionUrl ? `<a href="${baseUrl}${data.actionUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View</a>` : ''}
      `
    };
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Send push notification to user's registered devices
   */
  async sendWebPushNotification(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Get user's push subscriptions
      const subscriptions = await prisma.userPushSubscription.findMany({
        where: { 
          userId,
          isActive: true 
        }
      });

      const pushPromises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dhKey,
                auth: subscription.authKey
              }
            },
            JSON.stringify(payload)
          );
          
          // Update last used timestamp
          await prisma.userPushSubscription.update({
            where: { id: subscription.id },
            data: { lastUsedAt: new Date() }
          });
          
        } catch (error: any) {
          console.error(`Failed to send push to subscription ${subscription.id}:`, error);
          
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.userPushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false }
            });
          }
        }
      });

      await Promise.allSettled(pushPromises);
      console.log(`📱 Sent push notifications to ${subscriptions.length} devices for user ${userId}`);
      
    } catch (error) {
      console.error('Failed to send web push notifications:', error);
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeToPushNotifications(userId: string, subscription: UserPushSubscription, userAgent?: string): Promise<void> {
    try {
      await prisma.userPushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint
          }
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          userAgent: userAgent || 'Unknown',
          isActive: true,
          subscribedAt: new Date(),
          lastUsedAt: new Date()
        },
        update: {
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          userAgent: userAgent || 'Unknown',
          isActive: true,
          lastUsedAt: new Date()
        }
      });

      console.log(`📱 Push subscription registered for user ${userId}`);
    } catch (error) {
      console.error('Failed to register push subscription:', error);
      throw new Error('Failed to register push subscription');
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeFromPushNotifications(userId: string, endpoint?: string): Promise<void> {
    try {
      if (endpoint) {
        // Remove specific subscription
        await prisma.userPushSubscription.updateMany({
          where: {
            userId,
            endpoint
          },
          data: {
            isActive: false
          }
        });
      } else {
        // Remove all subscriptions for user
        await prisma.userPushSubscription.updateMany({
          where: { userId },
          data: { isActive: false }
        });
      }

      console.log(`📱 Push subscription(s) removed for user ${userId}`);
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
      throw new Error('Failed to remove push subscription');
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await prisma.userNotificationPreferences.upsert({
        where: { userId },
        create: {
          userId,
          ...preferences
        },
        update: preferences
      });

      console.log(`⚙️ Notification preferences updated for user ${userId}`);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Notify direct message
   */
  async notifyDirectMessage(recipientId: string, senderId: string, content: string, conversationId: string): Promise<void> {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true, displayName: true, avatar: true }
    });

    if (!sender) return;

    await this.createNotification({
      userId: recipientId,
      type: 'DM',
      title: `New message from ${sender.displayName || sender.username}`,
      content: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      data: {
        senderId,
        conversationId,
        senderAvatar: sender.avatar
      },
      actionUrl: `/direct-messages/${conversationId}`,
      priority: 'high',
      channels: ['in_app', 'push']
    });
  }

  /**
   * Notify voice call
   */
  async notifyVoiceCall(recipientId: string, callerId: string, channelId: string, callType: 'voice' | 'video'): Promise<void> {
    const caller = await prisma.user.findUnique({
      where: { id: callerId },
      select: { username: true, displayName: true, avatar: true }
    });

    if (!caller) return;

    await this.createNotification({
      userId: recipientId,
      type: 'VOICE_CALL',
      title: `Incoming ${callType} call`,
      content: `${caller.displayName || caller.username} is calling you`,
      data: {
        callerId,
        channelId,
        callType,
        callerAvatar: caller.avatar
      },
      actionUrl: `/voice/${channelId}`,
      priority: 'urgent',
      channels: ['in_app', 'push']
    });
  }

  /**
   * Notify group invite
   */
  async notifyGroupInvite(recipientId: string, inviterId: string, groupId: string, groupName: string, groupType: 'server' | 'conversation'): Promise<void> {
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { username: true, displayName: true }
    });

    if (!inviter) return;

    await this.createNotification({
      userId: recipientId,
      type: 'GROUP_INVITE',
      title: `Invited to ${groupType}`,
      content: `${inviter.displayName || inviter.username} invited you to ${groupName}`,
      data: {
        inviterId,
        groupId,
        groupName,
        groupType
      },
      actionUrl: groupType === 'server' ? `/servers/${groupId}` : `/direct-messages/${groupId}`,
      priority: 'normal',
      channels: ['in_app', 'push']
    });
  }
}