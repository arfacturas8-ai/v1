import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@cryb/database';
import { AppError } from './errorHandler';

// Database query optimization utilities
export interface QueryOptimizationOptions {
  enableQueryLogging?: boolean;
  slowQueryThreshold?: number; // ms
  cacheEnabled?: boolean;
  cacheTTL?: number; // seconds
  maxConnectionPool?: number;
  queryTimeout?: number; // ms
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  affectedRows?: number;
}

// Database optimization service
export class DatabaseOptimizationService {
  private queryMetrics: QueryMetrics[] = [];
  private queryCache: Map<string, { data: any; expiresAt: number }> = new Map();
  private options: Required<QueryOptimizationOptions>;
  
  constructor(options: QueryOptimizationOptions = {}) {
    this.options = {
      enableQueryLogging: options.enableQueryLogging ?? process.env.NODE_ENV === 'development',
      slowQueryThreshold: options.slowQueryThreshold ?? 1000,
      cacheEnabled: options.cacheEnabled ?? true,
      cacheTTL: options.cacheTTL ?? 300,
      maxConnectionPool: options.maxConnectionPool ?? 20,
      queryTimeout: options.queryTimeout ?? 30000
    };
    
    // Configure Prisma connection pooling
    this.configurePrisma();
    
    // Setup cleanup interval for expired cache entries
    setInterval(() => this.cleanupExpiredCache(), 60000); // Every minute
  }
  
  private configurePrisma() {
    // Prisma configuration is typically done in the database package
    // This is more of a placeholder for configuration that could be done
  }
  
  private cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (value.expiresAt < now) {
        this.queryCache.delete(key);
      }
    }
  }
  
  // Create optimized pagination
  createPagination(options: PaginationOptions = {}) {
    const {
      page = 1,
      limit = options.defaultLimit || 20,
      maxLimit = 100,
      cursor,
      sort = 'createdAt',
      order = 'desc'
    } = options;
    
    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(maxLimit, Math.max(1, limit));
    const offset = (validatedPage - 1) * validatedLimit;
    
    // Create optimized query options
    const queryOptions: any = {
      take: validatedLimit,
      orderBy: { [sort]: order }
    };
    
    // Use cursor-based pagination if cursor is provided (more efficient for large datasets)
    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor item itself
    } else {
      // Use offset-based pagination
      queryOptions.skip = offset;
    }
    
    return {
      queryOptions,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        offset,
        hasNext: false, // Will be set after query
        hasPrev: validatedPage > 1,
        total: 0 // Will be set after query
      }
    };
  }
  
  // Execute optimized query with caching and monitoring
  async executeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    cacheTTL?: number
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let fromCache = false;
    
    try {
      // Check cache first
      if (this.options.cacheEnabled) {
        const cached = this.queryCache.get(queryKey);
        if (cached && cached.expiresAt > Date.now()) {
          fromCache = true;
          result = cached.data;
        }
      }
      
      // Execute query if not cached
      if (!fromCache) {
        result = await Promise.race([
          queryFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), this.options.queryTimeout)
          )
        ]);
        
        // Cache the result
        if (this.options.cacheEnabled) {
          const ttl = (cacheTTL || this.options.cacheTTL) * 1000;
          this.queryCache.set(queryKey, {
            data: result,
            expiresAt: Date.now() + ttl
          });
        }
      }
      
      const duration = Date.now() - startTime;
      
      // Log query metrics
      if (this.options.enableQueryLogging) {
        const metrics: QueryMetrics = {
          query: queryKey,
          duration,
          timestamp: startTime,
          success: true,
          affectedRows: Array.isArray(result) ? result.length : 1
        };
        
        this.queryMetrics.push(metrics);
        
        // Log slow queries
        if (duration > this.options.slowQueryThreshold) {
          console.warn(`Slow query detected: ${queryKey} took ${duration}ms`, {
            queryKey,
            duration,
            fromCache
          });
        }
      }
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error metrics
      if (this.options.enableQueryLogging) {
        const metrics: QueryMetrics = {
          query: queryKey,
          duration,
          timestamp: startTime,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
        
        this.queryMetrics.push(metrics);
      }
      
      throw new AppError(
        'Database query failed',
        500,
        'DATABASE_ERROR',
        { queryKey, duration, originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  // Create optimized include options for related data
  createOptimizedIncludes(includes: string[]): Record<string, any> {
    const includeMap: Record<string, any> = {};
    
    for (const include of includes) {
      switch (include) {
        case 'user':
          includeMap.user = {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          };
          break;
          
        case 'community':
          includeMap.community = {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
              memberCount: true,
              isPublic: true
            }
          };
          break;
          
        case 'server':
          includeMap.server = {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              memberCount: true,
              isPublic: true
            }
          };
          break;
          
        case 'channel':
          includeMap.channel = {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              isPrivate: true
            }
          };
          break;
          
        case 'counts':
          includeMap._count = {
            select: {
              comments: true,
              votes: true,
              views: true,
              likes: true
            }
          };
          break;
          
        default:
          // For custom includes, just include everything
          includeMap[include] = true;
      }
    }
    
    return includeMap;
  }
  
  // Batch operations for better performance
  async batchCreate<T>(
    model: any,
    data: any[],
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = await model.createMany({
        data: batch,
        skipDuplicates: true
      });
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Get query performance metrics
  getQueryMetrics(limit: number = 100): {
    totalQueries: number;
    avgDuration: number;
    slowQueries: QueryMetrics[];
    errorRate: number;
    cacheHitRate: number;
  } {
    const recentMetrics = this.queryMetrics.slice(-limit);
    const totalQueries = recentMetrics.length;
    
    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        avgDuration: 0,
        slowQueries: [],
        errorRate: 0,
        cacheHitRate: 0
      };
    }
    
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalDuration / totalQueries;
    
    const slowQueries = recentMetrics.filter(m => m.duration > this.options.slowQueryThreshold);
    const errors = recentMetrics.filter(m => !m.success);
    const errorRate = (errors.length / totalQueries) * 100;
    
    // Cache hit rate calculation would need more tracking
    const cacheHitRate = 0; // Placeholder
    
    return {
      totalQueries,
      avgDuration,
      slowQueries,
      errorRate,
      cacheHitRate
    };
  }
  
  // Clear query cache
  clearCache(pattern?: string) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of this.queryCache) {
        if (regex.test(key)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }
  
  // Database health check
  async checkDatabaseHealth(): Promise<{
    connected: boolean;
    latency?: number;
    queryMetrics: ReturnType<typeof this.getQueryMetrics>;
  }> {
    const startTime = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        latency,
        queryMetrics: this.getQueryMetrics()
      };
    } catch (error) {
      return {
        connected: false,
        queryMetrics: this.getQueryMetrics()
      };
    }
  }
}

// Middleware for query optimization
export const createDatabaseOptimizationMiddleware = (options?: QueryOptimizationOptions) => {
  const service = new DatabaseOptimizationService(options);
  
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Add database utilities to request
    (request as any).db = {
      service,
      executeQuery: service.executeQuery.bind(service),
      createPagination: service.createPagination.bind(service),
      createOptimizedIncludes: service.createOptimizedIncludes.bind(service)
    };
    
    // Add performance tracking
    const startTime = Date.now();
    
    reply.addHook('onSend', async (request, reply, payload) => {
      const duration = Date.now() - startTime;
      reply.header('X-DB-Query-Time', `${duration}ms`);
      
      return payload;
    });
  };
};

// Common query patterns
export const commonQueries = {
  // Optimized user lookup with minimal data
  findUserById: (id: string) => prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      isVerified: true,
      createdAt: true
    }
  }),
  
  // Optimized post listing with pagination
  findPosts: (options: {
    page?: number;
    limit?: number;
    communityId?: string;
    userId?: string;
    includeUser?: boolean;
    includeCommunity?: boolean;
  }) => {
    const { page = 1, limit = 20, communityId, userId, includeUser, includeCommunity } = options;
    const skip = (page - 1) * limit;
    
    const where: any = { isRemoved: false };
    if (communityId) where.communityId = communityId;
    if (userId) where.userId = userId;
    
    const include: any = {};
    if (includeUser) include.user = { select: { id: true, username: true, displayName: true, avatar: true } };
    if (includeCommunity) include.community = { select: { id: true, name: true, displayName: true, icon: true } };
    
    return prisma.post.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  },
  
  // Optimized comment tree loading
  findCommentTree: (postId: string, maxDepth: number = 3) => {
    // This would implement a recursive CTE or multiple queries for comment threading
    // For now, a simplified version
    return prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
};

export default {
  DatabaseOptimizationService,
  createDatabaseOptimizationMiddleware,
  commonQueries
};