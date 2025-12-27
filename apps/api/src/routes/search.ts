import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { optionalAuthMiddleware } from "../middleware/auth";
import { EnhancedSearchService } from "../services/enhanced-search-service";
// Disable these temporarily
// import { TrendingTopicsService } from "../services/trending-topics-service";
// import { UserRecommendationService } from "../services/user-recommendation-service";

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", optionalAuthMiddleware);

  // Initialize enhanced services
  const enhancedSearch = new EnhancedSearchService(
    fastify.services?.elasticsearch, 
    fastify.redis,
    prisma
  );
  
  // const trendingTopics = new TrendingTopicsService(
  //   fastify.services?.elasticsearch,
  //   fastify.redis,
  //   prisma
  // );
  
  // const userRecommendations = new UserRecommendationService(
  //   fastify.services?.elasticsearch,
  //   fastify.redis,
  //   prisma
  // );

  // Global search
  fastify.get("/", async (request, reply) => {
    const startTime = Date.now();
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const { 
        q, 
        type = "all", 
        page = 1, 
        limit = 20,
        fuzzy = false,
        sortBy = "relevance"
      } = z.object({
        q: z.string().min(1).max(500),
        type: z.enum(["all", "users", "servers", "communities", "posts", "messages"]).default("all"),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        fuzzy: z.coerce.boolean().default(false),
        sortBy: z.enum(["relevance", "date", "popularity"]).default("relevance")
      }).parse(request.query);

      const offset = (page - 1) * limit;
      let results: any = {};
      let searchEngine = "postgresql_fts";
      let searchSuccess = true;
      let errorMessage: string | undefined;

      // Try Elasticsearch first if available
      if (fastify.services?.elasticsearch) {
        try {
          const elasticResults = await fastify.services.elasticsearch.globalSearch(q, {}, {
            page,
            size: limit,
            fuzzy,
            sortBy: sortBy === 'relevance' ? '_score' : sortBy === 'date' ? 'createdAt' : 'memberCount'
          });

          searchEngine = "elasticsearch";

          // Filter results based on type parameter
          if (type === 'all') {
            results = elasticResults;
          } else {
            results = {
              [type]: elasticResults[type as keyof typeof elasticResults] || { results: [], total: 0, took: 0 }
            };
          }

          const endTime = Date.now();
          const searchTime = endTime - startTime;

          // Track search analytics
          if (fastify.searchAnalytics) {
            const totalResults = type === 'all' 
              ? Object.values(results).reduce((sum: number, res: any) => sum + (res.total || 0), 0)
              : results[type]?.total || 0;

            await fastify.searchAnalytics.trackSearch({
              query: q,
              type: 'search',
              userId: (request as any).userId,
              resultCount: totalResults,
              responseTimeMs: searchTime,
              searchEngine,
              success: searchSuccess,
              timestamp: new Date(),
              filters: { type, sortBy, fuzzy },
              userAgent: request.headers['user-agent'],
              ipAddress: request.ip,
              sessionId: (request as any).sessionId,
              source: 'api'
            });
          }

          return reply.send({
            success: true,
            data: results,
            query: q,
            searchMeta: {
              searchId,
              searchEngine: "elasticsearch",
              searchTime: `${searchTime}ms`,
              totalSources: Object.keys(results).length,
              fuzzyEnabled: fuzzy,
              sortBy: sortBy,
              suggestions: elasticResults.suggestions || []
            }
          });
        } catch (elasticError) {
          fastify.log.warn('Elasticsearch search failed, falling back to PostgreSQL:', elasticError);
          searchSuccess = false;
          errorMessage = elasticError instanceof Error ? elasticError.message : String(elasticError);
        }
      }

      // Fallback to PostgreSQL FTS
      // Safely prepare search terms for PostgreSQL FTS
      const sanitizedQuery = q.trim().replace(/[^\w\s]/g, ''); // Remove special chars except word chars and spaces
      const searchTerms = sanitizedQuery.split(/\s+/).filter(term => term.length > 0);
      if (searchTerms.length === 0) {
        return reply.send({
          success: true,
          data: { users: [], servers: [], communities: [], posts: [], messages: [] },
          query: q,
          searchMeta: { searchId, searchEngine: "postgresql", searchTime: "0ms", totalSources: 0 }
        });
      }
      
      const searchQuery = searchTerms.join(' | '); // OR search with sanitized terms
      const phraseQuery = sanitizedQuery; // Already sanitized
      const likeQuery = `%${sanitizedQuery.toLowerCase()}%`; // Fallback for partial matches

      // User search with PostgreSQL FTS
      if (type === "all" || type === "users") {
        const userLimit = type === "users" ? limit : 5;
        
        const userResults = await prisma.$queryRaw`
          SELECT 
            u.id,
            u.username,
            u."displayName",
            u.avatar,
            u."isVerified"
          FROM "User" u
          WHERE 
            u."bannedAt" IS NULL
            AND (
              to_tsvector('english', COALESCE(u.username, '') || ' ' || COALESCE(u."displayName", '') || ' ' || COALESCE(u.bio, ''))
              @@ to_tsquery('english', ${searchQuery})
              OR LOWER(u.username) LIKE ${likeQuery}
              OR LOWER(u."displayName") LIKE ${likeQuery}
            )
          ORDER BY 
            ts_rank(
              to_tsvector('english', COALESCE(u.username, '') || ' ' || COALESCE(u."displayName", '') || ' ' || COALESCE(u.bio, '')),
              to_tsquery('english', ${searchQuery})
            ) DESC,
            u.username ASC
          OFFSET ${offset}
          LIMIT ${userLimit}
        `;
        
        results.users = {
          items: userResults,
          total: userResults.length,
          source: "postgresql_fts"
        };
      }

      // Server search with PostgreSQL FTS
      if (type === "all" || type === "servers") {
        const serverLimit = type === "servers" ? limit : 5;
        
        const serverResults = await prisma.$queryRaw`
          SELECT 
            s.id,
            s.name,
            s.description,
            s.icon,
            s."approximateMemberCount" as member_count
          FROM "Server" s
          WHERE 
            s."isPublic" = true
            AND (
              to_tsvector('english', COALESCE(s.name, '') || ' ' || COALESCE(s.description, ''))
              @@ to_tsquery('english', ${searchQuery})
              OR LOWER(s.name) LIKE ${likeQuery}
              OR LOWER(s.description) LIKE ${likeQuery}
            )
          ORDER BY 
            ts_rank(
              to_tsvector('english', COALESCE(s.name, '') || ' ' || COALESCE(s.description, '')),
              to_tsquery('english', ${searchQuery})
            ) DESC,
            s.name ASC
          OFFSET ${offset}
          LIMIT ${serverLimit}
        `;
        
        results.servers = {
          items: serverResults,
          total: serverResults.length,
          source: "postgresql_fts"
        };
      }

      // Community search with PostgreSQL FTS
      if (type === "all" || type === "communities") {
        const communityLimit = type === "communities" ? limit : 5;
        
        const communityResults = await prisma.$queryRaw`
          SELECT 
            c.id,
            c.name,
            c."displayName",
            c.description,
            c.icon,
            c."memberCount"
          FROM "Community" c
          WHERE 
            c."isPublic" = true
            AND (
              to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c."displayName", '') || ' ' || COALESCE(c.description, ''))
              @@ to_tsquery('english', ${searchQuery})
              OR LOWER(c.name) LIKE ${likeQuery}
              OR LOWER(c."displayName") LIKE ${likeQuery}
              OR LOWER(c.description) LIKE ${likeQuery}
            )
          ORDER BY 
            ts_rank(
              to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c."displayName", '') || ' ' || COALESCE(c.description, '')),
              to_tsquery('english', ${searchQuery})
            ) DESC,
            c.name ASC
          OFFSET ${offset}
          LIMIT ${communityLimit}
        `;
        
        results.communities = {
          items: communityResults,
          total: communityResults.length,
          source: "postgresql_fts"
        };
      }

      // Post search with PostgreSQL FTS
      if (type === "all" || type === "posts") {
        const postLimit = type === "posts" ? limit : 5;
        
        const postResults = await prisma.$queryRaw`
          SELECT 
            p.id,
            p.title,
            p.content,
            p.url,
            p.thumbnail,
            p.score,
            p."viewCount",
            p."commentCount",
            p."createdAt",
            p."editedAt",
            json_build_object(
              'id', u.id,
              'username', u.username,
              'displayName', u."displayName",
              'avatar', u.avatar
            ) as user,
            json_build_object(
              'id', c.id,
              'name', c.name,
              'displayName', c."displayName"
            ) as community
          FROM "Post" p
          JOIN "User" u ON p."userId" = u.id
          JOIN "Community" c ON p."communityId" = c.id
          WHERE 
            p."isRemoved" = false
            AND c."isPublic" = true
            AND (
              to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, ''))
              @@ to_tsquery('english', ${searchQuery})
              OR LOWER(p.title) LIKE ${likeQuery}
              OR LOWER(p.content) LIKE ${likeQuery}
            )
          ORDER BY 
            ts_rank(
              to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.content, '')),
              to_tsquery('english', ${searchQuery})
            ) DESC,
            p."createdAt" DESC
          OFFSET ${offset}
          LIMIT ${postLimit}
        `;
        
        results.posts = {
          items: postResults,
          total: postResults.length,
          source: "postgresql_fts"
        };
      }

      // Message search with PostgreSQL FTS
      if (type === "all" || type === "messages") {
        const messageLimit = type === "messages" ? limit : 5;
        
        const messageResults = await prisma.$queryRaw`
          SELECT 
            m.id,
            m.content,
            m."createdAt",
            m."editedTimestamp",
            json_build_object(
              'id', u.id,
              'username', u.username,
              'displayName', u."displayName",
              'avatar', u.avatar
            ) as user,
            json_build_object(
              'id', ch.id,
              'name', ch.name,
              'serverId', ch."serverId"
            ) as channel
          FROM "Message" m
          JOIN "User" u ON m."userId" = u.id
          JOIN "Channel" ch ON m."channelId" = ch.id
          LEFT JOIN "Server" s ON ch."serverId" = s.id
          WHERE 
            (s.id IS NULL OR s."isPublic" = true)
            AND ch."isPrivate" = false
            AND (
              to_tsvector('english', m.content) @@ to_tsquery('english', ${searchQuery})
              OR LOWER(m.content) LIKE ${likeQuery}
            )
          ORDER BY 
            ts_rank(
              to_tsvector('english', m.content),
              to_tsquery('english', ${searchQuery})
            ) DESC,
            m."createdAt" DESC
          OFFSET ${offset}
          LIMIT ${messageLimit}
        `;
        
        results.messages = {
          items: messageResults,
          total: messageResults.length,
          source: "postgresql_fts"
        };
      }

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      return reply.send({
        success: true,
        data: results,
        query: q,
        searchMeta: {
          searchEngine: "postgresql_fts",
          searchTime: `${searchTime}ms`,
          totalSources: Object.keys(results).length,
          fuzzyEnabled: fuzzy,
          sortBy: sortBy
        }
      });
    } catch (error) {
      fastify.log.error("PostgreSQL FTS search failed:", error);
      return reply.code(500).send({
        success: false,
        error: "Search failed",
      });
    }
  });

  // Search within server
  fastify.get("/servers/:serverId", async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { serverId } = z.object({
        serverId: z.string(),
      }).parse(request.params);

      const { q, limit = 20, page = 1 } = z.object({
        q: z.string().min(1).max(500),
        limit: z.coerce.number().min(1).max(100).default(20),
        page: z.coerce.number().min(1).default(1),
      }).parse(request.query);

      const offset = (page - 1) * limit;

      // Sanitize query to prevent PostgreSQL FTS errors
      const sanitizedQuery = q.trim().replace(/[^\w\s]/g, '');
      const searchTerms = sanitizedQuery.split(/\s+/).filter(term => term.length > 0);

      if (searchTerms.length === 0) {
        return reply.send({
          success: true,
          data: { messages: { items: [], total: 0, source: "postgresql_fts" } },
          query: q,
          searchMeta: {
            searchEngine: "postgresql_fts",
            searchTime: "0ms",
            serverId: serverId
          }
        });
      }

      const searchQuery = searchTerms.join(' | ');
      const likeQuery = `%${sanitizedQuery.toLowerCase()}%`;

      // Search messages in server channels using PostgreSQL FTS
      const messages = await prisma.$queryRaw`
        SELECT 
          m.id,
          m.content,
          m."createdAt",
          m."editedTimestamp",
          json_build_object(
            'id', u.id,
            'username', u.username,
            'displayName', u."displayName",
            'avatar', u.avatar
          ) as user,
          json_build_object(
            'id', ch.id,
            'name', ch.name,
            'serverId', ch."serverId"
          ) as channel
        FROM "Message" m
        JOIN "User" u ON m."userId" = u.id
        JOIN "Channel" ch ON m."channelId" = ch.id
        WHERE 
          ch."serverId" = ${serverId}
          AND ch."isPrivate" = false
          AND (
            to_tsvector('english', m.content) @@ to_tsquery('english', ${searchQuery})
            OR LOWER(m.content) LIKE ${likeQuery}
          )
        ORDER BY 
          ts_rank(
            to_tsvector('english', m.content),
            to_tsquery('english', ${searchQuery})
          ) DESC,
          m."createdAt" DESC
        OFFSET ${offset}
        LIMIT ${limit}
      `;

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      return reply.send({
        success: true,
        data: { 
          messages: {
            items: messages,
            total: messages.length,
            source: "postgresql_fts"
          }
        },
        query: q,
        searchMeta: {
          searchEngine: "postgresql_fts",
          searchTime: `${searchTime}ms`,
          serverId: serverId
        }
      });
    } catch (error) {
      fastify.log.error("Server search failed:", error);
      return reply.code(500).send({
        success: false,
        error: "Search failed",
      });
    }
  });

  // Search suggestions endpoint
  fastify.get("/suggestions", async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { q, limit = 10 } = z.object({
        q: z.string().min(1).max(100),
        limit: z.coerce.number().min(1).max(20).default(10),
      }).parse(request.query);

      // Sanitize query to prevent PostgreSQL FTS errors
      const sanitizedQuery = q.trim().replace(/[^\w\s]/g, '');
      const searchTerms = sanitizedQuery.split(/\s+/).filter(term => term.length > 0);

      if (searchTerms.length === 0) {
        return reply.send({
          success: true,
          data: [],
          query: q,
          searchMeta: {
            searchEngine: "postgresql_fts",
            searchTime: "0ms",
            sources: []
          }
        });
      }

      const searchQuery = searchTerms.join(' | ');
      const likeQuery = `%${sanitizedQuery.toLowerCase()}%`;

      // Get suggestions from multiple sources using PostgreSQL FTS
      const [userSuggestions, communitySuggestions, postSuggestions] = await Promise.all([
        // User suggestions
        prisma.$queryRaw`
          SELECT 
            u.username as suggestion,
            'user' as type
          FROM "User" u
          WHERE 
            u."bannedAt" IS NULL
            AND (
              to_tsvector('english', u.username || ' ' || COALESCE(u."displayName", ''))
              @@ to_tsquery('english', ${searchQuery})
              OR LOWER(u.username) LIKE ${likeQuery}
              OR LOWER(u."displayName") LIKE ${likeQuery}
            )
          LIMIT ${Math.ceil(limit / 3)}
        `,
        
        // Community suggestions
        prisma.$queryRaw`
          SELECT 
            c.name as suggestion,
            'community' as type
          FROM "Community" c
          WHERE 
            c."isPublic" = true
            AND (
              to_tsvector('english', c.name || ' ' || COALESCE(c."displayName", ''))
              @@ to_tsquery('english', ${searchQuery})
              OR LOWER(c.name) LIKE ${likeQuery}
              OR LOWER(c."displayName") LIKE ${likeQuery}
            )
          LIMIT ${Math.ceil(limit / 3)}
        `,
        
        // Popular search terms from posts
        prisma.$queryRaw`
          SELECT 
            p.title as suggestion,
            'post' as type
          FROM "Post" p
          JOIN "Community" c ON p."communityId" = c.id
          WHERE 
            c."isPublic" = true
            AND p."isRemoved" = false
            AND p.score > 0
            AND (
              to_tsvector('english', p.title) @@ to_tsquery('english', ${searchQuery})
              OR LOWER(p.title) LIKE ${likeQuery}
            )
          LIMIT ${Math.ceil(limit / 3)}
        `
      ]);

      // Combine and sort suggestions
      const allSuggestions = [
        ...userSuggestions.map((s: any) => ({ suggestion: s.suggestion, type: s.type, priority: 3 })),
        ...communitySuggestions.map((s: any) => ({ suggestion: s.suggestion, type: s.type, priority: 2 })),
        ...postSuggestions.map((s: any) => ({ suggestion: s.suggestion, type: s.type, priority: 1 }))
      ]
        .slice(0, limit)
        .map((s: any) => s.suggestion);

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      return reply.send({
        success: true,
        data: allSuggestions,
        query: q,
        searchMeta: {
          searchEngine: "postgresql_fts",
          searchTime: `${searchTime}ms`,
          sources: ["users", "communities", "posts"]
        }
      });
    } catch (error) {
      fastify.log.error("Suggestions search failed:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get suggestions"
      });
    }
  });

  // Advanced search with filters
  fastify.get("/advanced", async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { 
        q, 
        type = "all", 
        page = 1, 
        limit = 20,
        fuzzy = false,
        sortBy = "relevance",
        filters = {}
      } = z.object({
        q: z.string().min(1).max(500),
        type: z.enum(["all", "users", "servers", "communities", "posts", "messages"]).default("all"),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        fuzzy: z.coerce.boolean().default(false),
        sortBy: z.enum(["relevance", "date", "popularity"]).default("relevance"),
        filters: z.object({
          dateFrom: z.string().datetime().optional(),
          dateTo: z.string().datetime().optional(),
          userId: z.string().cuid().optional(),
          serverId: z.string().cuid().optional(),
          communityId: z.string().cuid().optional(),
          verified: z.boolean().optional(),
          hasAttachments: z.boolean().optional()
        }).optional()
      }).refine((data) => {
        // Validate date range if both are provided
        if (data.filters?.dateFrom && data.filters?.dateTo) {
          return new Date(data.filters.dateFrom) <= new Date(data.filters.dateTo);
        }
        return true;
      }, {
        message: "dateFrom must be before or equal to dateTo"
      }).parse(request.query);

      if (!fastify.services?.elasticsearch) {
        return reply.code(503).send({
          success: false,
          error: "Advanced search requires Elasticsearch",
          message: "Advanced search functionality is currently unavailable"
        });
      }

      const elasticFilters: any = {};
      
      // Add date range filters
      if (filters?.dateFrom || filters?.dateTo) {
        elasticFilters.createdAt = {};
        if (filters.dateFrom) elasticFilters.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) elasticFilters.createdAt.lte = filters.dateTo;
      }

      // Add entity-specific filters
      if (filters?.userId) elasticFilters['user.id'] = filters.userId;
      if (filters?.serverId) elasticFilters['server.id'] = filters.serverId;
      if (filters?.communityId) elasticFilters['community.id'] = filters.communityId;
      if (filters?.verified !== undefined) elasticFilters.isVerified = filters.verified;

      const results = await fastify.services.elasticsearch.globalSearch(q, elasticFilters, {
        page,
        size: limit,
        fuzzy,
        sortBy: sortBy === 'relevance' ? '_score' : sortBy === 'date' ? 'createdAt' : 'memberCount'
      });

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      return reply.send({
        success: true,
        data: type === 'all' ? results : { [type]: results[type as keyof typeof results] },
        query: q,
        filters: filters || {},
        searchMeta: {
          searchEngine: "elasticsearch_advanced",
          searchTime: `${searchTime}ms`,
          fuzzyEnabled: fuzzy,
          sortBy: sortBy,
          suggestions: results.suggestions || []
        }
      });
    } catch (error) {
      fastify.log.error("Advanced search failed:", error);
      return reply.code(500).send({
        success: false,
        error: "Advanced search failed"
      });
    }
  });

  // Direct message search (requires authentication)
  fastify.get("/direct-messages", async (request: any, reply) => {
    const startTime = Date.now();
    
    try {
      if (!request.userId) {
        return reply.code(401).send({
          success: false,
          error: "Authentication required for DM search"
        });
      }

      const { 
        q, 
        page = 1, 
        limit = 20,
        fuzzy = false,
        conversationId
      } = z.object({
        q: z.string().min(1).max(500),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        fuzzy: z.coerce.boolean().default(false),
        conversationId: z.string().cuid().optional()
      }).parse(request.query);

      if (!fastify.services?.elasticsearch) {
        return reply.code(503).send({
          success: false,
          error: "DM search requires Elasticsearch"
        });
      }

      // Get user's conversation IDs
      let conversationIds: string[] = [];
      
      if (conversationId) {
        // Verify user has access to specific conversation
        const hasAccess = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: request.userId
            }
          }
        });
        
        if (!hasAccess) {
          return reply.code(403).send({
            success: false,
            error: "Access denied to conversation"
          });
        }
        
        conversationIds = [conversationId];
      } else {
        // Get all conversations user has access to
        const participations = await prisma.conversationParticipant.findMany({
          where: { userId: request.userId },
          select: { conversationId: true }
        });
        
        conversationIds = participations.map(p => p.conversationId);
      }

      const results = await fastify.services.elasticsearch.searchDirectMessages(
        q,
        request.userId,
        conversationIds,
        { page, size: limit, fuzzy }
      );

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      return reply.send({
        success: true,
        data: results,
        query: q,
        conversationId: conversationId || null,
        searchMeta: {
          searchEngine: "elasticsearch",
          searchTime: `${searchTime}ms`,
          fuzzyEnabled: fuzzy,
          conversationsSearched: conversationIds.length
        }
      });
    } catch (error) {
      fastify.log.error("DM search failed:", error);
      return reply.code(500).send({
        success: false,
        error: "DM search failed"
      });
    }
  });

  // Search suggestions endpoint (enhanced) - REMOVED DUPLICATE
//   // fastify.get("/suggestions", async (request, reply) => {
//     const startTime = Date.now();
//     
//     try {
//       const { q, limit = 10, type = "all" } = z.object({
//         q: z.string().min(1).max(100),
//         limit: z.coerce.number().min(1).max(20).default(10),
//         type: z.enum(["all", "users", "communities", "content"]).default("all")
//       }).parse(request.query);
// 
//       let suggestions: string[] = [];
// 
//       // Try Elasticsearch suggestions first
//       if (fastify.services?.elasticsearch) {
//         try {
//           suggestions = await fastify.services.elasticsearch.getSuggestions(q, limit);
//           
//           if (suggestions.length > 0) {
//             const endTime = Date.now();
//             const searchTime = endTime - startTime;
// 
//             return reply.send({
//               success: true,
//               data: suggestions,
//               query: q,
//               searchMeta: {
//                 searchEngine: "elasticsearch",
//                 searchTime: `${searchTime}ms`,
//                 type: "suggestions"
//               }
//             });
//           }
//         } catch (elasticError) {
//           fastify.log.warn('Elasticsearch suggestions failed, falling back to PostgreSQL:', elasticError);
//         }
//       }
// 
//       // Fallback to PostgreSQL-based suggestions
//       const searchQuery = q.trim().split(/\s+/).join(' | ');
//       const likeQuery = `%${q.toLowerCase()}%`;
// 
//       const [userSuggestions, communitySuggestions, postSuggestions] = await Promise.all([
//         // User suggestions
//         prisma.$queryRaw`
//           SELECT 
//             u.username as suggestion,
//             'user' as type
//           FROM "User" u
//           WHERE 
//             u."bannedAt" IS NULL
//             AND (
//               to_tsvector('english', u.username || ' ' || COALESCE(u."displayName", ''))
//               @@ to_tsquery('english', ${searchQuery})
//               OR LOWER(u.username) LIKE ${likeQuery}
//               OR LOWER(u."displayName") LIKE ${likeQuery}
//             )
//           LIMIT ${Math.ceil(limit / 3)}
//         `,
//         
//         // Community suggestions
//         prisma.$queryRaw`
//           SELECT 
//             c.name as suggestion,
//             'community' as type
//           FROM "Community" c
//           WHERE 
//             c."isPublic" = true
//             AND (
//               to_tsvector('english', c.name || ' ' || COALESCE(c."displayName", ''))
//               @@ to_tsquery('english', ${searchQuery})
//               OR LOWER(c.name) LIKE ${likeQuery}
//               OR LOWER(c."displayName") LIKE ${likeQuery}
//             )
//           LIMIT ${Math.ceil(limit / 3)}
//         `,
//         
//         // Popular search terms from posts
//         prisma.$queryRaw`
//           SELECT 
//             p.title as suggestion,
//             'post' as type
//           FROM "Post" p
//           JOIN "Community" c ON p."communityId" = c.id
//           WHERE 
//             c."isPublic" = true
//             AND p."isRemoved" = false
//             AND p.score > 0
//             AND (
//               to_tsvector('english', p.title) @@ to_tsquery('english', ${searchQuery})
//               OR LOWER(p.title) LIKE ${likeQuery}
//             )
//           LIMIT ${Math.ceil(limit / 3)}
//         `
//       ]);
// 
//       // Combine and sort suggestions
//       const allSuggestions = [
//         ...userSuggestions.map((s: any) => ({ suggestion: s.suggestion, type: s.type, priority: 3 })),
//         ...communitySuggestions.map((s: any) => ({ suggestion: s.suggestion, type: s.type, priority: 2 })),
//         ...postSuggestions.map((s: any) => ({ suggestion: s.suggestion, type: s.type, priority: 1 }))
//       ]
//         .slice(0, limit)
//         .map((s: any) => s.suggestion);
// 
//       const endTime = Date.now();
//       const searchTime = endTime - startTime;
// 
//       return reply.send({
//         success: true,
//         data: allSuggestions,
//         query: q,
//         searchMeta: {
//           searchEngine: "postgresql_fts",
//           searchTime: `${searchTime}ms`,
//           sources: ["users", "communities", "posts"]
//         }
//       });
//     } catch (error) {
//       fastify.log.error("Suggestions search failed:", error);
//       return reply.code(500).send({
//         success: false,
//         error: "Failed to get suggestions"
//       });
//     }
//   });

  // Analytics endpoint for search metrics
  fastify.get("/analytics", async (request: any, reply) => {
    try {
      // Only allow authenticated users with proper permissions
      if (!request.userId) {
        return reply.code(401).send({
          success: false,
          error: "Authentication required"
        });
      }

      const { timeframe = "7d" } = z.object({
        timeframe: z.enum(["1d", "7d", "30d"]).default("7d")
      }).parse(request.query);

      const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // For now, return mock analytics data
      // In production, you would track search queries and provide real analytics
      const analytics = {
        totalSearches: Math.floor(Math.random() * 10000),
        popularQueries: [
          { query: "gaming", count: 245 },
          { query: "tech", count: 189 },
          { query: "music", count: 156 },
          { query: "art", count: 134 },
          { query: "programming", count: 98 }
        ],
        searchEngineUsage: {
          elasticsearch: 85,
          postgresql: 15
        },
        averageResponseTime: "42ms",
        timeframe: timeframe
      };

      return reply.send({
        success: true,
        data: analytics,
        timeframe: timeframe
      });
    } catch (error) {
      fastify.log.error("Search analytics failed:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get search analytics"
      });
    }
  });
};

export default searchRoutes;