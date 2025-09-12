import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const botRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authMiddleware);

  // Get server bots (placeholder - would integrate with bot framework)
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

      // Check if user is member
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId,
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

      // Placeholder bot data - would come from actual bot system
      const bots = [
        {
          id: "music-bot",
          name: "Music Bot",
          description: "Play music in voice channels",
          enabled: true,
          commands: ["/play", "/skip", "/queue"],
        },
        {
          id: "moderation-bot",
          name: "Moderation Bot",
          description: "Automated moderation tools",
          enabled: false,
          commands: ["/ban", "/kick", "/warn"],
        },
      ];

      return reply.send({
        success: true,
        data: bots,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get bots",
      });
    }
  });

  // Enable/disable bot (server owner only)
  fastify.patch("/servers/:serverId/:botId", async (request: any, reply) => {
    try {
      const { serverId, botId } = z.object({
        serverId: z.string(),
        botId: z.string(),
      }).parse(request.params);

      const body = z.object({
        enabled: z.boolean(),
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
          error: "Only server owner can manage bots",
        });
      }

      // This would integrate with your bot management system
      // For now, just return success
      return reply.send({
        success: true,
        message: `Bot ${body.enabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update bot",
      });
    }
  });

  // Execute bot command
  fastify.post("/commands", async (request: any, reply) => {
    try {
      const body = z.object({
        serverId: z.string(),
        channelId: z.string(),
        command: z.string(),
        args: z.array(z.string()).optional(),
      }).parse(request.body);

      // Verify user is in server
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: body.serverId,
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

      // This would process the bot command
      // For now, just return a placeholder response
      return reply.send({
        success: true,
        data: {
          response: `Executed command: ${body.command}`,
          channelId: body.channelId,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to execute command",
      });
    }
  });
};

export default botRoutes;