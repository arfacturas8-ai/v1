import { Logger } from 'pino';
import { Job } from 'bullmq';

export interface ModerationJobData {
  type: 'content-scan' | 'user-behavior' | 'spam-detection' | 'toxicity-check' | 'image-moderation' | 'auto-action' | 'report-review' | 'bulk-moderation';
  data: {
    contentId?: string;
    userId?: string;
    content?: {
      text?: string;
      images?: string[];
      videos?: string[];
      links?: string[];
    };
    context?: {
      channelId?: string;
      serverId?: string;
      messageId?: string;
      timestamp?: Date;
      userRole?: string;
      previousViolations?: number;
    };
    options?: {
      strictMode?: boolean;
      autoAction?: boolean;
      sensitivity?: 'low' | 'medium' | 'high';
      categories?: string[];
      customRules?: Record<string, any>;
    };
  };
  metadata?: {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    source: 'user-report' | 'auto-scan' | 'manual-review' | 'scheduled';
    requestedBy?: string;
    reportId?: string;
  };
}

export interface ModerationResult {
  id: string;
  type: string;
  status: 'approved' | 'flagged' | 'blocked' | 'quarantined' | 'error';
  timestamp: Date;
  processingTime: number;
  confidence: number; // 0-1 score
  violations: {
    category: 'spam' | 'harassment' | 'hate-speech' | 'explicit-content' | 'violence' | 'self-harm' | 'misinformation' | 'copyright' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    confidence: number;
    evidence?: string[];
  }[];
  actions?: {
    type: 'none' | 'warn' | 'timeout' | 'mute' | 'kick' | 'ban' | 'delete' | 'quarantine';
    duration?: number;
    reason: string;
    automated: boolean;
    appealable: boolean;
  }[];
  insights?: {
    toxicityScore?: number;
    spamProbability?: number;
    explicitContent?: boolean;
    languageDetected?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
  error?: string;
}

export class ModerationWorker {
  private isInitialized = false;
  private moderationStats = {
    contentScan: { processed: 0, flagged: 0, approved: 0, blocked: 0 },
    userBehavior: { processed: 0, flagged: 0, approved: 0, blocked: 0 },
    spamDetection: { processed: 0, flagged: 0, approved: 0, blocked: 0 },
    toxicityCheck: { processed: 0, flagged: 0, approved: 0, blocked: 0 },
    imageModeration: { processed: 0, flagged: 0, approved: 0, blocked: 0 },
    autoAction: { processed: 0, flagged: 0, approved: 0, blocked: 0 },
    reportReview: { processed: 0, flagged: 0, approved: 0, blocked: 0 },
    bulkModeration: { processed: 0, flagged: 0, approved: 0, blocked: 0 }
  };

  // Pre-defined word lists and patterns
  private spamPatterns = [
    /\b(buy now|limited time|act fast|click here)\b/gi,
    /\b(free money|make \$\d+|earn quick cash)\b/gi,
    /\b(viagra|cialis|prescription)\b/gi,
    /(https?:\/\/[^\s]+){3,}/gi, // Multiple links
    /(.)\1{10,}/gi // Repeated characters
  ];

  private toxicWords = [
    // Basic profanity and slurs (in production, use a comprehensive list)
    'hate', 'kill', 'die', 'stupid', 'idiot', 'retard', 'gay', 'cancer'
  ];

  private explicitPatterns = [
    /\b(sex|porn|nude|naked|xxx)\b/gi,
    /\b(penis|vagina|tits|boobs|ass)\b/gi
  ];

  constructor(
    private logger: Logger,
    private config: {
      ai?: {
        toxicityApi?: string;
        imageAnalysisApi?: string;
        apiKey?: string;
      };
      rules?: {
        autoModeration: boolean;
        strictMode: boolean;
        toxicityThreshold: number;
        spamThreshold: number;
        maxViolationsBeforeBan: number;
      };
      actions?: {
        enableAutoTimeout: boolean;
        enableAutoDelete: boolean;
        enableAutoMute: boolean;
        appealWindow: number; // hours
      };
      integrations?: {
        discord?: { webhookUrl: string };
        slack?: { webhookUrl: string };
        database?: { connectionString: string };
      };
    }
  ) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing moderation worker', {
        autoModeration: this.config.rules?.autoModeration,
        strictMode: this.config.rules?.strictMode,
        hasAI: !!this.config.ai?.toxicityApi,
        toxicityThreshold: this.config.rules?.toxicityThreshold || 0.7
      });

      // In production, initialize:
      // - AI moderation APIs (Perspective API, AWS Comprehend, etc.)
      // - Image analysis services (AWS Rekognition, Google Vision API)
      // - Database connections for storing moderation history
      // - External integrations

      this.isInitialized = true;
      this.logger.info('Moderation worker initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize moderation worker:', error);
      throw error;
    }
  }

  async processJob(job: Job<ModerationJobData>): Promise<ModerationResult> {
    if (!this.isInitialized) {
      throw new Error('Moderation worker not initialized');
    }

    const jobId = job.id || 'unknown';
    const startTime = Date.now();

    try {
      this.logger.info(`Processing moderation job ${jobId}`, {
        type: job.data.type,
        contentId: job.data.data.contentId,
        userId: job.data.data.userId,
        priority: job.data.metadata?.priority,
        source: job.data.metadata?.source,
        attempts: job.attemptsMade || 0
      });

      await job.updateProgress(10);

      let result: ModerationResult;

      switch (job.data.type) {
        case 'content-scan':
          result = await this.processContentScan(job.data, jobId, job);
          break;
        case 'user-behavior':
          result = await this.processUserBehavior(job.data, jobId, job);
          break;
        case 'spam-detection':
          result = await this.processSpamDetection(job.data, jobId, job);
          break;
        case 'toxicity-check':
          result = await this.processToxicityCheck(job.data, jobId, job);
          break;
        case 'image-moderation':
          result = await this.processImageModeration(job.data, jobId, job);
          break;
        case 'auto-action':
          result = await this.processAutoAction(job.data, jobId, job);
          break;
        case 'report-review':
          result = await this.processReportReview(job.data, jobId, job);
          break;
        case 'bulk-moderation':
          result = await this.processBulkModeration(job.data, jobId, job);
          break;
        default:
          throw new Error(`Unsupported moderation job type: ${job.data.type}`);
      }

      // Update statistics
      const statsKey = this.getStatsKey(job.data.type);
      if (statsKey && this.moderationStats[statsKey]) {
        this.moderationStats[statsKey].processed++;
        this.moderationStats[statsKey][result.status as keyof typeof this.moderationStats[typeof statsKey]]++;
      }

      await job.updateProgress(100);

      const processingTime = Date.now() - startTime;
      this.logger.info(`Moderation job processed successfully ${jobId}`, {
        type: job.data.type,
        status: result.status,
        confidence: result.confidence,
        violationsFound: result.violations.length,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const result: ModerationResult = {
        id: jobId,
        type: job.data.type,
        status: 'error',
        timestamp: new Date(),
        processingTime,
        confidence: 0,
        violations: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.logger.error(`Moderation job processing failed ${jobId}:`, {
        type: job.data.type,
        error: error instanceof Error ? error.message : error,
        processingTime
      });

      throw error;
    }
  }

  private async processContentScan(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(20);

    const violations: ModerationResult['violations'] = [];
    const insights: ModerationResult['insights'] = {};
    let overallConfidence = 0;

    // Text content analysis
    if (data.data.content?.text) {
      await job.updateProgress(40);

      // Spam detection
      const spamScore = this.detectSpam(data.data.content.text);
      if (spamScore > (this.config.rules?.spamThreshold || 0.7)) {
        violations.push({
          category: 'spam',
          severity: spamScore > 0.9 ? 'high' : 'medium',
          description: 'Content detected as spam',
          confidence: spamScore
        });
      }

      // Toxicity detection
      const toxicityScore = await this.analyzeToxicity(data.data.content.text);
      insights.toxicityScore = toxicityScore;
      
      if (toxicityScore > (this.config.rules?.toxicityThreshold || 0.7)) {
        violations.push({
          category: 'harassment',
          severity: toxicityScore > 0.9 ? 'critical' : 'high',
          description: 'Toxic or harmful language detected',
          confidence: toxicityScore
        });
      }

      // Explicit content detection
      const explicitScore = this.detectExplicitContent(data.data.content.text);
      if (explicitScore > 0.6) {
        violations.push({
          category: 'explicit-content',
          severity: 'medium',
          description: 'Explicit or inappropriate content detected',
          confidence: explicitScore
        });
      }
    }

    await job.updateProgress(60);

    // Image content analysis
    if (data.data.content?.images?.length) {
      const imageViolations = await this.analyzeImages(data.data.content.images);
      violations.push(...imageViolations);
    }

    await job.updateProgress(80);

    // Calculate overall confidence and determine status
    overallConfidence = violations.length > 0 
      ? violations.reduce((sum, v) => sum + v.confidence, 0) / violations.length
      : 1.0;

    let status: ModerationResult['status'] = 'approved';
    if (violations.length > 0) {
      const hasCritical = violations.some(v => v.severity === 'critical');
      const hasHigh = violations.some(v => v.severity === 'high');
      
      if (hasCritical) {
        status = 'blocked';
      } else if (hasHigh) {
        status = 'quarantined';
      } else {
        status = 'flagged';
      }
    }

    // Generate actions based on violations
    const actions: ModerationResult['actions'] = [];
    if (status === 'blocked' && this.config.rules?.autoModeration) {
      actions.push({
        type: 'delete',
        reason: 'Content blocked due to policy violations',
        automated: true,
        appealable: true
      });
    } else if (status === 'quarantined') {
      actions.push({
        type: 'quarantine',
        reason: 'Content quarantined for manual review',
        automated: true,
        appealable: true
      });
    }

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'content-scan',
      status,
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: overallConfidence,
      violations,
      actions,
      insights
    };
  }

  private async processUserBehavior(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(30);

    // Analyze user behavior patterns
    const mockBehaviorAnalysis = {
      messageFrequency: Math.random() * 10 + 1, // messages per minute
      reportCount: Math.floor(Math.random() * 5),
      violationHistory: data.data.context?.previousViolations || 0,
      accountAge: Math.floor(Math.random() * 365) + 1, // days
      suspiciousActivity: Math.random() < 0.1 // 10% chance
    };

    await job.updateProgress(60);

    const violations: ModerationResult['violations'] = [];

    // Check for suspicious patterns
    if (mockBehaviorAnalysis.messageFrequency > 8) {
      violations.push({
        category: 'spam',
        severity: 'medium',
        description: 'High message frequency detected',
        confidence: 0.8
      });
    }

    if (mockBehaviorAnalysis.suspiciousActivity) {
      violations.push({
        category: 'other',
        severity: 'high',
        description: 'Suspicious user behavior pattern detected',
        confidence: 0.9
      });
    }

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'user-behavior',
      status: violations.length > 0 ? 'flagged' : 'approved',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: violations.length > 0 ? 0.8 : 1.0,
      violations,
      insights: {
        ...mockBehaviorAnalysis
      } as any
    };
  }

  private async processSpamDetection(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(40);

    const text = data.data.content?.text || '';
    const spamScore = this.detectSpam(text);

    await job.updateProgress(80);

    const violations: ModerationResult['violations'] = [];
    if (spamScore > 0.7) {
      violations.push({
        category: 'spam',
        severity: spamScore > 0.9 ? 'high' : 'medium',
        description: 'Message identified as spam',
        confidence: spamScore
      });
    }

    return {
      id: jobId,
      type: 'spam-detection',
      status: spamScore > 0.7 ? 'flagged' : 'approved',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: spamScore > 0.7 ? spamScore : 1 - spamScore,
      violations,
      insights: {
        spamProbability: spamScore
      }
    };
  }

  private async processToxicityCheck(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(30);

    const text = data.data.content?.text || '';
    const toxicityScore = await this.analyzeToxicity(text);

    await job.updateProgress(80);

    const violations: ModerationResult['violations'] = [];
    if (toxicityScore > 0.7) {
      violations.push({
        category: 'harassment',
        severity: toxicityScore > 0.9 ? 'critical' : 'high',
        description: 'Toxic or harmful language detected',
        confidence: toxicityScore
      });
    }

    return {
      id: jobId,
      type: 'toxicity-check',
      status: toxicityScore > 0.7 ? 'flagged' : 'approved',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: toxicityScore > 0.7 ? toxicityScore : 1 - toxicityScore,
      violations,
      insights: {
        toxicityScore,
        sentiment: toxicityScore > 0.7 ? 'negative' : toxicityScore < 0.3 ? 'positive' : 'neutral'
      }
    };
  }

  private async processImageModeration(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(20);

    const images = data.data.content?.images || [];
    let violations: ModerationResult['violations'] = [];

    if (images.length > 0) {
      await job.updateProgress(50);
      violations = await this.analyzeImages(images);
    }

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'image-moderation',
      status: violations.length > 0 ? 'flagged' : 'approved',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: violations.length > 0 ? Math.max(...violations.map(v => v.confidence)) : 1.0,
      violations,
      insights: {
        imagesAnalyzed: images.length,
        explicitContent: violations.some(v => v.category === 'explicit-content')
      }
    };
  }

  private async processAutoAction(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(50);

    // Simulate taking automated moderation action
    const actions: ModerationResult['actions'] = [{
      type: 'warn',
      reason: 'Automated action triggered by policy violation',
      automated: true,
      appealable: true
    }];

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'auto-action',
      status: 'flagged',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: 0.9,
      violations: [],
      actions
    };
  }

  private async processReportReview(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(40);

    // Simulate manual report review process
    await new Promise(resolve => setTimeout(resolve, 500));

    await job.updateProgress(90);

    return {
      id: jobId,
      type: 'report-review',
      status: Math.random() > 0.7 ? 'flagged' : 'approved',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: 0.95,
      violations: [],
      insights: {
        reviewType: 'manual',
        reportId: data.metadata?.reportId
      }
    };
  }

  private async processBulkModeration(data: ModerationJobData, jobId: string, job: Job): Promise<ModerationResult> {
    await job.updateProgress(20);

    // Simulate bulk moderation processing
    const itemsProcessed = Math.floor(Math.random() * 100) + 10;
    const itemsFlagged = Math.floor(itemsProcessed * 0.1);

    await job.updateProgress(80);

    return {
      id: jobId,
      type: 'bulk-moderation',
      status: 'approved',
      timestamp: new Date(),
      processingTime: Date.now() - Date.now(),
      confidence: 0.85,
      violations: [],
      insights: {
        itemsProcessed,
        itemsFlagged,
        flaggedPercentage: (itemsFlagged / itemsProcessed) * 100
      }
    };
  }

  // Helper methods for content analysis
  private detectSpam(text: string): number {
    let spamScore = 0;
    const patterns = this.spamPatterns;

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        spamScore += matches.length * 0.2;
      }
    }

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g)?.length || 0) / text.length;
    if (capsRatio > 0.5) spamScore += 0.3;

    // Check for excessive punctuation
    const punctRatio = (text.match(/[!?]{2,}/g)?.length || 0) / text.length * 10;
    spamScore += Math.min(punctRatio, 0.3);

    return Math.min(spamScore, 1.0);
  }

  private async analyzeToxicity(text: string): Promise<number> {
    // Simple keyword-based toxicity detection (replace with AI API in production)
    let toxicityScore = 0;
    const lowerText = text.toLowerCase();

    for (const word of this.toxicWords) {
      if (lowerText.includes(word)) {
        toxicityScore += 0.2;
      }
    }

    // In production, call Perspective API or similar:
    // const response = await fetch('https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     requestedAttributes: { TOXICITY: {} },
    //     comment: { text }
    //   })
    // });

    return Math.min(toxicityScore, 1.0);
  }

  private detectExplicitContent(text: string): number {
    let explicitScore = 0;
    
    for (const pattern of this.explicitPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        explicitScore += matches.length * 0.3;
      }
    }

    return Math.min(explicitScore, 1.0);
  }

  private async analyzeImages(images: string[]): Promise<ModerationResult['violations']> {
    const violations: ModerationResult['violations'] = [];

    // In production, use AWS Rekognition, Google Vision API, or similar
    for (const image of images) {
      const mockAnalysis = {
        explicitContent: Math.random() < 0.1, // 10% chance
        violenceContent: Math.random() < 0.05, // 5% chance
        confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
      };

      if (mockAnalysis.explicitContent) {
        violations.push({
          category: 'explicit-content',
          severity: 'high',
          description: 'Explicit visual content detected',
          confidence: mockAnalysis.confidence,
          evidence: [image]
        });
      }

      if (mockAnalysis.violenceContent) {
        violations.push({
          category: 'violence',
          severity: 'high',
          description: 'Violent content detected in image',
          confidence: mockAnalysis.confidence,
          evidence: [image]
        });
      }
    }

    return violations;
  }

  private getStatsKey(type: string): keyof typeof this.moderationStats | null {
    const mapping: Record<string, keyof typeof this.moderationStats> = {
      'content-scan': 'contentScan',
      'user-behavior': 'userBehavior',
      'spam-detection': 'spamDetection',
      'toxicity-check': 'toxicityCheck',
      'image-moderation': 'imageModeration',
      'auto-action': 'autoAction',
      'report-review': 'reportReview',
      'bulk-moderation': 'bulkModeration'
    };
    return mapping[type] || null;
  }

  // Public methods for monitoring and management
  getModerationStats() {
    return { ...this.moderationStats };
  }

  resetStats(): void {
    Object.keys(this.moderationStats).forEach(key => {
      this.moderationStats[key as keyof typeof this.moderationStats] = {
        processed: 0,
        flagged: 0,
        approved: 0,
        blocked: 0
      };
    });
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalProcessed = Object.values(this.moderationStats).reduce(
      (sum, stat) => sum + stat.processed, 0
    );
    const totalFlagged = Object.values(this.moderationStats).reduce(
      (sum, stat) => sum + stat.flagged, 0
    );
    const flaggedRate = totalFlagged / totalProcessed || 0;

    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      details: {
        initialized: this.isInitialized,
        totalProcessed,
        totalFlagged,
        flaggedRate,
        autoModerationEnabled: this.config.rules?.autoModeration || false
      }
    };
  }
}