import { AuthenticatedSocket, PresenceData, VoiceState, TypingIndicator, ReadReceipt } from './realtime-communication';
import { prisma } from '@cryb/database';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

/**
 * Event handlers extension for RealtimeCommunicationService
 * This file contains the remaining event handlers that were too large for the main file
 */

export class RealtimeCommunicationHandlers {
  constructor(
    private fastify: FastifyInstance,
    private redis: Redis,
    private presenceMap: Map<string, PresenceData>,
    private voiceStates: Map<string, VoiceState>,
    private typingIndicators: Map<string, TypingIndicator>
  ) {}

  setupChannelEvents(socket: AuthenticatedSocket, broadcastToFriends: Function, trackEvent: Function) {
    socket.on('channel:join', async (data: { channelId: string }, callback?: Function) => {
      try {
        socket.lastActivity = new Date();

        // Validate channel access
        const access = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!access.hasAccess) {
          socket.emit('error', { code: 'FORBIDDEN', message: access.reason });
          if (callback) callback({ success: false, error: access.reason });
          return;
        }

        // Join channel room
        await socket.join(`channel:${data.channelId}`);
        socket.rooms?.add(`channel:${data.channelId}`);

        // Track channel presence
        await this.redis.sadd(`channel:${data.channelId}:presence`, socket.userId!);
        await this.redis.expire(`channel:${data.channelId}:presence`, 300); // 5 minutes

        // Get channel members count
        const memberCount = await this.redis.scard(`channel:${data.channelId}:presence`);

        // Broadcast user joined channel
        socket.to(`channel:${data.channelId}`).emit('channel:member_joined', {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          channelId: data.channelId,
          memberCount
        });

        // Send channel data to user
        const channelData = await this.getChannelData(data.channelId);
        socket.emit('channel:joined', {
          channelId: data.channelId,
          memberCount,
          ...channelData
        });

        if (callback) {
          callback({ success: true, memberCount });
        }

        await trackEvent('channel_joined', {
          userId: socket.userId,
          channelId: data.channelId,
          deviceType: socket.deviceType
        });

      } catch (error) {
        this.fastify.log.error('Error joining channel:', error);
        socket.emit('error', { code: 'CHANNEL_JOIN_FAILED', message: 'Failed to join channel' });
        if (callback) callback({ success: false, error: 'Failed to join channel' });
      }
    });

    socket.on('channel:leave', async (data: { channelId: string }) => {
      try {
        socket.lastActivity = new Date();

        socket.leave(`channel:${data.channelId}`);
        socket.rooms?.delete(`channel:${data.channelId}`);

        // Remove from channel presence
        await this.redis.srem(`channel:${data.channelId}:presence`, socket.userId!);
        const memberCount = await this.redis.scard(`channel:${data.channelId}:presence`);

        // Broadcast user left channel
        socket.to(`channel:${data.channelId}`).emit('channel:member_left', {
          userId: socket.userId,
          channelId: data.channelId,
          memberCount
        });

        socket.emit('channel:left', { channelId: data.channelId });

        await trackEvent('channel_left', {
          userId: socket.userId,
          channelId: data.channelId
        });

      } catch (error) {
        this.fastify.log.error('Error leaving channel:', error);
      }
    });

    socket.on('channel:get_history', async (data: {
      channelId: string;
      before?: string;
      limit?: number;
    }, callback?: Function) => {
      try {
        // Validate access
        const hasAccess = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!hasAccess) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'No access to channel' });
          return;
        }

        const limit = Math.min(data.limit || 50, 100); // Max 100 messages
        
        const messages = await prisma.message.findMany({
          where: {
            channelId: data.channelId,
            ...(data.before && { timestamp: { lt: new Date(data.before) } })
          },
          take: limit,
          orderBy: { timestamp: 'desc' },
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

        if (callback) {
          callback({ success: true, messages: messages.reverse() });
        } else {
          socket.emit('channel:history', {
            channelId: data.channelId,
            messages: messages.reverse()
          });
        }

      } catch (error) {
        this.fastify.log.error('Error getting channel history:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get channel history' });
        }
      }
    });
  }

  setupPresenceEvents(socket: AuthenticatedSocket, updatePresence: Function, broadcastToFriends: Function) {
    socket.on('presence:update', async (data: {
      status: 'online' | 'idle' | 'dnd' | 'invisible';
      activity?: {
        type: 'playing' | 'streaming' | 'listening' | 'watching' | 'custom';
        name: string;
        details?: string;
        state?: string;
        url?: string;
      };
    }) => {
      try {
        socket.lastActivity = new Date();

        const presenceData: PresenceData = {
          userId: socket.userId!,
          username: socket.username!,
          displayName: socket.displayName,
          status: data.status,
          activity: data.activity,
          deviceType: socket.deviceType!,
          lastSeen: new Date(),
          isOnline: data.status !== 'invisible'
        };

        await updatePresence(socket.userId!, presenceData);

        // Update database
        await prisma.user.update({
          where: { id: socket.userId },
          data: {
            status: data.status,
            lastActiveAt: new Date()
          }
        });

        // Broadcast to friends
        await broadcastToFriends(socket.userId!, 'presence:update', {
          userId: socket.userId,
          status: data.status,
          activity: data.activity,
          lastSeen: new Date()
        });

      } catch (error) {
        this.fastify.log.error('Error updating presence:', error);
      }
    });

    socket.on('presence:get_bulk', async (data: { userIds: string[] }, callback?: Function) => {
      try {
        const presences = await Promise.all(
          data.userIds.slice(0, 100).map(async (userId) => { // Limit to 100 users
            const presence = this.presenceMap.get(userId);
            if (presence) return presence;

            // Fallback to Redis
            const cached = await this.redis.get(`presence:${userId}`);
            if (cached) {
              return JSON.parse(cached);
            }

            // Fallback to database
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                username: true,
                displayName: true,
                lastSeenAt: true
              }
            });

            return user ? {
              userId: user.id,
              username: user.username,
              displayName: user.displayName,
              status: user.status || 'offline',
              lastSeen: user.lastActiveAt || new Date(),
              isOnline: false
            } : null;
          })
        );

        const validPresences = presences.filter(Boolean);
        
        if (callback) {
          callback({ success: true, presences: validPresences });
        } else {
          socket.emit('presence:bulk_update', { presences: validPresences });
        }

      } catch (error) {
        this.fastify.log.error('Error getting bulk presence:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get presence data' });
        }
      }
    });

    // Heartbeat for presence
    socket.on('presence:heartbeat', async () => {
      socket.lastActivity = new Date();
      
      const presence = this.presenceMap.get(socket.userId!);
      if (presence) {
        presence.lastSeen = new Date();
        this.presenceMap.set(socket.userId!, presence);
        
        // Update Redis
        await this.redis.setex(
          `presence:${socket.userId}`,
          300, // 5 minutes
          JSON.stringify(presence)
        );
      }
      
      socket.emit('presence:heartbeat_ack');
    });
  }

  setupTypingEvents(socket: AuthenticatedSocket) {
    socket.on('typing:start', async (data: { channelId: string }) => {
      try {
        if (!data.channelId) return;

        socket.lastActivity = new Date();

        // Validate channel access
        const hasAccess = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!hasAccess) return;

        const key = `${socket.userId}:${data.channelId}`;
        
        // Clear existing timeout
        const existingIndicator = this.typingIndicators.get(key);
        if (existingIndicator?.timeout) {
          clearTimeout(existingIndicator.timeout);
        }

        // Set typing in Redis with expiration
        await this.redis.setex(`typing:${data.channelId}:${socket.userId}`, 10, socket.username!);

        // Broadcast typing indicator
        socket.to(`channel:${data.channelId}`).emit('typing:user_start', {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          channelId: data.channelId,
          timestamp: new Date()
        });

        // Auto-stop typing after 10 seconds
        const timeout = setTimeout(async () => {
          await this.redis.del(`typing:${data.channelId}:${socket.userId}`);
          socket.to(`channel:${data.channelId}`).emit('typing:user_stop', {
            userId: socket.userId,
            channelId: data.channelId
          });
          this.typingIndicators.delete(key);
        }, 10000);

        this.typingIndicators.set(key, {
          userId: socket.userId!,
          channelId: data.channelId,
          username: socket.username!,
          startedAt: new Date(),
          timeout
        });

      } catch (error) {
        this.fastify.log.error('Error handling typing start:', error);
      }
    });

    socket.on('typing:stop', async (data: { channelId: string }) => {
      try {
        if (!data.channelId) return;

        socket.lastActivity = new Date();
        
        const key = `${socket.userId}:${data.channelId}`;
        const indicator = this.typingIndicators.get(key);
        
        if (indicator?.timeout) {
          clearTimeout(indicator.timeout);
        }
        
        this.typingIndicators.delete(key);

        // Remove from Redis
        await this.redis.del(`typing:${data.channelId}:${socket.userId}`);

        // Broadcast stop typing
        socket.to(`channel:${data.channelId}`).emit('typing:user_stop', {
          userId: socket.userId,
          channelId: data.channelId
        });

      } catch (error) {
        this.fastify.log.error('Error handling typing stop:', error);
      }
    });

    socket.on('typing:get_active', async (data: { channelId: string }, callback?: Function) => {
      try {
        // Get active typing users from Redis
        const typingKeys = await this.redis.keys(`typing:${data.channelId}:*`);
        const typingUsers = await Promise.all(
          typingKeys.map(async (key) => {
            const userId = key.split(':')[2];
            const username = await this.redis.get(key);
            return { userId, username };
          })
        );

        if (callback) {
          callback({ success: true, typing: typingUsers });
        } else {
          socket.emit('typing:active_users', {
            channelId: data.channelId,
            typing: typingUsers
          });
        }

      } catch (error) {
        this.fastify.log.error('Error getting active typing users:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get typing users' });
        }
      }
    });
  }

  setupVoiceEvents(socket: AuthenticatedSocket, trackEvent: Function) {
    socket.on('voice:join', async (data: { channelId: string }, callback?: Function) => {
      try {
        socket.lastActivity = new Date();

        // Validate voice channel access
        const channel = await prisma.channel.findUnique({
          where: { id: data.channelId },
          include: { community: true }
        });

        if (!channel || !['VOICE', 'STAGE'].includes(channel.type)) {
          socket.emit('error', { code: 'INVALID_CHANNEL', message: 'Not a voice channel' });
          if (callback) callback({ success: false, error: 'Not a voice channel' });
          return;
        }

        // Check permissions
        const hasAccess = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!hasAccess) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'No access to voice channel' });
          if (callback) callback({ success: false, error: 'No access to voice channel' });
          return;
        }

        // Leave current voice channel if in one
        await this.leaveCurrentVoiceChannel(socket);

        // Create voice state
        const voiceState: VoiceState = {
          userId: socket.userId!,
          channelId: data.channelId,
          serverId: channel.communityId!,
          sessionId: socket.id,
          muted: false,
          deafened: false,
          selfMute: false,
          selfDeaf: false,
          speaking: false,
          camera: false,
          screenShare: false,
          joinedAt: new Date()
        };

        // Store in memory and database
        this.voiceStates.set(socket.userId!, voiceState);
        await prisma.voiceState.upsert({
          where: {
            userId_channelId: {
              userId: socket.userId!,
              channelId: data.channelId
            }
          },
          update: {
            sessionId: socket.id,
            joinedAt: new Date()
          },
          create: voiceState
        });

        // Join voice room
        await socket.join(`voice:${data.channelId}`);
        socket.rooms?.add(`voice:${data.channelId}`);

        // Generate LiveKit token (if using LiveKit for voice)
        const voiceToken = await this.generateVoiceToken(socket.userId!, data.channelId);

        // Broadcast to voice channel
        socket.to(`voice:${data.channelId}`).emit('voice:user_joined', {
          userId: socket.userId,
          username: socket.username,
          displayName: socket.displayName,
          voiceState
        });

        // Send response
        const response = {
          success: true,
          voiceState,
          token: voiceToken,
          serverUrl: process.env.LIVEKIT_URL
        };

        if (callback) {
          callback(response);
        } else {
          socket.emit('voice:joined', response);
        }

        await trackEvent('voice_joined', {
          userId: socket.userId,
          channelId: data.channelId,
          serverId: channel.communityId
        });

      } catch (error) {
        this.fastify.log.error('Error joining voice channel:', error);
        socket.emit('error', { code: 'VOICE_JOIN_FAILED', message: 'Failed to join voice channel' });
        if (callback) callback({ success: false, error: 'Failed to join voice channel' });
      }
    });

    socket.on('voice:leave', async () => {
      await this.leaveCurrentVoiceChannel(socket);
    });

    socket.on('voice:update', async (data: {
      muted?: boolean;
      deafened?: boolean;
      selfMute?: boolean;
      selfDeaf?: boolean;
      speaking?: boolean;
      camera?: boolean;
      screenShare?: boolean;
    }) => {
      try {
        socket.lastActivity = new Date();
        
        const currentState = this.voiceStates.get(socket.userId!);
        if (!currentState) return;

        // Update voice state
        const updatedState = { ...currentState, ...data };
        this.voiceStates.set(socket.userId!, updatedState);

        // Update database
        await prisma.voiceState.update({
          where: {
            userId_channelId: {
              userId: socket.userId!,
              channelId: currentState.channelId
            }
          },
          data: data
        });

        // Broadcast to voice channel
        socket.to(`voice:${currentState.channelId}`).emit('voice:state_update', {
          userId: socket.userId,
          voiceState: updatedState
        });

      } catch (error) {
        this.fastify.log.error('Error updating voice state:', error);
      }
    });

    socket.on('voice:get_participants', async (data: { channelId: string }, callback?: Function) => {
      try {
        const participants = Array.from(this.voiceStates.values())
          .filter(state => state.channelId === data.channelId);

        if (callback) {
          callback({ success: true, participants });
        } else {
          socket.emit('voice:participants', {
            channelId: data.channelId,
            participants
          });
        }

      } catch (error) {
        this.fastify.log.error('Error getting voice participants:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get participants' });
        }
      }
    });
  }

  setupReadReceiptEvents(socket: AuthenticatedSocket) {
    socket.on('message:mark_read', async (data: {
      messageId: string;
      channelId: string;
    }) => {
      try {
        socket.lastActivity = new Date();

        // Validate access
        const hasAccess = await this.validateChannelAccess(socket.userId!, data.channelId);
        if (!hasAccess) return;

        // Create read receipt
        await prisma.readReceipt.upsert({
          where: {
            messageId_userId: {
              messageId: data.messageId,
              userId: socket.userId!
            }
          },
          update: {
            readAt: new Date()
          },
          create: {
            messageId: data.messageId,
            userId: socket.userId!,
            readAt: new Date()
          }
        });

        // Store in Redis for quick access
        await this.redis.hset(
          `read_receipts:${data.messageId}`,
          socket.userId!,
          new Date().toISOString()
        );

        // Broadcast read receipt
        socket.to(`channel:${data.channelId}`).emit('message:read_receipt', {
          messageId: data.messageId,
          userId: socket.userId,
          username: socket.username,
          readAt: new Date()
        });

      } catch (error) {
        this.fastify.log.error('Error marking message as read:', error);
      }
    });

    socket.on('message:get_read_receipts', async (data: {
      messageId: string;
    }, callback?: Function) => {
      try {
        // Get from Redis first for performance
        const redisReceipts = await this.redis.hgetall(`read_receipts:${data.messageId}`);
        
        if (Object.keys(redisReceipts).length > 0) {
          const receipts = Object.entries(redisReceipts).map(([userId, readAt]) => ({
            userId,
            readAt: new Date(readAt)
          }));
          
          if (callback) {
            callback({ success: true, receipts });
          }
          return;
        }

        // Fallback to database
        const receipts = await prisma.readReceipt.findMany({
          where: { messageId: data.messageId },
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

        if (callback) {
          callback({ success: true, receipts });
        }

      } catch (error) {
        this.fastify.log.error('Error getting read receipts:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get read receipts' });
        }
      }
    });
  }

  setupDirectMessageEvents(socket: AuthenticatedSocket, trackEvent: Function) {
    socket.on('dm:send', async (data: {
      recipientId: string;
      content: string;
      attachments?: any[];
      encrypted?: boolean;
    }, callback?: Function) => {
      try {
        socket.lastActivity = new Date();

        // Validate recipient exists and can receive DMs
        const recipient = await prisma.user.findUnique({
          where: { id: data.recipientId },
          select: {
            id: true,
            username: true,
            displayName: true,
            dmPrivacy: true
          }
        });

        if (!recipient) {
          socket.emit('error', { code: 'USER_NOT_FOUND', message: 'Recipient not found' });
          if (callback) callback({ success: false, error: 'Recipient not found' });
          return;
        }

        // Check DM permissions
        const canDM = await this.canSendDirectMessage(socket.userId!, data.recipientId);
        if (!canDM) {
          socket.emit('error', { code: 'DM_BLOCKED', message: 'Cannot send direct message' });
          if (callback) callback({ success: false, error: 'Cannot send direct message' });
          return;
        }

        // Create DM
        const dm = await prisma.directMessage.create({
          data: {
            senderId: socket.userId!,
            recipientId: data.recipientId,
            content: data.content,
            attachments: data.attachments || [],
            encrypted: data.encrypted || false
          },
          include: {
            sender: {
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

        // Send to recipient
        socket.to(`user:${data.recipientId}`).emit('dm:new', dm);
        
        // Send confirmation to sender
        const response = { success: true, dm };
        if (callback) {
          callback(response);
        } else {
          socket.emit('dm:sent', response);
        }

        await trackEvent('dm_sent', {
          senderId: socket.userId,
          recipientId: data.recipientId,
          hasAttachments: (data.attachments?.length || 0) > 0,
          encrypted: data.encrypted || false
        });

      } catch (error) {
        this.fastify.log.error('Error sending direct message:', error);
        socket.emit('error', { code: 'DM_SEND_FAILED', message: 'Failed to send direct message' });
        if (callback) callback({ success: false, error: 'Failed to send direct message' });
      }
    });

    socket.on('dm:get_conversations', async (data: {
      limit?: number;
      offset?: number;
    }, callback?: Function) => {
      try {
        const limit = Math.min(data.limit || 20, 50);
        const offset = data.offset || 0;

        const conversations = await prisma.directMessage.findMany({
          where: {
            OR: [
              { senderId: socket.userId },
              { recipientId: socket.userId }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            recipient: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        });

        // Group by conversation partner
        const groupedConversations = new Map();
        conversations.forEach(dm => {
          const partnerId = dm.senderId === socket.userId ? dm.recipientId : dm.senderId;
          const partner = dm.senderId === socket.userId ? dm.recipient : dm.sender;
          
          if (!groupedConversations.has(partnerId)) {
            groupedConversations.set(partnerId, {
              partnerId,
              partner,
              lastMessage: dm,
              unreadCount: 0 // TODO: Calculate unread count
            });
          }
        });

        const result = Array.from(groupedConversations.values());

        if (callback) {
          callback({ success: true, conversations: result });
        }

      } catch (error) {
        this.fastify.log.error('Error getting DM conversations:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to get conversations' });
        }
      }
    });
  }

  setupModerationEvents(socket: AuthenticatedSocket, trackEvent: Function) {
    socket.on('moderation:kick_user', async (data: {
      userId: string;
      serverId: string;
      reason?: string;
    }, callback?: Function) => {
      try {
        // Check moderation permissions
        const hasPermission = await this.hasKickPermission(socket.userId!, data.serverId);
        if (!hasPermission) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions' });
          if (callback) callback({ success: false, error: 'Insufficient permissions' });
          return;
        }

        // Remove user from server
        await prisma.communityMember.delete({
          where: {
            communityId_userId: {
              communityId: data.serverId,
              userId: data.userId
            }
          }
        });

        // Force disconnect from server channels
        const userSockets = await this.fastify.io.in(`user:${data.userId}`).fetchSockets();
        for (const userSocket of userSockets) {
          userSocket.leave(`server:${data.serverId}`);
          
          // Leave all channels in this server
          const channels = await prisma.channel.findMany({
            where: { communityId: data.serverId },
            select: { id: true }
          });
          
          for (const channel of channels) {
            userSocket.leave(`channel:${channel.id}`);
          }
          
          userSocket.emit('moderation:kicked', {
            serverId: data.serverId,
            reason: data.reason,
            moderator: socket.username
          });
        }

        // Broadcast to server
        socket.to(`server:${data.serverId}`).emit('moderation:user_kicked', {
          userId: data.userId,
          serverId: data.serverId,
          moderator: socket.userId,
          reason: data.reason
        });

        const response = { success: true };
        if (callback) callback(response);

        await trackEvent('user_kicked', {
          moderatorId: socket.userId,
          targetUserId: data.userId,
          serverId: data.serverId,
          reason: data.reason
        });

      } catch (error) {
        this.fastify.log.error('Error kicking user:', error);
        if (callback) callback({ success: false, error: 'Failed to kick user' });
      }
    });

    socket.on('moderation:ban_user', async (data: {
      userId: string;
      serverId: string;
      reason?: string;
      duration?: number; // Duration in hours, 0 for permanent
    }, callback?: Function) => {
      try {
        // Check ban permissions
        const hasPermission = await this.hasBanPermission(socket.userId!, data.serverId);
        if (!hasPermission) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions' });
          if (callback) callback({ success: false, error: 'Insufficient permissions' });
          return;
        }

        const expiresAt = data.duration ? 
          new Date(Date.now() + data.duration * 60 * 60 * 1000) : 
          null;

        // Create ban record
        await prisma.ban.create({
          data: {
            userId: data.userId,
            serverId: data.serverId,
            bannedBy: socket.userId!,
            reason: data.reason,
            expiresAt,
            active: true
          }
        });

        // Remove user from server
        await prisma.communityMember.deleteMany({
          where: {
            communityId: data.serverId,
            userId: data.userId
          }
        });

        // Force disconnect and notify
        const userSockets = await this.fastify.io.in(`user:${data.userId}`).fetchSockets();
        for (const userSocket of userSockets) {
          userSocket.leave(`server:${data.serverId}`);
          
          // Leave all channels in this server
          const channels = await prisma.channel.findMany({
            where: { communityId: data.serverId },
            select: { id: true }
          });
          
          for (const channel of channels) {
            userSocket.leave(`channel:${channel.id}`);
          }
          
          userSocket.emit('moderation:banned', {
            serverId: data.serverId,
            reason: data.reason,
            expiresAt,
            moderator: socket.username
          });
        }

        // Broadcast to server
        socket.to(`server:${data.serverId}`).emit('moderation:user_banned', {
          userId: data.userId,
          serverId: data.serverId,
          moderator: socket.userId,
          reason: data.reason,
          expiresAt
        });

        const response = { success: true };
        if (callback) callback(response);

        await trackEvent('user_banned', {
          moderatorId: socket.userId,
          targetUserId: data.userId,
          serverId: data.serverId,
          reason: data.reason,
          duration: data.duration
        });

      } catch (error) {
        this.fastify.log.error('Error banning user:', error);
        if (callback) callback({ success: false, error: 'Failed to ban user' });
      }
    });
  }

  setupUtilityEvents(socket: AuthenticatedSocket) {
    socket.on('ping', (callback?: Function) => {
      const timestamp = Date.now();
      if (callback) {
        callback({ timestamp });
      } else {
        socket.emit('pong', { timestamp });
      }
    });

    socket.on('get_server_info', async (callback?: Function) => {
      const info = {
        serverId: socket.id,
        connectedAt: socket.connectionTime,
        userId: socket.userId,
        username: socket.username,
        rooms: Array.from(socket.rooms || [])
      };

      if (callback) {
        callback(info);
      } else {
        socket.emit('server_info', info);
      }
    });
  }

  // Helper methods
  private async validateChannelAccess(userId: string, channelId: string) {
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

    // TODO: Add more granular permission checks
    return { hasAccess: true };
  }

  private async getChannelData(channelId: string) {
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
  }

  private async leaveCurrentVoiceChannel(socket: AuthenticatedSocket) {
    const currentState = this.voiceStates.get(socket.userId!);
    if (!currentState) return;

    socket.leave(`voice:${currentState.channelId}`);
    socket.rooms?.delete(`voice:${currentState.channelId}`);
    this.voiceStates.delete(socket.userId!);

    // Remove from database
    await prisma.voiceState.deleteMany({
      where: { userId: socket.userId }
    });

    // Broadcast leave
    socket.to(`voice:${currentState.channelId}`).emit('voice:user_left', {
      userId: socket.userId,
      channelId: currentState.channelId
    });

    socket.emit('voice:left', { channelId: currentState.channelId });
  }

  private async generateVoiceToken(userId: string, channelId: string) {
    // TODO: Implement LiveKit token generation
    // This would generate a JWT token for LiveKit room access
    return `voice_token_${userId}_${channelId}_${Date.now()}`;
  }

  private async canSendDirectMessage(senderId: string, recipientId: string): Promise<boolean> {
    // Check if users are friends or share a server
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: recipientId, status: 'accepted' },
          { userId: recipientId, friendId: senderId, status: 'accepted' }
        ]
      }
    });

    if (friendship) return true;

    // Check if they share a server
    const sharedServers = await prisma.communityMember.findFirst({
      where: {
        userId: senderId,
        community: {
          members: {
            some: {
              userId: recipientId
            }
          }
        }
      }
    });

    return !!sharedServers;
  }

  private async hasKickPermission(userId: string, serverId: string): Promise<boolean> {
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
    const hasKickPermission = member.roles.some(role => 
      (role.permissions as any)?.includes('KICK_MEMBERS')
    );

    return hasKickPermission;
  }

  private async hasBanPermission(userId: string, serverId: string): Promise<boolean> {
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
    const hasBanPermission = member.roles.some(role => 
      (role.permissions as any)?.includes('BAN_MEMBERS')
    );

    return hasBanPermission;
  }
}