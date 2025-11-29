import { FastifyInstance } from 'fastify';
import { createWebAuthnService } from '../services/webauthn-service';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Redis from 'ioredis';
import { prisma } from '@cryb/database';

export default async function webauthnRoutes(fastify: FastifyInstance) {
  // Create dedicated Redis client for WebAuthn service
  const webauthnRedisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380/1');
  
  // Initialize WebAuthn Service
  const webauthnService = createWebAuthnService(webauthnRedisClient, {
    rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
    rpName: process.env.WEBAUTHN_RP_NAME || 'CRYB Platform',
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000'
  });

  // Helper function to get client info
  const getClientInfo = (request: any) => ({
    ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.ip,
    userAgent: request.headers['user-agent'] || 'unknown'
  });

  /**
   * @swagger
   * /webauthn/register/begin:
   *   post:
   *     tags: [webauthn]
   *     summary: Begin WebAuthn registration
   *     security:
   *       - Bearer: []
   */
  fastify.post('/register/begin', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Begin WebAuthn registration',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          deviceName: { type: 'string', minLength: 1, maxLength: 100 },
          authenticatorType: { 
            type: 'string', 
            enum: ['platform', 'cross-platform'] 
          },
          userVerification: { 
            type: 'string', 
            enum: ['required', 'preferred', 'discouraged'],
            default: 'preferred'
          },
          attestation: { 
            type: 'string', 
            enum: ['none', 'indirect', 'direct'],
            default: 'none'
          },
          requireResidentKey: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                challenge: { type: 'string' },
                rp: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
                  }
                },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    displayName: { type: 'string' }
                  }
                },
                pubKeyCredParams: { type: 'array' },
                timeout: { type: 'number' },
                attestation: { type: 'string' },
                authenticatorSelection: { type: 'object' },
                excludeCredentials: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true
        }
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const {
        deviceName = 'WebAuthn Device',
        authenticatorType,
        userVerification = 'preferred',
        attestation = 'none',
        requireResidentKey = false
      } = request.body as any;

      const { publicKeyCredentialCreationOptions } = await webauthnService.generateRegistrationChallenge(
        user.id,
        user.email || user.username,
        user.displayName,
        {
          authenticatorAttachment: authenticatorType,
          userVerification: userVerification as 'required' | 'preferred' | 'discouraged',
          attestation: attestation as 'none' | 'indirect' | 'direct',
          requireResidentKey
        }
      );

      // Log registration attempt
      await prisma.webauthnUsageLog.create({
        data: {
          userId: user.id,
          actionType: 'registration',
          deviceName,
          clientIp: getClientInfo(request).ip,
          userAgent: getClientInfo(request).userAgent,
          success: true,
          userVerificationPerformed: userVerification === 'required',
          attestationType: attestation
        }
      });

      reply.send({
        success: true,
        data: publicKeyCredentialCreationOptions
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('WebAuthn registration begin error:', error);
      throw new AppError(
        'Failed to begin WebAuthn registration',
        500,
        'WEBAUTHN_REGISTRATION_BEGIN_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/register/complete:
   *   post:
   *     tags: [webauthn]
   *     summary: Complete WebAuthn registration
   *     security:
   *       - Bearer: []
   */
  fastify.post('/register/complete', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Complete WebAuthn registration',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          deviceName: { type: 'string', minLength: 1, maxLength: 100 },
          credential: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              rawId: { type: 'string' },
              response: {
                type: 'object',
                properties: {
                  attestationObject: { type: 'string' },
                  clientDataJSON: { type: 'string' }
                },
                required: ['attestationObject', 'clientDataJSON']
              },
              type: { type: 'string', enum: ['public-key'] }
            },
            required: ['id', 'rawId', 'response', 'type']
          }
        },
        required: ['credential']
      }
    }
  }, async (request, reply) => {
    try {
      const { deviceName = 'WebAuthn Device', credential } = request.body as any;
      const clientInfo = getClientInfo(request);

      const result = await webauthnService.verifyRegistration(
        request.userId,
        credential.id,
        credential.response.attestationObject,
        credential.response.clientDataJSON,
        deviceName
      );

      // Log registration result
      await prisma.webauthnUsageLog.create({
        data: {
          userId: request.userId,
          actionType: 'registration',
          credentialId: result.credentialId || credential.id,
          deviceName: result.deviceName || deviceName,
          clientIp: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          success: result.success,
          errorMessage: result.error
        }
      });

      if (!result.success) {
        throw new AppError(
          result.error || 'WebAuthn registration failed',
          400,
          'WEBAUTHN_REGISTRATION_FAILED'
        );
      }

      reply.send({
        success: true,
        message: 'WebAuthn device registered successfully',
        data: {
          credentialId: result.credentialId,
          deviceName: result.deviceName
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('WebAuthn registration complete error:', error);
      throw new AppError(
        'Failed to complete WebAuthn registration',
        500,
        'WEBAUTHN_REGISTRATION_COMPLETE_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/authenticate/begin:
   *   post:
   *     tags: [webauthn]
   *     summary: Begin WebAuthn authentication
   */
  fastify.post('/authenticate/begin', {
    schema: {
      tags: ['webauthn'],
      summary: 'Begin WebAuthn authentication',
      body: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          userVerification: { 
            type: 'string', 
            enum: ['required', 'preferred', 'discouraged'],
            default: 'preferred'
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { username, userVerification = 'preferred' } = request.body as any;
      
      let userId: string | undefined;
      if (username) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username },
              { email: username }
            ]
          },
          select: { id: true }
        });
        userId = user?.id;
      }

      const { publicKeyCredentialRequestOptions } = await webauthnService.generateAuthenticationChallenge(
        userId,
        {
          userVerification: userVerification as 'required' | 'preferred' | 'discouraged'
        }
      );

      reply.send({
        success: true,
        data: publicKeyCredentialRequestOptions
      });

    } catch (error) {
      console.error('WebAuthn authentication begin error:', error);
      throw new AppError(
        'Failed to begin WebAuthn authentication',
        500,
        'WEBAUTHN_AUTHENTICATION_BEGIN_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/authenticate/complete:
   *   post:
   *     tags: [webauthn]
   *     summary: Complete WebAuthn authentication
   */
  fastify.post('/authenticate/complete', {
    schema: {
      tags: ['webauthn'],
      summary: 'Complete WebAuthn authentication',
      body: {
        type: 'object',
        properties: {
          credential: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              rawId: { type: 'string' },
              response: {
                type: 'object',
                properties: {
                  authenticatorData: { type: 'string' },
                  clientDataJSON: { type: 'string' },
                  signature: { type: 'string' },
                  userHandle: { type: 'string' }
                },
                required: ['authenticatorData', 'clientDataJSON', 'signature']
              },
              type: { type: 'string', enum: ['public-key'] }
            },
            required: ['id', 'rawId', 'response', 'type']
          }
        },
        required: ['credential']
      }
    }
  }, async (request, reply) => {
    try {
      const { credential } = request.body as any;
      const clientInfo = getClientInfo(request);

      const result = await webauthnService.verifyAuthentication(
        credential.id,
        credential.response.authenticatorData,
        credential.response.clientDataJSON,
        credential.response.signature,
        credential.response.userHandle
      );

      // Log authentication attempt
      if (result.userHandle) {
        await prisma.webauthnUsageLog.create({
          data: {
            userId: result.userHandle,
            actionType: 'authentication',
            credentialId: result.credentialId || credential.id,
            clientIp: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            success: result.success,
            errorMessage: result.error,
            userVerificationPerformed: result.userVerified
          }
        });
      }

      if (!result.success) {
        throw new AppError(
          result.error || 'WebAuthn authentication failed',
          401,
          'WEBAUTHN_AUTHENTICATION_FAILED'
        );
      }

      // Get user data for token generation
      const user = await prisma.user.findUnique({
        where: { id: result.userHandle },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isVerified: true
        }
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Generate authentication tokens (reuse logic from auth service)
      const { EnhancedAuthService } = await import('../services/enhanced-auth');
      const authService = new EnhancedAuthService(webauthnRedisClient);
      
      const tokens = await authService.generateTokens(user.id, {
        deviceInfo: `WebAuthn authentication from ${clientInfo.userAgent}`,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      });

      reply.send({
        success: true,
        message: 'WebAuthn authentication successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            isVerified: user.isVerified
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt.toISOString()
          },
          webauthn: {
            credentialId: result.credentialId,
            userVerified: result.userVerified,
            counter: result.counter
          }
        }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('WebAuthn authentication complete error:', error);
      throw new AppError(
        'Failed to complete WebAuthn authentication',
        500,
        'WEBAUTHN_AUTHENTICATION_COMPLETE_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/devices:
   *   get:
   *     tags: [webauthn]
   *     summary: Get user's registered WebAuthn devices
   *     security:
   *       - Bearer: []
   */
  fastify.get('/devices', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Get user\'s registered WebAuthn devices',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const devices = await webauthnService.getUserCredentials(request.userId);
      
      reply.send({
        success: true,
        data: {
          devices: devices.map(device => ({
            id: device.id,
            deviceName: device.deviceName,
            deviceType: device.deviceType,
            attestationType: device.attestationType,
            createdAt: device.createdAt,
            lastUsed: device.lastUsed,
            userVerified: device.userVerified,
            backupEligible: device.backupEligible,
            backupState: device.backupState
          }))
        }
      });

    } catch (error) {
      console.error('Failed to get WebAuthn devices:', error);
      throw new AppError(
        'Failed to get WebAuthn devices',
        500,
        'WEBAUTHN_GET_DEVICES_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/devices/{credentialId}:
   *   put:
   *     tags: [webauthn]
   *     summary: Update WebAuthn device name
   *     security:
   *       - Bearer: []
   */
  fastify.put('/devices/:credentialId', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Update WebAuthn device name',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          credentialId: { type: 'string' }
        },
        required: ['credentialId']
      },
      body: {
        type: 'object',
        properties: {
          deviceName: { type: 'string', minLength: 1, maxLength: 100 }
        },
        required: ['deviceName']
      }
    }
  }, async (request, reply) => {
    try {
      const { credentialId } = request.params as any;
      const { deviceName } = request.body as any;
      const clientInfo = getClientInfo(request);

      const result = await webauthnService.updateAuthenticatorName(
        request.userId,
        credentialId,
        deviceName
      );

      // Log update attempt
      await prisma.webauthnUsageLog.create({
        data: {
          userId: request.userId,
          actionType: 'update',
          credentialId,
          deviceName,
          clientIp: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          success: result.success,
          errorMessage: result.error
        }
      });

      if (!result.success) {
        throw new AppError(
          result.error || 'Failed to update device name',
          400,
          'WEBAUTHN_UPDATE_FAILED'
        );
      }

      reply.send({
        success: true,
        message: 'Device name updated successfully'
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Failed to update WebAuthn device:', error);
      throw new AppError(
        'Failed to update WebAuthn device',
        500,
        'WEBAUTHN_UPDATE_DEVICE_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/devices/{credentialId}:
   *   delete:
   *     tags: [webauthn]
   *     summary: Remove WebAuthn device
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/devices/:credentialId', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Remove WebAuthn device',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          credentialId: { type: 'string' }
        },
        required: ['credentialId']
      }
    }
  }, async (request, reply) => {
    try {
      const { credentialId } = request.params as any;
      const clientInfo = getClientInfo(request);

      const result = await webauthnService.removeAuthenticator(
        request.userId,
        credentialId
      );

      // Log removal attempt
      await prisma.webauthnUsageLog.create({
        data: {
          userId: request.userId,
          actionType: 'removal',
          credentialId,
          clientIp: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          success: result.success,
          errorMessage: result.error
        }
      });

      if (!result.success) {
        throw new AppError(
          result.error || 'Failed to remove device',
          400,
          'WEBAUTHN_REMOVAL_FAILED'
        );
      }

      reply.send({
        success: true,
        message: 'WebAuthn device removed successfully'
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Failed to remove WebAuthn device:', error);
      throw new AppError(
        'Failed to remove WebAuthn device',
        500,
        'WEBAUTHN_REMOVE_DEVICE_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/preferences:
   *   get:
   *     tags: [webauthn]
   *     summary: Get user's WebAuthn preferences
   *     security:
   *       - Bearer: []
   */
  fastify.get('/preferences', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Get user\'s WebAuthn preferences',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const preferences = await prisma.userAuthPreferences.findUnique({
        where: { userId: request.userId }
      });

      const defaultPreferences = {
        allowPasswordless: false,
        requireWebauthn: false,
        preferredWebauthnMethod: 'any',
        requireUserVerification: false,
        maxSessionDuration: '24 hours',
        requireFreshAuthForSensitive: true
      };

      reply.send({
        success: true,
        data: {
          preferences: preferences ? {
            allowPasswordless: preferences.allowPasswordless,
            requireWebauthn: preferences.requireWebauthn,
            preferredWebauthnMethod: preferences.preferredWebauthnMethod,
            requireUserVerification: preferences.requireUserVerification,
            maxSessionDuration: preferences.maxSessionDuration,
            requireFreshAuthForSensitive: preferences.requireFreshAuthForSensitive
          } : defaultPreferences
        }
      });

    } catch (error) {
      console.error('Failed to get WebAuthn preferences:', error);
      throw new AppError(
        'Failed to get WebAuthn preferences',
        500,
        'WEBAUTHN_GET_PREFERENCES_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/preferences:
   *   put:
   *     tags: [webauthn]
   *     summary: Update user's WebAuthn preferences
   *     security:
   *       - Bearer: []
   */
  fastify.put('/preferences', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Update user\'s WebAuthn preferences',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          allowPasswordless: { type: 'boolean' },
          requireWebauthn: { type: 'boolean' },
          preferredWebauthnMethod: { 
            type: 'string', 
            enum: ['platform', 'cross-platform', 'any'] 
          },
          requireUserVerification: { type: 'boolean' },
          requireFreshAuthForSensitive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const updateData = request.body as any;

      const preferences = await prisma.userAuthPreferences.upsert({
        where: { userId: request.userId },
        update: updateData,
        create: {
          userId: request.userId,
          ...updateData
        }
      });

      reply.send({
        success: true,
        message: 'WebAuthn preferences updated successfully',
        data: {
          preferences: {
            allowPasswordless: preferences.allowPasswordless,
            requireWebauthn: preferences.requireWebauthn,
            preferredWebauthnMethod: preferences.preferredWebauthnMethod,
            requireUserVerification: preferences.requireUserVerification,
            requireFreshAuthForSensitive: preferences.requireFreshAuthForSensitive
          }
        }
      });

    } catch (error) {
      console.error('Failed to update WebAuthn preferences:', error);
      throw new AppError(
        'Failed to update WebAuthn preferences',
        500,
        'WEBAUTHN_UPDATE_PREFERENCES_FAILED'
      );
    }
  });

  /**
   * @swagger
   * /webauthn/security/summary:
   *   get:
   *     tags: [webauthn]
   *     summary: Get user's WebAuthn security summary
   *     security:
   *       - Bearer: []
   */
  fastify.get('/security/summary', {
    preHandler: authMiddleware,
    schema: {
      tags: ['webauthn'],
      summary: 'Get user\'s WebAuthn security summary',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      // Get summary using database function
      const [summary] = await prisma.$queryRaw`
        SELECT * FROM get_user_webauthn_summary(${request.userId})
      ` as any[];

      reply.send({
        success: true,
        data: {
          summary: {
            totalAuthenticators: summary?.total_authenticators || 0,
            activeAuthenticators: summary?.active_authenticators || 0,
            platformAuthenticators: summary?.platform_authenticators || 0,
            crossPlatformAuthenticators: summary?.cross_platform_authenticators || 0,
            recentlyUsedCount: summary?.recently_used_count || 0,
            passwordlessEnabled: summary?.passwordless_enabled || false
          }
        }
      });

    } catch (error) {
      console.error('Failed to get WebAuthn security summary:', error);
      throw new AppError(
        'Failed to get WebAuthn security summary',
        500,
        'WEBAUTHN_GET_SUMMARY_FAILED'
      );
    }
  });
}