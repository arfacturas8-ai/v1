import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { optionalAuthMiddleware } from "../middleware/auth";

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", optionalAuthMiddleware);

  // Global search
  fastify.get("/", async (request, reply) => {
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

      const results: any = {};

      // Try Elasticsearch first for messages if available
      if ((type === "all" || type === "messages") && fastify.services?.elasticsearch) {
        try {
          const esResults = await fastify.services.elasticsearch.searchMessages(q, {}, {
            page,
            size: type === "messages" ? limit : 5,
            fuzzy,
            sortBy: sortBy === "relevance" ? "_score" : "timestamp",
            sortOrder: sortBy === "date" ? "desc" : undefined
          });
          
          results.messages = {
            items: esResults.results,
            total: esResults.total,
            took: esResults.took,
            source: "elasticsearch"
          };
        } catch (error) {
          fastify.log.warn("Elasticsearch search failed, falling back to database:", error);
          // Fallback to database search will happen below
        }
      }

      // Database search for other types or fallback
      const searchTerm = `%${q}%`;

      if (type === "all" || type === "users") {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
          take: type === "users" ? limit : 5,
        });
        results.users = users;
      }

      if (type === "all" || type === "servers") {
        const servers = await prisma.server.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
            isPublic: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            _count: {
              select: { members: true },
            },
          },
          take: type === "servers" ? limit : 5,
        });
        results.servers = servers;
      }

      if (type === "all" || type === "communities") {
        const communities = await prisma.community.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
            isPublic: true,
          },
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            memberCount: true,
          },
          take: type === "communities" ? limit : 5,
        });
        results.communities = communities;
      }

      if (type === "all" || type === "posts") {
        const posts = await prisma.post.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            community: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
            _count: {
              select: { comments: true },
            },
          },
          take: type === "posts" ? limit : 5,
          orderBy: { score: "desc" },
        });
        results.posts = posts;
      }

      // Fallback message search if Elasticsearch wasn't used or failed
      if ((type === "all" || type === "messages") && !results.messages) {
        const messages = await prisma.message.findMany({
          where: {
            content: { contains: q, mode: "insensitive" },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            channel: {
              select: {
                id: true,
                name: true,
                serverId: true,
              },
            },
          },
          take: type === "messages" ? limit : 5,
          orderBy: { createdAt: "desc" },
        });
        
        results.messages = {
          items: messages,
          total: messages.length,
          source: "database"
        };
      }

      return reply.send({
        success: true,
        data: results,
        query: q,
        searchMeta: {
          elasticsearchUsed: !!results.messages?.source === "elasticsearch",
          totalSources: Object.keys(results).length
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Search failed",
      });
    }
  });

  // Search within server
  fastify.get("/servers/:serverId", async (request, reply) => {
    try {
      const { serverId } = z.object({
        serverId: z.string(),
      }).parse(request.params);

      const { q, limit = 20 } = z.object({
        q: z.string().min(1).max(500),
        limit: z.coerce.number().min(1).max(100).default(20),
      }).parse(request.query);

      // Search messages in server channels
      const messages = await prisma.message.findMany({
        where: {
          content: { contains: q, mode: "insensitive" },
          channel: {
            serverId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return reply.send({
        success: true,
        data: { messages },
        query: q,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Search failed",
      });
    }
  });

  // Search suggestions endpoint
  fastify.get("/suggestions", async (request, reply) => {
    try {
      const { q, limit = 10 } = z.object({
        q: z.string().min(1).max(100),
        limit: z.coerce.number().min(1).max(20).default(10),
      }).parse(request.query);

      let suggestions: string[] = [];

      // Try Elasticsearch suggestions first
      if (fastify.services?.elasticsearch) {
        try {
          suggestions = await fastify.services.elasticsearch.searchSuggestions(q, limit);
        } catch (error) {
          fastify.log.warn("Elasticsearch suggestions failed:", error);
        }
      }

      // Fallback to simple database suggestions if needed
      if (suggestions.length === 0) {
        const messages = await prisma.message.findMany({
          where: {
            content: { contains: q, mode: "insensitive" }
          },
          select: { content: true },
          distinct: ['content'],
          take: limit,
          orderBy: { createdAt: "desc" }
        });
        
        suggestions = messages
          .map(msg => msg.content)
          .filter(content => content.toLowerCase().includes(q.toLowerCase()))
          .slice(0, limit);
      }

      return reply.send({
        success: true,
        data: suggestions,
        query: q
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get suggestions"
      });
    }
  });
};

export default searchRoutes;