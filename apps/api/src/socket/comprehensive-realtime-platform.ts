import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import { prisma } from '@cryb/database';
import { RealtimeMessagingSystem } from './realtime-messaging';

/**
 * COMPREHENSIVE REAL-TIME PLATFORM FOR CRYB
 * 
 * Features implemented:
 * ✅ Real-time messaging with delivery receipts
 * ✅ Typing indicators and presence tracking
 * ✅ Live notifications system
 * ✅ Real-time post voting and comments
 * ✅ Live user activity feeds
 * ✅ Voice channel management
 * ✅ Screen sharing capabilities
 * ✅ Message reactions and emojis
 * ✅ Real-time search suggestions
 * ✅ Live moderation events
 * ✅ Redis pub/sub for horizontal scaling
 * 
 * Designed for scalability to handle thousands of concurrent users
 */

interface VoteData {
  postId: string;
  commentId?: string;
  voteType: 'up' | 'down' | 'none';
  userId: string;
  username: string;
  timestamp: Date;
}

interface CommentData {
  id: string;
  postId: string;
  parentId?: string;
  content: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  upvotes: number;
  downvotes: number;
  replies?: CommentData[];
}

interface ActivityData {
  id: string;
  type: 'post_created' | 'comment_added' | 'vote_cast' | 'user_joined' | 'user_left' | 'mention' | 'award_given';
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  content: string;
  targetId?: string;
  targetType?: 'post' | 'comment' | 'user';
  communityId?: string;
  timestamp: Date;
  metadata?: any;
}

interface VoiceChannelData {
  id: string;
  name: string;
  serverId: string;
  categoryId?: string;
  type: 'voice' | 'stage';
  maxUsers?: number;
  currentUsers: VoiceUser[];
  isActive: boolean;
  roomId?: string; // LiveKit room ID
  createdAt: Date;
}

interface VoiceUser {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
  permissions: {
    canSpeak: boolean;
    canManage: boolean;
  };
}

interface ScreenShareData {
  id: string;
  userId: string;
  username: string;
  channelId: string;
  streamId: string;
  isActive: boolean;
  quality: 'low' | 'medium' | 'high';
  participants: string[];
  startedAt: Date;
}

interface ReactionData {
  messageId: string;
  emoji: string;
  userId: string;
  username: string;
  timestamp: Date;
}

interface SearchSuggestion {
  type: 'user' | 'community' | 'post' | 'channel';
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  score: number;
}

interface ModerationEvent {
  id: string;
  type: 'message_deleted' | 'user_banned' | 'user_kicked' | 'user_warned' | 'post_removed' | 'comment_removed';
  moderatorId: string;
  moderatorUsername: string;
  targetId: string;
  targetType: 'user' | 'message' | 'post' | 'comment';
  reason?: string;
  duration?: number; // For bans/timeouts
  channelId?: string;
  serverId?: string;
  timestamp: Date;
  metadata?: any;
}

// Rate limiting configurations for all features
const COMPREHENSIVE_RATE_LIMITS = {
  // Messaging
  'message:send': { windowMs: 60000, maxRequests: 30 },
  'message:edit': { windowMs: 60000, maxRequests: 10 },
  'message:delete': { windowMs: 60000, maxRequests: 5 },
  'message:react': { windowMs: 60000, maxRequests: 50 },
  
  // Typing and presence
  'typing:start': { windowMs: 10000, maxRequests: 10 },
  'typing:stop': { windowMs: 10000, maxRequests: 10 },
  'presence:update': { windowMs: 30000, maxRequests: 5 },
  
  // Voting and commenting
  'vote:cast': { windowMs: 60000, maxRequests: 100 },
  'comment:create': { windowMs: 60000, maxRequests: 20 },
  'comment:edit': { windowMs: 60000, maxRequests: 10 },
  'comment:delete': { windowMs: 60000, maxRequests: 5 },
  
  // Voice and screen sharing
  'voice:join': { windowMs: 60000, maxRequests: 20 },
  'voice:leave': { windowMs: 60000, maxRequests: 20 },
  'voice:mute': { windowMs: 10000, maxRequests: 50 },
  'screenshare:start': { windowMs: 300000, maxRequests: 5 }, // 5 times per 5 minutes
  'screenshare:stop': { windowMs: 60000, maxRequests: 10 },
  
  // Search and activities
  'search:suggest': { windowMs: 10000, maxRequests: 20 },
  'activity:request': { windowMs: 60000, maxRequests: 30 },
  
  // Room management
  'room:join': { windowMs: 60000, maxRequests: 50 },
  'room:leave': { windowMs: 60000, maxRequests: 50 },
  
  // Notifications
  'notification:mark_read': { windowMs: 60000, maxRequests: 100 },
};

export class ComprehensiveRealtimePlatform {
  private io: Server;
  private redis: Redis;
  private fastify: FastifyInstance;
  private messagingSystem: RealtimeMessagingSystem;
  
  // Enhanced in-memory stores
  private voiceChannelsMap = new Map<string, VoiceChannelData>();
  private screenSharesMap = new Map<string, ScreenShareData>();
  private messageReactionsMap = new Map<string, Map<string, ReactionData[]>>(); // messageId -> emoji -> reactions
  private searchCacheMap = new Map<string, SearchSuggestion[]>();
  private activityFeedMap = new Map<string, ActivityData[]>(); // userId -> activities
  private rateLimitMap = new Map<string, Map<string, { count: number; resetTime: number }>>();
  
  // Cleanup tracking
  private cleanupIntervals: NodeJS.Timeout[] = [];
  
  // Comprehensive metrics
  private metrics = {
    // Messaging metrics (inherited from RealtimeMessagingSystem)
    messagesSent: 0,
    messagesDelivered: 0,
    messagesRejected: 0,
    messageReactions: 0,
    
    // Voting metrics
    votesCast: 0,
    votesRejected: 0,
    
    // Comment metrics
    commentsCreated: 0,
    commentsEdited: 0,
    commentsDeleted: 0,
    
    // Voice metrics
    voiceChannelsJoined: 0,
    voiceChannelsLeft: 0,
    voiceUsersActive: 0,
    screenSharesStarted: 0,
    screenSharesEnded: 0,
    
    // Activity metrics
    activitiesBroadcast: 0,
    searchSuggestions: 0,
    moderationEvents: 0,
    
    // Performance metrics
    totalConnections: 0,
    activeConnections: 0,
    peakConnections: 0,
    lastPeakReset: new Date(),
  };

  constructor(io: Server, redis: Redis, fastify: FastifyInstance) {
    this.io = io;
    this.redis = redis;
    this.fastify = fastify;
    this.messagingSystem = new RealtimeMessagingSystem(io, redis, fastify);
    this.initialize();
  }

  private initialize() {
    this.setupCleanupIntervals();
    this.setupRedisSubscriptions();
    this.fastify.log.info('🚀 Comprehensive Real-time Platform initialized');
  }

  /**
   * Setup all Socket Event Handlers for comprehensive features
   */
  public setupSocketHandlers(socket: Socket & any) {
    // Setup base messaging system handlers
    this.messagingSystem.setupSocketHandlers(socket);
    
    // Setup enhanced feature handlers
    this.setupVotingEvents(socket);
    this.setupCommentEvents(socket);
    this.setupActivityFeedEvents(socket);
    this.setupVoiceChannelEvents(socket);
    this.setupScreenSharingEvents(socket);
    this.setupMessageReactionEvents(socket);
    this.setupSearchSuggestionEvents(socket);
    this.setupModerationEvents(socket);
    this.setupAdvancedPresenceEvents(socket);
    this.setupConnectionTracking(socket);

    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
    if (this.metrics.activeConnections > this.metrics.peakConnections) {
      this.metrics.peakConnections = this.metrics.activeConnections;
    }

    this.fastify.log.info(`🚀 Comprehensive handlers setup for user: ${socket.username} (${this.metrics.activeConnections} active)`);
  }

  /**
   * REAL-TIME VOTING SYSTEM
   */
  private setupVotingEvents(socket: Socket & any) {
    // Cast vote on post or comment
    socket.on('vote:cast', async (data: { targetId: string; targetType: 'post' | 'comment'; voteType: 'up' | 'down' | 'none' }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'vote:cast')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many votes cast');
          return;
        }

        const { targetId, targetType, voteType } = data;

        // Validate input
        if (!targetId || !['post', 'comment'].includes(targetType) || !['up', 'down', 'none'].includes(voteType)) {
          this.sendError(callback, 'INVALID_VOTE_DATA', 'Invalid vote data');
          return;
        }

        // Process vote in database
        const voteResult = await this.processVote(targetId, targetType, voteType, socket.userId);
        if (!voteResult.success) {
          this.sendError(callback, 'VOTE_FAILED', voteResult.error || 'Failed to process vote');
          return;
        }

        // Create vote data for broadcasting
        const voteData: VoteData = {
          postId: targetType === 'post' ? targetId : voteResult.postId!,
          commentId: targetType === 'comment' ? targetId : undefined,
          voteType,
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        };

        // Broadcast vote update to relevant channels
        const channelId = await this.getTargetChannelId(targetId, targetType);
        if (channelId) {
          this.io.to(`channel:${channelId}`).emit('vote:update', {
            targetId,
            targetType,
            voteType,
            userId: socket.userId,
            newCounts: voteResult.counts,
            timestamp: new Date()
          });

          // Publish to Redis for cross-server sync
          await this.redis.publish('vote:broadcast', JSON.stringify({
            ...voteData,
            channelId,
            counts: voteResult.counts
          }));
        }

        // Track activity
        await this.trackActivity({
          type: 'vote_cast',
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          content: `${voteType === 'up' ? 'Upvoted' : voteType === 'down' ? 'Downvoted' : 'Removed vote from'} ${targetType}`,
          targetId,
          targetType,
          timestamp: new Date()
        });

        this.metrics.votesCast++;

        if (callback) {
          callback({
            success: true,
            counts: voteResult.counts
          });
        }

      } catch (error) {
        this.fastify.log.error('Vote cast error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to cast vote');
        this.metrics.votesRejected++;
      }
    });

    // Get vote counts for target
    socket.on('vote:get_counts', async (data: { targetId: string; targetType: 'post' | 'comment' }, callback?: Function) => {
      try {
        const { targetId, targetType } = data;
        const counts = await this.getVoteCounts(targetId, targetType);

        if (callback) {
          callback({
            success: true,
            counts
          });
        }

      } catch (error) {
        this.fastify.log.error('Get vote counts error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get vote counts');
      }
    });
  }

  /**
   * REAL-TIME COMMENT SYSTEM
   */
  private setupCommentEvents(socket: Socket & any) {
    // Create new comment
    socket.on('comment:create', async (data: { postId: string; parentId?: string; content: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'comment:create')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many comments created');
          return;
        }

        const { postId, parentId, content } = data;

        // Validate input
        if (!postId || !content || content.trim().length === 0 || content.length > 10000) {
          this.sendError(callback, 'INVALID_COMMENT_DATA', 'Invalid comment data');
          return;
        }

        // Check post exists and get channel
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { channelId: true, communityId: true, userId: true }
        });

        if (!post) {
          this.sendError(callback, 'POST_NOT_FOUND', 'Post not found');
          return;
        }

        // Check permissions
        const canComment = await this.checkChannelPermissions(socket.userId, post.channelId, 'send_messages');
        if (!canComment) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to comment');
          return;
        }

        // Create comment in database
        const comment = await prisma.comment.create({
          data: {
            content: content.trim(),
            postId,
            parentId,
            userId: socket.userId
          },
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                avatar: true
              }
            },
            _count: {
              select: {
                upvotes: true,
                downvotes: true,
                replies: true
              }
            }
          }
        });

        const commentData: CommentData = {
          id: comment.id,
          postId: comment.postId,
          parentId: comment.parentId,
          content: comment.content,
          userId: comment.userId,
          username: comment.user.username,
          displayName: comment.user.displayName || comment.user.username,
          avatar: comment.user.avatar,
          timestamp: comment.createdAt,
          upvotes: comment._count.upvotes,
          downvotes: comment._count.downvotes
        };

        // Broadcast to channel
        this.io.to(`channel:${post.channelId}`).emit('comment:new', commentData);

        // Publish to Redis for cross-server sync
        await this.redis.publish('comment:broadcast', JSON.stringify({
          ...commentData,
          channelId: post.channelId
        }));

        // Create notification for post author (if not self)
        if (post.userId !== socket.userId) {
          await this.createNotification({
            type: 'reply',
            title: `New comment from ${commentData.displayName}`,
            content: commentData.content,
            senderId: socket.userId,
            targetUserId: post.userId,
            data: { postId, commentId: comment.id }
          });
        }

        // Create notification for parent comment author (if replying)
        if (parentId) {
          const parentComment = await prisma.comment.findUnique({
            where: { id: parentId },
            select: { userId: true }
          });

          if (parentComment && parentComment.userId !== socket.userId && parentComment.userId !== post.userId) {
            await this.createNotification({
              type: 'reply',
              title: `Reply from ${commentData.displayName}`,
              content: commentData.content,
              senderId: socket.userId,
              targetUserId: parentComment.userId,
              data: { postId, commentId: comment.id, parentCommentId: parentId }
            });
          }
        }

        // Track activity
        await this.trackActivity({
          type: 'comment_added',
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          content: `Commented on post`,
          targetId: postId,
          targetType: 'post',
          communityId: post.communityId,
          timestamp: new Date(),
          metadata: { commentId: comment.id }
        });

        this.metrics.commentsCreated++;

        if (callback) {
          callback({
            success: true,
            comment: commentData
          });
        }

      } catch (error) {
        this.fastify.log.error('Comment create error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to create comment');
      }
    });

    // Edit comment
    socket.on('comment:edit', async (data: { commentId: string; content: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'comment:edit')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many comment edits');
          return;
        }

        const { commentId, content } = data;

        // Validate input
        if (!commentId || !content || content.trim().length === 0 || content.length > 10000) {
          this.sendError(callback, 'INVALID_COMMENT_DATA', 'Invalid comment data');
          return;
        }

        // Verify ownership
        const comment = await prisma.comment.findFirst({
          where: {
            id: commentId,
            userId: socket.userId
          },
          include: {
            post: {
              select: { channelId: true }
            }
          }
        });

        if (!comment) {
          this.sendError(callback, 'COMMENT_NOT_FOUND', 'Comment not found or no permission');
          return;
        }

        // Update comment
        const updated = await prisma.comment.update({
          where: { id: commentId },
          data: {
            content: content.trim(),
            edited: true,
            editedAt: new Date()
          }
        });

        // Broadcast edit
        this.io.to(`channel:${comment.post.channelId}`).emit('comment:edited', {
          commentId,
          content: updated.content,
          editedAt: updated.editedAt,
          editedBy: socket.userId
        });

        this.metrics.commentsEdited++;

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Comment edit error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to edit comment');
      }
    });

    // Delete comment
    socket.on('comment:delete', async (data: { commentId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'comment:delete')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many comment deletions');
          return;
        }

        const { commentId } = data;

        // Verify ownership or moderation permissions
        const comment = await prisma.comment.findFirst({
          where: { id: commentId },
          include: {
            post: {
              select: { channelId: true, userId: true }
            }
          }
        });

        if (!comment) {
          this.sendError(callback, 'COMMENT_NOT_FOUND', 'Comment not found');
          return;
        }

        const canDelete = comment.userId === socket.userId || 
                         comment.post.userId === socket.userId || 
                         await this.checkChannelPermissions(socket.userId, comment.post.channelId, 'manage_messages');

        if (!canDelete) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to delete comment');
          return;
        }

        // Soft delete
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            deleted: true,
            deletedAt: new Date()
          }
        });

        // Broadcast deletion
        this.io.to(`channel:${comment.post.channelId}`).emit('comment:deleted', {
          commentId,
          deletedBy: socket.userId,
          deletedAt: new Date()
        });

        this.metrics.commentsDeleted++;

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Comment delete error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to delete comment');
      }
    });

    // Get comments for post
    socket.on('comment:get_list', async (data: { postId: string; parentId?: string; limit?: number; offset?: number }, callback?: Function) => {
      try {
        const { postId, parentId, limit = 20, offset = 0 } = data;

        const comments = await this.getComments(postId, parentId, Math.min(limit, 50), offset);

        if (callback) {
          callback({
            success: true,
            comments,
            hasMore: comments.length === Math.min(limit, 50)
          });
        }

      } catch (error) {
        this.fastify.log.error('Get comments error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get comments');
      }
    });
  }

  /**
   * LIVE USER ACTIVITY FEEDS
   */
  private setupActivityFeedEvents(socket: Socket & any) {
    // Get activity feed
    socket.on('activity:get_feed', async (data: { type?: 'personal' | 'community' | 'global'; limit?: number; offset?: number }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'activity:request')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many activity requests');
          return;
        }

        const { type = 'personal', limit = 20, offset = 0 } = data;

        const activities = await this.getActivityFeed(socket.userId, type, Math.min(limit, 50), offset);

        if (callback) {
          callback({
            success: true,
            activities,
            hasMore: activities.length === Math.min(limit, 50)
          });
        }

      } catch (error) {
        this.fastify.log.error('Get activity feed error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get activity feed');
      }
    });

    // Subscribe to activity updates
    socket.on('activity:subscribe', async (data: { communityIds?: string[]; userIds?: string[] }, callback?: Function) => {
      try {
        const { communityIds, userIds } = data;

        // Join activity rooms
        if (communityIds) {
          for (const communityId of communityIds) {
            await socket.join(`activity:community:${communityId}`);
          }
        }

        if (userIds) {
          for (const userId of userIds) {
            await socket.join(`activity:user:${userId}`);
          }
        }

        // Join global activity room
        await socket.join('activity:global');

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Activity subscribe error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to subscribe to activities');
      }
    });
  }

  /**
   * VOICE CHANNEL MANAGEMENT
   */
  private setupVoiceChannelEvents(socket: Socket & any) {
    // Join voice channel
    socket.on('voice:join', async (data: { channelId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'voice:join')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many voice joins');
          return;
        }

        const { channelId } = data;

        // Check permissions
        const canJoin = await this.checkChannelPermissions(socket.userId, channelId, 'connect');
        if (!canJoin) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to join voice channel');
          return;
        }

        // Get or create voice channel data
        let voiceChannel = this.voiceChannelsMap.get(channelId);
        if (!voiceChannel) {
          const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            select: { name: true, serverId: true, categoryId: true, maxUsers: true }
          });

          if (!channel) {
            this.sendError(callback, 'CHANNEL_NOT_FOUND', 'Voice channel not found');
            return;
          }

          voiceChannel = {
            id: channelId,
            name: channel.name,
            serverId: channel.serverId,
            categoryId: channel.categoryId,
            type: 'voice',
            maxUsers: channel.maxUsers,
            currentUsers: [],
            isActive: true,
            createdAt: new Date()
          };

          this.voiceChannelsMap.set(channelId, voiceChannel);
        }

        // Check if user already in channel
        const existingUser = voiceChannel.currentUsers.find(u => u.userId === socket.userId);
        if (existingUser) {
          this.sendError(callback, 'ALREADY_IN_CHANNEL', 'Already in voice channel');
          return;
        }

        // Check max users limit
        if (voiceChannel.maxUsers && voiceChannel.currentUsers.length >= voiceChannel.maxUsers) {
          this.sendError(callback, 'CHANNEL_FULL', 'Voice channel is full');
          return;
        }

        // Add user to voice channel
        const voiceUser: VoiceUser = {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          avatar: socket.avatar,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          joinedAt: new Date(),
          permissions: {
            canSpeak: true,
            canManage: await this.checkChannelPermissions(socket.userId, channelId, 'manage_channel')
          }
        };

        voiceChannel.currentUsers.push(voiceUser);

        // Join socket room
        await socket.join(`voice:${channelId}`);

        // Broadcast user joined
        socket.to(`voice:${channelId}`).emit('voice:user_joined', {
          channelId,
          user: voiceUser
        });

        // Create LiveKit room if needed
        if (!voiceChannel.roomId) {
          try {
            const { LiveKitService } = await import('../services/livekit');
            const livekit = new LiveKitService({
              url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
              apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
              apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
            });

            const roomId = `voice_${channelId}`;
            await livekit.createRoom(roomId, {
              name: voiceChannel.name,
              maxParticipants: voiceChannel.maxUsers || 50
            });

            voiceChannel.roomId = roomId;
          } catch (liveKitError) {
            this.fastify.log.warn('LiveKit room creation failed:', liveKitError);
          }
        }

        // Generate access token for LiveKit
        let accessToken = null;
        if (voiceChannel.roomId) {
          try {
            const { LiveKitService } = await import('../services/livekit');
            const livekit = new LiveKitService({
              url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
              apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
              apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
            });

            accessToken = await livekit.generateAccessToken(socket.userId, voiceChannel.roomId, {
              canPublish: true,
              canSubscribe: true,
              canPublishData: true
            });
          } catch (tokenError) {
            this.fastify.log.warn('LiveKit token generation failed:', tokenError);
          }
        }

        this.metrics.voiceChannelsJoined++;
        this.metrics.voiceUsersActive++;

        if (callback) {
          callback({
            success: true,
            channelData: voiceChannel,
            accessToken,
            liveKitUrl: process.env.LIVEKIT_URL
          });
        }

      } catch (error) {
        this.fastify.log.error('Voice join error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to join voice channel');
      }
    });

    // Leave voice channel
    socket.on('voice:leave', async (data: { channelId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'voice:leave')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many voice leaves');
          return;
        }

        const { channelId } = data;

        await this.removeUserFromVoiceChannel(socket.userId, channelId);

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Voice leave error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to leave voice channel');
      }
    });

    // Update voice state (mute/unmute, deafen/undeafen)
    socket.on('voice:update_state', async (data: { channelId: string; isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'voice:mute')) {
          return; // Silently ignore rate limited voice state updates
        }

        const { channelId, isMuted, isDeafened, isSpeaking } = data;

        const voiceChannel = this.voiceChannelsMap.get(channelId);
        if (!voiceChannel) {
          this.sendError(callback, 'CHANNEL_NOT_FOUND', 'Voice channel not found');
          return;
        }

        const user = voiceChannel.currentUsers.find(u => u.userId === socket.userId);
        if (!user) {
          this.sendError(callback, 'NOT_IN_CHANNEL', 'Not in voice channel');
          return;
        }

        // Update user state
        if (typeof isMuted === 'boolean') user.isMuted = isMuted;
        if (typeof isDeafened === 'boolean') user.isDeafened = isDeafened;
        if (typeof isSpeaking === 'boolean') user.isSpeaking = isSpeaking;

        // Broadcast state update
        this.io.to(`voice:${channelId}`).emit('voice:user_state_updated', {
          channelId,
          userId: socket.userId,
          isMuted: user.isMuted,
          isDeafened: user.isDeafened,
          isSpeaking: user.isSpeaking
        });

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Voice state update error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to update voice state');
      }
    });

    // Get voice channel status
    socket.on('voice:get_status', async (data: { channelId: string }, callback?: Function) => {
      try {
        const { channelId } = data;

        const voiceChannel = this.voiceChannelsMap.get(channelId);

        if (callback) {
          callback({
            success: true,
            channel: voiceChannel || null,
            userCount: voiceChannel?.currentUsers.length || 0
          });
        }

      } catch (error) {
        this.fastify.log.error('Get voice status error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get voice status');
      }
    });
  }

  /**
   * SCREEN SHARING CAPABILITIES
   */
  private setupScreenSharingEvents(socket: Socket & any) {
    // Start screen sharing
    socket.on('screenshare:start', async (data: { channelId: string; quality?: 'low' | 'medium' | 'high' }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'screenshare:start')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many screen share attempts');
          return;
        }

        const { channelId, quality = 'medium' } = data;

        // Check if user is in voice channel
        const voiceChannel = this.voiceChannelsMap.get(channelId);
        if (!voiceChannel || !voiceChannel.currentUsers.find(u => u.userId === socket.userId)) {
          this.sendError(callback, 'NOT_IN_VOICE', 'Must be in voice channel to screen share');
          return;
        }

        // Check permissions
        const canShare = await this.checkChannelPermissions(socket.userId, channelId, 'use_voice_activity');
        if (!canShare) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to screen share');
          return;
        }

        // Check if already sharing
        const existingShare = Array.from(this.screenSharesMap.values()).find(s => s.userId === socket.userId && s.isActive);
        if (existingShare) {
          this.sendError(callback, 'ALREADY_SHARING', 'Already screen sharing');
          return;
        }

        // Create screen share session
        const shareId = `share_${socket.userId}_${Date.now()}`;
        const streamId = `stream_${shareId}`;

        const screenShare: ScreenShareData = {
          id: shareId,
          userId: socket.userId,
          username: socket.username,
          channelId,
          streamId,
          isActive: true,
          quality,
          participants: [socket.userId],
          startedAt: new Date()
        };

        this.screenSharesMap.set(shareId, screenShare);

        // Broadcast screen share start
        socket.to(`voice:${channelId}`).emit('screenshare:started', {
          shareId,
          userId: socket.userId,
          username: socket.username,
          streamId,
          quality
        });

        // Generate LiveKit token for screen sharing
        let accessToken = null;
        if (voiceChannel.roomId) {
          try {
            const { LiveKitService } = await import('../services/livekit');
            const livekit = new LiveKitService({
              url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
              apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
              apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
            });

            accessToken = await livekit.generateAccessToken(socket.userId, voiceChannel.roomId, {
              canPublish: true,
              canSubscribe: true,
              canPublishData: true,
              canPublishSources: ['screen']
            });
          } catch (tokenError) {
            this.fastify.log.warn('LiveKit screen share token generation failed:', tokenError);
          }
        }

        this.metrics.screenSharesStarted++;

        if (callback) {
          callback({
            success: true,
            shareId,
            streamId,
            accessToken,
            liveKitUrl: process.env.LIVEKIT_URL
          });
        }

      } catch (error) {
        this.fastify.log.error('Screen share start error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to start screen sharing');
      }
    });

    // Stop screen sharing
    socket.on('screenshare:stop', async (data: { shareId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'screenshare:stop')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many screen share stops');
          return;
        }

        const { shareId } = data;

        const screenShare = this.screenSharesMap.get(shareId);
        if (!screenShare || screenShare.userId !== socket.userId) {
          this.sendError(callback, 'SHARE_NOT_FOUND', 'Screen share not found');
          return;
        }

        // Mark as inactive
        screenShare.isActive = false;

        // Broadcast screen share stop
        this.io.to(`voice:${screenShare.channelId}`).emit('screenshare:stopped', {
          shareId,
          userId: socket.userId,
          stoppedAt: new Date()
        });

        // Clean up after 5 minutes
        setTimeout(() => {
          this.screenSharesMap.delete(shareId);
        }, 5 * 60 * 1000);

        this.metrics.screenSharesEnded++;

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Screen share stop error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to stop screen sharing');
      }
    });

    // Join screen share viewing
    socket.on('screenshare:join_viewer', async (data: { shareId: string }, callback?: Function) => {
      try {
        const { shareId } = data;

        const screenShare = this.screenSharesMap.get(shareId);
        if (!screenShare || !screenShare.isActive) {
          this.sendError(callback, 'SHARE_NOT_FOUND', 'Screen share not found or inactive');
          return;
        }

        // Check if user is in the same voice channel
        const voiceChannel = this.voiceChannelsMap.get(screenShare.channelId);
        if (!voiceChannel || !voiceChannel.currentUsers.find(u => u.userId === socket.userId)) {
          this.sendError(callback, 'NOT_IN_VOICE', 'Must be in voice channel to view screen share');
          return;
        }

        // Add to participants
        if (!screenShare.participants.includes(socket.userId)) {
          screenShare.participants.push(socket.userId);
        }

        // Generate viewing token
        let accessToken = null;
        if (voiceChannel.roomId) {
          try {
            const { LiveKitService } = await import('../services/livekit');
            const livekit = new LiveKitService({
              url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
              apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
              apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
            });

            accessToken = await livekit.generateAccessToken(socket.userId, voiceChannel.roomId, {
              canPublish: false,
              canSubscribe: true,
              canPublishData: false
            });
          } catch (tokenError) {
            this.fastify.log.warn('LiveKit viewing token generation failed:', tokenError);
          }
        }

        if (callback) {
          callback({
            success: true,
            streamId: screenShare.streamId,
            accessToken,
            liveKitUrl: process.env.LIVEKIT_URL
          });
        }

      } catch (error) {
        this.fastify.log.error('Screen share join viewer error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to join screen share viewing');
      }
    });
  }

  /**
   * MESSAGE REACTIONS AND EMOJIS
   */
  private setupMessageReactionEvents(socket: Socket & any) {
    // Add reaction to message
    socket.on('message:react', async (data: { messageId: string; emoji: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'message:react')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many reactions');
          return;
        }

        const { messageId, emoji } = data;

        // Validate emoji (basic validation)
        if (!emoji || emoji.length > 10) {
          this.sendError(callback, 'INVALID_EMOJI', 'Invalid emoji');
          return;
        }

        // Check if message exists and get channel
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { channelId: true, userId: true }
        });

        if (!message) {
          this.sendError(callback, 'MESSAGE_NOT_FOUND', 'Message not found');
          return;
        }

        // Check permissions
        const canReact = await this.checkChannelPermissions(socket.userId, message.channelId, 'add_reactions');
        if (!canReact) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to add reactions');
          return;
        }

        // Get or create reaction map for message
        if (!this.messageReactionsMap.has(messageId)) {
          this.messageReactionsMap.set(messageId, new Map());
        }

        const messageReactions = this.messageReactionsMap.get(messageId)!;
        
        if (!messageReactions.has(emoji)) {
          messageReactions.set(emoji, []);
        }

        const emojiReactions = messageReactions.get(emoji)!;

        // Check if user already reacted with this emoji
        const existingReaction = emojiReactions.find(r => r.userId === socket.userId);
        if (existingReaction) {
          // Remove reaction
          const index = emojiReactions.findIndex(r => r.userId === socket.userId);
          emojiReactions.splice(index, 1);

          // Remove from database
          await prisma.messageReaction.deleteMany({
            where: {
              messageId,
              userId: socket.userId,
              emoji
            }
          });

          // Broadcast reaction removed
          this.io.to(`channel:${message.channelId}`).emit('message:reaction_removed', {
            messageId,
            emoji,
            userId: socket.userId,
            count: emojiReactions.length
          });

        } else {
          // Add reaction
          const reaction: ReactionData = {
            messageId,
            emoji,
            userId: socket.userId,
            username: socket.username,
            timestamp: new Date()
          };

          emojiReactions.push(reaction);

          // Save to database
          await prisma.messageReaction.create({
            data: {
              messageId,
              userId: socket.userId,
              emoji
            }
          });

          // Broadcast reaction added
          this.io.to(`channel:${message.channelId}`).emit('message:reaction_added', {
            messageId,
            emoji,
            userId: socket.userId,
            username: socket.username,
            count: emojiReactions.length
          });

          // Create notification for message author (if not self)
          if (message.userId !== socket.userId) {
            await this.createNotification({
              type: 'message',
              title: `${socket.displayName} reacted to your message`,
              content: `Reacted with ${emoji}`,
              senderId: socket.userId,
              targetUserId: message.userId,
              data: { messageId, emoji }
            });
          }
        }

        this.metrics.messageReactions++;

        if (callback) {
          callback({
            success: true,
            reactions: Array.from(messageReactions.entries()).map(([e, rs]) => ({
              emoji: e,
              count: rs.length,
              users: rs.map(r => ({ userId: r.userId, username: r.username }))
            }))
          });
        }

      } catch (error) {
        this.fastify.log.error('Message reaction error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to process reaction');
      }
    });

    // Get reactions for message
    socket.on('message:get_reactions', async (data: { messageId: string }, callback?: Function) => {
      try {
        const { messageId } = data;

        const reactions = await this.getMessageReactions(messageId);

        if (callback) {
          callback({
            success: true,
            reactions
          });
        }

      } catch (error) {
        this.fastify.log.error('Get message reactions error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get reactions');
      }
    });
  }

  /**
   * REAL-TIME SEARCH SUGGESTIONS
   */
  private setupSearchSuggestionEvents(socket: Socket & any) {
    // Get search suggestions
    socket.on('search:suggest', async (data: { query: string; types?: string[]; limit?: number }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'search:suggest')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many search requests');
          return;
        }

        const { query, types = ['user', 'community', 'post', 'channel'], limit = 10 } = data;

        if (!query || query.trim().length < 2) {
          if (callback) callback({ success: true, suggestions: [] });
          return;
        }

        const suggestions = await this.getSearchSuggestions(query.trim(), types, Math.min(limit, 20));

        this.metrics.searchSuggestions++;

        if (callback) {
          callback({
            success: true,
            suggestions
          });
        }

      } catch (error) {
        this.fastify.log.error('Search suggestions error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get search suggestions');
      }
    });

    // Real-time search as user types
    socket.on('search:live', async (data: { query: string; channelId?: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'search:suggest')) {
          return; // Silently ignore rate limited live search
        }

        const { query, channelId } = data;

        if (!query || query.trim().length < 2) {
          if (callback) callback({ success: true, results: [] });
          return;
        }

        // Live search in specific channel (messages, files, etc.)
        const results = await this.liveSearch(query.trim(), channelId, socket.userId);

        if (callback) {
          callback({
            success: true,
            results
          });
        }

      } catch (error) {
        this.fastify.log.error('Live search error:', error);
        if (callback) callback({ success: true, results: [] }); // Fail gracefully
      }
    });
  }

  /**
   * LIVE MODERATION EVENTS
   */
  private setupModerationEvents(socket: Socket & any) {
    // Subscribe to moderation events
    socket.on('moderation:subscribe', async (data: { serverIds?: string[]; channelIds?: string[] }, callback?: Function) => {
      try {
        const { serverIds, channelIds } = data;

        // Check if user has moderation permissions
        let hasModPermissions = false;

        if (serverIds) {
          for (const serverId of serverIds) {
            const canModerate = await this.checkServerPermissions(socket.userId, serverId, 'moderate_members');
            if (canModerate) {
              await socket.join(`moderation:server:${serverId}`);
              hasModPermissions = true;
            }
          }
        }

        if (channelIds) {
          for (const channelId of channelIds) {
            const canModerate = await this.checkChannelPermissions(socket.userId, channelId, 'manage_messages');
            if (canModerate) {
              await socket.join(`moderation:channel:${channelId}`);
              hasModPermissions = true;
            }
          }
        }

        if (!hasModPermissions) {
          this.sendError(callback, 'NO_PERMISSION', 'No moderation permissions');
          return;
        }

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Moderation subscribe error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to subscribe to moderation events');
      }
    });

    // Report content for moderation
    socket.on('moderation:report', async (data: { targetId: string; targetType: 'message' | 'post' | 'comment' | 'user'; reason: string; description?: string }, callback?: Function) => {
      try {
        const { targetId, targetType, reason, description } = data;

        // Validate input
        if (!targetId || !['message', 'post', 'comment', 'user'].includes(targetType) || !reason) {
          this.sendError(callback, 'INVALID_REPORT_DATA', 'Invalid report data');
          return;
        }

        // Create moderation report
        const report = await prisma.moderationReport.create({
          data: {
            targetId,
            targetType,
            reason,
            description,
            reporterId: socket.userId,
            status: 'pending'
          }
        });

        // Get target context (server/channel)
        const context = await this.getTargetContext(targetId, targetType);

        // Broadcast to moderators
        if (context.serverId) {
          this.io.to(`moderation:server:${context.serverId}`).emit('moderation:new_report', {
            reportId: report.id,
            targetId,
            targetType,
            reason,
            description,
            reporterUsername: socket.username,
            timestamp: new Date(),
            context
          });
        }

        if (context.channelId) {
          this.io.to(`moderation:channel:${context.channelId}`).emit('moderation:new_report', {
            reportId: report.id,
            targetId,
            targetType,
            reason,
            description,
            reporterUsername: socket.username,
            timestamp: new Date(),
            context
          });
        }

        if (callback) callback({ success: true, reportId: report.id });

      } catch (error) {
        this.fastify.log.error('Moderation report error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to submit report');
      }
    });

    // Take moderation action
    socket.on('moderation:action', async (data: { reportId?: string; targetId: string; targetType: string; action: string; reason?: string; duration?: number }, callback?: Function) => {
      try {
        const { reportId, targetId, targetType, action, reason, duration } = data;

        // Verify moderation permissions
        const context = await this.getTargetContext(targetId, targetType);
        const canModerate = context.serverId ? 
          await this.checkServerPermissions(socket.userId, context.serverId, 'moderate_members') :
          context.channelId ? 
            await this.checkChannelPermissions(socket.userId, context.channelId, 'manage_messages') :
            false;

        if (!canModerate) {
          this.sendError(callback, 'NO_PERMISSION', 'No moderation permissions');
          return;
        }

        // Process moderation action
        const result = await this.processModerationAction(targetId, targetType, action, socket.userId, reason, duration);

        if (!result.success) {
          this.sendError(callback, 'ACTION_FAILED', result.error || 'Moderation action failed');
          return;
        }

        // Create moderation event
        const moderationEvent: ModerationEvent = {
          id: `mod_${Date.now()}_${socket.userId}`,
          type: action as any,
          moderatorId: socket.userId,
          moderatorUsername: socket.username,
          targetId,
          targetType: targetType as any,
          reason,
          duration,
          channelId: context.channelId,
          serverId: context.serverId,
          timestamp: new Date()
        };

        // Broadcast moderation event
        if (context.serverId) {
          this.io.to(`moderation:server:${context.serverId}`).emit('moderation:action_taken', moderationEvent);
        }

        if (context.channelId) {
          this.io.to(`moderation:channel:${context.channelId}`).emit('moderation:action_taken', moderationEvent);
          
          // Also broadcast to channel if it's a message/content action
          if (['message_deleted', 'post_removed', 'comment_removed'].includes(action)) {
            this.io.to(`channel:${context.channelId}`).emit('moderation:content_removed', {
              targetId,
              targetType,
              moderatorUsername: socket.username,
              reason,
              timestamp: new Date()
            });
          }
        }

        // Update report status if provided
        if (reportId) {
          await prisma.moderationReport.update({
            where: { id: reportId },
            data: {
              status: 'resolved',
              resolvedById: socket.userId,
              resolvedAt: new Date(),
              resolution: action
            }
          });
        }

        this.metrics.moderationEvents++;

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Moderation action error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to take moderation action');
      }
    });
  }

  /**
   * ADVANCED PRESENCE TRACKING
   */
  private setupAdvancedPresenceEvents(socket: Socket & any) {
    // Set rich presence (activity status)
    socket.on('presence:set_activity', async (data: { type: string; name: string; details?: string; state?: string; startTimestamp?: number }, callback?: Function) => {
      try {
        const { type, name, details, state, startTimestamp } = data;

        // Update user's activity in Redis
        const activity = {
          type,
          name,
          details,
          state,
          startTimestamp: startTimestamp || Date.now()
        };

        await this.redis.setex(
          `activity:${socket.userId}`,
          3600, // 1 hour
          JSON.stringify(activity)
        );

        // Broadcast to friends/servers
        const userChannels = await this.getUserChannels(socket.userId);
        userChannels.forEach(channelId => {
          socket.to(`channel:${channelId}`).emit('presence:activity_update', {
            userId: socket.userId,
            username: socket.username,
            activity,
            timestamp: new Date()
          });
        });

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Set activity error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to set activity');
      }
    });

    // Get presence for multiple users
    socket.on('presence:bulk_get', async (data: { userIds: string[] }, callback?: Function) => {
      try {
        const { userIds } = data;
        
        if (!userIds || userIds.length === 0 || userIds.length > 100) {
          this.sendError(callback, 'INVALID_INPUT', 'Invalid user IDs');
          return;
        }

        const presences = await this.getBulkPresence(userIds);

        if (callback) {
          callback({
            success: true,
            presences
          });
        }

      } catch (error) {
        this.fastify.log.error('Bulk get presence error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get presence data');
      }
    });
  }

  /**
   * CONNECTION TRACKING AND CLEANUP
   */
  private setupConnectionTracking(socket: Socket & any) {
    // Track connection start
    this.fastify.log.info(`🔌 User ${socket.username} connected (Total: ${this.metrics.activeConnections})`);

    // Heartbeat mechanism
    let heartbeatInterval: NodeJS.Timeout;
    let lastHeartbeat = Date.now();

    const startHeartbeat = () => {
      heartbeatInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastHeartbeat > 90000) { // 90 seconds without heartbeat
          this.fastify.log.warn(`🔌 User ${socket.username} heartbeat timeout, disconnecting`);
          socket.disconnect(true);
          return;
        }

        socket.emit('heartbeat', { timestamp: now });
      }, 30000); // Every 30 seconds
    };

    startHeartbeat();

    // Handle heartbeat response
    socket.on('heartbeat_ack', () => {
      lastHeartbeat = Date.now();
    });

    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      this.handleUserDisconnect(socket, reason);
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      this.metrics.activeConnections--;
      this.fastify.log.info(`🔌 User ${socket.username} disconnected: ${reason} (Total: ${this.metrics.activeConnections})`);
    });
  }

  // === HELPER METHODS ===

  private async processVote(targetId: string, targetType: 'post' | 'comment', voteType: 'up' | 'down' | 'none', userId: string): Promise<{ success: boolean; error?: string; counts?: any; postId?: string }> {
    try {
      // Use transaction for vote processing
      const result = await prisma.$transaction(async (tx) => {
        if (targetType === 'post') {
          // Delete existing vote
          await tx.postVote.deleteMany({
            where: { postId: targetId, userId }
          });

          // Create new vote if not 'none'
          if (voteType !== 'none') {
            await tx.postVote.create({
              data: {
                postId: targetId,
                userId,
                type: voteType === 'up' ? 'UPVOTE' : 'DOWNVOTE'
              }
            });
          }

          // Get updated counts
          const upvotes = await tx.postVote.count({
            where: { postId: targetId, type: 'UPVOTE' }
          });

          const downvotes = await tx.postVote.count({
            where: { postId: targetId, type: 'DOWNVOTE' }
          });

          // Update post score
          await tx.post.update({
            where: { id: targetId },
            data: {
              upvotes,
              downvotes,
              score: upvotes - downvotes
            }
          });

          return { upvotes, downvotes, score: upvotes - downvotes, postId: targetId };

        } else {
          // Delete existing vote
          await tx.commentVote.deleteMany({
            where: { commentId: targetId, userId }
          });

          // Create new vote if not 'none'
          if (voteType !== 'none') {
            await tx.commentVote.create({
              data: {
                commentId: targetId,
                userId,
                type: voteType === 'up' ? 'UPVOTE' : 'DOWNVOTE'
              }
            });
          }

          // Get updated counts
          const upvotes = await tx.commentVote.count({
            where: { commentId: targetId, type: 'UPVOTE' }
          });

          const downvotes = await tx.commentVote.count({
            where: { commentId: targetId, type: 'DOWNVOTE' }
          });

          // Update comment score
          await tx.comment.update({
            where: { id: targetId },
            data: {
              upvotes,
              downvotes,
              score: upvotes - downvotes
            }
          });

          // Get post ID for broadcasting
          const comment = await tx.comment.findUnique({
            where: { id: targetId },
            select: { postId: true }
          });

          return { upvotes, downvotes, score: upvotes - downvotes, postId: comment?.postId };
        }
      });

      return { success: true, counts: result, postId: result.postId };

    } catch (error) {
      this.fastify.log.error('Process vote error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  private async getVoteCounts(targetId: string, targetType: 'post' | 'comment') {
    try {
      if (targetType === 'post') {
        const upvotes = await prisma.postVote.count({
          where: { postId: targetId, type: 'UPVOTE' }
        });

        const downvotes = await prisma.postVote.count({
          where: { postId: targetId, type: 'DOWNVOTE' }
        });

        return { upvotes, downvotes, score: upvotes - downvotes };

      } else {
        const upvotes = await prisma.commentVote.count({
          where: { commentId: targetId, type: 'UPVOTE' }
        });

        const downvotes = await prisma.commentVote.count({
          where: { commentId: targetId, type: 'DOWNVOTE' }
        });

        return { upvotes, downvotes, score: upvotes - downvotes };
      }
    } catch (error) {
      this.fastify.log.error('Get vote counts error:', error);
      return { upvotes: 0, downvotes: 0, score: 0 };
    }
  }

  private async getTargetChannelId(targetId: string, targetType: 'post' | 'comment'): Promise<string | null> {
    try {
      if (targetType === 'post') {
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { channelId: true }
        });
        return post?.channelId || null;
      } else {
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          include: {
            post: {
              select: { channelId: true }
            }
          }
        });
        return comment?.post.channelId || null;
      }
    } catch (error) {
      this.fastify.log.error('Get target channel ID error:', error);
      return null;
    }
  }

  private async getComments(postId: string, parentId?: string, limit: number = 20, offset: number = 0): Promise<CommentData[]> {
    try {
      const comments = await prisma.comment.findMany({
        where: {
          postId,
          parentId,
          deleted: false
        },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              upvotes: true,
              downvotes: true,
              replies: true
            }
          }
        },
        orderBy: [
          { score: 'desc' },
          { createdAt: 'asc' }
        ],
        skip: offset,
        take: limit
      });

      return comments.map(comment => ({
        id: comment.id,
        postId: comment.postId,
        parentId: comment.parentId,
        content: comment.content,
        userId: comment.userId,
        username: comment.user.username,
        displayName: comment.user.displayName || comment.user.username,
        avatar: comment.user.avatar,
        timestamp: comment.createdAt,
        edited: comment.edited,
        editedAt: comment.editedAt,
        upvotes: comment._count.upvotes,
        downvotes: comment._count.downvotes
      }));
    } catch (error) {
      this.fastify.log.error('Get comments error:', error);
      return [];
    }
  }

  private async trackActivity(activity: Omit<ActivityData, 'id'>) {
    try {
      // Store in database
      await prisma.activity.create({
        data: {
          type: activity.type,
          userId: activity.userId,
          content: activity.content,
          targetId: activity.targetId,
          targetType: activity.targetType,
          communityId: activity.communityId,
          metadata: activity.metadata
        }
      });

      // Add to in-memory feed
      const activityData: ActivityData = {
        id: `activity_${Date.now()}_${activity.userId}`,
        ...activity
      };

      // Broadcast activity
      if (activity.communityId) {
        this.io.to(`activity:community:${activity.communityId}`).emit('activity:new', activityData);
      }

      this.io.to(`activity:user:${activity.userId}`).emit('activity:new', activityData);
      this.io.to('activity:global').emit('activity:new', activityData);

      this.metrics.activitiesBroadcast++;

    } catch (error) {
      this.fastify.log.error('Track activity error:', error);
    }
  }

  private async getActivityFeed(userId: string, type: 'personal' | 'community' | 'global', limit: number, offset: number): Promise<ActivityData[]> {
    try {
      let whereClause: any = {};

      switch (type) {
        case 'personal':
          // Get activities from user's communities and friends
          const userCommunities = await prisma.communityMember.findMany({
            where: { userId },
            select: { communityId: true }
          });

          whereClause = {
            OR: [
              { userId }, // User's own activities
              { communityId: { in: userCommunities.map(c => c.communityId) } }
            ]
          };
          break;

        case 'community':
          const communities = await prisma.communityMember.findMany({
            where: { userId },
            select: { communityId: true }
          });

          whereClause = {
            communityId: { in: communities.map(c => c.communityId) }
          };
          break;

        case 'global':
          // No filter for global feed
          break;
      }

      const activities = await prisma.activity.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      });

      return activities.map(activity => ({
        id: activity.id,
        type: activity.type as any,
        userId: activity.userId,
        username: activity.user.username,
        displayName: activity.user.displayName || activity.user.username,
        avatar: activity.user.avatar,
        content: activity.content,
        targetId: activity.targetId,
        targetType: activity.targetType as any,
        communityId: activity.communityId,
        timestamp: activity.createdAt,
        metadata: activity.metadata
      }));

    } catch (error) {
      this.fastify.log.error('Get activity feed error:', error);
      return [];
    }
  }

  private async removeUserFromVoiceChannel(userId: string, channelId: string) {
    const voiceChannel = this.voiceChannelsMap.get(channelId);
    if (!voiceChannel) return;

    // Remove user from channel
    const userIndex = voiceChannel.currentUsers.findIndex(u => u.userId === userId);
    if (userIndex > -1) {
      voiceChannel.currentUsers.splice(userIndex, 1);

      // Broadcast user left
      this.io.to(`voice:${channelId}`).emit('voice:user_left', {
        channelId,
        userId,
        leftAt: new Date()
      });

      this.metrics.voiceChannelsLeft++;
      this.metrics.voiceUsersActive--;

      // Clean up empty channels
      if (voiceChannel.currentUsers.length === 0) {
        voiceChannel.isActive = false;
        
        // Clean up after 5 minutes
        setTimeout(() => {
          if (this.voiceChannelsMap.get(channelId)?.currentUsers.length === 0) {
            this.voiceChannelsMap.delete(channelId);
          }
        }, 5 * 60 * 1000);
      }
    }
  }

  private async getMessageReactions(messageId: string) {
    try {
      const reactions = await prisma.messageReaction.findMany({
        where: { messageId },
        include: {
          user: {
            select: {
              username: true,
              displayName: true
            }
          }
        }
      });

      // Group by emoji
      const grouped = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push({
          userId: reaction.userId,
          username: reaction.user.username,
          displayName: reaction.user.displayName
        });
        return acc;
      }, {} as Record<string, any[]>);

      return Object.entries(grouped).map(([emoji, users]) => ({
        emoji,
        count: users.length,
        users
      }));

    } catch (error) {
      this.fastify.log.error('Get message reactions error:', error);
      return [];
    }
  }

  private async getSearchSuggestions(query: string, types: string[], limit: number): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];

      // Search users
      if (types.includes('user')) {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          },
          take: Math.floor(limit / types.length) + 1
        });

        users.forEach(user => {
          suggestions.push({
            type: 'user',
            id: user.id,
            title: user.displayName || user.username,
            subtitle: user.username,
            avatar: user.avatar,
            score: this.calculateSearchScore(query, [user.username, user.displayName].filter(Boolean))
          });
        });
      }

      // Search communities
      if (types.includes('community')) {
        const communities = await prisma.community.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            name: true,
            description: true,
            avatar: true
          },
          take: Math.floor(limit / types.length) + 1
        });

        communities.forEach(community => {
          suggestions.push({
            type: 'community',
            id: community.id,
            title: community.name,
            subtitle: community.description?.substring(0, 50),
            avatar: community.avatar,
            score: this.calculateSearchScore(query, [community.name, community.description].filter(Boolean))
          });
        });
      }

      // Search posts
      if (types.includes('post')) {
        const posts = await prisma.post.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            title: true,
            content: true,
            user: {
              select: {
                username: true,
                avatar: true
              }
            }
          },
          take: Math.floor(limit / types.length) + 1
        });

        posts.forEach(post => {
          suggestions.push({
            type: 'post',
            id: post.id,
            title: post.title,
            subtitle: `by ${post.user.username}`,
            avatar: post.user.avatar,
            score: this.calculateSearchScore(query, [post.title, post.content].filter(Boolean))
          });
        });
      }

      // Search channels
      if (types.includes('channel')) {
        const channels = await prisma.channel.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true
          },
          take: Math.floor(limit / types.length) + 1
        });

        channels.forEach(channel => {
          suggestions.push({
            type: 'channel',
            id: channel.id,
            title: `#${channel.name}`,
            subtitle: channel.description?.substring(0, 50),
            score: this.calculateSearchScore(query, [channel.name, channel.description].filter(Boolean))
          });
        });
      }

      // Sort by score and limit
      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      this.fastify.log.error('Get search suggestions error:', error);
      return [];
    }
  }

  private calculateSearchScore(query: string, texts: string[]): number {
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    texts.forEach(text => {
      if (!text) return;
      
      const normalizedText = text.toLowerCase();
      
      // Exact match gets highest score
      if (normalizedText === normalizedQuery) {
        score += 100;
      }
      // Starts with query gets high score
      else if (normalizedText.startsWith(normalizedQuery)) {
        score += 75;
      }
      // Contains query gets medium score
      else if (normalizedText.includes(normalizedQuery)) {
        score += 50;
      }
      // Word match gets low score
      else {
        const words = normalizedText.split(' ');
        const queryWords = normalizedQuery.split(' ');
        
        queryWords.forEach(queryWord => {
          words.forEach(word => {
            if (word.includes(queryWord)) {
              score += 25;
            }
          });
        });
      }
    });

    return score;
  }

  private async liveSearch(query: string, channelId: string | undefined, userId: string) {
    try {
      const results: any[] = [];

      if (channelId) {
        // Search messages in channel
        const messages = await prisma.message.findMany({
          where: {
            channelId,
            deleted: false,
            content: { contains: query, mode: 'insensitive' }
          },
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        });

        results.push(...messages.map(msg => ({
          type: 'message',
          id: msg.id,
          content: msg.content,
          author: msg.user,
          timestamp: msg.createdAt,
          channelId: msg.channelId
        })));
      }

      return results;

    } catch (error) {
      this.fastify.log.error('Live search error:', error);
      return [];
    }
  }

  private async getTargetContext(targetId: string, targetType: string) {
    try {
      switch (targetType) {
        case 'message':
          const message = await prisma.message.findUnique({
            where: { id: targetId },
            include: {
              channel: {
                select: { serverId: true }
              }
            }
          });
          return {
            channelId: message?.channelId,
            serverId: message?.channel?.serverId
          };

        case 'post':
          const post = await prisma.post.findUnique({
            where: { id: targetId },
            select: {
              channelId: true,
              communityId: true,
              channel: {
                select: { serverId: true }
              }
            }
          });
          return {
            channelId: post?.channelId,
            serverId: post?.channel?.serverId,
            communityId: post?.communityId
          };

        case 'comment':
          const comment = await prisma.comment.findUnique({
            where: { id: targetId },
            include: {
              post: {
                include: {
                  channel: {
                    select: { serverId: true }
                  }
                }
              }
            }
          });
          return {
            channelId: comment?.post.channelId,
            serverId: comment?.post.channel?.serverId,
            communityId: comment?.post.communityId
          };

        default:
          return {};
      }
    } catch (error) {
      this.fastify.log.error('Get target context error:', error);
      return {};
    }
  }

  private async processModerationAction(targetId: string, targetType: string, action: string, moderatorId: string, reason?: string, duration?: number) {
    try {
      switch (action) {
        case 'message_deleted':
          await prisma.message.update({
            where: { id: targetId },
            data: { deleted: true, deletedAt: new Date() }
          });
          break;

        case 'post_removed':
          await prisma.post.update({
            where: { id: targetId },
            data: { removed: true, removedAt: new Date() }
          });
          break;

        case 'comment_removed':
          await prisma.comment.update({
            where: { id: targetId },
            data: { deleted: true, deletedAt: new Date() }
          });
          break;

        case 'user_banned':
          // Implement user ban logic
          await prisma.ban.create({
            data: {
              userId: targetId,
              moderatorId,
              reason,
              duration,
              expiresAt: duration ? new Date(Date.now() + duration * 1000) : null
            }
          });
          break;

        case 'user_warned':
          await prisma.warning.create({
            data: {
              userId: targetId,
              moderatorId,
              reason: reason || 'No reason provided'
            }
          });
          break;

        default:
          return { success: false, error: 'Unknown moderation action' };
      }

      return { success: true };

    } catch (error) {
      this.fastify.log.error('Process moderation action error:', error);
      return { success: false, error: 'Database error' };
    }
  }

  private async getUserChannels(userId: string): Promise<string[]> {
    try {
      // Get channels user has access to
      const channels = await prisma.channel.findMany({
        where: {
          OR: [
            {
              server: {
                members: {
                  some: { userId }
                }
              }
            },
            {
              community: {
                members: {
                  some: { userId }
                }
              }
            }
          ]
        },
        select: { id: true }
      });

      return channels.map(c => c.id);

    } catch (error) {
      this.fastify.log.error('Get user channels error:', error);
      return [];
    }
  }

  private async getBulkPresence(userIds: string[]) {
    try {
      const presences = [];

      for (const userId of userIds) {
        // Try Redis first
        const redisPresence = await this.redis.get(`presence:${userId}`);
        if (redisPresence) {
          presences.push(JSON.parse(redisPresence));
          continue;
        }

        // Fallback to database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            status: true,
            customStatus: true,
            lastSeenAt: true
          }
        });

        if (user) {
          presences.push({
            userId: user.id,
            username: user.username,
            status: user.status || 'offline',
            isOnline: user.status !== 'offline',
            lastSeen: user.lastSeenAt,
            customStatus: user.customStatus
          });
        }
      }

      return presences;

    } catch (error) {
      this.fastify.log.error('Get bulk presence error:', error);
      return [];
    }
  }

  private async createNotification(data: { type: string; title: string; content: string; senderId: string; targetUserId: string; data?: any }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          content: data.content,
          senderId: data.senderId,
          userId: data.targetUserId,
          data: data.data,
          read: false
        }
      });

      // Send real-time notification
      this.io.to(`user:${data.targetUserId}`).emit('notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        senderId: notification.senderId,
        targetUserId: notification.userId,
        timestamp: notification.createdAt,
        read: notification.read,
        data: notification.data
      });

      this.metrics.notificationsSent++;

    } catch (error) {
      this.fastify.log.error('Create notification error:', error);
    }
  }

  private async checkChannelPermissions(userId: string, channelId: string, permission: string): Promise<boolean> {
    try {
      // TODO: Implement proper permission checking
      // For now, allow all operations
      return true;
    } catch (error) {
      this.fastify.log.error('Check channel permissions error:', error);
      return false;
    }
  }

  private async checkServerPermissions(userId: string, serverId: string, permission: string): Promise<boolean> {
    try {
      // TODO: Implement proper permission checking
      // For now, allow all operations
      return true;
    } catch (error) {
      this.fastify.log.error('Check server permissions error:', error);
      return false;
    }
  }

  private checkRateLimit(userId: string, eventType: string): boolean {
    try {
      const config = COMPREHENSIVE_RATE_LIMITS[eventType];
      if (!config) return true;

      const now = Date.now();
      
      if (!this.rateLimitMap.has(eventType)) {
        this.rateLimitMap.set(eventType, new Map());
      }
      
      const eventLimits = this.rateLimitMap.get(eventType)!;
      const userLimit = eventLimits.get(userId);
      
      if (!userLimit || now > userLimit.resetTime) {
        eventLimits.set(userId, { count: 1, resetTime: now + config.windowMs });
        return true;
      }
      
      if (userLimit.count >= config.maxRequests) {
        return false;
      }
      
      userLimit.count++;
      return true;
    } catch (error) {
      this.fastify.log.error('Rate limit check error:', error);
      return false;
    }
  }

  private sendError(callback: Function | undefined, code: string, message: string) {
    if (callback) {
      callback({
        success: false,
        error: {
          code,
          message
        }
      });
    }
  }

  private handleUserDisconnect(socket: Socket & any, reason: string) {
    // Remove from all voice channels
    this.voiceChannelsMap.forEach((channel, channelId) => {
      const userIndex = channel.currentUsers.findIndex(u => u.userId === socket.userId);
      if (userIndex > -1) {
        this.removeUserFromVoiceChannel(socket.userId, channelId);
      }
    });

    // Stop any active screen shares
    this.screenSharesMap.forEach((share, shareId) => {
      if (share.userId === socket.userId && share.isActive) {
        share.isActive = false;
        this.io.to(`voice:${share.channelId}`).emit('screenshare:stopped', {
          shareId,
          userId: socket.userId,
          stoppedAt: new Date()
        });
      }
    });

    // Let messaging system handle its cleanup
    // this.messagingSystem handles typing, presence, room cleanup
  }

  private setupRedisSubscriptions() {
    // Subscribe to cross-server events
    this.redis.subscribe(
      'message:broadcast',
      'vote:broadcast', 
      'comment:broadcast',
      'activity:broadcast',
      'voice:broadcast',
      'screenshare:broadcast',
      'reaction:broadcast',
      'moderation:broadcast'
    );
    
    this.redis.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        switch (channel) {
          case 'vote:broadcast':
            this.io.to(`channel:${data.channelId}`).emit('vote:update', data);
            break;
          case 'comment:broadcast':
            this.io.to(`channel:${data.channelId}`).emit('comment:new', data);
            break;
          case 'activity:broadcast':
            if (data.communityId) {
              this.io.to(`activity:community:${data.communityId}`).emit('activity:new', data);
            }
            this.io.to('activity:global').emit('activity:new', data);
            break;
          case 'voice:broadcast':
            this.io.to(`voice:${data.channelId}`).emit(data.event, data.payload);
            break;
          case 'screenshare:broadcast':
            this.io.to(`voice:${data.channelId}`).emit(data.event, data.payload);
            break;
          case 'reaction:broadcast':
            this.io.to(`channel:${data.channelId}`).emit(data.event, data.payload);
            break;
          case 'moderation:broadcast':
            if (data.serverId) {
              this.io.to(`moderation:server:${data.serverId}`).emit(data.event, data.payload);
            }
            if (data.channelId) {
              this.io.to(`moderation:channel:${data.channelId}`).emit(data.event, data.payload);
            }
            break;
        }
      } catch (error) {
        this.fastify.log.error('Redis message handling error:', error);
      }
    });

    this.fastify.log.info('🚀 Comprehensive Redis subscriptions setup');
  }

  private setupCleanupIntervals() {
    // Clean up rate limits every 5 minutes
    const rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      
      this.rateLimitMap.forEach((userLimits, eventType) => {
        const usersToDelete: string[] = [];
        
        userLimits.forEach((limit, userId) => {
          if (now > limit.resetTime) {
            usersToDelete.push(userId);
          }
        });
        
        usersToDelete.forEach(userId => userLimits.delete(userId));
      });
    }, 5 * 60 * 1000);

    // Clean up inactive voice channels every 10 minutes
    const voiceCleanup = setInterval(() => {
      this.voiceChannelsMap.forEach((channel, channelId) => {
        if (!channel.isActive && channel.currentUsers.length === 0) {
          this.voiceChannelsMap.delete(channelId);
        }
      });
    }, 10 * 60 * 1000);

    // Clean up expired screen shares every 5 minutes
    const screenShareCleanup = setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];
      
      this.screenSharesMap.forEach((share, shareId) => {
        if (!share.isActive && (now - share.startedAt.getTime() > 5 * 60 * 1000)) {
          toDelete.push(shareId);
        }
      });
      
      toDelete.forEach(shareId => this.screenSharesMap.delete(shareId));
    }, 5 * 60 * 1000);

    // Reset peak connections daily
    const peakReset = setInterval(() => {
      this.metrics.peakConnections = this.metrics.activeConnections;
      this.metrics.lastPeakReset = new Date();
    }, 24 * 60 * 60 * 1000);

    this.cleanupIntervals.push(rateLimitCleanup, voiceCleanup, screenShareCleanup, peakReset);

    this.fastify.log.info('🚀 Comprehensive cleanup intervals setup');
  }

  public getComprehensiveMetrics() {
    return {
      ...this.metrics,
      messaging: this.messagingSystem.getMetrics(),
      memoryUsage: {
        voiceChannels: this.voiceChannelsMap.size,
        screenShares: this.screenSharesMap.size,
        messageReactions: this.messageReactionsMap.size,
        searchCache: this.searchCacheMap.size,
        activityFeeds: this.activityFeedMap.size,
        rateLimits: this.rateLimitMap.size
      },
      timestamp: new Date(),
      uptime: Date.now() - Date.now() // Will be calculated by caller
    };
  }

  public async close() {
    // Clear intervals
    this.cleanupIntervals.forEach(interval => clearInterval(interval));
    
    // Close messaging system
    await this.messagingSystem.close();
    
    // Clear all maps
    this.voiceChannelsMap.clear();
    this.screenSharesMap.clear();
    this.messageReactionsMap.clear();
    this.searchCacheMap.clear();
    this.activityFeedMap.clear();
    this.rateLimitMap.clear();
    
    this.fastify.log.info('🚀 Comprehensive Real-time Platform closed');
  }
}

/**
 * Factory function to create and initialize the comprehensive platform
 */
export async function createComprehensiveRealtimePlatform(
  io: Server, 
  redis: Redis, 
  fastify: FastifyInstance
): Promise<ComprehensiveRealtimePlatform> {
  return new ComprehensiveRealtimePlatform(io, redis, fastify);
}