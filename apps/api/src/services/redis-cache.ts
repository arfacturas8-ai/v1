import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
  serialize?: boolean;
}

export interface PubSubMessage {
  type: string;
  data: any;
  timestamp: Date;
  source?: string;
}

/**
 * Enhanced Redis Cache and Pub/Sub Service for Discord-like Application
 * 
 * Features:
 * - Intelligent caching with TTL
 * - Pub/Sub for real-time events
 * - Session management
 * - Rate limiting
 * - Presence tracking
 * - Message queuing
 * - Performance analytics
 */
export class RedisCacheService {
  private redis: Redis;
  private pubClient: Redis;
  private subClient: Redis;
  private subscribers: Map<string, Set<(message: PubSubMessage) => void>> = new Map();
  private defaultTTL = 3600; // 1 hour
  private keyPrefix = 'cryb:';

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);
    
    this.setupSubscriptionHandlers();
    this.setupHealthCheck();
  }

  private setupSubscriptionHandlers() {
    this.subClient.on('message', (channel: string, message: string) => {
      try {
        const parsedMessage: PubSubMessage = JSON.parse(message);
        const handlers = this.subscribers.get(channel);
        
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(parsedMessage);
            } catch (error) {
              console.error(`Error in pub/sub handler for channel ${channel}:`, error);
            }
          });
        }
      } catch (error) {
        console.error(`Error parsing pub/sub message from ${channel}:`, error);
      }
    });
  }

  private setupHealthCheck() {
    setInterval(async () => {
      try {
        await this.redis.ping();
      } catch (error) {
        console.error('Redis health check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  private getKey(key: string, prefix?: string): string {
    return `${this.keyPrefix}${prefix || ''}${key}`;
  }

  // ============================================
  // BASIC CACHE OPERATIONS
  // ============================================

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.getKey(key, options.prefix);
    const ttl = options.ttl || this.defaultTTL;
    
    let serializedValue: string;
    
    if (options.serialize !== false) {
      serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    } else {
      serializedValue = value;
    }

    if (options.compress && serializedValue.length > 1000) {
      // Could implement compression here if needed
    }

    if (ttl > 0) {
      await this.redis.setex(fullKey, ttl, serializedValue);
    } else {
      await this.redis.set(fullKey, serializedValue);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.getKey(key, options.prefix);
    const value = await this.redis.get(fullKey);
    
    if (!value) return null;

    if (options.serialize !== false) {
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    }
    
    return value as T;
  }

  /**
   * Delete a key from cache
   */
  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.getKey(key, options.prefix);
    const result = await this.redis.del(fullKey);
    return result > 0;
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.getKey(key, options.prefix);
    const result = await this.redis.exists(fullKey);
    return result > 0;
  }

  /**
   * Get multiple keys
   */
  async mget<T = any>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    const fullKeys = keys.map(key => this.getKey(key, options.prefix));
    const values = await this.redis.mget(...fullKeys);
    
    return values.map(value => {
      if (!value) return null;
      
      if (options.serialize !== false) {
        try {
          return JSON.parse(value);
        } catch {
          return value as T;
        }
      }
      
      return value as T;
    });
  }

  /**
   * Set multiple keys
   */
  async mset(keyValuePairs: Record<string, any>, options: CacheOptions = {}): Promise<void> {
    const pipeline = this.redis.pipeline();
    const ttl = options.ttl || this.defaultTTL;
    
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      const fullKey = this.getKey(key, options.prefix);
      const serializedValue = options.serialize !== false ? 
        (typeof value === 'string' ? value : JSON.stringify(value)) : value;
      
      if (ttl > 0) {
        pipeline.setex(fullKey, ttl, serializedValue);
      } else {
        pipeline.set(fullKey, serializedValue);
      }
    });
    
    await pipeline.exec();
  }

  // ============================================
  // SPECIALIZED CACHE OPERATIONS
  // ============================================

  /**
   * Cache with automatic refresh
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }
    
    const fresh = await fetchFunction();
    await this.set(key, fresh, options);
    return fresh;
  }

  /**
   * Increment a counter
   */
  async incr(key: string, options: CacheOptions = {}): Promise<number> {
    const fullKey = this.getKey(key, options.prefix);
    return await this.redis.incr(fullKey);
  }

  /**
   * Increment by a specific amount
   */
  async incrBy(key: string, amount: number, options: CacheOptions = {}): Promise<number> {
    const fullKey = this.getKey(key, options.prefix);
    return await this.redis.incrby(fullKey, amount);
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.getKey(key, options.prefix);
    const result = await this.redis.expire(fullKey, ttl);
    return result === 1;
  }

  // ============================================
  // LIST OPERATIONS
  // ============================================

  /**
   * Push to list (left)
   */
  async lpush(key: string, ...values: any[]): Promise<number> {
    const fullKey = this.getKey(key);
    const serializedValues = values.map(v => 
      typeof v === 'string' ? v : JSON.stringify(v)
    );
    return await this.redis.lpush(fullKey, ...serializedValues);
  }

  /**
   * Pop from list (left)
   */
  async lpop<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const value = await this.redis.lpop(fullKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  /**
   * Get list range
   */
  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    const fullKey = this.getKey(key);
    const values = await this.redis.lrange(fullKey, start, stop);
    
    return values.map(value => {
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    });
  }

  /**
   * Get list length
   */
  async llen(key: string): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.redis.llen(fullKey);
  }

  // ============================================
  // SET OPERATIONS
  // ============================================

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.redis.sadd(fullKey, ...members);
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.redis.srem(fullKey, ...members);
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    const result = await this.redis.sismember(fullKey, member);
    return result === 1;
  }

  /**
   * Get all set members
   */
  async smembers(key: string): Promise<string[]> {
    const fullKey = this.getKey(key);
    return await this.redis.smembers(fullKey);
  }

  /**
   * Get set cardinality
   */
  async scard(key: string): Promise<number> {
    const fullKey = this.getKey(key);
    return await this.redis.scard(fullKey);
  }

  // ============================================
  // HASH OPERATIONS
  // ============================================

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: any): Promise<number> {
    const fullKey = this.getKey(key);
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    return await this.redis.hset(fullKey, field, serializedValue);
  }

  /**
   * Get hash field
   */
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const value = await this.redis.hget(fullKey, field);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall<T = Record<string, any>>(key: string): Promise<T> {
    const fullKey = this.getKey(key);
    const hash = await this.redis.hgetall(fullKey);
    
    const result: any = {};
    Object.entries(hash).forEach(([field, value]) => {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    });
    
    return result;
  }

  /**
   * Set multiple hash fields
   */
  async hmset(key: string, hash: Record<string, any>): Promise<void> {
    const fullKey = this.getKey(key);
    const serializedHash: Record<string, string> = {};
    
    Object.entries(hash).forEach(([field, value]) => {
      serializedHash[field] = typeof value === 'string' ? value : JSON.stringify(value);
    });
    
    await this.redis.hmset(fullKey, serializedHash);
  }

  // ============================================
  // PUB/SUB OPERATIONS
  // ============================================

  /**
   * Publish a message
   */
  async publish(channel: string, message: PubSubMessage): Promise<number> {
    const fullMessage = {
      ...message,
      timestamp: new Date(),
      source: 'api-server'
    };
    
    return await this.pubClient.publish(
      `${this.keyPrefix}channel:${channel}`,
      JSON.stringify(fullMessage)
    );
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, handler: (message: PubSubMessage) => void): Promise<void> {
    const fullChannel = `${this.keyPrefix}channel:${channel}`;
    
    if (!this.subscribers.has(fullChannel)) {
      this.subscribers.set(fullChannel, new Set());
      await this.subClient.subscribe(fullChannel);
    }
    
    this.subscribers.get(fullChannel)!.add(handler);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string, handler?: (message: PubSubMessage) => void): Promise<void> {
    const fullChannel = `${this.keyPrefix}channel:${channel}`;
    const handlers = this.subscribers.get(fullChannel);
    
    if (!handlers) return;
    
    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(fullChannel);
        await this.subClient.unsubscribe(fullChannel);
      }
    } else {
      this.subscribers.delete(fullChannel);
      await this.subClient.unsubscribe(fullChannel);
    }
  }

  // ============================================
  // APPLICATION-SPECIFIC OPERATIONS
  // ============================================

  /**
   * Cache user session
   */
  async cacheUserSession(userId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await this.set(`session:${userId}`, sessionData, { 
      ttl, 
      prefix: 'auth:' 
    });
  }

  /**
   * Get user session
   */
  async getUserSession(userId: string): Promise<any | null> {
    return await this.get(`session:${userId}`, { prefix: 'auth:' });
  }

  /**
   * Track user presence
   */
  async updatePresence(userId: string, status: string, activity?: string): Promise<void> {
    const presence = {
      status,
      activity,
      lastSeen: new Date(),
      timestamp: Date.now()
    };
    
    await this.hset(`presence:${userId}`, 'data', presence);
    await this.expire(`presence:${userId}`, 300); // 5 minutes
    
    // Broadcast presence update
    await this.publish('presence-updates', {
      type: 'presence_update',
      data: { userId, ...presence }
    });
  }

  /**
   * Get user presence
   */
  async getPresence(userId: string): Promise<any | null> {
    return await this.hget(`presence:${userId}`, 'data');
  }

  /**
   * Cache channel messages for quick access
   */
  async cacheChannelMessages(channelId: string, messages: any[], ttl: number = 1800): Promise<void> {
    await this.set(`messages:${channelId}:recent`, messages, { 
      ttl,
      prefix: 'cache:' 
    });
  }

  /**
   * Get cached channel messages
   */
  async getCachedChannelMessages(channelId: string): Promise<any[] | null> {
    return await this.get(`messages:${channelId}:recent`, { prefix: 'cache:' });
  }

  /**
   * Rate limiting
   */
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Clean old entries and add new one
    await this.redis.zremrangebyscore(key, 0, windowStart);
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, windowSeconds);
    
    const count = await this.redis.zcard(key);
    const resetTime = now + (windowSeconds * 1000);
    
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetTime
    };
  }

  /**
   * Store background job
   */
  async queueJob(queue: string, jobData: any, delay?: number): Promise<void> {
    const job = {
      id: `${Date.now()}-${Math.random()}`,
      data: jobData,
      createdAt: new Date(),
      delay: delay || 0
    };
    
    if (delay && delay > 0) {
      const runAt = Date.now() + delay;
      await this.redis.zadd(`queue:${queue}:delayed`, runAt, JSON.stringify(job));
    } else {
      await this.lpush(`queue:${queue}`, job);
    }
  }

  /**
   * Get next job from queue
   */
  async dequeueJob(queue: string): Promise<any | null> {
    // Check for delayed jobs first
    const now = Date.now();
    const delayedJobs = await this.redis.zrangebyscore(
      `queue:${queue}:delayed`, 
      0, 
      now, 
      'LIMIT', 0, 1
    );
    
    if (delayedJobs.length > 0) {
      const job = JSON.parse(delayedJobs[0]);
      await this.redis.zrem(`queue:${queue}:delayed`, delayedJobs[0]);
      return job;
    }
    
    // Get from regular queue
    return await this.lpop(`queue:${queue}`);
  }

  /**
   * Get analytics data
   */
  async getAnalytics(key: string, timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return await this.redis.zrangebyscore(
      `analytics:${key}`,
      startTime.getTime(),
      now.getTime()
    );
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: string, data: any): Promise<void> {
    const timestamp = Date.now();
    const eventData = {
      timestamp,
      data
    };
    
    await this.redis.zadd(
      `analytics:${event}`,
      timestamp,
      JSON.stringify(eventData)
    );
    
    // Keep only last 7 days of data
    const weekAgo = timestamp - (7 * 24 * 60 * 60 * 1000);
    await this.redis.zremrangebyscore(`analytics:${event}`, 0, weekAgo);
  }

  // ============================================
  // CLEANUP AND MAINTENANCE
  // ============================================

  /**
   * Clean up expired data
   */
  async cleanup(): Promise<void> {
    const patterns = [
      'cryb:cache:*',
      'cryb:temp:*',
      'cryb:analytics:*'
    ];
    
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        // Check TTL and remove expired keys
        const pipeline = this.redis.pipeline();
        keys.forEach(key => pipeline.ttl(key));
        
        const results = await pipeline.exec();
        const expiredKeys = keys.filter((_, index) => {
          const ttl = results?.[index]?.[1] as number;
          return ttl === -1 || ttl === 0; // -1 means no expiry, 0 means expired
        });
        
        if (expiredKeys.length > 0) {
          await this.redis.del(...expiredKeys);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: any;
    keyspace: any;
    connections: number;
    operations: any;
  }> {
    const info = await this.redis.info();
    const sections = info.split('\r\n\r\n');
    
    const stats: any = {};
    sections.forEach(section => {
      const lines = section.split('\r\n');
      const sectionName = lines[0].replace('# ', '');
      
      if (['Memory', 'Keyspace', 'Clients', 'Stats'].includes(sectionName)) {
        stats[sectionName.toLowerCase()] = {};
        lines.slice(1).forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            stats[sectionName.toLowerCase()][key] = isNaN(Number(value)) ? value : Number(value);
          }
        });
      }
    });
    
    return {
      memory: stats.memory || {},
      keyspace: stats.keyspace || {},
      connections: stats.clients?.connected_clients || 0,
      operations: stats.stats || {}
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await Promise.all([
      this.redis.quit(),
      this.pubClient.quit(),
      this.subClient.quit()
    ]);
  }
}

/**
 * Factory function to create Redis cache service
 */
export function createRedisCacheService(redisUrl: string): RedisCacheService {
  return new RedisCacheService(redisUrl);
}

/**
 * Fastify plugin for Redis cache service
 */
export async function redisCachePlugin(fastify: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
  const cacheService = createRedisCacheService(redisUrl);
  
  fastify.decorate('cache', cacheService);
  
  // Add cleanup on server close
  fastify.addHook('onClose', async () => {
    await cacheService.close();
  });
  
  console.log('✅ Redis Cache Service initialized');
}