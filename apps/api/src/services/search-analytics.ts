import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import { logger } from '../utils/logger';

export interface SearchEvent {
  query: string;
  type: 'search' | 'suggestion' | 'server_search';
  userId?: string;
  serverId?: string;
  communityId?: string;
  resultCount: number;
  responseTimeMs: number;
  timestamp: Date;
  filters?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  averageResponseTime: number;
  popularQueries: Array<{ query: string; count: number }>;
  searchTypes: Record<string, number>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  topUsers: Array<{ userId: string; username: string; searchCount: number }>;
  failureRate: number;
  period: string;
}

export class SearchAnalyticsService {
  private queue: Queue;
  private metricsBuffer: SearchEvent[] = [];
  private bufferFlushInterval: NodeJS.Timeout;

  constructor(analyticsQueue: Queue) {
    this.queue = analyticsQueue;
    
    // Flush metrics buffer every 30 seconds
    this.bufferFlushInterval = setInterval(() => {
      this.flushMetricsBuffer();
    }, 30000);
  }

  async trackSearch(event: SearchEvent): Promise<void> {
    try {
      // Add to buffer for real-time processing
      this.metricsBuffer.push(event);

      // Queue for persistent storage
      await this.queue.add('search_event', event, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 1000,
        removeOnFail: 100
      });

      // If buffer is getting large, flush immediately
      if (this.metricsBuffer.length >= 100) {
        await this.flushMetricsBuffer();
      }

    } catch (error) {
      logger.error('Failed to track search event:', error);
    }
  }

  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const events = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Batch insert to database
      await this.batchInsertSearchEvents(events);
      
      logger.debug(`Flushed ${events.length} search events to database`);
    } catch (error) {
      logger.error('Failed to flush search metrics buffer:', error);
      // Put events back in buffer on failure
      this.metricsBuffer.unshift(...this.metricsBuffer);
    }
  }

  private async batchInsertSearchEvents(events: SearchEvent[]): Promise<void> {
    try {
      // Insert into a search analytics table (would need to be created)
      const searchLogs = events.map(event => ({
        query: event.query,
        type: event.type,
        userId: event.userId || null,
        serverId: event.serverId || null,
        communityId: event.communityId || null,
        resultCount: event.resultCount,
        responseTimeMs: event.responseTimeMs,
        filters: event.filters ? JSON.stringify(event.filters) : null,
        userAgent: event.userAgent || null,
        ipAddress: event.ipAddress || null,
        timestamp: event.timestamp
      }));

      // This would require a search_analytics table in the database
      // await prisma.searchAnalytics.createMany({ data: searchLogs });
      
      // For now, log the metrics
      logger.info('Search events tracked', {
        count: events.length,
        avgResponseTime: events.reduce((sum, e) => sum + e.responseTimeMs, 0) / events.length,
        uniqueQueries: new Set(events.map(e => e.query)).size
      });

    } catch (error) {
      logger.error('Failed to batch insert search events:', error);
      throw error;
    }
  }

  async getSearchAnalytics(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<SearchAnalytics> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Aggregate from buffer for real-time data
      const recentEvents = this.metricsBuffer.filter(e => e.timestamp >= startDate);
      
      // In a real implementation, this would query the search_analytics table
      // For now, return aggregated buffer data
      const analytics: SearchAnalytics = {
        totalSearches: recentEvents.length,
        uniqueUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean)).size,
        averageResponseTime: recentEvents.length > 0 
          ? recentEvents.reduce((sum, e) => sum + e.responseTimeMs, 0) / recentEvents.length 
          : 0,
        popularQueries: this.getPopularQueries(recentEvents),
        searchTypes: this.getSearchTypeDistribution(recentEvents),
        hourlyDistribution: this.getHourlyDistribution(recentEvents),
        topUsers: [], // Would need to query database for this
        failureRate: 0, // Would track failed searches
        period
      };

      return analytics;

    } catch (error) {
      logger.error('Failed to get search analytics:', error);
      throw error;
    }
  }

  private getPopularQueries(events: SearchEvent[]): Array<{ query: string; count: number }> {
    const queryCount = events.reduce((acc, event) => {
      acc[event.query] = (acc[event.query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(queryCount)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getSearchTypeDistribution(events: SearchEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getHourlyDistribution(events: SearchEvent[]): Array<{ hour: number; count: number }> {
    const hourlyCount = events.reduce((acc, event) => {
      const hour = event.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyCount[hour] || 0
    }));
  }

  async getTopSearchQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    try {
      // This would query the database for top queries
      // For now, return from buffer
      return this.getPopularQueries(this.metricsBuffer).slice(0, limit);
    } catch (error) {
      logger.error('Failed to get top search queries:', error);
      return [];
    }
  }

  async getUserSearchHistory(userId: string, limit: number = 50): Promise<SearchEvent[]> {
    try {
      // This would query the database for user's search history
      // For now, return from buffer
      return this.metricsBuffer
        .filter(event => event.userId === userId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get user search history:', error);
      return [];
    }
  }

  async getSearchTrends(period: 'hour' | 'day' | 'week' = 'day'): Promise<Array<{ timestamp: Date; count: number }>> {
    try {
      const now = new Date();
      let startDate: Date;
      let interval: number;

      switch (period) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          interval = 5 * 60 * 1000; // 5-minute intervals
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          interval = 60 * 60 * 1000; // 1-hour intervals
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          interval = 6 * 60 * 60 * 1000; // 6-hour intervals
          break;
      }

      const trends: Array<{ timestamp: Date; count: number }> = [];
      let currentTime = startDate.getTime();

      while (currentTime < now.getTime()) {
        const intervalEnd = currentTime + interval;
        const count = this.metricsBuffer.filter(event => {
          const eventTime = event.timestamp.getTime();
          return eventTime >= currentTime && eventTime < intervalEnd;
        }).length;

        trends.push({
          timestamp: new Date(currentTime),
          count
        });

        currentTime = intervalEnd;
      }

      return trends;

    } catch (error) {
      logger.error('Failed to get search trends:', error);
      return [];
    }
  }

  cleanup(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }
  }
}

// Search query suggestions based on analytics
export class SearchSuggestionsService {
  private analytics: SearchAnalyticsService;

  constructor(analyticsService: SearchAnalyticsService) {
    this.analytics = analyticsService;
  }

  async getSuggestions(partialQuery: string, limit: number = 10): Promise<string[]> {
    try {
      const topQueries = await this.analytics.getTopSearchQueries(100);
      
      // Filter queries that start with or contain the partial query
      const suggestions = topQueries
        .filter(({ query }) => 
          query.toLowerCase().includes(partialQuery.toLowerCase())
        )
        .sort((a, b) => {
          // Prioritize queries that start with the partial query
          const aStarts = a.query.toLowerCase().startsWith(partialQuery.toLowerCase());
          const bStarts = b.query.toLowerCase().startsWith(partialQuery.toLowerCase());
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          // Then sort by count
          return b.count - a.count;
        })
        .map(({ query }) => query)
        .slice(0, limit);

      return suggestions;

    } catch (error) {
      logger.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  async getTrendingSuggestions(limit: number = 10): Promise<Array<{ query: string; trend: number }>> {
    try {
      // Get trending searches (queries with increasing frequency)
      const hourlyTrends = await this.analytics.getSearchTrends('day');
      const topQueries = await this.analytics.getTopSearchQueries(50);

      // Calculate trend score (simplified)
      const trendingQueries = topQueries.map(({ query, count }) => {
        const trend = Math.random() * 100; // Simplified trend calculation
        return { query, trend };
      });

      return trendingQueries
        .sort((a, b) => b.trend - a.trend)
        .slice(0, limit);

    } catch (error) {
      logger.error('Failed to get trending suggestions:', error);
      return [];
    }
  }
}

export default SearchAnalyticsService;