import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";

const enhancedAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {

  // Search Analytics Dashboard (requires authentication)
  fastify.get("/search/dashboard", { preHandler: authMiddleware }, async (request: any, reply) => {
    try {
      const { 
        period = "day",
        startDate,
        endDate 
      } = z.object({
        period: z.enum(["hour", "day", "week", "month"]).default("day"),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional()
      }).parse(request.query);

      const analyticsService = (fastify as any).searchAnalytics;
      if (!analyticsService) {
        return reply.code(503).send({
          success: false,
          error: "Search analytics service not available"
        });
      }

      const analytics = await analyticsService.getAnalytics(period, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });

      return reply.send({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error("Failed to get search analytics dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to load analytics dashboard"
      });
    }
  });

  // Search Performance Insights
  fastify.get("/search/performance", { preHandler: authMiddleware }, async (request: any, reply) => {
    try {
      const { hours = 24 } = z.object({
        hours: z.coerce.number().min(1).max(168).default(24) // Max 1 week
      }).parse(request.query);

      const analyticsService = (fastify as any).searchAnalytics;
      if (!analyticsService) {
        return reply.code(503).send({
          success: false,
          error: "Search analytics service not available"
        });
      }

      const insights = await analyticsService.getPerformanceInsights(hours);

      return reply.send({
        success: true,
        data: insights,
        period: `${hours} hours`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error("Failed to get performance insights:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to load performance insights"
      });
    }
  });

  // Trending Queries
  fastify.get("/search/trending", { preHandler: optionalAuthMiddleware }, async (request: any, reply) => {
    try {
      const { 
        period = "day",
        limit = 20 
      } = z.object({
        period: z.enum(["hour", "day", "week"]).default("day"),
        limit: z.coerce.number().min(1).max(100).default(20)
      }).parse(request.query);

      const analyticsService = (fastify as any).searchAnalytics;
      if (!analyticsService) {
        return reply.code(503).send({
          success: false,
          error: "Search analytics service not available"
        });
      }

      const trending = await analyticsService.getTrendingQueries(period, limit);

      return reply.send({
        success: true,
        data: trending,
        period,
        count: trending.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error("Failed to get trending queries:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to load trending queries"
      });
    }
  });

  // User Search Profile
  fastify.get("/search/profile/:userId", { preHandler: authMiddleware }, async (request: any, reply) => {
    try {
      const { userId } = z.object({
        userId: z.string().cuid()
      }).parse(request.params);

      const { days = 30 } = z.object({
        days: z.coerce.number().min(1).max(365).default(30)
      }).parse(request.query);

      // Only allow users to access their own profile or admins to access any profile
      if (request.userId !== userId && !request.isAdmin) {
        return reply.code(403).send({
          success: false,
          error: "Access denied"
        });
      }

      const analyticsService = (fastify as any).searchAnalytics;
      if (!analyticsService) {
        return reply.code(503).send({
          success: false,
          error: "Search analytics service not available"
        });
      }

      const profile = await analyticsService.getUserProfile(userId, days);

      if (!profile) {
        return reply.code(404).send({
          success: false,
          error: "User search profile not found"
        });
      }

      return reply.send({
        success: true,
        data: profile,
        period: `${days} days`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      fastify.log.error("Failed to get user search profile:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to load user search profile"
      });
    }
  });

  // Search Analytics Export (Admin only)
  fastify.get("/search/export", { preHandler: authMiddleware }, async (request: any, reply) => {
    try {
      if (!request.isAdmin) {
        return reply.code(403).send({
          success: false,
          error: "Admin access required"
        });
      }

      const { 
        format = "json",
        startDate,
        endDate,
        limit = 10000 
      } = z.object({
        format: z.enum(["json", "csv"]).default("json"),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.coerce.number().min(1).max(50000).default(10000)
      }).parse(request.query);

      const whereClause: any = {};
      
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = new Date(startDate);
        if (endDate) whereClause.timestamp.lte = new Date(endDate);
      }

      // Get search events from database
      const events = await prisma.$queryRaw`
        SELECT 
          query,
          type,
          "userId",
          "serverId",
          "communityId",
          "resultCount",
          "responseTimeMs",
          "searchEngine",
          clicked,
          timestamp,
          success
        FROM "SearchAnalytics"
        WHERE (${startDate ? `timestamp >= '${startDate}'` : 'TRUE'})
        AND (${endDate ? `timestamp <= '${endDate}'` : 'TRUE'})
        ORDER BY timestamp DESC
        LIMIT ${limit}
      ` as any[];

      if (format === "csv") {
        const csv = [
          "Query,Type,UserID,ServerID,CommunityID,ResultCount,ResponseTimeMs,SearchEngine,Clicked,Timestamp,Success",
          ...events.map(e => [
            `"${e.query}"`,
            e.type,
            e.userId || "",
            e.serverId || "",
            e.communityId || "",
            e.resultCount,
            e.responseTimeMs,
            e.searchEngine,
            e.clicked || false,
            e.timestamp.toISOString(),
            e.success
          ].join(","))
        ].join("\n");

        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="search-analytics-${Date.now()}.csv"`);
        return reply.send(csv);
      }

      return reply.send({
        success: true,
        data: {
          events,
          metadata: {
            count: events.length,
            exported_at: new Date().toISOString(),
            period: {
              start: startDate,
              end: endDate
            }
          }
        }
      });

    } catch (error) {
      fastify.log.error("Failed to export search analytics:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to export analytics data"
      });
    }
  });

  // Real-time Search Metrics
  fastify.get("/search/realtime", { preHandler: authMiddleware }, async (request: any, reply) => {
    try {
      const redis = (fastify as any).redis;
      if (!redis) {
        return reply.code(503).send({
          success: false,
          error: "Redis not available for real-time metrics"
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().toISOString().slice(0, 13);

      const [
        dailySearches,
        hourlySearches,
        engineStats,
        typeStats,
        slowQueries
      ] = await Promise.all([
        redis.hget('search:daily', today),
        redis.hget('search:hourly', hour),
        redis.hgetall('search:engine'),
        redis.hgetall('search:type'),
        redis.lrange('search:slow_queries', 0, 9)
      ]);

      const metrics = {
        current: {
          searchesToday: parseInt(dailySearches) || 0,
          searchesThisHour: parseInt(hourlySearches) || 0
        },
        engines: Object.entries(engineStats || {}).map(([engine, count]) => ({
          engine,
          count: parseInt(count as string) || 0
        })),
        types: Object.entries(typeStats || {}).map(([type, count]) => ({
          type,
          count: parseInt(count as string) || 0
        })),
        recentSlowQueries: slowQueries.map(q => {
          try {
            return JSON.parse(q);
          } catch {
            return null;
          }
        }).filter(Boolean)
      };

      return reply.send({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error("Failed to get real-time search metrics:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to load real-time metrics"
      });
    }
  });

  // Search Query Analysis
  fastify.get("/search/queries/analyze", { preHandler: authMiddleware }, async (request: any, reply) => {
    try {
      const { 
        query,
        days = 7 
      } = z.object({
        query: z.string().min(1).max(500),
        days: z.coerce.number().min(1).max(90).default(7)
      }).parse(request.query);

      const since = new Date();
      since.setDate(since.getDate() - days);

      const analysis = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', timestamp) as day,
          COUNT(*) as search_count,
          AVG("resultCount") as avg_results,
          AVG("responseTimeMs") as avg_response_time,
          COUNT(*) FILTER (WHERE clicked) as clicks,
          COUNT(*) FILTER (WHERE success) as successful_searches
        FROM "SearchAnalytics"
        WHERE LOWER(query) = LOWER(${query})
        AND timestamp >= ${since}
        GROUP BY day
        ORDER BY day DESC
      ` as any[];

      const totalSearches = analysis.reduce((sum, day) => sum + parseInt(day.search_count), 0);
      const totalClicks = analysis.reduce((sum, day) => sum + parseInt(day.clicks), 0);
      const avgResponseTime = analysis.length > 0 
        ? analysis.reduce((sum, day) => sum + parseFloat(day.avg_response_time), 0) / analysis.length 
        : 0;

      return reply.send({
        success: true,
        data: {
          query,
          period: `${days} days`,
          summary: {
            totalSearches,
            totalClicks,
            clickThroughRate: totalSearches > 0 ? (totalClicks / totalSearches) * 100 : 0,
            averageResponseTime: Math.round(avgResponseTime),
            averageResults: analysis.length > 0 
              ? Math.round(analysis.reduce((sum, day) => sum + parseFloat(day.avg_results), 0) / analysis.length)
              : 0
          },
          dailyBreakdown: analysis.map(day => ({
            date: day.day,
            searches: parseInt(day.search_count),
            clicks: parseInt(day.clicks),
            avgResults: Math.round(parseFloat(day.avg_results)),
            avgResponseTime: Math.round(parseFloat(day.avg_response_time)),
            successRate: parseInt(day.successful_searches) / parseInt(day.search_count) * 100
          }))
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      fastify.log.error("Failed to analyze search query:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to analyze search query"
      });
    }
  });

  // Search Optimization Recommendations
  fastify.get("/search/recommendations", { preHandler: authMiddleware }, async (request: any, reply) => {
    try {
      if (!request.isAdmin) {
        return reply.code(403).send({
          success: false,
          error: "Admin access required"
        });
      }

      // Get performance insights
      const analyticsService = (fastify as any).searchAnalytics;
      if (!analyticsService) {
        return reply.code(503).send({
          success: false,
          error: "Search analytics service not available"
        });
      }

      const insights = await analyticsService.getPerformanceInsights(24);

      // Get top zero-result queries
      const zeroResultQueries = await prisma.$queryRaw`
        SELECT 
          query,
          COUNT(*) as frequency
        FROM "SearchAnalytics"
        WHERE "resultCount" = 0
        AND timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY query
        ORDER BY frequency DESC
        LIMIT 10
      ` as Array<{ query: string; frequency: number }>;

      // Get most common search patterns
      const commonPatterns = await prisma.$queryRaw`
        SELECT 
          type,
          COUNT(*) as frequency,
          AVG("responseTimeMs") as avg_response_time
        FROM "SearchAnalytics"
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY type
        ORDER BY frequency DESC
      ` as Array<{ type: string; frequency: number; avg_response_time: number }>;

      const recommendations: Array<{
        category: string;
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        action: string;
        impact: string;
      }> = [];

      // Performance recommendations
      if (insights.avgResponseTime > 500) {
        recommendations.push({
          category: 'performance',
          priority: 'high',
          title: 'Optimize Search Response Times',
          description: `Average response time is ${insights.avgResponseTime}ms, which exceeds the 500ms threshold.`,
          action: 'Consider optimizing Elasticsearch queries, adding more shards, or upgrading hardware.',
          impact: 'Improve user experience and reduce bounce rate'
        });
      }

      if (insights.errorRate > 5) {
        recommendations.push({
          category: 'reliability',
          priority: 'high',
          title: 'Reduce Search Error Rate',
          description: `Current error rate is ${insights.errorRate}%, which is above the 5% threshold.`,
          action: 'Check Elasticsearch cluster health and investigate failing queries.',
          impact: 'Improve search reliability and user satisfaction'
        });
      }

      // Zero results recommendations
      if (zeroResultQueries.length > 0) {
        recommendations.push({
          category: 'relevance',
          priority: 'medium',
          title: 'Improve Search Coverage',
          description: `${zeroResultQueries.length} queries returned zero results in the past week.`,
          action: 'Review zero-result queries and consider adding synonyms or improving content indexing.',
          impact: 'Increase search success rate and user engagement'
        });
      }

      // Engine optimization
      const engines = Object.entries(insights.engineComparison);
      const slowEngine = engines.find(([, stats]) => stats.avgResponseTime > 1000);
      if (slowEngine) {
        recommendations.push({
          category: 'optimization',
          priority: 'medium',
          title: `Optimize ${slowEngine[0]} Performance`,
          description: `${slowEngine[0]} has an average response time of ${Math.round(slowEngine[1].avgResponseTime)}ms.`,
          action: 'Consider query optimization or infrastructure scaling for this search engine.',
          impact: 'Improve overall search performance'
        });
      }

      return reply.send({
        success: true,
        data: {
          recommendations,
          insights,
          zeroResultQueries: zeroResultQueries.slice(0, 5),
          searchPatterns: commonPatterns,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      fastify.log.error("Failed to get search recommendations:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate search recommendations"
      });
    }
  });

  // Health check for analytics services
  fastify.get("/health", async (request, reply) => {
    try {
      const checks: Record<string, any> = {
        analytics_service: 'unknown',
        database: 'unknown',
        redis: 'unknown',
        elasticsearch: 'unknown'
      };

      // Check analytics service
      const analyticsService = (fastify as any).searchAnalytics;
      checks.analytics_service = analyticsService ? 'healthy' : 'unavailable';

      // Check database
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = 'healthy';
      } catch {
        checks.database = 'unhealthy';
      }

      // Check Redis
      const redis = (fastify as any).redis;
      if (redis) {
        try {
          await redis.ping();
          checks.redis = 'healthy';
        } catch {
          checks.redis = 'unhealthy';
        }
      }

      // Check Elasticsearch
      const elasticsearch = (fastify as any).services?.elasticsearch;
      if (elasticsearch) {
        try {
          const isHealthy = await elasticsearch.ping();
          checks.elasticsearch = isHealthy ? 'healthy' : 'unhealthy';
        } catch {
          checks.elasticsearch = 'unhealthy';
        }
      }

      const overallStatus = Object.values(checks).every(status => 
        status === 'healthy' || status === 'unavailable'
      ) ? 'healthy' : 'degraded';

      return reply.send({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: checks
      });

    } catch (error) {
      fastify.log.error("Analytics health check failed:", error);
      return reply.code(500).send({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });
};

export default enhancedAnalyticsRoutes;