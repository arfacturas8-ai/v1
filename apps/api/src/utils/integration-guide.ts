/**
 * API Optimization Integration Guide
 * 
 * This file provides examples and guidance for integrating all the optimization
 * utilities into your Fastify application for maximum frontend performance.
 */

import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

// Import all optimization utilities
import { registerCors } from '../middleware/cors';
import { errorHandler } from '../middleware/errorHandler';
import { createLoggingMiddleware, LoggingConfigs } from '../middleware/logging';
import { createCacheMiddleware, CacheConfigs } from '../middleware/cache';
import { sendSuccess, sendPaginated, ErrorResponses } from './responses';
import { paginationQuerySchema, createPaginatedResult } from './pagination';
import { databaseManager, DatabaseUtils } from './database';
import { createWebSocketReliabilityManager } from './websocket-reliability';
import { createMetricsCollector, DefaultAlerts } from './metrics';

/**
 * Complete API Optimization Setup
 * 
 * This is a comprehensive example of how to integrate all optimization
 * features into your Fastify application.
 */
export async function setupOptimizedAPI(fastify: FastifyInstance) {
  // Initialize Redis for caching and WebSocket reliability
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');

  // 1. CORS Configuration with dynamic origin handling
  await registerCors(fastify, {
    credentials: true,
    // Will automatically configure based on environment
  });

  // 2. Request Logging with environment-appropriate settings
  const loggingConfig = process.env.NODE_ENV === 'production' 
    ? LoggingConfigs.production 
    : LoggingConfigs.development;
  
  fastify.addHook('onRequest', createLoggingMiddleware(loggingConfig));

  // 3. Metrics Collection and Performance Monitoring
  const metricsCollector = createMetricsCollector(redis, {
    retentionPeriod: 24, // 24 hours
    flushInterval: 60,   // 1 minute
    systemMetricsInterval: 30 // 30 seconds
  });

  // Add default alert rules
  Object.values(DefaultAlerts).forEach(alert => {
    metricsCollector.addAlert(alert);
  });

  // Add metrics middleware
  fastify.addHook('onRequest', metricsCollector.createRequestMiddleware());

  // 4. Response Caching for frequently accessed endpoints
  // Cache user profiles for 10 minutes
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url.match(/^\/api\/users\/[^\/]+$/)) {
      return createCacheMiddleware(redis, CacheConfigs.userProfile)(request, reply);
    }
  });

  // Cache public content for 5 minutes
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/api/posts') || request.url.startsWith('/api/communities')) {
      return createCacheMiddleware(redis, CacheConfigs.publicContent)(request, reply);
    }
  });

  // Cache search results for 1 minute
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url.includes('/search')) {
      return createCacheMiddleware(redis, CacheConfigs.search)(request, reply);
    }
  });

  // 5. Enhanced Error Handling
  fastify.setErrorHandler(errorHandler);

  // 6. WebSocket Reliability (if using WebSockets)
  if (fastify.io) {
    const wsReliability = createWebSocketReliabilityManager(fastify.io, redis, {
      ackTimeout: 5000,
      maxRetries: 3,
      persistMessages: true
    });

    // Store reliability manager for use in routes
    (fastify as any).wsReliability = wsReliability;
  }

  // 7. Database Optimization
  // The database manager is automatically available via DatabaseUtils

  // 8. Health Check Endpoint with Comprehensive Monitoring
  fastify.get('/health', async (request, reply) => {
    const healthChecks = await Promise.allSettled([
      // Database health
      databaseManager.healthCheck(),
      
      // Redis health
      redis.ping().then(() => ({ status: 'healthy', responseTime: Date.now() })),
      
      // System metrics
      Promise.resolve(metricsCollector.getSystemHealth())
    ]);

    const dbHealth = healthChecks[0].status === 'fulfilled' 
      ? healthChecks[0].value 
      : { status: 'unhealthy', error: 'Database check failed' };

    const redisHealth = healthChecks[1].status === 'fulfilled'
      ? { status: 'healthy', responseTime: 0 }
      : { status: 'unhealthy', error: 'Redis check failed' };

    const systemHealth = healthChecks[2].status === 'fulfilled'
      ? healthChecks[2].value
      : { status: 'unhealthy', error: 'System metrics unavailable' };

    const overallStatus = [dbHealth.status, redisHealth.status, systemHealth.status]
      .includes('critical') ? 'critical' :
      [dbHealth.status, redisHealth.status, systemHealth.status]
      .includes('degraded') ? 'degraded' : 'healthy';

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    reply.code(statusCode);
    sendSuccess(reply, {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: {
        database: dbHealth,
        redis: redisHealth,
        system: systemHealth
      }
    });
  });

  // 9. Metrics Endpoint for Monitoring Systems
  fastify.get('/metrics', async (request, reply) => {
    const format = request.query.format as string || 'json';
    
    if (format === 'prometheus') {
      reply.header('content-type', 'text/plain');
      reply.send(metricsCollector.exportPrometheusMetrics());
    } else {
      sendSuccess(reply, metricsCollector.exportJSONMetrics());
    }
  });

  // 10. Cache Management Endpoints (for development/debugging)
  if (process.env.NODE_ENV !== 'production') {
    fastify.delete('/cache/clear', async (request, reply) => {
      const cacheManager = (fastify as any).cacheManager;
      if (cacheManager) {
        const cleared = await cacheManager.clearAll();
        sendSuccess(reply, { cleared }, { message: `Cleared ${cleared} cache entries` });
      } else {
        sendSuccess(reply, { cleared: 0 }, { message: 'No cache manager available' });
      }
    });
  }

  console.log('🚀 API optimizations initialized:');
  console.log('   ✅ CORS with dynamic origin support');
  console.log('   ✅ Enhanced request/response logging');
  console.log('   ✅ Performance metrics collection');
  console.log('   ✅ Intelligent response caching');
  console.log('   ✅ Structured error handling');
  console.log('   ✅ Database connection optimization');
  console.log('   ✅ WebSocket reliability enhancements');
  console.log('   ✅ Health monitoring endpoints');
}

/**
 * Example Route Using All Optimization Features
 * 
 * This demonstrates how to create a fully optimized route that uses
 * all the available utilities for maximum performance and reliability.
 */
export function createOptimizedRoute(fastify: FastifyInstance) {
  fastify.get('/api/users/:userId/profile', {
    // Use pagination validation
    preHandler: async (request, reply) => {
      // This route will automatically benefit from:
      // - CORS handling
      // - Request logging
      // - Metrics collection
      // - Response caching (if configured)
      // - Error handling
    },
    schema: {
      tags: ['users'],
      summary: 'Get user profile with optimizations',
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', format: 'uuid' }
        }
      },
      querystring: paginationQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                stats: { type: 'object' },
                recentActivity: {
                  type: 'object',
                  properties: {
                    items: { type: 'array' },
                    pagination: { type: 'object' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const paginationQuery = request.query as any;

    try {
      // Use database utilities with retry logic
      const user = await DatabaseUtils.withRetry(async () => {
        const { prisma } = await import('@cryb/database');
        return prisma.user.findUnique({
          where: { id: userId },
          include: {
            _count: {
              select: {
                posts: true,
                comments: true,
                followers: true,
                following: true
              }
            }
          }
        });
      }, 'get_user_profile');

      if (!user) {
        return ErrorResponses.notFound(reply, 'User not found');
      }

      // Get recent activity with pagination
      const { prisma } = await import('@cryb/database');
      const [posts, total] = await Promise.all([
        DatabaseUtils.withRetry(() => 
          prisma.post.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: paginationQuery.limit,
            skip: (paginationQuery.page - 1) * paginationQuery.limit,
            select: {
              id: true,
              title: true,
              createdAt: true,
              _count: { select: { comments: true, votes: true } }
            }
          })
        ),
        DatabaseUtils.withRetry(() => 
          prisma.post.count({ where: { userId } })
        )
      ]);

      // Create paginated response
      const recentActivity = createPaginatedResult(posts, total, paginationQuery);

      // Send optimized response
      sendSuccess(reply, {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          createdAt: user.createdAt
        },
        stats: {
          posts: user._count.posts,
          comments: user._count.comments,
          followers: user._count.followers,
          following: user._count.following
        },
        recentActivity
      }, {
        meta: {
          cached: reply.getHeader('x-cache') === 'HIT',
          requestId: (request as any).requestId
        }
      });

    } catch (error) {
      // Error will be automatically handled by error middleware
      throw error;
    }
  });
}

/**
 * WebSocket Event Examples with Reliability
 */
export function setupReliableWebSocketEvents(fastify: FastifyInstance) {
  const wsReliability = (fastify as any).wsReliability;
  if (!wsReliability) return;

  // Example: Send reliable message to user
  function notifyUser(userId: string, event: string, data: any) {
    return wsReliability.sendReliableMessageToUser(userId, event, data, {
      requiresAck: true,
      priority: 'high'
    });
  }

  // Example: Send reliable message to specific socket
  function notifySocket(socketId: string, event: string, data: any) {
    return wsReliability.sendReliableMessage(socketId, event, data, {
      requiresAck: true,
      expiresAt: Date.now() + 300000 // 5 minutes
    });
  }

  // Store functions for use in routes
  (fastify as any).notifyUser = notifyUser;
  (fastify as any).notifySocket = notifySocket;
}

/**
 * Environment-Specific Configuration
 */
export function getEnvironmentConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    cors: {
      credentials: true,
      // Dynamic origins based on environment
    },
    
    logging: isDevelopment ? LoggingConfigs.development : LoggingConfigs.production,
    
    caching: {
      // Shorter TTL in development for faster iteration
      userProfile: { ...CacheConfigs.userProfile, ttl: isDevelopment ? 60 : 600 },
      publicContent: { ...CacheConfigs.publicContent, ttl: isDevelopment ? 30 : 300 },
      search: { ...CacheConfigs.search, ttl: isDevelopment ? 10 : 60 }
    },

    metrics: {
      retentionPeriod: isDevelopment ? 4 : 24, // 4 hours dev, 24 hours prod
      flushInterval: isDevelopment ? 30 : 60,  // 30s dev, 60s prod
      systemMetricsInterval: isDevelopment ? 10 : 30 // 10s dev, 30s prod
    },

    database: {
      // More aggressive retries in production
      maxAttempts: isProduction ? 5 : 3,
      baseDelay: isProduction ? 200 : 100
    },

    websocket: {
      ackTimeout: isDevelopment ? 2000 : 5000,
      maxRetries: isDevelopment ? 2 : 3,
      persistMessages: isProduction // Only persist in production
    }
  };
}

/**
 * Performance Tips and Best Practices
 */
export const PerformanceTips = {
  caching: {
    // Cache user-specific data with user ID in cache key
    userSpecific: 'Use userSpecific: true for personalized content',
    
    // Use appropriate TTL based on data volatility
    ttlGuidelines: {
      static: '1 hour - for assets and rarely changing content',
      userProfile: '10 minutes - for user profiles and settings',
      publicContent: '5 minutes - for posts, comments, public data',
      search: '1 minute - for search results and trending content',
      realtime: '30 seconds - for live data and notifications'
    },
    
    // Invalidate cache when data changes
    invalidation: 'Always invalidate relevant cache keys when data is updated'
  },

  database: {
    // Use transactions for related operations
    transactions: 'Group related database operations in transactions',
    
    // Implement retry logic for transient failures
    retries: 'Use DatabaseUtils.withRetry for important operations',
    
    // Monitor slow queries and optimize them
    slowQueries: 'Set up alerts for queries taking longer than 1 second',
    
    // Use connection pooling effectively
    pooling: 'Configure appropriate connection pool size based on load'
  },

  websockets: {
    // Use message acknowledgments for critical messages
    acknowledgments: 'Enable requiresAck for important real-time events',
    
    // Queue messages for offline users
    queuing: 'Messages are automatically queued when users are offline',
    
    // Monitor connection health with heartbeats
    heartbeat: 'Heartbeat monitoring is automatically enabled',
    
    // Handle reconnection gracefully
    reconnection: 'Implement client-side reconnection with exponential backoff'
  },

  monitoring: {
    // Set up appropriate alerts
    alerts: 'Monitor latency, error rates, memory usage, and custom metrics',
    
    // Export metrics to external systems
    export: 'Use /metrics endpoint for Prometheus or other monitoring systems',
    
    // Track business metrics
    business: 'Record custom metrics for important business events',
    
    // Monitor user experience
    frontend: 'Track frontend performance metrics through the API'
  }
};

export default {
  setupOptimizedAPI,
  createOptimizedRoute,
  setupReliableWebSocketEvents,
  getEnvironmentConfig,
  PerformanceTips
};