import { FastifyInstance } from 'fastify';
import { Client } from 'minio';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { optimizeImageForWeb } from '../services/image-processor';

export default async function cdnRoutes(fastify: FastifyInstance) {
  const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
  });

  // Cache for processed images
  const imageCache = new Map<string, { buffer: Buffer; contentType: string; etag: string; lastModified: Date }>();
  const CACHE_MAX_SIZE = 100; // Maximum number of cached images
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Helper function to generate cache key
  function generateCacheKey(bucket: string, objectName: string, params: any): string {
    const paramString = JSON.stringify(params);
    return createHash('md5').update(`${bucket}/${objectName}:${paramString}`).digest('hex');
  }

  // Helper function to clean cache
  function cleanCache() {
    if (imageCache.size > CACHE_MAX_SIZE) {
      const entries = Array.from(imageCache.entries());
      entries.sort((a, b) => a[1].lastModified.getTime() - b[1].lastModified.getTime());
      
      // Remove oldest entries
      const toRemove = entries.slice(0, Math.floor(CACHE_MAX_SIZE * 0.3));
      toRemove.forEach(([key]) => imageCache.delete(key));
    }
  }

  /**
   * Enhanced CDN endpoint with advanced optimization and caching
   */
  fastify.get('/cdn/*', async (request: any, reply) => {
    try {
      const path = request.params['*'];
      if (!path) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Parse the path: bucket/filename or bucket/userId/filename
      const parts = path.split('/');
      if (parts.length < 2) {
        return reply.code(404).send({ error: 'Invalid path' });
      }

      const bucket = parts[0];
      const objectName = parts.slice(1).join('/');
      
      // Parse optimization parameters
      const { 
        w, h, quality, format, 
        progressive, sharpen, blur,
        fit = 'inside',
        auto = 'compress,format'
      } = request.query as any;

      // Auto-detect best format based on user agent
      const userAgent = request.headers['user-agent'] || '';
      const acceptHeader = request.headers['accept'] || '';
      
      let autoFormat = format;
      if (auto?.includes('format') && !format) {
        if (acceptHeader.includes('image/avif')) {
          autoFormat = 'avif';
        } else if (acceptHeader.includes('image/webp')) {
          autoFormat = 'webp';
        }
      }

      // Generate cache key
      const cacheParams = { w, h, quality, format: autoFormat, progressive, sharpen, blur, fit };
      const cacheKey = generateCacheKey(bucket, objectName, cacheParams);

      // Check cache first
      const cached = imageCache.get(cacheKey);
      if (cached && (Date.now() - cached.lastModified.getTime()) < CACHE_TTL) {
        // Set headers
        reply.header('Cache-Control', 'public, max-age=31536000, immutable');
        reply.header('Content-Type', cached.contentType);
        reply.header('Content-Length', cached.buffer.length);
        reply.header('ETag', cached.etag);
        reply.header('X-Cache', 'HIT');
        
        // CORS headers
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        
        return reply.send(cached.buffer);
      }
      
      try {
        // Get object from MinIO
        const stream = await minioClient.getObject(bucket, objectName);
        const chunks: Buffer[] = [];
        
        await new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        
        let buffer = Buffer.concat(chunks);
        
        // Get file stats for headers
        const stat = await minioClient.statObject(bucket, objectName);
        let contentType = stat.metaData['content-type'] || 'application/octet-stream';
        
        // Handle conditional requests
        const ifNoneMatch = request.headers['if-none-match'];
        const etag = stat.etag;
        
        if (ifNoneMatch && ifNoneMatch === etag) {
          return reply.code(304).send();
        }
        
        // Apply image optimizations if requested and it's an image
        const isImage = contentType.startsWith('image/');
        const hasOptimizations = w || h || quality || autoFormat || progressive !== undefined || sharpen || blur;
        
        if (hasOptimizations && isImage) {
          try {
            const optimizationOptions: any = {
              removeMetadata: true,
              progressive: progressive !== 'false'
            };

            // Add dimension constraints
            if (w) optimizationOptions.width = parseInt(w);
            if (h) optimizationOptions.height = parseInt(h);
            if (quality) optimizationOptions.quality = Math.max(1, Math.min(100, parseInt(quality)));
            if (autoFormat) optimizationOptions.format = autoFormat;
            if (sharpen) optimizationOptions.sharpen = true;

            // Custom Sharp pipeline for advanced optimizations
            let pipeline = sharp(buffer);

            // Apply blur if requested
            if (blur) {
              const blurValue = Math.max(0.3, Math.min(1000, parseFloat(blur)));
              pipeline = pipeline.blur(blurValue);
            }

            // Apply resize with fit strategy
            if (optimizationOptions.width || optimizationOptions.height) {
              const resizeOptions: any = {
                withoutEnlargement: true,
                kernel: sharp.kernel.lanczos3
              };

              switch (fit) {
                case 'cover':
                  resizeOptions.fit = 'cover';
                  resizeOptions.position = 'center';
                  break;
                case 'contain':
                  resizeOptions.fit = 'inside';
                  break;
                case 'fill':
                  resizeOptions.fit = 'fill';
                  break;
                case 'scale-down':
                  resizeOptions.fit = 'inside';
                  resizeOptions.withoutEnlargement = true;
                  break;
                default:
                  resizeOptions.fit = 'inside';
              }

              pipeline = pipeline.resize(
                optimizationOptions.width,
                optimizationOptions.height,
                resizeOptions
              );
            }

            // Apply sharpening
            if (optimizationOptions.sharpen) {
              pipeline = pipeline.sharpen();
            }

            // Remove metadata for smaller file sizes
            if (optimizationOptions.removeMetadata) {
              pipeline = pipeline.removeProfile();
            }

            // Apply format-specific optimizations
            const outputQuality = optimizationOptions.quality || 85;
            switch (optimizationOptions.format) {
              case 'jpeg':
              case 'jpg':
                pipeline = pipeline.jpeg({
                  quality: outputQuality,
                  progressive: optimizationOptions.progressive,
                  mozjpeg: true,
                  trellisQuantisation: true,
                  overshootDeringing: true,
                  optimiseScans: true
                });
                contentType = 'image/jpeg';
                break;
              case 'png':
                pipeline = pipeline.png({
                  quality: outputQuality,
                  progressive: optimizationOptions.progressive,
                  compressionLevel: 9,
                  palette: true
                });
                contentType = 'image/png';
                break;
              case 'webp':
                pipeline = pipeline.webp({
                  quality: outputQuality,
                  effort: 6,
                  lossless: false,
                  smartSubsample: true
                });
                contentType = 'image/webp';
                break;
              case 'avif':
                pipeline = pipeline.avif({
                  quality: outputQuality,
                  effort: 6,
                  lossless: false,
                  chromaSubsampling: '4:2:0'
                });
                contentType = 'image/avif';
                break;
              default:
                // Apply auto-optimization for original format
                if (contentType.includes('jpeg')) {
                  pipeline = pipeline.jpeg({
                    quality: outputQuality,
                    progressive: optimizationOptions.progressive,
                    mozjpeg: true
                  });
                } else if (contentType.includes('png')) {
                  pipeline = pipeline.png({
                    quality: outputQuality,
                    progressive: optimizationOptions.progressive,
                    compressionLevel: 9
                  });
                } else if (contentType.includes('webp')) {
                  pipeline = pipeline.webp({
                    quality: outputQuality,
                    effort: 6
                  });
                }
            }
            
            buffer = await pipeline.toBuffer();
            
          } catch (optimizationError) {
            fastify.log.warn('Image optimization failed, serving original:', optimizationError);
            // Serve original image if optimization fails
          }
        }
        
        // Generate ETag for processed image
        const processedEtag = createHash('md5').update(buffer).digest('hex');
        
        // Cache the processed image
        if (isImage && hasOptimizations) {
          cleanCache();
          imageCache.set(cacheKey, {
            buffer,
            contentType,
            etag: processedEtag,
            lastModified: new Date()
          });
        }
        
        // Set comprehensive headers
        const maxAge = isImage ? 31536000 : 86400; // 1 year for images, 1 day for others
        reply.header('Cache-Control', `public, max-age=${maxAge}, immutable`);
        reply.header('Content-Type', contentType);
        reply.header('Content-Length', buffer.length);
        reply.header('ETag', processedEtag);
        reply.header('Last-Modified', new Date().toUTCString());
        reply.header('X-Cache', 'MISS');
        
        // CORS headers
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        reply.header('Access-Control-Max-Age', '86400');
        
        // Security headers
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');
        
        // Optimization headers
        if (hasOptimizations && isImage) {
          reply.header('X-Optimized', 'true');
          reply.header('X-Original-Size', stat.size?.toString() || 'unknown');
          reply.header('X-Compressed-Size', buffer.length.toString());
          const compressionRatio = stat.size ? Math.round((1 - buffer.length / stat.size) * 100) : 0;
          reply.header('X-Compression-Ratio', `${compressionRatio}%`);
        }
        
        return reply.send(buffer);
        
      } catch (error: any) {
        if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
          return reply.code(404).send({ error: 'File not found' });
        }
        throw error;
      }
      
    } catch (error) {
      fastify.log.error('CDN error:', error);
      return reply.code(500).send({ error: 'Failed to serve file' });
    }
  });

  /**
   * Generate signed URL for direct upload to MinIO
   */
  fastify.post('/cdn/signed-url', async (request: any, reply) => {
    const { bucket, fileName, contentType } = request.body;
    
    if (!bucket || !fileName) {
      return reply.code(400).send({ error: 'Bucket and fileName required' });
    }
    
    try {
      // Generate presigned URL for upload (expires in 1 hour)
      const url = await minioClient.presignedPutObject(
        bucket,
        fileName,
        3600 // 1 hour
      );
      
      return reply.send({
        uploadUrl: url,
        cdnUrl: `${process.env.CDN_BASE_URL || 'https://api.cryb.ai'}/cdn/${bucket}/${fileName}`,
        expires: new Date(Date.now() + 3600000).toISOString()
      });
    } catch (error) {
      fastify.log.error('Signed URL generation error:', error);
      return reply.code(500).send({ error: 'Failed to generate upload URL' });
    }
  });

  /**
   * Image transformation endpoint for on-the-fly processing
   */
  fastify.get('/cdn/transform/:bucket/*', async (request: any, reply) => {
    try {
      const { bucket } = request.params;
      const objectName = request.params['*'];
      const { operations } = request.query;

      if (!operations) {
        return reply.code(400).send({ error: 'Operations parameter required' });
      }

      // Parse operations (e.g., "resize_300x300,quality_80,format_webp")
      const ops = operations.split(',');
      const transformations: any = {};

      ops.forEach((op: string) => {
        const [operation, value] = op.split('_');
        switch (operation) {
          case 'resize':
            const [width, height] = value.split('x');
            transformations.w = width;
            transformations.h = height;
            break;
          case 'quality':
            transformations.quality = value;
            break;
          case 'format':
            transformations.format = value;
            break;
          case 'blur':
            transformations.blur = value;
            break;
          case 'sharpen':
            transformations.sharpen = 'true';
            break;
        }
      });

      // Redirect to main CDN endpoint with query parameters
      const queryString = new URLSearchParams(transformations).toString();
      const redirectUrl = `/cdn/${bucket}/${objectName}${queryString ? '?' + queryString : ''}`;
      
      return reply.redirect(301, redirectUrl);

    } catch (error) {
      fastify.log.error('Transform endpoint error:', error);
      return reply.code(500).send({ error: 'Failed to process transformation' });
    }
  });

  /**
   * Responsive image endpoint - generates srcset for different screen sizes
   */
  fastify.get('/cdn/responsive/:bucket/*', async (request: any, reply) => {
    try {
      const { bucket } = request.params;
      const objectName = request.params['*'];
      const { sizes = '320,640,960,1280,1920', format = 'webp', quality = '85' } = request.query;

      const sizeArray = sizes.split(',').map((s: string) => parseInt(s.trim()));
      const baseUrl = `${process.env.CDN_BASE_URL || 'https://api.cryb.ai'}/cdn/${bucket}/${objectName}`;

      const srcset = sizeArray.map(size => 
        `${baseUrl}?w=${size}&format=${format}&quality=${quality} ${size}w`
      ).join(', ');

      const responsiveData = {
        src: `${baseUrl}?w=960&format=${format}&quality=${quality}`,
        srcset,
        sizes: '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 960px) 960px, (max-width: 1280px) 1280px, 1920px',
        formats: {
          webp: sizeArray.map(size => `${baseUrl}?w=${size}&format=webp&quality=${quality} ${size}w`).join(', '),
          avif: sizeArray.map(size => `${baseUrl}?w=${size}&format=avif&quality=${quality} ${size}w`).join(', '),
          jpeg: sizeArray.map(size => `${baseUrl}?w=${size}&format=jpeg&quality=${quality} ${size}w`).join(', ')
        }
      };

      return reply.send({
        success: true,
        data: responsiveData
      });

    } catch (error) {
      fastify.log.error('Responsive endpoint error:', error);
      return reply.code(500).send({ error: 'Failed to generate responsive data' });
    }
  });

  /**
   * Cache management endpoints
   */
  fastify.get('/cdn/cache/stats', async (request, reply) => {
    return reply.send({
      success: true,
      data: {
        cacheSize: imageCache.size,
        maxSize: CACHE_MAX_SIZE,
        utilizationPercentage: Math.round((imageCache.size / CACHE_MAX_SIZE) * 100),
        ttl: CACHE_TTL
      }
    });
  });

  fastify.delete('/cdn/cache/clear', async (request, reply) => {
    imageCache.clear();
    return reply.send({
      success: true,
      message: 'Cache cleared successfully'
    });
  });

  fastify.delete('/cdn/cache/:key', async (request: any, reply) => {
    const { key } = request.params;
    const deleted = imageCache.delete(key);
    
    return reply.send({
      success: true,
      deleted,
      message: deleted ? 'Cache entry deleted' : 'Cache entry not found'
    });
  });

  /**
   * Health check for CDN with detailed status
   */
  fastify.get('/cdn/health', async (request, reply) => {
    try {
      const startTime = Date.now();
      const buckets = await minioClient.listBuckets();
      const responseTime = Date.now() - startTime;
      
      return reply.send({ 
        status: 'healthy',
        responseTime,
        buckets: buckets.length,
        cache: {
          size: imageCache.size,
          utilization: Math.round((imageCache.size / CACHE_MAX_SIZE) * 100)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return reply.code(503).send({ 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * OPTIONS handler for CORS preflight
   */
  fastify.options('/cdn/*', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-None-Match');
    reply.header('Access-Control-Max-Age', '86400');
    return reply.code(204).send();
  });
}