import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RedisCacheService } from './redis-cache';
import { createHash } from 'crypto';

export interface SecurityOptions {
  rateLimiting?: {
    enabled: boolean;
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  bruteForceProtection?: {
    enabled: boolean;
    maxAttempts: number;
    blockDuration: number;
    resetDuration: number;
  };
  ddosProtection?: {
    enabled: boolean;
    maxConnections: number;
    maxRequestsPerSecond: number;
  };
  ipWhitelist?: string[];
  ipBlacklist?: string[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  blocked: boolean;
}

export interface SecurityEvent {
  type: 'rate_limit' | 'brute_force' | 'ddos' | 'suspicious_activity' | 'blocked_ip';
  ip: string;
  userAgent?: string;
  userId?: string;
  timestamp: Date;
  details?: any;
}

/**
 * Comprehensive Security Service for Discord-like Application
 * 
 * Features:
 * - Advanced rate limiting with Redis backend
 * - Brute force protection
 * - DDoS mitigation
 * - IP-based blocking and whitelisting
 * - Request fingerprinting
 * - Suspicious activity detection
 * - Security event logging
 * - Adaptive throttling
 * - Bot detection
 * - Request analysis and scoring
 */
export class SecurityService {
  private redis: RedisCacheService;
  private options: SecurityOptions;
  private connectionCounts: Map<string, number> = new Map();
  private suspiciousPatterns: RegExp[] = [
    /bot|crawler|spider|scraper/i,
    /automated|script|curl|wget/i,
    /scan|probe|attack|exploit/i
  ];

  constructor(redis: RedisCacheService, options: SecurityOptions = {}) {
    this.redis = redis;
    this.options = {
      rateLimiting: {
        enabled: true,
        windowMs: 60 * 1000, // 1 minute
        max: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        ...options.rateLimiting
      },
      bruteForceProtection: {
        enabled: true,
        maxAttempts: 5,
        blockDuration: 15 * 60 * 1000, // 15 minutes
        resetDuration: 60 * 60 * 1000, // 1 hour
        ...options.bruteForceProtection
      },
      ddosProtection: {
        enabled: true,
        maxConnections: 100,
        maxRequestsPerSecond: 20,
        ...options.ddosProtection
      },
      ipWhitelist: options.ipWhitelist || [],
      ipBlacklist: options.ipBlacklist || []
    };

    this.setupCleanupTasks();
  }

  /**
   * Main security middleware
   */
  async securityMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] || '';
    const userId = (request as any).userId;

    try {
      // IP whitelist/blacklist check
      if (this.options.ipBlacklist?.includes(ip)) {
        await this.logSecurityEvent({
          type: 'blocked_ip',
          ip,
          userAgent,
          userId,
          timestamp: new Date(),
          details: { reason: 'blacklisted' }
        });
        
        return reply.code(403).send({
          success: false,
          error: 'Access denied',
          code: 'IP_BLOCKED'
        });
      }

      if (this.options.ipWhitelist && this.options.ipWhitelist.length > 0) {
        if (!this.options.ipWhitelist.includes(ip)) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
            code: 'IP_NOT_WHITELISTED'
          });
        }
      }

      // DDoS protection
      if (this.options.ddosProtection?.enabled) {
        const ddosCheck = await this.checkDDoSProtection(ip);
        if (!ddosCheck.allowed) {
          await this.logSecurityEvent({
            type: 'ddos',
            ip,
            userAgent,
            userId,
            timestamp: new Date(),
            details: ddosCheck
          });

          return reply.code(429).send({
            success: false,
            error: 'Too many requests',
            code: 'DDOS_PROTECTION',
            retryAfter: ddosCheck.retryAfter
          });
        }
      }

      // Rate limiting
      if (this.options.rateLimiting?.enabled) {
        const rateLimitCheck = await this.checkRateLimit(request, reply);
        if (!rateLimitCheck.allowed) {
          await this.logSecurityEvent({
            type: 'rate_limit',
            ip,
            userAgent,
            userId,
            timestamp: new Date(),
            details: rateLimitCheck.info
          });

          reply.headers({
            'X-RateLimit-Limit': rateLimitCheck.info.limit.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.info.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.info.resetTime.toString()
          });

          return reply.code(429).send({
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED',
            retryAfter: Math.ceil((rateLimitCheck.info.resetTime - Date.now()) / 1000)
          });
        }
      }

      // Suspicious activity detection
      const suspiciousScore = await this.calculateSuspiciousScore(request);
      if (suspiciousScore > 75) {
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          ip,
          userAgent,
          userId,
          timestamp: new Date(),
          details: { score: suspiciousScore }
        });

        // Additional throttling for suspicious requests
        await this.applySuspiciousActivityThrottling(ip);
      }

    } catch (error) {
      console.error('Security middleware error:', error);
      // Don't block requests on security service errors
    }
  }

  /**
   * Enhanced rate limiting with multiple strategies
   */
  private async checkRateLimit(
    request: FastifyRequest, 
    reply: FastifyReply
  ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const ip = this.getClientIP(request);
    const userId = (request as any).userId;
    const route = request.routeOptions?.url || request.url;
    
    // Multiple rate limiting keys for different scopes
    const keys = [
      `rate:global:${ip}`, // Global IP-based
      userId ? `rate:user:${userId}` : null, // User-based
      `rate:route:${ip}:${route}`, // Route-specific
      `rate:endpoint:${request.method}:${route}` // Method+endpoint specific
    ].filter(Boolean) as string[];

    const checks = await Promise.all(
      keys.map(key => this.performRateLimit(key, this.options.rateLimiting!))
    );

    // Find the most restrictive limit
    const mostRestrictive = checks.reduce((prev, current) => 
      current.remaining < prev.remaining ? current : prev
    );

    return {
      allowed: mostRestrictive.remaining > 0,
      info: mostRestrictive
    };
  }

  /**
   * Perform rate limiting for a specific key
   */
  private async performRateLimit(
    key: string,
    options: NonNullable<SecurityOptions['rateLimiting']>
  ): Promise<RateLimitInfo> {
    const window = Math.floor(Date.now() / options.windowMs);
    const limitKey = `${key}:${window}`;
    
    // Get current count
    const current = await this.redis.get<number>(limitKey) || 0;
    
    if (current >= options.max) {
      return {
        limit: options.max,
        remaining: 0,
        resetTime: (window + 1) * options.windowMs,
        blocked: true
      };
    }

    // Increment counter
    await this.redis.incr(limitKey, { ttl: Math.ceil(options.windowMs / 1000) });

    return {
      limit: options.max,
      remaining: Math.max(0, options.max - current - 1),
      resetTime: (window + 1) * options.windowMs,
      blocked: false
    };
  }

  /**
   * Brute force protection
   */
  async recordFailedAttempt(
    identifier: string,
    type: 'login' | 'api' | 'upload' = 'api'
  ): Promise<{ blocked: boolean; blockDuration?: number; attemptsRemaining?: number }> {
    if (!this.options.bruteForceProtection?.enabled) {
      return { blocked: false };
    }

    const key = `bruteforce:${type}:${identifier}`;
    const attempts = await this.redis.incr(key, { 
      ttl: Math.ceil(this.options.bruteForceProtection.resetDuration / 1000) 
    });

    if (attempts >= this.options.bruteForceProtection.maxAttempts) {
      // Block the identifier
      const blockKey = `blocked:${type}:${identifier}`;
      await this.redis.set(blockKey, 'blocked', {
        ttl: Math.ceil(this.options.bruteForceProtection.blockDuration / 1000)
      });

      await this.logSecurityEvent({
        type: 'brute_force',
        ip: identifier,
        timestamp: new Date(),
        details: { attempts, type, blocked: true }
      });

      return {
        blocked: true,
        blockDuration: this.options.bruteForceProtection.blockDuration
      };
    }

    return {
      blocked: false,
      attemptsRemaining: this.options.bruteForceProtection.maxAttempts - attempts
    };
  }

  /**
   * Check if identifier is blocked due to brute force
   */
  async isBlocked(identifier: string, type: 'login' | 'api' | 'upload' = 'api'): Promise<boolean> {
    if (!this.options.bruteForceProtection?.enabled) {
      return false;
    }

    const blockKey = `blocked:${type}:${identifier}`;
    return await this.redis.exists(blockKey);
  }

  /**
   * Clear failed attempts (on successful action)
   */
  async clearFailedAttempts(identifier: string, type: 'login' | 'api' | 'upload' = 'api'): Promise<void> {
    const key = `bruteforce:${type}:${identifier}`;
    await this.redis.del(key);
  }

  /**
   * DDoS protection
   */
  private async checkDDoSProtection(ip: string): Promise<{
    allowed: boolean;
    connectionsCount?: number;
    requestsPerSecond?: number;
    retryAfter?: number;
  }> {
    if (!this.options.ddosProtection?.enabled) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowStart = now - 1000; // 1 second window

    // Check requests per second
    const requestKey = `ddos:requests:${ip}`;
    await this.redis.redis.zadd(requestKey, now, `${now}-${Math.random()}`);
    await this.redis.redis.zremrangebyscore(requestKey, 0, windowStart);
    await this.redis.expire(requestKey, 2); // 2 seconds TTL

    const requestsCount = await this.redis.redis.zcard(requestKey);
    
    if (requestsCount > this.options.ddosProtection.maxRequestsPerSecond) {
      return {
        allowed: false,
        requestsPerSecond: requestsCount,
        retryAfter: 1
      };
    }

    // Check concurrent connections
    const connectionsCount = this.connectionCounts.get(ip) || 0;
    if (connectionsCount > this.options.ddosProtection.maxConnections) {
      return {
        allowed: false,
        connectionsCount,
        retryAfter: 5
      };
    }

    return { allowed: true };
  }

  /**
   * Calculate suspicious activity score
   */
  private async calculateSuspiciousScore(request: FastifyRequest): Promise<number> {
    let score = 0;
    const ip = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] || '';

    // User agent analysis
    if (!userAgent) {
      score += 20;
    } else {
      // Check for bot patterns
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(userAgent)) {
          score += 30;
          break;
        }
      }
    }

    // Request frequency analysis
    const requestFrequency = await this.getRequestFrequency(ip);
    if (requestFrequency > 50) { // More than 50 requests per minute
      score += 25;
    }

    // Path traversal attempts
    if (request.url.includes('../') || request.url.includes('..\\')) {
      score += 40;
    }

    // SQL injection attempts
    const sqlPatterns = ['union', 'select', 'drop', 'insert', 'delete', 'update'];
    const urlLower = request.url.toLowerCase();
    for (const pattern of sqlPatterns) {
      if (urlLower.includes(pattern)) {
        score += 35;
        break;
      }
    }

    // XSS attempts
    if (request.url.includes('<script') || request.url.includes('javascript:')) {
      score += 35;
    }

    // Unusual request headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
    let forwardedCount = 0;
    for (const header of suspiciousHeaders) {
      if (request.headers[header]) {
        forwardedCount++;
      }
    }
    if (forwardedCount > 1) {
      score += 15;
    }

    // Geographic analysis (placeholder)
    const geoScore = await this.analyzeGeographicPatterns(ip);
    score += geoScore;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Apply throttling for suspicious activity
   */
  private async applySuspiciousActivityThrottling(ip: string): Promise<void> {
    const key = `suspicious:${ip}`;
    const currentLevel = await this.redis.get<number>(key) || 0;
    const newLevel = currentLevel + 1;
    
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const throttleDuration = Math.min(Math.pow(2, newLevel), 60); // Max 60 seconds
    
    await this.redis.set(key, newLevel, { ttl: throttleDuration });
    
    // Add additional delay for this IP
    const delayKey = `delay:${ip}`;
    await this.redis.set(delayKey, throttleDuration * 1000, { ttl: throttleDuration });
  }

  /**
   * Get request frequency for IP
   */
  private async getRequestFrequency(ip: string): Promise<number> {
    const key = `freq:${ip}`;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    await this.redis.redis.zadd(key, now, now.toString());
    await this.redis.redis.zremrangebyscore(key, 0, oneMinuteAgo);
    await this.redis.expire(key, 60);

    return await this.redis.redis.zcard(key);
  }

  /**
   * Analyze geographic patterns (placeholder)
   */
  private async analyzeGeographicPatterns(ip: string): Promise<number> {
    // This would integrate with a GeoIP service
    // For now, return 0
    return 0;
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
   * Log security events
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const eventKey = `security:events:${event.type}`;
    const eventData = {
      ...event,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: event.timestamp.toISOString()
    };

    // Store in Redis sorted set for time-based queries
    await this.redis.redis.zadd(
      eventKey,
      event.timestamp.getTime(),
      JSON.stringify(eventData)
    );

    // Keep only last 1000 events per type
    await this.redis.redis.zremrangebyrank(eventKey, 0, -1001);

    // Also store in a general security log
    await this.redis.redis.zadd(
      'security:events:all',
      event.timestamp.getTime(),
      JSON.stringify(eventData)
    );

    // Keep only last 5000 events total
    await this.redis.redis.zremrangebyrank('security:events:all', 0, -5001);

    console.log(`🚨 Security Event: ${event.type} from ${event.ip}`);
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const now = Date.now();
    let startTime: number;

    switch (timeRange) {
      case 'hour':
        startTime = now - 60 * 60 * 1000;
        break;
      case 'week':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = now - 24 * 60 * 60 * 1000;
    }

    const eventTypes = ['rate_limit', 'brute_force', 'ddos', 'suspicious_activity', 'blocked_ip'];
    const stats: any = {};

    for (const type of eventTypes) {
      const events = await this.redis.redis.zrangebyscore(
        `security:events:${type}`,
        startTime,
        now
      );
      
      stats[type] = {
        count: events.length,
        events: events.slice(-10).map(e => JSON.parse(e)) // Last 10 events
      };
    }

    return stats;
  }

  /**
   * Block IP address
   */
  async blockIP(ip: string, duration: number = 86400000, reason?: string): Promise<void> {
    const key = `blocked:ip:${ip}`;
    await this.redis.set(key, { reason, blockedAt: new Date() }, {
      ttl: Math.ceil(duration / 1000)
    });

    await this.logSecurityEvent({
      type: 'blocked_ip',
      ip,
      timestamp: new Date(),
      details: { reason, duration, manual: true }
    });
  }

  /**
   * Unblock IP address
   */
  async unblockIP(ip: string): Promise<void> {
    const key = `blocked:ip:${ip}`;
    await this.redis.del(key);
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    const key = `blocked:ip:${ip}`;
    return await this.redis.exists(key);
  }

  /**
   * Update connection count
   */
  updateConnectionCount(ip: string, delta: number): void {
    const current = this.connectionCounts.get(ip) || 0;
    const newCount = Math.max(0, current + delta);
    
    if (newCount === 0) {
      this.connectionCounts.delete(ip);
    } else {
      this.connectionCounts.set(ip, newCount);
    }
  }

  /**
   * Setup cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Clean up old data every hour
    setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error('Security cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Clean up old security data
   */
  private async cleanupOldData(): Promise<void> {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Clean up old events
    const eventTypes = ['rate_limit', 'brute_force', 'ddos', 'suspicious_activity', 'blocked_ip'];
    
    for (const type of eventTypes) {
      await this.redis.redis.zremrangebyscore(
        `security:events:${type}`,
        0,
        oneWeekAgo
      );
    }

    await this.redis.redis.zremrangebyscore('security:events:all', 0, oneWeekAgo);
    
    console.log('🧹 Security data cleanup completed');
  }

  /**
   * Export security configuration
   */
  exportConfiguration(): SecurityOptions {
    return this.options;
  }

  /**
   * Update security configuration
   */
  updateConfiguration(newOptions: Partial<SecurityOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

/**
 * Create security service instance
 */
export function createSecurityService(
  redis: RedisCacheService,
  options: SecurityOptions = {}
): SecurityService {
  return new SecurityService(redis, options);
}

/**
 * Fastify plugin for security service
 */
export async function securityPlugin(fastify: FastifyInstance, options: SecurityOptions = {}) {
  const redis = (fastify as any).cache as RedisCacheService;
  const securityService = createSecurityService(redis, options);
  
  fastify.decorate('security', securityService);
  
  // Add security middleware to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await securityService.securityMiddleware(request, reply);
  });

  // Track connections for DDoS protection
  fastify.addHook('onRequest', (request, reply, done) => {
    const ip = securityService['getClientIP'](request);
    securityService.updateConnectionCount(ip, 1);
    done();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const ip = securityService['getClientIP'](request);
    securityService.updateConnectionCount(ip, -1);
    done();
  });
  
  console.log('🛡️  Security Service initialized with features:');
  console.log('   - Rate limiting and throttling');
  console.log('   - Brute force protection');
  console.log('   - DDoS mitigation');
  console.log('   - IP blocking and whitelisting');
  console.log('   - Suspicious activity detection');
  console.log('   - Security event logging');
}