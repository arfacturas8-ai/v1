import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';

export interface ModerationAction {
  type: 'warn' | 'timeout' | 'kick' | 'ban' | 'delete_message' | 'edit_message';
  targetId: string; // user or message ID
  moderatorId: string;
  serverId?: string;
  reason?: string;
  duration?: number; // for timeouts/bans in seconds
  metadata?: any;
}

export interface AutoModerationRule {
  id: string;
  serverId?: string; // null for global rules
  name: string;
  description: string;
  enabled: boolean;
  triggerType: 'content' | 'behavior' | 'spam' | 'links' | 'mentions';
  conditions: any;
  actions: Array<{
    type: string;
    parameters: any;
  }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ModerationService {
  private queue: Queue;
  private profanityFilter: Set<string>;
  private spamTracker: Map<string, Array<{ timestamp: number; content: string }>> = new Map();

  constructor(moderationQueue: Queue) {
    this.queue = moderationQueue;
    this.profanityFilter = new Set([
      // Basic profanity list - in production, use a comprehensive filter
      'spam', 'scam', 'hack', 'cheat'
    ]);
    this.initializeAutoModeration();
  }

  private initializeAutoModeration(): void {
    // Set up periodic cleanup of spam tracker
    setInterval(() => {
      this.cleanupSpamTracker();
    }, 60000); // Every minute
  }

  /**
   * Execute moderation action
   */
  async executeModerationAction(action: ModerationAction): Promise<void> {
    try {
      // Queue the moderation action
      await this.queue.add('execute-moderation', action);

      // Log the action in audit logs if it's server-specific
      if (action.serverId) {
        await this.logModerationAction(action);
      }

      console.log(`⚖️ Moderation action queued: ${action.type} by ${action.moderatorId}`);
    } catch (error) {
      console.error('Failed to execute moderation action:', error);
      throw new Error('Failed to execute moderation action');
    }
  }

  /**
   * Auto-moderate message content
   */
  async autoModerateMessage(messageId: string, content: string, userId: string, channelId: string, serverId?: string): Promise<boolean> {
    try {
      const violations: string[] = [];

      // Check for profanity
      if (this.containsProfanity(content)) {
        violations.push('profanity');
      }

      // Check for spam
      if (await this.isSpam(userId, content)) {
        violations.push('spam');
      }

      // Check for excessive mentions
      const mentions = (content.match(/@\w+/g) || []).length;
      if (mentions > 5) {
        violations.push('excessive_mentions');
      }

      // Check for excessive caps
      if (this.isExcessiveCaps(content)) {
        violations.push('excessive_caps');
      }

      // Check for suspicious links
      if (await this.containsSuspiciousLinks(content)) {
        violations.push('suspicious_links');
      }

      if (violations.length > 0) {
        await this.handleAutoModerationViolation(messageId, userId, violations, serverId);
        return true; // Message was moderated
      }

      return false; // No violations found
    } catch (error) {
      console.error('Auto-moderation failed:', error);
      return false;
    }
  }

  /**
   * Check if content contains profanity
   */
  private containsProfanity(content: string): boolean {
    const words = content.toLowerCase().split(/\s+/);
    return words.some(word => this.profanityFilter.has(word));
  }

  /**
   * Check if message is spam
   */
  private async isSpam(userId: string, content: string): Promise<boolean> {
    const now = Date.now();
    const userMessages = this.spamTracker.get(userId) || [];

    // Remove messages older than 30 seconds
    const recentMessages = userMessages.filter(msg => now - msg.timestamp < 30000);

    // Check for rapid messaging (more than 5 messages in 30 seconds)
    if (recentMessages.length >= 5) {
      return true;
    }

    // Check for duplicate content (same message 3+ times in 30 seconds)
    const duplicateCount = recentMessages.filter(msg => msg.content === content).length;
    if (duplicateCount >= 2) {
      return true;
    }

    // Add current message to tracker
    recentMessages.push({ timestamp: now, content });
    this.spamTracker.set(userId, recentMessages);

    return false;
  }

  /**
   * Check for excessive caps
   */
  private isExcessiveCaps(content: string): boolean {
    if (content.length < 10) return false;
    
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const capsRatio = capsCount / content.length;
    
    return capsRatio > 0.7; // More than 70% caps
  }

  /**
   * Check for suspicious links
   */
  private async containsSuspiciousLinks(content: string): Promise<boolean> {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    
    if (!urls) return false;

    // Check against known malicious domains (simplified check)
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'shorturl.at'];
    
    return urls.some(url => {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        return suspiciousDomains.some(suspicious => domain.includes(suspicious));
      } catch {
        return false;
      }
    });
  }

  /**
   * Handle auto-moderation violation
   */
  private async handleAutoModerationViolation(
    messageId: string,
    userId: string,
    violations: string[],
    serverId?: string
  ): Promise<void> {
    const severity = this.calculateViolationSeverity(violations);
    
    // Delete the message
    await this.queue.add('delete-message', {
      messageId,
      reason: `Auto-moderation: ${violations.join(', ')}`,
      moderatorId: 'system'
    });

    // Apply user punishment based on severity
    if (severity === 'high' || severity === 'critical') {
      await this.queue.add('timeout-user', {
        userId,
        duration: severity === 'critical' ? 3600 : 600, // 1 hour or 10 minutes
        reason: `Auto-moderation: ${violations.join(', ')}`,
        serverId
      });
    } else if (severity === 'medium') {
      await this.queue.add('warn-user', {
        userId,
        reason: `Auto-moderation warning: ${violations.join(', ')}`,
        serverId
      });
    }

    // Log the action
    await this.logAutoModerationAction(messageId, userId, violations, severity, serverId);
  }

  /**
   * Calculate violation severity
   */
  private calculateViolationSeverity(violations: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.includes('suspicious_links') || violations.includes('spam')) {
      return 'critical';
    }
    if (violations.includes('profanity') || violations.includes('excessive_mentions')) {
      return 'high';
    }
    if (violations.includes('excessive_caps')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Log moderation action in audit logs
   */
  private async logModerationAction(action: ModerationAction): Promise<void> {
    if (!action.serverId) return;

    try {
      await prisma.auditLog.create({
        data: {
          serverId: action.serverId,
          userId: action.moderatorId,
          targetId: action.targetId,
          actionType: this.getActionTypeId(action.type),
          reason: action.reason || null,
          options: action.metadata || null,
          changes: null
        }
      });
    } catch (error) {
      console.error('Failed to log moderation action:', error);
    }
  }

  /**
   * Log auto-moderation action
   */
  private async logAutoModerationAction(
    messageId: string,
    userId: string,
    violations: string[],
    severity: string,
    serverId?: string
  ): Promise<void> {
    try {
      if (serverId) {
        await prisma.auditLog.create({
          data: {
            serverId,
            userId: 'system',
            targetId: userId,
            actionType: 999, // Custom action type for auto-moderation
            reason: `Auto-moderation: ${violations.join(', ')}`,
            options: {
              messageId,
              violations,
              severity,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`🤖 Auto-moderation: ${violations.join(', ')} - Severity: ${severity}`);
    } catch (error) {
      console.error('Failed to log auto-moderation action:', error);
    }
  }

  /**
   * Get action type ID for audit logs
   */
  private getActionTypeId(actionType: string): number {
    const actionTypeMap: { [key: string]: number } = {
      'warn': 1,
      'timeout': 2,
      'kick': 3,
      'ban': 4,
      'delete_message': 5,
      'edit_message': 6
    };
    
    return actionTypeMap[actionType] || 0;
  }

  /**
   * Get user moderation history
   */
  async getUserModerationHistory(userId: string, serverId?: string): Promise<any[]> {
    try {
      const where: any = {
        targetId: userId
      };

      if (serverId) {
        where.serverId = serverId;
      }

      const history = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return history.map(log => ({
        id: log.id,
        actionType: this.getActionTypeName(log.actionType),
        moderatorId: log.userId,
        reason: log.reason,
        createdAt: log.createdAt,
        options: log.options,
        serverId: log.serverId
      }));
    } catch (error) {
      console.error('Failed to get moderation history:', error);
      return [];
    }
  }

  /**
   * Get action type name from ID
   */
  private getActionTypeName(actionTypeId: number): string {
    const actionNameMap: { [key: number]: string } = {
      1: 'warn',
      2: 'timeout',
      3: 'kick',
      4: 'ban',
      5: 'delete_message',
      6: 'edit_message',
      999: 'auto_moderation'
    };
    
    return actionNameMap[actionTypeId] || 'unknown';
  }

  /**
   * Clean up old spam tracker entries
   */
  private cleanupSpamTracker(): void {
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;

    for (const [userId, messages] of this.spamTracker.entries()) {
      const recentMessages = messages.filter(msg => msg.timestamp > thirtySecondsAgo);
      
      if (recentMessages.length === 0) {
        this.spamTracker.delete(userId);
      } else {
        this.spamTracker.set(userId, recentMessages);
      }
    }
  }

  /**
   * Check if user has permission to moderate
   */
  async hasModerationPermission(userId: string, serverId: string, action: string): Promise<boolean> {
    try {
      // Check if user is server owner
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        select: { ownerId: true }
      });

      if (server?.ownerId === userId) {
        return true;
      }

      // Check user roles and permissions
      const member = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId,
            userId
          }
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!member) return false;

      // Check if any role has moderation permissions
      return member.roles.some(memberRole => {
        const permissions = memberRole.role.permissions;
        // Check specific permissions based on action
        // This is a simplified check - implement proper permission system
        return permissions > 0n; // Basic check for any permissions
      });
    } catch (error) {
      console.error('Failed to check moderation permission:', error);
      return false;
    }
  }

  /**
   * Get server moderation statistics
   */
  async getModerationStats(serverId: string, days: number = 7): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const actions = await prisma.auditLog.findMany({
        where: {
          serverId,
          createdAt: { gte: since }
        }
      });

      const stats = {
        totalActions: actions.length,
        actionsByType: {} as { [key: string]: number },
        actionsByModerator: {} as { [key: string]: number },
        autoModerationCount: 0,
        mostCommonReason: 'N/A'
      };

      actions.forEach(action => {
        const actionType = this.getActionTypeName(action.actionType);
        stats.actionsByType[actionType] = (stats.actionsByType[actionType] || 0) + 1;
        
        if (action.userId) {
          stats.actionsByModerator[action.userId] = (stats.actionsByModerator[action.userId] || 0) + 1;
        }

        if (action.actionType === 999) {
          stats.autoModerationCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get moderation stats:', error);
      return null;
    }
  }
}