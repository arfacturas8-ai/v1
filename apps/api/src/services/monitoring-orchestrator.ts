/**
 * Monitoring Orchestration Service
 * 
 * Centrally manages all monitoring and observability services for CRYB Platform
 * Coordinates Sentry, Prometheus, Jaeger, health checks, and business metrics
 */

import { FastifyInstance } from 'fastify';
import { SentryIntegrationService, SentryConfig } from './sentry-integration';
import { PrometheusMetricsService } from './prometheus-metrics';
import { Environment } from '../config/env-validation';
import { performance } from 'perf_hooks';

export interface MonitoringConfig {
  environment: Environment;
  serviceName: string;
  version: string;
  enableSentry: boolean;
  enablePrometheus: boolean;
  enableJaeger: boolean;
  enableHealthChecks: boolean;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

export interface ServiceHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: string;
  uptime: number;
  version: string;
}

export class MonitoringOrchestrator {
  private config: MonitoringConfig;
  private sentryService?: SentryIntegrationService;
  private metricsService?: PrometheusMetricsService;
  private healthCheckInterval?: NodeJS.Timeout;
  private startTime: number;
  private isInitialized = false;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  /**
   * Initialize all monitoring services
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Monitoring Orchestrator...');
    
    try {
      // Initialize Prometheus metrics
      if (this.config.enablePrometheus) {
        await this.initializePrometheus();
      }

      // Initialize Sentry
      if (this.config.enableSentry && this.config.environment.SENTRY_DSN) {
        await this.initializeSentry();
      }

      // Initialize health checks
      if (this.config.enableHealthChecks) {
        this.setupHealthChecks();
      }

      // Track initialization metrics
      if (this.metricsService) {
        this.metricsService.trackBusinessMetric('monitoring_initialization', 1, {
          service: this.config.serviceName,
          version: this.config.version,
        });
      }

      this.isInitialized = true;
      console.log('✅ Monitoring Orchestrator initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Monitoring Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Initialize Prometheus metrics service
   */
  private async initializePrometheus(): Promise<void> {
    console.log('📊 Initializing Prometheus metrics...');
    
    this.metricsService = new PrometheusMetricsService();
    
    // Track custom business metrics
    this.setupBusinessMetrics();
    
    console.log('✅ Prometheus metrics initialized');
  }

  /**
   * Initialize Sentry error tracking
   */
  private async initializeSentry(): Promise<void> {
    console.log('🔍 Initializing Sentry error tracking...');
    
    const sentryConfig: SentryConfig = {
      dsn: this.config.environment.SENTRY_DSN!,
      environment: this.config.environment.SENTRY_ENVIRONMENT || this.config.environment.NODE_ENV,
      release: this.config.environment.SENTRY_RELEASE || this.config.version,
      tracesSampleRate: this.config.environment.SENTRY_TRACES_SAMPLE_RATE,
      profilesSampleRate: this.config.environment.SENTRY_PROFILES_SAMPLE_RATE,
      maxBreadcrumbs: this.config.environment.SENTRY_MAX_BREADCRUMBS,
      enableInDevelopment: this.config.environment.SENTRY_ENABLE_IN_DEVELOPMENT,
    };

    this.sentryService = new SentryIntegrationService(this.metricsService);
    await this.sentryService.initialize(sentryConfig);
    
    console.log('✅ Sentry error tracking initialized');
  }

  /**
   * Set up custom business metrics tracking
   */
  private setupBusinessMetrics(): void {
    if (!this.metricsService) return;

    // Track service startup
    this.metricsService.trackBusinessMetric('service_startup', 1, {
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment.NODE_ENV,
    });

    // Monitor memory usage periodically
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Track memory metrics using existing methods
      this.metricsService!.trackBusinessMetric('nodejs_memory_heap_used', memUsage.heapUsed);
      this.metricsService!.trackBusinessMetric('nodejs_memory_heap_total', memUsage.heapTotal);
      this.metricsService!.trackBusinessMetric('nodejs_memory_rss', memUsage.rss);

      // Track memory pressure
      const memoryPressure = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      this.metricsService!.trackBusinessMetric('nodejs_memory_pressure_percent', memoryPressure);

      // Alert on high memory usage
      if (memoryPressure > 85) {
        this.trackAlert('high_memory_usage', 'warning', {
          memoryPressure,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
        });
      }

    }, 30000); // Every 30 seconds
  }

  /**
   * Set up health check monitoring
   */
  private setupHealthChecks(): void {
    console.log('🏥 Setting up health checks...');
    
    const interval = this.config.environment.HEALTH_CHECK_INTERVAL;
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthResult = await this.performHealthChecks();
        
        // Track health status in metrics
        if (this.metricsService) {
          this.metricsService.trackBusinessMetric('service_health_status', 
            healthResult.overall === 'healthy' ? 1 : 0, {
              service: this.config.serviceName
            });
        }

        // Alert on unhealthy services
        if (healthResult.overall === 'unhealthy') {
          this.trackAlert('service_unhealthy', 'error', {
            services: healthResult.services.filter(s => s.status === 'unhealthy'),
            timestamp: healthResult.timestamp,
          });
        }

      } catch (error) {
        console.error('Health check failed:', error);
        this.trackError(error as Error, 'health_check');
      }
    }, interval);

    console.log(`✅ Health checks scheduled every ${interval}ms`);
  }

  /**
   * Perform comprehensive health checks
   */
  async performHealthChecks(): Promise<ServiceHealth> {
    const services: HealthCheckResult[] = [];
    const startTime = performance.now();

    // Check database connectivity
    services.push(await this.checkDatabaseHealth());
    
    // Check Redis connectivity
    services.push(await this.checkRedisHealth());
    
    // Check external services
    services.push(await this.checkLiveKitHealth());
    
    // Check monitoring services health
    services.push(await this.checkMonitoringHealth());

    const overallStatus = this.determineOverallHealth(services);
    const responseTime = performance.now() - startTime;

    return {
      overall: overallStatus,
      services,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.config.version,
    };
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      // Import Prisma client
      const { prisma } = await import('@cryb/database');
      
      // Simple database ping
      await prisma.$queryRaw`SELECT 1 as ping`;
      
      const responseTime = performance.now() - start;
      
      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          type: 'postgresql',
          responseTimeMs: responseTime,
        },
      };
      
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: performance.now() - start,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      const Redis = await import('ioredis');
      const redis = new Redis.default(this.config.environment.REDIS_URL);
      
      await redis.ping();
      await redis.disconnect();
      
      const responseTime = performance.now() - start;
      
      return {
        service: 'redis',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          responseTimeMs: responseTime,
        },
      };
      
    } catch (error) {
      return {
        service: 'redis',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: performance.now() - start,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check LiveKit health
   */
  private async checkLiveKitHealth(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    try {
      if (!this.config.environment.ENABLE_VOICE_VIDEO) {
        return {
          service: 'livekit',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          responseTime: 0,
          details: { status: 'disabled' },
        };
      }

      // Basic connectivity check to LiveKit
      const url = new URL(this.config.environment.LIVEKIT_URL);
      const response = await fetch(`${url.protocol}//${url.host}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = performance.now() - start;
      const isHealthy = response.ok || response.status === 404; // 404 is ok for LiveKit
      
      return {
        service: 'livekit',
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          url: this.config.environment.LIVEKIT_URL,
          statusCode: response.status,
          responseTimeMs: responseTime,
        },
      };
      
    } catch (error) {
      return {
        service: 'livekit',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: performance.now() - start,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check monitoring services health
   */
  private async checkMonitoringHealth(): Promise<HealthCheckResult> {
    const start = performance.now();
    const details: Record<string, any> = {};
    
    try {
      // Check Sentry health
      details.sentry = {
        configured: !!this.sentryService,
        healthy: this.sentryService?.isHealthy() || false,
      };
      
      // Check Prometheus health
      details.prometheus = {
        configured: !!this.metricsService,
        healthy: !!this.metricsService,
      };
      
      const allHealthy = details.sentry.healthy && details.prometheus.healthy;
      
      return {
        service: 'monitoring',
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime: performance.now() - start,
        details,
      };
      
    } catch (error) {
      return {
        service: 'monitoring',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: performance.now() - start,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallHealth(services: HealthCheckResult[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthy = services.filter(s => s.status === 'unhealthy');
    const degraded = services.filter(s => s.status === 'degraded');
    
    if (unhealthy.length > 0) return 'unhealthy';
    if (degraded.length > 0) return 'degraded';
    return 'healthy';
  }

  /**
   * Track business metric
   */
  trackBusinessMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (this.metricsService) {
      this.metricsService.trackBusinessMetric(name, value, tags);
    }
    
    if (this.sentryService) {
      this.sentryService.trackBusinessMetric(name, value, tags);
    }
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, userId: string, metadata?: Record<string, any>): void {
    if (this.sentryService) {
      this.sentryService.trackUserAction(action, userId, metadata);
    }
    
    if (this.metricsService) {
      this.metricsService.trackBusinessMetric('user_action', 1, {
        action,
        userId: userId.substring(0, 8), // Only first 8 chars for privacy
      });
    }
  }

  /**
   * Track error with context
   */
  trackError(error: Error, context?: string, tags?: Record<string, string>): void {
    if (this.sentryService) {
      this.sentryService.captureException(error, {
        component: context || 'api',
        tags,
      });
    }
    
    if (this.metricsService) {
      this.metricsService.trackError('error', context || 'api', error.name);
    }
  }

  /**
   * Track security event
   */
  trackSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details: Record<string, any>): void {
    if (this.sentryService) {
      this.sentryService.trackSecurityEvent(event, severity, details);
    }
    
    if (this.metricsService) {
      this.metricsService.trackBusinessMetric('security_event', 1, {
        event,
        severity,
      });
    }
  }

  /**
   * Track alert
   */
  trackAlert(alertName: string, severity: 'info' | 'warning' | 'error', details: Record<string, any>): void {
    if (this.sentryService) {
      this.sentryService.captureMessage(
        `Alert: ${alertName}`,
        severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info',
        { component: 'monitoring', extra: details }
      );
    }
    
    if (this.metricsService) {
      this.metricsService.trackBusinessMetric('alert', 1, {
        alert: alertName,
        severity,
      });
    }
  }

  /**
   * Set up Fastify integration
   */
  setupFastifyIntegration(fastify: FastifyInstance): void {
    console.log('🔧 Setting up Fastify monitoring integration...');
    
    // Add monitoring services to Fastify instance
    fastify.decorate('monitoring', this);
    
    if (this.metricsService) {
      fastify.decorate('metrics', this.metricsService);
    }
    
    if (this.sentryService) {
      fastify.decorate('sentry', this.sentryService);
      this.sentryService.setupFastifyIntegration(fastify);
    }

    // Add health check endpoint
    fastify.get('/health', async (request, reply) => {
      try {
        const health = await this.performHealthChecks();
        const statusCode = health.overall === 'healthy' ? 200 : 
                          health.overall === 'degraded' ? 200 : 503;
        
        reply.status(statusCode).send(health);
      } catch (error) {
        reply.status(503).send({
          overall: 'unhealthy',
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Add detailed health check endpoint
    fastify.get('/health/detailed', async (request, reply) => {
      const health = await this.performHealthChecks();
      reply.send(health);
    });

    // Add metrics endpoint (if Prometheus is enabled)
    if (this.metricsService) {
      fastify.get('/metrics', async (request, reply) => {
        reply.type('text/plain');
        return await this.metricsService.getMetrics();
      });
    }

    console.log('✅ Fastify monitoring integration complete');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down monitoring services...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.sentryService) {
      await this.sentryService.close();
    }
    
    console.log('✅ Monitoring services shut down');
  }

  /**
   * Get services status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      uptime: Date.now() - this.startTime,
      services: {
        sentry: !!this.sentryService,
        prometheus: !!this.metricsService,
        healthChecks: !!this.healthCheckInterval,
      },
      config: {
        serviceName: this.config.serviceName,
        version: this.config.version,
        environment: this.config.environment.NODE_ENV,
      },
    };
  }
}

/**
 * Create monitoring orchestrator instance
 */
export function createMonitoringOrchestrator(environment: Environment): MonitoringOrchestrator {
  const config: MonitoringConfig = {
    environment,
    serviceName: 'cryb-api',
    version: process.env.npm_package_version || '1.0.0',
    enableSentry: !!environment.SENTRY_DSN,
    enablePrometheus: environment.PROMETHEUS_ENABLED,
    enableJaeger: environment.JAEGER_ENABLED,
    enableHealthChecks: environment.HEALTH_CHECK_ENABLED,
  };

  return new MonitoringOrchestrator(config);
}

export default MonitoringOrchestrator;