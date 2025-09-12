import EventEmitter from 'events';
import { logger } from '../utils/logger';
import { Server } from 'socket.io';
import { Redis } from 'ioredis';

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  nextAttempt: number;
}

interface RealtimeMetrics {
  activeUsers: number;
  messagesPerSecond: number;
  searchesPerSecond: number;
  voiceChannelsActive: number;
  systemLoad: {
    cpu: number;
    memory: number;
    database: number;
    elasticsearch: number;
  };
  errors: {
    rate: number;
    count: number;
  };
}

export class RealTimeMetricsService extends EventEmitter {
  private io: Server;
  private redis: Redis;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private metricsBuffer: Map<string, MetricData[]> = new Map();
  private realtimeMetrics: RealtimeMetrics = {
    activeUsers: 0,
    messagesPerSecond: 0,
    searchesPerSecond: 0,
    voiceChannelsActive: 0,
    systemLoad: {
      cpu: 0,
      memory: 0,
      database: 0,
      elasticsearch: 0
    },
    errors: {
      rate: 0,
      count: 0
    }
  };
  
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private timers = new Map<string, number[]>();
  private flushInterval: NodeJS.Timeout;
  private metricsInterval: NodeJS.Timeout;
  private connectedClients = new Set<string>();

  constructor(io: Server, redis: Redis) {
    super();
    this.io = io;
    this.redis = redis;

    // Initialize circuit breakers for critical services
    this.initializeCircuitBreakers();
    
    // Start metrics collection and broadcasting
    this.startMetricsCollection();
    this.startRealTimeBroadcasting();
    this.setupSocketHandlers();

    logger.info('Real-time metrics service initialized');
  }

  private initializeCircuitBreakers(): void {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      monitoringPeriod: 120000 // 2 minutes
    };

    const services = ['database', 'elasticsearch', 'redis', 'search', 'analytics'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        state: 'CLOSED',
        failures: 0,
        nextAttempt: 0
      });
    });

    logger.debug('Circuit breakers initialized for services:', services);
  }

  /**
   * Increment a counter metric with circuit breaker protection
   */
  async incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): Promise<void> {
    try {
      await this.executeWithCircuitBreaker('metrics', async () => {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + value);
        
        this.addToBuffer(name, {
          name,
          value,
          timestamp: new Date(),
          tags,
          type: 'counter'
        });
      });
    } catch (error) {
      logger.warn('Failed to increment counter:', { name, error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * Set a gauge metric value
   */
  async setGauge(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    try {
      await this.executeWithCircuitBreaker('metrics', async () => {
        this.gauges.set(name, value);
        
        this.addToBuffer(name, {
          name,
          value,
          timestamp: new Date(),
          tags,
          type: 'gauge'
        });
      });
    } catch (error) {
      logger.warn('Failed to set gauge:', { name, error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * Record a timing metric
   */
  async recordTiming(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    try {
      await this.executeWithCircuitBreaker('metrics', async () => {
        const timings = this.timers.get(name) || [];
        timings.push(value);
        
        // Keep only last 1000 timings to prevent memory bloat
        if (timings.length > 1000) {
          timings.splice(0, timings.length - 1000);
        }
        
        this.timers.set(name, timings);
        
        this.addToBuffer(name, {
          name,
          value,
          timestamp: new Date(),
          tags,
          type: 'timer'
        });
      });
    } catch (error) {
      logger.warn('Failed to record timing:', { name, error: error instanceof Error ? error.message : error });
    }
  }

  /**
   * Track user connection/disconnection for real-time active users
   */
  async trackUserConnection(userId: string, isConnected: boolean): Promise<void> {
    try {
      if (isConnected) {
        this.connectedClients.add(userId);
        await this.incrementCounter('user.connected', 1);
      } else {
        this.connectedClients.delete(userId);
        await this.incrementCounter('user.disconnected', 1);
      }
      
      this.realtimeMetrics.activeUsers = this.connectedClients.size;
      await this.setGauge('users.active', this.connectedClients.size);
      
      // Broadcast real-time update
      this.broadcastMetricUpdate('activeUsers', this.connectedClients.size);
    } catch (error) {
      logger.warn('Failed to track user connection:', error);
    }
  }

  /**
   * Track message activity for real-time messaging metrics
   */
  async trackMessage(serverId?: string, channelId?: string): Promise<void> {
    try {
      await Promise.all([
        this.incrementCounter('messages.sent', 1, { serverId, channelId }),
        this.updateMessagesPerSecond()
      ]);
    } catch (error) {
      logger.warn('Failed to track message:', error);
    }
  }

  /**
   * Track search activity for real-time search metrics
   */
  async trackSearch(query: string, resultCount: number, responseTime: number, source: 'elasticsearch' | 'database'): Promise<void> {
    try {
      await Promise.all([
        this.incrementCounter('search.performed', 1, { source }),
        this.recordTiming('search.response_time', responseTime, { source }),
        this.setGauge('search.last_result_count', resultCount),
        this.updateSearchesPerSecond()
      ]);
    } catch (error) {
      logger.warn('Failed to track search:', error);
    }
  }

  /**
   * Track voice channel activity
   */
  async trackVoiceChannel(action: 'joined' | 'left', channelId: string, serverId?: string): Promise<void> {
    try {
      if (action === 'joined') {
        await this.incrementCounter('voice.joined', 1, { channelId, serverId });
        this.realtimeMetrics.voiceChannelsActive++;
      } else {
        await this.incrementCounter('voice.left', 1, { channelId, serverId });
        this.realtimeMetrics.voiceChannelsActive = Math.max(0, this.realtimeMetrics.voiceChannelsActive - 1);
      }
      
      await this.setGauge('voice.channels_active', this.realtimeMetrics.voiceChannelsActive);
      this.broadcastMetricUpdate('voiceChannelsActive', this.realtimeMetrics.voiceChannelsActive);
    } catch (error) {
      logger.warn('Failed to track voice channel activity:', error);
    }
  }

  /**
   * Track system performance metrics
   */
  async trackSystemMetrics(metrics: {
    cpu?: number;
    memory?: number;
    databaseResponseTime?: number;
    elasticsearchResponseTime?: number;
  }): Promise<void> {
    try {
      const updates: Promise<void>[] = [];

      if (metrics.cpu !== undefined) {
        this.realtimeMetrics.systemLoad.cpu = metrics.cpu;
        updates.push(this.setGauge('system.cpu', metrics.cpu));
      }

      if (metrics.memory !== undefined) {
        this.realtimeMetrics.systemLoad.memory = metrics.memory;
        updates.push(this.setGauge('system.memory', metrics.memory));
      }

      if (metrics.databaseResponseTime !== undefined) {
        this.realtimeMetrics.systemLoad.database = metrics.databaseResponseTime;
        updates.push(this.recordTiming('database.response_time', metrics.databaseResponseTime));
      }

      if (metrics.elasticsearchResponseTime !== undefined) {
        this.realtimeMetrics.systemLoad.elasticsearch = metrics.elasticsearchResponseTime;
        updates.push(this.recordTiming('elasticsearch.response_time', metrics.elasticsearchResponseTime));
      }

      await Promise.all(updates);
      
      this.broadcastMetricUpdate('systemLoad', this.realtimeMetrics.systemLoad);
    } catch (error) {
      logger.warn('Failed to track system metrics:', error);
    }
  }

  /**
   * Track error occurrences
   */
  async trackError(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    try {
      await this.incrementCounter('errors.total', 1, { type, severity });
      
      this.realtimeMetrics.errors.count++;
      this.updateErrorRate();
      
      this.broadcastMetricUpdate('errors', this.realtimeMetrics.errors);
      
      // Trigger circuit breaker if critical error
      if (severity === 'critical') {
        this.handleCircuitBreakerFailure(type);
      }
    } catch (error) {
      logger.warn('Failed to track error:', error);
    }
  }

  /**
   * Get current real-time metrics
   */
  getCurrentMetrics(): RealtimeMetrics {
    return { ...this.realtimeMetrics };
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    counter?: number;
    gauge?: number;
    timer?: {
      count: number;
      min: number;
      max: number;
      avg: number;
      p95: number;
    };
  } {
    const stats: any = {};

    if (this.counters.has(name)) {
      stats.counter = this.counters.get(name);
    }

    if (this.gauges.has(name)) {
      stats.gauge = this.gauges.get(name);
    }

    const timings = this.timers.get(name);
    if (timings && timings.length > 0) {
      const sorted = [...timings].sort((a, b) => a - b);
      stats.timer = {
        count: timings.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: timings.reduce((a, b) => a + b, 0) / timings.length,
        p95: sorted[Math.floor(sorted.length * 0.95)]
      };
    }

    return stats;
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((state, service) => {
      status[service] = { ...state };
    });
    return status;
  }

  /**
   * Private methods
   */
  private async executeWithCircuitBreaker<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      return operation();
    }

    if (breaker.state === 'OPEN') {
      if (Date.now() > breaker.nextAttempt) {
        breaker.state = 'HALF_OPEN';
        logger.debug(`Circuit breaker for ${service} moved to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${service}`);
      }
    }

    try {
      const result = await operation();
      this.handleCircuitBreakerSuccess(service);
      return result;
    } catch (error) {
      this.handleCircuitBreakerFailure(service);
      throw error;
    }
  }

  private handleCircuitBreakerSuccess(service: string): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      logger.info(`Circuit breaker for ${service} closed after successful operation`);
    }

    // Gradually reduce failure count on success
    if (breaker.failures > 0) {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
  }

  private handleCircuitBreakerFailure(service: string): void {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    breaker.failures++;

    if (breaker.failures >= 5) { // failure threshold
      breaker.state = 'OPEN';
      breaker.nextAttempt = Date.now() + 60000; // 1 minute timeout
      
      logger.error(`Circuit breaker opened for ${service}`, {
        failures: breaker.failures,
        nextAttempt: new Date(breaker.nextAttempt).toISOString()
      });

      this.emit('circuit_breaker_opened', { service, failures: breaker.failures });
    }
  }

  private addToBuffer(key: string, metric: MetricData): void {
    if (!this.metricsBuffer.has(key)) {
      this.metricsBuffer.set(key, []);
    }
    
    const buffer = this.metricsBuffer.get(key)!;
    buffer.push(metric);
    
    // Keep buffer size manageable
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000);
    }
  }

  private startMetricsCollection(): void {
    // Flush metrics to persistent storage every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetricsBuffer();
    }, 30000);

    // Update calculated metrics every 5 seconds
    this.metricsInterval = setInterval(() => {
      this.updateCalculatedMetrics();
    }, 5000);
  }

  private startRealTimeBroadcasting(): void {
    // Broadcast real-time metrics every 2 seconds
    setInterval(() => {
      if (this.io.engine.clientsCount > 0) {
        this.io.emit('metrics:realtime', this.realtimeMetrics);
      }
    }, 2000);
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.debug('Client connected to real-time metrics', { socketId: socket.id });
      
      // Send current metrics immediately
      socket.emit('metrics:realtime', this.realtimeMetrics);
      socket.emit('metrics:circuit_breakers', this.getCircuitBreakerStatus());

      socket.on('metrics:subscribe', (metricNames: string[]) => {
        metricNames.forEach(name => {
          socket.join(`metric:${name}`);
        });
      });

      socket.on('metrics:unsubscribe', (metricNames: string[]) => {
        metricNames.forEach(name => {
          socket.leave(`metric:${name}`);
        });
      });

      socket.on('disconnect', () => {
        logger.debug('Client disconnected from real-time metrics', { socketId: socket.id });
      });
    });
  }

  private broadcastMetricUpdate(metric: string, value: any): void {
    if (this.io.engine.clientsCount > 0) {
      this.io.to(`metric:${metric}`).emit('metrics:update', { metric, value, timestamp: Date.now() });
    }
  }

  private async updateMessagesPerSecond(): Promise<void> {
    // Use Redis to track messages per second with sliding window
    try {
      const now = Date.now();
      const key = 'metrics:messages_per_second';
      const windowSize = 60000; // 1 minute window

      await this.redis.zadd(key, now, now);
      await this.redis.zremrangebyscore(key, 0, now - windowSize);
      
      const count = await this.redis.zcard(key);
      this.realtimeMetrics.messagesPerSecond = count;
      
      this.broadcastMetricUpdate('messagesPerSecond', count);
    } catch (error) {
      logger.warn('Failed to update messages per second:', error);
    }
  }

  private async updateSearchesPerSecond(): Promise<void> {
    // Similar to messages per second but for searches
    try {
      const now = Date.now();
      const key = 'metrics:searches_per_second';
      const windowSize = 60000; // 1 minute window

      await this.redis.zadd(key, now, now);
      await this.redis.zremrangebyscore(key, 0, now - windowSize);
      
      const count = await this.redis.zcard(key);
      this.realtimeMetrics.searchesPerSecond = count;
      
      this.broadcastMetricUpdate('searchesPerSecond', count);
    } catch (error) {
      logger.warn('Failed to update searches per second:', error);
    }
  }

  private updateErrorRate(): void {
    // Calculate error rate based on recent errors
    const errorCount = this.counters.get('errors.total') || 0;
    const totalRequests = (this.counters.get('search.performed') || 0) + 
                         (this.counters.get('messages.sent') || 0);
    
    this.realtimeMetrics.errors.rate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
  }

  private updateCalculatedMetrics(): void {
    // Update any calculated/derived metrics
    this.updateErrorRate();
    
    // Emit health status based on circuit breakers
    const openBreakers = Array.from(this.circuitBreakers.entries())
      .filter(([, state]) => state.state === 'OPEN')
      .map(([service]) => service);

    if (openBreakers.length > 0) {
      this.emit('health_degraded', { openCircuitBreakers: openBreakers });
    }
  }

  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.size === 0) return;

    try {
      // In a real implementation, you'd store these in a time-series database
      // For now, we'll just log the metrics and clear the buffer
      let totalMetrics = 0;
      this.metricsBuffer.forEach((metrics, key) => {
        totalMetrics += metrics.length;
      });

      if (totalMetrics > 0) {
        logger.debug(`Flushed ${totalMetrics} metrics to storage`);
        this.metricsBuffer.clear();
      }
    } catch (error) {
      logger.error('Failed to flush metrics buffer:', error);
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.timers.clear();
    this.metricsBuffer.clear();
    this.connectedClients.clear();
    
    this.realtimeMetrics = {
      activeUsers: 0,
      messagesPerSecond: 0,
      searchesPerSecond: 0,
      voiceChannelsActive: 0,
      systemLoad: {
        cpu: 0,
        memory: 0,
        database: 0,
        elasticsearch: 0
      },
      errors: {
        rate: 0,
        count: 0
      }
    };

    logger.info('All metrics reset');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Flush any remaining metrics
    await this.flushMetricsBuffer();

    logger.info('Real-time metrics service cleaned up');
  }
}