import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { EnhancedPostService } from "../services/enhanced-post-service";
import multipart from "@fastify/multipart";

// Enhanced validation schemas for comprehensive post creation
const enhancedPostSchemas = {
  create: z.object({
    title: z.string().min(3).max(300),
    content: z.string().max(40000).optional(),
    communityId: z.string().cuid(),
    type: z.enum(['text', 'link', 'image', 'video', 'poll']).default('text'),
    url: z.string().url().optional(),
    nsfw: z.boolean().default(false),
    spoiler: z.boolean().default(false),
    tags: z.array(z.string().max(50)).max(10).optional(),
    visibility: z.enum(['public', 'community', 'private']).default('public'),
    allowComments: z.boolean().default(true),
    sendNotifications: z.boolean().default(true),
    scheduledFor: z.string().datetime().optional(),
    pollOptions: z.array(z.string().max(200)).min(2).max(6).optional(),
    pollDuration: z.number().min(1).max(30).optional(),
    flairId: z.string().optional(),
    isDraft: z.boolean().default(false)
  }),
  
  update: z.object({
    title: z.string().min(3).max(300).optional(),
    content: z.string().max(40000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    nsfw: z.boolean().optional(),
    spoiler: z.boolean().optional(),
    allowComments: z.boolean().optional(),
    flairId: z.string().optional()
  }),
  
  vote: z.object({
    value: z.number().int().min(-1).max(1)
  }),
  
  save: z.object({
    saved: z.boolean()
  }),
  
  report: z.object({
    reason: z.enum([
      'spam', 'harassment', 'violence', 'hate', 'personal_info', 
      'copyright', 'self_harm', 'misinformation', 'other'
    ]),
    description: z.string().max(500).optional()
  }),
  
  moderate: z.object({
    action: z.enum(['pin', 'unpin', 'lock', 'unlock', 'remove', 'approve']),
    reason: z.string().max(500).optional()
  })
};

const enhancedPostRoutes: FastifyPluginAsync = async (fastify) => {
  const postService = new EnhancedPostService();

  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB
      files: 20
    }
  });

  /**
   * Get posts feed with advanced filtering and sorting
   */
  fastify.get("/", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);
    
    try {
      const querySchema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25),
        sort: z.enum(["hot", "new", "top", "controversial", "rising"]).default("hot"),
        timeFrame: z.enum(["hour", "day", "week", "month", "year", "all"]).default("all"),
        community: z.string().optional(),
        type: z.enum(["text", "link", "image", "video", "poll"]).optional(),
        tags: z.string().optional(), // Comma-separated tags
        nsfw: z.enum(["true", "false", "include"]).default("false"),
        visibility: z.enum(["public", "community", "all"]).default("public")
      });

      const params = querySchema.parse(request.query);
      const userId = (request as any).userId;

      // Build dynamic where clause
      const whereClause: any = {
        isRemoved: false,
        isDraft: false
      };

      // Community filter
      if (params.community) {
        whereClause.community = { name: params.community };
      }

      // Type filter
      if (params.type) {
        whereClause.type = params.type;
      }

      // NSFW filter
      if (params.nsfw === "false") {
        whereClause.nsfw = false;
      } else if (params.nsfw === "true") {
        whereClause.nsfw = true;
      }
      // "include" shows both

      // Visibility filter
      if (params.visibility === "public") {
        whereClause.visibility = "public";
      } else if (params.visibility === "community") {
        whereClause.visibility = { in: ["public", "community"] };
      }
      // "all" shows everything the user has access to

      // Time frame filter
      if (params.timeFrame !== "all") {
        const now = new Date();
        let timeFilter: Date;
        switch (params.timeFrame) {
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

      // Tag filter (requires custom query)
      // TODO: Implement tag filtering when tag system is in place

      // Build order by clause
      let orderBy: any;
      switch (params.sort) {
        case "hot":
          // Hot algorithm: score * age factor
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
          // Posts with high engagement but mixed reactions
          orderBy = [
            { commentCount: "desc" },
            { viewCount: "desc" },
            { score: "asc" } // Lower scores indicate controversy
          ];
          break;
        case "rising":
          // Posts gaining traction recently
          orderBy = [
            { viewCount: "desc" },
            { createdAt: "desc" }
          ];
          break;
        default:
          orderBy = { createdAt: "desc" };
      }

      // Execute queries
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
                isVerified: true
              }
            },
            community: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true,
                isNsfw: true
              }
            },
            _count: {
              select: { 
                comments: true, 
                votes: true, 
                awards: true,
                savedPosts: true
              }
            }
          },
          skip: (params.page - 1) * params.limit,
          take: params.limit,
          orderBy
        }),
        prisma.post.count({ where: whereClause })
      ]);

      // Get user votes if authenticated
      let userVotes: Record<string, number> = {};
      if (userId && posts.length > 0) {
        const votes = await prisma.vote.findMany({
          where: {
            userId: userId,
            postId: { in: posts.map(p => p.id) }
          }
        });
        userVotes = votes.reduce((acc, vote) => {
          acc[vote.postId!] = vote.value;
          return acc;
        }, {} as Record<string, number>);
      }

      // Get user saves if authenticated
      let userSaves: Set<string> = new Set();
      if (userId && posts.length > 0) {
        const saves = await prisma.savedPost.findMany({
          where: {
            userId: userId,
            postId: { in: posts.map(p => p.id) }
          }
        });
        userSaves = new Set(saves.map(save => save.postId));
      }

      // Enrich posts with user interaction data
      const enrichedPosts = posts.map(post => ({
        ...post,
        userVote: userVotes[post.id] || 0,
        isSaved: userSaves.has(post.id),
        // Calculate engagement score
        engagementScore: post.score + post._count.comments * 2 + post._count.awards * 5
      }));

      // Update view counts asynchronously (fire and forget)
      if (userId && posts.length > 0) {
        prisma.post.updateMany({
          where: {
            id: { in: posts.map(p => p.id) }
          },
          data: {
            viewCount: { increment: 1 }
          }
        }).catch(error => fastify.log.error('Failed to update view counts:', error));
      }

      return reply.send({
        success: true,
        data: {
          items: enrichedPosts,
          total,
          page: params.page,
          pageSize: params.limit,
          hasMore: params.page * params.limit < total,
          filters: {
            sort: params.sort,
            timeFrame: params.timeFrame,
            community: params.community,
            type: params.type,
            nsfw: params.nsfw,
            visibility: params.visibility
          }
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get posts"
      });
    }
  });

  /**
   * Create new post with media upload support
   */
  fastify.post("/", { 
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const userId = request.userId;
      let postData: any = {};
      let files: any[] = [];

      // Handle multipart form data
      if (request.isMultipart()) {
        const parts = request.parts();
        
        for await (const part of parts) {
          if (part.type === 'file') {
            // Convert file to buffer
            const buffer = await part.toBuffer();
            files.push({
              buffer: buffer,
              originalname: part.filename,
              mimetype: part.mimetype,
              size: buffer.length
            });
          } else {
            // Handle form fields
            if (part.fieldname === 'data') {
              postData = JSON.parse(part.value as string);
            } else {
              postData[part.fieldname] = part.value;
            }
          }
        }
      } else {
        // Handle JSON data
        postData = request.body;
      }

      // Validate post data
      const validatedData = enhancedPostSchemas.create.parse(postData);

      // Add files to post data
      if (files.length > 0) {
        validatedData.attachments = files;
      }

      // Validate post type requirements
      if (validatedData.type === 'link' && !validatedData.url) {
        throw new Error('URL is required for link posts');
      }

      if (validatedData.type === 'poll') {
        if (!validatedData.pollOptions || validatedData.pollOptions.length < 2) {
          throw new Error('At least 2 poll options are required');
        }
      }

      if (['image', 'video'].includes(validatedData.type) && (!files || files.length === 0)) {
        throw new Error(`At least one ${validatedData.type} file is required`);
      }

      // Create post using enhanced service
      const post = await postService.createPost(userId, validatedData);

      return reply.code(201).send({
        success: true,
        data: post,
        message: validatedData.isDraft ? 'Draft saved successfully' : 'Post created successfully'
      });

    } catch (error) {
      fastify.log.error('Error creating post:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid post data',
          details: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post'
      });
    }
  });

  /**
   * Get single post with full details
   */
  fastify.get("/:id", async (request, reply) => {
    await optionalAuthMiddleware(request, reply);
    
    try {
      const { id } = z.object({
        id: z.string().cuid()
      }).parse(request.params);

      const userId = (request as any).userId;
      const post = await postService.getPostWithDetails(id, userId);

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found"
        });
      }

      // Check visibility permissions
      if (post.visibility === 'private' && post.userId !== userId) {
        return reply.code(403).send({
          success: false,
          error: "Post not accessible"
        });
      }

      if (post.visibility === 'community' && userId) {
        // Check if user is community member
        const membership = await prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId: post.communityId,
              userId: userId
            }
          }
        });

        if (!membership) {
          return reply.code(403).send({
            success: false,
            error: "Must be a community member to view this post"
          });
        }
      }

      // Increment view count
      prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      }).catch(error => fastify.log.error('Failed to increment view count:', error));

      return reply.send({
        success: true,
        data: post
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get post"
      });
    }
  });

  /**
   * Update post
   */
  fastify.patch("/:id", { 
    preHandler: [authMiddleware] 
  }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string().cuid()
      }).parse(request.params);

      const updateData = enhancedPostSchemas.update.parse(request.body);
      const userId = request.userId;

      const updatedPost = await postService.updatePost(id, userId, updateData);

      return reply.send({
        success: true,
        data: updatedPost,
        message: "Post updated successfully"
      });

    } catch (error) {
      fastify.log.error(error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid update data',
          details: error.errors
        });
      }

      return reply.code(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post'
      });
    }
  });

  /**
   * Delete post
   */
  fastify.delete("/:id", { 
    preHandler: [authMiddleware] 
  }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string().cuid()
      }).parse(request.params);

      const userId = request.userId;
      await postService.deletePost(id, userId);

      return reply.send({
        success: true,
        message: "Post deleted successfully"
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post'
      });
    }
  });

  /**
   * Vote on post with optimistic updates
   */
  fastify.post("/:id/vote", { 
    preHandler: [authMiddleware]
  }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string().cuid()
      }).parse(request.params);

      const { value } = enhancedPostSchemas.vote.parse(request.body);
      const userId = request.userId;

      // Use transaction for consistency
      const result = await prisma.$transaction(async (tx) => {
        // Check if post exists
        const post = await tx.post.findUnique({
          where: { id },
          select: { id: true, userId: true, score: true }
        });

        if (!post) {
          throw new Error('Post not found');
        }

        // Get existing vote
        const existingVote = await tx.vote.findUnique({
          where: {
            userId_postId: {
              userId: userId,
              postId: id
            }
          }
        });

        let scoreDelta = 0;

        if (existingVote) {
          if (existingVote.value === value) {
            // No change needed
            return {
              score: post.score,
              userVote: value,
              changed: false
            };
          }

          // Update existing vote
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { value }
          });

          scoreDelta = value - existingVote.value;
        } else {
          // Create new vote
          await tx.vote.create({
            data: {
              userId: userId,
              postId: id,
              value: value
            }
          });

          scoreDelta = value;
        }

        // Update post score
        const updatedPost = await tx.post.update({
          where: { id },
          data: {
            score: { increment: scoreDelta }
          },
          select: { score: true }
        });

        return {
          score: updatedPost.score,
          userVote: value,
          changed: true,
          scoreDelta
        };
      });

      // Update community karma asynchronously
      if (result.changed) {
        updateCommunityKarma(id, userId).catch(error => 
          fastify.log.error('Failed to update karma:', error)
        );
      }

      return reply.send({
        success: true,
        data: result
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vote on post'
      });
    }
  });

  /**
   * Save/unsave post
   */
  fastify.post("/:id/save", { 
    preHandler: [authMiddleware] 
  }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string().cuid()
      }).parse(request.params);

      const { saved } = enhancedPostSchemas.save.parse(request.body);
      const userId = request.userId;

      if (saved) {
        await prisma.savedPost.upsert({
          where: {
            userId_postId: {
              userId: userId,
              postId: id
            }
          },
          create: {
            userId: userId,
            postId: id
          },
          update: {}
        });
      } else {
        await prisma.savedPost.deleteMany({
          where: {
            userId: userId,
            postId: id
          }
        });
      }

      return reply.send({
        success: true,
        data: { saved }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to save/unsave post"
      });
    }
  });

  /**
   * Report post
   */
  fastify.post("/:id/report", { 
    preHandler: [authMiddleware] 
  }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string().cuid()
      }).parse(request.params);

      const { reason, description } = enhancedPostSchemas.report.parse(request.body);
      const userId = request.userId;

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found"
        });
      }

      // Create report
      await prisma.report.create({
        data: {
          reporterId: userId,
          postId: id,
          reason: reason,
          details: description
        }
      });

      return reply.send({
        success: true,
        message: "Post reported successfully"
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to report post"
      });
    }
  });

  /**
   * Moderate post (pin, lock, remove, etc.)
   */
  fastify.post("/:id/moderate", { 
    preHandler: [authMiddleware] 
  }, async (request: any, reply) => {
    try {
      const { id } = z.object({
        id: z.string().cuid()
      }).parse(request.params);

      const { action, reason } = enhancedPostSchemas.moderate.parse(request.body);
      const userId = request.userId;

      // Check if user has moderation permissions
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          community: {
            include: {
              moderators: {
                where: { userId: userId }
              }
            }
          }
        }
      });

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: "Post not found"
        });
      }

      const isModerator = post.community.moderators.length > 0;
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Insufficient permissions"
        });
      }

      // Apply moderation action
      let updateData: any = {};
      let message = '';

      switch (action) {
        case 'pin':
          updateData.isPinned = true;
          message = 'Post pinned successfully';
          break;
        case 'unpin':
          updateData.isPinned = false;
          message = 'Post unpinned successfully';
          break;
        case 'lock':
          updateData.isLocked = true;
          message = 'Post locked successfully';
          break;
        case 'unlock':
          updateData.isLocked = false;
          message = 'Post unlocked successfully';
          break;
        case 'remove':
          updateData.isRemoved = true;
          message = 'Post removed successfully';
          break;
        case 'approve':
          updateData.isRemoved = false;
          message = 'Post approved successfully';
          break;
      }

      const updatedPost = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          community: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true,
              awards: true
            }
          }
        }
      });

      return reply.send({
        success: true,
        data: updatedPost,
        message: message
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to moderate post"
      });
    }
  });

  /**
   * Get user's drafts
   */
  fastify.get("/drafts", { 
    preHandler: [authMiddleware] 
  }, async (request: any, reply) => {
    try {
      const { page = 1, limit = 25 } = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(25)
      }).parse(request.query);

      const userId = request.userId;

      const [drafts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            userId: userId,
            isDraft: true
          },
          include: {
            community: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.post.count({
          where: {
            userId: userId,
            isDraft: true
          }
        })
      ]);

      return reply.send({
        success: true,
        data: {
          items: drafts,
          total,
          page,
          pageSize: limit,
          hasMore: page * limit < total
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get drafts"
      });
    }
  });

  // Helper function to update community karma
  async function updateCommunityKarma(postId: string, voterUserId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, communityId: true }
    });

    if (!post) return;

    // Calculate total karma for the post author in this community
    const userPosts = await prisma.post.findMany({
      where: {
        userId: post.userId,
        communityId: post.communityId,
        isDraft: false,
        isRemoved: false
      },
      select: { score: true }
    });

    const totalKarma = userPosts.reduce((sum, p) => sum + p.score, 0);

    // Update community member karma
    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: post.communityId,
          userId: post.userId
        }
      },
      update: { karma: totalKarma },
      create: {
        communityId: post.communityId,
        userId: post.userId,
        karma: totalKarma
      }
    });
  }
};

export default enhancedPostRoutes;