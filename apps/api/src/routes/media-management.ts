import { FastifyPluginAsync } from "fastify";
import { authMiddleware } from "../middleware/auth";
import { EnhancedMinioService } from "../services/enhanced-minio";
import { EnhancedCDNIntegrationService } from "../services/enhanced-cdn-integration";

/**
 * Media Management API Routes
 * 
 * Advanced endpoints for:
 * - Media analytics and statistics  
 * - CDN cache management and purging
 * - Image optimization and transformation
 * - Responsive image generation
 * - Video streaming management
 * - Health monitoring and diagnostics
 * - Performance optimization
 */
const mediaManagementRoutes: FastifyPluginAsync = async (fastify) => {
  const minioService = (fastify as any).services.minio as EnhancedMinioService;
  const cdnService = (fastify as any).services.cdn as EnhancedCDNIntegrationService;

  /**
   * @swagger
   * /api/v1/media/analytics:
   *   get:
   *     tags: [media]
   *     summary: Get comprehensive media analytics
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: Media analytics retrieved successfully
   */
  fastify.get('/analytics', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['media'],
      summary: 'Get comprehensive media analytics',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const analytics: any = {
        timestamp: new Date().toISOString(),
        storage: {},
        cdn: {},
        performance: {}
      };

      // Get MinIO storage statistics
      if (minioService) {
        const storageStats = await minioService.getStorageStats();
        const healthCheck = await minioService.performHealthCheck();
        
        analytics.storage = {
          ...storageStats,
          health: healthCheck.status,
          buckets: Object.keys(minioService.getBuckets()),
          responseTime: healthCheck.details?.responseTime || 0
        };
      }

      // Get CDN statistics
      if (cdnService) {
        const cdnAnalytics = await cdnService.getAnalytics();
        analytics.cdn = {
          ...cdnAnalytics,
          timestamp: new Date().toISOString()
        };
      }

      // Calculate performance metrics
      analytics.performance = {
        cacheHitRate: analytics.cdn.performance?.cacheHitRate || 0,
        averageResponseTime: analytics.storage.responseTime,
        totalFiles: analytics.storage.totalFiles || 0,
        totalSize: analytics.storage.totalSize || 0,
        sizeMB: Math.round((analytics.storage.totalSize || 0) / 1024 / 1024),
        sizeGB: Math.round((analytics.storage.totalSize || 0) / 1024 / 1024 / 1024 * 100) / 100
      };

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

  /**
   * @swagger
   * /api/v1/media/health:
   *   get:
   *     tags: [media]
   *     summary: Get detailed health status of media services
   */
  fastify.get('/health', {
    schema: {
      tags: ['media'],
      summary: 'Get detailed health status of media services'
    }
  }, async (request, reply) => {
    try {
      const health: any = {
        timestamp: new Date().toISOString(),
        overall: 'healthy',
        services: {}
      };

      let healthyServices = 0;
      let totalServices = 0;

      // Check MinIO health
      if (minioService) {
        totalServices++;
        try {
          const minioHealth = await minioService.performHealthCheck();
          health.services.minio = minioHealth;
          
          if (minioHealth.status === 'healthy') {
            healthyServices++;
          }
        } catch (error) {
          health.services.minio = {
            status: 'unhealthy',
            error: error.message
          };
        }
      }

      // Check CDN health
      if (cdnService) {
        totalServices++;
        try {
          const cdnHealth = await cdnService.getAnalytics();
          health.services.cdn = {
            status: 'healthy',
            providers: cdnHealth.providers,
            performance: cdnHealth.performance
          };
          healthyServices++;
        } catch (error) {
          health.services.cdn = {
            status: 'unhealthy',
            error: error.message
          };
        }
      }

      // Calculate overall health
      const healthRatio = totalServices > 0 ? healthyServices / totalServices : 1;
      health.overall = healthRatio >= 0.8 ? 'healthy' : 
                     healthRatio >= 0.5 ? 'degraded' : 'unhealthy';
      
      health.summary = {
        totalServices,
        healthyServices,
        healthRatio: Math.round(healthRatio * 100)
      };

      const statusCode = health.overall === 'healthy' ? 200 : 503;
      reply.code(statusCode).send({
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

  /**
   * @swagger
   * /api/v1/media/optimize:
   *   post:
   *     tags: [media]
   *     summary: Optimize and transform images
   *     security:
   *       - Bearer: []
   */
  fastify.post('/optimize', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['media'],
      summary: 'Optimize and transform images',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['fileId'],
        properties: {
          fileId: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          quality: { type: 'number', minimum: 10, maximum: 100 },
          format: { type: 'string', enum: ['webp', 'avif', 'jpeg', 'png'] },
          generateVariants: { type: 'boolean' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { fileId, width, height, quality = 85, format, generateVariants = true } = request.body;
      const userId = request.userId;

      if (!minioService) {
        throw new Error('MinIO service not available');
      }

      // This is a simplified implementation
      // In production, you'd fetch the file, process it, and return optimized versions
      reply.send({
        success: true,
        message: 'Image optimization endpoint - implementation in progress',
        data: {
          fileId,
          requestedTransformations: { width, height, quality, format },
          generateVariants,
          userId
        }
      });

    } catch (error) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/v1/media/cdn/purge:
   *   post:
   *     tags: [media]
   *     summary: Purge CDN cache
   *     security:
   *       - Bearer: []
   */
  fastify.post('/cdn/purge', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['media'],
      summary: 'Purge CDN cache',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          urls: { 
            type: 'array', 
            items: { type: 'string' }
          },
          tags: { 
            type: 'array', 
            items: { type: 'string' }
          },
          patterns: { 
            type: 'array', 
            items: { type: 'string' }
          },
          recursive: { type: 'boolean' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const purgeRequest = request.body;
      const userId = request.userId;

      if (!cdnService) {
        throw new Error('CDN service not available');
      }

      const result = await cdnService.purgeCache(purgeRequest);

      reply.send({
        success: true,
        message: 'Cache purge completed',
        data: {
          ...result,
          requestedBy: userId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/v1/media/responsive-srcset:
   *   post:
   *     tags: [media]
   *     summary: Generate responsive image srcset
   *     security:
   *       - Bearer: []
   */
  fastify.post('/responsive-srcset', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['media'],
      summary: 'Generate responsive image srcset',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['fileId'],
        properties: {
          fileId: { type: 'string' },
          sizes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                width: { type: 'number' },
                descriptor: { type: 'string' }
              },
              required: ['width']
            }
          },
          format: { type: 'string', enum: ['webp', 'avif', 'auto'] },
          quality: { type: 'number', minimum: 10, maximum: 100 }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { fileId, sizes, format = 'auto', quality = 80 } = request.body;

      if (!cdnService) {
        throw new Error('CDN service not available');
      }

      const defaultSizes = [
        { width: 320, descriptor: '320w' },
        { width: 480, descriptor: '480w' },
        { width: 768, descriptor: '768w' },
        { width: 1024, descriptor: '1024w' },
        { width: 1200, descriptor: '1200w' }
      ];

      const srcSet = cdnService.generateResponsiveSrcSet(
        fileId,
        sizes || defaultSizes,
        { format: format as any, quality }
      );

      reply.send({
        success: true,
        data: {
          fileId,
          srcSet,
          sizes: sizes || defaultSizes,
          options: { format, quality }
        }
      });

    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/v1/media/batch-upload:
   *   post:
   *     tags: [media]
   *     summary: Batch upload multiple files with progress tracking
   *     security:
   *       - Bearer: []
   */
  fastify.post('/batch-upload', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['media'],
      summary: 'Batch upload multiple files with progress tracking',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request: any, reply) => {
    try {
      if (!request.isMultipart()) {
        throw new Error('Request must be multipart/form-data');
      }

      if (!cdnService) {
        throw new Error('CDN service not available');
      }

      const parts = request.parts();
      const files: Array<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
        options?: any;
      }> = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer();
          files.push({
            buffer,
            filename: part.filename,
            mimeType: part.mimetype,
            options: {
              generateVariants: true,
              bucketType: 'media'
            }
          });
        }
      }

      if (files.length === 0) {
        throw new Error('No files provided');
      }

      const userId = request.userId;
      let completedCount = 0;
      
      // Progress tracking
      const onProgress = (completed: number, total: number, current?: string) => {
        completedCount = completed;
        // In a real implementation, you might send this via WebSocket
        console.log(`Upload progress: ${completed}/${total} - ${current || 'processing...'}`);
      };

      const results = await cdnService.batchUpload(files, onProgress);

      const successful = results.filter(r => !(r instanceof Error));
      const failed = results.filter(r => r instanceof Error);

      reply.send({
        success: true,
        message: `Batch upload completed: ${successful.length} successful, ${failed.length} failed`,
        data: {
          successful: successful.length,
          failed: failed.length,
          results: successful,
          errors: failed.map((error, index) => ({
            index,
            filename: files[index]?.filename,
            error: error.message
          }))
        }
      });

    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/v1/media/storage/stats:
   *   get:
   *     tags: [media]
   *     summary: Get detailed storage statistics
   *     security:
   *       - Bearer: []
   */
  fastify.get('/storage/stats', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['media'],
      summary: 'Get detailed storage statistics',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      if (!minioService) {
        throw new Error('MinIO service not available');
      }

      const stats = await minioService.getStorageStats();
      const buckets = minioService.getBuckets();

      // Calculate additional metrics
      const totalSizeMB = Math.round(stats.totalSize / 1024 / 1024);
      const totalSizeGB = Math.round(stats.totalSize / 1024 / 1024 / 1024 * 100) / 100;

      const bucketStats = Object.entries(stats.buckets).map(([bucketType, data]) => ({
        type: bucketType,
        name: buckets[bucketType] || bucketType,
        fileCount: data.fileCount,
        totalSize: data.totalSize,
        sizeMB: Math.round(data.totalSize / 1024 / 1024),
        sizeGB: Math.round(data.totalSize / 1024 / 1024 / 1024 * 100) / 100,
        percentage: stats.totalSize > 0 ? Math.round((data.totalSize / stats.totalSize) * 100) : 0
      }));

      reply.send({
        success: true,
        data: {
          overview: {
            totalFiles: stats.totalFiles,
            totalSize: stats.totalSize,
            totalSizeMB,
            totalSizeGB
          },
          buckets: bucketStats,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });
};

export default mediaManagementRoutes;