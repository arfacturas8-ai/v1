import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma, executeWithDatabaseRetry } from '@cryb/database';
import { userManagementMiddleware, superAdminMiddleware, AdminPermission } from '../../middleware/admin';
import { authMiddleware } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'banned' | 'verified' | 'unverified';
  sort?: 'newest' | 'oldest' | 'alphabetical' | 'lastSeen';
}

interface UserBanBody {
  reason?: string;
  duration?: number; // Duration in days, null for permanent
}

interface UserRoleBody {
  premiumType?: 'NONE' | 'NITRO_CLASSIC' | 'NITRO' | 'NITRO_BASIC';
  isVerified?: boolean;
  flags?: number;
  publicFlags?: number;
}

export default async function adminUsersRoutes(fastify: FastifyInstance) {
  // Apply authentication and admin middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  /**
   * GET /api/v1/admin/users
   * List all users with filtering and pagination
   */
  fastify.get<{ Querystring: UserListQuery }>('/', {
    preHandler: userManagementMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'List users with admin filtering options',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          search: { type: 'string', minLength: 1, maxLength: 100 },
          status: { 
            type: 'string', 
            enum: ['all', 'active', 'banned', 'verified', 'unverified'],
            default: 'all'
          },
          sort: {
            type: 'string',
            enum: ['newest', 'oldest', 'alphabetical', 'lastSeen'],
            default: 'newest'
          }
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
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      email: { type: 'string' },
                      displayName: { type: 'string' },
                      isVerified: { type: 'boolean' },
                      premiumType: { type: 'string' },
                      bannedAt: { type: 'string', nullable: true },
                      lastSeenAt: { type: 'string', nullable: true },
                      createdAt: { type: 'string' },
                      _count: {
                        type: 'object',
                        properties: {
                          posts: { type: 'integer' },
                          comments: { type: 'integer' },
                          messages: { type: 'integer' },
                          servers: { type: 'integer' }
                        }
                      }
                    }
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    pages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: UserListQuery }>, reply: FastifyReply) => {
    const { page = 1, limit = 20, search, status = 'all', sort = 'newest' } = request.query;
    const offset = (page - 1) * limit;

    try {
      // Build where clause based on filters
      const where: any = {};

      if (search) {
        where.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (status !== 'all') {
        switch (status) {
          case 'active':
            where.bannedAt = null;
            break;
          case 'banned':
            where.bannedAt = { not: null };
            break;
          case 'verified':
            where.isVerified = true;
            break;
          case 'unverified':
            where.isVerified = false;
            break;
        }
      }

      // Build order by clause
      let orderBy: any = {};
      switch (sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'alphabetical':
          orderBy = { username: 'asc' };
          break;
        case 'lastSeen':
          orderBy = { lastSeenAt: 'desc' };
          break;
      }

      // Execute queries in parallel
      const [users, totalCount] = await Promise.all([
        executeWithDatabaseRetry(async () => {
          return await prisma.user.findMany({
            where,
            orderBy,
            skip: offset,
            take: limit,
            select: {
              id: true,
              username: true,
              email: true,
              displayName: true,
              isVerified: true,
              premiumType: true,
              bannedAt: true,
              lastSeenAt: true,
              createdAt: true,
              _count: {
                select: {
                  posts: true,
                  comments: true,
                  messages: true,
                  servers: true
                }
              }
            }
          });
        }),
        executeWithDatabaseRetry(async () => {
          return await prisma.user.count({ where });
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      reply.send({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: totalPages
          }
        }
      });

    } catch (error) {
      request.log.error({ error, query: request.query }, 'Failed to fetch users');
      throw new AppError('Failed to fetch users', 500, 'FETCH_USERS_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/users/:userId
   * Get detailed user information
   */
  fastify.get<{ Params: { userId: string } }>('/:userId', {
    preHandler: userManagementMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get detailed user information',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const { userId } = request.params;

    try {
      const user = await executeWithDatabaseRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          include: {
            _count: {
              select: {
                posts: true,
                comments: true,
                messages: true,
                servers: true,
                communityMemberships: true,
                moderatorRoles: true,
                reports: true
              }
            },
            servers: {
              take: 10,
              select: {
                id: true,
                server: {
                  select: {
                    id: true,
                    name: true,
                    icon: true
                  }
                },
                joinedAt: true
              }
            },
            communityMemberships: {
              take: 10,
              select: {
                id: true,
                community: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true
                  }
                },
                joinedAt: true,
                karma: true
              }
            }
          }
        });
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      reply.send({
        success: true,
        data: { user }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, userId }, 'Failed to fetch user details');
      throw new AppError('Failed to fetch user details', 500, 'FETCH_USER_FAILED');
    }
  });

  /**
   * POST /api/v1/admin/users/:userId/ban
   * Ban a user
   */
  fastify.post<{ Params: { userId: string }; Body: UserBanBody }>('/:userId/ban', {
    preHandler: userManagementMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Ban a user account',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500 },
          duration: { type: 'integer', minimum: 1, maximum: 3650 } // Max 10 years
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string }; Body: UserBanBody }>, reply: FastifyReply) => {
    const { userId } = request.params;
    const { reason = 'No reason provided', duration } = request.body;

    try {
      // Check if user exists and is not already banned
      const user = await executeWithDatabaseRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, bannedAt: true }
        });
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.bannedAt && user.bannedAt > new Date()) {
        throw new AppError('User is already banned', 400, 'USER_ALREADY_BANNED');
      }

      // Calculate ban expiry if duration is provided
      let banExpiresAt: Date | null = null;
      if (duration) {
        banExpiresAt = new Date(Date.now() + (duration * 24 * 60 * 60 * 1000));
      }

      // Update user ban status
      const updatedUser = await executeWithDatabaseRetry(async () => {
        return await prisma.user.update({
          where: { id: userId },
          data: {
            bannedAt: banExpiresAt || new Date()
          },
          select: {
            id: true,
            username: true,
            bannedAt: true
          }
        });
      });

      // Log the ban action
      request.log.info({
        adminId: request.adminUser?.id,
        adminUsername: request.adminUser?.username,
        bannedUserId: userId,
        bannedUsername: user.username,
        reason,
        duration,
        banExpiresAt
      }, 'User banned by admin');

      reply.send({
        success: true,
        data: {
          user: updatedUser,
          reason,
          duration,
          expiresAt: banExpiresAt?.toISOString() || null
        },
        message: `User ${user.username} has been banned${duration ? ` for ${duration} days` : ' permanently'}`
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, userId }, 'Failed to ban user');
      throw new AppError('Failed to ban user', 500, 'BAN_USER_FAILED');
    }
  });

  /**
   * POST /api/v1/admin/users/:userId/unban
   * Unban a user
   */
  fastify.post<{ Params: { userId: string } }>('/:userId/unban', {
    preHandler: userManagementMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Unban a user account',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const { userId } = request.params;

    try {
      // Check if user exists and is banned
      const user = await executeWithDatabaseRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, bannedAt: true }
        });
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (!user.bannedAt) {
        throw new AppError('User is not banned', 400, 'USER_NOT_BANNED');
      }

      // Remove ban
      const updatedUser = await executeWithDatabaseRetry(async () => {
        return await prisma.user.update({
          where: { id: userId },
          data: {
            bannedAt: null
          },
          select: {
            id: true,
            username: true,
            bannedAt: true
          }
        });
      });

      // Log the unban action
      request.log.info({
        adminId: request.adminUser?.id,
        adminUsername: request.adminUser?.username,
        unbannedUserId: userId,
        unbannedUsername: user.username
      }, 'User unbanned by admin');

      reply.send({
        success: true,
        data: { user: updatedUser },
        message: `User ${user.username} has been unbanned`
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, userId }, 'Failed to unban user');
      throw new AppError('Failed to unban user', 500, 'UNBAN_USER_FAILED');
    }
  });

  /**
   * PATCH /api/v1/admin/users/:userId/role
   * Update user role and permissions
   */
  fastify.patch<{ Params: { userId: string }; Body: UserRoleBody }>('/:userId/role', {
    preHandler: superAdminMiddleware, // Only super admins can change roles
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Update user role and permissions',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      },
      body: {
        type: 'object',
        properties: {
          premiumType: { 
            type: 'string', 
            enum: ['NONE', 'NITRO_CLASSIC', 'NITRO', 'NITRO_BASIC'] 
          },
          isVerified: { type: 'boolean' },
          flags: { type: 'integer', minimum: 0 },
          publicFlags: { type: 'integer', minimum: 0 }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { userId: string }; Body: UserRoleBody }>, reply: FastifyReply) => {
    const { userId } = request.params;
    const updateData = request.body;

    try {
      // Check if user exists
      const user = await executeWithDatabaseRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true }
        });
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Update user role
      const updatedUser = await executeWithDatabaseRetry(async () => {
        return await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            username: true,
            premiumType: true,
            isVerified: true,
            flags: true,
            publicFlags: true
          }
        });
      });

      // Log the role change
      request.log.info({
        adminId: request.adminUser?.id,
        adminUsername: request.adminUser?.username,
        targetUserId: userId,
        targetUsername: user.username,
        changes: updateData
      }, 'User role updated by admin');

      reply.send({
        success: true,
        data: { user: updatedUser },
        message: `User ${user.username} role has been updated`
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, userId, updateData }, 'Failed to update user role');
      throw new AppError('Failed to update user role', 500, 'UPDATE_USER_ROLE_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/users/stats
   * Get user statistics
   */
  fastify.get('/stats', {
    preHandler: userManagementMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get user statistics'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await executeWithDatabaseRetry(async () => {
        const [
          totalUsers,
          verifiedUsers,
          bannedUsers,
          premiumUsers,
          recentUsers,
          activeUsers
        ] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isVerified: true } }),
          prisma.user.count({ where: { bannedAt: { not: null } } }),
          prisma.user.count({ where: { premiumType: { not: 'NONE' } } }),
          prisma.user.count({ 
            where: { 
              createdAt: { 
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
              } 
            } 
          }),
          prisma.user.count({ 
            where: { 
              lastSeenAt: { 
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
              } 
            } 
          })
        ]);

        return {
          totalUsers,
          verifiedUsers,
          bannedUsers,
          premiumUsers,
          recentUsers, // Last 7 days
          activeUsers  // Last 24 hours
        };
      });

      reply.send({
        success: true,
        data: { stats }
      });

    } catch (error) {
      request.log.error({ error }, 'Failed to fetch user statistics');
      throw new AppError('Failed to fetch user statistics', 500, 'FETCH_STATS_FAILED');
    }
  });
}