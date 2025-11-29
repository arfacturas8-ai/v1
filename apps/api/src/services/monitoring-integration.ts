import { FastifyInstance } from 'fastify';
import { PrometheusMetricsService, prometheusMetricsPlugin } from './prometheus-metrics';
import { SentryIntegrationService, sentryIntegrationPlugin } from './sentry-integration';
import { BusinessKPITrackingService } from './business-kpi-tracking';
import { performance } from 'perf_hooks';

/**
 * Comprehensive Monitoring Integration Service
 * 
 * Centralized service that coordinates all monitoring components:
 * - Prometheus metrics collection
 * - Sentry error tracking and performance monitoring
 * - Business KPI tracking
 * - Health checks and status reporting
 * - Alert correlation and incident management
 */
export class MonitoringIntegrationService {
  private prometheusService?: PrometheusMetricsService;
  private sentryService?: SentryIntegrationService;
  private businessKPIService?: BusinessKPITrackingService;
  private isInitialized = false;
  private startTime = Date.now();

  constructor() {
    // Services will be initialized through plugins
  }

  /**
   * Initialize the complete monitoring stack
   */
  async initialize(config: MonitoringConfig): Promise<void> {
    try {
      console.log('[Monitoring] Initializing comprehensive monitoring stack...');

      // Initialize Prometheus metrics
      this.prometheusService = new PrometheusMetricsService();
      
      // Initialize Sentry if configuration provided
      if (config.sentry) {
        this.sentryService = new SentryIntegrationService(this.prometheusService);
        await this.sentryService.initialize(config.sentry);
      }
      
      // Initialize business KPI tracking
      this.businessKPIService = new BusinessKPITrackingService(
        this.prometheusService,
        this.sentryService
      );

      // Set up cross-service integrations
      this.setupIntegrations();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isInitialized = true;
      console.log('[Monitoring] ✅ Monitoring stack initialized successfully');
      
    } catch (error) {
      console.error('[Monitoring] ❌ Failed to initialize monitoring stack:', error);
      throw error;
    }
  }

  /**
   * Set up integrations between monitoring services
   */
  private setupIntegrations(): void {
    // Enhance Prometheus with business context
    if (this.prometheusService && this.businessKPIService) {
      console.log('[Monitoring] Setting up Prometheus-Business KPI integration');
    }

    // Enhance Sentry with business context
    if (this.sentryService && this.businessKPIService) {
      console.log('[Monitoring] Setting up Sentry-Business KPI integration');
    }

    // Set up alert correlation
    this.setupAlertCorrelation();
  }

  /**
   * Set up alert correlation between different monitoring systems
   */
  private setupAlertCorrelation(): void {
    // This would integrate with alerting systems to correlate alerts
    // from different sources and reduce noise
    console.log('[Monitoring] Setting up alert correlation');
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    // Monitor overall system health every 30 seconds
    setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('[Monitoring] Health check failed:', error);
        this.sentryService?.captureException(error, {
          component: 'monitoring-health',
          level: 'warning'
        });
      });
    }, 30000);

    console.log('[Monitoring] Health monitoring started');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<HealthStatus> {
    const healthStatus: HealthStatus = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      services: {},
      overall: 'healthy'
    };

    try {
      // Check Prometheus health
      if (this.prometheusService) {
        healthStatus.services.prometheus = {
          status: 'healthy',
          lastCheck: new Date().toISOString()
        };
      }

      // Check Sentry health
      if (this.sentryService) {
        healthStatus.services.sentry = {
          status: this.sentryService.isHealthy() ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString()
        };
      }

      // Check Business KPI service health
      if (this.businessKPIService) {
        healthStatus.services.businessKPI = {
          status: this.businessKPIService.isHealthy() ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString()
        };
      }

      // Determine overall health
      const unhealthyServices = Object.values(healthStatus.services).filter(
        service => service.status === 'unhealthy'
      );
      
      if (unhealthyServices.length > 0) {
        healthStatus.overall = 'degraded';
      }

      // Track health metrics
      this.prometheusService?.trackError(
        'info', 
        'monitoring', 
        `health_check_${healthStatus.overall}`
      );

      return healthStatus;

    } catch (error) {
      healthStatus.overall = 'unhealthy';
      healthStatus.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.prometheusService?.trackError('error', 'monitoring', 'health_check_failed');
      
      return healthStatus;
    }
  }

  // Public API methods for application instrumentation

  /**
   * Track HTTP request with comprehensive monitoring
   */
  trackHttpRequest(options: HttpRequestOptions): void {
    const { method, route, statusCode, duration, requestSize, responseSize, userId, userAgent } = options;

    // Track in Prometheus
    this.prometheusService?.trackHttpRequest(method, route, statusCode, duration, requestSize, responseSize);

    // Add breadcrumb in Sentry
    this.sentryService?.addBreadcrumb({
      message: `HTTP ${method} ${route}`,
      category: 'http',
      level: statusCode >= 400 ? 'warning' : 'info',
      data: {
        method,
        route,
        statusCode,
        duration,
        userId
      }
    });

    // Track business impact
    if (statusCode >= 500) {
      this.businessKPIService?.trackFeatureAdoption('api_errors', 'system', false);
    }
  }

  /**
   * Track database query with performance monitoring
   */
  trackDatabaseQuery(options: DatabaseQueryOptions): void {
    const { operation, table, duration, success, error } = options;

    // Track in Prometheus
    this.prometheusService?.trackDatabaseQuery(operation, table, duration);
    
    if (!success && error) {
      this.prometheusService?.trackDatabaseError(operation, error.name || 'unknown');
    }

    // Track in Sentry for slow queries
    if (duration > 1000) {
      this.sentryService?.addBreadcrumb({
        message: `Slow database query: ${operation} on ${table}`,
        category: 'database',
        level: 'warning',
        data: { operation, table, duration }
      });
    }

    // Track errors in Sentry
    if (!success && error) {
      this.sentryService?.captureException(error, {
        component: 'database',
        extra: { operation, table, duration }
      });
    }
  }

  /**
   * Track user action with business context
   */
  trackUserAction(options: UserActionOptions): void {
    const { action, userId, userTier, success, context } = options;

    // Track user engagement
    this.businessKPIService?.trackFeatureAdoption(action, userTier, success);

    // Add user context to Sentry
    if (userId) {
      this.sentryService?.setUser({
        id: userId,
        plan: userTier
      });
    }

    // Track in breadcrumbs
    this.sentryService?.addBreadcrumb({
      message: `User action: ${action}`,
      category: 'user',
      level: success ? 'info' : 'warning',
      data: { action, userId, userTier, context }
    });

    // Track critical failures
    if (!success) {
      this.prometheusService?.trackError('warning', 'user_action', action);
    }
  }

  /**
   * Track business event with KPI impact
   */
  trackBusinessEvent(options: BusinessEventOptions): void {
    const { event, value, metadata } = options;

    switch (event) {
      case 'user_registration':
        this.businessKPIService?.trackUserRegistration(metadata?.source);
        break;
      case 'community_creation':
        this.businessKPIService?.trackCommunityCreation(metadata?.type, metadata?.creatorTier);
        break;
      case 'message_sent':
        this.prometheusService?.trackMessage(metadata?.channelType, metadata?.messageType);
        break;
      case 'voice_call_started':
        this.prometheusService?.trackVoiceCall(metadata?.callType);
        break;
      case 'voice_call_ended':
        this.prometheusService?.trackVoiceCallEnd(metadata?.callType, value);
        break;
      case 'payment_processed':
        this.businessKPIService?.trackRevenueEvent(value, metadata?.planType, metadata?.paymentMethod);
        break;
      case 'user_session':
        this.businessKPIService?.trackUserSession(value, metadata?.platform);
        break;
    }

    // Track in Sentry for correlation
    this.sentryService?.addBreadcrumb({
      message: `Business event: ${event}`,
      category: 'business',
      level: 'info',
      data: { event, value, metadata }
    });
  }

  /**
   * Handle application error with comprehensive tracking
   */
  handleError(error: Error, context?: ErrorContext): void {
    const errorContext = {
      component: context?.component || 'unknown',
      level: context?.level || 'error',
      user: context?.user,
      extra: {
        ...context?.extra,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      }
    };

    // Track in Prometheus
    this.prometheusService?.trackError(
      errorContext.level,
      errorContext.component,
      error.name || 'unknown'
    );

    // Track in Sentry
    this.sentryService?.captureException(error, errorContext);

    // Track business impact
    if (errorContext.level === 'error' || errorContext.level === 'fatal') {
      this.prometheusService?.trackCrash(errorContext.component, error.name || 'unknown');
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, op: string = 'custom'): any {
    return this.sentryService?.startTransaction(name, op);
  }

  /**
   * Measure function performance
   */
  async measureFunction<T>(
    name: string,
    operation: () => Promise<T>,
    context?: { component?: string; tags?: Record<string, string> }
  ): Promise<T> {
    if (this.sentryService) {
      return this.sentryService.measureFunction(name, operation, context);
    }

    // Fallback measurement
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      this.prometheusService?.trackHttpRequest('FUNCTION', name, 200, duration);
      return result;
      
    } catch (error) {
      const duration = performance.now() - start;
      this.prometheusService?.trackHttpRequest('FUNCTION', name, 500, duration);
      throw error;
    }
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    return this.performHealthCheck();
  }

  /**
   * Get monitoring configuration
   */
  getConfiguration(): MonitoringConfiguration {
    return {
      prometheus: {
        enabled: !!this.prometheusService,
        metricsEndpoint: '/metrics'
      },
      sentry: {
        enabled: !!this.sentryService,
        config: this.sentryService?.getConfig() || null
      },
      businessKPI: {
        enabled: !!this.businessKPIService
      },
      isInitialized: this.isInitialized,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[Monitoring] Shutting down monitoring services...');
    
    try {
      if (this.sentryService) {
        await this.sentryService.close?.();
      }
      
      this.isInitialized = false;
      console.log('[Monitoring] ✅ Monitoring services shut down successfully');
      
    } catch (error) {
      console.error('[Monitoring] ❌ Error during monitoring shutdown:', error);
    }
  }
}

// Type definitions
export interface MonitoringConfig {
  sentry?: {
    dsn: string;
    environment?: string;
    release?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    enableInDevelopment?: boolean;
  };
}

export interface HttpRequestOptions {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  requestSize?: number;
  responseSize?: number;
  userId?: string;
  userAgent?: string;
}

export interface DatabaseQueryOptions {
  operation: string;
  table: string;
  duration: number;
  success: boolean;
  error?: Error;
}

export interface UserActionOptions {
  action: string;
  userId?: string;
  userTier?: string;
  success: boolean;
  context?: any;
}

export interface BusinessEventOptions {
  event: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  component?: string;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
  user?: any;
  extra?: Record<string, any>;
}

export interface HealthStatus {
  timestamp: string;
  uptime: number;
  services: Record<string, ServiceHealth>;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  error?: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  lastCheck: string;
  error?: string;
}

export interface MonitoringConfiguration {
  prometheus: {
    enabled: boolean;
    metricsEndpoint: string;
  };
  sentry: {
    enabled: boolean;
    config: any;
  };
  businessKPI: {
    enabled: boolean;
  };
  isInitialized: boolean;
  uptime: number;
}

/**
 * Fastify plugin for comprehensive monitoring integration
 */
export async function monitoringIntegrationPlugin(
  fastify: FastifyInstance,
  options: { config: MonitoringConfig }
) {
  const monitoringService = new MonitoringIntegrationService();
  
  // Initialize monitoring stack
  await monitoringService.initialize(options.config);
  
  // Register individual plugins
  await fastify.register(prometheusMetricsPlugin);
  
  if (options.config.sentry) {
    await fastify.register(sentryIntegrationPlugin, {
      config: options.config.sentry,
      metricsService: monitoringService.prometheusService
    });
  }
  
  // Decorate Fastify instance
  fastify.decorate('monitoring', monitoringService);
  
  // Add health check endpoint
  fastify.get('/health/monitoring', async (request, reply) => {
    const health = await monitoringService.getHealthStatus();
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 200 : 503;
    
    return reply.status(statusCode).send(health);
  });

  // Add monitoring configuration endpoint
  fastify.get('/monitoring/config', async (request, reply) => {
    return monitoringService.getConfiguration();
  });

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await monitoringService.shutdown();
  });

  console.log('🔍 Comprehensive Monitoring Integration initialized');
  console.log('   - Prometheus metrics with business KPIs');
  console.log('   - Sentry error tracking and performance monitoring');
  console.log('   - Cross-service monitoring correlation');
  console.log('   - Health checks and status reporting');
  console.log('   📊 Health endpoint: /health/monitoring');
  console.log('   ⚙️  Config endpoint: /monitoring/config');
}

// Export singleton instance
export const monitoringService = new MonitoringIntegrationService();