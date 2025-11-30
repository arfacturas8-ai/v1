import { FastifyPluginAsync } from "fastify";
import { authMiddleware } from "../middleware/auth";
import { FileUploadService, handleFileUpload } from "../services/file-upload";
import { LocalFileStorageService, createLocalFileStorageService, handleLocalFileUpload } from "../services/local-file-storage";
import path from 'path';
import { createReadStream, existsSync } from 'fs';

/**
 * File Upload API Routes
 * 
 * Endpoints:
 * - POST /uploads/avatar - Upload user avatar
 * - POST /uploads/attachment - Upload message attachment
 * - POST /uploads/media - Upload media files (images, videos, audio)
 * - POST /uploads/document - Upload documents
 * - GET /uploads/signed-url - Get signed upload URL for direct upload
 * - DELETE /uploads/:fileId - Delete uploaded file
 * - GET /uploads/:fileId/info - Get file information
 * - POST /uploads/batch - Batch upload multiple files
 */
const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  // Get file upload service from app instance
  const uploadService = (fastify as any).services.fileUpload as FileUploadService;
  
  // Initialize local file storage service as fallback
  // SECURITY: Always use environment variables for paths and URLs
  if (!process.env.LOCAL_STORAGE_PATH) {
    fastify.log.warn('LOCAL_STORAGE_PATH not set in environment variables, using default');
  }
  if (!process.env.LOCAL_STORAGE_URL) {
    fastify.log.warn('LOCAL_STORAGE_URL not set in environment variables, using default');
  }

  const localStorageService = createLocalFileStorageService({
    baseStoragePath: process.env.LOCAL_STORAGE_PATH || '/var/www/uploads',
    baseUrl: process.env.LOCAL_STORAGE_URL || '/api/v1/uploads/serve'
  });
  
  // Helper function to determine which upload service to use
  const getUploadService = () => {
    if (uploadService) {
      return { service: uploadService, type: 'minio', handler: handleFileUpload };
    } else {
      return { service: localStorageService, type: 'local', handler: handleLocalFileUpload };
    }
  };

  /**
   * File serving endpoint for local storage
   * SECURITY: Requires authentication to prevent unauthorized file access
   */
  fastify.get('/serve/:bucket/:userId/:filename', {
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const { bucket, userId, filename } = request.params;

      // SECURITY: Verify user has permission to access this file
      // Users can only access their own files unless they have special permissions
      if (request.userId !== userId) {
        // TODO: Add additional checks for shared files or public files
        return reply.code(403).send({
          success: false,
          error: 'Access denied'
        });
      }

      // SECURITY: Sanitize filename to prevent directory traversal attacks
      const sanitizedFilename = path.basename(filename);
      if (filename !== sanitizedFilename) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid filename'
        });
      }

      // Construct file path
      const filePath = path.join(
        process.env.LOCAL_STORAGE_PATH || '/var/www/uploads',
        bucket,
        userId,
        sanitizedFilename
      );
      
      // Check if file exists
      if (!existsSync(filePath)) {
        return reply.code(404).send({
          success: false,
          error: 'File not found'
        });
      }
      
      // Get file stats for headers
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      
      // Set appropriate headers
      reply.header('Content-Length', stats.size);
      reply.header('Last-Modified', stats.mtime.toUTCString());
      reply.header('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.json': 'application/json'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      reply.header('Content-Type', contentType);
      
      // Stream the file
      const stream = createReadStream(filePath);
      reply.send(stream);
      
    } catch (error) {
      fastify.log.error('File serving error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to serve file'
      });
    }
  });

  /**
   * @swagger
   * /uploads:
   *   get:
   *     tags: [uploads]
   *     summary: List uploaded files
   *     description: Get a list of uploaded files for the authenticated user
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: bucket
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter by bucket name
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Number of files to return
   *     responses:
   *       200:
   *         description: Files retrieved successfully
   */
  fastify.get('/', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'List uploaded files',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          bucket: { type: 'string', description: 'Filter by bucket name' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { bucket = 'uploads', limit = 50 } = request.query;
      const userId = request.userId;

      const { service, type } = getUploadService();

      // List files with optional bucket filtering
      let files;
      if (type === 'local') {
        files = await (service as LocalFileStorageService).listFiles(bucket, `${userId}/`, limit);
      } else {
        files = await (service as FileUploadService).listFiles(bucket, `${userId}/`, limit);
      }

      return reply.send({
        success: true,
        data: {
          files,
          bucket,
          count: files.length,
          storageType: type
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to list files'
      });
    }
  });

  /**
   * @swagger
   * /api/v1/uploads/avatar:
   *   post:
   *     tags: [uploads]
   *     summary: Upload user avatar
   *     description: Upload and process a user avatar image
   *     security:
   *       - Bearer: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - name: file
   *         in: formData
   *         type: file
   *         required: true
   *         description: Avatar image file
   *     responses:
   *       200:
   *         description: Avatar uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/UploadResult'
   *       400:
   *         description: Invalid file or upload failed
   */
  fastify.post('/avatar', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Upload user avatar',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    const { service, type, handler } = getUploadService();
    
    await handler(request, reply, service, {
      allowedTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
      ],
      maxSize: 5 * 1024 * 1024, // 5MB
      bucket: 'avatars',
      resize: {
        width: 512,
        height: 512,
        quality: 85
      },
      generateThumbnail: true,
      scanForMalware: true
    });
  });

  /**
   * @swagger
   * /api/v1/uploads/attachment:
   *   post:
   *     tags: [uploads]
   *     summary: Upload message attachment
   *     description: Upload files to attach to messages
   *     security:
   *       - Bearer: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - name: files
   *         in: formData
   *         type: file
   *         required: true
   *         description: Attachment files (up to 10)
   *       - name: channelId
   *         in: formData
   *         type: string
   *         required: true
   *         description: Channel ID for the attachment
   *     responses:
   *       200:
   *         description: Files uploaded successfully
   *       400:
   *         description: Invalid files or upload failed
   */
  fastify.post('/attachment', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Upload message attachment',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    const { service, type, handler } = getUploadService();
    
    await handler(request, reply, service, {
      allowedTypes: [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Documents
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv', 'application/json',
        // Archives
        'application/zip', 'application/x-rar-compressed'
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
      bucket: 'attachments',
      generateThumbnail: true,
      scanForMalware: true
    });
  });

  /**
   * @swagger
   * /api/v1/uploads/media:
   *   post:
   *     tags: [uploads]
   *     summary: Upload media files
   *     description: Upload images, videos, or audio files
   *     security:
   *       - Bearer: []
   *     consumes:
   *       - multipart/form-data
   *     responses:
   *       200:
   *         description: Media uploaded successfully
   */
  fastify.post('/media', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Upload media files',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    const { service, type, handler } = getUploadService();
    
    await handler(request, reply, service, {
      allowedTypes: [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        // Videos
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        // Audio
        'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'
      ],
      maxSize: 100 * 1024 * 1024, // 100MB
      bucket: 'media',
      resize: {
        width: 1920,
        height: 1080,
        quality: 80
      },
      generateThumbnail: true,
      scanForMalware: true
    });
  });

  /**
   * @swagger
   * /api/v1/uploads/document:
   *   post:
   *     tags: [uploads]
   *     summary: Upload documents
   *     description: Upload document files (PDF, Office docs, text files)
   *     security:
   *       - Bearer: []
   */
  fastify.post('/document', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Upload documents',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const { service, type, handler } = getUploadService();
    
    await handler(request, reply, service, {
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/json'
      ],
      maxSize: 25 * 1024 * 1024, // 25MB
      bucket: 'attachments',
      scanForMalware: true
    });
  });

  /**
   * @swagger
   * /api/v1/uploads/presigned-url:
   *   post:
   *     tags: [uploads]
   *     summary: Get presigned upload URL
   *     description: Get a presigned URL for direct browser uploads
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [filename, contentType]
   *             properties:
   *               filename:
   *                 type: string
   *                 description: Original filename
   *               contentType:
   *                 type: string
   *                 description: MIME type of the file
   *               bucket:
   *                 type: string
   *                 description: Target bucket (optional)
   *     responses:
   *       200:
   *         description: Presigned URL generated successfully
   */
  fastify.post('/presigned-url', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Get presigned upload URL',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['filename', 'contentType'],
        properties: {
          filename: { type: 'string' },
          contentType: { type: 'string' },
          bucket: { type: 'string' }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { filename, contentType, bucket } = request.body;
      const userId = request.userId;

      const { service, type } = getUploadService();

      if (type === 'local') {
        // For local storage, we don't support presigned URLs
        return reply.code(501).send({
          success: false,
          error: 'Presigned URLs not supported with local storage. Use direct upload endpoints instead.'
        });
      }

      const result = await (service as FileUploadService).generateSignedUploadUrl(
        filename,
        contentType,
        userId,
        { bucket }
      );

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

  /**
   * @swagger
   * /api/v1/uploads/{fileId}:
   *   delete:
   *     tags: [uploads]
   *     summary: Delete uploaded file
   *     description: Delete a previously uploaded file
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: fileId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: File ID to delete
   *     responses:
   *       200:
   *         description: File deleted successfully
   *       403:
   *         description: Not authorized to delete this file
   *       404:
   *         description: File not found
   */
  fastify.delete('/:fileId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Delete uploaded file',
      security: [{ Bearer: [] }],
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
      const userId = request.userId;

      const { service, type } = getUploadService();

      // SECURITY: Verify user owns the file or has permission to delete it
      // Extract bucket and filename from the fileId
      // Format: bucket/userId/filename
      const parts = fileId.split('/');
      if (parts.length < 3) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid file ID format'
        });
      }

      const [bucket, fileOwnerId, ...filenameParts] = parts;
      const filename = filenameParts.join('/');

      // Verify user owns the file
      if (fileOwnerId !== userId) {
        return reply.code(403).send({
          success: false,
          error: 'Access denied - you can only delete your own files'
        });
      }

      if (type === 'local') {
        await (service as LocalFileStorageService).deleteFile(bucket, userId, filename);
      } else {
        await (service as FileUploadService).deleteFile(bucket, `${userId}/${filename}`);
      }

      reply.send({
        success: true,
        message: 'File deleted successfully'
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
   * /api/v1/uploads/{fileId}/info:
   *   get:
   *     tags: [uploads]
   *     summary: Get file information
   *     description: Get metadata and information about an uploaded file
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: fileId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: File ID
   *     responses:
   *       200:
   *         description: File information retrieved successfully
   *       404:
   *         description: File not found
   */
  fastify.get('/:fileId/info', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Get file information',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { fileId } = request.params;
      const userId = (request as any).userId;

      const { service, type } = getUploadService();

      // TODO: Look up file information from database
      // For now, return placeholder data
      const bucket = 'uploads';
      const filename = fileId;

      let info;
      if (type === 'local') {
        info = await (service as LocalFileStorageService).getFileInfo(bucket, userId, filename);
      } else {
        info = await (service as FileUploadService).getFileInfo(bucket, filename);
      }

      reply.send({
        success: true,
        data: {
          fileId,
          bucket,
          filename,
          storageType: type,
          ...info
        }
      });
    } catch (error) {
      reply.code(404).send({
        success: false,
        error: 'File not found'
      });
    }
  });

  /**
   * @swagger
   * /api/v1/uploads/{fileId}/download:
   *   get:
   *     tags: [uploads]
   *     summary: Get file download URL
   *     description: Get a signed URL to download a file
   *     security:
   *       - Bearer: []
   *     parameters:
   *       - name: fileId
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: File ID
   *       - name: expiresIn
   *         in: query
   *         schema:
   *           type: integer
   *           default: 3600
   *         description: URL expiration time in seconds
   *     responses:
   *       200:
   *         description: Download URL generated successfully
   */
  fastify.get('/:fileId/download', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Get file download URL',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          expiresIn: { type: 'integer', default: 3600 }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { fileId } = request.params;
      const { expiresIn = 3600 } = request.query;
      const userId = (request as any).userId;

      const { service, type } = getUploadService();

      // TODO: Look up file information from database and verify access permissions
      const bucket = 'uploads';
      const filename = fileId;

      // SECURITY: Verify user has permission to download this file
      // TODO: Look up file ownership and permissions from database

      if (type === 'local') {
        // For local storage, return the direct serve URL
        // Note: This requires authentication via the /serve endpoint
        const baseUrl = process.env.LOCAL_STORAGE_URL || '/api/v1/uploads/serve';
        const downloadUrl = `${baseUrl}/${bucket}/${userId}/${filename}`;

        reply.send({
          success: true,
          data: {
            downloadUrl,
            expiresIn: null, // Local URLs don't expire but require auth
            expiresAt: null,
            storageType: 'local',
            requiresAuth: true
          }
        });
      } else {
        const downloadUrl = await (service as FileUploadService).getDownloadUrl(bucket, filename, expiresIn);

        reply.send({
          success: true,
          data: {
            downloadUrl,
            expiresIn,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            storageType: 'minio'
          }
        });
      }
    } catch (error) {
      reply.code(404).send({
        success: false,
        error: 'File not found'
      });
    }
  });

  /**
   * @swagger
   * /api/v1/uploads/batch:
   *   post:
   *     tags: [uploads]
   *     summary: Batch upload files
   *     description: Upload multiple files in a single request
   *     security:
   *       - Bearer: []
   *     consumes:
   *       - multipart/form-data
   *     responses:
   *       200:
   *         description: Batch upload completed
   */
  fastify.post('/batch', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Batch upload files',
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    const { service, type, handler } = getUploadService();
    
    await handler(request, reply, service, {
      maxSize: 100 * 1024 * 1024, // 100MB per file
      generateThumbnail: true,
      scanForMalware: true
    });
  });

  /**
   * @swagger
   * /api/v1/uploads/cleanup:
   *   post:
   *     tags: [uploads]
   *     summary: Cleanup temporary files
   *     description: Remove old temporary files (admin only)
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: Cleanup completed
   */
  fastify.post('/cleanup', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Cleanup temporary files (admin only)',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      // SECURITY: Only allow admins to cleanup files
      // TODO: Implement proper role-based access control
      // For now, we'll return an error
      return reply.code(403).send({
        success: false,
        error: 'Admin access required'
      });

      const { service, type } = getUploadService();
      
      if (type === 'local') {
        await (service as LocalFileStorageService).cleanupTempFiles();
      } else {
        await (service as FileUploadService).cleanupTempFiles();
      }

      reply.send({
        success: true,
        message: 'Cleanup completed',
        storageType: type
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
   * /api/v1/uploads/stats:
   *   get:
   *     tags: [uploads]
   *     summary: Get upload statistics
   *     description: Get storage usage and upload statistics
   *     security:
   *       - Bearer: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  fastify.get('/stats', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Get upload statistics',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      const { service, type } = getUploadService();
      const buckets = ['uploads', 'avatars', 'attachments', 'media', 'thumbnails'];
      const stats: any = {};

      for (const bucket of buckets) {
        try {
          let files;
          if (type === 'local') {
            files = await (service as LocalFileStorageService).listFiles(bucket, undefined, 1000);
          } else {
            files = await (service as FileUploadService).listFiles(bucket, undefined, 1000);
          }
          
          stats[bucket] = {
            fileCount: files.length,
            totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0)
          };
        } catch (error) {
          stats[bucket] = { error: error.message };
        }
      }

      reply.send({
        success: true,
        data: {
          ...stats,
          storageType: type
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

export default uploadRoutes;