import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ethers } from "ethers";
import { authMiddleware } from "../middleware/auth";
import { simpleTokenGatingService } from "../services/simple-token-gating";
import { prisma } from "@cryb/database";

const tokenGatingRoutes: FastifyPluginAsync = async (fastify) => {
  // Create token gating rule
  fastify.post("/rules", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        serverId: z.string().optional(),
        channelId: z.string().optional(),
        communityId: z.string().optional(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        requirements: z.object({
          type: z.enum(['TOKEN_BALANCE', 'NFT_OWNERSHIP', 'COMBINED', 'CUSTOM']),
          tokens: z.array(z.object({
            address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address"),
            symbol: z.string(),
            name: z.string(),
            chain: z.string().default("ethereum"),
            minAmount: z.string(), // in wei
          })).optional(),
          nfts: z.array(z.object({
            contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
            minTokens: z.number().min(1).default(1),
            specificTokenIds: z.array(z.string()).optional(),
          })).optional(),
          customLogic: z.string().optional(),
        }),
      }).parse(request.body);

      // Verify user has permission to create rules for the specified entity
      if (body.serverId) {
        const server = await prisma.server.findUnique({
          where: { id: body.serverId },
        });

        if (!server || server.ownerId !== request.userId) {
          return reply.code(403).send({
            success: false,
            error: "Not authorized to create rules for this server",
          });
        }
      }

      if (body.channelId) {
        const channel = await prisma.channel.findUnique({
          where: { id: body.channelId },
          include: { server: true },
        });

        if (!channel || channel.server?.ownerId !== request.userId) {
          return reply.code(403).send({
            success: false,
            error: "Not authorized to create rules for this channel",
          });
        }
      }

      if (body.communityId) {
        const moderator = await prisma.moderator.findFirst({
          where: {
            communityId: body.communityId,
            userId: request.userId,
          },
        });

        if (!moderator) {
          return reply.code(403).send({
            success: false,
            error: "Not authorized to create rules for this community",
          });
        }
      }

      const rule = await simpleTokenGatingService.createTokenGatingRule(body);

      return reply.send({
        success: true,
        data: rule,
      });
    } catch (error) {
      fastify.log.error("Failed to create token gating rule:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to create token gating rule",
      });
    }
  });

  // Get token gating rules
  fastify.get("/rules", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const query = z.object({
        serverId: z.string().optional(),
        channelId: z.string().optional(),
        communityId: z.string().optional(),
        isActive: z.coerce.boolean().optional(),
      }).parse(request.query);

      const rules = await simpleTokenGatingService.getTokenGatingRules(query);

      return reply.send({
        success: true,
        data: rules,
      });
    } catch (error) {
      fastify.log.error("Failed to get token gating rules:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get token gating rules",
      });
    }
  });

  // Get specific token gating rule
  fastify.get("/rules/:ruleId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        ruleId: z.string(),
      }).parse(request.params);

      const rule = await simpleTokenGatingService.getTokenGatingRule(params.ruleId);

      if (!rule) {
        return reply.code(404).send({
          success: false,
          error: "Token gating rule not found",
        });
      }

      return reply.send({
        success: true,
        data: rule,
      });
    } catch (error) {
      fastify.log.error("Failed to get token gating rule:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid rule ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to get token gating rule",
      });
    }
  });

  // Update token gating rule
  fastify.put("/rules/:ruleId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        ruleId: z.string(),
      }).parse(request.params);

      const body = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        isActive: z.boolean().optional(),
        requirements: z.object({
          type: z.enum(['TOKEN_BALANCE', 'NFT_OWNERSHIP', 'COMBINED', 'CUSTOM']),
          tokens: z.array(z.object({
            address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address"),
            symbol: z.string(),
            name: z.string(),
            chain: z.string().default("ethereum"),
            minAmount: z.string(),
          })).optional(),
          nfts: z.array(z.object({
            contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
            minTokens: z.number().min(1).default(1),
            specificTokenIds: z.array(z.string()).optional(),
          })).optional(),
          customLogic: z.string().optional(),
        }).optional(),
      }).parse(request.body);

      // Verify user has permission to update this rule
      const existingRule = await simpleTokenGatingService.getTokenGatingRule(params.ruleId);
      if (!existingRule) {
        return reply.code(404).send({
          success: false,
          error: "Token gating rule not found",
        });
      }

      // Check permissions based on rule entity
      if (existingRule.serverId) {
        const server = await prisma.server.findUnique({
          where: { id: existingRule.serverId },
        });

        if (!server || server.ownerId !== request.userId) {
          return reply.code(403).send({
            success: false,
            error: "Not authorized to update this rule",
          });
        }
      }

      const updatedRule = await simpleTokenGatingService.updateTokenGatingRule(params.ruleId, body);

      return reply.send({
        success: true,
        data: updatedRule,
      });
    } catch (error) {
      fastify.log.error("Failed to update token gating rule:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to update token gating rule",
      });
    }
  });

  // Delete token gating rule
  fastify.delete("/rules/:ruleId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        ruleId: z.string(),
      }).parse(request.params);

      // Verify user has permission to delete this rule
      const existingRule = await simpleTokenGatingService.getTokenGatingRule(params.ruleId);
      if (!existingRule) {
        return reply.code(404).send({
          success: false,
          error: "Token gating rule not found",
        });
      }

      // Check permissions
      if (existingRule.serverId) {
        const server = await prisma.server.findUnique({
          where: { id: existingRule.serverId },
        });

        if (!server || server.ownerId !== request.userId) {
          return reply.code(403).send({
            success: false,
            error: "Not authorized to delete this rule",
          });
        }
      }

      const result = await simpleTokenGatingService.deleteTokenGatingRule(params.ruleId);

      if (!result.success) {
        return reply.code(500).send({
          success: false,
          error: result.error,
        });
      }

      return reply.send({
        success: true,
        data: {
          message: "Token gating rule deleted successfully",
        },
      });
    } catch (error) {
      fastify.log.error("Failed to delete token gating rule:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid rule ID",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to delete token gating rule",
      });
    }
  });

  // Check user access
  fastify.post("/check-access", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        serverId: z.string().optional(),
        channelId: z.string().optional(),
        communityId: z.string().optional(),
      }).parse(request.body);

      const result = await simpleTokenGatingService.checkAccess(
        request.userId,
        body.serverId,
        body.channelId,
        body.communityId
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      fastify.log.error("Failed to check token gating access:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to check access",
      });
    }
  });

  // Check access for specific user (admin/moderator only)
  fastify.post("/check-access/:userId", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const params = z.object({
        userId: z.string(),
      }).parse(request.params);

      const body = z.object({
        serverId: z.string().optional(),
        channelId: z.string().optional(),
        communityId: z.string().optional(),
      }).parse(request.body);

      // Verify user has permission to check access for others
      let hasPermission = false;

      if (body.serverId) {
        const server = await prisma.server.findUnique({
          where: { id: body.serverId },
        });
        hasPermission = server?.ownerId === request.userId;
      } else if (body.communityId) {
        const moderator = await prisma.moderator.findFirst({
          where: {
            communityId: body.communityId,
            userId: request.userId,
          },
        });
        hasPermission = !!moderator;
      }

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Not authorized to check access for other users",
        });
      }

      const result = await simpleTokenGatingService.checkAccess(
        params.userId,
        body.serverId,
        body.channelId,
        body.communityId
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      fastify.log.error("Failed to check user access:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to check user access",
      });
    }
  });

  // Bulk check access
  fastify.post("/bulk-check-access", async (request: any, reply) => {
    await authMiddleware(request, reply);

    try {
      const body = z.object({
        rules: z.array(z.object({
          serverId: z.string().optional(),
          channelId: z.string().optional(),
          communityId: z.string().optional(),
        })).max(10), // Limit to 10 rules per request
      }).parse(request.body);

      const results = await simpleTokenGatingService.bulkCheckAccess(request.userId, body.rules);

      return reply.send({
        success: true,
        data: results,
      });
    } catch (error) {
      fastify.log.error("Failed to bulk check access:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to bulk check access",
      });
    }
  });

  // Get supported tokens
  fastify.get("/supported-tokens", async (request: any, reply) => {
    try {
      const tokens = simpleTokenGatingService.getSupportedTokens();

      return reply.send({
        success: true,
        data: tokens,
      });
    } catch (error) {
      fastify.log.error("Failed to get supported tokens:", error);

      return reply.code(500).send({
        success: false,
        error: "Failed to get supported tokens",
      });
    }
  });

  // Validate token gating requirements
  fastify.post("/validate-requirements", async (request: any, reply) => {
    try {
      const body = z.object({
        requirements: z.object({
          type: z.enum(['TOKEN_BALANCE', 'NFT_OWNERSHIP', 'COMBINED', 'CUSTOM']),
          tokens: z.array(z.object({
            address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address"),
            symbol: z.string(),
            name: z.string(),
            chain: z.string().default("ethereum"),
            minAmount: z.string(),
          })).optional(),
          nfts: z.array(z.object({
            contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
            minTokens: z.number().min(1).default(1),
            specificTokenIds: z.array(z.string()).optional(),
          })).optional(),
        }),
      }).parse(request.body);

      // Basic validation logic
      const errors: string[] = [];

      if (body.requirements.type === 'TOKEN_BALANCE' && !body.requirements.tokens?.length) {
        errors.push('Token balance requirements must include at least one token');
      }

      if (body.requirements.type === 'NFT_OWNERSHIP' && !body.requirements.nfts?.length) {
        errors.push('NFT ownership requirements must include at least one NFT collection');
      }

      if (body.requirements.type === 'COMBINED') {
        if (!body.requirements.tokens?.length && !body.requirements.nfts?.length) {
          errors.push('Combined requirements must include both token and NFT requirements');
        }
      }

      // Validate token amounts are valid numbers
      if (body.requirements.tokens) {
        for (const token of body.requirements.tokens) {
          try {
            const amount = ethers.parseUnits(token.minAmount, 0);
            if (amount <= 0) {
              errors.push(`Invalid token amount for ${token.symbol}: must be greater than 0`);
            }
          } catch {
            errors.push(`Invalid token amount format for ${token.symbol}`);
          }
        }
      }

      const isValid = errors.length === 0;

      return reply.send({
        success: true,
        data: {
          valid: isValid,
          errors: errors.length > 0 ? errors : undefined,
          message: isValid ? 'Requirements are valid' : 'Requirements validation failed',
        },
      });
    } catch (error) {
      fastify.log.error("Failed to validate requirements:", error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Invalid requirements format",
          details: error.errors,
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to validate requirements",
      });
    }
  });
};

export default tokenGatingRoutes;