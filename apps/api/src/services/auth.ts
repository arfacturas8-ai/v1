import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { generateAccessToken, generateRefreshToken, verifyToken, hashPassword, verifyPassword } from '@cryb/auth';
import { randomUUID, createHash, timingSafeEqual } from 'crypto';
import Redis from 'ioredis';

// Import OAuth2 client for Google authentication
class OAuth2Client {
  constructor(public clientId: string, public clientSecret: string, public redirectUri: string) {}
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt?: Date;
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
}

export class AuthService {
  private redis: Redis;
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
    this.initializeOAuthClients(options.oauthProviders || []);
    this.setupHealthChecks();
  }
  
  /**
   * Initialize OAuth2 clients with error handling
   */
  private initializeOAuthClients(providers: OAuthProvider[]): void {
    try {
      providers.forEach(provider => {
        switch (provider.name) {
          case 'google':
            this.oauth2Clients.set('google', new OAuth2Client(
              provider.clientId,
              provider.clientSecret,
              provider.redirectUri
            ));
            break;
          case 'discord':
          case 'github':
            this.oauth2Clients.set(provider.name, {
              clientId: provider.clientId,
              clientSecret: provider.clientSecret,
              redirectUri: provider.redirectUri
            });
            break;
        }
      });
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
      
      console.log('✅ Auth service dependencies healthy');
    } catch (error) {
      console.error('❌ Auth service dependency health check failed:', error);
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
        email: user.email || undefined,
        walletAddress: user.walletAddress || undefined,
        isVerified: user.isVerified,
        exp: Math.floor(accessTokenExpiry.getTime() / 1000),
        iat: Math.floor(Date.now() / 1000),
        jti: randomUUID() // JWT ID for tracking
      };
      
      const refreshPayload = {
        userId,
        sessionId,
        type: 'refresh',
        exp: Math.floor(refreshTokenExpiry.getTime() / 1000),
        iat: Math.floor(Date.now() / 1000),
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
        refreshExpiresAt: refreshTokenExpiry
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
        payload = verifyToken(refreshToken);
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

      // Generate new tokens with rotation
      const newTokens = await this.generateTokens(session.userId, {
        ...sessionInfo,
        deviceInfo: sessionInfo.deviceInfo || session.user?.username || 'unknown'
      });

      // Blacklist old refresh token (with fallback)
      try {
        await this.blacklistToken(refreshToken);
      } catch (error) {
        console.warn('Failed to blacklist old refresh token:', error);
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
   * Get user's active sessions with comprehensive error handling
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

  /**
   * Brute force protection
   */
  async checkBruteForce(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `${this.bruteForcePrefix}${identifier}`;
    const attempts = await this.redis.get(key);
    const attemptCount = parseInt(attempts || '0');

    // Allow up to 5 attempts per hour
    if (attemptCount >= 5) {
      const ttl = await this.redis.ttl(key);
      return { allowed: false, retryAfter: ttl };
    }

    return { allowed: true };
  }

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = `${this.bruteForcePrefix}${identifier}`;
    
    await this.redis.multi()
      .incr(key)
      .expire(key, 3600) // 1 hour
      .exec();
  }

  /**
   * Clear failed attempts (on successful login)
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    const key = `${this.bruteForcePrefix}${identifier}`;
    await this.redis.del(key);
  }

  /**
   * Clean up expired sessions (run periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    // Delete expired sessions from database
    await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    // Note: Redis keys with TTL will automatically expire
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
   * Get security statistics
   */
  async getSecurityStats(userId: string): Promise<any> {
    try {
      // Get active sessions with error handling
      let activeSessions: any[] = [];
      try {
        activeSessions = await this.getUserSessions(userId);
      } catch (error) {
        console.warn('Failed to get active sessions for security stats:', error);
      }

      // Get total sessions with retry
      let totalSessions = 0;
      try {
        totalSessions = await this.executeWithRetry(async () => {
          return await prisma.session.count({ where: { userId } });
        }, 'Failed to count total sessions');
      } catch (error) {
        console.warn('Failed to get total session count:', error);
      }

      // Get user data with retry
      let user: any = null;
      try {
        user = await this.executeWithRetry(async () => {
          return await prisma.user.findUnique({
            where: { id: userId },
            select: {
              createdAt: true,
              updatedAt: true,
              isVerified: true,
              email: true,
              walletAddress: true
            }
          });
        }, 'Failed to fetch user for security stats');
      } catch (error) {
        console.warn('Failed to get user data for security stats:', error);
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
        activeSessionCount: activeSessions.length,
        totalSessionsCreated: totalSessions,
        accountAge: user ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        lastActivity: user?.updatedAt || null,
        isVerified: user?.isVerified || false,
        recentSessions: activeSessions.slice(0, 10),
        recentFailedAttempts: recentAttempts,
        hasEmail: !!user?.email,
        hasWallet: !!user?.walletAddress,
        securityScore: this.calculateSecurityScore({
          isVerified: user?.isVerified || false,
          hasEmail: !!user?.email,
          hasWallet: !!user?.walletAddress,
          recentFailedAttempts: recentAttempts
        })
      };
    } catch (error) {
      console.error('Failed to get security stats:', error);
      // Return minimal stats on error
      return {
        activeSessionCount: 0,
        totalSessionsCreated: 0,
        accountAge: 0,
        lastActivity: null,
        isVerified: false,
        recentSessions: [],
        recentFailedAttempts: 0,
        hasEmail: false,
        hasWallet: false,
        securityScore: 0,
        error: 'Failed to retrieve security statistics'
      };
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
}