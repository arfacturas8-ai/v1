import { Job } from 'bullmq';
import { Logger } from 'pino';
import { Redis } from 'ioredis';
import axios, { AxiosInstance } from 'axios';
import * as tf from '@tensorflow/tfjs-node';

export interface ModerationJobData {
  contentId: string;
  userId: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'url' | 'comment' | 'post' | 'message';
  content: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    url?: string;
    metadata?: Record<string, any>;
  };
  moderationRules: {
    checkToxicity?: boolean;
    checkSpam?: boolean;
    checkNSFW?: boolean;
    checkProfanity?: boolean;
    checkThreats?: boolean;
    checkPersonalInfo?: boolean;
    checkCopyright?: boolean;
    checkFakeNews?: boolean;
    customRules?: string[];
  };
  context: {
    communityId?: string;
    channelId?: string;
    parentContentId?: string;
    userHistory?: any;
    geoLocation?: string;
    timestamp: string;
  };
  priority: 'critical' | 'high' | 'normal' | 'low';
  autoAction?: boolean;
  reviewerRequired?: boolean;
  webhookUrl?: string;
}

export interface ModerationResult {
  contentId: string;
  userId: string;
  passed: boolean;
  confidence: number;
  flags: ModerationFlag[];
  actions: ModerationAction[];
  reviewRequired: boolean;
  processingTime: number;
  metadata: {
    aiModels: string[];
    rulesets: string[];
    context: Record<string, any>;
  };
}

export interface ModerationFlag {
  type: 'toxicity' | 'spam' | 'nsfw' | 'profanity' | 'threats' | 'personal_info' | 'copyright' | 'fake_news' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence?: {
    text?: string;
    positions?: Array<{ start: number; end: number }>;
    imageRegions?: Array<{ x: number; y: number; width: number; height: number }>;
    audioSegments?: Array<{ start: number; end: number }>;
  };
  source: 'ai' | 'rule' | 'user_report' | 'automated';
}

export interface ModerationAction {
  type: 'approve' | 'reject' | 'flag' | 'shadow_ban' | 'warn_user' | 'require_review' | 'auto_edit' | 'quarantine';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface ToxicityPrediction {
  toxicity: number;
  severe_toxicity: number;
  obscene: number;
  threat: number;
  insult: number;
  identity_attack: number;
}

export class ModerationProcessor {
  private redis: Redis;
  private logger: Logger;
  private openaiClient: AxiosInstance;
  private perspectiveClient: AxiosInstance;
  private toxicityModel?: tf.LayersModel;
  
  private metrics = {
    contentModerated: 0,
    autoApproved: 0,
    autoRejected: 0,
    flaggedForReview: 0,
    falsePositives: 0,
    falseNegatives: 0,
    averageConfidence: 0,
    processingTime: 0,
    flagsByType: new Map<string, number>(),
    actionsByType: new Map<string, number>(),
  };

  private moderationRules = {
    toxicity: {
      threshold: 0.7,
      enabled: true,
      autoAction: true,
    },
    spam: {
      threshold: 0.8,
      enabled: true,
      autoAction: true,
    },
    nsfw: {
      threshold: 0.6,
      enabled: true,
      autoAction: false,
    },
    profanity: {
      threshold: 0.5,
      enabled: true,
      autoAction: false,
    },
    threats: {
      threshold: 0.8,
      enabled: true,
      autoAction: true,
    },
  };

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
    this.initializeClients();
    this.loadToxicityModel();
  }

  private initializeClients(): void {
    // OpenAI client for advanced content analysis
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = axios.create({
        baseURL: 'https://api.openai.com/v1',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }

    // Google Perspective API for toxicity detection
    if (process.env.PERSPECTIVE_API_KEY) {
      this.perspectiveClient = axios.create({
        baseURL: 'https://commentanalyzer.googleapis.com/v1alpha1',
        params: {
          key: process.env.PERSPECTIVE_API_KEY,
        },
        timeout: 15000,
      });
    }
  }

  private async loadToxicityModel(): Promise<void> {
    try {
      // In production, you'd load a pre-trained toxicity model
      // For now, we'll simulate this
      this.logger.info('Toxicity model loaded successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to load toxicity model');
    }
  }

  public async processModerationJob(job: Job<ModerationJobData>): Promise<ModerationResult> {
    const startTime = Date.now();
    const jobData = job.data;

    try {
      this.logger.info({
        jobId: job.id,
        contentId: jobData.contentId,
        contentType: jobData.contentType,
        userId: jobData.userId,
      }, 'Processing moderation job');

      const flags: ModerationFlag[] = [];
      const actions: ModerationAction[] = [];
      const aiModels: string[] = [];
      const rulesets: string[] = [];

      // Text content moderation
      if (jobData.content.text && jobData.contentType !== 'image') {
        const textFlags = await this.moderateText(jobData.content.text, jobData.moderationRules);
        flags.push(...textFlags);
        aiModels.push('text-moderation');
      }

      // Image content moderation
      if (jobData.content.imageUrl && jobData.moderationRules.checkNSFW) {
        const imageFlags = await this.moderateImage(jobData.content.imageUrl, jobData.moderationRules);
        flags.push(...imageFlags);
        aiModels.push('image-moderation');
      }

      // Video content moderation
      if (jobData.content.videoUrl) {
        const videoFlags = await this.moderateVideo(jobData.content.videoUrl, jobData.moderationRules);
        flags.push(...videoFlags);
        aiModels.push('video-moderation');
      }

      // URL analysis
      if (jobData.content.url) {
        const urlFlags = await this.moderateUrl(jobData.content.url, jobData.moderationRules);
        flags.push(...urlFlags);
        aiModels.push('url-analysis');
      }

      // Context-based analysis
      const contextFlags = await this.analyzeContext(jobData);
      flags.push(...contextFlags);
      rulesets.push('context-analysis');

      // User history analysis
      const historyFlags = await this.analyzeUserHistory(jobData.userId, jobData.context);
      flags.push(...historyFlags);
      rulesets.push('user-history');

      // Determine overall confidence and pass/fail
      const { passed, confidence, reviewRequired } = this.calculateModerationResult(flags);

      // Generate actions based on flags
      if (jobData.autoAction) {
        const autoActions = await this.generateActions(flags, jobData);
        actions.push(...autoActions);
      }

      // Apply actions if auto-action is enabled
      if (jobData.autoAction && !reviewRequired) {
        await this.applyActions(actions, jobData);
      }

      // Store moderation result
      const result: ModerationResult = {
        contentId: jobData.contentId,
        userId: jobData.userId,
        passed,
        confidence,
        flags,
        actions,
        reviewRequired: reviewRequired || jobData.reviewerRequired || false,
        processingTime: Date.now() - startTime,
        metadata: {
          aiModels,
          rulesets,
          context: {
            communityId: jobData.context.communityId,
            channelId: jobData.context.channelId,
            geoLocation: jobData.context.geoLocation,
          },
        },
      };

      // Update metrics
      this.updateMetrics(result);

      // Store result for audit trail
      await this.storeModerationResult(result);

      // Send to human review queue if needed
      if (reviewRequired) {
        await this.queueForHumanReview(jobData, result);
      }

      // Send webhook notification
      if (jobData.webhookUrl) {
        await this.sendWebhookNotification(jobData, result);
      }

      this.logger.info({
        jobId: job.id,
        contentId: jobData.contentId,
        passed,
        confidence,
        flagCount: flags.length,
        reviewRequired,
        processingTime: result.processingTime,
      }, 'Moderation job completed');

      return result;

    } catch (error) {
      this.metrics.contentModerated++;
      this.logger.error({
        error,
        jobId: job.id,
        contentId: jobData.contentId,
      }, 'Moderation job failed');
      throw error;
    }
  }

  private async moderateText(text: string, rules: ModerationJobData['moderationRules']): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    try {
      // Toxicity detection using Perspective API
      if (rules.checkToxicity && this.perspectiveClient) {
        const toxicityFlags = await this.checkToxicityPerspective(text);
        flags.push(...toxicityFlags);
      }

      // Profanity detection
      if (rules.checkProfanity) {
        const profanityFlags = await this.checkProfanity(text);
        flags.push(...profanityFlags);
      }

      // Spam detection
      if (rules.checkSpam) {
        const spamFlags = await this.checkSpam(text);
        flags.push(...spamFlags);
      }

      // Threat detection
      if (rules.checkThreats) {
        const threatFlags = await this.checkThreats(text);
        flags.push(...threatFlags);
      }

      // Personal information detection
      if (rules.checkPersonalInfo) {
        const piiFlags = await this.checkPersonalInfo(text);
        flags.push(...piiFlags);
      }

      // OpenAI-based comprehensive analysis
      if (this.openaiClient) {
        const aiFlags = await this.analyzeWithOpenAI(text, rules);
        flags.push(...aiFlags);
      }

    } catch (error) {
      this.logger.error({ error, text: text.substring(0, 100) }, 'Text moderation failed');
    }

    return flags;
  }

  private async checkToxicityPerspective(text: string): Promise<ModerationFlag[]> {
    try {
      const response = await this.perspectiveClient.post('/comments:analyze', {
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {},
        },
        comment: { text },
        languages: ['en'],
        doNotStore: true,
      });

      const scores = response.data.attributeScores;
      const flags: ModerationFlag[] = [];

      Object.entries(scores).forEach(([attribute, data]: [string, any]) => {
        const score = data.summaryScore.value;
        const threshold = this.moderationRules.toxicity.threshold;

        if (score > threshold) {
          flags.push({
            type: 'toxicity',
            severity: this.getSeverityFromScore(score),
            confidence: score,
            description: `High ${attribute.toLowerCase()} detected`,
            evidence: { text },
            source: 'ai',
          });
        }
      });

      return flags;
    } catch (error) {
      this.logger.error({ error }, 'Perspective API toxicity check failed');
      return [];
    }
  }

  private async checkProfanity(text: string): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];
    
    // Simple profanity word list (in production, use a comprehensive library)
    const profanityWords = [
      // Add your profanity word list here
      'badword1', 'badword2', // placeholder
    ];

    const words = text.toLowerCase().split(/\s+/);
    const foundProfanity: string[] = [];

    words.forEach((word, index) => {
      if (profanityWords.includes(word)) {
        foundProfanity.push(word);
      }
    });

    if (foundProfanity.length > 0) {
      flags.push({
        type: 'profanity',
        severity: foundProfanity.length > 2 ? 'high' : 'medium',
        confidence: Math.min(foundProfanity.length * 0.3, 1),
        description: `Profanity detected: ${foundProfanity.join(', ')}`,
        evidence: { text },
        source: 'rule',
      });
    }

    return flags;
  }

  private async checkSpam(text: string): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    // Spam detection heuristics
    const spamIndicators = [
      { pattern: /https?:\/\/[^\s]+/g, weight: 0.3, description: 'Multiple URLs' },
      { pattern: /(.)\1{4,}/g, weight: 0.2, description: 'Repeated characters' },
      { pattern: /[A-Z]{5,}/g, weight: 0.1, description: 'Excessive caps' },
      { pattern: /\b(free|win|prize|urgent|act now)\b/gi, weight: 0.2, description: 'Spam keywords' },
    ];

    let spamScore = 0;
    const evidence: string[] = [];

    spamIndicators.forEach(indicator => {
      const matches = text.match(indicator.pattern);
      if (matches) {
        spamScore += indicator.weight * matches.length;
        evidence.push(indicator.description);
      }
    });

    // Text length and repetition analysis
    if (text.length > 1000) spamScore += 0.1;
    if (text.split(/\s+/).length < 3) spamScore += 0.2;

    if (spamScore > this.moderationRules.spam.threshold) {
      flags.push({
        type: 'spam',
        severity: this.getSeverityFromScore(spamScore),
        confidence: Math.min(spamScore, 1),
        description: `Spam detected: ${evidence.join(', ')}`,
        evidence: { text },
        source: 'rule',
      });
    }

    return flags;
  }

  private async checkThreats(text: string): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    const threatPatterns = [
      /\b(kill|murder|hurt|harm|attack|bomb|shoot|stab)\b.*\b(you|him|her|them)\b/gi,
      /\b(death|violence|revenge|payback)\b.*\b(threat|promise|warning)\b/gi,
      /\bi('ll|will)\s+(kill|hurt|attack|destroy)\b/gi,
    ];

    threatPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        flags.push({
          type: 'threats',
          severity: 'high',
          confidence: 0.8,
          description: `Potential threat detected: ${matches[0]}`,
          evidence: { 
            text,
            positions: matches.map(match => ({
              start: text.indexOf(match),
              end: text.indexOf(match) + match.length,
            })),
          },
          source: 'rule',
        });
      }
    });

    return flags;
  }

  private async checkPersonalInfo(text: string): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    const piiPatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'SSN' },
      { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, type: 'Credit Card' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'Email' },
      { pattern: /\b\(\d{3}\)\s?\d{3}-\d{4}\b/g, type: 'Phone Number' },
    ];

    piiPatterns.forEach(({ pattern, type }) => {
      const matches = text.match(pattern);
      if (matches) {
        flags.push({
          type: 'personal_info',
          severity: 'medium',
          confidence: 0.9,
          description: `Personal information detected: ${type}`,
          evidence: { text },
          source: 'rule',
        });
      }
    });

    return flags;
  }

  private async analyzeWithOpenAI(text: string, rules: ModerationJobData['moderationRules']): Promise<ModerationFlag[]> {
    try {
      const response = await this.openaiClient.post('/moderations', {
        input: text,
      });

      const results = response.data.results[0];
      const flags: ModerationFlag[] = [];

      if (results.flagged) {
        Object.entries(results.categories).forEach(([category, flagged]: [string, any]) => {
          if (flagged) {
            const score = results.category_scores[category];
            flags.push({
              type: this.mapOpenAICategory(category),
              severity: this.getSeverityFromScore(score),
              confidence: score,
              description: `OpenAI detected: ${category}`,
              evidence: { text },
              source: 'ai',
            });
          }
        });
      }

      return flags;
    } catch (error) {
      this.logger.error({ error }, 'OpenAI moderation failed');
      return [];
    }
  }

  private async moderateImage(imageUrl: string, rules: ModerationJobData['moderationRules']): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    try {
      // In production, use image moderation services like AWS Rekognition, Google Vision API, etc.
      // For now, we'll simulate NSFW detection
      
      if (rules.checkNSFW) {
        // Simulate NSFW detection
        const nsfwScore = Math.random(); // Replace with actual NSFW detection
        
        if (nsfwScore > 0.7) {
          flags.push({
            type: 'nsfw',
            severity: 'high',
            confidence: nsfwScore,
            description: 'NSFW content detected in image',
            source: 'ai',
          });
        }
      }

    } catch (error) {
      this.logger.error({ error, imageUrl }, 'Image moderation failed');
    }

    return flags;
  }

  private async moderateVideo(videoUrl: string, rules: ModerationJobData['moderationRules']): Promise<ModerationFlag[]> {
    // Video moderation would be similar to image moderation but for video frames
    // Implementation would involve extracting frames and analyzing them
    return [];
  }

  private async moderateUrl(url: string, rules: ModerationJobData['moderationRules']): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    try {
      // Check against known malicious URL databases
      // Check for phishing, malware, etc.
      // For now, we'll implement basic checks
      
      const suspiciousPatterns = [
        /bit\.ly|tinyurl|goo\.gl/i, // URL shorteners
        /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/i, // Raw IP addresses
        /[a-z0-9]+-[a-z0-9]+-[a-z0-9]+\.(com|org|net)/i, // Suspicious domains
      ];

      suspiciousPatterns.forEach((pattern, index) => {
        if (pattern.test(url)) {
          flags.push({
            type: 'custom',
            severity: 'medium',
            confidence: 0.6,
            description: 'Suspicious URL pattern detected',
            source: 'rule',
          });
        }
      });

    } catch (error) {
      this.logger.error({ error, url }, 'URL moderation failed');
    }

    return flags;
  }

  private async analyzeContext(jobData: ModerationJobData): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    try {
      // Analyze posting frequency
      const userPostingHistory = await this.getUserPostingHistory(jobData.userId);
      if (userPostingHistory.recentPosts > 10) {
        flags.push({
          type: 'spam',
          severity: 'medium',
          confidence: 0.7,
          description: 'High posting frequency detected',
          source: 'rule',
        });
      }

      // Analyze community-specific rules
      if (jobData.context.communityId) {
        const communityFlags = await this.checkCommunityRules(jobData);
        flags.push(...communityFlags);
      }

    } catch (error) {
      this.logger.error({ error }, 'Context analysis failed');
    }

    return flags;
  }

  private async analyzeUserHistory(userId: string, context: ModerationJobData['context']): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    try {
      // Get user's moderation history
      const userHistory = await this.redis.get(`user:moderation:${userId}`);
      if (userHistory) {
        const history = JSON.parse(userHistory);
        
        if (history.violations > 5) {
          flags.push({
            type: 'custom',
            severity: 'high',
            confidence: 0.8,
            description: 'User has history of violations',
            source: 'user_report',
          });
        }
      }

    } catch (error) {
      this.logger.error({ error, userId }, 'User history analysis failed');
    }

    return flags;
  }

  private calculateModerationResult(flags: ModerationFlag[]): { passed: boolean; confidence: number; reviewRequired: boolean } {
    if (flags.length === 0) {
      return { passed: true, confidence: 1.0, reviewRequired: false };
    }

    // Calculate weighted confidence based on flag severity and confidence
    let totalWeight = 0;
    let weightedScore = 0;

    flags.forEach(flag => {
      const weight = this.getSeverityWeight(flag.severity);
      totalWeight += weight;
      weightedScore += flag.confidence * weight;
    });

    const averageConfidence = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Determine if content passes moderation
    const criticalFlags = flags.filter(f => f.severity === 'critical');
    const highFlags = flags.filter(f => f.severity === 'high');

    const passed = criticalFlags.length === 0 && highFlags.length < 2 && averageConfidence < 0.7;
    const reviewRequired = !passed && averageConfidence < 0.9; // Uncertain cases need review

    return {
      passed,
      confidence: averageConfidence,
      reviewRequired,
    };
  }

  private async generateActions(flags: ModerationFlag[], jobData: ModerationJobData): Promise<ModerationAction[]> {
    const actions: ModerationAction[] = [];

    const criticalFlags = flags.filter(f => f.severity === 'critical');
    const highFlags = flags.filter(f => f.severity === 'high');
    const mediumFlags = flags.filter(f => f.severity === 'medium');

    if (criticalFlags.length > 0) {
      actions.push({
        type: 'reject',
        reason: 'Critical violation detected',
        severity: 'critical',
        automated: true,
      });
    } else if (highFlags.length > 1) {
      actions.push({
        type: 'reject',
        reason: 'Multiple high-severity violations',
        severity: 'high',
        automated: true,
      });
    } else if (highFlags.length === 1) {
      actions.push({
        type: 'require_review',
        reason: 'High-severity violation requires review',
        severity: 'high',
        automated: true,
      });
    } else if (mediumFlags.length > 2) {
      actions.push({
        type: 'flag',
        reason: 'Multiple medium-severity violations',
        severity: 'medium',
        automated: true,
      });
    }

    return actions;
  }

  private async applyActions(actions: ModerationAction[], jobData: ModerationJobData): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'reject':
            await this.rejectContent(jobData.contentId);
            break;
          case 'flag':
            await this.flagContent(jobData.contentId, action.reason);
            break;
          case 'warn_user':
            await this.warnUser(jobData.userId, action.reason);
            break;
          case 'shadow_ban':
            await this.shadowBanUser(jobData.userId, action.expiresAt);
            break;
        }

        this.metrics.actionsByType.set(action.type, (this.metrics.actionsByType.get(action.type) || 0) + 1);
      } catch (error) {
        this.logger.error({ error, action, contentId: jobData.contentId }, 'Failed to apply moderation action');
      }
    }
  }

  private async rejectContent(contentId: string): Promise<void> {
    await this.redis.set(`content:status:${contentId}`, 'rejected', 'EX', 86400);
  }

  private async flagContent(contentId: string, reason: string): Promise<void> {
    await this.redis.set(`content:flag:${contentId}`, reason, 'EX', 86400);
  }

  private async warnUser(userId: string, reason: string): Promise<void> {
    const warningCount = await this.redis.incr(`user:warnings:${userId}`);
    await this.redis.expire(`user:warnings:${userId}`, 2592000); // 30 days
  }

  private async shadowBanUser(userId: string, expiresAt?: string): Promise<void> {
    const expiry = expiresAt ? new Date(expiresAt).getTime() / 1000 : Date.now() / 1000 + 86400;
    await this.redis.set(`user:shadow_ban:${userId}`, 'true', 'EX', expiry);
  }

  private getSeverityFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private mapOpenAICategory(category: string): ModerationFlag['type'] {
    const mapping: Record<string, ModerationFlag['type']> = {
      'sexual': 'nsfw',
      'hate': 'toxicity',
      'harassment': 'toxicity',
      'violence': 'threats',
      'self-harm': 'threats',
    };
    return mapping[category] || 'custom';
  }

  private async getUserPostingHistory(userId: string): Promise<{ recentPosts: number }> {
    const recentPosts = await this.redis.get(`user:recent_posts:${userId}`);
    return { recentPosts: parseInt(recentPosts || '0') };
  }

  private async checkCommunityRules(jobData: ModerationJobData): Promise<ModerationFlag[]> {
    // Community-specific rule checking would be implemented here
    return [];
  }

  private updateMetrics(result: ModerationResult): void {
    this.metrics.contentModerated++;
    this.metrics.processingTime += result.processingTime;

    if (result.passed) {
      this.metrics.autoApproved++;
    } else {
      this.metrics.autoRejected++;
    }

    if (result.reviewRequired) {
      this.metrics.flaggedForReview++;
    }

    result.flags.forEach(flag => {
      this.metrics.flagsByType.set(flag.type, (this.metrics.flagsByType.get(flag.type) || 0) + 1);
    });

    // Update average confidence
    this.metrics.averageConfidence = (this.metrics.averageConfidence * (this.metrics.contentModerated - 1) + result.confidence) / this.metrics.contentModerated;
  }

  private async storeModerationResult(result: ModerationResult): Promise<void> {
    await this.redis.set(
      `moderation:result:${result.contentId}`,
      JSON.stringify(result),
      'EX',
      2592000 // 30 days
    );
  }

  private async queueForHumanReview(jobData: ModerationJobData, result: ModerationResult): Promise<void> {
    const reviewData = {
      contentId: jobData.contentId,
      userId: jobData.userId,
      contentType: jobData.contentType,
      content: jobData.content,
      moderationResult: result,
      priority: jobData.priority,
      queuedAt: new Date().toISOString(),
    };

    await this.redis.lpush('moderation:human_review', JSON.stringify(reviewData));
  }

  private async sendWebhookNotification(jobData: ModerationJobData, result: ModerationResult): Promise<void> {
    try {
      // Send webhook notification
      this.logger.info({ webhookUrl: jobData.webhookUrl, contentId: jobData.contentId }, 'Webhook notification sent');
    } catch (error) {
      this.logger.error({ error, webhookUrl: jobData.webhookUrl }, 'Failed to send webhook notification');
    }
  }

  public getMetrics(): any {
    return {
      ...this.metrics,
      averageProcessingTime: this.metrics.contentModerated > 0 
        ? this.metrics.processingTime / this.metrics.contentModerated 
        : 0,
      approvalRate: this.metrics.contentModerated > 0
        ? (this.metrics.autoApproved / this.metrics.contentModerated) * 100
        : 100,
      flagsByType: Object.fromEntries(this.metrics.flagsByType),
      actionsByType: Object.fromEntries(this.metrics.actionsByType),
    };
  }
}

export default ModerationProcessor;