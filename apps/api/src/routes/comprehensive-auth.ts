import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ComprehensiveJWTService } from '../services/comprehensive-jwt-service';
import { TwoFactorAuthService } from '../services/two-factor-auth-service';
import { ComprehensiveOAuthService } from '../services/comprehensive-oauth-service';
import { SessionManagementService } from '../services/session-management-service';
import { RBACService } from '../services/rbac-service';
import { ApiKeyManagementService } from '../services/api-key-management-service';
import { PasswordSecurityService } from '../services/password-security-service';
import { 
  RegisterSchema,
  LoginSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  ChangePasswordSchema,
  TwoFactorSetupSchema,
  TwoFactorVerifySchema,
  ApiKeyCreateSchema,
  WebAuthnRegistrationSchema,
  WebAuthnAuthenticationSchema,
  OAuthCallbackSchema
} from '../models/auth-models';
import { prisma } from '@cryb/database';
import logger from '../utils/logger';

export default async function comprehensiveAuthRoutes(fastify: FastifyInstance) {
  // Initialize services
  const jwtService = new ComprehensiveJWTService(fastify.redis);
  const twoFactorService = new TwoFactorAuthService(fastify.redis);
  const oauthService = new ComprehensiveOAuthService(fastify.redis);
  const sessionService = new SessionManagementService(fastify.redis);
  const rbacService = new RBACService(fastify.redis);
  const apiKeyService = new ApiKeyManagementService(fastify.redis);
  const passwordService = new PasswordSecurityService(fastify.redis);

  // Helper function to extract client info
  const getClientInfo = (request: FastifyRequest) => ({
    ip_address: request.ip,
    user_agent: request.headers['user-agent'] || 'unknown',
    device_fingerprint: request.headers['x-device-fingerprint'] as string
  });

  // ============================================
  // USER REGISTRATION AND LOGIN
  // ============================================

  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register new user account',
      body: RegisterSchema,
      response: {
        201: z.object({
          success: z.boolean(),
          message: z.string(),
          user: z.object({
            id: z.string(),
            email: z.string(),
            username: z.string(),
            email_verified: z.boolean()
          }),
          tokens: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
            expires_in: z.number(),
            token_type: z.literal('Bearer')
          })
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof RegisterSchema> }>, reply: FastifyReply) => {
    try {
      const { email, username, password, terms_accepted } = request.body;
      const clientInfo = getClientInfo(request);

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      });

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'User with this email or username already exists'
        });
      }

      // Validate password strength
      const passwordValidation = await passwordService.validatePassword(password);
      if (!passwordValidation.valid) {
        return reply.code(400).send({
          success: false,
          error: 'Password does not meet security requirements',
          details: {
            violations: passwordValidation.policy_violations,
            suggestions: passwordValidation.suggestions,
            strength: passwordValidation.strength
          }
        });
      }

      // Hash password
      const passwordHash = await passwordService.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password_hash: passwordHash,
          email_verified: false,
          last_password_change: new Date()
        }
      });

      // Assign default user role
      const userRole = await prisma.role.findFirst({
        where: { name: 'user' }
      });

      if (userRole) {
        await rbacService.assignRoleToUser({
          user_id: user.id,
          role_id: userRole.id,
          granted_by: user.id
        });
      }

      // Create session and tokens
      const sessionInfo = {
        user_id: user.id,
        ...clientInfo
      };

      const session = await sessionService.createSession({
        user_id: user.id,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent,
        device_fingerprint: clientInfo.device_fingerprint,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      const tokens = await jwtService.createTokenPair(user.id, sessionInfo);

      // Send email verification (implement email service)
      // await emailService.sendVerificationEmail(user.email, user.id);

      reply.code(201).send({
        success: true,
        message: 'User registered successfully. Please verify your email.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          email_verified: user.email_verified
        },
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          token_type: tokens.token_type
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      reply.code(500).send({
        success: false,
        error: 'Registration failed'
      });
    }
  });

  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'User login',
      body: LoginSchema,
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
          user: z.object({
            id: z.string(),
            email: z.string(),
            username: z.string(),
            email_verified: z.boolean(),
            requires_2fa: z.boolean()
          }),
          tokens: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
            expires_in: z.number(),
            token_type: z.literal('Bearer')
          }).optional(),
          requires_2fa: z.boolean().optional()
        })
      }
    }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof LoginSchema> }>, reply: FastifyReply) => {
    try {
      const { email, password, remember_me, mfa_code } = request.body;
      const clientInfo = getClientInfo(request);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          two_factor_auth: true
        }
      });

      if (!user || !user.password_hash) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (user.locked_until && user.locked_until > new Date()) {
        const lockTimeRemaining = Math.ceil((user.locked_until.getTime() - Date.now()) / 1000 / 60);
        return reply.code(423).send({
          success: false,
          error: `Account is locked. Try again in ${lockTimeRemaining} minutes.`
        });
      }

      // Verify password
      const isPasswordValid = await passwordService.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        // Increment failed login attempts
        const failedAttempts = user.failed_login_attempts + 1;
        const updateData: any = { failed_login_attempts: failedAttempts };

        // Lock account if too many failed attempts
        if (failedAttempts >= 5) {
          updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });

        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Check if 2FA is enabled
      const has2FA = user.two_factor_auth?.is_enabled || false;
      
      if (has2FA && !mfa_code) {
        return reply.code(200).send({
          success: true,
          message: 'Two-factor authentication required',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            email_verified: user.email_verified,
            requires_2fa: true
          },
          requires_2fa: true
        });
      }

      if (has2FA && mfa_code) {
        const mfaResult = await twoFactorService.verifyTwoFactor(user.id, mfa_code);
        if (!mfaResult.success) {
          return reply.code(401).send({
            success: false,
            error: mfaResult.error || 'Invalid 2FA code'
          });
        }
      }

      // Check password age
      const passwordAge = await passwordService.checkPasswordAge(user.id);
      if (passwordAge.needs_change) {
        return reply.code(200).send({
          success: false,
          error: 'Password change required',
          requires_password_change: true,
          password_age: passwordAge
        });
      }

      // Create session and tokens
      const sessionInfo = {
        user_id: user.id,
        ...clientInfo
      };

      const expiryTime = remember_me ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days
      const session = await sessionService.createSession({
        user_id: user.id,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent,
        device_fingerprint: clientInfo.device_fingerprint,
        expires_at: new Date(Date.now() + expiryTime)
      });

      const tokens = await jwtService.createTokenPair(user.id, sessionInfo);

      reply.send({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          email_verified: user.email_verified,
          requires_2fa: false
        },
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          token_type: tokens.token_type
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      reply.code(500).send({
        success: false,
        error: 'Login failed'
      });
    }
  });

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  fastify.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Refresh access token',
      body: z.object({
        refresh_token: z.string()
      })
    }
  }, async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
    try {
      const { refresh_token } = request.body;
      const clientInfo = getClientInfo(request);

      const newTokens = await jwtService.refreshTokens(refresh_token, clientInfo);

      reply.send({
        success: true,
        tokens: {
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_in: newTokens.expires_in,
          token_type: newTokens.token_type
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      reply.code(401).send({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  });

  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'User logout',
      security: [{ Bearer: [] }]
    },
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        return reply.code(400).send({
          success: false,
          error: 'No token provided'
        });
      }

      // Blacklist current access token
      await jwtService.blacklistAccessToken(token);

      // Get session ID from token and invalidate session
      const decoded = await jwtService.verifyAccessToken(token);
      await sessionService.invalidateSession(decoded.session_id, 'user_logout');

      reply.send({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      reply.code(500).send({
        success: false,
        error: 'Logout failed'
      });
    }
  });

  fastify.post('/logout-all', {
    schema: {
      tags: ['auth'],
      summary: 'Logout from all devices',
      security: [{ Bearer: [] }]
    },
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.sub;

      // Revoke all user tokens and sessions
      await jwtService.revokeAllUserTokens(userId);
      const sessionsRevoked = await sessionService.invalidateAllUserSessions(userId, 'user_logout_all');

      reply.send({
        success: true,
        message: `Logged out from all devices (${sessionsRevoked} sessions)`,
        sessions_revoked: sessionsRevoked
      });

    } catch (error) {
      logger.error('Logout all error:', error);
      reply.code(500).send({
        success: false,
        error: 'Logout from all devices failed'
      });
    }
  });

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  fastify.post('/change-password', {
    schema: {
      tags: ['auth'],
      summary: 'Change user password',
      body: ChangePasswordSchema,
      security: [{ Bearer: [] }]
    },
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{ Body: z.infer<typeof ChangePasswordSchema> }>, reply: FastifyReply) => {
    try {
      const { current_password, new_password } = request.body;
      const userId = (request as any).user.sub;

      await passwordService.updateUserPassword(userId, new_password, current_password);

      reply.send({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed'
      });
    }
  });

  fastify.post('/forgot-password', {
    schema: {
      tags: ['auth'],
      summary: 'Request password reset',
      body: PasswordResetRequestSchema
    }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof PasswordResetRequestSchema> }>, reply: FastifyReply) => {
    try {
      const { email } = request.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Return success even if user doesn't exist (security)
        return reply.send({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_reset_token: resetToken,
          password_reset_expires: resetExpiry
        }
      });

      // Send password reset email (implement email service)
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      reply.send({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      reply.code(500).send({
        success: false,
        error: 'Password reset request failed'
      });
    }
  });

  fastify.post('/reset-password', {
    schema: {
      tags: ['auth'],
      summary: 'Reset password with token',
      body: PasswordResetSchema
    }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof PasswordResetSchema> }>, reply: FastifyReply) => {
    try {
      const { token, new_password } = request.body;

      const user = await prisma.user.findFirst({
        where: {
          password_reset_token: token,
          password_reset_expires: { gt: new Date() }
        }
      });

      if (!user) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      await passwordService.updateUserPassword(user.id, new_password);

      // Clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_reset_token: null,
          password_reset_expires: null
        }
      });

      reply.send({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      });
    }
  });

  // ============================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================

  fastify.post('/2fa/setup', {
    schema: {
      tags: ['2fa'],
      summary: 'Setup two-factor authentication',
      security: [{ Bearer: [] }]
    },
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.sub;
      const userEmail = (request as any).user.email;

      const setupResult = await twoFactorService.setupTwoFactor(userId, userEmail);

      reply.send({
        success: true,
        message: 'Two-factor authentication setup initiated',
        setup_data: {
          qr_code: setupResult.qr_code,
          backup_codes: setupResult.backup_codes,
          manual_entry_key: setupResult.manual_entry_key
        }
      });

    } catch (error) {
      logger.error('2FA setup error:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : '2FA setup failed'
      });
    }
  });

  fastify.post('/2fa/verify-setup', {
    schema: {
      tags: ['2fa'],
      summary: 'Verify and enable 2FA',
      body: TwoFactorVerifySchema,
      security: [{ Bearer: [] }]
    },
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{ Body: z.infer<typeof TwoFactorVerifySchema> }>, reply: FastifyReply) => {
    try {
      const { code } = request.body;
      const userId = (request as any).user.sub;

      const isEnabled = await twoFactorService.verifyAndEnableTwoFactor(userId, code);

      reply.send({
        success: true,
        message: 'Two-factor authentication enabled successfully',
        enabled: isEnabled
      });

    } catch (error) {
      logger.error('2FA verify setup error:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : '2FA verification failed'
      });
    }
  });

  fastify.post('/2fa/disable', {
    schema: {
      tags: ['2fa'],
      summary: 'Disable two-factor authentication',
      body: z.object({
        current_password: z.string()
      }),
      security: [{ Bearer: [] }]
    },
    preHandler: [fastify.authenticate]
  }, async (request: FastifyRequest<{ Body: { current_password: string } }>, reply: FastifyReply) => {
    try {
      const { current_password } = request.body;
      const userId = (request as any).user.sub;

      const isDisabled = await twoFactorService.disableTwoFactor(userId, current_password);

      reply.send({
        success: true,
        message: 'Two-factor authentication disabled successfully',
        disabled: isDisabled
      });

    } catch (error) {
      logger.error('2FA disable error:', error);
      reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : '2FA disable failed'
      });
    }
  });

  // Return the routes
  return fastify;
}