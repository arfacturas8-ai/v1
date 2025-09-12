import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { CrashProofElasticsearchService } from "../services/crash-proof-elasticsearch";

interface SearchAnalytics {
  query: string;
  type: string;
  userId?: string;
  timestamp: Date;
  resultCount: number;
  responseTimeMs: number;
  filters?: any;
}

const enhancedSearchRoutes: FastifyPluginAsync = async (fastify) => {
  const elasticsearch = fastify.services.elasticsearch as CrashProofElasticsearchService;
  const analytics = fastify.services.analytics;

  // Initialize search indexes on startup
  fastify.addHook('onReady', async () => {
    try {
      await elasticsearch.connect();
      await elasticsearch.initializeDefaultIndexes();
      
      // Create additional indexes for comprehensive search
      await createUserIndex(elasticsearch);
      await createServerIndex(elasticsearch);
      await createCommunityIndex(elasticsearch);
      await createPostIndex(elasticsearch);
      
      fastify.log.info('Search indexes initialized successfully');
    } catch (error) {
      fastify.log.error('Failed to initialize search indexes:', error);
    }
  });

  // Real-time search with autocomplete - ultra-fast response
  fastify.get("/suggest", {
    preHandler: optionalAuthMiddleware,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 1, maxLength: 100 },
          limit: { type: 'number', minimum: 1, maximum: 20, default: 10 }
        },
        required: ['q']
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now();
    const { q, limit = 10 } = request.query as { q: string; limit: number };

    try {
      const suggestions = await elasticsearch.searchSuggestions(q, limit);
      const responseTime = Date.now() - startTime;

      // Track analytics asynchronously
      trackSearchAnalytics({
        query: q,
        type: 'suggestion',
        userId: request.user?.id,
        timestamp: new Date(),
        resultCount: suggestions.length,
        responseTimeMs: responseTime
      });

      return reply.send({
        success: true,
        suggestions,
        took: responseTime
      });
    } catch (error) {
      fastify.log.error('Search suggestions failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Suggestions failed',
        suggestions: []
      });
    }
  });

  // Advanced global search with filters and facets
  fastify.get("/", {
    preHandler: optionalAuthMiddleware,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 1, maxLength: 500 },
          type: { 
            type: 'string', 
            enum: ['all', 'messages', 'users', 'servers', 'communities', 'posts'],
            default: 'all' 
          },
          page: { type: 'number', minimum: 1, default: 1 },
          size: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          sortBy: { 
            type: 'string', 
            enum: ['relevance', 'date', 'popularity'], 
            default: 'relevance' 
          },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          fuzzy: { type: 'boolean', default: false },
          serverId: { type: 'string' },
          communityId: { type: 'string' },
          userId: { type: 'string' },
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' }
        },
        required: ['q']
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now();
    const {
      q, type = 'all', page = 1, size = 20, 
      sortBy = 'relevance', sortOrder = 'desc',
      fuzzy = false, serverId, communityId, userId, dateFrom, dateTo
    } = request.query as any;

    try {
      // Build filters
      const filters: any = {};
      if (serverId) filters['channel.serverId'] = serverId;
      if (communityId) filters.communityId = communityId;
      if (userId) filters['author.id'] = userId;
      if (dateFrom || dateTo) {
        filters.timestamp = {};
        if (dateFrom) filters.timestamp.gte = dateFrom;
        if (dateTo) filters.timestamp.lte = dateTo;
      }

      const results: any = { total: 0, items: [], facets: {} };
      let searchPromises: Promise<any>[] = [];

      // Execute searches in parallel for performance
      if (type === 'all' || type === 'messages') {
        searchPromises.push(searchMessages(elasticsearch, q, filters, { page, size, sortBy, sortOrder, fuzzy }));
      }
      if (type === 'all' || type === 'users') {
        searchPromises.push(searchUsersElastic(elasticsearch, q, { limit: type === 'users' ? size : 5 }));
      }
      if (type === 'all' || type === 'servers') {
        searchPromises.push(searchServersElastic(elasticsearch, q, { limit: type === 'servers' ? size : 5 }));
      }
      if (type === 'all' || type === 'communities') {
        searchPromises.push(searchCommunitiesElastic(elasticsearch, q, { limit: type === 'communities' ? size : 5 }));
      }
      if (type === 'all' || type === 'posts') {
        searchPromises.push(searchPostsElastic(elasticsearch, q, filters, { page, size, sortBy, sortOrder, fuzzy }));
      }

      // For fallback, also search in database
      const dbPromises = [];
      if (!await elasticsearch.ping()) {
        dbPromises.push(fallbackDatabaseSearch(q, type, { page, size }));
      }

      const searchResults = await Promise.allSettled([...searchPromises, ...dbPromises]);
      const responseTime = Date.now() - startTime;

      // Aggregate results
      searchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          if (type === 'all') {
            const searchType = ['messages', 'users', 'servers', 'communities', 'posts'][index];
            results[searchType] = result.value.results || result.value;
            results.total += result.value.total || (Array.isArray(result.value) ? result.value.length : 0);
          } else {
            results.items = result.value.results || result.value;
            results.total = result.value.total || (Array.isArray(result.value) ? result.value.length : 0);
          }
        }
      });

      // Track analytics
      trackSearchAnalytics({
        query: q,
        type,
        userId: request.user?.id,
        timestamp: new Date(),
        resultCount: results.total,
        responseTimeMs: responseTime,
        filters
      });

      return reply.send({
        success: true,
        data: results,
        query: q,
        took: responseTime,
        page,
        size,
        hasMore: results.total > page * size
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      fastify.log.error('Enhanced search failed:', error);
      
      // Fallback to basic database search
      try {
        const fallbackResults = await fallbackDatabaseSearch(q, type, { page, size });
        
        trackSearchAnalytics({
          query: q,
          type: `${type}_fallback`,
          userId: request.user?.id,
          timestamp: new Date(),
          resultCount: Array.isArray(fallbackResults) ? fallbackResults.length : 0,
          responseTimeMs: Date.now() - startTime
        });

        return reply.send({
          success: true,
          data: { items: fallbackResults, total: fallbackResults.length },
          query: q,
          took: responseTime,
          fallback: true
        });
      } catch (fallbackError) {
        return reply.code(500).send({
          success: false,
          error: 'Search failed',
          took: responseTime
        });
      }
    }
  });

  // Search within specific server with advanced filtering
  fastify.get("/servers/:serverId", {
    preHandler: authMiddleware,
    schema: {
      params: {
        type: 'object',
        properties: {
          serverId: { type: 'string' }
        },
        required: ['serverId']
      },
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 1, maxLength: 500 },
          channelId: { type: 'string' },
          userId: { type: 'string' },
          page: { type: 'number', minimum: 1, default: 1 },
          size: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' },
          hasAttachments: { type: 'boolean' },
          sortBy: { type: 'string', enum: ['relevance', 'date'], default: 'relevance' }
        },
        required: ['q']
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now();
    const { serverId } = request.params as { serverId: string };
    const { q, channelId, userId, page = 1, size = 20, dateFrom, dateTo, hasAttachments, sortBy = 'relevance' } = request.query as any;

    try {
      // Build filters for server search
      const filters: any = { 'channel.serverId': serverId };
      if (channelId) filters['channel.id'] = channelId;
      if (userId) filters['author.id'] = userId;
      if (dateFrom || dateTo) {
        filters.timestamp = {};
        if (dateFrom) filters.timestamp.gte = dateFrom;
        if (dateTo) filters.timestamp.lte = dateTo;
      }
      if (hasAttachments) filters['attachments'] = { exists: true };

      const results = await elasticsearch.searchMessages(q, filters, {
        page,
        size,
        sortBy: sortBy === 'date' ? 'timestamp' : '_score',
        sortOrder: sortBy === 'date' ? 'desc' : 'desc',
        highlight: true,
        fuzzy: true
      });

      const responseTime = Date.now() - startTime;

      trackSearchAnalytics({
        query: q,
        type: 'server_search',
        userId: request.user?.id,
        timestamp: new Date(),
        resultCount: results.total,
        responseTimeMs: responseTime,
        filters: { ...filters, serverId }
      });

      return reply.send({
        success: true,
        data: results,
        query: q,
        serverId,
        took: responseTime
      });

    } catch (error) {
      fastify.log.error('Server search failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Server search failed'
      });
    }
  });

  // Search analytics endpoint
  fastify.get("/analytics", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      const searchStats = await getSearchAnalytics();
      return reply.send({
        success: true,
        data: searchStats
      });
    } catch (error) {
      fastify.log.error('Search analytics failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Analytics unavailable'
      });
    }
  });

  // Bulk indexing endpoint for admin use
  fastify.post("/index/bulk", {
    preHandler: authMiddleware
  }, async (request, reply) => {
    try {
      // Check if user is admin
      if (!request.user?.isAdmin) {
        return reply.code(403).send({
          success: false,
          error: 'Admin access required'
        });
      }

      const { type, limit = 1000 } = request.body as { type: string; limit: number };
      
      let indexed = 0;
      
      switch (type) {
        case 'messages':
          indexed = await bulkIndexMessages(elasticsearch, limit);
          break;
        case 'users':
          indexed = await bulkIndexUsers(elasticsearch, limit);
          break;
        case 'servers':
          indexed = await bulkIndexServers(elasticsearch, limit);
          break;
        case 'communities':
          indexed = await bulkIndexCommunities(elasticsearch, limit);
          break;
        case 'posts':
          indexed = await bulkIndexPosts(elasticsearch, limit);
          break;
        default:
          return reply.code(400).send({
            success: false,
            error: 'Invalid type specified'
          });
      }

      return reply.send({
        success: true,
        indexed,
        type
      });

    } catch (error) {
      fastify.log.error('Bulk indexing failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Bulk indexing failed'
      });
    }
  });

  async function trackSearchAnalytics(data: SearchAnalytics) {
    try {
      // Store in queue for async processing
      await fastify.queues.analytics.add('search_analytics', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    } catch (error) {
      fastify.log.warn('Failed to queue search analytics:', error);
    }
  }

  async function getSearchAnalytics() {
    // Get search analytics from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // This would typically query a TimescaleDB or analytics store
    // For now, return basic metrics
    return {
      totalSearches: 0,
      averageResponseTime: 0,
      popularQueries: [],
      searchTypes: {},
      period: '30d'
    };
  }

  return;
};

// Helper functions for different search types
async function searchMessages(elasticsearch: CrashProofElasticsearchService, query: string, filters: any, options: any) {
  return await elasticsearch.searchMessages(query, filters, {
    page: options.page,
    size: options.size,
    sortBy: options.sortBy === 'date' ? 'timestamp' : '_score',
    sortOrder: options.sortOrder,
    fuzzy: options.fuzzy,
    highlight: true
  });
}

async function searchUsersElastic(elasticsearch: CrashProofElasticsearchService, query: string, options: any) {
  // This would search in a users index - for now return empty
  return { results: [], total: 0 };
}

async function searchServersElastic(elasticsearch: CrashProofElasticsearchService, query: string, options: any) {
  // This would search in a servers index - for now return empty
  return { results: [], total: 0 };
}

async function searchCommunitiesElastic(elasticsearch: CrashProofElasticsearchService, query: string, options: any) {
  // This would search in a communities index - for now return empty
  return { results: [], total: 0 };
}

async function searchPostsElastic(elasticsearch: CrashProofElasticsearchService, query: string, filters: any, options: any) {
  // This would search in a posts index - for now return empty
  return { results: [], total: 0 };
}

async function fallbackDatabaseSearch(query: string, type: string, options: any) {
  // Fallback to database search when Elasticsearch is unavailable
  const { page, size } = options;
  const skip = (page - 1) * size;
  
  switch (type) {
    case 'messages':
    case 'all':
      return await prisma.message.findMany({
        where: {
          content: { contains: query, mode: "insensitive" }
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
          channel: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' }
      });
    default:
      return [];
  }
}

// Index creation helpers
async function createUserIndex(elasticsearch: CrashProofElasticsearchService) {
  const userMapping = {
    properties: {
      username: {
        type: 'text',
        analyzer: 'custom_text_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete_analyzer',
            search_analyzer: 'search_analyzer'
          }
        }
      },
      displayName: {
        type: 'text',
        analyzer: 'custom_text_analyzer'
      },
      bio: {
        type: 'text',
        analyzer: 'custom_text_analyzer'
      },
      isVerified: { type: 'boolean' },
      memberSince: { type: 'date' },
      lastActive: { type: 'date' }
    }
  };
  
  await elasticsearch.createIndex('users', userMapping);
}

async function createServerIndex(elasticsearch: CrashProofElasticsearchService) {
  const serverMapping = {
    properties: {
      name: {
        type: 'text',
        analyzer: 'custom_text_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete_analyzer',
            search_analyzer: 'search_analyzer'
          }
        }
      },
      description: {
        type: 'text',
        analyzer: 'custom_text_analyzer'
      },
      isPublic: { type: 'boolean' },
      memberCount: { type: 'integer' },
      createdAt: { type: 'date' }
    }
  };
  
  await elasticsearch.createIndex('servers', serverMapping);
}

async function createCommunityIndex(elasticsearch: CrashProofElasticsearchService) {
  const communityMapping = {
    properties: {
      name: {
        type: 'text',
        analyzer: 'custom_text_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          autocomplete: {
            type: 'text',
            analyzer: 'autocomplete_analyzer',
            search_analyzer: 'search_analyzer'
          }
        }
      },
      displayName: {
        type: 'text',
        analyzer: 'custom_text_analyzer'
      },
      description: {
        type: 'text',
        analyzer: 'custom_text_analyzer'
      },
      isPublic: { type: 'boolean' },
      memberCount: { type: 'integer' },
      postCount: { type: 'integer' },
      createdAt: { type: 'date' }
    }
  };
  
  await elasticsearch.createIndex('communities', communityMapping);
}

async function createPostIndex(elasticsearch: CrashProofElasticsearchService) {
  const postMapping = {
    properties: {
      title: {
        type: 'text',
        analyzer: 'custom_text_analyzer',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      content: {
        type: 'text',
        analyzer: 'custom_text_analyzer'
      },
      author: {
        properties: {
          id: { type: 'keyword' },
          username: { type: 'keyword' },
          displayName: { type: 'text' }
        }
      },
      community: {
        properties: {
          id: { type: 'keyword' },
          name: { type: 'keyword' },
          displayName: { type: 'text' }
        }
      },
      score: { type: 'integer' },
      commentCount: { type: 'integer' },
      createdAt: { type: 'date' }
    }
  };
  
  await elasticsearch.createIndex('posts', postMapping);
}

// Bulk indexing functions
async function bulkIndexMessages(elasticsearch: CrashProofElasticsearchService, limit: number): Promise<number> {
  const messages = await prisma.message.findMany({
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      },
      channel: {
        select: {
          id: true,
          name: true,
          serverId: true
        }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  const bulkData = messages.map(message => ({
    id: message.id,
    content: message.content,
    metadata: {
      author: message.user,
      channel: message.channel,
      timestamp: message.createdAt.toISOString(),
      attachments: message.attachments || []
    }
  }));

  await elasticsearch.indexBulkMessages(bulkData);
  return messages.length;
}

async function bulkIndexUsers(elasticsearch: CrashProofElasticsearchService, limit: number): Promise<number> {
  // Implementation for bulk indexing users
  return 0;
}

async function bulkIndexServers(elasticsearch: CrashProofElasticsearchService, limit: number): Promise<number> {
  // Implementation for bulk indexing servers
  return 0;
}

async function bulkIndexCommunities(elasticsearch: CrashProofElasticsearchService, limit: number): Promise<number> {
  // Implementation for bulk indexing communities
  return 0;
}

async function bulkIndexPosts(elasticsearch: CrashProofElasticsearchService, limit: number): Promise<number> {
  // Implementation for bulk indexing posts
  return 0;
}

export default enhancedSearchRoutes;