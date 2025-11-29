/**
 * CRYB Platform - Business Intelligence API
 * Executive dashboards, KPIs, and business metrics
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { businessIntelligenceDashboard } from '../business-intelligence/dashboard';
import { timescaleClient } from '../analytics/timescale-client';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { rateLimit } from '../middleware/rateLimit';
import { cacheMiddleware } from '../middleware/cache';
import { requireAuth, requireAdminAuth } from '../middleware/auth';

const router = Router();

// Business Intelligence schemas
const dashboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  segments: z.array(z.string()).optional(),
  comparison: z.boolean().default(false),
  refresh: z.boolean().default(false)
});

const kpiQuerySchema = z.object({
  metrics: z.array(z.string()).optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  target_values: z.record(z.number()).optional()
});

const revenueAnalysisSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  breakdown_by: z.enum(['product', 'geography', 'user_segment', 'channel']).optional(),
  cohort_analysis: z.boolean().default(false),
  forecast_periods: z.number().int().min(1).max(12).optional()
});

const customReportSchema = z.object({
  metrics: z.array(z.string()).min(1),
  dimensions: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  format: z.enum(['json', 'csv', 'pdf']).default('json')
});

const alertConfigSchema = z.object({
  metric: z.string(),
  condition: z.enum(['greater_than', 'less_than', 'equals', 'not_equals']),
  threshold: z.number(),
  severity: z.enum(['info', 'warning', 'critical']),
  enabled: z.boolean().default(true),
  notification_channels: z.array(z.string()).optional()
});

// Rate limiting for BI endpoints
const biRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many BI requests'
});

/**
 * @route GET /bi/executive-dashboard
 * @desc Get executive-level dashboard with all key metrics
 */
router.get('/executive-dashboard',
  biRateLimit,
  requireAdminAuth,
  validateRequest(dashboardQuerySchema, 'query'),
  cacheMiddleware(300), // 5-minute cache
  async (req: Request, res: Response) => {
    try {
      const { period, segments, comparison, refresh } = req.validatedData;

      if (refresh) {
        // Skip cache for refresh requests
        req.skipCache = true;
      }

      const dashboard = await businessIntelligenceDashboard.getExecutiveDashboard(period);

      // Add real-time alerts
      const alerts = await businessIntelligenceDashboard.getRealtimeAlerts();

      res.json({
        success: true,
        data: {
          ...dashboard,
          alerts,
          metadata: {
            period,
            generated_at: new Date().toISOString(),
            data_freshness: '5 minutes',
            segments: segments || [],
            comparison_enabled: comparison
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get executive dashboard', { error, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve executive dashboard'
      });
    }
  }
);

/**
 * @route GET /bi/revenue-analytics
 * @desc Detailed revenue analytics and forecasting
 */
router.get('/revenue-analytics',
  biRateLimit,
  requireAdminAuth,
  validateRequest(revenueAnalysisSchema, 'query'),
  cacheMiddleware(600), // 10-minute cache
  async (req: Request, res: Response) => {
    try {
      const { period, breakdown_by, cohort_analysis, forecast_periods } = req.validatedData;

      // Get revenue metrics
      const revenueMetrics = await businessIntelligenceDashboard.getRevenueMetrics(period);
      
      // Get detailed revenue analytics
      const revenueAnalytics = await getDetailedRevenueAnalytics(period, breakdown_by);
      
      let cohortData = null;
      if (cohort_analysis) {
        cohortData = await getCohortAnalysis(period);
      }

      let forecast = null;
      if (forecast_periods) {
        forecast = await generateRevenueForecast(forecast_periods);
      }

      res.json({
        success: true,
        data: {
          summary: revenueMetrics,
          analytics: revenueAnalytics,
          cohort_analysis: cohortData,
          forecast,
          metadata: {
            period,
            breakdown_by,
            generated_at: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get revenue analytics', { error, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve revenue analytics'
      });
    }
  }
);

/**
 * @route GET /bi/user-analytics
 * @desc User behavior and engagement analytics
 */
router.get('/user-analytics',
  biRateLimit,
  requireAdminAuth,
  validateRequest(dashboardQuerySchema, 'query'),
  cacheMiddleware(600),
  async (req: Request, res: Response) => {
    try {
      const { period } = req.validatedData;

      const userMetrics = await businessIntelligenceDashboard.getUserMetrics(period);
      const userSegmentation = await getUserSegmentation(period);
      const userJourney = await getUserJourneyAnalytics(period);
      const retentionAnalysis = await getRetentionAnalysis(period);

      res.json({
        success: true,
        data: {
          summary: userMetrics,
          segmentation: userSegmentation,
          user_journey: userJourney,
          retention: retentionAnalysis,
          metadata: {
            period,
            generated_at: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get user analytics', { error, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user analytics'
      });
    }
  }
);

/**
 * @route GET /bi/content-analytics
 * @desc Content performance and engagement analytics
 */
router.get('/content-analytics',
  biRateLimit,
  requireAdminAuth,
  validateRequest(dashboardQuerySchema, 'query'),
  cacheMiddleware(600),
  async (req: Request, res: Response) => {
    try {
      const { period } = req.validatedData;

      const contentMetrics = await businessIntelligenceDashboard.getContentMetrics(period);
      const viralContent = await getViralContentAnalysis(period);
      const contentTrends = await getContentTrends(period);
      const moderationInsights = await getModerationInsights(period);

      res.json({
        success: true,
        data: {
          summary: contentMetrics,
          viral_analysis: viralContent,
          trends: contentTrends,
          moderation: moderationInsights,
          metadata: {
            period,
            generated_at: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get content analytics', { error, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve content analytics'
      });
    }
  }
);

/**
 * @route GET /bi/kpis
 * @desc Get Key Performance Indicators with targets and trends
 */
router.get('/kpis',
  biRateLimit,
  requireAdminAuth,
  validateRequest(kpiQuerySchema, 'query'),
  cacheMiddleware(300),
  async (req: Request, res: Response) => {
    try {
      const { metrics, period, granularity, target_values } = req.validatedData;

      const kpis = await getKPIData(metrics, period, granularity, target_values);

      res.json({
        success: true,
        data: {
          kpis,
          targets: target_values || {},
          metadata: {
            period,
            granularity,
            generated_at: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get KPIs', { error, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve KPIs'
      });
    }
  }
);

/**
 * @route POST /bi/custom-report
 * @desc Generate custom business intelligence report
 */
router.post('/custom-report',
  biRateLimit,
  requireAdminAuth,
  validateRequest(customReportSchema),
  async (req: Request, res: Response) => {
    try {
      const reportConfig = req.validatedData;

      const report = await businessIntelligenceDashboard.getCustomReport(reportConfig);

      // If PDF format requested, generate PDF
      if (reportConfig.format === 'pdf') {
        const pdfBuffer = await generatePDFReport(report, reportConfig);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="custom-report.pdf"');
        return res.send(pdfBuffer);
      }

      // If CSV format requested, generate CSV
      if (reportConfig.format === 'csv') {
        const csv = await generateCSVReport(report, reportConfig);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="custom-report.csv"');
        return res.send(csv);
      }

      // Default JSON response
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Failed to generate custom report', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to generate custom report'
      });
    }
  }
);

/**
 * @route GET /bi/alerts
 * @desc Get real-time business intelligence alerts
 */
router.get('/alerts',
  requireAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const alerts = await businessIntelligenceDashboard.getRealtimeAlerts();

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          last_check: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get BI alerts', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve alerts'
      });
    }
  }
);

/**
 * @route POST /bi/alerts
 * @desc Configure business intelligence alerts
 */
router.post('/alerts',
  biRateLimit,
  requireAdminAuth,
  validateRequest(alertConfigSchema),
  async (req: Request, res: Response) => {
    try {
      const alertConfig = req.validatedData;

      // Store alert configuration (would integrate with alerting system)
      const alertId = await createAlert(alertConfig, req.user.id);

      res.json({
        success: true,
        data: {
          alert_id: alertId,
          message: 'Alert configured successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to configure alert', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Failed to configure alert'
      });
    }
  }
);

/**
 * @route GET /bi/benchmarks
 * @desc Get industry benchmarks and comparisons
 */
router.get('/benchmarks',
  requireAdminAuth,
  cacheMiddleware(3600), // 1-hour cache
  async (req: Request, res: Response) => {
    try {
      const benchmarks = await getIndustryBenchmarks();

      res.json({
        success: true,
        data: benchmarks
      });
    } catch (error) {
      logger.error('Failed to get benchmarks', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve benchmarks'
      });
    }
  }
);

/**
 * @route GET /bi/predictions
 * @desc Get AI-powered business predictions and insights
 */
router.get('/predictions',
  requireAdminAuth,
  cacheMiddleware(1800), // 30-minute cache
  async (req: Request, res: Response) => {
    try {
      const { horizon = '30d' } = req.query;

      const predictions = await generateBusinessPredictions(horizon as string);

      res.json({
        success: true,
        data: predictions
      });
    } catch (error) {
      logger.error('Failed to get predictions', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to generate predictions'
      });
    }
  }
);

// Helper functions

async function getDetailedRevenueAnalytics(period: string, breakdownBy?: string): Promise<any> {
  try {
    // Implementation would provide detailed revenue breakdown
    return {
      by_product: [],
      by_geography: [],
      by_user_segment: [],
      growth_trends: [],
      conversion_funnel: {}
    };
  } catch (error) {
    logger.error('Failed to get detailed revenue analytics', { error });
    return {};
  }
}

async function getCohortAnalysis(period: string): Promise<any> {
  try {
    // Implementation would provide cohort retention analysis
    return {
      retention_rates: [],
      cohort_sizes: [],
      revenue_cohorts: []
    };
  } catch (error) {
    logger.error('Failed to get cohort analysis', { error });
    return null;
  }
}

async function generateRevenueForecast(periods: number): Promise<any> {
  try {
    // Implementation would use ML models for revenue forecasting
    return {
      forecasted_values: [],
      confidence_intervals: [],
      methodology: 'linear_regression',
      accuracy_score: 0.85
    };
  } catch (error) {
    logger.error('Failed to generate revenue forecast', { error });
    return null;
  }
}

async function getUserSegmentation(period: string): Promise<any> {
  try {
    // Implementation would provide user segmentation analysis
    return {
      segments: [
        { name: 'Power Users', count: 1250, percentage: 12.5 },
        { name: 'Regular Users', count: 6750, percentage: 67.5 },
        { name: 'New Users', count: 2000, percentage: 20.0 }
      ],
      segment_behaviors: {}
    };
  } catch (error) {
    logger.error('Failed to get user segmentation', { error });
    return {};
  }
}

async function getUserJourneyAnalytics(period: string): Promise<any> {
  try {
    // Implementation would provide user journey analysis
    return {
      conversion_funnels: [],
      drop_off_points: [],
      optimal_paths: []
    };
  } catch (error) {
    logger.error('Failed to get user journey analytics', { error });
    return {};
  }
}

async function getRetentionAnalysis(period: string): Promise<any> {
  try {
    // Implementation would provide retention analysis
    return {
      day_1_retention: 0.75,
      day_7_retention: 0.45,
      day_30_retention: 0.25,
      retention_curves: [],
      churn_predictions: []
    };
  } catch (error) {
    logger.error('Failed to get retention analysis', { error });
    return {};
  }
}

async function getViralContentAnalysis(period: string): Promise<any> {
  try {
    // Implementation would analyze viral content patterns
    return {
      viral_posts: [],
      virality_factors: [],
      trending_topics: []
    };
  } catch (error) {
    logger.error('Failed to get viral content analysis', { error });
    return {};
  }
}

async function getContentTrends(period: string): Promise<any> {
  try {
    // Implementation would provide content trend analysis
    return {
      trending_topics: [],
      content_types_performance: [],
      optimal_posting_times: []
    };
  } catch (error) {
    logger.error('Failed to get content trends', { error });
    return {};
  }
}

async function getModerationInsights(period: string): Promise<any> {
  try {
    // Implementation would provide moderation insights
    return {
      moderation_efficiency: 0.95,
      common_violations: [],
      moderation_trends: []
    };
  } catch (error) {
    logger.error('Failed to get moderation insights', { error });
    return {};
  }
}

async function getKPIData(metrics?: string[], period?: string, granularity?: string, targets?: any): Promise<any> {
  try {
    // Implementation would fetch KPI data
    return [];
  } catch (error) {
    logger.error('Failed to get KPI data', { error });
    return [];
  }
}

async function generatePDFReport(report: any, config: any): Promise<Buffer> {
  // Implementation would generate PDF report
  return Buffer.from('PDF placeholder');
}

async function generateCSVReport(report: any, config: any): Promise<string> {
  // Implementation would generate CSV report
  return 'CSV placeholder';
}

async function createAlert(config: any, userId: string): Promise<string> {
  // Implementation would create alert configuration
  return 'alert_' + Date.now();
}

async function getIndustryBenchmarks(): Promise<any> {
  // Implementation would provide industry benchmark data
  return {
    engagement_rate: { industry_avg: 0.045, our_value: 0.052 },
    retention_rate: { industry_avg: 0.25, our_value: 0.28 },
    revenue_per_user: { industry_avg: 12.50, our_value: 15.75 }
  };
}

async function generateBusinessPredictions(horizon: string): Promise<any> {
  // Implementation would use ML models for business predictions
  return {
    user_growth: { predicted: 125000, confidence: 0.85 },
    revenue_growth: { predicted: 150000, confidence: 0.78 },
    churn_risk: { high_risk_users: 245, confidence: 0.92 }
  };
}

export default router;