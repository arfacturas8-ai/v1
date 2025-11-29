import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@cryb/database";
import { authMiddleware } from "../middleware/auth";
import { EnhancedModerationService } from "../services/enhanced-moderation";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Initialize Redis and Queue for reporting system
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  password: process.env.REDIS_PASSWORD,
});

const reportingQueue = new Queue('reporting', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Initialize Enhanced Moderation Service for AI-powered report analysis
let enhancedModeration: EnhancedModerationService | null = null;

try {
  enhancedModeration = new EnhancedModerationService(reportingQueue);
  console.log('✅ Enhanced Moderation Service initialized for reporting routes');
} catch (error) {
  console.error('❌ Failed to initialize Enhanced Moderation Service for reporting routes:', error);
}

const reportingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authMiddleware);

  // Submit a new report
  fastify.post("/submit", async (request: any, reply) => {
    try {
      const body = z.object({
        targetType: z.enum(['user', 'post', 'comment', 'message', 'server', 'channel']),
        targetId: z.string(),
        reason: z.enum([
          'spam',
          'harassment',
          'hate_speech',
          'violence',
          'sexual_content',
          'self_harm',
          'misinformation',
          'copyright',
          'privacy',
          'doxxing',
          'scam',
          'impersonation',
          'other'
        ]),
        description: z.string().min(10).max(1000),
        evidence: z.array(z.object({
          type: z.enum(['screenshot', 'text', 'url', 'file']),
          content: z.string(),
          metadata: z.any().optional()
        })).optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
        anonymous: z.boolean().optional().default(false),
        serverId: z.string().optional(),
        channelId: z.string().optional(),
      }).parse(request.body);

      // Validate target exists and user has permission to report
      const targetData = await validateReportTarget(body.targetType, body.targetId, request.userId);
      if (!targetData.exists) {
        return reply.code(404).send({
          success: false,
          error: "Target not found or you don't have permission to report it"
        });
      }

      // Check for duplicate reports (prevent spam reporting)
      const existingReport = await prisma.report.findFirst({
        where: {
          reporterId: request.userId,
          [`${body.targetType}Id`]: body.targetId,
          status: { in: ['pending', 'under_review'] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
          }
        }
      });

      if (existingReport) {
        return reply.code(409).send({
          success: false,
          error: "You have already reported this content within the last 24 hours"
        });
      }

      // Create the report
      const report = await prisma.report.create({
        data: {
          reporterId: body.anonymous ? null : request.userId,
          [`${body.targetType}Id`]: body.targetId,
          reason: body.reason,
          description: body.description,
          evidence: body.evidence || [],
          severity: body.severity,
          anonymous: body.anonymous,
          serverId: body.serverId,
          channelId: body.channelId,
          status: 'pending',
          metadata: {
            userAgent: request.headers['user-agent'],
            ipAddress: body.anonymous ? null : request.ip,
            targetData: targetData.data,
            submissionTime: new Date().toISOString()
          }
        },
        include: {
          reporter: body.anonymous ? false : {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        }
      });

      // Calculate priority based on severity, reason, and AI analysis
      let priority = calculateReportPriority(body.reason, body.severity, targetData.data);

      // Use AI to analyze the report for automatic categorization and priority adjustment
      if (enhancedModeration && targetData.data.content) {
        try {
          const aiAnalysis = await enhancedModeration.processRequest({
            id: `report_${report.id}`,
            type: 'message',
            data: {
              userId: targetData.data.userId || '',
              content: targetData.data.content,
              serverId: body.serverId,
              channelId: body.channelId,
              metadata: {
                reportReason: body.reason,
                reportSeverity: body.severity,
                reportDescription: body.description
              }
            },
            priority: priority,
            timestamp: new Date()
          });

          // Adjust priority based on AI analysis
          if (aiAnalysis.riskLevel === 'critical') {
            priority = 'critical';
          } else if (aiAnalysis.riskLevel === 'high' && priority !== 'critical') {
            priority = 'high';
          }

          // Update report with AI analysis
          await prisma.report.update({
            where: { id: report.id },
            data: {
              aiAnalysis: {
                riskLevel: aiAnalysis.riskLevel,
                overallRisk: aiAnalysis.overallRisk,
                confidence: aiAnalysis.confidence,
                serviceResults: aiAnalysis.serviceResults,
                suggestedActions: aiAnalysis.actions.map(a => a.type),
                processedAt: new Date().toISOString()
              },
              priority
            }
          });

          console.log(`🤖 AI analysis completed for report ${report.id}: ${aiAnalysis.riskLevel} risk`);
        } catch (error) {
          console.error('AI analysis failed for report:', error);
        }
      }

      // Queue for processing
      await reportingQueue.add('process-report', {
        reportId: report.id,
        priority,
        reason: body.reason,
        severity: body.severity,
        targetType: body.targetType,
        targetId: body.targetId,
        submittedAt: new Date()
      }, {
        priority: getPriorityScore(priority),
        delay: priority === 'critical' ? 0 : 5000 // Critical reports processed immediately
      });

      // Send notification to moderators for high-priority reports
      if (['high', 'critical'].includes(priority)) {
        await reportingQueue.add('notify-moderators', {
          reportId: report.id,
          urgency: priority,
          reason: body.reason,
          targetType: body.targetType,
          serverId: body.serverId
        });
      }

      // Log the report submission
      await prisma.auditLog.create({
        data: {
          serverId: body.serverId,
          userId: request.userId,
          targetId: body.targetId,
          actionType: 997, // Report submission action type
          reason: `Report submitted: ${body.reason}`,
          options: {
            reportId: report.id,
            targetType: body.targetType,
            reason: body.reason,
            severity: body.severity,
            priority,
            anonymous: body.anonymous
          },
          changes: null
        }
      });

      return reply.send({
        success: true,
        data: {
          reportId: report.id,
          status: 'pending',
          priority,
          estimatedReviewTime: getEstimatedReviewTime(priority),
          message: "Your report has been submitted successfully and will be reviewed by our moderation team."
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to submit report"
      });
    }
  });

  // Get user's report history
  fastify.get("/my-reports", async (request: any, reply) => {
    try {
      const { page = 1, limit = 20, status } = z.object({
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(20),
        status: z.enum(['pending', 'under_review', 'resolved', 'dismissed']).optional()
      }).parse(request.query);

      const where: any = {
        reporterId: request.userId
      };

      if (status) {
        where.status = status;
      }

      const reports = await prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          reason: true,
          description: true,
          status: true,
          priority: true,
          severity: true,
          createdAt: true,
          resolvedAt: true,
          moderatorNote: true,
          aiAnalysis: true,
          // Include minimal target info without exposing sensitive data
          postId: true,
          commentId: true,
          userId: true,
          serverId: true,
          channelId: true
        }
      });

      const total = await prisma.report.count({ where });

      return reply.send({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get reports"
      });
    }
  });

  // Get report details (for reporter or moderators)
  fastify.get("/:reportId", async (request: any, reply) => {
    try {
      const { reportId } = z.object({
        reportId: z.string()
      }).parse(request.params);

      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          },
          resolvedBy: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        }
      });

      if (!report) {
        return reply.code(404).send({
          success: false,
          error: "Report not found"
        });
      }

      // Check permissions - only reporter, moderators, or admins can view
      const canView = await checkReportViewPermission(report, request.userId);
      if (!canView) {
        return reply.code(403).send({
          success: false,
          error: "You don't have permission to view this report"
        });
      }

      return reply.send({
        success: true,
        data: report
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get report details"
      });
    }
  });

  // Update report status (moderators only)
  fastify.patch("/:reportId/status", async (request: any, reply) => {
    try {
      const { reportId } = z.object({
        reportId: z.string()
      }).parse(request.params);

      const body = z.object({
        status: z.enum(['under_review', 'resolved', 'dismissed']),
        moderatorNote: z.string().max(1000).optional(),
        action: z.enum(['no_action', 'content_removed', 'user_warned', 'user_suspended', 'user_banned']).optional(),
        actionDuration: z.number().optional() // Duration in hours for suspensions
      }).parse(request.body);

      const report = await prisma.report.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        return reply.code(404).send({
          success: false,
          error: "Report not found"
        });
      }

      // Check moderator permissions
      const isModerator = await checkModeratorPermission(request.userId, report.serverId);
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Only moderators can update report status"
        });
      }

      // Update report
      const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: body.status,
          moderatorNote: body.moderatorNote,
          resolvedAt: body.status === 'resolved' ? new Date() : null,
          resolvedBy: body.status === 'resolved' ? request.userId : null,
          actionTaken: body.action,
          actionDuration: body.actionDuration
        }
      });

      // Execute moderation action if specified
      if (body.action && body.action !== 'no_action') {
        await executeModerationAction(report, body.action, body.actionDuration, request.userId);
      }

      // Log the status update
      await prisma.auditLog.create({
        data: {
          serverId: report.serverId,
          userId: request.userId,
          targetId: report.id,
          actionType: 998, // Report resolution action type
          reason: `Report ${body.status}: ${body.moderatorNote || 'No note provided'}`,
          options: {
            reportId: report.id,
            newStatus: body.status,
            action: body.action,
            actionDuration: body.actionDuration
          },
          changes: null
        }
      });

      return reply.send({
        success: true,
        data: updatedReport,
        message: `Report ${body.status} successfully`
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update report status"
      });
    }
  });

  // Get moderation queue for moderators
  fastify.get("/moderation/queue", async (request: any, reply) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        status = 'pending',
        priority,
        reason,
        serverId 
      } = z.object({
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(50),
        status: z.enum(['pending', 'under_review', 'resolved', 'dismissed']).optional().default('pending'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        reason: z.string().optional(),
        serverId: z.string().optional()
      }).parse(request.query);

      // Check if user is a moderator (at least for one server if serverId not specified)
      const isModerator = await checkModeratorPermission(request.userId, serverId);
      if (!isModerator) {
        return reply.code(403).send({
          success: false,
          error: "Only moderators can access the moderation queue"
        });
      }

      const where: any = { status };

      if (priority) where.priority = priority;
      if (reason) where.reason = reason;
      if (serverId) where.serverId = serverId;

      // If user is not a global admin, only show reports for servers they moderate
      if (serverId) {
        where.serverId = serverId;
      } else {
        // Get all servers the user moderates
        const moderatedServers = await prisma.communityModerator.findMany({
          where: { userId: request.userId },
          select: { communityId: true }
        });

        if (moderatedServers.length > 0) {
          where.serverId = {
            in: moderatedServers.map(m => m.communityId)
          };
        } else {
          // No moderated servers, return empty
          return reply.send({
            success: true,
            data: {
              reports: [],
              pagination: { page, limit, total: 0, pages: 0 }
            }
          });
        }
      }

      const reports = await prisma.report.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        skip: (page - 1) * limit,
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
              }
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      const total = await prisma.report.count({ where });

      return reply.send({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get moderation queue"
      });
    }
  });

  // Get reporting statistics
  fastify.get("/stats", async (request: any, reply) => {
    try {
      const { serverId, timeRange = '7d' } = z.object({
        serverId: z.string().optional(),
        timeRange: z.enum(['24h', '7d', '30d', '90d']).optional().default('7d')
      }).parse(request.query);

      // Check permissions
      if (serverId) {
        const isModerator = await checkModeratorPermission(request.userId, serverId);
        if (!isModerator) {
          return reply.code(403).send({
            success: false,
            error: "Only moderators can view reporting statistics"
          });
        }
      } else {
        // Global stats - require admin permissions
        const user = await prisma.user.findUnique({
          where: { id: request.userId }
        });
        if (!user?.isAdmin) {
          return reply.code(403).send({
            success: false,
            error: "Only admins can view global reporting statistics"
          });
        }
      }

      const timeMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - timeMap[timeRange]);
      const where: any = {
        createdAt: { gte: since }
      };

      if (serverId) {
        where.serverId = serverId;
      }

      const [
        totalReports,
        reportsByStatus,
        reportsByReason,
        reportsByPriority,
        averageResolutionTime,
        topReportedUsers,
        reportTrends
      ] = await Promise.all([
        // Total reports
        prisma.report.count({ where }),

        // Reports by status
        prisma.report.groupBy({
          by: ['status'],
          where,
          _count: true
        }),

        // Reports by reason
        prisma.report.groupBy({
          by: ['reason'],
          where,
          _count: true,
          orderBy: { _count: { reason: 'desc' } }
        }),

        // Reports by priority
        prisma.report.groupBy({
          by: ['priority'],
          where,
          _count: true
        }),

        // Average resolution time
        prisma.report.aggregate({
          where: {
            ...where,
            status: 'resolved',
            resolvedAt: { not: null }
          },
          _avg: {
            resolutionTime: true
          }
        }),

        // Top reported users (limit to protect privacy)
        prisma.report.groupBy({
          by: ['userId'],
          where: {
            ...where,
            userId: { not: null }
          },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10
        }),

        // Daily report trends
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
            COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical
          FROM reports 
          WHERE created_at >= ${since}
          ${serverId ? `AND server_id = ${serverId}` : ''}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `
      ]);

      return reply.send({
        success: true,
        data: {
          summary: {
            totalReports,
            averageResolutionTimeHours: averageResolutionTime._avg.resolutionTime ? 
              Math.round(averageResolutionTime._avg.resolutionTime / (1000 * 60 * 60)) : null,
            timeRange,
            generatedAt: new Date()
          },
          breakdown: {
            byStatus: reportsByStatus.map(item => ({
              status: item.status,
              count: item._count
            })),
            byReason: reportsByReason.map(item => ({
              reason: item.reason,
              count: item._count
            })),
            byPriority: reportsByPriority.map(item => ({
              priority: item.priority,
              count: item._count
            }))
          },
          trends: reportTrends,
          insights: generateReportingInsights(reportsByReason, reportsByPriority, totalReports)
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get reporting statistics"
      });
    }
  });
};

// Helper functions
async function validateReportTarget(targetType: string, targetId: string, userId: string) {
  try {
    switch (targetType) {
      case 'user':
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, username: true, displayName: true }
        });
        return { exists: !!user, data: user };

      case 'post':
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { 
            id: true, 
            title: true, 
            content: true, 
            userId: true,
            communityId: true 
          }
        });
        return { exists: !!post, data: post };

      case 'comment':
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          select: { 
            id: true, 
            content: true, 
            userId: true,
            post: { select: { communityId: true } }
          }
        });
        return { exists: !!comment, data: comment };

      case 'message':
        const message = await prisma.message.findUnique({
          where: { id: targetId },
          select: { 
            id: true, 
            content: true, 
            userId: true,
            channelId: true,
            channel: { select: { serverId: true } }
          }
        });
        return { exists: !!message, data: message };

      default:
        return { exists: false, data: null };
    }
  } catch (error) {
    console.error('Target validation failed:', error);
    return { exists: false, data: null };
  }
}

function calculateReportPriority(reason: string, severity: string, targetData: any): 'low' | 'medium' | 'high' | 'critical' {
  // Base priority from severity
  let priority = severity as 'low' | 'medium' | 'high' | 'critical';

  // Adjust based on reason
  const highPriorityReasons = ['violence', 'self_harm', 'doxxing', 'sexual_content'];
  const criticalReasons = ['self_harm', 'violence'];

  if (criticalReasons.includes(reason)) {
    priority = 'critical';
  } else if (highPriorityReasons.includes(reason) && priority !== 'critical') {
    priority = 'high';
  }

  return priority;
}

function getPriorityScore(priority: string): number {
  const scores = { critical: 100, high: 75, medium: 50, low: 25 };
  return scores[priority] || 50;
}

function getEstimatedReviewTime(priority: string): string {
  const times = {
    critical: '< 1 hour',
    high: '< 4 hours',
    medium: '< 24 hours',
    low: '< 3 days'
  };
  return times[priority] || '< 24 hours';
}

async function checkReportViewPermission(report: any, userId: string): Promise<boolean> {
  // Reporter can always view their own reports
  if (report.reporterId === userId) return true;

  // Check if user is a moderator for the relevant server/community
  if (report.serverId) {
    return await checkModeratorPermission(userId, report.serverId);
  }

  // Global admins can view all reports
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  });

  return user?.isAdmin || false;
}

async function checkModeratorPermission(userId: string, serverId?: string): Promise<boolean> {
  // Check if user is a global admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  });

  if (user?.isAdmin) return true;

  if (serverId) {
    // Check if user is a moderator for this specific server
    const moderator = await prisma.communityModerator.findUnique({
      where: {
        communityId_userId: {
          communityId: serverId,
          userId: userId
        }
      }
    });

    return !!moderator;
  } else {
    // Check if user is a moderator for any server
    const moderatorCount = await prisma.communityModerator.count({
      where: { userId }
    });

    return moderatorCount > 0;
  }
}

async function executeModerationAction(
  report: any, 
  action: string, 
  duration?: number, 
  moderatorId?: string
): Promise<void> {
  try {
    switch (action) {
      case 'content_removed':
        if (report.postId) {
          await prisma.post.update({
            where: { id: report.postId },
            data: { isRemoved: true, removedAt: new Date(), removedBy: moderatorId }
          });
        } else if (report.commentId) {
          await prisma.comment.update({
            where: { id: report.commentId },
            data: { isRemoved: true, removedAt: new Date(), removedBy: moderatorId }
          });
        }
        break;

      case 'user_warned':
        // Create warning record
        await prisma.warning.create({
          data: {
            userId: report.userId || '',
            reason: `Report violation: ${report.reason}`,
            issuedBy: moderatorId || 'system',
            serverId: report.serverId,
            reportId: report.id
          }
        });
        break;

      case 'user_suspended':
        if (duration && report.userId) {
          const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
          await prisma.suspension.create({
            data: {
              userId: report.userId,
              reason: `Report violation: ${report.reason}`,
              expiresAt,
              issuedBy: moderatorId || 'system',
              serverId: report.serverId,
              reportId: report.id
            }
          });
        }
        break;

      case 'user_banned':
        if (report.userId && report.serverId) {
          await prisma.communityBan.create({
            data: {
              userId: report.userId,
              communityId: report.serverId,
              reason: `Report violation: ${report.reason}`,
              bannedBy: moderatorId || 'system',
              reportId: report.id
            }
          });
        }
        break;
    }
  } catch (error) {
    console.error('Failed to execute moderation action:', error);
  }
}

function generateReportingInsights(reportsByReason: any[], reportsByPriority: any[], totalReports: number) {
  const insights = [];

  // Most common violation type
  if (reportsByReason.length > 0) {
    const topReason = reportsByReason[0];
    insights.push(`Most common violation: ${topReason.reason} (${((topReason._count / totalReports) * 100).toFixed(1)}%)`);
  }

  // Priority distribution
  const criticalCount = reportsByPriority.find(p => p.priority === 'critical')?._count || 0;
  const highCount = reportsByPriority.find(p => p.priority === 'high')?._count || 0;
  const urgentPercentage = ((criticalCount + highCount) / totalReports) * 100;

  if (urgentPercentage > 30) {
    insights.push(`High urgency alert: ${urgentPercentage.toFixed(1)}% of reports are high or critical priority`);
  }

  // Volume analysis
  if (totalReports > 100) {
    insights.push('High report volume detected - consider reviewing moderation policies');
  } else if (totalReports < 10) {
    insights.push('Low report volume - community appears healthy');
  }

  return insights;
}

export default reportingRoutes;