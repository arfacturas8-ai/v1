import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional()
});

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['TEXT', 'VOICE', 'ANNOUNCEMENT']),
  description: z.string().optional(),
  categoryId: z.string().optional()
});

export default async function serverRoutes(fastify: FastifyInstance) {
  // Get user's servers
  fastify.get('/', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const userId = (request as any).user.id;
    
    const servers = await prisma.server.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        _count: {
          select: { members: true, channels: true }
        }
      }
    });

    return reply.send({ servers });
  });

  // Create server
  fastify.post('/', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const userId = (request as any).user.id;
    const { name, description, icon } = request.body as any;

    const server = await prisma.server.create({
      data: {
        name,
        description,
        icon,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
            permissions: 2147483647 // All permissions
          }
        },
        channels: {
          create: [
            { name: 'general', type: 'TEXT' },
            { name: 'General', type: 'VOICE' }
          ]
        }
      },
      include: {
        channels: true,
        _count: {
          select: { members: true }
        }
      }
    });

    return reply.send({ server });
  });

  // Get server details
  fastify.get('/:serverId', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { serverId } = request.params as any;
    const userId = (request as any).user.id;

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        members: {
          some: { userId }
        }
      },
      include: {
        channels: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    if (!server) {
      return reply.status(404).send({ error: 'Server not found' });
    }

    return reply.send({ server });
  });

  // Get server channels
  fastify.get('/:serverId/channels', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { serverId } = request.params as any;
    const userId = (request as any).user.id;

    // Verify membership
    const member = await prisma.serverMember.findFirst({
      where: { serverId, userId }
    });

    if (!member) {
      return reply.status(403).send({ error: 'Not a member of this server' });
    }

    const channels = await prisma.channel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' }
    });

    return reply.send({ channels });
  });

  // Create channel
  fastify.post('/:serverId/channels', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { serverId } = request.params as any;
    const userId = (request as any).user.id;
    const { name, type, description, categoryId } = request.body as any;

    // Check permissions
    const member = await prisma.serverMember.findFirst({
      where: { serverId, userId }
    });

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }

    const channel = await prisma.channel.create({
      data: {
        serverId,
        name,
        type,
        description,
        categoryId
      }
    });

    return reply.send({ channel });
  });

  // Join server
  fastify.post('/:serverId/join', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { serverId } = request.params as any;
    const userId = (request as any).user.id;

    // Check if already member
    const existing = await prisma.serverMember.findFirst({
      where: { serverId, userId }
    });

    if (existing) {
      return reply.status(400).send({ error: 'Already a member' });
    }

    const member = await prisma.serverMember.create({
      data: {
        serverId,
        userId,
        role: 'MEMBER'
      }
    });

    return reply.send({ success: true, member });
  });

  // Leave server
  fastify.post('/:serverId/leave', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { serverId } = request.params as any;
    const userId = (request as any).user.id;

    const member = await prisma.serverMember.findFirst({
      where: { serverId, userId }
    });

    if (!member) {
      return reply.status(404).send({ error: 'Not a member' });
    }

    if (member.role === 'OWNER') {
      return reply.status(400).send({ error: 'Owner cannot leave server' });
    }

    await prisma.serverMember.delete({
      where: { id: member.id }
    });

    return reply.send({ success: true });
  });

  // Get channel messages
  fastify.get('/channels/:channelId/messages', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { channelId } = request.params as any;
    const { limit = 50, before } = request.query as any;
    const userId = (request as any).user.id;

    // Verify access
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        server: {
          members: {
            some: { userId }
          }
        }
      }
    });

    if (!channel) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && { id: { lt: before } })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            displayName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    return reply.send({ messages: messages.reverse() });
  });

  // Send message
  fastify.post('/channels/:channelId/messages', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { channelId } = request.params as any;
    const { content } = request.body as any;
    const userId = (request as any).user.id;

    // Verify access
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        server: {
          members: {
            some: { userId }
          }
        }
      }
    });

    if (!channel) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const message = await prisma.message.create({
      data: {
        channelId,
        userId,
        content
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            displayName: true
          }
        }
      }
    });

    // Emit to Socket.IO
    fastify.io?.to(`channel:${channelId}`).emit('message', message);

    return reply.send({ message });
  });
}
