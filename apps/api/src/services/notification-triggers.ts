import { FastifyInstance } from 'fastify';
import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';
import { EnhancedPushNotificationService } from './enhanced-push-notifications';

/**
 * Notification Triggers Service
 * Handles automatic notification triggering for various platform events
 */
export class NotificationTriggersService {
  private app: FastifyInstance;
  private prisma: PrismaClient;
  private pushService: EnhancedPushNotificationService;

  constructor(app: FastifyInstance, pushService: EnhancedPushNotificationService) {
    this.app = app;
    this.prisma = (app as any).prisma;
    this.pushService = pushService;
  }

  /**
   * Message-related triggers
   */

  async onNewDirectMessage(senderId: string, recipientId: string, messageContent: string, channelId: string) {
    try {
      // Don't send notification to sender
      if (senderId === recipientId) return;

      // Check if recipient has DM notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(recipientId);
      if (!preferences.dmEnabled) return;

      // Get sender info
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!sender) return;

      // Trigger notification
      await this.pushService.sendNotification({
        userId: recipientId,
        type: NotificationType.DM,
        title: `Message from ${sender.displayName}`,
        body: this.truncateContent(messageContent),
        data: {
          senderId,
          channelId,
          senderName: sender.displayName,
          senderAvatar: sender.avatar,
          type: 'dm',
        },
        priority: NotificationPriority.HIGH,
      });

      this.app.log.info(`DM notification sent: ${senderId} → ${recipientId}`);
    } catch (error) {
      this.app.log.error('Error in onNewDirectMessage:', error);
    }
  }

  async onNewChannelMessage(senderId: string, channelId: string, messageContent: string, mentionedUserIds: string[] = []) {
    try {
      // Get channel info
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: { Server: true },
      });

      if (!channel) return;

      // Get sender info
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { displayName: true, username: true },
      });

      if (!sender) return;

      // Send mention notifications
      for (const mentionedUserId of mentionedUserIds) {
        if (mentionedUserId === senderId) continue;

        await this.onMention(senderId, mentionedUserId, messageContent, undefined, undefined, channelId);
      }

      // Send channel activity notifications to online members
      await this.notifyChannelActivity(senderId, channelId, messageContent, channel.name);

    } catch (error) {
      this.app.log.error('Error in onNewChannelMessage:', error);
    }
  }

  private async notifyChannelActivity(senderId: string, channelId: string, messageContent: string, channelName: string) {
    try {
      // Get channel members who have notifications enabled for this channel
      // This would require a channel notification preferences table
      // For now, we'll skip general channel notifications and only handle mentions
      
      // TODO: Implement channel-specific notification preferences
    } catch (error) {
      this.app.log.error('Error in notifyChannelActivity:', error);
    }
  }

  /**
   * Mention triggers
   */

  async onMention(mentionerId: string, mentionedId: string, content: string, postId?: string, commentId?: string, channelId?: string) {
    try {
      if (mentionerId === mentionedId) return;

      // Check if user has mention notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(mentionedId);
      if (!preferences.mentionEnabled) return;

      // Get mentioner info
      const mentioner = await this.prisma.user.findUnique({
        where: { id: mentionerId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!mentioner) return;

      // Determine context
      let contextTitle = 'mentioned you';
      let contextData: any = {
        mentionerId,
        mentionerName: mentioner.displayName,
        mentionerAvatar: mentioner.avatar,
        type: 'mention',
      };

      if (postId) {
        contextTitle = 'mentioned you in a post';
        contextData.postId = postId;
      } else if (commentId) {
        contextTitle = 'mentioned you in a comment';
        contextData.commentId = commentId;
      } else if (channelId) {
        contextTitle = 'mentioned you in a channel';
        contextData.channelId = channelId;
      }

      await this.pushService.sendNotification({
        userId: mentionedId,
        type: NotificationType.MENTION,
        title: `${mentioner.displayName} ${contextTitle}`,
        body: this.truncateContent(content),
        data: contextData,
        priority: NotificationPriority.HIGH,
      });

      this.app.log.info(`Mention notification sent: ${mentionerId} → ${mentionedId}`);
    } catch (error) {
      this.app.log.error('Error in onMention:', error);
    }
  }

  /**
   * Post and comment triggers
   */

  async onNewPostComment(commenterId: string, postId: string, commentContent: string) {
    try {
      // Get post info and author
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        include: { User: { select: { id: true, displayName: true } } },
      });

      if (!post || commenterId === post.userId) return;

      // Check if post author has comment notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(post.userId);
      if (!preferences.commentEnabled) return;

      // Get commenter info
      const commenter = await this.prisma.user.findUnique({
        where: { id: commenterId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!commenter) return;

      await this.pushService.sendNotification({
        userId: post.userId,
        type: NotificationType.POST_COMMENT,
        title: 'New comment on your post',
        body: `${commenter.displayName}: ${this.truncateContent(commentContent)}`,
        data: {
          postId,
          commenterId,
          commenterName: commenter.displayName,
          commenterAvatar: commenter.avatar,
          postTitle: post.title,
          type: 'post_comment',
        },
        priority: NotificationPriority.NORMAL,
      });

      this.app.log.info(`Post comment notification sent: ${commenterId} → ${post.userId}`);
    } catch (error) {
      this.app.log.error('Error in onNewPostComment:', error);
    }
  }

  async onPostReply(replierId: string, parentCommentId: string, replyContent: string) {
    try {
      // Get parent comment and its author
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentCommentId },
        include: { User: { select: { id: true, displayName: true } } },
      });

      if (!parentComment || replierId === parentComment.userId) return;

      // Check if comment author has reply notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(parentComment.userId);
      if (!preferences.replyEnabled) return;

      // Get replier info
      const replier = await this.prisma.user.findUnique({
        where: { id: replierId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!replier) return;

      await this.pushService.sendNotification({
        userId: parentComment.userId,
        type: NotificationType.REPLY,
        title: 'New reply to your comment',
        body: `${replier.displayName}: ${this.truncateContent(replyContent)}`,
        data: {
          parentCommentId,
          replierId,
          replierName: replier.displayName,
          replierAvatar: replier.avatar,
          type: 'comment_reply',
        },
        priority: NotificationPriority.NORMAL,
      });

      this.app.log.info(`Reply notification sent: ${replierId} → ${parentComment.userId}`);
    } catch (error) {
      this.app.log.error('Error in onPostReply:', error);
    }
  }

  async onPostLike(likerId: string, postId: string) {
    try {
      // Get post and its author
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        include: { User: { select: { id: true, displayName: true } } },
      });

      if (!post || likerId === post.userId) return;

      // Check if post author has like notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(post.userId);
      if (!preferences.likeEnabled) return;

      // Get liker info
      const liker = await this.prisma.user.findUnique({
        where: { id: likerId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!liker) return;

      await this.pushService.sendNotification({
        userId: post.userId,
        type: NotificationType.POST_LIKE,
        title: 'Someone liked your post',
        body: `${liker.displayName} liked your post: "${this.truncateContent(post.title)}"`,
        data: {
          postId,
          likerId,
          likerName: liker.displayName,
          likerAvatar: liker.avatar,
          postTitle: post.title,
          type: 'post_like',
        },
        priority: NotificationPriority.LOW,
      });

      this.app.log.info(`Post like notification sent: ${likerId} → ${post.userId}`);
    } catch (error) {
      this.app.log.error('Error in onPostLike:', error);
    }
  }

  /**
   * Social triggers
   */

  async onNewFollower(followerId: string, followedId: string) {
    try {
      if (followerId === followedId) return;

      // Check if user has follow notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(followedId);
      if (!preferences.followEnabled) return;

      // Get follower info
      const follower = await this.prisma.user.findUnique({
        where: { id: followerId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!follower) return;

      await this.pushService.sendNotification({
        userId: followedId,
        type: NotificationType.FOLLOW,
        title: 'New follower',
        body: `${follower.displayName} started following you`,
        data: {
          followerId,
          followerName: follower.displayName,
          followerUsername: follower.username,
          followerAvatar: follower.avatar,
          type: 'follow',
        },
        priority: NotificationPriority.NORMAL,
      });

      this.app.log.info(`Follow notification sent: ${followerId} → ${followedId}`);
    } catch (error) {
      this.app.log.error('Error in onNewFollower:', error);
    }
  }

  async onFriendRequest(requesterId: string, recipientId: string) {
    try {
      if (requesterId === recipientId) return;

      // Get requester info
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!requester) return;

      await this.pushService.sendNotification({
        userId: recipientId,
        type: NotificationType.FRIEND_REQUEST,
        title: 'Friend request',
        body: `${requester.displayName} sent you a friend request`,
        data: {
          requesterId,
          requesterName: requester.displayName,
          requesterUsername: requester.username,
          requesterAvatar: requester.avatar,
          type: 'friend_request',
        },
        priority: NotificationPriority.NORMAL,
      });

      this.app.log.info(`Friend request notification sent: ${requesterId} → ${recipientId}`);
    } catch (error) {
      this.app.log.error('Error in onFriendRequest:', error);
    }
  }

  /**
   * Voice and video triggers
   */

  async onVoiceCall(callerId: string, recipientId: string, channelId: string) {
    try {
      if (callerId === recipientId) return;

      // Check if user has voice call notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(recipientId);
      if (!preferences.voiceCallEnabled) return;

      // Get caller info
      const caller = await this.prisma.user.findUnique({
        where: { id: callerId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!caller) return;

      await this.pushService.sendNotification({
        userId: recipientId,
        type: NotificationType.VOICE_CALL,
        title: 'Incoming voice call',
        body: `${caller.displayName} is calling you`,
        data: {
          callerId,
          callerName: caller.displayName,
          callerAvatar: caller.avatar,
          channelId,
          type: 'voice_call',
        },
        priority: NotificationPriority.CRITICAL,
      });

      this.app.log.info(`Voice call notification sent: ${callerId} → ${recipientId}`);
    } catch (error) {
      this.app.log.error('Error in onVoiceCall:', error);
    }
  }

  async onVideoCall(callerId: string, recipientId: string, channelId: string) {
    try {
      if (callerId === recipientId) return;

      // Check if user has voice call notifications enabled (using same setting for video)
      const preferences = await this.pushService.getNotificationPreferences(recipientId);
      if (!preferences.voiceCallEnabled) return;

      // Get caller info
      const caller = await this.prisma.user.findUnique({
        where: { id: callerId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!caller) return;

      await this.pushService.sendNotification({
        userId: recipientId,
        type: NotificationType.VIDEO_CALL,
        title: 'Incoming video call',
        body: `${caller.displayName} is calling you`,
        data: {
          callerId,
          callerName: caller.displayName,
          callerAvatar: caller.avatar,
          channelId,
          type: 'video_call',
        },
        priority: NotificationPriority.CRITICAL,
      });

      this.app.log.info(`Video call notification sent: ${callerId} → ${recipientId}`);
    } catch (error) {
      this.app.log.error('Error in onVideoCall:', error);
    }
  }

  /**
   * Server and community triggers
   */

  async onServerInvite(inviterId: string, invitedId: string, serverId: string) {
    try {
      if (inviterId === invitedId) return;

      // Check if user has server invite notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(invitedId);
      if (!preferences.serverInviteEnabled) return;

      // Get inviter and server info
      const [inviter, server] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: inviterId },
          select: { displayName: true, username: true, avatar: true },
        }),
        this.prisma.server.findUnique({
          where: { id: serverId },
          select: { name: true, icon: true },
        }),
      ]);

      if (!inviter || !server) return;

      await this.pushService.sendNotification({
        userId: invitedId,
        type: NotificationType.SERVER_INVITE,
        title: 'Server invitation',
        body: `${inviter.displayName} invited you to join ${server.name}`,
        data: {
          inviterId,
          inviterName: inviter.displayName,
          inviterAvatar: inviter.avatar,
          serverId,
          serverName: server.name,
          serverIcon: server.icon,
          type: 'server_invite',
        },
        priority: NotificationPriority.NORMAL,
      });

      this.app.log.info(`Server invite notification sent: ${inviterId} → ${invitedId}`);
    } catch (error) {
      this.app.log.error('Error in onServerInvite:', error);
    }
  }

  async onCommunityInvite(inviterId: string, invitedId: string, communityId: string) {
    try {
      if (inviterId === invitedId) return;

      // Check if user has community invite notifications enabled
      const preferences = await this.pushService.getNotificationPreferences(invitedId);
      if (!preferences.communityInviteEnabled) return;

      // Get inviter and community info
      const [inviter, community] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: inviterId },
          select: { displayName: true, username: true, avatar: true },
        }),
        this.prisma.community.findUnique({
          where: { id: communityId },
          select: { displayName: true, icon: true },
        }),
      ]);

      if (!inviter || !community) return;

      await this.pushService.sendNotification({
        userId: invitedId,
        type: NotificationType.COMMUNITY_INVITE,
        title: 'Community invitation',
        body: `${inviter.displayName} invited you to join ${community.displayName}`,
        data: {
          inviterId,
          inviterName: inviter.displayName,
          inviterAvatar: inviter.avatar,
          communityId,
          communityName: community.displayName,
          communityIcon: community.icon,
          type: 'community_invite',
        },
        priority: NotificationPriority.NORMAL,
      });

      this.app.log.info(`Community invite notification sent: ${inviterId} → ${invitedId}`);
    } catch (error) {
      this.app.log.error('Error in onCommunityInvite:', error);
    }
  }

  /**
   * Web3 and crypto triggers
   */

  async onCryptoTipReceived(senderId: string, recipientId: string, amount: string, currency: string) {
    try {
      if (senderId === recipientId) return;

      // Get sender info
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { displayName: true, username: true, avatar: true },
      });

      if (!sender) return;

      await this.pushService.sendNotification({
        userId: recipientId,
        type: NotificationType.CRYPTO_TIP,
        title: 'Crypto tip received!',
        body: `${sender.displayName} sent you ${amount} ${currency}`,
        data: {
          senderId,
          senderName: sender.displayName,
          senderAvatar: sender.avatar,
          amount,
          currency,
          type: 'crypto_tip',
        },
        priority: NotificationPriority.HIGH,
      });

      this.app.log.info(`Crypto tip notification sent: ${senderId} → ${recipientId}`);
    } catch (error) {
      this.app.log.error('Error in onCryptoTipReceived:', error);
    }
  }

  async onNFTTransfer(fromId: string, toId: string, nftId: string) {
    try {
      if (fromId === toId) return;

      // Get sender and NFT info
      const [sender, nft] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: fromId },
          select: { displayName: true, username: true, avatar: true },
        }),
        this.prisma.nFT.findUnique({
          where: { id: nftId },
          select: { name: true, image: true },
        }),
      ]);

      if (!sender || !nft) return;

      await this.pushService.sendNotification({
        userId: toId,
        type: NotificationType.NFT_TRANSFER,
        title: 'NFT received!',
        body: `${sender.displayName} sent you "${nft.name}"`,
        data: {
          fromId,
          senderName: sender.displayName,
          senderAvatar: sender.avatar,
          nftId,
          nftName: nft.name,
          nftImage: nft.image,
          type: 'nft_transfer',
        },
        priority: NotificationPriority.HIGH,
      });

      this.app.log.info(`NFT transfer notification sent: ${fromId} → ${toId}`);
    } catch (error) {
      this.app.log.error('Error in onNFTTransfer:', error);
    }
  }

  /**
   * System triggers
   */

  async onMaintenanceNotification(userIds: string[], title: string, message: string, scheduledAt?: Date) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type: NotificationType.MAINTENANCE,
        title,
        body: message,
        data: {
          type: 'maintenance',
          scheduledAt: scheduledAt?.toISOString(),
        },
        priority: NotificationPriority.HIGH,
        scheduledAt,
      }));

      await this.pushService.sendBulkNotifications(notifications);
      this.app.log.info(`Maintenance notifications sent to ${userIds.length} users`);
    } catch (error) {
      this.app.log.error('Error in onMaintenanceNotification:', error);
    }
  }

  async onSecurityAlert(userId: string, alertType: string, details: string) {
    try {
      await this.pushService.sendNotification({
        userId,
        type: NotificationType.SECURITY_ALERT,
        title: 'Security Alert',
        body: details,
        data: {
          alertType,
          type: 'security_alert',
        },
        priority: NotificationPriority.CRITICAL,
      });

      this.app.log.info(`Security alert notification sent to user ${userId}`);
    } catch (error) {
      this.app.log.error('Error in onSecurityAlert:', error);
    }
  }

  /**
   * Utility methods
   */

  private truncateContent(content: string, maxLength: number = 120): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Batch notification for announcements
   */
  async sendAnnouncementToAllUsers(title: string, body: string, data?: Record<string, any>) {
    try {
      // Get all active users (you might want to paginate this for large user bases)
      const users = await this.prisma.user.findMany({
        where: {
          bannedAt: null,
          lastSeenAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active in last 30 days
          },
        },
        select: { id: true },
        take: 10000, // Limit to prevent memory issues
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title,
        body,
        data: { ...data, type: 'announcement' },
        priority: NotificationPriority.NORMAL,
      }));

      // Send in batches to avoid overwhelming the system
      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await this.pushService.sendBulkNotifications(batch);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.app.log.info(`Announcement sent to ${notifications.length} users`);
    } catch (error) {
      this.app.log.error('Error in sendAnnouncementToAllUsers:', error);
    }
  }
}

export function createNotificationTriggersService(app: FastifyInstance, pushService: EnhancedPushNotificationService) {
  return new NotificationTriggersService(app, pushService);
}