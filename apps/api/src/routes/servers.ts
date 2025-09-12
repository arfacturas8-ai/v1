import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";
import crypto from "crypto";

// Enhanced validation schemas for server operations
const createServerSchema = z.object({
  name: z.string().min(1, "Server name is required").max(100, "Server name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  icon: z.string().url("Invalid icon URL").optional(),
  banner: z.string().url("Invalid banner URL").optional(),
  isPublic: z.boolean().default(true),
  category: z.enum(["GAMING", "MUSIC", "EDUCATION", "SCIENCE", "TECHNOLOGY", "ENTERTAINMENT", "OTHER"]).optional(),
  maxMembers: z.number().min(1, "Max members must be at least 1").max(500000, "Max members cannot exceed 500,000").default(100000),
  tokenGated: z.boolean().default(false),
  requiredTokens: z.array(z.object({
    contractAddress: z.string(),
    tokenType: z.enum(["ERC20", "ERC721", "ERC1155"]),
    minAmount: z.string().optional(),
    tokenId: z.string().optional()
  })).optional(),
  rules: z.array(z.string().max(500)).max(20).optional(),
  welcomeChannelId: z.string().optional(),
  systemChannelId: z.string().optional(),
  verificationLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "HIGHEST"]).default("MEDIUM")
});

const updateServerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().url().optional(),
  banner: z.string().url().optional(),
  isPublic: z.boolean().optional(),
  category: z.enum(["GAMING", "MUSIC", "EDUCATION", "SCIENCE", "TECHNOLOGY", "ENTERTAINMENT", "OTHER"]).optional(),
  maxMembers: z.number().min(1).max(500000).optional(),
  rules: z.array(z.string().max(500)).max(20).optional(),
  welcomeChannelId: z.string().optional(),
  systemChannelId: z.string().optional(),
  verificationLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "HIGHEST"]).optional()
});

const createInviteSchema = z.object({
  maxUses: z.number().min(1).max(1000).optional(),
  maxAge: z.number().min(300).max(604800).optional(), // 5 minutes to 7 days
  temporary: z.boolean().default(false),
  channelId: z.string().optional(),
  reason: z.string().max(200).optional()
});

const kickMemberSchema = z.object({
  reason: z.string().max(500, "Reason must be 500 characters or less").optional()
});

const banMemberSchema = z.object({
  reason: z.string().max(500, "Reason must be 500 characters or less").optional(),
  deleteMessageDays: z.number().min(0).max(7, "Can only delete messages up to 7 days old").default(0)
});

// Discord permission constants
const PERMISSIONS = {
  CREATE_INSTANT_INVITE: 0x1,
  KICK_MEMBERS: 0x2,
  BAN_MEMBERS: 0x4,
  ADMINISTRATOR: 0x8,
  MANAGE_CHANNELS: 0x10,
  MANAGE_SERVER: 0x20,
  ADD_REACTIONS: 0x40,
  VIEW_AUDIT_LOG: 0x80,
  PRIORITY_SPEAKER: 0x100,
  STREAM: 0x200,
  VIEW_CHANNEL: 0x400,
  SEND_MESSAGES: 0x800,
  SEND_TTS_MESSAGES: 0x1000,
  MANAGE_MESSAGES: 0x2000,
  EMBED_LINKS: 0x4000,
  ATTACH_FILES: 0x8000,
  READ_MESSAGE_HISTORY: 0x10000,
  MENTION_EVERYONE: 0x20000,
  USE_EXTERNAL_EMOJIS: 0x40000,
  VIEW_SERVER_INSIGHTS: 0x80000,
  CONNECT: 0x100000,
  SPEAK: 0x200000,
  MUTE_MEMBERS: 0x400000,
  DEAFEN_MEMBERS: 0x800000,
  MOVE_MEMBERS: 0x1000000,
  USE_VAD: 0x2000000,
  CHANGE_NICKNAME: 0x4000000,
  MANAGE_NICKNAMES: 0x8000000,
  MANAGE_ROLES: 0x10000000,
  MANAGE_WEBHOOKS: 0x20000000,
  MANAGE_EMOJIS_AND_STICKERS: 0x40000000
};

const serverRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authMiddleware);

  // Create server endpoint with enhanced validation and OpenAPI documentation
  fastify.post("/", {
    schema: {
      tags: ['servers'],
      summary: 'Create a new server',
      description: 'Creates a new Discord-like server with default channels and roles',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          icon: { type: 'string', format: 'uri' },
          banner: { type: 'string', format: 'uri' },
          isPublic: { type: 'boolean', default: true },
          category: { type: 'string', enum: ['GAMING', 'MUSIC', 'EDUCATION', 'SCIENCE', 'TECHNOLOGY', 'ENTERTAINMENT', 'OTHER'] },
          maxMembers: { type: 'number', minimum: 1, maximum: 500000, default: 100000 },
          tokenGated: { type: 'boolean', default: false },
          requiredTokens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                contractAddress: { type: 'string' },
                tokenType: { type: 'string', enum: ['ERC20', 'ERC721', 'ERC1155'] },
                minAmount: { type: 'string' },
                tokenId: { type: 'string' }
              }
            }
          },
          rules: { type: 'array', items: { type: 'string', maxLength: 500 }, maxItems: 20 },
          verificationLevel: { type: 'string', enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'], default: 'MEDIUM' }
        },
        required: ['name']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                ownerId: { type: 'string' },
                channels: { type: 'array' },
                memberCount: { type: 'number' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const body = createServerSchema.parse(request.body);

      // Use transaction for atomic server creation
      const server = await prisma.$transaction(async (tx) => {
        // Create the server
        const newServer = await tx.server.create({
          data: {
            name: body.name,
            description: body.description,
            icon: body.icon,
            banner: body.banner,
            isPublic: body.isPublic,
            category: body.category,
            maxMembers: body.maxMembers,
            tokenGated: body.tokenGated,
            requiredTokens: body.requiredTokens as any,
            rules: body.rules,
            verificationLevel: body.verificationLevel,
            ownerId: request.userId,
          },
        });

        // Create default roles with proper permissions
        const everyoneRole = await tx.role.create({
          data: {
            serverId: newServer.id,
            name: "@everyone",
            position: 0,
            permissions: BigInt(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES | PERMISSIONS.READ_MESSAGE_HISTORY | PERMISSIONS.CONNECT | PERMISSIONS.SPEAK),
            color: null,
            hoist: false,
            mentionable: false
          }
        });

        const adminRole = await tx.role.create({
          data: {
            serverId: newServer.id,
            name: "Admin",
            position: 1,
            permissions: BigInt(PERMISSIONS.ADMINISTRATOR),
            color: "#ff0000",
            hoist: true,
            mentionable: true
          }
        });

        // Create default channels
        const textCategory = await tx.channel.create({
          data: {
            serverId: newServer.id,
            name: "Text Channels",
            type: "CATEGORY",
            position: 0
          }
        });

        const generalText = await tx.channel.create({
          data: {
            serverId: newServer.id,
            name: "general",
            type: "TEXT",
            position: 1,
            parentId: textCategory.id,
            topic: "Welcome to the server! This is the general chat channel."
          }
        });

        const announcementChannel = await tx.channel.create({
          data: {
            serverId: newServer.id,
            name: "announcements",
            type: "ANNOUNCEMENT",
            position: 2,
            parentId: textCategory.id,
            topic: "Server announcements and important updates"
          }
        });

        const voiceCategory = await tx.channel.create({
          data: {
            serverId: newServer.id,
            name: "Voice Channels",
            type: "CATEGORY",
            position: 3
          }
        });

        const generalVoice = await tx.channel.create({
          data: {
            serverId: newServer.id,
            name: "General",
            type: "VOICE",
            position: 4,
            parentId: voiceCategory.id
          }
        });

        // Add owner as member with admin role
        const serverMember = await tx.serverMember.create({
          data: {
            serverId: newServer.id,
            userId: request.userId,
            joinedAt: new Date()
          }
        });

        // Assign admin role to owner
        await tx.memberRole.create({
          data: {
            serverId: newServer.id,
            userId: request.userId,
            roleId: adminRole.id
          }
        });

        // Log server creation in audit log
        await tx.auditLog.create({
          data: {
            serverId: newServer.id,
            userId: request.userId,
            action: "SERVER_CREATE",
            metadata: {
              serverName: body.name,
              isPublic: body.isPublic,
              category: body.category
            }
          }
        });

        return newServer;
      });

      // Fetch complete server data with relations
      const completeServer = await prisma.server.findUnique({
        where: { id: server.id },
        include: {
          channels: {
            orderBy: { position: 'asc' }
          },
          roles: {
            orderBy: { position: 'desc' }
          },
          _count: {
            select: {
              members: true
            }
          }
        }
      });

      // Emit socket event for real-time updates
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.emit('serverCreate', {
          server: completeServer,
          ownerId: request.userId
        });
      }

      return reply.code(201).send({
        success: true,
        data: completeServer,
        message: "Server created successfully with default channels and roles"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }
      
      fastify.log.error({ error, userId: request.userId }, 'Server creation failed');
      return reply.code(500).send({
        success: false,
        error: "Failed to create server. Please try again."
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

  // Get server discovery list
  fastify.get("/discover", async (request: any, reply) => {
    try {
      const { page = 1, limit = 24, category, search } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(24),
        category: z.string().optional(),
        search: z.string().optional(),
      }).parse(request.query);

      const where: any = {
        isPublic: true,
      };

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const [servers, total] = await Promise.all([
        prisma.server.findMany({
          where,
          include: {
            _count: {
              select: {
                members: true,
                channels: true,
              },
            },
            owner: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [
            { _count: { members: "desc" } },
            { createdAt: "desc" },
          ],
        }),
        prisma.server.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          servers,
          pagination: {
            total,
            page,
            pageSize: limit,
            hasMore: page * limit < total,
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch server discovery",
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
        channelId: z.string().optional(),
      }).parse(request.body);

      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      // Check if user has create invite permission
      const hasPermission = member.roles.some(memberRole => 
        memberRole.role.permissions & BigInt(0x1) // CREATE_INSTANT_INVITE
      );

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to create invites",
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
          channelId: body.channelId,
          inviterId: request.userId,
          maxUses: body.maxUses,
          maxAge: body.maxAge,
          temporary: body.temporary,
          expiresAt,
        },
        include: {
          server: {
            select: {
              id: true,
              name: true,
              icon: true,
              banner: true,
              description: true,
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          inviter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
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

  // Get server invites
  fastify.get("/:id/invites", async (request: any, reply) => {
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

      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      // Check if user has manage server or create invite permissions
      const hasPermission = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          (memberRole.role.permissions & BigInt(0x20)) || // MANAGE_SERVER
          (memberRole.role.permissions & BigInt(0x1))     // CREATE_INSTANT_INVITE
        );

      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to view invites",
        });
      }

      const invites = await prisma.invite.findMany({
        where: { serverId: id },
        include: {
          inviter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send({
        success: true,
        data: invites,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get invites",
      });
    }
  });

  // Use invite to join server
  fastify.post("/invites/:code/accept", async (request: any, reply) => {
    try {
      const { code } = z.object({
        code: z.string(),
      }).parse(request.params);

      const invite = await prisma.invite.findUnique({
        where: { code },
        include: {
          server: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
      });

      if (!invite) {
        return reply.code(404).send({
          success: false,
          error: "Invite not found",
        });
      }

      // Check if invite is expired
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return reply.code(400).send({
          success: false,
          error: "Invite has expired",
        });
      }

      // Check if invite has reached max uses
      if (invite.maxUses && invite.uses >= invite.maxUses) {
        return reply.code(400).send({
          success: false,
          error: "Invite has reached maximum uses",
        });
      }

      // Check if server is full
      if (invite.server._count.members >= invite.server.maxMembers) {
        return reply.code(400).send({
          success: false,
          error: "Server is full",
        });
      }

      // Check if user is already a member
      const existingMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: invite.serverId,
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

      // Check for server bans
      const ban = await prisma.ban.findUnique({
        where: {
          serverId_userId: {
            serverId: invite.serverId,
            userId: request.userId,
          },
        },
      });

      if (ban) {
        return reply.code(403).send({
          success: false,
          error: "You are banned from this server",
        });
      }

      // Create server membership
      const member = await prisma.serverMember.create({
        data: {
          serverId: invite.serverId,
          userId: request.userId,
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

      // Update invite usage
      await prisma.invite.update({
        where: { id: invite.id },
        data: {
          uses: { increment: 1 },
        },
      });

      // Emit socket event for real-time updates
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.to(`server:${invite.serverId}`).emit('memberJoin', {
          member,
          serverId: invite.serverId,
          inviteCode: code,
        });
      }

      return reply.send({
        success: true,
        data: {
          server: invite.server,
          member,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to accept invite",
      });
    }
  });

  // Delete invite
  fastify.delete("/invites/:code", async (request: any, reply) => {
    try {
      const { code } = z.object({
        code: z.string(),
      }).parse(request.params);

      const invite = await prisma.invite.findUnique({
        where: { code },
        include: {
          server: true,
        },
      });

      if (!invite) {
        return reply.code(404).send({
          success: false,
          error: "Invite not found",
        });
      }

      // Check permissions (invite creator, server owner, or manage server)
      const canDelete = invite.inviterId === request.userId ||
        invite.server.ownerId === request.userId;

      if (!canDelete) {
        const member = await prisma.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId: invite.serverId,
              userId: request.userId,
            },
          },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        const hasManagePermission = member?.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x20) // MANAGE_SERVER
        );

        if (!hasManagePermission) {
          return reply.code(403).send({
            success: false,
            error: "Insufficient permissions to delete invite",
          });
        }
      }

      await prisma.invite.delete({
        where: { id: invite.id },
      });

      return reply.send({
        success: true,
        message: "Invite deleted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete invite",
      });
    }
  });

  // Kick member from server
  fastify.post("/:id/members/:userId/kick", async (request: any, reply) => {
    try {
      const { id, userId } = z.object({
        id: z.string(),
        userId: z.string(),
      }).parse(request.params);

      const body = z.object({
        reason: z.string().max(500).optional(),
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

      // Check permissions (server owner or kick members permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canKick = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x2) // KICK_MEMBERS
        );

      if (!canKick) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to kick members",
        });
      }

      // Cannot kick server owner
      if (server.ownerId === userId) {
        return reply.code(400).send({
          success: false,
          error: "Cannot kick server owner",
        });
      }

      // Cannot kick yourself
      if (request.userId === userId) {
        return reply.code(400).send({
          success: false,
          error: "Cannot kick yourself",
        });
      }

      // Check if target user is a member
      const targetMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId,
          },
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

      if (!targetMember) {
        return reply.code(404).send({
          success: false,
          error: "User is not a member of this server",
        });
      }

      // Remove member from server
      await prisma.serverMember.delete({
        where: {
          serverId_userId: {
            serverId: id,
            userId,
          },
        },
      });

      // Log the kick action
      await prisma.auditLog.create({
        data: {
          serverId: id,
          userId: request.userId,
          action: "MEMBER_KICK",
          targetId: userId,
          reason: body.reason,
          metadata: {
            targetUsername: targetMember.user.username,
          },
        },
      });

      // Emit socket event
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.to(`server:${id}`).emit('memberKick', {
          serverId: id,
          kickedMember: targetMember,
          moderator: {
            id: request.userId,
            username: member.user?.username,
          },
          reason: body.reason,
        });
      }

      return reply.send({
        success: true,
        message: "Member kicked successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to kick member",
      });
    }
  });

  // Ban member from server
  fastify.post("/:id/members/:userId/ban", async (request: any, reply) => {
    try {
      const { id, userId } = z.object({
        id: z.string(),
        userId: z.string(),
      }).parse(request.params);

      const body = z.object({
        reason: z.string().max(500).optional(),
        deleteMessageDays: z.number().min(0).max(7).default(0),
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

      // Check permissions (server owner or ban members permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canBan = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x4) // BAN_MEMBERS
        );

      if (!canBan) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to ban members",
        });
      }

      // Cannot ban server owner
      if (server.ownerId === userId) {
        return reply.code(400).send({
          success: false,
          error: "Cannot ban server owner",
        });
      }

      // Cannot ban yourself
      if (request.userId === userId) {
        return reply.code(400).send({
          success: false,
          error: "Cannot ban yourself",
        });
      }

      // Get target user info
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      });

      if (!targetUser) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      // Check if already banned
      const existingBan = await prisma.ban.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId,
          },
        },
      });

      if (existingBan) {
        return reply.code(400).send({
          success: false,
          error: "User is already banned",
        });
      }

      await prisma.$transaction(async (tx) => {
        // Create ban record
        await tx.ban.create({
          data: {
            serverId: id,
            userId,
            moderatorId: request.userId,
            reason: body.reason,
          },
        });

        // Remove member from server if they are a member
        const targetMember = await tx.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId: id,
              userId,
            },
          },
        });

        if (targetMember) {
          await tx.serverMember.delete({
            where: {
              serverId_userId: {
                serverId: id,
                userId,
              },
            },
          });
        }

        // Delete messages if requested
        if (body.deleteMessageDays > 0) {
          const deleteBefore = new Date();
          deleteBefore.setDate(deleteBefore.getDate() - body.deleteMessageDays);

          await tx.message.deleteMany({
            where: {
              userId,
              channel: {
                serverId: id,
              },
              createdAt: {
                gte: deleteBefore,
              },
            },
          });
        }

        // Log the ban action
        await tx.auditLog.create({
          data: {
            serverId: id,
            userId: request.userId,
            action: "MEMBER_BAN",
            targetId: userId,
            reason: body.reason,
            metadata: {
              targetUsername: targetUser.username,
              deleteMessageDays: body.deleteMessageDays,
            },
          },
        });
      });

      // Emit socket event
      if (fastify.socketIntegration) {
        fastify.socketIntegration.io.to(`server:${id}`).emit('memberBan', {
          serverId: id,
          bannedUser: targetUser,
          moderator: {
            id: request.userId,
          },
          reason: body.reason,
        });
      }

      return reply.send({
        success: true,
        message: "Member banned successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to ban member",
      });
    }
  });

  // Unban member from server
  fastify.delete("/:id/bans/:userId", async (request: any, reply) => {
    try {
      const { id, userId } = z.object({
        id: z.string(),
        userId: z.string(),
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

      // Check permissions (server owner or ban members permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canUnban = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x4) // BAN_MEMBERS
        );

      if (!canUnban) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to unban members",
        });
      }

      // Check if user is actually banned
      const ban = await prisma.ban.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId,
          },
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

      if (!ban) {
        return reply.code(404).send({
          success: false,
          error: "User is not banned",
        });
      }

      // Remove ban
      await prisma.ban.delete({
        where: {
          serverId_userId: {
            serverId: id,
            userId,
          },
        },
      });

      // Log the unban action
      await prisma.auditLog.create({
        data: {
          serverId: id,
          userId: request.userId,
          action: "MEMBER_UNBAN",
          targetId: userId,
          metadata: {
            targetUsername: ban.user.username,
          },
        },
      });

      return reply.send({
        success: true,
        message: "Member unbanned successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to unban member",
      });
    }
  });

  // Get server bans
  fastify.get("/:id/bans", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const { page = 1, limit = 50 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
      }).parse(request.query);

      const server = await prisma.server.findUnique({
        where: { id },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      // Check permissions (server owner or ban members permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canViewBans = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x4) // BAN_MEMBERS
        );

      if (!canViewBans) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to view bans",
        });
      }

      const [bans, total] = await Promise.all([
        prisma.ban.findMany({
          where: { serverId: id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            moderator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.ban.count({ where: { serverId: id } }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: bans,
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
        error: "Failed to get bans",
      });
    }
  });

  // Update member roles
  fastify.patch("/:id/members/:userId/roles", async (request: any, reply) => {
    try {
      const { id, userId } = z.object({
        id: z.string(),
        userId: z.string(),
      }).parse(request.params);

      const body = z.object({
        roleIds: z.array(z.string()),
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

      // Check permissions (server owner or manage roles permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canManageRoles = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x10000000) // MANAGE_ROLES
        );

      if (!canManageRoles) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to manage roles",
        });
      }

      // Check if target user is a member
      const targetMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId,
          },
        },
      });

      if (!targetMember) {
        return reply.code(404).send({
          success: false,
          error: "User is not a member of this server",
        });
      }

      // Verify all role IDs exist and belong to this server
      const validRoles = await prisma.role.findMany({
        where: {
          id: { in: body.roleIds },
          serverId: id,
        },
      });

      if (validRoles.length !== body.roleIds.length) {
        return reply.code(400).send({
          success: false,
          error: "One or more invalid role IDs",
        });
      }

      // Update member roles
      await prisma.$transaction(async (tx) => {
        // Remove existing role assignments
        await tx.memberRole.deleteMany({
          where: {
            serverId_userId: {
              serverId: id,
              userId,
            },
          },
        });

        // Add new role assignments
        if (body.roleIds.length > 0) {
          await tx.memberRole.createMany({
            data: body.roleIds.map((roleId) => ({
              serverId: id,
              userId,
              roleId,
            })),
          });
        }
      });

      // Get updated member with roles
      const updatedMember = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId,
          },
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
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: updatedMember,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update member roles",
      });
    }
  });

  // Create role
  fastify.post("/:id/roles", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        permissions: z.bigint().default(BigInt(0)),
        hoist: z.boolean().default(false),
        mentionable: z.boolean().default(false),
        position: z.number().min(0).optional(),
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

      // Check permissions (server owner or manage roles permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canManageRoles = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x10000000) // MANAGE_ROLES
        );

      if (!canManageRoles) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to create roles",
        });
      }

      // Get next position if not specified
      let position = body.position;
      if (position === undefined) {
        const highestRole = await prisma.role.findFirst({
          where: { serverId: id },
          orderBy: { position: "desc" },
        });
        position = (highestRole?.position || 0) + 1;
      }

      const role = await prisma.role.create({
        data: {
          serverId: id,
          name: body.name,
          color: body.color,
          permissions: body.permissions,
          hoist: body.hoist,
          mentionable: body.mentionable,
          position,
        },
      });

      return reply.code(201).send({
        success: true,
        data: role,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create role",
      });
    }
  });

  // Update role
  fastify.patch("/:id/roles/:roleId", async (request: any, reply) => {
    try {
      const { id, roleId } = z.object({
        id: z.string(),
        roleId: z.string(),
      }).parse(request.params);

      const body = z.object({
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        permissions: z.bigint().optional(),
        hoist: z.boolean().optional(),
        mentionable: z.boolean().optional(),
        position: z.number().min(0).optional(),
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

      // Check permissions (server owner or manage roles permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canManageRoles = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x10000000) // MANAGE_ROLES
        );

      if (!canManageRoles) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to update roles",
        });
      }

      // Check if role exists and belongs to server
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          serverId: id,
        },
      });

      if (!role) {
        return reply.code(404).send({
          success: false,
          error: "Role not found",
        });
      }

      // Cannot edit @everyone role name
      if (role.name === "@everyone" && body.name && body.name !== "@everyone") {
        return reply.code(400).send({
          success: false,
          error: "Cannot rename @everyone role",
        });
      }

      const updatedRole = await prisma.role.update({
        where: { id: roleId },
        data: body,
      });

      return reply.send({
        success: true,
        data: updatedRole,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update role",
      });
    }
  });

  // Delete role
  fastify.delete("/:id/roles/:roleId", async (request: any, reply) => {
    try {
      const { id, roleId } = z.object({
        id: z.string(),
        roleId: z.string(),
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

      // Check permissions (server owner or manage roles permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canManageRoles = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x10000000) // MANAGE_ROLES
        );

      if (!canManageRoles) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to delete roles",
        });
      }

      // Check if role exists and belongs to server
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          serverId: id,
        },
      });

      if (!role) {
        return reply.code(404).send({
          success: false,
          error: "Role not found",
        });
      }

      // Cannot delete @everyone role
      if (role.name === "@everyone") {
        return reply.code(400).send({
          success: false,
          error: "Cannot delete @everyone role",
        });
      }

      // Delete role (this will cascade delete member roles)
      await prisma.role.delete({
        where: { id: roleId },
      });

      return reply.send({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete role",
      });
    }
  });

  // Get server roles
  fastify.get("/:id/roles", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

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

      const roles = await prisma.role.findMany({
        where: { serverId: id },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { position: "desc" },
      });

      return reply.send({
        success: true,
        data: roles,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get roles",
      });
    }
  });

  // Get server audit log
  fastify.get("/:id/audit-logs", async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const { page = 1, limit = 50, action } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
        action: z.string().optional(),
      }).parse(request.query);

      const server = await prisma.server.findUnique({
        where: { id },
      });

      if (!server) {
        return reply.code(404).send({
          success: false,
          error: "Server not found",
        });
      }

      // Check permissions (server owner or view audit log permission)
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: id,
            userId: request.userId,
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Not a member of this server",
        });
      }

      const canViewAuditLog = server.ownerId === request.userId ||
        member.roles.some(memberRole => 
          memberRole.role.permissions & BigInt(0x80) // VIEW_AUDIT_LOG
        );

      if (!canViewAuditLog) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to view audit log",
        });
      }

      const where: any = { serverId: id };
      if (action) {
        where.action = action;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
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
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: logs,
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
        error: "Failed to get audit logs",
      });
    }
  });
};

export default serverRoutes;