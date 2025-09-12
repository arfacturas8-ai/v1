export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  staleWhileRevalidate?: number; // Time in ms to serve stale data while revalidating
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly options: Required<CacheOptions>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(options: CacheOptions) {
    this.options = {
      ttl: options.ttl,
      maxSize: options.maxSize || 1000,
      staleWhileRevalidate: options.staleWhileRevalidate || 0
    };

    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.min(this.options.ttl / 4, 60000)); // Cleanup every TTL/4 or 1 minute max
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry is expired
    if (now > entry.expiresAt) {
      // Check if we can serve stale data
      if (this.options.staleWhileRevalidate > 0 && 
          now <= entry.expiresAt + this.options.staleWhileRevalidate) {
        return entry.data; // Return stale data
      }
      
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl || this.options.ttl;
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      expiresAt: now + ttl,
      createdAt: now
    });
  }

  /**
   * Check if entry exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() <= entry.expiresAt;
  }

  /**
   * Check if entry exists (including expired)
   */
  exists(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set pattern with async loader
   */
  async getOrSet<K>(
    key: string,
    loader: () => Promise<K>,
    customTtl?: number
  ): Promise<K> {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached as K;
    }

    // Load data
    try {
      const data = await loader();
      this.set(key, data as T, customTtl);
      return data;
    } catch (error) {
      // If we have stale data, return it during error
      const entry = this.cache.get(key);
      if (entry && this.options.staleWhileRevalidate > 0) {
        return entry.data as K;
      }
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalMemoryUsage = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
      
      // Rough memory usage calculation
      totalMemoryUsage += key.length * 2; // String overhead
      totalMemoryUsage += JSON.stringify(entry.data).length * 2; // Data size approximation
      totalMemoryUsage += 32; // Entry overhead
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRatio: validEntries / Math.max(this.cache.size, 1),
      approximateMemoryUsage: totalMemoryUsage,
      maxSize: this.options.maxSize,
      ttl: this.options.ttl
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt + (this.options.staleWhileRevalidate || 0)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Remove oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Specialized cache managers for different data types
export class NFTMetadataCache extends CacheManager<any> {
  constructor() {
    super({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 500,
      staleWhileRevalidate: 30 * 60 * 1000 // 30 minutes stale-while-revalidate
    });
  }

  getCacheKey(contractAddress: string, tokenId: string, chain: string): string {
    return `nft:${chain}:${contractAddress.toLowerCase()}:${tokenId}`;
  }
}

export class TokenBalanceCache extends CacheManager<string> {
  constructor() {
    super({
      ttl: 2 * 60 * 1000, // 2 minutes for balances
      maxSize: 1000,
      staleWhileRevalidate: 10 * 60 * 1000 // 10 minutes stale-while-revalidate
    });
  }

  getCacheKey(tokenAddress: string, walletAddress: string, chain: string): string {
    return `balance:${chain}:${tokenAddress.toLowerCase()}:${walletAddress.toLowerCase()}`;
  }
}

export class BlockchainDataCache extends CacheManager<any> {
  constructor() {
    super({
      ttl: 30 * 1000, // 30 seconds for blockchain data
      maxSize: 200,
      staleWhileRevalidate: 5 * 60 * 1000 // 5 minutes stale-while-revalidate
    });
  }

  getCacheKey(operation: string, ...params: string[]): string {
    return `blockchain:${operation}:${params.join(':')}`;
  }
}

// Global cache instances
export const nftMetadataCache = new NFTMetadataCache();
export const tokenBalanceCache = new TokenBalanceCache();
export const blockchainDataCache = new BlockchainDataCache();