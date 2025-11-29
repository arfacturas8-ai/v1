// Multi-Tier Cache Manager - Enables 100K concurrent users
// Based on CRYB Technical Specification Section 11.2

import Redis from 'ioredis';

interface CacheItem {
  value: any;
  expires: number;
  hits: number;
}

interface CacheStats {
  l1Size: number;
  l1MaxSize: number;
  l1HitRate: number;
  l1MemoryUsage: number;
  l2Hits?: number;
  l2Misses?: number;
}

export class MultiTierCacheManager {
  private l1Cache: Map<string, CacheItem> = new Map(); // In-memory L1 cache
  private redis: Redis; // L2 distributed cache
  private maxL1Size: number = 10000;
  private defaultTTL: number = 300; // 5 minutes
  private l2Hits: number = 0;
  private l2Misses: number = 0;

  constructor(redis: Redis) {
    this.redis = redis;
    this.startL1Cleanup();
  }

  // L1 Cache (In-memory) - Sub-millisecond access
  private setL1(key: string, value: any, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.l1Cache.size >= this.maxL1Size) {
      const firstKey = this.l1Cache.keys().next().value;
      this.l1Cache.delete(firstKey);
    }

    this.l1Cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000),
      hits: 0
    });
  }

  private getL1(key: string): any | null {
    const item = this.l1Cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.l1Cache.delete(key);
      return null;
    }

    item.hits++;
    return item.value;
  }

  // L2 Cache (Redis) - Distributed cache
  private async setL2(key: string, value: any, ttl: number): Promise<void> {
    const serialized = JSON.stringify({
      value,
      type: typeof value,
      timestamp: Date.now()
    });

    await this.redis.setex(key, ttl, serialized);
  }

  private async getL2(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) {
        this.l2Misses++;
        return null;
      }

      this.l2Hits++;
      const parsed = JSON.parse(cached);
      return parsed.value;
    } catch (error) {
      console.error('L2 cache error:', error);
      this.l2Misses++;
      return null;
    }
  }

  // Unified cache interface
  async get(key: string): Promise<any | null> {
    // Try L1 first (sub-millisecond)
    const l1Result = this.getL1(key);
    if (l1Result !== null) {
      return l1Result;
    }

    // Try L2 (few milliseconds)
    const l2Result = await this.getL2(key);
    if (l2Result !== null) {
      // Promote to L1 for faster future access
      this.setL1(key, l2Result, this.defaultTTL);
      return l2Result;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    // Set in both L1 and L2
    this.setL1(key, value, ttl);
    await this.setL2(key, value, ttl);
  }

  // Cache-aside pattern with fallback
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Try cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute fallback (database query)
    const result = await fallback();

    // Cache the result
    await this.set(key, result, ttl);

    return result;
  }

  // Pattern-based cache invalidation
  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate L1 cache
    const l1Keys = Array.from(this.l1Cache.keys());
    const regex = new RegExp(pattern.replace('*', '.*'));

    l1Keys.forEach(key => {
      if (regex.test(key)) {
        this.l1Cache.delete(key);
      }
    });

    // Invalidate L2 cache using Lua script for performance
    const luaScript = `
      local keys = redis.call('KEYS', ARGV[1])
      local count = 0
      for i=1, #keys do
        redis.call('DEL', keys[i])
        count = count + 1
      end
      return count
    `;

    try {
      await this.redis.eval(luaScript, 0, pattern);
    } catch (error) {
      console.error('Pattern invalidation error:', error);
    }
  }

  // Bulk operations for better performance
  async mget(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const l2Keys: string[] = [];

    // Check L1 first
    keys.forEach(key => {
      const l1Result = this.getL1(key);
      if (l1Result !== null) {
        result[key] = l1Result;
      } else {
        l2Keys.push(key);
      }
    });

    // Check L2 for remaining keys
    if (l2Keys.length > 0) {
      const l2Results = await this.redis.mget(...l2Keys);

      l2Keys.forEach((key, index) => {
        if (l2Results[index]) {
          try {
            const parsed = JSON.parse(l2Results[index]!);
            result[key] = parsed.value;

            // Promote to L1
            this.setL1(key, parsed.value, this.defaultTTL);
          } catch (error) {
            console.error('Error parsing cached value:', error);
          }
        }
      });
    }

    return result;
  }

  async mset(items: Record<string, any>, ttl: number = this.defaultTTL): Promise<void> {
    // Set in L1
    Object.entries(items).forEach(([key, value]) => {
      this.setL1(key, value, ttl);
    });

    // Set in L2 using pipeline for performance
    const pipeline = this.redis.pipeline();

    Object.entries(items).forEach(([key, value]) => {
      const serialized = JSON.stringify({
        value,
        type: typeof value,
        timestamp: Date.now()
      });
      pipeline.setex(key, ttl, serialized);
    });

    await pipeline.exec();
  }

  // Cache warming for frequently accessed data
  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const key of keys) {
      try {
        const value = await fetcher(key);
        this.setL1(key, value, this.defaultTTL);

        const serialized = JSON.stringify({
          value,
          type: typeof value,
          timestamp: Date.now()
        });
        pipeline.setex(key, this.defaultTTL, serialized);
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error);
      }
    }

    await pipeline.exec();
  }

  // Cache statistics - Critical for monitoring 100K users
  getStats(): CacheStats {
    let totalHits = 0;
    let totalItems = this.l1Cache.size;

    this.l1Cache.forEach(item => {
      totalHits += item.hits;
    });

    const l1HitRate = totalItems > 0 ? totalHits / totalItems : 0;
    const totalL2Requests = this.l2Hits + this.l2Misses;
    const l2HitRate = totalL2Requests > 0 ? this.l2Hits / totalL2Requests : 0;

    console.log(`📊 Cache Stats: L1=${(l1HitRate*100).toFixed(1)}% L2=${(l2HitRate*100).toFixed(1)}% Size=${totalItems}/${this.maxL1Size}`);

    return {
      l1Size: totalItems,
      l1MaxSize: this.maxL1Size,
      l1HitRate,
      l1MemoryUsage: this.estimateL1MemoryUsage(),
      l2Hits: this.l2Hits,
      l2Misses: this.l2Misses
    };
  }

  private estimateL1MemoryUsage(): number {
    // Rough estimation of memory usage
    let size = 0;
    this.l1Cache.forEach((item, key) => {
      size += key.length * 2; // UTF-16 encoding
      size += JSON.stringify(item.value).length * 2;
      size += 24; // Object overhead
    });
    return size;
  }

  // Cleanup expired L1 cache entries
  private startL1Cleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.l1Cache.forEach((item, key) => {
        if (now > item.expires) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.l1Cache.delete(key));

      // Log cleanup if significant
      if (keysToDelete.length > 100) {
        console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`);
      }
    }, 60000); // Every minute
  }

  // Clear all caches (use with caution)
  async clear(): Promise<void> {
    this.l1Cache.clear();
    await this.redis.flushdb();
    console.log('🗑️  All caches cleared');
  }
}

// Export singleton instance
let cacheInstance: MultiTierCacheManager | null = null;

export function initializeCache(redis: Redis): MultiTierCacheManager {
  if (!cacheInstance) {
    cacheInstance = new MultiTierCacheManager(redis);
    console.log('✅ Multi-tier cache initialized for 100K users');
  }
  return cacheInstance;
}

export function getCache(): MultiTierCacheManager {
  if (!cacheInstance) {
    throw new Error('Cache not initialized. Call initializeCache first.');
  }
  return cacheInstance;
}
