import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import * as natural from 'natural';

export interface SpamPattern {
  id: string;
  name: string;
  type: 'regex' | 'keyword' | 'behavior' | 'ml';
  pattern: string | RegExp;
  weight: number;
  description: string;
  enabled: boolean;
}

export interface UserBehaviorProfile {
  userId: string;
  messageCount: number;
  averageLength: number;
  uniqueWords: Set<string>;
  duplicateMessages: number;
  linkCount: number;
  mentionCount: number;
  reactionScore: number;
  lastActivity: number;
  reputation: number;
  joinDate: number;
  violations: number;
}

export interface SpamAnalysisResult {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
  patterns: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  shouldBlock: boolean;
  recommendedAction: 'allow' | 'flag' | 'quarantine' | 'block';
}

export interface SpamConfig {
  thresholds: {
    spamScore: number;
    blockScore: number;
    rateLimitMessages: number;
    rateLimitWindow: number;
    duplicateThreshold: number;
    linkThreshold: number;
    mentionThreshold: number;
  };
  patterns: SpamPattern[];
  whitelist: {
    userIds: string[];
    domains: string[];
    keywords: string[];
  };
  learning: {
    enabled: boolean;
    adaptiveThresholds: boolean;
    feedbackWeight: number;
  };
}

export class SpamDetectionService {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private config: SpamConfig;
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private messageHistory: Map<string, Array<{ content: string; timestamp: number }>> = new Map();
  private spamCache: Map<string, { result: SpamAnalysisResult; timestamp: number }> = new Map();
  private classifier: natural.BayesClassifier;
  private tfidf: natural.TfIdf;

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    
    // Initialize ML components
    this.classifier = new natural.BayesClassifier();
    this.tfidf = new natural.TfIdf();
    
    this.initializeMLModels();
    this.startCleanupScheduler();
  }

  /**
   * Comprehensive spam analysis with ML and rule-based detection
   */
  async analyzeMessage(
    messageId: string,
    content: string,
    userId: string,
    channelId: string,
    serverId?: string
  ): Promise<SpamAnalysisResult> {
    try {
      // Check whitelist first
      if (this.isWhitelisted(userId, content)) {
        return this.createSafeResult();
      }

      // Check cache
      const cacheKey = this.getCacheKey(content, userId);
      const cached = this.spamCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
        return cached.result;
      }

      // Get or create user profile
      const userProfile = await this.getUserProfile(userId);
      
      // Update user behavior
      this.updateUserBehavior(userId, content);

      // Perform multi-layered spam analysis
      const analyses = await Promise.allSettled([
        this.ruleBasedAnalysis(content, userProfile),
        this.behaviorAnalysis(userId, content, userProfile),
        this.mlBasedAnalysis(content),
        this.aiBasedAnalysis(content, userId),
        this.linkAnalysis(content),
        this.patternMatching(content)
      ]);

      // Combine results
      const result = this.combineAnalysisResults(analyses, userProfile);
      
      // Cache result
      this.spamCache.set(cacheKey, { result, timestamp: Date.now() });

      // Take action if needed
      if (result.shouldBlock) {
        await this.executeSpamAction(messageId, userId, result, serverId);
      }

      // Log analysis
      await this.logSpamAnalysis(messageId, userId, result, serverId);

      return result;

    } catch (error) {
      console.error('Spam analysis failed:', error);
      return this.createSafeResult();
    }
  }

  /**
   * Rule-based spam detection
   */
  private async ruleBasedAnalysis(content: string, profile: UserBehaviorProfile): Promise<{
    score: number;
    reasons: string[];
    patterns: string[];
  }> {
    let score = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    // Check excessive repetition
    if (this.hasExcessiveRepetition(content)) {
      score += 0.3;
      reasons.push('Excessive character/word repetition');
      patterns.push('repetition');
    }

    // Check excessive caps
    if (this.hasExcessiveCaps(content)) {
      score += 0.2;
      reasons.push('Excessive capitalization');
      patterns.push('caps');
    }

    // Check suspicious patterns
    for (const pattern of this.config.patterns.filter(p => p.enabled)) {
      if (this.matchesPattern(content, pattern)) {
        score += pattern.weight;
        reasons.push(pattern.description);
        patterns.push(pattern.name);
      }
    }

    // Check message length anomalies
    if (content.length < 3) {
      score += 0.1;
      reasons.push('Unusually short message');
    } else if (content.length > 2000) {
      score += 0.2;
      reasons.push('Unusually long message');
    }

    // Check user reputation
    if (profile.reputation < -10) {
      score += 0.3;
      reasons.push('Low user reputation');
    }

    // Check newbie behavior
    const accountAge = Date.now() - profile.joinDate;
    if (accountAge < 24 * 60 * 60 * 1000 && profile.messageCount > 50) { // Less than 1 day old but many messages
      score += 0.4;
      reasons.push('New account with high activity');
    }

    return { score: Math.min(score, 1.0), reasons, patterns };
  }

  /**
   * Behavioral analysis based on user patterns
   */
  private async behaviorAnalysis(userId: string, content: string, profile: UserBehaviorProfile): Promise<{
    score: number;
    reasons: string[];
    patterns: string[];
  }> {
    let score = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    // Check rate limiting
    const recentMessages = this.getRecentMessages(userId);
    if (recentMessages.length > this.config.thresholds.rateLimitMessages) {
      score += 0.5;
      reasons.push('Rate limit exceeded');
      patterns.push('rate_limit');
    }

    // Check duplicate messages
    const duplicateCount = recentMessages.filter(msg => msg.content === content).length;
    if (duplicateCount >= this.config.thresholds.duplicateThreshold) {
      score += 0.6;
      reasons.push('Duplicate message detected');
      patterns.push('duplicate');
    }

    // Check link spam
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > this.config.thresholds.linkThreshold) {
      score += 0.4;
      reasons.push('Excessive links');
      patterns.push('link_spam');
    }

    // Check mention spam
    const mentionCount = (content.match(/@\w+/g) || []).length;
    if (mentionCount > this.config.thresholds.mentionThreshold) {
      score += 0.3;
      reasons.push('Excessive mentions');
      patterns.push('mention_spam');
    }

    // Check behavioral anomalies
    const avgLength = profile.averageLength;
    if (avgLength > 0) {
      const lengthDeviation = Math.abs(content.length - avgLength) / avgLength;
      if (lengthDeviation > 3) { // Message is 3x longer/shorter than usual
        score += 0.2;
        reasons.push('Unusual message length');
        patterns.push('length_anomaly');
      }
    }

    // Check vocabulary deviation
    const messageWords = new Set(content.toLowerCase().split(/\s+/));
    const commonWords = new Set([...profile.uniqueWords].slice(0, 100)); // Top 100 words
    const intersection = new Set([...messageWords].filter(word => commonWords.has(word)));
    const similarity = intersection.size / Math.max(messageWords.size, 1);
    
    if (similarity < 0.1 && content.length > 20) { // Very different vocabulary
      score += 0.3;
      reasons.push('Unusual vocabulary pattern');
      patterns.push('vocab_anomaly');
    }

    return { score: Math.min(score, 1.0), reasons, patterns };
  }

  /**
   * ML-based spam classification
   */
  private async mlBasedAnalysis(content: string): Promise<{
    score: number;
    reasons: string[];
    patterns: string[];
  }> {
    try {
      // Classify with Naive Bayes
      const classification = this.classifier.classify(content);
      const probability = this.classifier.getClassifications(content);
      
      const spamProb = probability.find(p => p.label === 'spam')?.value || 0;
      
      // TF-IDF analysis for suspicious terms
      this.tfidf.addDocument(content);
      const terms = this.tfidf.listTerms(this.tfidf.documents.length - 1);
      const suspiciousTerms = terms.filter(term => 
        this.isSuspiciousTerm(term.term)
      ).slice(0, 3);

      const reasons: string[] = [];
      const patterns: string[] = [];

      if (classification === 'spam') {
        reasons.push('ML classifier flagged as spam');
        patterns.push('ml_classification');
      }

      if (suspiciousTerms.length > 0) {
        reasons.push(`Suspicious terms: ${suspiciousTerms.map(t => t.term).join(', ')}`);
        patterns.push('suspicious_terms');
      }

      return {
        score: spamProb,
        reasons,
        patterns
      };
    } catch (error) {
      console.error('ML analysis failed:', error);
      return { score: 0, reasons: [], patterns: [] };
    }
  }

  /**
   * AI-based spam analysis using OpenAI
   */
  private async aiBasedAnalysis(content: string, userId: string): Promise<{
    score: number;
    reasons: string[];
    patterns: string[];
  }> {
    try {
      const analysisResult = await this.aiService.analyzeContent(content, userId, {
        checkSpam: true,
        categorize: true
      });

      const score = analysisResult.spam ? 0.8 : 0;
      const reasons: string[] = [];
      const patterns: string[] = [];

      if (analysisResult.spam) {
        reasons.push('AI analysis flagged as spam');
        patterns.push('ai_classification');
      }

      // Check categories for spam indicators
      const spamCategories = ['spam', 'promotional', 'scam', 'phishing'];
      const hasSpamCategory = analysisResult.categories.some(cat => 
        spamCategories.includes(cat.toLowerCase())
      );

      if (hasSpamCategory) {
        reasons.push('Content categorized as promotional/spam');
        patterns.push('spam_category');
        return { score: Math.min(score + 0.3, 1.0), reasons, patterns };
      }

      return { score, reasons, patterns };
    } catch (error) {
      console.error('AI spam analysis failed:', error);
      return { score: 0, reasons: [], patterns: [] };
    }
  }

  /**
   * Analyze links for suspicious behavior
   */
  private async linkAnalysis(content: string): Promise<{
    score: number;
    reasons: string[];
    patterns: string[];
  }> {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];
    
    if (urls.length === 0) {
      return { score: 0, reasons: [], patterns: [] };
    }

    let score = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    for (const url of urls) {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        
        // Check suspicious domains
        const suspiciousDomains = [
          'bit.ly', 'tinyurl.com', 'shorturl.at', 't.co',
          'grabify.link', 'iplogger.org', 'discord.gg'
        ];

        if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
          score += 0.3;
          reasons.push(`Suspicious domain: ${domain}`);
          patterns.push('suspicious_domain');
        }

        // Check for URL shorteners
        if (domain.length < 10 || url.length < 20) {
          score += 0.2;
          reasons.push('URL shortener detected');
          patterns.push('url_shortener');
        }

        // Check for excessive URL parameters
        const paramCount = (url.match(/[&?]/g) || []).length;
        if (paramCount > 10) {
          score += 0.2;
          reasons.push('Excessive URL parameters');
          patterns.push('excessive_params');
        }

      } catch (error) {
        // Invalid URL
        score += 0.4;
        reasons.push('Invalid URL format');
        patterns.push('invalid_url');
      }
    }

    return { score: Math.min(score, 1.0), reasons, patterns };
  }

  /**
   * Pattern matching against known spam patterns
   */
  private patternMatching(content: string): {
    score: number;
    reasons: string[];
    patterns: string[];
  } {
    let score = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    // Common spam phrases
    const spamPhrases = [
      /\b(free money|guaranteed win|act now|limited time)\b/gi,
      /\b(congratulations|you've won|claim your prize)\b/gi,
      /\b(crypto giveaway|double your coins|investment opportunity)\b/gi,
      /\b(click here|visit now|don't miss out)\b/gi,
      /\b(make money fast|work from home|easy cash)\b/gi,
    ];

    spamPhrases.forEach((pattern, index) => {
      if (pattern.test(content)) {
        score += 0.4;
        reasons.push(`Spam phrase pattern ${index + 1} detected`);
        patterns.push(`spam_phrase_${index + 1}`);
      }
    });

    // Check for excessive emojis
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    if (emojiCount > content.length * 0.3) {
      score += 0.3;
      reasons.push('Excessive emoji usage');
      patterns.push('emoji_spam');
    }

    return { score: Math.min(score, 1.0), reasons, patterns };
  }

  /**
   * Combine all analysis results
   */
  private combineAnalysisResults(
    analyses: PromiseSettledResult<any>[],
    profile: UserBehaviorProfile
  ): SpamAnalysisResult {
    let totalScore = 0;
    let totalWeight = 0;
    const allReasons: string[] = [];
    const allPatterns: string[] = [];

    // Process each analysis result
    analyses.forEach((analysis, index) => {
      if (analysis.status === 'fulfilled' && analysis.value) {
        const weight = this.getAnalysisWeight(index);
        totalScore += analysis.value.score * weight;
        totalWeight += weight;
        allReasons.push(...analysis.value.reasons);
        allPatterns.push(...analysis.value.patterns);
      }
    });

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Adjust score based on user reputation
    const reputationAdjustment = Math.max(-0.3, Math.min(0.3, profile.reputation / 100));
    const adjustedScore = Math.max(0, Math.min(1, finalScore - reputationAdjustment));

    // Determine risk level and actions
    const riskLevel = this.calculateRiskLevel(adjustedScore);
    const shouldBlock = adjustedScore >= this.config.thresholds.blockScore;
    const recommendedAction = this.getRecommendedAction(adjustedScore, riskLevel);

    return {
      isSpam: adjustedScore >= this.config.thresholds.spamScore,
      confidence: adjustedScore,
      reasons: [...new Set(allReasons)], // Remove duplicates
      patterns: [...new Set(allPatterns)],
      riskLevel,
      shouldBlock,
      recommendedAction
    };
  }

  /**
   * Get analysis weight for combining results
   */
  private getAnalysisWeight(analysisIndex: number): number {
    const weights = [
      0.3, // Rule-based
      0.25, // Behavioral
      0.2, // ML-based
      0.15, // AI-based
      0.15, // Link analysis
      0.1   // Pattern matching
    ];
    return weights[analysisIndex] || 0.1;
  }

  /**
   * Calculate risk level based on score
   */
  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Get recommended action based on analysis
   */
  private getRecommendedAction(score: number, riskLevel: string): 'allow' | 'flag' | 'quarantine' | 'block' {
    if (riskLevel === 'critical' || score >= 0.9) return 'block';
    if (riskLevel === 'high' || score >= 0.7) return 'quarantine';
    if (riskLevel === 'medium' || score >= 0.4) return 'flag';
    return 'allow';
  }

  /**
   * Execute spam-related actions
   */
  private async executeSpamAction(
    messageId: string,
    userId: string,
    result: SpamAnalysisResult,
    serverId?: string
  ): Promise<void> {
    try {
      switch (result.recommendedAction) {
        case 'block':
          await this.queue.add('delete-message', {
            messageId,
            reason: `Spam detected (${result.confidence.toFixed(2)}): ${result.reasons.join(', ')}`,
            moderatorId: 'system'
          });
          
          if (result.riskLevel === 'critical') {
            await this.queue.add('timeout-user', {
              userId,
              duration: 3600, // 1 hour
              reason: 'Automated spam prevention',
              serverId
            });
          }
          break;

        case 'quarantine':
          await this.queue.add('quarantine-message', {
            messageId,
            reason: `Potential spam (${result.confidence.toFixed(2)})`,
            requireReview: true
          });
          break;

        case 'flag':
          await this.queue.add('flag-message', {
            messageId,
            reason: `Spam indicators detected`,
            severity: result.riskLevel
          });
          break;
      }
    } catch (error) {
      console.error('Failed to execute spam action:', error);
    }
  }

  /**
   * Helper methods
   */
  private isWhitelisted(userId: string, content: string): boolean {
    if (this.config.whitelist.userIds.includes(userId)) return true;
    
    const lowerContent = content.toLowerCase();
    return this.config.whitelist.keywords.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
  }

  private hasExcessiveRepetition(content: string): boolean {
    // Check character repetition
    if (/(.)\1{5,}/.test(content)) return true;
    
    // Check word repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    const maxCount = Math.max(...wordCounts.values());
    return maxCount > Math.max(3, words.length * 0.4);
  }

  private hasExcessiveCaps(content: string): boolean {
    if (content.length < 10) return false;
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    return capsCount / content.length > 0.6;
  }

  private matchesPattern(content: string, pattern: SpamPattern): boolean {
    try {
      if (pattern.type === 'regex') {
        const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern, 'gi');
        return regex.test(content);
      } else if (pattern.type === 'keyword') {
        return content.toLowerCase().includes(pattern.pattern.toString().toLowerCase());
      }
      return false;
    } catch {
      return false;
    }
  }

  private isSuspiciousTerm(term: string): boolean {
    const suspiciousTerms = [
      'free', 'win', 'money', 'prize', 'guarantee', 'urgent', 'limited',
      'exclusive', 'offer', 'deal', 'discount', 'bonus', 'reward'
    ];
    return suspiciousTerms.includes(term.toLowerCase());
  }

  private getCacheKey(content: string, userId: string): string {
    return require('crypto')
      .createHash('md5')
      .update(content + userId)
      .digest('hex');
  }

  private createSafeResult(): SpamAnalysisResult {
    return {
      isSpam: false,
      confidence: 0,
      reasons: [],
      patterns: [],
      riskLevel: 'low',
      shouldBlock: false,
      recommendedAction: 'allow'
    };
  }

  private async getUserProfile(userId: string): Promise<UserBehaviorProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      // Create new profile - in production, load from database
      profile = {
        userId,
        messageCount: 0,
        averageLength: 0,
        uniqueWords: new Set(),
        duplicateMessages: 0,
        linkCount: 0,
        mentionCount: 0,
        reactionScore: 0,
        lastActivity: Date.now(),
        reputation: 0,
        joinDate: Date.now(),
        violations: 0
      };
      this.userProfiles.set(userId, profile);
    }
    
    return profile;
  }

  private updateUserBehavior(userId: string, content: string): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    // Update message count and average length
    profile.messageCount++;
    profile.averageLength = (profile.averageLength * (profile.messageCount - 1) + content.length) / profile.messageCount;
    
    // Update vocabulary
    const words = content.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => profile.uniqueWords.add(word));
    
    // Update link and mention counts
    profile.linkCount += (content.match(/https?:\/\/[^\s]+/g) || []).length;
    profile.mentionCount += (content.match(/@\w+/g) || []).length;
    
    // Update last activity
    profile.lastActivity = Date.now();
    
    // Add to message history
    const messages = this.messageHistory.get(userId) || [];
    messages.push({ content, timestamp: Date.now() });
    
    // Keep only recent messages (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentMessages = messages.filter(msg => msg.timestamp > oneHourAgo);
    this.messageHistory.set(userId, recentMessages);
  }

  private getRecentMessages(userId: string): Array<{ content: string; timestamp: number }> {
    return this.messageHistory.get(userId) || [];
  }

  private async logSpamAnalysis(
    messageId: string,
    userId: string,
    result: SpamAnalysisResult,
    serverId?: string
  ): Promise<void> {
    try {
      if (serverId && result.isSpam) {
        await prisma.auditLog.create({
          data: {
            serverId,
            userId: 'system',
            targetId: userId,
            actionType: 997, // Spam detection action type
            reason: `Spam detected: ${result.riskLevel}`,
            options: {
              messageId,
              confidence: result.confidence,
              reasons: result.reasons,
              patterns: result.patterns,
              action: result.recommendedAction,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`🛡️ Spam analysis: ${result.isSpam ? 'SPAM' : 'CLEAN'} (${result.confidence.toFixed(2)}) - ${result.recommendedAction}`);
    } catch (error) {
      console.error('Failed to log spam analysis:', error);
    }
  }

  /**
   * Initialize ML models with training data
   */
  private async initializeMLModels(): Promise<void> {
    try {
      // Basic training data - in production, load from comprehensive dataset
      const trainingData = [
        { text: 'free money click here now', label: 'spam' },
        { text: 'congratulations you won million dollars', label: 'spam' },
        { text: 'hey how are you doing today', label: 'ham' },
        { text: 'can someone help me with this code', label: 'ham' },
        { text: 'crypto giveaway double your bitcoin', label: 'spam' },
        { text: 'great discussion thanks for sharing', label: 'ham' },
        { text: 'urgent limited time offer act now', label: 'spam' },
        { text: 'looking forward to the meeting tomorrow', label: 'ham' },
      ];

      // Train Naive Bayes classifier
      trainingData.forEach(item => {
        this.classifier.addDocument(item.text, item.label);
      });
      
      this.classifier.train();

      console.log('🤖 ML models initialized for spam detection');
    } catch (error) {
      console.error('Failed to initialize ML models:', error);
    }
  }

  /**
   * Start cleanup scheduler
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Clean up message history
      for (const [userId, messages] of this.messageHistory.entries()) {
        const recentMessages = messages.filter(msg => msg.timestamp > oneHourAgo);
        if (recentMessages.length === 0) {
          this.messageHistory.delete(userId);
        } else {
          this.messageHistory.set(userId, recentMessages);
        }
      }

      // Clean up spam cache
      for (const [key, cached] of this.spamCache.entries()) {
        if (now - cached.timestamp > 300000) { // 5 minutes
          this.spamCache.delete(key);
        }
      }
    }, 60 * 1000); // Every minute
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): SpamConfig {
    return {
      thresholds: {
        spamScore: 0.6,
        blockScore: 0.8,
        rateLimitMessages: 10,
        rateLimitWindow: 60000, // 1 minute
        duplicateThreshold: 3,
        linkThreshold: 3,
        mentionThreshold: 5
      },
      patterns: [
        {
          id: 'crypto-giveaway',
          name: 'Crypto Giveaway',
          type: 'regex',
          pattern: /crypto.*giveaway|bitcoin.*free|double.*coins/gi,
          weight: 0.8,
          description: 'Crypto giveaway scam pattern',
          enabled: true
        },
        {
          id: 'urgent-action',
          name: 'Urgent Action',
          type: 'regex',
          pattern: /urgent|act now|limited time|don't miss/gi,
          weight: 0.5,
          description: 'Urgent action spam pattern',
          enabled: true
        }
      ],
      whitelist: {
        userIds: [],
        domains: ['github.com', 'stackoverflow.com', 'discord.com'],
        keywords: ['moderator', 'admin', 'staff']
      },
      learning: {
        enabled: true,
        adaptiveThresholds: true,
        feedbackWeight: 0.1
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SpamConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get spam statistics
   */
  getStats(): {
    totalAnalyses: number;
    spamDetected: number;
    falsePositives: number;
    topPatterns: Array<{ pattern: string; count: number }>;
    userProfiles: number;
  } {
    // This would be implemented with proper metrics collection
    return {
      totalAnalyses: 0,
      spamDetected: 0,
      falsePositives: 0,
      topPatterns: [],
      userProfiles: this.userProfiles.size
    };
  }
}