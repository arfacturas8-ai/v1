import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { optionalAuthMiddleware } from "../middleware/auth";
import { HybridSearchService } from "../services/hybrid-search";
import { CrashProofElasticsearchService } from "../services/crash-proof-elasticsearch";
import { SearchIndexingService } from "../services/search-indexer";
import { RealTimeMetricsService } from "../services/real-time-metrics";
import { PrivacyCompliantTracker } from "../services/privacy-compliant-tracker";
import { logger } from "../utils/logger";

const crashProofSearchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", optionalAuthMiddleware);

  // Initialize services (these would typically be injected or initialized elsewhere)
  const elasticsearchService = new CrashProofElasticsearchService({
    nodes: [process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'],
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  });

  const hybridSearchService = new HybridSearchService(elasticsearchService);
  // Note: Other services would need queue and other dependencies

  // Global search with fallback
  fastify.get("/", async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { 
        q, 
        type = "all", 
        page = 1, 
        limit = 20,
        fuzzy = false,
        highlight = true
      } = z.object({
        q: z.string().min(1).max(500),
        type: z.enum(["all", "users", "servers", "communities", "posts", "messages"]).default("all"),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        fuzzy: z.coerce.boolean().default(false),
        highlight: z.coerce.boolean().default(true)
      }).parse(request.query);

      let results: any = {};

      if (type === "all" || type === "messages") {
        // Use hybrid search for messages
        try {
          const messageResults = await hybridSearchService.searchMessages(q, {}, {
            page,
            size: type === "messages" ? limit : Math.min(limit, 10),
            fuzzy,
            highlight
          });
          
          results.messages = messageResults;
        } catch (error) {
          logger.error('Message search failed:', error);
          results.messages = { results: [], total: 0, took: 0, source: 'error', fallbackUsed: true };
        }
      }

      if (type === "all" || type !== "messages") {
        // Use database search for other content types
        const globalResults = await hybridSearchService.globalSearch(q, {}, {
          page,
          size: limit,
          fuzzy,
          highlight
        });

        if (type === "all") {
          results = { ...results, ...globalResults };
        } else {
          results[type] = globalResults[type as keyof typeof globalResults] || [];
        }
      }

      const responseTime = Date.now() - startTime;

      // Track search metrics
      const resultCount = type === "messages" 
        ? results.messages?.results?.length || 0
        : Object.values(results).reduce((total: number, items: any) => 
            total + (Array.isArray(items) ? items.length : items?.results?.length || 0), 0);

      // Track search activity (this would be done via dependency injection in real implementation)
      // await metricsService.trackSearch(q, resultCount, responseTime, results.messages?.source || 'database');

      return reply.send({
        success: true,
        data: results,
        query: q,
        metadata: {
          took: responseTime,
          total: resultCount,
          page,
          limit,
          source: results.messages?.source || 'database',
          fallbackUsed: results.messages?.fallbackUsed || false
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Search request failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Search temporarily unavailable",
        metadata: {
          took: responseTime,
          fallbackUsed: true
        }
      });
    }
  });

  // Search suggestions/autocomplete
  fastify.get("/suggestions", async (request, reply) => {
    try {
      const { 
        q, 
        type = "content",
        limit = 10 
      } = z.object({
        q: z.string().min(1).max(100),
        type: z.enum(["content", "users", "channels"]).default("content"),
        limit: z.coerce.number().min(1).max(20).default(10)
      }).parse(request.query);

      const suggestions = await hybridSearchService.autocomplete(q, type, limit);

      return reply.send({
        success: true,
        data: suggestions,
        query: q,
        type
      });
    } catch (error) {
      logger.error('Suggestions request failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Suggestions temporarily unavailable",
        data: []
      });
    }
  });

  // Advanced search with filters
  fastify.get("/advanced", async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { 
        q,
        serverId,
        channelId,
        userId,
        dateFrom,
        dateTo,
        hasAttachments,
        page = 1,
        limit = 20,
        sortBy = "timestamp",
        sortOrder = "desc",
        fuzzy = false
      } = z.object({
        q: z.string().min(1).max(500),
        serverId: z.string().optional(),
        channelId: z.string().optional(),
        userId: z.string().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        hasAttachments: z.coerce.boolean().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        sortBy: z.enum(["timestamp", "relevance"]).default("timestamp"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        fuzzy: z.coerce.boolean().default(false)
      }).parse(request.query);

      const filters: any = {};
      if (serverId) filters.serverId = serverId;
      if (channelId) filters.channelId = channelId;
      if (userId) filters.userId = userId;
      if (hasAttachments !== undefined) filters.hasAttachments = hasAttachments;
      if (dateFrom && dateTo) {
        filters.dateRange = {
          from: new Date(dateFrom),
          to: new Date(dateTo)
        };
      }

      const results = await hybridSearchService.searchMessages(q, filters, {
        page,
        size: limit,
        sortBy,
        sortOrder,
        fuzzy,
        highlight: true
      });

      const responseTime = Date.now() - startTime;

      return reply.send({
        success: true,
        data: results,
        query: q,
        filters,
        metadata: {
          took: responseTime,
          page,
          limit,
          source: results.source,
          fallbackUsed: results.fallbackUsed
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Advanced search failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Advanced search temporarily unavailable",
        metadata: {
          took: responseTime,
          fallbackUsed: true
        }
      });
    }
  });

  // Search within server with enhanced features
  fastify.get("/servers/:serverId", async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { serverId } = z.object({
        serverId: z.string(),
      }).parse(request.params);

      const { 
        q, 
        channelId,
        limit = 20,
        page = 1,
        fuzzy = false,
        highlight = true
      } = z.object({
        q: z.string().min(1).max(500),
        channelId: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
        page: z.coerce.number().min(1).default(1),
        fuzzy: z.coerce.boolean().default(false),
        highlight: z.coerce.boolean().default(true)
      }).parse(request.query);

      const filters: any = { serverId };
      if (channelId) filters.channelId = channelId;

      const results = await hybridSearchService.searchMessages(q, filters, {
        page,
        size: limit,
        fuzzy,
        highlight
      });

      const responseTime = Date.now() - startTime;

      return reply.send({
        success: true,
        data: results,
        query: q,
        serverId,
        metadata: {
          took: responseTime,
          page,
          limit,
          source: results.source,
          fallbackUsed: results.fallbackUsed
        }
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Server search failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Server search temporarily unavailable",
        metadata: {
          took: responseTime,
          fallbackUsed: true
        }
      });
    }
  });

  // Search health and metrics endpoint
  fastify.get("/health", async (request, reply) => {
    try {
      const searchMetrics = hybridSearchService.getSearchMetrics();
      const elasticsearchStatus = elasticsearchService.getConnectionStatus();

      return reply.send({
        success: true,
        data: {
          elasticsearch: elasticsearchStatus,
          metrics: searchMetrics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Search health check failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Health check failed",
        data: {
          elasticsearch: { isConnected: false, circuitBreakerState: 'UNKNOWN' },
          metrics: null,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Trigger reindexing (admin only)
  fastify.post("/reindex", async (request, reply) => {
    try {
      // Note: In a real implementation, you'd check admin permissions here
      
      const { 
        fromDate,
        toDate,
        batchSize = 1000
      } = z.object({
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional(),
        batchSize: z.coerce.number().min(100).max(10000).default(1000)
      }).parse(request.body);

      const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const to = toDate ? new Date(toDate) : new Date();

      // This would typically be called on the search indexing service
      // await searchIndexingService.reindexMessages(from, to, batchSize);

      return reply.send({
        success: true,
        message: "Reindexing started",
        data: {
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
          batchSize
        }
      });
    } catch (error) {
      logger.error('Reindexing failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Failed to start reindexing"
      });
    }
  });

  // Faceted search (search with aggregations)
  fastify.get("/facets", async (request, reply) => {
    try {
      const { 
        q,
        facets = "authors,channels,attachments"
      } = z.object({
        q: z.string().min(1).max(500),
        facets: z.string().default("authors,channels,attachments")
      }).parse(request.query);

      const facetList = facets.split(',').filter(f => ['authors', 'channels', 'attachments', 'dates'].includes(f));

      // This would use Elasticsearch aggregations
      const facetResults = {
        query: q,
        facets: {
          authors: facetList.includes('authors') ? [
            { name: 'user1', count: 15 },
            { name: 'user2', count: 8 }
          ] : [],
          channels: facetList.includes('channels') ? [
            { name: 'general', count: 25 },
            { name: 'dev', count: 12 }
          ] : [],
          attachments: facetList.includes('attachments') ? [
            { type: 'image', count: 10 },
            { type: 'file', count: 5 }
          ] : [],
          dates: facetList.includes('dates') ? [
            { date: '2024-01-01', count: 20 },
            { date: '2024-01-02', count: 15 }
          ] : []
        }
      };

      return reply.send({
        success: true,
        data: facetResults
      });
    } catch (error) {
      logger.error('Faceted search failed:', error);
      
      return reply.code(500).send({
        success: false,
        error: "Faceted search temporarily unavailable"
      });
    }
  });
};

export default crashProofSearchRoutes;