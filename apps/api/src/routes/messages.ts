import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authenticate } from "../middleware/auth";

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/channel/:channelId", async (request: any, reply) => {
    try {
      const { channelId } = z.object({
        channelId: z.string(),
      }).parse(request.params);

      const { before, after, limit = 50 } = z.object({
        before: z.string().optional(),
        after: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
      }).parse(request.query);

      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        return reply.code(404).send({
          success: false,
          error: "Channel not found",
        });
      }

      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: channel.serverId,
            userId: request.userId,
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const where: any = { channelId };
      if (before) {
        where.createdAt = { lt: new Date(before) };
      }
      if (after) {
        where.createdAt = { gt: new Date(after) };
      }

      const messages = await prisma.message.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          replyTo: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return reply.send({
        success: true,
        data: messages.reverse(),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get messages",
      });
    }
  });

  fastify.post("/", async (request: any, reply) => {
    try {
      const body = z.object({
        channelId: z.string(),
        content: z.string().min(1).max(4000),
        replyToId: z.string().optional(),
        attachments: z.array(z.any()).optional(),
        embeds: z.array(z.any()).optional(),
      }).parse(request.body);

      const channel = await prisma.channel.findUnique({
        where: { id: body.channelId },
      });

      if (!channel) {
        return reply.code(404).send({
          success: false,
          error: "Channel not found",
        });
      }

      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: channel.serverId,
            userId: request.userId,
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const message = await prisma.message.create({
        data: {
          channelId: body.channelId,
          userId: request.userId,
          content: body.content,
          replyToId: body.replyToId,
          attachments: body.attachments,
          embeds: body.embeds,
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
          replyTo: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });

      const io = (fastify as any).io;
      io.to(`channel-${body.channelId}`).emit("new-message", message);

      return reply.send({
        success: true,
        data: message,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to send message",
      });
    }
  });

  fastify.patch("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        content: z.string().min(1).max(4000),
      }).parse(request.body);

      const message = await prisma.message.findUnique({
        where: { id },
      });

      if (!message) {
        return reply.code(404).send({
          success: false,
          error: "Message not found",
        });
      }

      if (message.userId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Can only edit your own messages",
        });
      }

      const updatedMessage = await prisma.message.update({
        where: { id },
        data: {
          content: body.content,
          editedAt: new Date(),
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
        },
      });

      const io = (fastify as any).io;
      io.to(`channel-${message.channelId}`).emit("message-updated", updatedMessage);

      return reply.send({
        success: true,
        data: updatedMessage,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update message",
      });
    }
  });

  fastify.delete("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const message = await prisma.message.findUnique({
        where: { id },
        include: {
          channel: {
            include: {
              server: true,
            },
          },
        },
      });

      if (!message) {
        return reply.code(404).send({
          success: false,
          error: "Message not found",
        });
      }

      const canDelete = 
        message.userId === request.userId ||
        message.channel.server.ownerId === request.userId;

      if (!canDelete) {
        return reply.code(403).send({
          success: false,
          error: "Cannot delete this message",
        });
      }

      await prisma.message.delete({
        where: { id },
      });

      const io = (fastify as any).io;
      io.to(`channel-${message.channelId}`).emit("message-deleted", {
        id,
        channelId: message.channelId,
      });

      return reply.send({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete message",
      });
    }
  });

  fastify.post("/:id/reactions", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        emoji: z.string().min(1).max(20),
      }).parse(request.body);

      const message = await prisma.message.findUnique({
        where: { id },
      });

      if (!message) {
        return reply.code(404).send({
          success: false,
          error: "Message not found",
        });
      }

      const existingReaction = await prisma.reaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId: id,
            userId: request.userId,
            emoji: body.emoji,
          },
        },
      });

      if (existingReaction) {
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });

        const io = (fastify as any).io;
        io.to(`channel-${message.channelId}`).emit("reaction-removed", {
          messageId: id,
          userId: request.userId,
          emoji: body.emoji,
        });

        return reply.send({
          success: true,
          message: "Reaction removed",
        });
      }

      const reaction = await prisma.reaction.create({
        data: {
          messageId: id,
          userId: request.userId,
          emoji: body.emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      const io = (fastify as any).io;
      io.to(`channel-${message.channelId}`).emit("reaction-added", {
        messageId: id,
        reaction,
      });

      return reply.send({
        success: true,
        data: reaction,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to add reaction",
      });
    }
  });
};