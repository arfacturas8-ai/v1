import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Redis } from 'ioredis';
import { prisma } from '@cryb/database';
import { AUTH_CONSTANTS } from '../models/auth-models';
import logger from '../utils/logger';

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  session_id: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for tracking
}

export interface RefreshTokenPayload {
  sub: string; // user ID
  session_id: string;
  version: number;
  iat: number;
  exp: number;
  jti: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  session_id: string;
}

export interface SessionInfo {
  user_id: string;
  device_fingerprint?: string;
  ip_address: string;
  user_agent: string;
  location?: any;
}

export class ComprehensiveJWTService {
  private redis: Redis;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor(redis: Redis) {
    this.redis = redis;
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY;
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY;

    if (this.accessTokenSecret === 'fallback-secret') {
      logger.warn('Using fallback JWT secret. This is not secure for production!');
    }
  }

  /**
   * Create a new token pair with refresh token rotation
   */
  async createTokenPair(
    userId: string,
    sessionInfo: SessionInfo,
    existingSessionId?: string
  ): Promise<TokenPair> {
    try {
      // Get user with roles and permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          user_roles: {
            include: {
              role: true
            },
            where: {
              OR: [
                { expires_at: null },
                { expires_at: { gt: new Date() } }
              ]
            }
          }
        }
      });

      if (!user || user.deleted_at) {
        throw new Error('User not found or deleted');
      }

      // Check if user is locked
      if (user.locked_until && user.locked_until > new Date()) {
        throw new Error('Account is locked');
      }

      // Extract roles and permissions
      const roles = user.user_roles.map(ur => ur.role.name);
      const permissions = user.user_roles.reduce((acc, ur) => {
        const rolePermissions = Array.isArray(ur.role.permissions) 
          ? ur.role.permissions 
          : JSON.parse(ur.role.permissions as string || '[]');
        return [...acc, ...rolePermissions];
      }, [] as string[]);

      // Generate unique identifiers
      const jti = crypto.randomUUID();
      const sessionId = existingSessionId || crypto.randomUUID();
      const refreshJti = crypto.randomUUID();

      // Create access token
      const accessTokenPayload: JWTPayload = {
        sub: userId,
        email: user.email,
        username: user.username,
        roles,
        permissions: [...new Set(permissions)], // Remove duplicates
        session_id: sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.accessTokenExpiry),
        jti
      };

      const accessToken = jwt.sign(accessTokenPayload, this.accessTokenSecret, {
        algorithm: 'HS256'
      });

      // Create refresh token with version
      let refreshTokenVersion = 1;
      if (existingSessionId) {
        const existingSession = await prisma.userSession.findUnique({
          where: { session_token: existingSessionId }
        });
        refreshTokenVersion = existingSession ? existingSession.refresh_token_version + 1 : 1;
      }

      const refreshTokenPayload: RefreshTokenPayload = {
        sub: userId,
        session_id: sessionId,
        version: refreshTokenVersion,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.refreshTokenExpiry),
        jti: refreshJti
      };

      const refreshToken = jwt.sign(refreshTokenPayload, this.refreshTokenSecret, {
        algorithm: 'HS256'
      });

      // Store session in database
      const expiresAt = new Date(Date.now() + this.parseExpiry(this.refreshTokenExpiry) * 1000);
      
      await prisma.userSession.upsert({
        where: { session_token: sessionId },
        create: {
          user_id: userId,
          session_token: sessionId,
          refresh_token: refreshToken,
          refresh_token_version: refreshTokenVersion,
          device_fingerprint: sessionInfo.device_fingerprint,
          ip_address: sessionInfo.ip_address,
          user_agent: sessionInfo.user_agent,
          location: sessionInfo.location,
          expires_at: expiresAt,
          is_active: true
        },
        update: {
          refresh_token: refreshToken,
          refresh_token_version: refreshTokenVersion,
          last_activity: new Date(),
          expires_at: expiresAt
        }
      });

      // Store access token in Redis for fast validation and blacklisting
      await this.redis.setex(
        `access_token:${jti}`,
        this.parseExpiry(this.accessTokenExpiry),
        JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          created_at: new Date().toISOString()
        })
      );

      // Store refresh token in Redis
      await this.redis.setex(
        `refresh_token:${refreshJti}`,
        this.parseExpiry(this.refreshTokenExpiry),
        JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          version: refreshTokenVersion,
          created_at: new Date().toISOString()
        })
      );

      // Update user's last login
      await prisma.user.update({
        where: { id: userId },
        data: { 
          last_login: new Date(),
          failed_login_attempts: 0 // Reset failed attempts on successful login
        }
      });

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'login',
        ip_address: sessionInfo.ip_address,
        user_agent: sessionInfo.user_agent,
        location: sessionInfo.location,
        metadata: {
          session_id: sessionId,
          access_token_jti: jti,
          refresh_token_jti: refreshJti
        }
      });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: this.parseExpiry(this.accessTokenExpiry),
        token_type: 'Bearer',
        session_id: sessionId
      };

    } catch (error) {
      logger.error('Error creating token pair:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string, sessionInfo: SessionInfo): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as RefreshTokenPayload;
      
      // Check if refresh token exists in Redis
      const redisData = await this.redis.get(`refresh_token:${decoded.jti}`);
      if (!redisData) {
        throw new Error('Refresh token not found or expired');
      }

      // Verify session exists and is active
      const session = await prisma.userSession.findFirst({
        where: {
          session_token: decoded.session_id,
          refresh_token: refreshToken,
          refresh_token_version: decoded.version,
          is_active: true,
          expires_at: { gt: new Date() }
        }
      });

      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Invalidate old refresh token
      await this.redis.del(`refresh_token:${decoded.jti}`);

      // Create new token pair with incremented version
      const newTokenPair = await this.createTokenPair(
        decoded.sub,
        sessionInfo,
        decoded.session_id
      );

      // Log security event
      await this.logSecurityEvent({
        user_id: decoded.sub,
        event_type: 'login',
        ip_address: sessionInfo.ip_address,
        user_agent: sessionInfo.user_agent,
        location: sessionInfo.location,
        metadata: {
          action: 'token_refresh',
          session_id: decoded.session_id,
          old_version: decoded.version
        }
      });

      return newTokenPair;

    } catch (error) {
      logger.error('Error refreshing tokens:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
      
      // Check if token is blacklisted in Redis
      const tokenData = await this.redis.get(`access_token:${decoded.jti}`);
      if (!tokenData) {
        throw new Error('Token not found or expired');
      }

      // Verify session is still active
      const session = await prisma.userSession.findFirst({
        where: {
          session_token: decoded.session_id,
          is_active: true,
          expires_at: { gt: new Date() }
        }
      });

      if (!session) {
        throw new Error('Session expired or inactive');
      }

      return decoded;

    } catch (error) {
      logger.error('Error verifying access token:', error);
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Blacklist access token (for logout)
   */
  async blacklistAccessToken(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, { ignoreExpiration: true }) as JWTPayload;
      
      // Add to blacklist in Redis
      await this.redis.setex(
        `blacklist:${decoded.jti}`,
        this.parseExpiry(this.accessTokenExpiry),
        'blacklisted'
      );

      // Remove from active tokens
      await this.redis.del(`access_token:${decoded.jti}`);

    } catch (error) {
      logger.error('Error blacklisting token:', error);
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all active sessions for user
      const sessions = await prisma.userSession.findMany({
        where: {
          user_id: userId,
          is_active: true
        }
      });

      // Deactivate all sessions
      await prisma.userSession.updateMany({
        where: {
          user_id: userId,
          is_active: true
        },
        data: {
          is_active: false
        }
      });

      // Remove tokens from Redis
      const pipeline = this.redis.pipeline();
      for (const session of sessions) {
        pipeline.del(`refresh_token:*`); // Would need to track JTI in session for precise deletion
      }
      await pipeline.exec();

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'logout',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          action: 'revoke_all_tokens',
          sessions_revoked: sessions.length
        }
      });

    } catch (error) {
      logger.error('Error revoking user tokens:', error);
      throw error;
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string, userId?: string): Promise<void> {
    try {
      const whereClause: any = { session_token: sessionId };
      if (userId) {
        whereClause.user_id = userId;
      }

      const session = await prisma.userSession.findFirst({
        where: whereClause
      });

      if (session) {
        await prisma.userSession.update({
          where: { id: session.id },
          data: { is_active: false }
        });

        // Log security event
        await this.logSecurityEvent({
          user_id: session.user_id,
          event_type: 'logout',
          ip_address: session.ip_address || '0.0.0.0',
          user_agent: session.user_agent || 'unknown',
          metadata: {
            action: 'session_revoked',
            session_id: sessionId
          }
        });
      }

    } catch (error) {
      logger.error('Error revoking session:', error);
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<any[]> {
    return prisma.userSession.findMany({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: { gt: new Date() }
      },
      orderBy: { last_activity: 'desc' },
      select: {
        id: true,
        session_token: true,
        device_fingerprint: true,
        ip_address: true,
        user_agent: true,
        location: true,
        last_activity: true,
        created_at: true
      }
    });
  }

  /**
   * Clean up expired tokens and sessions
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Clean up expired sessions from database
      await prisma.userSession.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      // Note: Redis keys will expire automatically
      logger.info('Expired tokens cleanup completed');

    } catch (error) {
      logger.error('Error cleaning up expired tokens:', error);
    }
  }

  /**
   * Parse expiry time string to seconds
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900; // 15 minutes default
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: {
    user_id?: string;
    event_type: string;
    ip_address: string;
    user_agent: string;
    location?: any;
    metadata?: any;
    risk_score?: number;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          user_id: event.user_id,
          event_type: event.event_type as any,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          location: event.location,
          metadata: event.metadata || {},
          risk_score: event.risk_score || 0
        }
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  /**
   * Generate secure session token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    return typeof token === 'string' && token.length > 0 && token.split('.').length === 3;
  }
}