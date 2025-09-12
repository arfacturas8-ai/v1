import { FastifyInstance } from 'fastify';
import { prisma, FriendshipStatus, PresenceStatus } from '@cryb/database';
import { validate, validationSchemas, commonSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwForbidden, throwNotFound } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { z } from 'zod';

export default async function userRoutes(fastify: FastifyInstance) {
  
  /**
   * @swagger
   * /users/me:
   *   get:
   *     tags: [users]
   *     summary: Get current user profile
   *     security:
   *       - Bearer: []
   */
  fastify.get('/me', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Get current user profile',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId! },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        walletAddress: true,
        avatar: true,
        banner: true,
        bio: true,
        pronouns: true,
        isVerified: true,
        isBot: true,
        premiumType: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
        presence: {
          select: {
            status: true,
            clientStatus: true,
            activities: {
              select: {
                id: true,
                type: true,
                name: true,
                details: true,
                state: true,
                url: true,
                timestamps: true,
                assets: true
              }
            }
          }
        },
        _count: {
          select: {
            servers: true,
            posts: true,
            comments: true,
            messages: true,
            friendsInitiated: {
              where: { status: 'ACCEPTED' }
            },
            friendsReceived: {
              where: { status: 'ACCEPTED' }
            }
          }
        }
      }
    });

    if (!user) {
      throwNotFound('User');
    }

    const friendCount = user._count.friendsInitiated + user._count.friendsReceived;

    reply.send({
      success: true,
      data: {
        ...user,
        friendCount,
        _count: undefined
      }
    });
  });

  /**
   * @swagger
   * /users/me:
   *   patch:
   *     tags: [users]
   *     summary: Update current user profile
   *     security:
   *       - Bearer: []
   */
  fastify.patch('/me', {
    preHandler: [
      authMiddleware,
      validate({
        body: validationSchemas.user.update
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Update current user profile',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const updateData = request.body as any;

    // Check if email is being updated and not already taken
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: request.userId! }
        }
      });

      if (existingUser) {
        throwBadRequest('Email already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: request.userId! },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        walletAddress: true,
        avatar: true,
        banner: true,
        bio: true,
        pronouns: true,
        isVerified: true,
        locale: true,
        updatedAt: true
      }
    });

    // Emit real-time event for friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { initiatorId: request.userId!, status: 'ACCEPTED' },
          { receiverId: request.userId!, status: 'ACCEPTED' }
        ]
      },
      select: {
        initiatorId: true,
        receiverId: true
      }
    });

    for (const friendship of friendships) {
      const friendId = friendship.initiatorId === request.userId! 
        ? friendship.receiverId 
        : friendship.initiatorId;
      
      fastify.io.to(`user:${friendId}`).emit('userUpdate', {
        user: updatedUser
      });
    }

    reply.send({
      success: true,
      data: updatedUser
    });
  });

  /**
   * @swagger
   * /users/{userId}:
   *   get:
   *     tags: [users]
   *     summary: Get user profile by ID
   *     security:
   *       - Bearer: []
   */
  fastify.get('/:userId', {
    preHandler: [
      optionalAuthMiddleware,
      validate({
        params: commonSchemas.params.userId
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Get user profile by ID',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { userId } = request.params as any;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        pronouns: true,
        isVerified: true,
        isBot: true,
        premiumType: true,
        createdAt: true,
        presence: request.userId ? {
          select: {
            status: true,
            activities: {
              select: {
                id: true,
                type: true,
                name: true,
                details: true,
                state: true,
                url: true
              }
            }
          }
        } : false,
        _count: {
          select: {
            servers: true,
            posts: true,
            comments: true
          }
        }
      }
    });

    if (!user) {
      throwNotFound('User');
    }

    // Check friendship status if authenticated
    let friendshipStatus = null;
    if (request.userId && request.userId !== userId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { initiatorId: request.userId, receiverId: userId },
            { initiatorId: userId, receiverId: request.userId }
          ]
        },
        select: {
          status: true,
          initiatorId: true
        }
      });

      if (friendship) {
        friendshipStatus = {
          status: friendship.status,
          isInitiator: friendship.initiatorId === request.userId
        };
      }
    }

    reply.send({
      success: true,
      data: {
        ...user,
        friendshipStatus
      }
    });
  });

  /**
   * @swagger
   * /users/@{username}:
   *   get:
   *     tags: [users]
   *     summary: Get user profile by username
   *     security:
   *       - Bearer: []
   */
  fastify.get('/@:username', {
    preHandler: optionalAuthMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Get user profile by username',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { username } = request.params as any;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        pronouns: true,
        isVerified: true,
        isBot: true,
        premiumType: true,
        createdAt: true,
        presence: request.userId ? {
          select: {
            status: true,
            activities: {
              select: {
                id: true,
                type: true,
                name: true,
                details: true,
                state: true
              }
            }
          }
        } : false
      }
    });

    if (!user) {
      throwNotFound('User');
    }

    reply.send({
      success: true,
      data: user
    });
  });

  /**
   * @swagger
   * /users/me/presence:
   *   patch:
   *     tags: [users]
   *     summary: Update user presence
   *     security:
   *       - Bearer: []
   */
  fastify.patch('/me/presence', {
    preHandler: [
      authMiddleware,
      validate({
        body: z.object({
          status: z.enum(['ONLINE', 'IDLE', 'DND', 'INVISIBLE']),
          activities: z.array(z.object({
            type: z.enum(['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'CUSTOM', 'COMPETING']),
            name: z.string().min(1).max(128),
            details: z.string().max(128).optional(),
            state: z.string().max(128).optional(),
            url: z.string().url().optional(),
            timestamps: z.object({
              start: z.number().optional(),
              end: z.number().optional()
            }).optional(),
            assets: z.object({
              large_image: z.string().optional(),
              large_text: z.string().optional(),
              small_image: z.string().optional(),
              small_text: z.string().optional()
            }).optional()
          })).max(3).optional()
        })
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Update user presence',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { status, activities = [] } = request.body as any;

    // Update or create presence
    const presence = await prisma.userPresence.upsert({
      where: { userId: request.userId! },
      update: {
        status: status as PresenceStatus,
        updatedAt: new Date()
      },
      create: {
        userId: request.userId!,
        status: status as PresenceStatus
      }
    });

    // Delete existing activities
    await prisma.userActivity.deleteMany({
      where: { userId: request.userId! }
    });

    // Create new activities
    if (activities.length > 0) {
      await prisma.userActivity.createMany({
        data: activities.map((activity: any) => ({
          userId: request.userId!,
          presenceId: presence.id,
          type: activity.type,
          name: activity.name,
          details: activity.details,
          state: activity.state,
          url: activity.url,
          timestamps: activity.timestamps,
          assets: activity.assets
        }))
      });
    }

    // Get updated presence with activities
    const updatedPresence = await prisma.userPresence.findUnique({
      where: { id: presence.id },
      include: {
        activities: true
      }
    });

    // Emit to friends and shared servers
    const user = await prisma.user.findUnique({
      where: { id: request.userId! },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        servers: {
          select: {
            serverId: true
          }
        },
        friendsInitiated: {
          where: { status: 'ACCEPTED' },
          select: { receiverId: true }
        },
        friendsReceived: {
          where: { status: 'ACCEPTED' },
          select: { initiatorId: true }
        }
      }
    });

    if (user) {
      // Emit to servers
      for (const serverMember of user.servers) {
        fastify.io.to(`server:${serverMember.serverId}`).emit('presenceUpdate', {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar
          },
          presence: updatedPresence
        });
      }

      // Emit to friends
      const friendIds = [
        ...user.friendsInitiated.map(f => f.receiverId),
        ...user.friendsReceived.map(f => f.initiatorId)
      ];

      for (const friendId of friendIds) {
        fastify.io.to(`user:${friendId}`).emit('presenceUpdate', {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar
          },
          presence: updatedPresence
        });
      }
    }

    reply.send({
      success: true,
      data: updatedPresence
    });
  });

  /**
   * @swagger
   * /users/me/friends:
   *   get:
   *     tags: [users]
   *     summary: Get user's friends
   *     security:
   *       - Bearer: []
   */
  fastify.get('/me/friends', {
    preHandler: [
      authMiddleware,
      validate({
        query: z.object({
          ...commonSchemas.pagination.shape,
          status: z.enum(['PENDING', 'ACCEPTED', 'BLOCKED']).optional(),
          type: z.enum(['incoming', 'outgoing', 'all']).default('all')
        })
      })
    ],
    schema: {
      tags: ['users'],
      summary: "Get user's friends",
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { page = 1, limit = 50, status, type } = request.query as any;

    let whereClause: any = {};

    if (type === 'incoming') {
      whereClause.receiverId = request.userId!;
    } else if (type === 'outgoing') {
      whereClause.initiatorId = request.userId!;
    } else {
      whereClause.OR = [
        { initiatorId: request.userId! },
        { receiverId: request.userId! }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [friendships, total] = await Promise.all([
      prisma.friendship.findMany({
        where: whereClause,
        include: {
          initiator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
              presence: {
                select: {
                  status: true,
                  activities: {
                    select: {
                      type: true,
                      name: true,
                      details: true
                    }
                  }
                }
              }
            }
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
              presence: {
                select: {
                  status: true,
                  activities: {
                    select: {
                      type: true,
                      name: true,
                      details: true
                    }
                  }
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.friendship.count({ where: whereClause })
    ]);

    const formattedFriendships = friendships.map(friendship => ({
      id: friendship.id,
      status: friendship.status,
      createdAt: friendship.createdAt,
      updatedAt: friendship.updatedAt,
      isInitiator: friendship.initiatorId === request.userId,
      friend: friendship.initiatorId === request.userId! 
        ? friendship.receiver 
        : friendship.initiator
    }));

    reply.send({
      success: true,
      data: {
        friendships: formattedFriendships,
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
   * /users/{userId}/friend:
   *   post:
   *     tags: [users]
   *     summary: Send friend request
   *     security:
   *       - Bearer: []
   */
  fastify.post('/:userId/friend', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.userId
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Send friend request',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { userId } = request.params as any;

    if (userId === request.userId) {
      throwBadRequest('Cannot send friend request to yourself');
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true
      }
    });

    if (!targetUser) {
      throwNotFound('User');
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: request.userId!, receiverId: userId },
          { initiatorId: userId, receiverId: request.userId! }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        throwBadRequest('Already friends with this user');
      } else if (existingFriendship.status === 'PENDING') {
        throwBadRequest('Friend request already sent');
      } else if (existingFriendship.status === 'BLOCKED') {
        throwBadRequest('Cannot send friend request to blocked user');
      }
    }

    // Create friendship
    const friendship = await prisma.friendship.create({
      data: {
        initiatorId: request.userId!,
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    // Send notification
    await fastify.queues.notifications.add('friendRequest', {
      type: 'friendRequest',
      recipientId: userId,
      senderId: request.userId!,
      friendshipId: friendship.id
    });

    // Emit real-time event
    fastify.io.to(`user:${userId}`).emit('friendRequestReceived', {
      friendship: {
        ...friendship,
        friend: friendship.initiator
      }
    });

    reply.code(201).send({
      success: true,
      data: friendship
    });
  });

  /**
   * @swagger
   * /users/{userId}/friend:
   *   patch:
   *     tags: [users]
   *     summary: Accept/decline friend request
   *     security:
   *       - Bearer: []
   */
  fastify.patch('/:userId/friend', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.userId,
        body: z.object({
          action: z.enum(['accept', 'decline'])
        })
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Accept/decline friend request',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { userId } = request.params as any;
    const { action } = request.body as any;

    const friendship = await prisma.friendship.findFirst({
      where: {
        initiatorId: userId,
        receiverId: request.userId!,
        status: 'PENDING'
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    if (!friendship) {
      throwNotFound('Friend request');
    }

    if (action === 'accept') {
      const updatedFriendship = await prisma.friendship.update({
        where: { id: friendship.id },
        data: {
          status: 'ACCEPTED',
          updatedAt: new Date()
        },
        include: {
          initiator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      // Emit to both users
      fastify.io.to(`user:${userId}`).emit('friendRequestAccepted', {
        friendship: {
          ...updatedFriendship,
          friend: updatedFriendship.receiver
        }
      });

      fastify.io.to(`user:${request.userId}`).emit('friendAdded', {
        friendship: {
          ...updatedFriendship,
          friend: updatedFriendship.initiator
        }
      });

      reply.send({
        success: true,
        data: updatedFriendship
      });
    } else {
      await prisma.friendship.delete({
        where: { id: friendship.id }
      });

      // Emit decline event
      fastify.io.to(`user:${userId}`).emit('friendRequestDeclined', {
        friendshipId: friendship.id
      });

      reply.send({
        success: true,
        message: 'Friend request declined'
      });
    }
  });

  /**
   * @swagger
   * /users/{userId}/friend:
   *   delete:
   *     tags: [users]
   *     summary: Remove friend or cancel friend request
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/:userId/friend', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.userId
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Remove friend or cancel friend request',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { userId } = request.params as any;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: request.userId!, receiverId: userId },
          { initiatorId: userId, receiverId: request.userId! }
        ]
      }
    });

    if (!friendship) {
      throwNotFound('Friendship');
    }

    // Check if user can delete this friendship
    const canDelete = friendship.initiatorId === request.userId! || 
                     friendship.status === 'ACCEPTED';

    if (!canDelete) {
      throwForbidden('Cannot remove this friendship');
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    });

    // Emit events
    if (friendship.status === 'ACCEPTED') {
      // Friend removed
      const otherUserId = friendship.initiatorId === request.userId! 
        ? friendship.receiverId 
        : friendship.initiatorId;

      fastify.io.to(`user:${otherUserId}`).emit('friendRemoved', {
        friendshipId: friendship.id,
        userId: request.userId!
      });
    } else if (friendship.status === 'PENDING') {
      // Friend request cancelled
      fastify.io.to(`user:${friendship.receiverId}`).emit('friendRequestCancelled', {
        friendshipId: friendship.id
      });
    }

    reply.send({
      success: true,
      message: 'Friendship removed successfully'
    });
  });

  /**
   * @swagger
   * /users/{userId}/block:
   *   post:
   *     tags: [users]
   *     summary: Block user
   *     security:
   *       - Bearer: []
   */
  fastify.post('/:userId/block', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.userId
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Block user',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { userId } = request.params as any;

    if (userId === request.userId) {
      throwBadRequest('Cannot block yourself');
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      throwNotFound('User');
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: request.userId!,
          blockedId: userId
        }
      }
    });

    if (existingBlock) {
      throwBadRequest('User is already blocked');
    }

    // Remove friendship if exists
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { initiatorId: request.userId!, receiverId: userId },
          { initiatorId: userId, receiverId: request.userId! }
        ]
      }
    });

    // Create block
    const block = await prisma.block.create({
      data: {
        blockerId: request.userId!,
        blockedId: userId
      }
    });

    reply.code(201).send({
      success: true,
      data: block
    });
  });

  /**
   * @swagger
   * /users/{userId}/block:
   *   delete:
   *     tags: [users]
   *     summary: Unblock user
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/:userId/block', {
    preHandler: [
      authMiddleware,
      validate({
        params: commonSchemas.params.userId
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Unblock user',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { userId } = request.params as any;

    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: request.userId!,
          blockedId: userId
        }
      }
    });

    if (!block) {
      throwNotFound('Block relationship');
    }

    await prisma.block.delete({
      where: { id: block.id }
    });

    reply.send({
      success: true,
      message: 'User unblocked successfully'
    });
  });

  /**
   * @swagger
   * /users/me/servers:
   *   get:
   *     tags: [users]
   *     summary: Get user's servers
   *     security:
   *       - Bearer: []
   */
  fastify.get('/me/servers', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: "Get user's servers",
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const servers = await prisma.serverMember.findMany({
      where: { userId: request.userId! },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            banner: true,
            isPublic: true,
            ownerId: true,
            _count: {
              select: {
                members: true,
                channels: true
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const formattedServers = servers.map(member => ({
      ...member.server,
      memberSince: member.joinedAt,
      isOwner: member.server.ownerId === request.userId!,
      nickname: member.nickname
    }));

    reply.send({
      success: true,
      data: formattedServers
    });
  });

  /**
   * @swagger
   * /users/me/notifications:
   *   get:
   *     tags: [users]
   *     summary: Get user notifications
   *     security:
   *       - Bearer: []
   */
  fastify.get('/me/notifications', {
    preHandler: [
      authMiddleware,
      validate({
        query: z.object({
          ...commonSchemas.pagination.shape,
          unreadOnly: z.coerce.boolean().default(false),
          type: z.enum(['MENTION', 'REPLY', 'FOLLOW', 'LIKE', 'COMMENT', 'AWARD', 'SYSTEM', 'DM']).optional()
        })
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Get user notifications',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { page = 1, limit = 20, unreadOnly = false, type } = request.query as any;

    const whereClause: any = {
      userId: request.userId!
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (type) {
      whereClause.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where: whereClause })
    ]);

    reply.send({
      success: true,
      data: {
        notifications,
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
   * /users/me/notifications/read-all:
   *   post:
   *     tags: [users]
   *     summary: Mark all notifications as read
   *     security:
   *       - Bearer: []
   */
  fastify.post('/me/notifications/read-all', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Mark all notifications as read',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    await prisma.notification.updateMany({
      where: {
        userId: request.userId!,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    reply.send({
      success: true,
      message: 'All notifications marked as read'
    });
  });

  /**
   * @swagger
   * /users/me/account:
   *   delete:
   *     tags: [users]
   *     summary: Delete user account (App Store compliance)
   *     description: Permanently deletes the user account and all associated data
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/me/account', {
    preHandler: [
      authMiddleware,
      validate({
        body: z.object({
          password: z.string().min(1),
          confirmation: z.literal('DELETE_MY_ACCOUNT')
        })
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Delete user account (App Store compliance)',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { password, confirmation } = request.body as any;
    const userId = request.userId!;

    // Get user with password for verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true
      }
    });

    if (!user) {
      throwNotFound('User');
    }

    // Verify password
    const { verifyPassword } = await import('@cryb/auth');
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      throwBadRequest('Invalid password');
    }

    // Verify confirmation phrase
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      throwBadRequest('Invalid confirmation phrase');
    }

    try {
      // Start transaction for complete account deletion
      await prisma.$transaction(async (tx) => {
        // 1. Delete user-generated content
        await tx.message.deleteMany({ where: { authorId: userId } });
        await tx.post.deleteMany({ where: { authorId: userId } });
        await tx.comment.deleteMany({ where: { authorId: userId } });
        
        // 2. Delete user activities and presence
        await tx.userActivity.deleteMany({ where: { userId } });
        await tx.userPresence.deleteMany({ where: { userId } });
        
        // 3. Delete user relationships
        await tx.friendship.deleteMany({ 
          where: { 
            OR: [
              { initiatorId: userId }, 
              { receiverId: userId }
            ] 
          }
        });
        
        await tx.block.deleteMany({
          where: {
            OR: [
              { blockerId: userId },
              { blockedId: userId }
            ]
          }
        });
        
        // 4. Delete server memberships and leave servers
        await tx.serverMember.deleteMany({ where: { userId } });
        
        // 5. Delete sessions and auth tokens
        await tx.session.deleteMany({ where: { userId } });
        
        // 6. Delete notifications
        await tx.notification.deleteMany({ where: { userId } });
        
        // 7. Delete uploads and media files
        await tx.upload.deleteMany({ where: { uploadedById: userId } });
        
        // 8. Delete voice call participations
        await tx.voiceCallParticipant.deleteMany({ where: { userId } });
        
        // 9. Delete reaction history
        await tx.reaction.deleteMany({ where: { userId } });
        
        // 10. Delete report history (as reporter, not reported content)
        await tx.report.deleteMany({ where: { reporterId: userId } });
        
        // 11. Finally delete the user account
        await tx.user.delete({ where: { id: userId } });
      }, {
        timeout: 60000 // 60 seconds timeout for large accounts
      });

      // Clean up external services (outside transaction)
      await cleanupUserExternalData(userId, user.username);

      // Log account deletion for compliance
      fastify.log.info(`Account deleted for user ${user.username} (${user.email})`, {
        userId,
        timestamp: new Date().toISOString(),
        reason: 'user_requested'
      });

      // Broadcast account deletion to connected clients
      fastify.io.to(`user:${userId}`).emit('accountDeleted', {
        message: 'Your account has been permanently deleted'
      });

      reply.send({
        success: true,
        message: 'Account successfully deleted. All data has been permanently removed.',
        deletedAt: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error('Account deletion failed', { userId, error });
      
      // If deletion fails, ensure no partial deletion occurred
      throw new Error('Account deletion failed. Please try again or contact support.');
    }
  });

  /**
   * @swagger
   * /users/me/export:
   *   get:
   *     tags: [users]
   *     summary: Export user data (GDPR compliance)
   *     description: Export all user data in JSON format
   *     security:
   *       - Bearer: []
   */
  fastify.get('/me/export', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Export user data (GDPR compliance)',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const userId = request.userId!;

    try {
      // Collect all user data
      const [
        user,
        messages,
        posts,
        comments,
        friendships,
        notifications,
        presence,
        activities,
        serverMemberships
      ] = await Promise.all([
        // Basic user info (excluding sensitive data)
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            bio: true,
            pronouns: true,
            locale: true,
            createdAt: true,
            updatedAt: true,
            lastActiveAt: true
          }
        }),
        
        // User's messages
        prisma.message.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            content: true,
            timestamp: true,
            editedAt: true,
            channelId: true
          },
          orderBy: { timestamp: 'desc' }
        }),
        
        // User's posts
        prisma.post.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            communityId: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        
        // User's comments
        prisma.comment.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            postId: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        
        // Friendships
        prisma.friendship.findMany({
          where: {
            OR: [
              { initiatorId: userId },
              { receiverId: userId }
            ]
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            initiatorId: true,
            receiverId: true
          }
        }),
        
        // Notifications
        prisma.notification.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            title: true,
            content: true,
            createdAt: true,
            isRead: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        
        // Presence data
        prisma.userPresence.findUnique({
          where: { userId },
          select: {
            status: true,
            clientStatus: true,
            updatedAt: true
          }
        }),
        
        // Activities
        prisma.userActivity.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            name: true,
            details: true,
            state: true,
            url: true,
            timestamps: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        
        // Server memberships
        prisma.serverMember.findMany({
          where: { userId },
          select: {
            serverId: true,
            nickname: true,
            joinedAt: true,
            server: {
              select: {
                name: true
              }
            }
          }
        })
      ]);

      const exportData = {
        exportInfo: {
          userId,
          exportedAt: new Date().toISOString(),
          dataTypes: [
            'profile',
            'messages', 
            'posts',
            'comments',
            'friendships',
            'notifications',
            'presence',
            'activities',
            'serverMemberships'
          ]
        },
        profile: user,
        content: {
          messages: messages.map(msg => ({
            ...msg,
            channelId: 'redacted' // Don't expose channel structure
          })),
          posts,
          comments: comments.map(comment => ({
            ...comment,
            postId: 'redacted' // Don't expose post structure
          }))
        },
        social: {
          friendships: friendships.map(f => ({
            status: f.status,
            createdAt: f.createdAt,
            role: f.initiatorId === userId ? 'initiator' : 'receiver'
          })),
          serverMemberships: serverMemberships.map(m => ({
            serverName: m.server.name,
            nickname: m.nickname,
            joinedAt: m.joinedAt
          }))
        },
        activity: {
          presence,
          activities,
          notifications: notifications.slice(0, 100) // Limit to recent 100
        },
        metadata: {
          totalMessages: messages.length,
          totalPosts: posts.length,
          totalComments: comments.length,
          totalFriends: friendships.filter(f => f.status === 'ACCEPTED').length,
          totalNotifications: notifications.length,
          accountAge: user ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
        }
      };

      // Set headers for file download
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="cryb-data-export-${userId}-${Date.now()}.json"`);
      
      reply.send(exportData);

    } catch (error) {
      fastify.log.error('Data export failed', { userId, error });
      throw new Error('Failed to export user data');
    }
  });

  /**
   * @swagger
   * /users/search:
   *   get:
   *     tags: [users]
   *     summary: Search users
   *     security:
   *       - Bearer: []
   */
  fastify.get('/search', {
    preHandler: [
      optionalAuthMiddleware,
      validate({
        query: z.object({
          q: z.string().min(1).max(100),
          ...commonSchemas.pagination.shape
        })
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Search users',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { q, page = 1, limit = 20 } = request.query as any;

    const searchTerms = q.split(' ').map((term: string) => term.trim()).filter(Boolean);
    
    const whereClause = {
      OR: [
        {
          username: {
            contains: q,
            mode: 'insensitive' as const
          }
        },
        {
          displayName: {
            contains: q,
            mode: 'insensitive' as const
          }
        },
        ...searchTerms.map((term: string) => ({
          OR: [
            {
              username: {
                contains: term,
                mode: 'insensitive' as const
              }
            },
            {
              displayName: {
                contains: term,
                mode: 'insensitive' as const
              }
            }
          ]
        }))
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
          isBot: true,
          createdAt: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { isVerified: 'desc' },
          { username: 'asc' }
        ]
      }),
      prisma.user.count({ where: whereClause })
    ]);

    reply.send({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total
        }
      }
    });
  });
}

/**
 * Clean up user data from external services
 */
async function cleanupUserExternalData(userId: string, username: string): Promise<void> {
  try {
    console.log(`Cleaning up external data for user ${username} (${userId})`);
    
    // Clean up MinIO/S3 uploads (user avatar, banners, attachments)
    try {
      const { minioClient } = await import('../services/minio');
      const userPrefix = `users/${userId}/`;
      
      const objectsList = await new Promise((resolve, reject) => {
        const objects: string[] = [];
        const stream = minioClient.listObjects('uploads', userPrefix, true);
        
        stream.on('data', (obj) => {
          if (obj.name) objects.push(obj.name);
        });
        
        stream.on('end', () => resolve(objects));
        stream.on('error', (err) => reject(err));
      });
      
      if (Array.isArray(objectsList) && objectsList.length > 0) {
        await minioClient.removeObjects('uploads', objectsList as string[]);
        console.log(`Cleaned up ${objectsList.length} files from MinIO for user ${userId}`);
      }
      
    } catch (error) {
      console.error(`Failed to cleanup MinIO data for user ${userId}:`, error);
    }
    
    // Clean up Redis data
    try {
      const Redis = await import('ioredis');
      const redis = new Redis.default(process.env.REDIS_URL || 'redis://localhost:6379');
      
      const patterns = [
        `user:${userId}`,
        `user:${userId}:*`,
        `presence:${userId}`,
        `session:*:${userId}`,
        `typing:*:${userId}`,
        `voice:*:${userId}`,
      ];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
      
      await redis.disconnect();
      console.log(`Cleaned up Redis data for user ${userId}`);
      
    } catch (error) {
      console.error(`Failed to cleanup Redis data for user ${userId}:`, error);
    }
    
    // Clean up Elasticsearch data (if search indexing is enabled)
    try {
      const { Client } = await import('@elastic/elasticsearch');
      const esClient = new Client({ 
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' 
      });
      
      await esClient.deleteByQuery({
        index: 'users,messages,posts',
        body: {
          query: {
            term: { userId }
          }
        }
      });
      
      console.log(`Cleaned up Elasticsearch data for user ${userId}`);
      
    } catch (error) {
      console.error(`Failed to cleanup Elasticsearch data for user ${userId}:`, error);
    }
    
    // Clean up analytics data (but preserve aggregated anonymous data)
    try {
      // This would integrate with your analytics service
      // For example, segment, mixpanel, etc.
      // await analyticsService.deleteUser(userId);
      console.log(`Analytics cleanup would be performed here for user ${userId}`);
      
    } catch (error) {
      console.error(`Failed to cleanup analytics data for user ${userId}:`, error);
    }
    
    console.log(`External data cleanup completed for user ${userId}`);
    
  } catch (error) {
    console.error(`External data cleanup failed for user ${userId}:`, error);
    // Don't throw error - account deletion should still succeed
  }
}