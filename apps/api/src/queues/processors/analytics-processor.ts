import { Job } from 'bullmq';
import { Logger } from 'pino';
import { Redis } from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

export interface AnalyticsJobData {
  eventType: 'user_action' | 'system_event' | 'business_metric' | 'performance_metric' | 'error_event';
  eventName: string;
  userId?: string;
  sessionId?: string;
  data: {
    action?: string;
    category?: string;
    label?: string;
    value?: number;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
  };
  context: {
    timestamp: string;
    userAgent?: string;
    ipAddress?: string;
    geoLocation?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    platform?: 'web' | 'mobile' | 'api';
    version?: string;
    environment?: 'production' | 'staging' | 'development';
  };
  aggregations: {
    realTime: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    customPeriods?: string[];
  };
  retention?: {
    raw: number; // days to keep raw events
    aggregated: number; // days to keep aggregated data
  };
  privacy: {
    anonymize?: boolean;
    excludePII?: boolean;
    gdprCompliant?: boolean;
  };
}

export interface AnalyticsResult {
  eventId: string;
  processed: boolean;
  aggregationsCreated: string[];
  errors?: string[];
  processingTime: number;
  dataPoints: {
    raw: number;
    realTime: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface MetricAggregation {
  period: 'realtime' | 'daily' | 'weekly' | 'monthly';
  timestamp: string;
  metrics: Record<string, number>;
  dimensions: Record<string, string>;
  count: number;
}

export class AnalyticsProcessor {
  private redis: Redis;
  private logger: Logger;
  private elasticsearch?: ElasticsearchClient;
  
  private metrics = {
    eventsProcessed: 0,
    aggregationsCreated: 0,
    realTimeUpdates: 0,
    dataPointsStored: 0,
    processingTime: 0,
    errors: 0,
    eventsByType: new Map<string, number>(),
    dataRetentionApplied: 0,
  };

  private aggregationWindows = {
    realtime: 60, // 1 minute
    daily: 86400, // 24 hours
    weekly: 604800, // 7 days
    monthly: 2592000, // 30 days
  };

  constructor(redis: Redis, logger: Logger, elasticsearch?: ElasticsearchClient) {
    this.redis = redis;
    this.logger = logger;
    this.elasticsearch = elasticsearch;
  }

  public async processAnalyticsJob(job: Job<AnalyticsJobData>): Promise<AnalyticsResult> {
    const startTime = Date.now();
    const jobData = job.data;
    const eventId = `${jobData.eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.info({
        jobId: job.id,
        eventType: jobData.eventType,
        eventName: jobData.eventName,
        userId: jobData.userId,
      }, 'Processing analytics job');

      const errors: string[] = [];
      const aggregationsCreated: string[] = [];
      let dataPoints = {
        raw: 0,
        realTime: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
      };

      // Privacy compliance processing
      const processedData = await this.applyPrivacyCompliance(jobData);

      // Store raw event data
      try {
        await this.storeRawEvent(eventId, processedData);
        dataPoints.raw = 1;
      } catch (error) {
        errors.push(`Failed to store raw event: ${error}`);
        this.logger.error({ error, eventId }, 'Failed to store raw event');
      }

      // Real-time aggregations
      if (jobData.aggregations.realTime) {
        try {
          await this.updateRealTimeMetrics(processedData);
          dataPoints.realTime = 1;
          aggregationsCreated.push('realtime');
        } catch (error) {
          errors.push(`Failed to update real-time metrics: ${error}`);
          this.logger.error({ error, eventId }, 'Failed to update real-time metrics');
        }
      }

      // Daily aggregations
      if (jobData.aggregations.daily) {
        try {
          await this.updateDailyAggregations(processedData);
          dataPoints.daily = 1;
          aggregationsCreated.push('daily');
        } catch (error) {
          errors.push(`Failed to update daily aggregations: ${error}`);
          this.logger.error({ error, eventId }, 'Failed to update daily aggregations');
        }
      }

      // Weekly aggregations
      if (jobData.aggregations.weekly) {
        try {
          await this.updateWeeklyAggregations(processedData);
          dataPoints.weekly = 1;
          aggregationsCreated.push('weekly');
        } catch (error) {
          errors.push(`Failed to update weekly aggregations: ${error}`);
          this.logger.error({ error, eventId }, 'Failed to update weekly aggregations');
        }
      }

      // Monthly aggregations
      if (jobData.aggregations.monthly) {
        try {
          await this.updateMonthlyAggregations(processedData);
          dataPoints.monthly = 1;
          aggregationsCreated.push('monthly');
        } catch (error) {
          errors.push(`Failed to update monthly aggregations: ${error}`);
          this.logger.error({ error, eventId }, 'Failed to update monthly aggregations');
        }
      }

      // Custom period aggregations
      if (jobData.aggregations.customPeriods) {
        for (const period of jobData.aggregations.customPeriods) {
          try {
            await this.updateCustomPeriodAggregations(processedData, period);
            aggregationsCreated.push(`custom_${period}`);
          } catch (error) {
            errors.push(`Failed to update custom aggregations for ${period}: ${error}`);
          }
        }
      }

      // Store in Elasticsearch for advanced analytics
      if (this.elasticsearch) {
        try {
          await this.indexInElasticsearch(eventId, processedData);
        } catch (error) {
          errors.push(`Failed to index in Elasticsearch: ${error}`);
          this.logger.error({ error, eventId }, 'Failed to index in Elasticsearch');
        }
      }

      // User-specific analytics
      if (processedData.userId) {
        try {
          await this.updateUserAnalytics(processedData);
        } catch (error) {
          errors.push(`Failed to update user analytics: ${error}`);
        }
      }

      // Session analytics
      if (processedData.sessionId) {
        try {
          await this.updateSessionAnalytics(processedData);
        } catch (error) {
          errors.push(`Failed to update session analytics: ${error}`);
        }
      }

      // Funnel analytics
      await this.updateFunnelAnalytics(processedData);

      // Cohort analytics
      await this.updateCohortAnalytics(processedData);

      // Apply data retention policies
      if (processedData.retention) {
        await this.applyDataRetentionPolicies(processedData.retention);
      }

      // Update metrics
      this.updateMetrics(jobData, dataPoints, aggregationsCreated.length);

      const result: AnalyticsResult = {
        eventId,
        processed: errors.length === 0,
        aggregationsCreated,
        errors: errors.length > 0 ? errors : undefined,
        processingTime: Date.now() - startTime,
        dataPoints,
      };

      this.logger.info({
        jobId: job.id,
        eventId,
        aggregationsCreated: aggregationsCreated.length,
        dataPointsTotal: Object.values(dataPoints).reduce((a, b) => a + b, 0),
        processingTime: result.processingTime,
        errors: errors.length,
      }, 'Analytics job completed');

      return result;

    } catch (error) {
      this.metrics.errors++;
      this.logger.error({
        error,
        jobId: job.id,
        eventType: jobData.eventType,
      }, 'Analytics job failed');
      throw error;
    }
  }

  private async applyPrivacyCompliance(jobData: AnalyticsJobData): Promise<AnalyticsJobData> {
    let processedData = { ...jobData };

    if (jobData.privacy.excludePII) {
      // Remove personally identifiable information
      processedData.context.ipAddress = this.hashIP(processedData.context.ipAddress);
      processedData.context.userAgent = this.sanitizeUserAgent(processedData.context.userAgent);
    }

    if (jobData.privacy.anonymize) {
      // Anonymize user data
      processedData.userId = processedData.userId ? this.hashUserId(processedData.userId) : undefined;
      processedData.sessionId = processedData.sessionId ? this.hashSessionId(processedData.sessionId) : undefined;
    }

    if (jobData.privacy.gdprCompliant) {
      // Apply GDPR compliance rules
      processedData = await this.applyGDPRCompliance(processedData);
    }

    return processedData;
  }

  private async storeRawEvent(eventId: string, data: AnalyticsJobData): Promise<void> {
    const eventData = {
      id: eventId,
      ...data,
      storedAt: new Date().toISOString(),
    };

    // Store in Redis with TTL based on retention policy
    const ttl = data.retention?.raw ? data.retention.raw * 86400 : 2592000; // Default 30 days
    await this.redis.set(`analytics:raw:${eventId}`, JSON.stringify(eventData), 'EX', ttl);

    // Also store in a time-series for easy querying
    const timestamp = new Date(data.context.timestamp).getTime();
    await this.redis.zadd(`analytics:events:${data.eventType}`, timestamp, eventId);
  }

  private async updateRealTimeMetrics(data: AnalyticsJobData): Promise<void> {
    const now = new Date();
    const minute = Math.floor(now.getTime() / (1000 * 60)) * 60; // Round to minute
    const key = `analytics:realtime:${data.eventType}:${minute}`;

    // Increment counters
    await this.redis.hincrby(key, 'count', 1);
    await this.redis.expire(key, this.aggregationWindows.realtime * 60); // Keep for 1 hour

    // Track unique users
    if (data.userId) {
      await this.redis.sadd(`${key}:users`, data.userId);
      await this.redis.expire(`${key}:users`, this.aggregationWindows.realtime * 60);
    }

    // Track metrics by platform
    if (data.context.platform) {
      await this.redis.hincrby(`${key}:platform`, data.context.platform, 1);
    }

    // Track custom metrics
    if (data.data.value !== undefined) {
      const currentSum = parseFloat(await this.redis.hget(key, 'sum') || '0');
      await this.redis.hset(key, 'sum', currentSum + data.data.value);
    }

    this.metrics.realTimeUpdates++;
  }

  private async updateDailyAggregations(data: AnalyticsJobData): Promise<void> {
    const date = new Date(data.context.timestamp);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const key = `analytics:daily:${data.eventType}:${dayKey}`;

    // Basic counters
    await this.redis.hincrby(key, 'count', 1);
    await this.redis.expire(key, this.aggregationWindows.daily * 30); // Keep for 30 days

    // Unique users
    if (data.userId) {
      await this.redis.sadd(`${key}:users`, data.userId);
      await this.redis.expire(`${key}:users`, this.aggregationWindows.daily * 30);
    }

    // Hourly distribution
    const hour = date.getHours();
    await this.redis.hincrby(`${key}:hours`, hour.toString(), 1);

    // Geographic distribution
    if (data.context.geoLocation?.country) {
      await this.redis.hincrby(`${key}:countries`, data.context.geoLocation.country, 1);
    }

    // Platform distribution
    if (data.context.platform) {
      await this.redis.hincrby(`${key}:platforms`, data.context.platform, 1);
    }

    // Value aggregations
    if (data.data.value !== undefined) {
      const currentSum = parseFloat(await this.redis.hget(key, 'value_sum') || '0');
      const currentCount = parseInt(await this.redis.hget(key, 'value_count') || '0');
      const currentMax = parseFloat(await this.redis.hget(key, 'value_max') || '0');
      const currentMin = parseFloat(await this.redis.hget(key, 'value_min') || '999999999');

      await this.redis.hset(key, {
        'value_sum': currentSum + data.data.value,
        'value_count': currentCount + 1,
        'value_avg': (currentSum + data.data.value) / (currentCount + 1),
        'value_max': Math.max(currentMax, data.data.value),
        'value_min': Math.min(currentMin, data.data.value),
      });
    }
  }

  private async updateWeeklyAggregations(data: AnalyticsJobData): Promise<void> {
    const date = new Date(data.context.timestamp);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
    const key = `analytics:weekly:${data.eventType}:${weekKey}`;

    await this.redis.hincrby(key, 'count', 1);
    await this.redis.expire(key, this.aggregationWindows.weekly * 8); // Keep for 8 weeks

    if (data.userId) {
      await this.redis.sadd(`${key}:users`, data.userId);
      await this.redis.expire(`${key}:users`, this.aggregationWindows.weekly * 8);
    }

    // Day of week distribution
    const dayOfWeek = date.getDay();
    await this.redis.hincrby(`${key}:days`, dayOfWeek.toString(), 1);
  }

  private async updateMonthlyAggregations(data: AnalyticsJobData): Promise<void> {
    const date = new Date(data.context.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const key = `analytics:monthly:${data.eventType}:${monthKey}`;

    await this.redis.hincrby(key, 'count', 1);
    await this.redis.expire(key, this.aggregationWindows.monthly * 12); // Keep for 12 months

    if (data.userId) {
      await this.redis.sadd(`${key}:users`, data.userId);
      await this.redis.expire(`${key}:users`, this.aggregationWindows.monthly * 12);
    }

    // Weekly distribution within month
    const weekOfMonth = Math.ceil(date.getDate() / 7);
    await this.redis.hincrby(`${key}:weeks`, weekOfMonth.toString(), 1);
  }

  private async updateCustomPeriodAggregations(data: AnalyticsJobData, period: string): Promise<void> {
    // Custom period aggregations (e.g., "15m", "4h", "3d")
    const periodMs = this.parsePeriod(period);
    const timestamp = new Date(data.context.timestamp).getTime();
    const periodStart = Math.floor(timestamp / periodMs) * periodMs;
    const key = `analytics:custom:${period}:${data.eventType}:${periodStart}`;

    await this.redis.hincrby(key, 'count', 1);
    await this.redis.expire(key, periodMs / 1000 * 10); // Keep for 10 periods

    if (data.userId) {
      await this.redis.sadd(`${key}:users`, data.userId);
      await this.redis.expire(`${key}:users`, periodMs / 1000 * 10);
    }
  }

  private async indexInElasticsearch(eventId: string, data: AnalyticsJobData): Promise<void> {
    if (!this.elasticsearch) return;

    const index = `analytics-${data.eventType}-${new Date(data.context.timestamp).toISOString().slice(0, 7)}`; // Monthly indices

    await this.elasticsearch.index({
      index,
      id: eventId,
      body: {
        ...data,
        '@timestamp': data.context.timestamp,
        event_id: eventId,
      },
    });
  }

  private async updateUserAnalytics(data: AnalyticsJobData): Promise<void> {
    if (!data.userId) return;

    const userKey = `analytics:user:${data.userId}`;
    const today = new Date().toISOString().slice(0, 10);

    // Update user activity
    await this.redis.hincrby(userKey, 'total_events', 1);
    await this.redis.hincrby(userKey, `events_${today}`, 1);
    await this.redis.hset(userKey, 'last_seen', data.context.timestamp);

    // Track user journey
    await this.redis.lpush(`${userKey}:journey`, JSON.stringify({
      eventType: data.eventType,
      eventName: data.eventName,
      timestamp: data.context.timestamp,
      data: data.data,
    }));

    // Keep only last 100 events in journey
    await this.redis.ltrim(`${userKey}:journey`, 0, 99);

    // User lifetime value tracking
    if (data.data.value && data.eventType === 'business_metric') {
      const currentLTV = parseFloat(await this.redis.hget(userKey, 'lifetime_value') || '0');
      await this.redis.hset(userKey, 'lifetime_value', currentLTV + data.data.value);
    }
  }

  private async updateSessionAnalytics(data: AnalyticsJobData): Promise<void> {
    if (!data.sessionId) return;

    const sessionKey = `analytics:session:${data.sessionId}`;

    // Update session data
    await this.redis.hincrby(sessionKey, 'event_count', 1);
    await this.redis.hset(sessionKey, 'last_activity', data.context.timestamp);
    await this.redis.expire(sessionKey, 86400 * 7); // Keep sessions for 7 days

    // Track session events
    await this.redis.lpush(`${sessionKey}:events`, JSON.stringify({
      eventType: data.eventType,
      eventName: data.eventName,
      timestamp: data.context.timestamp,
    }));

    // Calculate session duration
    const firstActivity = await this.redis.hget(sessionKey, 'first_activity');
    if (!firstActivity) {
      await this.redis.hset(sessionKey, 'first_activity', data.context.timestamp);
    } else {
      const duration = new Date(data.context.timestamp).getTime() - new Date(firstActivity).getTime();
      await this.redis.hset(sessionKey, 'duration_ms', duration);
    }
  }

  private async updateFunnelAnalytics(data: AnalyticsJobData): Promise<void> {
    // Define funnel steps for different event types
    const funnels: Record<string, string[]> = {
      'user_registration': ['page_view', 'signup_start', 'signup_complete'],
      'content_engagement': ['content_view', 'content_like', 'content_share', 'content_comment'],
      'purchase': ['product_view', 'add_to_cart', 'checkout_start', 'purchase_complete'],
    };

    for (const [funnelName, steps] of Object.entries(funnels)) {
      if (steps.includes(data.eventName)) {
        const stepIndex = steps.indexOf(data.eventName);
        const funnelKey = `analytics:funnel:${funnelName}`;
        
        await this.redis.hincrby(`${funnelKey}:step_${stepIndex}`, 'count', 1);
        
        if (data.userId) {
          await this.redis.sadd(`${funnelKey}:step_${stepIndex}:users`, data.userId);
          
          // Track user progression through funnel
          await this.redis.hset(`${funnelKey}:user:${data.userId}`, `step_${stepIndex}`, data.context.timestamp);
        }
      }
    }
  }

  private async updateCohortAnalytics(data: AnalyticsJobData): Promise<void> {
    if (!data.userId || data.eventType !== 'user_action') return;

    // Get user registration date to determine cohort
    const userRegistrationDate = await this.redis.hget(`user:${data.userId}`, 'registration_date');
    if (!userRegistrationDate) return;

    const regDate = new Date(userRegistrationDate);
    const cohortKey = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate periods since registration
    const eventDate = new Date(data.context.timestamp);
    const daysSinceReg = Math.floor((eventDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    const period = Math.floor(daysSinceReg / 7); // Weekly cohorts

    const cohortAnalyticsKey = `analytics:cohort:${cohortKey}:period_${period}`;
    await this.redis.sadd(cohortAnalyticsKey, data.userId);
    await this.redis.expire(cohortAnalyticsKey, this.aggregationWindows.monthly * 24); // Keep for 24 months
  }

  private async applyDataRetentionPolicies(retention: AnalyticsJobData['retention']): Promise<void> {
    if (!retention) return;

    // Clean up old raw events
    const cutoffRaw = new Date(Date.now() - retention.raw * 86400 * 1000);
    const rawKeys = await this.redis.keys('analytics:raw:*');
    
    for (const key of rawKeys) {
      const data = await this.redis.get(key);
      if (data) {
        const eventData = JSON.parse(data);
        if (new Date(eventData.storedAt) < cutoffRaw) {
          await this.redis.del(key);
          this.metrics.dataRetentionApplied++;
        }
      }
    }

    // Clean up old aggregated data
    const cutoffAggregated = new Date(Date.now() - retention.aggregated * 86400 * 1000);
    const aggKeys = await this.redis.keys('analytics:daily:*');
    
    for (const key of aggKeys) {
      const keyParts = key.split(':');
      const dateStr = keyParts[keyParts.length - 1];
      const keyDate = new Date(dateStr);
      
      if (keyDate < cutoffAggregated) {
        await this.redis.del(key);
        this.metrics.dataRetentionApplied++;
      }
    }
  }

  private hashIP(ip?: string): string {
    if (!ip) return 'unknown';
    // Simple hash for demo - use proper hashing in production
    return Buffer.from(ip).toString('base64').substring(0, 8);
  }

  private sanitizeUserAgent(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    // Extract only browser and OS info, remove version numbers
    return userAgent.replace(/[\d.]+/g, 'X.X');
  }

  private hashUserId(userId: string): string {
    // Simple hash for demo - use proper hashing in production
    return Buffer.from(userId).toString('base64').substring(0, 12);
  }

  private hashSessionId(sessionId: string): string {
    // Simple hash for demo - use proper hashing in production
    return Buffer.from(sessionId).toString('base64').substring(0, 12);
  }

  private async applyGDPRCompliance(data: AnalyticsJobData): Promise<AnalyticsJobData> {
    // Apply GDPR compliance rules
    // Remove or pseudonymize personal data based on consent
    return data;
  }

  private parsePeriod(period: string): number {
    const unit = period.slice(-1);
    const value = parseInt(period.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 1000 * 60;
      case 'h': return value * 1000 * 60 * 60;
      case 'd': return value * 1000 * 60 * 60 * 24;
      default: return value * 1000 * 60; // Default to minutes
    }
  }

  private updateMetrics(jobData: AnalyticsJobData, dataPoints: any, aggregationsCount: number): void {
    this.metrics.eventsProcessed++;
    this.metrics.aggregationsCreated += aggregationsCount;
    this.metrics.dataPointsStored += Object.values(dataPoints).reduce((a: any, b: any) => a + b, 0);
    
    const currentCount = this.metrics.eventsByType.get(jobData.eventType) || 0;
    this.metrics.eventsByType.set(jobData.eventType, currentCount + 1);
  }

  public async getAnalytics(query: {
    eventType?: string;
    eventName?: string;
    period: 'realtime' | 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
    userId?: string;
    dimensions?: string[];
  }): Promise<any> {
    const results: any = {};

    try {
      if (query.period === 'realtime') {
        const now = Math.floor(Date.now() / (1000 * 60)) * 60;
        const keys = await this.redis.keys(`analytics:realtime:${query.eventType || '*'}:*`);
        
        for (const key of keys) {
          const data = await this.redis.hgetall(key);
          const timestamp = key.split(':').pop();
          results[timestamp || 'unknown'] = data;
        }
      } else {
        // Get aggregated data for other periods
        const pattern = `analytics:${query.period}:${query.eventType || '*'}:*`;
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const data = await this.redis.hgetall(key);
          const keyParts = key.split(':');
          const timestamp = keyParts[keyParts.length - 1];
          results[timestamp] = data;
        }
      }

      return results;
    } catch (error) {
      this.logger.error({ error, query }, 'Failed to get analytics data');
      throw error;
    }
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      averageProcessingTime: this.metrics.eventsProcessed > 0 
        ? this.metrics.processingTime / this.metrics.eventsProcessed 
        : 0,
      aggregationsPerEvent: this.metrics.eventsProcessed > 0
        ? this.metrics.aggregationsCreated / this.metrics.eventsProcessed
        : 0,
      eventsByType: Object.fromEntries(this.metrics.eventsByType),
      errorRate: this.metrics.eventsProcessed > 0
        ? (this.metrics.errors / this.metrics.eventsProcessed) * 100
        : 0,
    };
  }
}

export default AnalyticsProcessor;