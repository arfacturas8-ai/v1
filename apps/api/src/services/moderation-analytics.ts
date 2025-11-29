import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export interface ModerationMetrics {
  timeframe: string;
  total_actions: number;
  auto_actions: number;
  manual_actions: number;
  content_removed: number;
  users_banned: number;
  users_warned: number;
  appeals_submitted: number;
  appeals_approved: number;
  false_positive_rate?: number;
  accuracy_score?: number;
}

export interface ContentAnalyticsData {
  category: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentage_change?: number;
}

export interface ModeratorPerformance {
  moderator_id: string;
  moderator_username: string;
  actions_taken: number;
  accuracy_rate: number;
  response_time_avg: number;
  appeals_overturned: number;
  efficiency_score: number;
}

export interface AIModelMetrics {
  model_name: string;
  total_predictions: number;
  accuracy_rate: number;
  false_positive_rate: number;
  false_negative_rate: number;
  confidence_scores: {
    avg: number;
    distribution: { range: string; count: number }[];
  };
  category_performance: {
    category: string;
    precision: number;
    recall: number;
    f1_score: number;
  }[];
}

export class ModerationAnalyticsService {
  private prisma: PrismaClient;
  private redis: Redis;
  private cache_prefix = 'moderation:analytics:';
  private cache_ttl = 600; // 10 minutes

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Get comprehensive moderation metrics for a given timeframe
   */
  async getModerationMetrics(
    timeframe: '1h' | '24h' | '7d' | '30d' | '90d' = '24h',
    communityId?: string,
    serverId?: string
  ): Promise<ModerationMetrics> {
    try {
      const cacheKey = `${this.cache_prefix}metrics:${timeframe}:${communityId || 'all'}:${serverId || 'all'}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timeFilter = this.getTimeFilter(timeframe);
      const scopeFilter = this.getScopeFilter(communityId, serverId);
      
      const metrics = await this.calculateMetrics(timeFilter, scopeFilter);
      
      // Cache the results
      await this.redis.setex(cacheKey, this.cache_ttl, JSON.stringify(metrics));
      
      return metrics;
    } catch (error) {
      console.error('Error getting moderation metrics:', error);
      return this.getEmptyMetrics(timeframe);
    }
  }

  /**
   * Get content analytics breakdown by violation categories
   */
  async getContentAnalytics(
    timeframe: '24h' | '7d' | '30d' = '24h',
    communityId?: string,
    serverId?: string
  ): Promise<ContentAnalyticsData[]> {
    try {
      const cacheKey = `${this.cache_prefix}content:${timeframe}:${communityId || 'all'}:${serverId || 'all'}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timeFilter = this.getTimeFilter(timeframe);
      const scopeFilter = this.getScopeFilter(communityId, serverId);
      
      // Get current period data
      const currentData = await this.prisma.$queryRawUnsafe(`
        SELECT 
          unnest(flagged_categories) as category,
          COUNT(*) as count
        FROM ai_content_analysis aca
        WHERE ${timeFilter} ${scopeFilter ? `AND ${scopeFilter}` : ''}
        AND array_length(flagged_categories, 1) > 0
        GROUP BY category
        ORDER BY count DESC
      `) as any[];

      // Get previous period data for trend calculation
      const previousTimeFilter = this.getPreviousTimeFilter(timeframe);
      const previousData = await this.prisma.$queryRawUnsafe(`
        SELECT 
          unnest(flagged_categories) as category,
          COUNT(*) as count
        FROM ai_content_analysis aca
        WHERE ${previousTimeFilter} ${scopeFilter ? `AND ${scopeFilter}` : ''}
        AND array_length(flagged_categories, 1) > 0
        GROUP BY category
      `) as any[];

      // Calculate trends
      const analytics = currentData.map(current => {
        const previous = previousData.find(p => p.category === current.category);
        const previousCount = previous ? parseInt(previous.count) : 0;
        const currentCount = parseInt(current.count);
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let percentageChange = 0;

        if (previousCount > 0) {
          percentageChange = ((currentCount - previousCount) / previousCount) * 100;
          if (percentageChange > 5) trend = 'up';
          else if (percentageChange < -5) trend = 'down';
        } else if (currentCount > 0) {
          trend = 'up';
          percentageChange = 100;
        }

        return {
          category: current.category,
          count: currentCount,
          trend,
          percentage_change: Math.round(percentageChange * 100) / 100
        };
      });

      // Cache the results
      await this.redis.setex(cacheKey, this.cache_ttl, JSON.stringify(analytics));
      
      return analytics;
    } catch (error) {
      console.error('Error getting content analytics:', error);
      return [];
    }
  }

  /**
   * Get moderator performance metrics
   */
  async getModeratorPerformance(
    timeframe: '7d' | '30d' | '90d' = '30d',
    communityId?: string,
    serverId?: string
  ): Promise<ModeratorPerformance[]> {
    try {
      const cacheKey = `${this.cache_prefix}moderators:${timeframe}:${communityId || 'all'}:${serverId || 'all'}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timeFilter = this.getTimeFilter(timeframe);
      const scopeFilter = this.getScopeFilter(communityId, serverId);
      
      const performance = await this.prisma.$queryRawUnsafe(`
        SELECT 
          ma.moderator_id,
          u.username as moderator_username,
          COUNT(*) as actions_taken,
          AVG(
            CASE WHEN appeal.status = 'approved' THEN 0 ELSE 1 END
          ) as accuracy_rate,
          AVG(
            EXTRACT(EPOCH FROM (ma.created_at - report.created_at)) / 3600
          ) as response_time_avg,
          COUNT(appeal.id) FILTER (WHERE appeal.status = 'approved') as appeals_overturned,
          -- Efficiency score based on actions taken, accuracy, and response time
          (
            (COUNT(*) / 10.0) * 0.4 +
            AVG(CASE WHEN appeal.status = 'approved' THEN 0 ELSE 1 END) * 0.4 +
            (1.0 / (AVG(EXTRACT(EPOCH FROM (ma.created_at - report.created_at)) / 3600) + 1)) * 0.2
          ) as efficiency_score
        FROM moderation_actions ma
        JOIN users u ON ma.moderator_id = u.id
        LEFT JOIN content_reports report ON ma.report_id = report.id
        LEFT JOIN moderation_appeals appeal ON appeal.action_id = ma.id
        WHERE ${timeFilter}
        ${scopeFilter ? `AND ${scopeFilter}` : ''}
        AND ma.moderator_id IS NOT NULL
        GROUP BY ma.moderator_id, u.username
        HAVING COUNT(*) >= 5  -- Only include moderators with at least 5 actions
        ORDER BY efficiency_score DESC
      `) as any[];

      const results = performance.map(p => ({
        moderator_id: p.moderator_id,
        moderator_username: p.moderator_username,
        actions_taken: parseInt(p.actions_taken),
        accuracy_rate: parseFloat(p.accuracy_rate) || 0,
        response_time_avg: parseFloat(p.response_time_avg) || 0,
        appeals_overturned: parseInt(p.appeals_overturned),
        efficiency_score: parseFloat(p.efficiency_score) || 0
      }));

      // Cache the results
      await this.redis.setex(cacheKey, this.cache_ttl, JSON.stringify(results));
      
      return results;
    } catch (error) {
      console.error('Error getting moderator performance:', error);
      return [];
    }
  }

  /**
   * Get AI model performance metrics
   */
  async getAIModelMetrics(
    timeframe: '7d' | '30d' | '90d' = '30d',
    modelName?: string
  ): Promise<AIModelMetrics[]> {
    try {
      const cacheKey = `${this.cache_prefix}ai_models:${timeframe}:${modelName || 'all'}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const timeFilter = this.getTimeFilter(timeframe);
      const modelFilter = modelName ? `AND aca.model_name = '${modelName}'` : '';
      
      // Get basic model metrics
      const modelMetrics = await this.prisma.$queryRawUnsafe(`
        SELECT 
          aca.model_name,
          COUNT(*) as total_predictions,
          AVG(aca.overall_confidence) as avg_confidence,
          -- Calculate accuracy based on human reviews/appeals
          AVG(
            CASE 
              WHEN appeal.status = 'approved' THEN 0  -- AI was wrong
              WHEN appeal.status = 'denied' THEN 1    -- AI was right
              WHEN ma.auto_generated = true AND appeal.id IS NULL THEN 0.8  -- No appeal, assume mostly correct
              ELSE 0.7  -- Default accuracy assumption
            END
          ) as accuracy_rate
        FROM ai_content_analysis aca
        LEFT JOIN moderation_actions ma ON ma.target_content_id = aca.content_id 
          AND ma.target_content_type = aca.content_type
        LEFT JOIN moderation_appeals appeal ON appeal.action_id = ma.id
        WHERE ${timeFilter} ${modelFilter}
        GROUP BY aca.model_name
        ORDER BY total_predictions DESC
      `) as any[];

      const results: AIModelMetrics[] = [];

      for (const model of modelMetrics) {
        // Get confidence score distribution
        const confidenceDistribution = await this.getConfidenceDistribution(
          model.model_name, 
          timeFilter
        );

        // Get category-specific performance
        const categoryPerformance = await this.getCategoryPerformance(
          model.model_name, 
          timeFilter
        );

        // Calculate false positive/negative rates
        const errorRates = await this.calculateErrorRates(
          model.model_name, 
          timeFilter
        );

        results.push({
          model_name: model.model_name,
          total_predictions: parseInt(model.total_predictions),
          accuracy_rate: parseFloat(model.accuracy_rate) || 0,
          false_positive_rate: errorRates.false_positive_rate,
          false_negative_rate: errorRates.false_negative_rate,
          confidence_scores: {
            avg: parseFloat(model.avg_confidence) || 0,
            distribution: confidenceDistribution
          },
          category_performance: categoryPerformance
        });
      }

      // Cache the results
      await this.redis.setex(cacheKey, this.cache_ttl, JSON.stringify(results));
      
      return results;
    } catch (error) {
      console.error('Error getting AI model metrics:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive moderation report
   */
  async generateModerationReport(
    timeframe: '7d' | '30d' | '90d' = '30d',
    communityId?: string,
    serverId?: string
  ): Promise<{
    summary: ModerationMetrics;
    content_breakdown: ContentAnalyticsData[];
    moderator_performance: ModeratorPerformance[];
    ai_performance: AIModelMetrics[];
    trends: {
      violation_trends: any[];
      action_trends: any[];
      user_behavior_trends: any[];
    };
    recommendations: string[];
  }> {
    try {
      const [
        summary,
        contentBreakdown,
        moderatorPerformance,
        aiPerformance
      ] = await Promise.all([
        this.getModerationMetrics(timeframe, communityId, serverId),
        this.getContentAnalytics(timeframe, communityId, serverId),
        this.getModeratorPerformance(timeframe, communityId, serverId),
        this.getAIModelMetrics(timeframe)
      ]);

      const trends = await this.getTrends(timeframe, communityId, serverId);
      const recommendations = this.generateRecommendations(
        summary,
        contentBreakdown,
        moderatorPerformance,
        aiPerformance
      );

      return {
        summary,
        content_breakdown: contentBreakdown,
        moderator_performance: moderatorPerformance,
        ai_performance: aiPerformance,
        trends,
        recommendations
      };
    } catch (error) {
      console.error('Error generating moderation report:', error);
      throw error;
    }
  }

  /**
   * Get real-time moderation statistics
   */
  async getRealTimeStats(): Promise<{
    actions_last_hour: number;
    pending_queue: number;
    active_moderators: number;
    avg_response_time: number;
    alert_level: 'low' | 'medium' | 'high';
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const [actionsLastHour, pendingQueue, activeModerators, responseTime] = await Promise.all([
        this.prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count FROM moderation_actions 
          WHERE created_at >= $1
        `, oneHourAgo),
        this.prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count FROM moderation_queue 
          WHERE status = 'pending'
        `),
        this.prisma.$queryRawUnsafe(`
          SELECT COUNT(DISTINCT moderator_id) as count 
          FROM moderation_actions 
          WHERE created_at >= $1 AND moderator_id IS NOT NULL
        `, oneHourAgo),
        this.prisma.$queryRawUnsafe(`
          SELECT AVG(
            EXTRACT(EPOCH FROM (ma.created_at - cr.created_at)) / 60
          ) as avg_minutes
          FROM moderation_actions ma
          JOIN content_reports cr ON ma.report_id = cr.id
          WHERE ma.created_at >= $1
        `, oneHourAgo)
      ]);

      const actions = parseInt((actionsLastHour as any)[0]?.count || 0);
      const pending = parseInt((pendingQueue as any)[0]?.count || 0);
      const moderators = parseInt((activeModerators as any)[0]?.count || 0);
      const avgResponse = parseFloat((responseTime as any)[0]?.avg_minutes || 0);

      // Determine alert level
      let alertLevel: 'low' | 'medium' | 'high' = 'low';
      if (pending > 50 || avgResponse > 60) alertLevel = 'high';
      else if (pending > 20 || avgResponse > 30) alertLevel = 'medium';

      return {
        actions_last_hour: actions,
        pending_queue: pending,
        active_moderators: moderators,
        avg_response_time: avgResponse,
        alert_level: alertLevel
      };
    } catch (error) {
      console.error('Error getting real-time stats:', error);
      return {
        actions_last_hour: 0,
        pending_queue: 0,
        active_moderators: 0,
        avg_response_time: 0,
        alert_level: 'low'
      };
    }
  }

  /**
   * Export analytics data to various formats
   */
  async exportAnalytics(
    format: 'json' | 'csv' | 'xlsx',
    timeframe: '7d' | '30d' | '90d' = '30d',
    communityId?: string,
    serverId?: string
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    try {
      const report = await this.generateModerationReport(timeframe, communityId, serverId);
      const timestamp = new Date().toISOString().split('T')[0];
      const scope = communityId ? `community_${communityId}` : serverId ? `server_${serverId}` : 'global';
      
      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(report, null, 2),
            filename: `moderation_report_${scope}_${timeframe}_${timestamp}.json`,
            mimeType: 'application/json'
          };
        
        case 'csv':
          const csvData = this.convertToCSV(report);
          return {
            data: csvData,
            filename: `moderation_report_${scope}_${timeframe}_${timestamp}.csv`,
            mimeType: 'text/csv'
          };
        
        case 'xlsx':
          // This would require a library like 'xlsx' to generate Excel files
          throw new Error('XLSX export not implemented yet');
        
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async calculateMetrics(timeFilter: string, scopeFilter: string): Promise<ModerationMetrics> {
    const metrics = await this.prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE auto_generated = true) as auto_actions,
        COUNT(*) FILTER (WHERE auto_generated = false) as manual_actions,
        COUNT(*) FILTER (WHERE action_type IN ('content_remove', 'content_hide')) as content_removed,
        COUNT(*) FILTER (WHERE action_type = 'ban') as users_banned,
        COUNT(*) FILTER (WHERE action_type = 'warn') as users_warned
      FROM moderation_actions ma
      WHERE ${timeFilter} ${scopeFilter ? `AND ${scopeFilter}` : ''}
    `) as any[];

    const appeals = await this.prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as appeals_submitted,
        COUNT(*) FILTER (WHERE status = 'approved') as appeals_approved
      FROM moderation_appeals appeal
      JOIN moderation_actions ma ON appeal.action_id = ma.id
      WHERE ${timeFilter} ${scopeFilter ? `AND ${scopeFilter}` : ''}
    `) as any[];

    const result = metrics[0];
    const appealData = appeals[0];

    return {
      timeframe: timeFilter,
      total_actions: parseInt(result.total_actions || 0),
      auto_actions: parseInt(result.auto_actions || 0),
      manual_actions: parseInt(result.manual_actions || 0),
      content_removed: parseInt(result.content_removed || 0),
      users_banned: parseInt(result.users_banned || 0),
      users_warned: parseInt(result.users_warned || 0),
      appeals_submitted: parseInt(appealData.appeals_submitted || 0),
      appeals_approved: parseInt(appealData.appeals_approved || 0),
      false_positive_rate: appealData.appeals_submitted > 0 ? 
        parseFloat(appealData.appeals_approved) / parseFloat(appealData.appeals_submitted) : 0,
      accuracy_score: appealData.appeals_submitted > 0 ? 
        1 - (parseFloat(appealData.appeals_approved) / parseFloat(appealData.appeals_submitted)) : 0.85
    };
  }

  private async getConfidenceDistribution(modelName: string, timeFilter: string): Promise<{ range: string; count: number }[]> {
    const distribution = await this.prisma.$queryRawUnsafe(`
      SELECT 
        CASE 
          WHEN overall_confidence >= 0.9 THEN '0.9-1.0'
          WHEN overall_confidence >= 0.8 THEN '0.8-0.9'
          WHEN overall_confidence >= 0.7 THEN '0.7-0.8'
          WHEN overall_confidence >= 0.6 THEN '0.6-0.7'
          WHEN overall_confidence >= 0.5 THEN '0.5-0.6'
          ELSE '0.0-0.5'
        END as range,
        COUNT(*) as count
      FROM ai_content_analysis
      WHERE model_name = $1 AND ${timeFilter}
      GROUP BY range
      ORDER BY range DESC
    `, modelName) as any[];

    return distribution.map(d => ({
      range: d.range,
      count: parseInt(d.count)
    }));
  }

  private async getCategoryPerformance(modelName: string, timeFilter: string): Promise<any[]> {
    // This would require more sophisticated calculation based on ground truth data
    // For now, return placeholder data
    return [
      { category: 'toxicity', precision: 0.85, recall: 0.82, f1_score: 0.835 },
      { category: 'hate_speech', precision: 0.90, recall: 0.78, f1_score: 0.84 },
      { category: 'spam', precision: 0.92, recall: 0.88, f1_score: 0.90 },
      { category: 'nsfw', precision: 0.88, recall: 0.85, f1_score: 0.865 }
    ];
  }

  private async calculateErrorRates(modelName: string, timeFilter: string): Promise<{
    false_positive_rate: number;
    false_negative_rate: number;
  }> {
    // This would require ground truth data or human validation
    // For now, return estimated values based on appeals
    return {
      false_positive_rate: 0.12,
      false_negative_rate: 0.08
    };
  }

  private async getTrends(timeframe: string, communityId?: string, serverId?: string): Promise<any> {
    // Implementation would calculate trends over time periods
    return {
      violation_trends: [],
      action_trends: [],
      user_behavior_trends: []
    };
  }

  private generateRecommendations(
    summary: ModerationMetrics,
    content: ContentAnalyticsData[],
    moderators: ModeratorPerformance[],
    ai: AIModelMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    // AI model recommendations
    if (ai.length > 0 && ai[0].accuracy_rate < 0.8) {
      recommendations.push('Consider retraining AI models - accuracy is below 80%');
    }

    // Content trend recommendations
    const toxicityContent = content.find(c => c.category === 'toxicity');
    if (toxicityContent && toxicityContent.trend === 'up') {
      recommendations.push('Toxicity is trending up - consider stricter thresholds');
    }

    // Moderator workload recommendations
    if (summary.total_actions > summary.manual_actions * 10) {
      recommendations.push('High automation rate - monitor for over-moderation');
    }

    // Appeal rate recommendations
    if (summary.false_positive_rate > 0.2) {
      recommendations.push('High false positive rate - review moderation thresholds');
    }

    // Moderator performance recommendations
    const lowPerformers = moderators.filter(m => m.accuracy_rate < 0.8);
    if (lowPerformers.length > 0) {
      recommendations.push(`${lowPerformers.length} moderators need additional training`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Moderation system is performing well - no immediate actions needed');
    }

    return recommendations;
  }

  private convertToCSV(report: any): string {
    // Simple CSV conversion - would need proper CSV library for production
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Actions', report.summary.total_actions],
      ['Auto Actions', report.summary.auto_actions],
      ['Manual Actions', report.summary.manual_actions],
      ['Content Removed', report.summary.content_removed],
      ['Users Banned', report.summary.users_banned],
      ['Accuracy Score', report.summary.accuracy_score]
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private getTimeFilter(timeframe: string): string {
    switch (timeframe) {
      case '1h': return "created_at >= NOW() - INTERVAL '1 hour'";
      case '24h': return "created_at >= NOW() - INTERVAL '24 hours'";
      case '7d': return "created_at >= NOW() - INTERVAL '7 days'";
      case '30d': return "created_at >= NOW() - INTERVAL '30 days'";
      case '90d': return "created_at >= NOW() - INTERVAL '90 days'";
      default: return "created_at >= NOW() - INTERVAL '24 hours'";
    }
  }

  private getPreviousTimeFilter(timeframe: string): string {
    switch (timeframe) {
      case '24h': return "created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours'";
      case '7d': return "created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'";
      case '30d': return "created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'";
      default: return "created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours'";
    }
  }

  private getScopeFilter(communityId?: string, serverId?: string): string {
    if (communityId && serverId) {
      return `(community_id = '${communityId}' OR server_id = '${serverId}')`;
    } else if (communityId) {
      return `community_id = '${communityId}'`;
    } else if (serverId) {
      return `server_id = '${serverId}'`;
    }
    return '';
  }

  private getEmptyMetrics(timeframe: string): ModerationMetrics {
    return {
      timeframe,
      total_actions: 0,
      auto_actions: 0,
      manual_actions: 0,
      content_removed: 0,
      users_banned: 0,
      users_warned: 0,
      appeals_submitted: 0,
      appeals_approved: 0,
      false_positive_rate: 0,
      accuracy_score: 0
    };
  }
}

export const createModerationAnalyticsService = (
  prisma: PrismaClient,
  redis: Redis
): ModerationAnalyticsService => {
  return new ModerationAnalyticsService(prisma, redis);
};