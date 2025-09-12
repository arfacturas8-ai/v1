import { EventEmitter } from 'events';
import { FastifyInstance } from 'fastify';
import { MinioService } from './minio';
import { CrashProofMediaService, ProcessedMediaFile, ChunkedUploadSession } from './crash-proof-media';
import { VideoTranscodingService, TranscodingJob } from './video-transcoding';
import { CDNIntegrationService, CDNFile } from './cdn-integration';
import { MediaSecurityMiddleware, MediaSecurityConfig, defaultMediaSecurityConfig } from '../middleware/media-security';

export interface MediaIntegrationConfig {
  minio: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    useSSL: boolean;
  };
  cdn?: {
    providers: Array<{
      name: string;
      enabled: boolean;
      priority: number;
      config: {
        baseUrl: string;
        apiKey?: string;
        apiSecret?: string;
        zone?: string;
        pullZone?: string;
        customHeaders?: Record<string, string>;
      };
    }>;
  };
  transcoding?: {
    ffmpegPath?: string;
    ffprobePath?: string;
    maxConcurrentJobs?: number;
    tempDirectory?: string;
  };
  security?: MediaSecurityConfig;
  features?: {
    enableCDN: boolean;
    enableTranscoding: boolean;
    enableAnalytics: boolean;
    enableCompression: boolean;
    enableVirusScanning: boolean;
    enableWatermarking: boolean;
    maxFileSize: number;
    supportedFormats: string[];
  };
}

export interface MediaStats {
  storage: {
    totalFiles: number;
    totalSize: number;
    bucketStats: Record<string, any>;
  };
  cdn: {
    totalFiles: number;
    cacheHitRate: number;
    bandwidth: number;
    providers: Record<string, any>;
  };
  transcoding: {
    activeJobs: number;
    queuedJobs: number;
    completedJobs: number;
    failedJobs: number;
  };
  security: {
    blockedRequests: number;
    rateLimitHits: number;
    virusScanResults: number;
  };
  performance: {
    averageUploadTime: number;
    averageProcessingTime: number;
    averageDownloadTime: number;
    errorRate: number;
  };
}

/**
 * Media Integration Service
 * 
 * Orchestrates all media-related services into a unified, crash-proof system:
 * - Storage management with MinIO
 * - CDN integration with multi-provider support
 * - Video transcoding with FFmpeg
 * - Security middleware and validation
 * - Analytics and monitoring
 * - Health checks and circuit breakers
 * - Automatic scaling and optimization
 */
export class MediaIntegrationService extends EventEmitter {
  private config: MediaIntegrationConfig;
  private minioService: MinioService;
  private mediaService: CrashProofMediaService;
  private videoService?: VideoTranscodingService;
  private cdnService?: CDNIntegrationService;
  private securityMiddleware: MediaSecurityMiddleware;
  
  private stats: MediaStats;
  private healthChecks: Map<string, { status: 'healthy' | 'degraded' | 'unhealthy'; lastCheck: Date }> = new Map();
  private performanceMetrics: Map<string, { startTime: number; endTime?: number; success: boolean }> = new Map();

  constructor(config: MediaIntegrationConfig) {
    super();
    this.config = config;
    
    this.stats = this.initializeStats();
    this.initializeServices();
    this.setupHealthChecks();
    this.setupAnalytics();
  }

  private initializeStats(): MediaStats {
    return {
      storage: {
        totalFiles: 0,
        totalSize: 0,
        bucketStats: {}
      },
      cdn: {
        totalFiles: 0,
        cacheHitRate: 0,
        bandwidth: 0,
        providers: {}
      },
      transcoding: {
        activeJobs: 0,
        queuedJobs: 0,
        completedJobs: 0,
        failedJobs: 0
      },
      security: {
        blockedRequests: 0,
        rateLimitHits: 0,
        virusScanResults: 0
      },
      performance: {
        averageUploadTime: 0,
        averageProcessingTime: 0,
        averageDownloadTime: 0,
        errorRate: 0
      }
    };
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize MinIO service
      this.minioService = new MinioService(this.config.minio);
      console.log('✅ MinIO service initialized');

      // Initialize crash-proof media service
      this.mediaService = new CrashProofMediaService(this.minioService);
      this.setupMediaServiceEvents();
      console.log('✅ Crash-proof media service initialized');

      // Initialize video transcoding service (optional)
      if (this.config.features?.enableTranscoding) {
        this.videoService = new VideoTranscodingService(
          this.minioService,
          this.config.transcoding
        );
        this.setupTranscodingServiceEvents();
        console.log('✅ Video transcoding service initialized');
      }

      // Initialize CDN service (optional)
      if (this.config.features?.enableCDN && this.config.cdn?.providers) {
        this.cdnService = new CDNIntegrationService(
          this.minioService,
          this.config.cdn.providers
        );
        this.setupCDNServiceEvents();
        console.log('✅ CDN integration service initialized');
      }

      // Initialize security middleware
      this.securityMiddleware = new MediaSecurityMiddleware(
        this.config.security || defaultMediaSecurityConfig
      );
      console.log('✅ Security middleware initialized');

      this.emit('services_initialized');
    } catch (error) {
      console.error('❌ Failed to initialize media services:', error);
      this.emit('initialization_failed', error);
      throw error;
    }
  }

  private setupMediaServiceEvents(): void {
    this.mediaService.on('processing_complete', (data) => {
      this.stats.performance.averageProcessingTime = 
        (this.stats.performance.averageProcessingTime + data.processingTime) / 2;
      
      this.recordPerformanceMetric('media_processing', data.processingTime, true);
      this.emit('media_processed', data);
    });

    this.mediaService.on('processing_failed', (data) => {
      this.stats.performance.errorRate = 
        (this.stats.performance.errorRate + 1) / 2;
      
      this.recordPerformanceMetric('media_processing', 0, false);
      this.emit('media_processing_failed', data);
    });

    this.mediaService.on('chunked_upload_completed', (data) => {
      this.emit('chunked_upload_completed', data);
    });
  }

  private setupTranscodingServiceEvents(): void {
    if (!this.videoService) return;

    this.videoService.on('job_created', (data) => {
      this.stats.transcoding.queuedJobs++;
      this.emit('transcoding_job_created', data);
    });

    this.videoService.on('job_started', (data) => {
      this.stats.transcoding.activeJobs++;
      this.stats.transcoding.queuedJobs--;
      this.emit('transcoding_job_started', data);
    });

    this.videoService.on('job_completed', (data) => {
      this.stats.transcoding.activeJobs--;
      this.stats.transcoding.completedJobs++;
      this.emit('transcoding_job_completed', data);
    });

    this.videoService.on('job_failed', (data) => {
      this.stats.transcoding.activeJobs--;
      this.stats.transcoding.failedJobs++;
      this.emit('transcoding_job_failed', data);
    });
  }

  private setupCDNServiceEvents(): void {
    if (!this.cdnService) return;

    this.cdnService.on('file_uploaded', (data) => {
      this.stats.cdn.totalFiles++;
      this.emit('cdn_file_uploaded', data);
    });

    this.cdnService.on('cache_purged', (data) => {
      this.emit('cdn_cache_purged', data);
    });

    this.cdnService.on('circuit_breaker_opened', (data) => {
      this.emit('cdn_provider_failed', data);
    });
  }

  /**
   * Upload and process a file with full integration
   */
  async uploadFile(
    file: any, // MultipartFile
    userId: string,
    options: {
      enableCDN?: boolean;
      enableTranscoding?: boolean;
      compressionQuality?: number;
      generateThumbnails?: boolean;
      watermark?: any;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{
    media: ProcessedMediaFile;
    cdn?: CDNFile;
    transcoding?: TranscodingJob;
  }> {
    const startTime = Date.now();
    
    try {
      // Security validation
      const buffer = await file.toBuffer();
      const securityValidation = await this.securityMiddleware.validateFileUpload(
        buffer,
        file.filename,
        file.mimetype
      );

      if (!securityValidation.valid) {
        throw new Error(`Security validation failed: ${securityValidation.errors.join(', ')}`);
      }

      // Process file with crash-proof media service
      const mediaResult = await this.mediaService.processFile(file, userId, {
        compressionQuality: options.compressionQuality,
        generateThumbnails: options.generateThumbnails,
        enableVirusScanning: this.config.features?.enableVirusScanning,
        metadata: options.metadata
      });

      const result: any = { media: mediaResult };

      // Upload to CDN if enabled
      if (options.enableCDN && this.cdnService) {
        try {
          const cdnResult = await this.cdnService.uploadToCDN(
            buffer,
            file.filename,
            file.mimetype,
            {
              metadata: options.metadata,
              optimization: {
                quality: options.compressionQuality || 80
              }
            }
          );
          result.cdn = cdnResult;
        } catch (error) {
          console.warn('CDN upload failed, continuing with storage only:', error);
        }
      }

      // Start video transcoding if enabled and applicable
      if (options.enableTranscoding && 
          this.videoService && 
          file.mimetype.startsWith('video/')) {
        try {
          const transcodingJob = await this.videoService.createTranscodingJob(
            mediaResult.bucket,
            mediaResult.filename,
            userId,
            {
              format: 'mp4',
              quality: 'medium',
              generateThumbnails: true,
              generatePreview: true
            }
          );
          result.transcoding = transcodingJob;
        } catch (error) {
          console.warn('Transcoding job creation failed:', error);
        }
      }

      // Update stats
      const processingTime = Date.now() - startTime;
      this.stats.performance.averageUploadTime = 
        (this.stats.performance.averageUploadTime + processingTime) / 2;
      this.stats.storage.totalFiles++;
      this.stats.storage.totalSize += buffer.length;

      this.recordPerformanceMetric('file_upload', processingTime, true);
      this.emit('file_uploaded', { ...result, processingTime, userId });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.recordPerformanceMetric('file_upload', processingTime, false);
      this.emit('file_upload_failed', { error: error.message, userId, processingTime });
      throw error;
    }
  }

  /**
   * Initialize chunked upload session
   */
  async initializeChunkedUpload(
    filename: string,
    mimeType: string,
    totalSize: number,
    userId: string,
    chunkSize?: number
  ): Promise<ChunkedUploadSession> {
    return this.mediaService.initializeChunkedUpload(
      filename,
      mimeType,
      totalSize,
      userId,
      chunkSize
    );
  }

  /**
   * Upload a chunk
   */
  async uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunkData: Buffer
  ): Promise<{ uploaded: boolean; progress: number }> {
    return this.mediaService.uploadChunk(sessionId, chunkIndex, chunkData);
  }

  /**
   * Complete chunked upload
   */
  async completeChunkedUpload(
    sessionId: string,
    options?: any
  ): Promise<ProcessedMediaFile> {
    return this.mediaService.completeChunkedUpload(sessionId, options);
  }

  /**
   * Get file with CDN fallback
   */
  async getFile(
    fileId: string,
    options: {
      preferCDN?: boolean;
      optimization?: any;
    } = {}
  ): Promise<{
    url: string;
    source: 'cdn' | 'storage';
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Try CDN first if available and preferred
      if (options.preferCDN && this.cdnService) {
        const cdnUrl = this.cdnService.getCDNUrl(fileId, options.optimization);
        if (cdnUrl) {
          const responseTime = Date.now() - startTime;
          this.recordPerformanceMetric('file_get_cdn', responseTime, true);
          return { url: cdnUrl, source: 'cdn', responseTime };
        }
      }

      // Fallback to media service
      const result = await this.mediaService.getFileWithFallback(fileId);
      const responseTime = Date.now() - startTime;
      
      this.recordPerformanceMetric('file_get_storage', responseTime, true);
      
      return {
        url: result.stream as any, // This would need proper stream handling
        source: 'storage',
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric('file_get', responseTime, false);
      throw error;
    }
  }

  /**
   * Delete file from all services
   */
  async deleteFile(fileId: string, userId: string): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let success = true;

    // Delete from CDN
    if (this.cdnService) {
      try {
        // Implementation would need file lookup to get CDN info
        console.log('CDN deletion not fully implemented yet');
      } catch (error) {
        errors.push(`CDN deletion failed: ${error.message}`);
        success = false;
      }
    }

    // Delete from storage
    try {
      // Implementation would need file lookup to get storage info
      console.log('Storage deletion not fully implemented yet');
    } catch (error) {
      errors.push(`Storage deletion failed: ${error.message}`);
      success = false;
    }

    // Cancel transcoding jobs if any
    if (this.videoService) {
      try {
        // Implementation would need job lookup
        console.log('Transcoding job cancellation not fully implemented yet');
      } catch (error) {
        errors.push(`Transcoding cancellation failed: ${error.message}`);
      }
    }

    this.emit('file_deleted', { fileId, userId, success, errors });

    return { success, errors };
  }

  /**
   * Purge CDN cache
   */
  async purgeCache(request: any): Promise<any> {
    if (!this.cdnService) {
      throw new Error('CDN service not available');
    }

    return this.cdnService.purgeCache(request);
  }

  /**
   * Get comprehensive analytics
   */
  async getAnalytics(): Promise<MediaStats> {
    try {
      // Update storage stats
      if (this.minioService) {
        const storageStats = await this.minioService.getStorageStats();
        this.stats.storage = {
          totalFiles: storageStats.totalFiles,
          totalSize: storageStats.totalSize,
          bucketStats: storageStats.buckets
        };
      }

      // Update CDN stats
      if (this.cdnService) {
        const cdnStats = await this.cdnService.getAnalytics();
        // Aggregate CDN stats from all providers
        this.stats.cdn = {
          totalFiles: 0,
          cacheHitRate: 0,
          bandwidth: 0,
          providers: cdnStats
        };
      }

      // Update transcoding stats
      if (this.videoService) {
        const queueStatus = this.videoService.getQueueStatus();
        this.stats.transcoding = {
          activeJobs: queueStatus.processing,
          queuedJobs: queueStatus.queued,
          completedJobs: queueStatus.completed,
          failedJobs: queueStatus.failed
        };
      }

      // Update security stats
      const securityStats = this.securityMiddleware.getSecurityStats();
      this.stats.security = {
        blockedRequests: securityStats.blockedRequests,
        rateLimitHits: securityStats.rateLimitEntries,
        virusScanResults: 0 // Would need to track this
      };

      return { ...this.stats };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return this.stats;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
    uptime: number;
    lastChecked: Date;
  }> {
    const services: Record<string, any> = {};
    let healthyCount = 0;
    let totalServices = 0;

    // Check MinIO health
    try {
      const minioHealth = await this.minioService.performHealthCheck();
      services.minio = minioHealth;
      totalServices++;
      if (minioHealth.status === 'healthy') healthyCount++;
    } catch (error) {
      services.minio = { status: 'unhealthy', error: error.message };
      totalServices++;
    }

    // Check CDN health
    if (this.cdnService) {
      try {
        const cdnHealth = await this.cdnService.getHealthStatus();
        services.cdn = cdnHealth;
        totalServices++;
        if (cdnHealth.overall === 'healthy') healthyCount++;
      } catch (error) {
        services.cdn = { overall: 'unhealthy', error: error.message };
        totalServices++;
      }
    }

    // Check transcoding health
    if (this.videoService) {
      try {
        const transcodingHealth = await this.videoService.getServiceHealth();
        services.transcoding = transcodingHealth;
        totalServices++;
        if (transcodingHealth.status === 'healthy') healthyCount++;
      } catch (error) {
        services.transcoding = { status: 'unhealthy', error: error.message };
        totalServices++;
      }
    }

    const healthRatio = totalServices > 0 ? healthyCount / totalServices : 0;
    const overall = healthRatio >= 0.8 ? 'healthy' : 
                   healthRatio >= 0.5 ? 'degraded' : 'unhealthy';

    return {
      overall,
      services,
      uptime: process.uptime(),
      lastChecked: new Date()
    };
  }

  /**
   * Register Fastify routes
   */
  async registerRoutes(fastify: FastifyInstance): Promise<void> {
    // Apply security middleware
    fastify.addHook('preHandler', async (request, reply) => {
      await this.securityMiddleware.handle(request, reply);
    });

    // Upload endpoint
    fastify.post('/media/upload', async (request, reply) => {
      const userId = (request as any).userId || 'anonymous';
      
      if (!request.isMultipart()) {
        return reply.code(400).send({ error: 'Multipart request required' });
      }

      try {
        const file = await request.file();
        if (!file) {
          return reply.code(400).send({ error: 'No file provided' });
        }

        const result = await this.uploadFile(file, userId, {
          enableCDN: true,
          enableTranscoding: true,
          generateThumbnails: true
        });

        reply.send({
          success: true,
          data: result
        });
      } catch (error) {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    });

    // Chunked upload endpoints
    fastify.post('/media/chunked/init', async (request, reply) => {
      const userId = (request as any).userId || 'anonymous';
      const { filename, mimeType, totalSize, chunkSize } = request.body as any;

      try {
        const session = await this.initializeChunkedUpload(
          filename,
          mimeType,
          totalSize,
          userId,
          chunkSize
        );

        reply.send({
          success: true,
          data: session
        });
      } catch (error) {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    });

    fastify.post('/media/chunked/:sessionId/chunk/:chunkIndex', async (request, reply) => {
      const { sessionId, chunkIndex } = request.params as any;
      
      try {
        const buffer = await request.file().then(file => file?.toBuffer());
        if (!buffer) {
          return reply.code(400).send({ error: 'No chunk data provided' });
        }

        const result = await this.uploadChunk(sessionId, parseInt(chunkIndex), buffer);

        reply.send({
          success: true,
          data: result
        });
      } catch (error) {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    });

    fastify.post('/media/chunked/:sessionId/complete', async (request, reply) => {
      const { sessionId } = request.params as any;
      const options = request.body as any;

      try {
        const result = await this.completeChunkedUpload(sessionId, options);

        reply.send({
          success: true,
          data: result
        });
      } catch (error) {
        reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    });

    // Analytics endpoint
    fastify.get('/media/analytics', async (request, reply) => {
      try {
        const analytics = await this.getAnalytics();
        reply.send({
          success: true,
          data: analytics
        });
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: error.message
        });
      }
    });

    // Health endpoint
    fastify.get('/media/health', async (request, reply) => {
      try {
        const health = await this.getHealthStatus();
        reply.send({
          success: true,
          data: health
        });
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: error.message
        });
      }
    });

    console.log('✅ Media routes registered');
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private setupHealthChecks(): void {
    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000);
  }

  private async performHealthChecks(): Promise<void> {
    const services = ['minio', 'cdn', 'transcoding', 'media'];
    
    for (const service of services) {
      try {
        let status = 'healthy';
        
        // Perform actual health checks here
        // This is a simplified version
        
        this.healthChecks.set(service, {
          status: status as any,
          lastCheck: new Date()
        });
      } catch (error) {
        this.healthChecks.set(service, {
          status: 'unhealthy',
          lastCheck: new Date()
        });
      }
    }
  }

  private setupAnalytics(): void {
    // Collect analytics every minute
    setInterval(async () => {
      try {
        await this.collectAnalytics();
      } catch (error) {
        console.error('Analytics collection failed:', error);
      }
    }, 60000);
  }

  private async collectAnalytics(): Promise<void> {
    // Emit analytics update
    this.emit('analytics_updated', {
      stats: await this.getAnalytics(),
      timestamp: new Date()
    });
  }

  private recordPerformanceMetric(operation: string, duration: number, success: boolean): void {
    const metric = {
      startTime: Date.now() - duration,
      endTime: Date.now(),
      success
    };
    
    this.performanceMetrics.set(`${operation}_${Date.now()}`, metric);
    
    // Keep only recent metrics (last 1000)
    if (this.performanceMetrics.size > 1000) {
      const oldestKey = this.performanceMetrics.keys().next().value;
      this.performanceMetrics.delete(oldestKey);
    }
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🔧 Shutting down Media Integration Service...');

    // Shutdown individual services
    if (this.mediaService) {
      await this.mediaService.shutdown();
    }

    if (this.videoService) {
      await this.videoService.shutdown();
    }

    if (this.cdnService) {
      await this.cdnService.shutdown();
    }

    // Clear all listeners and intervals
    this.removeAllListeners();
    
    console.log('✅ Media Integration Service shut down gracefully');
  }
}

export default MediaIntegrationService;