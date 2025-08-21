import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authenticate } from "../middleware/auth";
import crypto from "crypto";

export const serverRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticate);

  fastify.post("/", async (request: any, reply) => {
    try {
      const body = z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        icon: z.string().url().optional(),
        isPublic: z.boolean().default(true),
        tokenGated: z.boolean().default(false),
        requiredTokens: z.any().optional(),
      }).parse(request.body);

      const server = await prisma.server.create({
        data: {
          ...body,
          ownerId: request.userId,
          channels: {
            create: [
              { name: "general", type: "TEXT", position: 0 },
              { name: "voice", type: "VOICE", position: 1 },
            ],
          },
          members: {
            create: {
              userId: request.userId,
            },
          },
          roles: {
            create: [
              { name: "@everyone", position: 0, permissions: 1n },
              { name: "Admin", position: 1, permissions: -1n },
            ],
          },
        },
        include: {
          channels: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: server,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create server",
      });
    }
  });

  fastify.get("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const server = await prisma.server.findUnique({
        where: { id },
        include: {
          channels: {
            orderBy: { position: "asc" },
          },
          roles: {
            orderBy: { position: "desc" },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
      });

      if (!member && !server.isPublic) {
        return reply.code(403).send({
          success: false,
          error: "Access denied",
        });
      }

      return reply.send({
        success: true,
        data: server,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get server",
      });
    }
  });

  fastify.patch("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        icon: z.string().url().optional(),
        banner: z.string().url().optional(),
        isPublic: z.boolean().optional(),
      }).parse(request.body);

      const server = await prisma.server.findUnique({
        where: { id },
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
          error: "Only server owner can update server",
        });
      }

      const updatedServer = await prisma.server.update({
        where: { id },
        data: body,
      });

      return reply.send({
        success: true,
        data: updatedServer,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update server",
      });
    }
  });

  fastify.delete("/:id", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const server = await prisma.server.findUnique({
        where: { id },
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
          error: "Only server owner can delete server",
        });
      }

      await prisma.server.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: "Server deleted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete server",
      });
    }
  });

  fastify.post("/:id/join", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const server = await prisma.server.findUnique({
        where: { id },
        include: {
          _count: {
            select: { members: true },
          },
        },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      if (server._count.members >= server.maxMembers) {
        return reply.code(400).send({
          success: false,
          error: "Server is full",
        });
      }

      const existingMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
      });

      if (existingMember) {
        return reply.code(400).send({
          success: false,
          error: "Already a member of this server",
        });
      }

      const member = await prisma.serverMember.create({
        data: {
          serverId: id,
          userId: request.userId,
        },
      });

      return reply.send({
        success: true,
        data: member,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to join server",
      });
    }
  });

  fastify.post("/:id/leave", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const server = await prisma.server.findUnique({
        where: { id },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      if (server.ownerId === request.userId) {
        return reply.code(400).send({
          success: false,
          error: "Server owner cannot leave the server",
        });
      }

      await prisma.serverMember.delete({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
      });

      return reply.send({
        success: true,
        message: "Left server successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to leave server",
      });
    }
  });

  fastify.get("/:id/members", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const { page = 1, limit = 50 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
      }).parse(request.query);

      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
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

      const [members, total] = await Promise.all([
        prisma.serverMember.findMany({
          where: { serverId: id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true,
              },
            },
            roles: {
              include: {
                role: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.serverMember.count({ where: { serverId: id } }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: members,
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
        error: "Failed to get members",
      });
    }
  });

  fastify.post("/:id/invites", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        maxUses: z.number().min(1).optional(),
        maxAge: z.number().min(0).optional(),
        temporary: z.boolean().default(false),
      }).parse(request.body);

      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
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

      const code = crypto.randomBytes(6).toString("hex");
      const expiresAt = body.maxAge
        ? new Date(Date.now() + body.maxAge * 1000)
        : undefined;

      const invite = await prisma.invite.create({
        data: {
          code,
          serverId: id,
          inviterId: request.userId,
          maxUses: body.maxUses,
          maxAge: body.maxAge,
          temporary: body.temporary,
          expiresAt,
        },
      });

      return reply.send({
        success: true,
        data: invite,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create invite",
      });
    }
  });
};