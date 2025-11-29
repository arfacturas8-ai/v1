import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { AIModerationService } from './ai-moderation';

interface ModerationActionData {
  contentId: string;
  contentType: 'post' | 'comment' | 'message';
  result: any;
  userId?: string;
  context?: {
    communityId?: string;
    serverId?: string;
    parentContentId?: string;
  };
  timestamp: string;
}

interface UserActionData {
  userId: string;
  actionType: 'warn' | 'timeout' | 'ban' | 'shadow_ban';
  reason: string;
  duration?: number; // in minutes
  moderatorId?: string;
  severity: number;
  context?: any;
}

export class ModerationQueueProcessor {
  private worker: Worker;
  private userActionWorker: Worker;
  private prisma: PrismaClient;
  private redis: Redis;
  private moderationService: AIModerationService;

  constructor(
    prisma: PrismaClient,
    redis: Redis,
    moderationService: AIModerationService
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.moderationService = moderationService;

    // Initialize workers
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // Main moderation action processor
    this.worker = new Worker(
      'process-moderation-action',
      async (job: Job<ModerationActionData>) => {
        await this.processModerationAction(job.data);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6380'),
          password: process.env.REDIS_PASSWORD
        },
        concurrency: 5,
        removeOnComplete: 100,
        removeOnFail: 50
      }
    );

    // User action processor (bans, warnings, etc.)
    this.userActionWorker = new Worker(
      'process-user-action',
      async (job: Job<UserActionData>) => {
        await this.processUserAction(job.data);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6380'),
          password: process.env.REDIS_PASSWORD
        },
        concurrency: 3,
        removeOnComplete: 100,
        removeOnFail: 50
      }
    );

    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.worker.on('failed', (job, err) => {
      console.error(`Moderation job ${job?.id} failed:`, err);
    });

    this.userActionWorker.on('failed', (job, err) => {
      console.error(`User action job ${job?.id} failed:`, err);
    });

    this.worker.on('completed', (job) => {
      console.log(`✅ Moderation job ${job.id} completed`);
    });

    this.userActionWorker.on('completed', (job) => {
      console.log(`✅ User action job ${job.id} completed`);
    });
  }

  private async processModerationAction(data: ModerationActionData): Promise<void> {
    try {
      const { contentId, contentType, result, userId, context } = data;

      console.log(`🔍 Processing moderation action for ${contentType} ${contentId}: ${result.recommended_action}`);

      // Execute the recommended action
      switch (result.recommended_action) {
        case 'remove':
          await this.removeContent(contentId, contentType, result, userId);
          break;
        case 'quarantine':
          await this.quarantineContent(contentId, contentType, result, userId, context);
          break;
        case 'hide':
          await this.hideContent(contentId, contentType, result, userId);
          break;
        case 'flag':
          await this.flagContent(contentId, contentType, result, userId, context);
          break;
        case 'ban_user':
          if (userId) {
            await this.banUser(userId, result, context);
          }
          break;
        default:
          console.log(`No action needed for ${contentType} ${contentId}`);
      }

      // Update user moderation history
      if (userId && result.recommended_action !== 'none') {
        await this.updateUserModerationHistory(userId, result);
      }

      // Log the action
      await this.logModerationAction(contentId, contentType, result, userId, context);

    } catch (error) {
      console.error('Error processing moderation action:', error);
      throw error;
    }
  }

  private async removeContent(
    contentId: string,
    contentType: string,
    result: any,
    userId?: string
  ): Promise<void> {
    try {
      // Mark content as removed in database
      switch (contentType) {
        case 'post':
          await this.prisma.$executeRaw`
            UPDATE posts SET is_removed = true, removed_reason = ${result.reason || 'AI moderation'} 
            WHERE id = ${contentId}
          `;
          break;
        case 'comment':
          await this.prisma.$executeRaw`
            UPDATE comments SET is_removed = true, removed_reason = ${result.reason || 'AI moderation'} 
            WHERE id = ${contentId}
          `;
          break;
        case 'message':
          await this.prisma.$executeRaw`
            UPDATE messages SET flags = flags | 1 WHERE id = ${contentId}
          `;
          break;
      }

      // Create moderation action record
      await this.createModerationAction({
        action_type: 'content_remove',
        target_content_id: contentId,
        target_content_type: contentType,
        target_user_id: userId,
        reason: result.reason || 'Content removed by AI moderation',
        auto_generated: true,
        severity_level: 4,
        metadata: { ai_analysis: result }
      });

      console.log(`🚫 Removed ${contentType} ${contentId}`);
    } catch (error) {
      console.error('Error removing content:', error);
      throw error;
    }
  }

  private async quarantineContent(
    contentId: string,
    contentType: string,
    result: any,
    userId?: string,
    context?: any
  ): Promise<void> {
    try {
      // Add to quarantine table
      await this.prisma.$executeRaw`
        INSERT INTO content_quarantine (
          content_id, content_type, reason, quarantined_by, 
          quarantine_level, ai_triggered, auto_release_at,
          community_id, server_id, metadata
        ) VALUES (
          ${contentId}, ${contentType}, ${result.reason || 'AI moderation'},
          'system', 2, true, ${new Date(Date.now() + 24 * 60 * 60 * 1000)},
          ${context?.communityId || null}, ${context?.serverId || null},
          ${JSON.stringify({ ai_analysis: result })}
        )
      `;

      // Add to moderation queue for human review
      await this.addToModerationQueue(contentId, contentType, result, userId, context);

      console.log(`⚠️ Quarantined ${contentType} ${contentId} for review`);
    } catch (error) {
      console.error('Error quarantining content:', error);
      throw error;
    }
  }

  private async hideContent(
    contentId: string,
    contentType: string,
    result: any,
    userId?: string
  ): Promise<void> {
    try {
      // Mark content as hidden (but not removed)
      switch (contentType) {
        case 'post':
          await this.prisma.$executeRaw`
            UPDATE posts SET is_hidden = true, hidden_reason = ${result.reason || 'AI moderation'} 
            WHERE id = ${contentId}
          `;
          break;
        case 'comment':
          await this.prisma.$executeRaw`
            UPDATE comments SET is_hidden = true, hidden_reason = ${result.reason || 'AI moderation'} 
            WHERE id = ${contentId}
          `;
          break;
        case 'message':
          await this.prisma.$executeRaw`
            UPDATE messages SET flags = flags | 2 WHERE id = ${contentId}
          `;
          break;
      }

      await this.createModerationAction({
        action_type: 'content_hide',
        target_content_id: contentId,
        target_content_type: contentType,
        target_user_id: userId,
        reason: result.reason || 'Content hidden by AI moderation',
        auto_generated: true,
        severity_level: 2,
        metadata: { ai_analysis: result }
      });

      console.log(`👁️ Hidden ${contentType} ${contentId}`);
    } catch (error) {
      console.error('Error hiding content:', error);
      throw error;
    }
  }

  private async flagContent(
    contentId: string,
    contentType: string,
    result: any,
    userId?: string,
    context?: any
  ): Promise<void> {
    try {
      // Add to moderation queue for human review
      await this.addToModerationQueue(contentId, contentType, result, userId, context);

      // Create auto-generated report
      await this.prisma.$executeRaw`
        INSERT INTO content_reports (
          reporter_id, reported_user_id, content_id, content_type,
          report_category, description, auto_generated, ai_analysis_id,
          priority, community_id, server_id
        ) VALUES (
          null, ${userId || null}, ${contentId}, ${contentType},
          'ai_flagged', ${result.reason || 'Flagged by AI moderation'},
          true, null, 2, ${context?.communityId || null}, ${context?.serverId || null}
        )
      `;

      console.log(`🚩 Flagged ${contentType} ${contentId} for review`);
    } catch (error) {
      console.error('Error flagging content:', error);
      throw error;
    }
  }

  private async addToModerationQueue(
    contentId: string,
    contentType: string,
    result: any,
    userId?: string,
    context?: any
  ): Promise<void> {
    // Get content preview
    const contentPreview = await this.getContentPreview(contentId, contentType);
    
    await this.prisma.$executeRaw`
      INSERT INTO moderation_queue (
        content_id, content_type, content_preview, user_id,
        triggered_rules, confidence_score, priority,
        community_id, server_id, metadata
      ) VALUES (
        ${contentId}, ${contentType}, ${contentPreview},
        ${userId || null}, ${JSON.stringify(result.flagged_categories)},
        ${result.overall_confidence}, ${this.calculatePriority(result)},
        ${context?.communityId || null}, ${context?.serverId || null},
        ${JSON.stringify({ ai_analysis: result })}
      )
    `;
  }

  private async getContentPreview(contentId: string, contentType: string): Promise<string> {
    try {
      let content = '';
      switch (contentType) {
        case 'post':
          const post = await this.prisma.$queryRaw`SELECT title, content FROM posts WHERE id = ${contentId}` as any[];
          content = post[0] ? `${post[0].title}\n${post[0].content}` : '';
          break;
        case 'comment':
          const comment = await this.prisma.$queryRaw`SELECT content FROM comments WHERE id = ${contentId}` as any[];
          content = comment[0]?.content || '';
          break;
        case 'message':
          const message = await this.prisma.$queryRaw`SELECT content FROM messages WHERE id = ${contentId}` as any[];
          content = message[0]?.content || '';
          break;
      }
      return content.substring(0, 500); // Limit preview length
    } catch (error) {
      console.error('Error getting content preview:', error);
      return 'Content preview unavailable';
    }
  }

  private calculatePriority(result: any): number {
    if (result.recommended_action === 'remove' || result.recommended_action === 'ban_user') {
      return 4; // Critical
    }
    if (result.recommended_action === 'quarantine') {
      return 3; // High
    }
    if (result.recommended_action === 'hide') {
      return 2; // Medium
    }
    return 1; // Low
  }

  private async banUser(userId: string, result: any, context?: any): Promise<void> {
    try {
      // Determine ban duration based on severity
      const duration = this.calculateBanDuration(result);
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

      await this.createModerationAction({
        action_type: 'ban',
        target_user_id: userId,
        reason: `Automatic ban due to severe content violations: ${result.reason}`,
        auto_generated: true,
        severity_level: 5,
        duration_minutes: duration,
        expires_at: expiresAt,
        community_id: context?.communityId,
        server_id: context?.serverId,
        metadata: { ai_analysis: result }
      });

      // Update user banned status
      await this.prisma.$executeRaw`
        UPDATE users SET banned_at = NOW() WHERE id = ${userId}
      `;

      console.log(`🔨 Banned user ${userId} for ${duration ? `${duration} minutes` : 'permanently'}`);
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  private calculateBanDuration(result: any): number | null {
    // Calculate ban duration based on severity and violation types
    const maxScore = Math.max(...Object.values(result.scores || {}));
    
    if (result.flagged_categories.includes('self_harm') || result.flagged_categories.includes('threat')) {
      return null; // Permanent ban
    }
    
    if (maxScore > 0.9) {
      return 7 * 24 * 60; // 7 days
    }
    
    if (maxScore > 0.8) {
      return 3 * 24 * 60; // 3 days
    }
    
    if (maxScore > 0.7) {
      return 24 * 60; // 1 day
    }
    
    return 60; // 1 hour
  }

  private async updateUserModerationHistory(userId: string, result: any): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO user_moderation_history (
          user_id, total_reports, total_warnings, total_timeouts, 
          total_bans, total_content_removed, risk_score, 
          last_violation, strikes, updated_at
        ) VALUES (
          ${userId}, 1, 
          ${result.recommended_action === 'warn' ? 1 : 0},
          ${result.recommended_action === 'timeout' ? 1 : 0},
          ${result.recommended_action === 'ban_user' ? 1 : 0},
          ${['remove', 'quarantine', 'hide'].includes(result.recommended_action) ? 1 : 0},
          ${this.calculateRiskScore(result)}, NOW(), 1, NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          total_reports = user_moderation_history.total_reports + 1,
          total_warnings = user_moderation_history.total_warnings + ${result.recommended_action === 'warn' ? 1 : 0},
          total_timeouts = user_moderation_history.total_timeouts + ${result.recommended_action === 'timeout' ? 1 : 0},
          total_bans = user_moderation_history.total_bans + ${result.recommended_action === 'ban_user' ? 1 : 0},
          total_content_removed = user_moderation_history.total_content_removed + ${['remove', 'quarantine', 'hide'].includes(result.recommended_action) ? 1 : 0},
          risk_score = LEAST(user_moderation_history.risk_score + ${this.calculateRiskScore(result)}, 100.0),
          last_violation = NOW(),
          strikes = LEAST(user_moderation_history.strikes + 1, 10),
          updated_at = NOW()
      `;
    } catch (error) {
      console.error('Error updating user moderation history:', error);
    }
  }

  private calculateRiskScore(result: any): number {
    const maxScore = Math.max(...Object.values(result.scores || {}));
    return Math.min(maxScore * 20, 20); // Scale to 0-20 points
  }

  private async createModerationAction(data: any): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO moderation_actions (
          action_type, target_user_id, target_content_id, target_content_type,
          moderator_id, reason, internal_notes, duration_minutes, severity_level,
          auto_generated, rule_triggered, community_id, server_id, metadata,
          status, expires_at
        ) VALUES (
          ${data.action_type}, ${data.target_user_id || null}, 
          ${data.target_content_id || null}, ${data.target_content_type || null},
          ${data.moderator_id || null}, ${data.reason}, ${data.internal_notes || null},
          ${data.duration_minutes || null}, ${data.severity_level || 1},
          ${data.auto_generated || false}, ${data.rule_triggered || null},
          ${data.community_id || null}, ${data.server_id || null},
          ${JSON.stringify(data.metadata || {})}, 'active', ${data.expires_at || null}
        )
      `;
    } catch (error) {
      console.error('Error creating moderation action:', error);
    }
  }

  private async logModerationAction(
    contentId: string,
    contentType: string,
    result: any,
    userId?: string,
    context?: any
  ): Promise<void> {
    try {
      // Log to moderation metrics
      await this.prisma.$executeRaw`
        INSERT INTO moderation_metrics (
          metric_type, metric_value, metric_data, 
          community_id, server_id, date_recorded
        ) VALUES (
          'ai_action_taken', 1, ${JSON.stringify({
            action: result.recommended_action,
            content_type: contentType,
            confidence: result.overall_confidence,
            categories: result.flagged_categories
          })},
          ${context?.communityId || null}, ${context?.serverId || null},
          CURRENT_DATE
        )
      `;

      // Update Redis metrics
      const today = new Date().toISOString().split('T')[0];
      await this.redis.hincrby(`moderation:metrics:${today}`, 'total_actions', 1);
      await this.redis.hincrby(`moderation:metrics:${today}`, `action:${result.recommended_action}`, 1);
      await this.redis.hincrby(`moderation:metrics:${today}`, `type:${contentType}`, 1);

    } catch (error) {
      console.error('Error logging moderation action:', error);
    }
  }

  private async processUserAction(data: UserActionData): Promise<void> {
    try {
      const { userId, actionType, reason, duration, moderatorId, severity, context } = data;

      console.log(`👤 Processing user action: ${actionType} for user ${userId}`);

      switch (actionType) {
        case 'warn':
          await this.warnUser(userId, reason, moderatorId, context);
          break;
        case 'timeout':
          await this.timeoutUser(userId, reason, duration || 60, moderatorId, context);
          break;
        case 'ban':
          await this.banUserAction(userId, reason, duration, moderatorId, context);
          break;
        case 'shadow_ban':
          await this.shadowBanUser(userId, reason, duration, moderatorId, context);
          break;
      }

      // Update user moderation history
      await this.updateUserActionHistory(userId, actionType, severity);

    } catch (error) {
      console.error('Error processing user action:', error);
      throw error;
    }
  }

  private async warnUser(userId: string, reason: string, moderatorId?: string, context?: any): Promise<void> {
    await this.createModerationAction({
      action_type: 'warn',
      target_user_id: userId,
      moderator_id: moderatorId,
      reason,
      severity_level: 1,
      community_id: context?.communityId,
      server_id: context?.serverId
    });

    // Send notification to user (implement notification system)
    console.log(`⚠️ Warning issued to user ${userId}: ${reason}`);
  }

  private async timeoutUser(userId: string, reason: string, duration: number, moderatorId?: string, context?: any): Promise<void> {
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    await this.createModerationAction({
      action_type: 'timeout',
      target_user_id: userId,
      moderator_id: moderatorId,
      reason,
      duration_minutes: duration,
      severity_level: 2,
      expires_at: expiresAt,
      community_id: context?.communityId,
      server_id: context?.serverId
    });

    console.log(`⏰ User ${userId} timed out for ${duration} minutes`);
  }

  private async banUserAction(userId: string, reason: string, duration?: number, moderatorId?: string, context?: any): Promise<void> {
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

    await this.createModerationAction({
      action_type: 'ban',
      target_user_id: userId,
      moderator_id: moderatorId,
      reason,
      duration_minutes: duration,
      severity_level: 4,
      expires_at: expiresAt,
      community_id: context?.communityId,
      server_id: context?.serverId
    });

    // Update user banned status
    await this.prisma.$executeRaw`
      UPDATE users SET banned_at = NOW() WHERE id = ${userId}
    `;

    console.log(`🔨 User ${userId} banned ${duration ? `for ${duration} minutes` : 'permanently'}`);
  }

  private async shadowBanUser(userId: string, reason: string, duration?: number, moderatorId?: string, context?: any): Promise<void> {
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

    await this.prisma.$executeRaw`
      INSERT INTO shadow_bans (
        user_id, banned_by, reason, visibility_level,
        affects_posts, affects_comments, affects_messages,
        community_id, server_id, expires_at
      ) VALUES (
        ${userId}, ${moderatorId || 'system'}, ${reason}, 0.1,
        true, true, false, ${context?.communityId || null},
        ${context?.serverId || null}, ${expiresAt}
      )
    `;

    console.log(`👻 User ${userId} shadow banned ${duration ? `for ${duration} minutes` : 'permanently'}`);
  }

  private async updateUserActionHistory(userId: string, actionType: string, severity: number): Promise<void> {
    const incrementField = {
      warn: 'total_warnings',
      timeout: 'total_timeouts',
      ban: 'total_bans',
      shadow_ban: 'total_bans'
    }[actionType] || 'total_warnings';

    await this.prisma.$executeRaw`
      INSERT INTO user_moderation_history (
        user_id, ${incrementField}, strikes, risk_score, last_violation, updated_at
      ) VALUES (
        ${userId}, 1, 1, ${severity * 5}, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        ${incrementField} = user_moderation_history.${incrementField} + 1,
        strikes = LEAST(user_moderation_history.strikes + 1, 10),
        risk_score = LEAST(user_moderation_history.risk_score + ${severity * 5}, 100.0),
        last_violation = NOW(),
        updated_at = NOW()
    `;
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down moderation queue processors...');
    await Promise.all([
      this.worker.close(),
      this.userActionWorker.close()
    ]);
    console.log('✅ Moderation queue processors shut down');
  }
}

export const createModerationQueueProcessor = (
  prisma: PrismaClient,
  redis: Redis,
  moderationService: AIModerationService
): ModerationQueueProcessor => {
  return new ModerationQueueProcessor(prisma, redis, moderationService);
};