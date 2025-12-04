import { FastifyInstance } from 'fastify';
import { prisma, FriendshipStatus, PresenceStatus } from '@cryb/database';
import { validate, validationSchemas, commonSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwForbidden, throwNotFound } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { sendSuccess, sendPaginated, ErrorResponses } from '../utils/responses';
import { paginationQuerySchema, createPaginatedResult } from '../utils/pagination';
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

    sendSuccess(reply, {
      ...user,
      friendCount,
      _count: undefined
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

    sendSuccess(reply, updatedUser, {
      message: 'User profile updated successfully'
    });
  });

  /**
   * @swagger
   * /users/me/avatar:
   *   post:
   *     tags: [users]
   *     summary: Upload user avatar
   *     description: Upload a new avatar image for the current user
   *     security:
   *       - Bearer: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: avatar
   *         type: file
   *         required: true
   *         description: Avatar image file (JPG, PNG, GIF, WebP, max 5MB)
   */
  fastify.post('/me/avatar', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Upload user avatar',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        throwBadRequest('No file uploaded');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        throwBadRequest('Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const chunks = [];
      let totalSize = 0;

      for await (const chunk of data.file) {
        totalSize += chunk.length;
        if (totalSize > maxSize) {
          throwBadRequest('File too large. Maximum size is 5MB');
        }
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Upload to MinIO
      if (!fastify.services?.fileUpload) {
        throwBadRequest('File upload service not available');
      }

      const filename = `users/${request.userId}/avatar_${Date.now()}.${data.mimetype.split('/')[1]}`;
      const uploadResult = await fastify.services.fileUpload.uploadBuffer(
        buffer,
        filename,
        data.mimetype
      );

      // Update user avatar in database
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          avatar: uploadResult.url,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          updatedAt: true
        }
      });

      // Emit real-time event for avatar update
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
        
        fastify.io.to(`user:${friendId}`).emit('userAvatarUpdate', {
          userId: request.userId,
          avatar: updatedUser.avatar
        });
      }

      reply.send({
        success: true,
        data: {
          avatar: updatedUser.avatar,
          uploadedAt: new Date().toISOString()
        },
        message: 'Avatar uploaded successfully'
      });

    } catch (error) {
      fastify.log.error('Avatar upload failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /users/me/banner:
   *   post:
   *     tags: [users]
   *     summary: Upload user banner
   *     description: Upload a new banner image for the current user
   *     security:
   *       - Bearer: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: banner
   *         type: file
   *         required: true
   *         description: Banner image file (JPG, PNG, GIF, WebP, max 10MB)
   */
  fastify.post('/me/banner', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Upload user banner',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        throwBadRequest('No file uploaded');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        throwBadRequest('Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed');
      }

      // Validate file size (10MB limit for banners)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const chunks = [];
      let totalSize = 0;

      for await (const chunk of data.file) {
        totalSize += chunk.length;
        if (totalSize > maxSize) {
          throwBadRequest('File too large. Maximum size is 10MB');
        }
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Upload to MinIO
      if (!fastify.services?.fileUpload) {
        throwBadRequest('File upload service not available');
      }

      const filename = `users/${request.userId}/banner_${Date.now()}.${data.mimetype.split('/')[1]}`;
      const uploadResult = await fastify.services.fileUpload.uploadBuffer(
        buffer,
        filename,
        data.mimetype
      );

      // Update user banner in database
      const updatedUser = await prisma.user.update({
        where: { id: request.userId! },
        data: {
          banner: uploadResult.url,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          banner: true,
          updatedAt: true
        }
      });

      reply.send({
        success: true,
        data: {
          banner: updatedUser.banner,
          uploadedAt: new Date().toISOString()
        },
        message: 'Banner uploaded successfully'
      });

    } catch (error) {
      fastify.log.error('Banner upload failed:', error);
      throw error;
    }
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

      // Log account deletion for compliance (without exposing PII in logs)
      fastify.log.info('Account deleted', {
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

  /**
   * Get user posts by username
   */
  fastify.get('/:username/posts', {
    preHandler: optionalAuthMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Get user posts by username',
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 25 }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.params as { username: string };
    const { page, limit } = request.query as { page: number; limit: number };

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      throwNotFound('User not found');
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { 
          userId: user.id,
          isRemoved: false 
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
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true,
              awards: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.post.count({ 
        where: { 
          userId: user.id,
          isRemoved: false 
        } 
      })
    ]);

    reply.send({
      success: true,
      data: {
        items: posts,
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total
      }
    });
  });

  /**
   * Get user comments by username
   */
  fastify.get('/:username/comments', {
    preHandler: optionalAuthMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Get user comments by username',
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 25 }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.params as { username: string };
    const { page, limit } = request.query as { page: number; limit: number };

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      throwNotFound('User not found');
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          userId: user.id,
          isRemoved: false 
        },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              communityId: true,
              community: {
                select: {
                  name: true,
                  displayName: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              votes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.comment.count({ 
        where: { 
          userId: user.id,
          isRemoved: false 
        } 
      })
    ]);

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      postTitle: comment.post.title,
      communityName: comment.post.community.name,
      score: comment._count.votes,
      createdAt: comment.createdAt,
      user: comment.user
    }));

    reply.send({
      success: true,
      data: {
        items: formattedComments,
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total
      }
    });
  });

  /**
   * Get user's saved posts (requires auth)
   */
  fastify.get('/:username/saved', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Get user saved posts',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 25 }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.params as { username: string };
    const { page, limit } = request.query as { page: number; limit: number };

    // Users can only view their own saved posts
    const currentUser = await prisma.user.findUnique({
      where: { id: request.userId! },
      select: { username: true }
    });

    if (currentUser?.username !== username) {
      throwForbidden('You can only view your own saved posts');
    }

    const [savedPosts, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId: request.userId! },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true
                }
              },
              community: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  icon: true
                }
              },
              _count: {
                select: {
                  comments: true,
                  votes: true,
                  awards: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.savedPost.count({ where: { userId: request.userId! } })
    ]);

    const posts = savedPosts.map(sp => sp.post);

    reply.send({
      success: true,
      data: {
        items: posts,
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total
      }
    });
  });

  /**
   * Follow/unfollow user
   */
  fastify.post('/:username/follow', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Follow a user',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.params as { username: string };

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!targetUser) {
      throwNotFound('User not found');
    }

    if (targetUser.id === request.userId) {
      throwBadRequest('You cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: request.userId!,
          followingId: targetUser.id
        }
      }
    });

    if (existingFollow) {
      throwBadRequest('Already following this user');
    }

    // Create follow relationship and update counts
    await prisma.$transaction([
      prisma.follow.create({
        data: {
          followerId: request.userId!,
          followingId: targetUser.id
        }
      }),
      prisma.user.update({
        where: { id: request.userId! },
        data: { followingCount: { increment: 1 } }
      }),
      prisma.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { increment: 1 } }
      })
    ]);

    // Send notification to the followed user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'USER_FOLLOW',
        title: 'New Follower',
        content: `You have a new follower`,
        metadata: {
          followerId: request.userId!,
          followerUsername: (await prisma.user.findUnique({
            where: { id: request.userId! },
            select: { username: true }
          }))?.username
        }
      }
    });

    reply.send({
      success: true,
      message: 'User followed successfully'
    });
  });

  /**
   * Unfollow user
   */
  fastify.delete('/:username/follow', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Unfollow a user',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.params as { username: string };

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!targetUser) {
      throwNotFound('User not found');
    }

    // Delete follow relationship and update counts
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: request.userId!,
          followingId: targetUser.id
        }
      }
    });

    if (!existingFollow) {
      throwBadRequest('Not following this user');
    }

    await prisma.$transaction([
      prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: request.userId!,
            followingId: targetUser.id
          }
        }
      }),
      prisma.user.update({
        where: { id: request.userId! },
        data: { followingCount: { decrement: 1 } }
      }),
      prisma.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { decrement: 1 } }
      })
    ]);

    reply.send({
      success: true,
      message: 'User unfollowed successfully'
    });
  });

  /**
   * Get user by username with profile data
   */
  fastify.get('/profile/:username', {
    preHandler: optionalAuthMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Get user profile by username',
      params: {
        type: 'object',
        properties: {
          username: { type: 'string' }
        },
        required: ['username']
      }
    }
  }, async (request, reply) => {
    const { username } = request.params as { username: string };

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            Post: { where: { isRemoved: false } },
            Comment: true,
            Award_Award_receiverIdToUser: true
          }
        }
      }
    });

    if (!user) {
      throwNotFound('User not found');
    }

    // Calculate total upvotes from Vote model
    const totalUpvotes = await prisma.vote.count({
      where: {
        OR: [
          { Post: { userId: user.id }, voteType: 'UP' },
          { Comment: { userId: user.id }, voteType: 'UP' }
        ]
      }
    });

    // Check if current user is following
    let isFollowing = false;
    if (request.userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: request.userId,
            followingId: user.id
          }
        }
      });
      isFollowing = !!follow;
    }

    const profileData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
      joinedAt: user.createdAt,
      isFollowing,
      followersCount: user.followerCount,
      followingCount: user.followingCount,
      postsCount: user.postCount || user._count.Post,
      commentsCount: user._count.Comment,
      awardsReceived: user._count.Award_Award_receiverIdToUser,
      totalUpvotes,
      isPremium: user.premiumType !== 'NONE',
      isModerator: user.role === 'MODERATOR',
      isAdmin: user.role === 'ADMIN',
      badges: [] // TODO: Implement badges system
    };

    reply.send({
      success: true,
      data: profileData
    });
  });
}

/**
 * Clean up user data from external services
 */
async function cleanupUserExternalData(userId: string, username: string): Promise<void> {
  try {
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
      }

    } catch (error) {
      // Log error without exposing user details
    }

    // Clean up Redis data
    try {
      const Redis = await import('ioredis');
      const redis = new Redis.default(process.env.REDIS_URL || 'redis://localhost:6380');

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

    } catch (error) {
      // Log error without exposing user details
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

    } catch (error) {
      // Log error without exposing user details
    }

    // Clean up analytics data (but preserve aggregated anonymous data)
    try {
      // This would integrate with your analytics service
      // For example, segment, mixpanel, etc.
      // await analyticsService.deleteUser(userId);

    } catch (error) {
      // Log error without exposing user details
    }

  } catch (error) {
    // Log error without exposing user details
    // Don't throw error - account deletion should still succeed
  }

  /**
   * @swagger
   * /users/{username}/block:
   *   post:
   *     tags: [users]
   *     summary: Block a user
   *     security:
   *       - Bearer: []
   */
  fastify.post('/:username/block', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Block a user',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { username } = request.params as any;

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, displayName: true }
    });

    if (!targetUser) {
      throwNotFound('User not found');
    }

    if (targetUser.id === request.userId) {
      throwBadRequest('Cannot block yourself');
    }

    // Check if already blocked
    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: request.userId!,
          blockedId: targetUser.id
        }
      }
    });

    if (existingBlock) {
      throwBadRequest('User already blocked');
    }

    // Create block relationship
    const block = await prisma.blockedUser.create({
      data: {
        blockerId: request.userId!,
        blockedId: targetUser.id
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    // Remove any friendship between users
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { initiatorId: request.userId!, receiverId: targetUser.id },
          { initiatorId: targetUser.id, receiverId: request.userId! }
        ]
      }
    });

    // Delete any conversations between users
    await prisma.conversationParticipant.deleteMany({
      where: {
        userId: request.userId!,
        conversation: {
          participants: {
            some: {
              userId: targetUser.id
            }
          }
        }
      }
    });

    reply.send({
      success: true,
      data: {
        id: block.id,
        userId: block.blocked.id,
        username: block.blocked.username,
        displayName: block.blocked.displayName,
        avatarUrl: block.blocked.avatar,
        blockedAt: block.createdAt
      }
    });
  });

  /**
   * @swagger
   * /users/{username}/block:
   *   delete:
   *     tags: [users]
   *     summary: Unblock a user
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/:username/block', {
    preHandler: authMiddleware,
    schema: {
      tags: ['users'],
      summary: 'Unblock a user',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { username } = request.params as any;

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!targetUser) {
      throwNotFound('User not found');
    }

    // Delete block relationship
    const deleted = await prisma.blockedUser.deleteMany({
      where: {
        blockerId: request.userId!,
        blockedId: targetUser.id
      }
    });

    if (deleted.count === 0) {
      throwNotFound('User is not blocked');
    }

    reply.send({
      success: true,
      message: 'User unblocked successfully'
    });
  });

  /**
   * @swagger
   * /users/blocked:
   *   get:
   *     tags: [users]
   *     summary: Get list of blocked users
   *     security:
   *       - Bearer: []
   */
  fastify.get('/blocked', {
    preHandler: [
      authMiddleware,
      validate({
        query: commonSchemas.pagination
      })
    ],
    schema: {
      tags: ['users'],
      summary: 'Get list of blocked users',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as any;

    const [blockedUsers, total] = await Promise.all([
      prisma.blockedUser.findMany({
        where: { blockerId: request.userId! },
        include: {
          blocked: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.blockedUser.count({
        where: { blockerId: request.userId! }
      })
    ]);

    const formattedUsers = blockedUsers.map(block => ({
      id: block.id,
      userId: block.blocked.id,
      username: block.blocked.username,
      displayName: block.blocked.displayName,
      avatarUrl: block.blocked.avatar,
      blockedAt: block.createdAt
    }));

    reply.send({
      success: true,
      data: formattedUsers,
      pagination: {
        total,
        page,
        pageSize: limit,
        hasMore: page * limit < total
      }
    });
  });
}