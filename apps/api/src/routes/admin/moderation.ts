import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma, executeWithDatabaseRetry } from '@cryb/database';
import { contentModerationMiddleware, AdminPermission } from '../../middleware/admin';
import { authMiddleware } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

interface ModerationListQuery {
  page?: number;
  limit?: number;
  type?: 'all' | 'posts' | 'comments' | 'reports' | 'messages';
  status?: 'all' | 'pending' | 'resolved' | 'dismissed';
  sort?: 'newest' | 'oldest' | 'priority';
}

interface ReportActionBody {
  action: 'resolve' | 'dismiss';
  reason?: string;
  deleteContent?: boolean;
  banUser?: boolean;
  banDuration?: number; // in days
}

interface ContentActionBody {
  action: 'delete' | 'restore' | 'flag';
  reason?: string;
  notifyUser?: boolean;
}

export default async function adminModerationRoutes(fastify: FastifyInstance) {
  // Apply authentication and admin middleware to all routes
  fastify.addHook('onRequest', authMiddleware);

  /**
   * GET /api/v1/admin/moderation/reports
   * List all reports with filtering
   */
  fastify.get<{ Querystring: ModerationListQuery }>('/reports', {
    preHandler: contentModerationMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'List reports with filtering options',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          status: { 
            type: 'string', 
            enum: ['all', 'pending', 'resolved', 'dismissed'],
            default: 'all'
          },
          sort: {
            type: 'string',
            enum: ['newest', 'oldest', 'priority'],
            default: 'newest'
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: ModerationListQuery }>, reply: FastifyReply) => {
    const { page = 1, limit = 20, status = 'all', sort = 'newest' } = request.query;
    const offset = (page - 1) * limit;

    try {
      // Build where clause
      const where: any = {};
      
      if (status !== 'all') {
        where.status = status.toUpperCase();
      }

      // Build order by clause
      let orderBy: any = {};
      switch (sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'priority':
          // Priority order: PENDING > REVIEWING > others, then by creation date
          orderBy = [
            { status: 'asc' },
            { createdAt: 'desc' }
          ];
          break;
      }

      const [reports, totalCount] = await Promise.all([
        executeWithDatabaseRetry(async () => {
          return await prisma.report.findMany({
            where,
            orderBy,
            skip: offset,
            take: limit,
            include: {
              reporter: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              },
              post: {
                select: {
                  id: true,
                  title: true,
                  content: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true
                    }
                  },
                  community: {
                    select: {
                      id: true,
                      name: true,
                      displayName: true
                    }
                  }
                }
              },
              comment: {
                select: {
                  id: true,
                  content: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true
                    }
                  },
                  post: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            }
          });
        }),
        executeWithDatabaseRetry(async () => {
          return await prisma.report.count({ where });
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      reply.send({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: totalPages
          }
        }
      });

    } catch (error) {
      request.log.error({ error, query: request.query }, 'Failed to fetch reports');
      throw new AppError('Failed to fetch reports', 500, 'FETCH_REPORTS_FAILED');
    }
  });

  /**
   * POST /api/v1/admin/moderation/reports/:reportId/action
   * Take action on a report
   */
  fastify.post<{ Params: { reportId: string }; Body: ReportActionBody }>('/reports/:reportId/action', {
    preHandler: contentModerationMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Take action on a report',
      params: {
        type: 'object',
        properties: {
          reportId: { type: 'string' }
        },
        required: ['reportId']
      },
      body: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['resolve', 'dismiss'] },
          reason: { type: 'string', maxLength: 500 },
          deleteContent: { type: 'boolean', default: false },
          banUser: { type: 'boolean', default: false },
          banDuration: { type: 'integer', minimum: 1, maximum: 3650 }
        },
        required: ['action']
      }
    }
  }, async (request: FastifyRequest<{ Params: { reportId: string }; Body: ReportActionBody }>, reply: FastifyReply) => {
    const { reportId } = request.params;
    const { action, reason, deleteContent = false, banUser = false, banDuration } = request.body;

    try {
      // Get the report with content details
      const report = await executeWithDatabaseRetry(async () => {
        return await prisma.report.findUnique({
          where: { id: reportId },
          include: {
            post: {
              include: {
                user: {
                  select: { id: true, username: true }
                }
              }
            },
            comment: {
              include: {
                user: {
                  select: { id: true, username: true }
                }
              }
            }
          }
        });
      });

      if (!report) {
        throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
      }

      if (report.status !== 'PENDING') {
        throw new AppError('Report has already been processed', 400, 'REPORT_ALREADY_PROCESSED');
      }

      // Start transaction for atomic operations
      const result = await executeWithDatabaseRetry(async () => {
        return await prisma.$transaction(async (tx) => {
          // Update report status
          const updatedReport = await tx.report.update({
            where: { id: reportId },
            data: {
              status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED',
              reviewedAt: new Date(),
              reviewedBy: request.adminUser?.id
            }
          });

          const actions: string[] = [];

          // Delete content if requested
          if (deleteContent && action === 'resolve') {
            if (report.postId) {
              await tx.post.update({
                where: { id: report.postId },
                data: { isRemoved: true }
              });
              actions.push('Content deleted');
            } else if (report.commentId) {
              await tx.comment.delete({
                where: { id: report.commentId }
              });
              actions.push('Comment deleted');
            }
          }

          // Ban user if requested
          let bannedUser = null;
          if (banUser && action === 'resolve') {
            const userId = report.post?.userId || report.comment?.userId;
            if (userId) {
              const banExpiresAt = banDuration 
                ? new Date(Date.now() + (banDuration * 24 * 60 * 60 * 1000))
                : new Date();

              bannedUser = await tx.user.update({
                where: { id: userId },
                data: { bannedAt: banExpiresAt }
              });
              actions.push(`User banned ${banDuration ? `for ${banDuration} days` : 'permanently'}`);
            }
          }

          return { updatedReport, actions, bannedUser };
        });
      });

      // Log the moderation action
      request.log.info({
        adminId: request.adminUser?.id,
        adminUsername: request.adminUser?.username,
        reportId,
        action,
        reason,
        actions: result.actions
      }, 'Report processed by admin');

      reply.send({
        success: true,
        data: {
          report: result.updatedReport,
          actions: result.actions
        },
        message: `Report ${action}d successfully`
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, reportId, action }, 'Failed to process report');
      throw new AppError('Failed to process report', 500, 'PROCESS_REPORT_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/moderation/posts
   * List flagged or reported posts
   */
  fastify.get<{ Querystring: ModerationListQuery }>('/posts', {
    preHandler: contentModerationMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'List posts needing moderation'
    }
  }, async (request: FastifyRequest<{ Querystring: ModerationListQuery }>, reply: FastifyReply) => {
    const { page = 1, limit = 20, sort = 'newest' } = request.query;
    const offset = (page - 1) * limit;

    try {
      // Get posts with reports or that are flagged
      const where = {
        OR: [
          { isRemoved: true },
          { reports: { some: { status: 'PENDING' } } },
          { score: { lt: -5 } } // Posts with very low score
        ]
      };

      let orderBy: any = {};
      switch (sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'priority':
          orderBy = { score: 'asc' }; // Lowest score first
          break;
      }

      const [posts, totalCount] = await Promise.all([
        executeWithDatabaseRetry(async () => {
          return await prisma.post.findMany({
            where,
            orderBy,
            skip: offset,
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  bannedAt: true
                }
              },
              community: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              },
              _count: {
                select: {
                  reports: true,
                  comments: true,
                  votes: true
                }
              },
              reports: {
                where: { status: 'PENDING' },
                select: {
                  id: true,
                  reason: true,
                  createdAt: true,
                  reporter: {
                    select: {
                      username: true
                    }
                  }
                }
              }
            }
          });
        }),
        executeWithDatabaseRetry(async () => {
          return await prisma.post.count({ where });
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      reply.send({
        success: true,
        data: {
          posts,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: totalPages
          }
        }
      });

    } catch (error) {
      request.log.error({ error, query: request.query }, 'Failed to fetch flagged posts');
      throw new AppError('Failed to fetch flagged posts', 500, 'FETCH_FLAGGED_POSTS_FAILED');
    }
  });

  /**
   * POST /api/v1/admin/moderation/posts/:postId/action
   * Take action on a post
   */
  fastify.post<{ Params: { postId: string }; Body: ContentActionBody }>('/posts/:postId/action', {
    preHandler: contentModerationMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Take moderation action on a post',
      params: {
        type: 'object',
        properties: {
          postId: { type: 'string' }
        },
        required: ['postId']
      },
      body: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['delete', 'restore', 'flag'] },
          reason: { type: 'string', maxLength: 500 },
          notifyUser: { type: 'boolean', default: true }
        },
        required: ['action']
      }
    }
  }, async (request: FastifyRequest<{ Params: { postId: string }; Body: ContentActionBody }>, reply: FastifyReply) => {
    const { postId } = request.params;
    const { action, reason, notifyUser = true } = request.body;

    try {
      const post = await executeWithDatabaseRetry(async () => {
        return await prisma.post.findUnique({
          where: { id: postId },
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        });
      });

      if (!post) {
        throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
      }

      let updateData: any = {};
      let actionMessage = '';

      switch (action) {
        case 'delete':
          updateData = { isRemoved: true };
          actionMessage = 'Post has been deleted';
          break;
        case 'restore':
          updateData = { isRemoved: false };
          actionMessage = 'Post has been restored';
          break;
        case 'flag':
          updateData = { nsfw: true };
          actionMessage = 'Post has been flagged as NSFW';
          break;
      }

      const updatedPost = await executeWithDatabaseRetry(async () => {
        return await prisma.post.update({
          where: { id: postId },
          data: updateData
        });
      });

      // TODO: Send notification to user if notifyUser is true
      // This would integrate with the notification system

      // Log the moderation action
      request.log.info({
        adminId: request.adminUser?.id,
        adminUsername: request.adminUser?.username,
        postId,
        action,
        reason,
        postUserId: post.user.id,
        postUsername: post.user.username
      }, 'Post moderation action taken');

      reply.send({
        success: true,
        data: { post: updatedPost },
        message: actionMessage
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, postId, action }, 'Failed to take post action');
      throw new AppError('Failed to take post action', 500, 'POST_ACTION_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/moderation/comments
   * List flagged comments
   */
  fastify.get<{ Querystring: ModerationListQuery }>('/comments', {
    preHandler: contentModerationMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'List comments needing moderation'
    }
  }, async (request: FastifyRequest<{ Querystring: ModerationListQuery }>, reply: FastifyReply) => {
    const { page = 1, limit = 20, sort = 'newest' } = request.query;
    const offset = (page - 1) * limit;

    try {
      // Get comments with reports or very low scores
      const where = {
        OR: [
          { reports: { some: { status: 'PENDING' } } },
          { score: { lt: -3 } } // Comments with very low score
        ]
      };

      let orderBy: any = {};
      switch (sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'priority':
          orderBy = { score: 'asc' };
          break;
      }

      const [comments, totalCount] = await Promise.all([
        executeWithDatabaseRetry(async () => {
          return await prisma.comment.findMany({
            where,
            orderBy,
            skip: offset,
            take: limit,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  bannedAt: true
                }
              },
              post: {
                select: {
                  id: true,
                  title: true,
                  community: {
                    select: {
                      name: true,
                      displayName: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  reports: true,
                  votes: true,
                  replies: true
                }
              },
              reports: {
                where: { status: 'PENDING' },
                select: {
                  id: true,
                  reason: true,
                  createdAt: true,
                  reporter: {
                    select: {
                      username: true
                    }
                  }
                }
              }
            }
          });
        }),
        executeWithDatabaseRetry(async () => {
          return await prisma.comment.count({ where });
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      reply.send({
        success: true,
        data: {
          comments,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: totalPages
          }
        }
      });

    } catch (error) {
      request.log.error({ error, query: request.query }, 'Failed to fetch flagged comments');
      throw new AppError('Failed to fetch flagged comments', 500, 'FETCH_FLAGGED_COMMENTS_FAILED');
    }
  });

  /**
   * DELETE /api/v1/admin/moderation/comments/:commentId
   * Delete a comment
   */
  fastify.delete<{ Params: { commentId: string } }>('/comments/:commentId', {
    preHandler: contentModerationMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Delete a comment',
      params: {
        type: 'object',
        properties: {
          commentId: { type: 'string' }
        },
        required: ['commentId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { commentId: string } }>, reply: FastifyReply) => {
    const { commentId } = request.params;

    try {
      const comment = await executeWithDatabaseRetry(async () => {
        return await prisma.comment.findUnique({
          where: { id: commentId },
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        });
      });

      if (!comment) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      await executeWithDatabaseRetry(async () => {
        return await prisma.comment.delete({
          where: { id: commentId }
        });
      });

      // Log the deletion
      request.log.info({
        adminId: request.adminUser?.id,
        adminUsername: request.adminUser?.username,
        commentId,
        commentUserId: comment.user.id,
        commentUsername: comment.user.username
      }, 'Comment deleted by admin');

      reply.send({
        success: true,
        message: 'Comment has been deleted'
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error, commentId }, 'Failed to delete comment');
      throw new AppError('Failed to delete comment', 500, 'DELETE_COMMENT_FAILED');
    }
  });

  /**
   * GET /api/v1/admin/moderation/stats
   * Get moderation statistics
   */
  fastify.get('/stats', {
    preHandler: contentModerationMiddleware,
    schema: {
      tags: ['admin'],
      security: [{ Bearer: [] }],
      description: 'Get moderation statistics'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await executeWithDatabaseRetry(async () => {
        const [
          pendingReports,
          totalReports,
          flaggedPosts,
          flaggedComments,
          bannedUsers,
          recentActions
        ] = await Promise.all([
          prisma.report.count({ where: { status: 'PENDING' } }),
          prisma.report.count(),
          prisma.post.count({ where: { isRemoved: true } }),
          prisma.comment.count({ 
            where: { 
              reports: { some: { status: 'PENDING' } } 
            } 
          }),
          prisma.user.count({ where: { bannedAt: { not: null } } }),
          prisma.report.count({
            where: {
              reviewedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          })
        ]);

        return {
          pendingReports,
          totalReports,
          flaggedPosts,
          flaggedComments,
          bannedUsers,
          recentActions // Last 24 hours
        };
      });

      reply.send({
        success: true,
        data: { stats }
      });

    } catch (error) {
      request.log.error({ error }, 'Failed to fetch moderation statistics');
      throw new AppError('Failed to fetch moderation statistics', 500, 'FETCH_MODERATION_STATS_FAILED');
    }
  });
}