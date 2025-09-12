import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authMiddleware);

  // Get server analytics (owner only)
  fastify.get("/servers/:serverId", async (request: any, reply) => {
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
          error: "Only server owner can view analytics",
        });
      }

      const [
        memberCount,
        channelCount,
        messageCount,
        activeMembers
      ] = await Promise.all([
        prisma.serverMember.count({ where: { serverId } }),
        prisma.channel.count({ where: { serverId } }),
        prisma.message.count({
          where: {
            channel: { serverId },
          },
        }),
        prisma.serverMember.count({
          where: {
            serverId,
            user: {
              messages: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                  },
                },
              },
            },
          },
        }),
      ]);

      const analytics = {
        memberCount,
        channelCount,
        messageCount,
        activeMembers,
        growthRate: 0, // Would calculate from historical data
      };

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get analytics",
      });
    }
  });

  // Get user analytics
  fastify.get("/me", async (request: any, reply) => {
    try {
      const [
        messageCount,
        postCount,
        commentCount,
        serversJoined
      ] = await Promise.all([
        prisma.message.count({ where: { userId: request.userId } }),
        prisma.post.count({ where: { userId: request.userId } }),
        prisma.comment.count({ where: { userId: request.userId } }),
        prisma.serverMember.count({ where: { userId: request.userId } }),
      ]);

      const analytics = {
        messageCount,
        postCount,
        commentCount,
        serversJoined,
      };

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get user analytics",
      });
    }
  });

  // Get community analytics (moderator only)
  fastify.get("/communities/:communityId", async (request: any, reply) => {
    try {
      const { communityId } = z.object({
        communityId: z.string(),
      }).parse(request.params);

      const isModerator = await prisma.moderator.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: request.userId,
          },
        },
      });

      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Moderator access required",
        });
      }

      const [
        memberCount,
        postCount,
        commentCount,
        activeUsers
      ] = await Promise.all([
        prisma.communityMember.count({ where: { communityId } }),
        prisma.post.count({ where: { communityId } }),
        prisma.comment.count({
          where: {
            post: { communityId },
          },
        }),
        prisma.communityMember.count({
          where: {
            communityId,
            community: {
              posts: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          },
        }),
      ]);

      const analytics = {
        memberCount,
        postCount,
        commentCount,
        activeUsers,
      };

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get community analytics",
      });
    }
  });
};

export default analyticsRoutes;