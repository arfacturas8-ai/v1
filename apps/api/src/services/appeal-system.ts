import { prisma } from '@cryb/database';
import { queueManager } from './queue-manager';

interface AppealData {
  action_id: string;
  appellant_id: string;
  appeal_reason: string;
  evidence_provided?: string;
  evidence_urls: string[];
}

interface AppealReview {
  appeal_id: string;
  reviewer_id: string;
  decision: 'approved' | 'denied' | 'partial_approval';
  review_notes: string;
  decision_reason: string;
  modified_action?: {
    action_type?: string;
    duration_minutes?: number;
    severity_level?: number;
  };
}

interface AppealWorkflow {
  id: string;
  name: string;
  conditions: any;
  auto_assign_rules: any;
  escalation_rules: any;
  deadline_hours: number;
}

export class AppealSystemService {
  /**
   * Submit an appeal for a moderation action
   */
  async submitAppeal(appealData: AppealData): Promise<string> {
    try {
      // 1. Validate the moderation action exists and can be appealed
      const action = await this.getModerationAction(appealData.action_id);
      if (!action) {
        throw new Error('Moderation action not found');
      }

      if (action.target_user_id !== appealData.appellant_id) {
        throw new Error('You can only appeal actions taken against your own account');
      }

      // 2. Check if appeal deadline has passed
      if (action.appeal_deadline && new Date() > new Date(action.appeal_deadline)) {
        throw new Error('Appeal deadline has passed');
      }

      // 3. Check if appeal already exists
      const existingAppeal = await this.getExistingAppeal(appealData.action_id, appealData.appellant_id);
      if (existingAppeal) {
        throw new Error('An appeal for this action has already been submitted');
      }

      // 4. Create appeal record
      const appealId = await this.createAppeal(appealData);

      // 5. Determine appeal workflow
      const workflow = await this.getAppealWorkflow(action);
      
      // 6. Auto-assign based on workflow rules
      await this.autoAssignAppeal(appealId, workflow);

      // 7. Set deadline
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + workflow.deadline_hours);
      await this.setAppealDeadline(appealId, deadline);

      // 8. Create notification for reviewers
      await this.notifyAppealReviewers(appealId, appealData);

      // 9. Log appeal submission
      await this.logAppealEvent(appealId, 'submitted', {
        action_id: appealData.action_id,
        appellant_id: appealData.appellant_id,
      });

      // 10. Queue appeal processing job
      await queueManager.addJob('appeal_processing', {
        appeal_id: appealId,
        workflow_id: workflow.id,
      });

      console.log(`✅ Appeal ${appealId} submitted successfully`);
      return appealId;
    } catch (error) {
      console.error('Error submitting appeal:', error);
      throw error;
    }
  }

  /**
   * Review an appeal (moderator/admin action)
   */
  async reviewAppeal(reviewData: AppealReview): Promise<void> {
    try {
      // 1. Validate reviewer permissions
      const hasPermission = await this.checkReviewPermission(
        reviewData.reviewer_id,
        reviewData.appeal_id
      );
      if (!hasPermission) {
        throw new Error('Insufficient permissions to review this appeal');
      }

      // 2. Get appeal details
      const appeal = await this.getAppeal(reviewData.appeal_id);
      if (!appeal) {
        throw new Error('Appeal not found');
      }

      if (appeal.status !== 'pending' && appeal.status !== 'reviewing') {
        throw new Error('Appeal has already been reviewed');
      }

      // 3. Update appeal with review decision
      await this.updateAppealReview(reviewData);

      // 4. Apply decision
      switch (reviewData.decision) {
        case 'approved':
          await this.approveAppeal(appeal, reviewData);
          break;
        case 'denied':
          await this.denyAppeal(appeal, reviewData);
          break;
        case 'partial_approval':
          await this.partiallyApproveAppeal(appeal, reviewData);
          break;
      }

      // 5. Notify appellant of decision
      await this.notifyAppellant(appeal, reviewData);

      // 6. Log review action
      await this.logAppealEvent(reviewData.appeal_id, 'reviewed', {
        reviewer_id: reviewData.reviewer_id,
        decision: reviewData.decision,
      });

      // 7. Update moderation metrics
      await this.updateAppealMetrics(reviewData);

      console.log(`✅ Appeal ${reviewData.appeal_id} reviewed: ${reviewData.decision}`);
    } catch (error) {
      console.error('Error reviewing appeal:', error);
      throw error;
    }
  }

  /**
   * Get appeals queue for reviewers
   */
  async getAppealsQueue(
    reviewerId: string,
    filters: {
      status?: string;
      priority?: string;
      assigned_only?: boolean;
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    appeals: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      // Build query conditions
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filters.status) {
        whereClause += ` AND ma.status = $${params.length + 1}`;
        params.push(filters.status);
      }

      if (filters.assigned_only) {
        whereClause += ` AND ma.reviewer_id = $${params.length + 1}`;
        params.push(reviewerId);
      }

      // Get appeals
      const appealsQuery = `
        SELECT 
          ma.*,
          mod_action.action_type,
          mod_action.reason as original_reason,
          mod_action.duration_minutes,
          appellant.username as appellant_username,
          appellant.display_name as appellant_display_name,
          reviewer.username as reviewer_username
        FROM moderation_appeals ma
        LEFT JOIN moderation_actions mod_action ON ma.action_id = mod_action.id
        LEFT JOIN users appellant ON ma.appellant_id = appellant.id
        LEFT JOIN users reviewer ON ma.reviewer_id = reviewer.id
        ${whereClause}
        ORDER BY ma.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(pagination.limit, offset);
      
      const appeals = await prisma.$queryRawUnsafe(appealsQuery, ...params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM moderation_appeals ma 
        LEFT JOIN moderation_actions mod_action ON ma.action_id = mod_action.id
        ${whereClause}
      `;
      
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2));
      const total = parseInt((countResult as any)[0].total);

      return {
        appeals: appeals as any[],
        total,
        page: pagination.page,
        totalPages: Math.ceil(total / pagination.limit),
      };
    } catch (error) {
      console.error('Error fetching appeals queue:', error);
      return {
        appeals: [],
        total: 0,
        page: pagination.page,
        totalPages: 0,
      };
    }
  }

  /**
   * Get appeal statistics and metrics
   */
  async getAppealMetrics(
    timeRange: '24h' | '7d' | '30d' | '90d' = '7d'
  ): Promise<{
    total_appeals: number;
    pending_appeals: number;
    approval_rate: number;
    avg_response_time_hours: number;
    overturned_actions: number;
    appeal_categories: any[];
  }> {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const metrics = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as total_appeals,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_appeals,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_appeals,
          COUNT(*) FILTER (WHERE status = 'denied') as denied_appeals,
          AVG(
            CASE 
              WHEN reviewed_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600 
            END
          ) as avg_response_time_hours
        FROM moderation_appeals
        WHERE ${timeFilter}
      `);

      const result = (metrics as any[])[0];
      
      const approval_rate = result.total_appeals > 0 
        ? result.approved_appeals / result.total_appeals 
        : 0;

      // Get appeal categories breakdown
      const categories = await prisma.$queryRawUnsafe(`
        SELECT 
          mod_action.action_type,
          COUNT(*) as appeal_count,
          COUNT(*) FILTER (WHERE ma.status = 'approved') as approved_count
        FROM moderation_appeals ma
        LEFT JOIN moderation_actions mod_action ON ma.action_id = mod_action.id
        WHERE ma.created_at >= NOW() - INTERVAL '${timeRange === '24h' ? '24 hours' : timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}'
        GROUP BY mod_action.action_type
        ORDER BY appeal_count DESC
      `);

      return {
        total_appeals: parseInt(result.total_appeals),
        pending_appeals: parseInt(result.pending_appeals),
        approval_rate,
        avg_response_time_hours: parseFloat(result.avg_response_time_hours) || 0,
        overturned_actions: parseInt(result.approved_appeals),
        appeal_categories: categories as any[],
      };
    } catch (error) {
      console.error('Error fetching appeal metrics:', error);
      return {
        total_appeals: 0,
        pending_appeals: 0,
        approval_rate: 0,
        avg_response_time_hours: 0,
        overturned_actions: 0,
        appeal_categories: [],
      };
    }
  }

  /**
   * Auto-escalate overdue appeals
   */
  async processOverdueAppeals(): Promise<void> {
    try {
      const overdueAppeals = await prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_appeals
        WHERE status IN ('pending', 'reviewing')
        AND deadline < NOW()
        AND created_at >= NOW() - INTERVAL '30 days'
      `);

      for (const appeal of overdueAppeals as any[]) {
        await this.escalateAppeal(appeal.id, 'deadline_exceeded');
      }

      console.log(`📊 Processed ${(overdueAppeals as any[]).length} overdue appeals`);
    } catch (error) {
      console.error('Error processing overdue appeals:', error);
    }
  }

  // Helper methods

  private async getModerationAction(actionId: string): Promise<any> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_actions WHERE id = $1
      `, actionId);
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('Error fetching moderation action:', error);
      return null;
    }
  }

  private async getExistingAppeal(actionId: string, appellantId: string): Promise<any> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_appeals 
        WHERE action_id = $1 AND appellant_id = $2
      `, actionId, appellantId);
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('Error checking existing appeal:', error);
      return null;
    }
  }

  private async createAppeal(appealData: AppealData): Promise<string> {
    const appealId = `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO moderation_appeals (
        id, action_id, appellant_id, appeal_reason, 
        evidence_provided, evidence_urls, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
    `, 
      appealId, appealData.action_id, appealData.appellant_id,
      appealData.appeal_reason, appealData.evidence_provided,
      JSON.stringify(appealData.evidence_urls)
    );
    
    return appealId;
  }

  private async getAppealWorkflow(action: any): Promise<AppealWorkflow> {
    // Default workflow - could be made configurable
    return {
      id: 'default',
      name: 'Default Appeal Workflow',
      conditions: {},
      auto_assign_rules: {
        senior_moderator_required: action.severity_level >= 4,
        escalate_if_no_response: 24,
      },
      escalation_rules: {
        escalate_after_hours: 48,
        escalate_to_admin: action.action_type === 'ban',
      },
      deadline_hours: 72,
    };
  }

  private async autoAssignAppeal(appealId: string, workflow: AppealWorkflow): Promise<void> {
    try {
      // Find available senior moderator or admin
      const availableReviewer = await this.findAvailableReviewer(workflow);
      
      if (availableReviewer) {
        await prisma.$executeRawUnsafe(`
          UPDATE moderation_appeals 
          SET reviewer_id = $1, status = 'reviewing'
          WHERE id = $2
        `, availableReviewer.id, appealId);
      }
    } catch (error) {
      console.error('Error auto-assigning appeal:', error);
    }
  }

  private async findAvailableReviewer(workflow: AppealWorkflow): Promise<any> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT u.id, u.username
        FROM users u
        JOIN moderator_permissions mp ON u.id = mp.user_id
        WHERE mp.can_manage_appeals = true
        AND mp.permission_level IN ('senior', 'admin', 'super_admin')
        ORDER BY (
          SELECT COUNT(*) FROM moderation_appeals 
          WHERE reviewer_id = u.id AND status = 'reviewing'
        ) ASC
        LIMIT 1
      `);
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('Error finding available reviewer:', error);
      return null;
    }
  }

  private async setAppealDeadline(appealId: string, deadline: Date): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE moderation_appeals 
        SET deadline = $1
        WHERE id = $2
      `, deadline, appealId);
    } catch (error) {
      console.error('Error setting appeal deadline:', error);
    }
  }

  private async getAppeal(appealId: string): Promise<any> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_appeals WHERE id = $1
      `, appealId);
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('Error fetching appeal:', error);
      return null;
    }
  }

  private async checkReviewPermission(reviewerId: string, appealId: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT mp.can_manage_appeals
        FROM moderator_permissions mp
        WHERE mp.user_id = $1 AND mp.can_manage_appeals = true
      `, reviewerId);
      
      return (result as any[]).length > 0;
    } catch (error) {
      console.error('Error checking review permission:', error);
      return false;
    }
  }

  private async updateAppealReview(reviewData: AppealReview): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE moderation_appeals 
        SET reviewer_id = $1, status = $2, review_notes = $3,
            decision_reason = $4, reviewed_at = NOW()
        WHERE id = $5
      `, 
        reviewData.reviewer_id, reviewData.decision, reviewData.review_notes,
        reviewData.decision_reason, reviewData.appeal_id
      );
    } catch (error) {
      console.error('Error updating appeal review:', error);
    }
  }

  private async approveAppeal(appeal: any, reviewData: AppealReview): Promise<void> {
    try {
      // Reverse the original moderation action
      await prisma.$executeRawUnsafe(`
        UPDATE moderation_actions 
        SET status = 'overturned', reversed_at = NOW(), reversed_by = $1
        WHERE id = $2
      `, reviewData.reviewer_id, appeal.action_id);

      // If it was a ban, unban the user
      if (appeal.action_type === 'ban') {
        await prisma.user.update({
          where: { id: appeal.appellant_id },
          data: { bannedAt: null },
        });
      }

      // Remove from quarantine if applicable
      await prisma.$executeRawUnsafe(`
        UPDATE content_quarantine 
        SET status = 'released', released_at = NOW(), released_by = $1
        WHERE content_id IN (
          SELECT target_content_id FROM moderation_actions WHERE id = $2
        )
      `, reviewData.reviewer_id, appeal.action_id);

    } catch (error) {
      console.error('Error approving appeal:', error);
    }
  }

  private async denyAppeal(appeal: any, reviewData: AppealReview): Promise<void> {
    // Appeal denied - no action needed on original moderation action
    console.log(`Appeal ${appeal.id} denied`);
  }

  private async partiallyApproveAppeal(appeal: any, reviewData: AppealReview): Promise<void> {
    try {
      if (reviewData.modified_action) {
        // Update the original action with modified parameters
        const updates = [];
        const params = [];
        let paramCount = 0;

        if (reviewData.modified_action.duration_minutes !== undefined) {
          updates.push(`duration_minutes = $${++paramCount}`);
          params.push(reviewData.modified_action.duration_minutes);
        }

        if (reviewData.modified_action.severity_level !== undefined) {
          updates.push(`severity_level = $${++paramCount}`);
          params.push(reviewData.modified_action.severity_level);
        }

        if (updates.length > 0) {
          params.push(appeal.action_id);
          await prisma.$executeRawUnsafe(`
            UPDATE moderation_actions 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount + 1}
          `, ...params);
        }
      }
    } catch (error) {
      console.error('Error partially approving appeal:', error);
    }
  }

  private async escalateAppeal(appealId: string, reason: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE moderation_appeals 
        SET status = 'escalated'
        WHERE id = $1
      `, appealId);

      await this.logAppealEvent(appealId, 'escalated', { reason });
    } catch (error) {
      console.error('Error escalating appeal:', error);
    }
  }

  private async notifyAppealReviewers(appealId: string, appealData: AppealData): Promise<void> {
    // Implementation for notifying reviewers
    console.log(`Notifying reviewers about appeal ${appealId}`);
  }

  private async notifyAppellant(appeal: any, reviewData: AppealReview): Promise<void> {
    // Implementation for notifying appellant of decision
    console.log(`Notifying appellant about appeal decision: ${reviewData.decision}`);
  }

  private async logAppealEvent(appealId: string, event: string, data: any): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO appeal_logs (appeal_id, event_type, event_data, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `, appealId, event, JSON.stringify(data));
    } catch (error) {
      console.error('Error logging appeal event:', error);
    }
  }

  private async updateAppealMetrics(reviewData: AppealReview): Promise<void> {
    // Implementation for updating appeal metrics
    console.log(`Updating appeal metrics for decision: ${reviewData.decision}`);
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
}

export const appealSystemService = new AppealSystemService();