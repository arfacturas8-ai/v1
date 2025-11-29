import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { NotificationType, NotificationPriority, DeliveryStatus } from '@prisma/client';

interface SendBulkNotificationBody {
  userIds?: string[];
  userFilters?: {
    premiumType?: string;
    lastSeenSince?: string;
    communityIds?: string[];
    serverIds?: string[];
  };
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: string;
}

interface CreateTemplateBody {
  type: NotificationType;
  name: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  sound?: string;
  badge?: boolean;
}

interface UpdateTemplateBody extends Partial<CreateTemplateBody> {
  isActive?: boolean;
}

async function notificationManagementRoutes(fastify: FastifyInstance) {
  // Require admin authentication for all routes
  fastify.addHook('preHandler', (fastify as any).requireAdmin);

  /**
   * Get notification overview/dashboard
   */
  fastify.get(
    '/dashboard',
    {
      schema: {
        description: 'Get notification dashboard overview',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              overview: {
                type: 'object',
                properties: {
                  totalSent: { type: 'integer' },
                  totalDelivered: { type: 'integer' },
                  totalFailed: { type: 'integer' },
                  totalDevices: { type: 'integer' },
                  activeDevices: { type: 'integer' },
                  recentDeliveries: { type: 'integer' },
                  queueStats: { type: 'object' },
                },
              },
              recentNotifications: { type: 'array' },
              deliveryTrends: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const notificationService = (fastify as any).notificationIntegrationService;

        // Get overall metrics
        const [metrics, queueStats, recentNotifications] = await Promise.all([
          notificationService.getNotificationMetrics(),
          notificationService.getQueueStats(),
          (fastify as any).prisma.pushNotificationDelivery.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { displayName: true, username: true } },
            },
          }),
        ]);

        // Get delivery stats for the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const deliveryStats = await notificationService.getDeliveryStats(
          undefined,
          oneDayAgo,
          new Date()
        );

        const totalSent = deliveryStats.reduce((sum, stat) => sum + stat._count, 0);
        const totalDelivered = deliveryStats
          .filter(stat => stat.status === DeliveryStatus.DELIVERED)
          .reduce((sum, stat) => sum + stat._count, 0);
        const totalFailed = deliveryStats
          .filter(stat => stat.status === DeliveryStatus.FAILED)
          .reduce((sum, stat) => sum + stat._count, 0);

        // Get delivery trends for the last 7 days
        const deliveryTrends = await this.getDeliveryTrends();

        return reply.send({
          success: true,
          overview: {
            totalSent,
            totalDelivered,
            totalFailed,
            ...metrics,
            queueStats,
          },
          recentNotifications: recentNotifications.map(notification => ({
            id: notification.id,
            title: notification.title,
            body: notification.body,
            status: notification.status,
            provider: notification.provider,
            user: notification.user,
            createdAt: notification.createdAt,
          })),
          deliveryTrends,
        });
      } catch (error) {
        fastify.log.error('Error getting notification dashboard:', error);
        return reply.code(500).send({ error: 'Failed to get dashboard data' });
      }
    }
  );

  /**
   * Send bulk notifications
   */
  fastify.post<{ Body: SendBulkNotificationBody }>(
    '/bulk-send',
    {
      schema: {
        description: 'Send bulk notifications to users',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['title', 'body', 'type'],
          properties: {
            userIds: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 10000,
            },
            userFilters: {
              type: 'object',
              properties: {
                premiumType: { type: 'string' },
                lastSeenSince: { type: 'string', format: 'date-time' },
                communityIds: { type: 'array', items: { type: 'string' } },
                serverIds: { type: 'array', items: { type: 'string' } },
              },
            },
            title: { type: 'string', maxLength: 100 },
            body: { type: 'string', maxLength: 500 },
            type: { 
              type: 'string',
              enum: Object.values(NotificationType),
            },
            data: { type: 'object' },
            priority: { 
              type: 'string',
              enum: Object.values(NotificationPriority),
            },
            scheduledAt: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              batchId: { type: 'string' },
              totalUsers: { type: 'integer' },
              totalBatches: { type: 'integer' },
              scheduled: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SendBulkNotificationBody }>, reply: FastifyReply) => {
      try {
        const notificationService = (fastify as any).notificationIntegrationService;
        let targetUserIds: string[] = [];

        // Get target users based on filters or direct IDs
        if (request.body.userIds) {
          targetUserIds = request.body.userIds;
        } else if (request.body.userFilters) {
          targetUserIds = await this.getUsersByFilters(request.body.userFilters);
        } else {
          return reply.code(400).send({ error: 'Either userIds or userFilters must be provided' });
        }

        if (targetUserIds.length === 0) {
          return reply.code(400).send({ error: 'No users found matching criteria' });
        }

        // Create notifications for all target users
        const notifications = targetUserIds.map(userId => ({
          userId,
          type: request.body.type,
          title: request.body.title,
          body: request.body.body,
          data: request.body.data,
          priority: request.body.priority || NotificationPriority.NORMAL,
          scheduledAt: request.body.scheduledAt ? new Date(request.body.scheduledAt) : undefined,
        }));

        // Queue bulk notifications
        const result = await notificationService.queueBulkNotifications(notifications);

        return reply.send({
          success: true,
          batchId: result.batchId,
          totalUsers: targetUserIds.length,
          totalBatches: result.totalBatches,
          scheduled: !!request.body.scheduledAt,
        });
      } catch (error) {
        fastify.log.error('Error sending bulk notifications:', error);
        return reply.code(500).send({ error: 'Failed to send bulk notifications' });
      }
    }
  );

  /**
   * Get notification templates
   */
  fastify.get(
    '/templates',
    {
      schema: {
        description: 'Get all notification templates',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            active: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              templates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    name: { type: 'string' },
                    title: { type: 'string' },
                    body: { type: 'string' },
                    data: { type: 'object' },
                    priority: { type: 'string' },
                    sound: { type: 'string' },
                    badge: { type: 'boolean' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { type?: string; active?: boolean } }>, reply: FastifyReply) => {
      try {
        const { type, active } = request.query;
        
        const where: any = {};
        if (type) where.type = type;
        if (active !== undefined) where.isActive = active;

        const templates = await (fastify as any).prisma.notificationTemplate.findMany({
          where,
          orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });

        return reply.send({
          success: true,
          templates,
        });
      } catch (error) {
        fastify.log.error('Error getting notification templates:', error);
        return reply.code(500).send({ error: 'Failed to get templates' });
      }
    }
  );

  /**
   * Create notification template
   */
  fastify.post<{ Body: CreateTemplateBody }>(
    '/templates',
    {
      schema: {
        description: 'Create a new notification template',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['type', 'name', 'title', 'body'],
          properties: {
            type: { 
              type: 'string',
              enum: Object.values(NotificationType),
            },
            name: { type: 'string', maxLength: 100 },
            title: { type: 'string', maxLength: 200 },
            body: { type: 'string', maxLength: 1000 },
            data: { type: 'object' },
            priority: { 
              type: 'string',
              enum: Object.values(NotificationPriority),
            },
            sound: { type: 'string' },
            badge: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              template: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateTemplateBody }>, reply: FastifyReply) => {
      try {
        const notificationService = (fastify as any).notificationIntegrationService;

        const template = await notificationService.createNotificationTemplate({
          ...request.body,
          priority: request.body.priority || NotificationPriority.NORMAL,
          badge: request.body.badge !== false,
          isActive: true,
        });

        return reply.send({
          success: true,
          template,
        });
      } catch (error) {
        fastify.log.error('Error creating notification template:', error);
        return reply.code(500).send({ error: 'Failed to create template' });
      }
    }
  );

  /**
   * Update notification template
   */
  fastify.put<{ Params: { templateId: string }; Body: UpdateTemplateBody }>(
    '/templates/:templateId',
    {
      schema: {
        description: 'Update a notification template',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['templateId'],
          properties: {
            templateId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            type: { 
              type: 'string',
              enum: Object.values(NotificationType),
            },
            name: { type: 'string', maxLength: 100 },
            title: { type: 'string', maxLength: 200 },
            body: { type: 'string', maxLength: 1000 },
            data: { type: 'object' },
            priority: { 
              type: 'string',
              enum: Object.values(NotificationPriority),
            },
            sound: { type: 'string' },
            badge: { type: 'boolean' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              template: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { templateId: string }; Body: UpdateTemplateBody }>, reply: FastifyReply) => {
      try {
        const notificationService = (fastify as any).notificationIntegrationService;

        const template = await notificationService.updateNotificationTemplate(
          request.params.templateId,
          request.body
        );

        return reply.send({
          success: true,
          template,
        });
      } catch (error) {
        fastify.log.error('Error updating notification template:', error);
        return reply.code(500).send({ error: 'Failed to update template' });
      }
    }
  );

  /**
   * Get notification analytics
   */
  fastify.get(
    '/analytics',
    {
      schema: {
        description: 'Get notification analytics',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            groupBy: { type: 'string', enum: ['day', 'hour', 'provider', 'type'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              analytics: {
                type: 'object',
                properties: {
                  deliveryStats: { type: 'array' },
                  providerStats: { type: 'array' },
                  typeStats: { type: 'array' },
                  trends: { type: 'array' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string; groupBy?: string } }>, reply: FastifyReply) => {
      try {
        const { startDate, endDate, groupBy = 'day' } = request.query;
        const notificationService = (fastify as any).notificationIntegrationService;

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const [deliveryStats, providerStats, typeStats] = await Promise.all([
          notificationService.getDeliveryStats(undefined, start, end),
          this.getProviderStats(start, end),
          this.getTypeStats(start, end),
        ]);

        const trends = await this.getTrendData(start, end, groupBy);

        return reply.send({
          success: true,
          analytics: {
            deliveryStats,
            providerStats,
            typeStats,
            trends,
          },
        });
      } catch (error) {
        fastify.log.error('Error getting notification analytics:', error);
        return reply.code(500).send({ error: 'Failed to get analytics' });
      }
    }
  );

  /**
   * Retry failed notifications
   */
  fastify.post(
    '/retry-failed',
    {
      schema: {
        description: 'Retry failed notifications',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            maxAgeHours: { type: 'integer', minimum: 1, maximum: 168 }, // Max 7 days
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              retried: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { maxAgeHours?: number } }>, reply: FastifyReply) => {
      try {
        const notificationService = (fastify as any).notificationIntegrationService;
        const maxAge = request.body.maxAgeHours || 24;

        const result = await notificationService.retryFailedNotifications(maxAge);

        return reply.send({
          success: true,
          retried: result.retried,
          total: result.total,
        });
      } catch (error) {
        fastify.log.error('Error retrying failed notifications:', error);
        return reply.code(500).send({ error: 'Failed to retry notifications' });
      }
    }
  );

  /**
   * Get queue statistics
   */
  fastify.get(
    '/queue/stats',
    {
      schema: {
        description: 'Get notification queue statistics',
        tags: ['Admin', 'Notifications'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              stats: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const notificationService = (fastify as any).notificationIntegrationService;
        const stats = await notificationService.getQueueStats();

        return reply.send({
          success: true,
          stats,
        });
      } catch (error) {
        fastify.log.error('Error getting queue stats:', error);
        return reply.code(500).send({ error: 'Failed to get queue stats' });
      }
    }
  );

  /**
   * Helper methods
   */

  // Get users by filters
  async function getUsersByFilters(filters: any): Promise<string[]> {
    const where: any = {
      bannedAt: null, // Exclude banned users
    };

    if (filters.premiumType) {
      where.premiumType = filters.premiumType;
    }

    if (filters.lastSeenSince) {
      where.lastSeenAt = {
        gte: new Date(filters.lastSeenSince),
      };
    }

    if (filters.communityIds && filters.communityIds.length > 0) {
      where.CommunityMember = {
        some: {
          communityId: { in: filters.communityIds },
        },
      };
    }

    if (filters.serverIds && filters.serverIds.length > 0) {
      where.ServerMember = {
        some: {
          serverId: { in: filters.serverIds },
        },
      };
    }

    const users = await (fastify as any).prisma.user.findMany({
      where,
      select: { id: true },
      take: 10000, // Limit to prevent memory issues
    });

    return users.map(user => user.id);
  }

  // Get provider statistics
  async function getProviderStats(startDate: Date, endDate: Date) {
    return (fastify as any).prisma.pushNotificationDelivery.groupBy({
      by: ['provider', 'status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });
  }

  // Get notification type statistics
  async function getTypeStats(startDate: Date, endDate: Date) {
    return (fastify as any).prisma.notification.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });
  }

  // Get trend data
  async function getTrendData(startDate: Date, endDate: Date, groupBy: string) {
    // This would require more complex aggregation queries
    // For now, return a simple day-by-day breakdown
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const deliveries = await (fastify as any).prisma.pushNotificationDelivery.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      days.push({
        date: dayStart.toISOString().split('T')[0],
        count: deliveries,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  // Get delivery trends for dashboard
  async function getDeliveryTrends() {
    const trends = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [sent, delivered, failed] = await Promise.all([
        (fastify as any).prisma.pushNotificationDelivery.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        (fastify as any).prisma.pushNotificationDelivery.count({
          where: { 
            createdAt: { gte: dayStart, lte: dayEnd },
            status: DeliveryStatus.DELIVERED,
          },
        }),
        (fastify as any).prisma.pushNotificationDelivery.count({
          where: { 
            createdAt: { gte: dayStart, lte: dayEnd },
            status: DeliveryStatus.FAILED,
          },
        }),
      ]);

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        sent,
        delivered,
        failed,
      });
    }

    return trends;
  }
}

export default notificationManagementRoutes;