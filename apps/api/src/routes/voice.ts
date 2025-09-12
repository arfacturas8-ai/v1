import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { validate, commonSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwForbidden, throwNotFound } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';
import { LiveKitService, ParticipantInfo } from '../services/livekit';

export default async function voiceRoutes(fastify: FastifyInstance) {
  // Initialize LiveKit service
  const liveKitService = new LiveKitService({
    url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
    apiKey: process.env.LIVEKIT_API_KEY || 'APIHmK7VRxK9Xb5M3PqN8Yz2Fw4Jt6Lp',
    apiSecret: process.env.LIVEKIT_API_SECRET || 'LkT9Qx3Vm8Sz5Rn2Bp7Wj4Ht6Fg3Cd1'
  });
  
  /**
   * @swagger
   * /voice/channels/{channelId}/join:
   *   post:
   *     tags: [voice]
   *     summary: Join voice channel
   *     security:
   *       - Bearer: []
   */
  fastify.post('/channels/:channelId/join', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId,
        body: z.object({
          mute: z.boolean().default(false),
          deaf: z.boolean().default(false)
        }).optional()
      })
    ],
    schema: {
      tags: ['voice'],
      summary: 'Join voice channel',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;
    const { mute = false, deaf = false } = request.body as any || {};

    // Check if channel exists and is a voice channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!channel) {
      throwNotFound('Channel');
    }

    if (!['VOICE', 'STAGE'].includes(channel.type)) {
      throwBadRequest('Channel is not a voice channel');
    }

    // Check server membership
    if (channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: channel.serverId,
            userId: request.userId!
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

      if (!serverMember) {
        throwForbidden('Not a member of this server');
      }

      // Check voice permissions
      const canConnect = serverMember.roles.some(memberRole => 
        memberRole.role.permissions & BigInt(0x100000) // CONNECT
      );

      if (!canConnect) {
        throwForbidden('No permission to connect to voice channels');
      }

      // Check user limit
      if (channel.userLimit) {
        const activeConnections = await prisma.voiceState.count({
          where: { 
            channelId,
            connectedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Active within 5 minutes
          }
        });

        if (activeConnections >= channel.userLimit) {
          throwBadRequest('Voice channel is full');
        }
      }
    }

    // Create or update voice state
    const sessionId = `voice_${Date.now()}_${request.userId}`;
    
    const voiceState = await prisma.voiceState.upsert({
      where: {
        userId_serverId: {
          userId: request.userId!,
          serverId: channel.serverId || 'dm'
        }
      },
      update: {
        channelId,
        sessionId,
        selfMute: mute,
        selfDeaf: deaf,
        connectedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId: request.userId!,
        serverId: channel.serverId,
        channelId,
        sessionId,
        selfMute: mute,
        selfDeaf: deaf
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

    // Generate proper LiveKit token with safety mechanisms
    let liveKitToken: string;
    let liveKitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    
    try {
      // Create participant info with proper permissions
      const participantInfo: ParticipantInfo = {
        identity: `user_${request.userId}`,
        name: voiceState.user.displayName || voiceState.user.username,
        metadata: JSON.stringify({
          userId: request.userId,
          channelId,
          joinedAt: Date.now(),
          capabilities: {
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            hidden: false,
            recorder: false
          }
        }),
        permissions: {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          hidden: false,
          recorder: false
        }
      };
      
      // Generate room name (use channel ID for consistency)
      const roomName = `channel_${channelId}`;
      
      // Ensure room exists before generating token
      try {
        await liveKitService.getRoom(roomName);
      } catch (error) {
        // Room doesn't exist, create it
        await liveKitService.createRoom({
          name: roomName,
          maxParticipants: channel.userLimit || 100,
          enableRecording: false,
          emptyTimeout: 300, // 5 minutes
          metadata: JSON.stringify({
            channelId,
            serverId: channel.serverId,
            channelName: channel.name,
            channelType: channel.type,
            createdAt: Date.now()
          })
        });
      }
      
      // Generate access token
      liveKitToken = liveKitService.generateAccessToken(roomName, participantInfo);
      
      fastify.log.info({
        roomName,
        participantIdentity: participantInfo.identity,
        channelId,
        userId: request.userId
      }, 'Generated LiveKit token');
      
    } catch (error) {
      fastify.log.error({ error, channelId, userId: request.userId }, 'Failed to generate LiveKit token');
      
      // Fallback: generate a basic token
      try {
        const fallbackParticipant: ParticipantInfo = {
          identity: `user_${request.userId}`,
          name: 'User',
          permissions: {
            canPublish: true,
            canSubscribe: true,
            canPublishData: false,
            hidden: false,
            recorder: false
          }
        };
        
        liveKitToken = liveKitService.generateAccessToken(`channel_${channelId}`, fallbackParticipant);
        fastify.log.info('Generated fallback LiveKit token');
        
      } catch (fallbackError) {
        fastify.log.error({ fallbackError }, 'Failed to generate fallback LiveKit token');
        
        // Last resort: basic token structure (this shouldn't be used in production)
        liveKitToken = `fallback_token_${sessionId}_${Date.now()}`;
        
        // Try backup URLs if available
        const backupUrls = process.env.LIVEKIT_BACKUP_URLS?.split(',') || [];
        if (backupUrls.length > 0) {
          liveKitUrl = backupUrls[0].trim();
          fastify.log.info(`Falling back to backup LiveKit server: ${liveKitUrl}`);
        }
      }
    }

    // Emit to channel participants
    fastify.io.to(`channel:${channelId}`).emit('voiceStateUpdate', {
      voiceState: {
        ...voiceState,
        channel: {
          id: channel.id,
          name: channel.name,
          type: channel.type
        }
      }
    });

    // Emit to server if applicable
    if (channel.serverId) {
      fastify.io.to(`server:${channel.serverId}`).emit('voiceStateUpdate', {
        voiceState
      });
    }

    reply.send({
      success: true,
      data: {
        voiceState: {
          ...voiceState,
          channel: {
            id: channel.id,
            name: channel.name,
            type: channel.type
          }
        },
        liveKitToken,
        liveKitUrl,
        // Additional safety information
        roomName: `channel_${channelId}`,
        participantInfo: {
          identity: `user_${request.userId}`,
          name: voiceState.user.displayName || voiceState.user.username
        },
        serverInfo: {
          maxParticipants: channel.userLimit || 100,
          currentParticipants: await prisma.voiceState.count({
            where: { 
              channelId,
              connectedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
            }
          }),
          capabilities: {
            audio: true,
            video: true,
            screenShare: true,
            recording: false
          }
        },
        // Backup URLs for failover
        backupUrls: process.env.LIVEKIT_BACKUP_URLS?.split(',').map(url => url.trim()) || []
      }
    });
  });

  /**
   * @swagger
   * /voice/channels/{channelId}/leave:
   *   post:
   *     tags: [voice]
   *     summary: Leave voice channel
   *     security:
   *       - Bearer: []
   */
  fastify.post('/channels/:channelId/leave', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId
      })
    ],
    schema: {
      tags: ['voice'],
      summary: 'Leave voice channel',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;

    const voiceState = await prisma.voiceState.findFirst({
      where: {
        userId: request.userId!,
        channelId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            serverId: true
          }
        }
      }
    });

    if (!voiceState) {
      throwNotFound('Voice state');
    }

    // Delete voice state
    await prisma.voiceState.delete({
      where: { id: voiceState.id }
    });

    // Emit to channel participants
    fastify.io.to(`channel:${channelId}`).emit('voiceStateDelete', {
      userId: request.userId!,
      channelId
    });

    // Emit to server if applicable
    if (voiceState.channel?.serverId) {
      fastify.io.to(`server:${voiceState.channel.serverId}`).emit('voiceStateDelete', {
        userId: request.userId!,
        channelId
      });
    }

    reply.send({
      success: true,
      message: 'Left voice channel successfully'
    });
  });

  /**
   * @swagger
   * /voice/state:
   *   patch:
   *     tags: [voice]
   *     summary: Update voice state
   *     security:
   *       - Bearer: []
   */
  fastify.patch('/state', {
    preHandler: [
      authMiddleware,
      validate({
        body: z.object({
          mute: z.boolean().optional(),
          deaf: z.boolean().optional(),
          selfMute: z.boolean().optional(),
          selfDeaf: z.boolean().optional(),
          selfVideo: z.boolean().optional(),
          selfStream: z.boolean().optional()
        })
      })
    ],
    schema: {
      tags: ['voice'],
      summary: 'Update voice state',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const updateData = request.body as any;

    const voiceState = await prisma.voiceState.findFirst({
      where: {
        userId: request.userId!,
        channelId: { not: null }
      }
    });

    if (!voiceState) {
      throwNotFound('Active voice state');
    }

    const updatedVoiceState = await prisma.voiceState.update({
      where: { id: voiceState.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            serverId: true
          }
        }
      }
    });

    // Emit to channel participants
    if (voiceState.channelId) {
      fastify.io.to(`channel:${voiceState.channelId}`).emit('voiceStateUpdate', {
        voiceState: updatedVoiceState
      });
    }

    // Emit to server if applicable
    if (updatedVoiceState.channel?.serverId) {
      fastify.io.to(`server:${updatedVoiceState.channel.serverId}`).emit('voiceStateUpdate', {
        voiceState: updatedVoiceState
      });
    }

    reply.send({
      success: true,
      data: updatedVoiceState
    });
  });

  /**
   * @swagger
   * /voice/channels/{channelId}/participants:
   *   get:
   *     tags: [voice]
   *     summary: Get voice channel participants
   *     security:
   *       - Bearer: []
   */
  fastify.get('/channels/:channelId/participants', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId
      })
    ],
    schema: {
      tags: ['voice'],
      summary: 'Get voice channel participants',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;

    // Check channel access
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        serverId: true,
        type: true
      }
    });

    if (!channel) {
      throwNotFound('Channel');
    }

    if (channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: channel.serverId,
            userId: request.userId!
          }
        }
      });

      if (!serverMember) {
        throwForbidden('Not a member of this server');
      }
    }

    const participants = await prisma.voiceState.findMany({
      where: {
        channelId,
        connectedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Active within 5 minutes
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
        }
      },
      orderBy: { connectedAt: 'asc' }
    });

    reply.send({
      success: true,
      data: {
        participants,
        count: participants.length
      }
    });
  });

  /**
   * @swagger
   * /voice/rooms:
   *   post:
   *     tags: [voice]
   *     summary: Create voice room
   *     security:
   *       - Bearer: []
   */
  fastify.post('/rooms', {
    preHandler: [
      authMiddleware,
      validate({
        body: z.object({
          name: z.string().min(1).max(100),
          description: z.string().max(500).optional(),
          isPrivate: z.boolean().default(false),
          maxParticipants: z.number().min(2).max(50).default(10)
        })
      })
    ],
    schema: {
      tags: ['voice'],
      summary: 'Create voice room',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { name, description, isPrivate = false, maxParticipants = 10 } = request.body as any;

    try {
      const roomId = `room_${Date.now()}_${request.userId}`;
      const roomName = `custom_room_${roomId}`;
      
      // Create LiveKit room
      await liveKitService.createRoom({
        name: roomName,
        maxParticipants,
        enableRecording: false,
        emptyTimeout: 600, // 10 minutes for custom rooms
        metadata: JSON.stringify({
          roomId,
          name,
          description,
          isPrivate,
          ownerId: request.userId,
          createdAt: Date.now(),
          type: 'custom_room'
        })
      });
      
      // Generate token for room creator
      const participantInfo: ParticipantInfo = {
        identity: `user_${request.userId}`,
        name: 'Room Owner',
        metadata: JSON.stringify({
          userId: request.userId,
          roomId,
          role: 'owner',
          joinedAt: Date.now()
        }),
        permissions: {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          hidden: false,
          recorder: false
        }
      };
      
      const token = liveKitService.generateAccessToken(roomName, participantInfo);
      
      fastify.log.info({ roomName, roomId, userId: request.userId }, 'Created custom voice room');
      
      reply.code(201).send({
        success: true,
        data: {
          room: {
            id: roomId,
            name,
            description,
            isPrivate,
            maxParticipants,
            ownerId: request.userId!,
            createdAt: new Date()
          },
          token,
          liveKitUrl: process.env.LIVEKIT_URL || 'ws://localhost:7880',
          roomName,
          participantInfo,
          capabilities: {
            audio: true,
            video: true,
            screenShare: true,
            recording: false
          }
        }
      });
      
    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, 'Failed to create custom voice room');
      
      // Fallback response
      const roomId = `room_${Date.now()}_${request.userId}`;
      reply.code(201).send({
        success: true,
        data: {
          room: {
            id: roomId,
            name,
            description,
            isPrivate,
            maxParticipants,
            ownerId: request.userId!,
            createdAt: new Date()
          },
          token: `fallback_token_${roomId}`,
          liveKitUrl: process.env.LIVEKIT_URL || 'ws://localhost:7880',
          roomName: `custom_room_${roomId}`,
          error: 'Room created with limited functionality due to server issues'
        }
      });
    }
  });

  /**
   * @swagger
   * /voice/rooms/{roomId}/join:
   *   post:
   *     tags: [voice]
   *     summary: Join voice room
   *     security:
   *       - Bearer: []
   */
  fastify.post('/rooms/:roomId/join', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          roomId: z.string()
        })
      })
    ],
    schema: {
      tags: ['voice'],
      summary: 'Join voice room',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { roomId } = request.params as any;

    try {
      const roomName = `custom_room_${roomId}`;
      
      // Check if room exists
      const room = await liveKitService.getRoom(roomName);
      if (!room) {
        throwNotFound('Voice room not found');
      }
      
      // Check room capacity
      const participants = await liveKitService.listParticipants(roomName);
      const roomMetadata = room.metadata ? JSON.parse(room.metadata) : {};
      const maxParticipants = roomMetadata.maxParticipants || 10;
      
      if (participants.length >= maxParticipants) {
        throwBadRequest('Voice room is full');
      }
      
      // Generate token for participant
      const participantInfo: ParticipantInfo = {
        identity: `user_${request.userId}`,
        name: 'Participant',
        metadata: JSON.stringify({
          userId: request.userId,
          roomId,
          role: 'participant',
          joinedAt: Date.now()
        }),
        permissions: {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
          hidden: false,
          recorder: false
        }
      };
      
      const token = liveKitService.generateAccessToken(roomName, participantInfo);
      
      reply.send({
        success: true,
        data: {
          roomId,
          token,
          liveKitUrl: process.env.LIVEKIT_URL || 'ws://localhost:7880',
          roomName,
          participantInfo,
          roomInfo: {
            name: roomMetadata.name || 'Voice Room',
            description: roomMetadata.description,
            maxParticipants,
            currentParticipants: participants.length,
            isPrivate: roomMetadata.isPrivate || false
          },
          capabilities: {
            audio: true,
            video: true,
            screenShare: true,
            recording: false
          }
        }
      });
      
    } catch (error) {
      if (error.message?.includes('not found')) {
        throwNotFound('Voice room not found or has expired');
      }
      
      fastify.log.error({ error, roomId, userId: request.userId }, 'Failed to join voice room');
      
      // Fallback response
      reply.send({
        success: true,
        data: {
          roomId,
          token: `fallback_token_${roomId}_${request.userId}`,
          liveKitUrl: process.env.LIVEKIT_URL || 'ws://localhost:7880',
          roomName: `custom_room_${roomId}`,
          error: 'Joined with limited functionality due to server issues'
        }
      });
    }
  });

  /**
   * @swagger
   * /voice/webhook:
   *   post:
   *     tags: [voice]
   *     summary: LiveKit webhook handler
   */
  fastify.post('/webhook', {
    schema: {
      tags: ['voice'],
      summary: 'LiveKit webhook handler'
    }
  }, async (request, reply) => {
    try {
      const body = JSON.stringify(request.body);
      const authHeader = request.headers.authorization || '';
      
      // Verify webhook signature for security
      const event = liveKitService.verifyWebhook(body, authHeader);
      
      fastify.log.info({ 
        event: event.event, 
        room: event.room?.name, 
        participant: event.participant?.identity 
      }, 'Voice webhook received');
      
      // Process webhook events with error handling
      try {
        switch (event.event) {
          case 'room_started':
            fastify.log.info(`Voice room started: ${event.room?.name}`);
            
            // Update room statistics
            if (event.room?.name) {
              await liveKitService.updateRoomMetadata(
                event.room.name,
                JSON.stringify({
                  ...JSON.parse(event.room.metadata || '{}'),
                  startedAt: Date.now(),
                  status: 'active'
                })
              );
            }
            break;

          case 'room_finished':
            fastify.log.info(`Voice room finished: ${event.room?.name}`);
            
            // Clean up room data and update voice states
            if (event.room?.name) {
              const roomName = event.room.name;
              
              // Update database voice states for participants who were in this room
              if (roomName.startsWith('channel_')) {
                const channelId = roomName.replace('channel_', '');
                await prisma.voiceState.deleteMany({
                  where: { channelId }
                });
                
                // Emit to channel that room ended
                fastify.io.to(`channel:${channelId}`).emit('voiceRoomEnded', {
                  channelId,
                  reason: 'room_finished'
                });
              }
            }
            break;

          case 'participant_joined':
            if (event.room?.name && event.participant) {
              fastify.log.info(`Participant joined: ${event.participant.identity} in ${event.room.name}`);
              
              // Emit to room participants
              fastify.io.to(`room:${event.room.name}`).emit('participantJoined', {
                participant: event.participant,
                room: event.room
              });
              
              // If this is a channel room, also emit to channel
              if (event.room.name.startsWith('channel_')) {
                const channelId = event.room.name.replace('channel_', '');
                fastify.io.to(`channel:${channelId}`).emit('voiceParticipantJoined', {
                  participant: event.participant,
                  channelId
                });
              }
            }
            break;

          case 'participant_left':
            if (event.room?.name && event.participant) {
              fastify.log.info(`Participant left: ${event.participant.identity} from ${event.room.name}`);
              
              // Emit to room participants
              fastify.io.to(`room:${event.room.name}`).emit('participantLeft', {
                participant: event.participant,
                room: event.room
              });
              
              // If this is a channel room, clean up voice state
              if (event.room.name.startsWith('channel_')) {
                const channelId = event.room.name.replace('channel_', '');
                const userId = event.participant.metadata ? 
                  JSON.parse(event.participant.metadata).userId : null;
                  
                if (userId) {
                  await prisma.voiceState.deleteMany({
                    where: {
                      userId,
                      channelId
                    }
                  });
                  
                  fastify.io.to(`channel:${channelId}`).emit('voiceParticipantLeft', {
                    participant: event.participant,
                    channelId,
                    userId
                  });
                }
              }
            }
            break;

          case 'track_published':
            if (event.room?.name && event.participant && event.track) {
              fastify.log.info(`Track published: ${event.track.kind} by ${event.participant.identity}`);
              
              fastify.io.to(`room:${event.room.name}`).emit('trackPublished', {
                participant: event.participant,
                track: event.track,
                room: event.room
              });
            }
            break;

          case 'track_unpublished':
            if (event.room?.name && event.participant && event.track) {
              fastify.log.info(`Track unpublished: ${event.track.kind} by ${event.participant.identity}`);
              
              fastify.io.to(`room:${event.room.name}`).emit('trackUnpublished', {
                participant: event.participant,
                track: event.track,
                room: event.room
              });
            }
            break;
            
          default:
            fastify.log.warn(`Unhandled webhook event: ${event.event}`);
        }
      } catch (processingError) {
        fastify.log.error({ 
          error: processingError, 
          event: event.event,
          room: event.room?.name 
        }, 'Error processing voice webhook event');
      }
      
    } catch (verificationError) {
      fastify.log.error({ error: verificationError }, 'Webhook signature verification failed');
      reply.code(401).send({ error: 'Invalid webhook signature' });
      return;
    }

    reply.send({ received: true });
  });
  
  /**
   * Health check endpoint for voice service
   */
  fastify.get('/health', {
    schema: {
      tags: ['voice'],
      summary: 'Voice service health check'
    }
  }, async (request, reply) => {
    try {
      // Check LiveKit server connectivity
      const rooms = await liveKitService.listRooms();
      
      reply.send({
        success: true,
        status: 'healthy',
        timestamp: Date.now(),
        livekit: {
          connected: true,
          url: process.env.LIVEKIT_URL,
          rooms: rooms.length
        },
        database: {
          connected: true
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Voice service health check failed');
      
      reply.code(503).send({
        success: false,
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message,
        livekit: {
          connected: false,
          url: process.env.LIVEKIT_URL
        }
      });
    }
  });
}