import { AIIntegrationService } from './ai-integration';
import { AutoModerationEngine } from './auto-moderation-engine';
import { SentimentAnalysisService } from './sentiment-analysis-service';
import { ComprehensiveSpamDetector } from './comprehensive-spam-detector';
import { ContentQualityScorer } from './content-quality-scorer';
import { AISmartSearchService } from './ai-smart-search';
import { RecommendationEngine } from './recommendation-engine';
import { AIFeedbackLoopManager } from './ai-feedback-loop-manager';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

export interface DashboardConfig {
  monitoring: {
    enabled: boolean;
    refreshInterval: number; // seconds
    realTimeUpdates: boolean;
    historicalDataDays: number;
  };
  alerts: {
    enabled: boolean;
    emailNotifications: boolean;
    slackNotifications: boolean;
    performanceThresholds: {
      accuracyDrop: number; // percentage
      errorRateSpike: number; // percentage
      responseTimeIncrease: number; // milliseconds
    };
  };
  access: {
    requireAuth: boolean;
    allowedRoles: string[];
    auditLogging: boolean;
  };
  features: {
    liveMetrics: boolean;
    configManagement: boolean;
    thresholdTuning: boolean;
    modelComparison: boolean;
    feedbackAnalysis: boolean;
    systemHealth: boolean;
  };
}

export interface ServiceMetrics {
  serviceId: string;
  serviceName: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  uptime: number; // percentage
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    responseTime: number; // ms
    throughput: number; // requests/minute
    errorRate: number; // percentage
  };
  usage: {
    totalRequests: number;
    requestsLast24h: number;
    requestsLastHour: number;
    averageRequestsPerMinute: number;
    peakRequestsPerMinute: number;
  };
  configuration: {
    currentVersion: string;
    lastUpdated: Date;
    configurable: boolean;
    criticalSettings: { [key: string]: any };
  };
  health: {
    cpuUsage: number;
    memoryUsage: number;
    cacheHitRate: number;
    queueLength: number;
    lastHealthCheck: Date;
  };
  trends: {
    accuracyTrend: 'improving' | 'stable' | 'declining';
    performanceTrend: 'improving' | 'stable' | 'declining';
    usageTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

export interface SystemOverview {
  timestamp: Date;
  overallHealth: 'healthy' | 'warning' | 'critical';
  totalServices: number;
  activeServices: number;
  systemLoad: {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
  };
  performance: {
    averageAccuracy: number;
    averageResponseTime: number;
    totalThroughput: number;
    systemUptime: number;
  };
  alerts: {
    active: number;
    resolved: number;
    critical: number;
    warnings: number;
  };
  usage: {
    totalRequestsToday: number;
    apiCallsRemaining?: number;
    costEstimate?: number;
    topServices: Array<{
      name: string;
      requests: number;
      percentage: number;
    }>;
  };
}

export interface AlertInfo {
  id: string;
  type: 'performance' | 'error' | 'configuration' | 'usage' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  serviceId?: string;
  serviceName?: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  metadata: {
    metric?: string;
    threshold?: number;
    actualValue?: number;
    duration?: number;
    affectedUsers?: number;
  };
  actions: Array<{
    type: 'acknowledge' | 'resolve' | 'escalate' | 'configure';
    label: string;
    endpoint?: string;
    parameters?: any;
  }>;
}

export interface ConfigurationChange {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  username: string;
  timestamp: Date;
  changeType: 'threshold' | 'feature_toggle' | 'configuration' | 'model_update';
  changes: Array<{
    parameter: string;
    oldValue: any;
    newValue: any;
    reason?: string;
  }>;
  impact: 'low' | 'medium' | 'high';
  status: 'pending' | 'applied' | 'failed' | 'rolled_back';
  rollbackPlan?: string;
  validationResults?: {
    passed: boolean;
    score: number;
    issues: string[];
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert' | 'log' | 'config';
  title: string;
  size: 'small' | 'medium' | 'large';
  data: any;
  refreshRate: number; // seconds
  lastUpdated: Date;
  configuration: any;
}

export class AIAdminDashboard {
  private config: DashboardConfig;
  private services: Map<string, any> = new Map();
  private metrics: Map<string, ServiceMetrics> = new Map();
  private alerts: Map<string, AlertInfo> = new Map();
  private configurationHistory: ConfigurationChange[] = [];
  private dashboardWidgets: Map<string, DashboardWidget> = new Map();
  private redis: Redis;
  private queue: Queue;

  // Real-time data
  private liveMetrics: Map<string, any> = new Map();
  private systemOverview: SystemOverview;
  private performanceHistory: Map<string, any[]> = new Map();

  // User sessions and access control
  private activeSessions: Map<string, { userId: string; role: string; lastActivity: Date }> = new Map();
  private auditLog: Array<{ timestamp: Date; userId: string; action: string; details: any }> = [];

  constructor(
    aiService: AIIntegrationService,
    moderationEngine: AutoModerationEngine,
    sentimentService: SentimentAnalysisService,
    spamDetector: ComprehensiveSpamDetector,
    qualityScorer: ContentQualityScorer,
    searchService: AISmartSearchService,
    recommendationEngine: RecommendationEngine,
    feedbackManager: AIFeedbackLoopManager,
    queue: Queue,
    config?: Partial<DashboardConfig>
  ) {
    this.config = this.mergeConfig(config);
    this.queue = queue;

    // Register AI services
    this.services.set('ai_integration', aiService);
    this.services.set('auto_moderation', moderationEngine);
    this.services.set('sentiment_analysis', sentimentService);
    this.services.set('spam_detection', spamDetector);
    this.services.set('quality_scoring', qualityScorer);
    this.services.set('smart_search', searchService);
    this.services.set('recommendations', recommendationEngine);
    this.services.set('feedback_loop', feedbackManager);

    this.initializeRedis();
    this.initializeSystemOverview();
    this.initializeDefaultWidgets();
    this.startMonitoring();

    console.log('📊 AI Admin Dashboard initialized');
  }

  /**
   * Get real-time system overview
   */
  async getSystemOverview(): Promise<SystemOverview> {
    try {
      await this.updateSystemOverview();
      return this.systemOverview;
    } catch (error) {
      console.error('Failed to get system overview:', error);
      return this.createErrorSystemOverview();
    }
  }

  /**
   * Get detailed metrics for all services or a specific service
   */
  async getServiceMetrics(serviceId?: string): Promise<ServiceMetrics[]> {
    try {
      await this.updateAllServiceMetrics();
      
      if (serviceId) {
        const metrics = this.metrics.get(serviceId);
        return metrics ? [metrics] : [];
      }
      
      return Array.from(this.metrics.values());
    } catch (error) {
      console.error('Failed to get service metrics:', error);
      return [];
    }
  }

  /**
   * Get active alerts with filtering options
   */
  async getAlerts(options?: {
    severity?: string;
    status?: string;
    serviceId?: string;
    limit?: number;
  }): Promise<AlertInfo[]> {
    let alerts = Array.from(this.alerts.values());
    
    // Apply filters
    if (options?.severity) {
      alerts = alerts.filter(alert => alert.severity === options.severity);
    }
    
    if (options?.status) {
      alerts = alerts.filter(alert => alert.status === options.status);
    }
    
    if (options?.serviceId) {
      alerts = alerts.filter(alert => alert.serviceId === options.serviceId);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply limit
    if (options?.limit) {
      alerts = alerts.slice(0, options.limit);
    }
    
    return alerts;
  }

  /**
   * Update service configuration with validation
   */
  async updateServiceConfiguration(
    serviceId: string,
    updates: { [key: string]: any },
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; validationResults?: any }> {
    try {
      const service = this.services.get(serviceId);
      if (!service) {
        return { success: false, message: `Service ${serviceId} not found` };
      }

      // Validate the configuration changes
      const validationResults = await this.validateConfigurationChanges(serviceId, updates);
      
      if (!validationResults.passed) {
        return { 
          success: false, 
          message: 'Configuration validation failed', 
          validationResults 
        };
      }

      // Get current configuration for comparison
      const currentConfig = service.getConfig?.() || service.getStats?.() || {};
      
      // Create configuration change record
      const changeRecord: ConfigurationChange = {
        id: this.generateChangeId(),
        serviceId,
        serviceName: this.getServiceDisplayName(serviceId),
        userId,
        username: await this.getUsernameFromId(userId),
        timestamp: new Date(),
        changeType: this.determineChangeType(updates),
        changes: Object.entries(updates).map(([parameter, newValue]) => ({
          parameter,
          oldValue: currentConfig[parameter],
          newValue,
          reason
        })),
        impact: this.assessChangeImpact(updates),
        status: 'pending',
        rollbackPlan: this.generateRollbackPlan(serviceId, currentConfig, updates),
        validationResults
      };

      // Store change record
      this.configurationHistory.push(changeRecord);

      // Apply the configuration changes
      if (service.updateConfig) {
        await service.updateConfig(updates);
        changeRecord.status = 'applied';
      } else {
        throw new Error(`Service ${serviceId} does not support configuration updates`);
      }

      // Log the action
      this.auditLog.push({
        timestamp: new Date(),
        userId,
        action: 'configuration_update',
        details: { serviceId, updates, reason }
      });

      // Create alert for significant configuration changes
      if (changeRecord.impact === 'high') {
        await this.createAlert({
          type: 'configuration',
          severity: 'medium',
          title: `High impact configuration change applied`,
          description: `Service ${changeRecord.serviceName} configuration updated by ${changeRecord.username}`,
          serviceId,
          metadata: { changes: changeRecord.changes.length }
        });
      }

      console.log(`⚙️ Configuration updated for ${serviceId} by ${userId}`);

      return { 
        success: true, 
        message: 'Configuration updated successfully', 
        validationResults 
      };
    } catch (error) {
      console.error('Failed to update service configuration:', error);
      
      // Mark change as failed
      const lastChange = this.configurationHistory[this.configurationHistory.length - 1];
      if (lastChange && lastChange.status === 'pending') {
        lastChange.status = 'failed';
      }

      return { success: false, message: error.message || 'Configuration update failed' };
    }
  }

  /**
   * Acknowledge or resolve an alert
   */
  async updateAlert(
    alertId: string,
    action: 'acknowledge' | 'resolve',
    userId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        return { success: false, message: 'Alert not found' };
      }

      const username = await this.getUsernameFromId(userId);

      switch (action) {
        case 'acknowledge':
          alert.status = 'acknowledged';
          alert.acknowledgedBy = username;
          break;
        case 'resolve':
          alert.status = 'resolved';
          alert.resolvedBy = username;
          alert.resolvedAt = new Date();
          break;
      }

      // Log the action
      this.auditLog.push({
        timestamp: new Date(),
        userId,
        action: `alert_${action}`,
        details: { alertId, notes }
      });

      console.log(`🔔 Alert ${alertId} ${action}d by ${username}`);

      return { success: true, message: `Alert ${action}d successfully` };
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error);
      return { success: false, message: `Failed to ${action} alert` };
    }
  }

  /**
   * Get performance history for charts and trends
   */
  async getPerformanceHistory(
    serviceId: string,
    metric: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    try {
      const historyKey = `${serviceId}_${metric}`;
      const history = this.performanceHistory.get(historyKey) || [];
      
      // Filter by time range
      const now = Date.now();
      const timeRangeMs = {
        'hour': 60 * 60 * 1000,
        'day': 24 * 60 * 60 * 1000,
        'week': 7 * 24 * 60 * 60 * 1000,
        'month': 30 * 24 * 60 * 60 * 1000
      };
      
      const cutoff = now - timeRangeMs[timeRange];
      
      return history
        .filter(point => point.timestamp.getTime() > cutoff)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get performance history:', error);
      return [];
    }
  }

  /**
   * Get configuration change history
   */
  async getConfigurationHistory(limit: number = 50): Promise<ConfigurationChange[]> {
    return this.configurationHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get audit log entries
   */
  async getAuditLog(options?: {
    userId?: string;
    action?: string;
    limit?: number;
  }): Promise<Array<{ timestamp: Date; userId: string; action: string; details: any }>> {
    let entries = [...this.auditLog];
    
    if (options?.userId) {
      entries = entries.filter(entry => entry.userId === options.userId);
    }
    
    if (options?.action) {
      entries = entries.filter(entry => entry.action === options.action);
    }
    
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }
    
    return entries;
  }

  /**
   * Get dashboard widgets configuration
   */
  async getDashboardWidgets(): Promise<DashboardWidget[]> {
    const widgets = Array.from(this.dashboardWidgets.values());
    
    // Update widget data
    for (const widget of widgets) {
      widget.data = await this.getWidgetData(widget);
      widget.lastUpdated = new Date();
    }
    
    return widgets;
  }

  /**
   * Update dashboard widget configuration
   */
  async updateDashboardWidget(
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const widget = this.dashboardWidgets.get(widgetId);
      if (!widget) {
        return { success: false, message: 'Widget not found' };
      }

      // Apply updates
      Object.assign(widget, updates, { lastUpdated: new Date() });
      
      return { success: true, message: 'Widget updated successfully' };
    } catch (error) {
      console.error('Failed to update dashboard widget:', error);
      return { success: false, message: 'Failed to update widget' };
    }
  }

  /**
   * Export system data for reporting
   */
  async exportSystemData(format: 'json' | 'csv', timeRange?: { start: Date; end: Date }): Promise<{
    success: boolean;
    data?: any;
    message: string;
  }> {
    try {
      const exportData = {
        timestamp: new Date(),
        systemOverview: this.systemOverview,
        serviceMetrics: Array.from(this.metrics.values()),
        alerts: Array.from(this.alerts.values()),
        configurationHistory: this.configurationHistory,
        auditLog: this.auditLog
      };

      // Apply time range filter if specified
      if (timeRange) {
        exportData.configurationHistory = exportData.configurationHistory.filter(
          change => change.timestamp >= timeRange.start && change.timestamp <= timeRange.end
        );
        exportData.auditLog = exportData.auditLog.filter(
          entry => entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end
        );
      }

      if (format === 'json') {
        return { success: true, data: exportData, message: 'Data exported successfully' };
      } else if (format === 'csv') {
        // Convert to CSV format (simplified)
        const csvData = this.convertToCSV(exportData);
        return { success: true, data: csvData, message: 'Data exported to CSV successfully' };
      }

      return { success: false, message: 'Unsupported export format' };
    } catch (error) {
      console.error('Failed to export system data:', error);
      return { success: false, message: 'Export failed' };
    }
  }

  /**
   * Health check endpoint
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: { [serviceId: string]: 'healthy' | 'warning' | 'error' | 'offline' };
    issues: string[];
  }> {
    const healthCheck = {
      status: 'healthy' as const,
      services: {} as { [serviceId: string]: 'healthy' | 'warning' | 'error' | 'offline' },
      issues: [] as string[]
    };

    // Check each service
    for (const [serviceId, service] of this.services.entries()) {
      try {
        // Basic service health check
        const stats = service.getStats?.();
        const hasStats = stats && Object.keys(stats).length > 0;
        
        if (hasStats) {
          healthCheck.services[serviceId] = 'healthy';
        } else {
          healthCheck.services[serviceId] = 'warning';
          healthCheck.issues.push(`${serviceId}: Limited functionality or missing stats`);
        }
      } catch (error) {
        healthCheck.services[serviceId] = 'error';
        healthCheck.issues.push(`${serviceId}: ${error.message}`);
      }
    }

    // Check critical alerts
    const criticalAlerts = Array.from(this.alerts.values()).filter(
      alert => alert.severity === 'critical' && alert.status === 'active'
    );
    
    if (criticalAlerts.length > 0) {
      healthCheck.status = 'unhealthy';
      healthCheck.issues.push(`${criticalAlerts.length} critical alerts active`);
    } else if (healthCheck.issues.length > 0) {
      healthCheck.status = 'degraded';
    }

    return healthCheck;
  }

  /**
   * Private methods for internal operations
   */
  private async updateSystemOverview(): Promise<void> {
    const serviceMetrics = Array.from(this.metrics.values());
    const activeAlerts = Array.from(this.alerts.values()).filter(a => a.status === 'active');

    this.systemOverview = {
      timestamp: new Date(),
      overallHealth: this.calculateOverallHealth(serviceMetrics, activeAlerts),
      totalServices: this.services.size,
      activeServices: serviceMetrics.filter(m => m.status !== 'offline').length,
      systemLoad: await this.getSystemLoad(),
      performance: {
        averageAccuracy: serviceMetrics.reduce((sum, m) => sum + m.performance.accuracy, 0) / Math.max(serviceMetrics.length, 1),
        averageResponseTime: serviceMetrics.reduce((sum, m) => sum + m.performance.responseTime, 0) / Math.max(serviceMetrics.length, 1),
        totalThroughput: serviceMetrics.reduce((sum, m) => sum + m.performance.throughput, 0),
        systemUptime: 99.5 // Would calculate actual uptime
      },
      alerts: {
        active: activeAlerts.length,
        resolved: Array.from(this.alerts.values()).filter(a => a.status === 'resolved').length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warnings: activeAlerts.filter(a => a.severity === 'medium' || a.severity === 'low').length
      },
      usage: {
        totalRequestsToday: serviceMetrics.reduce((sum, m) => sum + m.usage.requestsLast24h, 0),
        topServices: serviceMetrics
          .sort((a, b) => b.usage.requestsLast24h - a.usage.requestsLast24h)
          .slice(0, 5)
          .map(m => ({
            name: m.serviceName,
            requests: m.usage.requestsLast24h,
            percentage: (m.usage.requestsLast24h / Math.max(serviceMetrics.reduce((sum, s) => sum + s.usage.requestsLast24h, 0), 1)) * 100
          }))
      }
    };
  }

  private async updateAllServiceMetrics(): Promise<void> {
    for (const [serviceId, service] of this.services.entries()) {
      await this.updateServiceMetric(serviceId, service);
    }
  }

  private async updateServiceMetric(serviceId: string, service: any): Promise<void> {
    try {
      const stats = service.getStats?.() || {};
      const displayName = this.getServiceDisplayName(serviceId);

      // Calculate derived metrics
      const performance = this.calculatePerformanceMetrics(stats);
      const usage = this.calculateUsageMetrics(stats);
      const health = this.calculateHealthMetrics(stats);
      const trends = this.calculateTrends(serviceId);

      const metrics: ServiceMetrics = {
        serviceId,
        serviceName: displayName,
        status: this.determineServiceStatus(performance, health),
        uptime: 99.0, // Would calculate actual uptime
        performance,
        usage,
        configuration: {
          currentVersion: '1.0',
          lastUpdated: new Date(),
          configurable: typeof service.updateConfig === 'function',
          criticalSettings: this.extractCriticalSettings(stats)
        },
        health,
        trends
      };

      this.metrics.set(serviceId, metrics);

      // Store performance history
      this.storePerformanceHistory(serviceId, performance);

      // Check for alerts
      await this.checkServiceAlerts(serviceId, metrics);

    } catch (error) {
      console.error(`Failed to update metrics for ${serviceId}:`, error);
      
      // Create error metrics
      this.metrics.set(serviceId, {
        serviceId,
        serviceName: this.getServiceDisplayName(serviceId),
        status: 'error',
        uptime: 0,
        performance: { accuracy: 0, precision: 0, recall: 0, f1Score: 0, responseTime: 0, throughput: 0, errorRate: 100 },
        usage: { totalRequests: 0, requestsLast24h: 0, requestsLastHour: 0, averageRequestsPerMinute: 0, peakRequestsPerMinute: 0 },
        configuration: { currentVersion: 'unknown', lastUpdated: new Date(), configurable: false, criticalSettings: {} },
        health: { cpuUsage: 0, memoryUsage: 0, cacheHitRate: 0, queueLength: 0, lastHealthCheck: new Date() },
        trends: { accuracyTrend: 'stable', performanceTrend: 'stable', usageTrend: 'stable' }
      });
    }
  }

  private calculatePerformanceMetrics(stats: any): ServiceMetrics['performance'] {
    return {
      accuracy: stats.accuracy || stats.accuracyRate || 0.8,
      precision: stats.precision || 0.8,
      recall: stats.recall || 0.8,
      f1Score: stats.f1Score || 0.8,
      responseTime: stats.averageProcessingTime || stats.averageResponseTime || 100,
      throughput: stats.requestsPerMinute || stats.totalProcessed || 10,
      errorRate: (1 - (stats.accuracy || 0.8)) * 100
    };
  }

  private calculateUsageMetrics(stats: any): ServiceMetrics['usage'] {
    return {
      totalRequests: stats.totalProcessed || stats.totalRequests || 0,
      requestsLast24h: stats.requestsLast24h || Math.floor((stats.totalProcessed || 0) * 0.1),
      requestsLastHour: stats.requestsLastHour || Math.floor((stats.totalProcessed || 0) * 0.01),
      averageRequestsPerMinute: stats.averageRequestsPerMinute || 1,
      peakRequestsPerMinute: stats.peakRequestsPerMinute || 5
    };
  }

  private calculateHealthMetrics(stats: any): ServiceMetrics['health'] {
    return {
      cpuUsage: 25, // Would get actual CPU usage
      memoryUsage: 40, // Would get actual memory usage
      cacheHitRate: (stats.cacheHitRate || 0) * 100,
      queueLength: stats.queueLength || 0,
      lastHealthCheck: new Date()
    };
  }

  private calculateTrends(serviceId: string): ServiceMetrics['trends'] {
    // Simplified trend calculation
    return {
      accuracyTrend: 'stable',
      performanceTrend: 'stable',
      usageTrend: 'stable'
    };
  }

  private determineServiceStatus(performance: any, health: any): 'healthy' | 'warning' | 'error' | 'offline' {
    if (performance.errorRate > 50) return 'error';
    if (performance.errorRate > 20) return 'warning';
    if (health.cpuUsage > 90 || health.memoryUsage > 90) return 'warning';
    return 'healthy';
  }

  private extractCriticalSettings(stats: any): { [key: string]: any } {
    const critical = {};
    
    if (stats.threshold !== undefined) critical['threshold'] = stats.threshold;
    if (stats.confidence !== undefined) critical['confidence'] = stats.confidence;
    if (stats.enabled !== undefined) critical['enabled'] = stats.enabled;
    
    return critical;
  }

  private storePerformanceHistory(serviceId: string, performance: any): void {
    const metrics = ['accuracy', 'responseTime', 'throughput', 'errorRate'];
    
    metrics.forEach(metric => {
      const historyKey = `${serviceId}_${metric}`;
      if (!this.performanceHistory.has(historyKey)) {
        this.performanceHistory.set(historyKey, []);
      }
      
      const history = this.performanceHistory.get(historyKey)!;
      history.push({
        timestamp: new Date(),
        value: performance[metric] || 0
      });
      
      // Keep only last 1000 points
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
    });
  }

  private async checkServiceAlerts(serviceId: string, metrics: ServiceMetrics): Promise<void> {
    const thresholds = this.config.alerts.performanceThresholds;
    
    // Check accuracy drop
    if (metrics.performance.accuracy < 0.7) {
      await this.createAlert({
        type: 'performance',
        severity: 'high',
        title: 'Service accuracy below threshold',
        description: `${metrics.serviceName} accuracy dropped to ${(metrics.performance.accuracy * 100).toFixed(1)}%`,
        serviceId,
        metadata: {
          metric: 'accuracy',
          threshold: 70,
          actualValue: metrics.performance.accuracy * 100
        }
      });
    }

    // Check error rate spike
    if (metrics.performance.errorRate > thresholds.errorRateSpike) {
      await this.createAlert({
        type: 'error',
        severity: 'medium',
        title: 'High error rate detected',
        description: `${metrics.serviceName} error rate spiked to ${metrics.performance.errorRate.toFixed(1)}%`,
        serviceId,
        metadata: {
          metric: 'errorRate',
          threshold: thresholds.errorRateSpike,
          actualValue: metrics.performance.errorRate
        }
      });
    }

    // Check response time increase
    if (metrics.performance.responseTime > thresholds.responseTimeIncrease) {
      await this.createAlert({
        type: 'performance',
        severity: 'low',
        title: 'Response time increased',
        description: `${metrics.serviceName} response time increased to ${metrics.performance.responseTime.toFixed(0)}ms`,
        serviceId,
        metadata: {
          metric: 'responseTime',
          threshold: thresholds.responseTimeIncrease,
          actualValue: metrics.performance.responseTime
        }
      });
    }
  }

  private async createAlert(alertData: Partial<AlertInfo>): Promise<void> {
    const alert: AlertInfo = {
      id: this.generateAlertId(),
      type: alertData.type || 'error',
      severity: alertData.severity || 'medium',
      title: alertData.title || 'System Alert',
      description: alertData.description || '',
      serviceId: alertData.serviceId,
      serviceName: alertData.serviceId ? this.getServiceDisplayName(alertData.serviceId) : undefined,
      timestamp: new Date(),
      status: 'active',
      metadata: alertData.metadata || {},
      actions: [
        { type: 'acknowledge', label: 'Acknowledge' },
        { type: 'resolve', label: 'Resolve' }
      ]
    };

    // Check if similar alert already exists
    const existingAlert = Array.from(this.alerts.values()).find(
      a => a.serviceId === alert.serviceId && 
           a.type === alert.type && 
           a.metadata?.metric === alert.metadata?.metric &&
           a.status === 'active'
    );

    if (!existingAlert) {
      this.alerts.set(alert.id, alert);
      console.log(`🚨 Alert created: ${alert.title}`);
    }
  }

  private calculateOverallHealth(serviceMetrics: ServiceMetrics[], activeAlerts: AlertInfo[]): 'healthy' | 'warning' | 'critical' {
    const errorServices = serviceMetrics.filter(m => m.status === 'error').length;
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
    
    if (errorServices > serviceMetrics.length / 2 || criticalAlerts > 0) {
      return 'critical';
    }
    
    if (errorServices > 0 || activeAlerts.length > 5) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private async getSystemLoad(): Promise<{ cpu: number; memory: number; network: number; storage: number }> {
    // Mock system load - would use actual system monitoring
    return {
      cpu: 35 + Math.random() * 20,
      memory: 45 + Math.random() * 20,
      network: 25 + Math.random() * 15,
      storage: 60 + Math.random() * 10
    };
  }

  private async validateConfigurationChanges(serviceId: string, updates: any): Promise<{
    passed: boolean;
    score: number;
    issues: string[];
  }> {
    const validation = {
      passed: true,
      score: 1.0,
      issues: [] as string[]
    };

    // Basic validation rules
    for (const [key, value] of Object.entries(updates)) {
      // Threshold validation
      if (key.includes('threshold') && typeof value === 'number') {
        if (value < 0 || value > 1) {
          validation.issues.push(`${key} must be between 0 and 1`);
          validation.passed = false;
        }
      }

      // Rate limit validation
      if (key.includes('rate') && typeof value === 'number') {
        if (value < 0) {
          validation.issues.push(`${key} must be positive`);
          validation.passed = false;
        }
      }
    }

    if (validation.issues.length > 0) {
      validation.score = Math.max(0, 1 - validation.issues.length * 0.2);
    }

    return validation;
  }

  private determineChangeType(updates: any): ConfigurationChange['changeType'] {
    const keys = Object.keys(updates);
    
    if (keys.some(k => k.includes('threshold'))) return 'threshold';
    if (keys.some(k => k.includes('enabled'))) return 'feature_toggle';
    if (keys.some(k => k.includes('model') || k.includes('version'))) return 'model_update';
    
    return 'configuration';
  }

  private assessChangeImpact(updates: any): 'low' | 'medium' | 'high' {
    const criticalKeys = ['threshold', 'enabled', 'model', 'api_key'];
    const hasCriticalChanges = Object.keys(updates).some(key => 
      criticalKeys.some(critical => key.includes(critical))
    );
    
    if (hasCriticalChanges) return 'high';
    if (Object.keys(updates).length > 3) return 'medium';
    return 'low';
  }

  private generateRollbackPlan(serviceId: string, currentConfig: any, updates: any): string {
    const rollbackSteps = Object.keys(updates).map(key => 
      `Revert ${key} to ${JSON.stringify(currentConfig[key])}`
    );
    
    return `1. ${rollbackSteps.join('\n2. ')}\n3. Verify service functionality`;
  }

  private getServiceDisplayName(serviceId: string): string {
    const displayNames = {
      'ai_integration': 'AI Integration',
      'auto_moderation': 'Auto Moderation',
      'sentiment_analysis': 'Sentiment Analysis',
      'spam_detection': 'Spam Detection',
      'quality_scoring': 'Content Quality',
      'smart_search': 'Smart Search',
      'recommendations': 'Recommendations',
      'feedback_loop': 'Feedback Loop'
    };
    
    return displayNames[serviceId] || serviceId;
  }

  private async getUsernameFromId(userId: string): Promise<string> {
    // Would lookup username from user service
    return `User_${userId.substr(-4)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private async getWidgetData(widget: DashboardWidget): Promise<any> {
    switch (widget.type) {
      case 'metric':
        return this.getMetricWidgetData(widget.configuration);
      case 'chart':
        return this.getChartWidgetData(widget.configuration);
      case 'alert':
        return this.getAlertWidgetData(widget.configuration);
      default:
        return {};
    }
  }

  private getMetricWidgetData(config: any): any {
    const serviceId = config.serviceId;
    const metric = this.metrics.get(serviceId);
    
    if (!metric) return { value: 0, status: 'no_data' };
    
    return {
      value: metric.performance[config.metric] || 0,
      status: metric.status,
      trend: metric.trends[`${config.metric}Trend`] || 'stable'
    };
  }

  private async getChartWidgetData(config: any): Promise<any> {
    const history = await this.getPerformanceHistory(
      config.serviceId,
      config.metric,
      config.timeRange || 'day'
    );
    
    return {
      data: history,
      labels: history.map(h => h.timestamp.toISOString()),
      values: history.map(h => h.value)
    };
  }

  private getAlertWidgetData(config: any): any {
    const alerts = Array.from(this.alerts.values())
      .filter(a => a.status === 'active')
      .slice(0, config.limit || 5);
    
    return {
      alerts,
      count: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length
    };
  }

  private createErrorSystemOverview(): SystemOverview {
    return {
      timestamp: new Date(),
      overallHealth: 'critical',
      totalServices: this.services.size,
      activeServices: 0,
      systemLoad: { cpu: 0, memory: 0, network: 0, storage: 0 },
      performance: { averageAccuracy: 0, averageResponseTime: 0, totalThroughput: 0, systemUptime: 0 },
      alerts: { active: 1, resolved: 0, critical: 1, warnings: 0 },
      usage: { totalRequestsToday: 0, topServices: [] }
    };
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const headers = ['timestamp', 'service', 'metric', 'value'];
    const rows = [headers.join(',')];
    
    // Add service metrics
    data.serviceMetrics.forEach((service: ServiceMetrics) => {
      Object.entries(service.performance).forEach(([metric, value]) => {
        rows.push([data.timestamp, service.serviceName, metric, value].join(','));
      });
    });
    
    return rows.join('\n');
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });
      
      console.log('✅ Redis initialized for admin dashboard');
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
    }
  }

  private initializeSystemOverview(): void {
    this.systemOverview = {
      timestamp: new Date(),
      overallHealth: 'healthy',
      totalServices: this.services.size,
      activeServices: this.services.size,
      systemLoad: { cpu: 0, memory: 0, network: 0, storage: 0 },
      performance: { averageAccuracy: 0.8, averageResponseTime: 100, totalThroughput: 100, systemUptime: 99.5 },
      alerts: { active: 0, resolved: 0, critical: 0, warnings: 0 },
      usage: { totalRequestsToday: 0, topServices: [] }
    };
  }

  private initializeDefaultWidgets(): void {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'system_overview',
        type: 'metric',
        title: 'System Health',
        size: 'large',
        data: {},
        refreshRate: 30,
        lastUpdated: new Date(),
        configuration: { metric: 'overallHealth' }
      },
      {
        id: 'active_alerts',
        type: 'alert',
        title: 'Active Alerts',
        size: 'medium',
        data: {},
        refreshRate: 10,
        lastUpdated: new Date(),
        configuration: { limit: 5 }
      },
      {
        id: 'performance_chart',
        type: 'chart',
        title: 'Performance Trends',
        size: 'large',
        data: {},
        refreshRate: 60,
        lastUpdated: new Date(),
        configuration: { serviceId: 'auto_moderation', metric: 'accuracy', timeRange: 'day' }
      }
    ];

    defaultWidgets.forEach(widget => {
      this.dashboardWidgets.set(widget.id, widget);
    });
  }

  private startMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    // Update metrics regularly
    setInterval(async () => {
      await this.updateSystemOverview();
      await this.updateAllServiceMetrics();
    }, this.config.monitoring.refreshInterval * 1000);

    // Clean up old data
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily

    console.log(`⏰ Monitoring started with ${this.config.monitoring.refreshInterval}s intervals`);
  }

  private cleanupOldData(): void {
    const maxAge = this.config.monitoring.historicalDataDays * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - maxAge);

    // Clean configuration history
    this.configurationHistory = this.configurationHistory.filter(
      change => change.timestamp > cutoff
    );

    // Clean audit log
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoff);

    // Clean resolved alerts
    const activeAlerts = new Map<string, AlertInfo>();
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.status === 'active' || (alert.resolvedAt && alert.resolvedAt > cutoff)) {
        activeAlerts.set(id, alert);
      }
    }
    this.alerts = activeAlerts;

    console.log('🧹 Cleaned up old dashboard data');
  }

  private mergeConfig(partialConfig?: Partial<DashboardConfig>): DashboardConfig {
    const defaultConfig: DashboardConfig = {
      monitoring: {
        enabled: true,
        refreshInterval: 30, // seconds
        realTimeUpdates: true,
        historicalDataDays: 30
      },
      alerts: {
        enabled: true,
        emailNotifications: false,
        slackNotifications: false,
        performanceThresholds: {
          accuracyDrop: 10, // 10%
          errorRateSpike: 15, // 15%
          responseTimeIncrease: 1000 // 1000ms
        }
      },
      access: {
        requireAuth: true,
        allowedRoles: ['admin', 'moderator'],
        auditLogging: true
      },
      features: {
        liveMetrics: true,
        configManagement: true,
        thresholdTuning: true,
        modelComparison: false,
        feedbackAnalysis: true,
        systemHealth: true
      }
    };

    return { ...defaultConfig, ...partialConfig };
  }

  /**
   * Public API methods
   */
  updateConfig(newConfig: Partial<DashboardConfig>): void {
    this.config = this.mergeConfig(newConfig);
    console.log('⚙️ Admin dashboard configuration updated');
  }

  getStats(): any {
    return {
      monitoring: {
        totalServices: this.services.size,
        activeMetrics: this.metrics.size,
        activeAlerts: Array.from(this.alerts.values()).filter(a => a.status === 'active').length,
        configurationChanges: this.configurationHistory.length,
        auditEntries: this.auditLog.length
      },
      performance: {
        averageServiceHealth: Array.from(this.metrics.values())
          .reduce((sum, m) => sum + (m.status === 'healthy' ? 1 : 0), 0) / Math.max(this.metrics.size, 1),
        systemUptime: this.systemOverview.performance.systemUptime,
        totalThroughput: this.systemOverview.performance.totalThroughput
      },
      config: this.config
    };
  }
}