import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { AppError } from './errorHandler';

export interface RateLimitRule {
  endpoint: string | RegExp;
  windowMs: number;
  maxRequests: number;
  skipSuccessful?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: FastifyRequest) => string;
  onLimitReached?: (request: FastifyRequest, reply: FastifyReply) => void;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitOptions {
  redis?: Redis;
  rules?: RateLimitRule[];
  globalLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  enableBanning?: boolean;
  banDuration?: number;
  violationThreshold?: number;
  whitelistedIPs?: string[];
  whitelistedUserAgents?: RegExp[];
}

/**
 * Enhanced Rate Limiting Middleware
 * 
 * Features:
 * - Multiple rate limiting rules per endpoint
 * - Redis-backed with fallback to memory
 * - Automatic IP banning for repeated violations
 * - Whitelist support for trusted sources
 * - Comprehensive logging and monitoring
 * - JWT-based user rate limiting
 * - Sliding window algorithm
 * - Distributed rate limiting across instances
 */
export class EnhancedRateLimitingService {
  private redis?: Redis;
  private options: Required<RateLimitOptions>;
  private memoryStore: Map<string, { count: number; resetTime: number; violations: number }> = new Map();
  private bannedIPs: Map<string, number> = new Map(); // IP -> ban expiry timestamp
  
  // Default rate limiting rules for different endpoint types
  private readonly DEFAULT_RULES: RateLimitRule[] = [
    // Authentication endpoints - lenient limits for development
    {
      endpoint: /^\/api\/v1\/auth\/(login|register|forgot-password|reset-password)$/,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50, // 50 attempts per 15 minutes (increased for development)
      skipSuccessful: false,
      message: 'Too many authentication attempts. Please try again later.',
      statusCode: 429
    },
    {
      endpoint: /^\/api\/v1\/auth\/refresh$/,
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 refresh attempts per minute
      skipSuccessful: true,
      message: 'Token refresh rate limit exceeded.',
      statusCode: 429
    },
    {
      endpoint: /^\/api\/v1\/oauth\//,
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10, // 10 OAuth attempts per 5 minutes
      message: 'OAuth rate limit exceeded.',
      statusCode: 429
    },
    // File upload endpoints
    {
      endpoint: /^\/api\/v1\/uploads\//,
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 uploads per minute
      keyGenerator: (req) => req.userId || req.ip,
      message: 'Upload rate limit exceeded.',
      statusCode: 429
    },
    // Message/posting endpoints
    {
      endpoint: /^\/api\/v1\/(messages|posts|comments)$/,
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 messages/posts per minute
      keyGenerator: (req) => req.userId || req.ip,
      message: 'Message posting rate limit exceeded.',
      statusCode: 429
    },
    // Search endpoints
    {
      endpoint: /^\/api\/v1\/search\//,
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 searches per minute
      keyGenerator: (req) => req.userId || req.ip,
      skipSuccessful: true,
      message: 'Search rate limit exceeded.',
      statusCode: 429
    },
    // General API endpoints
    {
      endpoint: /^\/api\/v1\//,
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 300, // 300 general API calls per minute
      keyGenerator: (req) => req.userId || req.ip,
      skipSuccessful: true,
      message: 'API rate limit exceeded.',
      statusCode: 429
    }
  ];

  constructor(options: RateLimitOptions = {}) {
    this.redis = options.redis;
    this.options = {
      rules: options.rules || this.DEFAULT_RULES,
      globalLimit: options.globalLimit || {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5000 // 5000 requests per minute globally (increased for development)
      },
      enableBanning: options.enableBanning !== false,
      banDuration: options.banDuration || 60 * 60 * 1000, // 1 hour
      violationThreshold: options.violationThreshold || 3, // Ban after 3 violations
      whitelistedIPs: options.whitelistedIPs || [],
      whitelistedUserAgents: options.whitelistedUserAgents || [
        /^HealthCheck/, // Health check services
        /^InternalService/, // Internal services
        /^Kubernetes/ // K8s probes
      ],
      redis: options.redis
    };
    
    this.setupCleanupTasks();
    console.log('🚦 Enhanced Rate Limiting Service initialized');
  }

  /**
   * Main rate limiting middleware
   */
  rateLimitMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const clientIP = this.getClientIP(request);
        const userAgent = request.headers['user-agent'] || 'unknown';
        
        // Skip rate limiting for Socket.IO requests
        if (request.url.startsWith('/socket.io/')) {
          return; // Allow Socket.IO connections without rate limiting
        }
        
        // Skip rate limiting for health checks and metrics
        if (request.url.includes('/health') || request.url.includes('/metrics')) {
          return;
        }
        
        // Check if IP is banned
        if (this.isIPBanned(clientIP)) {
          const banExpiry = this.bannedIPs.get(clientIP)!;
          const retryAfter = Math.ceil((banExpiry - Date.now()) / 1000);
          
          reply.header('Retry-After', retryAfter.toString());
          reply.header('X-Ban-Reason', 'Repeated rate limit violations');
          reply.header('X-Ban-Expires', new Date(banExpiry).toISOString());
          
          throw new AppError(
            'IP temporarily banned due to repeated violations',
            429,
            'IP_BANNED',
            {
              retryAfter,
              banExpires: new Date(banExpiry).toISOString()
            }
          );
        }
        
        // Check whitelist
        if (this.isWhitelisted(clientIP, userAgent)) {
          return; // Skip rate limiting for whitelisted sources
        }
        
        // Apply matching rules
        const matchingRules = this.getMatchingRules(request.url);
        if (matchingRules.length === 0) {
          return; // No rules match, skip rate limiting
        }
        
        // Check each matching rule
        for (const rule of matchingRules) {
          await this.checkRateLimit(request, reply, rule, clientIP);
        }
        
        // Check global limit (but with higher limits for development)
        if (this.options.globalLimit) {
          await this.checkGlobalRateLimit(request, reply, clientIP);
        }
        
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        
        request.log.error({ error, url: request.url }, 'Rate limiting error');
        // Don't block requests on rate limiting errors - fail open for reliability
        return;
      }
    };
  }

  /**
   * Check rate limit for a specific rule
   */
  private async checkRateLimit(
    request: FastifyRequest,
    reply: FastifyReply,
    rule: RateLimitRule,
    clientIP: string
  ): Promise<void> {
    const keyGenerator = rule.keyGenerator || ((req) => this.getClientIP(req));
    const rateLimitKey = keyGenerator(request);
    const now = Date.now();
    const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
    const key = `rate_limit:${this.hashKey(rateLimitKey)}:${rule.endpoint}:${windowStart}`;
    
    let currentCount = 0;
    let violations = 0;
    
    try {
      if (this.redis) {
        // Redis-based rate limiting
        const results = await Promise.all([
          this.redis.get(key),
          this.redis.get(`violations:${clientIP}`)
        ]);
        
        currentCount = parseInt(results[0] || '0');
        violations = parseInt(results[1] || '0');
        
        // Check if limit exceeded
        if (currentCount >= rule.maxRequests) {
          await this.handleRateLimitExceeded(request, reply, rule, clientIP, currentCount, violations);
          return;
        }
        
        // Increment counter
        const pipeline = this.redis.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, Math.ceil(rule.windowMs / 1000));
        await pipeline.exec();
        
        currentCount += 1;
        
      } else {
        // Memory-based fallback
        const memKey = `${rateLimitKey}:${rule.endpoint}:${windowStart}`;
        const stored = this.memoryStore.get(memKey) || { count: 0, resetTime: windowStart + rule.windowMs, violations: 0 };
        
        if (now > stored.resetTime) {
          stored.count = 0;
          stored.resetTime = windowStart + rule.windowMs;
        }
        
        currentCount = stored.count;
        violations = stored.violations;
        
        if (currentCount >= rule.maxRequests) {
          await this.handleRateLimitExceeded(request, reply, rule, clientIP, currentCount, violations);
          return;
        }
        
        stored.count += 1;
        this.memoryStore.set(memKey, stored);
        currentCount = stored.count;
      }
      
      // Set rate limit headers
      const remaining = Math.max(0, rule.maxRequests - currentCount);
      const resetTime = windowStart + rule.windowMs;
      
      if (rule.headers !== false) {
        reply.header('X-RateLimit-Limit', rule.maxRequests.toString());
        reply.header('X-RateLimit-Remaining', remaining.toString());
        reply.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
        reply.header('X-RateLimit-Window', rule.windowMs.toString());
      }
      
      // Log high usage
      if (remaining <= 1) {
        request.log.warn({
          ip: clientIP,
          endpoint: rule.endpoint,
          remaining,
          limit: rule.maxRequests
        }, 'Rate limit nearly exceeded');
      }
      
    } catch (error) {
      request.log.error({ error, rule: rule.endpoint, url: request.url }, 'Rate limit check failed');
      // Continue without blocking on errors - fail open for reliability
      return;
    }
  }

  /**
   * Handle rate limit exceeded
   */
  private async handleRateLimitExceeded(
    request: FastifyRequest,
    reply: FastifyReply,
    rule: RateLimitRule,
    clientIP: string,
    currentCount: number,
    violations: number
  ): Promise<void> {
    const now = Date.now();
    const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
    const resetTime = windowStart + rule.windowMs;
    const retryAfter = Math.ceil((resetTime - now) / 1000);
    
    // Record violation
    violations += 1;
    await this.recordViolation(clientIP, violations);
    
    // Check if should ban IP
    if (this.options.enableBanning && violations >= this.options.violationThreshold) {
      const banExpiry = now + this.options.banDuration;
      this.bannedIPs.set(clientIP, banExpiry);
      
      request.log.warn({
        ip: clientIP,
        violations,
        banExpiry: new Date(banExpiry).toISOString()
      }, 'IP banned due to repeated rate limit violations');
      
      reply.header('X-Ban-Applied', 'true');
      reply.header('X-Ban-Expires', new Date(banExpiry).toISOString());
    }
    
    // Set headers
    reply.header('Retry-After', retryAfter.toString());
    reply.header('X-RateLimit-Limit', rule.maxRequests.toString());
    reply.header('X-RateLimit-Remaining', '0');
    reply.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    reply.header('X-RateLimit-Violations', violations.toString());
    
    // Log rate limit exceeded
    request.log.warn({
      ip: clientIP,
      endpoint: rule.endpoint,
      currentCount,
      limit: rule.maxRequests,
      violations,
      userAgent: request.headers['user-agent']
    }, 'Rate limit exceeded');
    
    // Custom handler or default response
    if (rule.onLimitReached) {
      rule.onLimitReached(request, reply);
      return;
    }
    
    throw new AppError(
      rule.message || 'Rate limit exceeded',
      rule.statusCode || 429,
      'RATE_LIMIT_EXCEEDED',
      {
        limit: rule.maxRequests,
        windowMs: rule.windowMs,
        retryAfter,
        violations
      }
    );
  }

  /**
   * Check global rate limit
   */
  private async checkGlobalRateLimit(
    request: FastifyRequest,
    reply: FastifyReply,
    clientIP: string
  ): Promise<void> {
    if (!this.options.globalLimit) return;
    
    const { windowMs, maxRequests } = this.options.globalLimit;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = `global_rate_limit:${this.hashKey(clientIP)}:${windowStart}`;
    
    let currentCount = 0;
    
    try {
      if (this.redis) {
        currentCount = await this.redis.incr(key);
        if (currentCount === 1) {
          await this.redis.expire(key, Math.ceil(windowMs / 1000));
        }
      } else {
        const memKey = `global:${clientIP}:${windowStart}`;
        const stored = this.memoryStore.get(memKey) || { count: 0, resetTime: windowStart + windowMs, violations: 0 };
        
        if (now > stored.resetTime) {
          stored.count = 0;
          stored.resetTime = windowStart + windowMs;
        }
        
        stored.count += 1;
        this.memoryStore.set(memKey, stored);
        currentCount = stored.count;
      }
      
      if (currentCount > maxRequests) {
        const resetTime = windowStart + windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        
        reply.header('Retry-After', retryAfter.toString());
        reply.header('X-Global-RateLimit-Limit', maxRequests.toString());
        reply.header('X-Global-RateLimit-Remaining', '0');
        reply.header('X-Global-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
        
        request.log.warn({
          ip: clientIP,
          currentCount,
          limit: maxRequests
        }, 'Global rate limit exceeded');
        
        throw new AppError(
          'Global rate limit exceeded',
          429,
          'GLOBAL_RATE_LIMIT_EXCEEDED',
          {
            limit: maxRequests,
            windowMs,
            retryAfter
          }
        );
      }
      
      // Set global rate limit headers
      const remaining = Math.max(0, maxRequests - currentCount);
      reply.header('X-Global-RateLimit-Limit', maxRequests.toString());
      reply.header('X-Global-RateLimit-Remaining', remaining.toString());
      
    } catch (error) {
      request.log.error({ error, url: request.url }, 'Global rate limit check failed');
      // Continue without blocking on errors - fail open for reliability
      return;
    }
  }

  /**
   * Record violation for IP
   */
  private async recordViolation(clientIP: string, violations: number): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.setex(
          `violations:${clientIP}`,
          Math.ceil(this.options.banDuration / 1000),
          violations.toString()
        );
      }
    } catch (error) {
      console.warn('Failed to record rate limit violation:', error);
    }
  }

  /**
   * Get matching rules for a URL
   */
  private getMatchingRules(url: string): RateLimitRule[] {
    return this.options.rules.filter(rule => {
      if (typeof rule.endpoint === 'string') {
        return url === rule.endpoint;
      } else if (rule.endpoint instanceof RegExp) {
        return rule.endpoint.test(url);
      }
      return false;
    });
  }

  /**
   * Check if IP is banned
   */
  private isIPBanned(ip: string): boolean {
    const banExpiry = this.bannedIPs.get(ip);
    if (!banExpiry) return false;
    
    if (Date.now() > banExpiry) {
      this.bannedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Check if source is whitelisted
   */
  private isWhitelisted(ip: string, userAgent: string): boolean {
    // Check IP whitelist
    if (this.options.whitelistedIPs.includes(ip)) {
      return true;
    }
    
    // Check User-Agent whitelist
    return this.options.whitelistedUserAgents.some(pattern => pattern.test(userAgent));
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIP = request.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return request.ip || 'unknown';
  }

  /**
   * Hash key for consistent storage
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Setup cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Clean up banned IPs
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [ip, expiry] of this.bannedIPs.entries()) {
        if (expiry < now) {
          this.bannedIPs.delete(ip);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired IP bans`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clean up memory store
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, value] of this.memoryStore.entries()) {
        if (value.resetTime < now) {
          this.memoryStore.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Get rate limiting statistics
   */
  getStats(): {
    memoryEntries: number;
    bannedIPs: number;
    rules: number;
    redisEnabled: boolean;
  } {
    return {
      memoryEntries: this.memoryStore.size,
      bannedIPs: this.bannedIPs.size,
      rules: this.options.rules.length,
      redisEnabled: !!this.redis
    };
  }

  /**
   * Manually ban/unban IP
   */
  manuallyBanIP(ip: string, duration?: number): void {
    const banDuration = duration || this.options.banDuration;
    const banExpiry = Date.now() + banDuration;
    this.bannedIPs.set(ip, banExpiry);
    console.log(`🚫 Manually banned IP ${ip} until ${new Date(banExpiry).toISOString()}`);
  }

  unbanIP(ip: string): boolean {
    const wasBanned = this.bannedIPs.has(ip);
    this.bannedIPs.delete(ip);
    if (wasBanned) {
      console.log(`✅ Unbanned IP ${ip}`);
    }
    return wasBanned;
  }
}

/**
 * Create enhanced rate limiting service
 */
export function createEnhancedRateLimitingService(options: RateLimitOptions = {}): EnhancedRateLimitingService {
  return new EnhancedRateLimitingService(options);
}

/**
 * Authentication-specific rate limiting middleware
 */
export function authRateLimitMiddleware(redis?: Redis) {
  const rateLimitService = new EnhancedRateLimitingService({
    redis,
    rules: [
      {
        endpoint: /^\/api\/v1\/auth\/(login|register)$/,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // Only 5 auth attempts per 15 minutes
        message: 'Too many authentication attempts from this IP. Please try again later.',
        statusCode: 429,
        keyGenerator: (req) => {
          // Use IP for unauthenticated requests, user ID for authenticated ones
          const ip = req.headers['x-forwarded-for'] as string || req.ip;
          const email = (req.body as any)?.email;
          const username = (req.body as any)?.username;
          return email || username || ip;
        }
      },
      {
        endpoint: /^\/api\/v1\/auth\/forgot-password$/,
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3, // Only 3 password reset requests per hour
        message: 'Too many password reset requests. Please try again later.',
        statusCode: 429,
        keyGenerator: (req) => (req.body as any)?.email || req.ip
      },
      {
        endpoint: /^\/api\/v1\/auth\/verify-email$/,
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 10, // 10 verification attempts per 5 minutes
        message: 'Too many email verification attempts. Please try again later.',
        statusCode: 429
      }
    ],
    enableBanning: true,
    banDuration: 30 * 60 * 1000, // 30 minutes ban for auth violations
    violationThreshold: 2 // Ban after 2 violations for auth endpoints
  });
  
  return rateLimitService.rateLimitMiddleware();
}