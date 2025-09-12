import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { validate, validationSchemas } from "../middleware/validation";

const postRoutes: FastifyPluginAsync = async (fastify) => {
  // Get posts with optional auth
  fastify.get("/", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);
    
    try {
      const { page = 1, limit = 25, sort = "hot", timeFrame = "all", community } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
        sort: z.enum(["hot", "new", "top", "controversial"]).default("hot"),
        timeFrame: z.enum(["hour", "day", "week", "month", "year", "all"]).default("all"),
        community: z.string().optional(),
      }).parse(request.query);

      let orderBy: any;
      switch (sort) {
        case "hot":
          // Hot algorithm: combine score with recency
          orderBy = [
            { score: "desc" },
            { createdAt: "desc" }
          ];
          break;
        case "new":
          orderBy = { createdAt: "desc" };
          break;
        case "top":
          orderBy = { score: "desc" };
          break;
        case "controversial":
          // Posts with high engagement but mixed voting
          orderBy = [
            { commentCount: "desc" },
            { viewCount: "desc" }
          ];
          break;
        default:
          orderBy = { createdAt: "desc" };
      }
      
      // Build where clause with filters
      const whereClause: any = {
        isRemoved: false,
      };
      
      if (community) {
        whereClause.community = { name: community };
      }
      
      // Add time frame filter
      if (timeFrame !== "all") {
        const now = new Date();
        let timeFilter: Date;
        switch (timeFrame) {
          case "hour":
            timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case "day":
            timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "week":
            timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            timeFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            timeFilter = new Date(0);
        }
        whereClause.createdAt = { gte: timeFilter };
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            community: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true,
              },
            },
            _count: {
              select: { comments: true, votes: true, awards: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
        }),
        prisma.post.count({ where: whereClause }),
      ]);
      
      // Increment view count for viewed posts if user is authenticated
      if ((request as any).userId && posts.length > 0) {
        // Update view counts asynchronously
        prisma.post.updateMany({
          where: {
            id: { in: posts.map(p => p.id) },
          },
          data: {
            viewCount: { increment: 1 },
          },
        }).catch(error => fastify.log.error('Failed to update view counts:', error));
      }

      return reply.send({
        success: true,
        data: {
          items: posts,
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
        error: "Failed to get posts",
      });
    }
  });

  // Get single post
  fastify.get("/:id", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);
    
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
          _count: {
            select: { comments: true, votes: true },
          },
        },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      return reply.send({
        success: true,
        data: post,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get post",
      });
    }
  });

  // Create post route (requires auth)
  fastify.post("/", { 
    preHandler: [
      authMiddleware,
      validate({
        body: validationSchemas.post.create.body
      })
    ] 
  }, async (request: any, reply) => {
    try {
      const body = request.body as any;

      // Check if user is member of community
      const member = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: body.communityId,
            userId: request.userId,
          },
        },
      });

      if (!member) {
        return reply.code(403).send({
          success: false,
          error: "Must be a member to post",
        });
      }

      const post = await prisma.post.create({
        data: {
          communityId: body.communityId,
          title: body.title,
          content: body.content,
          url: body.url,
          thumbnail: body.thumbnail,
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
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: post,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create post",
      });
    }
  });

  // Vote on post (requires auth)
  fastify.post("/:id/vote", { 
    preHandler: [
      authMiddleware,
      validate({
        params: z.object({ id: z.string().cuid() }),
        body: validationSchemas.vote.create.body
      })
    ] 
  }, async (request: any, reply) => {
    try {
      const { id } = request.params as any;
      const body = request.body as any;

      const existingVote = await prisma.vote.findUnique({
        where: {
          userId_postId: {
            userId: request.userId,
            postId: id,
          },
        },
      });

      if (existingVote) {
        if (existingVote.value === body.value) {
          return reply.send({
            success: true,
            message: "Vote unchanged",
          });
        }

        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value: body.value },
        });
      } else {
        await prisma.vote.create({
          data: {
            userId: request.userId,
            postId: id,
            value: body.value,
          },
        });
      }

      // Update post score with enhanced calculation
      const votes = await prisma.vote.findMany({
        where: { postId: id },
      });

      const upvotes = votes.filter(v => v.value === 1).length;
      const downvotes = votes.filter(v => v.value === -1).length;
      const score = upvotes - downvotes;
      
      await prisma.post.update({
        where: { id },
        data: { score },
      });

      // Update user's karma in community
      const post = await prisma.post.findUnique({
        where: { id },
        select: { userId: true, communityId: true },
      });

      if (post) {
        // Calculate post karma for the user in this community
        const userPosts = await prisma.post.findMany({
          where: {
            userId: post.userId,
            communityId: post.communityId,
          },
        });

        const totalPostKarma = userPosts.reduce((sum, p) => sum + p.score, 0);

        // Update or create community member karma
        await prisma.communityMember.upsert({
          where: {
            communityId_userId: {
              communityId: post.communityId,
              userId: post.userId,
            },
          },
          update: {
            karma: totalPostKarma,
          },
          create: {
            communityId: post.communityId,
            userId: post.userId,
            karma: totalPostKarma,
          },
        });
      }

      return reply.send({
        success: true,
        data: { 
          score,
          upvotes: votes.filter(v => v.value === 1).length,
          downvotes: votes.filter(v => v.value === -1).length,
          userVote: existingVote ? existingVote.value : body.value,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to vote on post",
      });
    }
  });

  // Update post (requires auth and ownership)
  fastify.patch("/:id", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        title: z.string().min(1).max(300).optional(),
        content: z.string().min(1).max(40000).optional(),
        flair: z.string().max(50).optional(),
        nsfw: z.boolean().optional(),
      }).parse(request.body);

      // Check if post exists and user owns it
      const existingPost = await prisma.post.findUnique({
        where: { id },
      });

      if (!existingPost) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      if (existingPost.userId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Can only edit your own posts",
        });
      }

      const updatedPost = await prisma.post.update({
        where: { id },
        data: {
          ...body,
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
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
          _count: {
            select: { comments: true, votes: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: updatedPost,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update post",
      });
    }
  });

  // Delete post (requires auth and ownership)
  fastify.delete("/:id", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      // Check if post exists and user owns it
      const existingPost = await prisma.post.findUnique({
        where: { id },
      });

      if (!existingPost) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      if (existingPost.userId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Can only delete your own posts",
        });
      }

      await prisma.post.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete post",
      });
    }
  });

  // Save/unsave post (requires auth)
  fastify.post("/:id/save", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        saved: z.boolean(),
      }).parse(request.body);

      const existingSave = await prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            userId: request.userId,
            postId: id,
          },
        },
      });

      if (body.saved) {
        if (!existingSave) {
          await prisma.savedPost.create({
            data: {
              userId: request.userId,
              postId: id,
            },
          });
        }
      } else {
        if (existingSave) {
          await prisma.savedPost.delete({
            where: { id: existingSave.id },
          });
        }
      }

      return reply.send({
        success: true,
        data: { saved: body.saved },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to save/unsave post",
      });
    }
  });

  // Get user's saved posts (requires auth)
  fastify.get("/saved", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 25 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
      }).parse(request.query);

      const [savedPosts, total] = await Promise.all([
        prisma.savedPost.findMany({
          where: { userId: request.userId },
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
                community: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                    icon: true,
                  },
                },
                _count: {
                  select: { comments: true, votes: true },
                },
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.savedPost.count({ where: { userId: request.userId } }),
      ]);

      return reply.send({
        success: true,
        data: {
          items: savedPosts.map(sp => sp.post),
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
        error: "Failed to get saved posts",
      });
    }
  });

  // Report post (requires auth)
  fastify.post("/:id/report", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        reason: z.enum(["spam", "harassment", "hate_speech", "misinformation", "violence", "nsfw", "other"]),
        details: z.string().max(500).optional(),
      }).parse(request.body);

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      // Create report
      await prisma.report.create({
        data: {
          reporterId: request.userId,
          postId: id,
          reason: body.reason,
          details: body.details,
        },
      });

      return reply.send({
        success: true,
        message: "Post reported successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to report post",
      });
    }
  });

  // Pin/unpin post (requires moderation permissions)
  fastify.post("/:id/pin", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        pinned: z.boolean(),
      }).parse(request.body);

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          community: {
            include: {
              moderators: {
                where: { userId: request.userId },
              },
            },
          },
        },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      // Check if user is moderator or community owner
      const isModerator = post.community.moderators.length > 0;
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to pin/unpin posts",
        });
      }

      const updatedPost = await prisma.post.update({
        where: { id },
        data: { isPinned: body.pinned },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
          _count: {
            select: { comments: true, votes: true, awards: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: updatedPost,
        message: body.pinned ? "Post pinned successfully" : "Post unpinned successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to pin/unpin post",
      });
    }
  });

  // Lock/unlock post (requires moderation permissions)
  fastify.post("/:id/lock", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        locked: z.boolean(),
      }).parse(request.body);

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          community: {
            include: {
              moderators: {
                where: { userId: request.userId },
              },
            },
          },
        },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      // Check if user is moderator
      const isModerator = post.community.moderators.length > 0;
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to lock/unlock posts",
        });
      }

      const updatedPost = await prisma.post.update({
        where: { id },
        data: { isLocked: body.locked },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
          _count: {
            select: { comments: true, votes: true, awards: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: updatedPost,
        message: body.locked ? "Post locked successfully" : "Post unlocked successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to lock/unlock post",
      });
    }
  });

  // Remove post (moderation)
  fastify.post("/:id/remove", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        reason: z.string().max(500).optional(),
      }).parse(request.body);

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          community: {
            include: {
              moderators: {
                where: { userId: request.userId },
              },
            },
          },
        },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      // Check if user is moderator
      const isModerator = post.community.moderators.length > 0;
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions to remove posts",
        });
      }

      await prisma.post.update({
        where: { id },
        data: { isRemoved: true },
      });

      return reply.send({
        success: true,
        message: "Post removed successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to remove post",
      });
    }
  });

  // Get post with user vote status (requires optional auth)
  fastify.get("/:id/vote-status", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);
    
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          _count: {
            select: { 
              votes: {
                where: { value: 1 }
              }
            },
          },
        },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      let userVote = null;
      if ((request as any).userId) {
        const vote = await prisma.vote.findUnique({
          where: {
            userId_postId: {
              userId: (request as any).userId,
              postId: id,
            },
          },
        });
        userVote = vote ? vote.value : 0;
      }

      // Get vote counts
      const allVotes = await prisma.vote.findMany({
        where: { postId: id },
      });
      
      const upvotes = allVotes.filter(v => v.value === 1).length;
      const downvotes = allVotes.filter(v => v.value === -1).length;

      return reply.send({
        success: true,
        data: {
          postId: id,
          score: post.score,
          upvotes,
          downvotes,
          userVote,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get vote status",
      });
    }
  });

  // Crosspost (share to another community)
  fastify.post("/:id/crosspost", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        targetCommunityId: z.string(),
        title: z.string().min(1).max(300).optional(),
      }).parse(request.body);

      // Get original post
      const originalPost = await prisma.post.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
            },
          },
          community: {
            select: {
              name: true,
              displayName: true,
            },
          },
        },
      });

      if (!originalPost) {
        return reply.code(404).send({
          success: false,
          error: "Original post not found",
        });
      }

      // Check if user is member of target community
      const targetMember = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: body.targetCommunityId,
            userId: request.userId,
          },
        },
      });

      if (!targetMember) {
        return reply.code(403).send({
          success: false,
          error: "Must be a member of the target community to crosspost",
        });
      }

      // Create crosspost
      const crosspostTitle = body.title || `${originalPost.title} (crosspost from r/${originalPost.community.name})`;
      const crosspostContent = `Originally posted by u/${originalPost.user.username} in r/${originalPost.community.name}\n\n${originalPost.content}`;

      const crosspost = await prisma.post.create({
        data: {
          communityId: body.targetCommunityId,
          title: crosspostTitle,
          content: crosspostContent,
          url: originalPost.url,
          thumbnail: originalPost.thumbnail,
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
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: crosspost,
        message: "Post crossposted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to crosspost",
      });
    }
  });
};

export default postRoutes;