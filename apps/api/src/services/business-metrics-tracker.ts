/**
 * Business Metrics Tracker Service
 * 
 * Tracks key business metrics and KPIs for CRYB Platform
 * Integrates with Prometheus and Sentry for comprehensive monitoring
 */

import { PrometheusMetricsService } from './prometheus-metrics';
import { SentryIntegrationService } from './sentry-integration';

export interface UserMetrics {
  registrations: number;
  activeUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRate: number;
  churnRate: number;
}

export interface EngagementMetrics {
  messagesPerUser: number;
  sessionDuration: number;
  voiceCallDuration: number;
  postsCreated: number;
  commentsCreated: number;
  reactionsGiven: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  throughput: number;
}

export interface BusinessKPIs {
  userGrowthRate: number;
  userEngagementScore: number;
  platformHealthScore: number;
  featureAdoptionRate: number;
  customerSatisfactionScore: number;
}

export class BusinessMetricsTracker {
  private metricsService: PrometheusMetricsService;
  private sentryService?: SentryIntegrationService;
  private trackingInterval?: NodeJS.Timeout;
  private startTime: number;

  constructor(
    metricsService: PrometheusMetricsService,
    sentryService?: SentryIntegrationService
  ) {
    this.metricsService = metricsService;
    this.sentryService = sentryService;
    this.startTime = Date.now();
  }

  /**
   * Initialize business metrics tracking
   */
  initialize(): void {
    console.log('📊 Initializing Business Metrics Tracker...');
    
    // Start periodic metrics collection
    this.startPeriodicTracking();
    
    console.log('✅ Business Metrics Tracker initialized');
  }

  /**
   * Start periodic business metrics collection
   */
  private startPeriodicTracking(): void {
    // Track business metrics every 5 minutes
    this.trackingInterval = setInterval(async () => {
      try {
        await this.collectBusinessMetrics();
      } catch (error) {
        console.error('Error collecting business metrics:', error);
        this.sentryService?.captureException(error as Error, {
          component: 'business-metrics-tracker',
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('📈 Business metrics tracking started (5-minute intervals)');
  }

  /**
   * Collect and track all business metrics
   */
  private async collectBusinessMetrics(): Promise<void> {
    const timestamp = Date.now();
    
    // Track user metrics
    await this.trackUserMetrics();
    
    // Track engagement metrics
    await this.trackEngagementMetrics();
    
    // Track performance metrics
    await this.trackPerformanceMetrics();
    
    // Calculate and track KPIs
    await this.trackBusinessKPIs();
    
    // Track system health
    this.trackSystemHealth();
  }

  /**
   * Track user-related metrics
   */
  private async trackUserMetrics(): Promise<void> {
    try {
      // These would normally query the database
      // For now, we'll simulate with basic tracking
      
      this.metricsService.trackBusinessMetric('user_metrics_collection', 1, {
        type: 'user_metrics'
      });
      
      // Track user registration events (this would be called from auth service)
      // this.metricsService.trackUserRegistration('web');
      
      if (this.sentryService) {
        this.sentryService.addBreadcrumb({
          message: 'User metrics collected',
          category: 'business_metrics',
          level: 'info',
          data: { timestamp: Date.now() }
        });
      }
      
    } catch (error) {
      console.error('Error tracking user metrics:', error);
      this.metricsService.trackError('error', 'business-metrics', 'user_metrics_error');
    }
  }

  /**
   * Track engagement metrics
   */
  private async trackEngagementMetrics(): Promise<void> {
    try {
      this.metricsService.trackBusinessMetric('engagement_metrics_collection', 1, {
        type: 'engagement'
      });
      
      // Track average session duration (simulated)
      const avgSessionDuration = Math.random() * 1800 + 300; // 5-35 minutes
      this.metricsService.trackBusinessMetric('average_session_duration_seconds', avgSessionDuration);
      
      if (this.sentryService) {
        this.sentryService.addBreadcrumb({
          message: 'Engagement metrics collected',
          category: 'business_metrics',
          level: 'info',
          data: { avgSessionDuration }
        });
      }
      
    } catch (error) {
      console.error('Error tracking engagement metrics:', error);
      this.metricsService.trackError('error', 'business-metrics', 'engagement_metrics_error');
    }
  }

  /**
   * Track performance metrics
   */
  private async trackPerformanceMetrics(): Promise<void> {
    try {
      // Calculate uptime
      const uptimeSeconds = (Date.now() - this.startTime) / 1000;
      this.metricsService.trackBusinessMetric('service_uptime_seconds', uptimeSeconds);
      
      // Track business metric collection
      this.metricsService.trackBusinessMetric('performance_metrics_collection', 1, {
        type: 'performance'
      });
      
    } catch (error) {
      console.error('Error tracking performance metrics:', error);
      this.metricsService.trackError('error', 'business-metrics', 'performance_metrics_error');
    }
  }

  /**
   * Calculate and track business KPIs
   */
  private async trackBusinessKPIs(): Promise<void> {
    try {
      // Calculate platform health score (0-100)
      const healthScore = this.calculatePlatformHealthScore();
      this.metricsService.trackBusinessMetric('platform_health_score', healthScore);
      
      // Calculate user engagement score (0-100)
      const engagementScore = this.calculateEngagementScore();
      this.metricsService.trackBusinessMetric('user_engagement_score', engagementScore);
      
      // Track KPI collection
      this.metricsService.trackBusinessMetric('business_kpis_collection', 1, {
        type: 'kpis'
      });
      
      if (this.sentryService) {
        this.sentryService.addBreadcrumb({
          message: 'Business KPIs calculated',
          category: 'business_metrics',
          level: 'info',
          data: { healthScore, engagementScore }
        });
      }
      
    } catch (error) {
      console.error('Error tracking business KPIs:', error);
      this.metricsService.trackError('error', 'business-metrics', 'kpi_calculation_error');
    }
  }

  /**
   * Calculate platform health score based on various metrics
   */
  private calculatePlatformHealthScore(): number {
    // This would normally use real metrics from Prometheus
    // For now, we'll simulate a health score calculation
    
    let score = 100;
    
    // Reduce score based on error rate (simulated)
    const errorRate = Math.random() * 0.05; // 0-5% error rate
    score -= errorRate * 1000; // Reduce score by error rate * 1000
    
    // Reduce score based on response time (simulated)
    const avgResponseTime = Math.random() * 2; // 0-2 seconds
    if (avgResponseTime > 1) {
      score -= (avgResponseTime - 1) * 20;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate user engagement score
   */
  private calculateEngagementScore(): number {
    // This would normally use real user metrics
    // For now, we'll simulate an engagement score
    
    const baseScore = 70;
    const variation = (Math.random() - 0.5) * 40; // ±20 variation
    
    return Math.max(0, Math.min(100, baseScore + variation));
  }

  /**
   * Track system health metrics
   */
  private trackSystemHealth(): void {
    try {
      // Track memory usage
      const memUsage = process.memoryUsage();
      this.metricsService.trackBusinessMetric('nodejs_memory_heap_used_bytes', memUsage.heapUsed);
      this.metricsService.trackBusinessMetric('nodejs_memory_heap_total_bytes', memUsage.heapTotal);
      this.metricsService.trackBusinessMetric('nodejs_memory_rss_bytes', memUsage.rss);
      
      // Calculate memory pressure
      const memoryPressure = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      this.metricsService.trackBusinessMetric('nodejs_memory_pressure_percent', memoryPressure);
      
      // Track CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      this.metricsService.trackBusinessMetric('nodejs_cpu_user_microseconds', cpuUsage.user);
      this.metricsService.trackBusinessMetric('nodejs_cpu_system_microseconds', cpuUsage.system);
      
    } catch (error) {
      console.error('Error tracking system health:', error);
      this.metricsService.trackError('error', 'business-metrics', 'system_health_error');
    }
  }

  /**
   * Track user action for business analytics
   */
  trackUserAction(userId: string, action: string, metadata?: Record<string, any>): void {
    try {
      // Track the action in metrics
      this.metricsService.trackBusinessMetric('user_action', 1, {
        action,
        user_type: metadata?.userType || 'regular'
      });
      
      // Track in Sentry for debugging
      if (this.sentryService) {
        this.sentryService.trackUserAction(action, userId, metadata);
      }
      
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, userId: string, success: boolean, metadata?: Record<string, any>): void {
    try {
      this.metricsService.trackBusinessMetric('feature_usage', 1, {
        feature,
        success: success.toString(),
        user_segment: metadata?.segment || 'general'
      });
      
      if (this.sentryService) {
        this.sentryService.trackFeatureUsage(feature, userId, success, metadata);
      }
      
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }

  /**
   * Track business event (e.g., subscription, upgrade, etc.)
   */
  trackBusinessEvent(event: string, value: number, metadata?: Record<string, any>): void {
    try {
      this.metricsService.trackBusinessMetric('business_event', value, {
        event,
        category: metadata?.category || 'general'
      });
      
      if (this.sentryService) {
        this.sentryService.addBreadcrumb({
          message: `Business event: ${event}`,
          category: 'business_event',
          level: 'info',
          data: { event, value, metadata }
        });
      }
      
    } catch (error) {
      console.error('Error tracking business event:', error);
    }
  }

  /**
   * Track A/B test participation
   */
  trackABTest(testName: string, variant: string, userId: string): void {
    try {
      this.metricsService.trackBusinessMetric('ab_test_participation', 1, {
        test: testName,
        variant
      });
      
      if (this.sentryService) {
        this.sentryService.addBreadcrumb({
          message: `A/B test participation: ${testName}`,
          category: 'ab_test',
          level: 'info',
          data: { testName, variant, userId: userId.substring(0, 8) }
        });
      }
      
    } catch (error) {
      console.error('Error tracking A/B test:', error);
    }
  }

  /**
   * Get current business metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    return {
      service: 'business-metrics-tracker',
      uptime: Date.now() - this.startTime,
      isTracking: !!this.trackingInterval,
      lastCollection: new Date().toISOString(),
    };
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = undefined;
    }
    console.log('📊 Business metrics tracking stopped');
  }
}

/**
 * Create business metrics tracker instance
 */
export function createBusinessMetricsTracker(
  metricsService: PrometheusMetricsService,
  sentryService?: SentryIntegrationService
): BusinessMetricsTracker {
  return new BusinessMetricsTracker(metricsService, sentryService);
}

export default BusinessMetricsTracker;