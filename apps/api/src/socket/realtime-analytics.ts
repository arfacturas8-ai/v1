import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

export interface AnalyticsMetrics {
  connections: {
    activeConnections: number;
    totalConnections: number;
    averageSessionDuration: number;
    geographicDistribution: Record<string, number>;
  };
  messages: {
    messagesPerSecond: number;
    averageMessageLength: number;
    messagesByChannel: Record<string, number>;
    topUsers: Record<string, number>;
    messageTypes: {
      text: number;
      image: number;
      file: number;
      voice: number;
      system: number;
    };
  };
  performance: {
    timestamp: Date;
    serverLoad: {
      cpu: number;
      memory: number;
      network: number;
    };
    redisMetrics: {
      connectedClients: number;
      usedMemory: number;
      commandsPerSecond: number;
      keyspaceHits: number;
      keyspaceMisses: number;
    };
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
  };
}

export class RealtimeAnalytics {
  private fastify: FastifyInstance;
  private redis: Redis;
  private metricsCache = new Map<string, any>();
  private alertThresholds = {
    maxResponseTime: 1000, // 1 second
    maxErrorRate: 100, // 100 errors per minute
    maxMemoryUsage: 0.85, // 85%
    minConnectionHealth: 0.95 // 95%
  };

  constructor(fastify: FastifyInstance, redis: Redis) {
    this.fastify = fastify;
    this.redis = redis;
    this.startMetricsCollection();
  }

  private startMetricsCollection() {
    // Collect metrics every 5 seconds
    setInterval(async () => {
      await this.collectConnectionMetrics();
      await this.collectMessageMetrics();
      await this.collectPerformanceMetrics();
    }, 5000);

    // Clean up old metrics every hour
    setInterval(async () => {
      await this.cleanupOldMetrics();
    }, 60 * 60 * 1000);

    this.fastify.log.info('📊 Real-time analytics started');
  }

  private async collectConnectionMetrics() {
    const metrics = {
      timestamp: new Date(),
      activeConnections: this.fastify.io?.engine?.clientsCount || 0,
      totalConnections: await this.getTotalConnectionsCount(),
      averageSessionDuration: await this.calculateAverageSessionDuration(),
      geographicDistribution: await this.getGeographicDistribution()
    };

    await this.storeMetric('connections', metrics);
  }

  private async collectMessageMetrics() {
    const metrics = {
      timestamp: new Date(),
      messagesPerSecond: await this.calculateMessagesPerSecond(),
      averageMessageLength: await this.calculateAverageMessageLength(),
      messagesByChannel: await this.getMessagesByChannel(),
      topUsers: await this.getTopMessageUsers(),
      messageTypes: await this.getMessageTypeBreakdown()
    };

    await this.storeMetric('messages', metrics);
  }

  private async collectPerformanceMetrics() {
    const redisInfo = await this.redis.info();
    const redisStats = this.parseRedisInfo(redisInfo);

    const metrics = {
      timestamp: new Date(),
      serverLoad: {
        cpu: await this.getCPUUsage(),
        memory: await this.getMemoryUsage(),
        network: await this.getNetworkUsage()
      },
      redisMetrics: {
        connectedClients: redisStats.connected_clients || 0,
        usedMemory: redisStats.used_memory || 0,
        commandsPerSecond: redisStats.instantaneous_ops_per_sec || 0,
        keyspaceHits: redisStats.keyspace_hits || 0,
        keyspaceMisses: redisStats.keyspace_misses || 0
      },
      responseTime: await this.getResponseTimePercentiles()
    };

    await this.storeMetric('performance', metrics);
  }

  private async storeMetric(type: string, data: any) {
    const key = `metrics:${type}`;
    const timestamp = Date.now();
    
    await this.redis.zadd(key, timestamp, JSON.stringify(data));
    
    // Keep only last 1000 entries
    await this.redis.zremrangebyrank(key, 0, -1001);
  }

  private async getLastMetric(type: string): Promise<any | null> {
    const key = `metrics:${type}`;
    const results = await this.redis.zrevrange(key, 0, 0);
    return results.length > 0 ? JSON.parse(results[0]) : null;
  }

  // Placeholder implementations for metric calculations
  private async getTotalConnectionsCount(): Promise<number> {
    // Implementation would track total connections over time
    return 0;
  }

  private async calculateAverageSessionDuration(): Promise<number> {
    // Implementation would calculate from session data
    return 0;
  }

  private async getGeographicDistribution(): Promise<Record<string, number>> {
    // Implementation would get geographic data from connection info
    return {};
  }

  private async calculateMessagesPerSecond(): Promise<number> {
    // Implementation would calculate from recent messages
    return 0;
  }

  private async calculateAverageMessageLength(): Promise<number> {
    // Implementation would calculate from recent messages
    return 0;
  }

  private async getMessagesByChannel(): Promise<Record<string, number>> {
    // Implementation would get channel message counts
    return {};
  }

  private async getTopMessageUsers(): Promise<Record<string, number>> {
    // Implementation would get top users by message count
    return {};
  }

  private async getMessageTypeBreakdown(): Promise<any> {
    // Implementation would categorize messages by type
    return { text: 0, image: 0, file: 0, voice: 0, system: 0 };
  }

  private async getCPUUsage(): Promise<number> {
    // Implementation would get actual CPU usage
    return 0;
  }

  private async getMemoryUsage(): Promise<number> {
    // Implementation would get actual memory usage
    return 0;
  }

  private async getNetworkUsage(): Promise<number> {
    return 0;
  }

  private async getResponseTimePercentiles(): Promise<{ p50: number; p95: number; p99: number }> {
    return { p50: 0, p95: 0, p99: 0 };
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const stats: Record<string, any> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        const numValue = parseFloat(value);
        stats[key] = isNaN(numValue) ? value : numValue;
      }
    }
    
    return stats;
  }

  private async cleanupOldMetrics() {
    const patterns = [
      'metrics:*'
    ];

    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        await this.redis.zremrangebyscore(key, 0, oneWeekAgo);
      }
    }
    
    this.fastify.log.info('🧹 Cleaned up old metrics data');
  }

  // Public API methods
  async getSystemOverview() {
    const latestMetrics = await Promise.all([
      this.getLastMetric('connections'),
      this.getLastMetric('messages'),
      this.getLastMetric('performance')
    ]);

    return {
      timestamp: new Date(),
      connections: latestMetrics[0],
      messages: latestMetrics[1],
      performance: latestMetrics[2]
    };
  }

  async getMetricsForTimeRange(type: string, startTime: Date, endTime: Date) {
    const key = `metrics:${type}`;
    const start = startTime.getTime();
    const end = endTime.getTime();
    
    const results = await this.redis.zrangebyscore(key, start, end);
    return results.map(result => JSON.parse(result));
  }

  async trackEvent(eventName: string, data: any) {
    const event = {
      name: eventName,
      data,
      timestamp: new Date(),
      serverId: process.env.SERVER_ID || 'unknown'
    };

    await this.redis.zadd('custom_events', Date.now(), JSON.stringify(event));
    
    // Keep only last 10,000 custom events
    await this.redis.zremrangebyrank('custom_events', 0, -10001);
  }

  getHealth() {
    return {
      status: 'healthy',
      metricsCache: this.metricsCache.size,
      alertThresholds: this.alertThresholds,
      uptime: process.uptime()
    };
  }
}