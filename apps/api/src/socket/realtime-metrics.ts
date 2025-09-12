import { PrometheusMetricsService } from '../services/prometheus-metrics';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

/**
 * Real-time Metrics Collector for Socket.IO
 * 
 * Integrates with Prometheus metrics to provide comprehensive
 * real-time monitoring of Socket.IO operations
 */
export class RealtimeMetricsCollector extends EventEmitter {
  private metricsService: PrometheusMetricsService;
  private messageLatencyMap = new Map<string, number>();
  private connectionStartTimes = new Map<string, number>();
  private eventProcessingTimes = new Map<string, number>();
  
  // Business metrics tracking
  private dailyMetrics = {
    messagesProcessed: 0,
    uniqueUsers: new Set<string>(),
    peakConcurrentUsers: 0,
    roomActivityCount: new Map<string, number>(),
    eventTypeCount: new Map<string, number>(),
    lastReset: new Date()
  };
  
  // Performance tracking
  private performanceMetrics = {
    averageLatency: 0,
    p95Latency: [] as number[],
    errorRate: 0,
    successfulOperations: 0,
    failedOperations: 0,
    queueDepth: 0,
    memoryUsage: 0
  };
  
  // Real-time dashboard data
  private realtimeDashboard = {
    activeConnections: 0,
    messagesPerSecond: 0,
    eventsPerSecond: 0,
    currentLatency: 0,
    errorCount: 0,
    topActiveRooms: [] as Array<{room: string, count: number}>,
    userActivity: new Map<string, Date>()
  };

  constructor(metricsService: PrometheusMetricsService) {
    super();
    this.metricsService = metricsService;
    this.startDashboardUpdates();
    this.startMetricsAggregation();
  }

  // ==============================================
  // CONNECTION METRICS
  // ==============================================

  trackConnection(socketId: string, userId: string): void {
    const now = performance.now();
    this.connectionStartTimes.set(socketId, now);
    
    // Update Prometheus metrics
    this.metricsService.trackSocketIOConnectionAttempt();
    this.metricsService.setSocketIOConnected(this.realtimeDashboard.activeConnections + 1);
    
    // Update daily metrics
    this.dailyMetrics.uniqueUsers.add(userId);
    this.realtimeDashboard.activeConnections++;
    this.realtimeDashboard.userActivity.set(userId, new Date());
    
    // Track peak concurrent users
    if (this.realtimeDashboard.activeConnections > this.dailyMetrics.peakConcurrentUsers) {
      this.dailyMetrics.peakConcurrentUsers = this.realtimeDashboard.activeConnections;
    }
    
    this.emit('connection', {
      socketId,
      userId,
      activeConnections: this.realtimeDashboard.activeConnections,
      uniqueUsers: this.dailyMetrics.uniqueUsers.size
    });
  }

  trackConnectionError(errorType: string, details?: any): void {
    this.metricsService.trackSocketIOConnectionError(errorType);
    this.performanceMetrics.failedOperations++;
    this.realtimeDashboard.errorCount++;
    
    this.emit('connectionError', {
      errorType,
      details,
      totalErrors: this.realtimeDashboard.errorCount
    });
  }

  trackDisconnection(socketId: string, userId: string, reason: string): void {
    const connectionStart = this.connectionStartTimes.get(socketId);
    if (connectionStart) {
      const connectionDuration = (performance.now() - connectionStart) / 1000;
      this.connectionStartTimes.delete(socketId);
      
      // Track connection duration in a custom histogram
      // (This would be added to PrometheusMetricsService)
    }
    
    this.realtimeDashboard.activeConnections = Math.max(0, this.realtimeDashboard.activeConnections - 1);
    this.metricsService.setSocketIOConnected(this.realtimeDashboard.activeConnections);
    this.realtimeDashboard.userActivity.delete(userId);
    
    this.emit('disconnection', {
      socketId,
      userId,
      reason,
      activeConnections: this.realtimeDashboard.activeConnections
    });
  }

  // ==============================================
  // MESSAGE METRICS
  // ==============================================

  trackMessageStart(messageId: string, event: string, room: string, userId: string): void {
    const now = performance.now();
    this.messageLatencyMap.set(messageId, now);
    
    // Track event processing start
    this.eventProcessingTimes.set(messageId, now);
    
    // Update business metrics
    this.dailyMetrics.messagesProcessed++;
    this.incrementEventCount(event);
    this.incrementRoomActivity(room);
    this.realtimeDashboard.userActivity.set(userId, new Date());
    
    this.emit('messageStart', {
      messageId,
      event,
      room,
      userId,
      timestamp: now
    });
  }

  trackMessageComplete(messageId: string, event: string, room: string, success: boolean): void {
    const startTime = this.messageLatencyMap.get(messageId);
    const processingStart = this.eventProcessingTimes.get(messageId);
    
    if (startTime) {
      const latency = performance.now() - startTime;
      const latencySeconds = latency / 1000;
      
      // Update Prometheus metrics
      this.metricsService.trackSocketIOMessage(event, room);
      this.metricsService.trackSocketIOMessageDuration(event, latency);
      
      // Update performance tracking
      this.updateLatencyMetrics(latency);
      
      if (success) {
        this.performanceMetrics.successfulOperations++;
      } else {
        this.performanceMetrics.failedOperations++;
        this.realtimeDashboard.errorCount++;
      }
      
      // Clean up
      this.messageLatencyMap.delete(messageId);
      this.eventProcessingTimes.delete(messageId);
      
      this.emit('messageComplete', {
        messageId,
        event,
        room,
        latency: latencySeconds,
        success,
        totalProcessed: this.dailyMetrics.messagesProcessed
      });
    }
  }

  trackMessageFailure(messageId: string, event: string, room: string, error: string): void {
    this.trackMessageComplete(messageId, event, room, false);
    
    this.emit('messageFailure', {
      messageId,
      event,
      room,
      error,
      failedOperations: this.performanceMetrics.failedOperations
    });
  }

  // ==============================================
  // QUEUE METRICS
  // ==============================================

  updateMessageQueueSize(size: number): void {
    this.performanceMetrics.queueDepth = size;
    this.metricsService.setSocketIOMessageQueueSize(size);
    
    this.emit('queueSizeUpdate', {
      size,
      timestamp: Date.now()
    });
  }

  trackQueueBacklog(backlogSize: number): void {
    if (backlogSize > 100) {
      this.emit('queueBacklog', {
        size: backlogSize,
        severity: backlogSize > 1000 ? 'critical' : 'warning'
      });
    }
  }

  // ==============================================
  // BUSINESS METRICS
  // ==============================================

  trackUserActivity(userId: string, activity: string, metadata?: any): void {
    this.realtimeDashboard.userActivity.set(userId, new Date());
    
    // Track specific business activities
    switch (activity) {
      case 'message_sent':
        // Track message sending patterns
        this.emit('businessMetric', {
          type: 'user_engagement',
          activity: 'message_sent',
          userId,
          metadata,
          timestamp: Date.now()
        });
        break;
      
      case 'voice_joined':
        // Track voice channel engagement
        this.emit('businessMetric', {
          type: 'voice_engagement',
          activity: 'voice_joined',
          userId,
          metadata,
          timestamp: Date.now()
        });
        break;
      
      case 'room_joined':
        // Track room engagement
        this.emit('businessMetric', {
          type: 'room_engagement',
          activity: 'room_joined',
          userId,
          metadata,
          timestamp: Date.now()
        });
        break;
    }
  }

  trackBusinessEvent(event: string, data: any): void {
    this.emit('businessEvent', {
      event,
      data,
      timestamp: Date.now(),
      dailyCount: this.dailyMetrics.messagesProcessed,
      activeUsers: this.realtimeDashboard.activeConnections
    });
  }

  // ==============================================
  // PERFORMANCE ANALYSIS
  // ==============================================

  private updateLatencyMetrics(latency: number): void {
    // Update current latency for real-time dashboard
    this.realtimeDashboard.currentLatency = latency;
    
    // Add to P95 calculation array
    this.performanceMetrics.p95Latency.push(latency);
    
    // Keep only last 1000 entries for P95 calculation
    if (this.performanceMetrics.p95Latency.length > 1000) {
      this.performanceMetrics.p95Latency = this.performanceMetrics.p95Latency.slice(-1000);
    }
    
    // Calculate average latency
    const totalOps = this.performanceMetrics.successfulOperations + this.performanceMetrics.failedOperations;
    if (totalOps > 0) {
      this.performanceMetrics.averageLatency = 
        (this.performanceMetrics.averageLatency * (totalOps - 1) + latency) / totalOps;
    }
    
    // Calculate error rate
    this.performanceMetrics.errorRate = 
      totalOps > 0 ? (this.performanceMetrics.failedOperations / totalOps) * 100 : 0;
  }

  private incrementEventCount(event: string): void {
    const current = this.dailyMetrics.eventTypeCount.get(event) || 0;
    this.dailyMetrics.eventTypeCount.set(event, current + 1);
  }

  private incrementRoomActivity(room: string): void {
    const current = this.dailyMetrics.roomActivityCount.get(room) || 0;
    this.dailyMetrics.roomActivityCount.set(room, current + 1);
  }

  // ==============================================
  // REAL-TIME DASHBOARD UPDATES
  // ==============================================

  private startDashboardUpdates(): void {
    setInterval(() => {
      this.updateDashboardMetrics();
      this.emitDashboardUpdate();
    }, 1000); // Update every second
  }

  private updateDashboardMetrics(): void {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Calculate messages per second
    let recentMessages = 0;
    let recentEvents = 0;
    
    // This would typically be done with a sliding window
    // For now, we'll estimate based on recent activity
    this.realtimeDashboard.messagesPerSecond = recentMessages;
    this.realtimeDashboard.eventsPerSecond = recentEvents;
    
    // Update top active rooms
    const sortedRooms = Array.from(this.dailyMetrics.roomActivityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([room, count]) => ({ room, count }));
    
    this.realtimeDashboard.topActiveRooms = sortedRooms;
    
    // Clean up old user activity
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    for (const [userId, lastActivity] of this.realtimeDashboard.userActivity) {
      if (lastActivity.getTime() < fiveMinutesAgo) {
        this.realtimeDashboard.userActivity.delete(userId);
      }
    }
  }

  private emitDashboardUpdate(): void {
    this.emit('dashboardUpdate', {
      timestamp: Date.now(),
      ...this.realtimeDashboard,
      performance: this.performanceMetrics,
      dailyStats: {
        messagesProcessed: this.dailyMetrics.messagesProcessed,
        uniqueUsers: this.dailyMetrics.uniqueUsers.size,
        peakConcurrentUsers: this.dailyMetrics.peakConcurrentUsers
      }
    });
  }

  // ==============================================
  // METRICS AGGREGATION
  // ==============================================

  private startMetricsAggregation(): void {
    // Reset daily metrics at midnight
    setInterval(() => {
      const now = new Date();
      const lastReset = this.dailyMetrics.lastReset;
      
      if (now.getDate() !== lastReset.getDate()) {
        this.resetDailyMetrics();
      }
    }, 60 * 1000); // Check every minute
    
    // Aggregate and export metrics every 30 seconds
    setInterval(() => {
      this.aggregateMetrics();
    }, 30 * 1000);
  }

  private resetDailyMetrics(): void {
    const snapshot = {
      date: this.dailyMetrics.lastReset,
      messagesProcessed: this.dailyMetrics.messagesProcessed,
      uniqueUsers: this.dailyMetrics.uniqueUsers.size,
      peakConcurrentUsers: this.dailyMetrics.peakConcurrentUsers,
      topEvents: Array.from(this.dailyMetrics.eventTypeCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topRooms: Array.from(this.dailyMetrics.roomActivityCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
    
    this.emit('dailyMetricsSnapshot', snapshot);
    
    // Reset counters
    this.dailyMetrics.messagesProcessed = 0;
    this.dailyMetrics.uniqueUsers.clear();
    this.dailyMetrics.peakConcurrentUsers = this.realtimeDashboard.activeConnections;
    this.dailyMetrics.roomActivityCount.clear();
    this.dailyMetrics.eventTypeCount.clear();
    this.dailyMetrics.lastReset = new Date();
  }

  private aggregateMetrics(): void {
    // Calculate P95 latency
    if (this.performanceMetrics.p95Latency.length > 0) {
      const sorted = [...this.performanceMetrics.p95Latency].sort((a, b) => a - b);
      const p95Index = Math.ceil(sorted.length * 0.95) - 1;
      const p95Latency = sorted[p95Index];
      
      // This would update a P95 gauge in Prometheus
      // this.metricsService.setSocketIOP95Latency(p95Latency);
    }
    
    // Update memory usage metric
    const memUsage = process.memoryUsage();
    this.performanceMetrics.memoryUsage = memUsage.heapUsed;
    
    this.emit('metricsAggregated', {
      timestamp: Date.now(),
      performance: this.performanceMetrics,
      memory: memUsage
    });
  }

  // ==============================================
  // PUBLIC API
  // ==============================================

  getDashboardData(): any {
    return {
      realtime: this.realtimeDashboard,
      performance: this.performanceMetrics,
      daily: {
        messagesProcessed: this.dailyMetrics.messagesProcessed,
        uniqueUsers: this.dailyMetrics.uniqueUsers.size,
        peakConcurrentUsers: this.dailyMetrics.peakConcurrentUsers
      }
    };
  }

  getMetricsSummary(): any {
    return {
      connections: {
        active: this.realtimeDashboard.activeConnections,
        peak: this.dailyMetrics.peakConcurrentUsers,
        uniqueUsers: this.dailyMetrics.uniqueUsers.size
      },
      performance: {
        averageLatency: this.performanceMetrics.averageLatency,
        errorRate: this.performanceMetrics.errorRate,
        queueDepth: this.performanceMetrics.queueDepth
      },
      activity: {
        messagesProcessed: this.dailyMetrics.messagesProcessed,
        messagesPerSecond: this.realtimeDashboard.messagesPerSecond,
        topRooms: this.realtimeDashboard.topActiveRooms.slice(0, 5)
      }
    };
  }

  // ==============================================
  // HEALTH MONITORING
  // ==============================================

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: any;
  } {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check error rate
    if (this.performanceMetrics.errorRate > 5) {
      issues.push(`High error rate: ${this.performanceMetrics.errorRate.toFixed(2)}%`);
      status = 'degraded';
    }
    
    if (this.performanceMetrics.errorRate > 15) {
      status = 'unhealthy';
    }
    
    // Check latency
    if (this.realtimeDashboard.currentLatency > 1000) {
      issues.push(`High latency: ${this.realtimeDashboard.currentLatency.toFixed(2)}ms`);
      if (status === 'healthy') status = 'degraded';
    }
    
    if (this.realtimeDashboard.currentLatency > 5000) {
      status = 'unhealthy';
    }
    
    // Check queue depth
    if (this.performanceMetrics.queueDepth > 1000) {
      issues.push(`High queue depth: ${this.performanceMetrics.queueDepth}`);
      if (status === 'healthy') status = 'degraded';
    }
    
    if (this.performanceMetrics.queueDepth > 5000) {
      status = 'unhealthy';
    }
    
    return {
      status,
      issues,
      metrics: this.getMetricsSummary()
    };
  }
}

/**
 * Integration with Socket.IO crash-safe service
 */
export function createRealtimeMetricsCollector(
  metricsService: PrometheusMetricsService
): RealtimeMetricsCollector {
  return new RealtimeMetricsCollector(metricsService);
}