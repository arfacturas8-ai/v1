import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { comprehensiveModerationService } from '../services/comprehensive-moderation';
import { aiModerationService } from '../services/ai-moderation';
import { authMiddleware } from '../middleware/auth';

interface ReportRequest {
  Body: {
    reported_user_id: string;
    content_id: string;
    content_type: 'post' | 'comment' | 'message' | 'user_profile';
    category: string;
    subcategory?: string;
    description: string;
    evidence_urls?: string[];
    community_id?: string;
    server_id?: string;
  };
}

interface ModerationActionRequest {
  Body: {
    action_type: string;
    target_user_id: string;
    target_content_id?: string;
    target_content_type?: string;
    reason: string;
    internal_notes?: string;
    duration_minutes?: number;
    severity_level?: number;
    community_id?: string;
    server_id?: string;
  };
}

interface AppealRequest {
  Body: {
    action_id: string;
    appeal_reason: string;
    evidence_provided?: string;
    evidence_urls?: string[];
  };
}

interface ModerationQueueQuery {
  Querystring: {
    status?: string;
    priority?: string;
    content_type?: string;
    community_id?: string;
    server_id?: string;
    page?: string;
    limit?: string;
  };
}

interface AnalyticsQuery {
  Querystring: {
    time_range?: '24h' | '7d' | '30d' | '90d';
    community_id?: string;
    server_id?: string;
  };
}

export default async function comprehensiveModerationRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  /**
   * Submit a content report
   */
  fastify.post<ReportRequest>('/reports', {
    schema: {
      description: 'Submit a report for content or user behavior',
      tags: ['Moderation'],
      body: {
        type: 'object',
        required: ['reported_user_id', 'content_id', 'content_type', 'category', 'description'],
        properties: {
          reported_user_id: { type: 'string' },
          content_id: { type: 'string' },
          content_type: { type: 'string', enum: ['post', 'comment', 'message', 'user_profile'] },
          category: { type: 'string' },
          subcategory: { type: 'string' },
          description: { type: 'string', minLength: 10, maxLength: 1000 },
          evidence_urls: { type: 'array', items: { type: 'string' } },
          community_id: { type: 'string' },
          server_id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            report_id: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<ReportRequest>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const reportData = {
        reporter_id: userId,
        ...request.body,
      };

      const reportId = await comprehensiveModerationService.processReport(reportData);

      reply.send({
        success: true,
        report_id: reportId,
        message: 'Report submitted successfully',
      });
    } catch (error) {
      fastify.log.error('Error submitting report:', error);
      reply.status(500).send({ error: 'Failed to submit report' });
    }
  });

  /**
   * Apply moderation action (moderators only)
   */
  fastify.post<ModerationActionRequest>('/actions', {
    schema: {
      description: 'Apply a moderation action (moderators only)',
      tags: ['Moderation'],
      body: {
        type: 'object',
        required: ['action_type', 'target_user_id', 'reason'],
        properties: {
          action_type: { 
            type: 'string',
            enum: ['warn', 'mute', 'timeout', 'kick', 'ban', 'shadow_ban', 'content_remove', 'content_hide']
          },
          target_user_id: { type: 'string' },
          target_content_id: { type: 'string' },
          target_content_type: { type: 'string', enum: ['post', 'comment', 'message'] },
          reason: { type: 'string', minLength: 5, maxLength: 500 },
          internal_notes: { type: 'string', maxLength: 1000 },
          duration_minutes: { type: 'number', minimum: 1, maximum: 525600 }, // Max 1 year
          severity_level: { type: 'number', minimum: 1, maximum: 5 },
          community_id: { type: 'string' },
          server_id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            action_id: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<ModerationActionRequest>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      // Check if user has moderation permissions
      const hasPermission = await checkModerationPermission(userId, request.body.community_id, request.body.server_id);
      if (!hasPermission) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }

      const actionData = {
        ...request.body,
        moderator_id: userId,
        auto_generated: false,
      };

      const actionId = await comprehensiveModerationService.applyModerationAction(actionData);

      reply.send({
        success: true,
        action_id: actionId,
        message: 'Moderation action applied successfully',
      });
    } catch (error) {
      fastify.log.error('Error applying moderation action:', error);
      reply.status(500).send({ error: 'Failed to apply moderation action' });
    }
  });

  /**
   * Submit an appeal for a moderation action
   */
  fastify.post<AppealRequest>('/appeals', {
    schema: {
      description: 'Submit an appeal for a moderation action',
      tags: ['Moderation'],
      body: {
        type: 'object',
        required: ['action_id', 'appeal_reason'],
        properties: {
          action_id: { type: 'string' },
          appeal_reason: { type: 'string', minLength: 20, maxLength: 1000 },
          evidence_provided: { type: 'string', maxLength: 2000 },
          evidence_urls: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            appeal_id: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<AppealRequest>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const appealId = await comprehensiveModerationService.processAppeal(
        request.body.action_id,
        userId,
        request.body.appeal_reason,
        request.body.evidence_provided,
        request.body.evidence_urls
      );

      reply.send({
        success: true,
        appeal_id: appealId,
        message: 'Appeal submitted successfully',
      });
    } catch (error) {
      fastify.log.error('Error submitting appeal:', error);
      reply.status(400).send({ error: error.message || 'Failed to submit appeal' });
    }
  });

  /**
   * Get moderation queue (moderators only)
   */
  fastify.get<ModerationQueueQuery>('/queue', {
    schema: {
      description: 'Get moderation queue items (moderators only)',
      tags: ['Moderation'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'reviewing', 'approved', 'rejected', 'escalated'] },
          priority: { type: 'string' },
          content_type: { type: 'string', enum: ['post', 'comment', 'message'] },
          community_id: { type: 'string' },
          server_id: { type: 'string' },
          page: { type: 'string' },
          limit: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                total: { type: 'number' },
                page: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<ModerationQueueQuery>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      // Check if user has moderation permissions
      const hasPermission = await checkModerationPermission(userId);
      if (!hasPermission) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }

      const filters = {
        status: request.query.status,
        priority: request.query.priority ? parseInt(request.query.priority) : undefined,
        content_type: request.query.content_type,
        community_id: request.query.community_id,
        server_id: request.query.server_id,
      };

      const pagination = {
        page: parseInt(request.query.page || '1'),
        limit: parseInt(request.query.limit || '20'),
      };

      const queueData = await comprehensiveModerationService.getModerationQueue(
        userId,
        filters,
        pagination
      );

      reply.send({
        success: true,
        data: queueData,
      });
    } catch (error) {
      fastify.log.error('Error fetching moderation queue:', error);
      reply.status(500).send({ error: 'Failed to fetch moderation queue' });
    }
  });

  /**
   * Get moderation analytics (moderators only)
   */
  fastify.get<AnalyticsQuery>('/analytics', {
    schema: {
      description: 'Get moderation analytics and metrics (moderators only)',
      tags: ['Moderation'],
      querystring: {
        type: 'object',
        properties: {
          time_range: { type: 'string', enum: ['24h', '7d', '30d', '90d'] },
          community_id: { type: 'string' },
          server_id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                summary: { type: 'object' },
                trends: { type: 'object' },
                top_violations: { type: 'array' },
                moderator_performance: { type: 'array' },
                ai_accuracy: { type: 'object' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<AnalyticsQuery>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      // Check if user has analytics permissions
      const hasPermission = await checkAnalyticsPermission(userId);
      if (!hasPermission) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }

      const analytics = await comprehensiveModerationService.getModerationAnalytics(
        request.query.time_range || '7d',
        request.query.community_id,
        request.query.server_id
      );

      reply.send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      fastify.log.error('Error fetching moderation analytics:', error);
      reply.status(500).send({ error: 'Failed to fetch analytics' });
    }
  });

  /**
   * Manually analyze content with AI (moderators only)
   */
  fastify.post('/analyze', {
    schema: {
      description: 'Manually analyze content with AI (moderators only)',
      tags: ['Moderation'],
      body: {
        type: 'object',
        required: ['content_id', 'content_type'],
        properties: {
          content_id: { type: 'string' },
          content_type: { type: 'string', enum: ['post', 'comment', 'message'] },
          force_reanalysis: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            analysis: { type: 'object' },
            recommendations: { type: 'object' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{
    Body: { content_id: string; content_type: string; force_reanalysis?: boolean };
  }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      // Check if user has moderation permissions
      const hasPermission = await checkModerationPermission(userId);
      if (!hasPermission) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }

      // Get content text (implement this based on your content models)
      const content = await getContentText(request.body.content_id, request.body.content_type);
      if (!content) {
        return reply.status(404).send({ error: 'Content not found' });
      }

      // Analyze content
      const analysis = await aiModerationService.analyzeTextContent(
        content,
        request.body.content_id,
        request.body.content_type as any,
        userId
      );

      // Get rule recommendations
      const ruleCheck = await aiModerationService.checkModerationRules(
        analysis,
        request.body.content_type
      );

      reply.send({
        success: true,
        analysis,
        recommendations: {
          violated_rules: ruleCheck.violated_rules,
          recommended_action: ruleCheck.recommended_action,
          auto_action_required: ruleCheck.auto_action_required,
        },
      });
    } catch (error) {
      fastify.log.error('Error analyzing content:', error);
      reply.status(500).send({ error: 'Failed to analyze content' });
    }
  });

  /**
   * Update moderation queue item status (moderators only)
   */
  fastify.patch('/queue/:queueId', {
    schema: {
      description: 'Update moderation queue item status (moderators only)',
      tags: ['Moderation'],
      params: {
        type: 'object',
        properties: {
          queueId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['reviewing', 'approved', 'rejected', 'escalated'] },
          notes: { type: 'string', maxLength: 1000 },
          action_taken: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest<{
    Params: { queueId: string };
    Body: { status: string; notes?: string; action_taken?: string };
  }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      // Check if user has moderation permissions
      const hasPermission = await checkModerationPermission(userId);
      if (!hasPermission) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }

      // Update queue item (implement this method)
      await updateModerationQueueItem(
        request.params.queueId,
        request.body.status,
        userId,
        request.body.notes,
        request.body.action_taken
      );

      reply.send({
        success: true,
        message: 'Queue item updated successfully',
      });
    } catch (error) {
      fastify.log.error('Error updating queue item:', error);
      reply.status(500).send({ error: 'Failed to update queue item' });
    }
  });

  /**
   * Get user moderation history (moderators only)
   */
  fastify.get('/users/:userId/history', {
    schema: {
      description: 'Get user moderation history (moderators only)',
      tags: ['Moderation'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user_id: { type: 'string' },
                risk_score: { type: 'number' },
                trust_level: { type: 'number' },
                total_reports: { type: 'number' },
                total_warnings: { type: 'number' },
                total_bans: { type: 'number' },
                recent_actions: { type: 'array' },
                behavior_flags: { type: 'array' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{
    Params: { userId: string };
  }>, reply: FastifyReply) => {
    try {
      const moderatorId = (request as any).user?.id;
      if (!moderatorId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      // Check if user has moderation permissions
      const hasPermission = await checkModerationPermission(moderatorId);
      if (!hasPermission) {
        return reply.status(403).send({ error: 'Insufficient permissions' });
      }

      const userHistory = await getUserModerationHistory(request.params.userId);

      reply.send({
        success: true,
        data: userHistory,
      });
    } catch (error) {
      fastify.log.error('Error fetching user moderation history:', error);
      reply.status(500).send({ error: 'Failed to fetch user history' });
    }
  });
}

// Helper functions

async function checkModerationPermission(
  userId: string,
  communityId?: string,
  serverId?: string
): Promise<boolean> {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.username === 'admin' || user?.email?.includes('admin')) {
      return true;
    }

    // Check moderator permissions table
    const permissions = await prisma.$queryRawUnsafe(`
      SELECT * FROM moderator_permissions 
      WHERE user_id = $1 
      AND (
        $2::text IS NULL OR 
        assigned_communities::jsonb ? $2 OR 
        assigned_communities = '[]'::jsonb
      )
      AND (
        $3::text IS NULL OR 
        assigned_servers::jsonb ? $3 OR 
        assigned_servers = '[]'::jsonb
      )
    `, userId, communityId || null, serverId || null);

    return (permissions as any[]).length > 0;
  } catch (error) {
    console.error('Error checking moderation permission:', error);
    return false;
  }
}

async function checkAnalyticsPermission(userId: string): Promise<boolean> {
  try {
    const permissions = await prisma.$queryRawUnsafe(`
      SELECT can_view_analytics FROM moderator_permissions 
      WHERE user_id = $1
    `, userId);

    return (permissions as any[])[0]?.can_view_analytics || false;
  } catch (error) {
    console.error('Error checking analytics permission:', error);
    return false;
  }
}

async function getContentText(contentId: string, contentType: string): Promise<string> {
  try {
    switch (contentType) {
      case 'post':
        const post = await prisma.post.findUnique({ where: { id: contentId } });
        return post?.content || '';
      case 'comment':
        const comment = await prisma.comment.findUnique({ where: { id: contentId } });
        return comment?.content || '';
      case 'message':
        const message = await prisma.message.findUnique({ where: { id: contentId } });
        return message?.content || '';
      default:
        return '';
    }
  } catch (error) {
    console.error('Error fetching content text:', error);
    return '';
  }
}

async function updateModerationQueueItem(
  queueId: string,
  status: string,
  moderatorId: string,
  notes?: string,
  actionTaken?: string
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE moderation_queue 
      SET status = $1, assigned_moderator = $2, processed_at = NOW(),
          metadata = metadata || jsonb_build_object('notes', $3, 'action_taken', $4)
      WHERE id = $5
    `, status, moderatorId, notes || '', actionTaken || '', queueId);
  } catch (error) {
    console.error('Error updating moderation queue item:', error);
    throw error;
  }
}

async function getUserModerationHistory(userId: string): Promise<any> {
  try {
    const history = await prisma.$queryRawUnsafe(`
      SELECT umh.*, 
             (SELECT COUNT(*) FROM moderation_actions WHERE target_user_id = $1) as total_actions,
             (SELECT COUNT(*) FROM content_reports WHERE reported_user_id = $1) as total_reports_against
      FROM user_moderation_history umh
      WHERE umh.user_id = $1
    `, userId);

    const recentActions = await prisma.$queryRawUnsafe(`
      SELECT ma.*, u.username as moderator_username
      FROM moderation_actions ma
      LEFT JOIN users u ON ma.moderator_id = u.id
      WHERE ma.target_user_id = $1
      ORDER BY ma.created_at DESC
      LIMIT 20
    `, userId);

    return {
      user_id: userId,
      ...(history as any[])[0],
      recent_actions: recentActions,
    };
  } catch (error) {
    console.error('Error fetching user moderation history:', error);
    return {
      user_id: userId,
      risk_score: 0,
      trust_level: 1,
      total_reports: 0,
      total_warnings: 0,
      total_bans: 0,
      recent_actions: [],
      behavior_flags: [],
    };
  }
}

// Add this import at the top
import { prisma } from '@cryb/database';