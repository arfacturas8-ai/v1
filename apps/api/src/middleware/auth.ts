import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma, executeWithDatabaseRetry, User, ServerMember, CommunityMember } from '@cryb/database';
import { throwUnauthorized, throwForbidden, AppError } from './errorHandler';
import { AuthenticatedRequest, ServerContextRequest, CommunityContextRequest } from '../types/fastify';
import { EnhancedAuthService } from '../services/enhanced-auth';
import { verifyToken, isTokenExpired } from '@cryb/auth';
import Redis from 'ioredis';
import { createHash } from 'crypto';

// Create a dedicated Redis client for auth middleware to avoid subscriber mode issues
const authRedisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6380/0');

/**
 * Enhanced authentication middleware with comprehensive security
 */
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const startTime = Date.now();
  
  // TEMPORARY DEBUG: Log JWT secret being used
  if (process.env.NODE_ENV === 'development') {
    request.log.debug({ 
      jwtSecretLength: process.env.JWT_SECRET?.length,
      jwtSecretFirst10: process.env.JWT_SECRET?.substring(0, 10) + '...'
    }, 'JWT Secret info for debugging');
  }
  
  try {
    // Extract authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      // In development mode, allow uploads without auth for testing
      if (process.env.NODE_ENV === 'development' && request.url.includes('/uploads')) {
        (request as any).user = {
          id: 'dev-user-' + Math.random().toString(36).substring(7),
          username: 'DevUser',
          email: 'dev@test.com',
          displayName: 'Development User'
        };
        (request as any).userId = (request as any).user.id;
        return;
      }
      throw new AppError('Authorization header missing', 401, 'AUTH_HEADER_MISSING');
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Invalid authorization header format', 401, 'INVALID_AUTH_FORMAT');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token || token.length === 0) {
      throw new AppError('Authentication token is empty', 401, 'TOKEN_EMPTY');
    }
    
    // Basic token format validation
    if (!/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
      throw new AppError('Invalid token format', 401, 'INVALID_TOKEN_FORMAT');
    }

    // Quick expiration check without verification
    if (isTokenExpired(token)) {
      throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
    }

    // Get Redis instance with fallback
    let redis: Redis | undefined;
    try {
      redis = (request as any).server?.redis;
    } catch (error) {
      request.log.warn('Redis instance not available for auth middleware');
    }

    // Use EnhancedAuthService for comprehensive token validation
    try {
      const authService = new EnhancedAuthService(authRedisClient);
      const validation = await authService.validateAccessToken(token);

      if (!validation.valid) {
        throw new AppError(
          validation.reason || 'Token validation failed',
          401,
          'TOKEN_VALIDATION_FAILED'
        );
      }

      // Load user data with error handling
      const user = await loadUserSecurely(validation.payload.userId, request);
      
      // Attach user to request
      attachUserToRequest(request, user);
      
      // Track successful authentication
      const duration = Date.now() - startTime;
      request.log.debug({ userId: user.id, duration }, 'Authentication successful');
      
      return;
    } catch (authError) {
      // If enhanced auth fails, log the error but don't fall back if it's a security issue
      if (authError instanceof AppError && (
        authError.message.includes('revoked') || 
        authError.message.includes('blacklisted') ||
        authError.code === 'TOKEN_VALIDATION_FAILED'
      )) {
        throw authError; // Don't fallback for security-related failures
      }
      
      // Fall back to basic JWT verification only for non-security failures
      request.log.warn({ error: String(authError) }, 'Enhanced auth failed, falling back to basic JWT');
    }

    // Fallback: Basic JWT token verification
    let payload;
    try {
      payload = verifyToken(token);
    } catch (tokenError) {
      if (tokenError instanceof Error) {
        if (tokenError.message.includes('expired')) {
          throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
        } else if (tokenError.message.includes('signature')) {
          throw new AppError('Invalid token signature', 401, 'INVALID_TOKEN_SIGNATURE');
        } else if (tokenError.message.includes('malformed')) {
          throw new AppError('Malformed token', 401, 'MALFORMED_TOKEN');
        }
      }
      throw new AppError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }

    // Validate token payload
    if (!payload.userId || !payload.sessionId) {
      throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN_PAYLOAD');
    }

    // Check token blacklist in fallback mode too
    try {
      const isBlacklisted = await authRedisClient.exists(`blacklist:token:${createHash('sha256').update(token).digest('hex')}`);
      if (isBlacklisted) {
        throw new AppError('Token has been revoked', 401, 'TOKEN_REVOKED');
      }
    } catch (blacklistError) {
      request.log.warn({ error: String(blacklistError) }, 'Failed to check token blacklist in fallback mode');
    }

    // Load user data
    const user = await loadUserSecurely(payload.userId, request);
    
    // Verify session exists in database as fallback
    const session = await executeWithDatabaseRetry(async () => {
      return await prisma.session.findFirst({
        where: {
          userId: payload.userId,
          expiresAt: { gte: new Date() }
        }
      });
    });
    
    if (!session) {
      throw new AppError('Session not found or expired', 401, 'SESSION_NOT_FOUND');
    }
    
    // Attach user to request
    attachUserToRequest(request, user);
    
    const duration = Date.now() - startTime;
    request.log.debug({ userId: user.id, duration }, 'Fallback authentication successful');

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof AppError) {
      request.log.warn({ error: error.message, duration }, 'Authentication failed');
      throw error;
    }
    
    request.log.error({ error, duration }, 'Authentication error');
    throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
  }
};

/**
 * Securely load user data with caching and error handling
 */
async function loadUserSecurely(userId: string, request: FastifyRequest): Promise<User> {
  try {
    const user = await executeWithDatabaseRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          servers: {
            select: {
              id: true,
              serverId: true,
              userId: true,
              joinedAt: true
            }
          }
        }
      });
    });

    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }
    
    // Check if user is banned or suspended
    if (user.bannedAt && user.bannedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      throw new AppError('User account is banned', 403, 'USER_BANNED');
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    request.log.error({ error, userId }, 'Failed to load user data');
    throw new AppError('Failed to load user data', 500, 'USER_LOAD_FAILED');
  }
}

/**
 * Attach user data to request object
 */
function attachUserToRequest(request: FastifyRequest, user: User): void {
  request.user = user;
  request.userId = user.id;
  
  // Update request context if it exists
  if (request.context) {
    request.context.userId = user.id;
    request.context.username = user.username;
  }
}

/**
 * Optional authentication middleware - loads user if token is present, continues if not
 */
export const optionalAuthMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // No authentication provided, continue without user
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token || token.length === 0) {
      return;
    }
    
    // Basic token format validation
    if (!/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)) {
      return; // Invalid format, continue without user
    }

    // Quick expiration check
    if (isTokenExpired(token)) {
      return; // Expired token, continue without user
    }

    // Redis client is handled by the dedicated authRedisClient

    // Try enhanced authentication first
    try {
      const authService = new EnhancedAuthService(authRedisClient);
      const validation = await authService.validateAccessToken(token);

      if (validation.valid && validation.payload) {
        const user = await loadUserSecurely(validation.payload.userId, request);
        attachUserToRequest(request, user);
        return;
      }
    } catch (error) {
      request.log.debug('Optional enhanced auth failed, trying fallback');
    }

    // Fallback to basic JWT verification
    try {
      const payload = verifyToken(token);
      
      if (!payload.userId) {
        return;
      }
      
      const user = await loadUserSecurely(payload.userId, request);
      attachUserToRequest(request, user);
      
    } catch (error) {
      request.log.debug('Optional authentication failed, continuing without user');
      // Continue without authentication on optional middleware
    }
  } catch (error) {
    request.log.debug({ error }, 'Optional authentication error, continuing without user');
    // Continue without authentication on optional middleware
  }
};

/**
 * Server context middleware - verifies user is a member of the server
 */
export const serverContextMiddleware = (options: { 
  requireOwner?: boolean;
  requireModerator?: boolean;
  paramName?: string;
} = {}) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { requireOwner = false, requireModerator = false, paramName = 'serverId' } = options;
    
    if (!request.user) {
      throwUnauthorized('Authentication required');
    }

    const serverId = (request.params as any)[paramName];
    if (!serverId) {
      throw new Error(`Server ID parameter '${paramName}' not found in route`);
    }

    // Check if user is a member of the server
    const serverMember = await prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId: request.userId!
        }
      },
      include: {
        server: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!serverMember) {
      throwForbidden('Access denied to this server');
    }

    // Now we know serverMember is not null
    const member = serverMember as NonNullable<typeof serverMember>;

    // Check ownership requirement
    if (requireOwner && member.server.ownerId !== request.userId) {
      throwForbidden('Server owner privileges required');
    }

    // Check moderator requirement
    if (requireModerator) {
      const isModerator = member.roles.some(memberRole => 
        memberRole.role.permissions & BigInt(0x8) // MANAGE_CHANNELS permission
      );
      
      if (!isModerator && member.server.ownerId !== request.userId) {
        throwForbidden('Moderator privileges required');
      }
    }

    request.serverMember = member;
    (request as any).serverId = serverId;
  };
};

/**
 * Community context middleware - verifies user is a member of the community
 */
export const communityContextMiddleware = (options: {
  requireModerator?: boolean;
  paramName?: string;
} = {}) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { requireModerator = false, paramName = 'communityId' } = options;
    
    if (!request.user) {
      throwUnauthorized('Authentication required');
    }

    const communityId = (request.params as any)[paramName];
    if (!communityId) {
      throw new Error(`Community ID parameter '${paramName}' not found in route`);
    }

    // Check if user is a member of the community
    const communityMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: request.userId!
        }
      },
      include: {
        community: true
      }
    });

    if (!communityMember) {
      throwForbidden('Access denied to this community');
    }

    // Now we know communityMember is not null
    const member = communityMember as NonNullable<typeof communityMember>;

    // Check moderator requirement
    if (requireModerator) {
      const isModerator = await prisma.moderator.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: request.userId!
          }
        }
      });

      if (!isModerator) {
        throwForbidden('Moderator privileges required');
      }
    }

    request.communityMember = member;
    (request as any).communityId = communityId;
  };
};

/**
 * Resource ownership middleware - verifies user owns a specific resource
 */
export const resourceOwnershipMiddleware = (resourceType: 'post' | 'comment' | 'message', paramName?: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throwUnauthorized('Authentication required');
    }

    const resourceId = (request.params as any)[paramName || `${resourceType}Id`];
    if (!resourceId) {
      throw new Error(`${resourceType} ID parameter not found in route`);
    }

    let resource;
    switch (resourceType) {
      case 'post':
        resource = await prisma.post.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        break;
      case 'comment':
        resource = await prisma.comment.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        break;
      case 'message':
        resource = await prisma.message.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        break;
    }

    if (!resource) {
      throw new Error(`${resourceType} not found`);
    }

    if (resource.userId !== request.userId) {
      throwForbidden(`You can only modify your own ${resourceType}s`);
    }
  };
};

/**
 * Admin middleware - verifies user has admin privileges
 */
export const adminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    throwUnauthorized('Authentication required');
  }

  // Check if user is verified (basic admin check)
  if (!(request.user as any).isVerified) {
    throwForbidden('Administrator privileges required');
  }

  // Additional admin checks can be added here
  // For example, checking for admin role in a separate admin table
};

/**
 * Enhanced rate limiting middleware for authenticated users with Redis backing
 */
export const userRateLimitMiddleware = (options: {
  maxRequests: number;
  windowMs: number;
  skipSuccessful?: boolean;
  keyGenerator?: (request: FastifyRequest) => string;
}) => {
  const userLimits = new Map<string, { count: number; resetTime: number; violations: number }>();
  const violationThreshold = 3; // Ban after 3 rate limit violations
  const banDuration = 10 * 60 * 1000; // 10 minutes ban

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Generate rate limit key
      const rateLimitKey = options.keyGenerator ? 
        options.keyGenerator(request) : 
        request.userId || request.ip;
      
      const now = Date.now();
      const resetTime = now + options.windowMs;
      const redis = (request as any).server?.redis;

      let userLimit: { count: number; resetTime: number; violations: number };
      
      // Try Redis-backed rate limiting first
      if (redis) {
        try {
          const redisKey = `rate_limit:${rateLimitKey}`;
          const violationsKey = `rate_violations:${rateLimitKey}`;
          
          const [currentCount, violations] = await Promise.all([
            redis.get(redisKey),
            redis.get(violationsKey)
          ]);
          
          const count = parseInt(currentCount || '0');
          const violationCount = parseInt(violations || '0');
          
          // Check if user is temporarily banned due to violations
          if (violationCount >= violationThreshold) {
            const banKey = `rate_ban:${rateLimitKey}`;
            const banExpiry = await redis.get(banKey);
            
            if (banExpiry && parseInt(banExpiry) > now) {
              reply.code(429).send({
                success: false,
                error: 'Temporarily banned due to repeated rate limit violations',
                code: 'RATE_LIMIT_BAN',
                details: {
                  bannedUntil: new Date(parseInt(banExpiry)).toISOString(),
                  reason: 'Repeated rate limit violations'
                }
              });
              return;
            }
          }
          
          if (count >= options.maxRequests) {
            // Increment violations
            await redis.multi()
              .incr(violationsKey)
              .expire(violationsKey, Math.ceil(options.windowMs / 1000))
              .exec();
            
            // Set temporary ban if violations exceed threshold
            if (violationCount + 1 >= violationThreshold) {
              await redis.setex(`rate_ban:${rateLimitKey}`, Math.ceil(banDuration / 1000), (now + banDuration).toString());
            }
            
            const ttl = await redis.ttl(redisKey);
            
            reply.header('X-RateLimit-Limit', options.maxRequests);
            reply.header('X-RateLimit-Remaining', 0);
            reply.header('X-RateLimit-Reset', Math.ceil((now + (ttl * 1000)) / 1000));
            reply.header('X-RateLimit-Violations', violationCount + 1);
            
            reply.code(429).send({
              success: false,
              error: 'Too many requests',
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: options.maxRequests,
                windowMs: options.windowMs,
                retryAfter: ttl,
                violations: violationCount + 1
              }
            });
            return;
          }
          
          // Increment counter
          await redis.multi()
            .incr(redisKey)
            .expire(redisKey, Math.ceil(options.windowMs / 1000))
            .exec();
          
          const remaining = Math.max(0, options.maxRequests - (count + 1));
          const ttl = await redis.ttl(redisKey);
          
          reply.header('X-RateLimit-Limit', options.maxRequests);
          reply.header('X-RateLimit-Remaining', remaining);
          reply.header('X-RateLimit-Reset', Math.ceil((now + (ttl * 1000)) / 1000));
          
          return;
        } catch (redisError) {
          request.log.warn('Redis rate limiting failed, falling back to memory:');
        }
      }
      
      // Fallback to in-memory rate limiting
      userLimit = userLimits.get(rateLimitKey) || { count: 0, resetTime, violations: 0 };

      if (now > userLimit.resetTime) {
        userLimit = { count: 0, resetTime, violations: userLimit.violations };
      }

      if (userLimit.count >= options.maxRequests) {
        userLimit.violations++;
        userLimits.set(rateLimitKey, userLimit);
        
        reply.header('X-RateLimit-Limit', options.maxRequests);
        reply.header('X-RateLimit-Remaining', 0);
        reply.header('X-RateLimit-Reset', Math.ceil(userLimit.resetTime / 1000));
        reply.header('X-RateLimit-Violations', userLimit.violations);
        
        reply.code(429).send({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: options.maxRequests,
            windowMs: options.windowMs,
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
            violations: userLimit.violations
          }
        });
        return;
      }

      userLimit.count++;
      userLimits.set(rateLimitKey, userLimit);

      reply.header('X-RateLimit-Limit', options.maxRequests);
      reply.header('X-RateLimit-Remaining', options.maxRequests - userLimit.count);
      reply.header('X-RateLimit-Reset', Math.ceil(userLimit.resetTime / 1000));
      
    } catch (error) {
      request.log.error('Rate limiting error:');
      // Continue request on rate limiting error to avoid blocking legitimate users
    }
  };
};