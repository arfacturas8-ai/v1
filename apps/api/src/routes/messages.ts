import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { validate, validationSchemas, commonSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwForbidden, throwNotFound } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess, sendPaginated, ErrorResponses, sendCreated } from '../utils/responses';
import { paginationQuerySchema, createPaginatedResult } from '../utils/pagination';
import { z } from 'zod';

export default async function messageRoutes(fastify: FastifyInstance) {
  
  /**
   * @swagger
   * /messages:
   *   get:
   *     tags: [messages]
   *     summary: List messages in a channel
   *     description: Get all messages for a specific channel
   *     security:
   *       - Bearer: []
   */
  fastify.get('/', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['messages'],
      summary: 'List messages in a channel',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          channelId: { type: 'string', description: 'Channel ID to list messages for' },
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          before: { type: 'string', description: 'Get messages before this message ID' },
          after: { type: 'string', description: 'Get messages after this message ID' }
        },
        required: ['channelId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                messages: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      content: { type: 'string' },
                      channelId: { type: 'string' },
                      userId: { type: 'string' },
                      createdAt: { type: 'string' }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    page: { type: 'number' },
                    pageSize: { type: 'number' },
                    hasMore: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { channelId, page = 1, limit = 50, before, after } = request.query as any;

      if (!channelId) {
        return reply.code(400).send({
          success: false,
          error: "channelId query parameter is required"
        });
      }

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
        return reply.code(404).send({
          success: false,
          error: "Channel not found"
        });
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
          return reply.code(403).send({
            success: false,
            error: "Not a member of this server"
          });
        }
      }

      // Build where clause for pagination
      let whereClause: any = { channelId };
      let orderBy: any = { createdAt: 'desc' };

      if (before) {
        const beforeMessage = await prisma.message.findUnique({
          where: { id: before },
          select: { createdAt: true }
        });
        if (beforeMessage) {
          whereClause.createdAt = { lt: beforeMessage.createdAt };
        }
      } else if (after) {
        const afterMessage = await prisma.message.findUnique({
          where: { id: after },
          select: { createdAt: true }
        });
        if (afterMessage) {
          whereClause.createdAt = { gt: afterMessage.createdAt };
          orderBy = { createdAt: 'asc' };
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

      return reply.send({
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

    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, 'Failed to list messages');
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve messages"
      });
    }
  });

  /**
   * @swagger
   * /messages:
   *   post:
   *     tags: [messages]
   *     summary: Create a new message
   *     security:
   *       - Bearer: []
   */
  fastify.post('/', {
    preHandler: [
      authMiddleware,
      validate({
        body: validationSchemas.message.create
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Create a new message',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          channelId: { type: 'string' },
          content: { type: 'string', minLength: 1, maxLength: 4000 },
          replyToId: { type: 'string' },
          attachments: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                size: { type: 'number' },
                contentType: { type: 'string' }
              }
            }
          },
          embeds: { type: 'array', items: { type: 'object' } }
        },
        required: ['channelId', 'content']
      }
    }
  }, async (request, reply) => {
    const { 
      channelId, 
      content, 
      replyToId, 
      attachments = [], 
      embeds = [] 
    } = request.body as any;

    // Check channel access
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        serverId: true,
        type: true,
        slowMode: true,
        nsfw: true,
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

      // Check if user is muted or has send messages permission
      const canSendMessages = serverMember.roles.some(memberRole => 
        memberRole.role.permissions & BigInt(0x800) // SEND_MESSAGES
      );

      if (!canSendMessages && serverMember.communicationDisabledUntil && 
          serverMember.communicationDisabledUntil > new Date()) {
        throwForbidden('You are temporarily muted');
      }
    }

    // Check slow mode
    if (channel.slowMode > 0) {
      const lastMessage = await prisma.message.findFirst({
        where: {
          channelId,
          userId: request.userId!,
          createdAt: {
            gte: new Date(Date.now() - channel.slowMode * 1000)
          }
        }
      });

      if (lastMessage) {
        const timeLeft = channel.slowMode - (Date.now() - lastMessage.createdAt.getTime()) / 1000;
        throwBadRequest(`Slow mode active. Please wait ${Math.ceil(timeLeft)} seconds.`);
      }
    }

    // Validate reply-to message
    if (replyToId) {
      const replyToMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          channelId
        }
      });

      if (!replyToMessage) {
        throwBadRequest('Reply-to message not found in this channel');
      }
    }

    // Process mentions
    const mentionPattern = /<@!?(\w+)>/g;
    const mentions = [];
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      const userId = match[1];
      const mentionedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true }
      });

      if (mentionedUser) {
        mentions.push({
          id: mentionedUser.id,
          username: mentionedUser.username
        });
      }
    }

    // Create message
    const message = await prisma.$transaction(async (tx) => {
      // Create the message
      const newMessage = await tx.message.create({
        data: {
          channelId,
          userId: request.userId!,
          content,
          replyToId,
          mentions: mentions.length > 0 ? mentions : undefined,
          mentionEveryone: content.includes('@everyone'),
          mentionChannels: [], // Channel mentions parsing can be added later
          mentionRoles: [] // Role mentions parsing can be added later
        },
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
          }
        }
      });

      // Create attachments if any
      if (attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((attachment: any) => ({
            messageId: newMessage.id,
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            url: attachment.url,
            proxyUrl: attachment.url // Using direct URL for now
          }))
        });
      }

      // Create embeds if any
      if (embeds.length > 0) {
        await tx.messageEmbed.createMany({
          data: embeds.map((embed: any) => ({
            messageId: newMessage.id,
            title: embed.title,
            description: embed.description,
            url: embed.url,
            color: embed.color,
            footer: embed.footer,
            image: embed.image,
            thumbnail: embed.thumbnail,
            author: embed.author,
            fields: embed.fields
          }))
        });
      }

      // Update channel's last message
      await tx.channel.update({
        where: { id: channelId },
        data: { 
          lastMessageId: newMessage.id,
          updatedAt: new Date()
        }
      });

      return newMessage;
    });

    // Get complete message with attachments and embeds
    const completeMessage = await prisma.message.findUnique({
      where: { id: message.id },
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
        }
      }
    });

    // Emit real-time event
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`channel:${channelId}`).emit('messageCreate', {
        message: completeMessage,
        channelId
      });
    }

    // Index message in Elasticsearch
    if (fastify.services?.elasticsearch && completeMessage) {
      try {
        await fastify.services.elasticsearch.indexMessage(
          completeMessage.id,
          completeMessage.content,
          {
            author: {
              id: completeMessage.user.id,
              username: completeMessage.user.username,
              displayName: completeMessage.user.displayName
            },
            channel: {
              id: channelId,
              serverId: channel.serverId
            },
            timestamp: completeMessage.createdAt.toISOString(),
            mentions: completeMessage.mentions,
            attachments: completeMessage.attachments?.map(att => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size
            })) || [],
            reactions: completeMessage.reactions?.map(reaction => ({
              emoji: reaction.emoji,
              count: 1 // Initial count
            })) || []
          }
        );
        
        // Track analytics
        await fastify.services.analytics.trackMessage({
          messageId: completeMessage.id,
          serverId: channel.serverId || undefined,
          channelId,
          userId: request.userId!,
          content: completeMessage.content,
          attachments: completeMessage.attachments?.length || 0,
          mentions: mentions.length
        });
      } catch (error) {
        fastify.log.warn('Failed to index message in Elasticsearch:', error);
      }
    }

    // Send notifications for mentions
    if (mentions.length > 0) {
      for (const mention of mentions) {
        fastify.queues.notifications.add('mention', {
          type: 'mention',
          recipientId: mention.id,
          messageId: message.id,
          channelId,
          authorId: request.userId
        });
      }
    }

    reply.code(201).send({
      success: true,
      data: completeMessage
    });
  });

  /**
   * @swagger
   * /messages/{messageId}:
   *   get:
   *     tags: [messages]
   *     summary: Get message details
   *     security:
   *       - Bearer: []
   */
  fastify.get('/:messageId', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.messageId
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Get message details',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
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
        channel: {
          select: {
            id: true,
            name: true,
            serverId: true,
            type: true
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
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 5
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
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Check channel access
    if (message.channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
            userId: request.userId!
          }
        }
      });

      if (!serverMember) {
        throwForbidden('Not a member of this server');
      }
    }

    reply.send({
      success: true,
      data: message
    });
  });

  /**
   * @swagger
   * /messages/{messageId}:
   *   patch:
   *     tags: [messages]
   *     summary: Edit message
   *     security:
   *       - Bearer: []
   */
  fastify.patch('/:messageId', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.messageId,
        body: z.object({
          content: z.string().min(1).max(4000)
        })
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Edit message',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;
    const { content } = request.body as any;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        userId: true,
        channelId: true,
        createdAt: true
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Only author can edit their messages
    if (message.userId !== request.userId) {
      throwForbidden('You can only edit your own messages');
    }

    // Check if message is too old to edit (24 hours)
    const hoursSinceCreation = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throwBadRequest('Message is too old to edit');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        editedTimestamp: new Date()
      },
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
        }
      }
    });

    // Emit real-time event
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`channel:${message.channelId}`).emit('messageUpdate', {
        message: updatedMessage,
        channelId: message.channelId
      });
    }

    reply.send({
      success: true,
      data: updatedMessage
    });
  });

  /**
   * @swagger
   * /messages/{messageId}:
   *   delete:
   *     tags: [messages]
   *     summary: Delete message
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/:messageId', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.messageId
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Delete message',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            server: {
              select: {
                id: true,
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Check permissions (author, server owner, or moderator)
    let canDelete = message.userId === request.userId;

    if (!canDelete && message.channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
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

      if (serverMember) {
        // Server owner can delete any message
        canDelete = message.channel.server!.ownerId === request.userId ||
          // Or has MANAGE_MESSAGES permission
          serverMember.roles.some(memberRole => 
            memberRole.role.permissions & BigInt(0x2000) // MANAGE_MESSAGES
          );
      }
    }

    if (!canDelete) {
      throwForbidden('Insufficient permissions to delete this message');
    }

    // Delete message and related data
    await prisma.$transaction([
      prisma.messageAttachment.deleteMany({ where: { messageId } }),
      prisma.messageEmbed.deleteMany({ where: { messageId } }),
      prisma.reaction.deleteMany({ where: { messageId } }),
      prisma.message.delete({ where: { id: messageId } })
    ]);

    // Emit real-time event
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`channel:${message.channelId}`).emit('messageDelete', {
        messageId,
        channelId: message.channelId
      });
    }

    reply.send({
      success: true,
      message: 'Message deleted successfully'
    });
  });

  /**
   * @swagger
   * /messages/{messageId}/reactions:
   *   post:
   *     tags: [messages]
   *     summary: Add reaction to message
   *     security:
   *       - Bearer: []
   */
  fastify.post('/:messageId/reactions', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.messageId,
        body: z.object({
          emoji: z.string().min(1).max(100)
        })
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Add reaction to message',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;
    const { emoji } = request.body as any;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          select: {
            id: true,
            serverId: true
          }
        }
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Check channel access
    if (message.channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
            userId: request.userId!
          }
        }
      });

      if (!serverMember) {
        throwForbidden('Not a member of this server');
      }
    }

    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: request.userId!,
          emoji
        }
      }
    });

    if (existingReaction) {
      // Remove reaction if it exists
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });

      // Emit real-time event
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.to(`channel:${message.channelId}`).emit('reactionRemove', {
          messageId,
          userId: request.userId,
          emoji,
          channelId: message.channelId
        });
      }

      reply.send({
        success: true,
        message: 'Reaction removed'
      });
    } else {
      // Add new reaction
      const reaction = await prisma.reaction.create({
        data: {
          messageId,
          userId: request.userId!,
          emoji
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

      // Emit real-time event
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.to(`channel:${message.channelId}`).emit('reactionAdd', {
          reaction,
          messageId,
          channelId: message.channelId
        });
      }

      reply.code(201).send({
        success: true,
        data: reaction
      });
    }
  });

  /**
   * @swagger
   * /messages/{messageId}/reactions/{emoji}:
   *   get:
   *     tags: [messages]
   *     summary: Get users who reacted with emoji
   *     security:
   *       - Bearer: []
   */
  fastify.get('/:messageId/reactions/:emoji', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          messageId: z.string().cuid(),
          emoji: z.string().min(1).max(100)
        }),
        query: commonSchemas.pagination
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Get users who reacted with emoji',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId, emoji } = request.params as any;
    const { page = 1, limit = 50 } = request.query as any;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        channelId: true,
        channel: {
          select: {
            serverId: true
          }
        }
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Check channel access
    if (message.channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
            userId: request.userId!
          }
        }
      });

      if (!serverMember) {
        throwForbidden('Not a member of this server');
      }
    }

    const [reactions, total] = await Promise.all([
      prisma.reaction.findMany({
        where: {
          messageId,
          emoji
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.reaction.count({
        where: {
          messageId,
          emoji
        }
      })
    ]);

    reply.send({
      success: true,
      data: {
        reactions,
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
   * /messages/{messageId}/pin:
   *   post:
   *     tags: [messages]
   *     summary: Pin message
   *     security:
   *       - Bearer: []
   */
  fastify.post('/:messageId/pin', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.messageId
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Pin message',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            server: {
              select: {
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Check permissions
    if (message.channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
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

      const canPin = message.channel.server!.ownerId === request.userId ||
        serverMember.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x2000) // MANAGE_MESSAGES
        );

      if (!canPin) {
        throwForbidden('Insufficient permissions to pin messages');
      }
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        isPinned: true,
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
        }
      }
    });

    // Update channel's last pin timestamp
    await prisma.channel.update({
      where: { id: message.channelId },
      data: { lastPinTimestamp: new Date() }
    });

    // Emit real-time event
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`channel:${message.channelId}`).emit('messagePin', {
        message: updatedMessage,
        channelId: message.channelId
      });
    }

    reply.send({
      success: true,
      data: updatedMessage
    });
  });

  /**
   * @swagger
   * /messages/{messageId}/unpin:
   *   post:
   *     tags: [messages]
   *     summary: Unpin message
   *     security:
   *       - Bearer: []
   */
  fastify.post('/:messageId/unpin', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.messageId
      })
    ],
    schema: {
      tags: ['messages'],
      summary: 'Unpin message',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            server: {
              select: {
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Check permissions (same as pin)
    if (message.channel.serverId) {
      const serverMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: message.channel.serverId,
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

      const canUnpin = message.channel.server!.ownerId === request.userId ||
        serverMember.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x2000) // MANAGE_MESSAGES
        );

      if (!canUnpin) {
        throwForbidden('Insufficient permissions to unpin messages');
      }
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        isPinned: false,
        updatedAt: new Date()
      }
    });

    // Emit real-time event
    if (fastify.socketIntegration) {
      fastify.socketIntegration.io.to(`channel:${message.channelId}`).emit('messageUnpin', {
        messageId,
        channelId: message.channelId
      });
    }

    reply.send({
      success: true,
      message: 'Message unpinned successfully'
    });
  });
}