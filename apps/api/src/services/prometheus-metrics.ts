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
  
  // User Behavior Analytics
  private activeUsers: Gauge<string>;
  private userSessions: Counter<string>;
  private userSessionDuration: Histogram<string>;
  private pageViews: Counter<string>;
  private featureUsage: Counter<string>;
  private userRetention: Gauge<string>;
  private userEngagement: Histogram<string>;
  
  // Business Analytics
  private postsCreated: Counter<string>;
  private commentsCreated: Counter<string>;
  private reactionsCreated: Counter<string>;
  private serverMemberships: Counter<string>;
  private communityMemberships: Counter<string>;
  private messageVolume: Histogram<string>;
  private apiCalls: Counter<string>;
  private realtimeConnections: Gauge<string>;
  
  // Content Analytics
  private contentViews: Counter<string>;
  private contentShares: Counter<string>;
  private contentModerations: Counter<string>;
  private nftTransactions: Counter<string>;
  private cryptoTips: Counter<string>;
  
  // Performance Analytics
  private loadTimes: Histogram<string>;
  private errorRates: Gauge<string>;
  private systemHealth: Gauge<string>;
  
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
    
    // ==============================================
    // USER BEHAVIOR ANALYTICS
    // ==============================================
    this.activeUsers = new Gauge({
      name: 'cryb_active_users_total',
      help: 'Number of currently active users',
      labelNames: ['time_period'],
      registers: [this.register]
    });
    
    this.userSessions = new Counter({
      name: 'cryb_user_sessions_total',
      help: 'Total number of user sessions',
      labelNames: ['source', 'device_type'],
      registers: [this.register]
    });
    
    this.userSessionDuration = new Histogram({
      name: 'cryb_user_session_duration_seconds',
      help: 'Duration of user sessions in seconds',
      labelNames: ['source', 'device_type'],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800],
      registers: [this.register]
    });
    
    this.pageViews = new Counter({
      name: 'cryb_page_views_total',
      help: 'Total number of page views',
      labelNames: ['page', 'source'],
      registers: [this.register]
    });
    
    this.featureUsage = new Counter({
      name: 'cryb_feature_usage_total',
      help: 'Total feature usage count',
      labelNames: ['feature', 'user_type'],
      registers: [this.register]
    });
    
    this.userRetention = new Gauge({
      name: 'cryb_user_retention_rate',
      help: 'User retention rate percentage',
      labelNames: ['period', 'cohort'],
      registers: [this.register]
    });
    
    this.userEngagement = new Histogram({
      name: 'cryb_user_engagement_score',
      help: 'User engagement score',
      labelNames: ['user_type'],
      buckets: [0, 10, 25, 50, 75, 90, 100],
      registers: [this.register]
    });
    
    // ==============================================
    // BUSINESS ANALYTICS
    // ==============================================
    this.postsCreated = new Counter({
      name: 'cryb_posts_created_total',
      help: 'Total number of posts created',
      labelNames: ['community', 'type'],
      registers: [this.register]
    });
    
    this.commentsCreated = new Counter({
      name: 'cryb_comments_created_total',
      help: 'Total number of comments created',
      labelNames: ['community', 'type'],
      registers: [this.register]
    });
    
    this.reactionsCreated = new Counter({
      name: 'cryb_reactions_created_total',
      help: 'Total number of reactions created',
      labelNames: ['type', 'content_type'],
      registers: [this.register]
    });
    
    this.serverMemberships = new Counter({
      name: 'cryb_server_memberships_total',
      help: 'Total number of server memberships',
      labelNames: ['action'],
      registers: [this.register]
    });
    
    this.communityMemberships = new Counter({
      name: 'cryb_community_memberships_total',
      help: 'Total number of community memberships',
      labelNames: ['action'],
      registers: [this.register]
    });
    
    this.messageVolume = new Histogram({
      name: 'cryb_message_volume_per_hour',
      help: 'Number of messages per hour',
      labelNames: ['channel_type'],
      buckets: [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.register]
    });
    
    this.apiCalls = new Counter({
      name: 'cryb_api_calls_total',
      help: 'Total number of API calls',
      labelNames: ['endpoint', 'version'],
      registers: [this.register]
    });
    
    this.realtimeConnections = new Gauge({
      name: 'cryb_realtime_connections_total',
      help: 'Number of real-time connections',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    // ==============================================
    // CONTENT ANALYTICS
    // ==============================================
    this.contentViews = new Counter({
      name: 'cryb_content_views_total',
      help: 'Total number of content views',
      labelNames: ['content_type', 'source'],
      registers: [this.register]
    });
    
    this.contentShares = new Counter({
      name: 'cryb_content_shares_total',
      help: 'Total number of content shares',
      labelNames: ['content_type', 'platform'],
      registers: [this.register]
    });
    
    this.contentModerations = new Counter({
      name: 'cryb_content_moderations_total',
      help: 'Total number of content moderations',
      labelNames: ['action', 'content_type', 'reason'],
      registers: [this.register]
    });
    
    this.nftTransactions = new Counter({
      name: 'cryb_nft_transactions_total',
      help: 'Total number of NFT transactions',
      labelNames: ['type', 'collection'],
      registers: [this.register]
    });
    
    this.cryptoTips = new Counter({
      name: 'cryb_crypto_tips_total',
      help: 'Total number of crypto tips',
      labelNames: ['currency', 'amount_range'],
      registers: [this.register]
    });
    
    // ==============================================
    // PERFORMANCE ANALYTICS
    // ==============================================
    this.loadTimes = new Histogram({
      name: 'cryb_load_times_seconds',
      help: 'Page and component load times in seconds',
      labelNames: ['component', 'source'],
      buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register]
    });
    
    this.errorRates = new Gauge({
      name: 'cryb_error_rate_percentage',
      help: 'Error rate percentage',
      labelNames: ['service', 'endpoint'],
      registers: [this.register]
    });
    
    this.systemHealth = new Gauge({
      name: 'cryb_system_health_score',
      help: 'Overall system health score',
      labelNames: ['component'],
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
  // USER BEHAVIOR ANALYTICS TRACKING METHODS
  // ==============================================
  
  setActiveUsers(count: number, timePeriod: string = '1h'): void {
    this.activeUsers.set({ time_period: timePeriod }, count);
  }
  
  trackUserSession(source: string = 'web', deviceType: string = 'desktop'): void {
    this.userSessions.inc({ source, device_type: deviceType });
  }
  
  trackUserSessionEnd(duration: number, source: string = 'web', deviceType: string = 'desktop'): void {
    this.userSessionDuration.observe({ source, device_type: deviceType }, duration);
  }
  
  trackPageView(page: string, source: string = 'web'): void {
    this.pageViews.inc({ page, source });
  }
  
  trackFeatureUsage(feature: string, userType: string = 'regular'): void {
    this.featureUsage.inc({ feature, user_type: userType });
  }
  
  setUserRetention(rate: number, period: string = '30d', cohort: string = 'new'): void {
    this.userRetention.set({ period, cohort }, rate);
  }
  
  trackUserEngagement(score: number, userType: string = 'regular'): void {
    this.userEngagement.observe({ user_type: userType }, score);
  }
  
  // ==============================================
  // BUSINESS ANALYTICS TRACKING METHODS
  // ==============================================
  
  trackPostCreated(community: string = 'unknown', type: string = 'text'): void {
    this.postsCreated.inc({ community, type });
  }
  
  trackCommentCreated(community: string = 'unknown', type: string = 'text'): void {
    this.commentsCreated.inc({ community, type });
  }
  
  trackReactionCreated(type: string = 'like', contentType: string = 'post'): void {
    this.reactionsCreated.inc({ type, content_type: contentType });
  }
  
  trackServerMembership(action: string = 'join'): void {
    this.serverMemberships.inc({ action });
  }
  
  trackCommunityMembership(action: string = 'join'): void {
    this.communityMemberships.inc({ action });
  }
  
  trackMessageVolume(count: number, channelType: string = 'text'): void {
    this.messageVolume.observe({ channel_type: channelType }, count);
  }
  
  trackApiCall(endpoint: string, version: string = 'v1'): void {
    this.apiCalls.inc({ endpoint, version });
  }
  
  setRealtimeConnections(count: number, type: string = 'websocket'): void {
    this.realtimeConnections.set({ type }, count);
  }
  
  // ==============================================
  // CONTENT ANALYTICS TRACKING METHODS
  // ==============================================
  
  trackContentView(contentType: string, source: string = 'web'): void {
    this.contentViews.inc({ content_type: contentType, source });
  }
  
  trackContentShare(contentType: string, platform: string): void {
    this.contentShares.inc({ content_type: contentType, platform });
  }
  
  trackContentModeration(action: string, contentType: string, reason: string): void {
    this.contentModerations.inc({ action, content_type: contentType, reason });
  }
  
  trackNftTransaction(type: string, collection: string = 'unknown'): void {
    this.nftTransactions.inc({ type, collection });
  }
  
  trackCryptoTip(currency: string, amountRange: string): void {
    this.cryptoTips.inc({ currency, amount_range: amountRange });
  }
  
  // ==============================================
  // PERFORMANCE ANALYTICS TRACKING METHODS
  // ==============================================
  
  trackLoadTime(duration: number, component: string, source: string = 'web'): void {
    this.loadTimes.observe({ component, source }, duration);
  }
  
  setErrorRate(rate: number, service: string, endpoint: string = 'all'): void {
    this.errorRates.set({ service, endpoint }, rate);
  }
  
  setSystemHealth(score: number, component: string): void {
    this.systemHealth.set({ component }, score);
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