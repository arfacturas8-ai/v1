import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

/**
 * COMPREHENSIVE REAL-TIME MESSAGING SYSTEM
 * 
 * Features implemented:
 * ✅ Message send/receive with acknowledgments
 * ✅ Typing indicators with automatic timeout
 * ✅ Read receipts for messages
 * ✅ Room/channel joining and leaving
 * ✅ Presence tracking (online/offline status)
 * ✅ Message history synchronization
 * ✅ Real-time notifications
 * ✅ Rate limiting to prevent spam
 * ✅ Error handling and recovery
 * ✅ Memory leak prevention
 * ✅ Redis pub/sub for scaling
 */

interface MessageData {
  id?: string;
  content: string;
  channelId: string;
  userId: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyTo?: string;
  mentions?: string[];
  attachments?: any[];
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

interface TypingIndicator {
  userId: string;
  channelId: string;
  username: string;
  startedAt: Date;
  timeout?: NodeJS.Timeout;
}

interface PresenceData {
  userId: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  isOnline: boolean;
  lastSeen: Date;
  customStatus?: string;
  activity?: {
    type: string;
    name: string;
    details?: string;
  };
}

interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: Date;
}

interface RoomMember {
  userId: string;
  username: string;
  joinedAt: Date;
  lastSeen: Date;
}

interface NotificationData {
  id: string;
  type: 'message' | 'mention' | 'reply' | 'dm' | 'system';
  title: string;
  content: string;
  channelId?: string;
  senderId: string;
  targetUserId: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

// Rate limiting configurations
const RATE_LIMITS = {
  'message:send': { windowMs: 60000, maxRequests: 30 },
  'message:edit': { windowMs: 60000, maxRequests: 10 },
  'message:delete': { windowMs: 60000, maxRequests: 5 },
  'typing:start': { windowMs: 10000, maxRequests: 10 },
  'typing:stop': { windowMs: 10000, maxRequests: 10 },
  'room:join': { windowMs: 60000, maxRequests: 50 },
  'room:leave': { windowMs: 60000, maxRequests: 50 },
  'presence:update': { windowMs: 30000, maxRequests: 5 },
  'message:history': { windowMs: 60000, maxRequests: 10 },
  'notification:mark_read': { windowMs: 60000, maxRequests: 100 },
};

export class RealtimeMessagingSystem {
  private io: Server;
  private redis: Redis;
  private fastify: FastifyInstance;
  
  // In-memory stores for performance
  private presenceMap = new Map<string, PresenceData>();
  private typingMap = new Map<string, TypingIndicator>();
  private roomMembersMap = new Map<string, Set<RoomMember>>();
  private userRoomsMap = new Map<string, Set<string>>();
  private rateLimitMap = new Map<string, Map<string, { count: number; resetTime: number }>>();
  
  // Cleanup tracking
  private cleanupIntervals: NodeJS.Timeout[] = [];
  
  // Metrics
  private metrics = {
    messagesSent: 0,
    messagesDelivered: 0,
    messagesRejected: 0,
    typingEvents: 0,
    presenceUpdates: 0,
    roomJoins: 0,
    roomLeaves: 0,
    notificationsSent: 0,
    readReceipts: 0,
    historyRequests: 0
  };

  constructor(io: Server, redis: Redis, fastify: FastifyInstance) {
    this.io = io;
    this.redis = redis;
    this.fastify = fastify;
    this.initialize();
  }

  private initialize() {
    this.setupCleanupIntervals();
    this.setupRedisSubscriptions();
    this.fastify.log.info('📨 Realtime Messaging System initialized');
  }

  /**
   * Setup Socket Event Handlers
   */
  public setupSocketHandlers(socket: Socket & any) {
    this.setupMessageEvents(socket);
    this.setupTypingEvents(socket);
    this.setupReadReceiptEvents(socket);
    this.setupRoomEvents(socket);
    this.setupPresenceEvents(socket);
    this.setupHistoryEvents(socket);
    this.setupNotificationEvents(socket);
    this.setupUtilityEvents(socket);
    this.setupConnectionCleanup(socket);

    this.fastify.log.info(`📨 Message handlers setup for user: ${socket.username}`);
  }

  /**
   * MESSAGE SEND/RECEIVE EVENTS
   */
  private setupMessageEvents(socket: Socket & any) {
    // Send message
    socket.on('message:send', async (data: Partial<MessageData>, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'message:send')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many messages sent');
          return;
        }

        // Validate message data
        const validatedData = await this.validateMessageData(data, socket);
        if (!validatedData) {
          this.sendError(callback, 'INVALID_MESSAGE_DATA', 'Invalid message data');
          return;
        }

        // Check channel permissions
        const canSend = await this.checkChannelPermissions(socket.userId, validatedData.channelId, 'send_messages');
        if (!canSend) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to send messages in this channel');
          return;
        }

        // Create message in database
        const message = await this.createMessage(validatedData);
        if (!message) {
          this.sendError(callback, 'MESSAGE_CREATION_FAILED', 'Failed to create message');
          return;
        }

        // Broadcast to channel members
        await this.broadcastMessage(message);
        
        // Send acknowledgment
        if (callback) {
          callback({
            success: true,
            message: {
              id: message.id,
              timestamp: message.timestamp
            }
          });
        }

        // Create notifications for mentions
        if (message.mentions && message.mentions.length > 0) {
          await this.createMentionNotifications(message);
        }

        this.metrics.messagesSent++;
        this.fastify.log.info(`📨 Message sent by ${socket.username} to channel ${message.channelId}`);

      } catch (error) {
        this.fastify.log.error('Message send error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to send message');
        this.metrics.messagesRejected++;
      }
    });

    // Edit message
    socket.on('message:edit', async (data: { messageId: string; content: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'message:edit')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many edits');
          return;
        }

        const message = await this.editMessage(data.messageId, data.content, socket.userId);
        if (!message) {
          this.sendError(callback, 'EDIT_FAILED', 'Failed to edit message');
          return;
        }

        // Broadcast edit to channel
        this.io.to(`channel:${message.channelId}`).emit('message:edited', {
          messageId: message.id,
          content: message.content,
          editedAt: message.editedAt,
          editedBy: socket.userId
        });

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Message edit error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to edit message');
      }
    });

    // Delete message
    socket.on('message:delete', async (data: { messageId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'message:delete')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many deletions');
          return;
        }

        const result = await this.deleteMessage(data.messageId, socket.userId);
        if (!result) {
          this.sendError(callback, 'DELETE_FAILED', 'Failed to delete message');
          return;
        }

        // Broadcast deletion to channel
        this.io.to(`channel:${result.channelId}`).emit('message:deleted', {
          messageId: data.messageId,
          deletedBy: socket.userId,
          deletedAt: new Date()
        });

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Message delete error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to delete message');
      }
    });
  }

  /**
   * TYPING INDICATORS
   */
  private setupTypingEvents(socket: Socket & any) {
    // Start typing
    socket.on('typing:start', async (data: { channelId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'typing:start')) {
          return; // Silently ignore rate limited typing events
        }

        const { channelId } = data;
        if (!channelId) return;

        // Check channel permissions
        const canView = await this.checkChannelPermissions(socket.userId, channelId, 'view_channel');
        if (!canView) return;

        const typingKey = `${socket.userId}:${channelId}`;
        
        // Clear existing timeout
        const existing = this.typingMap.get(typingKey);
        if (existing?.timeout) {
          clearTimeout(existing.timeout);
        }

        // Create new typing indicator
        const typing: TypingIndicator = {
          userId: socket.userId,
          channelId,
          username: socket.username,
          startedAt: new Date()
        };

        // Auto-stop after 10 seconds
        typing.timeout = setTimeout(() => {
          this.stopTyping(socket.userId, channelId);
        }, 10000);

        this.typingMap.set(typingKey, typing);

        // Broadcast to channel (except sender)
        socket.to(`channel:${channelId}`).emit('typing:user_start', {
          userId: socket.userId,
          username: socket.username,
          channelId
        });

        // Store in Redis for cross-server sync
        await this.redis.setex(
          `typing:${channelId}:${socket.userId}`,
          10, // 10 seconds
          JSON.stringify({ username: socket.username, startedAt: new Date() })
        );

        this.metrics.typingEvents++;

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Typing start error:', error);
      }
    });

    // Stop typing
    socket.on('typing:stop', async (data: { channelId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'typing:stop')) {
          return;
        }

        const { channelId } = data;
        if (!channelId) return;

        await this.stopTyping(socket.userId, channelId);

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Typing stop error:', error);
      }
    });
  }

  /**
   * READ RECEIPTS
   */
  private setupReadReceiptEvents(socket: Socket & any) {
    socket.on('message:mark_read', async (data: { messageId: string; channelId: string }, callback?: Function) => {
      try {
        const { messageId, channelId } = data;

        // Mark as read in database
        await prisma.messageRead.upsert({
          where: {
            messageId_userId: {
              messageId,
              userId: socket.userId
            }
          },
          update: {
            readAt: new Date()
          },
          create: {
            messageId,
            userId: socket.userId,
            readAt: new Date()
          }
        });

        // Get message sender to notify
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { userId: true }
        });

        if (message && message.userId !== socket.userId) {
          // Notify message sender about read receipt
          this.io.to(`user:${message.userId}`).emit('message:read_receipt', {
            messageId,
            readBy: {
              userId: socket.userId,
              username: socket.username
            },
            readAt: new Date()
          });
        }

        this.metrics.readReceipts++;

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Mark read error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to mark as read');
      }
    });
  }

  /**
   * ROOM/CHANNEL EVENTS
   */
  private setupRoomEvents(socket: Socket & any) {
    // Join channel/room
    socket.on('room:join', async (data: { channelId: string; roomType?: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'room:join')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many room joins');
          return;
        }

        const { channelId, roomType = 'channel' } = data;

        // Check permissions
        const canView = await this.checkChannelPermissions(socket.userId, channelId, 'view_channel');
        if (!canView) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to view this channel');
          return;
        }

        // Join socket room
        await socket.join(`channel:${channelId}`);
        
        // Track room membership
        this.addUserToRoom(socket.userId, channelId, socket.username);
        
        // Update presence in Redis
        await this.redis.sadd(`channel:${channelId}:presence`, socket.userId);
        
        // Notify channel of user joining
        socket.to(`channel:${channelId}`).emit('room:user_joined', {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          channelId,
          joinedAt: new Date()
        });

        // Send recent messages to newly joined user
        const recentMessages = await this.getRecentMessages(channelId, 50);
        socket.emit('room:messages_sync', {
          channelId,
          messages: recentMessages
        });

        this.metrics.roomJoins++;

        if (callback) {
          callback({
            success: true,
            channelId,
            memberCount: this.getRoomMemberCount(channelId)
          });
        }

        this.fastify.log.info(`📨 User ${socket.username} joined channel ${channelId}`);

      } catch (error) {
        this.fastify.log.error('Room join error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to join room');
      }
    });

    // Leave channel/room
    socket.on('room:leave', async (data: { channelId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'room:leave')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many room leaves');
          return;
        }

        const { channelId } = data;

        // Leave socket room
        await socket.leave(`channel:${channelId}`);
        
        // Remove from tracking
        this.removeUserFromRoom(socket.userId, channelId);
        
        // Update presence in Redis
        await this.redis.srem(`channel:${channelId}:presence`, socket.userId);
        
        // Notify channel of user leaving
        socket.to(`channel:${channelId}`).emit('room:user_left', {
          userId: socket.userId,
          username: socket.username,
          channelId,
          leftAt: new Date()
        });

        this.metrics.roomLeaves++;

        if (callback) callback({ success: true });

        this.fastify.log.info(`📨 User ${socket.username} left channel ${channelId}`);

      } catch (error) {
        this.fastify.log.error('Room leave error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to leave room');
      }
    });

    // Get room members
    socket.on('room:get_members', async (data: { channelId: string }, callback?: Function) => {
      try {
        const { channelId } = data;

        // Check permissions
        const canView = await this.checkChannelPermissions(socket.userId, channelId, 'view_channel');
        if (!canView) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to view channel members');
          return;
        }

        const members = await this.getRoomMembers(channelId);

        if (callback) {
          callback({
            success: true,
            members,
            count: members.length
          });
        }

      } catch (error) {
        this.fastify.log.error('Get room members error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get room members');
      }
    });
  }

  /**
   * PRESENCE TRACKING
   */
  private setupPresenceEvents(socket: Socket & any) {
    // Update presence status
    socket.on('presence:update', async (data: { status: string; customStatus?: string; activity?: any }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'presence:update')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many presence updates');
          return;
        }

        const { status, customStatus, activity } = data;

        // Validate status
        const validStatuses = ['online', 'idle', 'dnd', 'offline'];
        if (!validStatuses.includes(status)) {
          this.sendError(callback, 'INVALID_STATUS', 'Invalid presence status');
          return;
        }

        const presence: PresenceData = {
          userId: socket.userId,
          status: status as any,
          isOnline: status !== 'offline',
          lastSeen: new Date(),
          customStatus,
          activity
        };

        // Update local presence map
        this.presenceMap.set(socket.userId, presence);

        // Store in Redis
        await this.redis.setex(
          `presence:${socket.userId}`,
          3600, // 1 hour
          JSON.stringify(presence)
        );

        // Update database
        await prisma.user.update({
          where: { id: socket.userId },
          data: {
            status,
            customStatus,
            lastSeenAt: new Date()
          }
        });

        // Broadcast to user's rooms
        const userRooms = this.userRoomsMap.get(socket.userId) || new Set();
        userRooms.forEach(channelId => {
          socket.to(`channel:${channelId}`).emit('presence:user_update', {
            userId: socket.userId,
            username: socket.username,
            status,
            customStatus,
            activity,
            timestamp: new Date()
          });
        });

        this.metrics.presenceUpdates++;

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Presence update error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to update presence');
      }
    });

    // Get user presence
    socket.on('presence:get', async (data: { userIds: string[] }, callback?: Function) => {
      try {
        const { userIds } = data;
        const presences: PresenceData[] = [];

        for (const userId of userIds) {
          let presence = this.presenceMap.get(userId);
          
          if (!presence) {
            // Try Redis
            const redisPresence = await this.redis.get(`presence:${userId}`);
            if (redisPresence) {
              presence = JSON.parse(redisPresence);
              this.presenceMap.set(userId, presence);
            } else {
              // Fallback to database
              const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { status: true, customStatus: true, lastSeenAt: true }
              });

              if (user) {
                presence = {
                  userId,
                  status: (user.status as any) || 'offline',
                  isOnline: user.status !== 'offline',
                  lastSeen: user.lastSeenAt || new Date(),
                  customStatus: user.customStatus
                };
              }
            }
          }

          if (presence) {
            presences.push(presence);
          }
        }

        if (callback) {
          callback({
            success: true,
            presences
          });
        }

      } catch (error) {
        this.fastify.log.error('Get presence error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get presence');
      }
    });
  }

  /**
   * MESSAGE HISTORY SYNC
   */
  private setupHistoryEvents(socket: Socket & any) {
    socket.on('message:history', async (data: { channelId: string; before?: string; limit?: number }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'message:history')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many history requests');
          return;
        }

        const { channelId, before, limit = 50 } = data;

        // Check permissions
        const canView = await this.checkChannelPermissions(socket.userId, channelId, 'view_channel');
        if (!canView) {
          this.sendError(callback, 'NO_PERMISSION', 'No permission to view channel history');
          return;
        }

        const messages = await this.getMessageHistory(channelId, before, Math.min(limit, 100));

        this.metrics.historyRequests++;

        if (callback) {
          callback({
            success: true,
            messages,
            hasMore: messages.length === Math.min(limit, 100)
          });
        }

      } catch (error) {
        this.fastify.log.error('Message history error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get message history');
      }
    });
  }

  /**
   * NOTIFICATIONS
   */
  private setupNotificationEvents(socket: Socket & any) {
    // Get notifications
    socket.on('notifications:get', async (data: { limit?: number; unreadOnly?: boolean }, callback?: Function) => {
      try {
        const { limit = 20, unreadOnly = false } = data;

        const notifications = await this.getUserNotifications(socket.userId, limit, unreadOnly);

        if (callback) {
          callback({
            success: true,
            notifications,
            unreadCount: await this.getUnreadNotificationCount(socket.userId)
          });
        }

      } catch (error) {
        this.fastify.log.error('Get notifications error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to get notifications');
      }
    });

    // Mark notification as read
    socket.on('notification:mark_read', async (data: { notificationId: string }, callback?: Function) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'notification:mark_read')) {
          this.sendError(callback, 'RATE_LIMIT_EXCEEDED', 'Too many mark read requests');
          return;
        }

        await this.markNotificationAsRead(data.notificationId, socket.userId);

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Mark notification read error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to mark notification as read');
      }
    });

    // Mark all notifications as read
    socket.on('notifications:mark_all_read', async (callback?: Function) => {
      try {
        await this.markAllNotificationsAsRead(socket.userId);

        if (callback) callback({ success: true });

      } catch (error) {
        this.fastify.log.error('Mark all notifications read error:', error);
        this.sendError(callback, 'INTERNAL_ERROR', 'Failed to mark all notifications as read');
      }
    });
  }

  /**
   * UTILITY EVENTS
   */
  private setupUtilityEvents(socket: Socket & any) {
    // Ping/Pong with metrics
    socket.on('ping', (data?: any, callback?: Function) => {
      try {
        const timestamp = Date.now();
        
        if (callback) {
          callback({
            success: true,
            timestamp,
            serverTime: new Date(),
            latency: data?.clientTime ? timestamp - data.clientTime : null
          });
        } else {
          socket.emit('pong', {
            timestamp,
            serverTime: new Date()
          });
        }

      } catch (error) {
        this.fastify.log.error('Ping handler error:', error);
      }
    });

    // Get system metrics
    socket.on('system:metrics', (callback?: Function) => {
      try {
        if (callback) {
          callback({
            success: true,
            metrics: this.metrics,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.fastify.log.error('System metrics error:', error);
      }
    });
  }

  /**
   * CONNECTION CLEANUP
   */
  private setupConnectionCleanup(socket: Socket & any) {
    // Set user as online when connected
    this.setUserOnline(socket.userId, socket.username);

    // Handle disconnect
    socket.on('disconnect', (reason: string) => {
      this.handleUserDisconnect(socket, reason);
    });
  }

  // === HELPER METHODS ===

  private async validateMessageData(data: Partial<MessageData>, socket: Socket & any): Promise<MessageData | null> {
    try {
      if (!data.content || !data.channelId) return null;
      
      // Sanitize content
      const content = data.content.trim();
      if (content.length === 0 || content.length > 2000) return null;

      // Extract mentions
      const mentions = content.match(/<@(\w+)>/g)?.map(m => m.slice(2, -1)) || [];

      return {
        content,
        channelId: data.channelId,
        userId: socket.userId,
        username: socket.username,
        displayName: socket.displayName,
        avatar: socket.avatar,
        type: data.type || 'text',
        replyTo: data.replyTo,
        mentions,
        attachments: data.attachments || [],
        timestamp: new Date()
      };
    } catch (error) {
      this.fastify.log.error('Message validation error:', error);
      return null;
    }
  }

  private async createMessage(data: MessageData): Promise<MessageData | null> {
    try {
      const message = await prisma.message.create({
        data: {
          content: data.content,
          channelId: data.channelId,
          userId: data.userId,
          type: data.type,
          replyToId: data.replyTo,
          attachments: data.attachments || []
        },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              avatar: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  username: true,
                  displayName: true
                }
              }
            }
          }
        }
      });

      return {
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        userId: message.userId,
        username: message.user.username,
        displayName: message.user.displayName || message.user.username,
        avatar: message.user.avatar,
        type: message.type as any,
        replyTo: message.replyToId,
        mentions: data.mentions,
        attachments: message.attachments as any,
        timestamp: message.createdAt
      };
    } catch (error) {
      this.fastify.log.error('Create message error:', error);
      return null;
    }
  }

  private async broadcastMessage(message: MessageData) {
    try {
      // Broadcast to channel
      this.io.to(`channel:${message.channelId}`).emit('message:new', message);
      
      // Publish to Redis for cross-server sync
      await this.redis.publish('message:broadcast', JSON.stringify(message));
      
      this.metrics.messagesDelivered++;
    } catch (error) {
      this.fastify.log.error('Broadcast message error:', error);
    }
  }

  private async createMentionNotifications(message: MessageData) {
    try {
      if (!message.mentions || message.mentions.length === 0) return;

      for (const mentionedUserId of message.mentions) {
        if (mentionedUserId === message.userId) continue; // Don't notify self

        const notification: NotificationData = {
          id: `mention_${message.id}_${mentionedUserId}`,
          type: 'mention',
          title: `New mention from ${message.displayName}`,
          content: message.content,
          channelId: message.channelId,
          senderId: message.userId,
          targetUserId: mentionedUserId,
          timestamp: new Date(),
          read: false,
          data: {
            messageId: message.id
          }
        };

        // Save to database
        await prisma.notification.create({
          data: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            channelId: notification.channelId,
            senderId: notification.senderId,
            userId: notification.targetUserId,
            data: notification.data,
            read: false
          }
        });

        // Send real-time notification
        this.io.to(`user:${mentionedUserId}`).emit('notification:new', notification);
        
        this.metrics.notificationsSent++;
      }
    } catch (error) {
      this.fastify.log.error('Create mention notifications error:', error);
    }
  }

  private async editMessage(messageId: string, content: string, userId: string) {
    try {
      // Verify ownership
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          userId: userId
        }
      });

      if (!message) return null;

      // Update message
      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          edited: true,
          editedAt: new Date()
        },
        include: {
          user: {
            select: {
              username: true,
              displayName: true
            }
          }
        }
      });

      return updated;
    } catch (error) {
      this.fastify.log.error('Edit message error:', error);
      return null;
    }
  }

  private async deleteMessage(messageId: string, userId: string) {
    try {
      // Verify ownership
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          userId: userId
        }
      });

      if (!message) return null;

      // Soft delete
      await prisma.message.update({
        where: { id: messageId },
        data: {
          deleted: true,
          deletedAt: new Date()
        }
      });

      return { channelId: message.channelId };
    } catch (error) {
      this.fastify.log.error('Delete message error:', error);
      return null;
    }
  }

  private async stopTyping(userId: string, channelId: string) {
    try {
      const typingKey = `${userId}:${channelId}`;
      const typing = this.typingMap.get(typingKey);
      
      if (typing) {
        if (typing.timeout) {
          clearTimeout(typing.timeout);
        }
        this.typingMap.delete(typingKey);

        // Broadcast stop typing
        this.io.to(`channel:${channelId}`).emit('typing:user_stop', {
          userId,
          channelId
        });

        // Remove from Redis
        await this.redis.del(`typing:${channelId}:${userId}`);
      }
    } catch (error) {
      this.fastify.log.error('Stop typing error:', error);
    }
  }

  private async checkChannelPermissions(userId: string, channelId: string, permission: string): Promise<boolean> {
    try {
      // TODO: Implement proper permission checking
      // For now, allow all operations
      return true;
    } catch (error) {
      this.fastify.log.error('Check permissions error:', error);
      return false;
    }
  }

  private checkRateLimit(userId: string, eventType: string): boolean {
    try {
      const config = RATE_LIMITS[eventType];
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
        this.metrics.messagesRejected++;
        return false;
      }
      
      userLimit.count++;
      return true;
    } catch (error) {
      this.fastify.log.error('Rate limit check error:', error);
      return false;
    }
  }

  private addUserToRoom(userId: string, channelId: string, username: string) {
    if (!this.roomMembersMap.has(channelId)) {
      this.roomMembersMap.set(channelId, new Set());
    }
    
    const members = this.roomMembersMap.get(channelId)!;
    members.add({
      userId,
      username,
      joinedAt: new Date(),
      lastSeen: new Date()
    });

    if (!this.userRoomsMap.has(userId)) {
      this.userRoomsMap.set(userId, new Set());
    }
    
    this.userRoomsMap.get(userId)!.add(channelId);
  }

  private removeUserFromRoom(userId: string, channelId: string) {
    const members = this.roomMembersMap.get(channelId);
    if (members) {
      // Find and remove the member
      for (const member of members) {
        if (member.userId === userId) {
          members.delete(member);
          break;
        }
      }
    }

    const userRooms = this.userRoomsMap.get(userId);
    if (userRooms) {
      userRooms.delete(channelId);
    }
  }

  private getRoomMemberCount(channelId: string): number {
    return this.roomMembersMap.get(channelId)?.size || 0;
  }

  private async getRoomMembers(channelId: string): Promise<RoomMember[]> {
    const members = this.roomMembersMap.get(channelId);
    if (!members) return [];
    
    return Array.from(members);
  }

  private async getRecentMessages(channelId: string, limit: number): Promise<MessageData[]> {
    try {
      const messages = await prisma.message.findMany({
        where: {
          channelId,
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
          replyTo: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  username: true,
                  displayName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return messages.reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        channelId: msg.channelId,
        userId: msg.userId,
        username: msg.user.username,
        displayName: msg.user.displayName || msg.user.username,
        avatar: msg.user.avatar,
        type: msg.type as any,
        replyTo: msg.replyToId,
        mentions: [], // TODO: Extract from content
        attachments: msg.attachments as any,
        timestamp: msg.createdAt,
        edited: msg.edited,
        editedAt: msg.editedAt
      }));
    } catch (error) {
      this.fastify.log.error('Get recent messages error:', error);
      return [];
    }
  }

  private async getMessageHistory(channelId: string, before?: string, limit: number = 50): Promise<MessageData[]> {
    try {
      const whereClause: any = {
        channelId,
        deleted: false
      };

      if (before) {
        whereClause.createdAt = {
          lt: new Date(before)
        };
      }

      const messages = await prisma.message.findMany({
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
        take: limit
      });

      return messages.reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        channelId: msg.channelId,
        userId: msg.userId,
        username: msg.user.username,
        displayName: msg.user.displayName || msg.user.username,
        avatar: msg.user.avatar,
        type: msg.type as any,
        replyTo: msg.replyToId,
        mentions: [],
        attachments: msg.attachments as any,
        timestamp: msg.createdAt,
        edited: msg.edited,
        editedAt: msg.editedAt
      }));
    } catch (error) {
      this.fastify.log.error('Get message history error:', error);
      return [];
    }
  }

  private setUserOnline(userId: string, username: string) {
    const presence: PresenceData = {
      userId,
      status: 'online',
      isOnline: true,
      lastSeen: new Date()
    };

    this.presenceMap.set(userId, presence);
    
    // Store in Redis
    this.redis.setex(`presence:${userId}`, 3600, JSON.stringify(presence));

    // Update database
    prisma.user.update({
      where: { id: userId },
      data: {
        status: 'online',
        lastSeenAt: new Date()
      }
    }).catch(error => {
      this.fastify.log.error('Set user online error:', error);
    });
  }

  private handleUserDisconnect(socket: Socket & any, reason: string) {
    this.fastify.log.info(`📨 User ${socket.username} disconnected: ${reason}`);

    // Set offline
    const presence: PresenceData = {
      userId: socket.userId,
      status: 'offline',
      isOnline: false,
      lastSeen: new Date()
    };

    this.presenceMap.set(socket.userId, presence);

    // Clean up typing indicators
    const typingToRemove: string[] = [];
    this.typingMap.forEach((typing, key) => {
      if (typing.userId === socket.userId) {
        if (typing.timeout) clearTimeout(typing.timeout);
        typingToRemove.push(key);
        
        // Notify channels
        this.io.to(`channel:${typing.channelId}`).emit('typing:user_stop', {
          userId: socket.userId,
          channelId: typing.channelId
        });
      }
    });
    typingToRemove.forEach(key => this.typingMap.delete(key));

    // Clean up room memberships
    const userRooms = this.userRoomsMap.get(socket.userId) || new Set();
    userRooms.forEach(channelId => {
      this.removeUserFromRoom(socket.userId, channelId);
      
      // Notify room of user leaving
      this.io.to(`channel:${channelId}`).emit('room:user_left', {
        userId: socket.userId,
        username: socket.username,
        channelId,
        leftAt: new Date()
      });
    });

    // Broadcast presence update
    userRooms.forEach(channelId => {
      socket.to(`channel:${channelId}`).emit('presence:user_update', {
        userId: socket.userId,
        username: socket.username,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Update database
    prisma.user.update({
      where: { id: socket.userId },
      data: {
        status: 'offline',
        lastSeenAt: new Date()
      }
    }).catch(error => {
      this.fastify.log.error('Set user offline error:', error);
    });
  }

  private async getUserNotifications(userId: string, limit: number, unreadOnly: boolean): Promise<NotificationData[]> {
    try {
      const where: any = { userId };
      if (unreadOnly) {
        where.read = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        include: {
          sender: {
            select: {
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      return notifications.map(n => ({
        id: n.id,
        type: n.type as any,
        title: n.title,
        content: n.content,
        channelId: n.channelId,
        senderId: n.senderId,
        targetUserId: n.userId,
        timestamp: n.createdAt,
        read: n.read,
        data: n.data as any
      }));
    } catch (error) {
      this.fastify.log.error('Get user notifications error:', error);
      return [];
    }
  }

  private async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });
    } catch (error) {
      this.fastify.log.error('Get unread notification count error:', error);
      return 0;
    }
  }

  private async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      this.fastify.log.error('Mark notification as read error:', error);
    }
  }

  private async markAllNotificationsAsRead(userId: string) {
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
    } catch (error) {
      this.fastify.log.error('Mark all notifications as read error:', error);
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

  private setupRedisSubscriptions() {
    // Subscribe to cross-server message broadcasts
    this.redis.subscribe('message:broadcast', 'typing:broadcast', 'presence:broadcast');
    
    this.redis.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        
        switch (channel) {
          case 'message:broadcast':
            // Re-broadcast to local clients
            this.io.to(`channel:${data.channelId}`).emit('message:new', data);
            break;
          case 'typing:broadcast':
            this.io.to(`channel:${data.channelId}`).emit('typing:user_start', data);
            break;
          case 'presence:broadcast':
            // Broadcast presence updates
            this.io.emit('presence:user_update', data);
            break;
        }
      } catch (error) {
        this.fastify.log.error('Redis message handling error:', error);
      }
    });

    this.fastify.log.info('📨 Redis subscriptions setup');
  }

  private setupCleanupIntervals() {
    // Clean up expired typing indicators every 30 seconds
    const typingCleanup = setInterval(() => {
      const now = Date.now();
      const toRemove: string[] = [];
      
      this.typingMap.forEach((typing, key) => {
        const age = now - typing.startedAt.getTime();
        if (age > 15000) { // 15 seconds
          if (typing.timeout) clearTimeout(typing.timeout);
          toRemove.push(key);
        }
      });
      
      toRemove.forEach(key => this.typingMap.delete(key));
    }, 30000);

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

    this.cleanupIntervals.push(typingCleanup, rateLimitCleanup);

    this.fastify.log.info('📨 Cleanup intervals setup');
  }

  public getMetrics() {
    return { ...this.metrics };
  }

  public async close() {
    // Clear intervals
    this.cleanupIntervals.forEach(interval => clearInterval(interval));
    
    // Clear all typing timeouts
    this.typingMap.forEach(typing => {
      if (typing.timeout) clearTimeout(typing.timeout);
    });
    
    this.fastify.log.info('📨 Realtime Messaging System closed');
  }
}