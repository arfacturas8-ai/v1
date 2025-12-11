import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { AuthService } from '../services/auth';
import Redis from 'ioredis';

export interface DiscordSocket extends Socket {
  userId?: string;
  username?: string;
  displayName?: string;
  isAuthenticated?: boolean;
  currentServer?: string;
  currentChannel?: string;
  voiceChannel?: string;
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activity?: {
    type: 'playing' | 'streaming' | 'listening' | 'watching' | 'competing';
    name: string;
    details?: string;
    state?: string;
  };
  lastSeen: Date;
  deviceType: 'web' | 'mobile' | 'desktop';
}

export interface VoiceState {
  userId: string;
  channelId: string;
  serverId: string;
  muted: boolean;
  deafened: boolean;
  selfMute: boolean;
  selfDeaf: boolean;
  suppress: boolean;
  sessionId: string;
  joinedAt: Date;
}

export class DiscordRealtimeHandler {
  private io: Server;
  private redis: Redis;
  private authService: AuthService;
  private presenceCache: Map<string, PresenceData> = new Map();
  private voiceStates: Map<string, VoiceState> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private connectionCount = 0;
  
  // Separate Redis connections for different purposes
  private generalRedis: Redis; // For general Redis operations (rate limiting, etc.)
  
  constructor(io: Server, redis: Redis, authService: AuthService) {
    this.io = io;
    this.redis = redis;
    this.authService = authService;
    
    // Create a separate Redis connection for general operations (not pub/sub)
    // This prevents "subscriber mode" errors when doing rate limiting, etc.
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380/0';
    this.generalRedis = new Redis(redisUrl);
    
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupPresenceCleanup();
  }

  private setupMiddleware() {
    // Authentication middleware - SAME LOGIC AS CRASH-SAFE SOCKET
    this.io.use(async (socket: DiscordSocket, next) => {
      try {
        // Enhanced token extraction with multiple sources and priority order
        let token = null;
        
        // 1. Check auth object (highest priority - used by socket.io-client)
        if (socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
          console.log('Token extracted from auth.token');
        }
        
        // 2. Check Authorization header (Bearer token format)
        if (!token && socket.handshake.headers?.authorization) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('Token extracted from Authorization header');
          } else {
            token = authHeader;
            console.log('Token extracted from Authorization header (non-Bearer)');
          }
        }
        
        // 3. Check query parameters (lowest priority)
        if (!token && socket.handshake.query?.token) {
          token = socket.handshake.query.token as string;
          console.log('Token extracted from query parameter');
        }

        // 4. Check auth object with alternative key names
        if (!token && socket.handshake.auth) {
          // Try common alternative key names
          const altKeys = ['accessToken', 'access_token', 'authToken', 'auth_token', 'jwt'];
          for (const key of altKeys) {
            if (socket.handshake.auth[key]) {
              token = socket.handshake.auth[key];
              console.log(`Token extracted from auth.${key}`);
              break;
            }
          }
        }
        
        // Debug logging
        console.log('🔍 Discord Socket authentication debug:', {
          clientIP: socket.handshake.address,
          hasAuth: !!socket.handshake.auth,
          authKeys: socket.handshake.auth ? Object.keys(socket.handshake.auth) : [],
          hasAuthHeader: !!socket.handshake.headers?.authorization,
          hasQueryToken: !!socket.handshake.query?.token,
          hasToken: !!token,
          tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
          tokenLength: token ? token.length : 0
        });
        
        if (!token) {
          // In development mode, allow anonymous connections for testing
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️  Development mode: Allowing anonymous Socket.IO connection');
            (socket as any).userId = 'anonymous-' + Math.random().toString(36).substring(7);
            (socket as any).user = {
              id: (socket as any).userId,
              username: 'Anonymous',
              displayName: 'Anonymous User'
            };
            return next();
          }
          
          console.warn('❌ No authentication token provided', {
            auth: socket.handshake.auth,
            headers: {
              authorization: socket.handshake.headers?.authorization,
              'user-agent': socket.handshake.headers['user-agent']
            },
            query: socket.handshake.query
          });
          return next(new Error('Authentication token required. Please provide token in auth.token, Authorization header, or query parameter.'));
        }

        // Validate token format (basic JWT structure check)
        if (typeof token !== 'string' || token.length < 10) {
          console.warn('❌ Invalid token format', { tokenLength: token?.length });
          return next(new Error('Invalid token format'));
        }

        // Check for basic JWT structure (three parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('❌ Token does not have valid JWT structure', { parts: tokenParts.length });
          return next(new Error('Invalid JWT token structure'));
        }

        console.log('🔒 Starting Discord token validation...');

        // Simple JWT validation without Redis dependency (temporary fix)
        let payload: any;
        try {
          // Import the JWT verification directly
          const { verifyToken } = require('@cryb/auth');
          payload = verifyToken(token);
          
          if (!payload || !payload.userId) {
            console.error('❌ Token payload missing userId');
            return next(new Error('Invalid token payload'));
          }
          
          console.log('✅ JWT validation successful', { userId: payload.userId });
          
        } catch (error) {
          console.warn('❌ JWT validation failed:', error.message);
          return next(new Error(`Authentication failed: ${error.message}`));
        }

        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            lastSeenAt: true,
            bannedAt: true
          }
        });

        if (!user) {
          console.warn('❌ User not found in database', { userId: payload.userId });
          return next(new Error('User not found'));
        }

        // Check if user is banned
        if (user.bannedAt && user.bannedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          console.warn('❌ User is banned', { userId: user.id, bannedAt: user.bannedAt });
          return next(new Error('User account is banned'));
        }

        socket.userId = user.id;
        socket.username = user.username;
        socket.displayName = user.displayName;
        socket.isAuthenticated = true;

        console.log(`✅ Discord Socket authentication SUCCESS for user: ${user.displayName} (${user.username}) [${user.id}]`);

        next();
      } catch (error) {
        console.error('💥 Discord Socket authentication error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Authentication failed';
        if (error instanceof Error) {
          if (error.message.includes('expired')) {
            errorMessage = 'Token has expired';
          } else if (error.message.includes('invalid')) {
            errorMessage = 'Invalid token';
          } else if (error.message.includes('database')) {
            errorMessage = 'Database connection error';
          } else {
            errorMessage = `Authentication failed: ${error.message}`;
          }
        }
        
        next(new Error(errorMessage));
      }
    });

    // Rate limiting middleware
    const rateLimits = new Map<string, { count: number; resetTime: number }>();
    
    this.io.use((socket: DiscordSocket, next) => {
      if (!socket.userId) return next();
      
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 120; // 120 events per minute
      
      const userLimit = rateLimits.get(socket.userId);
      
      if (!userLimit || now > userLimit.resetTime) {
        rateLimits.set(socket.userId, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (userLimit.count >= maxRequests) {
        return next(new Error('Rate limit exceeded'));
      }
      
      userLimit.count++;
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: DiscordSocket) => {
      this.connectionCount++;
      console.log(`🔌 User ${socket.displayName} (${socket.username}) connected [${this.connectionCount} total]`);
      
      this.handleConnectionEvents(socket);
      this.handleServerEvents(socket);
      this.handleChannelEvents(socket);
      this.handleMessageEvents(socket);
      this.handleVoiceEvents(socket);
      this.handlePresenceEvents(socket);
      this.handleDirectMessageEvents(socket);
    });
  }

  private handleConnectionEvents(socket: DiscordSocket) {
    // User comes online
    this.updatePresence(socket.userId!, {
      userId: socket.userId!,
      status: 'online',
      lastSeen: new Date(),
      deviceType: this.detectDeviceType(socket.handshake.headers['user-agent'] || '')
    });

    // Join user's personal room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Send initial data
    this.sendInitialData(socket);

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    socket.on('heartbeat', () => {
      socket.emit('heartbeat_ack');
      this.updateLastSeen(socket.userId!);
    });

    socket.on('identify', async (data: { large_threshold?: number; presence?: any }) => {
      // Send ready event with user data
      const userData = await this.getUserData(socket.userId!);
      socket.emit('ready', {
        user: userData,
        servers: await this.getUserServers(socket.userId!),
        session_id: socket.id,
        application: {
          id: 'cryb-platform',
          name: 'CRYB Platform'
        }
      });
    });
  }

  private handleServerEvents(socket: DiscordSocket) {
    socket.on('server:join', async (data: { serverId: string }) => {
      try {
        const member = await this.validateServerMembership(socket.userId!, data.serverId);
        if (!member) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Not a member of this server' });
        }

        await socket.join(`server:${data.serverId}`);
        socket.currentServer = data.serverId;
        
        // Send server state
        const serverState = await this.getServerState(data.serverId);
        socket.emit('server:state', serverState);

        // Notify other members
        socket.to(`server:${data.serverId}`).emit('presence:update', {
          user_id: socket.userId,
          status: 'online',
          server_id: data.serverId
        });

        console.log(`User ${socket.username} joined server ${data.serverId}`);
      } catch (error) {
        console.error('Error joining server:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join server' });
      }
    });

    socket.on('server:leave', (data: { serverId: string }) => {
      socket.leave(`server:${data.serverId}`);
      if (socket.currentServer === data.serverId) {
        socket.currentServer = undefined;
      }
      
      socket.to(`server:${data.serverId}`).emit('presence:update', {
        user_id: socket.userId,
        status: 'offline',
        server_id: data.serverId
      });
      
      socket.emit('server:left', { serverId: data.serverId });
      console.log(`User ${socket.username} left server ${data.serverId}`);
    });

    socket.on('server:request_members', async (data: { serverId: string; query?: string; limit?: number }) => {
      try {
        if (!await this.validateServerMembership(socket.userId!, data.serverId)) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Not a member of this server' });
        }

        const members = await this.getServerMembers(data.serverId, data.query, data.limit);
        socket.emit('server:members_chunk', {
          server_id: data.serverId,
          members
        });
      } catch (error) {
        console.error('Error requesting server members:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to get server members' });
      }
    });
  }

  private handleChannelEvents(socket: DiscordSocket) {
    socket.on('channel:join', async (data: { channelId: string }) => {
      try {
        const access = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) {
          return socket.emit('error', { code: 'FORBIDDEN', message: access.reason });
        }

        await socket.join(`channel:${data.channelId}`);
        socket.currentChannel = data.channelId;
        
        // Send recent messages
        const messages = await this.getChannelMessages(data.channelId, 50);
        socket.emit('channel:messages', {
          channel_id: data.channelId,
          messages
        });

        // Notify channel members
        socket.to(`channel:${data.channelId}`).emit('channel:member_join', {
          channel_id: data.channelId,
          user: {
            id: socket.userId,
            username: socket.username,
            display_name: socket.displayName
          }
        });

        console.log(`User ${socket.username} joined channel ${data.channelId}`);
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join channel' });
      }
    });

    socket.on('channel:leave', (data: { channelId: string }) => {
      socket.leave(`channel:${data.channelId}`);
      if (socket.currentChannel === data.channelId) {
        socket.currentChannel = undefined;
      }
      
      socket.to(`channel:${data.channelId}`).emit('channel:member_leave', {
        channel_id: data.channelId,
        user_id: socket.userId
      });
      
      socket.emit('channel:left', { channelId: data.channelId });
      console.log(`User ${socket.username} left channel ${data.channelId}`);
    });

    socket.on('channel:typing', async (data: { channelId: string }) => {
      try {
        const access = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) return;

        const key = `${socket.userId}-${data.channelId}`;
        
        // Clear existing timeout
        if (this.typingTimeouts.has(key)) {
          clearTimeout(this.typingTimeouts.get(key)!);
        }

        // Notify other users
        socket.to(`channel:${data.channelId}`).emit('channel:typing_start', {
          channel_id: data.channelId,
          user_id: socket.userId,
          timestamp: new Date().toISOString()
        });

        // Auto-stop typing after 10 seconds
        const timeout = setTimeout(() => {
          socket.to(`channel:${data.channelId}`).emit('channel:typing_stop', {
            channel_id: data.channelId,
            user_id: socket.userId
          });
          this.typingTimeouts.delete(key);
        }, 10000);

        this.typingTimeouts.set(key, timeout);
      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });

    socket.on('channel:typing_stop', (data: { channelId: string }) => {
      const key = `${socket.userId}-${data.channelId}`;
      
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
        this.typingTimeouts.delete(key);
      }

      socket.to(`channel:${data.channelId}`).emit('channel:typing_stop', {
        channel_id: data.channelId,
        user_id: socket.userId
      });
    });
  }

  private handleMessageEvents(socket: DiscordSocket) {
    socket.on('message:create', async (data: {
      channelId: string;
      content: string;
      nonce?: string;
      replyTo?: string;
      embeds?: any[];
      attachments?: any[];
    }) => {
      try {
        const access = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) {
          return socket.emit('error', { code: 'FORBIDDEN', message: access.reason });
        }

        // Rate limiting for messages
        const canSend = await this.checkMessageRateLimit(socket.userId!, data.channelId);
        if (!canSend) {
          return socket.emit('error', { code: 'RATE_LIMITED', message: 'Sending messages too quickly' });
        }

        // Create message in database
        const message = await this.createMessage({
          channelId: data.channelId,
          userId: socket.userId!,
          content: data.content,
          replyToId: data.replyTo,
          nonce: data.nonce,
          embeds: data.embeds,
          attachments: data.attachments
        });

        // Broadcast to channel
        this.io.to(`channel:${data.channelId}`).emit('message:create', message);

        // Stop typing
        const key = `${socket.userId}-${data.channelId}`;
        if (this.typingTimeouts.has(key)) {
          clearTimeout(this.typingTimeouts.get(key)!);
          this.typingTimeouts.delete(key);
        }
        socket.to(`channel:${data.channelId}`).emit('channel:typing_stop', {
          channel_id: data.channelId,
          user_id: socket.userId
        });

        // Process mentions and notifications
        await this.processMentions(message);

        console.log(`Message sent in channel ${data.channelId} by ${socket.username}`);
      } catch (error) {
        console.error('Error creating message:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send message' });
      }
    });

    socket.on('message:edit', async (data: { messageId: string; content: string }) => {
      try {
        const message = await this.editMessage(data.messageId, socket.userId!, data.content);
        if (!message) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot edit this message' });
        }

        this.io.to(`channel:${message.channelId}`).emit('message:update', message);
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to edit message' });
      }
    });

    socket.on('message:delete', async (data: { messageId: string }) => {
      try {
        const result = await this.deleteMessage(data.messageId, socket.userId!);
        if (!result) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot delete this message' });
        }

        this.io.to(`channel:${result.channelId}`).emit('message:delete', {
          id: data.messageId,
          channel_id: result.channelId
        });
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to delete message' });
      }
    });

    socket.on('message:react', async (data: { messageId: string; emoji: string }) => {
      try {
        const reaction = await this.addReaction(data.messageId, socket.userId!, data.emoji);
        if (!reaction) {
          return socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found' });
        }

        this.io.to(`channel:${reaction.channelId}`).emit('message:reaction_add', {
          message_id: data.messageId,
          user_id: socket.userId,
          emoji: data.emoji,
          channel_id: reaction.channelId
        });
      } catch (error) {
        console.error('Error adding reaction:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to add reaction' });
      }
    });

    socket.on('message:unreact', async (data: { messageId: string; emoji: string }) => {
      try {
        const result = await this.removeReaction(data.messageId, socket.userId!, data.emoji);
        if (!result) {
          return socket.emit('error', { code: 'NOT_FOUND', message: 'Reaction not found' });
        }

        this.io.to(`channel:${result.channelId}`).emit('message:reaction_remove', {
          message_id: data.messageId,
          user_id: socket.userId,
          emoji: data.emoji,
          channel_id: result.channelId
        });
      } catch (error) {
        console.error('Error removing reaction:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to remove reaction' });
      }
    });
  }

  private handleVoiceEvents(socket: DiscordSocket) {
    socket.on('voice:join', async (data: { channelId: string }) => {
      try {
        const access = await this.validateVoiceChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) {
          return socket.emit('error', { code: 'FORBIDDEN', message: access.reason });
        }

        // Leave current voice channel if in one
        await this.leaveVoiceChannel(socket);

        // Join new voice channel
        await socket.join(`voice:${data.channelId}`);
        socket.voiceChannel = data.channelId;
        
        const voiceState: VoiceState = {
          userId: socket.userId!,
          channelId: data.channelId,
          serverId: access.serverId!,
          muted: false,
          deafened: false,
          selfMute: false,
          selfDeaf: false,
          suppress: false,
          sessionId: socket.id,
          joinedAt: new Date()
        };

        this.voiceStates.set(socket.userId!, voiceState);

        // Broadcast to server
        this.io.to(`server:${access.serverId}`).emit('voice:state_update', voiceState);

        socket.emit('voice:joined', {
          channel_id: data.channelId,
          session_id: socket.id
        });

        console.log(`User ${socket.username} joined voice channel ${data.channelId}`);
      } catch (error) {
        console.error('Error joining voice channel:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join voice channel' });
      }
    });

    socket.on('voice:leave', () => {
      this.leaveVoiceChannel(socket);
    });

    socket.on('voice:state_update', (data: { 
      muted?: boolean; 
      deafened?: boolean; 
      selfMute?: boolean; 
      selfDeaf?: boolean; 
    }) => {
      const currentState = this.voiceStates.get(socket.userId!);
      if (!currentState) return;

      const updatedState = { ...currentState, ...data };
      this.voiceStates.set(socket.userId!, updatedState);

      this.io.to(`server:${currentState.serverId}`).emit('voice:state_update', updatedState);
    });
  }

  private handlePresenceEvents(socket: DiscordSocket) {
    socket.on('presence:update', (data: {
      status?: 'online' | 'idle' | 'dnd' | 'offline';
      activity?: any;
    }) => {
      const presence: PresenceData = {
        userId: socket.userId!,
        status: data.status || 'online',
        activity: data.activity,
        lastSeen: new Date(),
        deviceType: this.detectDeviceType(socket.handshake.headers['user-agent'] || '')
      };

      this.updatePresence(socket.userId!, presence);
      this.broadcastPresenceUpdate(socket.userId!, presence);
    });

    socket.on('presence:request', async (data: { userIds: string[] }) => {
      const presenceData = await Promise.all(
        data.userIds.map(userId => this.getPresence(userId))
      );
      
      socket.emit('presence:update_bulk', presenceData.filter(Boolean));
    });
  }

  private handleDirectMessageEvents(socket: DiscordSocket) {
    socket.on('dm:create', async (data: { recipientId: string }) => {
      try {
        const canDM = await this.validateDirectMessagePermission(socket.userId!, data.recipientId);
        if (!canDM) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot send direct message to this user' });
        }

        const dmChannelId = this.generateDMChannelId(socket.userId!, data.recipientId);
        await socket.join(`dm:${dmChannelId}`);
        
        socket.emit('dm:created', { 
          channel_id: dmChannelId, 
          recipient_id: data.recipientId 
        });
      } catch (error) {
        console.error('Error creating DM:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to create direct message' });
      }
    });
  }

  private handleDisconnect(socket: DiscordSocket) {
    this.connectionCount--;
    console.log(`❌ User ${socket.displayName} (${socket.username}) disconnected [${this.connectionCount} total]`);

    // Update presence to offline
    this.updatePresence(socket.userId!, {
      userId: socket.userId!,
      status: 'offline',
      lastSeen: new Date(),
      deviceType: this.detectDeviceType(socket.handshake.headers['user-agent'] || '')
    });

    // Clear typing timeouts
    this.typingTimeouts.forEach((timeout, key) => {
      if (key.startsWith(`${socket.userId}-`)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      }
    });

    // Leave voice channel
    this.leaveVoiceChannel(socket);

    // Broadcast offline status
    this.broadcastPresenceUpdate(socket.userId!, {
      userId: socket.userId!,
      status: 'offline',
      lastSeen: new Date(),
      deviceType: this.detectDeviceType(socket.handshake.headers['user-agent'] || '')
    });
  }

  // Helper methods
  private async sendInitialData(socket: DiscordSocket) {
    try {
      const userData = await this.getUserData(socket.userId!);
      const servers = await this.getUserServers(socket.userId!);
      
      socket.emit('ready', {
        user: userData,
        servers,
        session_id: socket.id,
        application: {
          id: 'cryb-platform',
          name: 'CRYB Platform'
        }
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  private async getUserData(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        isVerified: true,
        createdAt: true,
      }
    });
  }

  private async getUserServers(userId: string) {
    const memberships = await prisma.serverMember.findMany({
      where: { userId },
      include: {
        Server: {
          include: {
            Channel: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                name: true,
                type: true,
                position: true,
                parentId: true,
                isPrivate: true,
                nsfw: true,
              }
            },
            _count: {
              select: {
                ServerMember: true
              }
            }
          }
        },
        MemberRole: {
          include: {
            Role: true
          }
        }
      }
    });

    return memberships.map(membership => ({
      ...membership.Server,
      member: {
        roles: membership.MemberRole.map(r => r.role),
        joinedAt: membership.joinedAt,
        nickname: membership.nickname,
      }
    }));
  }

  private async validateServerMembership(userId: string, serverId: string) {
    return await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } }
    });
  }

  private async validateChannelAccess(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true }
    });

    if (!channel) {
      return { hasAccess: false, reason: 'Channel not found' };
    }

    if (!channel.serverId) {
      return { hasAccess: true, serverId: null }; // DM channel
    }

    const member = await this.validateServerMembership(userId, channel.serverId);
    if (!member) {
      return { hasAccess: false, reason: 'Not a member of this server' };
    }

    return { hasAccess: true, serverId: channel.serverId };
  }

  private async validateVoiceChannelAccess(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { type: true, serverId: true }
    });

    if (!channel || (channel.type !== 'VOICE' && channel.type !== 'STAGE')) {
      return { hasAccess: false, reason: 'Invalid voice channel' };
    }

    return this.validateChannelAccess(userId, channelId);
  }

  private detectDeviceType(userAgent: string): 'web' | 'mobile' | 'desktop' {
    if (/Mobile|Android|iP(ad|hone)/.test(userAgent)) return 'mobile';
    if (/Electron/.test(userAgent)) return 'desktop';
    return 'web';
  }

  private updatePresence(userId: string, presence: PresenceData) {
    this.presenceCache.set(userId, presence);
    
    // Store in Redis with expiration
    this.generalRedis.setex(
      `presence:${userId}`,
      300, // 5 minutes
      JSON.stringify(presence)
    );
  }

  private async getPresence(userId: string): Promise<PresenceData | null> {
    // Check cache first
    const cached = this.presenceCache.get(userId);
    if (cached) return cached;

    // Check Redis
    const stored = await this.generalRedis.get(`presence:${userId}`);
    if (stored) {
      const presence = JSON.parse(stored);
      this.presenceCache.set(userId, presence);
      return presence;
    }

    return null;
  }

  private broadcastPresenceUpdate(userId: string, presence: PresenceData) {
    this.io.emit('presence:update', {
      user_id: userId,
      ...presence
    });
  }

  private updateLastSeen(userId: string) {
    const presence = this.presenceCache.get(userId);
    if (presence) {
      presence.lastSeen = new Date();
      this.updatePresence(userId, presence);
    }
  }

  private async leaveVoiceChannel(socket: DiscordSocket) {
    if (!socket.voiceChannel) return;

    const currentState = this.voiceStates.get(socket.userId!);
    if (!currentState) return;

    socket.leave(`voice:${socket.voiceChannel}`);
    this.voiceStates.delete(socket.userId!);

    this.io.to(`server:${currentState.serverId}`).emit('voice:state_update', {
      ...currentState,
      channel_id: null
    });

    socket.voiceChannel = undefined;
    socket.emit('voice:left', { channel_id: currentState.channelId });
    console.log(`User ${socket.username} left voice channel ${currentState.channelId}`);
  }

  private generateDMChannelId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('-');
  }

  private async getServerState(serverId: string) {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        channels: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            type: true,
            position: true,
            parentId: true,
            isPrivate: true,
            nsfw: true,
            slowMode: true,
            topic: true,
          }
        },
        roles: {
          orderBy: { position: 'desc' },
          select: {
            id: true,
            name: true,
            color: true,
            permissions: true,
            position: true,
            hoist: true,
            mentionable: true,
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    return server;
  }

  private async getServerMembers(serverId: string, query?: string, limit = 100) {
    const where: any = { serverId };
    
    if (query) {
      where.user = {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      };
    }

    const members = await prisma.serverMember.findMany({
      where,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return members.map(member => ({
      user: member.user,
      nickname: member.nickname,
      joined_at: member.joinedAt,
      roles: member.roles.map(r => r.role.id),
      presence: this.presenceCache.get(member.userId) || { status: 'offline' }
    }));
  }

  private async getChannelMessages(channelId: string, limit = 50) {
    return await prisma.message.findMany({
      where: { channelId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            isBot: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        attachments: true,
        embeds: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });
  }

  private async createMessage(data: {
    channelId: string;
    userId: string;
    content: string;
    replyToId?: string;
    nonce?: string;
    embeds?: any[];
    attachments?: any[];
  }) {
    const message = await prisma.message.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        content: data.content,
        replyToId: data.replyToId,
        nonce: data.nonce,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            isBot: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        attachments: true,
        embeds: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    // Handle attachments if any
    if (data.attachments && data.attachments.length > 0) {
      await prisma.messageAttachment.createMany({
        data: data.attachments.map((att: any) => ({
          messageId: message.id,
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          url: att.url,
          proxyUrl: att.proxyUrl || att.url
        }))
      });
    }

    return message;
  }

  private async editMessage(messageId: string, userId: string, content: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { userId: true, channelId: true, createdAt: true }
    });

    if (!message || message.userId !== userId) return null;

    // Check if message is too old (24 hours)
    const hoursSinceCreation = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) return null;

    return await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        editedTimestamp: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
            isBot: true
          }
        },
        attachments: true,
        embeds: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });
  }

  private async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            server: true
          }
        }
      }
    });

    if (!message) return null;

    // Check if user can delete (author, server owner, or has manage messages permission)
    let canDelete = message.userId === userId;

    if (!canDelete && message.channel.serverId) {
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
            userId
          }
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      canDelete = message.channel.server!.ownerId === userId ||
        member?.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x2000) // MANAGE_MESSAGES
        ) || false;
    }

    if (!canDelete) return null;

    // Delete message and related data
    await prisma.$transaction([
      prisma.messageAttachment.deleteMany({ where: { messageId } }),
      prisma.messageEmbed.deleteMany({ where: { messageId } }),
      prisma.reaction.deleteMany({ where: { messageId } }),
      prisma.message.delete({ where: { id: messageId } })
    ]);

    return { channelId: message.channelId };
  }

  private async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, channelId: true }
    });

    if (!message) return null;

    // Check if reaction already exists
    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (existing) {
      // Remove reaction
      await prisma.reaction.delete({
        where: { id: existing.id }
      });
      return { channelId: message.channelId, action: 'remove' };
    } else {
      // Add reaction
      await prisma.reaction.create({
        data: { messageId, userId, emoji }
      });
      return { channelId: message.channelId, action: 'add' };
    }
  }

  private async removeReaction(messageId: string, userId: string, emoji: string) {
    const reaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      },
      include: {
        message: {
          select: {
            channelId: true
          }
        }
      }
    });

    if (!reaction) return null;

    await prisma.reaction.delete({
      where: { id: reaction.id }
    });

    return { channelId: reaction.message.channelId };
  }

  private async checkMessageRateLimit(userId: string, channelId: string): Promise<boolean> {
    const key = `rate_limit:message:${userId}:${channelId}`;
    const current = await this.generalRedis.get(key);
    const limit = 5; // 5 messages per 5 seconds
    
    if (!current) {
      await this.generalRedis.setex(key, 5, '1');
      return true;
    }
    
    const count = parseInt(current);
    if (count >= limit) {
      return false;
    }
    
    await this.generalRedis.incr(key);
    return true;
  }

  private async processMentions(message: any) {
    // Extract mentions from message content
    const mentionRegex = /<@!?(\w+)>/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(message.content)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        // Send notification to mentioned user
        this.io.to(`user:${mentionedUserId}`).emit('message:mention', {
          message_id: message.id,
          channel_id: message.channelId,
          author: {
            id: message.user.id,
            username: message.user.username,
            display_name: message.user.displayName
          }
        });
      }
    }
  }

  private async validateDirectMessagePermission(senderId: string, recipientId: string): Promise<boolean> {
    // Check if users share a mutual server or have previously DMed
    const mutualServers = await prisma.serverMember.findMany({
      where: {
        OR: [
          { userId: senderId },
          { userId: recipientId }
        ]
      },
      select: {
        serverId: true,
        userId: true
      }
    });

    const senderServers = mutualServers.filter(m => m.userId === senderId).map(m => m.serverId);
    const recipientServers = mutualServers.filter(m => m.userId === recipientId).map(m => m.serverId);
    
    const hasMutualServer = senderServers.some(serverId => recipientServers.includes(serverId));
    
    return hasMutualServer;
  }

  private setupPresenceCleanup() {
    // Clean up offline users every 5 minutes
    setInterval(() => {
      const now = Date.now();
      this.presenceCache.forEach((presence, userId) => {
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        if (presence.lastSeen.getTime() < fiveMinutesAgo && presence.status !== 'offline') {
          presence.status = 'offline';
          this.updatePresence(userId, presence);
          this.broadcastPresenceUpdate(userId, presence);
        }
      });
    }, 5 * 60 * 1000);
  }

  // Public API for external access
  public getConnectionCount(): number {
    return this.connectionCount;
  }

  public getPresenceCount(): number {
    return this.presenceCache.size;
  }

  public getVoiceStateCount(): number {
    return this.voiceStates.size;
  }

  public async broadcastToServer(serverId: string, event: string, data: any) {
    this.io.to(`server:${serverId}`).emit(event, data);
  }

  public async broadcastToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }
}