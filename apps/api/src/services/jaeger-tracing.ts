import { initTracer, JaegerTracer } from 'jaeger-client';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import opentracing, { Span, SpanContext, Tags, FORMAT_HTTP_HEADERS } from 'opentracing';
import { randomUUID } from 'crypto';
import { hostname } from 'os';

/**
 * Jaeger Distributed Tracing Service
 * 
 * Provides comprehensive distributed tracing for the Cryb platform
 * with automatic instrumentation and crash-safe operation
 */
export class JaegerTracingService {
  private tracer: JaegerTracer;
  private fastify: FastifyInstance;
  private serviceName: string;
  private environment: string;
  private initialized: boolean = false;
  
  // Span tracking
  private activeSpans = new Map<string, Span>();
  private requestSpans = new Map<string, Span>();
  
  // Configuration
  private config = {
    sampling: {
      type: 'probabilistic',
      param: parseFloat(process.env.JAEGER_SAMPLING_RATE || '0.1')
    },
    reporter: {
      logSpans: process.env.NODE_ENV === 'development',
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: parseInt(process.env.JAEGER_AGENT_PORT || '6832'),
      collectorEndpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
      flushIntervalMs: 2000
    },
    tags: {
      'service.name': process.env.SERVICE_NAME || 'cryb-api',
      'service.version': process.env.SERVICE_VERSION || '1.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development',
      'host.name': hostname(),
      'platform': 'cryb'
    }
  };

  constructor(fastify: FastifyInstance, serviceName?: string) {
    this.fastify = fastify;
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'cryb-api';
    this.environment = process.env.NODE_ENV || 'development';
    this.initialize();
  }

  private initialize(): void {
    try {
      this.tracer = initTracer({
        serviceName: this.serviceName,
        sampler: this.config.sampling,
        reporter: this.config.reporter,
        tags: this.config.tags
      }, {
        logger: {
          info: (msg: string) => this.fastify.log.debug(`Jaeger: ${msg}`),
          error: (msg: string) => this.fastify.log.error(`Jaeger Error: ${msg}`)
        }
      }) as JaegerTracer;

      // Set global tracer
      opentracing.initGlobalTracer(this.tracer);
      
      this.initialized = true;
      this.fastify.log.info(`🔍 Jaeger tracing initialized for ${this.serviceName}`);
      
    } catch (error) {
      this.fastify.log.error('Failed to initialize Jaeger tracing:', error);
      this.initialized = false;
    }
  }

  // ==============================================
  // HTTP REQUEST TRACING
  // ==============================================

  /**
   * Create middleware for automatic HTTP request tracing
   */
  createHttpMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!this.initialized) return;

      const requestId = request.headers['x-request-id'] as string || randomUUID();
      const operationName = `${request.method} ${this.getRoutePath(request)}`;
      
      // Extract parent context from headers if available
      let parentContext: SpanContext | undefined;
      try {
        parentContext = this.tracer.extract(FORMAT_HTTP_HEADERS, request.headers) || undefined;
      } catch (error) {
        this.fastify.log.debug('No parent context found in headers');
      }

      // Create root span for the request
      const span = this.tracer.startSpan(operationName, {
        childOf: parentContext,
        tags: {
          [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
          [Tags.HTTP_METHOD]: request.method,
          [Tags.HTTP_URL]: request.url,
          [Tags.COMPONENT]: 'fastify',
          'request.id': requestId,
          'user.id': (request as any).userId || 'anonymous',
          'client.ip': request.ip,
          'user_agent': request.headers['user-agent'] || 'unknown'
        }
      });

      // Store span for access in route handlers
      this.requestSpans.set(requestId, span);
      (request as any).traceId = requestId;
      (request as any).span = span;

      // Set response headers for trace correlation
      reply.header('X-Trace-ID', this.getTraceId(span));
      reply.header('X-Request-ID', requestId);

      // Handle response completion
      reply.raw.on('finish', () => {
        try {
          span.setTag(Tags.HTTP_STATUS_CODE, reply.statusCode);
          
          if (reply.statusCode >= 400) {
            span.setTag(Tags.ERROR, true);
            span.setTag('error.status_code', reply.statusCode);
          }
          
          span.log({
            event: 'response_sent',
            'response.status_code': reply.statusCode,
            'response.size': reply.getHeader('content-length') || 0
          });
          
          span.finish();
          this.requestSpans.delete(requestId);
          
        } catch (error) {
          this.fastify.log.error('Error finishing HTTP span:', error);
        }
      });

      // Log request start
      span.log({
        event: 'request_received',
        'request.method': request.method,
        'request.url': request.url,
        'request.size': request.headers['content-length'] || 0
      });
    };
  }

  // ==============================================
  // CUSTOM SPAN CREATION
  // ==============================================

  /**
   * Start a new span with automatic context propagation
   */
  startSpan(
    operationName: string, 
    options: {
      childOf?: Span | SpanContext;
      tags?: Record<string, any>;
      references?: opentracing.Reference[];
    } = {}
  ): Span {
    if (!this.initialized) {
      return this.createNoOpSpan();
    }

    try {
      // If no parent specified, try to get current active span
      if (!options.childOf) {
        const activeSpan = this.getActiveSpan();
        if (activeSpan) {
          options.childOf = activeSpan;
        }
      }

      const span = this.tracer.startSpan(operationName, {
        childOf: options.childOf,
        tags: {
          'service.name': this.serviceName,
          'service.environment': this.environment,
          ...options.tags
        },
        references: options.references
      });

      // Store as active span
      const spanId = this.generateSpanId();
      this.activeSpans.set(spanId, span);
      (span as any).spanId = spanId;

      return span;
      
    } catch (error) {
      this.fastify.log.error('Error creating span:', error);
      return this.createNoOpSpan();
    }
  }

  /**
   * Finish a span with error handling
   */
  finishSpan(span: Span, finishTime?: number): void {
    if (!this.initialized || !span) return;

    try {
      span.finish(finishTime);
      
      // Remove from active spans
      const spanId = (span as any).spanId;
      if (spanId) {
        this.activeSpans.delete(spanId);
      }
    } catch (error) {
      this.fastify.log.error('Error finishing span:', error);
    }
  }

  // ==============================================
  // DATABASE OPERATION TRACING
  // ==============================================

  /**
   * Trace database operations
   */
  traceDbOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      table?: string;
      query?: string;
      parameters?: any[];
    } = {}
  ): Promise<T> {
    if (!this.initialized) {
      return operation();
    }

    const span = this.startSpan(`db.${operationName}`, {
      tags: {
        [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
        [Tags.COMPONENT]: 'prisma',
        [Tags.DB_TYPE]: 'postgresql',
        [Tags.DB_INSTANCE]: 'cryb',
        'db.table': options.table,
        'db.statement': options.query?.substring(0, 200) // Truncate long queries
      }
    });

    return this.executeWithSpan(span, operation, {
      logSuccess: (result) => ({
        event: 'db.query_completed',
        'db.rows_affected': Array.isArray(result) ? result.length : 1
      }),
      logError: (error) => ({
        event: 'db.query_failed',
        'db.error': error.message
      })
    });
  }

  // ==============================================
  // EXTERNAL API TRACING
  // ==============================================

  /**
   * Trace external API calls
   */
  traceExternalApiCall<T>(
    serviceName: string,
    operationName: string,
    operation: () => Promise<T>,
    options: {
      url?: string;
      method?: string;
      timeout?: number;
    } = {}
  ): Promise<T> {
    if (!this.initialized) {
      return operation();
    }

    const span = this.startSpan(`external.${serviceName}.${operationName}`, {
      tags: {
        [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
        [Tags.COMPONENT]: 'http-client',
        [Tags.HTTP_METHOD]: options.method || 'GET',
        [Tags.HTTP_URL]: options.url,
        'external.service': serviceName,
        'timeout': options.timeout
      }
    });

    return this.executeWithSpan(span, operation, {
      logSuccess: (result) => ({
        event: 'external_api_success',
        'response.size': JSON.stringify(result).length
      }),
      logError: (error) => ({
        event: 'external_api_error',
        'error.type': error.constructor.name,
        'error.message': error.message
      })
    });
  }

  // ==============================================
  // SOCKET.IO TRACING
  // ==============================================

  /**
   * Trace Socket.IO events
   */
  traceSocketEvent(
    eventName: string,
    operation: () => Promise<any>,
    options: {
      userId?: string;
      room?: string;
      socketId?: string;
    } = {}
  ): Promise<any> {
    if (!this.initialized) {
      return operation();
    }

    const span = this.startSpan(`socket.${eventName}`, {
      tags: {
        [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
        [Tags.COMPONENT]: 'socket.io',
        'socket.event': eventName,
        'socket.room': options.room,
        'socket.user_id': options.userId,
        'socket.id': options.socketId
      }
    });

    return this.executeWithSpan(span, operation, {
      logSuccess: () => ({
        event: 'socket_event_processed',
        'socket.event': eventName
      }),
      logError: (error) => ({
        event: 'socket_event_failed',
        'socket.event': eventName,
        'error.message': error.message
      })
    });
  }

  // ==============================================
  // BUSINESS OPERATION TRACING
  // ==============================================

  /**
   * Trace business operations
   */
  traceBusinessOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      userId?: string;
      entityId?: string;
      entityType?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<T> {
    if (!this.initialized) {
      return operation();
    }

    const span = this.startSpan(`business.${operationName}`, {
      tags: {
        [Tags.COMPONENT]: 'business-logic',
        'business.operation': operationName,
        'business.user_id': options.userId,
        'business.entity_id': options.entityId,
        'business.entity_type': options.entityType,
        ...options.metadata
      }
    });

    return this.executeWithSpan(span, operation, {
      logSuccess: (result) => ({
        event: 'business_operation_completed',
        'business.operation': operationName,
        'business.success': true
      }),
      logError: (error) => ({
        event: 'business_operation_failed',
        'business.operation': operationName,
        'business.error': error.message
      })
    });
  }

  // ==============================================
  // CACHE OPERATION TRACING
  // ==============================================

  /**
   * Trace cache operations
   */
  traceCacheOperation<T>(
    operation: string,
    key: string,
    cacheOperation: () => Promise<T>,
    options: {
      ttl?: number;
      namespace?: string;
    } = {}
  ): Promise<T> {
    if (!this.initialized) {
      return cacheOperation();
    }

    const span = this.startSpan(`cache.${operation}`, {
      tags: {
        [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
        [Tags.COMPONENT]: 'redis',
        'cache.operation': operation,
        'cache.key': key,
        'cache.namespace': options.namespace,
        'cache.ttl': options.ttl
      }
    });

    return this.executeWithSpan(span, cacheOperation, {
      logSuccess: (result) => ({
        event: 'cache_operation_success',
        'cache.hit': result !== null && result !== undefined,
        'cache.key': key
      }),
      logError: (error) => ({
        event: 'cache_operation_error',
        'cache.key': key,
        'error.message': error.message
      })
    });
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  /**
   * Execute operation with span context and automatic error handling
   */
  private async executeWithSpan<T>(
    span: Span,
    operation: () => Promise<T>,
    options: {
      logSuccess?: (result: T) => Record<string, any>;
      logError?: (error: Error) => Record<string, any>;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      // Log success
      if (options.logSuccess) {
        span.log({
          timestamp: Date.now(),
          ...options.logSuccess(result)
        });
      }
      
      span.setTag('success', true);
      this.finishSpan(span);
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Mark span as error
      span.setTag(Tags.ERROR, true);
      span.setTag('error.type', error.constructor.name);
      span.setTag('error.message', error.message);
      span.setTag('duration_ms', duration);
      
      // Log error details
      const errorLog = {
        timestamp: endTime,
        event: 'error',
        'error.object': error,
        'error.kind': error.constructor.name,
        'error.message': error.message,
        'error.stack': error.stack,
        level: 'error'
      };
      
      if (options.logError) {
        Object.assign(errorLog, options.logError(error));
      }
      
      span.log(errorLog);
      this.finishSpan(span);
      
      throw error;
    }
  }

  /**
   * Get the current active span
   */
  getActiveSpan(): Span | null {
    if (!this.initialized) return null;
    
    try {
      const activeSpan = this.tracer.scope().active();
      return activeSpan || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get span from request context
   */
  getRequestSpan(requestId: string): Span | null {
    return this.requestSpans.get(requestId) || null;
  }

  /**
   * Inject trace context into headers for downstream services
   */
  injectTraceHeaders(span: Span): Record<string, string> {
    if (!this.initialized) return {};
    
    try {
      const headers: Record<string, string> = {};
      this.tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
      return headers;
    } catch (error) {
      this.fastify.log.error('Error injecting trace headers:', error);
      return {};
    }
  }

  /**
   * Extract trace ID from span
   */
  getTraceId(span?: Span): string {
    if (!span || !this.initialized) return 'unknown';
    
    try {
      const context = span.context() as any;
      return context.traceId || context._traceId || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get route path for consistent naming
   */
  private getRoutePath(request: FastifyRequest): string {
    const routeOptions = (request as any).routeOptions;
    if (routeOptions && routeOptions.url) {
      return routeOptions.url;
    }
    
    // Fallback to URL with parameters normalized
    return request.url.replace(/\/\d+/g, '/:id')
                     .replace(/\?.*/, '');
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(): string {
    return randomUUID();
  }

  /**
   * Create a no-op span for when tracing is disabled
   */
  private createNoOpSpan(): Span {
    return {
      context: () => ({}),
      setTag: () => this.createNoOpSpan(),
      addTags: () => this.createNoOpSpan(),
      setOperationName: () => this.createNoOpSpan(),
      setBaggageItem: () => this.createNoOpSpan(),
      getBaggageItem: () => null,
      log: () => this.createNoOpSpan(),
      logEvent: () => this.createNoOpSpan(),
      finish: () => {},
      tracer: () => this.tracer
    } as any;
  }

  // ==============================================
  // HEALTH AND METRICS
  // ==============================================

  /**
   * Get tracing health status
   */
  getHealthStatus(): {
    initialized: boolean;
    activeSpans: number;
    requestSpans: number;
    serviceName: string;
    samplingRate: number;
  } {
    return {
      initialized: this.initialized,
      activeSpans: this.activeSpans.size,
      requestSpans: this.requestSpans.size,
      serviceName: this.serviceName,
      samplingRate: this.config.sampling.param
    };
  }

  /**
   * Close tracer and cleanup resources
   */
  async close(): Promise<void> {
    try {
      if (this.tracer) {
        await new Promise<void>((resolve) => {
          this.tracer.close(resolve);
        });
      }
      
      this.activeSpans.clear();
      this.requestSpans.clear();
      this.initialized = false;
      
      this.fastify.log.info('🔍 Jaeger tracing service closed');
      
    } catch (error) {
      this.fastify.log.error('Error closing Jaeger tracer:', error);
    }
  }
}

/**
 * Fastify plugin for Jaeger tracing
 */
export async function jaegerTracingPlugin(
  fastify: FastifyInstance,
  options: { serviceName?: string } = {}
) {
  const tracingService = new JaegerTracingService(fastify, options.serviceName);
  
  fastify.decorate('tracing', tracingService);
  
  // Add HTTP tracing middleware
  fastify.addHook('onRequest', tracingService.createHttpMiddleware());
  
  // Add cleanup on server close
  fastify.addHook('onClose', async () => {
    await tracingService.close();
  });
  
  console.log('🔍 Jaeger Distributed Tracing initialized');
  console.log('   - HTTP request/response tracing');
  console.log('   - Database operation tracing');
  console.log('   - External API call tracing');
  console.log('   - Socket.IO event tracing');
  console.log('   - Business operation tracing');
  console.log('   - Cache operation tracing');
  console.log('   - Automatic error capturing');
  console.log('   - Context propagation');
}

export { JaegerTracingService };