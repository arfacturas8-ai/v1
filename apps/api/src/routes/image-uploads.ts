import { FastifyPluginAsync } from "fastify";
import { authMiddleware } from "../middleware/auth";
import { processImage, generateAvatar, queueImageProcessing, analyzeImage, ProcessImageOptions } from "../services/image-processor";
import { addImageJob, addAvatarGenerationJob, addBatchImageJob } from "../services/queues";
import sharp from 'sharp';
import { Readable } from 'stream';

/**
 * Enhanced Image Upload API Routes
 * 
 * Endpoints:
 * - POST /image-uploads/avatar - Upload and process user avatar
 * - POST /image-uploads/banner - Upload and process community banner
 * - POST /image-uploads/post - Upload and process post images
 * - POST /image-uploads/batch - Batch process multiple images
 * - POST /image-uploads/generate-avatar - Generate avatar from username
 * - POST /image-uploads/analyze - Analyze image properties
 * - GET /image-uploads/status/:jobId - Get processing status
 */
const imageUploadRoutes: FastifyPluginAsync = async (fastify) => {

  // Validation schemas
  const imageUploadSchema = {
    consumes: ['multipart/form-data'],
    properties: {
      file: { 
        type: 'string', 
        format: 'binary',
        description: 'Image file to upload'
      }
    }
  };

  /**
   * Avatar Upload and Processing
   */
  fastify.post('/avatar', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'Upload and process user avatar',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                jobId: { type: 'string' },
                original: { type: 'object' },
                variants: { type: 'array' },
                thumbnail: { type: 'object' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      
      // Handle multipart file upload
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
        });
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Validate file size (5MB max for avatars)
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({
          success: false,
          error: 'File too large. Maximum size is 5MB.'
        });
      }

      // Process avatar immediately for better UX
      const result = await processImage(buffer, {
        type: 'avatar',
        userId,
        preserveMetadata: false
      });

      reply.send({
        success: true,
        data: result
      });

    } catch (error) {
      fastify.log.error('Avatar upload error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to process avatar'
      });
    }
  });

  /**
   * Banner Upload and Processing
   */
  fastify.post('/banner', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'Upload and process community banner',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
        });
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Validate file size (10MB max for banners)
      if (buffer.length > 10 * 1024 * 1024) {
        return reply.code(400).send({
          success: false,
          error: 'File too large. Maximum size is 10MB.'
        });
      }

      // Process banner with queue for larger files
      if (buffer.length > 2 * 1024 * 1024) {
        // Queue processing for large files
        const job = await addImageJob({
          buffer,
          type: 'banner',
          userId,
          generateWebP: true,
          generateAVIF: true
        });

        reply.send({
          success: true,
          data: {
            jobId: job.id,
            status: 'processing',
            message: 'Banner is being processed. Check status with the job ID.'
          }
        });
      } else {
        // Process immediately for smaller files
        const result = await processImage(buffer, {
          type: 'banner',
          userId,
          generateWebP: true,
          generateAVIF: true
        });

        reply.send({
          success: true,
          data: result
        });
      }

    } catch (error) {
      fastify.log.error('Banner upload error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to process banner'
      });
    }
  });

  /**
   * Post Image Upload and Processing
   */
  fastify.post('/post', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'Upload and process post images',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
        'image/webp', 'image/bmp', 'image/tiff'
      ];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid file type.'
        });
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Validate file size (20MB max for post images)
      if (buffer.length > 20 * 1024 * 1024) {
        return reply.code(400).send({
          success: false,
          error: 'File too large. Maximum size is 20MB.'
        });
      }

      // Always queue post image processing to not block the request
      const job = await addImageJob({
        buffer,
        type: 'post',
        userId,
        generateWebP: true,
        generateAVIF: true,
        preserveMetadata: false
      });

      reply.send({
        success: true,
        data: {
          jobId: job.id,
          status: 'processing',
          message: 'Image is being processed. Check status with the job ID.'
        }
      });

    } catch (error) {
      fastify.log.error('Post image upload error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to process image'
      });
    }
  });

  /**
   * Batch Image Processing
   */
  fastify.post('/batch', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'Batch process multiple images',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      
      // Handle multiple files
      const files = await request.files();
      const imageFiles = [];
      
      for await (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          continue; // Skip non-image files
        }

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of file.file) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        imageFiles.push({
          buffer,
          filename: file.filename,
          mimetype: file.mimetype,
          size: buffer.length
        });
      }

      if (imageFiles.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'No valid image files provided'
        });
      }

      if (imageFiles.length > 10) {
        return reply.code(400).send({
          success: false,
          error: 'Maximum 10 images allowed per batch'
        });
      }

      // Queue batch processing
      const job = await addBatchImageJob({
        images: imageFiles.map(file => ({
          buffer: file.buffer,
          type: 'post' as const,
          userId
        }))
      });

      reply.send({
        success: true,
        data: {
          jobId: job.id,
          status: 'processing',
          fileCount: imageFiles.length,
          message: 'Images are being processed. Check status with the job ID.'
        }
      });

    } catch (error) {
      fastify.log.error('Batch upload error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to process batch upload'
      });
    }
  });

  /**
   * Generate Avatar from Username
   */
  fastify.post('/generate-avatar', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'Generate avatar from username',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 1, maxLength: 50 },
          size: { type: 'number', minimum: 32, maximum: 1024, default: 512 },
          colors: {
            type: 'object',
            properties: {
              start: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              end: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      const { username, size, colors } = request.body;

      // Generate avatar immediately since it's fast
      const result = await generateAvatar(username, {
        userId,
        size,
        colors
      });

      reply.send({
        success: true,
        data: result
      });

    } catch (error) {
      fastify.log.error('Avatar generation error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate avatar'
      });
    }
  });

  /**
   * Analyze Image Properties
   */
  fastify.post('/analyze', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'Analyze image properties',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request: any, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      if (!data.mimetype.startsWith('image/')) {
        return reply.code(400).send({
          success: false,
          error: 'File must be an image'
        });
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Analyze image
      const analysis = await analyzeImage(buffer);

      reply.send({
        success: true,
        data: {
          ...analysis,
          filename: data.filename,
          uploadedSize: buffer.length
        }
      });

    } catch (error) {
      fastify.log.error('Image analysis error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to analyze image'
      });
    }
  });

  /**
   * Get Processing Status
   */
  fastify.get('/status/:jobId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'Get image processing status',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          jobId: { type: 'string' }
        },
        required: ['jobId']
      }
    }
  }, async (request: any, reply) => {
    try {
      const { jobId } = request.params;
      
      // Get job status from the image queue
      const { imageQueue } = await import('../services/queues');
      const job = await imageQueue.getJob(jobId);

      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'Job not found'
        });
      }

      const state = await job.getState();
      const progress = job.progress;
      const result = job.returnvalue;
      const failedReason = job.failedReason;

      reply.send({
        success: true,
        data: {
          jobId,
          status: state,
          progress,
          result,
          error: failedReason,
          createdAt: new Date(job.timestamp),
          processedAt: job.processedOn ? new Date(job.processedOn) : null,
          finishedAt: job.finishedOn ? new Date(job.finishedOn) : null
        }
      });

    } catch (error) {
      fastify.log.error('Status check error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to check status'
      });
    }
  });

  /**
   * List User's Processed Images
   */
  fastify.get('/my-images', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['image-uploads'],
      summary: 'List user processed images',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['avatar', 'banner', 'post', 'thumbnail'],
            description: 'Filter by image type'
          },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      const { type, limit = 20, offset = 0 } = request.query;

      // This would integrate with your database to list processed images
      // For now, return a placeholder response
      reply.send({
        success: true,
        data: {
          images: [],
          total: 0,
          limit,
          offset,
          message: 'Database integration needed for listing user images'
        }
      });

    } catch (error) {
      fastify.log.error('List images error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to list images'
      });
    }
  });
};

export default imageUploadRoutes;