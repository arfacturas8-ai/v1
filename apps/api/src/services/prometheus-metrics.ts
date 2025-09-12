import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { performance } from 'perf_hooks';
import { hostname } from 'os';

/**
 * Prometheus Metrics Service
 * 
 * Provides comprehensive application metrics in Prometheus format
 * for monitoring, alerting, and dashboards
 */
export class PrometheusMetricsService {
  private register: Registry;
  
  // HTTP Metrics
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private httpRequestSize: Histogram<string>;
  private httpResponseSize: Histogram<string>;
  
  // Business Metrics
  private userRegistrationsTotal: Counter<string>;
  private messagesTotal: Counter<string>;
  private messagesFailed: Counter<string>;
  private voiceCallsTotal: Counter<string>;
  private voiceCallDuration: Histogram<string>;
  private voiceCallsActive: Gauge<string>;
  private voiceCallsPoorQuality: Counter<string>;
  
  // Socket.IO Metrics
  private socketioConnected: Gauge<string>;
  private socketioConnectionAttempts: Counter<string>;
  private socketioConnectionErrors: Counter<string>;
  private socketioMessages: Counter<string>;
  private socketioMessageDuration: Histogram<string>;
  private socketioMessageQueueSize: Gauge<string>;
  
  // Authentication Metrics
  private authAttempts: Counter<string>;
  private authFailures: Counter<string>;
  
  // Database Metrics
  private dbConnections: Gauge<string>;
  private dbQueries: Counter<string>;
  private dbQueryDuration: Histogram<string>;
  private dbSlowQueries: Counter<string>;
  private dbErrors: Counter<string>;
  
  // Error Metrics  
  private errorsTotal: Counter<string>;
  private crashesTotal: Counter<string>;
  
  // File Upload Metrics
  private uploadsTotal: Counter<string>;
  private uploadSize: Histogram<string>;
  private uploadErrors: Counter<string>;
  
  // Cache Metrics
  private cacheHits: Counter<string>;
  private cacheMisses: Counter<string>;
  private cacheSize: Gauge<string>;
  
  // Search Metrics
  private searchQueries: Counter<string>;
  private searchDuration: Histogram<string>;
  private searchErrors: Counter<string>;
  
  // Notification Metrics
  private notificationsSent: Counter<string>;
  private notificationsFailed: Counter<string>;
  
  constructor() {
    this.register = new Registry();
    this.setupMetrics();
    this.setupDefaultMetrics();
  }
  
  private setupMetrics(): void {
    // ==============================================
    // HTTP METRICS
    // ==============================================
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    });
    
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register]
    });
    
    this.httpRequestSize = new Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [1, 100, 1000, 10000, 100000, 1000000],
      registers: [this.register]
    });
    
    this.httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [1, 100, 1000, 10000, 100000, 1000000],
      registers: [this.register]
    });
    
    // ==============================================
    // BUSINESS METRICS
    // ==============================================
    this.userRegistrationsTotal = new Counter({
      name: 'cryb_user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['source'],
      registers: [this.register]
    });
    
    this.messagesTotal = new Counter({
      name: 'cryb_messages_total',
      help: 'Total number of messages sent',
      labelNames: ['channel_type', 'message_type'],
      registers: [this.register]
    });
    
    this.messagesFailed = new Counter({
      name: 'cryb_messages_failed_total',
      help: 'Total number of failed messages',
      labelNames: ['channel_type', 'reason'],
      registers: [this.register]
    });
    
    this.voiceCallsTotal = new Counter({
      name: 'cryb_voice_calls_total',
      help: 'Total number of voice calls started',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    this.voiceCallDuration = new Histogram({
      name: 'cryb_voice_call_duration_seconds',
      help: 'Duration of voice calls in seconds',
      labelNames: ['type'],
      buckets: [10, 30, 60, 300, 600, 1800, 3600],
      registers: [this.register]
    });
    
    this.voiceCallsActive = new Gauge({
      name: 'cryb_voice_calls_active',
      help: 'Number of active voice calls',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    this.voiceCallsPoorQuality = new Counter({
      name: 'cryb_voice_calls_poor_quality_total',
      help: 'Total number of poor quality voice calls',
      labelNames: ['type', 'reason'],
      registers: [this.register]
    });
    
    // ==============================================
    // SOCKET.IO METRICS
    // ==============================================
    this.socketioConnected = new Gauge({
      name: 'socketio_connected_clients',
      help: 'Number of connected Socket.IO clients',
      registers: [this.register]
    });
    
    this.socketioConnectionAttempts = new Counter({
      name: 'socketio_connection_attempts_total',
      help: 'Total number of Socket.IO connection attempts',
      registers: [this.register]
    });
    
    this.socketioConnectionErrors = new Counter({
      name: 'socketio_connection_errors_total',
      help: 'Total number of Socket.IO connection errors',
      labelNames: ['error_type'],
      registers: [this.register]
    });
    
    this.socketioMessages = new Counter({
      name: 'socketio_messages_total',
      help: 'Total number of Socket.IO messages',
      labelNames: ['event', 'room'],
      registers: [this.register]
    });
    
    this.socketioMessageDuration = new Histogram({
      name: 'socketio_message_duration_seconds',
      help: 'Duration of Socket.IO message processing in seconds',
      labelNames: ['event'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.register]
    });
    
    this.socketioMessageQueueSize = new Gauge({
      name: 'socketio_message_queue_size',
      help: 'Number of messages in Socket.IO queue',
      registers: [this.register]
    });
    
    // ==============================================
    // AUTHENTICATION METRICS
    // ==============================================
    this.authAttempts = new Counter({
      name: 'cryb_auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['method', 'ip'],
      registers: [this.register]
    });
    
    this.authFailures = new Counter({
      name: 'cryb_auth_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['method', 'reason', 'ip'],
      registers: [this.register]
    });
    
    // ==============================================
    // DATABASE METRICS
    // ==============================================
    this.dbConnections = new Gauge({
      name: 'cryb_db_connections_active',
      help: 'Number of active database connections',
      registers: [this.register]
    });
    
    this.dbQueries = new Counter({
      name: 'cryb_db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
      registers: [this.register]
    });
    
    this.dbQueryDuration = new Histogram({
      name: 'cryb_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register]
    });
    
    this.dbSlowQueries = new Counter({
      name: 'cryb_db_slow_queries_total',
      help: 'Total number of slow database queries',
      labelNames: ['operation', 'table'],
      registers: [this.register]
    });
    
    this.dbErrors = new Counter({
      name: 'cryb_db_errors_total',
      help: 'Total number of database errors',
      labelNames: ['operation', 'error_type'],
      registers: [this.register]
    });
    
    // ==============================================
    // ERROR METRICS
    // ==============================================
    this.errorsTotal = new Counter({
      name: 'cryb_errors_total',
      help: 'Total number of application errors',
      labelNames: ['level', 'service', 'error_type'],
      registers: [this.register]
    });
    
    this.crashesTotal = new Counter({
      name: 'cryb_crashes_total',
      help: 'Total number of application crashes',
      labelNames: ['service', 'crash_type'],
      registers: [this.register]
    });
    
    // ==============================================
    // FILE UPLOAD METRICS
    // ==============================================
    this.uploadsTotal = new Counter({
      name: 'cryb_uploads_total',
      help: 'Total number of file uploads',
      labelNames: ['file_type'],
      registers: [this.register]
    });
    
    this.uploadSize = new Histogram({
      name: 'cryb_upload_size_bytes',
      help: 'Size of uploaded files in bytes',
      labelNames: ['file_type'],
      buckets: [1000, 10000, 100000, 1000000, 10000000, 100000000],
      registers: [this.register]
    });
    
    this.uploadErrors = new Counter({
      name: 'cryb_upload_errors_total',
      help: 'Total number of upload errors',
      labelNames: ['file_type', 'error_type'],
      registers: [this.register]
    });
    
    // ==============================================
    // CACHE METRICS
    // ==============================================
    this.cacheHits = new Counter({
      name: 'cryb_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.register]
    });
    
    this.cacheMisses = new Counter({
      name: 'cryb_cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.register]
    });
    
    this.cacheSize = new Gauge({
      name: 'cryb_cache_size_bytes',
      help: 'Current cache size in bytes',
      labelNames: ['cache_type'],
      registers: [this.register]
    });
    
    // ==============================================
    // SEARCH METRICS
    // ==============================================
    this.searchQueries = new Counter({
      name: 'cryb_search_queries_total',
      help: 'Total number of search queries',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    this.searchDuration = new Histogram({
      name: 'cryb_search_duration_seconds',
      help: 'Duration of search queries in seconds',
      labelNames: ['type'],
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register]
    });
    
    this.searchErrors = new Counter({
      name: 'cryb_search_errors_total',
      help: 'Total number of search errors',
      labelNames: ['type', 'error_type'],
      registers: [this.register]
    });
    
    // ==============================================
    // NOTIFICATION METRICS
    // ==============================================
    this.notificationsSent = new Counter({
      name: 'cryb_notifications_sent_total',
      help: 'Total number of notifications sent',
      labelNames: ['type', 'channel'],
      registers: [this.register]
    });
    
    this.notificationsFailed = new Counter({
      name: 'cryb_notifications_failed_total',
      help: 'Total number of failed notifications',
      labelNames: ['type', 'channel', 'reason'],
      registers: [this.register]
    });
  }
  
  private setupDefaultMetrics(): void {
    // Collect default Node.js metrics
    collectDefaultMetrics({
      register: this.register,
      prefix: 'cryb_nodejs_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      eventLoopMonitoringPrecision: 5
    });
  }
  
  // ==============================================
  // HTTP TRACKING METHODS
  // ==============================================
  
  trackHttpRequest(method: string, route: string, statusCode: number, duration: number, requestSize?: number, responseSize?: number): void {
    try {
      const labels = { method, route, status_code: statusCode.toString() };
      
      // Validate duration
      const validDuration = typeof duration === 'number' && !isNaN(duration) && isFinite(duration) ? duration : 0;
      
      this.httpRequestsTotal.inc(labels);
      this.httpRequestDuration.observe(labels, validDuration / 1000);
      
      if (requestSize && typeof requestSize === 'number' && !isNaN(requestSize) && isFinite(requestSize)) {
        this.httpRequestSize.observe({ method, route }, requestSize);
      }
      
      if (responseSize && typeof responseSize === 'number' && !isNaN(responseSize) && isFinite(responseSize)) {
        this.httpResponseSize.observe(labels, responseSize);
      }
    } catch (error) {
      console.warn('Error tracking HTTP request metrics:', error);
    }
  }
  
  // ==============================================
  // BUSINESS TRACKING METHODS
  // ==============================================
  
  trackUserRegistration(source: string = 'web'): void {
    this.userRegistrationsTotal.inc({ source });
  }
  
  trackMessage(channelType: string = 'text', messageType: string = 'user'): void {
    this.messagesTotal.inc({ channel_type: channelType, message_type: messageType });
  }
  
  trackMessageFailure(channelType: string = 'text', reason: string = 'unknown'): void {
    this.messagesFailed.inc({ channel_type: channelType, reason });
  }
  
  trackVoiceCall(type: string = 'voice'): void {
    this.voiceCallsTotal.inc({ type });
  }
  
  trackVoiceCallEnd(type: string = 'voice', duration: number): void {
    this.voiceCallDuration.observe({ type }, duration);
  }
  
  setActiveVoiceCalls(count: number, type: string = 'voice'): void {
    this.voiceCallsActive.set({ type }, count);
  }
  
  trackPoorQualityCall(type: string = 'voice', reason: string = 'packet_loss'): void {
    this.voiceCallsPoorQuality.inc({ type, reason });
  }
  
  // ==============================================
  // SOCKET.IO TRACKING METHODS
  // ==============================================
  
  setSocketIOConnected(count: number): void {
    this.socketioConnected.set(count);
  }
  
  trackSocketIOConnectionAttempt(): void {
    this.socketioConnectionAttempts.inc();
  }
  
  trackSocketIOConnectionError(errorType: string): void {
    this.socketioConnectionErrors.inc({ error_type: errorType });
  }
  
  trackSocketIOMessage(event: string, room: string = 'default'): void {
    this.socketioMessages.inc({ event, room });
  }
  
  trackSocketIOMessageDuration(event: string, duration: number): void {
    this.socketioMessageDuration.observe({ event }, duration / 1000);
  }
  
  setSocketIOMessageQueueSize(size: number): void {
    this.socketioMessageQueueSize.set(size);
  }
  
  // ==============================================
  // AUTH TRACKING METHODS
  // ==============================================
  
  trackAuthAttempt(method: string = 'password', ip: string = 'unknown'): void {
    this.authAttempts.inc({ method, ip });
  }
  
  trackAuthFailure(method: string = 'password', reason: string = 'invalid_credentials', ip: string = 'unknown'): void {
    this.authFailures.inc({ method, reason, ip });
  }
  
  // ==============================================
  // DATABASE TRACKING METHODS
  // ==============================================
  
  setDatabaseConnections(count: number): void {
    this.dbConnections.set(count);
  }
  
  trackDatabaseQuery(operation: string, table: string = 'unknown', duration: number): void {
    this.dbQueries.inc({ operation, table });
    this.dbQueryDuration.observe({ operation, table }, duration / 1000);
    
    // Track slow queries (>1 second)
    if (duration > 1000) {
      this.dbSlowQueries.inc({ operation, table });
    }
  }
  
  trackDatabaseError(operation: string, errorType: string): void {
    this.dbErrors.inc({ operation, error_type: errorType });
  }
  
  // ==============================================
  // ERROR TRACKING METHODS
  // ==============================================
  
  trackError(level: string = 'error', service: string = 'api', errorType: string = 'unknown'): void {
    this.errorsTotal.inc({ level, service, error_type: errorType });
  }
  
  trackCrash(service: string = 'api', crashType: string = 'unknown'): void {
    this.crashesTotal.inc({ service, crash_type: crashType });
  }
  
  // ==============================================
  // UPLOAD TRACKING METHODS
  // ==============================================
  
  trackUpload(fileType: string, size: number): void {
    this.uploadsTotal.inc({ file_type: fileType });
    this.uploadSize.observe({ file_type: fileType }, size);
  }
  
  trackUploadError(fileType: string, errorType: string): void {
    this.uploadErrors.inc({ file_type: fileType, error_type: errorType });
  }
  
  // ==============================================
  // CACHE TRACKING METHODS
  // ==============================================
  
  trackCacheHit(cacheType: string = 'redis'): void {
    this.cacheHits.inc({ cache_type: cacheType });
  }
  
  trackCacheMiss(cacheType: string = 'redis'): void {
    this.cacheMisses.inc({ cache_type: cacheType });
  }
  
  setCacheSize(size: number, cacheType: string = 'redis'): void {
    this.cacheSize.set({ cache_type: cacheType }, size);
  }
  
  // ==============================================
  // SEARCH TRACKING METHODS
  // ==============================================
  
  trackSearchQuery(type: string = 'text', duration: number): void {
    this.searchQueries.inc({ type });
    this.searchDuration.observe({ type }, duration / 1000);
  }
  
  trackSearchError(type: string = 'text', errorType: string): void {
    this.searchErrors.inc({ type, error_type: errorType });
  }
  
  // ==============================================
  // NOTIFICATION TRACKING METHODS
  // ==============================================
  
  trackNotificationSent(type: string, channel: string = 'push'): void {
    this.notificationsSent.inc({ type, channel });
  }
  
  trackNotificationFailed(type: string, channel: string = 'push', reason: string): void {
    this.notificationsFailed.inc({ type, channel, reason });
  }
  
  // ==============================================
  // METRICS ENDPOINT
  // ==============================================
  
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
  
  getRegistry(): Registry {
    return this.register;
  }
  
  // ==============================================
  // MIDDLEWARE INTEGRATION
  // ==============================================
  
  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const start = performance.now();
      
      reply.raw.on('finish', () => {
        const duration = performance.now() - start;
        const route = (request as any).routeOptions?.url || request.url;
        const method = request.method;
        const statusCode = reply.statusCode;
        
        // Extract content lengths
        const requestSize = request.headers['content-length'] ? 
          parseInt(request.headers['content-length']) : undefined;
        const responseSize = reply.getHeader('content-length') as number | undefined;
        
        this.trackHttpRequest(method, route, statusCode, duration, requestSize, responseSize);
      });
    };
  }
}

/**
 * Fastify plugin for Prometheus metrics
 */
export async function prometheusMetricsPlugin(
  fastify: FastifyInstance,
  options: { prefix?: string } = {}
) {
  const metrics = new PrometheusMetricsService();
  
  fastify.decorate('metrics', metrics);
  
  // Add metrics collection middleware
  fastify.addHook('onRequest', metrics.createMiddleware());
  
  // Add metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await metrics.getMetrics();
  });
  
  console.log('📊 Prometheus Metrics Service initialized');
  console.log('   - HTTP request/response metrics');
  console.log('   - Business KPI tracking');
  console.log('   - Socket.IO real-time metrics');
  console.log('   - Database performance metrics');
  console.log('   - Error and crash tracking');
  console.log('   - Authentication metrics');
  console.log('   - File upload metrics');
  console.log('   - Cache performance metrics');
  console.log('   - Search metrics');
  console.log('   - Notification metrics');
  console.log('   - Default Node.js metrics');
  console.log('   📈 Metrics endpoint: /metrics');
}

// PrometheusMetricsService already exported above