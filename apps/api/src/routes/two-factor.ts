import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { validate, validationSchemas } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import { createTwoFactorAuthService } from '../services/two-factor-auth';
import Redis from 'ioredis';
import { z } from 'zod';

// Create dedicated Redis client for 2FA
const twoFactorRedisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380/0');

// Validation schemas for 2FA endpoints
const twoFactorSchemas = {
  setup: z.object({
    body: z.object({})
  }),
  enable: z.object({
    body: z.object({
      verificationCode: z.string().regex(/^\\d{6}$/, 'Verification code must be 6 digits')
    })
  }),
  disable: z.object({
    body: z.object({
      verificationCode: z.string().min(6, 'Verification code is required'),
      currentPassword: z.string().optional()
    })
  }),
  verify: z.object({
    body: z.object({
      code: z.string().min(6, 'Verification code is required')
    })
  }),
  regenerateBackupCodes: z.object({
    body: z.object({
      verificationCode: z.string().regex(/^\\d{6}$/, 'Verification code must be 6 digits')
    })
  })
};

/**
 * Two-Factor Authentication routes
 */
export default async function twoFactorRoutes(fastify: FastifyInstance) {
  const twoFactorService = createTwoFactorAuthService(twoFactorRedisClient);
  
  // Helper function to get client info
  const getClientInfo = (request: any) => ({
    ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.ip,
    userAgent: request.headers['user-agent'] || 'unknown'
  });

  /**
   * GET /2fa/status
   * Get 2FA status for the current user
   */
  fastify.get('/status', {
    preHandler: authMiddleware,
    schema: {
      tags: ['2fa'],
      summary: 'Get 2FA status',
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                enabledAt: { type: 'string', format: 'date-time' },
                backupCodesRemaining: { type: 'number' },
                hasBackupCodes: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const status = await twoFactorService.getTwoFactorStatus(request.userId);

      reply.send({
        success: true,
        data: status
      });
    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, '2FA status check failed');
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to get 2FA status', 500, '2FA_STATUS_FAILED');
    }
  });

  /**
   * POST /2fa/setup
   * Generate 2FA setup (QR code and backup codes)
   */
  fastify.post('/setup', {
    preHandler: authMiddleware,
    schema: {
      tags: ['2fa'],
      summary: 'Generate 2FA setup',
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                secret: { type: 'string' },
                qrCodeDataURL: { type: 'string' },
                backupCodes: {
                  type: 'array',
                  items: { type: 'string' }
                },
                manualEntryKey: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      // Check if 2FA is already enabled
      const currentStatus = await twoFactorService.getTwoFactorStatus(request.userId);
      if (currentStatus.enabled) {
        throw new AppError('2FA is already enabled for this account', 400, '2FA_ALREADY_ENABLED');
      }

      const setup = await twoFactorService.generateTwoFactorSetup(
        request.userId,
        request.user?.email || undefined,
        'CRYB Platform'
      );

      reply.send({
        success: true,
        message: 'Please scan the QR code with your authenticator app and enter the verification code to enable 2FA',
        data: setup
      });
    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, '2FA setup generation failed');
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to generate 2FA setup', 500, '2FA_SETUP_FAILED');
    }
  });

  /**
   * POST /2fa/enable
   * Enable 2FA with verification code
   */
  fastify.post('/enable', {
    preHandler: [authMiddleware, validate({ body: twoFactorSchemas.enable.shape.body })],
    schema: {
      tags: ['2fa'],
      summary: 'Enable 2FA',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          verificationCode: { type: 'string', pattern: '^\\\\d{6}$' }
        },
        required: ['verificationCode']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                backupCodes: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { verificationCode } = request.body as { verificationCode: string };

      const result = await twoFactorService.enableTwoFactor(request.userId, verificationCode);

      if (!result.success) {
        throw new AppError(result.error || '2FA enable failed', 400, '2FA_ENABLE_FAILED');
      }

      reply.send({
        success: true,
        message: '2FA has been successfully enabled. Please save your backup codes in a secure place.',
        data: {
          backupCodes: result.backupCodes || []
        }
      });
    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, '2FA enable failed');
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to enable 2FA', 500, '2FA_ENABLE_FAILED');
    }
  });

  /**
   * POST /2fa/disable
   * Disable 2FA with verification
   */
  fastify.post('/disable', {
    preHandler: [authMiddleware, validate({ body: twoFactorSchemas.disable.shape.body })],
    schema: {
      tags: ['2fa'],
      summary: 'Disable 2FA',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          verificationCode: { type: 'string' },
          currentPassword: { type: 'string' }
        },
        required: ['verificationCode']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { verificationCode, currentPassword } = request.body as {
        verificationCode: string;
        currentPassword?: string;
      };

      const result = await twoFactorService.disableTwoFactor(
        request.userId,
        verificationCode,
        currentPassword
      );

      if (!result.success) {
        throw new AppError(result.error || '2FA disable failed', 400, '2FA_DISABLE_FAILED');
      }

      reply.send({
        success: true,
        message: '2FA has been successfully disabled'
      });
    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, '2FA disable failed');
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to disable 2FA', 500, '2FA_DISABLE_FAILED');
    }
  });

  /**
   * POST /2fa/verify
   * Verify 2FA code (for login process)
   */
  fastify.post('/verify', {
    preHandler: [authMiddleware, validate({ body: twoFactorSchemas.verify.shape.body })],
    schema: {
      tags: ['2fa'],
      summary: 'Verify 2FA code',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          code: { type: 'string' }
        },
        required: ['code']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                isBackupCode: { type: 'boolean' },
                remainingBackupCodes: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { code } = request.body as { code: string };
      const clientInfo = getClientInfo(request);

      const result = await twoFactorService.verifyTwoFactor(
        request.userId,
        code,
        clientInfo.ip
      );

      if (!result.success) {
        throw new AppError(result.error || 'Invalid verification code', 400, '2FA_VERIFY_FAILED');
      }

      let message = '2FA verification successful';
      if (result.isBackupCode) {
        message = `Backup code verified. You have ${result.remainingBackupCodes || 0} backup codes remaining.`;
        
        // Warn if running low on backup codes
        if ((result.remainingBackupCodes || 0) <= 2) {
          message += ' Consider regenerating backup codes.';
        }
      }

      reply.send({
        success: true,
        message,
        data: {
          isBackupCode: result.isBackupCode || false,
          remainingBackupCodes: result.remainingBackupCodes
        }
      });
    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, '2FA verify failed');
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to verify 2FA code', 500, '2FA_VERIFY_FAILED');
    }
  });

  /**
   * POST /2fa/backup-codes/regenerate
   * Regenerate backup codes
   */
  fastify.post('/backup-codes/regenerate', {
    preHandler: [authMiddleware, validate({ body: twoFactorSchemas.regenerateBackupCodes.shape.body })],
    schema: {
      tags: ['2fa'],
      summary: 'Regenerate backup codes',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          verificationCode: { type: 'string', pattern: '^\\\\d{6}$' }
        },
        required: ['verificationCode']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                backupCodes: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const { verificationCode } = request.body as { verificationCode: string };

      const result = await twoFactorService.regenerateBackupCodes(request.userId, verificationCode);

      if (!result.success) {
        throw new AppError(result.error || 'Backup code regeneration failed', 400, 'BACKUP_CODE_REGEN_FAILED');
      }

      reply.send({
        success: true,
        message: 'New backup codes generated. Please save them in a secure place. Previous backup codes are no longer valid.',
        data: {
          backupCodes: result.backupCodes || []
        }
      });
    } catch (error) {
      fastify.log.error({ error, userId: request.userId }, 'Backup code regeneration failed');
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to regenerate backup codes', 500, 'BACKUP_CODE_REGEN_FAILED');
    }
  });
}