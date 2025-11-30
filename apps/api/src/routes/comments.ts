import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";

const commentRoutes: FastifyPluginAsync = async (fastify) => {
  
  /**
   * @swagger
   * /comments:
   *   get:
   *     tags: [comments]
   *     summary: List comments
   *     description: Get all comments with optional filtering
   *     parameters:
   *       - name: postId
   *         in: query
   *         schema:
   *           type: string
   *         description: Filter comments by post ID
   *       - name: limit
   *         in: query
   *         schema:
   *           type: integer
   *           default: 50
   *         description: Number of comments to return
   */
  fastify.get('/', async (request, reply) => {
    try {
      const { postId, limit = 50 } = request.query as any;

      let whereClause: any = {};
      if (postId) {
        whereClause.postId = postId;
      }

      const comments = await prisma.comment.findMany({
        where: whereClause,
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          Post: {
            select: {
              id: true,
              title: true,
              Community: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          },
          _count: {
            select: { other_Comment: true, Vote: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });

      return reply.send({
        success: true,
        data: comments,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get comments",
      });
    }
  });

  // Helper function to build comment trees recursively
  async function buildCommentTree(commentId: string, currentDepth: number = 0, maxDepth: number = 5): Promise<any[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const replies = await prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: { other_Comment: true, Vote: true },
        },
      },
      orderBy: { score: "desc" },
      take: 20, // Limit replies per level
    });

    const nestedReplies = await Promise.all(
      replies.map(async (reply) => {
        const childReplies = await buildCommentTree(reply.id, currentDepth + 1, maxDepth);
        return {
          ...reply,
          depth: currentDepth + 1,
          replies: childReplies,
          hasMoreReplies: reply._count.replies > childReplies.length,
        };
      })
    );

    return nestedReplies;
  }

  // Get comments for a post (public endpoint with rate limiting recommendation)
  // RATE LIMITING: Consider implementing rate limiting on this endpoint to prevent abuse
  fastify.get("/post/:postId", async (request, reply) => {
    try {
      const { postId } = z.object({
        postId: z.string().max(100), // Add max length validation
      }).parse(request.params);

      const { sort = "top", depth = 5 } = z.object({
        sort: z.enum(["top", "new", "old", "controversial", "best"]).default("top"),
        depth: z.coerce.number().min(1).max(10).default(5),
      }).parse(request.query);

      let orderBy: any;
      switch (sort) {
        case "top":
          orderBy = { score: "desc" };
          break;
        case "new":
          orderBy = { createdAt: "desc" };
          break;
        case "old":
          orderBy = { createdAt: "asc" };
          break;
        case "controversial":
          // Comments with similar upvotes and downvotes (high engagement)
          orderBy = { score: "asc" }; // Temporary - would need more complex sorting
          break;
        case "best":
          // Reddit's "best" algorithm - for now use score desc
          orderBy = { score: "desc" };
          break;
        default:
          orderBy = { score: "desc" };
      }

      // Get top-level comments with enhanced structure
      const topLevelComments = await prisma.comment.findMany({
        where: { 
          postId,
          parentId: null // Only top-level comments
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: { other_Comment: true, Vote: true },
          },
        },
        orderBy,
        take: 100, // Limit top-level comments
      });

      // Build comment trees for each top-level comment
      const commentsWithReplies = await Promise.all(
        topLevelComments.map(async (comment) => {
          // Get nested replies based on depth limit
          const nestedReplies = depth > 1 ? await buildCommentTree(comment.id, 1, depth) : [];
          
          return {
            ...comment,
            depth: 0,
            replies: nestedReplies,
            hasMoreReplies: comment._count.replies > 0,
          };
        })
      );

      const comments = commentsWithReplies;

      return reply.send({
        success: true,
        data: comments,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get comments",
      });
    }
  });

  // Routes requiring authentication start below this comment

  // Create comment
  fastify.post("/", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const body = z.object({
        postId: z.string(),
        parentId: z.string().optional(),
        content: z.string().min(1).max(10000),
      }).parse(request.body);

      // Check if post exists and is not locked
      const post = await prisma.post.findUnique({
        where: { id: body.postId },
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      if (post.isLocked) {
        return reply.code(403).send({
          success: false,
          error: "Cannot comment on locked post",
        });
      }

      if (post.isRemoved) {
        return reply.code(404).send({
          success: false,
          error: "Post not found",
        });
      }

      // Check if parent comment exists (if replying)
      if (body.parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: body.parentId },
        });

        if (!parentComment || parentComment.postId !== body.postId) {
          return reply.code(404).send({
            success: false,
            error: "Parent comment not found",
          });
        }
      }

      const comment = await prisma.comment.create({
        data: {
          ...body,
          userId: request.userId,
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });

      // Update post comment count
      await prisma.post.update({
        where: { id: body.postId },
        data: {
          commentCount: {
            increment: 1,
          },
        },
      });

      return reply.send({
        success: true,
        data: comment,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create comment",
      });
    }
  });

  // Vote on comment
  fastify.post("/:id/vote", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        value: z.number().int().min(-1).max(1),
      }).parse(request.body);

      const existingVote = await prisma.vote.findUnique({
        where: {
          userId_commentId: {
            userId: request.userId,
            commentId: id,
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
            commentId: id,
            value: body.value,
          },
        });
      }

      // Update comment score with enhanced calculation
      const votes = await prisma.vote.findMany({
        where: { commentId: id },
      });

      const upvotes = votes.filter(v => v.value === 1).length;
      const downvotes = votes.filter(v => v.value === -1).length;
      const score = upvotes - downvotes;
      
      await prisma.comment.update({
        where: { id },
        data: { score },
      });

      // Update user's karma in community
      const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
          Post: {
            select: { communityId: true },
          },
        },
      });

      if (comment && comment.Post) {
        // Calculate comment karma for the user in this community
        const userComments = await prisma.comment.findMany({
          where: {
            userId: comment.userId,
            Post: {
              communityId: comment.Post.communityId,
            },
          },
        });

        const totalCommentKarma = userComments.reduce((sum, c) => sum + c.score, 0);

        // Get existing post karma
        const userPosts = await prisma.post.findMany({
          where: {
            userId: comment.userId,
            communityId: comment.Post.communityId,
          },
        });

        const totalPostKarma = userPosts.reduce((sum, p) => sum + p.score, 0);
        const combinedKarma = totalPostKarma + totalCommentKarma;

        // Update community member karma
        await prisma.communityMember.upsert({
          where: {
            communityId_userId: {
              communityId: comment.Post.communityId,
              userId: comment.userId,
            },
          },
          update: {
            karma: combinedKarma,
          },
          create: {
            communityId: comment.Post.communityId,
            userId: comment.userId,
            karma: combinedKarma,
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
        error: "Failed to vote on comment",
      });
    }
  });

  // Update comment
  fastify.patch("/:id", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        content: z.string().min(1).max(10000),
      }).parse(request.body);

      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      if (comment.userId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Can only edit your own comments",
        });
      }

      const updatedComment = await prisma.comment.update({
        where: { id },
        data: {
          content: body.content,
          editedAt: new Date(),
        },
        include: {
          User: {
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
        data: updatedComment,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update comment",
      });
    }
  });

  // Delete comment
  fastify.delete("/:id", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      if (comment.userId !== request.userId) {
        return reply.code(403).send({
          success: false,
          error: "Can only delete your own comments",
        });
      }

      await prisma.comment.delete({
        where: { id },
      });

      // Update post comment count
      await prisma.post.update({
        where: { id: comment.PostId },
        data: {
          commentCount: {
            decrement: 1,
          },
        },
      });

      return reply.send({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete comment",
      });
    }
  });

  // Get comment thread (all replies to a specific comment)
  // RATE LIMITING: Consider implementing rate limiting on this endpoint to prevent abuse
  fastify.get("/:id/thread", async (request, reply) => {
    try {
      const { id } = z.object({
        id: z.string().max(100), // Add max length validation
      }).parse(request.params);

      const { sort = "top", depth = 10 } = z.object({
        sort: z.enum(["top", "new", "old", "controversial", "best"]).default("top"),
        depth: z.coerce.number().min(1).max(20).default(10),
      }).parse(request.query);

      // Enhanced function to build comment tree recursively with better performance
      const buildCommentTree = async (commentId: string, currentDepth: number = 0): Promise<any> => {
        if (currentDepth >= depth) {
          // Return a placeholder indicating more comments exist
          const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
              id: true,
              _count: { select: { other_Comment: true } },
            },
          });
          return {
            id: commentId,
            isCollapsed: true,
            totalReplies: comment?._count?.replies || 0,
            message: `Continue this thread (${comment?._count?.replies || 0} more replies)`,
          };
        }

        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          include: {
            User: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            _count: {
              select: { other_Comment: true, Vote: true },
            },
          },
        });

        if (!comment) return null;

        // Get direct replies with sorting
        let replyOrderBy: any;
        switch (sort) {
          case "new":
            replyOrderBy = { createdAt: "desc" };
            break;
          case "old":
            replyOrderBy = { createdAt: "asc" };
            break;
          case "controversial":
            replyOrderBy = [{ score: "asc" }, { createdAt: "desc" }];
            break;
          default:
            replyOrderBy = { score: "desc" };
        }

        const replies = await prisma.comment.findMany({
          where: { parentId: commentId },
          include: {
            User: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            _count: {
              select: { other_Comment: true, Vote: true },
            },
          },
          orderBy: replyOrderBy,
          take: currentDepth === 0 ? 100 : 50, // Limit replies per level
        });

        // Recursively build tree for each reply
        const nestedReplies = await Promise.all(
          replies.map(async (reply) => {
            const childReplies = await buildCommentTree(reply.id, currentDepth + 1);
            return {
              ...reply,
              depth: currentDepth + 1,
              replies: Array.isArray(childReplies) ? childReplies : childReplies ? [childReplies] : [],
              hasMoreReplies: reply._count.replies > (Array.isArray(childReplies) ? childReplies.length : childReplies ? 1 : 0),
            };
          })
        );

        return {
          ...comment,
          depth: currentDepth,
          replies: nestedReplies,
          hasMoreReplies: comment._count.replies > nestedReplies.length,
        };
      };

      const commentThread = await buildCommentTree(id);

      if (!commentThread) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      return reply.send({
        success: true,
        data: commentThread,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get comment thread",
      });
    }
  });

  // Report comment (requires auth)
  fastify.post("/:id/report", { preHandler: [authMiddleware] }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const body = z.object({
        reason: z.enum(["spam", "harassment", "hate_speech", "misinformation", "violence", "nsfw", "other"]),
        details: z.string().max(500).optional(),
      }).parse(request.body);

      // Check if comment exists
      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      // Create report
      await prisma.report.create({
        data: {
          reporterId: request.userId,
          commentId: id,
          reason: body.reason,
          details: body.details,
        },
      });

      return reply.send({
        success: true,
        message: "Comment reported successfully",
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to report comment",
      });
    }
  });

  // Get comment by ID with context
  // RATE LIMITING: Consider implementing rate limiting on this endpoint to prevent abuse
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = z.object({
        id: z.string().max(100), // Add max length validation
      }).parse(request.params);

      const { context = 3 } = z.object({
        context: z.coerce.number().min(0).max(10).default(3),
      }).parse(request.query);

      const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          Post: {
            select: {
              id: true,
              title: true,
              Community: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          },
          Comment: context > 0 ? {
            include: {
              User: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
          } : false,
          _count: {
            select: { other_Comment: true },
          },
        },
      });

      if (!comment) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      // Build parent context chain if requested
      let parentChain = [];
      if (context > 0 && comment.parentId) {
        let currentParentId = comment.parentId;
        for (let i = 0; i < context && currentParentId; i++) {
          const parent = await prisma.comment.findUnique({
            where: { id: currentParentId },
            include: {
              User: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
          });
          if (parent) {
            parentChain.unshift(parent);
            currentParentId = parent.parentId;
          } else {
            break;
          }
        }
      }

      return reply.send({
        success: true,
        data: {
          comment,
          parentChain,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get comment",
      });
    }
  });

  // Get more comments (load more replies)
  fastify.get("/more/:commentId", async (request, reply) => {
    try {
      const { commentId } = z.object({
        commentId: z.string(),
      }).parse(request.params);

      const { sort = "top", limit = 50 } = z.object({
        sort: z.enum(["top", "new", "old", "controversial"]).default("top"),
        limit: z.coerce.number().min(1).max(100).default(50),
      }).parse(request.query);

      let orderBy: any;
      switch (sort) {
        case "top":
          orderBy = { score: "desc" };
          break;
        case "new":
          orderBy = { createdAt: "desc" };
          break;
        case "old":
          orderBy = { createdAt: "asc" };
          break;
        case "controversial":
          orderBy = [{ score: "asc" }, { createdAt: "desc" }];
          break;
        default:
          orderBy = { score: "desc" };
      }

      const replies = await prisma.comment.findMany({
        where: { parentId: commentId },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: { other_Comment: true, Vote: true },
          },
        },
        orderBy,
        take: limit,
      });

      return reply.send({
        success: true,
        data: replies,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to load more comments",
      });
    }
  });

  // Collapse/expand comment thread
  fastify.get("/thread/:commentId/toggle", async (request, reply) => {
    try {
      const { commentId } = z.object({
        commentId: z.string(),
      }).parse(request.params);

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: { other_Comment: true },
          },
        },
      });

      if (!comment) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      return reply.send({
        success: true,
        data: {
          ...comment,
          isCollapsed: true, // This would be managed client-side
          totalReplies: comment._count.replies,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to toggle comment",
      });
    }
  });

  // Get comment vote status with user's vote
  fastify.get("/:id/vote-status", { preHandler: [authMiddleware] }, async (request, reply) => {
    
    try {
      const { id } = z.object({
        id: z.string(),
      }).parse(request.params);

      const comment = await prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        return reply.code(404).send({
          success: false,
          error: "Comment not found",
        });
      }

      // Get user's vote
      const userVote = await prisma.vote.findUnique({
        where: {
          userId_commentId: {
            userId: (request as any).userId,
            commentId: id,
          },
        },
      });

      // Get vote counts
      const allVotes = await prisma.vote.findMany({
        where: { commentId: id },
      });
      
      const upvotes = allVotes.filter(v => v.value === 1).length;
      const downvotes = allVotes.filter(v => v.value === -1).length;

      return reply.send({
        success: true,
        data: {
          commentId: id,
          score: comment.score,
          upvotes,
          downvotes,
          userVote: userVote ? userVote.value : 0,
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
};

export default commentRoutes;