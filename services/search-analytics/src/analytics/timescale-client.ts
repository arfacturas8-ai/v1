/**
 * CRYB Platform - TimescaleDB Analytics Client
 * High-performance time-series analytics for user behavior and platform metrics
 */

import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface UserActivityEvent {
  user_id: string;
  session_id?: string;
  event_type: string;
  event_category: string;
  event_data?: any;
  ip_address?: string;
  user_agent?: string;
  country_code?: string;
  region_code?: string;
  city?: string;
  timezone?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  screen_resolution?: string;
  page_load_time?: number;
  response_time?: number;
  ab_test_group?: string;
  feature_flags?: string[];
}

export interface PlatformMetric {
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  service_name: string;
  service_version?: string;
  instance_id?: string;
  labels?: any;
  environment?: string;
  region?: string;
}

export interface PostAnalytics {
  post_id: string;
  community_id: string;
  user_id: string;
  view_count?: number;
  upvote_count?: number;
  downvote_count?: number;
  comment_count?: number;
  share_count?: number;
  click_count?: number;
  engagement_rate?: number;
  virality_score?: number;
  controversy_score?: number;
  time_to_first_comment?: number;
  time_to_first_share?: number;
  velocity_score?: number;
  momentum_score?: number;
}

export interface WebSocketMetrics {
  connection_id?: string;
  user_id?: string;
  server_id?: string;
  channel_id?: string;
  event_type: string;
  latency_ms?: number;
  message_size_bytes?: number;
  error_code?: string;
  error_message?: string;
  transport_type?: string;
  client_version?: string;
}

export interface VoiceVideoAnalytics {
  session_id: string;
  user_id: string;
  server_id?: string;
  channel_id?: string;
  session_type: 'voice' | 'video' | 'screen_share';
  session_duration?: number;
  audio_quality_score?: number;
  video_quality_score?: number;
  connection_quality?: string;
  packet_loss_percentage?: number;
  jitter_ms?: number;
  latency_ms?: number;
  bytes_sent?: number;
  bytes_received?: number;
  peak_bandwidth_mbps?: number;
  participant_count?: number;
  max_participants?: number;
  codec_used?: string;
  resolution?: string;
  frame_rate?: number;
}

export interface RevenueAnalytics {
  transaction_id?: string;
  user_id?: string;
  transaction_type: string;
  amount_usd: number;
  amount_crypto?: number;
  currency_type?: string;
  platform_fee_usd?: number;
  payment_processor_fee_usd?: number;
  net_revenue_usd?: number;
  country_code?: string;
  user_segment?: string;
  referral_source?: string;
  marketing_campaign?: string;
}

export interface ModerationAnalytics {
  content_id: string;
  content_type: 'post' | 'comment' | 'message' | 'media';
  action_type: string;
  moderator_id?: string;
  moderator_type?: 'human' | 'ai' | 'system';
  violation_type?: string;
  severity_level?: number;
  confidence_score?: number;
  ai_model_version?: string;
  ai_flags?: any;
  community_id?: string;
  reporter_id?: string;
}

export class TimescaleAnalyticsClient {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('TimescaleDB pool error', { error: err });
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return !!result.rows[0];
    } catch (error) {
      logger.error('TimescaleDB health check failed', { error });
      return false;
    }
  }

  // User Activity Tracking
  async trackUserActivity(event: UserActivityEvent): Promise<void> {
    const query = `
      INSERT INTO user_activity_events (
        user_id, session_id, event_type, event_category, event_data,
        ip_address, user_agent, country_code, region_code, city, timezone,
        device_type, browser, os, screen_resolution, page_load_time,
        response_time, ab_test_group, feature_flags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `;

    const values = [
      event.user_id,
      event.session_id,
      event.event_type,
      event.event_category,
      JSON.stringify(event.event_data || {}),
      event.ip_address,
      event.user_agent,
      event.country_code,
      event.region_code,
      event.city,
      event.timezone,
      event.device_type,
      event.browser,
      event.os,
      event.screen_resolution,
      event.page_load_time,
      event.response_time,
      event.ab_test_group,
      event.feature_flags
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error('Failed to track user activity', { error, event });
      throw error;
    }
  }

  async trackUserActivityBatch(events: UserActivityEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Process in smaller batches to prevent memory issues
    const batchSize = 1000;
    const batches = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Use COPY for better performance with large batches
        if (batch.length > 100) {
          await this.bulkInsertUserActivity(client, batch);
        } else {
          // Use individual inserts for smaller batches
          for (const event of batch) {
            const query = `
              INSERT INTO user_activity_events (
                user_id, session_id, event_type, event_category, event_data,
                ip_address, user_agent, country_code, region_code, city, timezone,
                device_type, browser, os, screen_resolution, page_load_time,
                response_time, ab_test_group, feature_flags
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `;

            const values = [
              event.user_id, event.session_id, event.event_type, event.event_category,
              JSON.stringify(event.event_data || {}), event.ip_address, event.user_agent,
              event.country_code, event.region_code, event.city, event.timezone,
              event.device_type, event.browser, event.os, event.screen_resolution,
              event.page_load_time, event.response_time, event.ab_test_group, event.feature_flags
            ];

            await client.query(query, values);
          }
        }

        await client.query('COMMIT');
        logger.debug('Tracked user activity batch', { count: batch.length });
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Failed to track user activity batch', { error, count: batch.length });
        throw error;
      } finally {
        client.release();
      }
    }
  }

  private async bulkInsertUserActivity(client: any, events: UserActivityEvent[]): Promise<void> {
    // Use PostgreSQL COPY for high-performance bulk inserts
    const copyQuery = `
      COPY user_activity_events (
        user_id, session_id, event_type, event_category, event_data,
        ip_address, user_agent, country_code, region_code, city, timezone,
        device_type, browser, os, screen_resolution, page_load_time,
        response_time, ab_test_group, feature_flags
      ) FROM STDIN WITH CSV
    `;

    const csvData = events.map(event => {
      const values = [
        event.user_id || '',
        event.session_id || '',
        event.event_type || '',
        event.event_category || '',
        JSON.stringify(event.event_data || {}),
        event.ip_address || '',
        event.user_agent || '',
        event.country_code || '',
        event.region_code || '',
        event.city || '',
        event.timezone || '',
        event.device_type || '',
        event.browser || '',
        event.os || '',
        event.screen_resolution || '',
        event.page_load_time || null,
        event.response_time || null,
        event.ab_test_group || '',
        (event.feature_flags || []).join(';')
      ];
      
      // Escape CSV values
      return values.map(v => {
        if (v === null || v === undefined) return '';
        const str = String(v);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    }).join('\n');

    await client.query(copyQuery + csvData);
  }

  // Platform Metrics
  async recordPlatformMetric(metric: PlatformMetric): Promise<void> {
    const query = `
      INSERT INTO platform_metrics (
        metric_name, metric_value, metric_unit, service_name,
        service_version, instance_id, labels, environment, region
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const values = [
      metric.metric_name,
      metric.metric_value,
      metric.metric_unit || 'count',
      metric.service_name,
      metric.service_version,
      metric.instance_id,
      JSON.stringify(metric.labels || {}),
      metric.environment || 'production',
      metric.region
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error('Failed to record platform metric', { error, metric });
      throw error;
    }
  }

  // Post Analytics
  async recordPostAnalytics(analytics: PostAnalytics): Promise<void> {
    const query = `
      INSERT INTO post_analytics (
        post_id, community_id, user_id, view_count, upvote_count, downvote_count,
        comment_count, share_count, click_count, engagement_rate, virality_score,
        controversy_score, time_to_first_comment, time_to_first_share,
        velocity_score, momentum_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `;

    const values = [
      analytics.post_id, analytics.community_id, analytics.user_id,
      analytics.view_count, analytics.upvote_count, analytics.downvote_count,
      analytics.comment_count, analytics.share_count, analytics.click_count,
      analytics.engagement_rate, analytics.virality_score, analytics.controversy_score,
      analytics.time_to_first_comment, analytics.time_to_first_share,
      analytics.velocity_score, analytics.momentum_score
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error('Failed to record post analytics', { error, analytics });
      throw error;
    }
  }

  // WebSocket Metrics
  async recordWebSocketMetrics(metrics: WebSocketMetrics): Promise<void> {
    const query = `
      INSERT INTO websocket_metrics (
        connection_id, user_id, server_id, channel_id, event_type,
        latency_ms, message_size_bytes, error_code, error_message,
        transport_type, client_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    const values = [
      metrics.connection_id, metrics.user_id, metrics.server_id, metrics.channel_id,
      metrics.event_type, metrics.latency_ms, metrics.message_size_bytes,
      metrics.error_code, metrics.error_message, metrics.transport_type, metrics.client_version
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error('Failed to record WebSocket metrics', { error, metrics });
      throw error;
    }
  }

  // Voice/Video Analytics
  async recordVoiceVideoAnalytics(analytics: VoiceVideoAnalytics): Promise<void> {
    const query = `
      INSERT INTO voice_video_analytics (
        session_id, user_id, server_id, channel_id, session_type, session_duration,
        audio_quality_score, video_quality_score, connection_quality,
        packet_loss_percentage, jitter_ms, latency_ms, bytes_sent, bytes_received,
        peak_bandwidth_mbps, participant_count, max_participants,
        codec_used, resolution, frame_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `;

    const values = [
      analytics.session_id, analytics.user_id, analytics.server_id, analytics.channel_id,
      analytics.session_type, analytics.session_duration, analytics.audio_quality_score,
      analytics.video_quality_score, analytics.connection_quality, analytics.packet_loss_percentage,
      analytics.jitter_ms, analytics.latency_ms, analytics.bytes_sent, analytics.bytes_received,
      analytics.peak_bandwidth_mbps, analytics.participant_count, analytics.max_participants,
      analytics.codec_used, analytics.resolution, analytics.frame_rate
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error('Failed to record voice/video analytics', { error, analytics });
      throw error;
    }
  }

  // Revenue Analytics
  async recordRevenueAnalytics(analytics: RevenueAnalytics): Promise<void> {
    const query = `
      INSERT INTO revenue_analytics (
        transaction_id, user_id, transaction_type, amount_usd, amount_crypto,
        currency_type, platform_fee_usd, payment_processor_fee_usd, net_revenue_usd,
        country_code, user_segment, referral_source, marketing_campaign
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const values = [
      analytics.transaction_id, analytics.user_id, analytics.transaction_type,
      analytics.amount_usd, analytics.amount_crypto, analytics.currency_type,
      analytics.platform_fee_usd, analytics.payment_processor_fee_usd, analytics.net_revenue_usd,
      analytics.country_code, analytics.user_segment, analytics.referral_source, analytics.marketing_campaign
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error('Failed to record revenue analytics', { error, analytics });
      throw error;
    }
  }

  // Moderation Analytics
  async recordModerationAnalytics(analytics: ModerationAnalytics): Promise<void> {
    const query = `
      INSERT INTO moderation_analytics (
        content_id, content_type, action_type, moderator_id, moderator_type,
        violation_type, severity_level, confidence_score, ai_model_version,
        ai_flags, community_id, reporter_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      analytics.content_id, analytics.content_type, analytics.action_type,
      analytics.moderator_id, analytics.moderator_type, analytics.violation_type,
      analytics.severity_level, analytics.confidence_score, analytics.ai_model_version,
      JSON.stringify(analytics.ai_flags || {}), analytics.community_id, analytics.reporter_id
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      logger.error('Failed to record moderation analytics', { error, analytics });
      throw error;
    }
  }

  // Analytics Queries
  async getUserEngagementData(userId: string, timeframe: string = '7 days'): Promise<any> {
    const query = `
      SELECT 
        time_bucket('1 hour', time) AS hour,
        event_category,
        COUNT(*) as event_count,
        COUNT(DISTINCT session_id) as session_count,
        AVG(page_load_time) as avg_page_load_time
      FROM user_activity_events
      WHERE user_id = $1 AND time > NOW() - INTERVAL '${timeframe}'
      GROUP BY hour, event_category
      ORDER BY hour DESC
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user engagement data', { error, userId });
      throw error;
    }
  }

  async getCommunityAnalytics(communityId: string, timeframe: string = '30 days'): Promise<any> {
    const query = `
      SELECT 
        time_bucket('1 day', time) AS day,
        COUNT(*) as post_count,
        AVG(engagement_rate) as avg_engagement_rate,
        AVG(virality_score) as avg_virality_score,
        MAX(virality_score) as max_virality_score,
        SUM(view_count) as total_views,
        SUM(upvote_count) as total_upvotes,
        SUM(comment_count) as total_comments
      FROM post_analytics
      WHERE community_id = $1 AND time > NOW() - INTERVAL '${timeframe}'
      GROUP BY day
      ORDER BY day DESC
    `;

    try {
      const result = await this.pool.query(query, [communityId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get community analytics', { error, communityId });
      throw error;
    }
  }

  async getPlatformMetrics(serviceName?: string, timeframe: string = '24 hours'): Promise<any> {
    let query = `
      SELECT 
        time_bucket('5 minutes', time) AS bucket,
        metric_name,
        service_name,
        AVG(metric_value) as avg_value,
        MAX(metric_value) as max_value,
        MIN(metric_value) as min_value,
        COUNT(*) as sample_count
      FROM platform_metrics
      WHERE time > NOW() - INTERVAL '${timeframe}'
    `;

    const params: any[] = [];
    if (serviceName) {
      query += ' AND service_name = $1';
      params.push(serviceName);
    }

    query += `
      GROUP BY bucket, metric_name, service_name
      ORDER BY bucket DESC
    `;

    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get platform metrics', { error, serviceName });
      throw error;
    }
  }

  async getRevenueMetrics(timeframe: string = '30 days'): Promise<any> {
    const query = `
      SELECT 
        time_bucket('1 day', time) AS day,
        transaction_type,
        COUNT(*) as transaction_count,
        SUM(amount_usd) as total_revenue,
        SUM(net_revenue_usd) as total_net_revenue,
        AVG(amount_usd) as avg_transaction_value,
        COUNT(DISTINCT user_id) as unique_users
      FROM revenue_analytics
      WHERE time > NOW() - INTERVAL '${timeframe}'
      GROUP BY day, transaction_type
      ORDER BY day DESC
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get revenue metrics', { error });
      throw error;
    }
  }

  async getTrendingContent(timeframe: string = '2 hours'): Promise<any> {
    const query = `
      SELECT 
        post_id,
        community_id,
        user_id,
        FIRST_VALUE(engagement_rate) OVER (
          PARTITION BY post_id 
          ORDER BY time DESC
        ) as current_rate,
        FIRST_VALUE(engagement_rate) OVER (
          PARTITION BY post_id 
          ORDER BY time ASC
        ) as initial_rate,
        COUNT(*) OVER (PARTITION BY post_id) as data_points
      FROM post_analytics
      WHERE time > NOW() - INTERVAL '${timeframe}'
      AND data_points >= 3
      AND current_rate > initial_rate
      ORDER BY ((current_rate - initial_rate) / NULLIF(initial_rate, 0)) DESC
      LIMIT 50
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get trending content', { error });
      throw error;
    }
  }

  async getSystemHealthMetrics(): Promise<any> {
    const queries = {
      errorRate: `
        SELECT COUNT(*) as error_count
        FROM websocket_metrics 
        WHERE event_type = 'error' 
        AND time > NOW() - INTERVAL '5 minutes'
      `,
      activeUsers: `
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM user_activity_events 
        WHERE time > NOW() - INTERVAL '5 minutes'
      `,
      avgResponseTime: `
        SELECT AVG(response_time) as avg_response_time
        FROM user_activity_events 
        WHERE response_time IS NOT NULL
        AND time > NOW() - INTERVAL '5 minutes'
      `,
      voiceVideoSessions: `
        SELECT COUNT(*) as active_sessions
        FROM voice_video_analytics 
        WHERE session_duration IS NULL -- Active sessions
        AND time > NOW() - INTERVAL '1 hour'
      `
    };

    try {
      const results = await Promise.all([
        this.pool.query(queries.errorRate),
        this.pool.query(queries.activeUsers),
        this.pool.query(queries.avgResponseTime),
        this.pool.query(queries.voiceVideoSessions)
      ]);

      return {
        error_rate: results[0].rows[0]?.error_count || 0,
        active_users: results[1].rows[0]?.active_users || 0,
        avg_response_time: results[2].rows[0]?.avg_response_time || 0,
        active_voice_video_sessions: results[3].rows[0]?.active_sessions || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get system health metrics', { error });
      throw error;
    }
  }

  // Utility methods
  async executeCustomQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to execute custom query', { error, query });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // Memory and performance monitoring
  async getDatabasePerformanceStats(): Promise<any> {
    try {
      const queries = {
        connectionStats: `
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `,
        databaseSize: `
          SELECT 
            pg_size_pretty(pg_database_size(current_database())) as database_size,
            pg_database_size(current_database()) as database_size_bytes
        `,
        tableStats: `
          SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
          FROM pg_stat_user_tables 
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
          LIMIT 10
        `,
        slowQueries: `
          SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements 
          WHERE query NOT LIKE '%pg_stat_statements%'
          ORDER BY mean_time DESC 
          LIMIT 5
        `
      };

      const [connectionStats, databaseSize, tableStats, slowQueries] = await Promise.all([
        this.pool.query(queries.connectionStats),
        this.pool.query(queries.databaseSize),
        this.pool.query(queries.tableStats),
        this.pool.query(queries.slowQueries).catch(() => ({ rows: [] })) // pg_stat_statements might not be enabled
      ]);

      return {
        connections: connectionStats.rows[0],
        database: databaseSize.rows[0],
        top_tables: tableStats.rows,
        slow_queries: slowQueries.rows,
        pool_stats: {
          total_count: this.pool.totalCount,
          idle_count: this.pool.idleCount,
          waiting_count: this.pool.waitingCount
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get database performance stats', { error });
      throw error;
    }
  }

  // Optimize database performance
  async optimizeDatabase(): Promise<void> {
    try {
      // Analyze tables for better query planning
      await this.pool.query('ANALYZE');
      
      // Vacuum tables to reclaim space
      await this.pool.query('VACUUM');
      
      logger.info('Database optimization completed');
    } catch (error) {
      logger.error('Database optimization failed', { error });
      throw error;
    }
  }

  // Get memory usage for specific tables
  async getTableMemoryUsage(): Promise<any> {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
          pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get table memory usage', { error });
      throw error;
    }
  }

  // Clean old data to free up memory
  async cleanOldData(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const tables = [
        'user_activity_events',
        'platform_metrics',
        'websocket_metrics'
      ];

      for (const table of tables) {
        const deleteQuery = `
          DELETE FROM ${table} 
          WHERE time < $1
        `;
        
        const result = await this.pool.query(deleteQuery, [cutoffDate]);
        logger.info(`Cleaned old data from ${table}`, { 
          rowsDeleted: result.rowCount,
          cutoffDate: cutoffDate.toISOString()
        });
      }

      // Run vacuum after cleanup
      await this.pool.query('VACUUM ANALYZE');
    } catch (error) {
      logger.error('Failed to clean old data', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    await this.pool.end();
  }
}

export const timescaleClient = new TimescaleAnalyticsClient();