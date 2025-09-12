import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { verifyToken } from '@cryb/auth';
import { AuthService } from '../services/auth';
import { prisma } from '@cryb/database';

interface SocketWithAuth extends Socket {
  userId?: string;
  username?: string;
  communities?: string[];
}

export function setupSocketHandlers(io: Server, app: FastifyInstance) {
  // Initialize AuthService for proper JWT validation
  const authService = new AuthService((app as any).redis);
  // ============================================
  // REDIS ADAPTER SETUP
  // ============================================
  
  const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();
  
  io.adapter(createAdapter(pubClient, subClient));
  
  app.log.info('Socket.io Redis adapter configured for horizontal scaling');

  // ============================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================
  
  io.use(async (socket: SocketWithAuth, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Use comprehensive token validation with session and blacklist checks
      const validation = await authService.validateAccessToken(token);
      if (!validation.valid) {
        return next(new Error(validation.reason || 'Authentication failed'));
      }

      const user = await prisma.user.findUnique({
        where: { id: validation.payload.userId },
        include: {
          communityMembers: {
            select: {
              communityId: true,
              roles: true
            }
          }
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      socket.communities = user.communityMembers.map(m => m.communityId);
      
      // Update user status to online
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          status: 'online',
          lastActiveAt: new Date()
        }
      });
      
      next();
    } catch (error) {
      app.log.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  // ============================================
  // CONNECTION HANDLER
  // ============================================
  
  io.on('connection', async (socket: SocketWithAuth) => {
    app.log.info(`User ${socket.username} (${socket.userId}) connected via Socket.io`);
    
    // Join user's personal room
    socket.join(`user:${socket.userId}`);
    
    // Join all communities the user is a member of
    if (socket.communities) {
      for (const communityId of socket.communities) {
        socket.join(`community:${communityId}`);
      }
    }
    
    // Notify friends that user is online
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: socket.userId, status: 'accepted' },
          { friendId: socket.userId, status: 'accepted' }
        ]
      }
    });
    
    const friendIds = friendships.map(f => 
      f.userId === socket.userId ? f.friendId : f.userId
    );
    
    for (const friendId of friendIds) {
      io.to(`user:${friendId}`).emit('friend-online', {
        userId: socket.userId,
        username: socket.username,
        status: 'online'
      });
    }

    // ============================================
    // COMMUNITY EVENTS
    // ============================================
    
    socket.on('join-community', async (communityId: string) => {
      try {
        const member = await prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId,
              userId: socket.userId!
            }
          }
        });

        if (member) {
          socket.join(`community:${communityId}`);
          socket.emit('joined-community', communityId);
          
          // Notify other members
          socket.to(`community:${communityId}`).emit('member-joined', {
            userId: socket.userId,
            username: socket.username,
            communityId
          });
        } else {
          socket.emit('error', { message: 'Not a member of this community' });
        }
      } catch (error) {
        app.log.error('Error joining community:', error);
        socket.emit('error', { message: 'Failed to join community' });
      }
    });

    socket.on('leave-community', (communityId: string) => {
      socket.leave(`community:${communityId}`);
      socket.emit('left-community', communityId);
      
      socket.to(`community:${communityId}`).emit('member-left', {
        userId: socket.userId,
        username: socket.username,
        communityId
      });
    });

    // ============================================
    // CHANNEL EVENTS
    // ============================================
    
    socket.on('join-channel', async (channelId: string) => {
      try {
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { community: true }
        });

        if (!channel) {
          return socket.emit('error', { message: 'Channel not found' });
        }

        const member = await prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId: channel.communityId!,
              userId: socket.userId!
            }
          }
        });

        if (member) {
          socket.join(`channel:${channelId}`);
          socket.emit('joined-channel', channelId);
          
          // Track presence
          await app.redis.sadd(`channel:${channelId}:presence`, socket.userId!);
          
          const presenceCount = await app.redis.scard(`channel:${channelId}:presence`);
          io.to(`channel:${channelId}`).emit('channel-presence', {
            channelId,
            count: presenceCount
          });
        } else {
          socket.emit('error', { message: 'Not authorized to join this channel' });
        }
      } catch (error) {
        app.log.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    socket.on('leave-channel', async (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.emit('left-channel', channelId);
      
      // Update presence
      await app.redis.srem(`channel:${channelId}:presence`, socket.userId!);
      
      const presenceCount = await app.redis.scard(`channel:${channelId}:presence`);
      io.to(`channel:${channelId}`).emit('channel-presence', {
        channelId,
        count: presenceCount
      });
    });

    // ============================================
    // MESSAGE EVENTS
    // ============================================
    
    socket.on('send-message', async (data: {
      channelId: string;
      content: string;
      attachments?: any[];
      replyToId?: string;
      mentions?: string[];
    }) => {
      try {
        const message = await prisma.message.create({
          data: {
            channelId: data.channelId,
            authorId: socket.userId!,
            content: data.content,
            attachments: data.attachments || [],
            mentions: data.mentions || [],
            referencedMessageId: data.replyToId,
            timestamp: new Date()
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            referencedMessage: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
            }
          }
        });

        // Emit to channel members
        io.to(`channel:${data.channelId}`).emit('new-message', message);
        
        // Send notifications to mentioned users
        if (data.mentions && data.mentions.length > 0) {
          for (const userId of data.mentions) {
            await app.queues.notifications.add('mention', {
              userId,
              type: 'mention',
              title: `${socket.username} mentioned you`,
              content: data.content,
              channelId: data.channelId,
              messageId: message.id
            });
            
            io.to(`user:${userId}`).emit('notification', {
              type: 'mention',
              message,
              channelId: data.channelId
            });
          }
        }
        
        // Update channel last message
        await prisma.channel.update({
          where: { id: data.channelId },
          data: { lastMessageId: message.id }
        });
        
        // Track analytics
        await app.queues.analytics.add('message-sent', {
          userId: socket.userId,
          channelId: data.channelId,
          messageId: message.id,
          timestamp: new Date()
        });
        
      } catch (error) {
        app.log.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('edit-message', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: data.messageId }
        });

        if (!message || message.authorId !== socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        const updatedMessage = await prisma.message.update({
          where: { id: data.messageId },
          data: {
            content: data.content,
            editedTimestamp: new Date()
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        });

        io.to(`channel:${message.channelId}`).emit('message-edited', updatedMessage);
      } catch (error) {
        app.log.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('delete-message', async (messageId: string) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId }
        });

        if (!message || message.authorId !== socket.userId) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        await prisma.message.update({
          where: { id: messageId },
          data: { deleted: true }
        });

        io.to(`channel:${message.channelId}`).emit('message-deleted', {
          messageId,
          channelId: message.channelId
        });
      } catch (error) {
        app.log.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ============================================
    // TYPING INDICATORS
    // ============================================
    
    socket.on('typing', async (data: { channelId: string }) => {
      // Store typing state in Redis with TTL
      await app.redis.setex(`typing:${data.channelId}:${socket.userId}`, 5, socket.username!);
      
      socket.to(`channel:${data.channelId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        channelId: data.channelId
      });
    });

    socket.on('stop-typing', async (data: { channelId: string }) => {
      await app.redis.del(`typing:${data.channelId}:${socket.userId}`);
      
      socket.to(`channel:${data.channelId}`).emit('user-stop-typing', {
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    // ============================================
    // VOICE & VIDEO
    // ============================================
    
    socket.on('join-voice', async (data: { channelId: string }) => {
      try {
        const channel = await prisma.channel.findUnique({
          where: { id: data.channelId }
        });

        if (!channel || !['GUILD_VOICE', 'GUILD_STAGE_VOICE'].includes(channel.type)) {
          return socket.emit('error', { message: 'Not a voice channel' });
        }

        // Generate LiveKit token
        const token = await app.services.livekit.generateToken(
          socket.userId!,
          socket.username!,
          data.channelId
        );

        socket.emit('voice-token', {
          token,
          url: process.env.LIVEKIT_URL,
          channelId: data.channelId
        });

        // Update voice state
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
          create: {
            userId: socket.userId!,
            channelId: data.channelId,
            communityId: channel.communityId!,
            sessionId: socket.id,
            joinedAt: new Date()
          }
        });

        socket.to(`channel:${data.channelId}`).emit('user-joined-voice', {
          userId: socket.userId,
          username: socket.username,
          channelId: data.channelId
        });
      } catch (error) {
        app.log.error('Error joining voice:', error);
        socket.emit('error', { message: 'Failed to join voice channel' });
      }
    });

    socket.on('leave-voice', async (data: { channelId: string }) => {
      try {
        await prisma.voiceState.delete({
          where: {
            userId_channelId: {
              userId: socket.userId!,
              channelId: data.channelId
            }
          }
        });

        socket.to(`channel:${data.channelId}`).emit('user-left-voice', {
          userId: socket.userId,
          username: socket.username,
          channelId: data.channelId
        });
      } catch (error) {
        app.log.error('Error leaving voice:', error);
      }
    });

    // ============================================
    // PRESENCE & STATUS
    // ============================================
    
    socket.on('update-status', async (status: 'online' | 'idle' | 'dnd' | 'invisible') => {
      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { status }
        });

        // Notify friends
        for (const friendId of friendIds) {
          io.to(`user:${friendId}`).emit('friend-status-update', {
            userId: socket.userId,
            status
          });
        }
      } catch (error) {
        app.log.error('Error updating status:', error);
      }
    });

    socket.on('update-activity', async (activity: any) => {
      try {
        await prisma.userPresence.upsert({
          where: { userId: socket.userId! },
          update: {
            activities: [activity],
            lastUpdated: new Date()
          },
          create: {
            userId: socket.userId!,
            status: 'online',
            activities: [activity],
            lastUpdated: new Date()
          }
        });

        // Broadcast to friends
        for (const friendId of friendIds) {
          io.to(`user:${friendId}`).emit('friend-activity-update', {
            userId: socket.userId,
            activity
          });
        }
      } catch (error) {
        app.log.error('Error updating activity:', error);
      }
    });

    // ============================================
    // DIRECT MESSAGES
    // ============================================
    
    socket.on('send-dm', async (data: {
      recipientId: string;
      content: string;
      encrypted?: boolean;
    }) => {
      try {
        const dm = await prisma.directMessage.create({
          data: {
            senderId: socket.userId!,
            recipientId: data.recipientId,
            content: data.content,
            encrypted: data.encrypted || false
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        });

        // Send to recipient
        io.to(`user:${data.recipientId}`).emit('new-dm', dm);
        
        // Echo back to sender
        socket.emit('dm-sent', dm);
        
        // Send push notification
        await app.queues.notifications.add('dm', {
          userId: data.recipientId,
          type: 'dm',
          title: `New message from ${socket.username}`,
          content: data.content,
          senderId: socket.userId
        });
      } catch (error) {
        app.log.error('Error sending DM:', error);
        socket.emit('error', { message: 'Failed to send direct message' });
      }
    });

    // ============================================
    // REACTIONS
    // ============================================
    
    socket.on('add-reaction', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: data.messageId }
        });

        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        // Update message reactions
        const reactions = message.reactions as any[] || [];
        const existingReaction = reactions.find(r => r.emoji === data.emoji);
        
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

        await prisma.message.update({
          where: { id: data.messageId },
          data: { reactions }
        });

        io.to(`channel:${message.channelId}`).emit('reaction-added', {
          messageId: data.messageId,
          emoji: data.emoji,
          userId: socket.userId,
          username: socket.username
        });
      } catch (error) {
        app.log.error('Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    
    socket.on('disconnect', async () => {
      app.log.info(`User ${socket.username} (${socket.userId}) disconnected`);
      
      try {
        // Update user status
        await prisma.user.update({
          where: { id: socket.userId },
          data: { 
            status: 'offline',
            lastActiveAt: new Date()
          }
        });
        
        // Clean up voice states
        await prisma.voiceState.deleteMany({
          where: { userId: socket.userId }
        });
        
        // Remove from all channel presence sets
        const channels = await app.redis.keys('channel:*:presence');
        for (const channel of channels) {
          await app.redis.srem(channel, socket.userId!);
        }
        
        // Notify friends
        for (const friendId of friendIds) {
          io.to(`user:${friendId}`).emit('friend-offline', {
            userId: socket.userId,
            username: socket.username
          });
        }
      } catch (error) {
        app.log.error('Error handling disconnect:', error);
      }
    });
  });
}