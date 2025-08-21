import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { verifyToken } from "@cryb/auth";
import { authenticate } from "../middleware/auth";

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/me", async (request: any, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          walletAddress: true,
          avatar: true,
          bio: true,
          isVerified: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get user",
      });
    }
  });

  fastify.patch("/me", async (request: any, reply) => {
    try {
      const body = z.object({
        displayName: z.string().min(1).max(50).optional(),
        bio: z.string().max(500).optional(),
        avatar: z.string().url().optional(),
      }).parse(request.body);

      const user = await prisma.user.update({
        where: { id: request.userId },
        data: body,
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          walletAddress: true,
          avatar: true,
          bio: true,
        },
      });

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update user",
      });
    }
  });

  fastify.get("/:username", async (request: any, reply) => {
    try {
      const { username } = z.object({
        username: z.string(),
      }).parse(request.params);

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          isVerified: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get user",
      });
    }
  });

  fastify.get("/me/servers", async (request: any, reply) => {
    try {
      const servers = await prisma.serverMember.findMany({
        where: { userId: request.userId },
        include: {
          server: {
            include: {
              _count: {
                select: {
                  members: true,
                  channels: true,
                },
              },
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: servers.map((m) => ({
          ...m.server,
          joinedAt: m.joinedAt,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get servers",
      });
    }
  });

  fastify.get("/me/notifications", async (request: any, reply) => {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        unreadOnly: z.coerce.boolean().default(false),
      }).parse(request.query);

      const where = {
        userId: request.userId,
        ...(unreadOnly && { isRead: false }),
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: notifications,
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
        error: "Failed to get notifications",
      });
    }
  });

  fastify.patch("/me/notifications/:id/read", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      await prisma.notification.update({
        where: {
          id,
          userId: request.userId,
        },
        data: { isRead: true },
      });

      return reply.send({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update notification",
      });
    }
  });

  fastify.post("/me/notifications/read-all", async (request: any, reply) => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: request.userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return reply.send({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update notifications",
      });
    }
  });
};