import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authenticate } from "../middleware/auth";

export const channelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const channel = await prisma.channel.findUnique({
        where: { id },
        include: {
          server: true,
        },
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

      return reply.send({
        success: true,
        data: channel,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get channel",
      });
    }
  });

  fastify.post("/", async (request: any, reply) => {
    try {
      const body = z.object({
        serverId: z.string(),
        name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
        description: z.string().max(500).optional(),
        type: z.enum(["TEXT", "VOICE", "VIDEO", "FORUM", "STAGE", "CATEGORY", "ANNOUNCEMENT"]).default("TEXT"),
        position: z.number().min(0).default(0),
        isPrivate: z.boolean().default(false),
        parentId: z.string().optional(),
        slowMode: z.number().min(0).max(21600).default(0),
        nsfw: z.boolean().default(false),
      }).parse(request.body);

      const server = await prisma.server.findUnique({
        where: { id: body.serverId },
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
          error: "Only server owner can create channels",
        });
      }

      const channel = await prisma.channel.create({
        data: body,
      });

      return reply.send({
        success: true,
        data: channel,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create channel",
      });
    }
  });

  fastify.patch("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().max(500).optional(),
        position: z.number().min(0).optional(),
        isPrivate: z.boolean().optional(),
        slowMode: z.number().min(0).max(21600).optional(),
        nsfw: z.boolean().optional(),
      }).parse(request.body);

      const channel = await prisma.channel.findUnique({
        where: { id },
        include: { server: true },
      });

      if (!channel) {
        return reply.code(404).send({
          success: false,
          error: "Channel not found",
        });
      }

      if (channel.server.ownerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Only server owner can update channels",
        });
      }

      const updatedChannel = await prisma.channel.update({
        where: { id },
        data: body,
      });

      return reply.send({
        success: true,
        data: updatedChannel,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update channel",
      });
    }
  });

  fastify.delete("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const channel = await prisma.channel.findUnique({
        where: { id },
        include: { server: true },
      });

      if (!channel) {
        return reply.code(404).send({
          success: false,
          error: "Channel not found",
        });
      }

      if (channel.server.ownerId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Only server owner can delete channels",
        });
      }

      await prisma.channel.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: "Channel deleted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete channel",
      });
    }
  });
};