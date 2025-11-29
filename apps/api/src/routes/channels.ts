import { FastifyInstance } from 'fastify';
import { prisma, ChannelType } from '@cryb/database';
import { validate, validationSchemas, commonSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwForbidden, throwNotFound } from '../middleware/errorHandler';
import { authMiddleware, serverContextMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Enhanced validation schemas for channel operations
const createChannelSchema = z.object({
  serverId: z.string().cuid("Invalid server ID"),
  name: z.string()
    .min(1, "Channel name is required")
    .max(100, "Channel name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\-_\s]+$/, "Channel name can only contain letters, numbers, hyphens, underscores, and spaces"),
  description: z.string().max(1024, "Description must be 1024 characters or less").optional(),
  type: z.enum(['GUILD_TEXT', 'DM', 'GUILD_VOICE', 'GROUP_DM', 'GUILD_CATEGORY', 'GUILD_ANNOUNCEMENT', 'ANNOUNCEMENT_THREAD', 'PUBLIC_THREAD', 'PRIVATE_THREAD', 'GUILD_STAGE_VOICE', 'GUILD_DIRECTORY', 'GUILD_FORUM', 'GUILD_MEDIA', 'TEXT', 'VOICE'], {
    errorMap: () => ({ message: "Invalid channel type" })
  }),
  parentId: z.string().cuid("Invalid parent category ID").optional(),
  isPrivate: z.boolean().default(false),
  slowMode: z.number().min(0, "Slow mode cannot be negative").max(21600, "Slow mode cannot exceed 6 hours").default(0),
  nsfw: z.boolean().default(false),
  topic: z.string().max(1024, "Topic must be 1024 characters or less").optional(),
  userLimit: z.number().min(0).max(99).optional(), // For voice channels
  bitrate: z.number().min(8000).max(384000).optional(), // For voice channels
  position: z.number().min(0).optional()
});

const updateChannelSchema = z.object({
  name: z.string()
    .min(1, "Channel name is required")
    .max(100, "Channel name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\-_\s]+$/, "Channel name can only contain letters, numbers, hyphens, underscores, and spaces")
    .optional(),
  description: z.string().max(1024, "Description must be 1024 characters or less").nullable().optional(),
  topic: z.string().max(1024, "Topic must be 1024 characters or less").nullable().optional(),
  position: z.number().min(0, "Position cannot be negative").optional(),
  isPrivate: z.boolean().optional(),
  slowMode: z.number().min(0, "Slow mode cannot be negative").max(21600, "Slow mode cannot exceed 6 hours").optional(),
  nsfw: z.boolean().optional(),
  parentId: z.string().cuid("Invalid parent category ID").nullable().optional(),
  userLimit: z.number().min(0).max(99).optional(), // For voice channels
  bitrate: z.number().min(8000).max(384000).optional() // For voice channels
});

const channelPermissionSchema = z.object({
  roleId: z.string().cuid("Invalid role ID").optional(),
  userId: z.string().cuid("Invalid user ID").optional(),
  allow: z.bigint().optional(),
  deny: z.bigint().optional()
}).refine(data => data.roleId || data.userId, {
  message: "Either roleId or userId must be provided"
});

// Discord-style permission constants
const CHANNEL_PERMISSIONS = {
  VIEW_CHANNEL: 0x400,
  MANAGE_CHANNELS: 0x10,
  MANAGE_PERMISSIONS: 0x10000000,
  SEND_MESSAGES: 0x800,
  MANAGE_MESSAGES: 0x2000,
  READ_MESSAGE_HISTORY: 0x10000,
  ADD_REACTIONS: 0x40,
  USE_EXTERNAL_EMOJIS: 0x40000,
  MENTION_EVERYONE: 0x20000,
  CONNECT: 0x100000,
  SPEAK: 0x200000,
  MUTE_MEMBERS: 0x400000,
  DEAFEN_MEMBERS: 0x800000,
  MOVE_MEMBERS: 0x1000000,
  USE_VAD: 0x2000000,
  STREAM: 0x200,
  EMBED_LINKS: 0x4000,
  ATTACH_FILES: 0x8000,
  SEND_TTS_MESSAGES: 0x1000
};

// Helper function to check channel permissions
async function checkChannelPermissions(
  userId: string, 
  channelId: string, 
  requiredPermissions: bigint
): Promise<boolean> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      server: {
        select: {
          id: true,
          ownerId: true
        }
      },
      permissions: {
        include: {
          role: true
        }
      }
    }
  });

  if (!channel || !channel.serverId) return false;

  // Server owner has all permissions
  if (channel.server?.ownerId === userId) return true;

  // Get user's server membership and roles
  const member = await prisma.serverMember.findUnique({
    where: {
      serverId_userId: {
        serverId: channel.serverId,
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

  if (!member) return false;

  // Calculate effective permissions
  let effectivePermissions = BigInt(0);
  
  // Start with @everyone role permissions
  const everyoneRole = await prisma.role.findFirst({
    where: {
      serverId: channel.serverId,
      name: "@everyone"
    }
  });
  
  if (everyoneRole) {
    effectivePermissions |= everyoneRole.permissions;
  }

  // Apply role permissions
  for (const memberRole of member.roles) {
    effectivePermissions |= memberRole.role.permissions;
  }

  // Apply channel permission overwrites
  for (const permission of channel.permissions) {
    if (permission.roleId) {
      // Check if user has this role
      const hasRole = member.roles.some(mr => mr.roleId === permission.roleId);
      if (hasRole) {
        effectivePermissions &= ~(permission.deny || BigInt(0)); // Remove denied permissions
        effectivePermissions |= (permission.allow || BigInt(0)); // Add allowed permissions
      }
    } else if (permission.userId === userId) {
      // User-specific override
      effectivePermissions &= ~(permission.deny || BigInt(0));
      effectivePermissions |= (permission.allow || BigInt(0));
    }
  }

  // Check administrator permission (bypasses all other permissions)
  if (effectivePermissions & BigInt(0x8)) return true;

  return (effectivePermissions & requiredPermissions) === requiredPermissions;
}

export default async function channelRoutes(fastify: FastifyInstance) {
  
  /**
   * @swagger
   * /channels:
   *   get:
   *     tags: [channels]
   *     summary: List channels for a server
   *     description: Get all channels for a specific server
   *     security:
   *       - Bearer: []
   */
  fastify.get('/', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['channels'],
      summary: 'List channels for a server',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          serverId: { type: 'string', description: 'Server ID to list channels for' }
        },
        required: ['serverId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  position: { type: 'number' },
                  serverId: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { serverId } = request.query as any;

      if (!serverId) {
        return reply.code(400).send({
          success: false,
          error: "serverId query parameter is required"
        });
      }

      // Check if user is a member of the server
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId,
            userId: request.userId!
          }
        }
      });

      if (!serverMember) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server"
        });
      }

      // Get all channels for the server
      const channels = await prisma.channel.findMany({
        where: { serverId },
        select: {
          id: true,
          name: true,
          type: true,
          position: true,
          serverId: true,
          parentId: true,
          description: true,
          isPrivate: true,
          nsfw: true,
          userLimit: true,
          bitrate: true,
          slowMode: true,
          topic: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { position: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      return reply.send({
        success: true,
        data: channels
      });

    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, 'Failed to list channels');
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve channels"
      });
    }
  });

  /**
   * @swagger
   * /channels:
   *   post:
   *     tags: [channels]
   *     summary: Create a new channel
   *     description: Creates a new channel in a server with proper permission validation
   *     security:
   *       - Bearer: []
   */
  fastify.post('/', {
    preHandler: [
      authMiddleware
    ],
    schema: {
      tags: ['channels'],
      summary: 'Create a new channel',
      description: 'Creates a new channel in a server with proper permission validation',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          serverId: { type: 'string', description: 'Server ID where the channel will be created' },
          name: { type: 'string', minLength: 1, maxLength: 100, description: 'Channel name' },
          description: { type: 'string', maxLength: 1024, description: 'Channel description' },
          type: { 
            type: 'string', 
            enum: ['GUILD_TEXT', 'DM', 'GUILD_VOICE', 'GROUP_DM', 'GUILD_CATEGORY', 'GUILD_ANNOUNCEMENT', 'ANNOUNCEMENT_THREAD', 'PUBLIC_THREAD', 'PRIVATE_THREAD', 'GUILD_STAGE_VOICE', 'GUILD_DIRECTORY', 'GUILD_FORUM', 'GUILD_MEDIA', 'TEXT', 'VOICE'],
            description: 'Channel type'
          },
          parentId: { type: 'string', description: 'Parent category ID' },
          isPrivate: { type: 'boolean', default: false, description: 'Whether channel is private' },
          slowMode: { type: 'number', minimum: 0, maximum: 21600, default: 0, description: 'Slow mode in seconds' },
          nsfw: { type: 'boolean', default: false, description: 'Whether channel is NSFW' },
          topic: { type: 'string', maxLength: 1024, description: 'Channel topic' },
          userLimit: { type: 'number', minimum: 0, maximum: 99, description: 'Voice channel user limit' },
          bitrate: { type: 'number', minimum: 8000, maximum: 384000, description: 'Voice channel bitrate' },
          position: { type: 'number', minimum: 0, description: 'Channel position' }
        },
        required: ['serverId', 'name', 'type']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                serverId: { type: 'string' },
                position: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const validatedData = createChannelSchema.parse(request.body);
      const {
        serverId,
        name,
        description,
        type,
        parentId,
        isPrivate,
        slowMode,
        nsfw,
        topic,
        userLimit,
        bitrate,
        position
      } = validatedData;

      // Check server membership and permissions
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: {
          id: true,
          ownerId: true,
          name: true
        }
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found"
        });
      }

      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId,
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
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server"
        });
      }

      // Check permissions (owner or manage channels permission)
      const hasPermission = server.ownerId === request.userId ||
        serverMember.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(CHANNEL_PERMISSIONS.MANAGE_CHANNELS)
        );

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to create channels"
        });
      }

      // Validate parent category if specified
      if (parentId) {
        const parent = await prisma.channel.findFirst({
          where: {
            id: parentId,
            serverId,
            type: 'GUILD_CATEGORY'
          }
        });
        
        if (!parent) {
          return reply.code(400).send({
            success: false,
            error: "Invalid parent category"
          });
        }
      }

      // Validate voice channel specific fields
      if (['GUILD_VOICE', 'GUILD_STAGE_VOICE'].includes(type)) {
        if (userLimit !== undefined && (userLimit < 0 || userLimit > 99)) {
          return reply.code(400).send({
            success: false,
            error: "User limit must be between 0 and 99"
          });
        }
        if (bitrate !== undefined && (bitrate < 8000 || bitrate > 384000)) {
          return reply.code(400).send({
            success: false,
            error: "Bitrate must be between 8000 and 384000"
          });
        }
      }

      // Get next position if not specified
      let finalPosition = position;
      if (finalPosition === undefined) {
        const lastChannel = await prisma.channel.findFirst({
          where: { serverId, parentId },
          orderBy: { position: 'desc' }
        });
        
        finalPosition = (lastChannel?.position || 0) + 1;
      }

      // Create channel with transaction to ensure consistency
      const channel = await prisma.$transaction(async (tx) => {
        // Clean channel name based on type
        let cleanName = name;
        if (type !== 'GUILD_CATEGORY') {
          cleanName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
        }

        // Create the channel
        const newChannel = await tx.channel.create({
          data: {
            serverId,
            name: cleanName,
            description,
            type: type as ChannelType,
            parentId,
            position: finalPosition,
            isPrivate,
            slowMode,
            nsfw,
            topic,
            userLimit,
            bitrate
          },
          include: {
            server: {
              select: {
                id: true,
                name: true
              }
            },
            parent: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Log channel creation in audit log
        await tx.auditLog.create({
          data: {
            serverId,
            userId: request.userId!,
            actionType: 2, // CHANNEL_CREATE
            targetId: newChannel.id,
            reason: "Channel created",
            options: {
              channelName: newChannel.name,
              channelType: newChannel.type,
              parentId: newChannel.parentId
            }
          }
        });

        return newChannel;
      });

      // Emit socket event for real-time updates
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.to(`server:${serverId}`).emit('channelCreate', {
          channel,
          serverId
        });
      }

      return reply.code(201).send({
        success: true,
        data: channel,
        message: "Channel created successfully"
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }

      fastify.log.error({ error, userId: request.userId }, 'Channel creation failed');
      return reply.code(500).send({
        success: false,
        error: "Failed to create channel. Please try again.",
        debug: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * @swagger
   * /channels/{channelId}:
   *   get:
   *     tags: [channels]
   *     summary: Get channel details
   *     security:
   *       - Bearer: []
   */
  fastify.get('/:channelId', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId
      })
    ],
    schema: {
      tags: ['channels'],
      summary: 'Get channel details',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          channelId: { type: 'string' }
        },
        required: ['channelId']
      }
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
            position: true
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    if (!channel) {
      throwNotFound('Channel');
    }

    // Check if user is a member of the server or if it's a DM channel
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

      // Check if channel is private and user has access
      if (channel.isPrivate) {
        // Private channels require specific permissions - for now allow server members
        // Channel-specific permissions can be implemented with permission overwrites
      }
    }

    reply.send({
      success: true,
      data: channel
    });
  });

  /**
   * @swagger
   * /channels/{channelId}:
   *   patch:
   *     tags: [channels]
   *     summary: Update channel
   *     security:
   *       - Bearer: []
   */
  fastify.patch('/:channelId', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId,
        body: z.object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().max(500).nullable().optional(),
          topic: z.string().max(1024).nullable().optional(),
          position: z.number().min(0).optional(),
          isPrivate: z.boolean().optional(),
          slowMode: z.number().min(0).max(21600).optional(),
          nsfw: z.boolean().optional(),
          parentId: z.string().cuid().nullable().optional()
        })
      })
    ],
    schema: {
      tags: ['channels'],
      summary: 'Update channel',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;
    const updateData = request.body as any;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          select: {
            id: true,
            ownerId: true
          }
        }
      }
    });

    if (!channel) {
      throwNotFound('Channel');
    }

    if (!channel.serverId) {
      throwBadRequest('Cannot update DM channels');
    }

    // Check permissions
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

    const hasPermission = channel.server!.ownerId === request.userId ||
      serverMember.roles.some(memberRole => 
        memberRole.role.permissions & BigInt(0x10) // MANAGE_CHANNELS
      );

    if (!hasPermission) {
      throwForbidden('Insufficient permissions to update channels');
    }

    // Validate parent if changing
    if (updateData.parentId !== undefined) {
      if (updateData.parentId && updateData.parentId !== channel.parentId) {
        const parent = await prisma.channel.findFirst({
          where: {
            id: updateData.parentId,
            serverId: channel.serverId,
            type: 'GUILD_CATEGORY'
          }
        });
        
        if (!parent) {
          throwBadRequest('Invalid parent category');
        }
      }
    }

    // Clean name if provided
    if (updateData.name) {
      updateData.name = updateData.name.toLowerCase().replace(/\s+/g, '-');
    }

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: updateData,
      include: {
        server: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Emit socket event for real-time updates
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`server:${channel.serverId}`).emit('channelUpdate', {
        channel: updatedChannel,
        serverId: channel.serverId
      });
    }

    reply.send({
      success: true,
      data: updatedChannel
    });
  });

  /**
   * @swagger
   * /channels/{channelId}:
   *   delete:
   *     tags: [channels]
   *     summary: Delete channel
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/:channelId', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId
      })
    ],
    schema: {
      tags: ['channels'],
      summary: 'Delete channel',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          select: {
            id: true,
            ownerId: true
          }
        },
        children: {
          select: {
            id: true
          }
        }
      }
    });

    if (!channel) {
      throwNotFound('Channel');
    }

    if (!channel.serverId) {
      throwBadRequest('Cannot delete DM channels');
    }

    // Check permissions
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

    const hasPermission = channel.server!.ownerId === request.userId ||
      serverMember.roles.some(memberRole => 
        memberRole.role.permissions & BigInt(0x10) // MANAGE_CHANNELS
      );

    if (!hasPermission) {
      throwForbidden('Insufficient permissions to delete channels');
    }

    // Cannot delete categories with children
    if (channel.type === 'GUILD_CATEGORY' && channel.children.length > 0) {
      throwBadRequest('Cannot delete category with child channels');
    }

    // Delete channel
    await prisma.channel.delete({
      where: { id: channelId }
    });

    // Emit socket event for real-time updates
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`server:${channel.serverId}`).emit('channelDelete', {
        channelId,
        serverId: channel.serverId
      });
    }

    reply.send({
      success: true,
      message: 'Channel deleted successfully'
    });
  });

  /**
   * @swagger
   * /channels/{channelId}/messages:
   *   get:
   *     tags: [channels]
   *     summary: Get channel messages
   *     security:
   *       - Bearer: []
   */
  fastify.get('/:channelId/messages', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId,
        query: z.object({
          ...commonSchemas.pagination.shape,
          before: z.string().cuid().optional(),
          after: z.string().cuid().optional(),
          around: z.string().cuid().optional()
        })
      })
    ],
    schema: {
      tags: ['channels'],
      summary: 'Get channel messages',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;
    const { page = 1, limit = 50, before, after, around } = request.query as any;

    // Check channel access
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        serverId: true,
        type: true,
        isPrivate: true
      }
    });

    if (!channel) {
      throwNotFound('Channel');
    }

    // Check server membership for server channels
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

    // Build where clause for pagination
    let whereClause: any = { channelId };
    let orderBy: any = { createdAt: 'desc' };

    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    } else if (after) {
      whereClause.createdAt = { gt: new Date(after) };
      orderBy = { createdAt: 'asc' };
    } else if (around) {
      // Get messages around a specific message
      const aroundMessage = await prisma.message.findUnique({
        where: { id: around },
        select: { createdAt: true }
      });
      
      if (aroundMessage) {
        whereClause = {
          channelId,
          OR: [
            { 
              createdAt: { 
                gte: new Date(aroundMessage.createdAt.getTime() - 30 * 60 * 1000) 
              }
            },
            { 
              createdAt: { 
                lte: new Date(aroundMessage.createdAt.getTime() + 30 * 60 * 1000) 
              }
            }
          ]
        };
      }
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
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
          },
          _count: {
            select: {
              reactions: true,
              replies: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.message.count({ where: { channelId } })
    ]);

    // Reverse messages if ordered by asc (for after pagination)
    if (after && orderBy.createdAt === 'asc') {
      messages.reverse();
    }

    reply.send({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total
        }
      }
    });
  });

  /**
   * @swagger
   * /channels/{channelId}/typing:
   *   post:
   *     tags: [channels]
   *     summary: Send typing indicator
   *     security:
   *       - Bearer: []
   */
  fastify.post('/:channelId/typing', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId
      })
    ],
    schema: {
      tags: ['channels'],
      summary: 'Send typing indicator',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;

    // Check channel access
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        serverId: true
      }
    });

    if (!channel) {
      throwNotFound('Channel');
    }

    // Check server membership for server channels
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

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: request.userId! },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true
      }
    });

    // Emit typing event
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`channel:${channelId}`).emit('typingStart', {
        channelId,
        user,
        timestamp: new Date().toISOString()
      });
    }

    reply.send({
      success: true,
      message: 'Typing indicator sent'
    });
  });

  /**
   * @swagger
   * /channels/{channelId}/permissions:
   *   get:
   *     tags: [channels]
   *     summary: Get channel permissions
   *     security:
   *       - Bearer: []
   */
  fastify.get('/:channelId/permissions', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId
      })
    ],
    schema: {
      tags: ['channels'],
      summary: 'Get channel permissions',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;

    const permissions = await prisma.channelPermission.findMany({
      where: { channelId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    reply.send({
      success: true,
      data: permissions
    });
  });

  /**
   * @swagger
   * /channels/{channelId}/webhooks:
   *   get:
   *     tags: [channels]
   *     summary: Get channel webhooks
   *     security:
   *       - Bearer: []
   */
  fastify.get('/:channelId/webhooks', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.channelId
      })
    ],
    schema: {
      tags: ['channels'],
      summary: 'Get channel webhooks',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { channelId } = request.params as any;

    // Webhooks functionality - placeholder implementation
    const webhooks: any[] = []; // Will implement webhooks table when needed
    
    reply.send({
      success: true,
      data: webhooks,
      message: 'No webhooks configured for this channel'
    });
  });
}
