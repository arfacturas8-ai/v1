import { FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import { AppError } from './errorHandler';
import { EnhancedRateLimitingService, RateLimitRule } from './enhanced-rate-limiting';

// User tier definitions
export enum UserTier {
  ANONYMOUS = 'anonymous',
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

// Rate limiting tiers configuration
export interface RateLimitTier {
  tier: UserTier;
  limits: {
    // Requests per minute/hour/day
    perMinute: number;
    perHour: number;
    perDay: number;
    
    // Special endpoint limits
    auth: {
      login: number;        // per hour
      register: number;     // per day
      passwordReset: number; // per day
    };
    
    // Content creation limits
    posts: {
      create: number;       // per hour
      vote: number;         // per minute
      comment: number;      // per minute
    };
    
    // Media upload limits
    uploads: {
      count: number;        // per hour
      sizeLimit: number;    // bytes per upload
      totalSize: number;    // total bytes per day
    };
    
    // API specific limits
    search: number;         // per minute
    voice: number;          // concurrent connections
    websocket: number;      // concurrent connections
    
    // Premium features
    ai: {
      moderation: number;   // per hour
      analysis: number;     // per day
    };
  };
  
  // Burst allowance (temporary spike handling)
  burstMultiplier: number;
  
  // Cooldown after hitting limits (minutes)
  cooldownDuration: number;
}

// Comprehensive tier definitions
export const RATE_LIMIT_TIERS: Record<UserTier, RateLimitTier> = {
  [UserTier.ANONYMOUS]: {
    tier: UserTier.ANONYMOUS,
    limits: {
      perMinute: 20,
      perHour: 100,
      perDay: 1000,
      auth: {
        login: 5,
        register: 3,
        passwordReset: 2
      },
      posts: {
        create: 0,    // Anonymous users can't create posts
        vote: 0,      // Anonymous users can't vote
        comment: 0    // Anonymous users can't comment
      },
      uploads: {
        count: 0,
        sizeLimit: 0,
        totalSize: 0
      },
      search: 5,
      voice: 0,       // No voice access for anonymous
      websocket: 1,   // Limited real-time features
      ai: {
        moderation: 0,
        analysis: 0
      }
    },
    burstMultiplier: 1.5,
    cooldownDuration: 15
  },
  
  [UserTier.FREE]: {
    tier: UserTier.FREE,
    limits: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000,
      auth: {
        login: 10,
        register: 1,
        passwordReset: 3
      },
      posts: {
        create: 10,
        vote: 100,
        comment: 50
      },
      uploads: {
        count: 10,
        sizeLimit: 10 * 1024 * 1024,  // 10MB
        totalSize: 100 * 1024 * 1024   // 100MB per day
      },
      search: 30,
      voice: 1,
      websocket: 3,
      ai: {
        moderation: 50,
        analysis: 10
      }
    },
    burstMultiplier: 2,
    cooldownDuration: 10
  },
  
  [UserTier.PREMIUM]: {
    tier: UserTier.PREMIUM,
    limits: {
      perMinute: 200,
      perHour: 5000,
      perDay: 100000,
      auth: {
        login: 20,
        register: 5,
        passwordReset: 10
      },
      posts: {
        create: 100,
        vote: 1000,
        comment: 500
      },
      uploads: {
        count: 100,
        sizeLimit: 100 * 1024 * 1024,  // 100MB
        totalSize: 1024 * 1024 * 1024   // 1GB per day
      },
      search: 200,
      voice: 5,
      websocket: 10,
      ai: {
        moderation: 500,
        analysis: 100
      }
    },
    burstMultiplier: 3,
    cooldownDuration: 5
  },
  
  [UserTier.ENTERPRISE]: {
    tier: UserTier.ENTERPRISE,
    limits: {
      perMinute: 1000,
      perHour: 25000,
      perDay: 500000,
      auth: {
        login: 100,
        register: 50,
        passwordReset: 50
      },
      posts: {
        create: 1000,
        vote: 10000,
        comment: 5000
      },
      uploads: {
        count: 1000,
        sizeLimit: 500 * 1024 * 1024,  // 500MB
        totalSize: 10 * 1024 * 1024 * 1024  // 10GB per day
      },
      search: 1000,
      voice: 50,
      websocket: 100,
      ai: {
        moderation: 5000,
        analysis: 1000
      }
    },
    burstMultiplier: 5,
    cooldownDuration: 2
  },
  
  [UserTier.ADMIN]: {
    tier: UserTier.ADMIN,
    limits: {
      perMinute: 10000,
      perHour: 100000,
      perDay: 1000000,
      auth: {
        login: 1000,
        register: 1000,
        passwordReset: 1000
      },
      posts: {
        create: 10000,
        vote: 100000,
        comment: 50000
      },
      uploads: {
        count: 10000,
        sizeLimit: 1024 * 1024 * 1024,  // 1GB
        totalSize: 100 * 1024 * 1024 * 1024  // 100GB per day
      },
      search: 10000,
      voice: 1000,
      websocket: 1000,
      ai: {
        moderation: 50000,
        analysis: 10000
      }
    },
    burstMultiplier: 10,
    cooldownDuration: 0
  }
};

export class ComprehensiveRateLimitingService extends EnhancedRateLimitingService {
  private tiers: Record<UserTier, RateLimitTier>;
  
  constructor(options: { redis?: Redis }) {
    super({ redis: options.redis });
    this.tiers = RATE_LIMIT_TIERS;
  }
  
  // Get user tier from request
  private getUserTier(request: FastifyRequest): UserTier {
    const userId = (request as any).userId;
    const user = (request as any).user;
    
    if (!userId) return UserTier.ANONYMOUS;
    
    // Check if user has admin role
    if (user?.role === 'admin' || user?.isAdmin) {
      return UserTier.ADMIN;
    }
    
    // Check if user has premium subscription
    if (user?.subscription === 'enterprise' || user?.tier === 'enterprise') {
      return UserTier.ENTERPRISE;
    }
    
    if (user?.subscription === 'premium' || user?.isPremium) {
      return UserTier.PREMIUM;
    }
    
    return UserTier.FREE;
  }
  
  // Create tier-specific rate limiting rules
  createTierRules(request: FastifyRequest): RateLimitRule[] {
    const userTier = this.getUserTier(request);
    const tierConfig = this.tiers[userTier];
    const rules: RateLimitRule[] = [];
    
    // Global rate limits
    rules.push({
      endpoint: '*',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: Math.floor(tierConfig.limits.perMinute * tierConfig.burstMultiplier),
      keyGenerator: (req) => `${this.getClientIP(req)}:${(req as any).userId || 'anonymous'}`,
      message: `Rate limit exceeded for ${userTier} tier`,
      headers: true
    });
    
    // Hourly limits
    rules.push({
      endpoint: '*',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: tierConfig.limits.perHour,
      keyGenerator: (req) => `hourly:${this.getClientIP(req)}:${(req as any).userId || 'anonymous'}`,
      message: `Hourly rate limit exceeded for ${userTier} tier`
    });
    
    // Daily limits
    rules.push({
      endpoint: '*',
      windowMs: 24 * 60 * 60 * 1000, // 1 day
      maxRequests: tierConfig.limits.perDay,
      keyGenerator: (req) => `daily:${this.getClientIP(req)}:${(req as any).userId || 'anonymous'}`,
      message: `Daily rate limit exceeded for ${userTier} tier`
    });
    
    // Authentication endpoint limits
    rules.push({
      endpoint: /^\/api\/v\d+\/auth\/login/,
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: tierConfig.limits.auth.login,
      keyGenerator: (req) => `auth:login:${this.getClientIP(req)}`,
      message: 'Too many login attempts'
    });
    
    rules.push({
      endpoint: /^\/api\/v\d+\/auth\/register/,
      windowMs: 24 * 60 * 60 * 1000, // 1 day
      maxRequests: tierConfig.limits.auth.register,
      keyGenerator: (req) => `auth:register:${this.getClientIP(req)}`,
      message: 'Too many registration attempts'
    });
    
    rules.push({
      endpoint: /^\/api\/v\d+\/auth\/(forgot-password|reset-password)/,
      windowMs: 24 * 60 * 60 * 1000, // 1 day
      maxRequests: tierConfig.limits.auth.passwordReset,
      keyGenerator: (req) => `auth:password_reset:${this.getClientIP(req)}`,
      message: 'Too many password reset attempts'
    });
    
    // Content creation limits
    if (tierConfig.limits.posts.create > 0) {
      rules.push({
        endpoint: /^\/api\/v\d+\/posts$/,
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: tierConfig.limits.posts.create,
        keyGenerator: (req) => `posts:create:${(req as any).userId}`,
        message: 'Too many posts created'
      });
    }
    
    if (tierConfig.limits.posts.vote > 0) {
      rules.push({
        endpoint: /^\/api\/v\d+\/posts\/.*\/vote/,
        windowMs: 60 * 1000, // 1 minute
        maxRequests: tierConfig.limits.posts.vote,
        keyGenerator: (req) => `posts:vote:${(req as any).userId}`,
        message: 'Too many votes'
      });
    }
    
    if (tierConfig.limits.posts.comment > 0) {
      rules.push({
        endpoint: /^\/api\/v\d+\/(posts|comments)/,
        windowMs: 60 * 1000, // 1 minute
        maxRequests: tierConfig.limits.posts.comment,
        keyGenerator: (req) => `comments:create:${(req as any).userId}`,
        message: 'Too many comments'
      });
    }
    
    // Search limits
    if (tierConfig.limits.search > 0) {
      rules.push({
        endpoint: /^\/api\/v\d+\/search/,
        windowMs: 60 * 1000, // 1 minute
        maxRequests: tierConfig.limits.search,
        keyGenerator: (req) => `search:${this.getClientIP(req)}:${(req as any).userId || 'anonymous'}`,
        message: 'Too many search requests'
      });
    }
    
    // Upload limits
    if (tierConfig.limits.uploads.count > 0) {
      rules.push({
        endpoint: /^\/api\/v\d+\/(uploads|media)/,
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: tierConfig.limits.uploads.count,
        keyGenerator: (req) => `uploads:count:${(req as any).userId}`,
        message: 'Too many file uploads'
      });
    }
    
    // AI features limits
    if (tierConfig.limits.ai.moderation > 0) {
      rules.push({
        endpoint: /^\/api\/v\d+\/ai-moderation/,
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: tierConfig.limits.ai.moderation,
        keyGenerator: (req) => `ai:moderation:${(req as any).userId}`,
        message: 'AI moderation quota exceeded'
      });
    }
    
    return rules;
  }
  
  // Middleware factory for tier-based rate limiting
  createTierMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userTier = this.getUserTier(request);
        const tierConfig = this.tiers[userTier];
        
        // Add tier info to request
        (request as any).rateLimitTier = userTier;
        (request as any).rateLimitConfig = tierConfig;
        
        // Set tier headers
        reply.header('X-RateLimit-Tier', userTier);
        reply.header('X-RateLimit-Tier-Minute', tierConfig.limits.perMinute.toString());
        reply.header('X-RateLimit-Tier-Hour', tierConfig.limits.perHour.toString());
        reply.header('X-RateLimit-Tier-Day', tierConfig.limits.perDay.toString());
        
        // Apply tier-specific rules
        const rules = this.createTierRules(request);
        
        for (const rule of rules) {
          // Check if rule applies to current endpoint
          if (typeof rule.endpoint === 'string') {
            if (rule.endpoint === '*' || request.url.includes(rule.endpoint)) {
              await this.checkRateLimit(request, reply, rule, this.getClientIP(request));
            }
          } else if (rule.endpoint instanceof RegExp) {
            if (rule.endpoint.test(request.url)) {
              await this.checkRateLimit(request, reply, rule, this.getClientIP(request));
            }
          }
        }
        
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        
        request.log.error({ error }, 'Tier-based rate limiting error');
        // Don't block on rate limiting errors, just log them
      }
    };
  }
  
  // Get usage statistics for a user
  async getUserUsageStats(userId: string): Promise<{
    tier: UserTier;
    usage: {
      perMinute: number;
      perHour: number;
      perDay: number;
    };
    limits: RateLimitTier['limits'];
    percentUsed: {
      perMinute: number;
      perHour: number;
      perDay: number;
    };
  }> {
    // Implementation would fetch from Redis
    // This is a placeholder for the actual implementation
    const tier = UserTier.FREE; // Would be determined from user data
    const tierConfig = this.tiers[tier];
    
    return {
      tier,
      usage: {
        perMinute: 0,
        perHour: 0,
        perDay: 0
      },
      limits: tierConfig.limits,
      percentUsed: {
        perMinute: 0,
        perHour: 0,
        perDay: 0
      }
    };
  }
  
  // Upgrade user tier (for premium subscriptions)
  async upgradeUserTier(userId: string, newTier: UserTier): Promise<void> {
    // Implementation would update user data and clear existing rate limits
    // This allows immediate access to higher limits
    if (this.redis) {
      const keys = await this.redis.keys(`*:${userId}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
  
  private getClientIP(request: FastifyRequest): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (request.headers['x-real-ip'] as string) ||
           request.ip ||
           'unknown';
  }
  
  // Check rate limit implementation (simplified - would use parent class method)
  private async checkRateLimit(
    request: FastifyRequest,
    reply: FastifyReply,
    rule: RateLimitRule,
    clientIP: string
  ): Promise<void> {
    // This would delegate to the parent class implementation
    // For now, just a placeholder
  }
}

// Export factory function
export const createComprehensiveRateLimiting = (options: { redis?: Redis }) => {
  const service = new ComprehensiveRateLimitingService(options);
  return service.createTierMiddleware();
};

export default {
  ComprehensiveRateLimitingService,
  createComprehensiveRateLimiting,
  RATE_LIMIT_TIERS,
  UserTier
};