/**
 * CRYB Platform - Analytics API
 * Real-time analytics and business intelligence endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { timescaleClient } from '../analytics/timescale-client';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { rateLimit } from '../middleware/rateLimit';
import { cacheMiddleware } from '../middleware/cache';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Analytics schemas
const trackEventSchema = z.object({
  event_type: z.string().min(1).max(100),
  event_category: z.enum(['navigation', 'engagement', 'content', 'social', 'communication', 'media', 'authentication', 'profile', 'monetization', 'admin']),
  event_data: z.record(z.any()).optional(),
  session_id: z.string().uuid().optional(),
  page_load_time: z.number().int().min(0).optional(),
  response_time: z.number().int().min(0).optional()
});

const metricsQuerySchema = z.object({
  metric_names: z.array(z.string()).optional(),
  service_name: z.string().optional(),
  timeframe: z.enum(['1h', '6h', '24h', '7d', '30d', '90d']).default('24h'),
  granularity: z.enum(['1m', '5m', '15m', '1h', '6h', '1d']).default('5m'),
  aggregation: z.enum(['avg', 'sum', 'min', 'max', 'count']).default('avg')
});

const analyticsQuerySchema = z.object({
  type: z.enum(['user_engagement', 'community_performance', 'content_analytics', 'revenue', 'moderation']),
  target_id: z.string().optional(),
  timeframe: z.enum(['1h', '6h', '24h', '7d', '30d', '90d']).default('24h'),
  granularity: z.enum(['1m', '5m', '15m', '1h', '6h', '1d']).default('1h'),
  filters: z.record(z.any()).optional()
});

const dashboardQuerySchema = z.object({
  dashboard_type: z.enum(['overview', 'content', 'users', 'communities', 'revenue', 'moderation', 'technical']),
  timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
  refresh_cache: z.boolean().default(false)
});

// Rate limiting for analytics endpoints
const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: 'Too many analytics requests'
});

const trackingRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // Higher limit for event tracking
  message: 'Too many tracking requests'
});

/**
 * @route POST /analytics/track
 * @desc Track user activity events
 */
router.post('/track',
  trackingRateLimit,
  validateRequest(trackEventSchema),
  async (req: Request, res: Response) => {
    try {
      const eventData = req.validatedData;
      const userId = req.user?.id || 'anonymous';
      
      // Enrich event data with request context
      const enrichedEvent = {
        user_id: userId,
        session_id: eventData.session_id,
        event_type: eventData.event_type,
        event_category: eventData.event_category,
        event_data: eventData.event_data,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        page_load_time: eventData.page_load_time,
        response_time: eventData.response_time,
        // Add device/browser detection here if needed
      };

      await timescaleClient.trackUserActivity(enrichedEvent);

      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      logger.error('Failed to track event', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to track event'
      });
    }
  }
);

/**
 * @route POST /analytics/track/batch
 * @desc Track multiple events in batch
 */
router.post('/track/batch',
  trackingRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { events } = req.body;
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Events array is required'
        });
      }

      if (events.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 100 events per batch'
        });
      }

      const userId = req.user?.id || 'anonymous';
      const enrichedEvents = events.map(event => ({
        user_id: userId,
        session_id: event.session_id,
        event_type: event.event_type,
        event_category: event.event_category,
        event_data: event.event_data,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        page_load_time: event.page_load_time,
        response_time: event.response_time
      }));

      await timescaleClient.trackUserActivityBatch(enrichedEvents);

      res.json({
        success: true,
        message: `${events.length} events tracked successfully`
      });
    } catch (error) {
      logger.error('Failed to track batch events', { error, count: req.body.events?.length });
      res.status(500).json({
        success: false,
        error: 'Failed to track batch events'
      });
    }
  }
);

/**
 * @route GET /analytics/metrics
 * @desc Get platform metrics with time-series data
 */
router.get('/metrics',
  analyticsRateLimit,
  requireAuth,
  validateRequest(metricsQuerySchema, 'query'),
  cacheMiddleware(300), // 5-minute cache
  async (req: Request, res: Response) => {
    try {
      const { metric_names, service_name, timeframe, granularity, aggregation } = req.validatedData;
      
      const metrics = await timescaleClient.getPlatformMetrics(service_name, timeframe);

      // Process and aggregate metrics based on granularity
      const processedMetrics = processMetricsData(metrics, granularity, aggregation);

      res.json({
        success: true,
        data: {
          metrics: processedMetrics,
          timeframe,
          granularity,
          aggregation,
          last_updated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get platform metrics', { error, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics'
      });
    }
  }
);

/**
 * @route GET /analytics/user/:userId
 * @desc Get user engagement analytics
 */
router.get('/user/:userId',
  analyticsRateLimit,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { timeframe = '7d' } = req.query;

      // Check if user has permission to view this data
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      const engagementData = await timescaleClient.getUserEngagementData(userId, timeframe as string);

      res.json({
        success: true,
        data: {
          user_id: userId,
          engagement_data: engagementData,
          timeframe,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get user analytics', { error, userId: req.params.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user analytics'
      });
    }
  }
);

/**
 * @route GET /analytics/community/:communityId
 * @desc Get community performance analytics
 */
router.get('/community/:communityId',
  analyticsRateLimit,
  requireAuth,
  cacheMiddleware(600), // 10-minute cache
  async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      const { timeframe = '30d' } = req.query;

      const analytics = await timescaleClient.getCommunityAnalytics(communityId, timeframe as string);

      res.json({
        success: true,
        data: {
          community_id: communityId,
          analytics,
          timeframe,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get community analytics', { error, communityId: req.params.communityId });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve community analytics'
      });
    }
  }
);

/**
 * @route GET /analytics/revenue
 * @desc Get revenue and monetization analytics (admin only)
 */
router.get('/revenue',
  analyticsRateLimit,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { timeframe = '30d' } = req.query;
      const revenueMetrics = await timescaleClient.getRevenueMetrics(timeframe as string);

      res.json({
        success: true,
        data: {
          revenue_metrics: revenueMetrics,
          timeframe,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get revenue analytics', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve revenue analytics'
      });
    }
  }
);

/**
 * @route GET /analytics/trending
 * @desc Get trending content and topics
 */
router.get('/trending',
  analyticsRateLimit,
  cacheMiddleware(900), // 15-minute cache
  async (req: Request, res: Response) => {
    try {
      const { timeframe = '2h' } = req.query;
      
      const trendingContent = await timescaleClient.getTrendingContent(timeframe as string);

      res.json({
        success: true,
        data: {
          trending_content: trendingContent,
          timeframe,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get trending analytics', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve trending data'
      });
    }
  }
);

/**
 * @route GET /analytics/health
 * @desc Get real-time system health metrics
 */
router.get('/health',
  cacheMiddleware(30), // 30-second cache for health data
  async (req: Request, res: Response) => {
    try {
      const healthMetrics = await timescaleClient.getSystemHealthMetrics();

      res.json({
        success: true,
        data: healthMetrics
      });
    } catch (error) {
      logger.error('Failed to get health metrics', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve health metrics'
      });
    }
  }
);

/**
 * @route GET /analytics/dashboard/:type
 * @desc Get dashboard data for different analytics views
 */
router.get('/dashboard/:type',
  analyticsRateLimit,
  requireAuth,
  validateRequest(dashboardQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const { timeframe, refresh_cache } = req.validatedData;

      // Check permissions for different dashboard types
      if (['revenue', 'moderation'].includes(type) && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required for this dashboard'
        });
      }

      const cacheKey = `dashboard_${type}_${timeframe}`;
      let dashboardData;

      if (!refresh_cache) {
        // Try to get from cache first (implement your cache layer)
        dashboardData = await getCachedDashboard(cacheKey);
      }

      if (!dashboardData) {
        dashboardData = await generateDashboardData(type, timeframe);
        // Cache the result (implement your cache layer)
        await cacheDashboard(cacheKey, dashboardData, 300); // 5-minute cache
      }

      res.json({
        success: true,
        data: {
          dashboard_type: type,
          timeframe,
          ...dashboardData,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get dashboard data', { error, type: req.params.type });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data'
      });
    }
  }
);

/**
 * @route POST /analytics/custom
 * @desc Execute custom analytics queries (admin only)
 */
router.post('/custom',
  analyticsRateLimit,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { query, params = [] } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
      }

      // Basic SQL injection protection
      if (query.toLowerCase().includes('drop') || 
          query.toLowerCase().includes('delete') || 
          query.toLowerCase().includes('update') ||
          query.toLowerCase().includes('insert')) {
        return res.status(400).json({
          success: false,
          error: 'Only SELECT queries are allowed'
        });
      }

      const results = await timescaleClient.executeCustomQuery(query, params);

      res.json({
        success: true,
        data: {
          results,
          query,
          row_count: results.length,
          executed_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to execute custom query', { error, query: req.body.query });
      res.status(500).json({
        success: false,
        error: 'Failed to execute custom query'
      });
    }
  }
);

// Helper functions

function processMetricsData(metrics: any[], granularity: string, aggregation: string): any {
  // Group metrics by time bucket and apply aggregation
  const grouped = metrics.reduce((acc, metric) => {
    const key = `${metric.bucket}_${metric.metric_name}_${metric.service_name}`;
    if (!acc[key]) {
      acc[key] = {
        timestamp: metric.bucket,
        metric_name: metric.metric_name,
        service_name: metric.service_name,
        values: []
      };
    }
    acc[key].values.push(metric);
    return acc;
  }, {});

  // Apply aggregation function
  return Object.values(grouped).map((group: any) => {
    const values = group.values;
    let aggregatedValue;

    switch (aggregation) {
      case 'avg':
        aggregatedValue = values.reduce((sum: number, v: any) => sum + v.avg_value, 0) / values.length;
        break;
      case 'sum':
        aggregatedValue = values.reduce((sum: number, v: any) => sum + v.avg_value, 0);
        break;
      case 'min':
        aggregatedValue = Math.min(...values.map((v: any) => v.min_value));
        break;
      case 'max':
        aggregatedValue = Math.max(...values.map((v: any) => v.max_value));
        break;
      case 'count':
        aggregatedValue = values.reduce((sum: number, v: any) => sum + v.sample_count, 0);
        break;
      default:
        aggregatedValue = values[0]?.avg_value || 0;
    }

    return {
      timestamp: group.timestamp,
      metric_name: group.metric_name,
      service_name: group.service_name,
      value: aggregatedValue
    };
  });
}

async function generateDashboardData(type: string, timeframe: string): Promise<any> {
  switch (type) {
    case 'overview':
      return {
        active_users: await getActiveUsersCount(timeframe),
        total_posts: await getTotalPostsCount(timeframe),
        total_comments: await getTotalCommentsCount(timeframe),
        engagement_rate: await getOverallEngagementRate(timeframe),
        top_communities: await getTopCommunities(timeframe)
      };
    case 'content':
      return {
        post_metrics: await getPostMetrics(timeframe),
        top_posts: await getTopPosts(timeframe),
        content_distribution: await getContentDistribution(timeframe)
      };
    case 'users':
      return {
        user_growth: await getUserGrowth(timeframe),
        user_segments: await getUserSegments(timeframe),
        retention_metrics: await getRetentionMetrics(timeframe)
      };
    case 'communities':
      return {
        community_growth: await getCommunityGrowth(timeframe),
        community_engagement: await getCommunityEngagement(timeframe),
        member_distribution: await getMemberDistribution(timeframe)
      };
    case 'revenue':
      return {
        revenue_metrics: await timescaleClient.getRevenueMetrics(timeframe),
        revenue_by_type: await getRevenueByType(timeframe),
        user_ltv: await getUserLTV(timeframe)
      };
    case 'technical':
      return {
        system_health: await timescaleClient.getSystemHealthMetrics(),
        performance_metrics: await getPerformanceMetrics(timeframe),
        error_rates: await getErrorRates(timeframe)
      };
    default:
      throw new Error(`Unknown dashboard type: ${type}`);
  }
}

// Placeholder implementations for dashboard helper functions
async function getActiveUsersCount(timeframe: string): Promise<number> {
  const result = await timescaleClient.executeCustomQuery(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM user_activity_events
    WHERE time > NOW() - INTERVAL '${timeframe}'
  `);
  return result[0]?.count || 0;
}

async function getTotalPostsCount(timeframe: string): Promise<number> {
  const result = await timescaleClient.executeCustomQuery(`
    SELECT COUNT(*) as count
    FROM post_analytics
    WHERE time > NOW() - INTERVAL '${timeframe}'
  `);
  return result[0]?.count || 0;
}

async function getTotalCommentsCount(timeframe: string): Promise<number> {
  // Implementation would connect to main database
  return 0; // Placeholder
}

async function getOverallEngagementRate(timeframe: string): Promise<number> {
  const result = await timescaleClient.executeCustomQuery(`
    SELECT AVG(engagement_rate) as avg_engagement
    FROM post_analytics
    WHERE time > NOW() - INTERVAL '${timeframe}'
  `);
  return result[0]?.avg_engagement || 0;
}

async function getTopCommunities(timeframe: string): Promise<any[]> {
  // Implementation would connect to main database
  return []; // Placeholder
}

async function getPostMetrics(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getTopPosts(timeframe: string): Promise<any[]> {
  // Implementation details...
  return [];
}

async function getContentDistribution(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getUserGrowth(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getUserSegments(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getRetentionMetrics(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getCommunityGrowth(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getCommunityEngagement(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getMemberDistribution(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getRevenueByType(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getUserLTV(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getPerformanceMetrics(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getErrorRates(timeframe: string): Promise<any> {
  // Implementation details...
  return {};
}

async function getCachedDashboard(key: string): Promise<any> {
  // Implementation would use Redis or similar
  return null;
}

async function cacheDashboard(key: string, data: any, ttl: number): Promise<void> {
  // Implementation would use Redis or similar
}

export default router;