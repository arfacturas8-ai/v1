import { prisma } from '@cryb/database';
import { aiModerationService } from './ai-moderation';
import { queueManager } from './queue-manager';

interface ModerationResult {
  action: 'none' | 'flag' | 'hide' | 'remove' | 'quarantine' | 'ban_user';
  reason: string;
  confidence: number;
  auto_applied: boolean;
  violations: any[];
  analysis_id?: string;
}

interface ReportData {
  reporter_id: string;
  reported_user_id: string;
  content_id: string;
  content_type: string;
  category: string;
  subcategory?: string;
  description: string;
  evidence_urls?: string[];
  priority?: number;
  community_id?: string;
  server_id?: string;
}

interface ModerationAction {
  action_type: string;
  target_user_id: string;
  target_content_id?: string;
  target_content_type?: string;
  moderator_id?: string;
  reason: string;
  internal_notes?: string;
  duration_minutes?: number;
  severity_level?: number;
  auto_generated?: boolean;
  rule_triggered?: string;
  report_id?: string;
  community_id?: string;
  server_id?: string;
  metadata?: any;
}

export class ComprehensiveModerationService {
  /**
   * Moderate content (posts, comments, messages) with AI analysis and rule checking
   */
  async moderateContent(
    contentId: string,
    contentType: 'post' | 'comment' | 'message',
    content: string,
    userId: string,
    communityId?: string,
    serverId?: string,
    imageUrls?: string[]
  ): Promise<ModerationResult> {
    try {
      console.log(`🔍 Moderating ${contentType} ${contentId} by user ${userId}`);

      // 1. Analyze text content with AI
      const textAnalysis = await aiModerationService.analyzeTextContent(
        content,
        contentId,
        contentType,
        userId
      );

      // 2. Analyze images if present
      const imageAnalyses = [];
      if (imageUrls && imageUrls.length > 0) {
        for (const imageUrl of imageUrls) {
          try {
            const imageAnalysis = await aiModerationService.analyzeImageContent(
              imageUrl,
              `${contentId}_image_${imageAnalyses.length}`,
              userId
            );
            imageAnalyses.push(imageAnalysis);
          } catch (error) {
            console.error('Error analyzing image:', error);
          }
        }
      }

      // 3. Check against moderation rules
      const ruleCheck = await aiModerationService.checkModerationRules(
        textAnalysis,
        contentType,
        communityId,
        serverId
      );

      // 4. Analyze user behavior patterns
      const userBehavior = await aiModerationService.analyzeUserBehavior(userId);

      // 5. Determine final action
      const finalAction = this.determineFinalAction(
        textAnalysis,
        imageAnalyses,
        ruleCheck,
        userBehavior
      );

      // 6. Apply action if auto-action is enabled
      if (finalAction.auto_applied && finalAction.action !== 'none') {
        await this.applyModerationAction({
          action_type: finalAction.action,
          target_user_id: userId,
          target_content_id: contentId,
          target_content_type: contentType,
          reason: finalAction.reason,
          auto_generated: true,
          rule_triggered: ruleCheck.violated_rules[0]?.id,
          community_id: communityId,
          server_id: serverId,
          metadata: {
            ai_analysis: textAnalysis,
            image_analyses: imageAnalyses,
            user_behavior: userBehavior,
            confidence: finalAction.confidence,
          },
        });
      }

      // 7. Add to moderation queue if manual review needed
      if (finalAction.action !== 'none' && !finalAction.auto_applied) {
        await this.addToModerationQueue({
          content_id: contentId,
          content_type: contentType,
          content_preview: content.substring(0, 200),
          user_id: userId,
          triggered_rules: ruleCheck.violated_rules.map(r => r.id),
          confidence_score: finalAction.confidence,
          priority: this.calculatePriority(finalAction, ruleCheck),
          community_id: communityId,
          server_id: serverId,
          metadata: {
            ai_analysis: textAnalysis,
            image_analyses: imageAnalyses,
            user_behavior: userBehavior,
          },
        });
      }

      // 8. Update user moderation metrics
      await this.updateUserModerationMetrics(userId, finalAction);

      console.log(`✅ Moderation complete for ${contentType} ${contentId}: ${finalAction.action}`);

      return finalAction;
    } catch (error) {
      console.error('Error in content moderation:', error);
      return {
        action: 'none',
        reason: 'Moderation analysis failed',
        confidence: 0,
        auto_applied: false,
        violations: [],
      };
    }
  }

  /**
   * Process user report
   */
  async processReport(reportData: ReportData): Promise<string> {
    try {
      // 1. Create report record
      const reportId = await this.createReport(reportData);

      // 2. Check for duplicate reports
      const duplicateCheck = await this.checkForDuplicateReports(
        reportData.content_id,
        reportData.content_type,
        reportData.category
      );

      if (duplicateCheck.isDuplicate) {
        // Update existing report with additional evidence
        await this.updateReportWithDuplicate(reportId, duplicateCheck.originalReportId);
        return duplicateCheck.originalReportId;
      }

      // 3. Auto-moderate the reported content
      let content = '';
      try {
        content = await this.getContentText(reportData.content_id, reportData.content_type);
      } catch (error) {
        console.error('Error fetching content for moderation:', error);
      }

      if (content) {
        const moderationResult = await this.moderateContent(
          reportData.content_id,
          reportData.content_type as any,
          content,
          reportData.reported_user_id,
          reportData.community_id,
          reportData.server_id
        );

        // Link AI analysis to report
        if (moderationResult.analysis_id) {
          await this.linkReportToAnalysis(reportId, moderationResult.analysis_id);
        }
      }

      // 4. Calculate report priority and assign to moderator
      const priority = this.calculateReportPriority(reportData);
      await this.updateReportPriority(reportId, priority);

      // 5. Auto-assign to available moderator if high priority
      if (priority >= 3) {
        await this.autoAssignReport(reportId, reportData.community_id, reportData.server_id);
      }

      // 6. Send notifications
      await this.sendReportNotifications(reportId, reportData);

      console.log(`✅ Report ${reportId} processed successfully`);
      return reportId;
    } catch (error) {
      console.error('Error processing report:', error);
      throw error;
    }
  }

  /**
   * Apply moderation action (ban, mute, remove content, etc.)
   */
  async applyModerationAction(actionData: ModerationAction): Promise<string> {
    try {
      // 1. Create action record
      const actionId = await this.createModerationAction(actionData);

      // 2. Apply the actual moderation action
      switch (actionData.action_type) {
        case 'ban_user':
          await this.banUser(actionData.target_user_id, actionData.duration_minutes);
          break;
        case 'timeout':
          await this.timeoutUser(actionData.target_user_id, actionData.duration_minutes || 60);
          break;
        case 'mute':
          await this.muteUser(actionData.target_user_id, actionData.duration_minutes);
          break;
        case 'shadow_ban':
          await this.shadowBanUser(actionData.target_user_id, actionData.duration_minutes);
          break;
        case 'remove':
        case 'content_remove':
          await this.removeContent(actionData.target_content_id!, actionData.target_content_type!);
          break;
        case 'hide':
        case 'content_hide':
          await this.hideContent(actionData.target_content_id!, actionData.target_content_type!);
          break;
        case 'quarantine':
          await this.quarantineContent(
            actionData.target_content_id!,
            actionData.target_content_type!,
            actionData.reason,
            actionData.moderator_id
          );
          break;
        case 'warn':
          await this.warnUser(actionData.target_user_id, actionData.reason);
          break;
      }

      // 3. Update user moderation history
      await this.updateUserModerationHistory(actionData.target_user_id, actionData);

      // 4. Send notifications
      await this.sendModerationNotifications(actionId, actionData);

      // 5. Log action for audit trail
      await this.logModerationAction(actionId, actionData);

      console.log(`✅ Moderation action ${actionData.action_type} applied to user ${actionData.target_user_id}`);
      return actionId;
    } catch (error) {
      console.error('Error applying moderation action:', error);
      throw error;
    }
  }

  /**
   * Process moderation appeal
   */
  async processAppeal(
    actionId: string,
    appellantId: string,
    appealReason: string,
    evidence?: string,
    evidenceUrls?: string[]
  ): Promise<string> {
    try {
      // 1. Verify action exists and can be appealed
      const action = await this.getModerationAction(actionId);
      if (!action) {
        throw new Error('Moderation action not found');
      }

      if (action.target_user_id !== appellantId) {
        throw new Error('User can only appeal their own actions');
      }

      // 2. Check if appeal deadline has passed
      if (action.appeal_deadline && new Date() > new Date(action.appeal_deadline)) {
        throw new Error('Appeal deadline has passed');
      }

      // 3. Create appeal record
      const appealId = await this.createAppeal({
        action_id: actionId,
        appellant_id: appellantId,
        appeal_reason: appealReason,
        evidence_provided: evidence,
        evidence_urls: evidenceUrls || [],
      });

      // 4. Auto-assign to senior moderator
      await this.autoAssignAppeal(appealId);

      // 5. Send notifications
      await this.sendAppealNotifications(appealId);

      console.log(`✅ Appeal ${appealId} created for action ${actionId}`);
      return appealId;
    } catch (error) {
      console.error('Error processing appeal:', error);
      throw error;
    }
  }

  /**
   * Get moderation queue for moderators
   */
  async getModerationQueue(
    moderatorId: string,
    filters: {
      status?: string;
      priority?: number;
      content_type?: string;
      community_id?: string;
      server_id?: string;
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      // Build dynamic WHERE clause
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filters.status) {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(filters.status);
      }

      if (filters.priority) {
        whereClause += ` AND priority >= $${params.length + 1}`;
        params.push(filters.priority);
      }

      if (filters.content_type) {
        whereClause += ` AND content_type = $${params.length + 1}`;
        params.push(filters.content_type);
      }

      if (filters.community_id) {
        whereClause += ` AND community_id = $${params.length + 1}`;
        params.push(filters.community_id);
      }

      if (filters.server_id) {
        whereClause += ` AND server_id = $${params.length + 1}`;
        params.push(filters.server_id);
      }

      // Get items
      const itemsQuery = `
        SELECT mq.*, u.username, u.display_name,
               aca.toxicity_score, aca.flagged_categories
        FROM moderation_queue mq
        LEFT JOIN users u ON mq.user_id = u.id
        LEFT JOIN ai_content_analysis aca ON mq.ai_analysis_id = aca.id
        ${whereClause}
        ORDER BY priority DESC, created_at ASC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(pagination.limit, offset);
      
      const items = await prisma.$queryRawUnsafe(itemsQuery, ...params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total FROM moderation_queue mq ${whereClause}
      `;
      
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2));
      const total = parseInt((countResult as any)[0].total);

      return {
        items: items as any[],
        total,
        page: pagination.page,
        totalPages: Math.ceil(total / pagination.limit),
      };
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      return {
        items: [],
        total: 0,
        page: pagination.page,
        totalPages: 0,
      };
    }
  }

  /**
   * Get moderation analytics and metrics
   */
  async getModerationAnalytics(
    timeRange: '24h' | '7d' | '30d' | '90d' = '7d',
    communityId?: string,
    serverId?: string
  ): Promise<{
    summary: any;
    trends: any;
    top_violations: any[];
    moderator_performance: any[];
    ai_accuracy: any;
  }> {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      // Get summary metrics
      const summary = await this.getModerationSummary(timeFilter, communityId, serverId);
      
      // Get trend data
      const trends = await this.getModerationTrends(timeFilter, communityId, serverId);
      
      // Get top violations
      const topViolations = await this.getTopViolations(timeFilter, communityId, serverId);
      
      // Get moderator performance
      const moderatorPerformance = await this.getModeratorPerformance(timeFilter, communityId, serverId);
      
      // Get AI accuracy metrics
      const aiAccuracy = await this.getAIAccuracyMetrics(timeFilter, communityId, serverId);

      return {
        summary,
        trends,
        top_violations: topViolations,
        moderator_performance: moderatorPerformance,
        ai_accuracy: aiAccuracy,
      };
    } catch (error) {
      console.error('Error fetching moderation analytics:', error);
      return {
        summary: {},
        trends: {},
        top_violations: [],
        moderator_performance: [],
        ai_accuracy: {},
      };
    }
  }

  // Helper methods

  private determineFinalAction(
    textAnalysis: any,
    imageAnalyses: any[],
    ruleCheck: any,
    userBehavior: any
  ): ModerationResult {
    let maxSeverity = 0;
    let primaryViolation = null;
    let autoAction = false;

    // Check rule violations
    for (const rule of ruleCheck.violated_rules) {
      const severity = this.getSeverityScore(rule.severity);
      if (severity > maxSeverity) {
        maxSeverity = severity;
        primaryViolation = rule;
        autoAction = rule.auto_action;
      }
    }

    // Check image violations
    for (const imageAnalysis of imageAnalyses) {
      if (imageAnalysis.flagged) {
        const severity = 3; // High severity for flagged images
        if (severity > maxSeverity) {
          maxSeverity = severity;
          primaryViolation = { name: 'Image Content Violation', action: 'hide' };
          autoAction = true;
        }
      }
    }

    // Adjust based on user behavior
    if (userBehavior.risk_score > 70) {
      maxSeverity = Math.min(maxSeverity + 1, 4);
    }

    // Determine action
    let action = 'none';
    if (primaryViolation) {
      action = primaryViolation.action || this.getActionForSeverity(maxSeverity);
    }

    const confidence = Math.max(
      textAnalysis.overall_confidence,
      ...imageAnalyses.map(ia => ia.confidence_score)
    );

    return {
      action: action as any,
      reason: this.generateActionReason(primaryViolation, textAnalysis, userBehavior),
      confidence,
      auto_applied: autoAction && maxSeverity >= 3,
      violations: ruleCheck.violated_rules,
      analysis_id: textAnalysis.id,
    };
  }

  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 1;
    }
  }

  private getActionForSeverity(severity: number): string {
    switch (severity) {
      case 1: return 'flag';
      case 2: return 'hide';
      case 3: return 'remove';
      case 4: return 'quarantine';
      default: return 'flag';
    }
  }

  private generateActionReason(violation: any, textAnalysis: any, userBehavior: any): string {
    if (violation) {
      return `Content violated rule: ${violation.name}`;
    }
    
    if (textAnalysis.flagged_categories.length > 0) {
      return `AI detected potential issues: ${textAnalysis.flagged_categories.join(', ')}`;
    }
    
    return 'Content flagged for manual review';
  }

  private calculatePriority(action: ModerationResult, ruleCheck: any): number {
    let priority = 2; // Default medium priority
    
    if (action.confidence > 0.8) priority += 1;
    if (ruleCheck.violated_rules.some((r: any) => r.severity === 'critical')) priority = 4;
    if (action.action === 'ban_user' || action.action === 'quarantine') priority = 4;
    
    return Math.min(priority, 4);
  }

  private async createReport(reportData: ReportData): Promise<string> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO content_reports (
        id, reporter_id, reported_user_id, content_id, content_type,
        report_category, report_subcategory, description, evidence_urls,
        priority, community_id, server_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, 
      reportId, reportData.reporter_id, reportData.reported_user_id,
      reportData.content_id, reportData.content_type, reportData.category,
      reportData.subcategory, reportData.description, JSON.stringify(reportData.evidence_urls || []),
      reportData.priority || 2, reportData.community_id, reportData.server_id
    );
    
    return reportId;
  }

  private async createModerationAction(actionData: ModerationAction): Promise<string> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const expiresAt = actionData.duration_minutes 
      ? new Date(Date.now() + actionData.duration_minutes * 60 * 1000)
      : null;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO moderation_actions (
        id, action_type, target_user_id, target_content_id, target_content_type,
        moderator_id, reason, internal_notes, duration_minutes, severity_level,
        auto_generated, rule_triggered, report_id, community_id, server_id,
        metadata, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `,
      actionId, actionData.action_type, actionData.target_user_id,
      actionData.target_content_id, actionData.target_content_type,
      actionData.moderator_id, actionData.reason, actionData.internal_notes,
      actionData.duration_minutes, actionData.severity_level || 1,
      actionData.auto_generated || false, actionData.rule_triggered,
      actionData.report_id, actionData.community_id, actionData.server_id,
      JSON.stringify(actionData.metadata || {}), expiresAt
    );
    
    return actionId;
  }

  private async banUser(userId: string, durationMinutes?: number): Promise<void> {
    const bannedUntil = durationMinutes 
      ? new Date(Date.now() + durationMinutes * 60 * 1000)
      : null;
    
    await prisma.user.update({
      where: { id: userId },
      data: { 
        bannedAt: new Date(),
        // Add bannedUntil to user model if needed
      },
    });
  }

  private async shadowBanUser(userId: string, durationMinutes?: number): Promise<void> {
    const expiresAt = durationMinutes 
      ? new Date(Date.now() + durationMinutes * 60 * 1000)
      : null;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO shadow_bans (id, user_id, reason, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET 
        expires_at = $4, created_at = NOW()
    `, `shadow_${userId}_${Date.now()}`, userId, 'Auto-moderation', expiresAt);
  }

  private async quarantineContent(
    contentId: string,
    contentType: string,
    reason: string,
    moderatorId?: string
  ): Promise<void> {
    await prisma.$executeRawUnsafe(`
      INSERT INTO content_quarantine (
        id, content_id, content_type, reason, quarantined_by, quarantine_level
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, 
      `quarantine_${contentId}_${Date.now()}`, contentId, contentType, 
      reason, moderatorId, 2
    );
  }

  private async removeContent(contentId: string, contentType: string): Promise<void> {
    switch (contentType) {
      case 'post':
        await prisma.post.update({
          where: { id: contentId },
          data: { isRemoved: true }
        });
        break;
      case 'comment':
        // Add comment removal logic
        break;
      case 'message':
        // Add message removal logic
        break;
    }
  }

  private async hideContent(contentId: string, contentType: string): Promise<void> {
    // Add content hiding logic (similar to remove but less severe)
    await this.removeContent(contentId, contentType);
  }

  private async addToModerationQueue(queueData: any): Promise<void> {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO moderation_queue (
        id, content_id, content_type, content_preview, user_id,
        triggered_rules, confidence_score, priority, community_id,
        server_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
      queueId, queueData.content_id, queueData.content_type,
      queueData.content_preview, queueData.user_id,
      JSON.stringify(queueData.triggered_rules), queueData.confidence_score,
      queueData.priority, queueData.community_id, queueData.server_id,
      JSON.stringify(queueData.metadata)
    );
  }

  // Additional helper methods would be implemented here
  private async timeoutUser(userId: string, minutes: number): Promise<void> {
    // Implementation for timing out users
  }

  private async muteUser(userId: string, durationMinutes?: number): Promise<void> {
    // Implementation for muting users
  }

  private async warnUser(userId: string, reason: string): Promise<void> {
    // Implementation for warning users
  }

  private async updateUserModerationHistory(userId: string, action: ModerationAction): Promise<void> {
    // Implementation for updating user history
  }

  private async updateUserModerationMetrics(userId: string, result: ModerationResult): Promise<void> {
    // Implementation for updating metrics
  }

  private async sendModerationNotifications(actionId: string, action: ModerationAction): Promise<void> {
    // Implementation for sending notifications
  }

  private async sendReportNotifications(reportId: string, reportData: ReportData): Promise<void> {
    // Implementation for sending report notifications
  }

  private async logModerationAction(actionId: string, action: ModerationAction): Promise<void> {
    // Implementation for audit logging
  }

  private async checkForDuplicateReports(contentId: string, contentType: string, category: string): Promise<any> {
    // Implementation for duplicate detection
    return { isDuplicate: false, originalReportId: null };
  }

  private async getContentText(contentId: string, contentType: string): Promise<string> {
    // Implementation for fetching content text
    return '';
  }

  private async getModerationAction(actionId: string): Promise<any> {
    // Implementation for fetching moderation actions
    return null;
  }

  private async createAppeal(appealData: any): Promise<string> {
    // Implementation for creating appeals
    return `appeal_${Date.now()}`;
  }

  private calculateReportPriority(reportData: ReportData): number {
    // Implementation for calculating report priority
    return 2;
  }

  private async updateReportPriority(reportId: string, priority: number): Promise<void> {
    // Implementation for updating report priority
  }

  private async autoAssignReport(reportId: string, communityId?: string, serverId?: string): Promise<void> {
    // Implementation for auto-assigning reports
  }

  private async autoAssignAppeal(appealId: string): Promise<void> {
    // Implementation for auto-assigning appeals
  }

  private async sendAppealNotifications(appealId: string): Promise<void> {
    // Implementation for appeal notifications
  }

  private async updateReportWithDuplicate(reportId: string, originalReportId: string): Promise<void> {
    // Implementation for handling duplicate reports
  }

  private async linkReportToAnalysis(reportId: string, analysisId: string): Promise<void> {
    // Implementation for linking reports to AI analysis
  }

  private getTimeFilter(timeRange: string): string {
    switch (timeRange) {
      case '24h': return "created_at >= NOW() - INTERVAL '24 hours'";
      case '7d': return "created_at >= NOW() - INTERVAL '7 days'";
      case '30d': return "created_at >= NOW() - INTERVAL '30 days'";
      case '90d': return "created_at >= NOW() - INTERVAL '90 days'";
      default: return "created_at >= NOW() - INTERVAL '7 days'";
    }
  }

  private async getModerationSummary(timeFilter: string, communityId?: string, serverId?: string): Promise<any> {
    // Implementation for getting summary metrics
    return {};
  }

  private async getModerationTrends(timeFilter: string, communityId?: string, serverId?: string): Promise<any> {
    // Implementation for getting trend data
    return {};
  }

  private async getTopViolations(timeFilter: string, communityId?: string, serverId?: string): Promise<any[]> {
    // Implementation for getting top violations
    return [];
  }

  private async getModeratorPerformance(timeFilter: string, communityId?: string, serverId?: string): Promise<any[]> {
    // Implementation for getting moderator performance
    return [];
  }

  private async getAIAccuracyMetrics(timeFilter: string, communityId?: string, serverId?: string): Promise<any> {
    // Implementation for getting AI accuracy metrics
    return {};
  }
}

export const comprehensiveModerationService = new ComprehensiveModerationService();