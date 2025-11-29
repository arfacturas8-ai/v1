import OpenAI from 'openai';
import { prisma } from '@cryb/database';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import * as tf from '@tensorflow/tfjs-node';
import { BadWords } from 'bad-words';
import * as leoProfanity from 'leo-profanity';
import sentiment from 'sentiment';

interface ContentAnalysisResult {
  toxicity_score: number;
  hate_speech_score: number;
  harassment_score: number;
  spam_score: number;
  nsfw_score: number;
  violence_score: number;
  self_harm_score: number;
  identity_attack_score: number;
  profanity_score: number;
  threat_score: number;
  overall_confidence: number;
  flagged_categories: string[];
  flagged: boolean;
  recommended_action: 'none' | 'flag' | 'hide' | 'remove' | 'quarantine' | 'ban_user';
  raw_response: any;
}

interface ImageAnalysisResult {
  nsfw_score: number;
  violence_score: number;
  explicit_content: boolean;
  suggestive_content: boolean;
  detected_objects: any[];
  detected_faces: number;
  detected_text: string;
  moderation_labels: any[];
  confidence_score: number;
  flagged: boolean;
  raw_response: any;
}

interface ModerationRule {
  id: string;
  name: string;
  rule_type: string;
  severity: string;
  action: string;
  auto_action: boolean;
  config: any;
  enabled: boolean;
}

export class AIModerationService {
  private openai: OpenAI;
  private redis: Redis;
  private queue: Queue;
  private badWords: any;
  private sentimentAnalyzer: any;
  private isConfigured: boolean = false;
  private requestCount = 0;
  private lastReset = Date.now();
  private rateLimitPerMinute = 60;
  private cacheExpiryMinutes = 30;

  constructor(redis?: Redis, queue?: Queue) {
    this.redis = redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
    this.queue = queue;
    // Temporarily disabled BadWords due to import issues - using leoProfanity instead
    // this.badWords = new BadWords();
    this.sentimentAnalyzer = new sentiment();
    
    // Initialize profanity filter
    leoProfanity.loadDictionary('en');
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured. AI moderation will be disabled.');
        this.isConfigured = false;
        return;
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isConfigured = true;
      console.log('✅ OpenAI AI Moderation Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error);
      this.isConfigured = false;
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute

    if (now - this.lastReset > timeWindow) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    if (this.requestCount >= this.rateLimitPerMinute) {
      throw new Error('Rate limit exceeded for AI moderation requests');
    }

    this.requestCount++;
  }

  /**
   * Analyze text content for moderation issues
   */
  async analyzeTextContent(
    content: string,
    contentId: string,
    contentType: 'post' | 'comment' | 'message',
    userId?: string,
    context?: {
      communityId?: string;
      serverId?: string;
      parentContentId?: string;
    }
  ): Promise<ContentAnalysisResult> {
    try {
      // Check cache first
      const cacheKey = `moderation:text:${createHash('sha256').update(content).digest('hex')}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('🔄 Using cached moderation result');
        return JSON.parse(cached);
      }

      if (!this.isConfigured) {
        return this.getFallbackTextAnalysis(content);
      }

      await this.enforceRateLimit();
      const startTime = Date.now();

      // Multi-layer analysis approach
      const [
        moderationResponse,
        detailedAnalysis,
        localAnalysis,
        userBehavior
      ] = await Promise.allSettled([
        this.openai.moderations.create({ input: content }),
        this.getDetailedTextAnalysis(content),
        this.analyzeContentLocally(content),
        userId ? this.analyzeUserBehavior(userId) : null
      ]);

      const moderation = moderationResponse.status === 'fulfilled' ? moderationResponse.value.results[0] : null;
      const detailed = detailedAnalysis.status === 'fulfilled' ? detailedAnalysis.value : null;
      const local = localAnalysis.status === 'fulfilled' ? localAnalysis.value : null;
      const userRisk = userBehavior.status === 'fulfilled' ? userBehavior.value : null;

      const processingTime = Date.now() - startTime;

      // Combine results with intelligent weighting
      const result = this.combineAnalysisResults(
        moderation,
        detailed,
        local,
        userRisk,
        content,
        contentType
      );

      // Store analysis in database
      await this.storeTextAnalysis(contentId, contentType, result, processingTime);

      // Cache result
      await this.redis.setex(
        cacheKey,
        this.cacheExpiryMinutes * 60,
        JSON.stringify(result)
      );

      // Queue follow-up actions if needed
      if (result.recommended_action !== 'none' && this.queue) {
        await this.queueModerationAction(contentId, contentType, result, userId, context);
      }

      return result;
    } catch (error) {
      console.error('Error analyzing text content:', error);
      return this.getFallbackTextAnalysis(content);
    }
  }

  private async analyzeContentLocally(content: string): Promise<any> {
    const analysis = {
      profanity: this.analyzeProfanity(content),
      sentiment: this.analyzeSentiment(content),
      patterns: this.analyzePatterns(content),
      spam: this.analyzeSpamPatterns(content)
    };

    return {
      scores: {
        toxicity: Math.max(analysis.sentiment.negative, analysis.profanity.score),
        hate_speech: analysis.patterns.hate_indicators,
        harassment: analysis.patterns.harassment_indicators,
        spam: analysis.spam.score,
        nsfw: analysis.patterns.nsfw_indicators,
        violence: analysis.patterns.violence_indicators,
        self_harm: analysis.patterns.self_harm_indicators,
        identity_attack: analysis.patterns.identity_attack_indicators,
        profanity: analysis.profanity.score,
        threat: analysis.patterns.threat_indicators
      },
      confidence: 0.7,
      local_analysis: true
    };
  }

  private analyzeProfanity(content: string): { score: number; words: string[] } {
    const cleanContent = content.toLowerCase();
    const badWordsFound = this.badWords.list.filter((word: string) => 
      cleanContent.includes(word)
    );
    
    const leoProfanityScore = leoProfanity.check(content) ? 0.8 : 0;
    const badWordsScore = Math.min(badWordsFound.length * 0.2, 1.0);
    
    return {
      score: Math.max(leoProfanityScore, badWordsScore),
      words: badWordsFound
    };
  }

  private analyzeSentiment(content: string): { negative: number; positive: number; score: number } {
    const result = this.sentimentAnalyzer.analyze(content);
    const normalizedScore = Math.max(0, Math.min(1, (result.score + 10) / 20));
    
    return {
      negative: result.score < -2 ? Math.abs(result.score) / 10 : 0,
      positive: result.score > 2 ? result.score / 10 : 0,
      score: normalizedScore
    };
  }

  private analyzePatterns(content: string): any {
    const text = content.toLowerCase();
    
    // Hate speech patterns
    const hatePatterns = [
      /\b(hate|despise|loathe)\s+(all|every|these)\s+\w+/gi,
      /\b\w+\s+(are|is)\s+(trash|garbage|scum|worthless)/gi,
      /\bgo\s+kill\s+yourself/gi,
      /\bkys\b/gi
    ];

    // Violence patterns
    const violencePatterns = [
      /\b(kill|murder|hurt|harm|beat)\s+(you|them|him|her)/gi,
      /\b(shoot|stab|punch|kick)\s+/gi,
      /\bthrowing\s+hands/gi
    ];

    // Self-harm patterns
    const selfHarmPatterns = [
      /\bsuicide\b/gi,
      /\bself.harm/gi,
      /\bcut\s+myself/gi,
      /\bwant\s+to\s+die/gi
    ];

    // NSFW patterns
    const nsfwPatterns = [
      /\b(sex|sexual|nude|naked|porn)/gi,
      /\b(dick|cock|pussy|tits|ass)\b/gi
    ];

    return {
      hate_indicators: this.calculatePatternScore(text, hatePatterns),
      harassment_indicators: this.calculatePatternScore(text, hatePatterns) * 0.7,
      violence_indicators: this.calculatePatternScore(text, violencePatterns),
      self_harm_indicators: this.calculatePatternScore(text, selfHarmPatterns),
      nsfw_indicators: this.calculatePatternScore(text, nsfwPatterns),
      identity_attack_indicators: this.calculatePatternScore(text, hatePatterns) * 0.8,
      threat_indicators: this.calculatePatternScore(text, violencePatterns) * 0.9
    };
  }

  private calculatePatternScore(text: string, patterns: RegExp[]): number {
    let matches = 0;
    patterns.forEach(pattern => {
      const found = text.match(pattern);
      if (found) matches += found.length;
    });
    
    return Math.min(matches * 0.3, 1.0);
  }

  private analyzeSpamPatterns(content: string): { score: number; indicators: string[] } {
    const indicators = [];
    let score = 0;

    // Repetitive characters
    if (/(.)\1{4,}/.test(content)) {
      indicators.push('repetitive_characters');
      score += 0.3;
    }

    // Excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      indicators.push('excessive_caps');
      score += 0.4;
    }

    // URLs/links
    if (/https?:\/\/|www\./gi.test(content)) {
      indicators.push('contains_links');
      score += 0.2;
    }

    // Repetitive words
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxRepeats = Math.max(...Object.values(wordCounts));
    if (maxRepeats > 3) {
      indicators.push('repetitive_words');
      score += 0.3;
    }

    return { score: Math.min(score, 1.0), indicators };
  }

  private combineAnalysisResults(
    openaiResult: any,
    localResult: any,
    detailedResult: any,
    userBehavior: any,
    content: string,
    contentType: string
  ): ContentAnalysisResult {
    // Weight OpenAI results higher, but use local as fallback
    const weights = {
      openai: openaiResult ? 0.6 : 0,
      detailed: detailedResult ? 0.2 : 0,
      local: 0.2,
      user_behavior: userBehavior ? 0.1 : 0
    };

    const scores = {
      toxicity_score: 0,
      hate_speech_score: 0,
      harassment_score: 0,
      spam_score: 0,
      nsfw_score: 0,
      violence_score: 0,
      self_harm_score: 0,
      identity_attack_score: 0,
      profanity_score: 0,
      threat_score: 0
    };

    // Combine scores with weights
    if (openaiResult) {
      scores.toxicity_score += this.calculateToxicityScore(openaiResult, detailedResult) * weights.openai;
      scores.hate_speech_score += (openaiResult.category_scores?.hate || 0) * weights.openai;
      scores.harassment_score += (openaiResult.category_scores?.harassment || 0) * weights.openai;
      scores.nsfw_score += (openaiResult.category_scores?.sexual || 0) * weights.openai;
      scores.violence_score += (openaiResult.category_scores?.violence || 0) * weights.openai;
      scores.self_harm_score += (openaiResult.category_scores?.['self-harm'] || 0) * weights.openai;
      scores.threat_score += (openaiResult.category_scores?.['violence/graphic'] || 0) * weights.openai;
    }

    if (detailedResult) {
      scores.spam_score += (detailedResult.spam_likelihood || 0) * weights.detailed;
      scores.profanity_score += (detailedResult.profanity_score || 0) * weights.detailed;
    }

    if (localResult) {
      Object.keys(scores).forEach(key => {
        const localKey = key.replace('_score', '');
        if (localResult.scores[localKey]) {
          scores[key as keyof typeof scores] += localResult.scores[localKey] * weights.local;
        }
      });
    }

    // Apply user behavior modifier
    if (userBehavior && userBehavior.risk_score > 0.5) {
      Object.keys(scores).forEach(key => {
        scores[key as keyof typeof scores] *= (1 + userBehavior.risk_score * 0.3);
      });
    }

    // Determine overall severity and action
    const maxScore = Math.max(...Object.values(scores));
    const flaggedCategories = Object.entries(scores)
      .filter(([_, score]) => score > 0.5)
      .map(([category, _]) => category.replace('_score', ''));

    return {
      ...scores,
      overall_confidence: Math.max(
        openaiResult?.category_scores?.hate || 0,
        openaiResult?.category_scores?.harassment || 0,
        openaiResult?.category_scores?.sexual || 0,
        openaiResult?.category_scores?.violence || 0,
        openaiResult?.category_scores?.['self-harm'] || 0,
        localResult?.confidence || 0.6
      ),
      flagged_categories: flaggedCategories,
      flagged: flaggedCategories.length > 0 || (openaiResult?.flagged || false),
      recommended_action: this.determineAction(scores, maxScore, flaggedCategories),
      raw_response: {
        openai_moderation: openaiResult,
        detailed_analysis: detailedResult,
        local_analysis: localResult,
        user_behavior: userBehavior
      }
    };
  }

  private determineAction(
    scores: any,
    maxScore: number,
    flaggedCategories: string[]
  ): ContentAnalysisResult['recommended_action'] {
    // Critical content (immediate removal)
    if (maxScore >= 0.9 || 
        flaggedCategories.includes('self_harm') || 
        flaggedCategories.includes('threat')) {
      return 'remove';
    }

    // High severity (quarantine for review)
    if (maxScore >= 0.8 ||
        flaggedCategories.includes('hate_speech') ||
        flaggedCategories.includes('violence')) {
      return 'quarantine';
    }

    // Medium severity (hide from public)
    if (maxScore >= 0.6 ||
        flaggedCategories.includes('nsfw') ||
        flaggedCategories.includes('harassment')) {
      return 'hide';
    }

    // Low severity (flag for review)
    if (flaggedCategories.length > 0 || maxScore >= 0.4) {
      return 'flag';
    }

    return 'none';
  }

  private async queueModerationAction(
    contentId: string,
    contentType: string,
    result: ContentAnalysisResult,
    userId?: string,
    context?: any
  ): Promise<void> {
    if (!this.queue) return;

    await this.queue.add('process-moderation-action', {
      contentId,
      contentType,
      result,
      userId,
      context,
      timestamp: new Date().toISOString()
    }, {
      priority: result.recommended_action === 'remove' ? 1 : 
                result.recommended_action === 'quarantine' ? 2 : 3,
      delay: result.recommended_action === 'remove' ? 0 : 5000 // Immediate for removal, 5s delay for others
    });
  }

  /**
   * Get detailed text analysis using GPT-4
   */
  private async getDetailedTextAnalysis(content: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI content moderator. Analyze the following content for moderation issues and return a JSON response with these fields:
            - spam_likelihood: number 0-1
            - profanity_score: number 0-1  
            - context_appropriateness: number 0-1
            - potential_harm: number 0-1
            - flagged: boolean
            - reasoning: string explaining your analysis
            - suggested_action: one of ["none", "flag", "hide", "remove", "quarantine"]
            
            Consider context, intent, and severity. Be accurate but not overly restrictive.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const responseText = response.choices[0]?.message?.content || '{}';
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error in detailed analysis:', error);
      return {
        spam_likelihood: 0,
        profanity_score: 0,
        context_appropriateness: 1,
        potential_harm: 0,
        flagged: false,
        reasoning: 'Analysis failed',
        suggested_action: 'none'
      };
    }
  }

  /**
   * Analyze image content for moderation issues
   */
  async analyzeImageContent(
    imageUrl: string,
    fileId: string,
    userId?: string
  ): Promise<ImageAnalysisResult> {
    if (!this.isConfigured) {
      return this.getFallbackImageAnalysis();
    }

    try {
      // Use OpenAI's vision model for image analysis
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are an AI image moderator. Analyze this image for content violations and return a JSON response with:
            - nsfw_score: number 0-1 (explicit sexual content)
            - violence_score: number 0-1 (violent or graphic content)
            - explicit_content: boolean
            - suggestive_content: boolean  
            - detected_objects: array of detected objects
            - estimated_faces: number of human faces
            - detected_text: any readable text in image
            - flagged: boolean if content violates policies
            - confidence: number 0-1 for analysis confidence
            - reasoning: explanation of decision`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for content moderation:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const analysisText = response.choices[0]?.message?.content || '{}';
      const analysis = JSON.parse(analysisText);

      const result: ImageAnalysisResult = {
        nsfw_score: analysis.nsfw_score || 0,
        violence_score: analysis.violence_score || 0,
        explicit_content: analysis.explicit_content || false,
        suggestive_content: analysis.suggestive_content || false,
        detected_objects: analysis.detected_objects || [],
        detected_faces: analysis.estimated_faces || 0,
        detected_text: analysis.detected_text || '',
        moderation_labels: this.generateModerationLabels(analysis),
        confidence_score: analysis.confidence || 0.5,
        flagged: analysis.flagged || false,
        raw_response: analysis,
      };

      // Store analysis in database
      await this.storeImageAnalysis(fileId, result);

      return result;
    } catch (error) {
      console.error('Error analyzing image content:', error);
      return this.getFallbackImageAnalysis();
    }
  }

  /**
   * Check if content violates moderation rules
   */
  async checkModerationRules(
    analysis: ContentAnalysisResult,
    contentType: string,
    communityId?: string,
    serverId?: string
  ): Promise<{
    violated_rules: ModerationRule[];
    recommended_action: string;
    auto_action_required: boolean;
  }> {
    try {
      // Get applicable rules
      const rules = await this.getModerationRules(communityId, serverId);
      const violatedRules: ModerationRule[] = [];

      for (const rule of rules) {
        if (!rule.enabled) continue;

        const violated = await this.checkRuleViolation(analysis, rule);
        if (violated) {
          violatedRules.push(rule);
        }
      }

      // Determine overall action based on most severe violation
      const { action, autoAction } = this.determineOverallAction(violatedRules);

      return {
        violated_rules: violatedRules,
        recommended_action: action,
        auto_action_required: autoAction,
      };
    } catch (error) {
      console.error('Error checking moderation rules:', error);
      return {
        violated_rules: [],
        recommended_action: 'none',
        auto_action_required: false,
      };
    }
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(
    userId: string,
    timeWindowHours: number = 24
  ): Promise<{
    risk_score: number;
    behavior_flags: string[];
    recommended_action: string;
  }> {
    try {
      // Get user's recent activity and moderation history
      const userHistory = await this.getUserModerationHistory(userId);
      const recentActivity = await this.getRecentUserActivity(userId, timeWindowHours);

      // Calculate risk factors
      const riskFactors = {
        recent_violations: recentActivity.violations,
        violation_frequency: userHistory.violation_frequency,
        report_accuracy: userHistory.false_report_rate,
        content_quality: userHistory.content_quality_score,
        engagement_patterns: recentActivity.engagement_patterns,
      };

      // Calculate overall risk score
      const riskScore = this.calculateUserRiskScore(riskFactors);
      
      // Generate behavior flags
      const behaviorFlags = this.generateBehaviorFlags(riskFactors);
      
      // Recommend action based on risk
      const recommendedAction = this.recommendUserAction(riskScore, behaviorFlags);

      // Update user's risk score in database
      await this.updateUserRiskScore(userId, riskScore, behaviorFlags);

      return {
        risk_score: riskScore,
        behavior_flags: behaviorFlags,
        recommended_action: recommendedAction,
      };
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return {
        risk_score: 0,
        behavior_flags: [],
        recommended_action: 'none',
      };
    }
  }

  // Helper methods

  private calculateToxicityScore(moderation: any, detailed: any): number {
    const moderationScore = Math.max(
      moderation.category_scores.harassment || 0,
      moderation.category_scores.hate || 0,
      moderation.category_scores.violence || 0
    );
    
    const detailedScore = detailed.potential_harm || 0;
    
    return Math.max(moderationScore, detailedScore);
  }

  private getFlaggedCategories(moderation: any, detailed: any): string[] {
    const categories: string[] = [];
    
    Object.entries(moderation.categories).forEach(([category, flagged]) => {
      if (flagged) categories.push(category);
    });
    
    if (detailed.spam_likelihood > 0.7) categories.push('spam');
    if (detailed.profanity_score > 0.8) categories.push('profanity');
    
    return categories;
  }

  private getRecommendedAction(moderation: any, detailed: any): ContentAnalysisResult['recommended_action'] {
    if (moderation.category_scores['self-harm'] > 0.7) return 'quarantine';
    if (moderation.category_scores.violence > 0.8) return 'remove';
    if (moderation.category_scores.hate > 0.8) return 'remove';
    if (moderation.category_scores.sexual > 0.7) return 'hide';
    if (detailed.spam_likelihood > 0.8) return 'flag';
    if (moderation.flagged) return 'flag';
    
    return 'none';
  }

  private async storeTextAnalysis(
    contentId: string,
    contentType: string,
    result: ContentAnalysisResult,
    processingTime: number
  ): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO ai_content_analysis (
          content_id, content_type, model_name, model_version,
          toxicity_score, hate_speech_score, harassment_score, spam_score,
          nsfw_score, violence_score, self_harm_score, identity_attack_score,
          profanity_score, threat_score, overall_confidence, flagged_categories,
          raw_response, processing_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, 
        contentId, contentType, 'openai-gpt4', '2024-01',
        result.toxicity_score, result.hate_speech_score, result.harassment_score, result.spam_score,
        result.nsfw_score, result.violence_score, result.self_harm_score, result.identity_attack_score,
        result.profanity_score, result.threat_score, result.overall_confidence, JSON.stringify(result.flagged_categories),
        JSON.stringify(result.raw_response), processingTime
      );
    } catch (error) {
      console.error('Error storing text analysis:', error);
    }
  }

  private async storeImageAnalysis(fileId: string, result: ImageAnalysisResult): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO ai_image_analysis (
          file_id, analysis_type, nsfw_score, violence_score,
          explicit_content, suggestive_content, detected_objects,
          detected_faces, detected_text, moderation_labels,
          confidence_score, flagged, raw_response
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
        fileId, 'comprehensive', result.nsfw_score, result.violence_score,
        result.explicit_content, result.suggestive_content, JSON.stringify(result.detected_objects),
        result.detected_faces, result.detected_text, JSON.stringify(result.moderation_labels),
        result.confidence_score, result.flagged, JSON.stringify(result.raw_response)
      );
    } catch (error) {
      console.error('Error storing image analysis:', error);
    }
  }

  private generateModerationLabels(analysis: any): any[] {
    const labels = [];
    
    if (analysis.nsfw_score > 0.7) {
      labels.push({ category: 'nsfw', confidence: analysis.nsfw_score });
    }
    
    if (analysis.violence_score > 0.7) {
      labels.push({ category: 'violence', confidence: analysis.violence_score });
    }
    
    return labels;
  }

  private getFallbackTextAnalysis(content: string): ContentAnalysisResult {
    // Basic keyword-based fallback when AI is unavailable
    const toxicWords = ['hate', 'kill', 'die', 'stupid', 'idiot']; // Simplified example
    const foundToxic = toxicWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    return {
      toxicity_score: foundToxic ? 0.6 : 0.1,
      hate_speech_score: 0,
      harassment_score: 0,
      spam_score: 0,
      nsfw_score: 0,
      violence_score: 0,
      self_harm_score: 0,
      identity_attack_score: 0,
      profanity_score: foundToxic ? 0.5 : 0,
      threat_score: 0,
      overall_confidence: 0.3,
      flagged_categories: foundToxic ? ['profanity'] : [],
      flagged: foundToxic,
      recommended_action: foundToxic ? 'flag' : 'none',
      raw_response: { fallback: true, reason: 'AI service unavailable' },
    };
  }

  private getFallbackImageAnalysis(): ImageAnalysisResult {
    return {
      nsfw_score: 0,
      violence_score: 0,
      explicit_content: false,
      suggestive_content: false,
      detected_objects: [],
      detected_faces: 0,
      detected_text: '',
      moderation_labels: [],
      confidence_score: 0,
      flagged: false,
      raw_response: { fallback: true, reason: 'AI service unavailable' },
    };
  }

  private async getModerationRules(communityId?: string, serverId?: string): Promise<ModerationRule[]> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM moderation_rules 
        WHERE enabled = true 
        AND (community_id IS NULL OR community_id = $1)
        AND (server_id IS NULL OR server_id = $2)
        ORDER BY severity DESC
      `, communityId || null, serverId || null);
      
      return result as ModerationRule[];
    } catch (error) {
      console.error('Error fetching moderation rules:', error);
      return [];
    }
  }

  private async checkRuleViolation(analysis: ContentAnalysisResult, rule: ModerationRule): Promise<boolean> {
    const config = rule.config;
    
    if (rule.rule_type === 'ai_threshold') {
      const threshold = config.threshold || 0.5;
      const categories = config.categories || [];
      
      for (const category of categories) {
        const score = this.getScoreForCategory(analysis, category);
        if (score > threshold) {
          return true;
        }
      }
    }
    
    return false;
  }

  private getScoreForCategory(analysis: ContentAnalysisResult, category: string): number {
    switch (category) {
      case 'toxicity': return analysis.toxicity_score;
      case 'hate_speech': return analysis.hate_speech_score;
      case 'harassment': return analysis.harassment_score;
      case 'spam': return analysis.spam_score;
      case 'nsfw': return analysis.nsfw_score;
      case 'violence': return analysis.violence_score;
      case 'self_harm': return analysis.self_harm_score;
      case 'identity_attack': return analysis.identity_attack_score;
      case 'profanity': return analysis.profanity_score;
      case 'threat': return analysis.threat_score;
      default: return 0;
    }
  }

  private determineOverallAction(violatedRules: ModerationRule[]): { action: string; autoAction: boolean } {
    if (violatedRules.length === 0) {
      return { action: 'none', autoAction: false };
    }

    // Find the most severe action
    const severityOrder = ['remove', 'quarantine', 'ban_user', 'hide', 'flag'];
    let mostSevereAction = 'flag';
    let hasAutoAction = false;

    for (const rule of violatedRules) {
      if (rule.auto_action) {
        hasAutoAction = true;
      }
      
      const actionIndex = severityOrder.indexOf(rule.action);
      const currentIndex = severityOrder.indexOf(mostSevereAction);
      
      if (actionIndex !== -1 && actionIndex < currentIndex) {
        mostSevereAction = rule.action;
      }
    }

    return { action: mostSevereAction, autoAction: hasAutoAction };
  }

  private async getUserModerationHistory(userId: string): Promise<any> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM user_moderation_history WHERE user_id = $1
      `, userId);
      
      return (result as any[])[0] || {
        violation_frequency: 0,
        false_report_rate: 0,
        content_quality_score: 50,
      };
    } catch (error) {
      console.error('Error fetching user moderation history:', error);
      return {
        violation_frequency: 0,
        false_report_rate: 0,
        content_quality_score: 50,
      };
    }
  }

  private async getRecentUserActivity(userId: string, hours: number): Promise<any> {
    // This would query recent user posts, comments, reports, etc.
    // For now, returning mock data
    return {
      violations: 0,
      engagement_patterns: 'normal',
    };
  }

  private calculateUserRiskScore(factors: any): number {
    let score = 0;
    
    // Recent violations (0-40 points)
    score += Math.min(factors.recent_violations * 10, 40);
    
    // Violation frequency (0-30 points)
    score += Math.min(factors.violation_frequency * 30, 30);
    
    // False report rate (0-20 points)
    score += Math.min(factors.false_report_rate * 20, 20);
    
    // Poor content quality (0-10 points)
    if (factors.content_quality < 30) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  private generateBehaviorFlags(factors: any): string[] {
    const flags = [];
    
    if (factors.recent_violations > 2) flags.push('multiple_recent_violations');
    if (factors.violation_frequency > 0.1) flags.push('frequent_violator');
    if (factors.false_report_rate > 0.3) flags.push('unreliable_reporter');
    if (factors.content_quality < 20) flags.push('low_quality_content');
    
    return flags;
  }

  private recommendUserAction(riskScore: number, flags: string[]): string {
    if (riskScore > 80) return 'suspend_user';
    if (riskScore > 60) return 'restrict_posting';
    if (riskScore > 40) return 'increase_monitoring';
    if (riskScore > 20) return 'warning';
    
    return 'none';
  }

  private async updateUserRiskScore(userId: string, riskScore: number, flags: string[]): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO user_moderation_history (user_id, risk_score, behavior_flags, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET risk_score = $2, behavior_flags = $3, updated_at = NOW()
      `, userId, riskScore, JSON.stringify(flags));
    } catch (error) {
      console.error('Error updating user risk score:', error);
    }
  }
}

export const aiModerationService = new AIModerationService();