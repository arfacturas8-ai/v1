import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { EnhancedPushNotificationService } from './enhanced-push-notifications';
import { NotificationTriggersService } from './notification-triggers';
import { NotificationQueueService } from './notification-queue';

/**
 * Notification Integration Service
 * Centralizes all notification services and provides a unified interface
 * for the rest of the application to trigger notifications
 */
export class NotificationIntegrationService {
  private app: FastifyInstance;
  private prisma: PrismaClient;
  private pushService: EnhancedPushNotificationService;
  private triggersService: NotificationTriggersService;
  private queueService: NotificationQueueService;

  constructor(app: FastifyInstance) {
    this.app = app;
    this.prisma = (app as any).prisma;
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize all notification services
    this.pushService = new EnhancedPushNotificationService(this.app);
    this.triggersService = new NotificationTriggersService(this.app, this.pushService);
    this.queueService = new NotificationQueueService(this.app);

    // Make services available globally on the app instance
    (this.app as any).pushNotificationService = this.pushService;
    (this.app as any).notificationTriggersService = this.triggersService;
    (this.app as any).notificationQueueService = this.queueService;

    this.app.log.info('Notification integration service initialized');
  }

  /**
   * Setup notification triggers for existing routes
   * This method should be called after all routes are registered
   */
  setupRouteIntegrations() {
    this.setupMessageIntegrations();
    this.setupPostIntegrations();
    this.setupSocialIntegrations();
    this.setupServerIntegrations();
    this.setupVoiceIntegrations();
    this.setupCryptoIntegrations();
  }

  /**
   * Setup message-related notification triggers
   */
  private setupMessageIntegrations() {
    // Hook into message creation
    this.app.addHook('onSend', async (request, reply, payload) => {
      try {
        if (request.routerPath?.includes('/api/messages') && request.method === 'POST') {
          const responseData = JSON.parse(payload as string);
          
          if (responseData.success && responseData.message) {
            const message = responseData.message;
            
            // Trigger DM notification
            if (message.channelType === 'DM' && message.recipientId) {
              await this.triggersService.onNewDirectMessage(
                message.userId,
                message.recipientId,
                message.content,
                message.channelId
              );
            }
            
            // Trigger channel message notification
            if (message.channelType === 'CHANNEL' && message.mentions?.length > 0) {
              await this.triggersService.onNewChannelMessage(
                message.userId,
                message.channelId,
                message.content,
                message.mentions
              );
            }
          }
        }
      } catch (error) {
        this.app.log.error('Error in message notification hook:', error);
      }
    });
  }

  /**
   * Setup post-related notification triggers
   */
  private setupPostIntegrations() {
    // Hook into comment creation
    this.app.addHook('onSend', async (request, reply, payload) => {
      try {
        if (request.routerPath?.includes('/api/comments') && request.method === 'POST') {
          const responseData = JSON.parse(payload as string);
          
          if (responseData.success && responseData.comment) {
            const comment = responseData.comment;
            
            // Trigger post comment notification
            if (comment.postId && !comment.parentId) {
              await this.triggersService.onNewPostComment(
                comment.userId,
                comment.postId,
                comment.content
              );
            }
            
            // Trigger comment reply notification
            if (comment.parentId) {
              await this.triggersService.onPostReply(
                comment.userId,
                comment.parentId,
                comment.content
              );
            }
          }
        }
      } catch (error) {
        this.app.log.error('Error in comment notification hook:', error);
      }
    });

    // Hook into vote/like creation
    this.app.addHook('onSend', async (request, reply, payload) => {
      try {
        if (request.routerPath?.includes('/api/votes') && request.method === 'POST') {
          const responseData = JSON.parse(payload as string);
          
          if (responseData.success && responseData.vote) {
            const vote = responseData.vote;
            
            // Only trigger for positive votes (likes)
            if (vote.value > 0 && vote.postId) {
              await this.triggersService.onPostLike(vote.userId, vote.postId);
            }
          }
        }
      } catch (error) {
        this.app.log.error('Error in vote notification hook:', error);
      }
    });
  }

  /**
   * Setup social interaction notification triggers
   */
  private setupSocialIntegrations() {
    // Hook into friendship creation
    this.app.addHook('onSend', async (request, reply, payload) => {
      try {
        if (request.routerPath?.includes('/api/friends') && request.method === 'POST') {
          const responseData = JSON.parse(payload as string);
          
          if (responseData.success && responseData.friendship) {
            const friendship = responseData.friendship;
            
            if (friendship.status === 'PENDING') {
              // Friend request sent
              await this.triggersService.onFriendRequest(
                friendship.initiatorId,
                friendship.receiverId
              );
            } else if (friendship.status === 'ACCEPTED') {
              // Friend request accepted - notify both users
              await this.triggersService.onNewFollower(
                friendship.receiverId,
                friendship.initiatorId
              );
            }
          }
        }
      } catch (error) {
        this.app.log.error('Error in friendship notification hook:', error);
      }
    });
  }

  /**
   * Setup server-related notification triggers
   */
  private setupServerIntegrations() {
    // Hook into server invites
    this.app.addHook('onSend', async (request, reply, payload) => {
      try {
        if (request.routerPath?.includes('/api/servers/invite') && request.method === 'POST') {
          const responseData = JSON.parse(payload as string);
          
          if (responseData.success && responseData.invite) {
            const invite = responseData.invite;
            
            await this.triggersService.onServerInvite(
              invite.inviterId,
              invite.invitedUserId,
              invite.serverId
            );
          }
        }
        
        if (request.routerPath?.includes('/api/communities/invite') && request.method === 'POST') {
          const responseData = JSON.parse(payload as string);
          
          if (responseData.success && responseData.invite) {
            const invite = responseData.invite;
            
            await this.triggersService.onCommunityInvite(
              invite.inviterId,
              invite.invitedUserId,
              invite.communityId
            );
          }
        }
      } catch (error) {
        this.app.log.error('Error in server notification hook:', error);
      }
    });
  }

  /**
   * Setup voice/video call notification triggers
   */
  private setupVoiceIntegrations() {
    // These would typically be triggered by Socket.IO events
    // We'll add methods that can be called from socket handlers
  }

  /**
   * Setup crypto-related notification triggers
   */
  private setupCryptoIntegrations() {
    // Hook into crypto tip creation
    this.app.addHook('onSend', async (request, reply, payload) => {
      try {
        if (request.routerPath?.includes('/api/crypto/tips') && request.method === 'POST') {
          const responseData = JSON.parse(payload as string);
          
          if (responseData.success && responseData.tip) {
            const tip = responseData.tip;
            
            await this.triggersService.onCryptoTipReceived(
              tip.senderId,
              tip.recipientId,
              tip.amount,
              tip.currency
            );
          }
        }
      } catch (error) {
        this.app.log.error('Error in crypto notification hook:', error);
      }
    });
  }

  /**
   * Public API for manually triggering notifications
   */

  async triggerMessageNotification(senderId: string, recipientId: string, messageContent: string, channelId: string) {
    return this.triggersService.onNewDirectMessage(senderId, recipientId, messageContent, channelId);
  }

  async triggerMentionNotification(mentionerId: string, mentionedId: string, content: string, postId?: string, commentId?: string, channelId?: string) {
    return this.triggersService.onMention(mentionerId, mentionedId, content, postId, commentId, channelId);
  }

  async triggerVoiceCallNotification(callerId: string, recipientId: string, channelId: string) {
    return this.triggersService.onVoiceCall(callerId, recipientId, channelId);
  }

  async triggerVideoCallNotification(callerId: string, recipientId: string, channelId: string) {
    return this.triggersService.onVideoCall(callerId, recipientId, channelId);
  }

  async triggerFollowNotification(followerId: string, followedId: string) {
    return this.triggersService.onNewFollower(followerId, followedId);
  }

  async triggerMaintenanceNotification(userIds: string[], title: string, message: string, scheduledAt?: Date) {
    return this.triggersService.onMaintenanceNotification(userIds, title, message, scheduledAt);
  }

  async triggerSecurityAlert(userId: string, alertType: string, details: string) {
    return this.triggersService.onSecurityAlert(userId, alertType, details);
  }

  async sendAnnouncementToAllUsers(title: string, body: string, data?: Record<string, any>) {
    return this.triggersService.sendAnnouncementToAllUsers(title, body, data);
  }

  /**
   * Device management
   */

  async registerDevice(userId: string, deviceData: any) {
    return this.pushService.registerDevice(userId, deviceData);
  }

  async unregisterDevice(userId: string, deviceToken: string) {
    return this.pushService.unregisterDevice(userId, deviceToken);
  }

  /**
   * Preference management
   */

  async getNotificationPreferences(userId: string) {
    return this.pushService.getNotificationPreferences(userId);
  }

  async updateNotificationPreferences(userId: string, preferences: any) {
    return this.pushService.updateNotificationPreferences(userId, preferences);
  }

  /**
   * Queue management
   */

  async queueNotification(notificationData: any, options?: any) {
    return this.queueService.queueNotification(notificationData, options);
  }

  async queueBulkNotifications(notifications: any[], options?: any) {
    return this.queueService.queueBulkNotifications(notifications, options);
  }

  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  async retryFailedNotifications(maxAge?: number) {
    return this.queueService.retryFailedNotifications(maxAge);
  }

  /**
   * Analytics and monitoring
   */

  async getDeliveryStats(userId?: string, startDate?: Date, endDate?: Date) {
    return this.pushService.getDeliveryStats(userId, startDate, endDate);
  }

  async getNotificationMetrics() {
    return this.pushService.getNotificationMetrics();
  }

  /**
   * Template management
   */

  async getNotificationTemplates() {
    return this.prisma.notificationTemplate.findMany({
      where: { isActive: true },
      orderBy: { type: 'asc' },
    });
  }

  async createNotificationTemplate(templateData: any) {
    return this.prisma.notificationTemplate.create({
      data: templateData,
    });
  }

  async updateNotificationTemplate(templateId: string, updateData: any) {
    return this.prisma.notificationTemplate.update({
      where: { id: templateId },
      data: updateData,
    });
  }

  /**
   * Manual notification sending
   */

  async sendCustomNotification(userId: string, notificationData: any) {
    return this.pushService.sendNotification({
      userId,
      ...notificationData,
    });
  }

  /**
   * Utility methods
   */

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      // Check if user has active presence or recent activity
      const presence = await this.prisma.userPresence.findUnique({
        where: { userId },
      });

      if (presence && presence.status !== 'OFFLINE') {
        return true;
      }

      // Fallback: check recent activity (last 5 minutes)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { lastSeenAt: true },
      });

      if (user?.lastSeenAt) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return user.lastSeenAt > fiveMinutesAgo;
      }

      return false;
    } catch (error) {
      this.app.log.error('Error checking user online status:', error);
      return false;
    }
  }

  async shouldNotifyUser(userId: string, notificationType: string): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      
      // Check if user has notifications enabled for this type
      const typeEnabled = this.getNotificationTypePreference(preferences, notificationType);
      
      if (!typeEnabled) {
        return false;
      }

      // Check quiet hours
      if (preferences.quietHoursEnabled && preferences.quietHoursStart && preferences.quietHoursEnd) {
        const now = new Date();
        const timezone = preferences.timezone || 'UTC';
        
        // Simple quiet hours check (this could be more sophisticated)
        const userTime = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        }).format(now);

        const currentTime = userTime.replace(':', '');
        const startTime = preferences.quietHoursStart.replace(':', '');
        const endTime = preferences.quietHoursEnd.replace(':', '');

        // Handle overnight quiet hours
        if (startTime > endTime) {
          if (currentTime >= startTime || currentTime <= endTime) {
            return false; // In quiet hours
          }
        } else {
          if (currentTime >= startTime && currentTime <= endTime) {
            return false; // In quiet hours
          }
        }
      }

      return true;
    } catch (error) {
      this.app.log.error('Error checking if should notify user:', error);
      return true; // Default to allowing notifications if there's an error
    }
  }

  private getNotificationTypePreference(preferences: any, type: string): boolean {
    switch (type) {
      case 'MESSAGE':
      case 'DM':
        return preferences.newMessageEnabled && preferences.dmEnabled;
      case 'MENTION':
        return preferences.mentionEnabled;
      case 'REPLY':
        return preferences.replyEnabled;
      case 'FOLLOW':
        return preferences.followEnabled;
      case 'LIKE':
      case 'POST_LIKE':
        return preferences.likeEnabled;
      case 'COMMENT':
      case 'POST_COMMENT':
        return preferences.commentEnabled;
      case 'AWARD':
        return preferences.awardEnabled;
      case 'SYSTEM':
      case 'MAINTENANCE':
      case 'SECURITY_ALERT':
        return preferences.systemEnabled;
      case 'VOICE_CALL':
      case 'VIDEO_CALL':
        return preferences.voiceCallEnabled;
      case 'SERVER_INVITE':
        return preferences.serverInviteEnabled;
      case 'COMMUNITY_INVITE':
        return preferences.communityInviteEnabled;
      default:
        return true;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      this.app.log.info('Shutting down notification integration service...');
      
      if (this.queueService) {
        await this.queueService.shutdown();
      }

      this.app.log.info('Notification integration service shut down successfully');
    } catch (error) {
      this.app.log.error('Error shutting down notification integration service:', error);
    }
  }
}

export function createNotificationIntegrationService(app: FastifyInstance) {
  return new NotificationIntegrationService(app);
}