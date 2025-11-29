import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { userProfileService } from './user-profile-service';

const prisma = new PrismaClient();

export interface ProfileUpdateEvent {
  userId: string;
  updateType: 'profile' | 'avatar' | 'status' | 'activity' | 'achievement';
  data: any;
  timestamp: Date;
}

export interface FollowEvent {
  followerId: string;
  followingId: string;
  action: 'follow' | 'unfollow';
  timestamp: Date;
}

export interface AchievementEvent {
  userId: string;
  achievementId: string;
  achievementName: string;
  achievementIcon: string;
  points: number;
  timestamp: Date;
}

export class ProfileRealtimeService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Setup WebSocket event handlers for profile-related events
   */
  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join-profile-room', async (data: { userId: string }) => {
        try {
          const { userId } = data;
          
          // Join user's personal room for profile updates
          socket.join(`user:${userId}`);
          
          // If authenticated, join rooms for users they follow
          if (socket.userId) {
            await this.joinFollowingRooms(socket, socket.userId);
          }

          socket.emit('profile-room-joined', { userId, success: true });
        } catch (error) {
          console.error('Error joining profile room:', error);
          socket.emit('profile-room-error', { error: 'Failed to join profile room' });
        }
      });

      socket.on('leave-profile-room', (data: { userId: string }) => {
        const { userId } = data;
        socket.leave(`user:${userId}`);
        socket.emit('profile-room-left', { userId, success: true });
      });

      socket.on('subscribe-to-user', async (data: { targetUserId: string }) => {
        try {
          if (!socket.userId) {
            socket.emit('subscription-error', { error: 'Authentication required' });
            return;
          }

          const { targetUserId } = data;
          
          // Check if user is following the target user
          const follow = await prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: socket.userId,
                followingId: targetUserId
              }
            }
          });

          if (follow) {
            socket.join(`user:${targetUserId}:followers`);
            socket.emit('user-subscribed', { targetUserId, success: true });
          } else {
            socket.emit('subscription-error', { error: 'Not following this user' });
          }
        } catch (error) {
          console.error('Error subscribing to user:', error);
          socket.emit('subscription-error', { error: 'Failed to subscribe to user' });
        }
      });

      socket.on('unsubscribe-from-user', (data: { targetUserId: string }) => {
        const { targetUserId } = data;
        socket.leave(`user:${targetUserId}:followers`);
        socket.emit('user-unsubscribed', { targetUserId, success: true });
      });

      socket.on('request-profile-status', async (data: { userId: string }) => {
        try {
          const { userId } = data;
          const profile = await userProfileService.getProfile(userId, socket.userId);
          
          if (profile) {
            socket.emit('profile-status', {
              userId,
              isOnline: await this.getUserOnlineStatus(userId),
              lastSeen: profile.lastSeenAt,
              profileCompleteness: profile.profileCompleteness
            });
          }
        } catch (error) {
          console.error('Error getting profile status:', error);
          socket.emit('profile-status-error', { error: 'Failed to get profile status' });
        }
      });

      socket.on('disconnect', () => {
        // Update user's last seen timestamp
        if (socket.userId) {
          this.updateUserLastSeen(socket.userId);
        }
      });
    });
  }

  /**
   * Join rooms for all users that the authenticated user is following
   */
  private async joinFollowingRooms(socket: any, userId: string) {
    try {
      const following = await prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });

      for (const follow of following) {
        socket.join(`user:${follow.followingId}:followers`);
      }
    } catch (error) {
      console.error('Error joining following rooms:', error);
    }
  }

  /**
   * Broadcast profile update to relevant users
   */
  async broadcastProfileUpdate(event: ProfileUpdateEvent) {
    const { userId, updateType, data, timestamp } = event;

    try {
      // Emit to user's own room
      this.io.to(`user:${userId}`).emit('profileUpdated', {
        userId,
        updateType,
        data,
        timestamp
      });

      // For certain updates, notify followers
      if (updateType === 'profile' || updateType === 'avatar') {
        this.io.to(`user:${userId}:followers`).emit('followedUserProfileUpdated', {
          userId,
          updateType,
          data: {
            displayName: data.displayName,
            avatar: data.avatar,
            bio: data.bio?.substring(0, 100) // Truncate for followers
          },
          timestamp
        });
      }

      // Log the broadcast for debugging
      console.log(`Profile update broadcasted for user ${userId}, type: ${updateType}`);
    } catch (error) {
      console.error('Error broadcasting profile update:', error);
    }
  }

  /**
   * Broadcast follow event to relevant users
   */
  async broadcastFollowEvent(event: FollowEvent) {
    const { followerId, followingId, action, timestamp } = event;

    try {
      // Get follower profile for notification
      const followerProfile = await userProfileService.getProfile(followerId, followingId);
      
      if (!followerProfile) return;

      if (action === 'follow') {
        // Notify the user being followed
        this.io.to(`user:${followingId}`).emit('newFollower', {
          follower: {
            id: followerProfile.id,
            username: followerProfile.username,
            displayName: followerProfile.displayName,
            avatar: followerProfile.avatar,
            isVerified: followerProfile.isVerified
          },
          timestamp
        });

        // Add follower to the followed user's follower room
        const followerSockets = await this.io.in(`user:${followerId}`).fetchSockets();
        for (const socket of followerSockets) {
          socket.join(`user:${followingId}:followers`);
        }
      } else if (action === 'unfollow') {
        // Notify the user being unfollowed
        this.io.to(`user:${followingId}`).emit('followerRemoved', {
          followerId,
          timestamp
        });

        // Remove follower from the followed user's follower room
        const followerSockets = await this.io.in(`user:${followerId}`).fetchSockets();
        for (const socket of followerSockets) {
          socket.leave(`user:${followingId}:followers`);
        }
      }

      console.log(`Follow event broadcasted: ${followerId} ${action} ${followingId}`);
    } catch (error) {
      console.error('Error broadcasting follow event:', error);
    }
  }

  /**
   * Broadcast achievement earned event
   */
  async broadcastAchievementEarned(event: AchievementEvent) {
    const { userId, achievementId, achievementName, achievementIcon, points, timestamp } = event;

    try {
      // Emit to user's own room
      this.io.to(`user:${userId}`).emit('achievementEarned', {
        achievementId,
        name: achievementName,
        icon: achievementIcon,
        points,
        timestamp
      });

      // For rare achievements, notify followers
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
        select: { rarity: true }
      });

      if (achievement && ['rare', 'epic', 'legendary'].includes(achievement.rarity)) {
        const userProfile = await userProfileService.getProfile(userId);
        
        this.io.to(`user:${userId}:followers`).emit('followedUserAchievement', {
          user: {
            id: userId,
            username: userProfile?.username,
            displayName: userProfile?.displayName,
            avatar: userProfile?.avatar
          },
          achievement: {
            id: achievementId,
            name: achievementName,
            icon: achievementIcon,
            rarity: achievement.rarity
          },
          timestamp
        });
      }

      console.log(`Achievement broadcasted for user ${userId}: ${achievementName}`);
    } catch (error) {
      console.error('Error broadcasting achievement:', error);
    }
  }

  /**
   * Broadcast user online status change
   */
  async broadcastStatusChange(userId: string, isOnline: boolean) {
    try {
      const timestamp = new Date();

      // Emit to user's followers
      this.io.to(`user:${userId}:followers`).emit('userStatusChanged', {
        userId,
        isOnline,
        timestamp
      });

      // Update last seen timestamp if going offline
      if (!isOnline) {
        await this.updateUserLastSeen(userId);
      }

      console.log(`Status change broadcasted for user ${userId}: ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error broadcasting status change:', error);
    }
  }

  /**
   * Broadcast activity update (new post, comment, etc.)
   */
  async broadcastActivityUpdate(userId: string, activityType: string, activityData: any) {
    try {
      const timestamp = new Date();

      // Only broadcast certain activity types to followers
      const broadcastableActivities = ['post_created', 'achievement_earned', 'milestone_reached'];
      
      if (broadcastableActivities.includes(activityType)) {
        const userProfile = await userProfileService.getProfile(userId);
        
        this.io.to(`user:${userId}:followers`).emit('followedUserActivity', {
          user: {
            id: userId,
            username: userProfile?.username,
            displayName: userProfile?.displayName,
            avatar: userProfile?.avatar
          },
          activityType,
          activityData,
          timestamp
        });
      }

      console.log(`Activity update broadcasted for user ${userId}: ${activityType}`);
    } catch (error) {
      console.error('Error broadcasting activity update:', error);
    }
  }

  /**
   * Send real-time notification to specific user
   */
  async sendNotificationToUser(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      this.io.to(`user:${userId}`).emit('notification', {
        ...notification,
        timestamp: new Date(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      console.log(`Notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Get list of online users from a list of user IDs
   */
  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    try {
      const onlineUsers: string[] = [];

      for (const userId of userIds) {
        const isOnline = await this.getUserOnlineStatus(userId);
        if (isOnline) {
          onlineUsers.push(userId);
        }
      }

      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  /**
   * Check if user is currently online
   */
  private async getUserOnlineStatus(userId: string): Promise<boolean> {
    try {
      const sockets = await this.io.in(`user:${userId}`).fetchSockets();
      return sockets.length > 0;
    } catch (error) {
      console.error('Error checking user online status:', error);
      return false;
    }
  }

  /**
   * Update user's last seen timestamp
   */
  private async updateUserLastSeen(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() }
      });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  }

  /**
   * Send typing indicator to followers (for direct messages or comments)
   */
  async broadcastTypingIndicator(userId: string, targetId: string, isTyping: boolean) {
    try {
      this.io.to(`user:${targetId}`).emit('typingIndicator', {
        userId,
        isTyping,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error broadcasting typing indicator:', error);
    }
  }

  /**
   * Broadcast profile view event (for analytics)
   */
  async broadcastProfileView(viewerId: string, profileId: string) {
    try {
      // Only notify profile owner if they want to see profile views
      const profileOwner = await userProfileService.getProfile(profileId, profileId);
      
      if (profileOwner && viewerId !== profileId) {
        this.io.to(`user:${profileId}`).emit('profileViewed', {
          viewerId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error broadcasting profile view:', error);
    }
  }

  /**
   * Get real-time statistics for a user
   */
  async getUserRealtimeStats(userId: string) {
    try {
      const [
        isOnline,
        followerSockets,
        recentActivity
      ] = await Promise.all([
        this.getUserOnlineStatus(userId),
        this.io.in(`user:${userId}:followers`).fetchSockets(),
        prisma.userActivityTimeline.findMany({
          where: {
            userId,
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          select: { activityType: true, timestamp: true }
        })
      ]);

      return {
        isOnline,
        onlineFollowers: followerSockets.length,
        recentActivityCount: recentActivity.length,
        lastActivity: recentActivity[0]?.timestamp || null
      };
    } catch (error) {
      console.error('Error getting realtime stats:', error);
      return {
        isOnline: false,
        onlineFollowers: 0,
        recentActivityCount: 0,
        lastActivity: null
      };
    }
  }
}

// Helper functions for easy integration

export function createProfileRealtimeService(io: SocketIOServer): ProfileRealtimeService {
  return new ProfileRealtimeService(io);
}

export function emitProfileUpdate(
  io: SocketIOServer, 
  userId: string, 
  updateType: ProfileUpdateEvent['updateType'], 
  data: any
) {
  const service = new ProfileRealtimeService(io);
  service.broadcastProfileUpdate({
    userId,
    updateType,
    data,
    timestamp: new Date()
  });
}

export function emitFollowEvent(
  io: SocketIOServer,
  followerId: string,
  followingId: string,
  action: 'follow' | 'unfollow'
) {
  const service = new ProfileRealtimeService(io);
  service.broadcastFollowEvent({
    followerId,
    followingId,
    action,
    timestamp: new Date()
  });
}

export function emitAchievementEarned(
  io: SocketIOServer,
  userId: string,
  achievementId: string,
  achievementName: string,
  achievementIcon: string,
  points: number
) {
  const service = new ProfileRealtimeService(io);
  service.broadcastAchievementEarned({
    userId,
    achievementId,
    achievementName,
    achievementIcon,
    points,
    timestamp: new Date()
  });
}