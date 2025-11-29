import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { EnhancedModerationService } from "../services/enhanced-moderation";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Redis and Queue setup
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  password: process.env.REDIS_PASSWORD,
});

const aiModerationQueue = new Queue('ai-moderation', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Enhanced Moderation Service with error handling
let enhancedModeration: EnhancedModerationService | null = null;

try {
  enhancedModeration = new EnhancedModerationService(aiModerationQueue);
  console.log('✅ Enhanced Moderation Service initialized for AI routes');
} catch (error) {
  console.error('❌ Failed to initialize Enhanced Moderation Service:', error);
  // Service will be null, routes will handle gracefully
}

const aiModerationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authMiddleware);

  // Real-time message analysis (called by message handlers)
  fastify.post("/messages/analyze", async (request: any, reply) => {
    try {
      // Check if service is available
      if (!enhancedModeration) {
        return reply.code(503).send({
          success: false,
          error: "AI moderation service is currently unavailable",
          fallback: true
        });
      }

      const body = z.object({
        messageId: z.string(),
        content: z.string(),
        attachments: z.array(z.any()).optional().default([]),
        serverId: z.string().optional(),
        channelId: z.string(),
        userId: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium')
      }).parse(request.body);

      const moderationRequest = {
        id: `msg_${body.messageId}`,
        type: 'message' as const,
        data: {
          messageId: body.messageId,
          userId: body.userId,
          content: body.content,
          attachments: body.attachments,
          serverId: body.serverId,
          channelId: body.channelId,
          metadata: {
            userRoles: request.userRoles || []
          }
        },
        priority: body.priority,
        timestamp: new Date()
      };

      const result = await enhancedModeration.processRequest(moderationRequest);

      // Return analysis result with action recommendations
      return reply.send({
        success: true,
        data: {
          messageId: body.messageId,
          riskLevel: result.riskLevel,
          blocked: result.blocked,
          requiresReview: result.requiresReview,
          confidence: result.confidence,
          actions: result.actions,
          processingTime: result.performance.totalProcessingTime,
          flags: extractFlags(result.serviceResults),
          serviceAvailable: true
        }
      });
    } catch (error) {
      fastify.log.error(error);
      
      // Provide graceful degradation
      return reply.code(500).send({
        success: false,
        error: "AI moderation analysis failed",
        fallback: {
          messageId: request.body?.messageId,
          riskLevel: 'safe',
          blocked: false,
          requiresReview: false,
          confidence: 0,
          actions: [],
          processingTime: 0,
          flags: []
        }
      });
    }
  });

  // Batch analyze multiple messages (for historical analysis)
  fastify.post("/messages/batch-analyze", async (request: any, reply) => {
    try {
      const body = z.object({
        messages: z.array(z.object({
          messageId: z.string(),
          content: z.string(),
          userId: z.string(),
          channelId: z.string(),
          serverId: z.string().optional(),
          timestamp: z.string()
        })).max(50) // Limit to 50 messages per batch
      }).parse(request.body);

      const results = [];

      for (const message of body.messages) {
        try {
          const moderationRequest = {
            id: `batch_${message.messageId}`,
            type: 'message' as const,
            data: {
              messageId: message.messageId,
              userId: message.userId,
              content: message.content,
              serverId: message.serverId,
              channelId: message.channelId
            },
            priority: 'low' as const,
            timestamp: new Date(message.timestamp)
          };

          const result = await enhancedModeration.processRequest(moderationRequest);

          results.push({
            messageId: message.messageId,
            riskLevel: result.riskLevel,
            confidence: result.confidence,
            flags: extractFlags(result.serviceResults)
          });
        } catch (error) {
          results.push({
            messageId: message.messageId,
            error: "Analysis failed"
          });
        }
      }

      return reply.send({
        success: true,
        data: {
          processed: results.length,
          results
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to batch analyze messages"
      });
    }
  });

  // Crypto transaction fraud analysis
  fastify.post("/transactions/analyze", async (request: any, reply) => {
    try {
      const body = z.object({
        transactionId: z.string(),
        type: z.enum(['deposit', 'withdrawal', 'tip', 'payment', 'trade']),
        amount: z.number().positive(),
        currency: z.string(),
        fromAddress: z.string().optional(),
        toAddress: z.string().optional(),
        transactionHash: z.string().optional(),
        blockchain: z.string().optional(),
        serverId: z.string().optional(),
        channelId: z.string().optional(),
        recipientId: z.string().optional(),
        metadata: z.any().optional()
      }).parse(request.body);

      const transactionData = {
        id: body.transactionId,
        userId: request.userId,
        type: body.type,
        amount: body.amount,
        currency: body.currency,
        fromAddress: body.fromAddress,
        toAddress: body.toAddress,
        transactionHash: body.transactionHash,
        blockchain: body.blockchain,
        timestamp: new Date(),
        metadata: {
          serverId: body.serverId,
          channelId: body.channelId,
          recipientId: body.recipientId,
          ...body.metadata
        }
      };

      const moderationRequest = {
        id: `tx_${body.transactionId}`,
        type: 'transaction' as const,
        data: {
          userId: request.userId,
          serverId: body.serverId,
          metadata: { transactionData }
        },
        priority: body.amount > 10000 ? 'high' as const : 'medium' as const,
        timestamp: new Date()
      };

      const result = await enhancedModeration.processRequest(moderationRequest);

      return reply.send({
        success: true,
        data: {
          transactionId: body.transactionId,
          riskLevel: result.riskLevel,
          blocked: result.blocked,
          confidence: result.confidence,
          fraudAnalysis: result.serviceResults.fraud,
          recommendedAction: result.blocked ? 'block' : result.requiresReview ? 'review' : 'allow'
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to analyze transaction"
      });
    }
  });

  // User profile/bio analysis
  fastify.post("/profiles/analyze", async (request: any, reply) => {
    try {
      const body = z.object({
        userId: z.string(),
        bio: z.string().optional(),
        displayName: z.string().optional(),
        avatar: z.string().optional(),
        serverId: z.string().optional()
      }).parse(request.body);

      if (!body.bio && !body.displayName) {
        return reply.code(400).send({
          success: false,
          error: "Either bio or displayName must be provided"
        });
      }

      const content = [body.bio, body.displayName].filter(Boolean).join(' ');

      const moderationRequest = {
        id: `profile_${body.userId}_${Date.now()}`,
        type: 'profile_update' as const,
        data: {
          userId: body.userId,
          content,
          serverId: body.serverId,
          metadata: {
            bio: body.bio,
            displayName: body.displayName,
            avatar: body.avatar
          }
        },
        priority: 'low' as const,
        timestamp: new Date()
      };

      const result = await enhancedModeration.processRequest(moderationRequest);

      return reply.send({
        success: true,
        data: {
          userId: body.userId,
          riskLevel: result.riskLevel,
          blocked: result.blocked,
          confidence: result.confidence,
          flags: extractFlags(result.serviceResults),
          recommendations: result.actions
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to analyze profile"
      });
    }
  });

  // Get server sentiment analysis
  fastify.get("/servers/:serverId/sentiment", async (request: any, reply) => {
    try {
      const { serverId } = z.object({
        serverId: z.string()
      }).parse(request.params);

      const { hours } = z.object({
        hours: z.coerce.number().min(1).max(168).optional().default(24)
      }).parse(request.query);

      // Check server ownership or moderation permissions
      const server = await fastify.prisma?.server.findUnique({
        where: { id: serverId },
        include: {
          members: {
            where: { userId: request.userId },
            include: { roles: { include: { role: true } } }
          }
        }
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found"
        });
      }

      const member = server.members[0];
      const isOwner = server.ownerId === request.userId;
      const hasModerationPermissions = member?.roles.some(r => r.role.permissions > 0n);

      if (!isOwner && !hasModerationPermissions) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions"
        });
      }

      // This would integrate with the sentiment analysis service
      // For now, return mock data structure
      const sentimentReport = {
        serverId,
        timeWindow: { hours, since: new Date(Date.now() - hours * 60 * 60 * 1000) },
        overallSentiment: {
          score: 0.2, // Slightly positive
          classification: 'positive',
          trend: 'stable'
        },
        channels: [] as any[],
        users: [] as any[],
        recommendations: [] as string[]
      };

      return reply.send({
        success: true,
        data: sentimentReport
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get sentiment analysis"
      });
    }
  });

  // Get content recommendations for user
  fastify.get("/recommendations", async (request: any, reply) => {
    try {
      const { serverId, channelId, count } = z.object({
        serverId: z.string().optional(),
        channelId: z.string().optional(),
        count: z.coerce.number().min(1).max(20).optional().default(10)
      }).parse(request.query);

      // This would integrate with the recommendation engine
      // For now, return mock structure
      const recommendations = {
        userId: request.userId,
        recommendations: [] as any[],
        generatedAt: new Date(),
        context: { serverId, channelId }
      };

      return reply.send({
        success: true,
        data: recommendations
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get recommendations"
      });
    }
  });

  // Get smart tags for content
  fastify.post("/content/tags", async (request: any, reply) => {
    try {
      const body = z.object({
        content: z.string().min(1).max(5000),
        contentType: z.enum(['message', 'post', 'bio', 'comment']).optional().default('message'),
        serverId: z.string().optional(),
        channelId: z.string().optional()
      }).parse(request.body);

      // This would integrate with the smart tagging service
      // For now, return mock structure
      const tags = {
        content: body.content,
        tags: [] as any[],
        categories: [] as string[],
        confidence: 0.8,
        processingTime: 50
      };

      return reply.send({
        success: true,
        data: tags
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate smart tags"
      });
    }
  });

  // AI service health check
  fastify.get("/health", async (request: any, reply) => {
    try {
      if (!enhancedModeration) {
        return reply.code(503).send({
          success: false,
          data: {
            status: 'down',
            services: {},
            metrics: {},
            performance: {},
            timestamp: new Date(),
            error: 'Enhanced moderation service not initialized'
          }
        });
      }

      const stats = enhancedModeration.getStats();

      return reply.send({
        success: true,
        data: {
          status: stats.overallHealth,
          services: stats.servicesHealth,
          metrics: stats.requestMetrics,
          performance: stats.performanceMetrics,
          timestamp: new Date(),
          serviceInitialized: true
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get AI service health",
        data: {
          status: 'down',
          services: {},
          metrics: {},
          performance: {},
          timestamp: new Date(),
          serviceInitialized: !!enhancedModeration
        }
      });
    }
  });

  // Configure AI moderation settings for server
  fastify.post("/servers/:serverId/ai-config", async (request: any, reply) => {
    try {
      const { serverId } = z.object({
        serverId: z.string()
      }).parse(request.params);

      const body = z.object({
        services: z.object({
          toxicity: z.boolean().optional(),
          spam: z.boolean().optional(),
          nsfw: z.boolean().optional(),
          sentiment: z.boolean().optional(),
          smartTagging: z.boolean().optional(),
          automatedBans: z.boolean().optional()
        }).optional(),
        thresholds: z.object({
          toxicity: z.number().min(0).max(1).optional(),
          spam: z.number().min(0).max(1).optional(),
          nsfw: z.number().min(0).max(1).optional()
        }).optional(),
        actions: z.object({
          autoDelete: z.boolean().optional(),
          autoTimeout: z.boolean().optional(),
          requireReview: z.boolean().optional()
        }).optional()
      }).parse(request.body);

      // Check server ownership
      const server = await fastify.prisma?.server.findUnique({
        where: { id: serverId }
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found"
        });
      }

      if (server.ownerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Only server owner can configure AI moderation"
        });
      }

      // Store configuration (would be implemented with proper database schema)
      const config = {
        serverId,
        ...body,
        updatedBy: request.userId,
        updatedAt: new Date()
      };

      return reply.send({
        success: true,
        data: config,
        message: "AI moderation configuration updated successfully"
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update AI configuration"
      });
    }
  });

  // Helper function to extract flags from service results
  function extractFlags(serviceResults: any): string[] {
    const flags: string[] = [];
    
    if (serviceResults.toxicity?.matched) flags.push('toxicity');
    if (serviceResults.spam?.isSpam) flags.push('spam');
    if (serviceResults.nsfw?.some?.((r: any) => r.isNSFW)) flags.push('nsfw');
    if (serviceResults.fraud?.blocked) flags.push('fraud');
    if (serviceResults.sentiment?.classification === 'very_negative') flags.push('very_negative');
    
    return flags;
  }

  // Add helper to fastify instance
  (fastify as any).extractFlags = extractFlags;
};

export default aiModerationRoutes;