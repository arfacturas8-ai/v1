import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { validate, validationSchemas, commonSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwForbidden, throwNotFound } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Middleware to check if user is admin
const adminMiddleware = async (request: any, reply: any) => {
  if (!request.userId) {
    throwUnauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    select: { role: true, isStaff: true }
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && !user.isStaff)) {
    throwForbidden('Admin access required');
  }

  request.userRole = user.role;
  request.isStaff = user.isStaff;
};

export default async function adminRoutes(fastify: FastifyInstance) {
  // Apply auth and admin middleware to all routes
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', adminMiddleware);

  /**
   * @swagger
   * /admin/dashboard:
   *   get:
   *     tags: [admin]
   *     summary: Get admin dashboard statistics
   *     security:
   *       - Bearer: []
   */
  fastify.get('/dashboard', async (request: any, reply) => {
    try {
      const timeframe = z.object({
        days: z.coerce.number().min(1).max(365).default(30)
      }).parse(request.query).days;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframe);

      const [
        totalUsers,
        activeUsers,
        newUsers,
        totalServers,
        totalCommunities,
        totalPosts,
        totalMessages,
        reportedContent,
        bannedUsers,
        systemHealth
      ] = await Promise.all([
        // Total users
        prisma.user.count(),
        
        // Active users (logged in within timeframe)
        prisma.user.count({
          where: {
            lastSeenAt: {
              gte: cutoffDate
            }
          }
        }),
        
        // New users in timeframe
        prisma.user.count({
          where: {
            createdAt: {
              gte: cutoffDate
            }
          }
        }),
        
        // Total servers
        prisma.server.count(),
        
        // Total communities
        prisma.community.count(),
        
        // Total posts
        prisma.post.count({
          where: {
            createdAt: {
              gte: cutoffDate
            }
          }
        }),
        
        // Total messages
        prisma.message.count({
          where: {
            createdAt: {
              gte: cutoffDate
            }
          }
        }),
        
        // Reported content
        prisma.report.count({
          where: {
            status: 'PENDING',
            createdAt: {
              gte: cutoffDate
            }
          }
        }),
        
        // Banned users
        prisma.user.count({
          where: {
            bannedAt: {
              not: null
            }
          }
        }),
        
        // System health metrics
        getSystemHealth()
      ]);

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          banned: bannedUsers,
          activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0'
        },
        content: {
          servers: totalServers,
          communities: totalCommunities,
          posts: totalPosts,
          messages: totalMessages
        },
        moderation: {
          pendingReports: reportedContent,
          moderationQueue: await getModerationQueueSize(),
          autoModerationActions: await getAutoModerationStats(cutoffDate)
        },
        system: systemHealth,
        timeframe: `${timeframe} days`
      };

      reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      fastify.log.error('Admin dashboard error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to load dashboard'
      });
    }
  });

  /**
   * @swagger
   * /admin/users:
   *   get:
   *     tags: [admin]
   *     summary: Get users list with filtering and search
   *     security:
   *       - Bearer: []
   */
  fastify.get('/users', {
    preHandler: [
      validate({
        query: z.object({
          ...commonSchemas.pagination.shape,
          search: z.string().optional(),
          role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
          status: z.enum(['active', 'banned', 'suspended']).optional(),
          verified: z.boolean().optional(),
          sortBy: z.enum(['createdAt', 'lastSeenAt', 'username']).default('createdAt'),
          sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
      })
    ]
  }, async (request: any, reply) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search, 
        role, 
        status, 
        verified, 
        sortBy, 
        sortOrder 
      } = request.query;

      let whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (role) {
        whereClause.role = role;
      }

      if (status === 'banned') {
        whereClause.bannedAt = { not: null };
      } else if (status === 'suspended') {
        whereClause.suspendedAt = { not: null };
      } else if (status === 'active') {
        whereClause.bannedAt = null;
        whereClause.suspendedAt = null;
      }

      if (verified !== undefined) {
        whereClause.isVerified = verified;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatar: true,
            role: true,
            isVerified: true,
            isStaff: true,
            createdAt: true,
            lastSeenAt: true,
            bannedAt: true,
            suspendedAt: true,
            banReason: true,
            _count: {
              select: {
                posts: true,
                sentMessages: true,
                receivedReports: true
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: (page - 1) * limit,
          take: limit
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
    } catch (error) {
      fastify.log.error('Admin users list error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  });

  /**
   * @swagger
   * /admin/users/{userId}/ban:
   *   post:
   *     tags: [admin]
   *     summary: Ban a user
   *     security:
   *       - Bearer: []
   */
  fastify.post('/users/:userId/ban', {
    preHandler: [
      validate({
        params: z.object({
          userId: z.string().cuid()
        }),
        body: z.object({
          reason: z.string().min(5).max(500),
          duration: z.number().min(1).max(365).optional(), // days
          deleteContent: z.boolean().default(false),
          notifyUser: z.boolean().default(true)
        })
      })
    ]
  }, async (request: any, reply) => {
    try {
      const { userId } = request.params;
      const { reason, duration, deleteContent, notifyUser } = request.body;

      // Check if user exists and is not already banned
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
          bannedAt: true
        }
      });

      if (!targetUser) {
        throwNotFound('User');
      }

      if (targetUser.bannedAt) {
        throwBadRequest('User is already banned');
      }

      // Prevent banning other admins/moderators
      if (targetUser.role === 'ADMIN' || targetUser.role === 'MODERATOR') {
        throwForbidden('Cannot ban administrators or moderators');
      }

      const banExpiresAt = duration 
        ? new Date(Date.now() + (duration * 24 * 60 * 60 * 1000))
        : null;

      // Ban the user
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            bannedAt: new Date(),
            banReason: reason,
            banExpiresAt,
            bannedBy: request.userId
          }
        });

        // Create moderation log
        await tx.moderationLog.create({
          data: {
            action: 'USER_BANNED',
            moderatorId: request.userId,
            targetUserId: userId,
            reason,
            metadata: {
              duration,
              deleteContent,
              expiresAt: banExpiresAt?.toISOString()
            }
          }
        });

        // Optionally delete user content
        if (deleteContent) {
          await Promise.all([
            tx.post.updateMany({
              where: { userId },
              data: { isRemoved: true, removedReason: 'User banned' }
            }),
            tx.comment.updateMany({
              where: { userId },
              data: { isRemoved: true, removedReason: 'User banned' }
            })
          ]);
        }
      });

      // Send notification to user
      if (notifyUser && fastify.services?.notifications) {
        await fastify.services.notifications.createNotification({
          userId,
          type: 'SYSTEM',
          title: 'Account Suspended',
          content: `Your account has been banned. Reason: ${reason}`,
          priority: 'high',
          channels: ['in_app', 'email']
        });
      }

      // Emit real-time event for user disconnection
      fastify.io.to(`user:${userId}`).emit('accountBanned', {
        reason,
        expiresAt: banExpiresAt?.toISOString(),
        bannedAt: new Date().toISOString()
      });

      reply.send({
        success: true,
        message: 'User banned successfully',
        data: {
          userId,
          reason,
          expiresAt: banExpiresAt?.toISOString(),
          bannedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      fastify.log.error('User ban error:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /admin/users/{userId}/unban:
   *   post:
   *     tags: [admin]
   *     summary: Unban a user
   *     security:
   *       - Bearer: []
   */
  fastify.post('/users/:userId/unban', {
    preHandler: [
      validate({
        params: z.object({
          userId: z.string().cuid()
        }),
        body: z.object({
          reason: z.string().min(5).max(500).optional()
        })
      })
    ]
  }, async (request: any, reply) => {
    try {
      const { userId } = request.params;
      const { reason } = request.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bannedAt: true, username: true }
      });

      if (!user) {
        throwNotFound('User');
      }

      if (!user.bannedAt) {
        throwBadRequest('User is not banned');
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            bannedAt: null,
            banReason: null,
            banExpiresAt: null,
            bannedBy: null
          }
        });

        await tx.moderationLog.create({
          data: {
            action: 'USER_UNBANNED',
            moderatorId: request.userId,
            targetUserId: userId,
            reason: reason || 'Ban lifted by administrator'
          }
        });
      });

      // Notify user
      if (fastify.services?.notifications) {
        await fastify.services.notifications.createNotification({
          userId,
          type: 'SYSTEM',
          title: 'Account Reinstated',
          content: 'Your account ban has been lifted. Welcome back!',
          priority: 'normal',
          channels: ['in_app', 'email']
        });
      }

      reply.send({
        success: true,
        message: 'User unbanned successfully'
      });
    } catch (error) {
      fastify.log.error('User unban error:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /admin/reports:
   *   get:
   *     tags: [admin]
   *     summary: Get reports for moderation
   *     security:
   *       - Bearer: []
   */
  fastify.get('/reports', {
    preHandler: [
      validate({
        query: z.object({
          ...commonSchemas.pagination.shape,
          status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']).optional(),
          type: z.enum(['USER', 'POST', 'COMMENT', 'MESSAGE', 'SERVER']).optional(),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
          sortBy: z.enum(['createdAt', 'priority', 'type']).default('createdAt'),
          sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
      })
    ]
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 25, status, type, priority, sortBy, sortOrder } = request.query;

      let whereClause: any = {};

      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (priority) whereClause.priority = priority;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where: whereClause,
          include: {
            reporter: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            reported: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            moderator: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.report.count({ where: whereClause })
      ]);

      reply.send({
        success: true,
        data: {
          reports,
          pagination: {
            total,
            page,
            pageSize: limit,
            hasMore: page * limit < total
          }
        }
      });
    } catch (error) {
      fastify.log.error('Admin reports error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch reports'
      });
    }
  });

  /**
   * @swagger
   * /admin/reports/{reportId}/resolve:
   *   post:
   *     tags: [admin]
   *     summary: Resolve a report
   *     security:
   *       - Bearer: []
   */
  fastify.post('/reports/:reportId/resolve', {
    preHandler: [
      validate({
        params: z.object({
          reportId: z.string().cuid()
        }),
        body: z.object({
          action: z.enum(['DISMISS', 'WARN', 'SUSPEND', 'BAN', 'DELETE_CONTENT']),
          reason: z.string().min(5).max(500),
          duration: z.number().min(1).max(365).optional(),
          notifyReporter: z.boolean().default(true),
          notifyReported: z.boolean().default(true)
        })
      })
    ]
  }, async (request: any, reply) => {
    try {
      const { reportId } = request.params;
      const { action, reason, duration, notifyReporter, notifyReported } = request.body;

      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          reporter: true,
          reported: true
        }
      });

      if (!report) {
        throwNotFound('Report');
      }

      if (report.status !== 'PENDING') {
        throwBadRequest('Report has already been resolved');
      }

      await prisma.$transaction(async (tx) => {
        // Update report status
        await tx.report.update({
          where: { id: reportId },
          data: {
            status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
            moderatorId: request.userId,
            resolvedAt: new Date(),
            resolution: reason
          }
        });

        // Create moderation log
        await tx.moderationLog.create({
          data: {
            action: `REPORT_${action}`,
            moderatorId: request.userId,
            targetUserId: report.reportedId,
            reportId: reportId,
            reason,
            metadata: {
              originalReport: report.reason,
              duration
            }
          }
        });

        // Take action based on resolution
        switch (action) {
          case 'SUSPEND':
            const suspensionEnd = duration 
              ? new Date(Date.now() + (duration * 24 * 60 * 60 * 1000))
              : new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // Default 7 days

            await tx.user.update({
              where: { id: report.reportedId },
              data: {
                suspendedAt: new Date(),
                suspensionEndsAt: suspensionEnd,
                suspensionReason: reason
              }
            });
            break;

          case 'BAN':
            const banExpiresAt = duration 
              ? new Date(Date.now() + (duration * 24 * 60 * 60 * 1000))
              : null;

            await tx.user.update({
              where: { id: report.reportedId },
              data: {
                bannedAt: new Date(),
                banReason: reason,
                banExpiresAt,
                bannedBy: request.userId
              }
            });
            break;

          case 'DELETE_CONTENT':
            // Handle content deletion based on report type
            if (report.contentId) {
              switch (report.type) {
                case 'POST':
                  await tx.post.update({
                    where: { id: report.contentId },
                    data: { isRemoved: true, removedReason: reason }
                  });
                  break;
                case 'COMMENT':
                  await tx.comment.update({
                    where: { id: report.contentId },
                    data: { isRemoved: true, removedReason: reason }
                  });
                  break;
              }
            }
            break;
        }
      });

      // Send notifications
      if (notifyReporter && fastify.services?.notifications && report.reporter) {
        await fastify.services.notifications.createNotification({
          userId: report.reporter.id,
          type: 'SYSTEM',
          title: 'Report Update',
          content: `Your report has been reviewed and action has been taken. Thank you for helping keep CRYB safe.`,
          priority: 'normal',
          channels: ['in_app']
        });
      }

      if (notifyReported && fastify.services?.notifications && action !== 'DISMISS') {
        let message = '';
        switch (action) {
          case 'WARN':
            message = `You have received a warning for violating community guidelines. Reason: ${reason}`;
            break;
          case 'SUSPEND':
            message = `Your account has been temporarily suspended. Reason: ${reason}`;
            break;
          case 'BAN':
            message = `Your account has been banned. Reason: ${reason}`;
            break;
          case 'DELETE_CONTENT':
            message = `Your content has been removed for violating community guidelines. Reason: ${reason}`;
            break;
        }

        if (message) {
          await fastify.services.notifications.createNotification({
            userId: report.reportedId,
            type: 'SYSTEM',
            title: 'Moderation Action',
            content: message,
            priority: action === 'BAN' ? 'high' : 'normal',
            channels: ['in_app', 'email']
          });
        }
      }

      reply.send({
        success: true,
        message: 'Report resolved successfully',
        data: {
          action,
          reason,
          resolvedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      fastify.log.error('Report resolution error:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /admin/analytics:
   *   get:
   *     tags: [admin]
   *     summary: Get platform analytics
   *     security:
   *       - Bearer: []
   */
  fastify.get('/analytics', {
    preHandler: [
      validate({
        query: z.object({
          timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
          metrics: z.array(z.enum(['users', 'content', 'engagement', 'moderation', 'revenue'])).optional()
        })
      })
    ]
  }, async (request: any, reply) => {
    try {
      const { timeframe, metrics } = request.query;
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const analytics = await getDetailedAnalytics(cutoffDate, metrics);

      reply.send({
        success: true,
        data: analytics,
        timeframe,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error('Admin analytics error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to generate analytics'
      });
    }
  });

  /**
   * @swagger
   * /admin/system/maintenance:
   *   post:
   *     tags: [admin]
   *     summary: Enable/disable maintenance mode
   *     security:
   *       - Bearer: []
   */
  fastify.post('/system/maintenance', {
    preHandler: [
      validate({
        body: z.object({
          enabled: z.boolean(),
          message: z.string().max(500).optional(),
          estimatedDuration: z.number().min(1).max(1440).optional() // minutes
        })
      })
    ]
  }, async (request: any, reply) => {
    try {
      const { enabled, message, estimatedDuration } = request.body;

      // Only super admins can enable maintenance mode
      if (request.userRole !== 'ADMIN') {
        throwForbidden('Super admin access required');
      }

      const maintenanceData = {
        enabled,
        message: message || 'System maintenance in progress',
        startedAt: enabled ? new Date() : null,
        estimatedDuration,
        initiatedBy: request.userId
      };

      // Store maintenance status (this would typically be in a system settings table)
      // For now, we'll use a simple approach
      fastify.maintenanceMode = maintenanceData;

      // Broadcast to all connected users
      fastify.io.emit('maintenanceMode', maintenanceData);

      // Log the action
      await prisma.moderationLog.create({
        data: {
          action: enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
          moderatorId: request.userId,
          reason: message || 'Maintenance mode toggled',
          metadata: {
            estimatedDuration,
            timestamp: new Date().toISOString()
          }
        }
      });

      reply.send({
        success: true,
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
        data: maintenanceData
      });
    } catch (error) {
      fastify.log.error('Maintenance mode error:', error);
      throw error;
    }
  });

  // Helper functions
  async function getSystemHealth() {
    try {
      const [dbStatus, elasticsearchStatus, redisStatus] = await Promise.all([
        // Database health
        prisma.$queryRaw`SELECT 1 as status`.then(() => 'healthy').catch(() => 'unhealthy'),
        
        // Elasticsearch health
        fastify.services?.elasticsearch?.ping().then(healthy => healthy ? 'healthy' : 'unhealthy').catch(() => 'unhealthy'),
        
        // Redis health (if available)
        Promise.resolve('healthy') // Add actual Redis check if needed
      ]);

      return {
        database: dbStatus,
        elasticsearch: elasticsearchStatus,
        redis: redisStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        database: 'unknown',
        elasticsearch: 'unknown',
        redis: 'unknown',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    }
  }

  async function getModerationQueueSize() {
    const pendingReports = await prisma.report.count({
      where: { status: 'PENDING' }
    });

    const flaggedContent = await prisma.post.count({
      where: {
        isReported: true,
        isRemoved: false
      }
    });

    return {
      reports: pendingReports,
      flaggedContent,
      total: pendingReports + flaggedContent
    };
  }

  async function getAutoModerationStats(cutoffDate: Date) {
    // Mock auto-moderation stats - implement based on your auto-mod system
    return {
      spamDetected: Math.floor(Math.random() * 100),
      toxicContentFiltered: Math.floor(Math.random() * 50),
      duplicatesRemoved: Math.floor(Math.random() * 25),
      ruleViolations: Math.floor(Math.random() * 75)
    };
  }

  async function getDetailedAnalytics(cutoffDate: Date, requestedMetrics?: string[]) {
    const metrics = requestedMetrics || ['users', 'content', 'engagement', 'moderation'];
    const analytics: any = {};

    if (metrics.includes('users')) {
      analytics.users = {
        newSignups: await prisma.user.count({
          where: { createdAt: { gte: cutoffDate } }
        }),
        activeUsers: await prisma.user.count({
          where: { lastSeenAt: { gte: cutoffDate } }
        }),
        retentionRate: 85.2, // Mock - calculate based on actual data
        demographicsData: {
          // Mock data - implement based on your user data collection
          ageGroups: { '18-24': 35, '25-34': 40, '35-44': 20, '45+': 5 },
          topCountries: ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia']
        }
      };
    }

    if (metrics.includes('content')) {
      analytics.content = {
        postsCreated: await prisma.post.count({
          where: { createdAt: { gte: cutoffDate } }
        }),
        commentsCreated: await prisma.comment.count({
          where: { createdAt: { gte: cutoffDate } }
        }),
        messagesExchanged: await prisma.message.count({
          where: { createdAt: { gte: cutoffDate } }
        }),
        fileUploads: Math.floor(Math.random() * 1000), // Mock - implement based on file storage
        topCategories: ['Gaming', 'Technology', 'Art', 'Music', 'General']
      };
    }

    if (metrics.includes('engagement')) {
      analytics.engagement = {
        averageSessionTime: '24 minutes', // Mock
        dailyActiveUsers: Math.floor(Math.random() * 10000),
        messageFrequency: 156.7, // messages per user
        postEngagementRate: 12.4, // percentage
        communityGrowthRate: 8.3 // percentage
      };
    }

    if (metrics.includes('moderation')) {
      analytics.moderation = {
        reportsReceived: await prisma.report.count({
          where: { createdAt: { gte: cutoffDate } }
        }),
        actionsPerformed: await prisma.moderationLog.count({
          where: { createdAt: { gte: cutoffDate } }
        }),
        averageResponseTime: '2.3 hours', // Mock
        automatedActions: await getAutoModerationStats(cutoffDate),
        topViolationTypes: ['Spam', 'Harassment', 'Inappropriate Content', 'Hate Speech']
      };
    }

    return analytics;
  }
}