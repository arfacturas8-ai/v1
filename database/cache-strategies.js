/**
 * CRYB Platform Advanced Caching Strategies
 * Distributed caching patterns for Reddit/Discord scale performance
 * Author: Database Infrastructure Team
 * Version: 1.0
 */

const Redis = require('ioredis');
const { EventEmitter } = require('events');

// ==========================================
// REDIS CLUSTER CONFIGURATION
// ==========================================

class CacheManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.cluster = new Redis.Cluster([
            { host: '172.30.0.11', port: 6379 },
            { host: '172.30.0.12', port: 6379 },
            { host: '172.30.0.13', port: 6379 },
            { host: '172.30.0.14', port: 6379 },
            { host: '172.30.0.15', port: 6379 },
            { host: '172.30.0.16', port: 6379 }
        ], {
            redisOptions: {
                password: process.env.REDIS_PASSWORD,
                connectTimeout: 10000,
                lazyConnect: true,
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 200,
                enableOfflineQueue: false,
                keepAlive: 30000
            },
            dnsLookup: (address, callback) => callback(null, address),
            enableReadyCheck: false,
            maxRedirections: 16,
            scaleReads: 'slave',
            slotsRefreshTimeout: 10000,
            slotsRefreshInterval: 5000
        });

        // Cache configuration
        this.config = {
            defaultTTL: options.defaultTTL || 3600, // 1 hour
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 100,
            compression: options.compression || true,
            serialization: options.serialization || 'json',
            keyPrefix: options.keyPrefix || 'cryb:',
            ...options
        };

        // Initialize event handlers
        this._setupEventHandlers();
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
    }

    _setupEventHandlers() {
        this.cluster.on('connect', () => {
            console.log('✅ Redis cluster connected');
            this.emit('connected');
        });

        this.cluster.on('error', (error) => {
            console.error('❌ Redis cluster error:', error);
            this.stats.errors++;
            this.emit('error', error);
        });

        this.cluster.on('node error', (error, node) => {
            console.error(`❌ Redis node error on ${node.options.host}:${node.options.port}:`, error);
        });
    }

    // ==========================================
    // CORE CACHING OPERATIONS
    // ==========================================

    /**
     * Get value from cache with automatic deserialization
     */
    async get(key, options = {}) {
        try {
            const fullKey = this._buildKey(key);
            const value = await this.cluster.get(fullKey);
            
            if (value === null) {
                this.stats.misses++;
                return null;
            }

            this.stats.hits++;
            return this._deserialize(value);
        } catch (error) {
            this.stats.errors++;
            if (options.throwOnError) throw error;
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache with automatic serialization and TTL
     */
    async set(key, value, ttl = null, options = {}) {
        try {
            const fullKey = this._buildKey(key);
            const serializedValue = this._serialize(value);
            const cacheTTL = ttl || this.config.defaultTTL;

            let result;
            if (cacheTTL > 0) {
                result = await this.cluster.setex(fullKey, cacheTTL, serializedValue);
            } else {
                result = await this.cluster.set(fullKey, serializedValue);
            }

            this.stats.sets++;
            
            // Emit cache set event for invalidation listeners
            this.emit('cache:set', { key: fullKey, value, ttl: cacheTTL });
            
            return result === 'OK';
        } catch (error) {
            this.stats.errors++;
            if (options.throwOnError) throw error;
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Delete key from cache
     */
    async del(key, options = {}) {
        try {
            const fullKey = this._buildKey(key);
            const result = await this.cluster.del(fullKey);
            
            this.stats.deletes++;
            this.emit('cache:delete', { key: fullKey });
            
            return result > 0;
        } catch (error) {
            this.stats.errors++;
            if (options.throwOnError) throw error;
            console.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Get multiple keys at once
     */
    async mget(keys) {
        try {
            const fullKeys = keys.map(key => this._buildKey(key));
            const pipeline = this.cluster.pipeline();
            
            fullKeys.forEach(key => pipeline.get(key));
            const results = await pipeline.exec();
            
            return results.map(([error, value], index) => {
                if (error) {
                    this.stats.errors++;
                    return null;
                }
                if (value === null) {
                    this.stats.misses++;
                    return null;
                }
                this.stats.hits++;
                return this._deserialize(value);
            });
        } catch (error) {
            this.stats.errors++;
            console.error('Cache mget error:', error);
            return keys.map(() => null);
        }
    }

    // ==========================================
    // ADVANCED CACHING PATTERNS
    // ==========================================

    /**
     * Cache-aside pattern with automatic data loading
     */
    async getOrSet(key, dataLoader, ttl = null, options = {}) {
        // Try to get from cache first
        let value = await this.get(key, options);
        
        if (value !== null) {
            return value;
        }

        // Data not in cache, load from source
        try {
            value = await dataLoader();
            
            if (value !== null && value !== undefined) {
                await this.set(key, value, ttl, options);
            }
            
            return value;
        } catch (error) {
            console.error('Data loader error:', error);
            if (options.throwOnError) throw error;
            return null;
        }
    }

    /**
     * Write-through caching pattern
     */
    async writeThrough(key, value, dataWriter, ttl = null, options = {}) {
        try {
            // Write to primary data store first
            await dataWriter(value);
            
            // Then update cache
            await this.set(key, value, ttl, options);
            
            return true;
        } catch (error) {
            console.error('Write-through error:', error);
            if (options.throwOnError) throw error;
            return false;
        }
    }

    /**
     * Write-behind (write-back) caching pattern
     */
    async writeBehind(key, value, ttl = null, options = {}) {
        try {
            // Update cache immediately
            await this.set(key, value, ttl, options);
            
            // Queue write to primary data store
            await this._queueWrite(key, value, options);
            
            return true;
        } catch (error) {
            console.error('Write-behind error:', error);
            if (options.throwOnError) throw error;
            return false;
        }
    }

    /**
     * Distributed locking for cache stampede prevention
     */
    async withLock(lockKey, operation, lockTTL = 30, options = {}) {
        const fullLockKey = this._buildKey(`lock:${lockKey}`);
        const lockValue = `${Date.now()}-${Math.random()}`;
        
        try {
            // Acquire lock
            const acquired = await this.cluster.set(
                fullLockKey, 
                lockValue, 
                'EX', 
                lockTTL, 
                'NX'
            );
            
            if (acquired !== 'OK') {
                // Lock not acquired, either wait or return cached value
                if (options.waitForLock) {
                    await this._waitForLock(fullLockKey, options.maxWaitTime || 5000);
                    return await operation();
                } else {
                    throw new Error('Could not acquire lock');
                }
            }

            // Execute operation with lock held
            const result = await operation();
            
            return result;
        } finally {
            // Release lock using Lua script to ensure atomicity
            const script = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;
            await this.cluster.eval(script, 1, fullLockKey, lockValue);
        }
    }

    // ==========================================
    // CACHE INVALIDATION PATTERNS
    // ==========================================

    /**
     * Tag-based invalidation system
     */
    async setWithTags(key, value, tags = [], ttl = null, options = {}) {
        const pipeline = this.cluster.pipeline();
        const fullKey = this._buildKey(key);
        const serializedValue = this._serialize(value);
        const cacheTTL = ttl || this.config.defaultTTL;

        // Set the main cache entry
        if (cacheTTL > 0) {
            pipeline.setex(fullKey, cacheTTL, serializedValue);
        } else {
            pipeline.set(fullKey, serializedValue);
        }

        // Add key to tag sets
        tags.forEach(tag => {
            const tagKey = this._buildKey(`tag:${tag}`);
            pipeline.sadd(tagKey, fullKey);
            if (cacheTTL > 0) {
                pipeline.expire(tagKey, cacheTTL + 300); // Tags live slightly longer
            }
        });

        await pipeline.exec();
        
        this.stats.sets++;
        this.emit('cache:set:tagged', { key: fullKey, value, tags, ttl: cacheTTL });
        
        return true;
    }

    /**
     * Invalidate all keys with specific tags
     */
    async invalidateByTags(tags) {
        const pipeline = this.cluster.pipeline();
        
        for (const tag of tags) {
            const tagKey = this._buildKey(`tag:${tag}`);
            
            // Get all keys with this tag
            const keys = await this.cluster.smembers(tagKey);
            
            // Delete all tagged keys
            if (keys.length > 0) {
                keys.forEach(key => pipeline.del(key));
                this.stats.deletes += keys.length;
            }
            
            // Remove the tag set itself
            pipeline.del(tagKey);
        }

        await pipeline.exec();
        
        this.emit('cache:invalidate:tags', { tags });
        return true;
    }

    /**
     * Pattern-based invalidation using SCAN
     */
    async invalidateByPattern(pattern) {
        const fullPattern = this._buildKey(pattern);
        const keys = [];
        
        // Use SCAN to find matching keys
        const stream = this.cluster.scanStream({
            match: fullPattern,
            count: 100
        });

        stream.on('data', (resultKeys) => {
            keys.push(...resultKeys);
        });

        return new Promise((resolve, reject) => {
            stream.on('end', async () => {
                try {
                    if (keys.length > 0) {
                        const pipeline = this.cluster.pipeline();
                        keys.forEach(key => pipeline.del(key));
                        await pipeline.exec();
                        
                        this.stats.deletes += keys.length;
                        this.emit('cache:invalidate:pattern', { pattern, deletedKeys: keys.length });
                    }
                    resolve(keys.length);
                } catch (error) {
                    reject(error);
                }
            });

            stream.on('error', reject);
        });
    }

    /**
     * Time-based invalidation with refresh
     */
    async refreshCache(key, dataLoader, newTTL = null, options = {}) {
        try {
            const value = await dataLoader();
            
            if (value !== null && value !== undefined) {
                await this.set(key, value, newTTL, options);
                this.emit('cache:refresh', { key, value });
                return value;
            }
            
            return null;
        } catch (error) {
            console.error('Cache refresh error:', error);
            if (options.throwOnError) throw error;
            return null;
        }
    }

    // ==========================================
    // SPECIALIZED CACHE OPERATIONS
    // ==========================================

    /**
     * Increment counter with automatic expiration
     */
    async increment(key, amount = 1, ttl = null) {
        const fullKey = this._buildKey(key);
        const pipeline = this.cluster.pipeline();
        
        pipeline.incrby(fullKey, amount);
        if (ttl) {
            pipeline.expire(fullKey, ttl);
        }
        
        const results = await pipeline.exec();
        return results[0][1]; // Return new value
    }

    /**
     * Rate limiting using sliding window
     */
    async isRateLimited(identifier, maxRequests, windowSeconds) {
        const key = this._buildKey(`rate_limit:${identifier}`);
        const now = Date.now();
        const windowStart = now - (windowSeconds * 1000);

        const pipeline = this.cluster.pipeline();
        
        // Remove old entries
        pipeline.zremrangebyscore(key, 0, windowStart);
        
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        
        // Set expiration
        pipeline.expire(key, windowSeconds * 2);
        
        // Count current requests
        pipeline.zcard(key);
        
        const results = await pipeline.exec();
        const currentRequests = results[3][1];
        
        return currentRequests > maxRequests;
    }

    /**
     * Pub/Sub for cache invalidation events
     */
    async publishInvalidation(channel, data) {
        await this.cluster.publish(`cache:invalidate:${channel}`, JSON.stringify(data));
        this.emit('cache:publish', { channel, data });
    }

    subscribeToInvalidations(channel, handler) {
        const subscriber = this.cluster.duplicate();
        
        subscriber.subscribe(`cache:invalidate:${channel}`, (err) => {
            if (err) {
                console.error('Subscription error:', err);
            }
        });

        subscriber.on('message', (channel, message) => {
            try {
                const data = JSON.parse(message);
                handler(data);
            } catch (error) {
                console.error('Invalid invalidation message:', error);
            }
        });

        return subscriber;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    _buildKey(key) {
        return `${this.config.keyPrefix}${key}`;
    }

    _serialize(value) {
        if (this.config.serialization === 'json') {
            return JSON.stringify(value);
        }
        return value.toString();
    }

    _deserialize(value) {
        if (this.config.serialization === 'json') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    }

    async _queueWrite(key, value, options) {
        const writeQueue = this._buildKey('write_queue');
        const writeData = {
            key,
            value,
            timestamp: Date.now(),
            options
        };
        
        await this.cluster.lpush(writeQueue, JSON.stringify(writeData));
    }

    async _waitForLock(lockKey, maxWaitTime) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            const exists = await this.cluster.exists(lockKey);
            if (!exists) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Lock wait timeout');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100
        };
    }

    /**
     * Reset cache statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const testKey = this._buildKey('health_check');
            const testValue = Date.now().toString();
            
            await this.cluster.set(testKey, testValue, 'EX', 5);
            const retrieved = await this.cluster.get(testKey);
            await this.cluster.del(testKey);
            
            return retrieved === testValue;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Graceful shutdown
     */
    async disconnect() {
        try {
            await this.cluster.disconnect();
            this.emit('disconnected');
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }
}

// ==========================================
// APPLICATION-SPECIFIC CACHE MANAGERS
// ==========================================

/**
 * User-specific cache manager
 */
class UserCacheManager extends CacheManager {
    constructor(options = {}) {
        super({
            keyPrefix: 'user:',
            defaultTTL: 1800, // 30 minutes
            ...options
        });
    }

    async getUserProfile(userId) {
        return await this.getOrSet(
            `profile:${userId}`,
            async () => {
                // This would load from database
                const user = await database.users.findById(userId);
                return user;
            },
            3600 // 1 hour TTL
        );
    }

    async invalidateUser(userId) {
        await this.invalidateByPattern(`*:${userId}:*`);
        await this.del(`profile:${userId}`);
        await this.publishInvalidation('user', { userId, action: 'update' });
    }
}

/**
 * Content-specific cache manager
 */
class ContentCacheManager extends CacheManager {
    constructor(options = {}) {
        super({
            keyPrefix: 'content:',
            defaultTTL: 900, // 15 minutes
            ...options
        });
    }

    async getPost(postId) {
        return await this.getOrSet(
            `post:${postId}`,
            async () => {
                const post = await database.posts.findById(postId);
                return post;
            },
            1800 // 30 minutes
        );
    }

    async getCommunityPosts(communityId, page = 1, limit = 25) {
        const key = `community:${communityId}:posts:${page}:${limit}`;
        return await this.getOrSet(
            key,
            async () => {
                const posts = await database.posts.findByCommunity(communityId, page, limit);
                return posts;
            },
            600 // 10 minutes
        );
    }

    async invalidatePost(postId, communityId) {
        const tags = [`post:${postId}`, `community:${communityId}`];
        await this.invalidateByTags(tags);
        await this.publishInvalidation('content', { postId, communityId, action: 'update' });
    }
}

/**
 * Session cache manager
 */
class SessionCacheManager extends CacheManager {
    constructor(options = {}) {
        super({
            keyPrefix: 'session:',
            defaultTTL: 86400, // 24 hours
            ...options
        });
    }

    async getSession(sessionId) {
        return await this.get(`data:${sessionId}`);
    }

    async setSession(sessionId, sessionData, ttl = 86400) {
        return await this.set(`data:${sessionId}`, sessionData, ttl);
    }

    async destroySession(sessionId) {
        return await this.del(`data:${sessionId}`);
    }

    async refreshSession(sessionId, newTTL = 86400) {
        const key = this._buildKey(`data:${sessionId}`);
        return await this.cluster.expire(key, newTTL);
    }
}

module.exports = {
    CacheManager,
    UserCacheManager,
    ContentCacheManager,
    SessionCacheManager
};

// ==========================================
// USAGE EXAMPLES
// ==========================================

/*
// Initialize cache managers
const userCache = new UserCacheManager();
const contentCache = new ContentCacheManager();
const sessionCache = new SessionCacheManager();

// User profile caching
const user = await userCache.getUserProfile('user123');

// Content caching with tags
await contentCache.setWithTags(
    'post:456',
    postData,
    ['community:789', 'user:123', 'trending'],
    1800
);

// Rate limiting
const isLimited = await userCache.isRateLimited('user123', 100, 3600);

// Cache invalidation
await contentCache.invalidateByTags(['community:789']);

// Distributed locking
const result = await contentCache.withLock('generate_report', async () => {
    return await generateExpensiveReport();
});

// Session management
await sessionCache.setSession(sessionId, sessionData, 86400);
const session = await sessionCache.getSession(sessionId);
*/