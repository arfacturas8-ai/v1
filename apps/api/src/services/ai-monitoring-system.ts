import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import * as Sentry from '@sentry/node';
import { AIIntegrationService } from './ai-integration';
import { EnhancedOpenAIService } from './enhanced-openai-integration';
import { ComputerVisionService } from './computer-vision';
import { NLPPipelineService } from './nlp-pipeline';
import { RecommendationEngine } from './recommendation-engine';

export interface MonitoringConfig {
  metrics: {
    enabledMetrics: string[];
    collectionInterval: number;
    retentionPeriod: number;
    aggregationLevels: ('minute' | 'hour' | 'day' | 'week')[];
  };
  alerts: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook' | 'dashboard')[];
    thresholds: {
      errorRate: number;
      responseTime: number;
      tokenUsage: number;
      costPerHour: number;
      queueLength: number;
      memoryUsage: number;
    };
    escalation: {
      levels: ('info' | 'warning' | 'critical')[];
      cooldownPeriod: number;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabledCategories: string[];
    structuredLogging: boolean;
    includeRequestData: boolean;
    sanitizeData: boolean;
  };
  performance: {
    enableProfiling: boolean;
    sampleRate: number;
    traceRequests: boolean;
    enableCaching: boolean;
    circuitBreaker: {
      enabled: boolean;
      failureThreshold: number;
      resetTimeout: number;
    };
  };
  compliance: {
    auditLogging: boolean;
    dataRetention: number;
    encryptLogs: boolean;
    gdprCompliant: boolean;
  };
}

export interface AIMetrics {
  timestamp: Date;
  service: string;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    tokenUsage: {
      total: number;
      prompt: number;
      completion: number;
    };
    cost: {
      total: number;
      breakdown: { [service: string]: number };
    };
    errors: {
      count: number;
      types: { [errorType: string]: number };
    };
    cacheStats: {
      hitRate: number;
      missRate: number;
      size: number;
    };
    queueStats: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
}

export interface AlertEvent {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'critical';
  service: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  context: {
    userId?: string;
    requestId?: string;
    endpoint?: string;
    additionalData?: any;
  };
  acknowledged: boolean;
  resolvedAt?: Date;
  escalated: boolean;
}

export interface PerformanceTrace {
  traceId: string;
  requestId: string;
  service: string;
  operation: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  spans: {
    name: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    tags: { [key: string]: any };
    logs: {
      timestamp: Date;
      level: string;
      message: string;
      data?: any;
    }[];
  }[];
  metadata: {
    userId?: string;
    tokenUsage?: number;
    cacheHit?: boolean;
    errorOccurred?: boolean;
  };
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  service: string;
  operation: string;
  error: {
    type: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: {
    userId?: string;
    requestId?: string;
    input?: any;
    environment: string;
    version: string;
  };
  impact: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    userAffected: boolean;
    systemAffected: boolean;
    dataLoss: boolean;
  };
  resolution: {
    status: 'open' | 'investigating' | 'resolved' | 'dismissed';
    assignedTo?: string;
    resolvedAt?: Date;
    resolution?: string;
  };
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    duration: number;
    output?: string;
    metadata?: any;
  }[];
  dependencies: {
    name: string;
    status: 'available' | 'degraded' | 'unavailable';
    latency?: number;
  }[];
  metadata: {
    version: string;
    uptime: number;
    lastRestart: Date;
  };
}

export class AIMonitoringSystem {
  private config: MonitoringConfig;
  private redis: Redis;
  private queue: Queue;
  
  // AI Services
  private aiServices: {
    aiIntegration?: AIIntegrationService;
    openaiService?: EnhancedOpenAIService;
    computerVision?: ComputerVisionService;
    nlpPipeline?: NLPPipelineService;
    recommendationEngine?: RecommendationEngine;
  } = {};
  
  // Monitoring data
  private metricsBuffer: Map<string, AIMetrics[]> = new Map();
  private alertsBuffer: AlertEvent[] = [];
  private errorReports: Map<string, ErrorReport> = new Map();
  private performanceTraces: Map<string, PerformanceTrace> = new Map();
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  
  // Circuit breakers
  private circuitBreakers: Map<string, {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime: Date;
    nextAttemptTime: Date;
  }> = new Map();
  
  // Active monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isMonitoring: boolean = false;
  
  constructor(moderationQueue: Queue) {
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    
    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
    
    // Initialize Sentry for error tracking
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: this.config.performance.sampleRate,
      });
    }
    
    this.startMonitoring();
    
    console.log('📊 AI Monitoring System initialized');
  }

  /**
   * Register AI services for monitoring
   */
  registerServices(services: {
    aiIntegration?: AIIntegrationService;
    openaiService?: EnhancedOpenAIService;
    computerVision?: ComputerVisionService;
    nlpPipeline?: NLPPipelineService;
    recommendationEngine?: RecommendationEngine;
  }): void {
    this.aiServices = { ...this.aiServices, ...services };
    console.log('📊 Registered AI services for monitoring:', Object.keys(services));
  }

  /**
   * Start comprehensive monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Start health checks
    this.startHealthChecks();
    
    // Start alert processing
    this.startAlertProcessing();
    
    // Start data persistence
    this.startDataPersistence();
    
    // Start cleanup tasks
    this.startCleanupTasks();
    
    console.log('✅ AI monitoring started successfully');
  }

  /**
   * Start metrics collection from all services
   */
  private startMetricsCollection(): void {
    const interval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Metrics collection failed:', error);
        this.reportError('metrics-collection', 'collectMetrics', error as Error);
      }
    }, this.config.metrics.collectionInterval);
    
    this.monitoringIntervals.set('metrics', interval);
  }

  /**
   * Collect metrics from all registered AI services
   */
  private async collectMetrics(): Promise<void> {
    const timestamp = new Date();
    
    for (const [serviceName, service] of Object.entries(this.aiServices)) {
      if (!service) continue;
      
      try {
        const serviceMetrics = await this.collectServiceMetrics(serviceName, service);
        
        if (serviceMetrics) {
          // Store in buffer
          if (!this.metricsBuffer.has(serviceName)) {
            this.metricsBuffer.set(serviceName, []);
          }
          this.metricsBuffer.get(serviceName)!.push(serviceMetrics);
          
          // Check for alerts
          await this.checkMetricAlerts(serviceName, serviceMetrics);
          
          // Store in Redis for real-time access
          await this.storeMetricsInRedis(serviceName, serviceMetrics);
        }
      } catch (error) {
        console.error(`Failed to collect metrics for ${serviceName}:`, error);
        this.reportError(serviceName, 'collectMetrics', error as Error);
      }
    }
    
    // Collect system metrics
    const systemMetrics = await this.collectSystemMetrics();
    await this.storeSystemMetrics(systemMetrics);
  }

  /**
   * Collect metrics from individual service
   */
  private async collectServiceMetrics(serviceName: string, service: any): Promise<AIMetrics | null> {
    try {
      const stats = service.getStats ? service.getStats() : null;
      if (!stats) return null;
      
      const metrics: AIMetrics = {
        timestamp: new Date(),
        service: serviceName,
        metrics: {
          totalRequests: stats.totalRequests || 0,
          successfulRequests: stats.successfulRequests || 0,
          failedRequests: stats.failedRequests || 0,
          averageResponseTime: stats.averageResponseTime || 0,
          p95ResponseTime: stats.p95ResponseTime || 0,
          p99ResponseTime: stats.p99ResponseTime || 0,
          tokenUsage: {
            total: stats.totalTokens || 0,
            prompt: stats.promptTokens || 0,
            completion: stats.completionTokens || 0
          },
          cost: {
            total: stats.totalCost || 0,
            breakdown: stats.costBreakdown || {}
          },
          errors: {
            count: stats.errorCount || 0,
            types: stats.errorTypes || {}
          },
          cacheStats: {
            hitRate: stats.cacheHitRate || 0,
            missRate: 1 - (stats.cacheHitRate || 0),
            size: stats.cacheSize || 0
          },
          queueStats: {
            pending: stats.queuePending || 0,
            processing: stats.queueProcessing || 0,
            completed: stats.queueCompleted || 0,
            failed: stats.queueFailed || 0
          }
        },
        systemMetrics: {
          cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // Convert to MB
          diskUsage: 0, // Would implement disk usage check
          networkIO: 0 // Would implement network I/O check
        }
      };
      
      return metrics;
    } catch (error) {
      console.error(`Failed to collect metrics for ${serviceName}:`, error);
      return null;
    }
  }

  /**
   * Collect system-wide metrics
   */
  private async collectSystemMetrics(): Promise<any> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        timestamp: new Date(),
        memory: {
          heapUsed: memUsage.heapUsed / 1024 / 1024,
          heapTotal: memUsage.heapTotal / 1024 / 1024,
          external: memUsage.external / 1024 / 1024,
          rss: memUsage.rss / 1024 / 1024
        },
        cpu: {
          user: cpuUsage.user / 1000000,
          system: cpuUsage.system / 1000000
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
      return null;
    }
  }

  /**
   * Check metrics against alert thresholds
   */
  private async checkMetricAlerts(serviceName: string, metrics: AIMetrics): Promise<void> {
    if (!this.config.alerts.enabled) return;
    
    const thresholds = this.config.alerts.thresholds;
    
    // Check error rate
    const errorRate = metrics.metrics.failedRequests / Math.max(metrics.metrics.totalRequests, 1);
    if (errorRate > thresholds.errorRate) {
      await this.createAlert({
        level: errorRate > thresholds.errorRate * 2 ? 'critical' : 'warning',
        service: serviceName,
        metric: 'error_rate',
        value: errorRate,
        threshold: thresholds.errorRate,
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`
      });
    }
    
    // Check response time
    if (metrics.metrics.averageResponseTime > thresholds.responseTime) {
      await this.createAlert({
        level: metrics.metrics.averageResponseTime > thresholds.responseTime * 2 ? 'critical' : 'warning',
        service: serviceName,
        metric: 'response_time',
        value: metrics.metrics.averageResponseTime,
        threshold: thresholds.responseTime,
        message: `High response time detected: ${metrics.metrics.averageResponseTime}ms`
      });
    }
    
    // Check token usage
    if (metrics.metrics.tokenUsage.total > thresholds.tokenUsage) {
      await this.createAlert({
        level: 'warning',
        service: serviceName,
        metric: 'token_usage',
        value: metrics.metrics.tokenUsage.total,
        threshold: thresholds.tokenUsage,
        message: `High token usage detected: ${metrics.metrics.tokenUsage.total} tokens`
      });
    }
    
    // Check cost
    if (metrics.metrics.cost.total > thresholds.costPerHour) {
      await this.createAlert({
        level: 'warning',
        service: serviceName,
        metric: 'cost',
        value: metrics.metrics.cost.total,
        threshold: thresholds.costPerHour,
        message: `High cost detected: $${metrics.metrics.cost.total.toFixed(2)}`
      });
    }
    
    // Check queue length
    const totalQueued = metrics.metrics.queueStats.pending + metrics.metrics.queueStats.processing;
    if (totalQueued > thresholds.queueLength) {
      await this.createAlert({
        level: totalQueued > thresholds.queueLength * 2 ? 'critical' : 'warning',
        service: serviceName,
        metric: 'queue_length',
        value: totalQueued,
        threshold: thresholds.queueLength,
        message: `High queue length detected: ${totalQueued} items`
      });
    }
    
    // Check memory usage
    if (metrics.systemMetrics.memoryUsage > thresholds.memoryUsage) {
      await this.createAlert({
        level: metrics.systemMetrics.memoryUsage > thresholds.memoryUsage * 1.5 ? 'critical' : 'warning',
        service: serviceName,
        metric: 'memory_usage',
        value: metrics.systemMetrics.memoryUsage,
        threshold: thresholds.memoryUsage,
        message: `High memory usage detected: ${metrics.systemMetrics.memoryUsage.toFixed(2)}MB`
      });
    }
  }

  /**
   * Create and process alerts
   */
  private async createAlert(alertData: {
    level: 'info' | 'warning' | 'critical';
    service: string;
    metric: string;
    value: number;
    threshold: number;
    message: string;
    context?: any;
  }): Promise<void> {
    const alert: AlertEvent = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      level: alertData.level,
      service: alertData.service,
      metric: alertData.metric,
      value: alertData.value,
      threshold: alertData.threshold,
      message: alertData.message,
      context: alertData.context || {},
      acknowledged: false,
      escalated: false
    };
    
    this.alertsBuffer.push(alert);
    
    // Send immediate notifications for critical alerts
    if (alert.level === 'critical') {
      await this.sendAlertNotification(alert);
    }
    
    // Store in database
    await this.storeAlert(alert);
    
    console.warn(`⚠️ Alert created: ${alert.message}`);
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotification(alert: AlertEvent): Promise<void> {
    try {
      const channels = this.config.alerts.channels;
      
      // Email notification
      if (channels.includes('email')) {
        await this.sendEmailAlert(alert);
      }
      
      // Slack notification
      if (channels.includes('slack')) {
        await this.sendSlackAlert(alert);
      }
      
      // Webhook notification
      if (channels.includes('webhook')) {
        await this.sendWebhookAlert(alert);
      }
      
      // Dashboard notification (real-time)
      if (channels.includes('dashboard')) {
        await this.sendDashboardAlert(alert);
      }
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Performance tracing
   */
  startTrace(operation: string, service: string, metadata?: any): string {
    if (!this.config.performance.traceRequests) {
      return '';
    }
    
    const traceId = this.generateTraceId();
    const trace: PerformanceTrace = {
      traceId,
      requestId: metadata?.requestId || traceId,
      service,
      operation,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      spans: [],
      metadata: metadata || {}
    };
    
    this.performanceTraces.set(traceId, trace);
    return traceId;
  }

  endTrace(traceId: string, metadata?: any): void {
    const trace = this.performanceTraces.get(traceId);
    if (!trace) return;
    
    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    
    if (metadata) {
      trace.metadata = { ...trace.metadata, ...metadata };
    }
    
    // Store trace if it meets sampling criteria
    if (this.shouldSampleTrace(trace)) {
      this.storeTrace(trace);
    }
    
    // Clean up
    this.performanceTraces.delete(traceId);
  }

  addSpan(traceId: string, spanName: string, duration: number, tags?: any): void {
    const trace = this.performanceTraces.get(traceId);
    if (!trace) return;
    
    const span = {
      name: spanName,
      startTime: new Date(Date.now() - duration),
      endTime: new Date(),
      duration,
      tags: tags || {},
      logs: []
    };
    
    trace.spans.push(span);
  }

  /**
   * Error reporting and tracking
   */
  reportError(
    service: string,
    operation: string,
    error: Error,
    context?: {
      userId?: string;
      requestId?: string;
      input?: any;
      metadata?: any;
    }
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      service,
      operation,
      error: {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      },
      context: {
        ...context,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      },
      impact: this.assessErrorImpact(error, service, operation),
      resolution: {
        status: 'open'
      }
    };
    
    this.errorReports.set(errorReport.id, errorReport);
    
    // Send to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          service,
          operation
        },
        contexts: {
          ai_context: context
        }
      });
    }
    
    // Store in database
    this.storeErrorReport(errorReport);
    
    // Create alert for critical errors
    if (errorReport.impact.severity === 'critical') {
      this.createAlert({
        level: 'critical',
        service,
        metric: 'error',
        value: 1,
        threshold: 0,
        message: `Critical error in ${service}.${operation}: ${error.message}`,
        context: {
          errorId: errorReport.id,
          userId: context?.userId
        }
      });
    }
    
    console.error(`❌ Error reported: ${service}.${operation}:`, error.message);
  }

  /**
   * Health checks for all services
   */
  private startHealthChecks(): void {
    const interval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('Health checks failed:', error);
      }
    }, 60000); // Every minute
    
    this.monitoringIntervals.set('health', interval);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [serviceName, service] of Object.entries(this.aiServices)) {
      if (!service) continue;
      
      try {
        const healthResult = await this.checkServiceHealth(serviceName, service);
        this.healthChecks.set(serviceName, healthResult);
        
        // Store in Redis for dashboard
        await this.storeHealthCheck(serviceName, healthResult);
        
        // Create alerts for unhealthy services
        if (healthResult.status === 'unhealthy') {
          await this.createAlert({
            level: 'critical',
            service: serviceName,
            metric: 'health',
            value: 0,
            threshold: 1,
            message: `Service ${serviceName} is unhealthy`
          });
        }
      } catch (error) {
        console.error(`Health check failed for ${serviceName}:`, error);
        this.reportError(serviceName, 'healthCheck', error as Error);
      }
    }
  }

  private async checkServiceHealth(serviceName: string, service: any): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = [];
    const dependencies: HealthCheckResult['dependencies'] = [];
    
    try {
      // Basic connectivity check
      const connectivityStart = Date.now();
      const stats = service.getStats ? service.getStats() : {};
      checks.push({
        name: 'connectivity',
        status: stats ? 'pass' : 'fail',
        duration: Date.now() - connectivityStart,
        output: stats ? 'Service responding' : 'Service not responding'
      });
      
      // Memory check
      const memoryStart = Date.now();
      const isMemoryHealthy = stats.memoryUsage ? stats.memoryUsage < 1000 : true; // < 1GB
      checks.push({
        name: 'memory',
        status: isMemoryHealthy ? 'pass' : 'warn',
        duration: Date.now() - memoryStart,
        output: `Memory usage: ${stats.memoryUsage || 0}MB`
      });
      
      // Cache check
      if (stats.cacheSize !== undefined) {
        const cacheStart = Date.now();
        const isCacheHealthy = stats.cacheHitRate > 0.3; // >30% hit rate
        checks.push({
          name: 'cache',
          status: isCacheHealthy ? 'pass' : 'warn',
          duration: Date.now() - cacheStart,
          output: `Cache hit rate: ${((stats.cacheHitRate || 0) * 100).toFixed(1)}%`
        });
      }
      
      // Check dependencies (Redis, OpenAI, etc.)
      await this.checkDependencies(serviceName, dependencies);
      
      // Determine overall status
      const hasFailures = checks.some(check => check.status === 'fail');
      const hasWarnings = checks.some(check => check.status === 'warn');
      const dependencyIssues = dependencies.some(dep => dep.status !== 'available');
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (hasFailures || dependencyIssues) {
        status = 'unhealthy';
      } else if (hasWarnings) {
        status = 'degraded';
      }
      
      return {
        service: serviceName,
        status,
        timestamp: new Date(),
        checks,
        dependencies,
        metadata: {
          version: '1.0.0',
          uptime: process.uptime(),
          lastRestart: new Date(Date.now() - process.uptime() * 1000)
        }
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'unhealthy',
        timestamp: new Date(),
        checks: [{
          name: 'health_check',
          status: 'fail',
          duration: Date.now() - startTime,
          output: error.message
        }],
        dependencies: [],
        metadata: {
          version: '1.0.0',
          uptime: process.uptime(),
          lastRestart: new Date(Date.now() - process.uptime() * 1000)
        }
      };
    }
  }

  /**
   * Circuit breaker implementation
   */
  async executeWithCircuitBreaker<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.config.performance.circuitBreaker.enabled) {
      return await operation();
    }
    
    const breaker = this.getCircuitBreaker(service);
    
    // Check circuit breaker state
    if (breaker.state === 'open') {
      if (Date.now() < breaker.nextAttemptTime.getTime()) {
        throw new Error(`Circuit breaker open for service: ${service}`);
      } else {
        breaker.state = 'half-open';
      }
    }
    
    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        breaker.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      // Failure - update circuit breaker
      breaker.failureCount++;
      breaker.lastFailureTime = new Date();
      
      if (breaker.failureCount >= this.config.performance.circuitBreaker.failureThreshold) {
        breaker.state = 'open';
        breaker.nextAttemptTime = new Date(
          Date.now() + this.config.performance.circuitBreaker.resetTimeout
        );
      }
      
      throw error;
    }
  }

  private getCircuitBreaker(service: string) {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(service, {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: new Date(),
        nextAttemptTime: new Date()
      });
    }
    return this.circuitBreakers.get(service)!;
  }

  /**
   * Data storage and persistence
   */
  private startDataPersistence(): void {
    const interval = setInterval(async () => {
      try {
        await this.persistData();
      } catch (error) {
        console.error('Data persistence failed:', error);
      }
    }, 60000); // Every minute
    
    this.monitoringIntervals.set('persistence', interval);
  }

  private async persistData(): Promise<void> {
    // Persist metrics
    for (const [service, metrics] of this.metricsBuffer.entries()) {
      if (metrics.length > 0) {
        await this.storeMetricsBatch(service, metrics);
        this.metricsBuffer.set(service, []); // Clear buffer
      }
    }
    
    // Persist alerts
    if (this.alertsBuffer.length > 0) {
      await this.storeAlertsBatch(this.alertsBuffer);
      this.alertsBuffer.length = 0; // Clear buffer
    }
  }

  /**
   * Data cleanup and retention management
   */
  private startCleanupTasks(): void {
    const interval = setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error('Data cleanup failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours
    
    this.monitoringIntervals.set('cleanup', interval);
  }

  private async cleanupOldData(): Promise<void> {
    const retentionPeriod = this.config.metrics.retentionPeriod;
    const cutoffDate = new Date(Date.now() - retentionPeriod);
    
    try {
      // Clean up old metrics
      await this.cleanupOldMetrics(cutoffDate);
      
      // Clean up old traces
      await this.cleanupOldTraces(cutoffDate);
      
      // Clean up resolved error reports
      await this.cleanupOldErrorReports(cutoffDate);
      
      // Clean up acknowledged alerts
      await this.cleanupOldAlerts(cutoffDate);
      
      console.log('🧹 Completed data cleanup');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  /**
   * API endpoints for monitoring data
   */
  async getMetrics(
    service?: string,
    timeRange?: { start: Date; end: Date },
    aggregation?: 'minute' | 'hour' | 'day'
  ): Promise<AIMetrics[]> {
    try {
      // Implementation would query database or Redis
      const metrics: AIMetrics[] = [];
      
      if (service && this.metricsBuffer.has(service)) {
        metrics.push(...this.metricsBuffer.get(service)!);
      } else {
        for (const serviceMetrics of this.metricsBuffer.values()) {
          metrics.push(...serviceMetrics);
        }
      }
      
      // Filter by time range
      if (timeRange) {
        return metrics.filter(m => 
          m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
        );
      }
      
      return metrics;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  }

  async getAlerts(
    service?: string,
    level?: 'info' | 'warning' | 'critical',
    acknowledged?: boolean
  ): Promise<AlertEvent[]> {
    try {
      let alerts = [...this.alertsBuffer];
      
      if (service) {
        alerts = alerts.filter(a => a.service === service);
      }
      
      if (level) {
        alerts = alerts.filter(a => a.level === level);
      }
      
      if (acknowledged !== undefined) {
        alerts = alerts.filter(a => a.acknowledged === acknowledged);
      }
      
      return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get alerts:', error);
      return [];
    }
  }

  async getHealthStatus(): Promise<{ [service: string]: HealthCheckResult }> {
    try {
      const status: { [service: string]: HealthCheckResult } = {};
      
      for (const [service, health] of this.healthChecks.entries()) {
        status[service] = health;
      }
      
      return status;
    } catch (error) {
      console.error('Failed to get health status:', error);
      return {};
    }
  }

  async getErrorReports(
    service?: string,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<ErrorReport[]> {
    try {
      let reports = Array.from(this.errorReports.values());
      
      if (service) {
        reports = reports.filter(r => r.service === service);
      }
      
      if (severity) {
        reports = reports.filter(r => r.impact.severity === severity);
      }
      
      return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get error reports:', error);
      return [];
    }
  }

  /**
   * Alert management
   */
  async acknowledgeAlert(alertId: string, userId?: string): Promise<void> {
    try {
      const alert = this.alertsBuffer.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.context.acknowledgedBy = userId;
        alert.context.acknowledgedAt = new Date();
        
        await this.updateAlert(alert);
        console.log(`✅ Alert ${alertId} acknowledged by ${userId || 'system'}`);
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }

  async resolveAlert(alertId: string, resolution?: string): Promise<void> {
    try {
      const alert = this.alertsBuffer.find(a => a.id === alertId);
      if (alert) {
        alert.resolvedAt = new Date();
        alert.context.resolution = resolution;
        
        await this.updateAlert(alert);
        console.log(`✅ Alert ${alertId} resolved`);
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }

  /**
   * Configuration management
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 Monitoring configuration updated');
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      metrics: {
        enabledMetrics: [
          'requests', 'errors', 'response_time', 'token_usage', 'cost',
          'cache_stats', 'queue_stats', 'system_metrics'
        ],
        collectionInterval: 30000, // 30 seconds
        retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
        aggregationLevels: ['minute', 'hour', 'day']
      },
      alerts: {
        enabled: true,
        channels: ['dashboard', 'webhook'],
        thresholds: {
          errorRate: 0.05, // 5%
          responseTime: 5000, // 5 seconds
          tokenUsage: 100000, // 100k tokens per hour
          costPerHour: 100, // $100 per hour
          queueLength: 1000, // 1000 items
          memoryUsage: 512 // 512MB
        },
        escalation: {
          levels: ['warning', 'critical'],
          cooldownPeriod: 300000 // 5 minutes
        }
      },
      logging: {
        level: 'info',
        enabledCategories: ['ai', 'monitoring', 'errors', 'performance'],
        structuredLogging: true,
        includeRequestData: false,
        sanitizeData: true
      },
      performance: {
        enableProfiling: false,
        sampleRate: 0.1, // 10%
        traceRequests: true,
        enableCaching: true,
        circuitBreaker: {
          enabled: true,
          failureThreshold: 5,
          resetTimeout: 60000 // 1 minute
        }
      },
      compliance: {
        auditLogging: true,
        dataRetention: 90 * 24 * 60 * 60 * 1000, // 90 days
        encryptLogs: true,
        gdprCompliant: true
      }
    };
  }

  /**
   * Utility methods
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private assessErrorImpact(error: Error, service: string, operation: string): ErrorReport['impact'] {
    // Simple impact assessment - would be more sophisticated in production
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (error.message.includes('timeout') || error.message.includes('rate limit')) {
      severity = 'medium';
    } else if (error.message.includes('authentication') || error.message.includes('authorization')) {
      severity = 'high';
    } else if (error.message.includes('critical') || error.message.includes('fatal')) {
      severity = 'critical';
    }
    
    return {
      severity,
      userAffected: severity !== 'low',
      systemAffected: severity === 'critical',
      dataLoss: false
    };
  }

  private shouldSampleTrace(trace: PerformanceTrace): boolean {
    return Math.random() < this.config.performance.sampleRate;
  }

  // Storage method stubs (would be implemented with actual database/Redis operations)
  private async storeMetricsInRedis(service: string, metrics: AIMetrics): Promise<void> {
    try {
      await this.redis.setex(
        `metrics:${service}:latest`,
        300, // 5 minutes
        JSON.stringify(metrics)
      );
    } catch (error) {
      console.error('Failed to store metrics in Redis:', error);
    }
  }

  private async storeSystemMetrics(metrics: any): Promise<void> {
    try {
      await this.redis.setex(
        'metrics:system:latest',
        300, // 5 minutes
        JSON.stringify(metrics)
      );
    } catch (error) {
      console.error('Failed to store system metrics:', error);
    }
  }

  private async storeAlert(alert: AlertEvent): Promise<void> {
    try {
      await this.redis.lpush('alerts:recent', JSON.stringify(alert));
      await this.redis.ltrim('alerts:recent', 0, 999); // Keep last 1000 alerts
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  private async updateAlert(alert: AlertEvent): Promise<void> {
    // Would update in database
  }

  private async storeTrace(trace: PerformanceTrace): Promise<void> {
    // Would store in database
  }

  private async storeErrorReport(report: ErrorReport): Promise<void> {
    // Would store in database
  }

  private async storeHealthCheck(service: string, health: HealthCheckResult): Promise<void> {
    try {
      await this.redis.setex(
        `health:${service}`,
        120, // 2 minutes
        JSON.stringify(health)
      );
    } catch (error) {
      console.error('Failed to store health check:', error);
    }
  }

  private async checkDependencies(service: string, dependencies: HealthCheckResult['dependencies']): Promise<void> {
    // Redis check
    try {
      const start = Date.now();
      await this.redis.ping();
      dependencies.push({
        name: 'redis',
        status: 'available',
        latency: Date.now() - start
      });
    } catch (error) {
      dependencies.push({
        name: 'redis',
        status: 'unavailable'
      });
    }
    
    // Database check
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dependencies.push({
        name: 'database',
        status: 'available',
        latency: Date.now() - start
      });
    } catch (error) {
      dependencies.push({
        name: 'database',
        status: 'unavailable'
      });
    }
  }

  private async sendEmailAlert(alert: AlertEvent): Promise<void> {
    // Would send email notification
  }

  private async sendSlackAlert(alert: AlertEvent): Promise<void> {
    // Would send Slack notification
  }

  private async sendWebhookAlert(alert: AlertEvent): Promise<void> {
    // Would send webhook notification
  }

  private async sendDashboardAlert(alert: AlertEvent): Promise<void> {
    // Would send real-time dashboard notification
  }

  private startAlertProcessing(): void {
    // Would implement alert processing logic
  }

  private async storeMetricsBatch(service: string, metrics: AIMetrics[]): Promise<void> {
    // Would store metrics batch in database
  }

  private async storeAlertsBatch(alerts: AlertEvent[]): Promise<void> {
    // Would store alerts batch in database
  }

  private async cleanupOldMetrics(cutoffDate: Date): Promise<void> {
    // Would clean up old metrics from database
  }

  private async cleanupOldTraces(cutoffDate: Date): Promise<void> {
    // Would clean up old traces from database
  }

  private async cleanupOldErrorReports(cutoffDate: Date): Promise<void> {
    // Would clean up old error reports from database
  }

  private async cleanupOldAlerts(cutoffDate: Date): Promise<void> {
    // Would clean up old alerts from database
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.isMonitoring = false;
      
      // Clear all intervals
      for (const [name, interval] of this.monitoringIntervals.entries()) {
        clearInterval(interval);
      }
      this.monitoringIntervals.clear();
      
      // Disconnect Redis
      await this.redis.disconnect();
      
      // Clear data structures
      this.metricsBuffer.clear();
      this.alertsBuffer.length = 0;
      this.errorReports.clear();
      this.performanceTraces.clear();
      this.healthChecks.clear();
      this.circuitBreakers.clear();
      
      console.log('🧹 AI Monitoring System cleaned up');
    } catch (error) {
      console.error('Failed to cleanup AI Monitoring System:', error);
    }
  }
}