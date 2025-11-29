import { FastifyInstance } from 'fastify';
import adminUsersRoutes from './users';
import adminModerationRoutes from './moderation';
import adminAnalyticsRoutes from './analytics';
import { authMiddleware } from '../../middleware/auth';
import { analyticsViewerMiddleware } from '../../middleware/admin';

export default async function adminRoutes(fastify: FastifyInstance) {
  // Apply authentication to all admin routes
  fastify.addHook('onRequest', authMiddleware);

  /**
   * GET /api/v1/admin
   * Admin dashboard overview
   */
  fastify.get('/', {
    preHandler: analyticsViewerMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get admin dashboard overview'
    }
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: {
        message: 'Welcome to CRYB Admin API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        admin: {
          id: request.adminUser?.id,
          username: request.adminUser?.username,
          permissions: request.adminPermissions
        },
        endpoints: {
          users: '/api/v1/admin/users',
          moderation: '/api/v1/admin/moderation',
          analytics: '/api/v1/admin/analytics'
        }
      }
    });
  });

  // Register sub-routes
  await fastify.register(adminUsersRoutes, { prefix: '/users' });
  await fastify.register(adminModerationRoutes, { prefix: '/moderation' });
  await fastify.register(adminAnalyticsRoutes, { prefix: '/analytics' });
}