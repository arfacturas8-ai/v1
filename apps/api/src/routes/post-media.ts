import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { EnhancedMinioService } from "../services/enhanced-minio";
import { prisma } from "@cryb/database";
import multipart from "@fastify/multipart";
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

const postMediaRoutes: FastifyPluginAsync = async (fastify) => {
  const minioService = new EnhancedMinioService({
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
  });

  // Register multipart support
  await fastify.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB
      files: 20
    }
  });

  /**
   * Upload media files for posts
   */
  fastify.post("/upload", { 
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      const uploadedFiles: any[] = [];
      const bucket = 'cryb-posts';

      if (!request.isMultipart()) {
        return reply.code(400).send({
          success: false,
          error: 'Content must be multipart/form-data'
        });
      }

      const parts = request.parts();
      
      for await (const part of parts) {
        if (part.type === 'file') {
          try {
            const fileId = randomUUID();
            const buffer = await part.toBuffer();
            
            // Validate file
            const validation = validateMediaFile(part, buffer);
            if (!validation.valid) {
              throw new Error(validation.error);
            }

            // Process file based on type
            const processedFile = await processMediaFile({
              id: fileId,
              buffer: buffer,
              filename: part.filename || 'unnamed',
              mimetype: part.mimetype,
              size: buffer.length,
              userId: userId,
              bucket: bucket
            });

            uploadedFiles.push(processedFile);

          } catch (error) {
            fastify.log.error('Error processing file:', error);
            // Continue with other files, but log the error
            uploadedFiles.push({
              error: error instanceof Error ? error.message : 'Upload failed',
              filename: part.filename
            });
          }
        }
      }

      return reply.send({
        success: true,
        data: {
          files: uploadedFiles,
          totalUploaded: uploadedFiles.filter(f => !f.error).length,
          totalFailed: uploadedFiles.filter(f => f.error).length
        }
      });

    } catch (error) {
      fastify.log.error('Upload error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to upload files'
      });
    }
  });

  /**
   * Upload single image with real-time processing
   */
  fastify.post("/upload-image", { 
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;

      if (!request.isMultipart()) {
        return reply.code(400).send({
          success: false,
          error: 'Content must be multipart/form-data'
        });
      }

      const data = await request.file();
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: 'No file provided'
        });
      }

      const buffer = await data.toBuffer();
      
      // Validate image
      if (!data.mimetype?.startsWith('image/')) {
        return reply.code(400).send({
          success: false,
          error: 'File must be an image'
        });
      }

      if (buffer.length > 25 * 1024 * 1024) { // 25MB limit for images
        return reply.code(400).send({
          success: false,
          error: 'Image too large (max 25MB)'
        });
      }

      // Process image
      const fileId = randomUUID();
      const bucket = 'cryb-posts';
      
      const processedImage = await processImage({
        id: fileId,
        buffer: buffer,
        filename: data.filename || 'image',
        mimetype: data.mimetype,
        size: buffer.length,
        userId: userId,
        bucket: bucket
      });

      return reply.send({
        success: true,
        data: processedImage
      });

    } catch (error) {
      fastify.log.error('Image upload error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to upload image'
      });
    }
  });

  /**
   * Get upload progress (for chunked uploads)
   */
  fastify.get("/upload-progress/:uploadId", { 
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const { uploadId } = z.object({
        uploadId: z.string()
      }).parse(request.params);

      const userId = request.userId;

      // Get upload session
      const session = await prisma.chunkedUploadSession.findUnique({
        where: { 
          id: uploadId,
          userId: userId
        },
        include: {
          uploadChunks: true
        }
      });

      if (!session) {
        return reply.code(404).send({
          success: false,
          error: 'Upload session not found'
        });
      }

      const progress = (session.uploadedChunks / session.totalChunks) * 100;

      return reply.send({
        success: true,
        data: {
          uploadId: uploadId,
          progress: Math.round(progress),
          uploadedChunks: session.uploadedChunks,
          totalChunks: session.totalChunks,
          completed: session.completed,
          status: session.status
        }
      });

    } catch (error) {
      fastify.log.error('Progress check error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get upload progress'
      });
    }
  });

  /**
   * Delete uploaded media
   */
  fastify.delete("/:fileId", { 
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const { fileId } = z.object({
        fileId: z.string()
      }).parse(request.params);

      const userId = request.userId;

      // Get file info
      const file = await prisma.uploadedFile.findUnique({
        where: { 
          id: fileId,
          userId: userId
        }
      });

      if (!file) {
        return reply.code(404).send({
          success: false,
          error: 'File not found'
        });
      }

      // Delete from storage
      try {
        await minioService.deleteFile(file.bucket, file.filename);
        
        // Delete variants if they exist
        const variants = await prisma.fileVariant.findMany({
          where: { fileId: fileId }
        });

        for (const variant of variants) {
          try {
            await minioService.deleteFile(variant.bucket, variant.filename);
          } catch (error) {
            fastify.log.warn('Failed to delete variant:', error);
          }
        }
      } catch (error) {
        fastify.log.warn('Failed to delete from storage:', error);
      }

      // Delete from database
      await prisma.uploadedFile.delete({
        where: { id: fileId }
      });

      return reply.send({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      fastify.log.error('Delete error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete file'
      });
    }
  });

  /**
   * Get file metadata
   */
  fastify.get("/:fileId/metadata", { 
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const { fileId } = z.object({
        fileId: z.string()
      }).parse(request.params);

      const userId = request.userId;

      const file = await prisma.uploadedFile.findUnique({
        where: { 
          id: fileId,
          userId: userId
        },
        include: {
          variants: true,
          analytics: true
        }
      });

      if (!file) {
        return reply.code(404).send({
          success: false,
          error: 'File not found'
        });
      }

      return reply.send({
        success: true,
        data: file
      });

    } catch (error) {
      fastify.log.error('Metadata error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get file metadata'
      });
    }
  });

  // Helper functions
  function validateMediaFile(part: any, buffer: Buffer): { valid: boolean; error?: string } {
    // Check file size
    if (buffer.length > 500 * 1024 * 1024) { // 500MB
      return { valid: false, error: 'File too large (max 500MB)' };
    }

    // Check if it's empty
    if (buffer.length === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Basic MIME type validation
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'
    ];

    if (part.mimetype && !allowedTypes.includes(part.mimetype)) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  }

  async function processMediaFile(params: {
    id: string;
    buffer: Buffer;
    filename: string;
    mimetype: string;
    size: number;
    userId: string;
    bucket: string;
  }) {
    const { id, buffer, filename, mimetype, size, userId, bucket } = params;

    if (mimetype.startsWith('image/')) {
      return await processImage(params);
    } else if (mimetype.startsWith('video/')) {
      return await processVideo(params);
    } else {
      return await processGenericFile(params);
    }
  }

  async function processImage(params: {
    id: string;
    buffer: Buffer;
    filename: string;
    mimetype: string;
    size: number;
    userId: string;
    bucket: string;
  }) {
    const { id, buffer, filename, mimetype, size, userId, bucket } = params;

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Create variants
    const originalFilename = `${id}_original.${filename.split('.').pop()}`;
    const thumbnailFilename = `${id}_thumb.webp`;
    const optimizedFilename = `${id}_optimized.webp`;

    // Process variants
    const [thumbnailBuffer, optimizedBuffer] = await Promise.all([
      sharp(buffer)
        .resize(400, 300, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer(),
      sharp(buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()
    ]);

    // Upload all variants
    const [originalUrl, thumbnailUrl, optimizedUrl] = await Promise.all([
      minioService.uploadFile(bucket, originalFilename, buffer, mimetype),
      minioService.uploadFile(bucket, thumbnailFilename, thumbnailBuffer, 'image/webp'),
      minioService.uploadFile(bucket, optimizedFilename, optimizedBuffer, 'image/webp')
    ]);

    // Save to database
    const file = await prisma.uploadedFile.create({
      data: {
        id: id,
        userId: userId,
        originalName: filename,
        filename: originalFilename,
        mimeType: mimetype,
        size: size,
        hash: createHash('sha256').update(buffer).digest('hex'),
        bucket: bucket,
        url: originalUrl,
        thumbnailUrl: thumbnailUrl,
        width: metadata.width,
        height: metadata.height,
        processed: true,
        scanPassed: true,
        validated: true
      }
    });

    // Create variants
    await Promise.all([
      prisma.fileVariant.create({
        data: {
          id: randomUUID(),
          fileId: id,
          type: 'thumbnail',
          format: 'webp',
          filename: thumbnailFilename,
          url: thumbnailUrl,
          bucket: bucket,
          size: thumbnailBuffer.length,
          width: 400,
          height: 300,
          quality: 80
        }
      }),
      prisma.fileVariant.create({
        data: {
          id: randomUUID(),
          fileId: id,
          type: 'optimized',
          format: 'webp',
          filename: optimizedFilename,
          url: optimizedUrl,
          bucket: bucket,
          size: optimizedBuffer.length,
          width: Math.min(metadata.width || 1920, 1920),
          height: Math.min(metadata.height || 1080, 1080),
          quality: 85
        }
      })
    ]);

    return {
      id: id,
      url: originalUrl,
      thumbnailUrl: thumbnailUrl,
      optimizedUrl: optimizedUrl,
      type: mimetype,
      size: size,
      width: metadata.width,
      height: metadata.height,
      processed: true
    };
  }

  async function processVideo(params: {
    id: string;
    buffer: Buffer;
    filename: string;
    mimetype: string;
    size: number;
    userId: string;
    bucket: string;
  }) {
    const { id, buffer, filename, mimetype, size, userId, bucket } = params;

    const originalFilename = `${id}_${filename}`;
    
    // Upload original video
    const videoUrl = await minioService.uploadFile(bucket, originalFilename, buffer, mimetype);

    // Create placeholder thumbnail
    const placeholderThumbnail = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 50, g: 50, b: 50 }
      }
    })
      .webp()
      .toBuffer();

    const thumbnailFilename = `${id}_thumb.webp`;
    const thumbnailUrl = await minioService.uploadFile(bucket, thumbnailFilename, placeholderThumbnail, 'image/webp');

    // Save to database
    const file = await prisma.uploadedFile.create({
      data: {
        id: id,
        userId: userId,
        originalName: filename,
        filename: originalFilename,
        mimeType: mimetype,
        size: size,
        hash: createHash('sha256').update(buffer).digest('hex'),
        bucket: bucket,
        url: videoUrl,
        thumbnailUrl: thumbnailUrl,
        processed: true,
        scanPassed: true,
        validated: true
      }
    });

    return {
      id: id,
      url: videoUrl,
      thumbnailUrl: thumbnailUrl,
      type: mimetype,
      size: size,
      processed: true
    };
  }

  async function processGenericFile(params: {
    id: string;
    buffer: Buffer;
    filename: string;
    mimetype: string;
    size: number;
    userId: string;
    bucket: string;
  }) {
    const { id, buffer, filename, mimetype, size, userId, bucket } = params;

    const safeFilename = `${id}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Upload file
    const fileUrl = await minioService.uploadFile(bucket, safeFilename, buffer, mimetype);

    // Save to database
    const file = await prisma.uploadedFile.create({
      data: {
        id: id,
        userId: userId,
        originalName: filename,
        filename: safeFilename,
        mimeType: mimetype,
        size: size,
        hash: createHash('sha256').update(buffer).digest('hex'),
        bucket: bucket,
        url: fileUrl,
        processed: true,
        scanPassed: true,
        validated: true
      }
    });

    return {
      id: id,
      url: fileUrl,
      type: mimetype,
      size: size,
      processed: true
    };
  }
};

export default postMediaRoutes;