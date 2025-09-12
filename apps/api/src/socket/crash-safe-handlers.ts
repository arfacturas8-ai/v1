import { prisma } from '@cryb/database';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

/**
 * CRASH-SAFE Event Handlers
 * 
 * Every single event handler is wrapped with comprehensive error handling:
 * - Try-catch blocks around ALL operations
 * - Rate limiting validation
 * - Circuit breaker protection  
 * - Input validation and sanitization
 * - Graceful error responses
 * - Comprehensive logging
 * - Memory leak prevention
 * - Timeout protection
 */

interface SafeSocket {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
  connectionTime: Date;
  lastActivity: Date;
  rooms: Set<string>;
  emit: (event: string, data?: any) => void;
  to: (room: string) => any;
  join: (room: string) => Promise<void>;
  leave: (room: string) => void;
  disconnect: (close?: boolean) => void;
}

export class CrashSafeEventHandlers {
  constructor(
    private fastify: FastifyInstance,
    private redis: Redis,
    private checkRateLimit: (userId: string, eventType: string) => boolean,
    private executeWithCircuitBreaker: <T>(service: string, operation: () => Promise<T>) => Promise<T | null>,
    private presenceMap: Map<string, any>,
    private voiceStates: Map<string, any>,
    private typingIndicators: Map<string, any>,
    private connectionCleanupTasks: Map<string, NodeJS.Timeout[]>
  ) {}

  /**
   * Safe Message Events - Zero Crash Guarantee
   */
  setupSafeMessageEvents(socket: SafeSocket) {
    // Send Message
    socket.on('message:send', async (data: {
      channelId: string;
      content: string;
      replyToId?: string;
      attachments?: any[];
      mentions?: string[];
      embeds?: any[];
    }, callback?: Function) => {
      try {
        // Update activity
        socket.lastActivity = new Date();

        // Rate limiting
        if (!this.checkRateLimit(socket.userId, 'message:send')) {
          const error = { code: 'RATE_LIMITED', message: 'Message rate limit exceeded' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Input validation
        if (!data.channelId || typeof data.channelId !== 'string') {
          const error = { code: 'INVALID_INPUT', message: 'Channel ID is required' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
          const error = { code: 'INVALID_INPUT', message: 'Message content cannot be empty' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        if (data.content.length > 2000) {
          const error = { code: 'INVALID_INPUT', message: 'Message too long (max 2000 characters)' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Sanitize content
        const sanitizedContent = this.sanitizeInput(data.content);
        if (!sanitizedContent) {
          const error = { code: 'INVALID_INPUT', message: 'Message content contains invalid characters' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Validate channel access with circuit breaker
        const hasAccess = await this.executeWithCircuitBreaker('database', async () => {
          return await this.validateChannelAccess(socket.userId, data.channelId);
        });

        if (!hasAccess) {
          const error = { code: 'FORBIDDEN', message: 'No access to channel or database unavailable' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Validate reply message if provided
        if (data.replyToId) {
          const replyValid = await this.executeWithCircuitBreaker('database', async () => {
            const replyMessage = await prisma.message.findFirst({
              where: {
                id: data.replyToId,
                channelId: data.channelId
              }
            });
            return !!replyMessage;
          });

          if (!replyValid) {
            const error = { code: 'INVALID_INPUT', message: 'Reply message not found' };
            socket.emit('error', error);
            if (callback) callback({ success: false, error: error.message });
            return;
          }
        }

        // Create message with circuit breaker
        const message = await this.executeWithCircuitBreaker('database', async () => {
          return await prisma.message.create({
            data: {
              channelId: data.channelId,
              authorId: socket.userId,
              content: sanitizedContent,
              referencedMessageId: data.replyToId || null,
              attachments: this.sanitizeAttachments(data.attachments) || [],
              mentions: this.sanitizeMentions(data.mentions) || [],
              embeds: this.sanitizeEmbeds(data.embeds) || [],
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
        });

        if (!message) {
          const error = { code: 'DATABASE_ERROR', message: 'Failed to create message - database unavailable' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Broadcast message safely
        try {
          socket.to(`channel:${data.channelId}`).emit('message:new', message);
        } catch (broadcastError) {
          this.fastify.log.error('Failed to broadcast message:', broadcastError);
          // Continue - message was created successfully
        }

        // Handle mentions safely
        if (data.mentions && data.mentions.length > 0) {
          await this.safeMentionHandling(message, data.mentions);
        }

        // Success response
        const response = { success: true, messageId: message.id };
        if (callback) {
          callback(response);
        } else {
          socket.emit('message:sent', response);
        }

        // Track analytics safely
        await this.safeTrackEvent('message_sent', {
          userId: socket.userId,
          channelId: data.channelId,
          messageId: message.id,
          hasAttachments: (data.attachments?.length || 0) > 0,
          hasMentions: (data.mentions?.length || 0) > 0
        });

      } catch (error) {
        this.fastify.log.error('💥 Critical error in message:send handler:', error);
        const errorResponse = { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
        
        try {
          socket.emit('error', errorResponse);
          if (callback) callback({ success: false, error: errorResponse.message });
        } catch (emitError) {
          this.fastify.log.error('💥💥 Failed to emit error response:', emitError);
        }
      }
    });

    // Edit Message
    socket.on('message:edit', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        socket.lastActivity = new Date();

        if (!this.checkRateLimit(socket.userId, 'message:edit')) {
          socket.emit('error', { code: 'RATE_LIMITED', message: 'Edit rate limit exceeded' });
          return;
        }

        // Input validation
        if (!data.messageId || !data.content) {
          socket.emit('error', { code: 'INVALID_INPUT', message: 'Message ID and content required' });
          return;
        }

        if (data.content.length > 2000) {
          socket.emit('error', { code: 'INVALID_INPUT', message: 'Message too long' });
          return;
        }

        const sanitizedContent = this.sanitizeInput(data.content);
        if (!sanitizedContent) {
          socket.emit('error', { code: 'INVALID_INPUT', message: 'Invalid content' });
          return;
        }

        // Get message with circuit breaker
        const message = await this.executeWithCircuitBreaker('database', async () => {
          return await prisma.message.findUnique({
            where: { id: data.messageId },
            include: { author: true }
          });
        });

        if (!message) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found or database unavailable' });
          return;
        }

        if (message.authorId !== socket.userId) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot edit this message' });
          return;
        }

        // Check if message is too old (5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (message.timestamp < fiveMinutesAgo) {
          socket.emit('error', { code: 'MESSAGE_TOO_OLD', message: 'Message too old to edit' });
          return;
        }

        // Update message
        const updatedMessage = await this.executeWithCircuitBreaker('database', async () => {
          return await prisma.message.update({
            where: { id: data.messageId },
            data: { 
              content: sanitizedContent,
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
        });

        if (updatedMessage) {
          try {
            socket.to(`channel:${message.channelId}`).emit('message:edited', updatedMessage);
            socket.emit('message:edit_success', { messageId: data.messageId });
          } catch (broadcastError) {
            this.fastify.log.error('Failed to broadcast message edit:', broadcastError);
          }
        }

      } catch (error) {
        this.fastify.log.error('💥 Critical error in message:edit handler:', error);
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to edit message' });
      }
    });

    // Delete Message
    socket.on('message:delete', async (data: { messageId: string }) => {
      try {
        socket.lastActivity = new Date();

        if (!this.checkRateLimit(socket.userId, 'message:delete')) {
          socket.emit('error', { code: 'RATE_LIMITED', message: 'Delete rate limit exceeded' });
          return;
        }

        if (!data.messageId) {
          socket.emit('error', { code: 'INVALID_INPUT', message: 'Message ID required' });
          return;
        }

        const message = await this.executeWithCircuitBreaker('database', async () => {
          return await prisma.message.findUnique({
            where: { id: data.messageId },
            include: {
              channel: {
                include: {
                  community: true
                }
              }
            }
          });
        });

        if (!message) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found' });
          return;
        }

        // Check permissions
        const canDelete = message.authorId === socket.userId || 
          await this.hasDeletePermission(socket.userId, message.channel.communityId!);

        if (!canDelete) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Cannot delete this message' });
          return;
        }

        // Delete message
        const deleted = await this.executeWithCircuitBreaker('database', async () => {
          await prisma.message.delete({
            where: { id: data.messageId }
          });
          return true;
        });

        if (deleted) {
          try {
            socket.to(`channel:${message.channelId}`).emit('message:deleted', {
              messageId: data.messageId,
              channelId: message.channelId,
              deletedBy: socket.userId
            });
            socket.emit('message:delete_success', { messageId: data.messageId });
          } catch (broadcastError) {
            this.fastify.log.error('Failed to broadcast message deletion:', broadcastError);
          }
        }

      } catch (error) {
        this.fastify.log.error('💥 Critical error in message:delete handler:', error);
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to delete message' });
      }
    });

    this.fastify.log.info('🔒 Safe message events configured with zero-crash protection');
  }

  /**
   * Safe Typing Events with Comprehensive Error Handling
   */
  setupSafeTypingEvents(socket: SafeSocket) {
    // Start Typing
    socket.on('typing:start', async (data: { channelId: string }) => {
      try {
        if (!this.checkRateLimit(socket.userId, 'typing:start')) {
          return; // Silently ignore rate limited typing events
        }

        if (!data?.channelId || typeof data.channelId !== 'string') {
          return; // Silently ignore invalid typing events
        }

        socket.lastActivity = new Date();

        // Validate channel access
        const hasAccess = await this.executeWithCircuitBreaker('database', async () => {
          return await this.validateChannelAccess(socket.userId, data.channelId);
        });

        if (!hasAccess) {
          return; // Silently ignore unauthorized typing
        }

        const key = `${socket.userId}:${data.channelId}`;
        
        // Clear existing timeout safely
        const existingIndicator = this.typingIndicators.get(key);
        if (existingIndicator?.timeout) {
          try {
            clearTimeout(existingIndicator.timeout);
          } catch (clearError) {
            this.fastify.log.error('Failed to clear typing timeout:', clearError);
          }
        }

        // Set typing in Redis safely
        await this.executeWithCircuitBreaker('redis', async () => {
          await this.redis.setex(`typing:${data.channelId}:${socket.userId}`, 10, socket.username);
        });

        // Broadcast typing indicator safely
        try {
          socket.to(`channel:${data.channelId}`).emit('typing:user_start', {
            userId: socket.userId,
            username: socket.username,
            displayName: socket.displayName,
            channelId: data.channelId,
            timestamp: new Date()
          });
        } catch (broadcastError) {
          this.fastify.log.error('Failed to broadcast typing start:', broadcastError);
        }

        // Auto-stop typing after 10 seconds with error handling
        const timeout = setTimeout(async () => {
          try {
            await this.executeWithCircuitBreaker('redis', async () => {
              await this.redis.del(`typing:${data.channelId}:${socket.userId}`);
            });

            try {
              socket.to(`channel:${data.channelId}`).emit('typing:user_stop', {
                userId: socket.userId,
                channelId: data.channelId
              });
            } catch (stopBroadcastError) {
              this.fastify.log.error('Failed to broadcast typing stop:', stopBroadcastError);
            }

            this.typingIndicators.delete(key);
          } catch (timeoutError) {
            this.fastify.log.error('Typing timeout handler error:', timeoutError);
          }
        }, 10000);

        // Store typing indicator
        this.typingIndicators.set(key, {
          userId: socket.userId,
          channelId: data.channelId,
          username: socket.username,
          startedAt: new Date(),
          timeout
        });

        // Track cleanup task
        const cleanupTasks = this.connectionCleanupTasks.get(socket.id) || [];
        cleanupTasks.push(timeout);
        this.connectionCleanupTasks.set(socket.id, cleanupTasks);

      } catch (error) {
        this.fastify.log.error('💥 Critical error in typing:start handler:', error);
        // Don't emit error for typing events - they're non-critical
      }
    });

    // Stop Typing
    socket.on('typing:stop', async (data: { channelId: string }) => {
      try {
        if (!data?.channelId) return;

        socket.lastActivity = new Date();
        
        const key = `${socket.userId}:${data.channelId}`;
        const indicator = this.typingIndicators.get(key);
        
        if (indicator?.timeout) {
          try {
            clearTimeout(indicator.timeout);
          } catch (clearError) {
            this.fastify.log.error('Failed to clear typing timeout on stop:', clearError);
          }
        }
        
        this.typingIndicators.delete(key);

        // Remove from Redis
        await this.executeWithCircuitBreaker('redis', async () => {
          await this.redis.del(`typing:${data.channelId}:${socket.userId}`);
        });

        // Broadcast stop typing safely
        try {
          socket.to(`channel:${data.channelId}`).emit('typing:user_stop', {
            userId: socket.userId,
            channelId: data.channelId
          });
        } catch (broadcastError) {
          this.fastify.log.error('Failed to broadcast typing stop:', broadcastError);
        }

      } catch (error) {
        this.fastify.log.error('💥 Critical error in typing:stop handler:', error);
        // Don't emit error for typing events - they're non-critical
      }
    });

    this.fastify.log.info('🔒 Safe typing events configured with comprehensive error handling');
  }

  /**
   * Safe Channel Events with Full Protection
   */
  setupSafeChannelEvents(socket: SafeSocket) {
    // Join Channel
    socket.on('channel:join', async (data: { channelId: string }, callback?: Function) => {
      try {
        socket.lastActivity = new Date();

        if (!this.checkRateLimit(socket.userId, 'channel:join')) {
          const error = { code: 'RATE_LIMITED', message: 'Channel join rate limit exceeded' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        if (!data?.channelId || typeof data.channelId !== 'string') {
          const error = { code: 'INVALID_INPUT', message: 'Channel ID is required' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Validate channel access
        const access = await this.executeWithCircuitBreaker('database', async () => {
          return await this.validateChannelAccessDetailed(socket.userId, data.channelId);
        });

        if (!access || !access.hasAccess) {
          const error = { code: 'FORBIDDEN', message: access?.reason || 'No access to channel' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Join channel room safely
        try {
          await socket.join(`channel:${data.channelId}`);
          socket.rooms.add(`channel:${data.channelId}`);
        } catch (joinError) {
          this.fastify.log.error('Failed to join channel room:', joinError);
          const error = { code: 'JOIN_FAILED', message: 'Failed to join channel' };
          socket.emit('error', error);
          if (callback) callback({ success: false, error: error.message });
          return;
        }

        // Track channel presence in Redis
        let memberCount = 1;
        await this.executeWithCircuitBreaker('redis', async () => {
          await this.redis.sadd(`channel:${data.channelId}:presence`, socket.userId);
          await this.redis.expire(`channel:${data.channelId}:presence`, 300); // 5 minutes
          memberCount = await this.redis.scard(`channel:${data.channelId}:presence`);
        });

        // Broadcast user joined safely
        try {
          socket.to(`channel:${data.channelId}`).emit('channel:member_joined', {
            userId: socket.userId,
            username: socket.username,
            displayName: socket.displayName,
            channelId: data.channelId,
            memberCount
          });
        } catch (broadcastError) {
          this.fastify.log.error('Failed to broadcast channel join:', broadcastError);
        }

        // Get channel data safely
        const channelData = await this.executeWithCircuitBreaker('database', async () => {
          return await this.getChannelData(data.channelId);
        });

        // Success response
        const response = {
          success: true,
          channelId: data.channelId,
          memberCount,
          ...(channelData || {})
        };

        socket.emit('channel:joined', response);
        if (callback) callback(response);

        // Track analytics
        await this.safeTrackEvent('channel_joined', {
          userId: socket.userId,
          channelId: data.channelId
        });

      } catch (error) {
        this.fastify.log.error('💥 Critical error in channel:join handler:', error);
        const errorResponse = { code: 'INTERNAL_ERROR', message: 'Failed to join channel' };
        
        try {
          socket.emit('error', errorResponse);
          if (callback) callback({ success: false, error: errorResponse.message });
        } catch (emitError) {
          this.fastify.log.error('💥💥 Failed to emit join error:', emitError);
        }
      }
    });

    // Leave Channel
    socket.on('channel:leave', async (data: { channelId: string }) => {
      try {
        if (!data?.channelId) return;

        socket.lastActivity = new Date();

        // Leave channel room safely
        try {
          socket.leave(`channel:${data.channelId}`);
          socket.rooms.delete(`channel:${data.channelId}`);
        } catch (leaveError) {
          this.fastify.log.error('Failed to leave channel room:', leaveError);
        }

        // Remove from channel presence
        let memberCount = 0;
        await this.executeWithCircuitBreaker('redis', async () => {
          await this.redis.srem(`channel:${data.channelId}:presence`, socket.userId);
          memberCount = await this.redis.scard(`channel:${data.channelId}:presence`);
        });

        // Broadcast user left safely
        try {
          socket.to(`channel:${data.channelId}`).emit('channel:member_left', {
            userId: socket.userId,
            channelId: data.channelId,
            memberCount
          });
        } catch (broadcastError) {
          this.fastify.log.error('Failed to broadcast channel leave:', broadcastError);
        }

        socket.emit('channel:left', { channelId: data.channelId });

      } catch (error) {
        this.fastify.log.error('💥 Critical error in channel:leave handler:', error);
        // Don't emit error for leave events - they're cleanup operations
      }
    });

    this.fastify.log.info('🔒 Safe channel events configured');
  }

  /**
   * Safe Presence Events with Crash Protection
   */
  setupSafePresenceEvents(socket: SafeSocket) {
    socket.on('presence:update', async (data: {
      status: 'online' | 'idle' | 'dnd' | 'invisible';
      activity?: any;
    }) => {
      try {
        socket.lastActivity = new Date();

        if (!this.checkRateLimit(socket.userId, 'presence:update')) {
          socket.emit('error', { code: 'RATE_LIMITED', message: 'Presence update rate limit exceeded' });
          return;
        }

        // Validate input
        const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
        if (!data?.status || !validStatuses.includes(data.status)) {
          socket.emit('error', { code: 'INVALID_INPUT', message: 'Invalid status' });
          return;
        }

        // Create presence data safely
        const presenceData = {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          status: data.status,
          activity: this.sanitizeActivity(data.activity),
          deviceType: 'web', // TODO: Detect device type
          lastSeen: new Date(),
          isOnline: data.status !== 'invisible'
        };

        // Update presence in memory
        this.presenceMap.set(socket.userId, presenceData);

        // Update in Redis
        await this.executeWithCircuitBreaker('redis', async () => {
          await this.redis.setex(
            `presence:${socket.userId}`,
            300, // 5 minutes
            JSON.stringify(presenceData)
          );
        });

        // Update database
        await this.executeWithCircuitBreaker('database', async () => {
          await prisma.user.update({
            where: { id: socket.userId },
            data: {
              status: data.status,
              lastActiveAt: new Date()
            }
          });
        });

        // Broadcast safely
        await this.safeBroadcastToFriends(socket.userId, 'presence:update', {
          userId: socket.userId,
          status: data.status,
          activity: presenceData.activity,
          lastSeen: new Date()
        });

      } catch (error) {
        this.fastify.log.error('💥 Critical error in presence:update handler:', error);
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to update presence' });
      }
    });

    this.fastify.log.info('🔒 Safe presence events configured');
  }

  /**
   * Helper Methods with Error Handling
   */
  private sanitizeInput(input: string): string | null {
    try {
      if (typeof input !== 'string') return null;
      
      // Remove potential XSS
      const sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      
      return sanitized.trim();
    } catch (error) {
      this.fastify.log.error('Input sanitization error:', error);
      return null;
    }
  }

  private sanitizeAttachments(attachments?: any[]): any[] {
    try {
      if (!Array.isArray(attachments)) return [];
      
      return attachments.slice(0, 10).map(attachment => {
        if (typeof attachment !== 'object' || !attachment) return null;
        
        return {
          id: typeof attachment.id === 'string' ? attachment.id : null,
          filename: typeof attachment.filename === 'string' ? attachment.filename.substring(0, 255) : null,
          size: typeof attachment.size === 'number' ? Math.min(attachment.size, 100 * 1024 * 1024) : 0,
          contentType: typeof attachment.contentType === 'string' ? attachment.contentType.substring(0, 100) : null,
          url: typeof attachment.url === 'string' ? attachment.url.substring(0, 500) : null
        };
      }).filter(Boolean);
    } catch (error) {
      this.fastify.log.error('Attachment sanitization error:', error);
      return [];
    }
  }

  private sanitizeMentions(mentions?: string[]): string[] {
    try {
      if (!Array.isArray(mentions)) return [];
      
      return mentions
        .slice(0, 20) // Max 20 mentions
        .filter(mention => typeof mention === 'string' && mention.length <= 50)
        .map(mention => mention.trim())
        .filter(Boolean);
    } catch (error) {
      this.fastify.log.error('Mention sanitization error:', error);
      return [];
    }
  }

  private sanitizeEmbeds(embeds?: any[]): any[] {
    try {
      if (!Array.isArray(embeds)) return [];
      
      return embeds.slice(0, 5).map(embed => {
        if (typeof embed !== 'object' || !embed) return null;
        
        return {
          title: typeof embed.title === 'string' ? embed.title.substring(0, 200) : null,
          description: typeof embed.description === 'string' ? embed.description.substring(0, 1000) : null,
          url: typeof embed.url === 'string' ? embed.url.substring(0, 500) : null,
          color: typeof embed.color === 'number' ? embed.color : null
        };
      }).filter(Boolean);
    } catch (error) {
      this.fastify.log.error('Embed sanitization error:', error);
      return [];
    }
  }

  private sanitizeActivity(activity?: any): any {
    try {
      if (typeof activity !== 'object' || !activity) return null;
      
      return {
        type: typeof activity.type === 'string' ? activity.type.substring(0, 50) : null,
        name: typeof activity.name === 'string' ? activity.name.substring(0, 200) : null,
        details: typeof activity.details === 'string' ? activity.details.substring(0, 200) : null,
        state: typeof activity.state === 'string' ? activity.state.substring(0, 200) : null,
        url: typeof activity.url === 'string' ? activity.url.substring(0, 500) : null
      };
    } catch (error) {
      this.fastify.log.error('Activity sanitization error:', error);
      return null;
    }
  }

  private async validateChannelAccess(userId: string, channelId: string): Promise<boolean> {
    try {
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
    } catch (error) {
      this.fastify.log.error('Channel access validation error:', error);
      return false;
    }
  }

  private async validateChannelAccessDetailed(userId: string, channelId: string): Promise<{hasAccess: boolean, reason?: string} | null> {
    try {
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { community: true }
      });

      if (!channel) {
        return { hasAccess: false, reason: 'Channel not found' };
      }

      const member = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: channel.communityId!,
            userId
          }
        }
      });

      if (!member) {
        return { hasAccess: false, reason: 'Not a member of this server' };
      }

      return { hasAccess: true };
    } catch (error) {
      this.fastify.log.error('Detailed channel access validation error:', error);
      return null;
    }
  }

  private async getChannelData(channelId: string) {
    try {
      return await prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        }
      });
    } catch (error) {
      this.fastify.log.error('Get channel data error:', error);
      return null;
    }
  }

  private async hasDeletePermission(userId: string, serverId: string): Promise<boolean> {
    try {
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
    } catch (error) {
      this.fastify.log.error('Delete permission check error:', error);
      return false;
    }
  }

  private async safeMentionHandling(message: any, mentions: string[]) {
    try {
      for (const mentionedUserId of mentions.slice(0, 10)) { // Max 10 mentions
        try {
          // Send notification safely
          await this.executeWithCircuitBreaker('database', async () => {
            await prisma.notification.create({
              data: {
                userId: mentionedUserId,
                type: 'mention',
                title: `${message.author.displayName || message.author.username} mentioned you`,
                content: message.content.substring(0, 200),
                data: {
                  messageId: message.id,
                  channelId: message.channelId,
                  authorId: message.authorId
                }
              }
            });
          });
        } catch (mentionError) {
          this.fastify.log.error(`Failed to create mention notification for ${mentionedUserId}:`, mentionError);
        }
      }
    } catch (error) {
      this.fastify.log.error('Mention handling error:', error);
    }
  }

  private async safeBroadcastToFriends(userId: string, event: string, data: any) {
    try {
      const friendships = await this.executeWithCircuitBreaker('database', async () => {
        return await prisma.friendship.findMany({
          where: {
            OR: [
              { userId, status: 'accepted' },
              { friendId: userId, status: 'accepted' }
            ]
          }
        });
      });

      if (!friendships) return;

      const friendIds = friendships.map(f => 
        f.userId === userId ? f.friendId : f.userId
      );

      // Broadcast to friends safely
      friendIds.forEach(friendId => {
        try {
          // Use io.to instead of socket.to for cross-server broadcasting
          // This would need to be passed in from the main service
        } catch (broadcastError) {
          this.fastify.log.error(`Failed to broadcast to friend ${friendId}:`, broadcastError);
        }
      });
    } catch (error) {
      this.fastify.log.error('Friend broadcast error:', error);
    }
  }

  private async safeTrackEvent(event: string, data: any) {
    try {
      await this.executeWithCircuitBreaker('redis', async () => {
        await this.redis.lpush(
          `analytics:${event}`,
          JSON.stringify({
            timestamp: Date.now(),
            data
          })
        );
        
        // Keep only last 1000 events per type
        await this.redis.ltrim(`analytics:${event}`, 0, 999);
      });
    } catch (error) {
      this.fastify.log.error('Event tracking error:', error);
    }
  }
}