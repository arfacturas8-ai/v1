import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import * as natural from 'natural';

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'keyword' | 'pattern' | 'ai' | 'behavior' | 'rate_limit' | 'context';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: {
    keywords?: string[];
    patterns?: RegExp[];
    aiThreshold?: number;
    contextRequirements?: string[];
    rateLimit?: { count: number; window: number };
    userLevel?: 'new' | 'member' | 'trusted' | 'moderator';
    channelTypes?: string[];
  };
  actions: {
    delete?: boolean;
    warn?: boolean;
    timeout?: number; // minutes
    ban?: { duration?: number; reason: string };
    escalate?: boolean;
    notify?: { users: string[]; message: string };
    log?: { level: 'info' | 'warn' | 'error'; message: string };
  };
  exceptions: {
    users?: string[];
    channels?: string[];
    roles?: string[];
    timeRanges?: Array<{ start: string; end: string }>;
  };
  metadata: {
    createdBy: string;
    createdAt: Date;
    lastModified: Date;
    totalTriggers: number;
    accuracy: number;
    falsePositives: number;
  };
}

export interface ModerationContext {
  messageId: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId?: string;
  timestamp: Date;
  attachments?: any[];
  replyTo?: string;
  mentions?: string[];
  userHistory: {
    messagesInLast24h: number;
    warningsInLast30d: number;
    joinedDaysAgo: number;
    trustLevel: 'new' | 'member' | 'trusted';
    previousViolations: string[];
  };
  channelContext: {
    type: 'text' | 'voice' | 'announcement' | 'private';
    activity: 'high' | 'medium' | 'low';
    recentMessages: string[];
    moderationLevel: 'strict' | 'moderate' | 'lenient';
  };
  serverContext: {
    memberCount: number;
    verificationLevel: number;
    explicitFilter: boolean;
    communityGuidelines: string[];
  };
}

export interface ModerationResult {
  decision: 'allow' | 'warn' | 'delete' | 'timeout' | 'ban' | 'escalate';
  confidence: number;
  reasons: string[];
  triggeredRules: Array<{
    ruleId: string;
    ruleName: string;
    severity: string;
    confidence: number;
    evidence: string[];
  }>;
  suggestedActions: Array<{
    type: string;
    description: string;
    automated: boolean;
  }>;
  appealable: boolean;
  reviewRequired: boolean;
  metadata: {
    processingTime: number;
    aiAnalysisUsed: boolean;
    contextFactors: string[];
    similarCases: number;
  };
}

export interface AutoModerationStats {
  totalMessages: number;
  actionsPerformed: {
    allowed: number;
    warned: number;
    deleted: number;
    timeouts: number;
    bans: number;
    escalated: number;
  };
  accuracy: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  rulePerformance: Map<string, {
    triggers: number;
    accuracy: number;
    falsePositiveRate: number;
    averageConfidence: number;
  }>;
  topViolations: Array<{
    type: string;
    count: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
  processingMetrics: {
    averageTime: number;
    aiUsageRate: number;
    cacheHitRate: number;
  };
}

export class AutoModerationEngine {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private redis: Redis;
  private rules: Map<string, ModerationRule> = new Map();
  private stats: AutoModerationStats;
  
  // Caching and performance
  private decisionCache: Map<string, { result: ModerationResult; timestamp: number }> = new Map();
  private userBehaviorCache: Map<string, any> = new Map();
  private patternCache: Map<string, boolean> = new Map();
  
  // Rate limiting and tracking
  private userRateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private channelActivity: Map<string, any[]> = new Map();
  
  // Learning and adaptation
  private falsePositiveFeedback: Map<string, number> = new Map();
  private contextLearning: Map<string, any> = new Map();

  constructor(aiService: AIIntegrationService, queue: Queue) {
    this.aiService = aiService;
    this.queue = queue;
    
    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Initialize stats
    this.initializeStats();
    
    // Load default rules
    this.loadDefaultRules();
    
    // Start background processes
    this.startMaintenanceTasks();
    this.startLearningTasks();
    
    console.log('🛡️ Enhanced Auto-Moderation Engine initialized');
  }

  /**
   * Main moderation function with enhanced context awareness
   */
  async moderateMessage(context: ModerationContext): Promise<ModerationResult> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(context);

    try {
      // Check cache first for repeated content
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        this.updateStats('cached');
        return cached;
      }

      // Build comprehensive analysis context
      const analysisContext = await this.buildAnalysisContext(context);
      
      // Run parallel analysis
      const analyses = await Promise.allSettled([
        this.performKeywordAnalysis(context),
        this.performPatternAnalysis(context),
        this.performAIAnalysis(context, analysisContext),
        this.performBehaviorAnalysis(context),
        this.performContextualAnalysis(context, analysisContext),
        this.performRateLimitAnalysis(context)
      ]);

      // Combine results from all analyses
      const combinedResult = this.combineAnalysisResults(analyses, context);
      
      // Apply rule-based decision making
      const ruleResults = await this.applyModerationRules(context, combinedResult);
      
      // Generate final decision with confidence scoring
      const finalDecision = this.generateFinalDecision(ruleResults, context, analysisContext);
      
      // Apply context-based adjustments
      const contextAdjustedDecision = this.applyContextAdjustments(finalDecision, analysisContext);
      
      // Cache result for performance
      this.cacheResult(cacheKey, contextAdjustedDecision);
      
      // Update statistics and learning data
      this.updateProcessingStats(Date.now() - startTime, contextAdjustedDecision);
      
      // Queue follow-up actions if needed
      await this.queueFollowUpActions(contextAdjustedDecision, context);
      
      return contextAdjustedDecision;
    } catch (error) {
      console.error('Auto-moderation failed:', error);
      
      // Return safe fallback decision
      return this.createFallbackDecision(context, error);
    }
  }

  /**
   * Enhanced keyword analysis with context awareness
   */
  private async performKeywordAnalysis(context: ModerationContext): Promise<any> {
    const results = {
      flagged: false,
      confidence: 0,
      matches: [],
      severity: 'low' as const
    };

    try {
      const content = context.content.toLowerCase();
      const keywords = this.getContextualKeywords(context);
      
      for (const [category, keywordList] of Object.entries(keywords)) {
        for (const keyword of keywordList as string[]) {
          if (content.includes(keyword)) {
            const severity = this.getKeywordSeverity(keyword, category);
            const contextualWeight = this.getContextualWeight(keyword, context);
            
            results.matches.push({
              keyword,
              category,
              severity,
              confidence: 0.8 * contextualWeight
            });
            
            results.flagged = true;
            results.confidence = Math.max(results.confidence, 0.8 * contextualWeight);
            
            if (severity === 'high' || severity === 'critical') {
              results.severity = severity;
            }
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Keyword analysis failed:', error);
      return results;
    }
  }

  /**
   * Enhanced pattern analysis with regex and NLP
   */
  private async performPatternAnalysis(context: ModerationContext): Promise<any> {
    const results = {
      flagged: false,
      confidence: 0,
      patterns: [],
      risks: []
    };

    try {
      const content = context.content;
      const patterns = this.getContextualPatterns(context);
      
      for (const pattern of patterns) {
        const matches = content.match(pattern.regex);
        if (matches) {
          const contextualConfidence = this.calculatePatternConfidence(pattern, context, matches);
          
          results.patterns.push({
            name: pattern.name,
            type: pattern.type,
            matches: matches.length,
            confidence: contextualConfidence,
            severity: pattern.severity
          });
          
          results.flagged = true;
          results.confidence = Math.max(results.confidence, contextualConfidence);
          
          if (pattern.risk) {
            results.risks.push(pattern.risk);
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Pattern analysis failed:', error);
      return results;
    }
  }

  /**
   * AI-powered analysis with fallback handling
   */
  private async performAIAnalysis(context: ModerationContext, analysisContext: any): Promise<any> {
    try {
      // Use the existing AI service for comprehensive analysis
      const aiResult = await this.aiService.analyzeContent(context.content, context.authorId, {
        checkToxicity: true,
        checkSpam: true,
        checkSentiment: true,
        checkProfanity: true,
        checkNsfw: true,
        extractEntities: true,
        categorize: true
      });

      // Enhance AI results with context
      const contextualAIResult = this.enhanceAIWithContext(aiResult, analysisContext);
      
      return {
        toxicity: contextualAIResult.toxicity,
        spam: contextualAIResult.spam,
        sentiment: contextualAIResult.sentiment,
        profanity: contextualAIResult.profanity,
        nsfw: contextualAIResult.nsfw,
        categories: contextualAIResult.categories,
        entities: contextualAIResult.entities,
        confidence: contextualAIResult.confidence,
        contextualAdjustments: {
          trustLevelBonus: this.getTrustLevelBonus(context.userHistory.trustLevel),
          channelTypeAdjustment: this.getChannelTypeAdjustment(context.channelContext.type),
          communityContextBonus: this.getCommunityContextBonus(analysisContext)
        }
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Fallback to basic analysis
      return {
        toxicity: null,
        spam: this.basicSpamDetection(context.content),
        sentiment: { score: 0, comparative: 0 },
        profanity: this.basicProfanityDetection(context.content),
        nsfw: this.basicNSFWDetection(context.content),
        categories: ['general'],
        entities: [],
        confidence: 0.3,
        contextualAdjustments: {}
      };
    }
  }

  /**
   * Behavioral analysis based on user history and patterns
   */
  private async performBehaviorAnalysis(context: ModerationContext): Promise<any> {
    try {
      const behavior = {
        flagged: false,
        confidence: 0,
        riskFactors: [],
        trustModifier: 1.0
      };

      // Analyze message frequency
      if (context.userHistory.messagesInLast24h > 100) {
        behavior.riskFactors.push('high_message_frequency');
        behavior.flagged = true;
        behavior.confidence += 0.3;
      }

      // Analyze warning history
      if (context.userHistory.warningsInLast30d > 3) {
        behavior.riskFactors.push('repeat_offender');
        behavior.flagged = true;
        behavior.confidence += 0.5;
      }

      // Account age factor
      if (context.userHistory.joinedDaysAgo < 7) {
        behavior.riskFactors.push('new_account');
        behavior.confidence += 0.2;
        behavior.trustModifier = 0.7;
      } else if (context.userHistory.joinedDaysAgo > 365) {
        behavior.trustModifier = 1.3; // Boost for established users
      }

      // Trust level adjustments
      switch (context.userHistory.trustLevel) {
        case 'new':
          behavior.trustModifier *= 0.8;
          break;
        case 'trusted':
          behavior.trustModifier *= 1.2;
          break;
      }

      return behavior;
    } catch (error) {
      console.error('Behavior analysis failed:', error);
      return { flagged: false, confidence: 0, riskFactors: [], trustModifier: 1.0 };
    }
  }

  /**
   * Contextual analysis considering channel and server environment
   */
  private async performContextualAnalysis(context: ModerationContext, analysisContext: any): Promise<any> {
    try {
      const contextual = {
        flagged: false,
        confidence: 0,
        adjustments: {},
        environmentFactors: []
      };

      // Channel context analysis
      if (context.channelContext.moderationLevel === 'strict') {
        contextual.adjustments.strictMode = 1.5;
        contextual.environmentFactors.push('strict_moderation');
      }

      // High activity channels may need different thresholds
      if (context.channelContext.activity === 'high') {
        contextual.adjustments.highActivity = 0.9; // Slightly more lenient
        contextual.environmentFactors.push('high_activity_channel');
      }

      // Community guidelines consideration
      if (context.serverContext.communityGuidelines.length > 0) {
        const guidelineViolations = this.checkCommunityGuidelines(
          context.content,
          context.serverContext.communityGuidelines
        );
        
        if (guidelineViolations.length > 0) {
          contextual.flagged = true;
          contextual.confidence = 0.7;
          contextual.environmentFactors.push(...guidelineViolations);
        }
      }

      // Recent context analysis
      const recentContext = this.analyzeRecentMessages(context.channelContext.recentMessages);
      if (recentContext.escalatingTension) {
        contextual.adjustments.tensionEscalation = 1.3;
        contextual.environmentFactors.push('escalating_tension');
      }

      return contextual;
    } catch (error) {
      console.error('Contextual analysis failed:', error);
      return { flagged: false, confidence: 0, adjustments: {}, environmentFactors: [] };
    }
  }

  /**
   * Rate limit analysis with adaptive thresholds
   */
  private async performRateLimitAnalysis(context: ModerationContext): Promise<any> {
    try {
      const rateLimit = {
        flagged: false,
        confidence: 0,
        violations: []
      };

      const userId = context.authorId;
      const now = Date.now();
      const windowMs = 60000; // 1 minute window

      // Get or create rate limit tracker
      let tracker = this.userRateLimits.get(userId);
      if (!tracker || now > tracker.resetTime) {
        tracker = { count: 0, resetTime: now + windowMs };
        this.userRateLimits.set(userId, tracker);
      }

      tracker.count++;

      // Adaptive rate limits based on trust level
      const maxMessages = this.getAdaptiveRateLimit(context.userHistory.trustLevel);
      
      if (tracker.count > maxMessages) {
        rateLimit.flagged = true;
        rateLimit.confidence = Math.min((tracker.count - maxMessages) / maxMessages, 1.0);
        rateLimit.violations.push({
          type: 'message_rate_limit',
          count: tracker.count,
          limit: maxMessages,
          timeWindow: '1m'
        });
      }

      return rateLimit;
    } catch (error) {
      console.error('Rate limit analysis failed:', error);
      return { flagged: false, confidence: 0, violations: [] };
    }
  }

  /**
   * Combine all analysis results into a unified assessment
   */
  private combineAnalysisResults(analyses: PromiseSettledResult<any>[], context: ModerationContext): any {
    const combined = {
      keyword: null,
      pattern: null,
      ai: null,
      behavior: null,
      contextual: null,
      rateLimit: null,
      overallRisk: 0,
      confidence: 0,
      factors: []
    };

    analyses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const analysisTypes = ['keyword', 'pattern', 'ai', 'behavior', 'contextual', 'rateLimit'];
        const key = analysisTypes[index];
        combined[key] = result.value;
        
        if (result.value?.flagged || result.value?.toxicity?.flagged) {
          combined.overallRisk += (result.value.confidence || 0.5);
          combined.factors.push(key);
        }
      }
    });

    combined.confidence = Math.min(combined.overallRisk, 1.0);
    return combined;
  }

  /**
   * Apply moderation rules to determine actions
   */
  private async applyModerationRules(context: ModerationContext, analysisResults: any): Promise<any[]> {
    const ruleResults = [];

    for (const [ruleId, rule] of this.rules.entries()) {
      if (!rule.enabled) continue;

      try {
        const ruleMatch = await this.evaluateRule(rule, context, analysisResults);
        if (ruleMatch.matched) {
          ruleResults.push({
            ruleId,
            rule,
            match: ruleMatch,
            confidence: ruleMatch.confidence,
            severity: rule.severity
          });
        }
      } catch (error) {
        console.error(`Rule evaluation failed for ${ruleId}:`, error);
      }
    }

    return ruleResults.sort((a, b) => 
      this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)
    );
  }

  /**
   * Generate final moderation decision
   */
  private generateFinalDecision(ruleResults: any[], context: ModerationContext, analysisContext: any): ModerationResult {
    const decision: ModerationResult = {
      decision: 'allow',
      confidence: 0,
      reasons: [],
      triggeredRules: [],
      suggestedActions: [],
      appealable: true,
      reviewRequired: false,
      metadata: {
        processingTime: 0,
        aiAnalysisUsed: false,
        contextFactors: [],
        similarCases: 0
      }
    };

    if (ruleResults.length === 0) {
      decision.decision = 'allow';
      decision.confidence = 0.9;
      return decision;
    }

    // Analyze rule results
    let maxSeverityWeight = 0;
    let totalConfidence = 0;
    const reasons = new Set<string>();

    for (const ruleResult of ruleResults) {
      const severityWeight = this.getSeverityWeight(ruleResult.severity);
      maxSeverityWeight = Math.max(maxSeverityWeight, severityWeight);
      totalConfidence += ruleResult.confidence;

      decision.triggeredRules.push({
        ruleId: ruleResult.ruleId,
        ruleName: ruleResult.rule.name,
        severity: ruleResult.severity,
        confidence: ruleResult.confidence,
        evidence: ruleResult.match.evidence || []
      });

      reasons.add(ruleResult.rule.description);
    }

    decision.reasons = Array.from(reasons);
    decision.confidence = Math.min(totalConfidence / ruleResults.length, 1.0);

    // Determine action based on severity and confidence
    if (maxSeverityWeight >= 4 && decision.confidence > 0.8) {
      decision.decision = 'ban';
      decision.appealable = true;
      decision.reviewRequired = true;
    } else if (maxSeverityWeight >= 3 && decision.confidence > 0.7) {
      decision.decision = 'timeout';
      decision.appealable = true;
    } else if (maxSeverityWeight >= 2 && decision.confidence > 0.6) {
      decision.decision = 'delete';
    } else if (maxSeverityWeight >= 1 && decision.confidence > 0.5) {
      decision.decision = 'warn';
    } else {
      decision.decision = 'allow';
    }

    return decision;
  }

  /**
   * Apply context-based adjustments to the final decision
   */
  private applyContextAdjustments(decision: ModerationResult, analysisContext: any): ModerationResult {
    const adjustedDecision = { ...decision };

    // Trust level adjustments
    if (analysisContext.userHistory?.trustLevel === 'trusted' && decision.decision === 'delete') {
      adjustedDecision.decision = 'warn';
      adjustedDecision.reasons.push('Adjusted for trusted user status');
    }

    // New user adjustments (more strict)
    if (analysisContext.userHistory?.trustLevel === 'new' && decision.decision === 'warn') {
      adjustedDecision.decision = 'delete';
      adjustedDecision.reasons.push('Stricter enforcement for new users');
    }

    // Channel context adjustments
    if (analysisContext.channelContext?.moderationLevel === 'lenient' && 
        decision.confidence < 0.8) {
      if (decision.decision === 'delete') {
        adjustedDecision.decision = 'warn';
        adjustedDecision.reasons.push('Lenient channel moderation policy applied');
      }
    }

    return adjustedDecision;
  }

  /**
   * Helper methods for analysis and processing
   */
  private async buildAnalysisContext(context: ModerationContext): Promise<any> {
    return {
      userHistory: context.userHistory,
      channelContext: context.channelContext,
      serverContext: context.serverContext,
      timeOfDay: new Date().getHours(),
      isWeekend: [0, 6].includes(new Date().getDay()),
      recentActivity: await this.getRecentChannelActivity(context.channelId)
    };
  }

  private getContextualKeywords(context: ModerationContext): { [category: string]: string[] } {
    const baseKeywords = {
      hate: ['hate', 'nazi', 'racist', 'bigot', 'discrimination'],
      harassment: ['bully', 'harass', 'stalk', 'doxx', 'kys'],
      spam: ['free money', 'click here', 'limited time', 'act now'],
      nsfw: ['porn', 'nsfw', 'adult content', 'explicit'],
      violence: ['kill', 'murder', 'violence', 'attack', 'threat']
    };

    // Add context-specific keywords based on channel type
    if (context.channelContext.type === 'announcement') {
      baseKeywords.spam.push(...['fake news', 'misinformation']);
    }

    return baseKeywords;
  }

  private getContextualPatterns(context: ModerationContext): Array<{
    name: string;
    regex: RegExp;
    type: string;
    severity: string;
    risk?: string;
  }> {
    return [
      {
        name: 'repeated_characters',
        regex: /(.)\1{10,}/g,
        type: 'spam',
        severity: 'medium'
      },
      {
        name: 'excessive_caps',
        regex: /[A-Z]{20,}/g,
        type: 'caps_spam',
        severity: 'low'
      },
      {
        name: 'suspicious_links',
        regex: /(bit\.ly|tinyurl\.com|t\.co)\/[a-zA-Z0-9]+/g,
        type: 'phishing',
        severity: 'high',
        risk: 'potential_phishing'
      },
      {
        name: 'crypto_scam',
        regex: /\b(free\s+crypto|bitcoin\s+giveaway|eth\s+drop)\b/gi,
        type: 'scam',
        severity: 'high',
        risk: 'crypto_scam'
      }
    ];
  }

  private calculatePatternConfidence(pattern: any, context: ModerationContext, matches: RegExpMatchArray): number {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on pattern type
    if (pattern.type === 'phishing' || pattern.type === 'scam') {
      confidence = 0.9;
    }
    
    // Adjust based on user trust level
    if (context.userHistory.trustLevel === 'trusted') {
      confidence *= 0.7;
    } else if (context.userHistory.trustLevel === 'new') {
      confidence *= 1.2;
    }
    
    // Adjust based on number of matches
    confidence = Math.min(confidence * (1 + matches.length * 0.1), 1.0);
    
    return confidence;
  }

  private enhanceAIWithContext(aiResult: any, analysisContext: any): any {
    const enhanced = { ...aiResult };
    
    // Apply trust level adjustments
    if (analysisContext.userHistory?.trustLevel === 'trusted') {
      if (enhanced.toxicity?.flagged) {
        enhanced.confidence *= 0.8; // Less confident for trusted users
      }
    }
    
    return enhanced;
  }

  private getTrustLevelBonus(trustLevel: string): number {
    switch (trustLevel) {
      case 'trusted': return -0.2; // Reduce severity
      case 'new': return 0.3; // Increase severity
      default: return 0;
    }
  }

  private getChannelTypeAdjustment(channelType: string): number {
    switch (channelType) {
      case 'announcement': return 0.2; // Stricter
      case 'private': return -0.1; // Slightly more lenient
      default: return 0;
    }
  }

  private getCommunityContextBonus(analysisContext: any): number {
    // More complex community context analysis would go here
    return 0;
  }

  private basicSpamDetection(content: string): boolean {
    const spamPatterns = [
      /\b(free|win|winner|congratulations|claim|prize)\b.*\b(bitcoin|crypto|money|cash)\b/gi,
      /\b(click here|visit now|limited time|act now)\b/gi,
      /(.)\\1{5,}/g // Repeated characters
    ];
    
    return spamPatterns.some(pattern => pattern.test(content));
  }

  private basicProfanityDetection(content: string): boolean {
    const profanityWords = ['fuck', 'shit', 'damn', 'bitch', 'ass'];
    const lowerContent = content.toLowerCase();
    return profanityWords.some(word => lowerContent.includes(word));
  }

  private basicNSFWDetection(content: string): boolean {
    const nsfwWords = ['porn', 'sex', 'naked', 'nude', 'adult', 'xxx'];
    const lowerContent = content.toLowerCase();
    return nsfwWords.some(word => lowerContent.includes(word));
  }

  private checkCommunityGuidelines(content: string, guidelines: string[]): string[] {
    const violations = [];
    // This would be a more sophisticated analysis in production
    return violations;
  }

  private analyzeRecentMessages(recentMessages: string[]): { escalatingTension: boolean } {
    // Analyze recent messages for escalating tension
    // This would use NLP and sentiment analysis
    return { escalatingTension: false };
  }

  private getAdaptiveRateLimit(trustLevel: string): number {
    switch (trustLevel) {
      case 'new': return 10; // 10 messages per minute
      case 'member': return 20;
      case 'trusted': return 50;
      default: return 15;
    }
  }

  private async evaluateRule(rule: ModerationRule, context: ModerationContext, analysisResults: any): Promise<{
    matched: boolean;
    confidence: number;
    evidence?: string[];
  }> {
    // Complex rule evaluation logic would go here
    // This is a simplified version
    
    if (rule.type === 'ai' && analysisResults.ai?.toxicity?.flagged) {
      return {
        matched: true,
        confidence: analysisResults.ai.confidence || 0.7,
        evidence: ['AI toxicity detection triggered']
      };
    }
    
    return { matched: false, confidence: 0 };
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 5;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 1;
    }
  }

  private getKeywordSeverity(keyword: string, category: string): 'low' | 'medium' | 'high' | 'critical' {
    // Determine severity based on keyword and category
    const severityMap = {
      hate: 'high',
      harassment: 'high',
      violence: 'critical',
      nsfw: 'medium',
      spam: 'low'
    };
    
    return severityMap[category] as any || 'low';
  }

  private getContextualWeight(keyword: string, context: ModerationContext): number {
    let weight = 1.0;
    
    // Adjust based on channel type
    if (context.channelContext.type === 'private' && keyword.includes('nsfw')) {
      weight *= 0.5; // More lenient in private channels
    }
    
    // Adjust based on user trust
    if (context.userHistory.trustLevel === 'trusted') {
      weight *= 0.8;
    }
    
    return weight;
  }

  /**
   * Caching and performance methods
   */
  private getCacheKey(context: ModerationContext): string {
    return require('crypto')
      .createHash('md5')
      .update(context.content + context.authorId)
      .digest('hex');
  }

  private getCachedResult(cacheKey: string): ModerationResult | null {
    const cached = this.decisionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.result;
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: ModerationResult): void {
    this.decisionCache.set(cacheKey, { result, timestamp: Date.now() });
    
    // Clean cache if too large
    if (this.decisionCache.size > 1000) {
      const keys = Array.from(this.decisionCache.keys()).slice(0, 200);
      keys.forEach(key => this.decisionCache.delete(key));
    }
  }

  private createFallbackDecision(context: ModerationContext, error: any): ModerationResult {
    return {
      decision: 'allow', // Safe default
      confidence: 0.1,
      reasons: ['Auto-moderation system error - defaulting to allow'],
      triggeredRules: [],
      suggestedActions: [{ 
        type: 'manual_review', 
        description: 'Manual review recommended due to system error',
        automated: false 
      }],
      appealable: true,
      reviewRequired: true,
      metadata: {
        processingTime: 0,
        aiAnalysisUsed: false,
        contextFactors: ['system_error'],
        similarCases: 0
      }
    };
  }

  /**
   * Background tasks and maintenance
   */
  private startMaintenanceTasks(): void {
    // Clean caches every 10 minutes
    setInterval(() => {
      this.cleanupCaches();
    }, 600000);
    
    // Update statistics every 5 minutes
    setInterval(() => {
      this.updateStatistics();
    }, 300000);
  }

  private startLearningTasks(): void {
    // Process feedback and adjust rules every hour
    setInterval(() => {
      this.processLearningFeedback();
    }, 3600000);
  }

  private cleanupCaches(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    // Clean decision cache
    for (const [key, cached] of this.decisionCache.entries()) {
      if (now - cached.timestamp > maxAge) {
        this.decisionCache.delete(key);
      }
    }
    
    // Clean rate limit trackers
    for (const [userId, tracker] of this.userRateLimits.entries()) {
      if (now > tracker.resetTime) {
        this.userRateLimits.delete(userId);
      }
    }
  }

  private updateStatistics(): void {
    // Update performance metrics and rule statistics
    console.log(`🛡️ Auto-moderation stats: ${this.stats.totalMessages} messages processed`);
  }

  private processLearningFeedback(): void {
    // Process false positive feedback to improve accuracy
    for (const [ruleId, count] of this.falsePositiveFeedback.entries()) {
      if (count > 5) { // Threshold for rule adjustment
        const rule = this.rules.get(ruleId);
        if (rule) {
          console.log(`📝 Adjusting rule ${ruleId} due to false positives`);
          // Rule adjustment logic would go here
        }
      }
    }
  }

  /**
   * Utility and initialization methods
   */
  private async getRecentChannelActivity(channelId: string): Promise<any[]> {
    // Get recent channel activity from cache or database
    return this.channelActivity.get(channelId) || [];
  }

  private initializeStats(): void {
    this.stats = {
      totalMessages: 0,
      actionsPerformed: {
        allowed: 0,
        warned: 0,
        deleted: 0,
        timeouts: 0,
        bans: 0,
        escalated: 0
      },
      accuracy: {
        truePositives: 0,
        falsePositives: 0,
        trueNegatives: 0,
        falseNegatives: 0,
        precision: 0,
        recall: 0,
        f1Score: 0
      },
      rulePerformance: new Map(),
      topViolations: [],
      processingMetrics: {
        averageTime: 0,
        aiUsageRate: 0,
        cacheHitRate: 0
      }
    };
  }

  private loadDefaultRules(): void {
    // Load default moderation rules
    const defaultRules: ModerationRule[] = [
      {
        id: 'hate_speech',
        name: 'Hate Speech Detection',
        description: 'Detects hate speech and discriminatory language',
        type: 'ai',
        enabled: true,
        severity: 'high',
        conditions: {
          aiThreshold: 0.8,
          keywords: ['hate', 'racist', 'bigot']
        },
        actions: {
          delete: true,
          warn: true,
          escalate: true
        },
        exceptions: {
          channels: [], // Educational channels might be excepted
          roles: []
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          totalTriggers: 0,
          accuracy: 0.9,
          falsePositives: 0
        }
      },
      {
        id: 'spam_detection',
        name: 'Spam Detection',
        description: 'Detects spam and unwanted promotional content',
        type: 'pattern',
        enabled: true,
        severity: 'medium',
        conditions: {
          patterns: [/\b(free\s+money|click\s+here)\b/gi],
          rateLimit: { count: 5, window: 60000 }
        },
        actions: {
          delete: true,
          timeout: 10 // 10 minutes
        },
        exceptions: {
          users: [], // Trusted advertisers might be excepted
          channels: []
        },
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          totalTriggers: 0,
          accuracy: 0.85,
          falsePositives: 0
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    console.log(`📋 Loaded ${defaultRules.length} default moderation rules`);
  }

  private updateStats(type: string): void {
    this.stats.totalMessages++;
    
    switch (type) {
      case 'cached':
        this.stats.processingMetrics.cacheHitRate = 
          (this.stats.processingMetrics.cacheHitRate * 0.9) + (1 * 0.1);
        break;
    }
  }

  private updateProcessingStats(processingTime: number, result: ModerationResult): void {
    // Update processing metrics
    this.stats.processingMetrics.averageTime = 
      (this.stats.processingMetrics.averageTime * 0.9) + (processingTime * 0.1);
    
    // Update action statistics
    this.stats.actionsPerformed[result.decision]++;
    
    if (result.metadata.aiAnalysisUsed) {
      this.stats.processingMetrics.aiUsageRate = 
        (this.stats.processingMetrics.aiUsageRate * 0.9) + (1 * 0.1);
    }
  }

  private async queueFollowUpActions(result: ModerationResult, context: ModerationContext): Promise<void> {
    if (result.decision !== 'allow') {
      // Queue follow-up actions like notifications, logging, etc.
      await this.queue.add('moderation-action', {
        decision: result.decision,
        context,
        timestamp: new Date()
      });
    }
  }

  /**
   * Public API methods
   */
  async moderateMessage(messageId: string, content: string, authorId: string, channelId: string, serverId?: string): Promise<ModerationResult> {
    const context: ModerationContext = {
      messageId,
      content,
      authorId,
      channelId,
      serverId,
      timestamp: new Date(),
      userHistory: {
        messagesInLast24h: 0, // Would fetch from database
        warningsInLast30d: 0,
        joinedDaysAgo: 30,
        trustLevel: 'member',
        previousViolations: []
      },
      channelContext: {
        type: 'text',
        activity: 'medium',
        recentMessages: [],
        moderationLevel: 'moderate'
      },
      serverContext: {
        memberCount: 1000,
        verificationLevel: 2,
        explicitFilter: true,
        communityGuidelines: []
      }
    };

    return this.moderateMessage(context);
  }

  async addRule(rule: ModerationRule): Promise<void> {
    this.rules.set(rule.id, rule);
    console.log(`➕ Added moderation rule: ${rule.name}`);
  }

  async updateRule(ruleId: string, updates: Partial<ModerationRule>): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
      console.log(`🔄 Updated moderation rule: ${ruleId}`);
    }
  }

  async removeRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
    console.log(`➖ Removed moderation rule: ${ruleId}`);
  }

  async reportFalsePositive(ruleId: string, context: any): Promise<void> {
    const current = this.falsePositiveFeedback.get(ruleId) || 0;
    this.falsePositiveFeedback.set(ruleId, current + 1);
    
    console.log(`📝 False positive reported for rule: ${ruleId}`);
  }

  getStats(): AutoModerationStats {
    return { ...this.stats };
  }

  getRules(): ModerationRule[] {
    return Array.from(this.rules.values());
  }

  async getAnalytics(timeRange: { start: Date; end: Date }): Promise<any> {
    return {
      totalMessages: this.stats.totalMessages,
      actionBreakdown: this.stats.actionsPerformed,
      accuracy: this.stats.accuracy,
      topRules: Array.from(this.stats.rulePerformance.entries())
        .sort(([, a], [, b]) => b.triggers - a.triggers)
        .slice(0, 10)
    };
  }
}