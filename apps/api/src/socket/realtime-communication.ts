import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { verifyToken } from '@cryb/auth';
import { AuthService } from '../services/auth';

/**
 * Production-ready Real-time Communication System
 * 
 * Features:
 * - Scalable Socket.io with Redis adapter
 * - Comprehensive event handling
 * - Presence tracking with heartbeat
 * - Typing indicators with auto-cleanup
 * - Read receipts and message delivery tracking
 * - Room management and broadcasting
 * - Rate limiting and abuse prevention
 * - Cross-server communication via Redis pub/sub
 * - Comprehensive error handling and reconnection
 * - Real-time analytics and monitoring
 */

// Extended Socket interface with authentication and metadata
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
  deviceType?: 'web' | 'mobile' | 'desktop';
  connectionTime?: Date;
  lastActivity?: Date;
  rateLimitCount?: number;
  rateLimitReset?: number;
  rooms?: Set<string>;
}

// Presence data structure
export interface PresenceData {
  userId: string;
  username: string;
  displayName?: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  activity?: {
    type: 'playing' | 'streaming' | 'listening' | 'watching' | 'custom';
    name: string;
    details?: string;
    state?: string;
    url?: string;
  };
  deviceType: 'web' | 'mobile' | 'desktop';
  lastSeen: Date;
  isOnline: boolean;
}

// Voice state for voice channels
export interface VoiceState {
  userId: string;
  channelId: string;
  serverId: string;
  sessionId: string;
  muted: boolean;
  deafened: boolean;
  selfMute: boolean;
  selfDeaf: boolean;
  speaking: boolean;
  camera: boolean;
  screenShare: boolean;
  joinedAt: Date;
}

// Typing indicator data
export interface TypingIndicator {
  userId: string;
  channelId: string;
  username: string;
  startedAt: Date;
  timeout?: NodeJS.Timeout;
}

// Message read receipt
export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: Date;
  channelId: string;
}

// Event rate limiting configuration
interface RateLimit {
  window: number; // Time window in ms
  max: number;    // Max events per window
  skipSuccessful?: boolean;
}

const RATE_LIMITS: Record<string, RateLimit> = {
  'message:send': { window: 60000, max: 30 }, // 30 messages per minute
  'typing:start': { window: 10000, max: 10 }, // 10 typing events per 10 seconds
  'presence:update': { window: 30000, max: 5 }, // 5 presence updates per 30 seconds
  'voice:update': { window: 5000, max: 20 },   // 20 voice updates per 5 seconds
  'channel:join': { window: 60000, max: 50 },  // 50 channel joins per minute
  'default': { window: 60000, max: 100 }       // 100 events per minute default
};

export class RealtimeCommunicationService {
  private io: Server;
  private redis: Redis;
  private pubClient: Redis;
  private subClient: Redis;
  private fastify: FastifyInstance;
  private authService: AuthService;
  
  // In-memory stores for performance
  private presenceMap = new Map<string, PresenceData>();
  private voiceStates = new Map<string, VoiceState>();
  private typingIndicators = new Map<string, TypingIndicator>();
  private rateLimits = new Map<string, Map<string, { count: number; resetTime: number }>>();
  private connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    eventsProcessed: 0
  };

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    // Initialize AuthService with Redis for proper JWT validation
    this.authService = new AuthService((fastify as any).redis);
    this.setupRedisConnections();
    this.setupSocketServer();
    this.setupRedisAdapter();
    this.initializeHandlers();
    this.setupEventHandlers();
    this.setupPubSubHandlers();
    this.startHeartbeatMonitoring();
    this.startAnalyticsCollection();
    
    fastify.log.info('🚀 Real-time Communication Service initialized');
  }

  private setupRedisConnections() {
    const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
    
    this.redis = new Redis(redisUrl);
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);
    
    // Redis error handling
    [this.redis, this.pubClient, this.subClient].forEach(client => {
      client.on('error', (error) => {
        this.fastify.log.error('Redis connection error:', error);
      });
      
      client.on('connect', () => {
        this.fastify.log.info('Redis connection established');
      });
    });
  }

  private setupSocketServer() {
    this.io = new Server(this.fastify.server, {
      cors: {
        origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003').split(','),
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e8, // 100MB
      allowEIO3: false,
      // Explicitly disable compression to fix RSV1 WebSocket frame errors
      compression: false,
      httpCompression: false
    });

    // Socket.io middleware for authentication
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      await this.authenticateSocket(socket, next);
    });

    // Rate limiting middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      this.applyRateLimit(socket, 'connection', next);
    });
  }

  private setupRedisAdapter() {
    // Use Redis adapter for horizontal scaling
    this.io.adapter(createAdapter(this.pubClient, this.subClient));
    
    this.fastify.log.info('✅ Socket.io Redis adapter configured for horizontal scaling');
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth?.token || 
                   socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Use comprehensive token validation with session and blacklist checks
      const validation = await this.authService.validateAccessToken(token);
      if (!validation.valid) {
        return next(new Error(validation.reason || 'Authentication failed'));
      }

      const payload = validation.payload;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
          lastSeenAt: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Check if user is banned
      const activeBans = await prisma.ban.count({
        where: {
          userId: user.id,
          active: true,
          expiresAt: {
            gte: new Date()
          }
        }
      });

      if (activeBans > 0) {
        return next(new Error('User is banned'));
      }

      // Attach user data to socket
      socket.userId = user.id;
      socket.username = user.username;
      socket.displayName = user.displayName;
      socket.avatar = user.avatar;
      socket.isVerified = user.isVerified;
      socket.deviceType = this.detectDeviceType(socket.handshake.headers['user-agent'] || '');
      socket.connectionTime = new Date();
      socket.lastActivity = new Date();
      socket.rooms = new Set();

      next();
    } catch (error) {
      this.fastify.log.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  private applyRateLimit(socket: AuthenticatedSocket, eventType: string, next: (err?: Error) => void) {
    if (!socket.userId) return next();

    const limit = RATE_LIMITS[eventType] || RATE_LIMITS.default;
    const now = Date.now();
    
    if (!this.rateLimits.has(eventType)) {
      this.rateLimits.set(eventType, new Map());
    }
    
    const eventLimits = this.rateLimits.get(eventType)!;
    const userLimit = eventLimits.get(socket.userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      eventLimits.set(socket.userId, { count: 1, resetTime: now + limit.window });
      return next();
    }
    
    if (userLimit.count >= limit.max) {
      return next(new Error(`Rate limit exceeded for ${eventType}`));
    }
    
    userLimit.count++;
    next();
  }

  private detectDeviceType(userAgent: string): 'web' | 'mobile' | 'desktop' {
    if (/Mobile|Android|iP(ad|hone)/.test(userAgent)) return 'mobile';
    if (/Electron/.test(userAgent)) return 'desktop';
    return 'web';
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
      this.setupSocketEventHandlers(socket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket) {
    this.connectionMetrics.totalConnections++;
    this.connectionMetrics.activeConnections++;
    
    this.fastify.log.info(`🔌 User ${socket.displayName} (${socket.username}) connected from ${socket.deviceType}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Update user's online status in database
    this.updateUserOnlineStatus(socket.userId!, true);
    
    // Initialize presence
    this.updatePresence(socket.userId!, {
      userId: socket.userId!,
      username: socket.username!,
      displayName: socket.displayName,
      status: 'online',
      deviceType: socket.deviceType!,
      lastSeen: new Date(),
      isOnline: true
    });

    // Broadcast user coming online
    this.broadcastToFriends(socket.userId!, 'friend:online', {
      userId: socket.userId,
      username: socket.username,
      displayName: socket.displayName,
      status: 'online'
    });

    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  private setupSocketEventHandlers(socket: AuthenticatedSocket) {
    // Message events
    this.setupMessageEvents(socket);
    
    // Channel and room events
    this.setupChannelEvents(socket);
    
    // Presence and status events
    this.setupPresenceEvents(socket);
    
    // Typing indicator events
    this.setupTypingEvents(socket);
    
    // Voice and video events
    this.setupVoiceEvents(socket);
    
    // Direct message events
    this.setupDirectMessageEvents(socket);
    
    // Read receipt events
    this.setupReadReceiptEvents(socket);
    
    // Moderation events
    this.setupModerationEvents(socket);

    // Utility events
    this.setupUtilityEvents(socket);
  }

  private setupMessageEvents(socket: AuthenticatedSocket) {
    socket.on('message:send', async (data: {
      channelId: string;
      content: string;
      replyToId?: string;
      attachments?: any[];
      mentions?: string[];
      embeds?: any[];
    }, callback?: Function) => {
      try {
        if (!this.applyEventRateLimit(socket, 'message:send')) return;
        
        socket.lastActivity = new Date();
        
        // Validate channel access
        const hasAccess = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!hasAccess) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'No access to channel' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            channelId: data.channelId,
            authorId: socket.userId!,
            content: data.content,
            referencedMessageId: data.replyToId,
            attachments: data.attachments || [],
            mentions: data.mentions || [],
            embeds: data.embeds || [],
            timestamp: new Date()
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            referencedMessage: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true
                  }
                }
              }
            }
          }
        });

        // Broadcast message to channel
        this.io.to(`channel:${data.channelId}`).emit('message:new', message);
        
        // Handle mentions
        if (data.mentions && data.mentions.length > 0) {
          await this.handleMentions(message, data.mentions);
        }
        
        // Send acknowledgment
        if (callback) {
          callback({ success: true, messageId: message.id });
        }
        
        this.connectionMetrics.messagesSent++;
        
        // Track analytics
        await this.trackEvent('message_sent', {
          userId: socket.userId,
          channelId: data.channelId,
          messageId: message.id,
          hasAttachments: (data.attachments?.length || 0) > 0,
          hasMentions: (data.mentions?.length || 0) > 0
        });
        
      } catch (error) {
        this.fastify.log.error('Error sending message:', error);
        socket.emit('error', { code: 'MESSAGE_SEND_FAILED', message: 'Failed to send message' });
        
        if (callback) {
          callback({ success: false, error: 'Failed to send message' });
        }
      }
    });

    socket.on('message:edit', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        socket.lastActivity = new Date();
        
        const message = await prisma.message.findUnique({
          where: { id: data.messageId },
          include: { author: true }
        });

        if (!message || message.authorId !== socket.userId) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot edit this message' });
          return;
        }

        // Check if message is too old (5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (message.timestamp < fiveMinutesAgo) {
          socket.emit('error', { code: 'MESSAGE_TOO_OLD', message: 'Message too old to edit' });
          return;
        }

        const updatedMessage = await prisma.message.update({
          where: { id: data.messageId },
          data: { 
            content: data.content,
            editedAt: new Date()
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            }
          }
        });

        this.io.to(`channel:${message.channelId}`).emit('message:edited', updatedMessage);
        
      } catch (error) {
        this.fastify.log.error('Error editing message:', error);
        socket.emit('error', { code: 'MESSAGE_EDIT_FAILED', message: 'Failed to edit message' });
      }
    });

    socket.on('message:delete', async (data: { messageId: string }) => {
      try {
        socket.lastActivity = new Date();
        
        const message = await prisma.message.findUnique({
          where: { id: data.messageId },
          include: {
            channel: {
              include: {
                community: true
              }
            }
          }
        });

        if (!message) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found' });
          return;
        }

        // Check if user can delete (author or has permissions)
        const canDelete = message.authorId === socket.userId || 
          await this.hasDeleteMessagePermission(socket.userId!, message.channel.communityId!);

        if (!canDelete) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot delete this message' });
          return;
        }

        await prisma.message.delete({
          where: { id: data.messageId }
        });

        this.io.to(`channel:${message.channelId}`).emit('message:deleted', {
          messageId: data.messageId,
          channelId: message.channelId,
          deletedBy: socket.userId
        });
        
      } catch (error) {
        this.fastify.log.error('Error deleting message:', error);
        socket.emit('error', { code: 'MESSAGE_DELETE_FAILED', message: 'Failed to delete message' });
      }
    });

    socket.on('message:react', async (data: {
      messageId: string;
      emoji: string;
      action: 'add' | 'remove';
    }) => {
      try {
        socket.lastActivity = new Date();
        
        const message = await prisma.message.findUnique({
          where: { id: data.messageId }
        });

        if (!message) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found' });
          return;
        }

        // Validate channel access
        const hasAccess = await this.validateChannelAccess(socket.userId!, message.channelId);
        if (!hasAccess) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'No access to channel' });
          return;
        }

        // Update reaction in database
        const reactions = (message.reactions as any[]) || [];
        const existingReaction = reactions.find(r => r.emoji === data.emoji);
        
        if (data.action === 'add') {
          if (existingReaction) {
            if (!existingReaction.users.includes(socket.userId)) {
              existingReaction.users.push(socket.userId);
              existingReaction.count++;
            }
          } else {
            reactions.push({
              emoji: data.emoji,
              users: [socket.userId],
              count: 1
            });
          }
        } else if (data.action === 'remove' && existingReaction) {
          const userIndex = existingReaction.users.indexOf(socket.userId);
          if (userIndex > -1) {
            existingReaction.users.splice(userIndex, 1);
            existingReaction.count--;
            
            if (existingReaction.count === 0) {
              const reactionIndex = reactions.indexOf(existingReaction);
              reactions.splice(reactionIndex, 1);
            }
          }
        }

        await prisma.message.update({
          where: { id: data.messageId },
          data: { reactions }
        });

        this.io.to(`channel:${message.channelId}`).emit('message:reaction', {
          messageId: data.messageId,
          emoji: data.emoji,
          userId: socket.userId,
          username: socket.username,
          action: data.action,
          count: existingReaction?.count || 0
        });
        
      } catch (error) {
        this.fastify.log.error('Error handling message reaction:', error);
        socket.emit('error', { code: 'REACTION_FAILED', message: 'Failed to handle reaction' });
      }
    });
  }

  // Helper method to validate event rate limits
  private applyEventRateLimit(socket: AuthenticatedSocket, eventType: string): boolean {
    if (!socket.userId) return false;

    const limit = RATE_LIMITS[eventType] || RATE_LIMITS.default;
    const now = Date.now();
    
    if (!this.rateLimits.has(eventType)) {
      this.rateLimits.set(eventType, new Map());
    }
    
    const eventLimits = this.rateLimits.get(eventType)!;
    const userLimit = eventLimits.get(socket.userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      eventLimits.set(socket.userId, { count: 1, resetTime: now + limit.window });
      return true;
    }
    
    if (userLimit.count >= limit.max) {
      socket.emit('error', { 
        code: 'RATE_LIMITED', 
        message: `Rate limit exceeded for ${eventType}`,
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
      return false;
    }
    
    userLimit.count++;
    return true;
  }

  private setupChannelEvents(socket: AuthenticatedSocket) {
    this.handlers.setupChannelEvents(socket, this.broadcastToFriends.bind(this), this.trackEvent.bind(this));
  }

  private setupPresenceEvents(socket: AuthenticatedSocket) {
    this.handlers.setupPresenceEvents(socket, this.updatePresence.bind(this), this.broadcastToFriends.bind(this));
  }

  private setupTypingEvents(socket: AuthenticatedSocket) {
    this.handlers.setupTypingEvents(socket);
  }

  private setupVoiceEvents(socket: AuthenticatedSocket) {
    this.handlers.setupVoiceEvents(socket, this.trackEvent.bind(this));
  }

  private setupDirectMessageEvents(socket: AuthenticatedSocket) {
    this.handlers.setupDirectMessageEvents(socket, this.trackEvent.bind(this));
  }

  private setupReadReceiptEvents(socket: AuthenticatedSocket) {
    this.handlers.setupReadReceiptEvents(socket);
  }

  private setupModerationEvents(socket: AuthenticatedSocket) {
    this.handlers.setupModerationEvents(socket, this.trackEvent.bind(this));
  }

  private setupUtilityEvents(socket: AuthenticatedSocket) {
    this.handlers.setupUtilityEvents(socket);
  }

  // Import handlers - need to instantiate after other properties are set
  private handlers?: any;

  private initializeHandlers() {
    const { RealtimeCommunicationHandlers } = require('./realtime-communication-handlers');
    this.handlers = new RealtimeCommunicationHandlers(
      this.fastify,
      this.redis,
      this.presenceMap,
      this.voiceStates,
      this.typingIndicators
    );
  }

  private setupPubSubHandlers() {
    // Subscribe to cross-server events
    this.subClient.subscribe('server:broadcast');
    this.subClient.subscribe('user:notifications');
    this.subClient.subscribe('presence:updates');
    this.subClient.subscribe('moderation:actions');
    
    this.subClient.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        switch (channel) {
          case 'server:broadcast':
            await this.handleServerBroadcast(data);
            break;
          case 'user:notifications':
            await this.handleUserNotification(data);
            break;
          case 'presence:updates':
            await this.handlePresenceUpdate(data);
            break;
          case 'moderation:actions':
            await this.handleModerationAction(data);
            break;
        }
      } catch (error) {
        this.fastify.log.error('Error handling pub/sub message:', error);
      }
    });
  }

  private async handleServerBroadcast(data: any) {
    // Handle cross-server broadcasts
    this.io.to(data.room).emit(data.event, data.payload);
  }

  private async handleUserNotification(data: any) {
    // Handle user-specific notifications across servers
    this.io.to(`user:${data.userId}`).emit('notification', data.notification);
  }

  private async handlePresenceUpdate(data: any) {
    // Handle presence updates from other servers
    this.presenceMap.set(data.userId, data.presence);
    await this.broadcastToFriends(data.userId, 'presence:update', data.presence);
  }

  private async handleModerationAction(data: any) {
    // Handle moderation actions from other servers
    const userSockets = await this.io.in(`user:${data.targetUserId}`).fetchSockets();
    
    for (const socket of userSockets) {
      switch (data.action) {
        case 'kick':
          socket.leave(`server:${data.serverId}`);
          socket.emit('moderation:kicked', data);
          break;
        case 'ban':
          socket.leave(`server:${data.serverId}`);
          socket.emit('moderation:banned', data);
          break;
      }
    }
  }

  private async handleDisconnection(socket: AuthenticatedSocket, reason: string) {
    this.connectionMetrics.activeConnections--;
    
    this.fastify.log.info(`❌ User ${socket.displayName} (${socket.username}) disconnected: ${reason}`);

    if (!socket.userId) return;

    // Update user offline status
    await this.updateUserOnlineStatus(socket.userId, false);
    
    // Update presence to offline
    const presence = this.presenceMap.get(socket.userId);
    if (presence) {
      presence.status = 'invisible';
      presence.isOnline = false;
      presence.lastSeen = new Date();
      this.presenceMap.set(socket.userId, presence);
      
      // Store in Redis
      await this.redis.setex(
        `presence:${socket.userId}`,
        86400, // 24 hours
        JSON.stringify(presence)
      );
    }

    // Clean up typing indicators
    const typingToClean = Array.from(this.typingIndicators.entries())
      .filter(([key]) => key.startsWith(`${socket.userId}:`));
    
    for (const [key, indicator] of typingToClean) {
      if (indicator.timeout) {
        clearTimeout(indicator.timeout);
      }
      this.typingIndicators.delete(key);
      
      // Clean up Redis
      await this.redis.del(`typing:${indicator.channelId}:${socket.userId}`);
      
      // Broadcast stop typing
      this.io.to(`channel:${indicator.channelId}`).emit('typing:user_stop', {
        userId: socket.userId,
        channelId: indicator.channelId
      });
    }

    // Clean up voice state
    const voiceState = this.voiceStates.get(socket.userId);
    if (voiceState) {
      this.voiceStates.delete(socket.userId);
      
      // Remove from database
      await prisma.voiceState.deleteMany({
        where: { userId: socket.userId }
      });
      
      // Broadcast leave voice
      this.io.to(`voice:${voiceState.channelId}`).emit('voice:user_left', {
        userId: socket.userId,
        channelId: voiceState.channelId
      });
    }

    // Clean up channel presence
    if (socket.rooms) {
      for (const room of socket.rooms) {
        if (room.startsWith('channel:')) {
          const channelId = room.split(':')[1];
          await this.redis.srem(`channel:${channelId}:presence`, socket.userId);
        }
      }
    }

    // Broadcast user going offline to friends
    await this.broadcastToFriends(socket.userId, 'friend:offline', {
      userId: socket.userId,
      username: socket.username,
      displayName: socket.displayName,
      lastSeen: new Date()
    });

    // Track disconnection analytics
    await this.trackEvent('user_disconnected', {
      userId: socket.userId,
      reason,
      duration: Date.now() - (socket.connectionTime?.getTime() || Date.now()),
      deviceType: socket.deviceType
    });
  }

  private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: isOnline ? 'online' : 'offline',
          lastActiveAt: new Date()
        }
      });
    } catch (error) {
      this.fastify.log.error('Error updating user online status:', error);
    }
  }

  private async updatePresence(userId: string, presence: PresenceData) {
    this.presenceMap.set(userId, presence);
    
    // Store in Redis with expiration
    await this.redis.setex(
      `presence:${userId}`,
      300, // 5 minutes
      JSON.stringify(presence)
    );
    
    // Publish to other servers
    await this.pubClient.publish('presence:updates', JSON.stringify({
      userId,
      presence
    }));
  }

  private async broadcastToFriends(userId: string, event: string, data: any) {
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId, status: 'accepted' },
            { friendId: userId, status: 'accepted' }
          ]
        }
      });
      
      const friendIds = friendships.map(f => 
        f.userId === userId ? f.friendId : f.userId
      );
      
      for (const friendId of friendIds) {
        this.io.to(`user:${friendId}`).emit(event, data);
      }
    } catch (error) {
      this.fastify.log.error('Error broadcasting to friends:', error);
    }
  }

  private async handleMentions(message: any, mentions: string[]) {
    for (const mentionedUserId of mentions) {
      // Send notification to mentioned user
      this.io.to(`user:${mentionedUserId}`).emit('notification:mention', {
        type: 'mention',
        messageId: message.id,
        channelId: message.channelId,
        authorId: message.authorId,
        author: message.author,
        content: message.content,
        timestamp: message.timestamp
      });
      
      // Store notification in database
      await prisma.notification.create({
        data: {
          userId: mentionedUserId,
          type: 'mention',
          title: `${message.author.displayName || message.author.username} mentioned you`,
          content: message.content,
          data: {
            messageId: message.id,
            channelId: message.channelId,
            authorId: message.authorId
          }
        }
      });
    }
  }

  private async validateChannelAccess(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { community: true }
    });

    if (!channel) return false;

    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: channel.communityId!,
          userId
        }
      }
    });

    return !!member;
  }

  private async hasDeleteMessagePermission(userId: string, serverId: string): Promise<boolean> {
    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: serverId,
          userId
        }
      },
      include: {
        roles: {
          select: {
            permissions: true
          }
        }
      }
    });

    if (!member) return false;

    // Check if user is server owner
    const server = await prisma.community.findUnique({
      where: { id: serverId },
      select: { ownerId: true }
    });

    if (server?.ownerId === userId) return true;

    // Check role permissions
    const hasPermission = member.roles.some(role => 
      (role.permissions as any)?.includes('MANAGE_MESSAGES')
    );

    return hasPermission;
  }

  private startHeartbeatMonitoring() {
    // Send heartbeat to all connected clients every 30 seconds
    setInterval(() => {
      this.io.emit('heartbeat', { timestamp: Date.now() });
    }, 30000);
    
    // Clean up stale presence data every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      for (const [userId, presence] of this.presenceMap.entries()) {
        if (presence.lastSeen.getTime() < fiveMinutesAgo) {
          presence.status = 'invisible';
          presence.isOnline = false;
          this.presenceMap.set(userId, presence);
        }
      }
    }, 5 * 60 * 1000);
  }

  private startAnalyticsCollection() {
    // Collect metrics every minute
    setInterval(async () => {
      await this.trackEvent('server_metrics', {
        activeConnections: this.connectionMetrics.activeConnections,
        totalConnections: this.connectionMetrics.totalConnections,
        messagesSent: this.connectionMetrics.messagesSent,
        eventsProcessed: this.connectionMetrics.eventsProcessed,
        timestamp: new Date()
      });
    }, 60000);
  }

  private async trackEvent(event: string, data: any) {
    try {
      this.connectionMetrics.eventsProcessed++;
      
      // Store in Redis for analytics
      await this.redis.lpush(
        `analytics:${event}`,
        JSON.stringify({
          timestamp: Date.now(),
          data
        })
      );
      
      // Keep only last 1000 events per type
      await this.redis.ltrim(`analytics:${event}`, 0, 999);
      
    } catch (error) {
      this.fastify.log.error('Error tracking event:', error);
    }
  }
  
  public getIO(): Server {
    return this.io;
  }
  
  public getConnectionMetrics() {
    return { ...this.connectionMetrics };
  }

  public getPresenceMap() {
    return new Map(this.presenceMap);
  }

  public getVoiceStates() {
    return new Map(this.voiceStates);
  }

  public async getAnalytics(event: string, limit: number = 100) {
    const events = await this.redis.lrange(`analytics:${event}`, 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  public async broadcastToServer(serverId: string, event: string, data: any) {
    this.io.to(`server:${serverId}`).emit(event, data);
    
    // Also broadcast to other server instances
    await this.pubClient.publish('server:broadcast', JSON.stringify({
      room: `server:${serverId}`,
      event,
      payload: data
    }));
  }

  public async sendNotificationToUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', notification);
    
    // Also send to other server instances
    await this.pubClient.publish('user:notifications', JSON.stringify({
      userId,
      notification
    }));
  }

  public async close() {
    // Clear all intervals and timeouts
    for (const indicator of this.typingIndicators.values()) {
      if (indicator.timeout) {
        clearTimeout(indicator.timeout);
      }
    }
    
    await Promise.all([
      this.redis.quit(),
      this.pubClient.quit(),
      this.subClient.quit()
    ]);
    
    this.io.close();
  }
}
