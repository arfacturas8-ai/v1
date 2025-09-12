import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const awardRoutes: FastifyPluginAsync = async (fastify) => {
  // Get available award types
  fastify.get("/types", async (request, reply) => {
    try {
      const awardTypes = [
        {
          id: "silver",
          name: "Silver",
          description: "Shows appreciation for good content",
          cost: 100,
          icon: "🥈",
          color: "#C0C0C0",
          premium: false,
        },
        {
          id: "gold",
          name: "Gold",
          description: "Recognizes excellent content and gives premium benefits",
          cost: 500,
          icon: "🥇",
          color: "#FFD700",
          premium: true,
          premiumDays: 7,
        },
        {
          id: "platinum",
          name: "Platinum",
          description: "The ultimate recognition for outstanding content",
          cost: 1800,
          icon: "💎",
          color: "#E5E4E2",
          premium: true,
          premiumDays: 30,
        },
        {
          id: "helpful",
          name: "Helpful",
          description: "For genuinely helpful content",
          cost: 150,
          icon: "🤝",
          color: "#4CAF50",
          premium: false,
        },
        {
          id: "wholesome",
          name: "Wholesome",
          description: "For heartwarming and positive content",
          cost: 125,
          icon: "😊",
          color: "#FF69B4",
          premium: false,
        },
        {
          id: "mind_blown",
          name: "Mind Blown",
          description: "For content that makes you think",
          cost: 200,
          icon: "🤯",
          color: "#9C27B0",
          premium: false,
        },
      ];

      return reply.send({
        success: true,
        data: awardTypes,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get award types",
      });
    }
  });

  // Give award to post (requires auth)
  fastify.post("/post/:postId", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { postId } = z.object({
        postId: z.string(),
      }).parse(request.params);

      const body = z.object({
        awardType: z.enum(["silver", "gold", "platinum", "helpful", "wholesome", "mind_blown"]),
        message: z.string().max(200).optional(),
        anonymous: z.boolean().default(false),
      }).parse(request.body);

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      // Can't award your own post
      if (post.userId === request.userId) {
        return reply.code(400).send({
          success: false,
          error: "Cannot award your own post",
        });
      }

      // Get award type details
      const awardTypes = {
        silver: { cost: 100, icon: "🥈", name: "Silver", premium: false },
        gold: { cost: 500, icon: "🥇", name: "Gold", premium: true, premiumDays: 7 },
        platinum: { cost: 1800, icon: "💎", name: "Platinum", premium: true, premiumDays: 30 },
        helpful: { cost: 150, icon: "🤝", name: "Helpful", premium: false },
        wholesome: { cost: 125, icon: "😊", name: "Wholesome", premium: false },
        mind_blown: { cost: 200, icon: "🤯", name: "Mind Blown", premium: false },
      };

      const awardType = awardTypes[body.awardType];

      // Check user's balance (simplified - in real app you'd have a currency system)
      // For demo purposes, assume users have enough coins

      // Create award record
      const award = await prisma.award.create({
        data: {
          type: body.awardType,
          cost: awardType.cost,
          message: body.message,
          anonymous: body.anonymous,
          giverId: request.userId,
          receiverId: post.userId,
          postId: postId,
        },
        include: {
          giver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // If premium award, give recipient premium benefits
      if (awardType.premium) {
        const premiumUntil = new Date(Date.now() + (awardType.premiumDays * 24 * 60 * 60 * 1000));
        
        await prisma.user.update({
          where: { id: post.userId },
          data: {
            premiumUntil: premiumUntil,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          award,
          message: `Gave ${awardType.name} award to post!`,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to give award",
      });
    }
  });

  // Give award to comment (requires auth)
  fastify.post("/comment/:commentId", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { commentId } = z.object({
        commentId: z.string(),
      }).parse(request.params);

      const body = z.object({
        awardType: z.enum(["silver", "gold", "platinum", "helpful", "wholesome", "mind_blown"]),
        message: z.string().max(200).optional(),
        anonymous: z.boolean().default(false),
      }).parse(request.body);

      // Check if comment exists
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
      });

      if (!comment) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      // Can't award your own comment
      if (comment.userId === request.userId) {
        return reply.code(400).send({
          success: false,
          error: "Cannot award your own comment",
        });
      }

      // Get award type details
      const awardTypes = {
        silver: { cost: 100, icon: "🥈", name: "Silver", premium: false },
        gold: { cost: 500, icon: "🥇", name: "Gold", premium: true, premiumDays: 7 },
        platinum: { cost: 1800, icon: "💎", name: "Platinum", premium: true, premiumDays: 30 },
        helpful: { cost: 150, icon: "🤝", name: "Helpful", premium: false },
        wholesome: { cost: 125, icon: "😊", name: "Wholesome", premium: false },
        mind_blown: { cost: 200, icon: "🤯", name: "Mind Blown", premium: false },
      };

      const awardType = awardTypes[body.awardType];

      // Create award record
      const award = await prisma.award.create({
        data: {
          type: body.awardType,
          cost: awardType.cost,
          message: body.message,
          anonymous: body.anonymous,
          giverId: request.userId,
          receiverId: comment.userId,
          commentId: commentId,
        },
        include: {
          giver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      });

      // If premium award, give recipient premium benefits
      if (awardType.premium) {
        const premiumUntil = new Date(Date.now() + (awardType.premiumDays * 24 * 60 * 60 * 1000));
        
        await prisma.user.update({
          where: { id: comment.userId },
          data: {
            premiumUntil: premiumUntil,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          award,
          message: `Gave ${awardType.name} award to comment!`,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to give award",
      });
    }
  });

  // Get awards for a post
  fastify.get("/post/:postId", async (request, reply) => {
    try {
      const { postId } = z.object({
        postId: z.string(),
      }).parse(request.params);

      const awards = await prisma.award.findMany({
        where: { postId },
        include: {
          giver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Group by award type
      const groupedAwards = awards.reduce((acc: any, award) => {
        if (!acc[award.type]) {
          acc[award.type] = {
            type: award.type,
            count: 0,
            awards: [],
          };
        }
        acc[award.type].count++;
        
        // Only include non-anonymous awards in the details
        if (!award.anonymous) {
          acc[award.type].awards.push({
            id: award.id,
            message: award.message,
            giver: award.giver,
            createdAt: award.createdAt,
          });
        }
        
        return acc;
      }, {});

      return reply.send({
        success: true,
        data: {
          total: awards.length,
          byType: groupedAwards,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get post awards",
      });
    }
  });

  // Get awards for a comment
  fastify.get("/comment/:commentId", async (request, reply) => {
    try {
      const { commentId } = z.object({
        commentId: z.string(),
      }).parse(request.params);

      const awards = await prisma.award.findMany({
        where: { commentId },
        include: {
          giver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Group by award type
      const groupedAwards = awards.reduce((acc: any, award) => {
        if (!acc[award.type]) {
          acc[award.type] = {
            type: award.type,
            count: 0,
            awards: [],
          };
        }
        acc[award.type].count++;
        
        // Only include non-anonymous awards in the details
        if (!award.anonymous) {
          acc[award.type].awards.push({
            id: award.id,
            message: award.message,
            giver: award.giver,
            createdAt: award.createdAt,
          });
        }
        
        return acc;
      }, {});

      return reply.send({
        success: true,
        data: {
          total: awards.length,
          byType: groupedAwards,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get comment awards",
      });
    }
  });

  // Get user's received awards (requires auth)
  fastify.get("/received", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 25 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
      }).parse(request.query);

      const [awards, total] = await Promise.all([
        prisma.award.findMany({
          where: { receiverId: request.userId },
          include: {
            giver: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
              },
            },
            comment: {
              select: {
                id: true,
                content: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.award.count({ where: { receiverId: request.userId } }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: awards,
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get received awards",
      });
    }
  });

  // Get user's given awards (requires auth)
  fastify.get("/given", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 25 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
      }).parse(request.query);

      const [awards, total] = await Promise.all([
        prisma.award.findMany({
          where: { giverId: request.userId },
          include: {
            receiver: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
              },
            },
            comment: {
              select: {
                id: true,
                content: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.award.count({ where: { giverId: request.userId } }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: awards,
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get given awards",
      });
    }
  });
};

export default awardRoutes;