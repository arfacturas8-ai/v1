import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gdprService } from '../services/gdpr-compliance';
import { authMiddleware } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@cryb/database';

interface GDPRRequestBody {
  reason?: string;
  confirmEmail?: string;
}

interface DataExportRequest {
  format?: 'json' | 'csv' | 'xml';
}

interface DataDeletionRequest {
  deletionType?: 'soft' | 'hard';
  confirmPassword?: string;
  reason?: string;
}

export default async function gdprRoutes(fastify: FastifyInstance) {
  // Apply rate limiting to all GDPR routes
  fastify.addHook('onRequest', rateLimiters.general);

  /**
   * Request data export (GDPR Article 15)
   * POST /api/v1/gdpr/export
   */
  fastify.post<{
    Body: DataExportRequest;
  }>('/export', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['GDPR'],
      summary: 'Request data export',
      description: 'Request a complete export of all user data in compliance with GDPR Article 15',
      body: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['json', 'csv', 'xml'],
            default: 'json',
            description: 'Export format'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            requestId: { type: 'string' },
            message: { type: 'string' },
            estimatedCompletion: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: DataExportRequest }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { format = 'json' } = request.body;

      // Check if user has any pending export requests
      const existingRequest = await prisma.gDPRRequest.findFirst({
        where: {
          userId,
          type: 'DATA_EXPORT',
          status: { in: ['pending', 'processing'] }
        }
      });

      if (existingRequest) {
        return reply.code(409).send({
          success: false,
          error: 'A data export request is already in progress',
          requestId: existingRequest.id
        });
      }

      const requestId = await gdprService.requestDataExport(userId, format);

      return reply.send({
        success: true,
        requestId,
        message: 'Data export request has been submitted. You will receive an email when the export is ready.',
        estimatedCompletion: 'Within 72 hours'
      });

    } catch (error) {
      request.log.error('Failed to request data export:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to process data export request'
      });
    }
  });

  /**
   * Download exported data
   * GET /api/v1/gdpr/export/:requestId/download
   */
  fastify.get<{
    Params: { requestId: string };
  }>('/export/:requestId/download', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['GDPR'],
      summary: 'Download exported data',
      description: 'Download the exported data archive',
      params: {
        type: 'object',
        properties: {
          requestId: { type: 'string' }
        },
        required: ['requestId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { requestId: string } }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { requestId } = request.params;

      // Verify the request belongs to the user and is completed
      const exportRequest = await prisma.gDPRRequest.findFirst({
        where: {
          id: requestId,
          userId,
          type: 'DATA_EXPORT',
          status: 'completed'
        }
      });

      if (!exportRequest) {
        return reply.code(404).send({
          success: false,
          error: 'Export request not found or not completed'
        });
      }

      // Get the exported data
      const exportData = await gdprService.exportUserData(userId);

      // Create a temporary zip file
      const tempDir = path.join(__dirname, '../../temp');
      const zipPath = path.join(tempDir, `user-data-export-${requestId}.zip`);

      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      // Add data files to the archive
      archive.append(JSON.stringify(exportData, null, 2), { name: 'user-data.json' });

      // Add privacy notice
      const privacyNotice = `
GDPR Data Export
Generated: ${new Date().toISOString()}
Request ID: ${requestId}
User ID: ${userId}

This archive contains all personal data we have collected about you.
You have the right to:
- Request corrections to this data
- Request deletion of this data
- Withdraw consent for data processing
- File a complaint with your local data protection authority

For any questions, please contact our Data Protection Officer at privacy@cryb.ai
      `;
      archive.append(privacyNotice.trim(), { name: 'README.txt' });

      await archive.finalize();

      // Wait for the file to be written
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
      });

      // Send the file
      reply.type('application/zip');
      reply.header('Content-Disposition', `attachment; filename="cryb-user-data-export-${new Date().toISOString().split('T')[0]}.zip"`);

      const fileStream = require('fs').createReadStream(zipPath);
      
      // Clean up the temp file after sending
      fileStream.on('end', async () => {
        try {
          await unlink(zipPath);
        } catch (error) {
          request.log.error('Failed to clean up temp file:', error);
        }
      });

      return reply.send(fileStream);

    } catch (error) {
      request.log.error('Failed to download export:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate download'
      });
    }
  });

  /**
   * Request data deletion (GDPR Article 17 - Right to be forgotten)
   * POST /api/v1/gdpr/delete
   */
  fastify.post<{
    Body: DataDeletionRequest;
  }>('/delete', {
    preHandler: [authMiddleware, rateLimiters.strict],
    schema: {
      tags: ['GDPR'],
      summary: 'Request data deletion',
      description: 'Request deletion of all user data in compliance with GDPR Article 17',
      body: {
        type: 'object',
        properties: {
          deletionType: {
            type: 'string',
            enum: ['soft', 'hard'],
            default: 'soft',
            description: 'Type of deletion: soft (anonymize) or hard (complete removal)'
          },
          confirmPassword: {
            type: 'string',
            description: 'Current password confirmation'
          },
          reason: {
            type: 'string',
            description: 'Optional reason for deletion'
          }
        },
        required: ['confirmPassword']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            requestId: { type: 'string' },
            message: { type: 'string' },
            scheduledFor: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: DataDeletionRequest }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { deletionType = 'soft', confirmPassword, reason } = request.body;

      // Verify password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Note: You'll need to implement password verification here
      // const bcrypt = require('bcrypt');
      // const isValidPassword = await bcrypt.compare(confirmPassword, user.password);
      // if (!isValidPassword) {
      //   return reply.code(403).send({
      //     success: false,
      //     error: 'Invalid password'
      //   });
      // }

      // Check for existing deletion requests
      const existingRequest = await prisma.gDPRRequest.findFirst({
        where: {
          userId,
          type: 'DATA_DELETION',
          status: { in: ['pending', 'processing'] }
        }
      });

      if (existingRequest) {
        return reply.code(409).send({
          success: false,
          error: 'A data deletion request is already in progress',
          requestId: existingRequest.id
        });
      }

      const requestId = await gdprService.requestDataDeletion(userId, deletionType, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || '',
        reason
      });

      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 24); // 24 hour delay

      return reply.send({
        success: true,
        requestId,
        message: 'Data deletion request has been submitted. The deletion will be processed after a 24-hour grace period.',
        scheduledFor: scheduledDate.toISOString()
      });

    } catch (error) {
      request.log.error('Failed to request data deletion:', error);
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process deletion request'
      });
    }
  });

  /**
   * Cancel deletion request
   * POST /api/v1/gdpr/delete/:requestId/cancel
   */
  fastify.post<{
    Params: { requestId: string };
  }>('/delete/:requestId/cancel', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['GDPR'],
      summary: 'Cancel deletion request',
      description: 'Cancel a pending data deletion request',
      params: {
        type: 'object',
        properties: {
          requestId: { type: 'string' }
        },
        required: ['requestId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { requestId: string } }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { requestId } = request.params;

      const deletionRequest = await prisma.gDPRRequest.findFirst({
        where: {
          id: requestId,
          userId,
          type: 'DATA_DELETION',
          status: 'pending'
        }
      });

      if (!deletionRequest) {
        return reply.code(404).send({
          success: false,
          error: 'Deletion request not found or cannot be cancelled'
        });
      }

      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: 'cancelled',
          completedAt: new Date()
        }
      });

      return reply.send({
        success: true,
        message: 'Deletion request has been cancelled'
      });

    } catch (error) {
      request.log.error('Failed to cancel deletion request:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to cancel deletion request'
      });
    }
  });

  /**
   * Get GDPR request status
   * GET /api/v1/gdpr/requests
   */
  fastify.get('/requests', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['GDPR'],
      summary: 'Get GDPR requests',
      description: 'Get all GDPR requests for the current user',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            requests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  requestedAt: { type: 'string' },
                  completedAt: { type: 'string', nullable: true }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.userId!;

      const requests = await prisma.gDPRRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          type: true,
          status: true,
          requestedAt: true,
          completedAt: true
        }
      });

      return reply.send({
        success: true,
        requests
      });

    } catch (error) {
      request.log.error('Failed to get GDPR requests:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve requests'
      });
    }
  });

  /**
   * Get privacy policy and data usage information
   * GET /api/v1/gdpr/privacy-info
   */
  fastify.get('/privacy-info', {
    schema: {
      tags: ['GDPR'],
      summary: 'Get privacy information',
      description: 'Get information about data collection and usage'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      dataCollection: {
        personalData: [
          'Email address',
          'Username and display name',
          'Profile information',
          'Messages and posts',
          'Usage analytics',
          'IP addresses and session data'
        ],
        purposes: [
          'Provide platform services',
          'Improve user experience',
          'Security and fraud prevention',
          'Legal compliance',
          'Customer support'
        ],
        legalBasis: [
          'Consent (Article 6(1)(a) GDPR)',
          'Contract performance (Article 6(1)(b) GDPR)',
          'Legitimate interests (Article 6(1)(f) GDPR)',
          'Legal obligations (Article 6(1)(c) GDPR)'
        ],
        retention: {
          userProfiles: '30 days after deletion request',
          messages: '90 days after user deletion',
          analytics: '365 days',
          moderationLogs: '3 years',
          financialRecords: '7 years'
        },
        rights: [
          'Right to access your data',
          'Right to rectify incorrect data',
          'Right to delete your data',
          'Right to restrict processing',
          'Right to data portability',
          'Right to object to processing',
          'Right to withdraw consent'
        ]
      },
      contact: {
        dpo: 'privacy@cryb.ai',
        address: 'Data Protection Officer, Cryb Platform',
        supervisoryAuthority: 'Contact your local data protection authority'
      },
      lastUpdated: '2024-01-01T00:00:00Z'
    });
  });

  /**
   * Data portability - export in machine-readable format
   * GET /api/v1/gdpr/portability
   */
  fastify.get('/portability', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['GDPR'],
      summary: 'Data portability export',
      description: 'Export user data in machine-readable format for portability'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const exportData = await gdprService.exportUserData(userId, 'json');

      reply.type('application/json');
      reply.header('Content-Disposition', 'attachment; filename="cryb-data-export.json"');

      return reply.send(exportData);

    } catch (error) {
      request.log.error('Failed to export data for portability:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to export data'
      });
    }
  });
}