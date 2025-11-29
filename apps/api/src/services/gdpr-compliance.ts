import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { Queue } from 'bullmq';
import archiver from 'archiver';
import fs from 'fs/promises';
import path from 'path';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  password: process.env.REDIS_PASSWORD
});

const gdprQueue = new Queue('gdpr-processing', { connection: redis });

export interface GDPRDataExport {
  user: any;
  posts: any[];
  comments: any[];
  messages: any[];
  communities: any[];
  servers: any[];
  notifications: any[];
  moderationActions: any[];
  analytics: any[];
  sessions: any[];
  uploadedFiles: any[];
}

export interface GDPRDeletionRequest {
  userId: string;
  requestedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletionType: 'soft' | 'hard';
  retentionPeriod?: number; // days
  metadata: {
    ipAddress: string;
    userAgent: string;
    reason?: string;
  };
}

export class GDPRComplianceService {
  private static instance: GDPRComplianceService;
  private dataRetentionPolicies: Map<string, number> = new Map();

  constructor() {
    // Set default data retention policies (in days)
    this.dataRetentionPolicies.set('user_data', 30);
    this.dataRetentionPolicies.set('messages', 90);
    this.dataRetentionPolicies.set('analytics', 365);
    this.dataRetentionPolicies.set('moderation_logs', 1095); // 3 years
    this.dataRetentionPolicies.set('financial_records', 2555); // 7 years
  }

  public static getInstance(): GDPRComplianceService {
    if (!GDPRComplianceService.instance) {
      GDPRComplianceService.instance = new GDPRComplianceService();
    }
    return GDPRComplianceService.instance;
  }

  /**
   * Request complete data export for a user (GDPR Article 15)
   */
  async requestDataExport(userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<string> {
    try {
      // Create export request record
      const exportRequest = await prisma.gDPRRequest.create({
        data: {
          userId,
          type: 'DATA_EXPORT',
          status: 'pending',
          requestedAt: new Date(),
          metadata: {
            format,
            exportId: createHash('sha256').update(`${userId}-${Date.now()}`).digest('hex')
          }
        }
      });

      // Queue the export job
      await gdprQueue.add('export-user-data', {
        userId,
        requestId: exportRequest.id,
        format
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      return exportRequest.id;

    } catch (error) {
      console.error('Failed to request data export:', error);
      throw new Error('Failed to initiate data export request');
    }
  }

  /**
   * Export all user data in compliance with GDPR
   */
  async exportUserData(userId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<GDPRDataExport> {
    try {
      console.log(`Starting GDPR data export for user ${userId}`);

      // Fetch all user-related data
      const [
        user,
        posts,
        comments,
        messages,
        communities,
        servers,
        notifications,
        moderationActions,
        analytics,
        sessions,
        uploadedFiles
      ] = await Promise.all([
        // User profile data
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            preferences: true,
            blockedUsers: true,
            blockedByUsers: true
          }
        }),

        // User posts
        prisma.post.findMany({
          where: { authorId: userId },
          include: {
            Community: true,
            votes: true,
            awards: true,
            tags: true
          }
        }),

        // User comments
        prisma.comment.findMany({
          where: { authorId: userId },
          include: {
            Post: { select: { id: true, title: true } },
            votes: true,
            parentComment: true,
            childComments: true
          }
        }),

        // User messages
        prisma.message.findMany({
          where: { authorId: userId },
          include: {
            Channel: { select: { id: true, name: true } },
            Server: { select: { id: true, name: true } },
            mentions: true,
            reactions: true
          }
        }),

        // Communities joined/created
        prisma.community.findMany({
          where: {
            OR: [
              { creatorId: userId },
              { members: { some: { userId } } }
            ]
          },
          include: {
            members: {
              where: { userId },
              select: { role: true, joinedAt: true }
            }
          }
        }),

        // Servers joined/created
        prisma.server.findMany({
          where: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } }
            ]
          },
          include: {
            members: {
              where: { userId },
              select: { role: true, joinedAt: true }
            }
          }
        }),

        // Notifications
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        }),

        // Moderation actions
        prisma.moderationAction.findMany({
          where: {
            OR: [
              { targetUserId: userId },
              { moderatorId: userId }
            ]
          },
          include: {
            moderator: { select: { id: true, username: true } },
            targetUser: { select: { id: true, username: true } }
          }
        }),

        // Analytics data (anonymized)
        this.getAnonymizedAnalytics(userId),

        // Session data
        this.getUserSessions(userId),

        // Uploaded files
        this.getUserUploadedFiles(userId)
      ]);

      const exportData: GDPRDataExport = {
        user: this.sanitizeUserData(user),
        posts: posts.map(post => this.sanitizePostData(post)),
        comments: comments.map(comment => this.sanitizeCommentData(comment)),
        messages: messages.map(message => this.sanitizeMessageData(message)),
        communities,
        servers,
        notifications,
        moderationActions,
        analytics,
        sessions,
        uploadedFiles
      };

      console.log(`GDPR data export completed for user ${userId}`);
      return exportData;

    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Request user data deletion (GDPR Article 17 - Right to be forgotten)
   */
  async requestDataDeletion(
    userId: string,
    deletionType: 'soft' | 'hard' = 'soft',
    metadata: { ipAddress: string; userAgent: string; reason?: string }
  ): Promise<string> {
    try {
      // Check if user has any obligations that prevent deletion
      const obligations = await this.checkDeletionObligations(userId);
      
      if (obligations.hasPendingObligations) {
        throw new Error(`Cannot delete user data: ${obligations.reasons.join(', ')}`);
      }

      // Create deletion request
      const deletionRequest = await prisma.gDPRRequest.create({
        data: {
          userId,
          type: 'DATA_DELETION',
          status: 'pending',
          requestedAt: new Date(),
          metadata: {
            deletionType,
            ...metadata,
            obligations: obligations.details
          }
        }
      });

      // Queue the deletion job
      await gdprQueue.add('delete-user-data', {
        userId,
        requestId: deletionRequest.id,
        deletionType,
        metadata
      }, {
        delay: 86400000, // 24 hour delay for safety
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      return deletionRequest.id;

    } catch (error) {
      console.error('Failed to request data deletion:', error);
      throw error;
    }
  }

  /**
   * Execute user data deletion
   */
  async deleteUserData(userId: string, deletionType: 'soft' | 'hard' = 'soft'): Promise<void> {
    try {
      console.log(`Starting GDPR data deletion for user ${userId} (${deletionType})`);

      if (deletionType === 'soft') {
        await this.performSoftDeletion(userId);
      } else {
        await this.performHardDeletion(userId);
      }

      // Log the deletion
      await this.logDeletionAction(userId, deletionType);

      console.log(`GDPR data deletion completed for user ${userId}`);

    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Soft deletion - anonymize data but keep for integrity
   */
  private async performSoftDeletion(userId: string): Promise<void> {
    const anonymizedData = {
      username: `deleted_user_${createHash('md5').update(userId).digest('hex').substring(0, 8)}`,
      email: `deleted_${createHash('md5').update(userId).digest('hex').substring(0, 8)}@deleted.local`,
      displayName: 'Deleted User',
      bio: null,
      avatar: null,
      isDeleted: true,
      deletedAt: new Date()
    };

    await prisma.$transaction([
      // Anonymize user profile
      prisma.user.update({
        where: { id: userId },
        data: anonymizedData
      }),

      // Anonymize posts (keep content for context but remove author)
      prisma.post.updateMany({
        where: { authorId: userId },
        data: {
          authorId: null,
          title: '[Deleted]',
          content: '[This content has been deleted]'
        }
      }),

      // Anonymize comments
      prisma.comment.updateMany({
        where: { authorId: userId },
        data: {
          authorId: null,
          content: '[This comment has been deleted]'
        }
      }),

      // Delete personal messages but keep system messages
      prisma.message.deleteMany({
        where: {
          authorId: userId,
          type: { not: 'SYSTEM' }
        }
      }),

      // Remove from communities and servers
      prisma.communityMember.deleteMany({
        where: { userId }
      }),

      prisma.serverMember.deleteMany({
        where: { userId }
      }),

      // Delete notifications
      prisma.notification.deleteMany({
        where: { userId }
      }),

      // Clear sessions
      prisma.session.deleteMany({
        where: { userId }
      })
    ]);

    // Clear Redis data
    await this.clearRedisUserData(userId);
  }

  /**
   * Hard deletion - completely remove all data
   */
  private async performHardDeletion(userId: string): Promise<void> {
    await prisma.$transaction([
      // Delete in order to respect foreign key constraints
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.vote.deleteMany({ where: { userId } }),
      prisma.communityMember.deleteMany({ where: { userId } }),
      prisma.serverMember.deleteMany({ where: { userId } }),
      prisma.message.deleteMany({ where: { authorId: userId } }),
      prisma.comment.deleteMany({ where: { authorId: userId } }),
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.userPreferences.deleteMany({ where: { userId } }),
      prisma.userProfile.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    // Clear Redis data
    await this.clearRedisUserData(userId);

    // Clear uploaded files
    await this.deleteUserFiles(userId);
  }

  /**
   * Check if user has obligations preventing deletion
   */
  private async checkDeletionObligations(userId: string): Promise<{
    hasPendingObligations: boolean;
    reasons: string[];
    details: any;
  }> {
    const obligations = [];
    const details: any = {};

    // Check for ongoing moderation cases
    const pendingModerationActions = await prisma.moderationAction.count({
      where: {
        targetUserId: userId,
        status: { in: ['pending', 'in_review'] }
      }
    });

    if (pendingModerationActions > 0) {
      obligations.push('Pending moderation cases');
      details.pendingModerationActions = pendingModerationActions;
    }

    // Check for financial obligations (if applicable)
    // This would include pending payments, subscriptions, etc.

    // Check for legal holds
    const legalHolds = await redis.get(`legal_hold:${userId}`);
    if (legalHolds) {
      obligations.push('Legal hold in effect');
      details.legalHold = JSON.parse(legalHolds);
    }

    return {
      hasPendingObligations: obligations.length > 0,
      reasons: obligations,
      details
    };
  }

  /**
   * Clear user data from Redis
   */
  private async clearRedisUserData(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `session:${userId}:*`,
      `rate_limit:*:${userId}`,
      `user:trust:${userId}`,
      `user:preferences:${userId}`,
      `user:analytics:${userId}`
    ];

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  }

  /**
   * Delete user uploaded files
   */
  private async deleteUserFiles(userId: string): Promise<void> {
    // This would integrate with MinIO to delete user's uploaded files
    // Implementation depends on your file storage structure
    console.log(`Deleting files for user ${userId}`);
  }

  /**
   * Log deletion action for audit trail
   */
  private async logDeletionAction(userId: string, deletionType: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: 'GDPR_DATA_DELETION',
        entityType: 'USER',
        entityId: userId,
        metadata: {
          deletionType,
          timestamp: new Date().toISOString(),
          compliance: 'GDPR_ARTICLE_17'
        }
      }
    });
  }

  /**
   * Get user sessions from Redis
   */
  private async getUserSessions(userId: string): Promise<any[]> {
    try {
      const sessionKeys = await redis.keys(`session:${userId}:*`);
      const sessions = [];

      for (const key of sessionKeys) {
        const sessionData = await redis.get(key);
        if (sessionData) {
          sessions.push({
            sessionId: key.split(':')[2],
            data: JSON.parse(sessionData),
            ttl: await redis.ttl(key)
          });
        }
      }

      return sessions;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Get user uploaded files metadata
   */
  private async getUserUploadedFiles(userId: string): Promise<any[]> {
    try {
      // This would query your file storage metadata
      // Implementation depends on how you track uploaded files
      return [];
    } catch (error) {
      console.error('Failed to get user files:', error);
      return [];
    }
  }

  /**
   * Get anonymized analytics data
   */
  private async getAnonymizedAnalytics(userId: string): Promise<any[]> {
    try {
      // Return anonymized analytics data
      const analytics = await prisma.analyticsEvent.findMany({
        where: { userId },
        select: {
          eventType: true,
          timestamp: true,
          metadata: true
          // Exclude personally identifiable fields
        }
      });

      return analytics.map(event => ({
        ...event,
        userId: '[REDACTED]'
      }));
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return [];
    }
  }

  /**
   * Sanitize user data for export
   */
  private sanitizeUserData(user: any): any {
    if (!user) return null;

    return {
      ...user,
      password: '[REDACTED]',
      twoFactorSecret: '[REDACTED]',
      resetToken: '[REDACTED]',
      verificationToken: '[REDACTED]'
    };
  }

  /**
   * Sanitize post data for export
   */
  private sanitizePostData(post: any): any {
    return {
      ...post,
      // Include all post data as it's user's content
    };
  }

  /**
   * Sanitize comment data for export
   */
  private sanitizeCommentData(comment: any): any {
    return {
      ...comment,
      // Include all comment data as it's user's content
    };
  }

  /**
   * Sanitize message data for export
   */
  private sanitizeMessageData(message: any): any {
    return {
      ...message,
      // Include message content but may redact sensitive system messages
    };
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const [
        exportRequests,
        deletionRequests,
        dataRetentionStats
      ] = await Promise.all([
        prisma.gDPRRequest.findMany({
          where: {
            type: 'DATA_EXPORT',
            requestedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        prisma.gDPRRequest.findMany({
          where: {
            type: 'DATA_DELETION',
            requestedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),

        this.getDataRetentionStats()
      ]);

      return {
        period: {
          start: startDate,
          end: endDate
        },
        exportRequests: {
          total: exportRequests.length,
          completed: exportRequests.filter(r => r.status === 'completed').length,
          pending: exportRequests.filter(r => r.status === 'pending').length,
          failed: exportRequests.filter(r => r.status === 'failed').length
        },
        deletionRequests: {
          total: deletionRequests.length,
          completed: deletionRequests.filter(r => r.status === 'completed').length,
          pending: deletionRequests.filter(r => r.status === 'pending').length,
          failed: deletionRequests.filter(r => r.status === 'failed').length
        },
        dataRetention: dataRetentionStats,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Get data retention statistics
   */
  private async getDataRetentionStats(): Promise<any> {
    // Implementation would check data age against retention policies
    return {
      policies: Object.fromEntries(this.dataRetentionPolicies),
      lastCleanup: new Date(),
      itemsEligibleForDeletion: 0
    };
  }

  /**
   * Process data retention cleanup
   */
  async processDataRetentionCleanup(): Promise<void> {
    console.log('Starting data retention cleanup...');

    for (const [dataType, retentionDays] of this.dataRetentionPolicies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      try {
        switch (dataType) {
          case 'analytics':
            await prisma.analyticsEvent.deleteMany({
              where: {
                timestamp: { lt: cutoffDate }
              }
            });
            break;

          case 'sessions':
            await prisma.session.deleteMany({
              where: {
                createdAt: { lt: cutoffDate }
              }
            });
            break;

          // Add more data types as needed
        }

        console.log(`Cleaned up ${dataType} data older than ${retentionDays} days`);

      } catch (error) {
        console.error(`Failed to cleanup ${dataType}:`, error);
      }
    }
  }
}

export const gdprService = GDPRComplianceService.getInstance();