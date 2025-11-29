import { FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  maxRetriesPerRequest: null
});

interface RateLimitOptions {
  points: number;        // Number of points
  duration: number;      // Duration in seconds
  keyPrefix?: string;    // Prefix for Redis key
  blockDuration?: number; // Block duration in seconds after limit exceeded
}

/**
 * Rate limiting middleware using Redis
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    points,
    duration,
    keyPrefix = 'rate_limit',
    blockDuration = duration
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip rate limiting for localhost in development
    if (request.ip === '127.0.0.1' || request.ip === '::1' || request.hostname === 'localhost') {
      return;
    }
    
    // Get identifier (IP address or user ID)
    const identifier = request.userId || request.ip;
    const key = `${keyPrefix}:${identifier}`;
    
    try {
      // Check if blocked
      const blocked = await redis.get(`${key}:blocked`);
      if (blocked) {
        const ttl = await redis.ttl(`${key}:blocked`);
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: ttl
        });
        return;
      }

      // Get current count
      const current = await redis.incr(key);
      
      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, duration);
      }
      
      // Get TTL for headers
      const ttl = await redis.ttl(key);
      
      // Set rate limit headers
      reply.header('X-RateLimit-Limit', points.toString());
      reply.header('X-RateLimit-Remaining', Math.max(0, points - current).toString());
      reply.header('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());
      
      // Check if limit exceeded
      if (current > points) {
        // Block the user
        await redis.setex(`${key}:blocked`, blockDuration, '1');
        await redis.del(key); // Reset counter
        
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: blockDuration
        });
      }
    } catch (error) {
      request.log.error('Rate limiter error:', error);
      // Don't block request on rate limiter failure
    }
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API rate limit: 300 requests per minute
  general: createRateLimiter({
    points: 300,
    duration: 60,
    keyPrefix: 'rl:general'
  }),
  
  // Auth endpoints: 20 attempts per 5 minutes
  auth: createRateLimiter({
    points: 20,
    duration: 300,
    keyPrefix: 'rl:auth',
    blockDuration: 900
  }),
  
  // File upload: 50 uploads per hour
  upload: createRateLimiter({
    points: 50,
    duration: 3600,
    keyPrefix: 'rl:upload'
  }),
  
  // Message sending: 100 messages per minute
  messaging: createRateLimiter({
    points: 100,
    duration: 60,
    keyPrefix: 'rl:message'
  }),
  
  // Search: 60 searches per minute
  search: createRateLimiter({
    points: 60,
    duration: 60,
    keyPrefix: 'rl:search'
  }),
  
  // Aggressive rate limit for suspicious activity
  strict: createRateLimiter({
    points: 10,
    duration: 60,
    keyPrefix: 'rl:strict',
    blockDuration: 3600 // Block for 1 hour
  })
};

/**
 * Progressive rate limiting based on user behavior
 */
export async function getProgressiveRateLimit(userId: string): Promise<number> {
  const key = `user:trust:${userId}`;
  const trustScore = await redis.get(key);
  
  if (!trustScore) {
    // New user: strict limits
    return 50;
  }
  
  const score = parseInt(trustScore);
  if (score < 0) {
    // Suspicious user: very strict
    return 10;
  } else if (score < 50) {
    // Low trust: moderate limits
    return 50;
  } else if (score < 100) {
    // Medium trust: normal limits
    return 100;
  } else {
    // High trust: relaxed limits
    return 200;
  }
}

/**
 * Update user trust score based on behavior
 */
export async function updateTrustScore(userId: string, delta: number) {
  const key = `user:trust:${userId}`;
  const newScore = await redis.incrby(key, delta);
  await redis.expire(key, 86400 * 30); // Expire after 30 days
  return newScore;
}

/**
 * Enhanced rate limiter with burst protection and sliding window
 */
export function createEnhancedRateLimiter(options: RateLimitOptions & {
  burstLimit?: number;
  slidingWindow?: boolean;
  whitelistIPs?: string[];
  blacklistIPs?: string[];
}) {
  const {
    points,
    duration,
    keyPrefix = 'rate_limit',
    blockDuration = duration,
    burstLimit = points * 2,
    slidingWindow = true,
    whitelistIPs = [],
    blacklistIPs = []
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientIP = request.ip;
    
    // Check whitelist
    if (whitelistIPs.includes(clientIP)) {
      return;
    }
    
    // Check blacklist
    if (blacklistIPs.includes(clientIP)) {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Your IP address has been blocked'
      });
      return;
    }
    
    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV !== 'production' && 
        (clientIP === '127.0.0.1' || clientIP === '::1' || request.hostname === 'localhost')) {
      return;
    }
    
    const identifier = request.userId || clientIP;
    const key = `${keyPrefix}:${identifier}`;
    
    try {
      // Check if blocked
      const blocked = await redis.get(`${key}:blocked`);
      if (blocked) {
        const ttl = await redis.ttl(`${key}:blocked`);
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: ttl
        });
        return;
      }

      let current: number;
      
      if (slidingWindow) {
        // Sliding window implementation
        const now = Date.now();
        const windowStart = now - (duration * 1000);
        
        // Add current request
        await redis.zadd(key, now, `${now}-${Math.random()}`);
        
        // Remove old entries
        await redis.zremrangebyscore(key, 0, windowStart);
        
        // Count requests in window
        current = await redis.zcard(key);
        
        // Set expiry
        await redis.expire(key, duration + 60); // Extra buffer
      } else {
        // Fixed window implementation
        current = await redis.incr(key);
        
        if (current === 1) {
          await redis.expire(key, duration);
        }
      }
      
      // Get TTL for headers
      const ttl = await redis.ttl(key);
      
      // Set rate limit headers
      reply.header('X-RateLimit-Limit', points.toString());
      reply.header('X-RateLimit-Remaining', Math.max(0, points - current).toString());
      reply.header('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());
      reply.header('X-RateLimit-Window', duration.toString());
      
      // Check burst limit first
      if (current > burstLimit) {
        await redis.setex(`${key}:blocked`, blockDuration * 2, '1');
        await redis.del(key);
        
        // Log suspicious activity
        request.log.warn({
          ip: clientIP,
          userId: request.userId,
          requests: current,
          limit: burstLimit
        }, 'Burst limit exceeded');
        
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Burst limit exceeded. Your requests have been temporarily blocked.',
          retryAfter: blockDuration * 2
        });
        return;
      }
      
      // Check normal limit
      if (current > points) {
        await redis.setex(`${key}:blocked`, blockDuration, '1');
        if (!slidingWindow) {
          await redis.del(key);
        }
        
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: blockDuration
        });
        return;
      }
      
      // Add warning header when approaching limit
      if (current > points * 0.8) {
        reply.header('X-RateLimit-Warning', 'Approaching rate limit');
      }
      
    } catch (error) {
      request.log.error('Enhanced rate limiter error:', error);
      // Don't block request on rate limiter failure
    }
  };
}

// Enhanced rate limiters with better protection
export const enhancedRateLimiters = {
  // API endpoints with burst protection
  api: createEnhancedRateLimiter({
    points: 1000,
    duration: 60,
    burstLimit: 1500,
    keyPrefix: 'erl:api',
    slidingWindow: true
  }),
  
  // Authentication with relaxed limits for public access
  auth: createEnhancedRateLimiter({
    points: 100,
    duration: 300,
    burstLimit: 150,
    keyPrefix: 'erl:auth',
    blockDuration: 600,
    slidingWindow: true
  }),
  
  // File uploads with size-based limiting
  upload: createEnhancedRateLimiter({
    points: 20,
    duration: 3600,
    burstLimit: 30,
    keyPrefix: 'erl:upload',
    slidingWindow: true
  }),
  
  // Real-time messaging
  messaging: createEnhancedRateLimiter({
    points: 200,
    duration: 60,
    burstLimit: 300,
    keyPrefix: 'erl:message',
    slidingWindow: true
  }),
  
  // Search with intelligent limiting
  search: createEnhancedRateLimiter({
    points: 100,
    duration: 60,
    burstLimit: 150,
    keyPrefix: 'erl:search',
    slidingWindow: true
  }),
  
  // Admin endpoints
  admin: createEnhancedRateLimiter({
    points: 50,
    duration: 60,
    burstLimit: 75,
    keyPrefix: 'erl:admin',
    slidingWindow: true
  })
};

/**
 * IP-based security monitoring
 */
export async function monitorSuspiciousActivity(request: FastifyRequest) {
  const ip = request.ip;
  const key = `security:monitor:${ip}`;
  
  try {
    // Track request patterns
    const hour = Math.floor(Date.now() / (1000 * 60 * 60));
    const hourlyKey = `${key}:${hour}`;
    
    const requestCount = await redis.incr(hourlyKey);
    await redis.expire(hourlyKey, 3600);
    
    // Flag suspicious activity
    if (requestCount > 10000) { // More than 10k requests per hour
      await redis.setex(`security:suspicious:${ip}`, 86400, requestCount.toString());
      request.log.warn({
        ip,
        requests: requestCount,
        hour
      }, 'Suspicious activity detected');
    }
    
    // Track failed authentication attempts
    if (request.url.includes('/auth/') && request.method === 'POST') {
      const authKey = `security:auth_attempts:${ip}`;
      await redis.incr(authKey);
      await redis.expire(authKey, 300); // 5 minutes
    }
    
  } catch (error) {
    request.log.error('Security monitoring error:', error);
  }
}

/**
 * Get security metrics for monitoring
 */
export async function getSecurityMetrics() {
  try {
    const suspicious = await redis.keys('security:suspicious:*');
    const blocked = await redis.keys('*:blocked');
    
    const metrics = {
      suspiciousIPs: suspicious.length,
      blockedRequests: blocked.length,
      timestamp: new Date().toISOString()
    };
    
    return metrics;
  } catch (error) {
    console.error('Failed to get security metrics:', error);
    return {
      suspiciousIPs: 0,
      blockedRequests: 0,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch metrics'
    };
  }
}