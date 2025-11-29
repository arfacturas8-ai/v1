import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma, executeWithDatabaseRetry } from '@cryb/database';
import { analyticsViewerMiddleware, AdminPermission } from '../../middleware/admin';
import { authMiddleware } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

interface AnalyticsQuery {
  timeframe?: '24h' | '7d' | '30d' | '90d' | 'all';
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

interface UserAnalyticsQuery extends AnalyticsQuery {
  cohort?: 'all' | 'new' | 'active' | 'premium';
}

interface ContentAnalyticsQuery extends AnalyticsQuery {
  type?: 'all' | 'posts' | 'comments' | 'messages';
  community?: string;
}

export default async function adminAnalyticsRoutes(fastify: FastifyInstance) {
  // Apply authentication and admin middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  /**
   * GET /api/v1/admin/analytics/overview
   * Get platform overview statistics
   */
  fastify.get('/overview', {
    preHandler: analyticsViewerMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get platform overview analytics'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await executeWithDatabaseRetry(async () => {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
          // User metrics
          totalUsers,
          activeUsers24h,
          activeUsers7d,
          newUsers24h,
          newUsers7d,
          premiumUsers,
          verifiedUsers,
          bannedUsers,
          
          // Content metrics
          totalPosts,
          postsLast24h,
          postsLast7d,
          totalComments,
          commentsLast24h,
          commentsLast7d,
          totalMessages,
          messagesLast24h,
          
          // Community metrics
          totalCommunities,
          totalServers,
          communitiesWithActivity,
          
          // Moderation metrics
          pendingReports,
          reportsLast24h
        ] = await Promise.all([
          // User metrics
          prisma.user.count(),
          prisma.user.count({ where: { lastSeenAt: { gte: last24h } } }),
          prisma.user.count({ where: { lastSeenAt: { gte: last7d } } }),
          prisma.user.count({ where: { createdAt: { gte: last24h } } }),
          prisma.user.count({ where: { createdAt: { gte: last7d } } }),
          prisma.user.count({ where: { premiumType: { not: 'NONE' } } }),
          prisma.user.count({ where: { isVerified: true } }),
          prisma.user.count({ where: { bannedAt: { not: null } } }),
          
          // Content metrics
          prisma.post.count(),
          prisma.post.count({ where: { createdAt: { gte: last24h } } }),
          prisma.post.count({ where: { createdAt: { gte: last7d } } }),
          prisma.comment.count(),
          prisma.comment.count({ where: { createdAt: { gte: last24h } } }),
          prisma.comment.count({ where: { createdAt: { gte: last7d } } }),
          prisma.message.count(),
          prisma.message.count({ where: { createdAt: { gte: last24h } } }),
          
          // Community metrics
          prisma.community.count(),
          prisma.server.count(),
          prisma.community.count({
            where: {
              posts: {
                some: {
                  createdAt: { gte: last7d }
                }
              }
            }
          }),
          
          // Moderation metrics
          prisma.report.count({ where: { status: 'PENDING' } }),
          prisma.report.count({ where: { createdAt: { gte: last24h } } })
        ]);

        return {
          users: {
            total: totalUsers,
            active24h: activeUsers24h,
            active7d: activeUsers7d,
            new24h: newUsers24h,
            new7d: newUsers7d,
            premium: premiumUsers,
            verified: verifiedUsers,
            banned: bannedUsers,
            retentionRate: totalUsers > 0 ? (activeUsers7d / totalUsers * 100).toFixed(1) : 0
          },
          content: {
            posts: {
              total: totalPosts,
              last24h: postsLast24h,
              last7d: postsLast7d
            },
            comments: {
              total: totalComments,
              last24h: commentsLast24h,
              last7d: commentsLast7d
            },
            messages: {
              total: totalMessages,
              last24h: messagesLast24h
            }
          },
          communities: {
            total: totalCommunities,
            servers: totalServers,
            activeLastWeek: communitiesWithActivity
          },
          moderation: {
            pendingReports,
            reportsLast24h
          }
        };
      });

      reply.send({
        success: true,
        data: { overview: stats }
      });

    } catch (error) {
      request.log.error({ error }, 'Failed to fetch overview analytics');
      throw new AppError('Failed to fetch overview analytics', 500, 'FETCH_OVERVIEW_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/analytics/users
   * Get detailed user analytics
   */
  fastify.get<{ Querystring: UserAnalyticsQuery }>('/users', {
    preHandler: analyticsViewerMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get user analytics with time series data',
      querystring: {
        type: 'object',
        properties: {
          timeframe: { 
            type: 'string', 
            enum: ['24h', '7d', '30d', '90d', 'all'],
            default: '30d'
          },
          granularity: {
            type: 'string',
            enum: ['hour', 'day', 'week', 'month'],
            default: 'day'
          },
          cohort: {
            type: 'string',
            enum: ['all', 'new', 'active', 'premium'],
            default: 'all'
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: UserAnalyticsQuery }>, reply: FastifyReply) => {
    const { timeframe = '30d', granularity = 'day', cohort = 'all' } = request.query;

    try {
      const timeframeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        'all': 365 * 24 * 60 * 60 * 1000 // Cap at 1 year for performance
      };

      const startDate = new Date(Date.now() - timeframeMap[timeframe]);
      
      // Get user registration trends
      const registrationTrend = await executeWithDatabaseRetry(async () => {
        return await prisma.$queryRaw`
          SELECT 
            DATE_TRUNC(${granularity}, "createdAt") as period,
            COUNT(*) as registrations,
            COUNT(CASE WHEN "isVerified" = true THEN 1 END) as verified_registrations,
            COUNT(CASE WHEN "premiumType" != 'NONE' THEN 1 END) as premium_registrations
          FROM "User"
          WHERE "createdAt" >= ${startDate}
          GROUP BY period
          ORDER BY period ASC
        `;
      });

      // Get activity trends
      const activityTrend = await executeWithDatabaseRetry(async () => {
        return await prisma.$queryRaw`
          SELECT 
            DATE_TRUNC(${granularity}, "lastSeenAt") as period,
            COUNT(DISTINCT "id") as active_users
          FROM "User"
          WHERE "lastSeenAt" >= ${startDate}
            AND "lastSeenAt" IS NOT NULL
          GROUP BY period
          ORDER BY period ASC
        `;
      });

      // Get top users by activity
      const topUsers = await executeWithDatabaseRetry(async () => {
        const where: any = {
          createdAt: { gte: startDate }
        };

        if (cohort === 'new') {
          where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        } else if (cohort === 'premium') {
          where.premiumType = { not: 'NONE' };
        } else if (cohort === 'active') {
          where.lastSeenAt = { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
        }

        return await prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            displayName: true,
            isVerified: true,
            premiumType: true,
            createdAt: true,
            lastSeenAt: true,
            _count: {
              select: {
                posts: true,
                comments: true,
                messages: true
              }
            }
          },
          orderBy: {
            lastSeenAt: 'desc'
          },
          take: 10
        });
      });

      // Get user distribution by premium type
      const premiumDistribution = await executeWithDatabaseRetry(async () => {
        return await prisma.user.groupBy({
          by: ['premiumType'],
          _count: {
            premiumType: true
          },
          where: {
            createdAt: { gte: startDate }
          }
        });
      });

      reply.send({
        success: true,
        data: {
          trends: {
            registrations: registrationTrend,
            activity: activityTrend
          },
          topUsers,
          distribution: {
            premium: premiumDistribution
          },
          filters: {
            timeframe,
            granularity,
            cohort
          }
        }
      });

    } catch (error) {
      request.log.error({ error, query: request.query }, 'Failed to fetch user analytics');
      throw new AppError('Failed to fetch user analytics', 500, 'FETCH_USER_ANALYTICS_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/analytics/content
   * Get content analytics
   */
  fastify.get<{ Querystring: ContentAnalyticsQuery }>('/content', {
    preHandler: analyticsViewerMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get content creation and engagement analytics',
      querystring: {
        type: 'object',
        properties: {
          timeframe: { 
            type: 'string', 
            enum: ['24h', '7d', '30d', '90d', 'all'],
            default: '30d'
          },
          granularity: {
            type: 'string',
            enum: ['hour', 'day', 'week', 'month'],
            default: 'day'
          },
          type: {
            type: 'string',
            enum: ['all', 'posts', 'comments', 'messages'],
            default: 'all'
          },
          community: {
            type: 'string'
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: ContentAnalyticsQuery }>, reply: FastifyReply) => {
    const { timeframe = '30d', granularity = 'day', type = 'all', community } = request.query;

    try {
      const timeframeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        'all': 365 * 24 * 60 * 60 * 1000
      };

      const startDate = new Date(Date.now() - timeframeMap[timeframe]);

      // Content creation trends
      const contentTrends = await executeWithDatabaseRetry(async () => {
        const trends: any = {};

        if (type === 'all' || type === 'posts') {
          const postWhere: any = { createdAt: { gte: startDate } };
          if (community) {
            postWhere.community = { name: community };
          }

          trends.posts = await prisma.$queryRaw`
            SELECT 
              DATE_TRUNC(${granularity}, p."createdAt") as period,
              COUNT(*) as count,
              AVG(p."score") as avg_score,
              SUM(p."viewCount") as total_views,
              COUNT(CASE WHEN p."score" > 10 THEN 1 END) as popular_posts
            FROM "Post" p
            ${community ? `JOIN "Community" c ON p."communityId" = c.id` : ''}
            WHERE p."createdAt" >= ${startDate}
            ${community ? `AND c.name = ${community}` : ''}
            GROUP BY period
            ORDER BY period ASC
          `;
        }

        if (type === 'all' || type === 'comments') {
          trends.comments = await prisma.$queryRaw`
            SELECT 
              DATE_TRUNC(${granularity}, "createdAt") as period,
              COUNT(*) as count,
              AVG("score") as avg_score
            FROM "Comment"
            WHERE "createdAt" >= ${startDate}
            GROUP BY period
            ORDER BY period ASC
          `;
        }

        if (type === 'all' || type === 'messages') {
          trends.messages = await prisma.$queryRaw`
            SELECT 
              DATE_TRUNC(${granularity}, "createdAt") as period,
              COUNT(*) as count
            FROM "Message"
            WHERE "createdAt" >= ${startDate}
            GROUP BY period
            ORDER BY period ASC
          `;
        }

        return trends;
      });

      // Top performing content
      const topContent = await executeWithDatabaseRetry(async () => {
        const content: any = {};

        if (type === 'all' || type === 'posts') {
          const postWhere: any = { createdAt: { gte: startDate } };
          if (community) {
            postWhere.community = { name: community };
          }

          content.topPosts = await prisma.post.findMany({
            where: postWhere,
            select: {
              id: true,
              title: true,
              score: true,
              viewCount: true,
              commentCount: true,
              createdAt: true,
              user: {
                select: {
                  username: true
                }
              },
              community: {
                select: {
                  name: true,
                  displayName: true
                }
              }
            },
            orderBy: {
              score: 'desc'
            },
            take: 10
          });
        }

        if (type === 'all' || type === 'comments') {
          content.topComments = await prisma.comment.findMany({
            where: {
              createdAt: { gte: startDate }
            },
            select: {
              id: true,
              content: true,
              score: true,
              createdAt: true,
              user: {
                select: {
                  username: true
                }
              },
              post: {
                select: {
                  title: true,
                  community: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: {
              score: 'desc'
            },
            take: 10
          });
        }

        return content;
      });

      // Community statistics (if not filtered by community)
      const communityStats = !community ? await executeWithDatabaseRetry(async () => {
        return await prisma.community.findMany({
          select: {
            id: true,
            name: true,
            displayName: true,
            memberCount: true,
            _count: {
              select: {
                posts: {
                  where: {
                    createdAt: { gte: startDate }
                  }
                }
              }
            }
          },
          orderBy: {
            memberCount: 'desc'
          },
          take: 10
        });
      }) : null;

      reply.send({
        success: true,
        data: {
          trends: contentTrends,
          topContent,
          communities: communityStats,
          filters: {
            timeframe,
            granularity,
            type,
            community
          }
        }
      });

    } catch (error) {
      request.log.error({ error, query: request.query }, 'Failed to fetch content analytics');
      throw new AppError('Failed to fetch content analytics', 500, 'FETCH_CONTENT_ANALYTICS_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/analytics/engagement
   * Get user engagement metrics
   */
  fastify.get<{ Querystring: AnalyticsQuery }>('/engagement', {
    preHandler: analyticsViewerMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get user engagement analytics'
    }
  }, async (request: FastifyRequest<{ Querystring: AnalyticsQuery }>, reply: FastifyReply) => {
    const { timeframe = '30d' } = request.query;

    try {
      const timeframeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        'all': 365 * 24 * 60 * 60 * 1000
      };

      const startDate = new Date(Date.now() - timeframeMap[timeframe]);

      const engagementMetrics = await executeWithDatabaseRetry(async () => {
        const [
          // Voting engagement
          totalVotes,
          uniqueVoters,
          
          // Comment engagement
          totalComments,
          uniqueCommenters,
          avgCommentsPerPost,
          
          // Award/Recognition engagement
          totalAwards,
          uniqueAwardGivers,
          
          // Community engagement
          activeCommunityMembers,
          
          // Content creation engagement
          uniqueContentCreators
        ] = await Promise.all([
          prisma.vote.count({ where: { createdAt: { gte: startDate } } }),
          prisma.vote.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: startDate } },
            _count: true
          }).then(result => result.length),
          
          prisma.comment.count({ where: { createdAt: { gte: startDate } } }),
          prisma.comment.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: startDate } },
            _count: true
          }).then(result => result.length),
          
          prisma.post.aggregate({
            where: { createdAt: { gte: startDate } },
            _avg: { commentCount: true }
          }).then(result => result._avg.commentCount || 0),
          
          prisma.award.count({ where: { createdAt: { gte: startDate } } }),
          prisma.award.groupBy({
            by: ['giverId'],
            where: { createdAt: { gte: startDate } },
            _count: true
          }).then(result => result.length),
          
          prisma.communityMember.count({
            where: {
              joinedAt: { gte: startDate }
            }
          }),
          
          prisma.user.count({
            where: {
              OR: [
                { posts: { some: { createdAt: { gte: startDate } } } },
                { comments: { some: { createdAt: { gte: startDate } } } }
              ]
            }
          })
        ]);

        return {
          voting: {
            totalVotes,
            uniqueVoters,
            avgVotesPerUser: uniqueVoters > 0 ? (totalVotes / uniqueVoters).toFixed(2) : 0
          },
          commenting: {
            totalComments,
            uniqueCommenters,
            avgCommentsPerPost: avgCommentsPerPost?.toFixed(2) || 0,
            avgCommentsPerUser: uniqueCommenters > 0 ? (totalComments / uniqueCommenters).toFixed(2) : 0
          },
          awards: {
            totalAwards,
            uniqueAwardGivers,
            avgAwardsPerGiver: uniqueAwardGivers > 0 ? (totalAwards / uniqueAwardGivers).toFixed(2) : 0
          },
          community: {
            activeCommunityMembers,
            uniqueContentCreators
          }
        };
      });

      // Top engaged users
      const topEngagedUsers = await executeWithDatabaseRetry(async () => {
        return await prisma.user.findMany({
          where: {
            OR: [
              { posts: { some: { createdAt: { gte: startDate } } } },
              { comments: { some: { createdAt: { gte: startDate } } } },
              { votes: { some: { createdAt: { gte: startDate } } } }
            ]
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            _count: {
              select: {
                posts: {
                  where: { createdAt: { gte: startDate } }
                },
                comments: {
                  where: { createdAt: { gte: startDate } }
                },
                votes: {
                  where: { createdAt: { gte: startDate } }
                }
              }
            }
          },
          take: 10
        });
      });

      reply.send({
        success: true,
        data: {
          metrics: engagementMetrics,
          topUsers: topEngagedUsers,
          filters: {
            timeframe
          }
        }
      });

    } catch (error) {
      request.log.error({ error, query: request.query }, 'Failed to fetch engagement analytics');
      throw new AppError('Failed to fetch engagement analytics', 500, 'FETCH_ENGAGEMENT_ANALYTICS_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/analytics/real-time
   * Get real-time platform metrics
   */
  fastify.get('/real-time', {
    preHandler: analyticsViewerMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get real-time platform metrics'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const now = new Date();
      const last5m = new Date(now.getTime() - 5 * 60 * 1000);
      const last1h = new Date(now.getTime() - 60 * 60 * 1000);

      const realTimeMetrics = await executeWithDatabaseRetry(async () => {
        const [
          activeUsers,
          recentPosts,
          recentComments,
          recentMessages,
          onlineUsers
        ] = await Promise.all([
          prisma.user.count({
            where: {
              lastSeenAt: { gte: last5m }
            }
          }),
          prisma.post.count({
            where: {
              createdAt: { gte: last1h }
            }
          }),
          prisma.comment.count({
            where: {
              createdAt: { gte: last1h }
            }
          }),
          prisma.message.count({
            where: {
              createdAt: { gte: last1h }
            }
          }),
          prisma.user.count({
            where: {
              lastSeenAt: { gte: new Date(now.getTime() - 15 * 60 * 1000) }
            }
          })
        ]);

        return {
          activeUsers5m: activeUsers,
          onlineUsers15m: onlineUsers,
          activity1h: {
            posts: recentPosts,
            comments: recentComments,
            messages: recentMessages
          },
          timestamp: now.toISOString()
        };
      });

      reply.send({
        success: true,
        data: { realTime: realTimeMetrics }
      });

    } catch (error) {
      request.log.error({ error }, 'Failed to fetch real-time analytics');
      throw new AppError('Failed to fetch real-time analytics', 500, 'FETCH_REALTIME_ANALYTICS_FAILED');
    }
  });
}