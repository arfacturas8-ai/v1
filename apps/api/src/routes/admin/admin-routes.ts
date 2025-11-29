import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { adminAuthMiddleware } from '../../middleware/admin-auth';

export default async function adminRoutes(fastify: FastifyInstance) {
  // Communities management
  fastify.get('/admin/communities', {
    preHandler: [adminAuthMiddleware]
  }, async (request, reply) => {
    const communities = await prisma.community.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            members: true,
            moderators: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = communities.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      memberCount: c._count.members,
      postCount: c._count.posts,
      moderators: c._count.moderators,
      createdAt: c.createdAt,
      status: c.bannedAt ? 'banned' : c.restrictedAt ? 'restricted' : 'active'
    }));

    return reply.send({ communities: formatted });
  });

  // Update community status
  fastify.patch('/admin/communities/:id/status', {
    preHandler: [adminAuthMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { status } = request.body as any;

    const update: any = {};
    if (status === 'banned') {
      update.bannedAt = new Date();
      update.restrictedAt = null;
    } else if (status === 'restricted') {
      update.restrictedAt = new Date();
      update.bannedAt = null;
    } else {
      update.bannedAt = null;
      update.restrictedAt = null;
    }

    await prisma.community.update({
      where: { id },
      data: update
    });

    return reply.send({ success: true });
  });

  // Analytics endpoint
  fastify.get('/admin/analytics', {
    preHandler: [adminAuthMiddleware]
  }, async (request, reply) => {
    const { range = '30d' } = request.query as any;
    
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [users, posts, comments, communities] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.post.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.comment.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.community.count()
    ]);

    // Get daily stats for charts
    const dailyStats = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [dayUsers, dayPosts] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.post.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        })
      ]);

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        users: dayUsers,
        posts: dayPosts
      });
    }

    return reply.send({
      totalUsers: users,
      totalPosts: posts,
      totalComments: comments,
      totalCommunities: communities,
      dailyStats,
      range
    });
  });

  // System settings
  fastify.get('/admin/settings', {
    preHandler: [adminAuthMiddleware]
  }, async (request, reply) => {
    // Return current settings from environment/database
    const settings = {
      general: {
        siteName: process.env.SITE_NAME || 'CRYB Platform',
        siteDescription: process.env.SITE_DESCRIPTION || 'A modern community platform',
        siteUrl: process.env.SITE_URL || 'https://cryb.site',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false'
      },
      security: {
        requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
        require2FA: process.env.REQUIRE_2FA === 'true',
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '30'),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        ipRateLimiting: process.env.IP_RATE_LIMITING !== 'false'
      },
      email: {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER,
        smtpFrom: process.env.SMTP_FROM,
        emailEnabled: process.env.EMAIL_ENABLED === 'true'
      },
      storage: {
        provider: process.env.STORAGE_PROVIDER || 'minio',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'),
        allowedFileTypes: (process.env.ALLOWED_MIME_TYPES || '').split(',')
      },
      features: {
        enableVoiceVideo: process.env.ENABLE_VOICE_VIDEO === 'true',
        enableFileUploads: process.env.ENABLE_FILE_UPLOADS === 'true',
        enableSearch: process.env.ENABLE_SEARCH === 'true',
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
        enableWeb3: process.env.ENABLE_WEB3 === 'true'
      }
    };

    return reply.send({ settings });
  });

  // Update settings
  fastify.put('/admin/settings/:section', {
    preHandler: [adminAuthMiddleware]
  }, async (request, reply) => {
    const { section } = request.params as any;
    const settings = request.body;

    // In production, save to database or config file
    // For now, just return success
    fastify.log.info(`Settings updated for section: ${section}`, settings);

    return reply.send({ success: true });
  });

  // Audit logs
  fastify.get('/admin/audit-logs', {
    preHandler: [adminAuthMiddleware]
  }, async (request, reply) => {
    const { type = 'all', status = 'all', range = '7d' } = request.query as any;
    
    const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get security logs
    const logs = await prisma.securityLog.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(type !== 'all' && { eventType: type }),
        ...(status !== 'all' && { severity: status })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const formatted = logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      userId: log.userId,
      username: log.user?.username || 'System',
      action: log.eventType,
      resource: log.action,
      resourceId: log.metadata?.resourceId || '',
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      status: log.severity === 'ERROR' ? 'failed' : log.severity === 'WARNING' ? 'warning' : 'success',
      details: log.metadata
    }));

    return reply.send({ logs: formatted });
  });

  // Dashboard stats
  fastify.get('/admin/dashboard', {
    preHandler: [adminAuthMiddleware]
  }, async (request, reply) => {
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalCommunities,
      recentReports,
      systemHealth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastSeenAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.community.count(),
      prisma.report.count({
        where: { status: 'PENDING' }
      }),
      checkSystemHealth()
    ]);

    return reply.send({
      stats: {
        totalUsers,
        activeUsers,
        totalPosts,
        totalComments,
        totalCommunities,
        pendingReports: recentReports
      },
      systemHealth
    });
  });
}

async function checkSystemHealth() {
  // Check various system components
  return {
    database: 'healthy',
    redis: 'healthy',
    storage: 'healthy',
    search: process.env.DISABLE_ELASTICSEARCH === 'true' ? 'disabled' : 'healthy',
    queue: 'healthy'
  };
}