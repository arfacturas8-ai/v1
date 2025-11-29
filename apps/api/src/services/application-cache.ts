// Application-Specific Cache Strategies - Optimized for 100K users
// Implements aggressive caching for common operations

import { MultiTierCacheManager } from './multi-tier-cache.js';
import { PrismaClient } from '@prisma/client';

export class ApplicationCache {
  private cache: MultiTierCacheManager;
  private prisma: PrismaClient;

  constructor(cache: MultiTierCacheManager, prisma: PrismaClient) {
    this.cache = cache;
    this.prisma = prisma;
  }

  // ============================================
  // USER CACHING (1 hour TTL)
  // ============================================

  async cacheUser(user: any): Promise<void> {
    const TTL = 3600; // 1 hour
    const keys = [
      `user:${user.id}`,
      `user:username:${user.username}`,
      `user:email:${user.email}`
    ];

    const cacheData = {
      ...user,
      password: undefined, // Never cache passwords
      refreshToken: undefined // Never cache tokens
    };

    await Promise.all(keys.map(key =>
      this.cache.set(key, cacheData, TTL)
    ));
  }

  async getUserById(userId: string): Promise<any | null> {
    return await this.cache.getOrSet(
      `user:${userId}`,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatar: true,
            bio: true,
            createdAt: true,
            updatedAt: true
          }
        });
        return user;
      },
      3600 // 1 hour
    );
  }

  async getUserByUsername(username: string): Promise<any | null> {
    return await this.cache.getOrSet(
      `user:username:${username}`,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { username },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
            createdAt: true
          }
        });
        return user;
      },
      3600 // 1 hour
    );
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.cache.invalidatePattern(`user:${userId}*`);
    await this.cache.invalidatePattern(`user:username:*`);
  }

  // ============================================
  // POST CACHING (5 minutes TTL)
  // ============================================

  async cachePost(post: any): Promise<void> {
    const TTL = 300; // 5 minutes
    await this.cache.set(`post:${post.id}`, post, TTL);
  }

  async getPostById(postId: string): Promise<any | null> {
    return await this.cache.getOrSet(
      `post:${postId}`,
      async () => {
        const post = await this.prisma.post.findUnique({
          where: { id: postId },
          include: {
            User: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            Community: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true
              }
            }
          }
        });
        return post;
      },
      300 // 5 minutes
    );
  }

  async getPostsByPage(page: number, limit: number, sort: string = 'hot'): Promise<any[]> {
    const cacheKey = `posts:page:${page}:limit:${limit}:sort:${sort}`;

    return await this.cache.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const orderBy = sort === 'new'
          ? { createdAt: 'desc' as const }
          : { createdAt: 'desc' as const };

        const posts = await this.prisma.post.findMany({
          take: limit,
          skip,
          orderBy,
          include: {
            User: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            Community: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        });

        return posts;
      },
      60 // 1 minute for post lists
    );
  }

  async invalidatePost(postId: string): Promise<void> {
    await this.cache.invalidatePattern(`post:${postId}*`);
    await this.cache.invalidatePattern(`posts:page:*`); // Invalidate post lists
  }

  // ============================================
  // COMMUNITY CACHING (1 hour TTL)
  // ============================================

  async cacheCommunity(community: any): Promise<void> {
    const TTL = 3600; // 1 hour
    await this.cache.set(`community:${community.id}`, community, TTL);
    await this.cache.set(`community:name:${community.name}`, community, TTL);
  }

  async getCommunityById(communityId: string): Promise<any | null> {
    return await this.cache.getOrSet(
      `community:${communityId}`,
      async () => {
        const community = await this.prisma.community.findUnique({
          where: { id: communityId },
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            createdAt: true,
            updatedAt: true
          }
        });
        return community;
      },
      3600 // 1 hour
    );
  }

  async getCommunityByName(name: string): Promise<any | null> {
    return await this.cache.getOrSet(
      `community:name:${name}`,
      async () => {
        const community = await this.prisma.community.findUnique({
          where: { name },
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            createdAt: true,
            updatedAt: true
          }
        });
        return community;
      },
      3600 // 1 hour
    );
  }

  async getCommunityList(): Promise<any[]> {
    return await this.cache.getOrSet(
      `communities:list`,
      async () => {
        const communities = await this.prisma.community.findMany({
          take: 100,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            createdAt: true
          }
        });
        return communities;
      },
      3600 // 1 hour
    );
  }

  async invalidateCommunity(communityId: string): Promise<void> {
    await this.cache.invalidatePattern(`community:${communityId}*`);
    await this.cache.invalidatePattern(`communities:list`);
  }

  // ============================================
  // SERVER CACHING (Discord-style - 1 hour TTL)
  // ============================================

  async cacheServer(server: any): Promise<void> {
    const TTL = 3600; // 1 hour
    await this.cache.set(`server:${server.id}`, server, TTL);
  }

  async getServerById(serverId: string): Promise<any | null> {
    return await this.cache.getOrSet(
      `server:${serverId}`,
      async () => {
        const server = await this.prisma.server.findUnique({
          where: { id: serverId },
          include: {
            channels: {
              orderBy: { position: 'asc' }
            }
          }
        });
        return server;
      },
      3600 // 1 hour
    );
  }

  async invalidateServer(serverId: string): Promise<void> {
    await this.cache.invalidatePattern(`server:${serverId}*`);
  }

  // ============================================
  // COMMENT CACHING (5 minutes TTL)
  // ============================================

  async getCommentsByPostId(postId: string, limit: number = 50): Promise<any[]> {
    return await this.cache.getOrSet(
      `comments:post:${postId}:limit:${limit}`,
      async () => {
        const comments = await this.prisma.comment.findMany({
          where: { postId },
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        });
        return comments;
      },
      300 // 5 minutes
    );
  }

  async invalidateComments(postId: string): Promise<void> {
    await this.cache.invalidatePattern(`comments:post:${postId}*`);
  }

  // ============================================
  // CACHE WARMING (Pre-populate frequently accessed data)
  // ============================================

  async warmCache(): Promise<void> {
    console.log('🔥 Warming cache for 100K users...');

    try {
      // Warm top communities
      const topCommunities = await this.prisma.community.findMany({
        take: 50,
        orderBy: { memberCount: 'desc' }
      });

      for (const community of topCommunities) {
        await this.cacheCommunity(community);
      }

      // Warm trending posts
      const trendingPosts = await this.prisma.post.findMany({
        take: 100,
        orderBy: { score: 'desc' },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      for (const post of trendingPosts) {
        await this.cachePost(post);
      }

      console.log(`✅ Cache warmed: ${topCommunities.length} communities, ${trendingPosts.length} posts`);
    } catch (error) {
      console.error('❌ Cache warming error:', error);
    }
  }

  // ============================================
  // CACHE STATISTICS
  // ============================================

  getStats() {
    return this.cache.getStats();
  }
}

// Export singleton
let appCacheInstance: ApplicationCache | null = null;

export function initializeApplicationCache(
  cache: MultiTierCacheManager,
  prisma: PrismaClient
): ApplicationCache {
  if (!appCacheInstance) {
    appCacheInstance = new ApplicationCache(cache, prisma);
    console.log('✅ Application cache initialized');
  }
  return appCacheInstance;
}

export function getApplicationCache(): ApplicationCache {
  if (!appCacheInstance) {
    throw new Error('Application cache not initialized');
  }
  return appCacheInstance;
}
