import { FastifyInstance } from 'fastify';
import { prisma, executeWithDatabaseRetry } from '@cryb/database';
import { generateAccessToken, verifyToken } from '@cryb/auth';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { EnhancedAuthService } from '../services/enhanced-auth';
import { createAuthRateLimitService, authRateLimitMiddleware } from '../middleware/auth-rate-limiting';
import Redis from 'ioredis';
// Web3 functions - Coming Soon!
const generateNonce = () => Math.random().toString(36).substring(2, 15);
const generateSiweMessage = async (walletAddress: string, chainId: number, domain: string, uri: string, nonce: string) => 
  `Sign in with Ethereum - Coming Soon! Wallet: ${walletAddress}`;
const verifySiweMessage = async (message: string, signature: string) => ({ 
  success: false, 
  error: 'Web3 authentication coming soon! This feature will enable secure wallet-based login.' 
});
import { randomUUID } from 'crypto';
import { validate, validationSchemas } from '../middleware/validation';
import { throwBadRequest, throwUnauthorized, throwConflict, throwNotFound, AppError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { getErrorMessage } from '../utils/errorUtils';

// Store nonces temporarily (in production, use Redis)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

export default async function authRoutes(fastify: FastifyInstance) {
  // Create dedicated Redis client for auth service to avoid subscriber mode issues
  const authRedisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380/0');
  
  // Initialize Enhanced Auth Service with dedicated client
  const authService = new EnhancedAuthService(authRedisClient);
  
  // Initialize Critical Auth Rate Limiting Service
  const authRateLimitService = createAuthRateLimitService(authRedisClient);
  
  // Helper function to get client info
  const getClientInfo = (request: any) => ({
    ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.ip,
    userAgent: request.headers['user-agent'] || 'unknown'
  });
  
  // Helper function to set secure httpOnly cookies
  const setAuthCookies = (reply: any, tokens: any) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set access token as httpOnly cookie
    reply.setCookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    // Set refresh token as httpOnly cookie
    reply.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/v1/auth/refresh' // Restrict to refresh endpoint
    });
    
    // Set CSRF token as regular cookie (accessible to JS for headers)
    reply.setCookie('csrfToken', tokens.csrfToken || randomUUID(), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/'
    });
  };
  
  // Helper function to clear auth cookies
  const clearAuthCookies = (reply: any) => {
    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    reply.clearCookie('csrfToken', { path: '/' });
  };
  
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [auth]
   *     summary: Register new user account
   *     description: Create a new user account with email/password or Web3 wallet
   */
  fastify.post('/register', {
    preHandler: [
      authRateLimitMiddleware(authRateLimitService, 'register'),
      validate(validationSchemas.auth.register)
    ],
    schema: {
      tags: ['auth'],
      summary: 'Register new user account',
      body: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 32 },
          displayName: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string', minLength: 8 },
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          signature: { type: 'string' },
          message: { type: 'string' }
        },
        required: ['username']
      },
      response: {
        201: {
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
                    walletAddress: { type: 'string' },
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
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const clientInfo = getClientInfo(request);
    
    try {
      const {
        username,
        displayName: providedDisplayName,
        email,
        password,
        confirmPassword,
        walletAddress,
        signature,
        message
      } = request.body as any;

      // Input validation
      if (!username) {
        throw new AppError('Username is required', 400, 'MISSING_REQUIRED_FIELDS');
      }

      // Use provided displayName or fallback to username
      const displayName = providedDisplayName || username;
      
      // Username validation
      if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
        throw new AppError('Username must be 3-32 characters and contain only letters, numbers, and underscores', 400, 'INVALID_USERNAME_FORMAT');
      }
      
      // Display name validation
      if (displayName.length < 1 || displayName.length > 100) {
        throw new AppError('Display name must be 1-100 characters', 400, 'INVALID_DISPLAY_NAME');
      }
      
      // Email validation if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('Invalid email format', 400, 'INVALID_EMAIL_FORMAT');
      }
      
      // Check for authentication method
      const hasPassword = !!password;
      const hasWallet = !!(walletAddress && signature && message);
      
      if (!hasPassword && !hasWallet) {
        throw new AppError('Either password or wallet authentication is required', 400, 'NO_AUTH_METHOD');
      }

      // Check if user already exists with retry logic
      let existingUser;
      try {
        existingUser = await executeWithDatabaseRetry(async () => {
          return await prisma.user.findFirst({
            where: {
              OR: [
                { username },
                { email: email || undefined },
                { walletAddress: walletAddress || undefined }
              ].filter(Boolean)
            }
          });
        });
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        throw new AppError('Registration service temporarily unavailable', 503, 'DATABASE_ERROR');
      }

      if (existingUser) {
        if (existingUser.username === username) {
          throw new AppError('Username already taken', 409, 'USERNAME_EXISTS');
        }
        if (existingUser.email === email) {
          throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
        }
        if (existingUser.walletAddress === walletAddress) {
          throw new AppError('Wallet address already registered', 409, 'WALLET_EXISTS');
        }
      }

      let isWalletVerified = false;

      // Verify Web3 signature if provided
      if (hasWallet) {
        try {
          const walletAuth = await authService.authenticateWithWallet(
            walletAddress, 
            signature, 
            message, 
            clientInfo
          );
          
          if (!walletAuth.success) {
            throw new AppError(
              getErrorMessage(walletAuth.error, 'Wallet verification failed'),
              400,
              'WALLET_VERIFICATION_FAILED'
            );
          }
          
          isWalletVerified = true;
        } catch (walletError) {
          console.error('Wallet verification error during registration:', walletError);
          if (walletError instanceof AppError) {
            throw walletError;
          }
          throw new AppError('Wallet verification service unavailable', 503, 'WALLET_SERVICE_ERROR');
        }
      }

      // Validate and hash password if provided
      let hashedPassword: string | null = null;
      if (hasPassword) {
        try {
          // Check password confirmation only if confirmPassword is provided
          if (confirmPassword && password !== confirmPassword) {
            throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
          }
          
          const passwordValidation = validatePasswordStrength(password);
          if (!passwordValidation.isValid) {
            throw new AppError(
              `Password requirements not met: ${passwordValidation.errors.join(', ')}`, 
              400, 
              'WEAK_PASSWORD'
            );
          }
          hashedPassword = await hashPassword(password);
        } catch (hashError) {
          console.error('Password hashing error:', hashError);
          if (hashError instanceof AppError) {
            throw hashError;
          }
          throw new AppError('Password processing failed', 500, 'HASH_ERROR');
        }
      }

      // Create user with comprehensive error handling
      let user;
      try {
        user = await executeWithDatabaseRetry(async () => {
          const userId = randomUUID(); // Generate unique user ID
          const now = new Date();
          return await prisma.user.create({
            data: {
              id: userId,
              username,
              displayName,
              email: email || null,
              passwordHash: hashedPassword || null,
              walletAddress: walletAddress ? walletAddress.toLowerCase() : null,
              isVerified: isWalletVerified || false,
              updatedAt: now
            },
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
              walletAddress: true,
              isVerified: true,
              createdAt: true
            }
          });
        });
      } catch (createError) {
        console.error('User creation error:', createError);
        
        // Handle specific Prisma errors
        if (createError instanceof Error) {
          if (createError.message.includes('Unique constraint')) {
            throw new AppError('User with this information already exists', 409, 'DUPLICATE_USER');
          }
        }
        
        throw new AppError('User registration failed', 500, 'USER_CREATION_ERROR');
      }

      // Generate secure tokens using enhanced auth service
      let tokens;
      try {
        tokens = await authService.generateTokens(user.id, {
          deviceInfo: `Registration from ${clientInfo.userAgent}`,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent
        });
      } catch (tokenError) {
        console.error('Token generation error during registration:', tokenError);
        throw new AppError('Session creation failed', 500, 'TOKEN_GENERATION_ERROR');
      }
      
      // Generate CSRF token for the new user
      let csrfToken;
      try {
        csrfToken = await authService.generateCSRFToken(user.id);
      } catch (csrfError) {
        console.warn('CSRF token generation failed during registration:', csrfError);
        // Don't fail registration for CSRF token failure
      }
      
      // Generate email verification token if email provided
      let emailVerificationToken;
      if (email && !isWalletVerified) {
        try {
          emailVerificationToken = await authService.generateEmailVerificationToken(user.id, email);
          // Send verification email
          const { emailService } = require('../services/email.service');
          await emailService.sendVerificationEmail(email, username, emailVerificationToken);
        } catch (emailError) {
          console.warn('Email verification process failed:', emailError);
          // Don't fail registration for email verification failure
        }
      }

      // Record successful registration to reset rate limits
      if ((request as any).authRateLimit && (request as any).authEndpoint && (request as any).authIdentifier) {
        try {
          await (request as any).authRateLimit.recordSuccess(
            (request as any).authEndpoint,
            (request as any).authIdentifier,
            request
          );
        } catch (rateLimitError) {
          console.warn('Failed to record registration success for rate limiting:', rateLimitError);
        }
      }

      // Send welcome email (only if user has an email address)
      if (email || user.email) {
        try {
          const { queueManager } = await import('../services/queue-manager');
          await queueManager.addEmailJob({
            type: 'welcome',
            to: email || user.email || '',
            subject: 'Welcome to CRYB Platform!',
            template: 'welcome',
            data: {
              username: user.displayName || user.username,
              displayName: user.displayName,
              platformUrl: process.env.PLATFORM_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://cryb.ai',
            },
            priority: 'high'
          });
          console.log('Welcome email queued successfully for user:', user.username);
        } catch (emailQueueError) {
          console.warn('Failed to queue welcome email:', emailQueueError);
          // Don't fail registration if email queueing fails
        }
      }

      // Set httpOnly cookies
      setAuthCookies(reply, tokens);
      
      const responsePayload = {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            ...user,
            needsEmailVerification: !!email && !isWalletVerified
          },
          // Match the schema definition for tokens
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt.toISOString()
          },
          security: {
            csrfToken,
            emailVerificationRequired: !!email && !isWalletVerified,
            expiresAt: tokens.expiresAt.toISOString()
          }
        }
      };

      reply.code(201).send(responsePayload);
    } catch (error) {
      // Comprehensive error handling
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Registration error:', error);
      throw new AppError(
        'Registration failed due to internal error', 
        500, 
        'REGISTRATION_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [auth]
   *     summary: Login user
   *     description: Authenticate user with email/password or Web3 wallet
   */
  fastify.post('/login', {
    preHandler: [
      authRateLimitMiddleware(authRateLimitService, 'login'),
      validate(validationSchemas.auth.login)
    ],
    schema: {
      tags: ['auth'],
      summary: 'Login user',
      body: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          signature: { type: 'string' },
          message: { type: 'string' }
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
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    displayName: { type: 'string' },
                    email: { type: 'string' },
                    walletAddress: { type: 'string' }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresAt: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const clientInfo = getClientInfo(request);
    
    try {
      const { 
        username, 
        email,
        identifier, 
        password, 
        walletAddress, 
        signature, 
        message 
      } = request.body as any;
      
      // Input validation - identifier can be used instead of username/email
      const hasPassword = !!(username || email || identifier) && password;
      const hasWallet = walletAddress && signature && message;
      
      if (!hasPassword && !hasWallet) {
        throw new AppError('Authentication method required', 400, 'NO_AUTH_METHOD');
      }

      let user;
      let authResult;

      // Web3 authentication
      if (hasWallet) {
        try {
          authResult = await authService.authenticateWithWallet(
            walletAddress,
            signature,
            message,
            clientInfo
          );
          
          if (!authResult.success) {
            throw new AppError(
              getErrorMessage(authResult.error, 'Wallet authentication failed'),
              401,
              'WALLET_AUTH_FAILED'
            );
          }
          
          user = authResult.user;
        } catch (walletError) {
          console.error('Wallet authentication error:', walletError);
          if (walletError instanceof AppError) {
            throw walletError;
          }
          throw new AppError('Wallet authentication service unavailable', 503, 'WALLET_SERVICE_ERROR');
        }
      }
      // Email/password authentication
      else if (hasPassword) {
        const loginIdentifier = identifier || username || email;
        
        try {
          authResult = await authService.authenticateWithPassword(
            loginIdentifier,
            password,
            clientInfo
          );
          
          if (!authResult.success) {
            if (authResult.lockout?.locked) {
              throw new AppError(
                `Account locked. Try again in ${authResult.lockout.retryAfter} seconds.`,
                423, // Locked
                'ACCOUNT_LOCKED',
                { retryAfter: authResult.lockout.retryAfter }
              );
            }
            
            throw new AppError(
              getErrorMessage(authResult.error, 'Invalid credentials'),
              401,
              'INVALID_CREDENTIALS'
            );
          }
          
          user = authResult.user;
        } catch (passwordError) {
          console.error('Password authentication error:', passwordError);
          if (passwordError instanceof AppError) {
            throw passwordError;
          }
          throw new AppError('Authentication service unavailable', 503, 'AUTH_SERVICE_ERROR');
        }
      }

      // Check if 2FA is enabled for the user
      const twoFactorService = await import('../services/two-factor-auth').then(m => m.createTwoFactorAuthService(authRedisClient));
      const twoFactorStatus = await twoFactorService.getTwoFactorStatus(user.id);
      
      let tokens;
      let requires2FA = false;
      
      if (twoFactorStatus.enabled) {
        // If 2FA is enabled, generate a temporary token that requires 2FA verification
        requires2FA = true;
        
        // Generate a temporary pre-auth token (shorter expiry, limited permissions)
        const tempTokenPayload = {
          userId: user.id,
          sessionId: randomUUID(),
          temp: true,
          requires2FA: true,
          exp: Math.floor((Date.now() + 5 * 60 * 1000) / 1000), // 5 minutes
          iat: Math.floor(Date.now() / 1000),
          jti: randomUUID()
        };
        
        try {
          const tempToken = generateAccessToken(tempTokenPayload);
          
          // Store temporary session in Redis
          const tempSessionKey = `temp_session:${tempTokenPayload.sessionId}`;
          await authRedisClient.setex(tempSessionKey, 300, JSON.stringify({
            userId: user.id,
            createdAt: new Date().toISOString(),
            clientInfo,
            requires2FA: true
          }));
          
          tokens = {
            accessToken: tempToken,
            refreshToken: '',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            temporary: true
          };
        } catch (tempTokenError) {
          console.error('Temporary token generation error:', tempTokenError);
          throw new AppError('Session creation failed', 500, 'TEMP_TOKEN_GENERATION_ERROR');
        }
      } else {
        // Generate normal tokens if 2FA is not enabled
        try {
          tokens = await authService.generateTokens(user.id, {
            deviceInfo: `Login from ${clientInfo.userAgent}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent
          });
        } catch (tokenError) {
          console.error('Token generation error during login:', tokenError);
          throw new AppError('Session creation failed', 500, 'TOKEN_GENERATION_ERROR');
        }
      }
      
      // Generate CSRF token
      let csrfToken;
      try {
        csrfToken = await authService.generateCSRFToken(user.id);
      } catch (csrfError) {
        console.warn('CSRF token generation failed during login:', csrfError);
      }
      
      // Get security stats
      let securityStats;
      try {
        securityStats = await authService.getSecurityStats(user.id);
      } catch (statsError) {
        console.warn('Failed to get security stats:', statsError);
      }

      // Record successful authentication to reset rate limits
      if ((request as any).authRateLimit && (request as any).authEndpoint && (request as any).authIdentifier) {
        try {
          await (request as any).authRateLimit.recordSuccess(
            (request as any).authEndpoint,
            (request as any).authIdentifier,
            request
          );
        } catch (rateLimitError) {
          console.warn('Failed to record auth success for rate limiting:', rateLimitError);
        }
      }

      // Set httpOnly cookies if not 2FA
      if (!requires2FA && tokens) {
        setAuthCookies(reply, tokens);
      }
      
      reply.send({
        success: true,
        message: requires2FA ? 'Please provide your 2FA code to complete login' : 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            walletAddress: user.walletAddress,
            isVerified: user.isVerified
          },
          // Match the schema definition for tokens
          ...(!requires2FA && tokens && {
            tokens: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresAt: tokens.expiresAt.toISOString()
            }
          }),
          // Only send temporary token for 2FA
          ...(requires2FA && {
            tempToken: tokens.accessToken,
            expires: tokens.expiresAt.toISOString()
          }),
          security: {
            csrfToken,
            securityScore: securityStats?.securityScore || 0,
            needsEmailVerification: user.email && !user.isVerified,
            requires2FA,
            backupCodesAvailable: twoFactorStatus.hasBackupCodes
          }
        }
      });
    } catch (error) {
      // Comprehensive error handling
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Login error:', error);
      throw new AppError(
        'Login failed due to internal error',
        500,
        'LOGIN_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/verify-2fa:
   *   post:
   *     tags: [auth]
   *     summary: Complete 2FA login verification
   */
  fastify.post('/verify-2fa', {
    schema: {
      tags: ['auth'],
      summary: 'Complete 2FA login verification',
      body: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 6 }
        },
        required: ['code']
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
                    walletAddress: { type: 'string' },
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
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const clientInfo = getClientInfo(request);
    
    try {
      const { code } = request.body as { code: string };
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Temporary authentication token required', 401, 'TEMP_TOKEN_REQUIRED');
      }
      
      const tempToken = authHeader.replace('Bearer ', '');
      
      // Verify temporary token
      let tempPayload;
      try {
        tempPayload = verifyToken(tempToken);
      } catch (tokenError) {
        throw new AppError('Invalid or expired temporary token', 401, 'INVALID_TEMP_TOKEN');
      }
      
      const payload = tempPayload as any;
      if (!payload.temp || !payload.requires2FA) {
        throw new AppError('Invalid temporary token format', 401, 'INVALID_TEMP_TOKEN');
      }
      
      // Verify 2FA code
      const twoFactorService = await import('../services/two-factor-auth').then(m => m.createTwoFactorAuthService(authRedisClient));
      const verificationResult = await twoFactorService.verifyTwoFactor(
        tempPayload.userId,
        code,
        clientInfo.ip
      );
      
      if (!verificationResult.success) {
        throw new AppError(getErrorMessage(verificationResult.error, 'Invalid 2FA code'), 400, '2FA_VERIFICATION_FAILED');
      }
      
      // Get user data
      const user = await executeWithDatabaseRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: tempPayload.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            walletAddress: true,
            isVerified: true
          }
        });
      });
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }
      
      // Clean up temporary session
      try {
        await authRedisClient.del(`temp_session:${tempPayload.sessionId}`);
      } catch (error) {
        console.warn('Failed to clean up temporary session:', error);
      }
      
      // Generate full authentication tokens
      const tokens = await authService.generateTokens(user.id, {
        deviceInfo: `2FA Login from ${clientInfo.userAgent}`,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      });
      
      // Generate CSRF token
      let csrfToken;
      try {
        csrfToken = await authService.generateCSRFToken(user.id);
      } catch (csrfError) {
        console.warn('CSRF token generation failed during 2FA login:', csrfError);
      }
      
      let message = '2FA verification successful, login complete';
      if (verificationResult.isBackupCode) {
        message += `. You used a backup code. Remaining codes: ${verificationResult.remainingBackupCodes || 0}`;
        
        if ((verificationResult.remainingBackupCodes || 0) <= 2) {
          message += '. Consider regenerating backup codes.';
        }
      }
      
      reply.send({
        success: true,
        message,
        data: {
          user,
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt.toISOString(),
            refreshExpiresAt: tokens.refreshExpiresAt?.toISOString()
          },
          security: {
            csrfToken,
            usedBackupCode: verificationResult.isBackupCode || false,
            remainingBackupCodes: verificationResult.remainingBackupCodes
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('2FA verification error:', error);
      throw new AppError(
        '2FA verification failed due to internal error',
        500,
        '2FA_VERIFICATION_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/web3/nonce:
   *   post:
   *     tags: [auth]
   *     summary: Generate Web3 authentication nonce
   */
  fastify.post('/web3/nonce', {
    schema: {
      tags: ['auth'],
      summary: 'Generate Web3 authentication nonce',
      body: {
        type: 'object',
        properties: {
          walletAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' }
        },
        required: ['walletAddress']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                nonce: { type: 'string' },
                message: { type: 'string' },
                expiresAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { walletAddress } = request.body as any;

    if (!walletAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
      throwBadRequest('Invalid wallet address format');
    }

    const nonce = generateNonce();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store nonce (in production, use Redis with TTL)
    nonceStore.set(walletAddress.toLowerCase(), { nonce, expiresAt });

    // Generate SIWE message
    const message = await generateSiweMessage(
      walletAddress,
      1, // Ethereum mainnet
      process.env.SIWE_DOMAIN || 'localhost:3000',
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      nonce
    );

    reply.send({
      success: true,
      data: {
        nonce,
        message,
        expiresAt: new Date(expiresAt).toISOString()
      }
    });
  });

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     tags: [auth]
   *     summary: Refresh access token
   */
  fastify.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Refresh access token',
      body: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' }
        },
        required: ['refreshToken']
      }
    }
  }, async (request, reply) => {
    const clientInfo = getClientInfo(request);
    
    try {
      const { refreshToken } = request.body as any;
      
      // Input validation
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new AppError('Valid refresh token is required', 400, 'INVALID_REFRESH_TOKEN');
      }
      
      // Refresh tokens using enhanced auth service
      let tokens;
      try {
        tokens = await authService.refreshTokens(refreshToken, {
          deviceInfo: `Token refresh from ${clientInfo.userAgent}`,
          ipAddress: clientInfo.ip,
          userAgent: clientInfo.userAgent
        });
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        
        if (refreshError instanceof Error) {
          if (refreshError.message.includes('expired')) {
            throw new AppError('Refresh token has expired', 401, 'REFRESH_TOKEN_EXPIRED');
          } else if (refreshError.message.includes('invalid')) {
            throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
          } else if (refreshError.message.includes('revoked')) {
            throw new AppError('Refresh token has been revoked', 401, 'REFRESH_TOKEN_REVOKED');
          }
        }
        
        throw new AppError('Token refresh failed', 401, 'REFRESH_FAILED');
      }
      
      // Get user info from the payload
      let user;
      try {
        const validation = await authService.validateAccessToken(tokens.accessToken);
        if (!validation.valid || !validation.payload) {
          throw new Error('Generated token is invalid');
        }
        
        user = await prisma.user.findUnique({
          where: { id: validation.payload.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            walletAddress: true,
            isVerified: true
          }
        });
      } catch (userError) {
        console.error('User lookup error during refresh:', userError);
        throw new AppError('Failed to retrieve user information', 500, 'USER_LOOKUP_ERROR');
      }

      // Set new httpOnly cookies
      setAuthCookies(reply, tokens);
      
      reply.send({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          user,
          // Don't send tokens in response body for security
          security: {
            expiresAt: tokens.expiresAt.toISOString()
          }
        }
      });
    } catch (error) {
      // Comprehensive error handling
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Token refresh error:', error);
      throw new AppError(
        'Token refresh failed due to internal error',
        500,
        'REFRESH_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     tags: [auth]
   *     summary: Logout user
   *     security:
   *       - Bearer: []
   */
  fastify.post('/logout', {
    preHandler: authMiddleware,
    schema: {
      tags: ['auth'],
      summary: 'Logout user',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        throw new AppError('Authentication token required for logout', 400, 'TOKEN_REQUIRED');
      }
      
      // Logout using enhanced auth service
      try {
        await authService.logout(token);
      } catch (logoutError) {
        console.error('Logout error:', logoutError);
        // Continue with success response even if logout partially fails
        // The token should still be blacklisted
      }

      // Clear httpOnly cookies
      clearAuthCookies(reply);
      
      reply.send({
        success: true,
        message: 'Successfully logged out'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Logout error:', error);
      throw new AppError(
        'Logout failed due to internal error',
        500,
        'LOGOUT_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/logout-all:
   *   post:
   *     tags: [auth]
   *     summary: Logout from all devices
   *     security:
   *       - Bearer: []
   */
  fastify.post('/logout-all', {
    preHandler: authMiddleware,
    schema: {
      tags: ['auth'],
      summary: 'Logout from all devices',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      if (!request.userId) {
        throw new AppError('User ID not found in request', 400, 'USER_ID_MISSING');
      }
      
      // Logout from all devices using enhanced auth service
      try {
        await authService.logoutAllDevices(request.userId);
      } catch (logoutError) {
        console.error('Logout all devices error:', logoutError);
        throw new AppError(
          'Failed to logout from all devices',
          500,
          'LOGOUT_ALL_FAILED',
          { userId: request.userId }
        );
      }

      reply.send({
        success: true,
        message: 'Successfully logged out from all devices'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Logout all devices error:', error);
      throw new AppError(
        'Logout all devices failed due to internal error',
        500,
        'LOGOUT_ALL_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     tags: [auth]
   *     summary: Get current user profile
   *     security:
   *       - Bearer: []
   */
  fastify.get('/me', {
    preHandler: authMiddleware,
    schema: {
      tags: ['auth'],
      summary: 'Get current user profile',
      security: [{ Bearer: [] }],
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
                    walletAddress: { type: 'string' },
                    avatar: { type: 'string' },
                    bio: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    createdAt: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        walletAddress: true,
        avatar: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            servers: true,
            posts: true,
            comments: true
          }
        }
      }
    });

    if (!user) {
      throwNotFound('User');
    }

    reply.send({
      success: true,
      data: { user }
    });
  });

  /**
   * @swagger
   * /auth/sessions:
   *   get:
   *     tags: [auth]
   *     summary: Get all active sessions
   *     security:
   *       - Bearer: []
   */
  fastify.get('/sessions', {
    preHandler: authMiddleware,
    schema: {
      tags: ['auth'],
      summary: 'Get all active sessions',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    const sessions = await prisma.session.findMany({
      where: { 
        userId: request.userId,
        expiresAt: { gte: new Date() }
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const currentToken = request.headers.authorization?.replace('Bearer ', '');
    
    const sessionsWithStatus = sessions.map(session => ({
      ...session,
      token: session.token.slice(0, 8) + '...', // Mask token for security
      isCurrent: session.token === currentToken
    }));

    reply.send({
      success: true,
      data: { sessions: sessionsWithStatus }
    });
  });

  /**
   * @swagger
   * /auth/sessions/{sessionId}:
   *   delete:
   *     tags: [auth]
   *     summary: Delete specific session
   *     security:
   *       - Bearer: []
   */
  fastify.delete('/sessions/:sessionId', {
    preHandler: authMiddleware,
    schema: {
      tags: ['auth'],
      summary: 'Delete specific session',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        },
        required: ['sessionId']
      }
    }
  }, async (request, reply) => {
    const { sessionId } = request.params as any;

    const deletedSession = await prisma.session.deleteMany({
      where: { 
        id: sessionId,
        userId: request.userId
      }
    });

    if (deletedSession.count === 0) {
      throwNotFound('Session');
    }

    reply.send({
      success: true,
      message: 'Session deleted successfully'
    });
  });

  /**
   * @swagger
   * /auth/oauth/{provider}/authorize:
   *   get:
   *     tags: [auth]
   *     summary: Initiate OAuth2 authorization
   */
  fastify.get('/oauth/:provider/authorize', {
    schema: {
      tags: ['auth'],
      summary: 'Initiate OAuth2 authorization',
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
          redirect_uri: { type: 'string' },
          state: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { provider } = request.params as any;
      const { redirect_uri, state } = request.query as any;

      const clientInfo = getClientInfo(request);
      
      // Generate OAuth2 authorization URL
      let authUrl: string;
      const baseState = state || randomUUID();
      
      switch (provider) {
        case 'google':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            new URLSearchParams({
              client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
              redirect_uri: redirect_uri || `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google/callback`,
              response_type: 'code',
              scope: 'openid email profile',
              state: baseState,
              access_type: 'offline',
              prompt: 'consent'
            }).toString();
          break;
        case 'discord':
          authUrl = `https://discord.com/api/oauth2/authorize?` + 
            new URLSearchParams({
              client_id: process.env.DISCORD_OAUTH_CLIENT_ID || '',
              redirect_uri: redirect_uri || `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/discord/callback`,
              response_type: 'code',
              scope: 'identify email',
              state: baseState
            }).toString();
          break;
        case 'github':
          authUrl = `https://github.com/login/oauth/authorize?` + 
            new URLSearchParams({
              client_id: process.env.GITHUB_OAUTH_CLIENT_ID || '',
              redirect_uri: redirect_uri || `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/github/callback`,
              scope: 'user:email',
              state: baseState
            }).toString();
          break;
        default:
          throw new AppError(`Unsupported OAuth provider: ${provider}`, 400, 'UNSUPPORTED_PROVIDER');
      }

      // Store state in Redis for verification
      try {
        await authService.storeOAuthState(baseState, {
          provider,
          redirectUri: redirect_uri,
          clientInfo
        });
      } catch (error) {
        console.warn('Failed to store OAuth state:', error);
      }

      reply.redirect(authUrl);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('OAuth authorization error:', error);
      throw new AppError(
        'OAuth authorization failed',
        500,
        'OAUTH_AUTH_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/oauth/{provider}/callback:
   *   get:
   *     tags: [auth]
   *     summary: Handle OAuth2 callback
   */
  fastify.get('/oauth/:provider/callback', {
    schema: {
      tags: ['auth'],
      summary: 'Handle OAuth2 callback',
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
          error: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { provider } = request.params as any;
      const { code, state, error } = request.query as any;

      if (error) {
        throw new AppError(`OAuth error: ${error}`, 400, 'OAUTH_ERROR');
      }

      if (!code) {
        throw new AppError('Authorization code not provided', 400, 'NO_AUTH_CODE');
      }

      const clientInfo = getClientInfo(request);

      // Verify state if available
      if (state) {
        try {
          const stateData = await authService.verifyOAuthState(state);
          if (!stateData || stateData.provider !== provider) {
            throw new AppError('Invalid OAuth state', 400, 'INVALID_OAUTH_STATE');
          }
        } catch (error) {
          console.warn('OAuth state verification failed:', error);
        }
      }

      // Exchange code for tokens and user info
      const oauthResult = await authService.authenticateWithOAuth(provider as any, code, state);
      
      if (!oauthResult.success || !oauthResult.user) {
        throw new AppError(
          getErrorMessage(oauthResult.error, 'OAuth authentication failed'),
          400,
          'OAUTH_AUTH_FAILED'
        );
      }

      // Check if user exists with this OAuth provider
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: oauthResult.user.email },
            { [`${provider}Id`]: oauthResult.user.id }
          ]
        }
      });

      if (!user) {
        // Create new user from OAuth data
        user = await prisma.user.create({
          data: {
            username: oauthResult.user.email?.split('@')[0] || `${provider}_user_${Date.now()}`,
            displayName: oauthResult.user.name || oauthResult.user.email?.split('@')[0] || 'OAuth User',
            email: oauthResult.user.email,
            avatar: oauthResult.user.picture,
            isVerified: true, // OAuth users are pre-verified
            [`${provider}Id`]: oauthResult.user.id
          }
        });
      } else {
        // Update existing user with OAuth info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            [`${provider}Id`]: oauthResult.user.id,
            avatar: user.avatar || oauthResult.user.picture,
            isVerified: true
          }
        });
      }

      // Generate JWT tokens
      const tokens = await authService.generateTokens(user.id, {
        deviceInfo: `OAuth ${provider} login from ${clientInfo.userAgent}`,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      });

      // Generate CSRF token
      let csrfToken;
      try {
        csrfToken = await authService.generateCSRFToken(user.id);
      } catch (error) {
        console.warn('CSRF token generation failed during OAuth:', error);
      }

      // Redirect to frontend with tokens
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const redirectUrl = new URL('/auth/callback', frontendUrl);
      redirectUrl.searchParams.set('token', tokens.accessToken);
      redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
      redirectUrl.searchParams.set('provider', provider);
      
      if (csrfToken) {
        redirectUrl.searchParams.set('csrf_token', csrfToken);
      }

      reply.redirect(redirectUrl.toString());
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('OAuth callback error:', error);
      
      // Redirect to frontend with error
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const errorUrl = new URL('/login', frontendUrl);
      errorUrl.searchParams.set('error', 'oauth_failed');
      errorUrl.searchParams.set('provider', (request.params as any).provider);
      
      reply.redirect(errorUrl.toString());
    }
  });

  /**
   * @swagger
   * /auth/forgot-password:
   *   post:
   *     tags: [auth]
   *     summary: Request password reset
   */
  fastify.post('/forgot-password', {
    preHandler: authRateLimitMiddleware(authRateLimitService, 'forgotPassword'),
    schema: {
      tags: ['auth'],
      summary: 'Request password reset',
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
        required: ['email']
      }
    }
  }, async (request, reply) => {
    try {
      const { email } = request.body as any;

      // Input validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('Valid email address is required', 400, 'INVALID_EMAIL');
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, username: true }
      });

      // Always return success to prevent email enumeration
      if (!user) {
        reply.send({
          success: true,
          message: 'If an account with this email exists, you will receive password reset instructions.'
        });
        return;
      }

      // Generate password reset token
      if (!user.email) {
        reply.send({
          success: true,
          message: 'If an account with this email exists, you will receive password reset instructions.'
        });
        return;
      }
      
      const { token, expiresAt } = await authService.generatePasswordResetToken(user.id, user.email);

      // Send password reset email
      try {
        const emailResult = await authService.sendPasswordResetEmail(user.email, token);
        if (!emailResult.success) {
          console.error('Failed to send password reset email:', emailResult);
        }
      } catch (error) {
        console.error('Password reset email sending failed:', error);
      }

      reply.send({
        success: true,
        message: 'If an account with this email exists, you will receive password reset instructions.',
        data: {
          // In development, include token for testing
          ...(process.env.NODE_ENV === 'development' && { 
            resetToken: token,
            expiresAt: expiresAt.toISOString()
          })
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Forgot password error:', error);
      throw new AppError(
        'Password reset request failed',
        500,
        'FORGOT_PASSWORD_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/reset-password:
   *   post:
   *     tags: [auth]
   *     summary: Reset password with token
   */
  fastify.post('/reset-password', {
    preHandler: authRateLimitMiddleware(authRateLimitService, 'resetPassword'),
    schema: {
      tags: ['auth'],
      summary: 'Reset password with token',
      body: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string', minLength: 8 }
        },
        required: ['token', 'password', 'confirmPassword']
      }
    }
  }, async (request, reply) => {
    try {
      const { token, password, confirmPassword } = request.body as any;

      // Input validation
      if (!token || !password || !confirmPassword) {
        throw new AppError('All fields are required', 400, 'MISSING_FIELDS');
      }

      if (password !== confirmPassword) {
        throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new AppError(
          `Password requirements not met: ${passwordValidation.errors.join(', ')}`,
          400,
          'WEAK_PASSWORD'
        );
      }

      // Verify reset token
      const tokenResult = await authService.verifyPasswordResetToken(token);
      if (!tokenResult.valid || !tokenResult.userId) {
        throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update user password
      await prisma.user.update({
        where: { id: tokenResult.userId },
        data: { 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        }
      });

      // Consume the reset token
      await authService.consumePasswordResetToken(token);

      // Logout user from all devices for security
      try {
        await authService.logoutAllDevices(tokenResult.userId);
      } catch (error) {
        console.warn('Failed to logout user from all devices after password reset:', error);
      }

      reply.send({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Password reset error:', error);
      throw new AppError(
        'Password reset failed',
        500,
        'PASSWORD_RESET_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/verify-email:
   *   post:
   *     tags: [auth]
   *     summary: Verify email with token
   */
  fastify.post('/verify-email', {
    preHandler: authRateLimitMiddleware(authRateLimitService, 'verifyEmail'),
    schema: {
      tags: ['auth'],
      summary: 'Verify email with token',
      body: {
        type: 'object',
        properties: {
          token: { type: 'string' }
        },
        required: ['token']
      }
    }
  }, async (request, reply) => {
    try {
      const { token } = request.body as any;

      if (!token) {
        throw new AppError('Verification token is required', 400, 'TOKEN_REQUIRED');
      }

      // Verify email token
      const tokenResult = await authService.verifyEmailVerificationToken(token);
      if (!tokenResult.valid || !tokenResult.userId) {
        throw new AppError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
      }

      // Update user as verified
      const user = await prisma.user.update({
        where: { id: tokenResult.userId },
        data: { 
          isVerified: true,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isVerified: true
        }
      });

      reply.send({
        success: true,
        message: 'Email verified successfully',
        data: { user }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Email verification error:', error);
      throw new AppError(
        'Email verification failed',
        500,
        'EMAIL_VERIFICATION_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });

  /**
   * @swagger
   * /auth/resend-verification:
   *   post:
   *     tags: [auth]
   *     summary: Resend email verification
   *     security:
   *       - Bearer: []
   */
  fastify.post('/resend-verification', {
    preHandler: authMiddleware,
    schema: {
      tags: ['auth'],
      summary: 'Resend email verification',
      security: [{ Bearer: [] }]
    }
  }, async (request, reply) => {
    try {
      const user = request.user as any; // Type assertion to access user properties
      if (!user || !user.email) {
        throw new AppError('User email not found', 400, 'NO_USER_EMAIL');
      }

      if (user.isVerified) {
        throw new AppError('Email is already verified', 400, 'ALREADY_VERIFIED');
      }

      // Generate new verification token
      const token = await authService.generateEmailVerificationToken(user.id, user.email);

      // Send verification email
      try {
        const emailResult = await authService.sendEmailVerification(user.email, token);
        if (!emailResult.success) {
          throw new Error('Email service unavailable');
        }
      } catch (error) {
        console.error('Email verification sending failed:', error);
        throw new AppError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED');
      }

      reply.send({
        success: true,
        message: 'Verification email sent successfully',
        data: {
          // In development, include token for testing
          ...(process.env.NODE_ENV === 'development' && { verificationToken: token })
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Resend verification error:', error);
      throw new AppError(
        'Failed to resend verification email',
        500,
        'RESEND_VERIFICATION_ERROR',
        { timestamp: new Date().toISOString() }
      );
    }
  });
}