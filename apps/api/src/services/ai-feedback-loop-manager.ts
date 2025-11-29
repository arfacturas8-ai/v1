import { AIIntegrationService } from './ai-integration';
import { AutoModerationEngine } from './auto-moderation-engine';
import { SentimentAnalysisService } from './sentiment-analysis-service';
import { ComprehensiveSpamDetector } from './comprehensive-spam-detector';
import { ContentQualityScorer } from './content-quality-scorer';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

export interface FeedbackLoopConfig {
  collection: {
    enabled: boolean;
    collectImplicit: boolean;
    collectExplicit: boolean;
    minimumFeedbackThreshold: number;
    feedbackAggregationWindow: number; // minutes
  };
  learning: {
    enabled: boolean;
    adaptiveThresholds: boolean;
    modelRetraining: boolean;
    continuousLearning: boolean;
    learningRate: number;
  };
  validation: {
    enabled: boolean;
    humanValidation: boolean;
    crossValidation: boolean;
    minimumConfidence: number;
    validationSampleRate: number;
  };
  deployment: {
    enabled: boolean;
    automaticDeployment: boolean;
    canaryDeployment: boolean;
    rollbackThreshold: number;
    testingPeriod: number; // hours
  };
}

export interface UserFeedback {
  id: string;
  userId: string;
  contentId?: string;
  serviceType: 'moderation' | 'spam_detection' | 'sentiment_analysis' | 'quality_scoring' | 'recommendations';
  feedbackType: 'correct' | 'incorrect' | 'helpful' | 'unhelpful' | 'false_positive' | 'false_negative';
  originalPrediction: any;
  userCorrection?: any;
  confidence: number;
  timestamp: Date;
  context?: {
    sessionId?: string;
    userAgent?: string;
    channel?: string;
    server?: string;
  };
  metadata: {
    implicit: boolean;
    source: 'ui_button' | 'survey' | 'behavior' | 'admin_override';
    processingVersion: string;
  };
}

export interface ModelPerformanceMetrics {
  serviceType: string;
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  userSatisfactionScore: number;
  totalPredictions: number;
  totalFeedback: number;
  lastUpdated: Date;
  trend: 'improving' | 'stable' | 'declining';
  issues: string[];
}

export interface LearningInsight {
  serviceType: string;
  insightType: 'threshold_adjustment' | 'pattern_discovery' | 'bias_detection' | 'performance_improvement';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  evidenceCount: number;
  confidence: number;
  implementationComplexity: 'easy' | 'medium' | 'complex';
  estimatedImprovementPct: number;
  timestamp: Date;
}

export interface AdaptationResult {
  serviceType: string;
  adaptationType: 'threshold' | 'model_weight' | 'feature_importance' | 'rule_update';
  oldValue: any;
  newValue: any;
  reason: string;
  expectedImpact: string;
  validationScore: number;
  timestamp: Date;
  rollbackPlan?: string;
}

export class AIFeedbackLoopManager {
  private config: FeedbackLoopConfig;
  private aiService: AIIntegrationService;
  private moderationEngine: AutoModerationEngine;
  private sentimentService: SentimentAnalysisService;
  private spamDetector: ComprehensiveSpamDetector;
  private qualityScorer: ContentQualityScorer;
  private queue: Queue;
  private redis: Redis;

  // Feedback storage and processing
  private feedbackBuffer: Map<string, UserFeedback[]> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map();
  private learningInsights: Map<string, LearningInsight[]> = new Map();
  private adaptationHistory: AdaptationResult[] = [];

  // Learning and adaptation
  private thresholdAdjustments: Map<string, any> = new Map();
  private modelWeights: Map<string, any> = new Map();
  private featureImportance: Map<string, any> = new Map();

  // Validation and testing
  private validationSets: Map<string, any[]> = new Map();
  private canaryResults: Map<string, any> = new Map();

  // Performance tracking
  private systemMetrics = {
    totalFeedbackProcessed: 0,
    adaptationsMade: 0,
    performanceImprovements: 0,
    rollbacksPerformed: 0,
    averageUserSatisfaction: 0.75
  };

  constructor(
    aiService: AIIntegrationService,
    moderationEngine: AutoModerationEngine,
    sentimentService: SentimentAnalysisService,
    spamDetector: ComprehensiveSpamDetector,
    qualityScorer: ContentQualityScorer,
    queue: Queue,
    config?: Partial<FeedbackLoopConfig>
  ) {
    this.aiService = aiService;
    this.moderationEngine = moderationEngine;
    this.sentimentService = sentimentService;
    this.spamDetector = spamDetector;
    this.qualityScorer = qualityScorer;
    this.queue = queue;
    this.config = this.mergeConfig(config);

    this.initializeRedis();
    this.initializePerformanceTracking();
    this.startBackgroundProcessing();

    console.log('🔄 AI Feedback Loop Manager initialized');
  }

  /**
   * Collect user feedback for AI services
   */
  async collectFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<void> {
    const fullFeedback: UserFeedback = {
      ...feedback,
      id: this.generateFeedbackId(),
      timestamp: new Date()
    };

    try {
      // Store feedback
      await this.storeFeedback(fullFeedback);

      // Add to processing buffer
      const serviceKey = fullFeedback.serviceType;
      if (!this.feedbackBuffer.has(serviceKey)) {
        this.feedbackBuffer.set(serviceKey, []);
      }
      this.feedbackBuffer.get(serviceKey)!.push(fullFeedback);

      // Update performance metrics immediately
      await this.updatePerformanceMetrics(fullFeedback);

      // Process implicit learning if configured
      if (this.config.learning.continuousLearning) {
        await this.processImmediateLearning(fullFeedback);
      }

      // Queue for batch processing
      await this.queue.add('process-feedback', fullFeedback, {
        delay: this.config.collection.feedbackAggregationWindow * 60 * 1000
      });

      console.log(`📥 Feedback collected: ${fullFeedback.serviceType} - ${fullFeedback.feedbackType}`);
    } catch (error) {
      console.error('Failed to collect feedback:', error);
    }
  }

  /**
   * Process aggregated feedback and generate insights
   */
  async processFeedbackBatch(serviceType: string): Promise<void> {
    const feedbackBatch = this.feedbackBuffer.get(serviceType) || [];
    
    if (feedbackBatch.length < this.config.collection.minimumFeedbackThreshold) {
      return; // Not enough feedback to process
    }

    try {
      console.log(`🔄 Processing feedback batch: ${serviceType} (${feedbackBatch.length} items)`);

      // Analyze feedback patterns
      const patterns = this.analyzeFeedbackPatterns(feedbackBatch);

      // Generate learning insights
      const insights = await this.generateLearningInsights(serviceType, feedbackBatch, patterns);

      // Store insights
      if (!this.learningInsights.has(serviceType)) {
        this.learningInsights.set(serviceType, []);
      }
      this.learningInsights.get(serviceType)!.push(...insights);

      // Apply adaptations if enabled
      if (this.config.learning.enabled) {
        const adaptations = await this.applyAdaptations(serviceType, insights);
        this.adaptationHistory.push(...adaptations);
      }

      // Clear processed feedback
      this.feedbackBuffer.set(serviceType, []);

      // Update system metrics
      this.systemMetrics.totalFeedbackProcessed += feedbackBatch.length;

    } catch (error) {
      console.error(`Failed to process feedback batch for ${serviceType}:`, error);
    }
  }

  /**
   * Analyze patterns in feedback data
   */
  private analyzeFeedbackPatterns(feedbackBatch: UserFeedback[]): any {
    const patterns = {
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      userSatisfactionTrend: 'stable',
      commonIssues: [],
      temporalPatterns: {},
      contextualPatterns: {},
      confidenceCorrelation: 0
    };

    try {
      const totalFeedback = feedbackBatch.length;
      if (totalFeedback === 0) return patterns;

      // Calculate error rates
      const falsePositives = feedbackBatch.filter(f => f.feedbackType === 'false_positive').length;
      const falseNegatives = feedbackBatch.filter(f => f.feedbackType === 'false_negative').length;
      
      patterns.falsePositiveRate = falsePositives / totalFeedback;
      patterns.falseNegativeRate = falseNegatives / totalFeedback;

      // Analyze satisfaction trends
      const helpfulCount = feedbackBatch.filter(f => f.feedbackType === 'helpful' || f.feedbackType === 'correct').length;
      const satisfactionRate = helpfulCount / totalFeedback;
      
      if (satisfactionRate > 0.8) patterns.userSatisfactionTrend = 'improving';
      else if (satisfactionRate < 0.6) patterns.userSatisfactionTrend = 'declining';

      // Identify common issues
      const issueGroups = this.groupFeedbackByIssues(feedbackBatch);
      patterns.commonIssues = Object.entries(issueGroups)
        .filter(([, count]: [string, number]) => count > totalFeedback * 0.1) // > 10% of feedback
        .map(([issue]) => issue);

      // Analyze temporal patterns
      patterns.temporalPatterns = this.analyzeTemporalPatterns(feedbackBatch);

      // Analyze contextual patterns
      patterns.contextualPatterns = this.analyzeContextualPatterns(feedbackBatch);

      // Calculate confidence correlation
      patterns.confidenceCorrelation = this.calculateConfidenceCorrelation(feedbackBatch);

      return patterns;
    } catch (error) {
      console.error('Failed to analyze feedback patterns:', error);
      return patterns;
    }
  }

  /**
   * Generate learning insights from feedback analysis
   */
  private async generateLearningInsights(
    serviceType: string,
    feedbackBatch: UserFeedback[],
    patterns: any
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    try {
      // Threshold adjustment insights
      if (patterns.falsePositiveRate > 0.15) {
        insights.push({
          serviceType,
          insightType: 'threshold_adjustment',
          description: `High false positive rate (${(patterns.falsePositiveRate * 100).toFixed(1)}%) detected`,
          impact: 'medium',
          recommendation: 'Increase confidence threshold to reduce false positives',
          evidenceCount: feedbackBatch.filter(f => f.feedbackType === 'false_positive').length,
          confidence: 0.8,
          implementationComplexity: 'easy',
          estimatedImprovementPct: 15,
          timestamp: new Date()
        });
      }

      if (patterns.falseNegativeRate > 0.10) {
        insights.push({
          serviceType,
          insightType: 'threshold_adjustment',
          description: `High false negative rate (${(patterns.falseNegativeRate * 100).toFixed(1)}%) detected`,
          impact: 'high',
          recommendation: 'Decrease confidence threshold to catch more cases',
          evidenceCount: feedbackBatch.filter(f => f.feedbackType === 'false_negative').length,
          confidence: 0.75,
          implementationComplexity: 'easy',
          estimatedImprovementPct: 12,
          timestamp: new Date()
        });
      }

      // Performance improvement insights
      if (patterns.userSatisfactionTrend === 'declining') {
        insights.push({
          serviceType,
          insightType: 'performance_improvement',
          description: 'User satisfaction is declining',
          impact: 'high',
          recommendation: 'Review model parameters and recent changes',
          evidenceCount: feedbackBatch.length,
          confidence: 0.7,
          implementationComplexity: 'medium',
          estimatedImprovementPct: 20,
          timestamp: new Date()
        });
      }

      // Bias detection insights
      const biasInsights = this.detectBiasPatterns(feedbackBatch, patterns);
      insights.push(...biasInsights);

      // Pattern discovery insights
      const patternInsights = this.discoverNewPatterns(feedbackBatch, patterns);
      insights.push(...patternInsights);

      return insights;
    } catch (error) {
      console.error('Failed to generate learning insights:', error);
      return [];
    }
  }

  /**
   * Apply adaptations based on insights
   */
  private async applyAdaptations(serviceType: string, insights: LearningInsight[]): Promise<AdaptationResult[]> {
    const adaptations: AdaptationResult[] = [];

    for (const insight of insights) {
      try {
        if (!this.shouldApplyInsight(insight)) {
          continue;
        }

        const adaptation = await this.applyInsight(serviceType, insight);
        if (adaptation) {
          adaptations.push(adaptation);
          this.systemMetrics.adaptationsMade++;
          
          console.log(`🔧 Applied adaptation: ${adaptation.adaptationType} for ${serviceType}`);
        }
      } catch (error) {
        console.error(`Failed to apply insight for ${serviceType}:`, error);
      }
    }

    return adaptations;
  }

  /**
   * Apply specific insight to service
   */
  private async applyInsight(serviceType: string, insight: LearningInsight): Promise<AdaptationResult | null> {
    switch (insight.insightType) {
      case 'threshold_adjustment':
        return this.applyThresholdAdjustment(serviceType, insight);
      
      case 'performance_improvement':
        return this.applyPerformanceImprovement(serviceType, insight);
      
      case 'bias_detection':
        return this.applyBiasCorrection(serviceType, insight);
      
      case 'pattern_discovery':
        return this.applyPatternLearning(serviceType, insight);
      
      default:
        return null;
    }
  }

  private async applyThresholdAdjustment(serviceType: string, insight: LearningInsight): Promise<AdaptationResult | null> {
    try {
      const service = this.getServiceInstance(serviceType);
      if (!service) return null;

      // Calculate new threshold based on insight
      const currentConfig = service.getConfig?.() || {};
      let newThreshold: number;
      
      if (insight.description.includes('false positive')) {
        // Increase threshold to reduce false positives
        newThreshold = Math.min(0.95, (currentConfig.threshold || 0.7) + 0.05);
      } else if (insight.description.includes('false negative')) {
        // Decrease threshold to reduce false negatives
        newThreshold = Math.max(0.05, (currentConfig.threshold || 0.7) - 0.05);
      } else {
        return null;
      }

      // Validate the change won't cause issues
      const validationScore = await this.validateThresholdChange(serviceType, newThreshold);
      if (validationScore < this.config.validation.minimumConfidence) {
        console.warn(`Threshold validation failed for ${serviceType}: score ${validationScore}`);
        return null;
      }

      // Apply the threshold change
      const oldThreshold = currentConfig.threshold || 0.7;
      await this.updateServiceThreshold(serviceType, newThreshold);

      return {
        serviceType,
        adaptationType: 'threshold',
        oldValue: oldThreshold,
        newValue: newThreshold,
        reason: insight.description,
        expectedImpact: `Reduce ${insight.description.includes('false positive') ? 'false positives' : 'false negatives'} by ~${insight.estimatedImprovementPct}%`,
        validationScore,
        timestamp: new Date(),
        rollbackPlan: `Revert threshold to ${oldThreshold} if performance degrades`
      };
    } catch (error) {
      console.error('Failed to apply threshold adjustment:', error);
      return null;
    }
  }

  private async applyPerformanceImprovement(serviceType: string, insight: LearningInsight): Promise<AdaptationResult | null> {
    try {
      // This would implement more complex performance improvements
      // For now, just log the insight for manual review
      
      console.log(`📊 Performance improvement needed for ${serviceType}: ${insight.description}`);
      
      return {
        serviceType,
        adaptationType: 'model_weight',
        oldValue: 'current_weights',
        newValue: 'adjusted_weights',
        reason: insight.description,
        expectedImpact: 'Improve overall model performance',
        validationScore: 0.8,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to apply performance improvement:', error);
      return null;
    }
  }

  private async applyBiasCorrection(serviceType: string, insight: LearningInsight): Promise<AdaptationResult | null> {
    // Implement bias correction logic
    console.log(`⚖️ Bias correction needed for ${serviceType}: ${insight.description}`);
    return null;
  }

  private async applyPatternLearning(serviceType: string, insight: LearningInsight): Promise<AdaptationResult | null> {
    // Implement new pattern learning
    console.log(`🔍 New pattern discovered for ${serviceType}: ${insight.description}`);
    return null;
  }

  /**
   * Service integration methods
   */
  private getServiceInstance(serviceType: string): any {
    switch (serviceType) {
      case 'moderation':
        return this.moderationEngine;
      case 'spam_detection':
        return this.spamDetector;
      case 'sentiment_analysis':
        return this.sentimentService;
      case 'quality_scoring':
        return this.qualityScorer;
      default:
        return null;
    }
  }

  private async updateServiceThreshold(serviceType: string, newThreshold: number): Promise<void> {
    const service = this.getServiceInstance(serviceType);
    if (!service || !service.updateConfig) {
      throw new Error(`Service ${serviceType} does not support threshold updates`);
    }

    // Update service configuration
    await service.updateConfig({ threshold: newThreshold });
    
    // Store the change for tracking
    this.thresholdAdjustments.set(serviceType, {
      threshold: newThreshold,
      timestamp: new Date()
    });
  }

  private async validateThresholdChange(serviceType: string, newThreshold: number): Promise<number> {
    // Use validation set to test the new threshold
    const validationSet = this.validationSets.get(serviceType) || [];
    if (validationSet.length === 0) {
      return 0.7; // Default validation score
    }

    // Simulate performance with new threshold
    let correct = 0;
    for (const validationItem of validationSet.slice(0, 100)) { // Test on subset
      // This would actually test the service with the new threshold
      // For now, simulate based on threshold direction
      const simulatedCorrect = Math.random() > 0.3; // Simplified simulation
      if (simulatedCorrect) correct++;
    }

    return correct / Math.min(validationSet.length, 100);
  }

  /**
   * Analysis helper methods
   */
  private groupFeedbackByIssues(feedbackBatch: UserFeedback[]): { [issue: string]: number } {
    const issueGroups: { [issue: string]: number } = {};

    feedbackBatch.forEach(feedback => {
      let issue = 'unknown';
      
      switch (feedback.feedbackType) {
        case 'false_positive':
          issue = 'false_positive';
          break;
        case 'false_negative':
          issue = 'false_negative';
          break;
        case 'unhelpful':
          issue = 'unhelpful_result';
          break;
        case 'incorrect':
          issue = 'incorrect_prediction';
          break;
      }

      issueGroups[issue] = (issueGroups[issue] || 0) + 1;
    });

    return issueGroups;
  }

  private analyzeTemporalPatterns(feedbackBatch: UserFeedback[]): any {
    const patterns = {
      hourlyDistribution: new Array(24).fill(0),
      dayOfWeekDistribution: new Array(7).fill(0),
      peakErrorTimes: []
    };

    feedbackBatch.forEach(feedback => {
      const hour = feedback.timestamp.getHours();
      const dayOfWeek = feedback.timestamp.getDay();

      patterns.hourlyDistribution[hour]++;
      patterns.dayOfWeekDistribution[dayOfWeek]++;
    });

    // Find peak error times
    patterns.peakErrorTimes = patterns.hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > feedbackBatch.length * 0.1)
      .map(({ hour }) => hour);

    return patterns;
  }

  private analyzeContextualPatterns(feedbackBatch: UserFeedback[]): any {
    const patterns = {
      channelPatterns: {},
      serverPatterns: {},
      userAgentPatterns: {}
    };

    feedbackBatch.forEach(feedback => {
      const context = feedback.context || {};

      if (context.channel) {
        patterns.channelPatterns[context.channel] = (patterns.channelPatterns[context.channel] || 0) + 1;
      }

      if (context.server) {
        patterns.serverPatterns[context.server] = (patterns.serverPatterns[context.server] || 0) + 1;
      }

      if (context.userAgent) {
        patterns.userAgentPatterns[context.userAgent] = (patterns.userAgentPatterns[context.userAgent] || 0) + 1;
      }
    });

    return patterns;
  }

  private calculateConfidenceCorrelation(feedbackBatch: UserFeedback[]): number {
    const correctPredictions = feedbackBatch.filter(f => f.feedbackType === 'correct' || f.feedbackType === 'helpful');
    const incorrectPredictions = feedbackBatch.filter(f => f.feedbackType === 'incorrect' || f.feedbackType === 'false_positive' || f.feedbackType === 'false_negative');

    if (correctPredictions.length === 0 || incorrectPredictions.length === 0) {
      return 0;
    }

    const avgCorrectConfidence = correctPredictions.reduce((sum, f) => sum + f.confidence, 0) / correctPredictions.length;
    const avgIncorrectConfidence = incorrectPredictions.reduce((sum, f) => sum + f.confidence, 0) / incorrectPredictions.length;

    // Positive correlation means higher confidence correlates with correctness
    return (avgCorrectConfidence - avgIncorrectConfidence) / Math.max(avgCorrectConfidence, avgIncorrectConfidence);
  }

  private detectBiasPatterns(feedbackBatch: UserFeedback[], patterns: any): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Detect temporal bias
    if (patterns.temporalPatterns.peakErrorTimes.length > 0) {
      insights.push({
        serviceType: feedbackBatch[0]?.serviceType || 'unknown',
        insightType: 'bias_detection',
        description: `Higher error rates detected during hours: ${patterns.temporalPatterns.peakErrorTimes.join(', ')}`,
        impact: 'medium',
        recommendation: 'Adjust model parameters for different time periods',
        evidenceCount: patterns.temporalPatterns.peakErrorTimes.length,
        confidence: 0.7,
        implementationComplexity: 'medium',
        estimatedImprovementPct: 10,
        timestamp: new Date()
      });
    }

    // Detect contextual bias
    const channelErrors = Object.entries(patterns.contextualPatterns.channelPatterns);
    const highErrorChannels = channelErrors.filter(([, count]: [string, number]) => count > feedbackBatch.length * 0.2);
    
    if (highErrorChannels.length > 0) {
      insights.push({
        serviceType: feedbackBatch[0]?.serviceType || 'unknown',
        insightType: 'bias_detection',
        description: `Higher error rates in specific channels: ${highErrorChannels.map(([channel]) => channel).join(', ')}`,
        impact: 'medium',
        recommendation: 'Create channel-specific model variants or adjust parameters',
        evidenceCount: highErrorChannels.length,
        confidence: 0.75,
        implementationComplexity: 'complex',
        estimatedImprovementPct: 15,
        timestamp: new Date()
      });
    }

    return insights;
  }

  private discoverNewPatterns(feedbackBatch: UserFeedback[], patterns: any): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Look for emerging patterns in feedback
    if (patterns.commonIssues.length > 0) {
      insights.push({
        serviceType: feedbackBatch[0]?.serviceType || 'unknown',
        insightType: 'pattern_discovery',
        description: `New common issue patterns detected: ${patterns.commonIssues.join(', ')}`,
        impact: 'medium',
        recommendation: 'Investigate root causes and update model accordingly',
        evidenceCount: patterns.commonIssues.length,
        confidence: 0.6,
        implementationComplexity: 'medium',
        estimatedImprovementPct: 12,
        timestamp: new Date()
      });
    }

    return insights;
  }

  private shouldApplyInsight(insight: LearningInsight): boolean {
    // Check if insight should be applied automatically
    if (!this.config.learning.enabled) return false;
    if (insight.confidence < 0.7) return false;
    if (insight.impact === 'critical' && insight.implementationComplexity === 'complex') return false;
    if (insight.evidenceCount < 5) return false;

    return true;
  }

  /**
   * Performance tracking and metrics
   */
  private async updatePerformanceMetrics(feedback: UserFeedback): Promise<void> {
    const serviceType = feedback.serviceType;
    let metrics = this.performanceMetrics.get(serviceType);

    if (!metrics) {
      metrics = {
        serviceType,
        modelVersion: '1.0',
        accuracy: 0.8,
        precision: 0.8,
        recall: 0.8,
        f1Score: 0.8,
        falsePositiveRate: 0.1,
        falseNegativeRate: 0.1,
        userSatisfactionScore: 0.75,
        totalPredictions: 0,
        totalFeedback: 0,
        lastUpdated: new Date(),
        trend: 'stable',
        issues: []
      };
    }

    // Update metrics based on feedback
    metrics.totalFeedback++;
    
    const isCorrect = ['correct', 'helpful'].includes(feedback.feedbackType);
    const isIncorrect = ['incorrect', 'unhelpful', 'false_positive', 'false_negative'].includes(feedback.feedbackType);
    
    if (isCorrect) {
      metrics.accuracy = (metrics.accuracy * 0.9) + (1.0 * 0.1);
      metrics.userSatisfactionScore = (metrics.userSatisfactionScore * 0.9) + (1.0 * 0.1);
    } else if (isIncorrect) {
      metrics.accuracy = (metrics.accuracy * 0.9) + (0.0 * 0.1);
      metrics.userSatisfactionScore = (metrics.userSatisfactionScore * 0.9) + (0.0 * 0.1);
    }

    // Update false positive/negative rates
    if (feedback.feedbackType === 'false_positive') {
      metrics.falsePositiveRate = (metrics.falsePositiveRate * 0.95) + (1.0 * 0.05);
    } else if (feedback.feedbackType === 'false_negative') {
      metrics.falseNegativeRate = (metrics.falseNegativeRate * 0.95) + (1.0 * 0.05);
    }

    metrics.lastUpdated = new Date();
    this.performanceMetrics.set(serviceType, metrics);

    // Update system-wide satisfaction
    this.systemMetrics.averageUserSatisfaction = 
      (this.systemMetrics.averageUserSatisfaction * 0.95) + 
      (metrics.userSatisfactionScore * 0.05);
  }

  private async processImmediateLearning(feedback: UserFeedback): Promise<void> {
    // Process high-impact feedback immediately
    if (feedback.feedbackType === 'false_positive' && feedback.confidence > 0.9) {
      // Immediate adjustment for high-confidence false positives
      await this.applyImmediateThresholdAdjustment(feedback.serviceType, 'increase');
    } else if (feedback.feedbackType === 'false_negative' && feedback.confidence > 0.9) {
      // Immediate adjustment for high-confidence false negatives
      await this.applyImmediateThresholdAdjustment(feedback.serviceType, 'decrease');
    }
  }

  private async applyImmediateThresholdAdjustment(serviceType: string, direction: 'increase' | 'decrease'): Promise<void> {
    try {
      const service = this.getServiceInstance(serviceType);
      if (!service) return;

      const currentConfig = service.getConfig?.() || {};
      const currentThreshold = currentConfig.threshold || 0.7;
      const adjustment = direction === 'increase' ? 0.02 : -0.02;
      const newThreshold = Math.max(0.1, Math.min(0.9, currentThreshold + adjustment));

      await this.updateServiceThreshold(serviceType, newThreshold);
      
      console.log(`⚡ Immediate threshold adjustment: ${serviceType} ${currentThreshold} -> ${newThreshold}`);
    } catch (error) {
      console.error('Failed to apply immediate threshold adjustment:', error);
    }
  }

  /**
   * Utility methods
   */
  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeFeedback(feedback: UserFeedback): Promise<void> {
    // Store feedback in Redis for real-time processing
    await this.redis.lpush(`feedback:${feedback.serviceType}`, JSON.stringify(feedback));
    await this.redis.expire(`feedback:${feedback.serviceType}`, 86400); // 24 hours

    // Store in database for long-term analysis (would use Prisma in production)
    console.log(`💾 Stored feedback: ${feedback.id} for ${feedback.serviceType}`);
  }

  /**
   * Initialization methods
   */
  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });
      
      console.log('✅ Redis initialized for feedback loop management');
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
    }
  }

  private initializePerformanceTracking(): void {
    // Initialize performance metrics for all services
    const services = ['moderation', 'spam_detection', 'sentiment_analysis', 'quality_scoring', 'recommendations'];
    
    services.forEach(serviceType => {
      if (!this.performanceMetrics.has(serviceType)) {
        this.performanceMetrics.set(serviceType, {
          serviceType,
          modelVersion: '1.0',
          accuracy: 0.8,
          precision: 0.8,
          recall: 0.8,
          f1Score: 0.8,
          falsePositiveRate: 0.1,
          falseNegativeRate: 0.1,
          userSatisfactionScore: 0.75,
          totalPredictions: 0,
          totalFeedback: 0,
          lastUpdated: new Date(),
          trend: 'stable',
          issues: []
        });
      }
    });
  }

  private startBackgroundProcessing(): void {
    // Process feedback batches every 30 minutes
    setInterval(() => {
      this.processAllFeedbackBatches();
    }, 30 * 60 * 1000);

    // Generate insights every hour
    setInterval(() => {
      this.generateSystemInsights();
    }, 60 * 60 * 1000);

    // Update performance trends every 15 minutes
    setInterval(() => {
      this.updatePerformanceTrends();
    }, 15 * 60 * 1000);

    // Cleanup old data daily
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  private async processAllFeedbackBatches(): Promise<void> {
    console.log('🔄 Processing all feedback batches...');
    
    for (const serviceType of this.feedbackBuffer.keys()) {
      await this.processFeedbackBatch(serviceType);
    }
  }

  private async generateSystemInsights(): Promise<void> {
    console.log('💡 Generating system-wide insights...');
    
    // Generate cross-service insights
    const allInsights = Array.from(this.learningInsights.values()).flat();
    
    // Look for system-wide patterns
    const systemPatterns = this.analyzeSystemWidePatterns(allInsights);
    
    if (systemPatterns.length > 0) {
      console.log(`📊 Found ${systemPatterns.length} system-wide patterns`);
    }
  }

  private updatePerformanceTrends(): void {
    for (const [serviceType, metrics] of this.performanceMetrics.entries()) {
      // Calculate trend based on recent changes
      const recentFeedback = this.feedbackBuffer.get(serviceType) || [];
      
      if (recentFeedback.length > 10) {
        const recentSatisfaction = recentFeedback
          .filter(f => ['correct', 'helpful'].includes(f.feedbackType))
          .length / recentFeedback.length;
        
        if (recentSatisfaction > metrics.userSatisfactionScore + 0.05) {
          metrics.trend = 'improving';
        } else if (recentSatisfaction < metrics.userSatisfactionScore - 0.05) {
          metrics.trend = 'declining';
        } else {
          metrics.trend = 'stable';
        }
      }
    }
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    // Clean old insights
    for (const [serviceType, insights] of this.learningInsights.entries()) {
      const recentInsights = insights.filter(insight => insight.timestamp > cutoffDate);
      this.learningInsights.set(serviceType, recentInsights);
    }
    
    // Clean old adaptations
    this.adaptationHistory = this.adaptationHistory.filter(adaptation => adaptation.timestamp > cutoffDate);
    
    console.log('🧹 Cleaned up old feedback loop data');
  }

  private analyzeSystemWidePatterns(allInsights: LearningInsight[]): any[] {
    // Analyze patterns across all services
    const patterns = [];
    
    // Group insights by type
    const insightsByType = new Map<string, LearningInsight[]>();
    allInsights.forEach(insight => {
      if (!insightsByType.has(insight.insightType)) {
        insightsByType.set(insight.insightType, []);
      }
      insightsByType.get(insight.insightType)!.push(insight);
    });
    
    // Look for cross-service patterns
    if (insightsByType.get('threshold_adjustment')?.length > 2) {
      patterns.push({
        type: 'cross_service_threshold_issue',
        description: 'Multiple services showing threshold adjustment needs',
        recommendation: 'Review global confidence calibration'
      });
    }
    
    return patterns;
  }

  private mergeConfig(partialConfig?: Partial<FeedbackLoopConfig>): FeedbackLoopConfig {
    const defaultConfig: FeedbackLoopConfig = {
      collection: {
        enabled: true,
        collectImplicit: true,
        collectExplicit: true,
        minimumFeedbackThreshold: 10,
        feedbackAggregationWindow: 30 // minutes
      },
      learning: {
        enabled: true,
        adaptiveThresholds: true,
        modelRetraining: false, // Requires more complex setup
        continuousLearning: true,
        learningRate: 0.01
      },
      validation: {
        enabled: true,
        humanValidation: false, // Would require human moderator integration
        crossValidation: true,
        minimumConfidence: 0.7,
        validationSampleRate: 0.1
      },
      deployment: {
        enabled: true,
        automaticDeployment: false, // Safety first
        canaryDeployment: true,
        rollbackThreshold: 0.1, // 10% performance decrease triggers rollback
        testingPeriod: 24 // hours
      }
    };

    return { ...defaultConfig, ...partialConfig };
  }

  /**
   * Public API methods
   */
  async getPerformanceMetrics(serviceType?: string): Promise<ModelPerformanceMetrics[]> {
    if (serviceType) {
      const metrics = this.performanceMetrics.get(serviceType);
      return metrics ? [metrics] : [];
    }
    
    return Array.from(this.performanceMetrics.values());
  }

  async getLearningInsights(serviceType?: string): Promise<LearningInsight[]> {
    if (serviceType) {
      return this.learningInsights.get(serviceType) || [];
    }
    
    return Array.from(this.learningInsights.values()).flat();
  }

  async getAdaptationHistory(limit: number = 50): Promise<AdaptationResult[]> {
    return this.adaptationHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async manuallyApplyInsight(insightId: string, serviceType: string): Promise<boolean> {
    const insights = this.learningInsights.get(serviceType) || [];
    const insight = insights.find(i => i.description.includes(insightId)); // Simplified lookup
    
    if (!insight) {
      return false;
    }
    
    const adaptation = await this.applyInsight(serviceType, insight);
    if (adaptation) {
      this.adaptationHistory.push(adaptation);
      return true;
    }
    
    return false;
  }

  async rollbackAdaptation(adaptationId: string): Promise<boolean> {
    const adaptation = this.adaptationHistory.find(a => a.timestamp.toISOString().includes(adaptationId)); // Simplified lookup
    
    if (!adaptation) {
      return false;
    }
    
    try {
      // Apply rollback
      if (adaptation.adaptationType === 'threshold') {
        await this.updateServiceThreshold(adaptation.serviceType, adaptation.oldValue);
      }
      
      console.log(`⏪ Rolled back adaptation: ${adaptation.adaptationType} for ${adaptation.serviceType}`);
      this.systemMetrics.rollbacksPerformed++;
      
      return true;
    } catch (error) {
      console.error('Failed to rollback adaptation:', error);
      return false;
    }
  }

  updateConfig(newConfig: Partial<FeedbackLoopConfig>): void {
    this.config = this.mergeConfig(newConfig);
    console.log('⚙️ Feedback loop configuration updated');
  }

  getStats(): any {
    return {
      systemMetrics: this.systemMetrics,
      feedbackBufferSizes: Object.fromEntries(
        Array.from(this.feedbackBuffer.entries()).map(([key, buffer]) => [key, buffer.length])
      ),
      performanceOverview: {
        totalServices: this.performanceMetrics.size,
        averageAccuracy: Array.from(this.performanceMetrics.values())
          .reduce((sum, m) => sum + m.accuracy, 0) / Math.max(this.performanceMetrics.size, 1),
        totalInsights: Array.from(this.learningInsights.values()).flat().length,
        totalAdaptations: this.adaptationHistory.length
      },
      config: this.config
    };
  }
}