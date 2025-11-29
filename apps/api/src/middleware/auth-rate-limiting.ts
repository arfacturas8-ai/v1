import { FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { AppError } from './errorHandler';

interface AuthRateLimitConfig {
  redis: Redis;
  // Rate limits per endpoint
  limits: {
    login: {
      maxAttempts: number;
      windowMs: number; // time window in milliseconds
      blockDurationMs: number; // how long to block after exceeding
    };
    register: {
      maxAttempts: number;
      windowMs: number;
      blockDurationMs: number;
    };
    forgotPassword: {
      maxAttempts: number;
      windowMs: number;
      blockDurationMs: number;
    };
    resetPassword: {
      maxAttempts: number;
      windowMs: number;
      blockDurationMs: number;
    };
    verifyEmail: {
      maxAttempts: number;
      windowMs: number;
      blockDurationMs: number;
    };
  };
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  blocked?: boolean;
}

/**
 * Critical Authentication Rate Limiting Service
 * 
 * Implements strict rate limiting specifically for authentication endpoints
 * to prevent brute force attacks and credential stuffing.
 */
export class AuthRateLimitService {
  private redis: Redis;
  private config: AuthRateLimitConfig;
  
  private readonly RATE_LIMIT_PREFIX = 'auth_rate_limit:';
  private readonly BLOCK_PREFIX = 'auth_block:';
  private readonly ATTEMPT_PREFIX = 'auth_attempts:';
  
  constructor(config: AuthRateLimitConfig) {
    this.redis = config.redis;
    this.config = config;
    console.log('🔒 Auth Rate Limiting Service initialized with strict limits');
  }
  
  /**
   * Check rate limit for authentication endpoints
   */
  async checkRateLimit(
    endpoint: 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'verifyEmail',
    identifier: string, // IP address or email/username
    request: FastifyRequest
  ): Promise<RateLimitResult> {
    const clientIP = this.getClientIP(request);
    
    // Use both IP and identifier for dual-layer protection
    const ipKey = `${this.RATE_LIMIT_PREFIX}${endpoint}:ip:${clientIP}`;
    const identifierKey = `${this.RATE_LIMIT_PREFIX}${endpoint}:id:${identifier}`;
    const blockKey = `${this.BLOCK_PREFIX}${endpoint}:${clientIP}:${identifier}`;
    
    const limitConfig = this.config.limits[endpoint];
    
    try {
      // Check if currently blocked
      const isBlocked = await this.redis.get(blockKey);
      if (isBlocked) {
        const ttl = await this.redis.ttl(blockKey);
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + (ttl * 1000),
          retryAfter: ttl,
          blocked: true
        };
      }
      
      // Check both IP and identifier limits
      const [ipResult, identifierResult] = await Promise.all([
        this.checkLimit(ipKey, limitConfig.maxAttempts, limitConfig.windowMs),
        this.checkLimit(identifierKey, limitConfig.maxAttempts, limitConfig.windowMs)
      ]);
      
      // If either limit is exceeded, deny the request
      if (!ipResult.allowed || !identifierResult.allowed) {
        // Set block if this is a repeated violation
        const violations = await this.redis.incr(`${this.ATTEMPT_PREFIX}${endpoint}:${clientIP}:${identifier}`);
        await this.redis.expire(`${this.ATTEMPT_PREFIX}${endpoint}:${clientIP}:${identifier}`, Math.floor(limitConfig.windowMs / 1000));
        
        if (violations >= 3) { // Block after 3 violations
          await this.redis.setex(blockKey, Math.floor(limitConfig.blockDurationMs / 1000), '1');
          
          // Log security event
          await this.logSecurityEvent('auth_rate_limit_exceeded', {
            endpoint,
            clientIP,
            identifier,
            violations,
            userAgent: request.headers['user-agent']
          });
        }
        
        return {
          allowed: false,
          remaining: Math.min(ipResult.remaining, identifierResult.remaining),
          resetTime: Math.max(ipResult.resetTime, identifierResult.resetTime),
          retryAfter: Math.floor(Math.max(ipResult.resetTime - Date.now(), identifierResult.resetTime - Date.now()) / 1000)
        };
      }
      
      return {
        allowed: true,
        remaining: Math.min(ipResult.remaining, identifierResult.remaining),
        resetTime: Math.max(ipResult.resetTime, identifierResult.resetTime)
      };
      
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail closed - deny request if rate limiting fails
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + limitConfig.windowMs,
        retryAfter: Math.floor(limitConfig.windowMs / 1000)
      };
    }
  }
  
  /**
   * Record successful authentication (resets rate limits)
   */
  async recordSuccess(
    endpoint: 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'verifyEmail',
    identifier: string,
    request: FastifyRequest
  ): Promise<void> {
    const clientIP = this.getClientIP(request);
    
    // Clear any blocks and reset violation counters
    const blockKey = `${this.BLOCK_PREFIX}${endpoint}:${clientIP}:${identifier}`;
    const attemptKey = `${this.ATTEMPT_PREFIX}${endpoint}:${clientIP}:${identifier}`;
    
    await Promise.all([
      this.redis.del(blockKey),
      this.redis.del(attemptKey)
    ]);
  }
  
  /**
   * Check individual limit (IP or identifier)
   */
  private async checkLimit(
    key: string,
    maxAttempts: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${key}:${windowStart}`;
    
    // Use atomic operation to increment and check
    const count = await this.redis.incr(windowKey);
    
    // Set expiry on first increment
    if (count === 1) {
      await this.redis.expire(windowKey, Math.floor(windowMs / 1000));
    }
    
    const remaining = Math.max(0, maxAttempts - count);
    const resetTime = windowStart + windowMs;
    
    return {
      allowed: count <= maxAttempts,
      remaining,
      resetTime
    };
  }
  
  /**
   * Get client IP with proxy support
   */
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    const cfConnectingIP = request.headers['cf-connecting-ip'] as string;
    
    if (cfConnectingIP) return cfConnectingIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;
    
    return request.ip || 'unknown';
  }
  
  /**
   * Log security events
   */
  private async logSecurityEvent(
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...data
    };
    
    console.warn(`🚨 AUTH SECURITY EVENT: ${event}`, logEntry);
    
    // Store in Redis for monitoring
    await this.redis.lpush('security:auth:events', JSON.stringify(logEntry));
    await this.redis.ltrim('security:auth:events', 0, 999); // Keep last 1000 events
    await this.redis.expire('security:auth:events', 86400 * 7); // 7 days
  }
  
  /**
   * Get rate limit status for monitoring
   */
  async getRateLimitStatus(
    endpoint: 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'verifyEmail',
    identifier: string,
    request: FastifyRequest
  ): Promise<{
    isBlocked: boolean;
    remaining: number;
    resetTime: number;
    violations: number;
  }> {
    const clientIP = this.getClientIP(request);
    const blockKey = `${this.BLOCK_PREFIX}${endpoint}:${clientIP}:${identifier}`;
    const attemptKey = `${this.ATTEMPT_PREFIX}${endpoint}:${clientIP}:${identifier}`;
    const ipKey = `${this.RATE_LIMIT_PREFIX}${endpoint}:ip:${clientIP}`;
    
    const [isBlocked, violations, rateLimitResult] = await Promise.all([
      this.redis.get(blockKey),
      this.redis.get(attemptKey),
      this.checkLimit(ipKey, this.config.limits[endpoint].maxAttempts, this.config.limits[endpoint].windowMs)
    ]);
    
    return {
      isBlocked: !!isBlocked,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
      violations: parseInt(violations || '0', 10)
    };
  }
}

/**
 * Create auth rate limiting service with production-ready defaults
 */
export function createAuthRateLimitService(redis: Redis): AuthRateLimitService {
  const config: AuthRateLimitConfig = {
    redis,
    limits: {
      login: {
        maxAttempts: 5,        // 5 attempts
        windowMs: 15 * 60 * 1000,  // per 15 minutes
        blockDurationMs: 30 * 60 * 1000  // block for 30 minutes
      },
      register: {
        maxAttempts: 3,        // 3 attempts
        windowMs: 60 * 60 * 1000,  // per hour
        blockDurationMs: 2 * 60 * 60 * 1000  // block for 2 hours
      },
      forgotPassword: {
        maxAttempts: 3,        // 3 attempts
        windowMs: 60 * 60 * 1000,  // per hour
        blockDurationMs: 60 * 60 * 1000  // block for 1 hour
      },
      resetPassword: {
        maxAttempts: 5,        // 5 attempts
        windowMs: 60 * 60 * 1000,  // per hour
        blockDurationMs: 2 * 60 * 60 * 1000  // block for 2 hours
      },
      verifyEmail: {
        maxAttempts: 10,       // 10 attempts
        windowMs: 60 * 60 * 1000,  // per hour
        blockDurationMs: 30 * 60 * 1000  // block for 30 minutes
      }
    }
  };
  
  return new AuthRateLimitService(config);
}

/**
 * Fastify middleware for auth rate limiting
 */
export function authRateLimitMiddleware(
  authRateLimit: AuthRateLimitService,
  endpoint: 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'verifyEmail'
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Extract identifier based on endpoint
    let identifier: string;
    const body = request.body as any;
    
    switch (endpoint) {
      case 'login':
        identifier = body?.email || body?.username || request.ip;
        break;
      case 'register':
        identifier = body?.email || request.ip;
        break;
      case 'forgotPassword':
        identifier = body?.email || request.ip;
        break;
      case 'resetPassword':
        identifier = body?.token || request.ip;
        break;
      case 'verifyEmail':
        identifier = body?.token || request.ip;
        break;
      default:
        identifier = request.ip;
    }
    
    const result = await authRateLimit.checkRateLimit(endpoint, identifier, request);
    
    if (!result.allowed) {
      // Set rate limit headers
      reply.header('X-RateLimit-Limit', '5');
      reply.header('X-RateLimit-Remaining', '0');
      reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
      
      if (result.retryAfter) {
        reply.header('Retry-After', result.retryAfter.toString());
      }
      
      const errorMessage = result.blocked 
        ? `Account temporarily blocked due to repeated failed attempts. Try again in ${Math.ceil((result.retryAfter || 0) / 60)} minutes.`
        : `Too many attempts. Please try again in ${Math.ceil((result.retryAfter || 0) / 60)} minutes.`;
      
      throw new AppError(errorMessage, 429, 'RATE_LIMIT_EXCEEDED', {
        retryAfter: result.retryAfter,
        endpoint,
        blocked: result.blocked
      });
    }
    
    // Set rate limit headers for successful requests
    reply.header('X-RateLimit-Limit', '5');
    reply.header('X-RateLimit-Remaining', result.remaining.toString());
    reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    
    // Store rate limit service in request for success recording
    (request as any).authRateLimit = authRateLimit;
    (request as any).authEndpoint = endpoint;
    (request as any).authIdentifier = identifier;
  };
}