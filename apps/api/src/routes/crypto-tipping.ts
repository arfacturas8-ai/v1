import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { cryptoTippingService } from "../services/crypto-tipping";
import { prisma } from "@cryb/database";

const cryptoTippingRoutes: FastifyPluginAsync = async (fastify) => {
  // Send a crypto tip
  fastify.post("/tip", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        recipientId: z.string(),
        amount: z.string().refine((val) => {
          try {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
          } catch {
            return false;
          }
        }, "Amount must be a valid positive number"),
        currency: z.enum(['ETH', 'USDC', 'USDT', 'MATIC']),
        message: z.string().max(280).optional(),
        isAnonymous: z.boolean().default(false),
      }).parse(request.body);

      // Check if recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: body.recipientId },
      });

      if (!recipient) {
        return reply.code(404).send({
          success: false,
          error: "Recipient not found",
        });
      }

      const result = await cryptoTippingService.sendTip({
        senderId: request.userId,
        recipientId: body.recipientId,
        amount: body.amount,
        currency: body.currency,
        message: body.message,
        isAnonymous: body.isAnonymous,
      });

      if (!result.success) {
        return reply.code(400).send({
          success: false,
          error: result.error,
        });
      }

      return reply.send({
        success: true,
        data: {
          tipId: result.tipId,
          txHash: result.txHash,
          message: "Tip sent successfully",
        },
      });
    } catch (error) {
      fastify.log.error("Failed to send tip:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to send tip",
      });
    }
  });

  // Get user's tip history
  fastify.get("/tips", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const query = z.object({
        type: z.enum(['sent', 'received', 'all']).default('all'),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      }).parse(request.query);

      const result = await cryptoTippingService.getUserTips(
        request.userId,
        query.type,
        query.page,
        query.limit
      );

      return reply.send({
        success: true,
        data: {
          tips: result.tips,
          pagination: {
            page: query.page,
            limit: query.limit,
            totalCount: result.totalCount,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error) {
      fastify.log.error("Failed to get tip history:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get tip history",
      });
    }
  });

  // Get user's tip statistics
  fastify.get("/stats", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const stats = await cryptoTippingService.getUserTipStats(request.userId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      fastify.log.error("Failed to get tip statistics:", error);

      return reply.code(500).send({
        success: false,
        error: "Failed to get tip statistics",
      });
    }
  });

  // Get user's tip stats by ID (public endpoint)
  fastify.get("/stats/:userId", async (request: any, reply) => {
    try {
      const params = z.object({
        userId: z.string(),
      }).parse(request.params);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      const stats = await cryptoTippingService.getUserTipStats(params.userId);

      // Return limited public stats
      return reply.send({
        success: true,
        data: {
          totalReceived: stats.totalReceived,
          receivedCount: stats.receivedCount,
          topCurrencies: stats.topCurrencies,
        },
      });
    } catch (error) {
      fastify.log.error("Failed to get public tip statistics:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid user ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get tip statistics",
      });
    }
  });

  // Get tip leaderboard
  fastify.get("/leaderboard", async (request: any, reply) => {
    try {
      const query = z.object({
        period: z.enum(['daily', 'weekly', 'monthly', 'all']).default('monthly'),
        limit: z.coerce.number().min(1).max(100).default(10),
      }).parse(request.query);

      const leaderboard = await cryptoTippingService.getTipLeaderboard(
        query.period,
        query.limit
      );

      return reply.send({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      fastify.log.error("Failed to get tip leaderboard:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get tip leaderboard",
      });
    }
  });

  // Distribute rewards (admin only)
  fastify.post("/rewards/distribute", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user || !user.isSystem) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to distribute rewards",
        });
      }

      const body = z.object({
        recipients: z.array(z.object({
          userId: z.string(),
          amount: z.string().refine((val) => {
            try {
              const num = parseFloat(val);
              return !isNaN(num) && num > 0;
            } catch {
              return false;
            }
          }),
          reason: z.string().min(1).max(200),
        })).min(1).max(100),
        currency: z.enum(['ETH', 'USDC', 'USDT', 'MATIC']),
        totalAmount: z.string(),
      }).parse(request.body);

      // Validate that all recipients exist
      const recipientIds = body.recipients.map(r => r.userId);
      const existingUsers = await prisma.user.findMany({
        where: { id: { in: recipientIds } },
        select: { id: true },
      });

      if (existingUsers.length !== recipientIds.length) {
        return reply.code(400).send({
          success: false,
          error: "One or more recipients not found",
        });
      }

      const result = await cryptoTippingService.distributeRewards({
        totalAmount: body.totalAmount,
        recipients: body.recipients,
        currency: body.currency,
      });

      return reply.send({
        success: result.success,
        data: {
          totalDistributed: result.results.filter(r => r.success).length,
          totalFailed: result.results.filter(r => !r.success).length,
          results: result.results,
          error: result.error,
        },
      });
    } catch (error) {
      fastify.log.error("Failed to distribute rewards:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to distribute rewards",
      });
    }
  });

  // Get tipping analytics (admin only)
  fastify.get("/analytics", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user || !user.isSystem) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to view analytics",
        });
      }

      const query = z.object({
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      }).parse(request.query);

      const analytics = await cryptoTippingService.getTippingAnalytics(query.period);

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      fastify.log.error("Failed to get tipping analytics:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get tipping analytics",
      });
    }
  });

  // Validate tip request
  fastify.post("/validate", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        recipientId: z.string(),
        amount: z.string(),
        currency: z.enum(['ETH', 'USDC', 'USDT', 'MATIC']),
      }).parse(request.body);

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if recipient exists and has wallet
      const recipient = await prisma.user.findUnique({
        where: { id: body.recipientId },
      });

      if (!recipient) {
        errors.push('Recipient not found');
      } else if (!recipient.walletAddress) {
        errors.push('Recipient wallet not connected');
      }

      // Check if sender has wallet
      const sender = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!sender?.walletAddress) {
        errors.push('Your wallet is not connected');
      }

      // Validate amount
      try {
        const amount = parseFloat(body.amount);
        if (isNaN(amount) || amount <= 0) {
          errors.push('Amount must be a positive number');
        } else {
          // Check minimum amounts
          const minAmounts: Record<string, number> = {
            'ETH': 0.001,
            'USDC': 1,
            'USDT': 1,
            'MATIC': 1,
          };

          if (amount < minAmounts[body.currency]) {
            errors.push(`Minimum tip amount is ${minAmounts[body.currency]} ${body.currency}`);
          }

          // Check if amount is very high
          if (amount > 100) {
            warnings.push('Large tip amount detected. Please double-check the amount.');
          }
        }
      } catch {
        errors.push('Invalid amount format');
      }

      // Check if tipping self
      if (body.recipientId === request.userId) {
        errors.push('Cannot tip yourself');
      }

      const isValid = errors.length === 0;

      return reply.send({
        success: true,
        data: {
          valid: isValid,
          errors: errors.length > 0 ? errors : undefined,
          warnings: warnings.length > 0 ? warnings : undefined,
          estimatedGas: isValid ? {
            [body.currency]: body.currency === 'ETH' ? '0.001-0.003' : '0.0001-0.0003'
          } : undefined,
        },
      });
    } catch (error) {
      fastify.log.error("Failed to validate tip request:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to validate tip request",
      });
    }
  });

  // Get recent tips (public activity feed)
  fastify.get("/recent", async (request: any, reply) => {
    try {
      const query = z.object({
        limit: z.coerce.number().min(1).max(50).default(20),
        includeAnonymous: z.coerce.boolean().default(true),
      }).parse(request.query);

      const where: any = {
        status: 'COMPLETED',
        senderId: { not: 'system' }, // Exclude system rewards
      };

      if (!query.includeAnonymous) {
        where.isAnonymous = false;
      }

      const tips = await prisma.cryptoTip.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          recipient: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
      });

      // Process tips to handle anonymous ones
      const processedTips = tips.map(tip => ({
        id: tip.id,
        amount: tip.amount,
        currency: tip.currency,
        message: tip.message,
        isAnonymous: tip.isAnonymous,
        createdAt: tip.createdAt,
        sender: tip.isAnonymous ? {
          id: 'anonymous',
          username: 'Anonymous',
          displayName: 'Anonymous',
          avatar: null,
        } : tip.sender,
        recipient: tip.recipient,
      }));

      return reply.send({
        success: true,
        data: processedTips,
      });
    } catch (error) {
      fastify.log.error("Failed to get recent tips:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get recent tips",
      });
    }
  });

  // Get tip details by ID
  fastify.get("/tips/:tipId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        tipId: z.string(),
      }).parse(request.params);

      const tip = await prisma.cryptoTip.findUnique({
        where: { id: params.tipId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          recipient: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      if (!tip) {
        return reply.code(404).send({
          success: false,
          error: "Tip not found",
        });
      }

      // Check if user is authorized to view this tip
      const canView = tip.senderId === request.userId || 
                      tip.recipientId === request.userId ||
                      !tip.isAnonymous;

      if (!canView) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to view this tip",
        });
      }

      // Handle anonymous tips
      const processedTip = {
        ...tip,
        sender: tip.isAnonymous && tip.recipientId === request.userId && tip.senderId !== request.userId
          ? {
              id: 'anonymous',
              username: 'Anonymous',
              displayName: 'Anonymous',
              avatar: null,
            }
          : tip.sender,
      };

      return reply.send({
        success: true,
        data: processedTip,
      });
    } catch (error) {
      fastify.log.error("Failed to get tip details:", error);

      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid tip ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get tip details",
      });
    }
  });
};

export default cryptoTippingRoutes;