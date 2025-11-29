import { FastifyRequest, FastifyReply } from 'fastify';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import Redis from 'ioredis';

/**
 * API Performance Monitoring and Metrics Collection
 * 
 * Provides comprehensive performance monitoring with:
 * - Request/response time tracking
 * - Error rate monitoring
 * - Resource usage metrics
 * - Custom business metrics
 * - Real-time alerts
 * - Historical trend analysis
 * - Export capabilities for external monitoring
 */

interface MetricPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

interface RequestMetric {
  requestId: string;
  method: string;
  endpoint: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userId?: string;
  userAgent?: string;
  ip: string;
  size: {
    request: number;
    response: number;
  };
  database?: {
    queries: number;
    duration: number;
  };
  cache?: {
    hits: number;
    misses: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

interface SystemMetric {
  timestamp: number;
  memory: {
    used: number;
    free: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  eventLoop: {
    delay: number;
    utilization: number;
  };
  connections: {
    active: number;
    total: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // Duration in seconds
  enabled: boolean;
  tags?: Record<string, string>;
  webhook?: string;
}

interface AlertEvent {
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

export class MetricsCollector extends EventEmitter {
  private metrics = new Map<string, MetricPoint[]>();
  private requestMetrics: RequestMetric[] = [];
  private systemMetrics: SystemMetric[] = [];
  private alerts = new Map<string, AlertRule>();
  private activeAlerts = new Map<string, AlertEvent>();
  private maxMetricPoints = 10000;
  private maxRequestMetrics = 5000;
  private maxSystemMetrics = 1000;

  constructor(
    private redis?: Redis,
    private options: {
      retentionPeriod?: number; // Hours
      flushInterval?: number; // Seconds
      systemMetricsInterval?: number; // Seconds
    } = {}
  ) {
    super();
    
    this.options = {
      retentionPeriod: 24,
      flushInterval: 60,
      systemMetricsInterval: 30,
      ...options
    };

    this.startSystemMetricsCollection();
    this.startPeriodicFlush();
    this.startCleanup();
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const point: MetricPoint = {
      timestamp: Date.now(),
      value,
      tags
    };

    let points = this.metrics.get(name) || [];
    points.push(point);

    // Keep only recent points
    if (points.length > this.maxMetricPoints) {
      points = points.slice(-this.maxMetricPoints);
    }

    this.metrics.set(name, points);
    this.checkAlerts(name, value, tags);
    this.emit('metric', { name, point });
  }

  /**
   * Record request metric
   */
  recordRequest(metric: RequestMetric) {
    this.requestMetrics.push(metric);

    // Keep only recent metrics
    if (this.requestMetrics.length > this.maxRequestMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxRequestMetrics);
    }

    // Record derived metrics
    this.recordMetric('requests_total', 1, {
      method: metric.method,
      endpoint: metric.endpoint,
      status: metric.statusCode.toString()
    });

    this.recordMetric('request_duration_ms', metric.duration, {
      method: metric.method,
      endpoint: metric.endpoint
    });

    this.recordMetric('request_size_bytes', metric.size.request, {
      type: 'request'
    });

    this.recordMetric('response_size_bytes', metric.size.response, {
      type: 'response'
    });

    if (metric.error) {
      this.recordMetric('errors_total', 1, {
        type: metric.error.type,
        endpoint: metric.endpoint
      });
    }

    this.emit('request', metric);
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics(metric: SystemMetric) {
    this.systemMetrics.push(metric);

    // Keep only recent metrics
    if (this.systemMetrics.length > this.maxSystemMetrics) {
      this.systemMetrics = this.systemMetrics.slice(-this.maxSystemMetrics);
    }

    // Record individual system metrics
    this.recordMetric('memory_used_bytes', metric.memory.used);
    this.recordMetric('memory_heap_used_bytes', metric.memory.heapUsed);
    this.recordMetric('cpu_usage_percent', metric.cpu.usage);
    this.recordMetric('event_loop_delay_ms', metric.eventLoop.delay);
    this.recordMetric('event_loop_utilization_percent', metric.eventLoop.utilization * 100);
    this.recordMetric('connections_active', metric.connections.active);
    this.recordMetric('database_connections', metric.database.connections);

    this.emit('system', metric);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string, duration: number = 3600): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const points = this.metrics.get(name);
    if (!points || points.length === 0) return null;

    const cutoff = Date.now() - (duration * 1000);
    const recentPoints = points
      .filter(p => p.timestamp >= cutoff)
      .map(p => p.value)
      .sort((a, b) => a - b);

    if (recentPoints.length === 0) return null;

    const count = recentPoints.length;
    const sum = recentPoints.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;
    const min = recentPoints[0];
    const max = recentPoints[count - 1];
    
    const p50 = this.percentile(recentPoints, 0.5);
    const p95 = this.percentile(recentPoints, 0.95);
    const p99 = this.percentile(recentPoints, 0.99);

    return { count, min, max, avg, sum, p50, p95, p99 };
  }

  /**
   * Get request statistics
   */
  getRequestStats(duration: number = 3600): {
    total: number;
    rps: number; // Requests per second
    errorRate: number;
    averageLatency: number;
    p95Latency: number;
    statusCodes: Record<string, number>;
    topEndpoints: Array<{ endpoint: string; count: number; avgLatency: number }>;
    topErrors: Array<{ error: string; count: number }>;
  } {
    const cutoff = Date.now() - (duration * 1000);
    const recentRequests = this.requestMetrics.filter(r => r.timestamp >= cutoff);

    const total = recentRequests.length;
    const rps = duration > 0 ? total / duration : 0;

    const errors = recentRequests.filter(r => r.statusCode >= 400);
    const errorRate = total > 0 ? (errors.length / total) * 100 : 0;

    const latencies = recentRequests.map(r => r.duration).sort((a, b) => a - b);
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
      : 0;
    const p95Latency = this.percentile(latencies, 0.95);

    // Status code distribution
    const statusCodes: Record<string, number> = {};
    recentRequests.forEach(r => {
      const status = r.statusCode.toString();
      statusCodes[status] = (statusCodes[status] || 0) + 1;
    });

    // Top endpoints
    const endpointStats = new Map<string, { count: number; totalLatency: number }>();
    recentRequests.forEach(r => {
      const key = `${r.method} ${r.endpoint}`;
      const existing = endpointStats.get(key) || { count: 0, totalLatency: 0 };
      endpointStats.set(key, {
        count: existing.count + 1,
        totalLatency: existing.totalLatency + r.duration
      });
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgLatency: Math.round(stats.totalLatency / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top errors
    const errorStats = new Map<string, number>();
    errors.forEach(r => {
      if (r.error) {
        const key = `${r.error.type}: ${r.error.message}`;
        errorStats.set(key, (errorStats.get(key) || 0) + 1);
      }
    });

    const topErrors = Array.from(errorStats.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total,
      rps: Math.round(rps * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      averageLatency: Math.round(averageLatency),
      p95Latency: Math.round(p95Latency),
      statusCodes,
      topEndpoints,
      topErrors
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    checks: Record<string, 'healthy' | 'degraded' | 'critical'>;
    metrics: {
      memory: { used: number; percentage: number };
      cpu: { usage: number };
      eventLoop: { delay: number };
      database: { connections: number; slowQueries: number };
    };
  } {
    const recent = this.systemMetrics[this.systemMetrics.length - 1];
    if (!recent) {
      return {
        status: 'critical',
        checks: { system: 'critical' },
        metrics: {} as any
      };
    }

    const checks: Record<string, 'healthy' | 'degraded' | 'critical'> = {};
    
    // Memory check
    const memoryUsage = (recent.memory.used / recent.memory.total) * 100;
    checks.memory = memoryUsage > 90 ? 'critical' : memoryUsage > 80 ? 'degraded' : 'healthy';

    // CPU check
    checks.cpu = recent.cpu.usage > 90 ? 'critical' : recent.cpu.usage > 80 ? 'degraded' : 'healthy';

    // Event loop check
    checks.eventLoop = recent.eventLoop.delay > 100 ? 'critical' : 
                      recent.eventLoop.delay > 50 ? 'degraded' : 'healthy';

    // Database check
    checks.database = recent.database.slowQueries > 10 ? 'degraded' : 'healthy';

    // Overall status
    const criticalCount = Object.values(checks).filter(status => status === 'critical').length;
    const degradedCount = Object.values(checks).filter(status => status === 'degraded').length;
    
    const overallStatus = criticalCount > 0 ? 'critical' : 
                         degradedCount > 0 ? 'degraded' : 'healthy';

    return {
      status: overallStatus,
      checks,
      metrics: {
        memory: {
          used: recent.memory.used,
          percentage: Math.round(memoryUsage * 100) / 100
        },
        cpu: { usage: Math.round(recent.cpu.usage * 100) / 100 },
        eventLoop: { delay: Math.round(recent.eventLoop.delay * 100) / 100 },
        database: {
          connections: recent.database.connections,
          slowQueries: recent.database.slowQueries
        }
      }
    };
  }

  /**
   * Add alert rule
   */
  addAlert(rule: AlertRule) {
    this.alerts.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  removeAlert(ruleId: string) {
    this.alerts.delete(ruleId);
    this.activeAlerts.delete(ruleId);
  }

  /**
   * Get all alerts
   */
  getAlerts(): AlertRule[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const [name, points] of this.metrics.entries()) {
      if (points.length === 0) continue;

      const latest = points[points.length - 1];
      const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_');
      
      lines.push(`# HELP ${metricName} ${name}`);
      lines.push(`# TYPE ${metricName} gauge`);
      
      if (latest.tags) {
        const tags = Object.entries(latest.tags)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        lines.push(`${metricName}{${tags}} ${latest.value} ${latest.timestamp}`);
      } else {
        lines.push(`${metricName} ${latest.value} ${latest.timestamp}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Export metrics in JSON format
   */
  exportJSONMetrics(): any {
    const requestStats = this.getRequestStats();
    const systemHealth = this.getSystemHealth();

    return {
      timestamp: new Date().toISOString(),
      requests: requestStats,
      system: systemHealth,
      metrics: Object.fromEntries(
        Array.from(this.metrics.entries()).map(([name, points]) => [
          name,
          this.getMetricStats(name)
        ])
      ),
      alerts: {
        rules: this.getAlerts(),
        active: this.getActiveAlerts()
      }
    };
  }

  /**
   * Create request tracking middleware
   */
  createRequestMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      // Intercept response to record metrics
      const originalSend = reply.send.bind(reply);
      reply.send = function(payload: any) {
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - startTime;

        const requestSize = this.getRequestSize(request);
        const responseSize = this.getResponseSize(payload);

        const metric: RequestMetric = {
          requestId: (request as any).requestId || 'unknown',
          method: request.method,
          endpoint: this.normalizeEndpoint(request.url),
          statusCode: reply.statusCode,
          duration: Math.round(duration),
          timestamp: Date.now(),
          userId: (request as any).userId,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          size: {
            request: requestSize,
            response: responseSize
          }
        };

        // Add database metrics if available
        if ((request as any).dbQueries) {
          metric.database = (request as any).dbQueries;
        }

        // Add cache metrics if available
        if ((request as any).cacheStats) {
          metric.cache = (request as any).cacheStats;
        }

        this.recordRequest(metric);
        return originalSend(payload);
      }.bind(this);

      // Handle errors
      reply.addHook('onError', async (request, reply, error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metric: RequestMetric = {
          requestId: (request as any).requestId || 'unknown',
          method: request.method,
          endpoint: this.normalizeEndpoint(request.url),
          statusCode: reply.statusCode,
          duration: Math.round(duration),
          timestamp: Date.now(),
          userId: (request as any).userId,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          size: {
            request: this.getRequestSize(request),
            response: 0
          },
          error: {
            type: error.name,
            message: error.message
          }
        };

        this.recordRequest(metric);
      });
    };
  }

  // Private helper methods

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * p) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }

  private normalizeEndpoint(url: string): string {
    // Remove query parameters
    const path = url.split('?')[0];
    
    // Replace IDs and UUIDs with placeholders
    return path
      .replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/@[a-zA-Z0-9_-]+/g, '/:username');
  }

  private getRequestSize(request: FastifyRequest): number {
    const contentLength = request.headers['content-length'];
    if (contentLength) return parseInt(contentLength, 10);
    
    if (request.body) {
      return Buffer.byteLength(JSON.stringify(request.body));
    }
    
    return 0;
  }

  private getResponseSize(payload: any): number {
    if (!payload) return 0;
    
    if (typeof payload === 'string') {
      return Buffer.byteLength(payload);
    }
    
    if (Buffer.isBuffer(payload)) {
      return payload.length;
    }
    
    return Buffer.byteLength(JSON.stringify(payload));
  }

  private checkAlerts(metricName: string, value: number, tags?: Record<string, string>) {
    for (const rule of this.alerts.values()) {
      if (!rule.enabled || rule.metric !== metricName) continue;

      // Check tag matching if specified
      if (rule.tags && tags) {
        const matches = Object.entries(rule.tags).every(([key, val]) => tags[key] === val);
        if (!matches) continue;
      }

      const triggered = this.evaluateCondition(rule.condition, value, rule.threshold);
      const alertKey = `${rule.id}:${JSON.stringify(tags || {})}`;

      if (triggered && !this.activeAlerts.has(alertKey)) {
        const alert: AlertEvent = {
          ruleId: rule.id,
          ruleName: rule.name,
          metric: metricName,
          value,
          threshold: rule.threshold,
          timestamp: Date.now()
        };

        this.activeAlerts.set(alertKey, alert);
        this.emit('alert', alert);

        if (rule.webhook) {
          this.sendWebhookAlert(rule.webhook, alert);
        }
      } else if (!triggered && this.activeAlerts.has(alertKey)) {
        const alert = this.activeAlerts.get(alertKey)!;
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        
        this.emit('alertResolved', alert);
        this.activeAlerts.delete(alertKey);
      }
    }
  }

  private evaluateCondition(condition: string, value: number, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private async sendWebhookAlert(webhook: string, alert: AlertEvent) {
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        console.error(`Webhook alert failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook alert error:', error);
    }
  }

  private startSystemMetricsCollection() {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const metric: SystemMetric = {
        timestamp: Date.now(),
        memory: {
          used: memoryUsage.rss,
          free: 0, // Would need OS-specific implementation
          total: 0, // Would need OS-specific implementation
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal
        },
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to percentage
          loadAverage: require('os').loadavg()
        },
        eventLoop: {
          delay: 0, // Would need measurement
          utilization: 0 // Would need measurement
        },
        connections: {
          active: 0, // Would need server reference
          total: 0
        },
        database: {
          connections: 0, // Would need database reference
          queries: 0,
          slowQueries: 0
        }
      };

      this.recordSystemMetrics(metric);
    }, this.options.systemMetricsInterval! * 1000);
  }

  private startPeriodicFlush() {
    if (!this.redis) return;

    setInterval(async () => {
      try {
        await this.flushToRedis();
      } catch (error) {
        console.error('Failed to flush metrics to Redis:', error);
      }
    }, this.options.flushInterval! * 1000);
  }

  private async flushToRedis() {
    if (!this.redis) return;

    const data = this.exportJSONMetrics();
    await this.redis.setex(
      `metrics:${Date.now()}`,
      this.options.retentionPeriod! * 3600,
      JSON.stringify(data)
    );
  }

  private startCleanup() {
    setInterval(() => {
      const cutoff = Date.now() - (this.options.retentionPeriod! * 60 * 60 * 1000);

      // Clean up metrics
      for (const [name, points] of this.metrics.entries()) {
        const filtered = points.filter(p => p.timestamp >= cutoff);
        this.metrics.set(name, filtered);
      }

      // Clean up request metrics
      this.requestMetrics = this.requestMetrics.filter(r => r.timestamp >= cutoff);

      // Clean up system metrics
      this.systemMetrics = this.systemMetrics.filter(s => s.timestamp >= cutoff);
    }, 60 * 60 * 1000); // Clean up every hour
  }
}

/**
 * Factory function to create metrics collector
 */
export function createMetricsCollector(redis?: Redis, options?: any): MetricsCollector {
  return new MetricsCollector(redis, options);
}

/**
 * Predefined alert rules
 */
export const DefaultAlerts = {
  highLatency: {
    id: 'high_latency',
    name: 'High Request Latency',
    metric: 'request_duration_ms',
    condition: 'gt' as const,
    threshold: 2000,
    duration: 300,
    enabled: true
  },
  highErrorRate: {
    id: 'high_error_rate',
    name: 'High Error Rate',
    metric: 'errors_total',
    condition: 'gt' as const,
    threshold: 10,
    duration: 300,
    enabled: true
  },
  highMemoryUsage: {
    id: 'high_memory_usage',
    name: 'High Memory Usage',
    metric: 'memory_used_bytes',
    condition: 'gt' as const,
    threshold: 1024 * 1024 * 1024, // 1GB
    duration: 300,
    enabled: true
  }
};

export default MetricsCollector;