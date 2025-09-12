import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Enhanced validation schema for channel permission operations
const channelPermissionSchema = z.object({
  roleId: z.string().cuid("Invalid role ID").optional(),
  userId: z.string().cuid("Invalid user ID").optional(),
  allow: z.string().transform(val => BigInt(val)).optional(),
  deny: z.string().transform(val => BigInt(val)).optional()
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

export default async function channelPermissionRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

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
    schema: {
      tags: ['channels'],
      summary: 'Get channel permissions',
      description: 'Get all permission overwrites for a channel',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          channelId: { type: 'string' }
        },
        required: ['channelId']
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
                  channelId: { type: 'string' },
                  roleId: { type: 'string' },
                  userId: { type: 'string' },
                  allow: { type: 'string' },
                  deny: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { channelId } = request.params as any;

      // Check if user has permission to view channel permissions
      const hasPermission = await checkChannelPermissions(
        request.userId!,
        channelId,
        BigInt(CHANNEL_PERMISSIONS.VIEW_CHANNEL | CHANNEL_PERMISSIONS.MANAGE_PERMISSIONS)
      );

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to view channel permissions"
        });
      }

      const permissions = await prisma.channelPermission.findMany({
        where: { channelId },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
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

      reply.send({
        success: true,
        data: permissions
      });
    } catch (error) {
      fastify.log.error({ error, channelId: request.params.channelId }, 'Failed to get channel permissions');
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve channel permissions"
      });
    }
  });

  /**
   * @swagger
   * /channels/{channelId}/permissions:
   *   put:
   *     tags: [channels]
   *     summary: Update channel permission overwrite
   *     security:
   *       - Bearer: []
   */
  fastify.put('/:channelId/permissions', {
    schema: {
      tags: ['channels'],
      summary: 'Update channel permission overwrite',
      description: 'Create or update a permission overwrite for a role or user in a channel',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          channelId: { type: 'string' }
        },
        required: ['channelId']
      },
      body: {
        type: 'object',
        properties: {
          roleId: { type: 'string', description: 'Role ID (either roleId or userId required)' },
          userId: { type: 'string', description: 'User ID (either roleId or userId required)' },
          allow: { type: 'string', description: 'Allowed permissions as bigint string' },
          deny: { type: 'string', description: 'Denied permissions as bigint string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                channelId: { type: 'string' },
                allow: { type: 'string' },
                deny: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { channelId } = request.params as any;
      const validatedData = channelPermissionSchema.parse(request.body);
      const { roleId, userId, allow, deny } = validatedData;

      // Check if user has permission to manage channel permissions
      const hasPermission = await checkChannelPermissions(
        request.userId!,
        channelId,
        BigInt(CHANNEL_PERMISSIONS.MANAGE_PERMISSIONS)
      );

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to manage channel permissions"
        });
      }

      // Validate that the channel exists and is in a server
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: {
          id: true,
          serverId: true
        }
      });

      if (!channel || !channel.serverId) {
        return reply.code(404).send({
          success: false,
          error: "Channel not found or is not a server channel"
        });
      }

      // If roleId is provided, validate that the role exists in the server
      if (roleId) {
        const role = await prisma.role.findFirst({
          where: {
            id: roleId,
            serverId: channel.serverId
          }
        });

        if (!role) {
          return reply.code(400).send({
            success: false,
            error: "Role not found in this server"
          });
        }
      }

      // If userId is provided, validate that the user is a member of the server
      if (userId) {
        const member = await prisma.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId: channel.serverId,
              userId
            }
          }
        });

        if (!member) {
          return reply.code(400).send({
            success: false,
            error: "User is not a member of this server"
          });
        }
      }

      // Create or update permission overwrite
      const permission = await prisma.channelPermission.upsert({
        where: {
          channelId_roleId_userId: {
            channelId,
            roleId: roleId || null,
            userId: userId || null
          }
        },
        update: {
          allow: allow || BigInt(0),
          deny: deny || BigInt(0)
        },
        create: {
          channelId,
          roleId,
          userId,
          allow: allow || BigInt(0),
          deny: deny || BigInt(0)
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
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

      // Log the permission change in audit log
      await prisma.auditLog.create({
        data: {
          serverId: channel.serverId,
          userId: request.userId!,
          action: "CHANNEL_PERMISSION_UPDATE",
          targetId: channelId,
          metadata: {
            targetRoleId: roleId,
            targetUserId: userId,
            allowPermissions: allow?.toString(),
            denyPermissions: deny?.toString()
          }
        }
      });

      // Emit socket event for real-time updates
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.to(`server:${channel.serverId}`).emit('channelPermissionUpdate', {
          channelId,
          permission,
          serverId: channel.serverId
        });
      }

      return reply.send({
        success: true,
        data: permission,
        message: "Channel permissions updated successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }

      fastify.log.error({ error, channelId: request.params.channelId }, 'Failed to update channel permissions');
      return reply.code(500).send({
        success: false,
        error: "Failed to update channel permissions"
      });
    }
  });

  /**
   * @swagger
   * /channels/{channelId}/permissions/{overwriteId}:
   *   delete:
   *     tags: [channels]
   *     summary: Delete channel permission overwrite
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/:channelId/permissions/:overwriteId', {
    schema: {
      tags: ['channels'],
      summary: 'Delete channel permission overwrite',
      description: 'Remove a permission overwrite from a channel',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          channelId: { type: 'string' },
          overwriteId: { type: 'string' }
        },
        required: ['channelId', 'overwriteId']
      }
    }
  }, async (request, reply) => {
    try {
      const { channelId, overwriteId } = request.params as any;

      // Check if user has permission to manage channel permissions
      const hasPermission = await checkChannelPermissions(
        request.userId!,
        channelId,
        BigInt(CHANNEL_PERMISSIONS.MANAGE_PERMISSIONS)
      );

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to manage channel permissions"
        });
      }

      // Validate that the permission overwrite exists
      const permission = await prisma.channelPermission.findUnique({
        where: { id: overwriteId },
        include: {
          channel: {
            select: {
              serverId: true
            }
          }
        }
      });

      if (!permission || permission.channelId !== channelId) {
        return reply.code(404).send({
          success: false,
          error: "Permission overwrite not found"
        });
      }

      // Delete the permission overwrite
      await prisma.channelPermission.delete({
        where: { id: overwriteId }
      });

      // Log the permission deletion in audit log
      if (permission.channel?.serverId) {
        await prisma.auditLog.create({
          data: {
            serverId: permission.channel.serverId,
            userId: request.userId!,
            action: "CHANNEL_PERMISSION_DELETE",
            targetId: channelId,
            metadata: {
              deletedOverwriteId: overwriteId,
              targetRoleId: permission.roleId,
              targetUserId: permission.userId
            }
          }
        });

        // Emit socket event for real-time updates
        if (fastify.socketIntegration) {
          fastify.socketIntegration.io.to(`server:${permission.channel.serverId}`).emit('channelPermissionDelete', {
            channelId,
            overwriteId,
            serverId: permission.channel.serverId
          });
        }
      }

      return reply.send({
        success: true,
        message: "Channel permission overwrite deleted successfully"
      });
    } catch (error) {
      fastify.log.error({ error, channelId: request.params.channelId }, 'Failed to delete channel permission');
      return reply.code(500).send({
        success: false,
        error: "Failed to delete channel permission overwrite"
      });
    }
  });
}