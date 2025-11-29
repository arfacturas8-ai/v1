import { FastifyInstance } from 'fastify';
import { createPasswordlessAuthService } from '../services/passwordless-auth-service';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Redis from 'ioredis';
import { prisma } from '@cryb/database';

export default async function passwordlessRoutes(fastify: FastifyInstance) {
  // Create dedicated Redis client for passwordless service
  const passwordlessRedisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380/2');
  
  // Initialize Passwordless Service
  const passwordlessService = createPasswordlessAuthService(passwordlessRedisClient);

  // Helper function to get client info
  const getClientInfo = (request: any) => ({
    ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.ip,
    userAgent: request.headers['user-agent'] || 'unknown',
    deviceId: request.headers['x-device-id'] || undefined
  });

  /**
   * @swagger
   * /passwordless/initiate:
   *   post:
   *     tags: [passwordless]
   *     summary: Initiate passwordless authentication
   */
  fastify.post('/initiate', {
    schema: {
      tags: ['passwordless'],
      summary: 'Initiate passwordless authentication',
      body: {
        type: 'object',
        properties: {
          identifier: { 
            type: 'string', 
            description: 'Email, phone number, or username',
            minLength: 1
          },
          method: { 
            type: 'string', 
            enum: ['webauthn', 'magic-link', 'sms', 'qr-code'],
            description: 'Authentication method'
          },
          redirectUrl: { 
            type: 'string', 
            format: 'uri',
            description: 'Redirect URL for magic links'
          }
        },
        required: ['identifier', 'method']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                challengeId: { type: 'string' },
                challenge: { type: 'object' },
                metadata: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { identifier, method, redirectUrl } = request.body as any;
      const clientInfo = getClientInfo(request);

      const result = await passwordlessService.initiatePasswordlessAuth(
        identifier,
        method,
        {
          redirectUrl,
          deviceInfo: clientInfo,
          clientInfo
        }
      );

      if (!result.success) {
        throw new AppError(
          result.error || 'Failed to initiate passwordless authentication',
          400,
          'PASSWORDLESS_INITIATION_FAILED'
        );
      }

      reply.send({
        success: true,
        data: {
          challengeId: result.challengeId,
          challenge: result.challenge,
          metadata: result.metadata
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Passwordless initiation error:', error);
      throw new AppError(
        'Failed to initiate passwordless authentication',
        500,
        'PASSWORDLESS_INITIATION_ERROR'
      );
    }
  });

  /**
   * @swagger
   * /passwordless/complete:
   *   post:
   *     tags: [passwordless]
   *     summary: Complete passwordless authentication
   */
  fastify.post('/complete', {
    schema: {
      tags: ['passwordless'],
      summary: 'Complete passwordless authentication',
      body: {
        type: 'object',
        properties: {
          challengeId: { type: 'string' },
          response: { 
            type: 'object',
            description: 'Method-specific response data'
          }
        },
        required: ['challengeId', 'response']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    displayName: { type: 'string' },
                    email: { type: 'string' },
                    isVerified: { type: 'boolean' }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresAt: { type: 'string' }
                  }
                },
                session: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { challengeId, response } = request.body as any;
      const clientInfo = getClientInfo(request);

      const result = await passwordlessService.completePasswordlessAuth(
        challengeId,
        response,
        clientInfo
      );

      if (!result.success) {
        throw new AppError(
          result.error || 'Passwordless authentication failed',
          401,
          'PASSWORDLESS_AUTHENTICATION_FAILED'
        );
      }

      reply.send({
        success: true,
        message: 'Passwordless authentication successful',
        data: {
          user: result.user,
          tokens: result.tokens,
          session: {
            sessionId: result.session?.sessionId,
            authMethod: result.session?.authMethod,
            expiresAt: result.session?.expiresAt
          }
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Passwordless completion error:', error);
      throw new AppError(
        'Failed to complete passwordless authentication',
        500,
        'PASSWORDLESS_COMPLETION_ERROR'
      );
    }
  });

  /**
   * @swagger
   * /passwordless/magic-link/verify:
   *   get:
   *     tags: [passwordless]
   *     summary: Verify magic link token
   */
  fastify.get('/magic-link/verify', {
    schema: {
      tags: ['passwordless'],
      summary: 'Verify magic link token',
      querystring: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          redirect: { type: 'string', format: 'uri' }
        },
        required: ['token']
      }
    }
  }, async (request, reply) => {
    try {
      const { token, redirect } = request.query as any;

      // For magic link verification, we need to find the challenge by token
      // This is a simplified implementation - in production, you might want to
      // store token mappings in Redis for faster lookup
      
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const redirectUrl = new URL(redirect || '/auth/magic-link-success', frontendUrl);
      
      // Add token to redirect URL for frontend to complete authentication
      redirectUrl.searchParams.set('token', token);
      
      reply.redirect(redirectUrl.toString());

    } catch (error) {
      console.error('Magic link verification error:', error);
      
      // Redirect to error page
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const errorUrl = new URL('/auth/magic-link-error', frontendUrl);
      errorUrl.searchParams.set('error', 'verification_failed');
      
      reply.redirect(errorUrl.toString());
    }
  });

  /**
   * @swagger
   * /passwordless/biometric/setup:
   *   post:
   *     tags: [passwordless]
   *     summary: Setup biometric authentication
   *     security:
   *       - Bearer: []
   */
  fastify.post('/biometric/setup', {
    preHandler: authMiddleware,
    schema: {
      tags: ['passwordless'],
      summary: 'Setup biometric authentication',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          biometricType: { 
            type: 'string', 
            enum: ['fingerprint', 'face', 'voice', 'iris'] 
          },
          biometricData: { 
            type: 'string',
            description: 'Base64 encoded biometric template'
          },
          requireLiveness: { type: 'boolean', default: true },
          confidenceThreshold: { 
            type: 'number', 
            minimum: 0.5, 
            maximum: 1.0, 
            default: 0.8 
          }
        },
        required: ['biometricType', 'biometricData']
      }
    }
  }, async (request, reply) => {
    try {
      const { 
        biometricType, 
        biometricData, 
        requireLiveness = true, 
        confidenceThreshold = 0.8 
      } = request.body as any;

      const result = await passwordlessService.setupBiometricAuth(
        request.userId,
        biometricType,
        biometricData,
        {
          biometricType,
          requireLiveness,
          confidenceThreshold
        }
      );

      if (!result.success) {
        throw new AppError(
          result.error || 'Failed to setup biometric authentication',
          400,
          'BIOMETRIC_SETUP_FAILED'
        );
      }

      reply.send({
        success: true,
        message: 'Biometric authentication setup successful',
        data: {
          biometricId: result.biometricId,
          biometricType,
          requireLiveness,
          confidenceThreshold
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Biometric setup error:', error);
      throw new AppError(
        'Failed to setup biometric authentication',
        500,
        'BIOMETRIC_SETUP_ERROR'
      );
    }
  });

  /**
   * @swagger
   * /passwordless/biometric/verify:
   *   post:
   *     tags: [passwordless]
   *     summary: Verify biometric authentication
   */
  fastify.post('/biometric/verify', {
    schema: {
      tags: ['passwordless'],
      summary: 'Verify biometric authentication',
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          biometricType: { 
            type: 'string', 
            enum: ['fingerprint', 'face', 'voice', 'iris'] 
          },
          biometricData: { 
            type: 'string',
            description: 'Base64 encoded biometric data for verification'
          },
          livenessData: { 
            type: 'string',
            description: 'Liveness verification data if required'
          }
        },
        required: ['userId', 'biometricType', 'biometricData']
      }
    }
  }, async (request, reply) => {
    try {
      const { userId, biometricType, biometricData, livenessData } = request.body as any;

      const result = await passwordlessService.verifyBiometricAuth(
        userId,
        biometricType,
        biometricData,
        livenessData
      );

      if (!result.success) {
        throw new AppError(
          result.error || 'Biometric verification failed',
          401,
          'BIOMETRIC_VERIFICATION_FAILED'
        );
      }

      reply.send({
        success: true,
        message: 'Biometric verification successful',
        data: {
          confidence: result.confidence,
          biometricType
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Biometric verification error:', error);
      throw new AppError(
        'Failed to verify biometric authentication',
        500,
        'BIOMETRIC_VERIFICATION_ERROR'
      );
    }
  });

  /**
   * @swagger
   * /passwordless/qr-code/status:
   *   get:
   *     tags: [passwordless]
   *     summary: Get QR code authentication status
   */
  fastify.get('/qr-code/status/:challengeId', {
    schema: {
      tags: ['passwordless'],
      summary: 'Get QR code authentication status',
      params: {
        type: 'object',
        properties: {
          challengeId: { type: 'string' }
        },
        required: ['challengeId']
      }
    }
  }, async (request, reply) => {
    try {
      const { challengeId } = request.params as any;

      // Get challenge status from Redis
      const challengeData = await passwordlessRedisClient.get(`passwordless_challenge:${challengeId}`);
      
      if (!challengeData) {
        throw new AppError('Challenge not found or expired', 404, 'CHALLENGE_NOT_FOUND');
      }

      const challenge = JSON.parse(challengeData);
      
      reply.send({
        success: true,
        data: {
          status: challenge.metadata.scanned ? 'scanned' : 'pending',
          expiresAt: challenge.expiresAt,
          metadata: {
            scanned: challenge.metadata.scanned,
            deviceId: challenge.metadata.deviceId
          }
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('QR code status error:', error);
      throw new AppError(
        'Failed to get QR code status',
        500,
        'QR_CODE_STATUS_ERROR'
      );
    }
  });

  /**
   * @swagger
   * /passwordless/methods:
   *   get:
   *     tags: [passwordless]
   *     summary: Get available passwordless methods for user
   */
  fastify.get('/methods/:identifier', {
    schema: {
      tags: ['passwordless'],
      summary: 'Get available passwordless methods for user',
      params: {
        type: 'object',
        properties: {
          identifier: { type: 'string' }
        },
        required: ['identifier']
      }
    }
  }, async (request, reply) => {
    try {
      const { identifier } = request.params as any;

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
            { phoneNumber: identifier }
          ]
        },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          isVerified: true
        }
      });

      let availableMethods = ['magic-link', 'qr-code'];

      if (user) {
        // Check for WebAuthn credentials
        const webauthnCredentials = await prisma.authenticatorDevice.count({
          where: {
            userId: user.id,
            isActive: true
          }
        });

        if (webauthnCredentials > 0) {
          availableMethods.push('webauthn');
        }

        // Check for SMS capability
        if (user.phoneNumber) {
          availableMethods.push('sms');
        }

        // Check for biometric setup
        const biometricCount = await prisma.biometricAuth.count({
          where: {
            userId: user.id,
            isActive: true
          }
        });

        if (biometricCount > 0) {
          availableMethods.push('biometric');
        }
      }

      reply.send({
        success: true,
        data: {
          userExists: !!user,
          availableMethods,
          capabilities: {
            webauthn: availableMethods.includes('webauthn'),
            magicLink: availableMethods.includes('magic-link'),
            sms: availableMethods.includes('sms'),
            qrCode: availableMethods.includes('qr-code'),
            biometric: availableMethods.includes('biometric')
          },
          userInfo: user ? {
            hasEmail: !!user.email,
            hasPhone: !!user.phoneNumber,
            isVerified: user.isVerified
          } : null
        }
      });

    } catch (error) {
      console.error('Get passwordless methods error:', error);
      throw new AppError(
        'Failed to get passwordless methods',
        500,
        'GET_PASSWORDLESS_METHODS_ERROR'
      );
    }
  });

  /**
   * @swagger
   * /passwordless/sessions:
   *   get:
   *     tags: [passwordless]
   *     summary: Get active passwordless sessions
   *     security:
   *       - Bearer: []
   */
  fastify.get('/sessions', {
    preHandler: authMiddleware,
    schema: {
      tags: ['passwordless'],
      summary: 'Get active passwordless sessions',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      // Get all passwordless sessions for user
      const sessionKeys = await passwordlessRedisClient.keys(`passwordless_session:*`);
      const sessions = [];

      for (const key of sessionKeys) {
        const sessionData = await passwordlessRedisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === request.userId && session.isActive) {
            sessions.push({
              sessionId: session.sessionId,
              authMethod: session.authMethod,
              deviceInfo: session.deviceInfo,
              expiresAt: session.expiresAt,
              createdAt: session.createdAt
            });
          }
        }
      }

      reply.send({
        success: true,
        data: {
          sessions: sessions.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        }
      });

    } catch (error) {
      console.error('Get passwordless sessions error:', error);
      throw new AppError(
        'Failed to get passwordless sessions',
        500,
        'GET_PASSWORDLESS_SESSIONS_ERROR'
      );
    }
  });
}