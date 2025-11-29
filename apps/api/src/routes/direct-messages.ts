import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { validate, validationSchemas, commonSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwForbidden, throwNotFound } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

export default async function directMessageRoutes(fastify: FastifyInstance) {
  
  /**
   * @swagger
   * /direct-messages/conversations:
   *   get:
   *     tags: [direct-messages]
   *     summary: Get user's DM conversations
   *     description: Retrieve all direct message conversations for the current user
   *     security:
   *       - Bearer: []
   */
  fastify.get('/conversations', {
    preHandler: [
      authMiddleware,
      validate({
        query: z.object({
          ...commonSchemas.pagination.shape,
          type: z.enum(['dm', 'group', 'all']).default('all')
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: "Get user's DM conversations",
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { page = 1, limit = 50, type } = request.query as any;

    let whereClause: any = {
      participants: {
        some: {
          userId: request.userId!
        }
      }
    };

    // Filter by conversation type if specified
    if (type !== 'all') {
      if (type === 'dm') {
        whereClause.type = 'DM';
      } else if (type === 'group') {
        whereClause.type = 'GROUP_DM';
      }
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true,
                  presence: {
                    select: {
                      status: true,
                      lastSeenAt: true
                    }
                  }
                }
              }
            }
          },
          lastMessage: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true
                }
              },
              attachments: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: [
          { lastMessageAt: 'desc' },
          { updatedAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.conversation.count({ where: whereClause })
    ]);

    // Calculate unread message counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const participant = conversation.participants.find(p => p.userId === request.userId!);
        
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: conversation.id,
            authorId: { not: request.userId! },
            createdAt: {
              gt: participant?.lastReadAt || new Date(0)
            }
          }
        });

        // Get other participants (exclude current user)
        const otherParticipants = conversation.participants
          .filter(p => p.userId !== request.userId!)
          .map(p => p.user);

        return {
          ...conversation,
          unreadCount,
          otherParticipants,
          participants: undefined // Remove full participants to reduce payload
        };
      })
    );

    reply.send({
      success: true,
      data: {
        conversations: conversationsWithUnread,
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
   * /direct-messages/conversations:
   *   post:
   *     tags: [direct-messages]
   *     summary: Create new DM conversation
   *     description: Start a new direct message conversation with one or more users
   *     security:
   *       - Bearer: []
   */
  fastify.post('/conversations', {
    preHandler: [
      authMiddleware,
      validate({
        body: z.object({
          userIds: z.array(z.string().cuid()).min(1).max(10),
          name: z.string().min(1).max(100).optional(),
          type: z.enum(['DM', 'GROUP_DM']).optional()
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Create new DM conversation',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { userIds, name, type } = request.body as any;

    // Validate that current user is not in the userIds list
    if (userIds.includes(request.userId!)) {
      throwBadRequest('Cannot include yourself in the participants list');
    }

    // Determine conversation type based on participant count
    const isGroupDM = userIds.length > 1;
    const conversationType = type || (isGroupDM ? 'GROUP_DM' : 'DM');

    // For 1-on-1 DMs, check if conversation already exists
    if (conversationType === 'DM' && userIds.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DM',
          participants: {
            every: {
              userId: {
                in: [request.userId!, userIds[0]]
              }
            }
          },
          AND: {
            participants: {
              some: {
                userId: request.userId!
              }
            }
          }
        },
        include: {
          participants: {
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
          },
          lastMessage: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (existingConversation) {
        return reply.send({
          success: true,
          data: existingConversation,
          message: 'Existing conversation found'
        });
      }
    }

    // Validate that all users exist and are not blocked
    const targetUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        bannedAt: null
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true
      }
    });

    if (targetUsers.length !== userIds.length) {
      throwNotFound('One or more users not found');
    }

    // Check for blocked relationships
    const blockedRelations = await prisma.block.findMany({
      where: {
        OR: [
          {
            blockerId: request.userId!,
            blockedId: { in: userIds }
          },
          {
            blockerId: { in: userIds },
            blockedId: request.userId!
          }
        ]
      }
    });

    if (blockedRelations.length > 0) {
      throwForbidden('Cannot create conversation with blocked users');
    }

    // For group DMs, validate name
    if (conversationType === 'GROUP_DM' && !name) {
      throwBadRequest('Group DM name is required');
    }

    // Create conversation
    const conversation = await prisma.$transaction(async (tx) => {
      // Create the conversation
      const newConversation = await tx.conversation.create({
        data: {
          type: conversationType,
          name: conversationType === 'GROUP_DM' ? name : null,
          ownerId: conversationType === 'GROUP_DM' ? request.userId! : null,
          lastMessageAt: new Date()
        }
      });

      // Add all participants (including current user)
      const allParticipants = [request.userId!, ...userIds];
      await tx.conversationParticipant.createMany({
        data: allParticipants.map(userId => ({
          conversationId: newConversation.id,
          userId,
          joinedAt: new Date(),
          lastReadAt: new Date()
        }))
      });

      // Get the complete conversation with participants
      return await tx.conversation.findUnique({
        where: { id: newConversation.id },
        include: {
          participants: {
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
            }
          },
          lastMessage: true
        }
      });
    });

    // Emit real-time events to all participants
    const allParticipants = [request.userId!, ...userIds];
    for (const participantId of allParticipants) {
      fastify.io.to(`user:${participantId}`).emit('conversationCreate', {
        conversation,
        initiatorId: request.userId!
      });
    }

    // Send notifications to other participants
    for (const userId of userIds) {
      await fastify.queues.notifications.add('conversationInvite', {
        type: 'conversationInvite',
        recipientId: userId,
        senderId: request.userId!,
        conversationId: conversation!.id,
        conversationType
      });
    }

    reply.code(201).send({
      success: true,
      data: conversation
    });
  });

  /**
   * @swagger
   * /direct-messages/conversations/{conversationId}:
   *   get:
   *     tags: [direct-messages]
   *     summary: Get conversation details
   *     security:
   *       - Bearer: []
   */
  fastify.get('/conversations/:conversationId', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          conversationId: z.string().cuid()
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Get conversation details',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { conversationId } = request.params as any;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: request.userId!
        }
      }
    });

    if (!participant) {
      throwForbidden('Not a participant in this conversation');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true,
                presence: {
                  select: {
                    status: true,
                    lastSeenAt: true
                  }
                }
              }
            }
          }
        },
        lastMessage: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    if (!conversation) {
      throwNotFound('Conversation');
    }

    reply.send({
      success: true,
      data: conversation
    });
  });

  /**
   * @swagger
   * /direct-messages/conversations/{conversationId}/messages:
   *   get:
   *     tags: [direct-messages]
   *     summary: Get messages in conversation
   *     security:
   *       - Bearer: []
   */
  fastify.get('/conversations/:conversationId/messages', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          conversationId: z.string().cuid()
        }),
        query: z.object({
          ...commonSchemas.pagination.shape,
          before: z.string().cuid().optional(),
          after: z.string().cuid().optional()
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Get messages in conversation',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { conversationId } = request.params as any;
    const { page = 1, limit = 50, before, after } = request.query as any;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: request.userId!
        }
      }
    });

    if (!participant) {
      throwForbidden('Not a participant in this conversation');
    }

    // Build where clause for pagination
    let whereClause: any = { conversationId };
    let orderBy: any = { createdAt: 'desc' };

    if (before) {
      const beforeMessage = await prisma.directMessage.findUnique({
        where: { id: before },
        select: { createdAt: true }
      });
      if (beforeMessage) {
        whereClause.createdAt = { lt: beforeMessage.createdAt };
      }
    } else if (after) {
      const afterMessage = await prisma.directMessage.findUnique({
        where: { id: after },
        select: { createdAt: true }
      });
      if (afterMessage) {
        whereClause.createdAt = { gt: afterMessage.createdAt };
        orderBy = { createdAt: 'asc' };
      }
    }

    const [messages, total] = await Promise.all([
      prisma.directMessage.findMany({
        where: whereClause,
        include: {
          author: {
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
              author: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            }
          },
          attachments: true,
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
              reactions: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.directMessage.count({ where: { conversationId } })
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
   * /direct-messages/conversations/{conversationId}/messages:
   *   post:
   *     tags: [direct-messages]
   *     summary: Send message in conversation
   *     security:
   *       - Bearer: []
   */
  fastify.post('/conversations/:conversationId/messages', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          conversationId: z.string().cuid()
        }),
        body: z.object({
          content: z.string().min(1).max(4000),
          replyToId: z.string().cuid().optional(),
          attachments: z.array(z.object({
            url: z.string().url(),
            filename: z.string(),
            size: z.number(),
            contentType: z.string()
          })).max(10).optional()
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Send message in conversation',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { conversationId } = request.params as any;
    const { content, replyToId, attachments = [] } = request.body as any;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: request.userId!
        }
      }
    });

    if (!participant) {
      throwForbidden('Not a participant in this conversation');
    }

    // Validate reply-to message
    if (replyToId) {
      const replyToMessage = await prisma.directMessage.findFirst({
        where: {
          id: replyToId,
          conversationId
        }
      });

      if (!replyToMessage) {
        throwBadRequest('Reply-to message not found in this conversation');
      }
    }

    // Create message
    const message = await prisma.$transaction(async (tx) => {
      // Create the message
      const newMessage = await tx.directMessage.create({
        data: {
          conversationId,
          authorId: request.userId!,
          content,
          replyToId
        },
        include: {
          author: {
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

      // Create attachments if any
      if (attachments.length > 0) {
        await tx.directMessageAttachment.createMany({
          data: attachments.map((attachment: any) => ({
            messageId: newMessage.id,
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            url: attachment.url
          }))
        });
      }

      // Update conversation's last message
      await tx.conversation.update({
        where: { id: conversationId },
        data: { 
          lastMessageId: newMessage.id,
          lastMessageAt: new Date()
        }
      });

      // Update sender's last read timestamp
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: request.userId!
          }
        },
        data: {
          lastReadAt: new Date()
        }
      });

      return newMessage;
    });

    // Get complete message with attachments
    const completeMessage = await prisma.directMessage.findUnique({
      where: { id: message.id },
      include: {
        author: {
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
            author: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        },
        attachments: true,
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

    // Get all participants for real-time events
    const allParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true }
    });

    // Emit real-time event to all participants
    for (const participant of allParticipants) {
      fastify.io.to(`user:${participant.userId}`).emit('directMessageCreate', {
        message: completeMessage,
        conversationId
      });
    }

    // Send notifications to other participants
    const otherParticipants = allParticipants.filter(p => p.userId !== request.userId!);
    for (const participant of otherParticipants) {
      await fastify.queues.notifications.add('directMessage', {
        type: 'directMessage',
        recipientId: participant.userId,
        senderId: request.userId!,
        messageId: message.id,
        conversationId
      });
    }

    // Index message in Elasticsearch
    if (fastify.services?.elasticsearch && completeMessage) {
      try {
        await fastify.services.elasticsearch.indexDirectMessage(
          completeMessage.id,
          completeMessage.content,
          {
            author: {
              id: completeMessage.author.id,
              username: completeMessage.author.username,
              displayName: completeMessage.author.displayName
            },
            conversation: {
              id: conversationId
            },
            timestamp: completeMessage.createdAt.toISOString(),
            attachments: completeMessage.attachments?.map(att => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size
            })) || []
          }
        );
      } catch (error) {
        fastify.log.warn('Failed to index DM in Elasticsearch:', error);
      }
    }

    reply.code(201).send({
      success: true,
      data: completeMessage
    });
  });

  /**
   * @swagger
   * /direct-messages/conversations/{conversationId}/read:
   *   post:
   *     tags: [direct-messages]
   *     summary: Mark conversation as read
   *     security:
   *       - Bearer: []
   */
  fastify.post('/conversations/:conversationId/read', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          conversationId: z.string().cuid()
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Mark conversation as read',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { conversationId } = request.params as any;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: request.userId!
        }
      }
    });

    if (!participant) {
      throwForbidden('Not a participant in this conversation');
    }

    // Update last read timestamp
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: request.userId!
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    // Emit typing stop event
    fastify.io.to(`conversation:${conversationId}`).emit('conversationRead', {
      conversationId,
      userId: request.userId!,
      readAt: new Date().toISOString()
    });

    reply.send({
      success: true,
      message: 'Conversation marked as read'
    });
  });

  /**
   * @swagger
   * /direct-messages/conversations/{conversationId}/typing:
   *   post:
   *     tags: [direct-messages]
   *     summary: Send typing indicator
   *     security:
   *       - Bearer: []
   */
  fastify.post('/conversations/:conversationId/typing', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          conversationId: z.string().cuid()
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Send typing indicator',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { conversationId } = request.params as any;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: request.userId!
        }
      }
    });

    if (!participant) {
      throwForbidden('Not a participant in this conversation');
    }

    // Emit typing event to other participants
    fastify.io.to(`conversation:${conversationId}`).emit('typingStart', {
      conversationId,
      userId: request.userId!
    });

    reply.send({
      success: true,
      message: 'Typing indicator sent'
    });
  });

  /**
   * @swagger
   * /direct-messages/messages/{messageId}/reactions:
   *   post:
   *     tags: [direct-messages]
   *     summary: Add reaction to DM
   *     security:
   *       - Bearer: []
   */
  fastify.post('/messages/:messageId/reactions', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          messageId: z.string().cuid()
        }),
        body: z.object({
          emoji: z.string().min(1).max(100)
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Add reaction to DM',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { messageId } = request.params as any;
    const { emoji } = request.body as any;

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!message) {
      throwNotFound('Message');
    }

    // Check if user is participant in the conversation
    const isParticipant = message.conversation.participants.some(p => p.userId === request.userId!);
    if (!isParticipant) {
      throwForbidden('Not a participant in this conversation');
    }

    // Check if reaction already exists
    const existingReaction = await prisma.directMessageReaction.findUnique({
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
      await prisma.directMessageReaction.delete({
        where: { id: existingReaction.id }
      });

      // Emit real-time event
      for (const participant of message.conversation.participants) {
        fastify.io.to(`user:${participant.userId}`).emit('directMessageReactionRemove', {
          messageId,
          userId: request.userId,
          emoji,
          conversationId: message.conversationId
        });
      }

      reply.send({
        success: true,
        message: 'Reaction removed'
      });
    } else {
      // Add new reaction
      const reaction = await prisma.directMessageReaction.create({
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
      for (const participant of message.conversation.participants) {
        fastify.io.to(`user:${participant.userId}`).emit('directMessageReactionAdd', {
          reaction,
          messageId,
          conversationId: message.conversationId
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
   * /direct-messages/conversations/{conversationId}/participants:
   *   post:
   *     tags: [direct-messages]
   *     summary: Add participants to group DM
   *     security:
   *       - Bearer: []
   */
  fastify.post('/conversations/:conversationId/participants', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          conversationId: z.string().cuid()
        }),
        body: z.object({
          userIds: z.array(z.string().cuid()).min(1).max(5)
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Add participants to group DM',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { conversationId } = request.params as any;
    const { userIds } = request.body as any;

    // Get conversation and check permissions
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
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
      }
    });

    if (!conversation) {
      throwNotFound('Conversation');
    }

    // Only group DMs can have participants added
    if (conversation.type !== 'GROUP_DM') {
      throwBadRequest('Can only add participants to group DMs');
    }

    // Check if user is participant and has permission (owner or admin)
    const userParticipant = conversation.participants.find(p => p.userId === request.userId!);
    if (!userParticipant) {
      throwForbidden('Not a participant in this conversation');
    }

    // Only owner can add participants for now (can be extended with admin roles)
    if (conversation.ownerId !== request.userId!) {
      throwForbidden('Only conversation owner can add participants');
    }

    // Validate that users exist and are not already participants
    const targetUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        bannedAt: null
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true
      }
    });

    if (targetUsers.length !== userIds.length) {
      throwNotFound('One or more users not found');
    }

    // Check if any users are already participants
    const existingParticipants = conversation.participants.map(p => p.userId);
    const alreadyInConversation = userIds.filter((id: string) => existingParticipants.includes(id));
    if (alreadyInConversation.length > 0) {
      throwBadRequest('Some users are already participants in this conversation');
    }

    // Check for blocked relationships
    const blockedRelations = await prisma.block.findMany({
      where: {
        OR: [
          {
            blockerId: request.userId!,
            blockedId: { in: userIds }
          },
          {
            blockerId: { in: userIds },
            blockedId: request.userId!
          }
        ]
      }
    });

    if (blockedRelations.length > 0) {
      throwForbidden('Cannot add blocked users to conversation');
    }

    // Add participants
    await prisma.conversationParticipant.createMany({
      data: userIds.map((userId: string) => ({
        conversationId,
        userId,
        joinedAt: new Date(),
        lastReadAt: new Date()
      }))
    });

    // Get updated conversation
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
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
          }
        }
      }
    });

    // Emit real-time events to all participants (including new ones)
    const allParticipants = updatedConversation!.participants.map(p => p.userId);
    for (const participantId of allParticipants) {
      fastify.io.to(`user:${participantId}`).emit('conversationParticipantsAdded', {
        conversationId,
        addedUsers: targetUsers,
        addedBy: request.userId!,
        conversation: updatedConversation
      });
    }

    // Send notifications to new participants
    for (const userId of userIds) {
      await fastify.queues.notifications.add('conversationInvite', {
        type: 'conversationInvite',
        recipientId: userId,
        senderId: request.userId!,
        conversationId,
        conversationType: 'GROUP_DM'
      });
    }

    reply.send({
      success: true,
      data: updatedConversation,
      message: `Added ${userIds.length} participant(s) to conversation`
    });
  });

  /**
   * @swagger
   * /direct-messages/conversations/{conversationId}/leave:
   *   post:
   *     tags: [direct-messages]
   *     summary: Leave group DM conversation
   *     security:
   *       - Bearer: []
   */
  fastify.post('/conversations/:conversationId/leave', {
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({
          conversationId: z.string().cuid()
        })
      })
    ],
    schema: {
      tags: ['direct-messages'],
      summary: 'Leave group DM conversation',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { conversationId } = request.params as any;

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { userId: true }
        }
      }
    });

    if (!conversation) {
      throwNotFound('Conversation');
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(p => p.userId === request.userId!);
    if (!isParticipant) {
      throwForbidden('Not a participant in this conversation');
    }

    // Cannot leave 1-on-1 DMs
    if (conversation.type === 'DM') {
      throwBadRequest('Cannot leave 1-on-1 DM conversations');
    }

    // Remove participant
    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId: request.userId!
        }
      }
    });

    // If this was the owner leaving, transfer ownership to another participant
    if (conversation.ownerId === request.userId!) {
      const remainingParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        orderBy: { joinedAt: 'asc' },
        take: 1
      });

      if (remainingParticipants.length > 0) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            ownerId: remainingParticipants[0].userId
          }
        });
      }
    }

    // Emit real-time events to remaining participants
    const remainingParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true }
    });

    for (const participant of remainingParticipants) {
      fastify.io.to(`user:${participant.userId}`).emit('conversationParticipantLeft', {
        conversationId,
        userId: request.userId!
      });
    }

    reply.send({
      success: true,
      message: 'Successfully left conversation'
    });
  });
}