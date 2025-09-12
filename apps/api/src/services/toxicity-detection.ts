import { AIIntegrationService, ModerationResult, ContentAnalysisResult } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';

export interface ToxicityConfig {
  thresholds: {
    harassment: number;
    hate: number;
    selfHarm: number;
    sexual: number;
    violence: number;
  };
  autoModeration: {
    enabled: boolean;
    deleteThreshold: number;
    warnThreshold: number;
    timeoutThreshold: number;
    banThreshold: number;
  };
  whitelist: string[];
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  name: string;
  conditions: {
    violationType: string[];
    severity: number;
    repeatOffenses: number;
    timeWindow: number; // in hours
  };
  actions: {
    type: 'warn' | 'timeout' | 'kick' | 'ban';
    duration?: number; // in seconds
    notify: boolean;
    reason: string;
  }[];
}

export interface ToxicityAnalysis {
  content: string;
  userId: string;
  channelId: string;
  serverId?: string;
  result: ModerationResult;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
  escalated: boolean;
  processed: boolean;
}

export class ToxicityDetectionService {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private config: ToxicityConfig;
  private violationCache: Map<string, Array<{ timestamp: number; severity: string }>> = new Map();

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    this.startCleanupScheduler();
  }

  /**
   * Analyze content for toxicity and take appropriate action
   */
  async analyzeAndModerate(
    messageId: string,
    content: string,
    userId: string,
    channelId: string,
    serverId?: string
  ): Promise<ToxicityAnalysis> {
    try {
      // Skip whitelisted users
      if (this.config.whitelist.includes(userId)) {
        return this.createSafeResult(content, userId, channelId, serverId);
      }

      // Perform comprehensive content analysis
      const analysisResult = await this.aiService.analyzeContent(content, userId, {
        checkToxicity: true,
        checkSentiment: true,
        checkProfanity: true,
        checkNsfw: true
      });

      // Extract toxicity result
      const toxicityResult = analysisResult.toxicity;
      if (!toxicityResult) {
        return this.createSafeResult(content, userId, channelId, serverId);
      }

      // Calculate severity based on scores
      const severity = this.calculateSeverity(toxicityResult);
      
      // Determine required actions
      const actions = await this.determineActions(
        toxicityResult,
        severity,
        userId,
        serverId
      );

      // Create analysis object
      const analysis: ToxicityAnalysis = {
        content,
        userId,
        channelId,
        serverId,
        result: toxicityResult,
        severity,
        actions,
        escalated: false,
        processed: false
      };

      // Execute moderation actions if needed
      if (this.config.autoModeration.enabled && actions.length > 0) {
        await this.executeActions(messageId, analysis);
        analysis.processed = true;
      }

      // Log the analysis
      await this.logToxicityAnalysis(messageId, analysis);

      // Update user violation history
      this.updateViolationHistory(userId, severity);

      return analysis;

    } catch (error) {
      console.error('Toxicity analysis failed:', error);
      return this.createSafeResult(content, userId, channelId, serverId);
    }
  }

  /**
   * Calculate toxicity severity based on OpenAI moderation scores
   */
  private calculateSeverity(result: ModerationResult): 'low' | 'medium' | 'high' | 'critical' {
    const scores = result.category_scores;
    const maxScore = Math.max(...Object.values(scores));

    // Check for critical violations (immediate action required)
    if (
      scores['self-harm'] > 0.8 ||
      scores['self-harm/intent'] > 0.8 ||
      scores['harassment/threatening'] > 0.9 ||
      scores['hate/threatening'] > 0.9 ||
      scores['violence/graphic'] > 0.9 ||
      scores['sexual/minors'] > 0.5
    ) {
      return 'critical';
    }

    // High severity violations
    if (
      maxScore > this.config.thresholds.violence ||
      maxScore > this.config.thresholds.hate ||
      maxScore > this.config.thresholds.harassment
    ) {
      return 'high';
    }

    // Medium severity violations
    if (
      maxScore > this.config.thresholds.sexual ||
      maxScore > this.config.thresholds.selfHarm ||
      result.flagged
    ) {
      return 'medium';
    }

    // Low severity (borderline content)
    if (maxScore > 0.3) {
      return 'low';
    }

    return 'low';
  }

  /**
   * Determine appropriate moderation actions based on toxicity analysis
   */
  private async determineActions(
    result: ModerationResult,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId: string,
    serverId?: string
  ): Promise<string[]> {
    const actions: string[] = [];

    // Always delete flagged content above threshold
    if (result.flagged || severity === 'critical') {
      actions.push('delete_message');
    }

    // Check user's violation history for escalation
    const violations = this.violationCache.get(userId) || [];
    const recentViolations = violations.filter(
      v => Date.now() - v.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    // Apply escalation rules
    for (const rule of this.config.escalationRules) {
      if (this.matchesEscalationRule(rule, result, severity, recentViolations)) {
        actions.push(...rule.actions.map(action => action.type));
        break; // Apply first matching rule only
      }
    }

    // Default actions based on severity if no escalation rules matched
    if (actions.length === 0) {
      switch (severity) {
        case 'critical':
          actions.push('delete_message', 'timeout', 'notify_moderators');
          break;
        case 'high':
          if (recentViolations.length >= 2) {
            actions.push('delete_message', 'timeout');
          } else {
            actions.push('delete_message', 'warn');
          }
          break;
        case 'medium':
          if (recentViolations.length >= 3) {
            actions.push('delete_message', 'warn');
          } else {
            actions.push('warn');
          }
          break;
        case 'low':
          // Only log for pattern analysis
          actions.push('log_only');
          break;
      }
    }

    return Array.from(new Set(actions)); // Remove duplicates
  }

  /**
   * Check if escalation rule conditions are met
   */
  private matchesEscalationRule(
    rule: EscalationRule,
    result: ModerationResult,
    severity: string,
    recentViolations: Array<{ timestamp: number; severity: string }>
  ): boolean {
    // Check violation type
    const violationTypes = Object.keys(result.categories).filter(
      key => result.categories[key as keyof typeof result.categories]
    );
    
    const hasMatchingType = rule.conditions.violationType.some(type =>
      violationTypes.includes(type)
    );

    if (!hasMatchingType) return false;

    // Check severity threshold
    const maxScore = Math.max(...Object.values(result.category_scores));
    if (maxScore < rule.conditions.severity) return false;

    // Check repeat offenses
    if (recentViolations.length < rule.conditions.repeatOffenses) return false;

    return true;
  }

  /**
   * Execute moderation actions
   */
  private async executeActions(messageId: string, analysis: ToxicityAnalysis): Promise<void> {
    for (const action of analysis.actions) {
      try {
        switch (action) {
          case 'delete_message':
            await this.queue.add('delete-message', {
              messageId,
              reason: `Toxicity detection: ${analysis.severity}`,
              moderatorId: 'system'
            });
            break;

          case 'warn':
            await this.queue.add('warn-user', {
              userId: analysis.userId,
              reason: `Automated warning: Toxic content detected`,
              serverId: analysis.serverId,
              channelId: analysis.channelId
            });
            break;

          case 'timeout':
            const timeoutDuration = this.getTimeoutDuration(analysis.severity);
            await this.queue.add('timeout-user', {
              userId: analysis.userId,
              duration: timeoutDuration,
              reason: `Automated timeout: Toxic content (${analysis.severity})`,
              serverId: analysis.serverId
            });
            break;

          case 'kick':
            await this.queue.add('kick-user', {
              userId: analysis.userId,
              reason: `Automated kick: Severe toxic content`,
              serverId: analysis.serverId
            });
            break;

          case 'ban':
            await this.queue.add('ban-user', {
              userId: analysis.userId,
              reason: `Automated ban: Critical toxic content`,
              serverId: analysis.serverId,
              duration: this.getBanDuration(analysis.severity)
            });
            break;

          case 'notify_moderators':
            await this.queue.add('notify-moderators', {
              userId: analysis.userId,
              content: analysis.content,
              severity: analysis.severity,
              serverId: analysis.serverId,
              channelId: analysis.channelId
            });
            break;

          case 'log_only':
            // Just log, no action needed
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${action}:`, error);
      }
    }
  }

  /**
   * Get timeout duration based on severity
   */
  private getTimeoutDuration(severity: string): number {
    switch (severity) {
      case 'critical': return 24 * 60 * 60; // 24 hours
      case 'high': return 4 * 60 * 60; // 4 hours
      case 'medium': return 1 * 60 * 60; // 1 hour
      case 'low': return 15 * 60; // 15 minutes
      default: return 1 * 60 * 60;
    }
  }

  /**
   * Get ban duration based on severity
   */
  private getBanDuration(severity: string): number {
    switch (severity) {
      case 'critical': return 7 * 24 * 60 * 60; // 7 days
      case 'high': return 3 * 24 * 60 * 60; // 3 days
      case 'medium': return 1 * 24 * 60 * 60; // 1 day
      default: return 1 * 24 * 60 * 60;
    }
  }

  /**
   * Log toxicity analysis for audit and learning
   */
  private async logToxicityAnalysis(messageId: string, analysis: ToxicityAnalysis): Promise<void> {
    try {
      if (analysis.serverId) {
        await prisma.auditLog.create({
          data: {
            serverId: analysis.serverId,
            userId: 'system',
            targetId: analysis.userId,
            actionType: 998, // Toxicity analysis action type
            reason: `Toxicity detected: ${analysis.severity}`,
            options: {
              messageId,
              toxicityResult: analysis.result,
              severity: analysis.severity,
              actions: analysis.actions,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`🔍 Toxicity analysis: ${analysis.severity} - Actions: ${analysis.actions.join(', ')}`);
    } catch (error) {
      console.error('Failed to log toxicity analysis:', error);
    }
  }

  /**
   * Update user violation history
   */
  private updateViolationHistory(userId: string, severity: string): void {
    const violations = this.violationCache.get(userId) || [];
    violations.push({ timestamp: Date.now(), severity });
    
    // Keep only violations from last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentViolations = violations.filter(v => v.timestamp > thirtyDaysAgo);
    
    this.violationCache.set(userId, recentViolations);
  }

  /**
   * Create safe result for non-toxic content
   */
  private createSafeResult(
    content: string,
    userId: string,
    channelId: string,
    serverId?: string
  ): ToxicityAnalysis {
    return {
      content,
      userId,
      channelId,
      serverId,
      result: {
        flagged: false,
        categories: {
          harassment: false,
          'harassment/threatening': false,
          hate: false,
          'hate/threatening': false,
          'self-harm': false,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          sexual: false,
          'sexual/minors': false,
          violence: false,
          'violence/graphic': false,
        },
        category_scores: {
          harassment: 0,
          'harassment/threatening': 0,
          hate: 0,
          'hate/threatening': 0,
          'self-harm': 0,
          'self-harm/intent': 0,
          'self-harm/instructions': 0,
          sexual: 0,
          'sexual/minors': 0,
          violence: 0,
          'violence/graphic': 0,
        }
      },
      severity: 'low',
      actions: [],
      escalated: false,
      processed: false
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ToxicityConfig {
    return {
      thresholds: {
        harassment: 0.7,
        hate: 0.8,
        selfHarm: 0.9,
        sexual: 0.8,
        violence: 0.8,
      },
      autoModeration: {
        enabled: true,
        deleteThreshold: 0.7,
        warnThreshold: 0.5,
        timeoutThreshold: 0.8,
        banThreshold: 0.9,
      },
      whitelist: [],
      escalationRules: [
        {
          name: 'Repeat Harassment',
          conditions: {
            violationType: ['harassment', 'harassment/threatening'],
            severity: 0.6,
            repeatOffenses: 3,
            timeWindow: 24
          },
          actions: [
            { type: 'timeout', duration: 24 * 60 * 60, notify: true, reason: 'Repeat harassment violations' }
          ]
        },
        {
          name: 'Hate Speech Escalation',
          conditions: {
            violationType: ['hate', 'hate/threatening'],
            severity: 0.7,
            repeatOffenses: 2,
            timeWindow: 24
          },
          actions: [
            { type: 'ban', duration: 7 * 24 * 60 * 60, notify: true, reason: 'Hate speech violations' }
          ]
        },
        {
          name: 'Self-Harm Crisis',
          conditions: {
            violationType: ['self-harm', 'self-harm/intent'],
            severity: 0.8,
            repeatOffenses: 1,
            timeWindow: 1
          },
          actions: [
            { type: 'warn', notify: true, reason: 'Crisis intervention resources provided' }
          ]
        }
      ]
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ToxicityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get user violation history
   */
  getUserViolationHistory(userId: string): Array<{ timestamp: number; severity: string }> {
    return this.violationCache.get(userId) || [];
  }

  /**
   * Clean up old violation data
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      for (const [userId, violations] of this.violationCache.entries()) {
        const recentViolations = violations.filter(v => v.timestamp > thirtyDaysAgo);
        
        if (recentViolations.length === 0) {
          this.violationCache.delete(userId);
        } else {
          this.violationCache.set(userId, recentViolations);
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalAnalyses: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    cacheSize: number;
  } {
    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};
    let totalAnalyses = 0;

    for (const violations of this.violationCache.values()) {
      totalAnalyses += violations.length;
      for (const violation of violations) {
        violationsBySeverity[violation.severity] = 
          (violationsBySeverity[violation.severity] || 0) + 1;
      }
    }

    return {
      totalAnalyses,
      violationsByType,
      violationsBySeverity,
      cacheSize: this.violationCache.size,
    };
  }
}