import { FastifyPluginAsync } from "fastify";
import { authMiddleware } from "../middleware/auth";
import { EnhancedFileUploadService } from "../services/enhanced-file-upload";
import { EnhancedMediaTranscodingService } from "../services/enhanced-video-transcoding";
import { Client as MinioClient } from "minio";
import path from 'path';
import { createHash } from 'crypto';

/**
 * Enhanced Upload API Routes for CRYB Chat Platform
 * 
 * Features:
 * - Chunked file uploads for large files (up to 100MB)
 * - Real-time progress tracking via WebSocket
 * - Video/Audio transcoding with multiple formats
 * - CDN-like serving with cache optimization
 * - Drag-and-drop and clipboard paste support
 * - Advanced file validation and security scanning
 * - Thumbnail and preview generation
 * - Responsive image serving
 */
const enhancedUploadRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize services with error handling
  let uploadService: EnhancedFileUploadService | null = null;
  let transcodingService: EnhancedMediaTranscodingService | null = null;
  
  try {
    const minioConfig = {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      useSSL: process.env.MINIO_USE_SSL === 'true',
      cdnBaseUrl: process.env.CDN_BASE_URL,
      tempDirectory: '/tmp/cryb-uploads'
    };

    uploadService = new EnhancedFileUploadService(minioConfig);
    
    const minioClient = new MinioClient({
      endPoint: minioConfig.endpoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey
    });
    
    try {
      transcodingService = new EnhancedMediaTranscodingService(minioClient);
    } catch (error) {
      console.warn('Enhanced Media Transcoding Service initialization failed:', error.message);
      console.warn('Video/Audio transcoding features will be disabled');
    }
    
    console.log('✅ Enhanced upload services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize enhanced upload services:', error.message);
    console.error('Enhanced upload routes will have limited functionality');
  }

  // WebSocket support for progress tracking
  await fastify.register(require('@fastify/websocket'));

  /**
   * @swagger
   * /api/v1/uploads/chunked/start:
   *   post:
   *     tags: [uploads]
   *     summary: Start chunked upload session
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [filename, mimeType, totalSize]
   *             properties:
   *               filename:
   *                 type: string
   *                 description: Original filename
   *               mimeType:
   *                 type: string
   *                 description: MIME type of the file
   *               totalSize:
   *                 type: integer
   *                 description: Total file size in bytes
   *               chunkSize:
   *                 type: integer
   *                 description: Chunk size in bytes (optional, default 5MB)
   *     responses:
   *       200:
   *         description: Upload session started successfully
   */
  fastify.post('/chunked/start', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Start chunked upload session',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['filename', 'mimeType', 'totalSize'],
        properties: {
          filename: { type: 'string' },
          mimeType: { type: 'string' },
          totalSize: { type: 'integer', minimum: 1 },
          chunkSize: { type: 'integer', minimum: 1024 * 1024 } // Min 1MB
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      if (!uploadService) {
        return reply.code(503).send({
          success: false,
          error: 'Enhanced upload service is not available'
        });
      }

      const { filename, mimeType, totalSize, chunkSize } = request.body;
      const userId = request.userId;

      // Validate file size (max 100MB)
      if (totalSize > 100 * 1024 * 1024) {
        throw new Error('File size exceeds maximum limit of 100MB');
      }

      const session = await uploadService.startChunkedUpload(
        filename,
        mimeType,
        totalSize,
        userId,
        chunkSize
      );

      reply.send({
        success: true,
        data: {
          sessionId: session.id,
          chunkSize: session.chunkSize,
          totalChunks: session.totalChunks,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
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
   * /api/v1/uploads/chunked/{sessionId}/chunk/{chunkIndex}:
   *   put:
   *     tags: [uploads]
   *     summary: Upload file chunk
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: sessionId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: chunkIndex
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/octet-stream:
   *           schema:
   *             type: string
   *             format: binary
   *     responses:
   *       200:
   *         description: Chunk uploaded successfully
   */
  fastify.put('/chunked/:sessionId/chunk/:chunkIndex', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Upload file chunk',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' },
          chunkIndex: { type: 'integer' }
        },
        required: ['sessionId', 'chunkIndex']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { sessionId, chunkIndex } = request.params;
      const chunkData = await request.body;

      if (!Buffer.isBuffer(chunkData)) {
        throw new Error('Request body must be binary data');
      }

      const result = await uploadService.uploadChunk(
        sessionId,
        parseInt(chunkIndex),
        chunkData
      );

      reply.send({
        success: true,
        data: {
          progress: result.progress,
          completed: result.completed,
          chunkIndex: parseInt(chunkIndex)
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
   * /api/v1/uploads/chunked/{sessionId}/complete:
   *   post:
   *     tags: [uploads]
   *     summary: Complete chunked upload and process file
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               transcodeVideo:
   *                 type: boolean
   *                 description: Enable video transcoding
   *               transcodeAudio:
   *                 type: boolean
   *                 description: Enable audio transcoding
   *               generateThumbnails:
   *                 type: boolean
   *                 description: Generate thumbnails
   *               generatePreviews:
   *                 type: boolean
   *                 description: Generate previews
   *               optimizeImages:
   *                 type: boolean
   *                 description: Optimize images
   *     responses:
   *       200:
   *         description: File processed successfully
   */
  fastify.post('/chunked/:sessionId/complete', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Complete chunked upload and process file',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        },
        required: ['sessionId']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { sessionId } = request.params;
      const options = request.body || {};
      const userId = request.userId;

      // Set default options for chat platform
      const uploadOptions = {
        generateThumbnails: true,
        generatePreviews: true,
        optimizeImages: true,
        transcodeVideos: true,
        transcodeAudio: true,
        scanForMalware: true,
        enableCDN: true,
        ...options
      };

      const processedFile = await uploadService.completeChunkedUpload(
        sessionId,
        uploadOptions
      );

      // Start transcoding if needed
      if (uploadOptions.transcodeVideos && processedFile.metadata.fileType === 'videos') {
        const transcodingJob = await transcodingService.createVideoTranscodingJob(
          processedFile.bucket,
          processedFile.filename,
          processedFile.originalName,
          userId,
          {
            formats: [
              { format: 'mp4', resolution: '720p' },
              { format: 'webm', resolution: '720p' },
              { format: 'hls', resolution: '720p' }
            ],
            generateThumbnails: true,
            generatePreview: true,
            priority: 'normal'
          }
        );
        processedFile.transcoding = {
          status: 'pending',
          jobId: transcodingJob.id,
          progress: 0
        };
      }

      if (uploadOptions.transcodeAudio && processedFile.metadata.fileType === 'audio') {
        const transcodingJob = await transcodingService.createAudioTranscodingJob(
          processedFile.bucket,
          processedFile.filename,
          processedFile.originalName,
          userId,
          {
            formats: [
              { format: 'mp3', bitrate: '128k' },
              { format: 'ogg', bitrate: '128k' }
            ],
            generateWaveform: true,
            priority: 'normal'
          }
        );
      }

      reply.send({
        success: true,
        data: processedFile
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
   * /api/v1/uploads/quick:
   *   post:
   *     tags: [uploads]
   *     summary: Quick single file upload for chat messages
   *     security:
   *       - Bearer: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - name: file
   *         in: formData
   *         type: file
   *         required: true
   *         description: File to upload
   *       - name: channelId
   *         in: formData
   *         type: string
   *         description: Channel ID for context
   *       - name: messageId
   *         in: formData
   *         type: string
   *         description: Message ID to attach to
   *     responses:
   *       200:
   *         description: File uploaded successfully
   */
  fastify.post('/quick', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Quick single file upload for chat messages',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request: any, reply) => {
    try {
      if (!request.isMultipart()) {
        throw new Error('Request must be multipart/form-data');
      }

      const userId = request.userId;
      let file: any = null;
      let channelId: string = '';
      let messageId: string = '';

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          file = part;
        } else if (part.fieldname === 'channelId') {
          channelId = part.value as string;
        } else if (part.fieldname === 'messageId') {
          messageId = part.value as string;
        }
      }

      if (!file) {
        throw new Error('No file provided');
      }

      const uploadOptions = {
        generateThumbnails: true,
        generatePreviews: true,
        optimizeImages: true,
        transcodeVideos: false, // Quick upload, transcode in background
        transcodeAudio: false,
        scanForMalware: true,
        enableCDN: true,
        maxSize: 50 * 1024 * 1024 // 50MB for quick uploads
      };

      const processedFile = await uploadService.uploadSingleFile(
        file,
        userId,
        uploadOptions
      );

      // Add context metadata
      processedFile.metadata.channelId = channelId;
      processedFile.metadata.messageId = messageId;
      processedFile.metadata.uploadType = 'quick';

      reply.send({
        success: true,
        data: processedFile
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
   * /api/v1/uploads/paste:
   *   post:
   *     tags: [uploads]
   *     summary: Upload from clipboard paste
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [data, type]
   *             properties:
   *               data:
   *                 type: string
   *                 description: Base64 encoded file data
   *               type:
   *                 type: string
   *                 description: MIME type
   *               filename:
   *                 type: string
   *                 description: Optional filename
   *               channelId:
   *                 type: string
   *                 description: Channel ID for context
   *     responses:
   *       200:
   *         description: File uploaded from clipboard successfully
   */
  fastify.post('/paste', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Upload from clipboard paste',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['data', 'type'],
        properties: {
          data: { type: 'string' },
          type: { type: 'string' },
          filename: { type: 'string' },
          channelId: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { data, type, filename, channelId } = request.body;
      const userId = request.userId;

      // Decode base64 data
      const buffer = Buffer.from(data, 'base64');
      
      // Create a mock file object
      const mockFile = {
        filename: filename || `paste_${Date.now()}.${type.split('/')[1]}`,
        mimetype: type,
        toBuffer: async () => buffer
      };

      const uploadOptions = {
        generateThumbnails: true,
        generatePreviews: true,
        optimizeImages: true,
        scanForMalware: true,
        enableCDN: true,
        maxSize: 25 * 1024 * 1024 // 25MB for paste uploads
      };

      const processedFile = await uploadService.uploadSingleFile(
        mockFile as any,
        userId,
        uploadOptions
      );

      // Add context metadata
      processedFile.metadata.channelId = channelId;
      processedFile.metadata.uploadType = 'paste';
      processedFile.metadata.pastedAt = new Date().toISOString();

      reply.send({
        success: true,
        data: processedFile
      });
    } catch (error) {
      reply.code(400).send({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // CDN-LIKE SERVING ENDPOINTS
  // ============================================

  /**
   * @swagger
   * /api/v1/uploads/serve/{bucket}/{filename}:
   *   get:
   *     tags: [uploads]
   *     summary: Serve files with CDN-like optimization
   *     parameters:
   *       - name: bucket
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: filename
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: w
   *         in: query
   *         description: Width for image resizing
   *         schema:
   *           type: integer
   *       - name: h
   *         in: query
   *         description: Height for image resizing
   *         schema:
   *           type: integer
   *       - name: q
   *         in: query
   *         description: Quality (1-100)
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *       - name: f
   *         in: query
   *         description: Format (webp, avif, auto)
   *         schema:
   *           type: string
   *           enum: [webp, avif, auto]
   *     responses:
   *       200:
   *         description: File served successfully
   *       404:
   *         description: File not found
   */
  fastify.get('/serve/:bucket/:filename', {
    schema: {
      tags: ['uploads'],
      summary: 'Serve files with CDN-like optimization',
      params: {
        type: 'object',
        properties: {
          bucket: { type: 'string' },
          filename: { type: 'string' }
        },
        required: ['bucket', 'filename']
      },
      querystring: {
        type: 'object',
        properties: {
          w: { type: 'integer', minimum: 1, maximum: 4096 },
          h: { type: 'integer', minimum: 1, maximum: 4096 },
          q: { type: 'integer', minimum: 1, maximum: 100 },
          f: { type: 'string', enum: ['webp', 'avif', 'auto'] }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { bucket, filename } = request.params;
      const { w: width, h: height, q: quality = 80, f: format } = request.query;
      
      // Check if file exists and get metadata
      let fileInfo;
      try {
        fileInfo = await minioClient.statObject(bucket, filename);
      } catch (error) {
        return reply.code(404).send({
          success: false,
          error: 'File not found'
        });
      }

      // Set cache headers
      reply.headers({
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
        'ETag': `"${fileInfo.etag}"`,
        'Last-Modified': fileInfo.lastModified.toUTCString()
      });

      // Check if client has cached version
      const clientETag = request.headers['if-none-match'];
      const clientModified = request.headers['if-modified-since'];
      
      if (clientETag === `"${fileInfo.etag}"` || 
          (clientModified && new Date(clientModified) >= fileInfo.lastModified)) {
        return reply.code(304).send();
      }

      // Get file stream
      const fileStream = await minioClient.getObject(bucket, filename);
      
      // Determine if we need to transform the image
      const isImage = fileInfo.metaData?.['content-type']?.startsWith('image/');
      const needsTransform = isImage && (width || height || format);

      if (needsTransform) {
        // Transform image on-the-fly
        const sharp = require('sharp');
        let transformer = sharp();

        // Resize if dimensions specified
        if (width || height) {
          transformer = transformer.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Convert format
        if (format === 'webp') {
          transformer = transformer.webp({ quality });
          reply.type('image/webp');
        } else if (format === 'avif') {
          transformer = transformer.avif({ quality });
          reply.type('image/avif');
        } else if (format === 'auto') {
          // Choose best format based on Accept header
          const acceptHeader = request.headers.accept || '';
          if (acceptHeader.includes('image/avif')) {
            transformer = transformer.avif({ quality });
            reply.type('image/avif');
          } else if (acceptHeader.includes('image/webp')) {
            transformer = transformer.webp({ quality });
            reply.type('image/webp');
          } else {
            transformer = transformer.jpeg({ quality });
            reply.type('image/jpeg');
          }
        } else {
          // Keep original format but apply quality
          if (fileInfo.metaData?.['content-type'] === 'image/jpeg') {
            transformer = transformer.jpeg({ quality });
          } else if (fileInfo.metaData?.['content-type'] === 'image/png') {
            transformer = transformer.png({ quality });
          }
        }

        // Stream through transformer
        reply.type(fileInfo.metaData?.['content-type'] || 'application/octet-stream');
        return reply.send(fileStream.pipe(transformer));
      } else {
        // Serve original file
        reply.type(fileInfo.metaData?.['content-type'] || 'application/octet-stream');
        return reply.send(fileStream);
      }
    } catch (error) {
      console.error('Error serving file:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to serve file'
      });
    }
  });

  /**
   * @swagger
   * /api/v1/uploads/thumbnail/{fileId}:
   *   get:
   *     tags: [uploads]
   *     summary: Get file thumbnail
   *     parameters:
   *       - name: fileId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: size
   *         in: query
   *         description: Thumbnail size
   *         schema:
   *           type: string
   *           enum: [small, medium, large]
   *           default: medium
   *     responses:
   *       200:
   *         description: Thumbnail served successfully
   */
  fastify.get('/thumbnail/:fileId', {
    schema: {
      tags: ['uploads'],
      summary: 'Get file thumbnail',
      params: {
        type: 'object',
        properties: {
          fileId: { type: 'string' }
        },
        required: ['fileId']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { fileId } = request.params;
      const { size = 'medium' } = request.query;

      const sizeMap = {
        small: { width: 150, height: 150 },
        medium: { width: 300, height: 300 },
        large: { width: 600, height: 600 }
      };

      const dimensions = sizeMap[size] || sizeMap.medium;

      // Try to get existing thumbnail
      const thumbnailFilename = `thumb_${fileId}.jpg`;
      
      try {
        const thumbnailStream = await minioClient.getObject('cryb-thumbnails', thumbnailFilename);
        
        reply.headers({
          'Cache-Control': 'public, max-age=31536000',
          'Content-Type': 'image/jpeg'
        });

        if (size === 'medium') {
          // Return original thumbnail
          return reply.send(thumbnailStream);
        } else {
          // Resize on-the-fly
          const sharp = require('sharp');
          const resizer = sharp()
            .resize(dimensions.width, dimensions.height, { fit: 'inside' })
            .jpeg({ quality: 80 });
          
          return reply.send(thumbnailStream.pipe(resizer));
        }
      } catch (error) {
        // Thumbnail not found, return 404
        reply.code(404).send({
          success: false,
          error: 'Thumbnail not found'
        });
      }
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: 'Failed to serve thumbnail'
      });
    }
  });

  // ============================================
  // PROGRESS TRACKING WEBSOCKET
  // ============================================

  /**
   * WebSocket endpoint for real-time upload progress
   */
  fastify.get('/progress/:sessionId', { websocket: true }, (connection, request) => {
    const sessionId = (request.params as any).sessionId;
    
    // Send initial status
    const session = uploadService.getUploadSession(sessionId);
    if (session) {
      connection.socket.send(JSON.stringify({
        type: 'status',
        sessionId,
        progress: (session.uploadedChunks.size / session.totalChunks) * 100,
        uploadedChunks: session.uploadedChunks.size,
        totalChunks: session.totalChunks
      }));
    } else {
      connection.socket.send(JSON.stringify({
        type: 'error',
        message: 'Upload session not found'
      }));
      connection.socket.close();
      return;
    }

    // Listen for progress updates
    const progressHandler = (data: any) => {
      if (data.sessionId === sessionId) {
        connection.socket.send(JSON.stringify({
          type: 'progress',
          ...data
        }));
      }
    };

    const completedHandler = (data: any) => {
      if (data.sessionId === sessionId) {
        connection.socket.send(JSON.stringify({
          type: 'completed',
          sessionId: data.sessionId
        }));
      }
    };

    uploadService.on('chunk_uploaded', progressHandler);
    uploadService.on('upload_completed', completedHandler);
    uploadService.on('processing_error', (data: any) => {
      if (data.sessionId === sessionId) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          message: data.error
        }));
      }
    });

    connection.socket.on('close', () => {
      uploadService.off('chunk_uploaded', progressHandler);
      uploadService.off('upload_completed', completedHandler);
    });
  });

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  /**
   * @swagger
   * /api/v1/uploads/session/{sessionId}/status:
   *   get:
   *     tags: [uploads]
   *     summary: Get upload session status
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: sessionId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session status retrieved successfully
   */
  fastify.get('/session/:sessionId/status', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Get upload session status',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { sessionId } = request.params;
      const session = uploadService.getUploadSession(sessionId);

      if (!session) {
        return reply.code(404).send({
          success: false,
          error: 'Upload session not found'
        });
      }

      const progress = (session.uploadedChunks.size / session.totalChunks) * 100;

      reply.send({
        success: true,
        data: {
          sessionId: session.id,
          filename: session.filename,
          progress,
          uploadedChunks: session.uploadedChunks.size,
          totalChunks: session.totalChunks,
          totalSize: session.totalSize,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
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
   * /api/v1/uploads/session/{sessionId}/cancel:
   *   delete:
   *     tags: [uploads]
   *     summary: Cancel upload session
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: sessionId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session cancelled successfully
   */
  fastify.delete('/session/:sessionId/cancel', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Cancel upload session',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { sessionId } = request.params;
      const cancelled = await uploadService.cancelUploadSession(sessionId);

      if (!cancelled) {
        return reply.code(404).send({
          success: false,
          error: 'Upload session not found'
        });
      }

      reply.send({
        success: true,
        message: 'Upload session cancelled'
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
   * /api/v1/uploads/transcoding/{jobId}/status:
   *   get:
   *     tags: [uploads]
   *     summary: Get transcoding job status
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: jobId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Transcoding job status retrieved successfully
   */
  fastify.get('/transcoding/:jobId/status', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Get transcoding job status',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { jobId } = request.params;
      
      const videoJob = transcodingService.getVideoJob(jobId);
      const audioJob = transcodingService.getAudioJob(jobId);
      
      if (!videoJob && !audioJob) {
        return reply.code(404).send({
          success: false,
          error: 'Transcoding job not found'
        });
      }

      const job = videoJob || audioJob;
      
      reply.send({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          outputs: job.outputs,
          thumbnails: videoJob?.thumbnails || [],
          preview: videoJob?.preview,
          waveform: audioJob?.waveform,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          error: job.error
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
   * /api/v1/uploads/health:
   *   get:
   *     tags: [uploads]
   *     summary: Get upload service health status
   *     responses:
   *       200:
   *         description: Service health status
   */
  fastify.get('/health', {
    schema: {
      tags: ['uploads'],
      summary: 'Get upload service health status'
    }
  }, async (request, reply) => {
    try {
      let uploadHealth = null;
      let transcodingHealth = null;

      if (uploadService) {
        try {
          uploadHealth = await uploadService.getHealthStatus();
        } catch (error) {
          uploadHealth = { status: 'unhealthy', error: error.message };
        }
      } else {
        uploadHealth = { status: 'disabled', reason: 'Service not initialized' };
      }

      if (transcodingService) {
        try {
          transcodingHealth = await transcodingService.getHealthStatus();
        } catch (error) {
          transcodingHealth = { status: 'unhealthy', error: error.message };
        }
      } else {
        transcodingHealth = { status: 'disabled', reason: 'Service not initialized or FFmpeg not available' };
      }

      const overallStatus = uploadHealth?.status === 'healthy' ? 'healthy' : 'degraded';

      reply.send({
        success: true,
        data: {
          status: overallStatus,
          upload: uploadHealth,
          transcoding: transcodingHealth,
          timestamp: new Date().toISOString(),
          features: {
            chunkedUploads: uploadService !== null,
            videoTranscoding: transcodingService !== null,
            audioTranscoding: transcodingService !== null,
            cdnServing: true,
            progressTracking: true
          }
        }
      });
    } catch (error) {
      reply.code(503).send({
        success: false,
        error: 'Service health check failed',
        details: error.message
      });
    }
  });
};

export default enhancedUploadRoutes;