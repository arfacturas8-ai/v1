import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

/**
 * Response Caching Middleware
 * 
 * Provides intelligent response caching with:
 * - Redis-backed distributed caching
 * - ETag and Last-Modified support
 * - Conditional request handling
 * - Cache invalidation strategies
 * - Performance monitoring
 * - User-aware caching
 */

interface CacheOptions {
  // Cache TTL in seconds
  ttl?: number;
  // Cache key prefix
  keyPrefix?: string;
  // Whether to include user ID in cache key
  userSpecific?: boolean;
  // Custom cache key generator
  keyGenerator?: (request: FastifyRequest) => string;
  // Skip caching based on request
  skip?: (request: FastifyRequest) => boolean;
  // Vary headers for cache differentiation
  vary?: string[];
  // Enable ETag generation
  etag?: boolean;
  // Enable Last-Modified header
  lastModified?: boolean;
  // Cache only successful responses
  successOnly?: boolean;
  // Custom cache control header
  cacheControl?: string;
  // Compression for cached data
  compress?: boolean;
}

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: any;
  etag?: string;
  lastModified?: string;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
}

// Default cache configuration
const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 300, // 5 minutes
  keyPrefix: 'api_cache',
  userSpecific: false,
  keyGenerator: (request) => `${request.method}:${request.url}`,
  skip: () => false,
  vary: [],
  etag: true,
  lastModified: true,
  successOnly: true,
  cacheControl: 'public, max-age=300',
  compress: true
};

export class ResponseCacheManager {
  private hits = 0;
  private misses = 0;
  private errors = 0;

  constructor(private redis: Redis) {}

  /**
   * Create cache middleware with options
   */
  createCacheMiddleware(options: CacheOptions = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };

    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip caching if configured to do so
      if (config.skip(request)) {
        return;
      }

      // Skip caching for non-GET requests
      if (request.method !== 'GET') {
        return;
      }

      const cacheKey = this.generateCacheKey(request, config);
      
      try {
        // Try to get cached response
        const cachedData = await this.getCachedResponse(cacheKey);
        
        if (cachedData) {
          // Handle conditional requests
          if (this.handleConditionalRequest(request, reply, cachedData)) {
            this.hits++;
            return; // Response already sent
          }
          
          // Send cached response
          this.sendCachedResponse(reply, cachedData, config);
          this.hits++;
          return;
        }

        this.misses++;

        // Intercept response to cache it
        this.interceptResponse(request, reply, cacheKey, config);
      } catch (error) {
        this.errors++;
        request.log.error('Cache middleware error:', error);
        // Continue without caching
      }
    };
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: FastifyRequest, config: Required<CacheOptions>): string {
    let key = `${config.keyPrefix}:${config.keyGenerator(request)}`;

    // Add user ID if user-specific caching is enabled
    if (config.userSpecific && request.userId) {
      key += `:user:${request.userId}`;
    }

    // Add vary headers to key
    if (config.vary.length > 0) {
      const varyValues = config.vary
        .map(header => `${header}:${request.headers[header.toLowerCase()] || ''}`)
        .join('|');
      key += `:vary:${varyValues}`;
    }

    // Add query parameters to key (sorted for consistency)
    const queryKeys = Object.keys(request.query as any).sort();
    if (queryKeys.length > 0) {
      const queryString = queryKeys
        .map(key => `${key}=${(request.query as any)[key]}`)
        .join('&');
      key += `:query:${Buffer.from(queryString).toString('base64')}`;
    }

    return key;
  }

  /**
   * Get cached response from Redis
   */
  private async getCachedResponse(cacheKey: string): Promise<CachedResponse | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (!cached) return null;

      const data: CachedResponse = JSON.parse(cached);
      
      // Check if cache has expired
      if (Date.now() - data.timestamp > data.ttl * 1000) {
        await this.redis.del(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Handle conditional requests (304 Not Modified)
   */
  private handleConditionalRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    cached: CachedResponse
  ): boolean {
    const ifNoneMatch = request.headers['if-none-match'];
    const ifModifiedSince = request.headers['if-modified-since'];

    // Check ETag
    if (ifNoneMatch && cached.etag) {
      if (ifNoneMatch === cached.etag || ifNoneMatch === '*') {
        reply.code(304).send();
        return true;
      }
    }

    // Check Last-Modified
    if (ifModifiedSince && cached.lastModified) {
      const clientDate = new Date(ifModifiedSince);
      const cacheDate = new Date(cached.lastModified);
      
      if (clientDate >= cacheDate) {
        reply.code(304).send();
        return true;
      }
    }

    return false;
  }

  /**
   * Send cached response
   */
  private sendCachedResponse(
    reply: FastifyReply,
    cached: CachedResponse,
    config: Required<CacheOptions>
  ) {
    // Set status code
    reply.code(cached.statusCode);

    // Set headers
    Object.entries(cached.headers).forEach(([key, value]) => {
      reply.header(key, value);
    });

    // Set cache headers
    if (config.etag && cached.etag) {
      reply.header('etag', cached.etag);
    }

    if (config.lastModified && cached.lastModified) {
      reply.header('last-modified', cached.lastModified);
    }

    reply.header('cache-control', config.cacheControl);
    reply.header('x-cache', 'HIT');

    // Set age header
    const age = Math.floor((Date.now() - cached.timestamp) / 1000);
    reply.header('age', age.toString());

    // Send body (decompress if needed)
    let body = cached.body;
    if (cached.compressed && typeof body === 'string') {
      try {
        body = JSON.parse(Buffer.from(body, 'base64').toString());
      } catch {
        // If decompression fails, use as-is
      }
    }

    reply.send(body);
  }

  /**
   * Intercept response to cache it
   */
  private interceptResponse(
    request: FastifyRequest,
    reply: FastifyReply,
    cacheKey: string,
    config: Required<CacheOptions>
  ) {
    const originalSend = reply.send.bind(reply);

    reply.send = function(payload: any) {
      // Only cache successful responses if configured
      const statusCode = reply.statusCode;
      if (config.successOnly && (statusCode < 200 || statusCode >= 300)) {
        return originalSend(payload);
      }

      // Prepare cached response
      const now = Date.now();
      const headers: Record<string, string | string[]> = {};
      
      // Copy relevant headers
      Object.entries(reply.getHeaders()).forEach(([key, value]) => {
        if (!['set-cookie', 'authorization'].includes(key.toLowerCase())) {
          headers[key] = value as string | string[];
        }
      });

      // Generate ETag if enabled
      let etag: string | undefined;
      if (config.etag) {
        const hash = require('crypto')
          .createHash('md5')
          .update(JSON.stringify(payload))
          .digest('hex');
        etag = `"${hash}"`;
        reply.header('etag', etag);
      }

      // Set Last-Modified if enabled
      let lastModified: string | undefined;
      if (config.lastModified) {
        lastModified = new Date(now).toUTCString();
        reply.header('last-modified', lastModified);
      }

      // Set cache control
      reply.header('cache-control', config.cacheControl);
      reply.header('x-cache', 'MISS');

      // Prepare body for caching
      let bodyToCache = payload;
      let compressed = false;

      if (config.compress && typeof payload === 'object') {
        try {
          bodyToCache = Buffer.from(JSON.stringify(payload)).toString('base64');
          compressed = true;
        } catch {
          // If compression fails, cache as-is
        }
      }

      const cacheData: CachedResponse = {
        statusCode,
        headers,
        body: bodyToCache,
        etag,
        lastModified,
        timestamp: now,
        ttl: config.ttl,
        compressed
      };

      // Cache the response asynchronously
      setImmediate(() => {
        this.cacheResponse(cacheKey, cacheData, config.ttl);
      });

      return originalSend(payload);
    }.bind(this);
  }

  /**
   * Cache response in Redis
   */
  private async cacheResponse(
    cacheKey: string,
    data: CachedResponse,
    ttl: number
  ) {
    try {
      await this.redis.setex(
        cacheKey,
        ttl,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      console.error('Error invalidating cache pattern:', error);
      return 0;
    }
  }

  /**
   * Invalidate specific cache key
   */
  async invalidateKey(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Error invalidating cache key:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<number> {
    return this.invalidatePattern('api_cache:*');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    errors: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  constructor(private cacheManager: ResponseCacheManager) {}

  /**
   * Invalidate user-specific cache
   */
  async invalidateUser(userId: string): Promise<number> {
    return this.cacheManager.invalidatePattern(`*:user:${userId}*`);
  }

  /**
   * Invalidate resource cache
   */
  async invalidateResource(resource: string, id?: string): Promise<number> {
    const pattern = id 
      ? `*:/${resource}/${id}*`
      : `*:/${resource}*`;
    return this.cacheManager.invalidatePattern(pattern);
  }

  /**
   * Invalidate endpoint cache
   */
  async invalidateEndpoint(method: string, path: string): Promise<number> {
    const pattern = `*:${method.toUpperCase()}:${path}*`;
    return this.cacheManager.invalidatePattern(pattern);
  }
}

/**
 * Predefined cache configurations
 */
export const CacheConfigs = {
  // Static content cache (long TTL)
  static: {
    ttl: 3600, // 1 hour
    cacheControl: 'public, max-age=3600, immutable'
  },

  // User profile cache (medium TTL, user-specific)
  userProfile: {
    ttl: 600, // 10 minutes
    userSpecific: true,
    cacheControl: 'private, max-age=600'
  },

  // Public content cache (short TTL)
  publicContent: {
    ttl: 300, // 5 minutes
    cacheControl: 'public, max-age=300'
  },

  // Search results cache (very short TTL)
  search: {
    ttl: 60, // 1 minute
    vary: ['authorization'],
    cacheControl: 'public, max-age=60'
  },

  // API data cache (with ETag)
  apiData: {
    ttl: 900, // 15 minutes
    etag: true,
    lastModified: true,
    cacheControl: 'public, max-age=900'
  }
};

/**
 * Factory function to create cache manager
 */
export function createCacheManager(redis: Redis): ResponseCacheManager {
  return new ResponseCacheManager(redis);
}

/**
 * Middleware factory for common cache patterns
 */
export function createCacheMiddleware(
  redis: Redis,
  options: CacheOptions = {}
) {
  const cacheManager = createCacheManager(redis);
  return cacheManager.createCacheMiddleware(options);
}