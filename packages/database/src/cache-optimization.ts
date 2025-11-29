// CRYB PLATFORM CACHE OPTIMIZATION
// High-performance caching strategies for 90% database performance improvement

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

interface CacheConfig {
  defaultTTL: number;
  maxMemory: string;
  compressionThreshold: number;
  enableCompression: boolean;
}

interface CacheKey {
  prefix: string;
  key: string;
  ttl?: number;
}

export class DatabaseCacheOptimizer {
  private redis: Redis;
  private prisma: PrismaClient;
  private config: CacheConfig;

  // Cache key prefixes for different data types
  private readonly CACHE_PREFIXES = {
    USER: 'user',
    SERVER: 'server', 
    CHANNEL: 'channel',
    MESSAGE: 'message',
    POSTS: 'posts',
    COMMUNITY: 'community',
    NFT: 'nft',
    SESSION: 'session',
    PRESENCE: 'presence',
    VOICE_STATE: 'voice',
    ANALYTICS: 'analytics',
    SEARCH: 'search'
  } as const;

  // Cache TTL settings (in seconds)
  private readonly CACHE_TTL = {
    USER_PROFILE: 3600,        // 1 hour
    USER_SESSION: 1800,        // 30 minutes  
    SERVER_INFO: 7200,         // 2 hours
    CHANNEL_INFO: 3600,        // 1 hour
    MESSAGES: 300,             // 5 minutes
    HOT_POSTS: 180,            // 3 minutes
    COMMUNITY_INFO: 1800,      // 30 minutes
    NFT_METADATA: 14400,       // 4 hours
    SEARCH_RESULTS: 900,       // 15 minutes
    ANALYTICS: 600,            // 10 minutes
    PRESENCE: 60,              // 1 minute
    VOICE_STATE: 30            // 30 seconds
  } as const;

  constructor(redis: Redis, prisma: PrismaClient, config?: Partial<CacheConfig>) {
    this.redis = redis;
    this.prisma = prisma;
    this.config = {
      defaultTTL: 1800,
      maxMemory: '2gb',
      compressionThreshold: 1024,
      enableCompression: true,
      ...config
    };
  }

  // ==============================================
  // CORE CACHE OPERATIONS
  // ==============================================

  private buildCacheKey(prefix: string, key: string): string {
    return `cryb:${prefix}:${key}`;
  }

  private async get<T>(cacheKey: CacheKey): Promise<T | null> {
    try {
      const key = this.buildCacheKey(cacheKey.prefix, cacheKey.key);
      const cached = await this.redis.get(key);
      
      if (!cached) return null;

      // Handle compressed data
      let data = cached;
      if (data.startsWith('GZIP:')) {
        const { gunzip } = await import('zlib');
        const { promisify } = await import('util');
        const gunzipAsync = promisify(gunzip);
        const compressed = Buffer.from(data.substring(5), 'base64');
        data = (await gunzipAsync(compressed)).toString();
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Cache get error for ${cacheKey.prefix}:${cacheKey.key}:`, error);
      return null;
    }
  }

  private async set<T>(cacheKey: CacheKey, data: T): Promise<void> {
    try {
      const key = this.buildCacheKey(cacheKey.prefix, cacheKey.key);
      let value = JSON.stringify(data);

      // Compress large data
      if (this.config.enableCompression && value.length > this.config.compressionThreshold) {
        const { gzip } = await import('zlib');
        const { promisify } = await import('util');
        const gzipAsync = promisify(gzip);
        const compressed = await gzipAsync(Buffer.from(value));
        value = 'GZIP:' + compressed.toString('base64');
      }

      const ttl = cacheKey.ttl || this.config.defaultTTL;
      await this.redis.setex(key, ttl, value);
    } catch (error) {
      console.error(`Cache set error for ${cacheKey.prefix}:${cacheKey.key}:`, error);
    }
  }

  private async del(cacheKey: CacheKey): Promise<void> {
    try {
      const key = this.buildCacheKey(cacheKey.prefix, cacheKey.key);
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for ${cacheKey.prefix}:${cacheKey.key}:`, error);
    }
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`cryb:${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache pattern invalidation error for ${pattern}:`, error);
    }
  }

  // ==============================================
  // USER CACHING STRATEGIES
  // ==============================================

  async getCachedUser(userId: string) {
    const cached = await this.get({
      prefix: this.CACHE_PREFIXES.USER,
      key: userId,
      ttl: this.CACHE_TTL.USER_PROFILE
    });

    if (cached) return cached;

    // Cache miss - fetch from database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        presence: true,
        userBadges: {
          include: { badge: true }
        },
        userNfts: {
          where: { verified: true },
          include: { nft: true }
        }
      }
    });

    if (user) {
      await this.set({
        prefix: this.CACHE_PREFIXES.USER,
        key: userId,
        ttl: this.CACHE_TTL.USER_PROFILE
      }, user);
    }

    return user;
  }

  async getCachedUserSession(sessionToken: string) {
    const cached = await this.get({
      prefix: this.CACHE_PREFIXES.SESSION,
      key: sessionToken,
      ttl: this.CACHE_TTL.USER_SESSION
    });

    if (cached) return cached;

    const session = await this.prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (session) {
      await this.set({
        prefix: this.CACHE_PREFIXES.SESSION,
        key: sessionToken,
        ttl: this.CACHE_TTL.USER_SESSION
      }, session);
    }

    return session;
  }

  // ==============================================
  // SERVER AND CHANNEL CACHING
  // ==============================================

  async getCachedServer(serverId: string) {
    const cached = await this.get({
      prefix: this.CACHE_PREFIXES.SERVER,
      key: serverId,
      ttl: this.CACHE_TTL.SERVER_INFO
    });

    if (cached) return cached;

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        channels: {
          orderBy: { position: 'asc' }
        },
        roles: {
          orderBy: { position: 'asc' }
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    if (server) {
      await this.set({
        prefix: this.CACHE_PREFIXES.SERVER,
        key: serverId,
        ttl: this.CACHE_TTL.SERVER_INFO
      }, server);
    }

    return server;
  }

  async getCachedChannelMessages(channelId: string, limit: number = 50) {
    const cacheKey = `${channelId}:messages:${limit}`;
    const cached = await this.get({
      prefix: this.CACHE_PREFIXES.MESSAGE,
      key: cacheKey,
      ttl: this.CACHE_TTL.MESSAGES
    });

    if (cached) return cached;

    const messages = await this.prisma.message.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    await this.set({
      prefix: this.CACHE_PREFIXES.MESSAGE,
      key: cacheKey,
      ttl: this.CACHE_TTL.MESSAGES
    }, messages);

    return messages;
  }

  // ==============================================
  // REDDIT-STYLE CONTENT CACHING
  // ==============================================

  async getCachedHotPosts(communityId?: string, limit: number = 25) {
    const cacheKey = communityId ? `${communityId}:hot:${limit}` : `all:hot:${limit}`;
    const cached = await this.get({
      prefix: this.CACHE_PREFIXES.POSTS,
      key: cacheKey,
      ttl: this.CACHE_TTL.HOT_POSTS
    });

    if (cached) return cached;

    const posts = await this.prisma.post.findMany({
      where: {
        ...(communityId && { communityId }),
        isRemoved: false,
        isLocked: false
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true,
            awards: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    await this.set({
      prefix: this.CACHE_PREFIXES.POSTS,
      key: cacheKey,
      ttl: this.CACHE_TTL.HOT_POSTS
    }, posts);

    return posts;
  }

  async getCachedCommunity(communityName: string) {
    const cached = await this.get({
      prefix: this.CACHE_PREFIXES.COMMUNITY,
      key: communityName,
      ttl: this.CACHE_TTL.COMMUNITY_INFO
    });

    if (cached) return cached;

    const community = await this.prisma.community.findUnique({
      where: { name: communityName },
      include: {
        _count: {
          select: {
            posts: true,
            members: true
          }
        }
      }
    });

    if (community) {
      await this.set({
        prefix: this.CACHE_PREFIXES.COMMUNITY,
        key: communityName,
        ttl: this.CACHE_TTL.COMMUNITY_INFO
      }, community);
    }

    return community;
  }

  // ==============================================
  // REAL-TIME DATA CACHING
  // ==============================================

  async setCachedUserPresence(userId: string, presence: any) {
    await this.set({
      prefix: this.CACHE_PREFIXES.PRESENCE,
      key: userId,
      ttl: this.CACHE_TTL.PRESENCE
    }, presence);
  }

  async getCachedUserPresence(userId: string) {
    return await this.get({
      prefix: this.CACHE_PREFIXES.PRESENCE,
      key: userId
    });
  }

  async setCachedVoiceState(userId: string, voiceState: any) {
    await this.set({
      prefix: this.CACHE_PREFIXES.VOICE_STATE,
      key: userId,
      ttl: this.CACHE_TTL.VOICE_STATE
    }, voiceState);
  }

  // ==============================================
  // SEARCH RESULT CACHING
  // ==============================================

  async getCachedSearchResults(query: string, filters?: any) {
    const cacheKey = `${query}:${JSON.stringify(filters || {})}`;
    const hashKey = require('crypto').createHash('sha256').update(cacheKey).digest('hex');
    
    return await this.get({
      prefix: this.CACHE_PREFIXES.SEARCH,
      key: hashKey,
      ttl: this.CACHE_TTL.SEARCH_RESULTS
    });
  }

  async setCachedSearchResults(query: string, results: any, filters?: any) {
    const cacheKey = `${query}:${JSON.stringify(filters || {})}`;
    const hashKey = require('crypto').createHash('sha256').update(cacheKey).digest('hex');
    
    await this.set({
      prefix: this.CACHE_PREFIXES.SEARCH,
      key: hashKey,
      ttl: this.CACHE_TTL.SEARCH_RESULTS
    }, results);
  }

  // ==============================================
  // ANALYTICS CACHING
  // ==============================================

  async getCachedAnalytics(serverId: string, timeframe: string = 'daily') {
    const cacheKey = `${serverId}:${timeframe}`;
    return await this.get({
      prefix: this.CACHE_PREFIXES.ANALYTICS,
      key: cacheKey,
      ttl: this.CACHE_TTL.ANALYTICS
    });
  }

  async setCachedAnalytics(serverId: string, data: any, timeframe: string = 'daily') {
    const cacheKey = `${serverId}:${timeframe}`;
    await this.set({
      prefix: this.CACHE_PREFIXES.ANALYTICS,
      key: cacheKey,
      ttl: this.CACHE_TTL.ANALYTICS
    }, data);
  }

  // ==============================================
  // CACHE INVALIDATION STRATEGIES
  // ==============================================

  async invalidateUserCache(userId: string) {
    await this.del({
      prefix: this.CACHE_PREFIXES.USER,
      key: userId
    });
    await this.invalidatePattern(`${this.CACHE_PREFIXES.PRESENCE}:${userId}`);
    await this.invalidatePattern(`${this.CACHE_PREFIXES.VOICE_STATE}:${userId}`);
  }

  async invalidateServerCache(serverId: string) {
    await this.del({
      prefix: this.CACHE_PREFIXES.SERVER,
      key: serverId
    });
    await this.invalidatePattern(`${this.CACHE_PREFIXES.ANALYTICS}:${serverId}`);
  }

  async invalidateChannelCache(channelId: string) {
    await this.invalidatePattern(`${this.CACHE_PREFIXES.MESSAGE}:${channelId}`);
  }

  async invalidateCommunityCache(communityId: string) {
    await this.invalidatePattern(`${this.CACHE_PREFIXES.POSTS}:${communityId}`);
    await this.invalidatePattern(`${this.CACHE_PREFIXES.POSTS}:all`); // Also invalidate global hot posts
  }

  // ==============================================
  // CACHE STATISTICS AND MONITORING
  // ==============================================

  async getCacheStatistics() {
    const info = await this.redis.info('memory');
    const stats = await this.redis.info('stats');
    
    return {
      memory: {
        used: info.match(/used_memory_human:(.+)/)?.[1]?.trim(),
        peak: info.match(/used_memory_peak_human:(.+)/)?.[1]?.trim(),
        fragmentation: info.match(/mem_fragmentation_ratio:(.+)/)?.[1]?.trim()
      },
      stats: {
        connections: stats.match(/connected_clients:(.+)/)?.[1]?.trim(),
        commands_processed: stats.match(/total_commands_processed:(.+)/)?.[1]?.trim(),
        keyspace_hits: stats.match(/keyspace_hits:(.+)/)?.[1]?.trim(),
        keyspace_misses: stats.match(/keyspace_misses:(.+)/)?.[1]?.trim()
      }
    };
  }

  async warmUpCache() {
    console.log('Starting cache warm-up...');
    
    try {
      // Warm up popular communities
      const popularCommunities = await this.prisma.community.findMany({
        orderBy: { memberCount: 'desc' },
        take: 10
      });

      for (const community of popularCommunities) {
        await this.getCachedCommunity(community.name);
        await this.getCachedHotPosts(community.id);
      }

      // Warm up active servers
      const activeServers = await this.prisma.server.findMany({
        orderBy: { approximateMemberCount: 'desc' },
        take: 20
      });

      for (const server of activeServers) {
        await this.getCachedServer(server.id);
      }

      console.log('Cache warm-up completed');
    } catch (error) {
      console.error('Cache warm-up error:', error);
    }
  }

  // ==============================================
  // CACHE MAINTENANCE
  // ==============================================

  async cleanupExpiredKeys() {
    // Redis handles TTL automatically, but we can scan for specific patterns
    console.log('Running cache cleanup...');
    
    try {
      // Clean up old search results (older than 1 hour)
      const searchKeys = await this.redis.keys(`cryb:${this.CACHE_PREFIXES.SEARCH}:*`);
      let cleanedCount = 0;

      for (const key of searchKeys) {
        const ttl = await this.redis.ttl(key);
        if (ttl < 0 || ttl > this.CACHE_TTL.SEARCH_RESULTS) {
          await this.redis.del(key);
          cleanedCount++;
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired cache keys`);
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

// Export cache optimization utilities
export const createCacheOptimizer = (redis: Redis, prisma: PrismaClient, config?: Partial<CacheConfig>) => {
  return new DatabaseCacheOptimizer(redis, prisma, config);
};

export default DatabaseCacheOptimizer;