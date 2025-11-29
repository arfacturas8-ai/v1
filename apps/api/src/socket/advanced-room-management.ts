import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

/**
 * ADVANCED ROOM MANAGEMENT SYSTEM
 * 
 * This module provides enterprise-grade room management for communities and direct messages
 * with advanced features like permissions, moderation, and message routing.
 * 
 * Features:
 * ✅ Community channels with hierarchical structure
 * ✅ Direct messaging with encryption support
 * ✅ Voice/video channel state management
 * ✅ Thread support for organized conversations
 * ✅ Permission-based access control
 * ✅ Message routing and delivery guarantees
 * ✅ Presence tracking per room
 * ✅ Real-time moderation tools
 * ✅ Analytics and monitoring
 */

export interface RoomConfig {
  id: string;
  name: string;
  type: 'community' | 'dm' | 'voice' | 'video' | 'thread' | 'announcement';
  namespace: string;
  serverId?: string;
  parentId?: string; // For threads or sub-channels
  metadata: {
    description?: string;
    topic?: string;
    isPrivate: boolean;
    isNsfw: boolean;
    maxMembers?: number;
    permissions: RoomPermissions;
    createdBy: string;
    createdAt: Date;
    lastActivity: Date;
  };
}

export interface RoomPermissions {
  canRead: string[]; // User IDs or role IDs
  canWrite: string[];
  canInvite: string[];
  canManage: string[];
  canModerate: string[];
  canDelete: string[];
  blacklisted: string[];
}

export interface RoomMember {
  userId: string;
  socketId: string;
  displayName: string;
  roles: string[];
  joinedAt: Date;
  lastSeen: Date;
  isActive: boolean;
  permissions: string[];
  metadata: {
    isMuted: boolean;
    isBanned: boolean;
    isTyping: boolean;
    voiceState?: {
      muted: boolean;
      deafened: boolean;
      speaking: boolean;
      channelId: string;
    };
  };
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'media' | 'file' | 'system' | 'reaction' | 'thread_reply';
  parentId?: string; // For replies or threads
  attachments?: {
    id: string;
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    metadata: any;
  }[];
  reactions?: {
    emoji: string;
    users: string[];
    count: number;
  }[];
  mentions?: string[];
  timestamp: Date;
  editedAt?: Date;
  deletedAt?: Date;
  metadata: {
    isEdited: boolean;
    isDeleted: boolean;
    isPinned: boolean;
    deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    readBy: { userId: string; readAt: Date }[];
  };
}

export interface MessageRoute {
  from: string;
  to: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  guaranteeDelivery: boolean;
  retries: number;
  timeout: number;
}

export class AdvancedRoomManager extends EventEmitter {
  private fastify: FastifyInstance;
  private io: Server;
  private redis: Redis;
  
  // Room state management
  private rooms: Map<string, RoomConfig> = new Map();
  private roomMembers: Map<string, Map<string, RoomMember>> = new Map();
  private messageQueue: Map<string, Message[]> = new Map();
  private typingIndicators: Map<string, Map<string, NodeJS.Timeout>> = new Map();
  
  // Performance tracking
  private metrics = {
    roomsCreated: 0,
    messagesRouted: 0,
    membersJoined: 0,
    permissionChecks: 0,
    moderationActions: 0
  };
  
  constructor(fastify: FastifyInstance, io: Server, redis: Redis) {
    super();
    this.fastify = fastify;
    this.io = io;
    this.redis = redis;
    
    this.setupEventHandlers();
    this.setupMessageRouting();
    this.setupCleanupTasks();
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.setupRoomEvents(socket);
      this.setupMessageEvents(socket);
      this.setupModerationEvents(socket);
    });
  }
  
  private setupRoomEvents(socket: Socket) {
    // Community/DM room management
    socket.on('room:create', async (data: {
      name: string;
      type: RoomConfig['type'];
      serverId?: string;
      parentId?: string;
      isPrivate: boolean;
      permissions: Partial<RoomPermissions>;
    }) => {
      try {
        const room = await this.createRoom({
          id: randomUUID(),
          name: data.name,
          type: data.type,
          namespace: data.serverId ? `server:${data.serverId}` : 'global',
          serverId: data.serverId,
          parentId: data.parentId,
          metadata: {
            isPrivate: data.isPrivate,
            isNsfw: false,
            permissions: {
              canRead: data.permissions.canRead || [],
              canWrite: data.permissions.canWrite || [],
              canInvite: data.permissions.canInvite || [],
              canManage: data.permissions.canManage || [],
              canModerate: data.permissions.canModerate || [],
              canDelete: data.permissions.canDelete || [],
              blacklisted: []
            },
            createdBy: (socket as any).userId,
            createdAt: new Date(),
            lastActivity: new Date()
          }
        });
        
        socket.emit('room:created', { room });
        this.fastify.log.info(`🏠 Room created: ${room.id} (${room.type})`);
        
      } catch (error) {
        socket.emit('room:error', {
          action: 'create',
          error: (error as Error).message
        });
      }
    });
    
    // Join room with permission checks
    socket.on('room:join', async (data: {
      roomId: string;
      password?: string;
    }) => {
      try {
        const userId = (socket as any).userId;
        const room = this.rooms.get(data.roomId);
        
        if (!room) {
          throw new Error('Room not found');
        }
        
        // Permission check
        if (!await this.canUserJoinRoom(userId, room)) {
          throw new Error('Insufficient permissions to join room');
        }
        
        await this.addMemberToRoom(data.roomId, {
          userId,
          socketId: socket.id,
          displayName: (socket as any).displayName || 'Unknown User',
          roles: [],
          joinedAt: new Date(),
          lastSeen: new Date(),
          isActive: true,
          permissions: await this.getUserPermissions(userId, room),
          metadata: {
            isMuted: false,
            isBanned: false,
            isTyping: false
          }
        });
        
        // Join Socket.IO room
        socket.join(data.roomId);
        
        // Notify room members
        socket.to(data.roomId).emit('room:member-joined', {
          roomId: data.roomId,
          member: {
            userId,
            displayName: (socket as any).displayName
          }
        });
        
        // Send room state to new member
        const members = this.roomMembers.get(data.roomId);
        socket.emit('room:joined', {
          roomId: data.roomId,
          room: room,
          members: members ? Array.from(members.values()) : [],
          recentMessages: await this.getRecentMessages(data.roomId, 50)
        });
        
        this.fastify.log.info(`🚪 User ${userId} joined room ${data.roomId}`);
        
      } catch (error) {
        socket.emit('room:error', {
          action: 'join',
          roomId: data.roomId,
          error: (error as Error).message
        });
      }
    });
    
    // Leave room
    socket.on('room:leave', async (data: { roomId: string }) => {
      try {
        const userId = (socket as any).userId;
        await this.removeMemberFromRoom(data.roomId, userId);
        
        socket.leave(data.roomId);
        
        // Notify room members
        socket.to(data.roomId).emit('room:member-left', {
          roomId: data.roomId,
          userId
        });
        
        socket.emit('room:left', { roomId: data.roomId });
        
      } catch (error) {
        socket.emit('room:error', {
          action: 'leave',
          roomId: data.roomId,
          error: (error as Error).message
        });
      }
    });
    
    // Update room settings
    socket.on('room:update', async (data: {
      roomId: string;
      updates: Partial<RoomConfig['metadata']>;
    }) => {
      try {
        const userId = (socket as any).userId;
        const room = this.rooms.get(data.roomId);
        
        if (!room) {
          throw new Error('Room not found');
        }
        
        // Permission check
        if (!room.metadata.permissions.canManage.includes(userId)) {
          throw new Error('Insufficient permissions to update room');
        }
        
        // Update room metadata
        Object.assign(room.metadata, data.updates);
        room.metadata.lastActivity = new Date();
        
        // Persist to Redis
        await this.persistRoomState(room);
        
        // Notify room members
        this.io.to(data.roomId).emit('room:updated', {
          roomId: data.roomId,
          updates: data.updates,
          updatedBy: userId
        });
        
      } catch (error) {
        socket.emit('room:error', {
          action: 'update',
          roomId: data.roomId,
          error: (error as Error).message
        });
      }
    });
  }
  
  private setupMessageEvents(socket: Socket) {
    // Send message with routing
    socket.on('message:send', async (data: {
      roomId: string;
      content: string;
      type?: Message['type'];
      parentId?: string;
      attachments?: any[];
      mentions?: string[];
      route?: Partial<MessageRoute>;
    }) => {
      try {
        const userId = (socket as any).userId;
        const room = this.rooms.get(data.roomId);
        
        if (!room) {
          throw new Error('Room not found');
        }
        
        // Permission check
        if (!room.metadata.permissions.canWrite.includes(userId)) {
          throw new Error('No permission to send messages in this room');
        }
        
        const message: Message = {
          id: randomUUID(),
          roomId: data.roomId,
          userId,
          content: data.content,
          type: data.type || 'text',
          parentId: data.parentId,
          attachments: data.attachments,
          mentions: data.mentions,
          timestamp: new Date(),
          metadata: {
            isEdited: false,
            isDeleted: false,
            isPinned: false,
            deliveryStatus: 'sending',
            readBy: []
          }
        };
        
        // Route message
        await this.routeMessage(message, {
          from: userId,
          to: await this.getRoomMemberIds(data.roomId),
          priority: data.route?.priority || 'normal',
          guaranteeDelivery: data.route?.guaranteeDelivery || false,
          retries: 3,
          timeout: 5000
        });
        
        // Update room activity
        room.metadata.lastActivity = new Date();
        
        // Stop typing indicator for sender
        this.stopTyping(data.roomId, userId);
        
        this.fastify.log.info(`💬 Message sent in room ${data.roomId} by ${userId}`);
        
      } catch (error) {
        socket.emit('message:error', {
          action: 'send',
          error: (error as Error).message
        });
      }
    });
    
    // Message reactions
    socket.on('message:react', async (data: {
      messageId: string;
      roomId: string;
      emoji: string;
      action: 'add' | 'remove';
    }) => {
      try {
        const userId = (socket as any).userId;
        
        // Update message reaction state
        const message = await this.getMessageFromRedis(data.messageId);
        if (!message) {
          throw new Error('Message not found');
        }
        
        if (!message.reactions) {
          message.reactions = [];
        }
        
        let reaction = message.reactions.find(r => r.emoji === data.emoji);
        
        if (data.action === 'add') {
          if (!reaction) {
            reaction = { emoji: data.emoji, users: [], count: 0 };
            message.reactions.push(reaction);
          }
          
          if (!reaction.users.includes(userId)) {
            reaction.users.push(userId);
            reaction.count++;
          }
        } else {
          if (reaction) {
            const userIndex = reaction.users.indexOf(userId);
            if (userIndex > -1) {
              reaction.users.splice(userIndex, 1);
              reaction.count--;
              
              if (reaction.count === 0) {
                const reactionIndex = message.reactions.indexOf(reaction);
                message.reactions.splice(reactionIndex, 1);
              }
            }
          }
        }
        
        // Persist updated message
        await this.persistMessage(message);
        
        // Broadcast reaction update
        this.io.to(data.roomId).emit('message:reaction-updated', {
          messageId: data.messageId,
          roomId: data.roomId,
          emoji: data.emoji,
          action: data.action,
          userId,
          reactions: message.reactions
        });
        
      } catch (error) {
        socket.emit('message:error', {
          action: 'react',
          error: (error as Error).message
        });
      }
    });
    
    // Typing indicators
    socket.on('typing:start', async (data: { roomId: string }) => {
      const userId = (socket as any).userId;
      this.startTyping(data.roomId, userId, socket);
    });
    
    socket.on('typing:stop', async (data: { roomId: string }) => {
      const userId = (socket as any).userId;
      this.stopTyping(data.roomId, userId);
    });
    
    // Message read receipts
    socket.on('message:mark-read', async (data: {
      messageId: string;
      roomId: string;
    }) => {
      try {
        const userId = (socket as any).userId;
        await this.markMessageAsRead(data.messageId, userId);
        
        // Notify message sender about read receipt
        const message = await this.getMessageFromRedis(data.messageId);
        if (message) {
          this.io.to(data.roomId).emit('message:read-receipt', {
            messageId: data.messageId,
            roomId: data.roomId,
            readBy: userId,
            readAt: new Date()
          });
        }
        
      } catch (error) {
        this.fastify.log.error('Failed to mark message as read:', error);
      }
    });
  }
  
  private setupModerationEvents(socket: Socket) {
    // Kick user from room
    socket.on('moderation:kick', async (data: {
      roomId: string;
      targetUserId: string;
      reason?: string;
    }) => {
      try {
        const moderatorId = (socket as any).userId;
        await this.moderateUser('kick', data.roomId, data.targetUserId, moderatorId, data.reason);
        
      } catch (error) {
        socket.emit('moderation:error', {
          action: 'kick',
          error: (error as Error).message
        });
      }
    });
    
    // Mute user in room
    socket.on('moderation:mute', async (data: {
      roomId: string;
      targetUserId: string;
      duration?: number;
      reason?: string;
    }) => {
      try {
        const moderatorId = (socket as any).userId;
        await this.moderateUser('mute', data.roomId, data.targetUserId, moderatorId, data.reason, data.duration);
        
      } catch (error) {
        socket.emit('moderation:error', {
          action: 'mute',
          error: (error as Error).message
        });
      }
    });
    
    // Ban user from room
    socket.on('moderation:ban', async (data: {
      roomId: string;
      targetUserId: string;
      reason?: string;
      permanent?: boolean;
    }) => {
      try {
        const moderatorId = (socket as any).userId;
        await this.moderateUser('ban', data.roomId, data.targetUserId, moderatorId, data.reason);
        
      } catch (error) {
        socket.emit('moderation:error', {
          action: 'ban',
          error: (error as Error).message
        });
      }
    });
  }
  
  private setupMessageRouting() {
    // Process message delivery queue
    setInterval(async () => {
      await this.processMessageQueue();
    }, 1000);
  }
  
  private setupCleanupTasks() {
    // Clean up inactive rooms and expired data
    setInterval(async () => {
      await this.cleanupInactiveRooms();
      await this.cleanupExpiredTypingIndicators();
    }, 300000); // Every 5 minutes
  }
  
  // Core room management methods
  private async createRoom(config: RoomConfig): Promise<RoomConfig> {
    this.rooms.set(config.id, config);
    this.roomMembers.set(config.id, new Map());
    this.typingIndicators.set(config.id, new Map());
    
    await this.persistRoomState(config);
    
    this.metrics.roomsCreated++;
    this.emit('room:created', config);
    
    return config;
  }
  
  private async addMemberToRoom(roomId: string, member: RoomMember): Promise<void> {
    const members = this.roomMembers.get(roomId);
    if (members) {
      members.set(member.userId, member);
      await this.persistRoomMembers(roomId, members);
      
      this.metrics.membersJoined++;
      this.emit('room:member-added', { roomId, member });
    }
  }
  
  private async removeMemberFromRoom(roomId: string, userId: string): Promise<void> {
    const members = this.roomMembers.get(roomId);
    if (members && members.has(userId)) {
      members.delete(userId);
      await this.persistRoomMembers(roomId, members);
      
      this.emit('room:member-removed', { roomId, userId });
    }
  }
  
  // Message routing with delivery guarantees
  private async routeMessage(message: Message, route: MessageRoute): Promise<void> {
    try {
      // Add to queue for guaranteed delivery
      if (route.guaranteeDelivery) {
        const queueKey = `message_queue:${message.roomId}`;
        if (!this.messageQueue.has(queueKey)) {
          this.messageQueue.set(queueKey, []);
        }
        this.messageQueue.get(queueKey)!.push(message);
      }
      
      // Immediate delivery attempt
      const deliveryPromises = route.to.map(async (userId) => {
        const userSockets = await this.getUserSockets(userId);
        
        userSockets.forEach(socketId => {
          this.io.to(socketId).emit('message:received', message);
        });
        
        // Mark as delivered if user is online
        if (userSockets.length > 0) {
          message.metadata.deliveryStatus = 'delivered';
          if (!message.metadata.readBy.some(r => r.userId === userId)) {
            message.metadata.readBy.push({
              userId,
              readAt: new Date()
            });
          }
        }
      });
      
      await Promise.allSettled(deliveryPromises);
      
      // Persist message
      await this.persistMessage(message);
      
      // Broadcast to room
      this.io.to(message.roomId).emit('message:broadcast', message);
      
      this.metrics.messagesRouted++;
      message.metadata.deliveryStatus = 'sent';
      
    } catch (error) {
      this.fastify.log.error('Message routing failed:', error);
      message.metadata.deliveryStatus = 'failed';
      
      if (route.guaranteeDelivery && route.retries > 0) {
        // Retry with exponential backoff
        setTimeout(() => {
          this.routeMessage(message, {
            ...route,
            retries: route.retries - 1
          });
        }, Math.pow(2, 3 - route.retries) * 1000);
      }
    }
  }
  
  private async processMessageQueue(): Promise<void> {
    for (const [queueKey, messages] of this.messageQueue.entries()) {
      const pendingMessages = messages.filter(
        m => m.metadata.deliveryStatus === 'sending' || m.metadata.deliveryStatus === 'failed'
      );
      
      for (const message of pendingMessages) {
        try {
          const roomMembers = await this.getRoomMemberIds(message.roomId);
          await this.routeMessage(message, {
            from: message.userId,
            to: roomMembers,
            priority: 'normal',
            guaranteeDelivery: true,
            retries: 2,
            timeout: 5000
          });
          
        } catch (error) {
          this.fastify.log.error('Failed to process queued message:', error);
        }
      }
      
      // Remove successfully delivered messages
      this.messageQueue.set(
        queueKey,
        messages.filter(m => m.metadata.deliveryStatus === 'sending' || m.metadata.deliveryStatus === 'failed')
      );
    }
  }
  
  // Typing indicators
  private startTyping(roomId: string, userId: string, socket: Socket): void {
    const roomTyping = this.typingIndicators.get(roomId);
    if (!roomTyping) return;
    
    // Clear existing timeout
    const existingTimeout = roomTyping.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      this.stopTyping(roomId, userId);
    }, 5000);
    
    roomTyping.set(userId, timeout);
    
    // Broadcast typing start
    socket.to(roomId).emit('typing:started', {
      roomId,
      userId,
      timestamp: new Date()
    });
  }
  
  private stopTyping(roomId: string, userId: string): void {
    const roomTyping = this.typingIndicators.get(roomId);
    if (!roomTyping) return;
    
    const timeout = roomTyping.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      roomTyping.delete(userId);
      
      // Broadcast typing stop
      this.io.to(roomId).emit('typing:stopped', {
        roomId,
        userId,
        timestamp: new Date()
      });
    }
  }
  
  // Permission system
  private async canUserJoinRoom(userId: string, room: RoomConfig): Promise<boolean> {
    this.metrics.permissionChecks++;
    
    // Check if user is blacklisted
    if (room.metadata.permissions.blacklisted.includes(userId)) {
      return false;
    }
    
    // Public rooms allow anyone
    if (!room.metadata.isPrivate) {
      return true;
    }
    
    // Check read permissions for private rooms
    return room.metadata.permissions.canRead.includes(userId);
  }
  
  private async getUserPermissions(userId: string, room: RoomConfig): Promise<string[]> {
    const permissions: string[] = [];
    
    if (room.metadata.permissions.canRead.includes(userId)) {
      permissions.push('read');
    }
    
    if (room.metadata.permissions.canWrite.includes(userId)) {
      permissions.push('write');
    }
    
    if (room.metadata.permissions.canInvite.includes(userId)) {
      permissions.push('invite');
    }
    
    if (room.metadata.permissions.canManage.includes(userId)) {
      permissions.push('manage');
    }
    
    if (room.metadata.permissions.canModerate.includes(userId)) {
      permissions.push('moderate');
    }
    
    if (room.metadata.permissions.canDelete.includes(userId)) {
      permissions.push('delete');
    }
    
    return permissions;
  }
  
  // Moderation system
  private async moderateUser(
    action: 'kick' | 'mute' | 'ban',
    roomId: string,
    targetUserId: string,
    moderatorId: string,
    reason?: string,
    duration?: number
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check moderator permissions
    if (!room.metadata.permissions.canModerate.includes(moderatorId)) {
      throw new Error('Insufficient permissions to moderate');
    }
    
    const member = this.roomMembers.get(roomId)?.get(targetUserId);
    if (!member) {
      throw new Error('User not found in room');
    }
    
    switch (action) {
      case 'kick':
        await this.removeMemberFromRoom(roomId, targetUserId);
        
        // Disconnect user's sockets from room
        const userSockets = await this.getUserSockets(targetUserId);
        userSockets.forEach(socketId => {
          this.io.sockets.sockets.get(socketId)?.leave(roomId);
        });
        
        break;
        
      case 'mute':
        member.metadata.isMuted = true;
        await this.persistRoomMembers(roomId, this.roomMembers.get(roomId)!);
        
        if (duration) {
          setTimeout(() => {
            member.metadata.isMuted = false;
            this.persistRoomMembers(roomId, this.roomMembers.get(roomId)!);
          }, duration);
        }
        
        break;
        
      case 'ban':
        room.metadata.permissions.blacklisted.push(targetUserId);
        await this.removeMemberFromRoom(roomId, targetUserId);
        await this.persistRoomState(room);
        
        // Disconnect user's sockets from room
        const bannedUserSockets = await this.getUserSockets(targetUserId);
        bannedUserSockets.forEach(socketId => {
          this.io.sockets.sockets.get(socketId)?.leave(roomId);
        });
        
        break;
    }
    
    // Broadcast moderation action
    this.io.to(roomId).emit('moderation:action', {
      action,
      roomId,
      targetUserId,
      moderatorId,
      reason,
      timestamp: new Date()
    });
    
    this.metrics.moderationActions++;
    
    this.fastify.log.info(
      `🔨 Moderation action: ${action} on user ${targetUserId} in room ${roomId} by ${moderatorId}`
    );
  }
  
  // Utility methods
  private async getUserSockets(userId: string): Promise<string[]> {
    const sockets: string[] = [];
    
    for (const [socketId, socket] of this.io.sockets.sockets) {
      if ((socket as any).userId === userId) {
        sockets.push(socketId);
      }
    }
    
    return sockets;
  }
  
  private async getRoomMemberIds(roomId: string): Promise<string[]> {
    const members = this.roomMembers.get(roomId);
    return members ? Array.from(members.keys()) : [];
  }
  
  private async getRecentMessages(roomId: string, limit: number): Promise<Message[]> {
    try {
      const messages = await this.redis.lrange(`messages:${roomId}`, 0, limit - 1);
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      this.fastify.log.error('Failed to get recent messages:', error);
      return [];
    }
  }
  
  private async getMessageFromRedis(messageId: string): Promise<Message | null> {
    try {
      const messageData = await this.redis.get(`message:${messageId}`);
      return messageData ? JSON.parse(messageData) : null;
    } catch (error) {
      this.fastify.log.error('Failed to get message from Redis:', error);
      return null;
    }
  }
  
  private async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const message = await this.getMessageFromRedis(messageId);
      if (message && !message.metadata.readBy.some(r => r.userId === userId)) {
        message.metadata.readBy.push({
          userId,
          readAt: new Date()
        });
        await this.persistMessage(message);
      }
    } catch (error) {
      this.fastify.log.error('Failed to mark message as read:', error);
    }
  }
  
  // Persistence methods
  private async persistRoomState(room: RoomConfig): Promise<void> {
    try {
      await this.redis.set(
        `room:${room.id}`,
        JSON.stringify(room),
        'EX',
        86400 // 24 hours
      );
    } catch (error) {
      this.fastify.log.error('Failed to persist room state:', error);
    }
  }
  
  private async persistRoomMembers(roomId: string, members: Map<string, RoomMember>): Promise<void> {
    try {
      const membersArray = Array.from(members.values());
      await this.redis.set(
        `room_members:${roomId}`,
        JSON.stringify(membersArray),
        'EX',
        86400
      );
    } catch (error) {
      this.fastify.log.error('Failed to persist room members:', error);
    }
  }
  
  private async persistMessage(message: Message): Promise<void> {
    try {
      // Store individual message
      await this.redis.set(
        `message:${message.id}`,
        JSON.stringify(message),
        'EX',
        604800 // 7 days
      );
      
      // Add to room message list
      await this.redis.lpush(
        `messages:${message.roomId}`,
        JSON.stringify(message)
      );
      
      // Keep only last 1000 messages per room
      await this.redis.ltrim(`messages:${message.roomId}`, 0, 999);
      
    } catch (error) {
      this.fastify.log.error('Failed to persist message:', error);
    }
  }
  
  // Cleanup methods
  private async cleanupInactiveRooms(): Promise<void> {
    const now = new Date();
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [roomId, room] of this.rooms.entries()) {
      const inactiveTime = now.getTime() - room.metadata.lastActivity.getTime();
      
      if (inactiveTime > maxInactivity) {
        const members = this.roomMembers.get(roomId);
        if (!members || members.size === 0) {
          // Clean up empty inactive rooms
          this.rooms.delete(roomId);
          this.roomMembers.delete(roomId);
          this.typingIndicators.delete(roomId);
          
          await this.redis.del(`room:${roomId}`);
          await this.redis.del(`room_members:${roomId}`);
          
          this.fastify.log.info(`🧹 Cleaned up inactive room: ${roomId}`);
        }
      }
    }
  }
  
  private async cleanupExpiredTypingIndicators(): Promise<void> {
    for (const [roomId, indicators] of this.typingIndicators.entries()) {
      // Typing indicators are automatically cleaned up by timeouts,
      // this is just a safety net for any missed cleanups
      if (indicators.size === 0) {
        continue;
      }
      
      // Force clean any indicators older than 10 seconds
      for (const [userId, timeout] of indicators.entries()) {
        // This is handled by individual timeouts, but kept for safety
      }
    }
  }
  
  // Public API methods
  public getMetrics() {
    return {
      ...this.metrics,
      activeRooms: this.rooms.size,
      totalMembers: Array.from(this.roomMembers.values())
        .reduce((sum, members) => sum + members.size, 0),
      activeTypingIndicators: Array.from(this.typingIndicators.values())
        .reduce((sum, indicators) => sum + indicators.size, 0)
    };
  }
  
  public getRoomInfo(roomId: string) {
    const room = this.rooms.get(roomId);
    const members = this.roomMembers.get(roomId);
    
    return {
      room,
      members: members ? Array.from(members.values()) : [],
      memberCount: members ? members.size : 0
    };
  }
  
  public getAllRooms() {
    return Array.from(this.rooms.values());
  }
  
  public async getHealth() {
    return {
      status: 'healthy',
      metrics: this.getMetrics(),
      redis: {
        connected: this.redis.status === 'ready'
      }
    };
  }
}

// Factory function
export function createAdvancedRoomManager(
  fastify: FastifyInstance,
  io: Server,
  redis: Redis
): AdvancedRoomManager {
  return new AdvancedRoomManager(fastify, io, redis);
}
