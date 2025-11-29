import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DeviceType, NotificationType, NotificationPriority } from '@prisma/client';
import { EnhancedPushNotificationService } from '../services/enhanced-push-notifications';

interface RegisterDeviceBody {
  token: string;
  type: DeviceType;
  model?: string;
  osVersion?: string;
  appVersion?: string;
}

interface UnregisterDeviceBody {
  token: string;
}

interface UpdatePreferencesBody {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  newMessageEnabled?: boolean;
  mentionEnabled?: boolean;
  replyEnabled?: boolean;
  followEnabled?: boolean;
  likeEnabled?: boolean;
  commentEnabled?: boolean;
  awardEnabled?: boolean;
  systemEnabled?: boolean;
  dmEnabled?: boolean;
  voiceCallEnabled?: boolean;
  serverInviteEnabled?: boolean;
  communityInviteEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

interface SendTestNotificationBody {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
}

interface SendBulkNotificationBody {
  userIds: string[];
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: string;
}

async function pushNotificationRoutes(fastify: FastifyInstance) {
  let pushService: EnhancedPushNotificationService;

  // Initialize push service
  fastify.addHook('onReady', async () => {
    pushService = new EnhancedPushNotificationService(fastify);
  });

  // Register device for push notifications
  fastify.post<{ Body: RegisterDeviceBody }>(
    '/register-device',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Register device for push notifications',
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['token', 'type'],
          properties: {
            token: { type: 'string', description: 'Device push token' },
            type: { 
              type: 'string', 
              enum: ['IOS', 'ANDROID', 'WEB', 'DESKTOP'],
              description: 'Device type' 
            },
            model: { type: 'string', description: 'Device model' },
            osVersion: { type: 'string', description: 'OS version' },
            appVersion: { type: 'string', description: 'App version' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              device: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  deviceToken: { type: 'string' },
                  deviceType: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterDeviceBody }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const device = await pushService.registerDevice(userId, request.body);
        
        return reply.send({
          success: true,
          device,
        });
      } catch (error) {
        fastify.log.error('Error registering device:', error);
        return reply.code(500).send({ error: 'Failed to register device' });
      }
    }
  );

  // Unregister device
  fastify.post<{ Body: UnregisterDeviceBody }>(
    '/unregister-device',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Unregister device from push notifications',
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', description: 'Device push token' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: UnregisterDeviceBody }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        await pushService.unregisterDevice(userId, request.body.token);
        
        return reply.send({
          success: true,
          message: 'Device unregistered successfully',
        });
      } catch (error) {
        fastify.log.error('Error unregistering device:', error);
        return reply.code(500).send({ error: 'Failed to unregister device' });
      }
    }
  );

  // Get notification preferences
  fastify.get(
    '/preferences',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get user notification preferences',
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              preferences: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  pushEnabled: { type: 'boolean' },
                  emailEnabled: { type: 'boolean' },
                  smsEnabled: { type: 'boolean' },
                  newMessageEnabled: { type: 'boolean' },
                  mentionEnabled: { type: 'boolean' },
                  replyEnabled: { type: 'boolean' },
                  followEnabled: { type: 'boolean' },
                  likeEnabled: { type: 'boolean' },
                  commentEnabled: { type: 'boolean' },
                  awardEnabled: { type: 'boolean' },
                  systemEnabled: { type: 'boolean' },
                  dmEnabled: { type: 'boolean' },
                  voiceCallEnabled: { type: 'boolean' },
                  serverInviteEnabled: { type: 'boolean' },
                  communityInviteEnabled: { type: 'boolean' },
                  quietHoursEnabled: { type: 'boolean' },
                  quietHoursStart: { type: 'string' },
                  quietHoursEnd: { type: 'string' },
                  timezone: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const preferences = await pushService.getNotificationPreferences(userId);
        
        return reply.send({
          success: true,
          preferences,
        });
      } catch (error) {
        fastify.log.error('Error getting preferences:', error);
        return reply.code(500).send({ error: 'Failed to get preferences' });
      }
    }
  );

  // Update notification preferences
  fastify.put<{ Body: UpdatePreferencesBody }>(
    '/preferences',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Update user notification preferences',
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            pushEnabled: { type: 'boolean' },
            emailEnabled: { type: 'boolean' },
            smsEnabled: { type: 'boolean' },
            newMessageEnabled: { type: 'boolean' },
            mentionEnabled: { type: 'boolean' },
            replyEnabled: { type: 'boolean' },
            followEnabled: { type: 'boolean' },
            likeEnabled: { type: 'boolean' },
            commentEnabled: { type: 'boolean' },
            awardEnabled: { type: 'boolean' },
            systemEnabled: { type: 'boolean' },
            dmEnabled: { type: 'boolean' },
            voiceCallEnabled: { type: 'boolean' },
            serverInviteEnabled: { type: 'boolean' },
            communityInviteEnabled: { type: 'boolean' },
            quietHoursEnabled: { type: 'boolean' },
            quietHoursStart: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
            quietHoursEnd: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
            timezone: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              preferences: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: UpdatePreferencesBody }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const preferences = await pushService.updateNotificationPreferences(userId, request.body);
        
        return reply.send({
          success: true,
          preferences,
        });
      } catch (error) {
        fastify.log.error('Error updating preferences:', error);
        return reply.code(500).send({ error: 'Failed to update preferences' });
      }
    }
  );

  // Get user's registered devices
  fastify.get(
    '/devices',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get user\'s registered devices',
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              devices: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    deviceType: { type: 'string' },
                    deviceModel: { type: 'string' },
                    osVersion: { type: 'string' },
                    appVersion: { type: 'string' },
                    isActive: { type: 'boolean' },
                    lastActiveAt: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const devices = await (fastify as any).prisma.pushDevice.findMany({
          where: { userId },
          select: {
            id: true,
            deviceType: true,
            deviceModel: true,
            osVersion: true,
            appVersion: true,
            isActive: true,
            lastActiveAt: true,
            createdAt: true,
          },
          orderBy: { lastActiveAt: 'desc' },
        });
        
        return reply.send({
          success: true,
          devices,
        });
      } catch (error) {
        fastify.log.error('Error getting devices:', error);
        return reply.code(500).send({ error: 'Failed to get devices' });
      }
    }
  );

  // Send test notification
  fastify.post<{ Body: SendTestNotificationBody }>(
    '/test',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Send test notification to user',
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['title', 'body'],
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            data: { type: 'object' },
            priority: { 
              type: 'string',
              enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SendTestNotificationBody }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const result = await pushService.sendNotification({
          userId,
          type: NotificationType.SYSTEM,
          title: request.body.title,
          body: request.body.body,
          data: request.body.data,
          priority: request.body.priority || NotificationPriority.NORMAL,
        });
        
        return reply.send({
          success: result.success,
          message: result.success ? 'Test notification sent' : 'Failed to send test notification',
        });
      } catch (error) {
        fastify.log.error('Error sending test notification:', error);
        return reply.code(500).send({ error: 'Failed to send test notification' });
      }
    }
  );

  // Get notification history
  fastify.get(
    '/history',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Get user notification history',
        tags: ['Push Notifications'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
            type: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              notifications: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    data: { type: 'object' },
                    isRead: { type: 'boolean' },
                    createdAt: { type: 'string' },
                  },
                },
              },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: number; offset?: number; type?: string } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { limit = 20, offset = 0, type } = request.query;
        
        const where: any = { userId };
        if (type) {
          where.type = type;
        }

        const [notifications, total] = await Promise.all([
          (fastify as any).prisma.notification.findMany({
            where,
            select: {
              id: true,
              type: true,
              title: true,
              content: true,
              data: true,
              isRead: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          (fastify as any).prisma.notification.count({ where }),
        ]);
        
        return reply.send({
          success: true,
          notifications,
          total,
        });
      } catch (error) {
        fastify.log.error('Error getting notification history:', error);
        return reply.code(500).send({ error: 'Failed to get notification history' });
      }
    }
  );

  // Mark notifications as read
  fastify.post<{ Body: { notificationIds: string[] } }>(
    '/mark-read',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Mark notifications as read',
        tags: ['Push Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['notificationIds'],
          properties: {
            notificationIds: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              updated: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { notificationIds: string[] } }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as any)?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const result = await (fastify as any).prisma.notification.updateMany({
          where: {
            id: { in: request.body.notificationIds },
            userId,
          },
          data: {
            isRead: true,
          },
        });
        
        return reply.send({
          success: true,
          updated: result.count,
        });
      } catch (error) {
        fastify.log.error('Error marking notifications as read:', error);
        return reply.code(500).send({ error: 'Failed to mark notifications as read' });
      }
    }
  );

  // Admin routes for bulk notifications
  fastify.post<{ Body: SendBulkNotificationBody }>(
    '/admin/bulk-send',
    {
      preHandler: [fastify.authenticate, (fastify as any).requireAdmin],
      schema: {
        description: 'Send bulk notifications (Admin only)',
        tags: ['Push Notifications', 'Admin'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['userIds', 'title', 'body', 'type'],
          properties: {
            userIds: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 1000,
            },
            title: { type: 'string' },
            body: { type: 'string' },
            type: { 
              type: 'string',
              enum: Object.values(NotificationType),
            },
            data: { type: 'object' },
            priority: { 
              type: 'string',
              enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
            },
            scheduledAt: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              queued: { type: 'integer' },
              failed: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SendBulkNotificationBody }>, reply: FastifyReply) => {
      try {
        const notifications = request.body.userIds.map(userId => ({
          userId,
          type: request.body.type,
          title: request.body.title,
          body: request.body.body,
          data: request.body.data,
          priority: request.body.priority as NotificationPriority,
          scheduledAt: request.body.scheduledAt ? new Date(request.body.scheduledAt) : undefined,
        }));

        const results = await pushService.sendBulkNotifications(notifications);
        
        const successful = results.filter(r => r.result.success).length;
        const failed = results.filter(r => !r.result.success).length;
        
        return reply.send({
          success: true,
          queued: successful,
          failed,
        });
      } catch (error) {
        fastify.log.error('Error sending bulk notifications:', error);
        return reply.code(500).send({ error: 'Failed to send bulk notifications' });
      }
    }
  );

  // Get delivery statistics
  fastify.get(
    '/admin/stats',
    {
      preHandler: [fastify.authenticate, (fastify as any).requireAdmin],
      schema: {
        description: 'Get notification delivery statistics (Admin only)',
        tags: ['Push Notifications', 'Admin'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            userId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              stats: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    provider: { type: 'string' },
                    _count: { type: 'integer' },
                  },
                },
              },
              metrics: {
                type: 'object',
                properties: {
                  totalDevices: { type: 'integer' },
                  activeDevices: { type: 'integer' },
                  recentDeliveries: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string; userId?: string } }>, reply: FastifyReply) => {
      try {
        const { startDate, endDate, userId } = request.query;

        const [stats, metrics] = await Promise.all([
          pushService.getDeliveryStats(
            userId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
          ),
          pushService.getNotificationMetrics(),
        ]);
        
        return reply.send({
          success: true,
          stats,
          metrics,
        });
      } catch (error) {
        fastify.log.error('Error getting notification stats:', error);
        return reply.code(500).send({ error: 'Failed to get notification stats' });
      }
    }
  );
}

export default pushNotificationRoutes;