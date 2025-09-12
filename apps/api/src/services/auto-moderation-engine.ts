import { AIIntegrationService } from './ai-integration';
import { ToxicityDetectionService } from './toxicity-detection';
import { SpamDetectionService } from './spam-detection';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';

export interface AutoModerationRule {
  id: string;
  name: string;
  description: string;
  serverId?: string; // null for global rules
  channelIds?: string[]; // specific channels, null for all
  enabled: boolean;
  priority: number; // 1-10, higher = more important
  conditions: RuleCondition[];
  actions: RuleAction[];
  triggers: RuleTrigger[];
  exemptions: RuleExemption[];
  schedule?: RuleSchedule;
  metadata: {
    createdBy: string;
    createdAt: Date;
    lastModified: Date;
    executionCount: number;
    successCount: number;
    failureCount: number;
  };
}

export interface RuleCondition {
  type: 'content' | 'user' | 'behavior' | 'context' | 'time' | 'frequency';
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'in_range' | 'not_equals';
  field: string;
  value: any;
  weight: number; // 0-1, how much this condition contributes
  negated?: boolean;
}

export interface RuleAction {
  type: 'delete_message' | 'warn_user' | 'timeout_user' | 'kick_user' | 'ban_user' | 
        'add_role' | 'remove_role' | 'quarantine' | 'flag' | 'notify_moderators' | 
        'send_dm' | 'log_event' | 'escalate' | 'custom_webhook';
  parameters: {
    duration?: number; // for timeouts/bans in seconds
    reason?: string;
    roleId?: string;
    message?: string;
    webhookUrl?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  };
  conditions?: ActionCondition[]; // Additional conditions for this action
  delay?: number; // Delay before executing in milliseconds
}

export interface ActionCondition {
  field: string;
  operator: string;
  value: any;
}

export interface RuleTrigger {
  event: 'message_create' | 'message_update' | 'user_join' | 'user_leave' | 
         'reaction_add' | 'voice_join' | 'role_add' | 'ban_add' | 'scheduled';
  filters?: { [key: string]: any };
}

export interface RuleExemption {
  type: 'user' | 'role' | 'channel' | 'time_range' | 'condition';
  values: string[] | { start: Date; end: Date } | RuleCondition[];
}

export interface RuleSchedule {
  type: 'interval' | 'cron' | 'one_time';
  expression: string; // cron expression or interval in ms
  timezone?: string;
}

export interface ModerationContext {
  messageId?: string;
  userId: string;
  serverId?: string;
  channelId?: string;
  content?: string;
  timestamp: Date;
  userRoles?: string[];
  channelType?: string;
  messageType?: string;
  attachments?: any[];
  embeds?: any[];
  mentions?: string[];
  reactions?: any[];
  editHistory?: any[];
  userProfile?: any;
  serverSettings?: any;
}

export interface RuleExecutionResult {
  ruleId: string;
  executed: boolean;
  matched: boolean;
  conditionResults: { [conditionId: string]: boolean };
  actionsExecuted: string[];
  errors: string[];
  processingTime: number;
  confidence: number;
}

export class AutoModerationEngine {
  private aiService: AIIntegrationService;
  private toxicityService: ToxicityDetectionService;
  private spamService: SpamDetectionService;
  private queue: Queue;
  private rules: Map<string, AutoModerationRule> = new Map();
  private ruleCache: Map<string, { result: any; timestamp: number }> = new Map();
  private executionMetrics: Map<string, { executions: number; successes: number; failures: number }> = new Map();

  constructor(
    aiService: AIIntegrationService,
    toxicityService: ToxicityDetectionService,
    spamService: SpamDetectionService,
    moderationQueue: Queue
  ) {
    this.aiService = aiService;
    this.toxicityService = toxicityService;
    this.spamService = spamService;
    this.queue = moderationQueue;
    
    this.initializeDefaultRules();
    this.startRuleProcessor();
  }

  /**
   * Process a moderation event through all applicable rules
   */
  async processEvent(
    eventType: string,
    context: ModerationContext
  ): Promise<RuleExecutionResult[]> {
    const startTime = Date.now();
    const results: RuleExecutionResult[] = [];
    
    try {
      // Get applicable rules
      const applicableRules = this.getApplicableRules(eventType, context);
      
      // Sort rules by priority (higher first)
      applicableRules.sort((a, b) => b.priority - a.priority);

      // Process rules sequentially to respect priority
      for (const rule of applicableRules) {
        try {
          const result = await this.executeRule(rule, context);
          results.push(result);
          
          // Update rule metrics
          this.updateRuleMetrics(rule.id, result);
          
          // If a high-priority rule blocks further processing, break
          if (result.matched && this.shouldStopProcessing(rule, result)) {
            break;
          }
        } catch (error) {
          console.error(`Rule execution failed for ${rule.id}:`, error);
          results.push({
            ruleId: rule.id,
            executed: false,
            matched: false,
            conditionResults: {},
            actionsExecuted: [],
            errors: [error.message],
            processingTime: 0,
            confidence: 0
          });
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`🤖 Processed ${applicableRules.length} rules in ${totalTime}ms`);
      
      return results;
    } catch (error) {
      console.error('Auto-moderation processing failed:', error);
      return [];
    }
  }

  /**
   * Execute a single rule
   */
  private async executeRule(
    rule: AutoModerationRule,
    context: ModerationContext
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    const result: RuleExecutionResult = {
      ruleId: rule.id,
      executed: true,
      matched: false,
      conditionResults: {},
      actionsExecuted: [],
      errors: [],
      processingTime: 0,
      confidence: 0
    };

    try {
      // Check exemptions first
      if (await this.checkExemptions(rule, context)) {
        result.matched = false;
        result.processingTime = Date.now() - startTime;
        return result;
      }

      // Evaluate conditions
      const conditionResults = await this.evaluateConditions(rule.conditions, context);
      result.conditionResults = conditionResults;

      // Calculate overall match confidence
      const confidence = this.calculateRuleConfidence(rule.conditions, conditionResults);
      result.confidence = confidence;

      // Check if rule matches (all conditions must be true or weighted score above threshold)
      const matched = this.isRuleMatched(rule.conditions, conditionResults, confidence);
      result.matched = matched;

      if (matched) {
        // Execute actions
        const actionsExecuted = await this.executeActions(rule.actions, context);
        result.actionsExecuted = actionsExecuted;

        // Log rule execution
        await this.logRuleExecution(rule, context, result);
      }

      result.processingTime = Date.now() - startTime;
      return result;

    } catch (error) {
      result.errors.push(error.message);
      result.processingTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Evaluate rule conditions
   */
  private async evaluateConditions(
    conditions: RuleCondition[],
    context: ModerationContext
  ): Promise<{ [conditionId: string]: boolean }> {
    const results: { [conditionId: string]: boolean } = {};

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionId = `condition_${i}`;
      
      try {
        let value = await this.getContextValue(condition.field, context);
        let conditionMet = this.evaluateCondition(condition, value);
        
        if (condition.negated) {
          conditionMet = !conditionMet;
        }
        
        results[conditionId] = conditionMet;
      } catch (error) {
        console.error(`Condition evaluation failed:`, error);
        results[conditionId] = false;
      }
    }

    return results;
  }

  /**
   * Get value from context based on field path
   */
  private async getContextValue(field: string, context: ModerationContext): Promise<any> {
    const fieldParts = field.split('.');
    let value: any = context;

    for (const part of fieldParts) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[part];
    }

    // Handle special computed fields
    if (field.startsWith('ai.')) {
      return await this.getAIAnalysisValue(field, context);
    }

    if (field.startsWith('user.')) {
      return await this.getUserValue(field, context);
    }

    if (field.startsWith('server.')) {
      return await this.getServerValue(field, context);
    }

    return value;
  }

  /**
   * Get AI analysis values
   */
  private async getAIAnalysisValue(field: string, context: ModerationContext): Promise<any> {
    if (!context.content || !context.userId) return null;

    try {
      const analysis = await this.aiService.analyzeContent(context.content, context.userId, {
        checkToxicity: true,
        checkSpam: true,
        checkSentiment: true,
        checkProfanity: true,
        checkNsfw: true,
        extractEntities: true,
        categorize: true
      });

      switch (field) {
        case 'ai.toxicity.flagged':
          return analysis.toxicity?.flagged || false;
        case 'ai.toxicity.score':
          return Math.max(...Object.values(analysis.toxicity?.category_scores || {}));
        case 'ai.spam':
          return analysis.spam;
        case 'ai.sentiment.score':
          return analysis.sentiment.score;
        case 'ai.profanity':
          return analysis.profanity;
        case 'ai.nsfw':
          return analysis.nsfw;
        case 'ai.language':
          return analysis.language;
        case 'ai.categories':
          return analysis.categories;
        case 'ai.confidence':
          return analysis.confidence;
        default:
          return null;
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      return null;
    }
  }

  /**
   * Get user-specific values
   */
  private async getUserValue(field: string, context: ModerationContext): Promise<any> {
    try {
      switch (field) {
        case 'user.id':
          return context.userId;
        case 'user.roles':
          return context.userRoles || [];
        case 'user.messageCount':
          return await this.getUserMessageCount(context.userId, context.serverId);
        case 'user.joinDate':
          return await this.getUserJoinDate(context.userId, context.serverId);
        case 'user.violations':
          return await this.getUserViolations(context.userId, context.serverId);
        default:
          return null;
      }
    } catch (error) {
      console.error('User value retrieval failed:', error);
      return null;
    }
  }

  /**
   * Get server-specific values
   */
  private async getServerValue(field: string, context: ModerationContext): Promise<any> {
    try {
      switch (field) {
        case 'server.id':
          return context.serverId;
        case 'server.memberCount':
          return await this.getServerMemberCount(context.serverId);
        default:
          return null;
      }
    } catch (error) {
      console.error('Server value retrieval failed:', error);
      return null;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, value: any): boolean {
    const { operator, value: conditionValue } = condition;

    switch (operator) {
      case 'equals':
        return value === conditionValue;
      case 'not_equals':
        return value !== conditionValue;
      case 'contains':
        return typeof value === 'string' && value.toLowerCase().includes(conditionValue.toLowerCase());
      case 'matches':
        return new RegExp(conditionValue, 'gi').test(value);
      case 'greater_than':
        return parseFloat(value) > parseFloat(conditionValue);
      case 'less_than':
        return parseFloat(value) < parseFloat(conditionValue);
      case 'in_range':
        const num = parseFloat(value);
        return num >= conditionValue.min && num <= conditionValue.max;
      default:
        return false;
    }
  }

  /**
   * Calculate rule confidence based on condition weights
   */
  private calculateRuleConfidence(
    conditions: RuleCondition[],
    results: { [conditionId: string]: boolean }
  ): number {
    if (conditions.length === 0) return 0;

    let totalWeight = 0;
    let metWeight = 0;

    conditions.forEach((condition, index) => {
      const conditionId = `condition_${index}`;
      const weight = condition.weight || (1 / conditions.length);
      totalWeight += weight;
      
      if (results[conditionId]) {
        metWeight += weight;
      }
    });

    return totalWeight > 0 ? metWeight / totalWeight : 0;
  }

  /**
   * Check if rule is matched based on conditions and confidence
   */
  private isRuleMatched(
    conditions: RuleCondition[],
    results: { [conditionId: string]: boolean },
    confidence: number
  ): boolean {
    // If any condition has weight >= 1, it must be true
    const criticalConditions = conditions.filter((c, i) => 
      (c.weight || 1) >= 1 && results[`condition_${i}`] === false
    );
    
    if (criticalConditions.length > 0) {
      return false;
    }

    // Otherwise, use confidence threshold
    return confidence >= 0.7;
  }

  /**
   * Execute rule actions
   */
  private async executeActions(
    actions: RuleAction[],
    context: ModerationContext
  ): Promise<string[]> {
    const executedActions: string[] = [];

    for (const action of actions) {
      try {
        // Check action conditions if any
        if (action.conditions && action.conditions.length > 0) {
          const conditionsMet = await this.checkActionConditions(action.conditions, context);
          if (!conditionsMet) {
            continue;
          }
        }

        // Apply delay if specified
        if (action.delay && action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        await this.executeAction(action, context);
        executedActions.push(action.type);
      } catch (error) {
        console.error(`Action execution failed:`, error);
      }
    }

    return executedActions;
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: RuleAction, context: ModerationContext): Promise<void> {
    const { type, parameters } = action;

    switch (type) {
      case 'delete_message':
        if (context.messageId) {
          await this.queue.add('delete-message', {
            messageId: context.messageId,
            reason: parameters.reason || 'Auto-moderation rule triggered',
            moderatorId: 'system'
          });
        }
        break;

      case 'warn_user':
        await this.queue.add('warn-user', {
          userId: context.userId,
          reason: parameters.reason || 'Auto-moderation warning',
          serverId: context.serverId,
          channelId: context.channelId,
          message: parameters.message
        });
        break;

      case 'timeout_user':
        await this.queue.add('timeout-user', {
          userId: context.userId,
          duration: parameters.duration || 600, // 10 minutes default
          reason: parameters.reason || 'Auto-moderation timeout',
          serverId: context.serverId
        });
        break;

      case 'kick_user':
        await this.queue.add('kick-user', {
          userId: context.userId,
          reason: parameters.reason || 'Auto-moderation kick',
          serverId: context.serverId
        });
        break;

      case 'ban_user':
        await this.queue.add('ban-user', {
          userId: context.userId,
          duration: parameters.duration,
          reason: parameters.reason || 'Auto-moderation ban',
          serverId: context.serverId
        });
        break;

      case 'quarantine':
        await this.queue.add('quarantine-message', {
          messageId: context.messageId,
          userId: context.userId,
          reason: parameters.reason || 'Auto-moderation quarantine',
          requireReview: true
        });
        break;

      case 'flag':
        await this.queue.add('flag-content', {
          messageId: context.messageId,
          userId: context.userId,
          severity: parameters.severity || 'medium',
          reason: parameters.reason || 'Auto-moderation flag'
        });
        break;

      case 'notify_moderators':
        await this.queue.add('notify-moderators', {
          serverId: context.serverId,
          channelId: context.channelId,
          userId: context.userId,
          messageId: context.messageId,
          reason: parameters.reason || 'Auto-moderation alert',
          severity: parameters.severity || 'medium'
        });
        break;

      case 'send_dm':
        await this.queue.add('send-dm', {
          userId: context.userId,
          message: parameters.message || 'Your message triggered an auto-moderation rule.',
          serverId: context.serverId
        });
        break;

      case 'log_event':
        console.log(`🤖 Auto-moderation event: ${parameters.message || 'Rule triggered'}`);
        break;

      case 'custom_webhook':
        if (parameters.webhookUrl) {
          await this.queue.add('webhook-notification', {
            url: parameters.webhookUrl,
            payload: {
              event: 'auto_moderation',
              context,
              action: parameters
            }
          });
        }
        break;
    }
  }

  /**
   * Check action conditions
   */
  private async checkActionConditions(
    conditions: ActionCondition[],
    context: ModerationContext
  ): Promise<boolean> {
    for (const condition of conditions) {
      const value = await this.getContextValue(condition.field, context);
      const conditionMet = this.evaluateCondition(condition as RuleCondition, value);
      
      if (!conditionMet) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check rule exemptions
   */
  private async checkExemptions(rule: AutoModerationRule, context: ModerationContext): Promise<boolean> {
    for (const exemption of rule.exemptions) {
      if (await this.isExempt(exemption, context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if context is exempt from rule
   */
  private async isExempt(exemption: RuleExemption, context: ModerationContext): Promise<boolean> {
    switch (exemption.type) {
      case 'user':
        return (exemption.values as string[]).includes(context.userId);
      case 'role':
        return context.userRoles?.some(role => 
          (exemption.values as string[]).includes(role)
        ) || false;
      case 'channel':
        return context.channelId ? (exemption.values as string[]).includes(context.channelId) : false;
      case 'time_range':
        const timeRange = exemption.values as { start: Date; end: Date };
        const now = new Date();
        return now >= timeRange.start && now <= timeRange.end;
      case 'condition':
        const conditions = exemption.values as RuleCondition[];
        const results = await this.evaluateConditions(conditions, context);
        return Object.values(results).every(result => result);
      default:
        return false;
    }
  }

  /**
   * Get applicable rules for event and context
   */
  private getApplicableRules(eventType: string, context: ModerationContext): AutoModerationRule[] {
    const applicableRules: AutoModerationRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check if rule applies to this server
      if (rule.serverId && rule.serverId !== context.serverId) continue;

      // Check if rule applies to this channel
      if (rule.channelIds && rule.channelIds.length > 0) {
        if (!context.channelId || !rule.channelIds.includes(context.channelId)) {
          continue;
        }
      }

      // Check if rule triggers for this event
      const hasMatchingTrigger = rule.triggers.some(trigger => 
        trigger.event === eventType || trigger.event === 'scheduled'
      );

      if (hasMatchingTrigger) {
        applicableRules.push(rule);
      }
    }

    return applicableRules;
  }

  /**
   * Check if processing should stop after this rule
   */
  private shouldStopProcessing(rule: AutoModerationRule, result: RuleExecutionResult): boolean {
    // Stop processing if rule deleted/banned/kicked user
    const blockingActions = ['delete_message', 'ban_user', 'kick_user'];
    return result.actionsExecuted.some(action => blockingActions.includes(action));
  }

  /**
   * Add or update a rule
   */
  addRule(rule: AutoModerationRule): void {
    this.rules.set(rule.id, {
      ...rule,
      metadata: {
        ...rule.metadata,
        lastModified: new Date()
      }
    });
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get all rules
   */
  getRules(serverId?: string): AutoModerationRule[] {
    const rules = Array.from(this.rules.values());
    return serverId ? rules.filter(rule => !rule.serverId || rule.serverId === serverId) : rules;
  }

  /**
   * Update rule metrics
   */
  private updateRuleMetrics(ruleId: string, result: RuleExecutionResult): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.metadata.executionCount++;
      if (result.matched && result.errors.length === 0) {
        rule.metadata.successCount++;
      } else if (result.errors.length > 0) {
        rule.metadata.failureCount++;
      }
    }
  }

  /**
   * Log rule execution
   */
  private async logRuleExecution(
    rule: AutoModerationRule,
    context: ModerationContext,
    result: RuleExecutionResult
  ): Promise<void> {
    try {
      if (context.serverId) {
        await prisma.auditLog.create({
          data: {
            serverId: context.serverId,
            userId: 'system',
            targetId: context.userId,
            actionType: 996, // Auto-moderation rule execution
            reason: `Auto-moderation rule: ${rule.name}`,
            options: {
              ruleId: rule.id,
              ruleName: rule.name,
              messageId: context.messageId,
              channelId: context.channelId,
              matched: result.matched,
              confidence: result.confidence,
              actionsExecuted: result.actionsExecuted,
              processingTime: result.processingTime,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`⚖️ Rule executed: ${rule.name} - Matched: ${result.matched} - Actions: ${result.actionsExecuted.join(', ')}`);
    } catch (error) {
      console.error('Failed to log rule execution:', error);
    }
  }

  /**
   * Helper methods for database queries
   */
  private async getUserMessageCount(userId: string, serverId?: string): Promise<number> {
    // This would query the database for user message count
    return 0;
  }

  private async getUserJoinDate(userId: string, serverId?: string): Promise<Date> {
    // This would query the database for user join date
    return new Date();
  }

  private async getUserViolations(userId: string, serverId?: string): Promise<number> {
    // This would query the database for user violation count
    return 0;
  }

  private async getServerMemberCount(serverId?: string): Promise<number> {
    // This would query the database for server member count
    return 0;
  }

  /**
   * Initialize default rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AutoModerationRule[] = [
      {
        id: 'spam-prevention',
        name: 'Spam Prevention',
        description: 'Detect and prevent spam messages',
        enabled: true,
        priority: 8,
        conditions: [
          {
            type: 'content',
            operator: 'equals',
            field: 'ai.spam',
            value: true,
            weight: 1
          }
        ],
        actions: [
          {
            type: 'delete_message',
            parameters: { reason: 'Spam detected' }
          },
          {
            type: 'warn_user',
            parameters: { reason: 'Spam warning' }
          }
        ],
        triggers: [{ event: 'message_create' }],
        exemptions: [],
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          executionCount: 0,
          successCount: 0,
          failureCount: 0
        }
      },
      {
        id: 'toxicity-filter',
        name: 'Toxicity Filter',
        description: 'Filter toxic and harmful content',
        enabled: true,
        priority: 9,
        conditions: [
          {
            type: 'content',
            operator: 'equals',
            field: 'ai.toxicity.flagged',
            value: true,
            weight: 0.8
          },
          {
            type: 'content',
            operator: 'greater_than',
            field: 'ai.toxicity.score',
            value: 0.7,
            weight: 0.6
          }
        ],
        actions: [
          {
            type: 'delete_message',
            parameters: { reason: 'Toxic content detected' }
          },
          {
            type: 'timeout_user',
            parameters: { duration: 600, reason: 'Toxic behavior' }
          }
        ],
        triggers: [{ event: 'message_create' }],
        exemptions: [],
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          executionCount: 0,
          successCount: 0,
          failureCount: 0
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Start rule processor for scheduled rules
   */
  private startRuleProcessor(): void {
    setInterval(async () => {
      // Process scheduled rules
      const scheduledRules = Array.from(this.rules.values()).filter(rule => 
        rule.enabled && rule.triggers.some(trigger => trigger.event === 'scheduled')
      );

      for (const rule of scheduledRules) {
        // This would implement scheduled rule processing
        // For now, just log that we would process it
        console.log(`📅 Would process scheduled rule: ${rule.name}`);
      }
    }, 60000); // Every minute
  }

  /**
   * Get engine statistics
   */
  getStats(): {
    totalRules: number;
    activeRules: number;
    totalExecutions: number;
    successRate: number;
    rulesByPriority: { [priority: number]: number };
  } {
    const rules = Array.from(this.rules.values());
    const totalExecutions = rules.reduce((sum, rule) => sum + rule.metadata.executionCount, 0);
    const totalSuccesses = rules.reduce((sum, rule) => sum + rule.metadata.successCount, 0);
    
    const rulesByPriority: { [priority: number]: number } = {};
    rules.forEach(rule => {
      rulesByPriority[rule.priority] = (rulesByPriority[rule.priority] || 0) + 1;
    });

    return {
      totalRules: rules.length,
      activeRules: rules.filter(rule => rule.enabled).length,
      totalExecutions,
      successRate: totalExecutions > 0 ? totalSuccesses / totalExecutions : 0,
      rulesByPriority
    };
  }
}