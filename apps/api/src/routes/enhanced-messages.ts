import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware, serverContextMiddleware } from "../middleware/auth";
import { throwBadRequest, throwNotFound, throwForbidden, throwUnauthorized } from "../middleware/errorHandler";

// Validation schemas
const MessageContentSchema = z.object({
  content: z.string()
    .min(1, "Message content cannot be empty")
    .max(4000, "Message content cannot exceed 4000 characters")
    .refine(content => content.trim().length > 0, "Message content cannot be only whitespace"),
  
  channelId: z.string()
    .uuid("Invalid channel ID format"),
  
  replyToId: z.string()
    .uuid("Invalid reply message ID format")
    .optional(),
  
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    size: z.number().positive(),
    contentType: z.string(),
    url: z.string().url()
  })).max(10, "Cannot attach more than 10 files").optional(),
  
  embeds: z.array(z.object({
    type: z.enum(['rich', 'image', 'video', 'link']),
    title: z.string().max(256).optional(),
    description: z.string().max(4096).optional(),
    url: z.string().url().optional(),
    color: z.number().int().min(0).max(16777215).optional(), // Hex color as number
    image: z.object({
      url: z.string().url(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional()
    }).optional(),
    thumbnail: z.object({
      url: z.string().url(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional()
    }).optional(),
    fields: z.array(z.object({
      name: z.string().max(256),
      value: z.string().max(1024),
      inline: z.boolean().default(false)
    })).max(25).optional()
  })).max(10, "Cannot have more than 10 embeds").optional()
});

const MessageQuerySchema = z.object({
  before: z.string()
    .datetime("Invalid before timestamp")
    .optional(),
  
  after: z.string()
    .datetime("Invalid after timestamp")
    .optional(),
  
  limit: z.coerce.number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(50),
  
  around: z.string()
    .uuid("Invalid message ID for around parameter")
    .optional(),
  
  includeThreads: z.coerce.boolean().default(false),
  
  search: z.string()
    .min(2, "Search query must be at least 2 characters")
    .max(100, "Search query cannot exceed 100 characters")
    .optional()
});

const ReactionSchema = z.object({
  emoji: z.string()
    .min(1, "Emoji cannot be empty")
    .max(100, "Emoji identifier too long")
    .refine(emoji => {
      // Basic emoji validation - can be enhanced with emoji library
      return /^(\p{Emoji}|\w+:\d+)$/u.test(emoji);
    }, "Invalid emoji format")
});

const MessageUpdateSchema = z.object({
  content: z.string()
    .min(1, "Message content cannot be empty")
    .max(4000, "Message content cannot exceed 4000 characters"),
  
  embeds: z.array(z.object({
    type: z.enum(['rich', 'image', 'video', 'link']),
    title: z.string().max(256).optional(),
    description: z.string().max(4096).optional(),
    url: z.string().url().optional(),
    color: z.number().int().min(0).max(16777215).optional()
  })).max(10).optional()
});

/**
 * Enhanced Messages API with comprehensive Discord-like functionality
 */
const enhancedMessageRoutes: FastifyPluginAsync = async (fastify) => {
  
  /**
   * @swagger
   * /api/v1/messages/channel/{channelId}:
   *   get:
   *     tags: [messages]
   *     summary: Get messages from a channel
   *     description: Retrieve messages from a specific channel with pagination, search, and filtering
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: channelId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Channel ID
   *       - name: before
   *         in: query
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Get messages before this timestamp
   *       - name: after
   *         in: query
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Get messages after this timestamp
   *       - name: around
   *         in: query
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Get messages around this message ID
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 50
   *         description: Number of messages to return
   *       - name: search
   *         in: query
   *         schema:
   *           type: string
   *           minLength: 2
   *           maxLength: 100
   *         description: Search query for message content
   *       - name: includeThreads
   *         in: query
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include thread messages
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     messages:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Message'
   *                     hasMore:
   *                       type: boolean
   *                     totalCount:
   *                       type: integer
   *       403:
   *         description: Access denied to channel
   *       404:
   *         description: Channel not found
   */
  fastify.get('/channel/:channelId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['messages'],
      summary: 'Get messages from a channel',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          channelId: { type: 'string', format: 'uuid' }
        },
        required: ['channelId']
      },
      querystring: {
        type: 'object',
        properties: {
          before: { type: 'string', format: 'date-time' },
          after: { type: 'string', format: 'date-time' },
          around: { type: 'string', format: 'uuid' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          search: { type: 'string', minLength: 2, maxLength: 100 },
          includeThreads: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { channelId } = request.params;
      const query = MessageQuerySchema.parse(request.query);

      // Verify channel access
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { server: true }
      });

      if (!channel) {
        throwNotFound('Channel');
      }

      // Verify server membership
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: channel.serverId,
            userId: request.userId
          }
        }
      });

      if (!member) {
        throwForbidden('Access denied to this channel');
      }

      // Build query filters
      let whereClause: any = { channelId };
      
      if (query.search) {
        whereClause.content = {
          contains: query.search,
          mode: 'insensitive'
        };
      }

      if (query.around) {
        // Get messages around a specific message
        const aroundMessage = await prisma.message.findUnique({
          where: { id: query.around },
          select: { createdAt: true }
        });

        if (aroundMessage) {
          const halfLimit = Math.floor(query.limit / 2);
          
          // Get messages before and after the target message
          const [messagesBefore, messagesAfter] = await Promise.all([
            prisma.message.findMany({
              where: {
                ...whereClause,
                createdAt: { lt: aroundMessage.createdAt }
              },
              include: messageIncludes,
              orderBy: { createdAt: 'desc' },
              take: halfLimit
            }),
            prisma.message.findMany({
              where: {
                ...whereClause,
                createdAt: { gte: aroundMessage.createdAt }
              },
              include: messageIncludes,
              orderBy: { createdAt: 'asc' },
              take: query.limit - halfLimit
            })
          ]);

          const allMessages = [
            ...messagesBefore.reverse(),
            ...messagesAfter
          ];

          return reply.send({
            success: true,
            data: {
              messages: allMessages,
              hasMore: allMessages.length === query.limit,
              totalCount: await prisma.message.count({ where: whereClause })
            }
          });
        }
      }

      // Handle before/after pagination
      if (query.before) {
        whereClause.createdAt = { lt: new Date(query.before) };
      }
      
      if (query.after) {
        whereClause.createdAt = { gt: new Date(query.after) };
      }

      // Get messages with full includes
      const messages = await prisma.message.findMany({
        where: whereClause,
        include: messageIncludes,
        orderBy: { createdAt: query.after ? 'asc' : 'desc' },
        take: query.limit + 1 // Take one extra to check if there are more
      });

      const hasMore = messages.length > query.limit;
      if (hasMore) {
        messages.pop(); // Remove the extra message
      }

      // Reverse if we were going backwards
      if (!query.after) {
        messages.reverse();
      }

      // Get total count for search results
      const totalCount = query.search ? 
        await prisma.message.count({ where: whereClause }) : 
        undefined;

      return reply.send({
        success: true,
        data: {
          messages,
          hasMore,
          ...(totalCount !== undefined && { totalCount })
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      fastify.log.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  });

  /**
   * @swagger
   * /api/v1/messages:
   *   post:
   *     tags: [messages]
   *     summary: Send a message
   *     description: Send a new message to a channel
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [channelId, content]
   *             properties:
   *               channelId:
   *                 type: string
   *                 format: uuid
   *                 description: Target channel ID
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 4000
   *                 description: Message content
   *               replyToId:
   *                 type: string
   *                 format: uuid
   *                 description: ID of message being replied to
   *               attachments:
   *                 type: array
   *                 maxItems: 10
   *                 items:
   *                   $ref: '#/components/schemas/Attachment'
   *               embeds:
   *                 type: array
   *                 maxItems: 10
   *                 items:
   *                   $ref: '#/components/schemas/Embed'
   *     responses:
   *       201:
   *         description: Message sent successfully
   *       400:
   *         description: Invalid request data
   *       403:
   *         description: Access denied to channel
   *       429:
   *         description: Rate limit exceeded
   */
  fastify.post('/', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['messages'],
      summary: 'Send a message',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const data = MessageContentSchema.parse(request.body);

      // Rate limiting check
      const rateLimitKey = `message_rate:${request.userId}:${data.channelId}`;
      const currentCount = await (fastify as any).redis.get(rateLimitKey) || 0;
      
      if (parseInt(currentCount) >= 10) { // 10 messages per minute
        return reply.code(429).send({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: 60
        });
      }

      // Verify channel access
      const channel = await prisma.channel.findUnique({
        where: { id: data.channelId },
        include: { server: true }
      });

      if (!channel) {
        throwNotFound('Channel');
      }

      // Verify server membership and permissions
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: channel.serverId,
            userId: request.userId
          }
        },
        include: {
          roles: {
            include: { role: true }
          }
        }
      });

      if (!member) {
        throwForbidden('Access denied to this channel');
      }

      // Check if user can send messages (not muted, has permissions, etc.)
      if (member.isMuted) {
        throwForbidden('You are muted in this server');
      }

      // Validate reply message if specified
      if (data.replyToId) {
        const replyMessage = await prisma.message.findUnique({
          where: { 
            id: data.replyToId,
            channelId: data.channelId // Ensure reply is in same channel
          }
        });

        if (!replyMessage) {
          throwBadRequest('Reply message not found in this channel');
        }
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          channelId: data.channelId,
          userId: request.userId,
          content: data.content,
          replyToId: data.replyToId,
          attachments: data.attachments ? JSON.stringify(data.attachments) : null,
          embeds: data.embeds ? JSON.stringify(data.embeds) : null
        },
        include: messageIncludes
      });

      // Increment rate limit counter
      await (fastify as any).redis.multi()
        .incr(rateLimitKey)
        .expire(rateLimitKey, 60)
        .exec();

      // Broadcast message via Socket.io
      (fastify as any).io.to(`channel-${data.channelId}`).emit('new-message', message);

      // Queue for processing (mentions, notifications, indexing, etc.)
      await (fastify as any).queues.messages.add('process-message', {
        messageId: message.id,
        channelId: data.channelId,
        serverId: channel.serverId,
        userId: request.userId
      });

      return reply.code(201).send({
        success: true,
        data: message
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      fastify.log.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  });

  /**
   * @swagger
   * /api/v1/messages/{messageId}:
   *   get:
   *     tags: [messages]
   *     summary: Get a specific message
   *     description: Retrieve a specific message by ID
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: messageId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Message retrieved successfully
   *       403:
   *         description: Access denied
   *       404:
   *         description: Message not found
   */
  fastify.get('/:messageId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['messages'],
      summary: 'Get a specific message',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          messageId: { type: 'string', format: 'uuid' }
        },
        required: ['messageId']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { messageId } = request.params;

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          ...messageIncludes,
          channel: { include: { server: true } }
        }
      });

      if (!message) {
        throwNotFound('Message');
      }

      // Verify access to the channel
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
            userId: request.userId
          }
        }
      });

      if (!member) {
        throwForbidden('Access denied to this message');
      }

      return reply.send({
        success: true,
        data: message
      });

    } catch (error) {
      if (error.name === 'AppError') {
        throw error;
      }
      
      fastify.log.error('Error fetching message:', error);
      throw new Error('Failed to fetch message');
    }
  });

  /**
   * @swagger
   * /api/v1/messages/{messageId}:
   *   patch:
   *     tags: [messages]
   *     summary: Edit a message
   *     description: Edit a message (only allowed by message author within 5 minutes)
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: messageId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content]
   *             properties:
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 4000
   *               embeds:
   *                 type: array
   *                 maxItems: 10
   *     responses:
   *       200:
   *         description: Message edited successfully
   *       400:
   *         description: Invalid request or message too old
   *       403:
   *         description: Not authorized to edit this message
   *       404:
   *         description: Message not found
   */
  fastify.patch('/:messageId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['messages'],
      summary: 'Edit a message',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { messageId } = request.params;
      const data = MessageUpdateSchema.parse(request.body);

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { channel: { include: { server: true } } }
      });

      if (!message) {
        throwNotFound('Message');
      }

      if (message.userId !== request.userId) {
        throwForbidden('You can only edit your own messages');
      }

      // Check if message is too old to edit (5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (message.createdAt < fiveMinutesAgo) {
        throwBadRequest('Message is too old to edit (5 minute limit)');
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: data.content,
          embeds: data.embeds ? JSON.stringify(data.embeds) : message.embeds,
          editedAt: new Date()
        },
        include: messageIncludes
      });

      // Broadcast update
      (fastify as any).io.to(`channel-${message.channelId}`).emit('message-updated', updatedMessage);

      return reply.send({
        success: true,
        data: updatedMessage
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      fastify.log.error('Error editing message:', error);
      throw new Error('Failed to edit message');
    }
  });

  /**
   * @swagger
   * /api/v1/messages/{messageId}:
   *   delete:
   *     tags: [messages]
   *     summary: Delete a message
   *     description: Delete a message (message author or server moderators)
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: messageId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Message deleted successfully
   *       403:
   *         description: Not authorized to delete this message
   *       404:
   *         description: Message not found
   */
  fastify.delete('/:messageId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['messages'],
      summary: 'Delete a message',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { messageId } = request.params;

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          channel: { include: { server: true } },
          user: { select: { id: true, username: true } }
        }
      });

      if (!message) {
        throwNotFound('Message');
      }

      // Check if user can delete (author, server owner, or has manage messages permission)
      const canDelete = message.userId === request.userId || 
                       message.channel.server.ownerId === request.userId;

      if (!canDelete) {
        // Check for manage messages permission
        const member = await prisma.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId: message.channel.serverId,
              userId: request.userId
            }
          },
          include: {
            roles: { include: { role: true } }
          }
        });

        const hasManageMessages = member?.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x2000) // MANAGE_MESSAGES permission
        );

        if (!hasManageMessages) {
          throwForbidden('You do not have permission to delete this message');
        }
      }

      // Delete message and all related data
      await prisma.$transaction([
        prisma.reaction.deleteMany({ where: { messageId } }),
        prisma.message.delete({ where: { id: messageId } })
      ]);

      // Broadcast deletion
      (fastify as any).io.to(`channel-${message.channelId}`).emit('message-deleted', {
        messageId,
        channelId: message.channelId,
        deletedBy: request.userId
      });

      return reply.send({
        success: true,
        message: 'Message deleted successfully'
      });

    } catch (error) {
      if (error.name === 'AppError') {
        throw error;
      }
      
      fastify.log.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  });

  /**
   * @swagger
   * /api/v1/messages/{messageId}/reactions/{emoji}:
   *   put:
   *     tags: [messages]
   *     summary: Add reaction to message
   *     description: Add or remove a reaction to/from a message
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: messageId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - name: emoji
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Reaction toggled successfully
   *       403:
   *         description: Access denied
   *       404:
   *         description: Message not found
   */
  fastify.put('/:messageId/reactions/:emoji', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['messages'],
      summary: 'Toggle message reaction',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { messageId, emoji } = request.params;

      // Validate emoji format
      const { emoji: validatedEmoji } = ReactionSchema.parse({ emoji });

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { channel: { include: { server: true } } }
      });

      if (!message) {
        throwNotFound('Message');
      }

      // Verify access
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
            userId: request.userId
          }
        }
      });

      if (!member) {
        throwForbidden('Access denied to this message');
      }

      // Check if reaction already exists
      const existingReaction = await prisma.reaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId: request.userId,
            emoji: validatedEmoji
          }
        }
      });

      let action: 'added' | 'removed';
      
      if (existingReaction) {
        // Remove existing reaction
        await prisma.reaction.delete({
          where: { id: existingReaction.id }
        });
        action = 'removed';
      } else {
        // Add new reaction
        await prisma.reaction.create({
          data: {
            messageId,
            userId: request.userId,
            emoji: validatedEmoji
          }
        });
        action = 'added';
      }

      // Get updated reaction counts
      const reactionCounts = await prisma.reaction.groupBy({
        by: ['emoji'],
        where: { messageId },
        _count: { emoji: true }
      });

      // Broadcast reaction update
      (fastify as any).io.to(`channel-${message.channelId}`).emit('reaction-updated', {
        messageId,
        emoji: validatedEmoji,
        userId: request.userId,
        action,
        counts: reactionCounts.reduce((acc, r) => ({
          ...acc,
          [r.emoji]: r._count.emoji
        }), {})
      });

      return reply.send({
        success: true,
        action,
        emoji: validatedEmoji,
        reactionCounts: reactionCounts.reduce((acc, r) => ({
          ...acc,
          [r.emoji]: r._count.emoji
        }), {})
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid emoji format',
          details: error.errors
        });
      }
      
      if (error.name === 'AppError') {
        throw error;
      }
      
      fastify.log.error('Error toggling reaction:', error);
      throw new Error('Failed to toggle reaction');
    }
  });
};

// Message include configuration for consistent data fetching
const messageIncludes = {
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      isVerified: true
    }
  },
  reactions: {
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
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
} as const;

export default enhancedMessageRoutes;