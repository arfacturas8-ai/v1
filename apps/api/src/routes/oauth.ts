import { FastifyInstance } from 'fastify';
import { OAuthService } from '../services/oauth-service';
import { EnhancedAuthService } from '../services/enhanced-auth';
import { AppError } from '../middleware/errorHandler';
import { validate, validationSchemas } from '../middleware/validation';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { z } from 'zod';
import Redis from 'ioredis';

/**
 * OAuth authentication routes with comprehensive error handling
 */
export default async function oauthRoutes(fastify: FastifyInstance) {
  // Initialize OAuth service
  const oauthService = new OAuthService([
    {
      name: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      scopes: ['openid', 'email', 'profile']
    },
    {
      name: 'discord',
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
      scopes: ['identify', 'email']
    },
    {
      name: 'github',
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback',
      scopes: ['user:email']
    }
  ]);

  // Create dedicated Redis client for auth service to avoid subscriber mode issues
  const authRedisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380/0');
  const authService = new EnhancedAuthService(authRedisClient);

  // Helper to get client info
  const getClientInfo = (request: any) => ({
    ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.ip,
    userAgent: request.headers['user-agent'] || 'unknown'
  });

  // Validation schemas
  const oauthSchemas = {
    authorize: {
      query: z.object({
        provider: z.enum(['google', 'discord', 'github']),
        redirect_uri: z.string().url().optional()
      })
    },
    callback: {
      query: z.object({
        code: z.string().optional(),
        state: z.string(),
        error: z.string().optional(),
        error_description: z.string().optional()
      }),
      params: z.object({
        provider: z.enum(['google', 'discord', 'github'])
      })
    },
    link: {
      params: z.object({
        provider: z.enum(['google', 'discord', 'github'])
      }),
      query: z.object({
        redirect_uri: z.string().url().optional()
      })
    },
    unlink: {
      params: z.object({
        provider: z.enum(['google', 'discord', 'github'])
      })
    }
  };

  /**
   * GET /oauth/authorize/:provider
   * Start OAuth flow
   */
  fastify.get('/authorize/:provider', {
    preHandler: [optionalAuthMiddleware, validate({ params: oauthSchemas.authorize.query })],
    schema: {
      tags: ['oauth'],
      summary: 'Start OAuth authorization flow',
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google', 'discord', 'github'] }
        },
        required: ['provider']
      },
      querystring: {
        type: 'object',
        properties: {
          redirect_uri: { type: 'string', format: 'uri' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { provider } = request.params as { provider: 'google' | 'discord' | 'github' };
      const { redirect_uri } = request.query as { redirect_uri?: string };
      const userId = (request as any).userId;

      // Generate authorization URL
      const { url, state } = oauthService.generateAuthUrl(provider, userId);

      // Store redirect URI in session if provided
      if (redirect_uri) {
        try {
          // Store in Redis with state as key
          const redis = (fastify as any).redis;
          await redis.setex(`oauth_redirect:${state}`, 600, redirect_uri); // 10 minutes
        } catch (error) {
          fastify.log.warn({ error }, 'Failed to store OAuth redirect URI');
        }
      }

      // Return authorization URL
      reply.send({
        success: true,
        data: {
          authUrl: url,
          state,
          provider
        }
      });

    } catch (error) {
      fastify.log.error({ error, provider: request.params }, 'OAuth authorization failed');
      
      if (error instanceof Error && error.message.includes('not configured')) {
        throw new AppError(
          `${(request.params as any).provider} OAuth is not configured`,
          503,
          'OAUTH_NOT_CONFIGURED'
        );
      }

      throw new AppError(
        'Failed to start OAuth authorization',
        500,
        'OAUTH_START_FAILED'
      );
    }
  });

  /**
   * GET /oauth/callback/:provider
   * Handle OAuth callback
   */
  fastify.get('/callback/:provider', {
    preHandler: validate({ 
      params: oauthSchemas.callback.params,
      query: oauthSchemas.callback.query 
    }),
    schema: {
      tags: ['oauth'],
      summary: 'Handle OAuth callback',
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google', 'discord', 'github'] }
        },
        required: ['provider']
      },
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          state: { type: 'string' },
          error: { type: 'string' },
          error_description: { type: 'string' }
        },
        required: ['state']
      }
    }
  }, async (request, reply) => {
    const clientInfo = getClientInfo(request);
    
    try {
      const { provider } = request.params as { provider: 'google' | 'discord' | 'github' };
      const { code, state, error, error_description } = request.query as {
        code?: string;
        state: string;
        error?: string;
        error_description?: string;
      };

      // Handle OAuth provider errors
      if (error) {
        fastify.log.warn({ 
          error, 
          error_description, 
          provider, 
          state: state.substring(0, 8) + '...'
        }, 'OAuth provider returned error');

        // Get redirect URI if stored
        let redirectUri = process.env.FRONTEND_URL || 'http://localhost:3000';
        try {
          const redis = (fastify as any).redis;
          const storedRedirect = await redis.get(`oauth_redirect:${state}`);
          if (storedRedirect) {
            redirectUri = storedRedirect;
            await redis.del(`oauth_redirect:${state}`);
          }
        } catch (redisError) {
          fastify.log.warn({ error: redisError }, 'Failed to retrieve OAuth redirect URI');
        }

        // Redirect to frontend with error
        const errorParams = new URLSearchParams({
          error: 'oauth_error',
          message: error_description || error || 'OAuth authentication failed'
        });
        
        return reply.redirect(`${redirectUri}?${errorParams}`);
      }

      if (!code) {
        throw new AppError('Authorization code is required', 400, 'MISSING_AUTH_CODE');
      }

      // Handle OAuth callback
      const oauthResult = await oauthService.handleCallback(provider, code, state, error);
      
      if (!oauthResult.success) {
        fastify.log.warn({
          provider,
          error: oauthResult.error,
          retryable: oauthResult.retryable
        }, 'OAuth callback failed');

        // Get redirect URI
        let redirectUri = process.env.FRONTEND_URL || 'http://localhost:3000';
        try {
          const redis = (fastify as any).redis;
          const storedRedirect = await redis.get(`oauth_redirect:${state}`);
          if (storedRedirect) {
            redirectUri = storedRedirect;
            await redis.del(`oauth_redirect:${state}`);
          }
        } catch (redisError) {
          fastify.log.warn({ error: redisError }, 'Failed to retrieve OAuth redirect URI');
        }

        const errorParams = new URLSearchParams({
          error: 'oauth_failed',
          message: oauthResult.error || 'Authentication failed',
          retryable: oauthResult.retryable ? 'true' : 'false'
        });
        
        return reply.redirect(`${redirectUri}?${errorParams}`);
      }

      if (!oauthResult.user) {
        throw new AppError('No user information received', 500, 'NO_USER_INFO');
      }

      // Find or create user
      const userResult = await oauthService.findOrCreateUser(provider, oauthResult.user);
      
      if (!userResult.success || !userResult.user) {
        throw new AppError(
          userResult.error || 'Failed to create user account',
          500,
          'USER_CREATION_FAILED'
        );
      }

      // Generate authentication tokens
      const tokens = await authService.generateTokens(userResult.user.id, {
        deviceInfo: `OAuth ${provider} login`,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      });

      // Generate CSRF token
      let csrfToken;
      try {
        csrfToken = await authService.generateCSRFToken(userResult.user.id);
      } catch (csrfError) {
        fastify.log.warn({ error: csrfError }, 'CSRF token generation failed');
      }

      // Get redirect URI and clean up
      let redirectUri = process.env.FRONTEND_URL || 'http://localhost:3000';
      try {
        const redis = (fastify as any).redis;
        const storedRedirect = await redis.get(`oauth_redirect:${state}`);
        if (storedRedirect) {
          redirectUri = storedRedirect;
          await redis.del(`oauth_redirect:${state}`);
        }
      } catch (redisError) {
        fastify.log.warn({ error: redisError }, 'Failed to retrieve OAuth redirect URI');
      }

      // Create success URL with tokens
      const successParams = new URLSearchParams({
        success: 'true',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
        user_id: userResult.user.id,
        is_new_user: userResult.isNewUser ? 'true' : 'false'
      });

      if (csrfToken) {
        successParams.set('csrf_token', csrfToken);
      }

      // Redirect to frontend with success
      return reply.redirect(`${redirectUri}?${successParams}`);

    } catch (error) {
      fastify.log.error({ error, provider: request.params }, 'OAuth callback processing failed');
      
      // Get redirect URI for error redirect
      let redirectUri = process.env.FRONTEND_URL || 'http://localhost:3000';
      try {
        const redis = (fastify as any).redis;
        const { state } = request.query as { state: string };
        const storedRedirect = await redis.get(`oauth_redirect:${state}`);
        if (storedRedirect) {
          redirectUri = storedRedirect;
          await redis.del(`oauth_redirect:${state}`);
        }
      } catch (redisError) {
        fastify.log.warn({ error: redisError }, 'Failed to retrieve OAuth redirect URI');
      }

      if (error instanceof AppError) {
        const errorParams = new URLSearchParams({
          error: 'oauth_error',
          message: error.message,
          code: error.code
        });
        
        return reply.redirect(`${redirectUri}?${errorParams}`);
      }

      const errorParams = new URLSearchParams({
        error: 'oauth_error',
        message: 'OAuth authentication failed due to an internal error'
      });
      
      return reply.redirect(`${redirectUri}?${errorParams}`);
    }
  });

  /**
   * POST /oauth/link/:provider
   * Link OAuth account to existing authenticated user
   */
  fastify.post('/link/:provider', {
    preHandler: [authMiddleware, validate({ params: oauthSchemas.link.params })],
    schema: {
      tags: ['oauth'],
      summary: 'Link OAuth account to current user',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google', 'discord', 'github'] }
        },
        required: ['provider']
      }
    }
  }, async (request, reply) => {
    try {
      const { provider } = request.params as { provider: 'google' | 'discord' | 'github' };
      const userId = (request as any).userId;

      if (!userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      // Generate authorization URL for linking
      const { url, state } = oauthService.generateAuthUrl(provider, userId);

      reply.send({
        success: true,
        data: {
          authUrl: url,
          state,
          provider,
          action: 'link'
        }
      });

    } catch (error) {
      fastify.log.error({ error, provider: request.params, userId: (request as any).userId }, 'OAuth link failed');
      
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to initiate OAuth account linking',
        500,
        'OAUTH_LINK_FAILED'
      );
    }
  });

  /**
   * DELETE /oauth/unlink/:provider
   * Unlink OAuth account from current user
   */
  fastify.delete('/unlink/:provider', {
    preHandler: [authMiddleware, validate({ params: oauthSchemas.unlink.params })],
    schema: {
      tags: ['oauth'],
      summary: 'Unlink OAuth account from current user',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['google', 'discord', 'github'] }
        },
        required: ['provider']
      }
    }
  }, async (request, reply) => {
    try {
      const { provider } = request.params as { provider: 'google' | 'discord' | 'github' };
      const userId = (request as any).userId;

      if (!userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      // Check that user has another authentication method
      const user = await (fastify as any).prisma.user.findUnique({
        where: { id: userId },
        select: {
          passwordHash: true,
          google_id: true,
          discord_id: true,
          github_id: true,
          walletAddress: true
        }
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Count authentication methods
      const authMethods = [
        user.passwordHash,
        user.google_id,
        user.discord_id,
        user.github_id,
        user.walletAddress
      ].filter(Boolean).length;

      if (authMethods <= 1) {
        throw new AppError(
          'Cannot unlink the only authentication method. Add another authentication method first.',
          400,
          'LAST_AUTH_METHOD'
        );
      }

      // Unlink the provider
      const updateData: any = {};
      updateData[`${provider}_id`] = null;

      await (fastify as any).prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      reply.send({
        success: true,
        message: `${provider} account unlinked successfully`
      });

    } catch (error) {
      fastify.log.error({ error, provider: request.params, userId: (request as any).userId }, 'OAuth unlink failed');
      
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to unlink OAuth account',
        500,
        'OAUTH_UNLINK_FAILED'
      );
    }
  });

  /**
   * GET /oauth/status
   * Get OAuth linking status for current user
   */
  fastify.get('/status', {
    preHandler: authMiddleware,
    schema: {
      tags: ['oauth'],
      summary: 'Get OAuth account status',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).userId;

      if (!userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const user = await (fastify as any).prisma.user.findUnique({
        where: { id: userId },
        select: {
          google_id: true,
          discord_id: true,
          github_id: true,
          passwordHash: true,
          walletAddress: true,
          email: true,
          isVerified: true
        }
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      reply.send({
        success: true,
        data: {
          linkedAccounts: {
            google: !!user.google_id,
            discord: !!user.discord_id,
            github: !!user.github_id
          },
          authMethods: {
            password: !!user.passwordHash,
            wallet: !!user.walletAddress,
            oauth: !!(user.google_id || user.discord_id || user.github_id)
          },
          accountSecurity: {
            hasEmail: !!user.email,
            isVerified: user.isVerified,
            multiFactorEnabled: false // TODO: Implement 2FA
          }
        }
      });

    } catch (error) {
      fastify.log.error({ error, userId: (request as any).userId }, 'OAuth status check failed');
      
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to get OAuth status',
        500,
        'OAUTH_STATUS_FAILED'
      );
    }
  });

  /**
   * GET /oauth/stats
   * Get OAuth service statistics (admin only)
   */
  fastify.get('/stats', {
    preHandler: authMiddleware, // Should add admin check
    schema: {
      tags: ['oauth'],
      summary: 'Get OAuth service statistics',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const stats = oauthService.getStats();
      
      reply.send({
        success: true,
        data: stats
      });

    } catch (error) {
      fastify.log.error({ error }, 'OAuth stats failed');
      
      throw new AppError(
        'Failed to get OAuth statistics',
        500,
        'OAUTH_STATS_FAILED'
      );
    }
  });
}