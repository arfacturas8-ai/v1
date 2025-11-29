import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { performance } from 'perf_hooks';
import { hostname } from 'os';
import { randomUUID } from 'crypto';

/**
 * Enhanced Monitoring Service
 * 
 * World-class monitoring with distributed tracing, SLI/SLO tracking,
 * and advanced business metrics for CRYB Platform
 */
export class EnhancedMonitoringService {
  private register: Registry;
  private serviceName: string;
  private serviceVersion: string;
  private environment: string;
  
  // Core HTTP Metrics
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private httpRequestSize: Histogram<string>;
  private httpResponseSize: Histogram<string>;
  
  // SLI/SLO Metrics
  private sliAvailability: Histogram<string>;
  private sliLatency: Histogram<string>;
  private sliThroughput: Histogram<string>;
  private sloErrorBudget: Gauge<string>;
  
  // Distributed Tracing Metrics
  private tracingSpansTotal: Counter<string>;
  private tracingSpanDuration: Histogram<string>;
  private tracingTraceErrors: Counter<string>;
  private tracingActiveTraces: Gauge<string>;
  
  // Advanced Business Metrics
  private userRegistrationsTotal: Counter<string>;
  private userSessionDuration: Histogram<string>;
  private userRetention: Gauge<string>;
  private dailyActiveUsers: Gauge<string>;
  private monthlyActiveUsers: Gauge<string>;
  
  // Real-time Communication Metrics
  private messagesTotal: Counter<string>;
  private messagesFailed: Counter<string>;
  private messageLatency: Histogram<string>;
  private socketioConnected: Gauge<string>;
  private socketioConnectionAttempts: Counter<string>;
  private socketioConnectionErrors: Counter<string>;
  private socketioMessages: Counter<string>;
  private socketioMessageDuration: Histogram<string>;
  private socketioRooms: Gauge<string>;
  
  // Voice/Video Metrics
  private voiceCallsTotal: Counter<string>;
  private voiceCallDuration: Histogram<string>;
  private voiceCallsActive: Gauge<string>;
  private voiceCallQuality: Histogram<string>;
  private voiceCallsPoorQuality: Counter<string>;
  private videoStreamBitrate: Histogram<string>;
  private audioPacketLoss: Histogram<string>;
  private videoPacketLoss: Histogram<string>;
  
  // Authentication & Security Metrics
  private authAttempts: Counter<string>;
  private authFailures: Counter<string>;
  private authSuccessRate: Histogram<string>;
  private sessionCreated: Counter<string>;
  private sessionExpired: Counter<string>;
  private securityIncidents: Counter<string>;
  private suspiciousActivity: Counter<string>;
  
  // Database Performance Metrics
  private dbConnections: Gauge<string>;
  private dbQueries: Counter<string>;
  private dbQueryDuration: Histogram<string>;
  private dbSlowQueries: Counter<string>;
  private dbDeadlocks: Counter<string>;
  private dbLockWaits: Counter<string>;
  private dbErrors: Counter<string>;
  private dbConnectionPoolUtilization: Gauge<string>;
  
  // Cache Performance Metrics
  private cacheHits: Counter<string>;
  private cacheMisses: Counter<string>;
  private cacheSize: Gauge<string>;
  private cacheEvictions: Counter<string>;
  private cacheLatency: Histogram<string>;
  
  // File Upload & Storage Metrics
  private uploadsTotal: Counter<string>;
  private uploadSize: Histogram<string>;
  private uploadDuration: Histogram<string>;
  private uploadErrors: Counter<string>;
  private storageUtilization: Gauge<string>;
  
  // Search & Discovery Metrics
  private searchQueries: Counter<string>;
  private searchDuration: Histogram<string>;
  private searchResults: Histogram<string>;
  private searchErrors: Counter<string>;
  private searchRelevanceScore: Histogram<string>;
  
  // Notification System Metrics
  private notificationsSent: Counter<string>;
  private notificationsFailed: Counter<string>;
  private notificationLatency: Histogram<string>;
  private notificationDeliveryRate: Histogram<string>;
  
  // Error & Crash Tracking
  private errorsTotal: Counter<string>;
  private crashesTotal: Counter<string>;
  private errorRate: Histogram<string>;
  private recoveryTime: Histogram<string>;
  
  // Resource Utilization Metrics
  private cpuUtilization: Gauge<string>;
  private memoryUtilization: Gauge<string>;
  private diskUtilization: Gauge<string>;
  private networkThroughput: Gauge<string>;
  
  // Custom CRYB Platform Metrics
  private communityGrowthRate: Gauge<string>;
  private contentCreationRate: Counter<string>;
  private moderationActions: Counter<string>;
  private userEngagementScore: Histogram<string>;
  private platformHealth: Gauge<string>;

  constructor(options: {
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
  } = {}) {
    this.serviceName = options.serviceName || 'cryb-api';
    this.serviceVersion = options.serviceVersion || '1.0.0';
    this.environment = options.environment || 'production';
    
    this.register = new Registry();
    this.setupMetrics();
    this.setupDefaultMetrics();
    
    console.log('🚀 Enhanced Monitoring Service initialized');
    console.log(`   Service: ${this.serviceName}@${this.serviceVersion}`);
    console.log(`   Environment: ${this.environment}`);
  }
  
  private setupMetrics(): void {
    const commonLabels = {
      service: this.serviceName,
      version: this.serviceVersion,
      environment: this.environment,
      instance: hostname()
    };
    
    // ==============================================
    // CORE HTTP METRICS
    // ==============================================
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'user_agent', 'trace_id'],
      registers: [this.register]
    });
    
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'trace_id'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
      registers: [this.register]
    });
    
    this.httpRequestSize = new Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route', 'content_type'],
      buckets: [1, 100, 1000, 10000, 100000, 1000000, 10000000],
      registers: [this.register]
    });
    
    this.httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code', 'content_type'],
      buckets: [1, 100, 1000, 10000, 100000, 1000000, 10000000],
      registers: [this.register]
    });
    
    // ==============================================
    // SLI/SLO METRICS
    // ==============================================
    this.sliAvailability = new Histogram({
      name: 'cryb_sli_availability',
      help: 'Service availability SLI (1=available, 0=unavailable)',
      labelNames: ['service', 'endpoint'],
      buckets: [0, 0.5, 1],
      registers: [this.register]
    });
    
    this.sliLatency = new Histogram({
      name: 'cryb_sli_latency_seconds',
      help: 'Request latency SLI',
      labelNames: ['service', 'endpoint', 'percentile'],
      buckets: [0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.register]
    });
    
    this.sliThroughput = new Histogram({
      name: 'cryb_sli_throughput_rps',
      help: 'Request throughput SLI',
      labelNames: ['service', 'endpoint'],
      buckets: [1, 10, 50, 100, 500, 1000, 5000],
      registers: [this.register]
    });
    
    this.sloErrorBudget = new Gauge({
      name: 'cryb_slo_error_budget_remaining',
      help: 'SLO error budget remaining (0-1)',
      labelNames: ['service', 'slo_type', 'time_window'],
      registers: [this.register]
    });
    
    // ==============================================
    // DISTRIBUTED TRACING METRICS
    // ==============================================
    this.tracingSpansTotal = new Counter({
      name: 'cryb_tracing_spans_total',
      help: 'Total number of tracing spans created',
      labelNames: ['service', 'operation', 'span_kind'],
      registers: [this.register]
    });
    
    this.tracingSpanDuration = new Histogram({
      name: 'cryb_tracing_span_duration_seconds',
      help: 'Duration of tracing spans',
      labelNames: ['service', 'operation', 'span_kind'],
      buckets: [0.001, 0.01, 0.1, 1, 10],
      registers: [this.register]
    });
    
    this.tracingTraceErrors = new Counter({
      name: 'cryb_tracing_trace_errors_total',
      help: 'Total number of traces with errors',
      labelNames: ['service', 'error_type'],
      registers: [this.register]
    });
    
    this.tracingActiveTraces = new Gauge({
      name: 'cryb_tracing_active_traces',
      help: 'Number of currently active traces',
      labelNames: ['service'],
      registers: [this.register]
    });
    
    // ==============================================
    // ADVANCED BUSINESS METRICS
    // ==============================================
    this.userRegistrationsTotal = new Counter({
      name: 'cryb_user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['source', 'platform', 'referrer'],
      registers: [this.register]
    });
    
    this.userSessionDuration = new Histogram({
      name: 'cryb_user_session_duration_seconds',
      help: 'Duration of user sessions',
      labelNames: ['platform', 'user_type'],
      buckets: [60, 300, 900, 1800, 3600, 7200, 14400],
      registers: [this.register]
    });
    
    this.userRetention = new Gauge({
      name: 'cryb_user_retention_rate',
      help: 'User retention rate by cohort',
      labelNames: ['cohort', 'period'],
      registers: [this.register]
    });
    
    this.dailyActiveUsers = new Gauge({
      name: 'cryb_daily_active_users',
      help: 'Number of daily active users',
      registers: [this.register]
    });
    
    this.monthlyActiveUsers = new Gauge({
      name: 'cryb_monthly_active_users',
      help: 'Number of monthly active users',
      registers: [this.register]
    });
    
    // ==============================================
    // REAL-TIME COMMUNICATION METRICS
    // ==============================================
    this.messagesTotal = new Counter({
      name: 'cryb_messages_total',
      help: 'Total number of messages sent',
      labelNames: ['channel_type', 'message_type', 'user_type'],
      registers: [this.register]
    });
    
    this.messagesFailed = new Counter({
      name: 'cryb_messages_failed_total',
      help: 'Total number of failed messages',
      labelNames: ['channel_type', 'reason', 'retry_count'],
      registers: [this.register]
    });
    
    this.messageLatency = new Histogram({
      name: 'cryb_message_latency_seconds',
      help: 'Message delivery latency',
      labelNames: ['channel_type', 'message_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.register]
    });
    
    this.socketioConnected = new Gauge({
      name: 'socketio_connected_clients',
      help: 'Number of connected Socket.IO clients',
      labelNames: ['namespace', 'room'],
      registers: [this.register]
    });
    
    this.socketioConnectionAttempts = new Counter({
      name: 'socketio_connection_attempts_total',
      help: 'Total Socket.IO connection attempts',
      labelNames: ['transport', 'client_version'],
      registers: [this.register]
    });
    
    this.socketioConnectionErrors = new Counter({
      name: 'socketio_connection_errors_total',
      help: 'Total Socket.IO connection errors',
      labelNames: ['error_type', 'transport'],
      registers: [this.register]
    });
    
    this.socketioMessages = new Counter({
      name: 'socketio_messages_total',
      help: 'Total Socket.IO messages',
      labelNames: ['event', 'room', 'direction'],
      registers: [this.register]
    });
    
    this.socketioMessageDuration = new Histogram({
      name: 'socketio_message_duration_seconds',
      help: 'Socket.IO message processing duration',
      labelNames: ['event', 'handler'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.register]
    });
    
    this.socketioRooms = new Gauge({
      name: 'socketio_rooms_active',
      help: 'Number of active Socket.IO rooms',
      labelNames: ['namespace'],
      registers: [this.register]
    });
    
    // Continue with other metrics...
    this.setupVoiceVideoMetrics();
    this.setupAuthMetrics();
    this.setupDatabaseMetrics();
    this.setupCacheMetrics();
    this.setupFileMetrics();
    this.setupSearchMetrics();
    this.setupNotificationMetrics();
    this.setupErrorMetrics();
    this.setupResourceMetrics();
    this.setupCrybPlatformMetrics();
  }
  
  private setupVoiceVideoMetrics(): void {
    // Voice/Video Communication Metrics
    this.voiceCallsTotal = new Counter({
      name: 'cryb_voice_calls_total',
      help: 'Total voice/video calls started',
      labelNames: ['type', 'quality', 'participants'],
      registers: [this.register]
    });
    
    this.voiceCallDuration = new Histogram({
      name: 'cryb_voice_call_duration_seconds',
      help: 'Voice/video call duration',
      labelNames: ['type', 'participants_count'],
      buckets: [10, 30, 60, 300, 600, 1800, 3600, 7200],
      registers: [this.register]
    });
    
    this.voiceCallsActive = new Gauge({
      name: 'cryb_voice_calls_active',
      help: 'Currently active voice/video calls',
      labelNames: ['type', 'room_id'],
      registers: [this.register]
    });
    
    this.voiceCallQuality = new Histogram({
      name: 'cryb_voice_call_quality_score',
      help: 'Voice/video call quality score (0-10)',
      labelNames: ['type', 'codec'],
      buckets: [0, 2, 4, 6, 8, 10],
      registers: [this.register]
    });
    
    this.voiceCallsPoorQuality = new Counter({
      name: 'cryb_voice_calls_poor_quality_total',
      help: 'Voice/video calls with poor quality',
      labelNames: ['type', 'reason', 'codec'],
      registers: [this.register]
    });
    
    this.audioPacketLoss = new Histogram({
      name: 'cryb_audio_packet_loss_percent',
      help: 'Audio packet loss percentage',
      labelNames: ['codec', 'connection_type'],
      buckets: [0, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });
    
    this.videoPacketLoss = new Histogram({
      name: 'cryb_video_packet_loss_percent',
      help: 'Video packet loss percentage',
      labelNames: ['codec', 'resolution', 'connection_type'],
      buckets: [0, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });
    
    this.videoStreamBitrate = new Histogram({
      name: 'cryb_video_stream_bitrate_kbps',
      help: 'Video stream bitrate in kbps',
      labelNames: ['resolution', 'codec'],
      buckets: [100, 500, 1000, 2000, 5000, 10000],
      registers: [this.register]
    });
  }
  
  private setupAuthMetrics(): void {
    // Authentication & Security
    this.authAttempts = new Counter({
      name: 'cryb_auth_attempts_total',
      help: 'Total authentication attempts',
      labelNames: ['method', 'provider', 'ip_country', 'user_agent'],
      registers: [this.register]
    });
    
    this.authFailures = new Counter({
      name: 'cryb_auth_failures_total',
      help: 'Total authentication failures',
      labelNames: ['method', 'reason', 'ip_country', 'provider'],
      registers: [this.register]
    });
    
    this.authSuccessRate = new Histogram({
      name: 'cryb_auth_success_rate',
      help: 'Authentication success rate',
      labelNames: ['method', 'provider'],
      buckets: [0, 0.1, 0.5, 0.8, 0.9, 0.95, 0.99, 1],
      registers: [this.register]
    });
    
    this.sessionCreated = new Counter({
      name: 'cryb_sessions_created_total',
      help: 'Total user sessions created',
      labelNames: ['platform', 'auth_method'],
      registers: [this.register]
    });
    
    this.sessionExpired = new Counter({
      name: 'cryb_sessions_expired_total',
      help: 'Total user sessions expired',
      labelNames: ['platform', 'reason'],
      registers: [this.register]
    });
    
    this.securityIncidents = new Counter({
      name: 'cryb_security_incidents_total',
      help: 'Total security incidents detected',
      labelNames: ['type', 'severity', 'source_ip'],
      registers: [this.register]
    });
    
    this.suspiciousActivity = new Counter({
      name: 'cryb_suspicious_activity_total',
      help: 'Total suspicious activities detected',
      labelNames: ['type', 'risk_level', 'user_id'],
      registers: [this.register]
    });
  }
  
  private setupDatabaseMetrics(): void {
    // Database Performance
    this.dbConnections = new Gauge({
      name: 'cryb_db_connections_active',
      help: 'Active database connections',
      labelNames: ['database', 'pool'],
      registers: [this.register]
    });
    
    this.dbQueries = new Counter({
      name: 'cryb_db_queries_total',
      help: 'Total database queries executed',
      labelNames: ['operation', 'table', 'database'],
      registers: [this.register]
    });
    
    this.dbQueryDuration = new Histogram({
      name: 'cryb_db_query_duration_seconds',
      help: 'Database query execution time',
      labelNames: ['operation', 'table', 'database'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register]
    });
    
    this.dbSlowQueries = new Counter({
      name: 'cryb_db_slow_queries_total',
      help: 'Total slow database queries (>1s)',
      labelNames: ['operation', 'table', 'database'],
      registers: [this.register]
    });
    
    this.dbDeadlocks = new Counter({
      name: 'cryb_db_deadlocks_total',
      help: 'Total database deadlocks',
      labelNames: ['database', 'table1', 'table2'],
      registers: [this.register]
    });
    
    this.dbLockWaits = new Counter({
      name: 'cryb_db_lock_waits_total',
      help: 'Total database lock waits',
      labelNames: ['database', 'lock_type'],
      registers: [this.register]
    });
    
    this.dbErrors = new Counter({
      name: 'cryb_db_errors_total',
      help: 'Total database errors',
      labelNames: ['operation', 'error_type', 'database'],
      registers: [this.register]
    });
    
    this.dbConnectionPoolUtilization = new Gauge({
      name: 'cryb_db_connection_pool_utilization',
      help: 'Database connection pool utilization (0-1)',
      labelNames: ['database', 'pool'],
      registers: [this.register]
    });
  }
  
  private setupCacheMetrics(): void {
    // Cache Performance
    this.cacheHits = new Counter({
      name: 'cryb_cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['cache_type', 'key_pattern'],
      registers: [this.register]
    });
    
    this.cacheMisses = new Counter({
      name: 'cryb_cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['cache_type', 'key_pattern'],
      registers: [this.register]
    });
    
    this.cacheSize = new Gauge({
      name: 'cryb_cache_size_bytes',
      help: 'Cache size in bytes',
      labelNames: ['cache_type', 'instance'],
      registers: [this.register]
    });
    
    this.cacheEvictions = new Counter({
      name: 'cryb_cache_evictions_total',
      help: 'Total cache evictions',
      labelNames: ['cache_type', 'reason'],
      registers: [this.register]
    });
    
    this.cacheLatency = new Histogram({
      name: 'cryb_cache_operation_duration_seconds',
      help: 'Cache operation latency',
      labelNames: ['operation', 'cache_type'],
      buckets: [0.0001, 0.001, 0.01, 0.1, 1],
      registers: [this.register]
    });
  }
  
  private setupFileMetrics(): void {
    // File Upload & Storage
    this.uploadsTotal = new Counter({
      name: 'cryb_uploads_total',
      help: 'Total file uploads',
      labelNames: ['file_type', 'size_category', 'upload_method'],
      registers: [this.register]
    });
    
    this.uploadSize = new Histogram({
      name: 'cryb_upload_size_bytes',
      help: 'Upload file sizes',
      labelNames: ['file_type', 'compression'],
      buckets: [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000],
      registers: [this.register]
    });
    
    this.uploadDuration = new Histogram({
      name: 'cryb_upload_duration_seconds',
      help: 'Upload processing time',
      labelNames: ['file_type', 'processing_type'],
      buckets: [0.1, 1, 5, 10, 30, 60, 300],
      registers: [this.register]
    });
    
    this.uploadErrors = new Counter({
      name: 'cryb_upload_errors_total',
      help: 'Total upload errors',
      labelNames: ['file_type', 'error_type', 'stage'],
      registers: [this.register]
    });
    
    this.storageUtilization = new Gauge({
      name: 'cryb_storage_utilization_bytes',
      help: 'Storage utilization by type',
      labelNames: ['storage_type', 'location'],
      registers: [this.register]
    });
  }
  
  private setupSearchMetrics(): void {
    // Search & Discovery
    this.searchQueries = new Counter({
      name: 'cryb_search_queries_total',
      help: 'Total search queries',
      labelNames: ['type', 'source', 'user_type'],
      registers: [this.register]
    });
    
    this.searchDuration = new Histogram({
      name: 'cryb_search_duration_seconds',
      help: 'Search query execution time',
      labelNames: ['type', 'complexity'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.register]
    });
    
    this.searchResults = new Histogram({
      name: 'cryb_search_results_count',
      help: 'Number of search results returned',
      labelNames: ['type', 'query_type'],
      buckets: [0, 1, 5, 10, 25, 50, 100, 500, 1000],
      registers: [this.register]
    });
    
    this.searchErrors = new Counter({
      name: 'cryb_search_errors_total',
      help: 'Total search errors',
      labelNames: ['type', 'error_type', 'stage'],
      registers: [this.register]
    });
    
    this.searchRelevanceScore = new Histogram({
      name: 'cryb_search_relevance_score',
      help: 'Search result relevance scores',
      labelNames: ['type', 'algorithm'],
      buckets: [0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1],
      registers: [this.register]
    });
  }
  
  private setupNotificationMetrics(): void {
    // Notification System
    this.notificationsSent = new Counter({
      name: 'cryb_notifications_sent_total',
      help: 'Total notifications sent',
      labelNames: ['type', 'channel', 'priority'],
      registers: [this.register]
    });
    
    this.notificationsFailed = new Counter({
      name: 'cryb_notifications_failed_total',
      help: 'Total notification failures',
      labelNames: ['type', 'channel', 'reason'],
      registers: [this.register]
    });
    
    this.notificationLatency = new Histogram({
      name: 'cryb_notification_latency_seconds',
      help: 'Notification delivery latency',
      labelNames: ['type', 'channel', 'priority'],
      buckets: [0.1, 1, 5, 10, 30, 60, 300, 600],
      registers: [this.register]
    });
    
    this.notificationDeliveryRate = new Histogram({
      name: 'cryb_notification_delivery_rate',
      help: 'Notification delivery success rate',
      labelNames: ['type', 'channel'],
      buckets: [0, 0.5, 0.8, 0.9, 0.95, 0.99, 1],
      registers: [this.register]
    });
  }
  
  private setupErrorMetrics(): void {
    // Error & Crash Tracking
    this.errorsTotal = new Counter({
      name: 'cryb_errors_total',
      help: 'Total application errors',
      labelNames: ['level', 'service', 'error_type', 'error_code'],
      registers: [this.register]
    });
    
    this.crashesTotal = new Counter({
      name: 'cryb_crashes_total',
      help: 'Total application crashes',
      labelNames: ['service', 'crash_type', 'version'],
      registers: [this.register]
    });
    
    this.errorRate = new Histogram({
      name: 'cryb_error_rate',
      help: 'Application error rate',
      labelNames: ['service', 'time_window'],
      buckets: [0, 0.001, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register]
    });
    
    this.recoveryTime = new Histogram({
      name: 'cryb_recovery_time_seconds',
      help: 'Time to recover from errors',
      labelNames: ['error_type', 'recovery_method'],
      buckets: [1, 5, 10, 30, 60, 300, 600, 1800],
      registers: [this.register]
    });
  }
  
  private setupResourceMetrics(): void {
    // Resource Utilization
    this.cpuUtilization = new Gauge({
      name: 'cryb_cpu_utilization_percent',
      help: 'CPU utilization percentage',
      labelNames: ['core', 'process'],
      registers: [this.register]
    });
    
    this.memoryUtilization = new Gauge({
      name: 'cryb_memory_utilization_bytes',
      help: 'Memory utilization in bytes',
      labelNames: ['type', 'process'],
      registers: [this.register]
    });
    
    this.diskUtilization = new Gauge({
      name: 'cryb_disk_utilization_bytes',
      help: 'Disk utilization in bytes',
      labelNames: ['mount_point', 'disk_type'],
      registers: [this.register]
    });
    
    this.networkThroughput = new Gauge({
      name: 'cryb_network_throughput_bytes_per_second',
      help: 'Network throughput in bytes per second',
      labelNames: ['interface', 'direction'],
      registers: [this.register]
    });
  }
  
  private setupCrybPlatformMetrics(): void {
    // Custom CRYB Platform Metrics
    this.communityGrowthRate = new Gauge({
      name: 'cryb_community_growth_rate',
      help: 'Community growth rate',
      labelNames: ['period', 'metric_type'],
      registers: [this.register]
    });
    
    this.contentCreationRate = new Counter({
      name: 'cryb_content_creation_total',
      help: 'Total content created',
      labelNames: ['content_type', 'user_type', 'source'],
      registers: [this.register]
    });
    
    this.moderationActions = new Counter({
      name: 'cryb_moderation_actions_total',
      help: 'Total moderation actions taken',
      labelNames: ['action_type', 'reason', 'automated'],
      registers: [this.register]
    });
    
    this.userEngagementScore = new Histogram({
      name: 'cryb_user_engagement_score',
      help: 'User engagement scores',
      labelNames: ['user_type', 'activity_type'],
      buckets: [0, 0.2, 0.4, 0.6, 0.8, 1],
      registers: [this.register]
    });
    
    this.platformHealth = new Gauge({
      name: 'cryb_platform_health_score',
      help: 'Overall platform health score (0-1)',
      labelNames: ['component'],
      registers: [this.register]
    });
  }
  
  private setupDefaultMetrics(): void {
    // Collect default Node.js metrics with custom prefix
    collectDefaultMetrics({
      register: this.register,
      prefix: 'cryb_nodejs_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      eventLoopMonitoringPrecision: 5,
      labels: {
        service: this.serviceName,
        version: this.serviceVersion,
        environment: this.environment
      }
    });
  }
  
  // ==============================================
  // TRACING METHODS
  // ==============================================
  
  startTrace(operation: string, spanKind: string = 'internal'): string {
    const traceId = randomUUID();
    this.tracingSpansTotal.inc({ service: this.serviceName, operation, span_kind: spanKind });
    this.tracingActiveTraces.inc({ service: this.serviceName });
    
    return traceId;
  }
  
  endTrace(traceId: string, operation: string, duration: number, hasError: boolean = false): void {
    this.tracingSpanDuration.observe(
      { service: this.serviceName, operation, span_kind: 'internal' },
      duration / 1000
    );
    
    this.tracingActiveTraces.dec({ service: this.serviceName });
    
    if (hasError) {
      this.tracingTraceErrors.inc({ service: this.serviceName, error_type: 'execution_error' });
    }
  }
  
  // ==============================================
  // SLI/SLO TRACKING METHODS
  // ==============================================
  
  trackSLI(service: string, endpoint: string, isAvailable: boolean, latency: number): void {
    this.sliAvailability.observe({ service, endpoint }, isAvailable ? 1 : 0);
    this.sliLatency.observe({ service, endpoint, percentile: 'p95' }, latency);
  }
  
  updateErrorBudget(service: string, sloType: string, timeWindow: string, remaining: number): void {
    this.sloErrorBudget.set({ service, slo_type: sloType, time_window: timeWindow }, remaining);
  }
  
  // ==============================================
  // ENHANCED HTTP TRACKING METHODS
  // ==============================================
  
  trackHttpRequestWithTrace(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    traceId?: string,
    userAgent?: string,
    requestSize?: number,
    responseSize?: number,
    contentType?: string
  ): void {
    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
      user_agent: userAgent?.split(' ')[0] || 'unknown',
      trace_id: traceId || 'no-trace'
    };
    
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString(), trace_id: traceId || 'no-trace' },
      duration / 1000
    );
    
    if (requestSize) {
      this.httpRequestSize.observe({ method, route, content_type: contentType || 'unknown' }, requestSize);
    }
    
    if (responseSize) {
      this.httpResponseSize.observe(
        { method, route, status_code: statusCode.toString(), content_type: contentType || 'unknown' },
        responseSize
      );
    }
    
    // Track SLI metrics
    const isSuccessful = statusCode >= 200 && statusCode < 500;
    this.trackSLI(this.serviceName, route, isSuccessful, duration / 1000);
  }
  
  // ==============================================
  // METRICS ENDPOINT & UTILITIES
  // ==============================================
  
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
  
  getRegistry(): Registry {
    return this.register;
  }
  
  // Create enhanced middleware with tracing support
  createEnhancedMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const start = performance.now();
      const traceId = this.startTrace(`HTTP ${request.method} ${request.url}`);
      
      // Add trace ID to request context
      (request as any).traceId = traceId;
      
      reply.raw.on('finish', () => {
        const duration = performance.now() - start;
        const route = (request as any).routeOptions?.url || request.url;
        const method = request.method;
        const statusCode = reply.statusCode;
        
        const requestSize = request.headers['content-length'] ? 
          parseInt(request.headers['content-length']) : undefined;
        const responseSize = reply.getHeader('content-length') as number | undefined;
        const userAgent = request.headers['user-agent'];
        const contentType = reply.getHeader('content-type') as string;
        
        this.trackHttpRequestWithTrace(
          method, 
          route, 
          statusCode, 
          duration, 
          traceId, 
          userAgent,
          requestSize,
          responseSize,
          contentType
        );
        
        this.endTrace(traceId, `HTTP ${method} ${route}`, duration, statusCode >= 400);
      });
    };
  }
}

/**
 * Enhanced Fastify plugin for comprehensive monitoring
 */
export async function enhancedMonitoringPlugin(
  fastify: FastifyInstance,
  options: {
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
  } = {}
) {
  const monitoring = new EnhancedMonitoringService(options);
  
  fastify.decorate('monitoring', monitoring);
  
  // Add enhanced monitoring middleware
  fastify.addHook('onRequest', monitoring.createEnhancedMiddleware());
  
  // Enhanced metrics endpoint with additional metadata
  fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await monitoring.getMetrics();
  });
  
  // Health endpoint with detailed status
  fastify.get('/health', async (request, reply) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: options.serviceName || 'cryb-api',
      version: options.serviceVersion || '1.0.0',
      environment: options.environment || 'production',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    return health;
  });
  
  console.log('🚀 Enhanced Monitoring & Tracing Service initialized');
  console.log('   📊 Comprehensive metrics collection');
  console.log('   🔍 Distributed tracing support');
  console.log('   📈 SLI/SLO tracking');
  console.log('   💼 Advanced business metrics');
  console.log('   🔧 Resource utilization monitoring');
  console.log('   🛡️  Security & error tracking');
  console.log('   📱 CRYB Platform-specific metrics');
  console.log('   📈 Metrics endpoint: /metrics');
  console.log('   ❤️  Health endpoint: /health');
}

export default EnhancedMonitoringService;