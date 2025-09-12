import { FastifyPluginAsync } from "fastify";
import { authMiddleware } from "../middleware/auth";
import { FileUploadService, handleFileUpload } from "../services/file-upload";

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
    await handleFileUpload(request, reply, uploadService, {
      allowedTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
      ],
      maxSize: 5 * 1024 * 1024, // 5MB
      bucket: 'cryb-avatars',
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
    await handleFileUpload(request, reply, uploadService, {
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
      bucket: 'cryb-attachments',
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
    await handleFileUpload(request, reply, uploadService, {
      allowedTypes: [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        // Videos
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        // Audio
        'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'
      ],
      maxSize: 100 * 1024 * 1024, // 100MB
      bucket: 'cryb-media',
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
    await handleFileUpload(request, reply, uploadService, {
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
      bucket: 'cryb-attachments',
      scanForMalware: true
    });
  });

  /**
   * @swagger
   * /api/v1/uploads/signed-url:
   *   post:
   *     tags: [uploads]
   *     summary: Get signed upload URL
   *     description: Get a signed URL for direct browser uploads
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
   *         description: Signed URL generated successfully
   */
  fastify.post('/signed-url', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['uploads'],
      summary: 'Get signed upload URL',
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

      const result = await uploadService.generateSignedUploadUrl(
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

      // TODO: Verify user owns the file or has permission to delete it
      // This would require querying your database for file ownership

      // For now, we'll extract bucket and filename from the fileId
      // In a real implementation, you'd look this up in your database
      const bucket = 'cryb-uploads'; // Default bucket
      const filename = fileId; // Simplified - in reality you'd have proper file tracking

      await uploadService.deleteFile(bucket, filename);

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

      // TODO: Look up file information from database
      // For now, return placeholder data
      const bucket = 'cryb-uploads';
      const filename = fileId;

      const info = await uploadService.getFileInfo(bucket, filename);

      reply.send({
        success: true,
        data: {
          fileId,
          bucket,
          filename,
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

      // TODO: Look up file information from database and verify access permissions
      const bucket = 'cryb-uploads';
      const filename = fileId;

      const downloadUrl = await uploadService.getDownloadUrl(bucket, filename, expiresIn);

      reply.send({
        success: true,
        data: {
          downloadUrl,
          expiresIn,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
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
    await handleFileUpload(request, reply, uploadService, {
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
      summary: 'Cleanup temporary files',
      security: [{ Bearer: [] }]
    }
  }, async (request: any, reply) => {
    try {
      // TODO: Add admin permission check
      
      await uploadService.cleanupTempFiles();

      reply.send({
        success: true,
        message: 'Cleanup completed'
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
      const buckets = ['cryb-uploads', 'cryb-avatars', 'cryb-attachments', 'cryb-media', 'cryb-thumbnails'];
      const stats: any = {};

      for (const bucket of buckets) {
        try {
          const files = await uploadService.listFiles(bucket, undefined, 1000);
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
        data: stats
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