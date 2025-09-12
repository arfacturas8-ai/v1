import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { AuthService } from './auth';
import Redis from 'ioredis';

export interface EnhancedSocket extends Socket {
  userId?: string;
  username?: string;
  userDisplayName?: string;
  isAuthenticated?: boolean;
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'invisible';
  activity?: string;
  lastSeen: Date;
  deviceType?: 'web' | 'mobile' | 'desktop';
}

export interface VoiceState {
  userId: string;
  channelId: string;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  joinedAt: Date;
}

export class EnhancedSocketService {
  private io: Server;
  private redis: Redis;
  private authService: AuthService;
  private presenceCache: Map<string, PresenceData> = new Map();
  private voiceStates: Map<string, VoiceState> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(io: Server, redis: Redis, authService: AuthService) {
    this.io = io;
    this.redis = redis;
    this.authService = authService;
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupPresenceCleanup();
  }

  private setupMiddleware() {
    // Enhanced authentication middleware
    this.io.use(async (socket: EnhancedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const validation = await this.authService.validateAccessToken(token);
        if (!validation.valid) {
          return next(new Error(validation.reason || 'Invalid token'));
        }

        const user = await prisma.user.findUnique({
          where: { id: validation.payload.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.username = user.username;
        socket.userDisplayName = user.displayName;
        socket.isAuthenticated = true;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
    
    this.io.use((socket: EnhancedSocket, next) => {
      if (!socket.userId) return next();
      
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 120; // 120 events per minute
      
      const userLimit = rateLimitMap.get(socket.userId);
      
      if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(socket.userId, { count: 1, resetTime: now + windowMs });
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
    this.io.on('connection', (socket: EnhancedSocket) => {
      console.log(`✅ User ${socket.userDisplayName} (${socket.username}) connected`);
      
      this.handleConnectionEvents(socket);
      this.handleServerEvents(socket);
      this.handleChannelEvents(socket);
      this.handleMessageEvents(socket);
      this.handleVoiceEvents(socket);
      this.handlePresenceEvents(socket);
      this.handleDirectMessageEvents(socket);
      this.handleModerationEvents(socket);
    });
  }

  private handleConnectionEvents(socket: EnhancedSocket) {
    // User comes online
    this.updatePresence(socket.userId!, {
      userId: socket.userId!,
      status: 'online',
      lastSeen: new Date(),
      deviceType: this.detectDeviceType(socket.handshake.headers['user-agent'] || '')
    });

    // Join user's personal room for direct notifications
    socket.join(`user-${socket.userId}`);

    // Broadcast user online status
    this.broadcastPresenceUpdate(socket.userId!, 'online');

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // Heartbeat for presence
    socket.on('ping', () => {
      socket.emit('pong');
      this.updateLastSeen(socket.userId!);
    });
  }

  private handleServerEvents(socket: EnhancedSocket) {
    socket.on('join-server', async (data: { serverId: string }) => {
      try {
        const member = await this.validateServerMembership(socket.userId!, data.serverId);
        if (!member) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Not a member of this server' });
        }

        await socket.join(`server-${data.serverId}`);
        socket.emit('joined-server', { serverId: data.serverId });

        // Send server state
        const serverState = await this.getServerState(data.serverId);
        socket.emit('server-state', serverState);

        console.log(`User ${socket.username} joined server ${data.serverId}`);
      } catch (error) {
        console.error('Error joining server:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join server' });
      }
    });

    socket.on('leave-server', (data: { serverId: string }) => {
      socket.leave(`server-${data.serverId}`);
      socket.emit('left-server', { serverId: data.serverId });
      console.log(`User ${socket.username} left server ${data.serverId}`);
    });

    socket.on('server-settings-update', async (data: { serverId: string; settings: any }) => {
      try {
        // Validate permissions
        const hasPermission = await this.validateServerOwnership(socket.userId!, data.serverId);
        if (!hasPermission) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions' });
        }

        // Update server settings
        await prisma.server.update({
          where: { id: data.serverId },
          data: data.settings
        });

        // Broadcast to all server members
        this.io.to(`server-${data.serverId}`).emit('server-updated', {
          serverId: data.serverId,
          updatedBy: socket.userId,
          changes: data.settings
        });
      } catch (error) {
        console.error('Error updating server settings:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to update server settings' });
      }
    });
  }

  private handleChannelEvents(socket: EnhancedSocket) {
    socket.on('join-channel', async (data: { channelId: string }) => {
      try {
        const access = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) {
          return socket.emit('error', { code: 'FORBIDDEN', message: access.reason });
        }

        await socket.join(`channel-${data.channelId}`);
        socket.emit('joined-channel', { channelId: data.channelId });

        // Send recent messages
        const recentMessages = await this.getRecentMessages(data.channelId);
        socket.emit('channel-history', { channelId: data.channelId, messages: recentMessages });

        // Update channel member list
        this.io.to(`channel-${data.channelId}`).emit('user-joined-channel', {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.userDisplayName
        });

        console.log(`User ${socket.username} joined channel ${data.channelId}`);
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join channel' });
      }
    });

    socket.on('leave-channel', (data: { channelId: string }) => {
      socket.leave(`channel-${data.channelId}`);
      socket.emit('left-channel', { channelId: data.channelId });
      
      this.io.to(`channel-${data.channelId}`).emit('user-left-channel', {
        userId: socket.userId
      });
      
      console.log(`User ${socket.username} left channel ${data.channelId}`);
    });

    socket.on('channel-settings-update', async (data: { channelId: string; settings: any }) => {
      try {
        const hasPermission = await this.validateChannelManagePermission(socket.userId!, data.channelId);
        if (!hasPermission) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions' });
        }

        await prisma.channel.update({
          where: { id: data.channelId },
          data: data.settings
        });

        this.io.to(`channel-${data.channelId}`).emit('channel-updated', {
          channelId: data.channelId,
          updatedBy: socket.userId,
          changes: data.settings
        });
      } catch (error) {
        console.error('Error updating channel settings:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to update channel settings' });
      }
    });
  }

  private handleMessageEvents(socket: EnhancedSocket) {
    socket.on('send-message', async (data: {
      channelId: string;
      content: string;
      replyToId?: string;
      attachments?: any[];
      embeds?: any[];
    }) => {
      try {
        // Validate channel access
        const access = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) {
          return socket.emit('error', { code: 'FORBIDDEN', message: access.reason });
        }

        // Check rate limits for messages
        const canSend = await this.checkMessageRateLimit(socket.userId!, data.channelId);
        if (!canSend) {
          return socket.emit('error', { code: 'RATE_LIMITED', message: 'Sending messages too quickly' });
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            channelId: data.channelId,
            userId: socket.userId!,
            content: data.content,
            replyToId: data.replyToId,
            attachments: data.attachments || null,
            embeds: data.embeds || null
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            replyTo: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        });

        // Broadcast to channel
        this.io.to(`channel-${data.channelId}`).emit('new-message', message);

        // Process mentions and notifications
        await this.processMentions(message);

        // Queue for search indexing
        await this.queueMessageIndexing(message);

        console.log(`Message sent in channel ${data.channelId} by ${socket.username}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send message' });
      }
    });

    socket.on('edit-message', async (data: { messageId: string; content: string }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: data.messageId },
          include: { user: true }
        });

        if (!message || message.userId !== socket.userId) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot edit this message' });
        }

        // Check if message is too old (5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (message.createdAt < fiveMinutesAgo) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Message too old to edit' });
        }

        const updatedMessage = await prisma.message.update({
          where: { id: data.messageId },
          data: { 
            content: data.content,
            editedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        });

        this.io.to(`channel-${message.channelId}`).emit('message-updated', updatedMessage);
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to edit message' });
      }
    });

    socket.on('delete-message', async (data: { messageId: string }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: data.messageId },
          include: { channel: { include: { server: true } } }
        });

        if (!message) {
          return socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found' });
        }

        // Check if user owns message or has delete permissions
        const canDelete = message.userId === socket.userId || 
          await this.validateDeleteMessagePermission(socket.userId!, message.channel.serverId);

        if (!canDelete) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot delete this message' });
        }

        await prisma.message.delete({
          where: { id: data.messageId }
        });

        this.io.to(`channel-${message.channelId}`).emit('message-deleted', {
          messageId: data.messageId,
          channelId: message.channelId,
          deletedBy: socket.userId
        });
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to delete message' });
      }
    });

    // Enhanced typing indicators
    socket.on('typing', (data: { channelId: string }) => {
      const key = `${socket.userId}-${data.channelId}`;
      
      // Clear existing timeout
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
      }

      socket.to(`channel-${data.channelId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        displayName: socket.userDisplayName,
        channelId: data.channelId
      });

      // Auto-stop typing after 10 seconds
      const timeout = setTimeout(() => {
        socket.to(`channel-${data.channelId}`).emit('user-stop-typing', {
          userId: socket.userId,
          channelId: data.channelId
        });
        this.typingTimeouts.delete(key);
      }, 10000);

      this.typingTimeouts.set(key, timeout);
    });

    socket.on('stop-typing', (data: { channelId: string }) => {
      const key = `${socket.userId}-${data.channelId}`;
      
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
        this.typingTimeouts.delete(key);
      }

      socket.to(`channel-${data.channelId}`).emit('user-stop-typing', {
        userId: socket.userId,
        channelId: data.channelId
      });
    });
  }

  private handleVoiceEvents(socket: EnhancedSocket) {
    socket.on('join-voice', async (data: { channelId: string }) => {
      try {
        const access = await this.validateVoiceChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) {
          return socket.emit('error', { code: 'FORBIDDEN', message: access.reason });
        }

        // Leave current voice channel if in one
        await this.leaveCurrentVoiceChannel(socket);

        // Join new voice channel
        await socket.join(`voice-${data.channelId}`);
        
        const voiceState: VoiceState = {
          userId: socket.userId!,
          channelId: data.channelId,
          muted: false,
          deafened: false,
          speaking: false,
          joinedAt: new Date()
        };

        this.voiceStates.set(socket.userId!, voiceState);

        // Broadcast to channel
        this.io.to(`voice-${data.channelId}`).emit('user-joined-voice', {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.userDisplayName,
          voiceState
        });

        // Send current voice channel state to user
        const channelVoiceState = await this.getVoiceChannelState(data.channelId);
        socket.emit('voice-state-update', { channelId: data.channelId, users: channelVoiceState });

        console.log(`User ${socket.username} joined voice channel ${data.channelId}`);
      } catch (error) {
        console.error('Error joining voice channel:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join voice channel' });
      }
    });

    socket.on('leave-voice', () => {
      this.leaveCurrentVoiceChannel(socket);
    });

    socket.on('voice-state-update', (data: { muted?: boolean; deafened?: boolean; speaking?: boolean }) => {
      const currentState = this.voiceStates.get(socket.userId!);
      if (!currentState) return;

      const updatedState = {
        ...currentState,
        ...data
      };

      this.voiceStates.set(socket.userId!, updatedState);

      this.io.to(`voice-${currentState.channelId}`).emit('voice-state-update', {
        userId: socket.userId,
        voiceState: updatedState
      });
    });
  }

  private handlePresenceEvents(socket: EnhancedSocket) {
    socket.on('update-presence', (data: {
      status: 'online' | 'away' | 'busy' | 'invisible';
      activity?: string;
    }) => {
      this.updatePresence(socket.userId!, {
        userId: socket.userId!,
        status: data.status,
        activity: data.activity,
        lastSeen: new Date(),
        deviceType: this.detectDeviceType(socket.handshake.headers['user-agent'] || '')
      });

      this.broadcastPresenceUpdate(socket.userId!, data.status, data.activity);
    });

    socket.on('get-presence', async (data: { userIds: string[] }) => {
      const presenceData = await Promise.all(
        data.userIds.map(userId => this.getPresence(userId))
      );
      
      socket.emit('presence-data', presenceData.filter(Boolean));
    });
  }

  private handleDirectMessageEvents(socket: EnhancedSocket) {
    socket.on('create-dm', async (data: { userId: string }) => {
      try {
        // Check if users can DM each other (mutual servers, etc.)
        const canDM = await this.validateDirectMessagePermission(socket.userId!, data.userId);
        if (!canDM) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot send direct message to this user' });
        }

        const dmChannelId = this.generateDMChannelId(socket.userId!, data.userId);
        await socket.join(`dm-${dmChannelId}`);
        
        socket.emit('dm-created', { channelId: dmChannelId, recipientId: data.userId });
      } catch (error) {
        console.error('Error creating DM:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to create direct message' });
      }
    });

    socket.on('send-dm', async (data: { recipientId: string; content: string }) => {
      try {
        const dmChannelId = this.generateDMChannelId(socket.userId!, data.recipientId);
        
        // Create DM record (you'd need a DM table)
        const dm = {
          id: `dm-${Date.now()}`,
          channelId: dmChannelId,
          senderId: socket.userId!,
          recipientId: data.recipientId,
          content: data.content,
          timestamp: new Date()
        };

        // Send to recipient if online
        this.io.to(`user-${data.recipientId}`).emit('new-dm', dm);
        this.io.to(`dm-${dmChannelId}`).emit('new-dm', dm);

        socket.emit('dm-sent', dm);
      } catch (error) {
        console.error('Error sending DM:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send direct message' });
      }
    });
  }

  private handleModerationEvents(socket: EnhancedSocket) {
    socket.on('kick-member', async (data: { serverId: string; userId: string; reason?: string }) => {
      try {
        const hasPermission = await this.validateKickPermission(socket.userId!, data.serverId);
        if (!hasPermission) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions' });
        }

        // Remove member from server
        await prisma.serverMember.delete({
          where: {
            serverId_userId: {
              serverId: data.serverId,
              userId: data.userId
            }
          }
        });

        // Force disconnect user from server rooms
        const userSockets = await this.io.in(`user-${data.userId}`).fetchSockets();
        userSockets.forEach(userSocket => {
          userSocket.leave(`server-${data.serverId}`);
          userSocket.emit('kicked-from-server', {
            serverId: data.serverId,
            reason: data.reason,
            moderator: socket.username
          });
        });

        // Broadcast to server
        this.io.to(`server-${data.serverId}`).emit('member-kicked', {
          userId: data.userId,
          serverId: data.serverId,
          moderator: socket.userId,
          reason: data.reason
        });

        console.log(`User ${data.userId} kicked from server ${data.serverId} by ${socket.username}`);
      } catch (error) {
        console.error('Error kicking member:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to kick member' });
      }
    });

    socket.on('ban-member', async (data: { serverId: string; userId: string; reason?: string }) => {
      try {
        const hasPermission = await this.validateBanPermission(socket.userId!, data.serverId);
        if (!hasPermission) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions' });
        }

        // Create ban record
        await prisma.ban.create({
          data: {
            serverId: data.serverId,
            userId: data.userId,
            bannedBy: socket.userId!,
            reason: data.reason
          }
        });

        // Remove member from server
        await prisma.serverMember.deleteMany({
          where: {
            serverId: data.serverId,
            userId: data.userId
          }
        });

        // Force disconnect and notify
        const userSockets = await this.io.in(`user-${data.userId}`).fetchSockets();
        userSockets.forEach(userSocket => {
          userSocket.leave(`server-${data.serverId}`);
          userSocket.emit('banned-from-server', {
            serverId: data.serverId,
            reason: data.reason,
            moderator: socket.username
          });
        });

        this.io.to(`server-${data.serverId}`).emit('member-banned', {
          userId: data.userId,
          serverId: data.serverId,
          moderator: socket.userId,
          reason: data.reason
        });

        console.log(`User ${data.userId} banned from server ${data.serverId} by ${socket.username}`);
      } catch (error) {
        console.error('Error banning member:', error);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to ban member' });
      }
    });
  }

  private handleDisconnect(socket: EnhancedSocket) {
    console.log(`❌ User ${socket.userDisplayName} (${socket.username}) disconnected`);

    // Update presence to offline
    this.updatePresence(socket.userId!, {
      userId: socket.userId!,
      status: 'invisible',
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
    this.leaveCurrentVoiceChannel(socket);

    // Broadcast offline status
    this.broadcastPresenceUpdate(socket.userId!, 'invisible');
  }

  // Helper methods
  private async validateServerMembership(userId: string, serverId: string) {
    return await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } }
    });
  }

  private async validateServerOwnership(userId: string, serverId: string) {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { ownerId: true }
    });
    return server?.ownerId === userId;
  }

  private async validateChannelAccess(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true }
    });

    if (!channel) {
      return { hasAccess: false, reason: 'Channel not found' };
    }

    const member = await this.validateServerMembership(userId, channel.serverId);
    if (!member) {
      return { hasAccess: false, reason: 'Not a member of this server' };
    }

    // Check channel permissions here
    return { hasAccess: true };
  }

  private async validateVoiceChannelAccess(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { type: true, serverId: true }
    });

    if (!channel || (channel.type !== 'VOICE' && channel.type !== 'VIDEO')) {
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
    this.redis.setex(
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
    const stored = await this.redis.get(`presence:${userId}`);
    if (stored) {
      const presence = JSON.parse(stored);
      this.presenceCache.set(userId, presence);
      return presence;
    }

    return null;
  }

  private broadcastPresenceUpdate(userId: string, status: string, activity?: string) {
    this.io.emit('presence-update', {
      userId,
      status,
      activity,
      lastSeen: new Date()
    });
  }

  private updateLastSeen(userId: string) {
    const presence = this.presenceCache.get(userId);
    if (presence) {
      presence.lastSeen = new Date();
      this.updatePresence(userId, presence);
    }
  }

  private async leaveCurrentVoiceChannel(socket: EnhancedSocket) {
    const currentState = this.voiceStates.get(socket.userId!);
    if (!currentState) return;

    socket.leave(`voice-${currentState.channelId}`);
    this.voiceStates.delete(socket.userId!);

    this.io.to(`voice-${currentState.channelId}`).emit('user-left-voice', {
      userId: socket.userId,
      channelId: currentState.channelId
    });

    socket.emit('left-voice', { channelId: currentState.channelId });
    console.log(`User ${socket.username} left voice channel ${currentState.channelId}`);
  }

  private generateDMChannelId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('-');
  }

  private async getServerState(serverId: string) {
    // Return server channels, online members, etc.
    const channels = await prisma.channel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' }
    });

    return {
      serverId,
      channels
    };
  }

  private async getRecentMessages(channelId: string, limit = 50) {
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
            avatar: true
          }
        }
      }
    });
  }

  private async getVoiceChannelState(channelId: string) {
    const states: VoiceState[] = [];
    this.voiceStates.forEach((state) => {
      if (state.channelId === channelId) {
        states.push(state);
      }
    });
    return states;
  }

  private async checkMessageRateLimit(userId: string, channelId: string): Promise<boolean> {
    const key = `rate_limit:message:${userId}:${channelId}`;
    const current = await this.redis.get(key);
    const limit = 10; // 10 messages per minute
    
    if (!current) {
      await this.redis.setex(key, 60, '1');
      return true;
    }
    
    const count = parseInt(current);
    if (count >= limit) {
      return false;
    }
    
    await this.redis.incr(key);
    return true;
  }

  private async processMentions(message: any) {
    // Extract mentions from message content
    const mentionRegex = /@(\w+)/g;
    const mentions = message.content.match(mentionRegex);
    
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.slice(1);
        // Send notification to mentioned user
        this.io.to(`user-${username}`).emit('mentioned', {
          messageId: message.id,
          channelId: message.channelId,
          mentionedBy: message.user.username
        });
      }
    }
  }

  private async queueMessageIndexing(message: any) {
    // Queue message for Elasticsearch indexing
    await this.redis.lpush('search_index_queue', JSON.stringify({
      type: 'message',
      id: message.id,
      data: message
    }));
  }

  private setupPresenceCleanup() {
    // Clean up offline users every 5 minutes
    setInterval(() => {
      const now = Date.now();
      this.presenceCache.forEach((presence, userId) => {
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        if (presence.lastSeen.getTime() < fiveMinutesAgo) {
          this.presenceCache.delete(userId);
        }
      });
    }, 5 * 60 * 1000);
  }

  // Permission validation helpers
  private async validateChannelManagePermission(userId: string, channelId: string): Promise<boolean> {
    // Implement channel management permission check
    return true; // Placeholder
  }

  private async validateDeleteMessagePermission(userId: string, serverId: string): Promise<boolean> {
    // Check if user has message deletion permissions
    return true; // Placeholder
  }

  private async validateKickPermission(userId: string, serverId: string): Promise<boolean> {
    // Check if user can kick members
    return true; // Placeholder
  }

  private async validateBanPermission(userId: string, serverId: string): Promise<boolean> {
    // Check if user can ban members
    return true; // Placeholder
  }

  private async validateDirectMessagePermission(senderId: string, recipientId: string): Promise<boolean> {
    // Check if users can DM each other
    return true; // Placeholder
  }
}