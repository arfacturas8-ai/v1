import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";
import { EnhancedModerationService } from "../services/enhanced-moderation";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Initialize Redis and Queue for AI services
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

const moderationQueue = new Queue('moderation', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Initialize Enhanced Moderation Service with error handling
let enhancedModeration: EnhancedModerationService | null = null;

try {
  enhancedModeration = new EnhancedModerationService(moderationQueue);
  console.log('✅ Enhanced Moderation Service initialized for moderation routes');
} catch (error) {
  console.error('❌ Failed to initialize Enhanced Moderation Service for moderation routes:', error);
  // Service will be null, routes will handle gracefully
}

const moderationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authMiddleware);

  // AI-powered content analysis endpoint
  fastify.post("/analyze", async (request: any, reply) => {
    try {
      // Check if service is available
      if (!enhancedModeration) {
        return reply.code(503).send({
          success: false,
          error: "AI moderation service is currently unavailable",
          fallback: {
            requestId: `fallback_${Date.now()}`,
            overallRisk: 0,
            riskLevel: 'safe',
            confidence: 0,
            actions: [],
            blocked: false,
            escalated: false,
            requiresReview: false
          }
        });
      }

      const body = z.object({
        type: z.enum(['message', 'user_join', 'transaction', 'upload', 'profile_update']),
        data: z.object({
          messageId: z.string().optional(),
          userId: z.string(),
          content: z.string().optional(),
          attachments: z.array(z.any()).optional(),
          serverId: z.string().optional(),
          channelId: z.string().optional(),
          metadata: z.any().optional(),
        }),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium')
      }).parse(request.body);

      const moderationRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: body.type,
        data: body.data,
        priority: body.priority,
        timestamp: new Date()
      };

      const result = await enhancedModeration.processRequest(moderationRequest);

      return reply.send({
        success: true,
        data: result,
        serviceAvailable: true
      });
    } catch (error) {
      fastify.log.error(error);
      
      // Provide graceful degradation
      return reply.code(500).send({
        success: false,
        error: "Failed to analyze content",
        fallback: {
          requestId: `error_${Date.now()}`,
          overallRisk: 0,
          riskLevel: 'safe',
          confidence: 0,
          actions: [],
          blocked: false,
          escalated: false,
          requiresReview: false,
          serviceAvailable: !!enhancedModeration
        }
      });
    }
  });

  // Get AI moderation statistics
  fastify.get("/ai-stats", async (request: any, reply) => {
    try {
      if (!enhancedModeration) {
        return reply.code(503).send({
          success: false,
          error: "AI moderation service is currently unavailable",
          data: {
            overallHealth: 'down',
            servicesHealth: {},
            requestMetrics: {},
            performanceMetrics: {},
            serviceInitialized: false
          }
        });
      }

      const stats = enhancedModeration.getStats();
      
      return reply.send({
        success: true,
        data: {
          ...stats,
          serviceInitialized: true
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get AI moderation stats",
        data: {
          overallHealth: 'down',
          servicesHealth: {},
          requestMetrics: {},
          performanceMetrics: {},
          serviceInitialized: !!enhancedModeration
        }
      });
    }
  });

  // Submit appeal for automated punishment
  fastify.post("/appeal", async (request: any, reply) => {
    try {
      const body = z.object({
        punishmentId: z.string(),
        reason: z.string().min(10).max(1000),
        evidence: z.string().optional(),
        serverId: z.string().optional(),
      }).parse(request.body);

      // This would integrate with the automated ban system
      // For now, queue for manual review
      await moderationQueue.add('process-appeal', {
        userId: request.userId,
        punishmentId: body.punishmentId,
        reason: body.reason,
        evidence: body.evidence,
        serverId: body.serverId,
        submittedAt: new Date()
      });

      return reply.send({
        success: true,
        message: "Appeal submitted successfully and is under review"
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to submit appeal",
      });
    }
  });

  // Get user's moderation history with AI analysis
  fastify.get("/users/:userId/history", async (request: any, reply) => {
    try {
      const { userId } = z.object({
        userId: z.string(),
      }).parse(request.params);

      const { serverId } = z.object({
        serverId: z.string().optional(),
      }).parse(request.query);

      // Check permissions
      if (userId !== request.userId) {
        // Check if user has moderation permissions
        if (serverId) {
          const server = await prisma.server.findUnique({
            where: { id: serverId },
          });

          if (!server || server.ownerId !== request.userId) {
            return reply.code(403).send({
              success: false,
              error: "Insufficient permissions",
            });
          }
        } else {
          return reply.code(403).send({
            success: false,
            error: "Cannot view other user's history",
          });
        }
      }

      const history = await prisma.auditLog.findMany({
        where: {
          targetId: userId,
          ...(serverId && { serverId }),
          actionType: { in: [989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999] }, // AI-related action types
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          actionType: true,
          reason: true,
          options: true,
          createdAt: true,
          serverId: true,
        }
      });

      const formattedHistory = history.map(log => ({
        id: log.id,
        type: getActionTypeName(log.actionType),
        reason: log.reason,
        timestamp: log.createdAt,
        serverId: log.serverId,
        details: log.options,
      }));

      return reply.send({
        success: true,
        data: formattedHistory
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get moderation history",
      });
    }
  });

  // Community health report
  fastify.get("/servers/:serverId/health", async (request: any, reply) => {
    try {
      const { serverId } = z.object({
        serverId: z.string(),
      }).parse(request.params);

      const { hours } = z.object({
        hours: z.coerce.number().min(1).max(720).optional().default(24),
      }).parse(request.query);

      const server = await prisma.server.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      if (server.ownerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Only server owner can view community health",
        });
      }

      // Get recent AI moderation data
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const moderationLogs = await prisma.auditLog.findMany({
        where: {
          serverId,
          createdAt: { gte: since },
          actionType: { in: [989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999] },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Analyze the data
      const healthReport = {
        timeWindow: { hours, since },
        totalModerationActions: moderationLogs.length,
        riskLevelDistribution: {
          safe: 0,
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        topViolationTypes: {} as Record<string, number>,
        aiServiceUsage: {} as Record<string, number>,
        trends: {
          toxicity: 'stable',
          spam: 'stable',
          nsfw: 'stable',
          overall: 'stable'
        },
        recommendations: [] as string[]
      };

      // Process logs to generate report
      moderationLogs.forEach(log => {
        const options = log.options as any;
        if (options?.riskLevel) {
          healthReport.riskLevelDistribution[options.riskLevel as keyof typeof healthReport.riskLevelDistribution]++;
        }
        
        if (options?.violationType) {
          healthReport.topViolationTypes[options.violationType] = 
            (healthReport.topViolationTypes[options.violationType] || 0) + 1;
        }
        
        if (options?.servicesUsed) {
          healthReport.aiServiceUsage[`${options.servicesUsed}_services`] = 
            (healthReport.aiServiceUsage[`${options.servicesUsed}_services`] || 0) + 1;
        }
      });

      // Generate recommendations
      const criticalCount = healthReport.riskLevelDistribution.critical;
      const highCount = healthReport.riskLevelDistribution.high;
      
      if (criticalCount > 5) {
        healthReport.recommendations.push('Consider reviewing and strengthening community guidelines');
        healthReport.recommendations.push('High number of critical violations detected - manual review recommended');
      }
      
      if (highCount > 10) {
        healthReport.recommendations.push('Increased moderation presence may be beneficial');
      }
      
      if (healthReport.totalModerationActions === 0) {
        healthReport.recommendations.push('Community appears healthy with minimal AI interventions');
      }

      return reply.send({
        success: true,
        data: healthReport
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate community health report",
      });
    }
  });

  // Ban user from server
  fastify.post("/servers/:serverId/ban", async (request: any, reply) => {
    try {
      const { serverId } = z.object({
        serverId: z.string(),
      }).parse(request.params);

      const body = z.object({
        userId: z.string(),
        reason: z.string().max(500).optional(),
      }).parse(request.body);

      const server = await prisma.server.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      if (server.ownerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Only server owner can ban users",
        });
      }

      // Remove user from server
      await prisma.serverMember.deleteMany({
        where: {
          serverId,
          userId: body.userId,
        },
      });

      // Create ban record
      const ban = await prisma.ban.create({
        data: {
          serverId,
          userId: body.userId,
          reason: body.reason,
          bannedBy: request.userId,
        },
      });

      return reply.send({
        success: true,
        data: ban,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to ban user",
      });
    }
  });

  // Get server bans
  fastify.get("/servers/:serverId/bans", async (request: any, reply) => {
    try {
      const { serverId } = z.object({
        serverId: z.string(),
      }).parse(request.params);

      const server = await prisma.server.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      if (server.ownerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Only server owner can view bans",
        });
      }

      const bans = await prisma.ban.findMany({
        where: { serverId },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({
        success: true,
        data: bans,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get bans",
      });
    }
  });

  // Unban user
  fastify.delete("/servers/:serverId/ban/:userId", async (request: any, reply) => {
    try {
      const { serverId, userId } = z.object({
        serverId: z.string(),
        userId: z.string(),
      }).parse(request.params);

      const server = await prisma.server.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      if (server.ownerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Only server owner can unban users",
        });
      }

      await prisma.ban.deleteMany({
        where: {
          serverId,
          userId,
        },
      });

      return reply.send({
        success: true,
        message: "User unbanned successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to unban user",
      });
    }
  });

  // Helper method to get action type names
  function getActionTypeName(actionType: number): string {
    const actionNameMap: { [key: number]: string } = {
      989: 'enhanced_moderation',
      990: 'appeal_submission',
      991: 'automated_enforcement',
      992: 'fraud_detection',
      993: 'smart_tagging',
      994: 'sentiment_analysis',
      995: 'nsfw_detection',
      996: 'auto_moderation_rule',
      997: 'spam_detection',
      998: 'toxicity_detection',
      999: 'auto_moderation'
    };
    
    return actionNameMap[actionType] || 'unknown';
  }

  // Add the helper method to fastify instance
  (fastify as any).getActionTypeName = getActionTypeName;
};

export default moderationRoutes;