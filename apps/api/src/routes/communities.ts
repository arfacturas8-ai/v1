import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";
import { validate, validationSchemas } from "../middleware/validation";

const communityRoutes: FastifyPluginAsync = async (fastify) => {
  // Get public communities (specific public endpoint)
  fastify.get("/public", async (request, reply) => {
    try {
      const { page = 1, limit = 20, sort = "members" } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        sort: z.enum(["members", "recent", "posts", "name"]).default("members"),
      }).parse(request.query);

      let orderBy: any;
      switch (sort) {
        case "members":
          orderBy = { memberCount: "desc" };
          break;
        case "recent":
          orderBy = { createdAt: "desc" };
          break;
        case "posts":
          orderBy = { posts: { _count: "desc" } };
          break;
        case "name":
          orderBy = { name: "asc" };
          break;
        default:
          orderBy = { memberCount: "desc" };
      }

      const [communities, total] = await Promise.all([
        prisma.community.findMany({
          where: { isPublic: true },
          include: {
            _count: {
              select: { members: true, posts: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
        }),
        prisma.community.count({ where: { isPublic: true } }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: communities,
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
        error: "Failed to get public communities",
      });
    }
  });

  // Get all communities (public endpoint)
  fastify.get("/", async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      }).parse(request.query);

      const [communities, total] = await Promise.all([
        prisma.community.findMany({
          where: { isPublic: true },
          include: {
            _count: {
              select: { CommunityMember: true, Post: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { memberCount: "desc" },
        }),
        prisma.community.count({ where: { isPublic: true } }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: communities,
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
        error: "Failed to get communities",
      });
    }
  });

  // Get community by name
  fastify.get("/:name", async (request, reply) => {
    try {
      const { name } = z.object({
        name: z.string(),
      }).parse(request.params);

      const community = await prisma.community.findUnique({
        where: { name },
        include: {
          _count: {
            select: { CommunityMember: true, Post: true },
          },
        },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      return reply.send({
        success: true,
        data: community,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get community",
      });
    }
  });

  // Routes that require authentication

  // Create community (requires auth)
  fastify.post("/", { 
    preHandler: [
      authMiddleware,
      validate({
        body: validationSchemas.community.create.body
      })
    ] 
  }, async (request: any, reply) => {
    try {
      const body = request.body as any;

      const existingCommunity = await prisma.community.findUnique({
        where: { name: body.name },
      });

      if (existingCommunity) {
        return reply.code(409).send({
          success: false,
          error: "Community name already taken",
        });
      }

      const community = await prisma.community.create({
        data: {
          ...body,
          memberCount: 1, // Initialize with 1 member (the creator)
          members: {
            create: {
              userId: request.userId,
            },
          },
          moderators: {
            create: {
              userId: request.userId,
              permissions: { all: true },
            },
          },
        },
        include: {
          _count: {
            select: { members: true, posts: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: community,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create community",
      });
    }
  });

  // Join community (requires auth)
  fastify.post("/:name/join", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { name } = z.object({
        name: z.string(),
      }).parse(request.params);

      const community = await prisma.community.findUnique({
        where: { name },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      const existingMember = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: request.userId,
          },
        },
      });

      if (existingMember) {
        return reply.code(400).send({
          success: false,
          error: "Already a member of this community",
        });
      }

      const member = await prisma.communityMember.create({
        data: {
          communityId: community.id,
          userId: request.userId,
        },
      });

      // Update member count
      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } },
      });

      return reply.send({
        success: true,
        data: member,
      });
    } catch (error) {
      fastify.log.error('Join community error:', error);
      return reply.code(500).send({
        success: false,
        error: "An unexpected error occurred",
        details: {
          message: (error as any)?.message || 'Unknown error',
          requestId: request.id,
          processingTime: 0
        }
      });
    }
  });

  // Leave community (requires auth)
  fastify.post("/:name/leave", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { name } = z.object({
        name: z.string(),
      }).parse(request.params);

      const community = await prisma.community.findUnique({
        where: { name },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      const existingMember = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: request.userId,
          },
        },
      });

      if (!existingMember) {
        return reply.code(400).send({
          success: false,
          error: "Not a member of this community",
        });
      }

      await prisma.communityMember.delete({
        where: { id: existingMember.id },
      });

      // Update member count
      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount: { decrement: 1 } },
      });

      return reply.send({
        success: true,
        message: "Successfully left the community",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to leave community",
      });
    }
  });

  // Get community members (requires auth)
  fastify.get("/:name/members", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { name } = z.object({
        name: z.string(),
      }).parse(request.params);

      const { page = 1, limit = 25 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
      }).parse(request.query);

      const community = await prisma.community.findUnique({
        where: { name },
        include: {
          moderators: {
            where: { userId: request.userId },
          },
        },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      // Check if user is a moderator or member
      const userMembership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: request.userId,
          },
        },
      });

      const isModerator = community.moderators.length > 0;

      if (!userMembership && !isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Must be a member to view member list",
        });
      }

      const [members, total] = await Promise.all([
        prisma.communityMember.findMany({
          where: { communityId: community.id },
          include: {
            community: {
              select: {
                moderators: {
                  select: { userId: true },
                },
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { joinedAt: "desc" },
        }),
        prisma.communityMember.count({ where: { communityId: community.id } }),
      ]);

      const membersWithRoles = members.map(member => ({
        ...member,
        isModerator: community.moderators.some(mod => mod.userId === member.userId),
      }));

      return reply.send({
        success: true,
        data: {
          items: membersWithRoles,
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
        error: "Failed to get community members",
      });
    }
  });

  // Update community (requires auth and ownership/moderation)
  fastify.patch("/:name", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { name } = z.object({
        name: z.string(),
      }).parse(request.params);

      const body = z.object({
        displayName: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        icon: z.string().url().optional(),
        banner: z.string().url().optional(),
        isPublic: z.boolean().optional(),
        isNsfw: z.boolean().optional(),
        rules: z.array(z.object({
          title: z.string(),
          description: z.string(),
        })).optional(),
      }).parse(request.body);

      const community = await prisma.community.findUnique({
        where: { name },
        include: {
          moderators: {
            where: { userId: request.userId },
          },
        },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      const isModerator = community.moderators.length > 0;
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to update community",
        });
      }

      const updatedCommunity = await prisma.community.update({
        where: { id: community.id },
        data: body,
        include: {
          _count: {
            select: { members: true, posts: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: updatedCommunity,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update community",
      });
    }
  });

  // Add moderator (requires auth and ownership/head moderator)
  fastify.post("/:name/moderators", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { name } = z.object({
        name: z.string(),
      }).parse(request.params);

      const body = z.object({
        username: z.string(),
        permissions: z.object({
          managePosts: z.boolean().default(true),
          manageComments: z.boolean().default(true),
          banUsers: z.boolean().default(false),
          manageSettings: z.boolean().default(false),
        }).default({
          managePosts: true,
          manageComments: true,
          banUsers: false,
          manageSettings: false,
        }),
      }).parse(request.body);

      const community = await prisma.community.findUnique({
        where: { name },
        include: {
          moderators: {
            where: { userId: request.userId },
          },
        },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      const isModerator = community.moderators.length > 0;
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to add moderators",
        });
      }

      // Find target user
      const targetUser = await prisma.user.findUnique({
        where: { username: body.username },
      });

      if (!targetUser) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      // Check if user is already a moderator
      const existingModerator = await prisma.moderator.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: targetUser.id,
          },
        },
      });

      if (existingModerator) {
        return reply.code(400).send({
          success: false,
          error: "User is already a moderator",
        });
      }

      // Add as moderator
      const moderator = await prisma.moderator.create({
        data: {
          communityId: community.id,
          userId: targetUser.id,
          permissions: body.permissions,
        },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: moderator,
        message: `${body.username} has been added as a moderator`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to add moderator",
      });
    }
  });

  // Remove moderator (requires auth and ownership/head moderator)
  fastify.delete("/:name/moderators/:username", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { name, username } = z.object({
        name: z.string(),
        username: z.string(),
      }).parse(request.params);

      const community = await prisma.community.findUnique({
        where: { name },
        include: {
          moderators: {
            where: { userId: request.userId },
          },
        },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      const isModerator = community.moderators.length > 0;
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to remove moderators",
        });
      }

      // Find target user
      const targetUser = await prisma.user.findUnique({
        where: { username },
      });

      if (!targetUser) {
        return reply.code(404).send({
          success: false,
          error: "User not found",
        });
      }

      // Cannot remove yourself
      if (targetUser.id === request.userId) {
        return reply.code(400).send({
          success: false,
          error: "Cannot remove yourself as moderator",
        });
      }

      const existingModerator = await prisma.moderator.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: targetUser.id,
          },
        },
      });

      if (!existingModerator) {
        return reply.code(404).send({
          success: false,
          error: "User is not a moderator",
        });
      }

      await prisma.moderator.delete({
        where: { id: existingModerator.id },
      });

      return reply.send({
        success: true,
        message: `${username} has been removed as moderator`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to remove moderator",
      });
    }
  });

  // Get community stats (public)
  fastify.get("/:name/stats", async (request, reply) => {
    try {
      const { name } = z.object({
        name: z.string(),
      }).parse(request.params);

      const community = await prisma.community.findUnique({
        where: { name },
      });

      if (!community) {
        return reply.code(404).send({
          success: false,
          error: "Community not found",
        });
      }

      const [memberCount, postCount, activeMembers] = await Promise.all([
        prisma.communityMember.count({ where: { communityId: community.id } }),
        prisma.post.count({ where: { communityId: community.id } }),
        prisma.communityMember.count({
          where: {
            communityId: community.id,
            joinedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      // Get top posts this week
      const topPosts = await prisma.post.findMany({
        where: {
          communityId: community.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          title: true,
          score: true,
          commentCount: true,
        },
        orderBy: { score: "desc" },
        take: 5,
      });

      return reply.send({
        success: true,
        data: {
          community: {
            id: community.id,
            name: community.name,
            displayName: community.displayName,
          },
          stats: {
            memberCount,
            postCount,
            activeMembers,
            topPostsThisWeek: topPosts,
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get community stats",
      });
    }
  });
};

export default communityRoutes;