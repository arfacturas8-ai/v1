import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authMiddleware);

  // Get user notifications
  fastify.get("/", async (request: any, reply) => {
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

  // Mark notification as read
  fastify.patch("/:id/read", async (request: any, reply) => {
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

  // Mark all notifications as read
  fastify.post("/read-all", async (request: any, reply) => {
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

export default notificationRoutes;