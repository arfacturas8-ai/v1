import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma, User, ServerMember, CommunityMember } from '@cryb/database';
import { AppError } from './errorHandler';
import { AuthenticatedRequest, ServerContextRequest, CommunityContextRequest } from '../types/fastify';
import { EnhancedAuthService } from '../services/enhanced-auth';
import { createHash } from 'crypto';
import Redis from 'ioredis';

// Create a dedicated Redis client for enhanced auth middleware to avoid subscriber mode issues
const enhancedAuthRedisClient = new Redis(process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0');

/**
 * Enhanced error handling for authentication middleware
 */
function throwUnauthorized(message: string, code?: string): never {
  const error = new AppError(message, 401, code || 'UNAUTHORIZED');
  throw error;
}

function throwForbidden(message: string, code?: string): never {
  const error = new AppError(message, 403, code || 'FORBIDDEN');
  throw error;
}

/**
 * Load user data with retry mechanism
 */
async function loadUserWithRetry(userId: string, maxRetries: number = 3): Promise<any> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isVerified: true,
          walletAddress: true,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
          isBanned: true,
          isAdmin: true
        }
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  
  throw new Error(`Failed to load user after ${maxRetries} attempts: ${lastError!.message}`);
}

/**
 * Utility function for database operations with retry
 */
async function executeWithRetry<T>(
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
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  
  throw new Error(`${errorMessage}: ${lastError!.message}`);
}

/**
 * Enhanced authentication middleware with comprehensive error handling
 * - Gracefully handles expired tokens without crashes
 * - Implements fallback mechanisms for Redis/DB failures
 * - Rate limits token validation attempts
 * - Provides detailed error reasons for debugging
 */
export const enhancedAuthMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const startTime = Date.now();
  let authService: EnhancedAuthService | undefined;
  
  try {
    const authHeader = request.headers.authorization;
    
    // Validate auth header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.log.debug('Missing or invalid authorization header');
      return throwUnauthorized('Authentication token required', 'MISSING_AUTH_HEADER');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token || token.length < 10) {
      request.log.debug('Empty or too short authentication token');
      return throwUnauthorized('Valid authentication token required', 'INVALID_TOKEN_FORMAT');
    }

    // Initialize enhanced auth service with error handling
    try {
      authService = new EnhancedAuthService(enhancedAuthRedisClient);
    } catch (serviceError) {
      request.log.error({ error: serviceError }, 'Failed to initialize auth service');
      return throwUnauthorized('Authentication service unavailable', 'AUTH_SERVICE_ERROR');
    }

    // Validate token with comprehensive error handling
    let validation: { valid: boolean; payload?: any; reason?: string };
    try {
      validation = await authService.validateAccessToken(token);
    } catch (validationError) {
      request.log.error({ error: validationError, token: token.substring(0, 8) + '...' }, 'Token validation failed');
      
      // Don't expose internal errors to client
      if (validationError instanceof Error) {
        if (validationError.message.includes('Redis')) {
          return throwUnauthorized('Authentication service temporarily unavailable', 'SERVICE_UNAVAILABLE');
        } else if (validationError.message.includes('database')) {
          return throwUnauthorized('Authentication service temporarily unavailable', 'DATABASE_ERROR');
        }
      }
      
      return throwUnauthorized('Token validation failed', 'VALIDATION_ERROR');
    }

    // Handle invalid tokens gracefully
    if (!validation.valid) {
      const reason = validation.reason || 'Invalid token';
      request.log.debug({ reason, token: token.substring(0, 8) + '...' }, 'Token validation failed');
      
      // Map internal reasons to client-friendly messages
      const errorMappings: Record<string, { message: string; code: string }> = {
        'Token has expired': { message: 'Authentication token has expired', code: 'TOKEN_EXPIRED' },
        'Token has been revoked': { message: 'Authentication token has been revoked', code: 'TOKEN_REVOKED' },
        'Session not found or expired': { message: 'Session has expired', code: 'SESSION_EXPIRED' },
        'Invalid token signature': { message: 'Invalid authentication token', code: 'INVALID_SIGNATURE' },
        'Token validation rate limit exceeded': { message: 'Too many authentication attempts', code: 'RATE_LIMITED' }
      };
      
      const errorInfo = errorMappings[reason] || { message: 'Invalid authentication token', code: 'INVALID_TOKEN' };
      return throwUnauthorized(errorInfo.message, errorInfo.code);
    }

    // Extract user ID from payload
    const userId = validation.payload?.userId;
    if (!userId) {
      request.log.warn({ payload: validation.payload }, 'Token payload missing userId');
      return throwUnauthorized('Invalid token payload', 'INVALID_PAYLOAD');
    }

    // Load user data with retry and error handling
    let user: any;
    try {
      user = await loadUserWithRetry(userId, 3);
    } catch (userError) {
      request.log.error({ error: userError, userId }, 'Failed to load user data');
      return throwUnauthorized('User data unavailable', 'USER_LOAD_ERROR');
    }

    if (!user) {
      request.log.warn({ userId }, 'User not found in database');
      return throwUnauthorized('User account not found', 'USER_NOT_FOUND');
    }

    // Check if user account is active
    if (user.isDeleted || user.isBanned) {
      request.log.info({ userId, isDeleted: user.isDeleted, isBanned: user.isBanned }, 'Inactive user attempted access');
      return throwUnauthorized('User account is not active', 'ACCOUNT_INACTIVE');
    }

    // Attach user to request with minimal data
    request.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      isVerified: user.isVerified,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isAdmin: user.isAdmin
    };
    request.userId = user.id;

    // Update request context
    if (request.context) {
      request.context.userId = user.id;
    }

    // Log successful authentication (debug level)
    const duration = Date.now() - startTime;
    request.log.debug({ userId, duration }, 'Authentication successful');

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle known error types
    if (error instanceof Error && error.name === 'AppError') {
      request.log.info({ error: error.message, duration }, 'Authentication failed with known error');
      throw error;
    }
    
    // Log unexpected errors
    request.log.error({ error, duration }, 'Unexpected authentication error');
    
    // Don't expose internal error details
    return throwUnauthorized('Authentication failed', 'AUTH_ERROR');
  }
};

/**
 * Enhanced optional authentication middleware with graceful error handling
 * - Never throws errors or blocks requests
 * - Provides detailed logging for debugging
 * - Handles all failure scenarios gracefully
 */
export const enhancedOptionalAuthMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const startTime = Date.now();
  
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.log.debug('No authorization header provided for optional auth');
      return; // No authentication provided, continue without user
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token || token.length < 10) {
      request.log.debug('Invalid token format for optional auth');
      return; // Invalid token, continue without user
    }

    // Initialize enhanced auth service with error handling
    let authService: EnhancedAuthService;
    try {
      authService = new EnhancedAuthService(enhancedAuthRedisClient);
    } catch (serviceError) {
      request.log.warn({ error: serviceError }, 'Failed to initialize auth service for optional auth');
      return; // Continue without authentication
    }

    // Validate token with error handling
    let validation: { valid: boolean; payload?: any; reason?: string };
    try {
      validation = await authService.validateAccessToken(token);
    } catch (validationError) {
      request.log.warn({ error: validationError, token: token.substring(0, 8) + '...' }, 'Token validation failed for optional auth');
      return; // Continue without authentication
    }

    if (!validation.valid || !validation.payload?.userId) {
      request.log.debug({ reason: validation.reason }, 'Invalid token for optional auth');
      return; // Continue without authentication
    }

    // Load user data with error handling
    let user: any;
    try {
      user = await loadUserWithRetry(validation.payload.userId, 2); // Fewer retries for optional auth
    } catch (userError) {
      request.log.warn({ error: userError, userId: validation.payload.userId }, 'Failed to load user for optional auth');
      return; // Continue without authentication
    }

    if (!user || user.isDeleted || user.isBanned) {
      request.log.debug({ userId: validation.payload.userId }, 'User not found or inactive for optional auth');
      return; // Continue without authentication
    }

    // Attach user to request
    request.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      isVerified: user.isVerified,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isAdmin: user.isAdmin
    };
    request.userId = user.id;
    
    if (request.context) {
      request.context.userId = user.id;
    }
    
    // Log successful optional authentication
    const duration = Date.now() - startTime;
    request.log.debug({ userId: user.id, duration }, 'Optional authentication successful');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    request.log.warn({ error, duration }, 'Unexpected error in optional authentication - continuing without auth');
    // Always continue without authentication on optional middleware
  }
};

/**
 * Enhanced rate limiting middleware for authenticated users with Redis fallback
 */
export const enhancedUserRateLimitMiddleware = (options: {
  maxRequests: number;
  windowMs: number;
  skipSuccessful?: boolean;
  keyPrefix?: string;
}) => {
  // In-memory fallback cache
  const memoryLimits = new Map<string, { count: number; resetTime: number }>();
  const keyPrefix = options.keyPrefix || 'user_rate_limit';

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return; // Skip if not authenticated
    }

    const userId = request.userId!;
    const now = Date.now();
    const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
    const resetTime = windowStart + options.windowMs;
    const redisKey = `${keyPrefix}:${userId}:${windowStart}`;

    try {
      // Try Redis first
      const redis = (request as any).server.redis;
      let currentCount = 0;
      
      if (redis) {
        try {
          const result = await redis.multi()
            .incr(redisKey)
            .expire(redisKey, Math.ceil(options.windowMs / 1000))
            .exec();
          
          if (result && result[0] && Array.isArray(result[0]) && result[0][1]) {
            currentCount = result[0][1] as number;
          }
        } catch (redisError) {
          request.log.warn({ error: redisError }, 'Redis rate limiting failed, using memory fallback');
          
          // Fallback to memory
          const userLimit = memoryLimits.get(userId);
          if (!userLimit || now > userLimit.resetTime) {
            currentCount = 1;
            memoryLimits.set(userId, { count: 1, resetTime });
          } else {
            currentCount = userLimit.count + 1;
            userLimit.count = currentCount;
            memoryLimits.set(userId, userLimit);
          }
        }
      } else {
        // No Redis available, use memory fallback
        const userLimit = memoryLimits.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
          currentCount = 1;
          memoryLimits.set(userId, { count: 1, resetTime });
        } else {
          currentCount = userLimit.count + 1;
          userLimit.count = currentCount;
          memoryLimits.set(userId, userLimit);
        }
      }

      // Set rate limit headers
      const remaining = Math.max(0, options.maxRequests - currentCount);
      reply.header('X-RateLimit-Limit', options.maxRequests.toString());
      reply.header('X-RateLimit-Remaining', remaining.toString());
      reply.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      reply.header('X-RateLimit-Window', options.windowMs.toString());

      if (currentCount > options.maxRequests) {
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        reply.header('Retry-After', retryAfter.toString());
        
        request.log.info({ userId, currentCount, limit: options.maxRequests }, 'User rate limit exceeded');
        
        return reply.code(429).send({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: options.maxRequests,
            windowMs: options.windowMs,
            retryAfter,
            currentCount
          }
        });
      }

      // Clean up old memory entries periodically
      if (Math.random() < 0.01) { // 1% chance to clean up
        cleanupMemoryLimits(memoryLimits, now);
      }

    } catch (error) {
      request.log.error({ error }, 'Rate limiting middleware error');
      // Continue on error to avoid blocking requests
    }
  };
};

/**
 * Clean up expired entries from memory cache
 */
function cleanupMemoryLimits(memoryLimits: Map<string, { count: number; resetTime: number }>, now: number): void {
  const keysToDelete: string[] = [];
  
  for (const [key, value] of memoryLimits.entries()) {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => memoryLimits.delete(key));
}

/**
 * Enhanced admin middleware with comprehensive privilege checking
 */
export const enhancedAdminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!request.user) {
      request.log.warn('Admin middleware accessed without authentication');
      return throwUnauthorized('Authentication required', 'ADMIN_AUTH_REQUIRED');
    }

    const userId = request.userId;
    if (!userId) {
      request.log.warn('Admin middleware accessed without userId');
      return throwUnauthorized('User identification required', 'ADMIN_USER_ID_REQUIRED');
    }

    // Check if user is verified (basic admin check)
    if (!request.user.isVerified) {
      request.log.info({ userId }, 'Unverified user attempted admin access');
      return throwForbidden('Email verification required for admin access', 'ADMIN_VERIFICATION_REQUIRED');
    }

    // Check for explicit admin role with database retry
    let isAdmin = false;
    try {
      const adminCheck = await loadUserWithRetry(userId);
      
      // Check multiple admin criteria
      isAdmin = adminCheck?.isAdmin || // Direct admin flag
                adminCheck?.email?.endsWith('@cryb.app') || // Staff email
                adminCheck?.username === 'admin'; // Admin username
                
      // Additional admin checks can be added here
      // For example, checking for admin role in a separate admin table
      if (!isAdmin) {
        try {
          const adminRole = await prisma.userRole.findFirst({
            where: {
              userId,
              role: {
                name: { in: ['admin', 'superadmin', 'moderator'] }
              }
            },
            include: {
              role: true
            }
          });
          
          isAdmin = !!adminRole;
        } catch (roleError) {
          request.log.warn({ error: roleError, userId }, 'Failed to check admin role');
          // Continue with existing admin status
        }
      }
      
    } catch (adminCheckError) {
      request.log.error({ error: adminCheckError, userId }, 'Failed to verify admin status');
      return throwForbidden('Unable to verify admin privileges', 'ADMIN_CHECK_FAILED');
    }

    if (!isAdmin) {
      request.log.warn({ userId, userEmail: request.user.email }, 'Non-admin user attempted admin access');
      return throwForbidden('Administrator privileges required', 'ADMIN_PRIVILEGES_REQUIRED');
    }

    request.log.info({ userId }, 'Admin access granted');
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AppError') {
      throw error;
    }
    
    request.log.error({ error }, 'Admin middleware error');
    return throwForbidden('Admin access verification failed', 'ADMIN_MIDDLEWARE_ERROR');
  }
};

/**
 * Enhanced server context middleware with comprehensive error handling
 */
export const enhancedServerContextMiddleware = (options: { 
  requireOwner?: boolean;
  requireModerator?: boolean;
  paramName?: string;
} = {}) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { requireOwner = false, requireModerator = false, paramName = 'serverId' } = options;
    
    try {
      if (!request.user) {
        request.log.warn('Server context middleware accessed without authentication');
        return throwUnauthorized('Authentication required', 'SERVER_AUTH_REQUIRED');
      }

      const serverId = (request.params as any)[paramName];
      if (!serverId) {
        request.log.error({ paramName, params: request.params }, 'Server ID parameter not found in route');
        throw new Error(`Server ID parameter '${paramName}' not found in route`);
      }

      // Validate server ID format
      if (typeof serverId !== 'string' || serverId.length < 1) {
        request.log.warn({ serverId }, 'Invalid server ID format');
        return throwForbidden('Invalid server identifier', 'INVALID_SERVER_ID');
      }

      const userId = request.userId!;

      // Check if user is a member of the server with retry
      let serverMember: any;
      try {
        serverMember = await executeWithRetry(async () => {
          return await prisma.serverMember.findUnique({
            where: {
              serverId_userId: {
                serverId,
                userId
              }
            },
            include: {
              server: {
                select: {
                  id: true,
                  name: true,
                  ownerId: true,
                  isPublic: true
                }
              },
              roles: {
                include: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                      permissions: true
                    }
                  }
                }
              }
            }
          });
        }, 'Failed to fetch server membership');
      } catch (membershipError) {
        request.log.error({ error: membershipError, serverId, userId }, 'Failed to check server membership');
        return throwForbidden('Unable to verify server access', 'MEMBERSHIP_CHECK_FAILED');
      }

      if (!serverMember) {
        request.log.info({ serverId, userId }, 'User attempted access to server without membership');
        return throwForbidden('Access denied to this server', 'NOT_SERVER_MEMBER');
      }

      // Check if server exists
      if (!serverMember.server) {
        request.log.warn({ serverId }, 'Server not found');
        return throwForbidden('Server not found', 'SERVER_NOT_FOUND');
      }

      // Check ownership requirement
      if (requireOwner && serverMember.server.ownerId !== userId) {
        request.log.info({ serverId, userId, ownerId: serverMember.server.ownerId }, 'Non-owner attempted owner-only action');
        return throwForbidden('Server owner privileges required', 'OWNER_REQUIRED');
      }

      // Check moderator requirement
      if (requireModerator) {
        const isOwner = serverMember.server.ownerId === userId;
        const isModerator = serverMember.roles.some((memberRole: any) => 
          memberRole.role.permissions & BigInt(0x8) // MANAGE_CHANNELS permission
        );
        
        if (!isOwner && !isModerator) {
          request.log.info({ serverId, userId, roles: serverMember.roles.map((r: any) => r.role.name) }, 'User lacks moderator privileges');
          return throwForbidden('Moderator privileges required', 'MODERATOR_REQUIRED');
        }
      }

      // Attach server context to request
      request.serverMember = serverMember;
      (request as any).serverId = serverId;
      
      request.log.debug({ serverId, userId }, 'Server context validated successfully');
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      
      request.log.error({ error, serverId: (request.params as any)[paramName] }, 'Server context middleware error');
      return throwForbidden('Server access verification failed', 'SERVER_CONTEXT_ERROR');
    }
  };
};

// Export all enhanced middleware as defaults for easy replacement
export const authMiddleware = enhancedAuthMiddleware;
export const optionalAuthMiddleware = enhancedOptionalAuthMiddleware;
export const userRateLimitMiddleware = enhancedUserRateLimitMiddleware;
export const adminMiddleware = enhancedAdminMiddleware;
export const serverContextMiddleware = enhancedServerContextMiddleware;