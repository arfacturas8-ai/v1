import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import { logger } from '../utils/logger';
import EventEmitter from 'events';
import NodeCache from 'node-cache';

export interface AnalyticsEvent {
  type: 'message_sent' | 'user_joined' | 'user_left' | 'voice_joined' | 'voice_left' | 'reaction_added' | 'custom' | 'search_performed' | 'page_view';
  userId?: string;
  serverId?: string;
  channelId?: string;
  sessionId?: string;
  metadata?: any;
  timestamp?: Date;
  ip?: string;
  userAgent?: string;
}

export interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalMessages: number;
    totalServers: number;
    searchQueries: number;
    averageResponseTime: number;
  };
  charts: {
    userActivity: Array<{ timestamp: string; active_users: number; new_users: number }>;
    messageActivity: Array<{ timestamp: string; message_count: number; attachment_count: number }>;
    voiceActivity: Array<{ timestamp: string; sessions: number; total_minutes: number }>;
    searchActivity: Array<{ timestamp: string; search_count: number; average_response_time: number }>;
  };
  topContent: {
    activeServers: Array<{ serverId: string; name: string; messageCount: number; userCount: number }>;
    activeChannels: Array<{ channelId: string; name: string; messageCount: number; serverId: string }>;
    searchQueries: Array<{ query: string; count: number; averageResultCount: number }>;
  };
  performance: {
    databaseResponseTime: number;
    elasticsearchResponseTime: number;
    queueSize: number;
    errorRate: number;
  };
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  nextAttempt: number;
  successThreshold: number;
}

export class CrashProofAnalyticsService extends EventEmitter {
  private queue: Queue;
  private eventCache: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private cache: NodeCache;
  private circuitBreaker: CircuitBreakerState;
  private metricsBuffer: Map<string, any[]> = new Map();
  private isHealthy = true;
  private performanceMetrics = {
    totalQueries: 0,
    successfulQueries: 0,
    averageQueryTime: 0,
    lastQueryTime: null as Date | null
  };

  constructor(analyticsQueue: Queue) {
    super();
    this.queue = analyticsQueue;
    
    // Initialize cache with 10 minute TTL for dashboard data
    this.cache = new NodeCache({ 
      stdTTL: 600, // 10 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false 
    });

    // Initialize circuit breaker
    this.circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      nextAttempt: 0,
      successThreshold: 3
    };

    // Flush events to database every 15 seconds (more frequent for real-time analytics)
    this.flushInterval = setInterval(() => {
      this.flushEventCache();
    }, 15000);

    this.setupEventHandlers();
    this.startHealthMonitoring();
  }

  private setupEventHandlers(): void {
    // Cache event handlers
    this.cache.on('expired', (key, value) => {
      logger.debug('Analytics cache key expired', { key });
    });

    this.cache.on('flush', () => {
      logger.info('Analytics cache flushed');
    });

    // Queue event handlers
    this.queue.on('error', (error) => {
      logger.error('Analytics queue error:', error);
      this.handleCircuitBreakerFailure();
    });

    this.queue.on('failed', (job, error) => {
      logger.error('Analytics job failed:', { jobId: job.id, error: error.message });
      this.handleCircuitBreakerFailure();
    });
  }

  /**
   * Track an analytics event with crash protection
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Validate and sanitize event
      const sanitizedEvent = this.sanitizeEvent(event);
      
      // Add timestamp if not provided
      const eventWithTimestamp = {
        ...sanitizedEvent,
        timestamp: sanitizedEvent.timestamp || new Date()
      };

      // Add to local cache for immediate processing
      this.eventCache.push(eventWithTimestamp);

      // If cache is getting full, flush immediately
      if (this.eventCache.length >= 50) {
        await this.flushEventCache();
      }

      // Queue for asynchronous processing if circuit breaker allows
      if (this.circuitBreaker.state !== 'OPEN') {
        try {
          await this.queue.add('process-analytics-event', eventWithTimestamp, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 10,
            removeOnFail: 5
          });
        } catch (error) {
          logger.warn('Failed to queue analytics event, will process in batch:', error);
          // Event is still in cache and will be processed during flush
        }
      }
    } catch (error) {
      logger.error('Failed to track analytics event:', error);
      // Don't throw error - analytics should never crash the main application
      this.emit('tracking_error', error);
    }
  }

  /**
   * Get dashboard data with caching and error resilience
   */
  async getDashboardData(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<DashboardData> {
    const cacheKey = `dashboard_${timeRange}`;
    
    try {
      // Check cache first
      const cached = this.cache.get<DashboardData>(cacheKey);
      if (cached) {
        logger.debug('Returning cached dashboard data', { timeRange });
        return cached;
      }

      // Generate fresh data
      const startTime = Date.now();
      const data = await this.generateDashboardData(timeRange);
      const queryTime = Date.now() - startTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(queryTime);
      this.handleCircuitBreakerSuccess();

      // Cache the result
      this.cache.set(cacheKey, data);
      
      logger.info('Generated fresh dashboard data', { 
        timeRange, 
        queryTime: `${queryTime}ms` 
      });
      
      return data;
    } catch (error) {
      logger.error('Failed to generate dashboard data:', error);
      this.handleCircuitBreakerFailure();
      
      // Try to return cached data even if expired
      const staleData = this.cache.get<DashboardData>(cacheKey);
      if (staleData) {
        logger.warn('Returning stale dashboard data due to error', { timeRange });
        return staleData;
      }

      // Return minimal fallback data
      return this.getFallbackDashboardData();
    }
  }

  /**
   * Generate dashboard data from TimescaleDB
   */
  private async generateDashboardData(timeRange: string): Promise<DashboardData> {
    const timeRangeHours = this.getTimeRangeHours(timeRange);
    const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      overview,
      userActivity,
      messageActivity,
      voiceActivity,
      searchActivity,
      topContent
    ] = await Promise.all([
      this.getOverviewMetrics(since),
      this.getUserActivityChart(since, timeRange),
      this.getMessageActivityChart(since, timeRange),
      this.getVoiceActivityChart(since, timeRange),
      this.getSearchActivityChart(since, timeRange),
      this.getTopContent(since)
    ]);

    const performance = await this.getPerformanceMetrics();

    return {
      overview,
      charts: {
        userActivity,
        messageActivity,
        voiceActivity,
        searchActivity
      },
      topContent,
      performance
    };
  }

  /**
   * Get overview metrics with fallbacks
   */
  private async getOverviewMetrics(since: Date): Promise<DashboardData['overview']> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalMessages,
        totalServers,
        searchQueries
      ] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.user.count({
          where: { lastSeenAt: { gte: since } }
        }).catch(() => 0),
        prisma.message.count({
          where: { createdAt: { gte: since } }
        }).catch(() => 0),
        prisma.server.count().catch(() => 0),
        this.getSearchQueryCount(since)
      ]);

      return {
        totalUsers,
        activeUsers,
        totalMessages,
        totalServers,
        searchQueries,
        averageResponseTime: this.performanceMetrics.averageQueryTime
      };
    } catch (error) {
      logger.error('Failed to get overview metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalMessages: 0,
        totalServers: 0,
        searchQueries: 0,
        averageResponseTime: 0
      };
    }
  }

  /**
   * Get user activity chart data
   */
  private async getUserActivityChart(since: Date, timeRange: string): Promise<Array<{ timestamp: string; active_users: number; new_users: number }>> {
    try {
      const interval = this.getTimeInterval(timeRange);
      
      // Use TimescaleDB time_bucket function for efficient time series aggregation
      const result = await prisma.$queryRaw<Array<{
        time_bucket: Date;
        active_users: bigint;
        new_users: bigint;
      }>>`
        WITH time_series AS (
          SELECT time_bucket(${interval}::interval, created_at) as time_bucket,
                 COUNT(DISTINCT id) as active_users,
                 COUNT(DISTINCT CASE WHEN created_at >= ${since} THEN id END) as new_users
          FROM "User"
          WHERE last_seen_at >= ${since}
          GROUP BY time_bucket
          ORDER BY time_bucket
        )
        SELECT * FROM time_series
      `;

      return result.map(row => ({
        timestamp: row.time_bucket.toISOString(),
        active_users: Number(row.active_users),
        new_users: Number(row.new_users)
      }));
    } catch (error) {
      logger.error('Failed to get user activity chart:', error);
      return [];
    }
  }

  /**
   * Get message activity chart data
   */
  private async getMessageActivityChart(since: Date, timeRange: string): Promise<Array<{ timestamp: string; message_count: number; attachment_count: number }>> {
    try {
      const interval = this.getTimeInterval(timeRange);
      
      const result = await prisma.$queryRaw<Array<{
        time_bucket: Date;
        message_count: bigint;
        attachment_count: bigint;
      }>>`
        SELECT time_bucket(${interval}::interval, created_at) as time_bucket,
               COUNT(*) as message_count,
               COUNT(DISTINCT CASE WHEN EXISTS(
                 SELECT 1 FROM "MessageAttachment" ma WHERE ma.message_id = "Message".id
               ) THEN "Message".id END) as attachment_count
        FROM "Message"
        WHERE created_at >= ${since}
        GROUP BY time_bucket
        ORDER BY time_bucket
      `;

      return result.map(row => ({
        timestamp: row.time_bucket.toISOString(),
        message_count: Number(row.message_count),
        attachment_count: Number(row.attachment_count)
      }));
    } catch (error) {
      logger.error('Failed to get message activity chart:', error);
      return [];
    }
  }

  /**
   * Get voice activity chart data
   */
  private async getVoiceActivityChart(since: Date, timeRange: string): Promise<Array<{ timestamp: string; sessions: number; total_minutes: number }>> {
    try {
      const interval = this.getTimeInterval(timeRange);
      
      const result = await prisma.$queryRaw<Array<{
        time_bucket: Date;
        sessions: bigint;
        total_minutes: number;
      }>>`
        SELECT time_bucket(${interval}::interval, timestamp) as time_bucket,
               COUNT(*) as sessions,
               SUM(session_duration) / 60.0 as total_minutes
        FROM "VoiceAnalytics"
        WHERE timestamp >= ${since}
        GROUP BY time_bucket
        ORDER BY time_bucket
      `;

      return result.map(row => ({
        timestamp: row.time_bucket.toISOString(),
        sessions: Number(row.sessions),
        total_minutes: Math.round(row.total_minutes || 0)
      }));
    } catch (error) {
      logger.error('Failed to get voice activity chart:', error);
      return [];
    }
  }

  /**
   * Get search activity chart data
   */
  private async getSearchActivityChart(since: Date, timeRange: string): Promise<Array<{ timestamp: string; search_count: number; average_response_time: number }>> {
    try {
      // This would require a search analytics table - for now return mock data
      const interval = this.getTimeInterval(timeRange);
      const hours = this.getTimeRangeHours(timeRange === '1h' ? '24h' : timeRange);
      const points = Math.min(24, hours);
      
      const data: Array<{ timestamp: string; search_count: number; average_response_time: number }> = [];
      
      for (let i = points - 1; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * (hours / points) * 60 * 60 * 1000);
        data.push({
          timestamp: timestamp.toISOString(),
          search_count: Math.floor(Math.random() * 50) + 10,
          average_response_time: Math.floor(Math.random() * 200) + 50
        });
      }
      
      return data;
    } catch (error) {
      logger.error('Failed to get search activity chart:', error);
      return [];
    }
  }

  /**
   * Get top content metrics
   */
  private async getTopContent(since: Date): Promise<DashboardData['topContent']> {
    try {
      const [activeServers, activeChannels, searchQueries] = await Promise.all([
        // Top active servers
        prisma.$queryRaw<Array<{
          server_id: string;
          name: string;
          message_count: bigint;
          user_count: bigint;
        }>>`
          SELECT s.id as server_id, s.name,
                 COUNT(DISTINCT m.id) as message_count,
                 COUNT(DISTINCT m.user_id) as user_count
          FROM "Server" s
          JOIN "Channel" c ON c.server_id = s.id
          JOIN "Message" m ON m.channel_id = c.id
          WHERE m.created_at >= ${since}
          GROUP BY s.id, s.name
          ORDER BY message_count DESC
          LIMIT 10
        `,

        // Top active channels
        prisma.$queryRaw<Array<{
          channel_id: string;
          name: string;
          server_id: string;
          message_count: bigint;
        }>>`
          SELECT c.id as channel_id, c.name, c.server_id,
                 COUNT(m.id) as message_count
          FROM "Channel" c
          JOIN "Message" m ON m.channel_id = c.id
          WHERE m.created_at >= ${since}
          GROUP BY c.id, c.name, c.server_id
          ORDER BY message_count DESC
          LIMIT 10
        `,

        // Mock search queries - would need dedicated table
        Promise.resolve([
          { query: 'hello', count: 45, averageResultCount: 12 },
          { query: 'help', count: 32, averageResultCount: 8 },
          { query: 'discord', count: 28, averageResultCount: 15 }
        ])
      ]);

      return {
        activeServers: activeServers.map(s => ({
          serverId: s.server_id,
          name: s.name,
          messageCount: Number(s.message_count),
          userCount: Number(s.user_count)
        })),
        activeChannels: activeChannels.map(c => ({
          channelId: c.channel_id,
          name: c.name,
          serverId: c.server_id,
          messageCount: Number(c.message_count)
        })),
        searchQueries
      };
    } catch (error) {
      logger.error('Failed to get top content:', error);
      return {
        activeServers: [],
        activeChannels: [],
        searchQueries: []
      };
    }
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<DashboardData['performance']> {
    try {
      const [dbResponseTime, queueStats] = await Promise.all([
        this.measureDatabaseResponseTime(),
        this.getQueueSize()
      ]);

      return {
        databaseResponseTime: dbResponseTime,
        elasticsearchResponseTime: this.performanceMetrics.averageQueryTime,
        queueSize: queueStats,
        errorRate: this.calculateErrorRate()
      };
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      return {
        databaseResponseTime: 0,
        elasticsearchResponseTime: 0,
        queueSize: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Track search queries for analytics
   */
  async trackSearchQuery(query: string, resultCount: number, responseTime: number, userId?: string): Promise<void> {
    await this.trackEvent({
      type: 'search_performed',
      userId,
      metadata: {
        query: query.substring(0, 100), // Truncate for privacy
        resultCount,
        responseTime,
        queryLength: query.length
      }
    });
  }

  /**
   * Track page views and user activity
   */
  async trackPageView(path: string, userId?: string, sessionId?: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      type: 'page_view',
      userId,
      sessionId,
      metadata: {
        path,
        ...metadata
      }
    });
  }

  /**
   * Utility and helper methods
   */
  private sanitizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    // Remove sensitive data and validate input
    const sanitized: AnalyticsEvent = {
      type: event.type,
      userId: event.userId?.substring(0, 50),
      serverId: event.serverId?.substring(0, 50),
      channelId: event.channelId?.substring(0, 50),
      sessionId: event.sessionId?.substring(0, 100),
      timestamp: event.timestamp,
      metadata: event.metadata ? this.sanitizeMetadata(event.metadata) : undefined
    };

    return sanitized;
  }

  private sanitizeMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') return {};
    
    const sanitized: any = {};
    const allowedKeys = ['query', 'resultCount', 'responseTime', 'path', 'duration', 'roomName'];
    
    for (const key of allowedKeys) {
      if (metadata[key] !== undefined) {
        sanitized[key] = typeof metadata[key] === 'string' 
          ? metadata[key].substring(0, 200) 
          : metadata[key];
      }
    }
    
    return sanitized;
  }

  private getTimeRangeHours(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 168;
      case '30d': return 720;
      default: return 24;
    }
  }

  private getTimeInterval(timeRange: string): string {
    switch (timeRange) {
      case '1h': return '5 minutes';
      case '24h': return '1 hour';
      case '7d': return '6 hours';
      case '30d': return '1 day';
      default: return '1 hour';
    }
  }

  private async measureDatabaseResponseTime(): Promise<number> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      return Date.now() - start;
    } catch (error) {
      return 0;
    }
  }

  private async getQueueSize(): Promise<number> {
    try {
      const waiting = await this.queue.getWaiting();
      return waiting.length;
    } catch (error) {
      return 0;
    }
  }

  private async getSearchQueryCount(since: Date): Promise<number> {
    // This would require a dedicated search analytics table
    // For now, return a mock value
    return Math.floor(Math.random() * 1000) + 100;
  }

  private calculateErrorRate(): number {
    const total = this.performanceMetrics.totalQueries;
    const successful = this.performanceMetrics.successfulQueries;
    return total > 0 ? ((total - successful) / total) * 100 : 0;
  }

  private updatePerformanceMetrics(queryTime: number): void {
    this.performanceMetrics.totalQueries++;
    this.performanceMetrics.successfulQueries++;
    this.performanceMetrics.averageQueryTime = 
      (this.performanceMetrics.averageQueryTime + queryTime) / 2;
    this.performanceMetrics.lastQueryTime = new Date();
  }

  private handleCircuitBreakerSuccess(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      logger.info('Analytics circuit breaker closed after successful operation');
    }
  }

  private handleCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++;
    
    if (this.circuitBreaker.failures >= 5) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttempt = Date.now() + 60000; // 1 minute
      logger.warn('Analytics circuit breaker opened due to failures');
    }
  }

  private getFallbackDashboardData(): DashboardData {
    return {
      overview: {
        totalUsers: 0,
        activeUsers: 0,
        totalMessages: 0,
        totalServers: 0,
        searchQueries: 0,
        averageResponseTime: 0
      },
      charts: {
        userActivity: [],
        messageActivity: [],
        voiceActivity: [],
        searchActivity: []
      },
      topContent: {
        activeServers: [],
        activeChannels: [],
        searchQueries: []
      },
      performance: {
        databaseResponseTime: 0,
        elasticsearchResponseTime: 0,
        queueSize: 0,
        errorRate: 100
      }
    };
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        await this.measureDatabaseResponseTime();
        this.isHealthy = true;
      } catch (error) {
        this.isHealthy = false;
        logger.warn('Analytics health check failed:', error);
      }
    }, 30000);
  }

  /**
   * Flush event cache to database
   */
  private async flushEventCache(): Promise<void> {
    if (this.eventCache.length === 0) return;

    const eventsToFlush = [...this.eventCache];
    this.eventCache = [];

    try {
      // Process events in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < eventsToFlush.length; i += batchSize) {
        const batch = eventsToFlush.slice(i, i + batchSize);
        
        await this.queue.addBulk(
          batch.map((event, index) => ({
            name: 'process-analytics-event',
            data: event,
            opts: {
              delay: index * 10, // Small delay to prevent overwhelming
              attempts: 2
            }
          }))
        );
      }

      logger.debug(`📊 Flushed ${eventsToFlush.length} analytics events`);
    } catch (error) {
      logger.error('Failed to flush analytics events:', error);
      // Put events back in cache to retry later
      this.eventCache = eventsToFlush.concat(this.eventCache);
      this.handleCircuitBreakerFailure();
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    circuitBreakerState: string;
    cacheSize: number;
    queueSize: number;
    eventCacheSize: number;
  } {
    return {
      isHealthy: this.isHealthy,
      circuitBreakerState: this.circuitBreaker.state,
      cacheSize: this.cache.keys().length,
      queueSize: 0, // Would need async call
      eventCacheSize: this.eventCache.length
    };
  }

  /**
   * Clear all caches (for testing/debugging)
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('Analytics cache cleared');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush remaining events
    await this.flushEventCache();
    
    // Close cache
    this.cache.close();
    
    logger.info('Analytics service cleaned up');
  }
}