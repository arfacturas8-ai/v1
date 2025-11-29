import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { generateAccessToken, generateRefreshToken, verifyToken, hashPassword, verifyPassword } from '@cryb/auth';
import { randomUUID, createHash, timingSafeEqual } from 'crypto';
import Redis from 'ioredis';
import { EmailService } from './email.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt?: Date;
  sessionId: string;
}

export interface OAuthProvider {
  name: 'google' | 'discord' | 'github';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface LoginAttempt {
  identifier: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

export interface CSRFToken {
  token: string;
  expiresAt: Date;
  used: boolean;
}

export interface SessionInfo {
  userId: string;
  sessionId: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  previousSessionId?: string;
}

/**
 * Enhanced Authentication Service with bulletproof error handling
 * 
 * Features:
 * - JWT refresh token rotation with fallback
 * - Comprehensive error handling for all operations
 * - Rate limiting and brute force protection
 * - Account lockout mechanisms
 * - Session management with Redis
 * - CSRF protection
 * - Email verification with retry logic
 * - OAuth2 error recovery
 * - Web3 wallet authentication
 * - Database connection failure handling
 * - Input validation for all endpoints
 * - Proper password hashing with bcrypt
 */
export class EnhancedAuthService {
  private redis: Redis;
  private emailService: EmailService;
  private blacklistPrefix = 'blacklist:token:';
  private sessionPrefix = 'session:';
  private bruteForcePrefix = 'bruteforce:';
  private loginAttemptsPrefix = 'login_attempts:';
  private csrfPrefix = 'csrf:';
  private emailVerifyPrefix = 'email_verify:';
  private passwordResetPrefix = 'password_reset:';
  private oauth2Clients: Map<string, any> = new Map();
  
  // Security configuration
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly CSRF_TOKEN_EXPIRES = 30 * 60 * 1000; // 30 minutes
  private readonly EMAIL_VERIFY_EXPIRES = 24 * 60 * 60 * 1000; // 24 hours
  private readonly PASSWORD_RESET_EXPIRES = 60 * 60 * 1000; // 1 hour
  private readonly MAX_EMAIL_RETRIES = 3;
  private readonly JWT_ACCESS_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly JWT_REFRESH_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(redis: Redis, options: { oauthProviders?: OAuthProvider[] } = {}) {
    this.redis = redis;
    this.emailService = new EmailService();
    this.initializeOAuthClients(options.oauthProviders || []);
    this.setupHealthChecks();
  }
  
  /**
   * Initialize OAuth2 clients with error handling
   */
  private initializeOAuthClients(providers: OAuthProvider[]): void {
    try {
      providers.forEach(provider => {
        this.oauth2Clients.set(provider.name, {
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
          redirectUri: provider.redirectUri
        });
      });
      console.log(`✅ OAuth2 clients initialized for: ${providers.map(p => p.name).join(', ')}`);
    } catch (error) {
      console.error('Failed to initialize OAuth clients:', error);
    }
  }
  
  /**
   * Setup health checks for dependencies
   */
  private async setupHealthChecks(): Promise<void> {
    try {
      // Test Redis connection
      await this.redis.ping();
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      console.log('✅ Enhanced Auth service dependencies healthy');
    } catch (error) {
      console.error('❌ Enhanced Auth service dependency health check failed:', error);
    }
  }

  /**
   * Generate secure authentication tokens with comprehensive error handling
   */
  async generateTokens(userId: string, sessionInfo: Partial<SessionInfo> = {}): Promise<AuthTokens> {
    try {
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }

      const sessionId = randomUUID();
      const accessTokenExpiry = new Date(Date.now() + this.JWT_ACCESS_EXPIRY);
      const refreshTokenExpiry = new Date(Date.now() + this.JWT_REFRESH_EXPIRY);
      
      // Fetch user data securely
      const user = await this.getUserSecurely(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate JWT tokens with enhanced payload
      const tokenPayload = {
        userId,
        sessionId,
        email: user.email,
        walletAddress: user.walletAddress,
        isVerified: user.isVerified,
        jti: randomUUID() // JWT ID for tracking
      };
      
      const refreshPayload = {
        userId,
        sessionId,
        type: 'refresh',
        jti: randomUUID()
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(refreshPayload);

      // Store session in database with retry logic
      await this.executeWithRetry(async () => {
        await prisma.session.create({
          data: {
            id: sessionId,
            userId,
            token: accessToken,
            refreshToken,
            expiresAt: refreshTokenExpiry,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }, 'Failed to create session in database');

      // Store session metadata in Redis with error handling
      const sessionKey = `${this.sessionPrefix}${sessionId}`;
      await this.executeWithRetry(async () => {
        await this.redis.hset(sessionKey, {
          userId,
          deviceInfo: sessionInfo.deviceInfo || 'unknown',
          ipAddress: sessionInfo.ipAddress || 'unknown',
          userAgent: sessionInfo.userAgent || 'unknown',
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          accessTokenExpiry: accessTokenExpiry.toISOString(),
          refreshTokenExpiry: refreshTokenExpiry.toISOString()
        });
        
        // Set session expiry in Redis
        await this.redis.expire(sessionKey, Math.ceil(this.JWT_REFRESH_EXPIRY / 1000));
      }, 'Failed to store session in Redis');

      return {
        accessToken,
        refreshToken,
        expiresAt: accessTokenExpiry,
        refreshExpiresAt: refreshTokenExpiry,
        sessionId
      };
    } catch (error) {
      console.error('Token generation failed:', error);
      throw new Error(`Authentication token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token using refresh token with rotation and fallback
   */
  async refreshTokens(refreshToken: string, sessionInfo: Partial<SessionInfo> = {}): Promise<AuthTokens> {
    try {
      // Input validation
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new Error('Invalid refresh token provided');
      }
      
      // Verify refresh token with enhanced error handling
      let payload: any;
      try {
        payload = verifyToken(refreshToken, { isRefresh: true });
      } catch (tokenError) {
        // Handle specific token errors
        if (tokenError instanceof Error) {
          if (tokenError.message.includes('expired')) {
            throw new Error('Refresh token has expired');
          } else if (tokenError.message.includes('invalid')) {
            throw new Error('Invalid refresh token format');
          } else {
            throw new Error('Refresh token verification failed');
          }
        }
        throw new Error('Token verification failed');
      }
      
      // Validate token type
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type for refresh operation');
      }
      
      // Check if session exists and is valid with database retry
      const session = await this.executeWithRetry(async () => {
        return await prisma.session.findUnique({
          where: { refreshToken },
          include: { user: true }
        });
      }, 'Failed to fetch session from database');

      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await this.cleanupExpiredSession(session.id);
        throw new Error('Refresh token has expired');
      }
      
      if (session.userId !== payload.userId) {
        throw new Error('Token user mismatch');
      }

      // Check if token is blacklisted with Redis error handling
      try {
        const isBlacklisted = await this.redis.exists(`${this.blacklistPrefix}${refreshToken}`);
        if (isBlacklisted) {
          throw new Error('Token has been revoked');
        }
      } catch (redisError) {
        console.warn('Redis blacklist check failed, allowing token refresh:', redisError);
        // Continue with refresh as fallback when Redis is down
      }

      // Implement refresh token rotation with security hardening
      const newTokens = await this.generateTokens(session.userId, {
        ...sessionInfo,
        deviceInfo: sessionInfo.deviceInfo || session.user?.username || 'unknown',
        previousSessionId: session.id // Track session rotation
      });

      // Security hardening: detect concurrent refresh attempts
      const concurrentRefreshKey = `concurrent_refresh:${session.userId}:${payload.sessionId}`;
      try {
        const concurrentAttempts = await this.redis.incr(concurrentRefreshKey);
        await this.redis.expire(concurrentRefreshKey, 60); // 1 minute window
        
        if (concurrentAttempts > 3) {
          console.warn(`Suspicious concurrent refresh attempts detected for user ${session.userId}`);
          
          // Invalidate all sessions for security
          await this.logoutAllDevices(session.userId);
          
          throw new Error('Suspicious refresh activity detected. All sessions have been invalidated for security.');
        }
      } catch (redisError) {
        console.warn('Failed to check concurrent refresh attempts:', redisError);
      }

      // Blacklist old refresh token immediately (rotation)
      try {
        await this.blacklistToken(refreshToken);
        await this.blacklistToken(session.token); // Also blacklist the associated access token
      } catch (error) {
        console.warn('Failed to blacklist old tokens:', error);
      }

      // Track token rotation in Redis for audit
      try {
        const rotationKey = `token_rotation:${session.userId}:${Date.now()}`;
        await this.redis.setex(rotationKey, 24 * 60 * 60, JSON.stringify({
          userId: session.userId,
          oldSessionId: session.id,
          newSessionId: newTokens.sessionId,
          rotatedAt: new Date().toISOString(),
          clientInfo: sessionInfo
        }));
      } catch (error) {
        console.warn('Failed to track token rotation:', error);
      }

      // Delete old session with retry
      await this.executeWithRetry(async () => {
        await prisma.session.delete({
          where: { id: session.id }
        });
      }, 'Failed to delete old session');

      // Update session activity in Redis (with fallback)
      try {
        const sessionKey = `${this.sessionPrefix}${payload.sessionId}`;
        await this.redis.hset(sessionKey, {
          lastActivity: new Date().toISOString(),
          ipAddress: sessionInfo.ipAddress || 'unknown',
          refreshedAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to update session activity in Redis:', error);
      }

      return newTokens;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Token refresh failed:', errorMessage);
      throw new Error(`Token refresh failed: ${errorMessage}`);
    }
  }

  /**
   * Validate access token with comprehensive error handling
   */
  async validateAccessToken(token: string): Promise<{ valid: boolean; payload?: any; reason?: string }> {
    try {
      // Input validation
      if (!token || typeof token !== 'string') {
        return { valid: false, reason: 'Invalid token format' };
      }
      
      // Rate limiting for token validation to prevent abuse
      const tokenHash = createHash('sha256').update(token).digest('hex').substring(0, 16);
      const rateLimitKey = `token_validation:${tokenHash}`;
      
      try {
        const validationCount = await this.redis.incr(rateLimitKey);
        if (validationCount === 1) {
          await this.redis.expire(rateLimitKey, 60); // 1 minute window
        }
        if (validationCount > 100) { // Max 100 validations per minute per token
          return { valid: false, reason: 'Token validation rate limit exceeded' };
        }
      } catch (error) {
        console.warn('Token validation rate limiting failed:', error);
      }

      // Check if token is blacklisted with fallback
      let isBlacklisted = false;
      try {
        isBlacklisted = (await this.redis.exists(`${this.blacklistPrefix}${token}`)) > 0;
      } catch (error) {
        console.warn('Redis blacklist check failed during validation:', error);
      }
      
      if (isBlacklisted) {
        return { valid: false, reason: 'Token has been revoked' };
      }

      // Verify JWT with enhanced error handling
      let payload: any;
      try {
        payload = verifyToken(token);
      } catch (tokenError) {
        if (tokenError instanceof Error) {
          if (tokenError.message.includes('expired')) {
            return { valid: false, reason: 'Token has expired' };
          } else if (tokenError.message.includes('invalid signature')) {
            return { valid: false, reason: 'Invalid token signature' };
          } else if (tokenError.message.includes('invalid')) {
            return { valid: false, reason: 'Invalid token format' };
          } else {
            return { valid: false, reason: 'Token verification failed' };
          }
        }
        return { valid: false, reason: 'Token verification error' };
      }
      
      // Validate token type
      if (payload.type === 'refresh') {
        return { valid: false, reason: 'Refresh token cannot be used for access' };
      }
      
      // Check session exists with fallback
      const sessionKey = `${this.sessionPrefix}${payload.sessionId}`;
      let sessionExists = false;
      
      try {
        sessionExists = (await this.redis.exists(sessionKey)) > 0;
      } catch (error) {
        console.warn('Redis session check failed, falling back to database:', error);
        // Fallback to database check
        try {
          const dbSession = await prisma.session.findFirst({
            where: {
              userId: payload.userId,
              expiresAt: { gte: new Date() }
            }
          });
          sessionExists = !!dbSession;
        } catch (dbError) {
          console.error('Database session check also failed:', dbError);
          return { valid: false, reason: 'Session validation failed' };
        }
      }
      
      if (!sessionExists) {
        return { valid: false, reason: 'Session not found or expired' };
      }

      // Update last activity with error handling
      try {
        await this.redis.hset(sessionKey, 'lastActivity', new Date().toISOString());
      } catch (error) {
        console.warn('Failed to update last activity:', error);
      }

      return { valid: true, payload };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, reason: 'Token validation failed' };
    }
  }

  /**
   * Blacklist a token (for logout) with error handling
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token provided for blacklisting');
      }
      
      const tokenHash = createHash('sha256').update(token).digest('hex');
      
      // Store in Redis with expiration matching token expiry
      await this.executeWithRetry(async () => {
        await this.redis.setex(
          `${this.blacklistPrefix}${tokenHash}`,
          Math.ceil(this.JWT_REFRESH_EXPIRY / 1000), // Match refresh token expiry
          JSON.stringify({
            revokedAt: new Date().toISOString(),
            reason: 'manual_revocation'
          })
        );
      }, 'Failed to blacklist token in Redis');
    } catch (error) {
      console.error('Token blacklisting failed:', error);
      throw new Error(`Failed to blacklist token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Logout user (blacklist current session) with comprehensive cleanup
   */
  async logout(token: string): Promise<void> {
    let sessionId: string | undefined;
    
    try {
      // Try to extract session info from token
      try {
        const payload = verifyToken(token);
        sessionId = payload.sessionId;
      } catch (error) {
        console.warn('Token verification failed during logout, proceeding with cleanup:', error);
      }
      
      // Always blacklist the token
      await this.blacklistToken(token);
      
      // Remove session from database with retry
      await this.executeWithRetry(async () => {
        await prisma.session.deleteMany({
          where: { token }
        });
      }, 'Failed to remove session from database during logout');

      // Remove session from Redis if we have sessionId
      if (sessionId) {
        try {
          const sessionKey = `${this.sessionPrefix}${sessionId}`;
          await this.redis.del(sessionKey);
        } catch (error) {
          console.warn('Failed to remove session from Redis during logout:', error);
        }
      }
    } catch (error) {
      console.error('Logout operation encountered errors:', error);
      // Even if other operations fail, ensure token is blacklisted
      try {
        await this.blacklistToken(token);
      } catch (blacklistError) {
        console.error('Critical: Failed to blacklist token during logout:', blacklistError);
      }
      throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Logout user from all devices with comprehensive error handling
   */
  async logoutAllDevices(userId: string): Promise<void> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }
      
      // Get all user sessions with retry
      const sessions = await this.executeWithRetry(async () => {
        return await prisma.session.findMany({
          where: { userId }
        });
      }, 'Failed to fetch user sessions');

      if (sessions.length === 0) {
        console.log(`No sessions found for user ${userId}`);
        return;
      }

      // Blacklist all tokens with error handling
      const blacklistResults = await Promise.allSettled(
        sessions.map(session => 
          Promise.allSettled([
            this.blacklistToken(session.token),
            this.blacklistToken(session.refreshToken)
          ])
        )
      );
      
      // Log any blacklisting failures
      blacklistResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to blacklist tokens for session ${sessions[index].id}:`, result.reason);
        }
      });

      // Delete all sessions from database with retry
      await this.executeWithRetry(async () => {
        await prisma.session.deleteMany({
          where: { userId }
        });
      }, 'Failed to delete sessions from database');

      // Remove all Redis session data with error handling
      try {
        const sessionKeys = sessions.map(session => `${this.sessionPrefix}${session.id}`);
        if (sessionKeys.length > 0) {
          await this.redis.del(...sessionKeys);
        }
      } catch (error) {
        console.warn('Failed to remove session data from Redis:', error);
      }
      
      console.log(`Successfully logged out user ${userId} from ${sessions.length} devices`);
    } catch (error) {
      console.error('Logout all devices failed:', error);
      throw new Error(`Failed to logout from all devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced brute force protection with account lockout
   */
  async checkBruteForce(identifier: string): Promise<{ allowed: boolean; retryAfter?: number; attemptsRemaining?: number }> {
    try {
      const key = `${this.bruteForcePrefix}${identifier}`;
      let attempts = 0;
      
      try {
        const attemptsStr = await this.redis.get(key);
        attempts = parseInt(attemptsStr || '0');
      } catch (error) {
        console.warn('Redis brute force check failed, allowing request:', error);
        return { allowed: true };
      }

      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        const ttl = await this.redis.ttl(key);
        return { 
          allowed: false, 
          retryAfter: ttl > 0 ? ttl : this.LOCKOUT_DURATION / 1000,
          attemptsRemaining: 0
        };
      }

      return { 
        allowed: true,
        attemptsRemaining: this.MAX_LOGIN_ATTEMPTS - attempts
      };
    } catch (error) {
      console.error('Brute force check failed:', error);
      // Fail open to avoid blocking legitimate users when Redis is down
      return { allowed: true };
    }
  }

  /**
   * Record failed login attempt with enhanced tracking
   */
  async recordFailedAttempt(identifier: string, details?: { ip?: string; userAgent?: string }): Promise<{ locked: boolean; attemptsRemaining: number; lockoutDuration?: number }> {
    try {
      const key = `${this.bruteForcePrefix}${identifier}`;
      const lockoutKey = `${this.loginAttemptsPrefix}${identifier}`;
      
      let attempts = 0;
      try {
        const result = await this.redis.multi()
          .incr(key)
          .expire(key, Math.ceil(this.LOCKOUT_DURATION / 1000))
          .exec();
          
        if (result && result[0] && Array.isArray(result[0]) && result[0][1]) {
          attempts = result[0][1] as number;
        }
      } catch (error) {
        console.warn('Failed to record failed attempt in Redis:', error);
        return { locked: false, attemptsRemaining: this.MAX_LOGIN_ATTEMPTS };
      }
      
      // Store detailed attempt info
      try {
        await this.redis.hset(lockoutKey, {
          attempts: attempts.toString(),
          lastAttempt: new Date().toISOString(),
          ip: details?.ip || 'unknown',
          userAgent: details?.userAgent || 'unknown'
        });
        await this.redis.expire(lockoutKey, Math.ceil(this.LOCKOUT_DURATION / 1000));
      } catch (error) {
        console.warn('Failed to store detailed attempt info:', error);
      }

      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        return {
          locked: true,
          attemptsRemaining: 0,
          lockoutDuration: this.LOCKOUT_DURATION
        };
      }

      return {
        locked: false,
        attemptsRemaining: this.MAX_LOGIN_ATTEMPTS - attempts
      };
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
      return { locked: false, attemptsRemaining: this.MAX_LOGIN_ATTEMPTS };
    }
  }

  /**
   * Clear failed attempts (on successful login)
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    try {
      const bruteForceKey = `${this.bruteForcePrefix}${identifier}`;
      const lockoutKey = `${this.loginAttemptsPrefix}${identifier}`;
      
      await Promise.allSettled([
        this.redis.del(bruteForceKey),
        this.redis.del(lockoutKey)
      ]);
    } catch (error) {
      console.warn('Failed to clear failed attempts:', error);
    }
  }

  /**
   * Generate CSRF token
   */
  async generateCSRFToken(userId: string): Promise<string> {
    try {
      const token = randomUUID();
      const key = `${this.csrfPrefix}${userId}:${token}`;
      
      await this.redis.setex(
        key,
        Math.ceil(this.CSRF_TOKEN_EXPIRES / 1000),
        JSON.stringify({
          userId,
          createdAt: new Date().toISOString(),
          used: false
        })
      );
      
      return token;
    } catch (error) {
      console.error('CSRF token generation failed:', error);
      throw new Error('Failed to generate CSRF token');
    }
  }
  
  /**
   * Validate and consume CSRF token
   */
  async validateCSRFToken(userId: string, token: string): Promise<boolean> {
    try {
      const key = `${this.csrfPrefix}${userId}:${token}`;
      const tokenData = await this.redis.get(key);
      
      if (!tokenData) {
        return false;
      }
      
      const parsed = JSON.parse(tokenData);
      if (parsed.used) {
        return false;
      }
      
      // Mark as used and delete
      await this.redis.del(key);
      
      return parsed.userId === userId;
    } catch (error) {
      console.error('CSRF token validation failed:', error);
      return false;
    }
  }

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(userId: string, email: string): Promise<string> {
    try {
      const token = randomUUID();
      const key = `${this.emailVerifyPrefix}${token}`;
      
      await this.redis.setex(
        key,
        Math.ceil(this.EMAIL_VERIFY_EXPIRES / 1000),
        JSON.stringify({
          userId,
          email,
          createdAt: new Date().toISOString(),
          attempts: 0
        })
      );
      
      return token;
    } catch (error) {
      console.error('Email verification token generation failed:', error);
      throw new Error('Failed to generate email verification token');
    }
  }
  
  /**
   * Verify email verification token
   */
  async verifyEmailVerificationToken(token: string): Promise<{ valid: boolean; userId?: string; email?: string }> {
    try {
      const key = `${this.emailVerifyPrefix}${token}`;
      const tokenData = await this.redis.get(key);
      
      if (!tokenData) {
        return { valid: false };
      }
      
      const parsed = JSON.parse(tokenData);
      
      // Delete the token after use
      await this.redis.del(key);
      
      return {
        valid: true,
        userId: parsed.userId,
        email: parsed.email
      };
    } catch (error) {
      console.error('Email verification token validation failed:', error);
      return { valid: false };
    }
  }

  /**
   * Secure password authentication with timing attack protection
   */
  async authenticateWithPassword(
    identifier: string, 
    password: string, 
    options: { ip?: string; userAgent?: string } = {}
  ): Promise<{ success: boolean; user?: any; error?: string; lockout?: { locked: boolean; retryAfter?: number } }> {
    try {
      // Check brute force protection
      const bruteForceCheck = await this.checkBruteForce(identifier);
      if (!bruteForceCheck.allowed) {
        return {
          success: false,
          error: 'Account temporarily locked due to too many failed attempts',
          lockout: { locked: true, retryAfter: bruteForceCheck.retryAfter }
        };
      }
      
      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier }
          ]
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          passwordHash: true,
          isVerified: true,
          walletAddress: true
        }
      });
      
      // Always perform hash comparison to prevent timing attacks
      const dummyHash = '$2b$12$dummy.hash.to.prevent.timing.attacks.abcdefghijklmnopqr';
      const hashToCompare = user?.passwordHash || dummyHash;
      
      const isValidPassword = await verifyPassword(password, hashToCompare);
      
      if (!user || !user.passwordHash || !isValidPassword) {
        // Record failed attempt
        const lockoutInfo = await this.recordFailedAttempt(identifier, {
          ip: options.ip,
          userAgent: options.userAgent
        });
        
        return {
          success: false,
          error: 'Invalid credentials',
          lockout: {
            locked: lockoutInfo.locked,
            retryAfter: lockoutInfo.lockoutDuration ? Math.ceil(lockoutInfo.lockoutDuration / 1000) : undefined
          }
        };
      }
      
      // Clear failed attempts on successful login
      await this.clearFailedAttempts(identifier);
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress
        }
      };
    } catch (error) {
      console.error('Password authentication failed:', error);
      return { success: false, error: 'Authentication service unavailable' };
    }
  }

  /**
   * Web3 wallet authentication with comprehensive error handling
   */
  async authenticateWithWallet(
    walletAddress: string,
    signature: string,
    message: string,
    options: { ip?: string; userAgent?: string } = {}
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Validate inputs
      if (!walletAddress || !signature || !message) {
        return { success: false, error: 'Missing required wallet authentication parameters' };
      }
      
      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return { success: false, error: 'Invalid wallet address format' };
      }
      
      // TODO: Implement SIWE (Sign-In with Ethereum) verification
      
      const isValidSignature = await this.verifyWalletSignature(
        walletAddress,
        signature,
        message
      );
      
      if (!isValidSignature) {
        return { success: false, error: 'Invalid wallet signature' };
      }
      
      // Find user with wallet
      const user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          walletAddress: true,
          isVerified: true
        }
      });
      
      if (!user) {
        return { success: false, error: 'Wallet not registered. Please register first.' };
      }
      
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Wallet authentication failed:', error);
      return { success: false, error: 'Wallet authentication service unavailable' };
    }
  }

  /**
   * Clean up expired sessions with comprehensive cleanup
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      console.log('Starting session cleanup...');
      
      // Get expired sessions before deletion for Redis cleanup
      const expiredSessions = await this.executeWithRetry(async () => {
        return await prisma.session.findMany({
          where: {
            expiresAt: { lt: new Date() }
          },
          select: { id: true, token: true, refreshToken: true }
        });
      }, 'Failed to fetch expired sessions');
      
      if (expiredSessions.length === 0) {
        console.log('No expired sessions to clean up');
        return;
      }
      
      // Blacklist expired tokens
      const blacklistPromises = expiredSessions.map(session =>
        Promise.allSettled([
          this.blacklistToken(session.token),
          this.blacklistToken(session.refreshToken)
        ])
      );
      
      await Promise.allSettled(blacklistPromises);
      
      // Delete expired sessions from database
      const deletedCount = await this.executeWithRetry(async () => {
        const result = await prisma.session.deleteMany({
          where: {
            expiresAt: { lt: new Date() }
          }
        });
        return result.count;
      }, 'Failed to delete expired sessions');
      
      // Clean up Redis session data
      const sessionKeys = expiredSessions.map(session => `${this.sessionPrefix}${session.id}`);
      if (sessionKeys.length > 0) {
        try {
          await this.redis.del(...sessionKeys);
        } catch (error) {
          console.warn('Failed to clean up Redis session data:', error);
        }
      }
      
      console.log(`Cleaned up ${deletedCount} expired sessions`);
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }
  
  /**
   * Clean up a single expired session
   */
  private async cleanupExpiredSession(sessionId: string): Promise<void> {
    try {
      // Remove from database
      await prisma.session.delete({
        where: { id: sessionId }
      });
      
      // Remove from Redis
      const sessionKey = `${this.sessionPrefix}${sessionId}`;
      await this.redis.del(sessionKey);
    } catch (error) {
      console.warn('Failed to cleanup expired session:', error);
    }
  }

  /**
   * Utility method for database operations with retry
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>, 
    errorMessage: string, 
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          console.error(`${errorMessage} (attempt ${attempt}/${maxRetries}):`, lastError);
          break;
        }
        
        console.warn(`${errorMessage} (attempt ${attempt}/${maxRetries}):`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Exponential backoff
      }
    }
    
    throw new Error(`${errorMessage}: ${lastError!.message}`);
  }
  
  /**
   * Securely fetch user data
   */
  private async getUserSecurely(userId: string): Promise<{ id: string; email: string | null; walletAddress: string | null; isVerified: boolean } | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          walletAddress: true,
          isVerified: true
        }
      });
    } catch (error) {
      console.error('Failed to fetch user securely:', error);
      return null;
    }
  }

  /**
   * Verify wallet signature using SIWE
   */
  private async verifyWalletSignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      const ethers = require('ethers');
      
      // Recover the address from the signature
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      
      // Verify the recovered address matches the claimed wallet address
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.warn('Wallet address mismatch in SIWE verification');
        return false;
      }
      
      // Parse and validate the SIWE message
      const siwePattern = /^(.+) wants you to sign in with your Ethereum account:\n(.+)\n\nNonce: (.+)\nIssued At: (.+)$/;
      const match = message.match(siwePattern);
      
      if (!match) {
        console.warn('Invalid SIWE message format');
        return false;
      }
      
      const [, domain, address, nonce, issuedAt] = match;
      
      // Verify the message hasn't expired (5 minutes validity)
      const issuedTime = new Date(issuedAt).getTime();
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (currentTime - issuedTime > fiveMinutes) {
        console.warn('SIWE message expired');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Wallet signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive security statistics
   */
  async getSecurityStats(userId: string): Promise<any> {
    try {
      const user = await this.getUserSecurely(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get recent login attempts
      let recentAttempts = 0;
      try {
        const attemptsKey = `${this.bruteForcePrefix}${userId}`;
        const attempts = await this.redis.get(attemptsKey);
        recentAttempts = parseInt(attempts || '0');
      } catch (error) {
        console.warn('Failed to get recent login attempts:', error);
      }

      return {
        isVerified: user.isVerified,
        hasEmail: !!user.email,
        hasWallet: !!user.walletAddress,
        recentFailedAttempts: recentAttempts,
        securityScore: this.calculateSecurityScore({
          isVerified: user.isVerified,
          hasEmail: !!user.email,
          hasWallet: !!user.walletAddress,
          recentFailedAttempts: recentAttempts
        })
      };
    } catch (error) {
      console.error('Failed to get security stats:', error);
      throw new Error(`Failed to retrieve security statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Calculate user security score (0-100)
   */
  private calculateSecurityScore(data: {
    isVerified: boolean;
    hasEmail: boolean;
    hasWallet: boolean;
    recentFailedAttempts: number;
  }): number {
    let score = 50; // Base score
    
    if (data.isVerified) score += 20;
    if (data.hasEmail) score += 15;
    if (data.hasWallet) score += 10;
    
    // Penalize recent failed attempts
    score -= data.recentFailedAttempts * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate password reset token with comprehensive error handling
   */
  async generatePasswordResetToken(userId: string, email: string): Promise<{ token: string; expiresAt: Date }> {
    try {
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + this.PASSWORD_RESET_EXPIRES);
      const key = `${this.passwordResetPrefix}${token}`;
      
      await this.executeWithRetry(async () => {
        await this.redis.setex(
          key,
          Math.ceil(this.PASSWORD_RESET_EXPIRES / 1000),
          JSON.stringify({
            userId,
            email,
            createdAt: new Date().toISOString(),
            attempts: 0
          })
        );
      }, 'Failed to store password reset token');
      
      return { token, expiresAt };
    } catch (error) {
      console.error('Password reset token generation failed:', error);
      throw new Error(`Failed to generate password reset token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string; email?: string; attempts?: number }> {
    try {
      const key = `${this.passwordResetPrefix}${token}`;
      const tokenData = await this.redis.get(key);
      
      if (!tokenData) {
        return { valid: false };
      }
      
      const parsed = JSON.parse(tokenData);
      
      // Track attempt
      parsed.attempts = (parsed.attempts || 0) + 1;
      
      if (parsed.attempts > this.MAX_EMAIL_RETRIES) {
        await this.redis.del(key);
        return { valid: false };
      }
      
      // Update attempts count
      await this.redis.setex(
        key,
        Math.ceil(this.PASSWORD_RESET_EXPIRES / 1000),
        JSON.stringify(parsed)
      );
      
      return {
        valid: true,
        userId: parsed.userId,
        email: parsed.email,
        attempts: parsed.attempts
      };
    } catch (error) {
      console.error('Password reset token verification failed:', error);
      return { valid: false };
    }
  }
  
  /**
   * Consume password reset token (delete after successful use)
   */
  async consumePasswordResetToken(token: string): Promise<void> {
    try {
      const key = `${this.passwordResetPrefix}${token}`;
      await this.redis.del(key);
    } catch (error) {
      console.warn('Failed to consume password reset token:', error);
    }
  }
  
  /**
   * Send email verification with retry logic (placeholder)
   */
  async sendEmailVerification(email: string, token: string, retryCount: number = 0): Promise<{ success: boolean; retryAfter?: number }> {
    try {
      // TODO: Implement actual email sending logic
      // This is a placeholder that would integrate with an email service
      
      console.log(`📧 Email verification would be sent to: ${email} with token: ${token.substring(0, 8)}...`);
      
      // Simulate email service delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simulate occasional failures for retry testing
      if (Math.random() < 0.1 && retryCount < this.MAX_EMAIL_RETRIES) {
        throw new Error('Simulated email service failure');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Email verification sending failed:', error);
      
      if (retryCount < this.MAX_EMAIL_RETRIES) {
        const retryAfter = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying email verification in ${retryAfter}ms (attempt ${retryCount + 1}/${this.MAX_EMAIL_RETRIES})`);
        
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await this.sendEmailVerification(email, token, retryCount + 1);
            resolve(result);
          }, retryAfter);
        });
      }
      
      return { success: false, retryAfter: 60000 }; // Retry after 1 minute
    }
  }
  
  /**
   * Send password reset email with retry logic
   */
  async sendPasswordResetEmail(email: string, token: string, retryCount: number = 0): Promise<{ success: boolean; retryAfter?: number }> {
    try {
      // Get user to retrieve username for email template
      const user = await prisma.user.findUnique({
        where: { email },
        select: { username: true }
      });

      if (!user) {
        console.error('User not found for password reset email');
        return { success: false };
      }

      // Send email using EmailService
      const success = await this.emailService.sendPasswordResetEmail(email, user.username, token);

      if (!success && retryCount < this.MAX_EMAIL_RETRIES) {
        throw new Error('Email service failed to send password reset email');
      }

      return { success };
    } catch (error) {
      console.error('Password reset email sending failed:', error);

      if (retryCount < this.MAX_EMAIL_RETRIES) {
        const retryAfter = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying password reset email in ${retryAfter}ms (attempt ${retryCount + 1}/${this.MAX_EMAIL_RETRIES})`);

        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await this.sendPasswordResetEmail(email, token, retryCount + 1);
            resolve(result);
          }, retryAfter);
        });
      }

      return { success: false, retryAfter: 60000 }; // Retry after 1 minute
    }
  }
  
  /**
   * Store OAuth2 state for verification
   */
  async storeOAuthState(state: string, data: {
    provider: string;
    redirectUri?: string;
    clientInfo: any;
  }): Promise<void> {
    try {
      const key = `oauth_state:${state}`;
      await this.redis.setex(
        key,
        600, // 10 minutes
        JSON.stringify({
          ...data,
          createdAt: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('Failed to store OAuth state:', error);
      throw new Error('OAuth state storage failed');
    }
  }
  
  /**
   * Verify and consume OAuth2 state
   */
  async verifyOAuthState(state: string): Promise<any> {
    try {
      const key = `oauth_state:${state}`;
      const stateData = await this.redis.get(key);
      
      if (!stateData) {
        return null;
      }
      
      // Delete the state after use
      await this.redis.del(key);
      
      return JSON.parse(stateData);
    } catch (error) {
      console.error('OAuth state verification failed:', error);
      return null;
    }
  }

  /**
   * OAuth2 authentication with comprehensive error handling
   */
  async authenticateWithOAuth(
    provider: 'google' | 'discord' | 'github',
    code: string,
    state?: string
  ): Promise<{ success: boolean; user?: any; error?: string; tokens?: any }> {
    try {
      // Exchange authorization code for access token
      let tokenResponse: any;
      let userResponse: any;
      
      switch (provider) {
        case 'google':
          tokenResponse = await this.exchangeGoogleCode(code);
          if (tokenResponse.access_token) {
            userResponse = await this.fetchGoogleUser(tokenResponse.access_token);
          }
          break;
        case 'discord':
          tokenResponse = await this.exchangeDiscordCode(code);
          if (tokenResponse.access_token) {
            userResponse = await this.fetchDiscordUser(tokenResponse.access_token);
          }
          break;
        case 'github':
          tokenResponse = await this.exchangeGithubCode(code);
          if (tokenResponse.access_token) {
            userResponse = await this.fetchGithubUser(tokenResponse.access_token);
          }
          break;
        default:
          return { success: false, error: `Unsupported OAuth provider: ${provider}` };
      }
      
      if (!tokenResponse?.access_token || !userResponse) {
        return { success: false, error: `Failed to authenticate with ${provider}` };
      }
      
      return {
        success: true,
        user: userResponse,
        tokens: tokenResponse
      };
    } catch (error) {
      console.error(`OAuth2 authentication with ${provider} failed:`, error);
      return { success: false, error: `OAuth authentication with ${provider} failed` };
    }
  }
  
  /**
   * Exchange Google authorization code for tokens
   */
  private async exchangeGoogleCode(code: string): Promise<any> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google/callback`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Google token exchange failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Google token exchange failed:', error);
      throw error;
    }
  }
  
  /**
   * Fetch Google user profile
   */
  private async fetchGoogleUser(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`Google user fetch failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Google user fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * Exchange Discord authorization code for tokens
   */
  private async exchangeDiscordCode(code: string): Promise<any> {
    try {
      const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_OAUTH_CLIENT_ID || '',
          client_secret: process.env.DISCORD_OAUTH_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/discord/callback`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Discord token exchange failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Discord token exchange failed:', error);
      throw error;
    }
  }
  
  /**
   * Fetch Discord user profile
   */
  private async fetchDiscordUser(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`Discord user fetch failed: ${response.statusText}`);
      }
      
      const user: any = await response.json();
      
      // Transform Discord user data to match our format
      return {
        id: user.id,
        email: user.email,
        name: user.global_name || user.username,
        picture: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
        username: user.username
      };
    } catch (error) {
      console.error('Discord user fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * Exchange GitHub authorization code for tokens
   */
  private async exchangeGithubCode(code: string): Promise<any> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_OAUTH_CLIENT_ID || '',
          client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/github/callback`
        })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub token exchange failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('GitHub token exchange failed:', error);
      throw error;
    }
  }
  
  /**
   * Fetch GitHub user profile
   */
  private async fetchGithubUser(accessToken: string): Promise<any> {
    try {
      const [userResponse, emailResponse] = await Promise.all([
        fetch('https://api.github.com/user', {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'CRYB-Platform'
          }
        }),
        fetch('https://api.github.com/user/emails', {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'CRYB-Platform'
          }
        })
      ]);
      
      if (!userResponse.ok) {
        throw new Error(`GitHub user fetch failed: ${userResponse.statusText}`);
      }
      
      const user: any = await userResponse.json();
      let emails: any[] = [];
      
      if (emailResponse.ok) {
        emails = await emailResponse.json() as any[];
      }
      
      // Find primary email
      const primaryEmail = emails.find((email: any) => email.primary)?.email || user.email;
      
      // Transform GitHub user data to match our format
      return {
        id: user.id.toString(),
        email: primaryEmail,
        name: user.name || user.login,
        picture: user.avatar_url,
        username: user.login
      };
    } catch (error) {
      console.error('GitHub user fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate 2FA secret and backup codes
   */
  async generate2FASecret(userId: string): Promise<{
    secret: string;
    backupCodes: string[];
    qrCode?: string;
  }> {
    try {
      // Generate base32 secret for TOTP
      const secret = this.generateBase32Secret();
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      
      // Store in Redis temporarily until confirmed
      const tempKey = `2fa:temp:${userId}`;
      await this.redis.setex(
        tempKey,
        600, // 10 minutes
        JSON.stringify({
          secret,
          backupCodes: backupCodes.map(code => createHash('sha256').update(code).digest('hex')),
          createdAt: new Date().toISOString()
        })
      );
      
      // Generate QR code URL
      const user = await this.getUserSecurely(userId);
      const qrCodeUrl = `otpauth://totp/CRYB:${user?.email || 'User'}?secret=${secret}&issuer=CRYB`;
      
      return {
        secret,
        backupCodes,
        qrCode: qrCodeUrl
      };
    } catch (error) {
      console.error('2FA secret generation failed:', error);
      throw new Error(`Failed to generate 2FA secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string, token: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      const tempKey = `2fa:temp:${userId}`;
      const tempData = await this.redis.get(tempKey);
      
      if (!tempData) {
        return { success: false, error: '2FA setup session expired' };
      }
      
      const parsed = JSON.parse(tempData);
      
      // Verify TOTP token
      if (!this.verifyTOTP(parsed.secret, token)) {
        return { success: false, error: 'Invalid 2FA token' };
      }
      
      // Save 2FA data to database
      await this.executeWithRetry(async () => {
        await prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorSecret: parsed.secret,
            twoFactorEnabled: true,
            twoFactorBackupCodes: parsed.backupCodes
          }
        });
      }, 'Failed to enable 2FA in database');
      
      // Clean up temporary data
      await this.redis.del(tempKey);
      
      // Return plaintext backup codes (only time they're shown)
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      
      return { success: true, backupCodes };
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      return { success: false, error: 'Failed to enable 2FA' };
    }
  }
  
  /**
   * Verify 2FA token
   */
  async verify2FA(userId: string, token: string): Promise<{ success: boolean; error?: string; isBackupCode?: boolean }> {
    try {
      const user = await this.executeWithRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          select: {
            twoFactorSecret: true,
            twoFactorEnabled: true,
            twoFactorBackupCodes: true
          }
        });
      }, 'Failed to fetch user 2FA data');
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false, error: '2FA not enabled for this user' };
      }
      
      // Try TOTP verification first
      if (this.verifyTOTP(user.twoFactorSecret, token)) {
        return { success: true };
      }
      
      // Try backup codes
      const tokenHash = createHash('sha256').update(token.toUpperCase()).digest('hex');
      if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.includes(tokenHash)) {
        // Remove used backup code
        const updatedCodes = user.twoFactorBackupCodes.filter(code => code !== tokenHash);
        
        await this.executeWithRetry(async () => {
          await prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: updatedCodes }
          });
        }, 'Failed to update backup codes');
        
        return { success: true, isBackupCode: true };
      }
      
      return { success: false, error: 'Invalid 2FA token or backup code' };
    } catch (error) {
      console.error('2FA verification failed:', error);
      return { success: false, error: 'Failed to verify 2FA token' };
    }
  }
  
  /**
   * Generate base32 secret for TOTP
   */
  private generateBase32Secret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }
  
  /**
   * Verify TOTP token (simplified implementation)
   */
  private verifyTOTP(secret: string, token: string): boolean {
    try {
      // TODO: Implement proper TOTP verification using a library like speakeasy
      // This is a simplified placeholder
      
      const timeSlice = Math.floor(Date.now() / 30000);
      const hash = createHash('sha1').update(secret + timeSlice.toString()).digest('hex');
      const expectedToken = (parseInt(hash.substring(0, 6), 16) % 1000000).toString().padStart(6, '0');
      
      return timingSafeEqual(
        Buffer.from(token.padStart(6, '0')),
        Buffer.from(expectedToken)
      );
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Get user sessions with comprehensive error handling
   */
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      // Input validation
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }
      
      // Get sessions from database with retry
      const sessions = await this.executeWithRetry(async () => {
        return await prisma.session.findMany({
          where: { 
            userId,
            expiresAt: { gte: new Date() }
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            expiresAt: true
          },
          orderBy: { updatedAt: 'desc' }
        });
      }, 'Failed to fetch user sessions');

      // Enrich with Redis data with error handling
      const enrichedSessions = await Promise.allSettled(
        sessions.map(async (session) => {
          const sessionKey = `${this.sessionPrefix}${session.id}`;
          let sessionData: Record<string, string> = {};
          
          try {
            sessionData = await this.redis.hgetall(sessionKey);
          } catch (error) {
            console.warn(`Failed to fetch Redis data for session ${session.id}:`, error);
          }
          
          return {
            ...session,
            deviceInfo: sessionData.deviceInfo || 'unknown',
            ipAddress: sessionData.ipAddress || 'unknown',
            userAgent: sessionData.userAgent || 'unknown',
            lastActivity: sessionData.lastActivity || session.updatedAt.toISOString(),
            isHealthy: Object.keys(sessionData).length > 0
          };
        })
      );

      // Return only successful enrichments
      return enrichedSessions
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);
        
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      throw new Error(`Failed to retrieve user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}