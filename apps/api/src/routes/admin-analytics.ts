import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@cryb/database';
import { authMiddleware } from '../middleware/auth';

/**
 * Admin Analytics API Routes
 * 
 * Provides comprehensive analytics endpoints for administrators
 * to monitor platform performance, user behavior, and business metrics
 */

interface AnalyticsQuery {
  start_date?: string;
  end_date?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metric?: string;
  community_id?: string;
  user_type?: string;
}

interface TimeRangeQuery {
  Querystring: AnalyticsQuery;
}

export default async function adminAnalyticsRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    await authMiddleware(request, reply);
    
    // Check if user is admin
    const user = (request as any).user;
    if (!user || user.publicFlags < 1) { // Assuming admin flag is 1
      throw fastify.httpErrors.forbidden('Admin access required');
    }
  });

  // ==============================================
  // PLATFORM OVERVIEW ANALYTICS
  // ==============================================

  fastify.get('/overview', {
    schema: {
      description: 'Get platform overview analytics',
      tags: ['admin', 'analytics'],
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['24h', '7d', '30d', '90d'], default: '24h' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            active_users: { type: 'number' },
            total_users: { type: 'number' },
            new_users_today: { type: 'number' },
            total_posts: { type: 'number' },
            total_comments: { type: 'number' },
            total_messages: { type: 'number' },
            active_communities: { type: 'number' },
            active_servers: { type: 'number' },
            system_health: { type: 'number' },
            growth_rate: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: { period?: string } }>, reply: FastifyReply) => {
    const { period = '24h' } = request.query;
    
    try {
      const timeMap = {
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days'
      };
      
      const interval = timeMap[period as keyof typeof timeMap] || '24 hours';
      
      // Get active users
      const activeUsers = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT id) as count
        FROM "User" 
        WHERE "lastSeenAt" >= NOW() - INTERVAL '${interval}'
      `;
      
      // Get total users
      const totalUsers = await prisma.user.count();
      
      // Get new users today
      const newUsersToday = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });
      
      // Get content metrics
      const [totalPosts, totalComments, totalMessages] = await Promise.all([
        prisma.post.count(),
        prisma.comment.count(),
        prisma.message.count()
      ]);
      
      // Get active communities and servers
      const [activeCommunities, activeServers] = await Promise.all([
        prisma.community.count({ where: { isPublic: true } }),
        prisma.server.count({ where: { isPublic: true } })
      ]);
      
      // Calculate system health (simplified)
      const systemHealth = 95; // This would come from monitoring metrics
      
      // Calculate growth rate
      const prevPeriodUsers = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT id) as count
        FROM "User" 
        WHERE "lastSeenAt" >= NOW() - INTERVAL '${interval}' * 2
          AND "lastSeenAt" < NOW() - INTERVAL '${interval}'
      `;
      
      const currentActive = Number(activeUsers[0]?.count || 0);
      const prevActive = Number(prevPeriodUsers[0]?.count || 1);
      const growthRate = ((currentActive - prevActive) / prevActive) * 100;
      
      return {
        active_users: currentActive,
        total_users: totalUsers,
        new_users_today: newUsersToday,
        total_posts: totalPosts,
        total_comments: totalComments,
        total_messages: totalMessages,
        active_communities: activeCommunities,
        active_servers: activeServers,
        system_health: systemHealth,
        growth_rate: Math.round(growthRate * 100) / 100
      };
      
    } catch (error) {
      fastify.log.error('Error fetching overview analytics:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch analytics data');
    }
  });

  // ==============================================
  // USER ANALYTICS
  // ==============================================

  fastify.get('/users/activity', {
    schema: {
      description: 'Get user activity analytics',
      tags: ['admin', 'analytics', 'users'],
      querystring: {
        type: 'object',
        properties: {
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          granularity: { type: 'string', enum: ['hour', 'day', 'week'], default: 'day' }
        }
      }
    }
  }, async (request: FastifyRequest<TimeRangeQuery>, reply: FastifyReply) => {
    const { start_date, end_date, granularity = 'day' } = request.query;
    
    try {
      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();
      
      const granularityMap = {
        'hour': '1 hour',
        'day': '1 day',
        'week': '1 week'
      };
      
      const bucket = granularityMap[granularity];
      
      const userActivity = await prisma.$queryRaw`
        SELECT 
          date_trunc(${granularity}, "lastSeenAt") as period,
          COUNT(DISTINCT id) as active_users,
          COUNT(DISTINCT CASE WHEN "createdAt" >= date_trunc(${granularity}, "lastSeenAt") THEN id END) as new_users,
          COUNT(DISTINCT CASE WHEN "premiumType" != 'NONE' THEN id END) as premium_users
        FROM "User" 
        WHERE "lastSeenAt" >= ${startDate} AND "lastSeenAt" <= ${endDate}
        GROUP BY period
        ORDER BY period DESC
      `;
      
      return { data: userActivity };
      
    } catch (error) {
      fastify.log.error('Error fetching user activity:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch user activity data');
    }
  });

  fastify.get('/users/retention', {
    schema: {
      description: 'Get user retention analytics',
      tags: ['admin', 'analytics', 'users']
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const retentionData = await prisma.$queryRaw`
        WITH user_cohorts AS (
          SELECT 
            id as user_id,
            DATE_TRUNC('month', "createdAt") as cohort_month
          FROM "User"
          WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        ),
        user_activities AS (
          SELECT 
            uc.user_id,
            uc.cohort_month,
            DATE_TRUNC('month', u."lastSeenAt") as activity_month,
            EXTRACT(EPOCH FROM (DATE_TRUNC('month', u."lastSeenAt") - uc.cohort_month))/2629746 as months_since_registration
          FROM user_cohorts uc
          JOIN "User" u ON u.id = uc.user_id
          WHERE u."lastSeenAt" IS NOT NULL
        )
        SELECT 
          cohort_month,
          months_since_registration,
          COUNT(DISTINCT user_id) as active_users,
          ROUND(
            COUNT(DISTINCT user_id)::DECIMAL / 
            FIRST_VALUE(COUNT(DISTINCT user_id)) OVER (PARTITION BY cohort_month ORDER BY months_since_registration)::DECIMAL * 100, 
            2
          ) as retention_rate
        FROM user_activities
        GROUP BY cohort_month, months_since_registration
        ORDER BY cohort_month DESC, months_since_registration
      `;
      
      return { data: retentionData };
      
    } catch (error) {
      fastify.log.error('Error fetching retention data:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch retention data');
    }
  });

  // ==============================================
  // CONTENT ANALYTICS
  // ==============================================

  fastify.get('/content/metrics', {
    schema: {
      description: 'Get content creation and engagement metrics',
      tags: ['admin', 'analytics', 'content'],
      querystring: {
        type: 'object',
        properties: {
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          community_id: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<TimeRangeQuery>, reply: FastifyReply) => {
    const { start_date, end_date, community_id } = request.query;
    
    try {
      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();
      
      const whereClause = community_id ? { communityId: community_id } : {};
      
      const contentMetrics = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as day,
          COUNT(*) as total_posts,
          COUNT(DISTINCT "userId") as unique_authors,
          AVG("score") as avg_score,
          AVG("viewCount") as avg_views,
          AVG("commentCount") as avg_comments,
          COUNT(CASE WHEN "nsfw" = true THEN 1 END) as nsfw_posts
        FROM "Post" 
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
          ${community_id ? `AND "communityId" = ${community_id}` : ''}
        GROUP BY day
        ORDER BY day DESC
      `;
      
      // Get top communities by activity
      const topCommunities = await prisma.$queryRaw`
        SELECT 
          c.id,
          c.name,
          c."displayName",
          COUNT(p.id) as post_count,
          COUNT(DISTINCT p."userId") as unique_authors,
          SUM(p."viewCount") as total_views
        FROM "Community" c
        LEFT JOIN "Post" p ON p."communityId" = c.id 
          AND p."createdAt" >= ${startDate} 
          AND p."createdAt" <= ${endDate}
        GROUP BY c.id, c.name, c."displayName"
        ORDER BY post_count DESC
        LIMIT 20
      `;
      
      return { 
        metrics: contentMetrics,
        top_communities: topCommunities
      };
      
    } catch (error) {
      fastify.log.error('Error fetching content metrics:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch content metrics');
    }
  });

  // ==============================================
  // COMMUNICATION ANALYTICS
  // ==============================================

  fastify.get('/communication/messages', {
    schema: {
      description: 'Get messaging analytics',
      tags: ['admin', 'analytics', 'communication']
    }
  }, async (request: FastifyRequest<TimeRangeQuery>, reply: FastifyReply) => {
    const { start_date, end_date, granularity = 'day' } = request.query;
    
    try {
      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();
      
      const messageMetrics = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${granularity}, m."createdAt") as period,
          c."type" as channel_type,
          COUNT(m.id) as message_count,
          COUNT(DISTINCT m."userId") as unique_senders,
          AVG(LENGTH(m.content)) as avg_message_length
        FROM "Message" m
        JOIN "Channel" c ON c.id = m."channelId"
        WHERE m."createdAt" >= ${startDate} AND m."createdAt" <= ${endDate}
        GROUP BY period, c."type"
        ORDER BY period DESC, message_count DESC
      `;
      
      return { data: messageMetrics };
      
    } catch (error) {
      fastify.log.error('Error fetching message analytics:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch message analytics');
    }
  });

  fastify.get('/communication/voice', {
    schema: {
      description: 'Get voice call analytics',
      tags: ['admin', 'analytics', 'voice']
    }
  }, async (request: FastifyRequest<TimeRangeQuery>, reply: FastifyReply) => {
    const { start_date, end_date } = request.query;
    
    try {
      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();
      
      const voiceMetrics = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "connectedAt") as day,
          COUNT(*) as total_connections,
          COUNT(DISTINCT "userId") as unique_users,
          AVG(EXTRACT(EPOCH FROM ("updatedAt" - "connectedAt"))/60) as avg_duration_minutes,
          COUNT(CASE WHEN "selfVideo" = true THEN 1 END) as video_connections
        FROM "VoiceState" 
        WHERE "connectedAt" >= ${startDate} AND "connectedAt" <= ${endDate}
        GROUP BY day
        ORDER BY day DESC
      `;
      
      return { data: voiceMetrics };
      
    } catch (error) {
      fastify.log.error('Error fetching voice analytics:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch voice analytics');
    }
  });

  // ==============================================
  // BUSINESS ANALYTICS
  // ==============================================

  fastify.get('/business/revenue', {
    schema: {
      description: 'Get revenue analytics from crypto tips',
      tags: ['admin', 'analytics', 'business']
    }
  }, async (request: FastifyRequest<TimeRangeQuery>, reply: FastifyReply) => {
    const { start_date, end_date } = request.query;
    
    try {
      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();
      
      const revenueMetrics = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "createdAt") as day,
          currency,
          COUNT(*) as tip_count,
          SUM(CAST("amount" as DECIMAL)) as total_amount,
          AVG(CAST("amount" as DECIMAL)) as avg_tip_amount,
          SUM(CASE WHEN "usdAmount" IS NOT NULL THEN CAST("usdAmount" as DECIMAL) ELSE 0 END) as total_usd_value
        FROM "CryptoTip" 
        WHERE "createdAt" >= ${startDate} 
          AND "createdAt" <= ${endDate}
          AND status = 'COMPLETED'
        GROUP BY day, currency
        ORDER BY day DESC, total_usd_value DESC
      `;
      
      return { data: revenueMetrics };
      
    } catch (error) {
      fastify.log.error('Error fetching revenue analytics:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch revenue analytics');
    }
  });

  fastify.get('/business/nft', {
    schema: {
      description: 'Get NFT marketplace analytics',
      tags: ['admin', 'analytics', 'nft']
    }
  }, async (request: FastifyRequest<TimeRangeQuery>, reply: FastifyReply) => {
    const { start_date, end_date } = request.query;
    
    try {
      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();
      
      const nftMetrics = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', ms."createdAt") as day,
          nc.name as collection_name,
          COUNT(ms.id) as sales_count,
          SUM(CAST(ms."salePrice" as DECIMAL)) as total_volume,
          AVG(CAST(ms."salePrice" as DECIMAL)) as avg_sale_price
        FROM "MarketplaceSale" ms
        JOIN "MarketplaceListing" ml ON ml.id = ms."listingId"
        JOIN "NFTCollection" nc ON nc.id = ml."collectionId"
        WHERE ms."createdAt" >= ${startDate} 
          AND ms."createdAt" <= ${endDate}
          AND ms.status = 'COMPLETED'
        GROUP BY day, nc.name
        ORDER BY day DESC, total_volume DESC
      `;
      
      return { data: nftMetrics };
      
    } catch (error) {
      fastify.log.error('Error fetching NFT analytics:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch NFT analytics');
    }
  });

  // ==============================================
  // SYSTEM PERFORMANCE ANALYTICS
  // ==============================================

  fastify.get('/system/performance', {
    schema: {
      description: 'Get system performance metrics',
      tags: ['admin', 'analytics', 'system']
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // This would typically come from monitoring systems
      // For now, we'll simulate with database query performance
      
      const dbPerformance = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public' 
          AND tablename IN ('User', 'Post', 'Message', 'Comment')
        ORDER BY tablename, attname
      `;
      
      // Get database size information
      const dbSize = await prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_size_pretty(pg_total_relation_size('public."User"')) as user_table_size,
          pg_size_pretty(pg_total_relation_size('public."Post"')) as post_table_size,
          pg_size_pretty(pg_total_relation_size('public."Message"')) as message_table_size
      `;
      
      return { 
        database_performance: dbPerformance,
        database_size: dbSize
      };
      
    } catch (error) {
      fastify.log.error('Error fetching system performance:', error);
      throw fastify.httpErrors.internalServerError('Failed to fetch system performance data');
    }
  });

  // ==============================================
  // EXPORT FUNCTIONALITY
  // ==============================================

  fastify.get('/export/:type', {
    schema: {
      description: 'Export analytics data',
      tags: ['admin', 'analytics', 'export'],
      params: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['users', 'content', 'revenue', 'system'] }
        },
        required: ['type']
      },
      querystring: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['json', 'csv'], default: 'json' },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { type: string }, 
    Querystring: AnalyticsQuery & { format?: string } 
  }>, reply: FastifyReply) => {
    const { type } = request.params;
    const { format = 'json', start_date, end_date } = request.query;
    
    try {
      let data: any;
      
      switch (type) {
        case 'users':
          data = await getUserExportData(start_date, end_date);
          break;
        case 'content':
          data = await getContentExportData(start_date, end_date);
          break;
        case 'revenue':
          data = await getRevenueExportData(start_date, end_date);
          break;
        case 'system':
          data = await getSystemExportData();
          break;
        default:
          throw fastify.httpErrors.badRequest('Invalid export type');
      }
      
      if (format === 'csv') {
        reply.type('text/csv');
        reply.header('Content-Disposition', `attachment; filename="${type}-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
        return convertToCSV(data);
      }
      
      reply.type('application/json');
      reply.header('Content-Disposition', `attachment; filename="${type}-analytics-${new Date().toISOString().split('T')[0]}.json"`);
      return data;
      
    } catch (error) {
      fastify.log.error('Error exporting analytics:', error);
      throw fastify.httpErrors.internalServerError('Failed to export analytics data');
    }
  });

  // Helper functions for export
  async function getUserExportData(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await prisma.$queryRaw`
      SELECT 
        id,
        username,
        email,
        "displayName",
        "createdAt",
        "lastSeenAt",
        "premiumType",
        "isVerified"
      FROM "User"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      ORDER BY "createdAt" DESC
    `;
  }
  
  async function getContentExportData(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await prisma.$queryRaw`
      SELECT 
        p.id,
        p.title,
        p."createdAt",
        p.score,
        p."viewCount",
        p."commentCount",
        c.name as community_name,
        u.username as author
      FROM "Post" p
      JOIN "Community" c ON c.id = p."communityId"
      JOIN "User" u ON u.id = p."userId"
      WHERE p."createdAt" >= ${start} AND p."createdAt" <= ${end}
      ORDER BY p."createdAt" DESC
    `;
  }
  
  async function getRevenueExportData(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    return await prisma.$queryRaw`
      SELECT 
        "createdAt",
        currency,
        amount,
        "usdAmount",
        status
      FROM "CryptoTip"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      ORDER BY "createdAt" DESC
    `;
  }
  
  async function getSystemExportData() {
    return await prisma.$queryRaw`
      SELECT 
        'users' as table_name,
        COUNT(*) as record_count,
        pg_size_pretty(pg_total_relation_size('public."User"')) as size
      FROM "User"
      UNION ALL
      SELECT 
        'posts' as table_name,
        COUNT(*) as record_count,
        pg_size_pretty(pg_total_relation_size('public."Post"')) as size
      FROM "Post"
      UNION ALL
      SELECT 
        'messages' as table_name,
        COUNT(*) as record_count,
        pg_size_pretty(pg_total_relation_size('public."Message"')) as size
      FROM "Message"
    `;
  }
  
  function convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\\n');
  }
}