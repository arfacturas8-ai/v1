import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import Sentiment from 'sentiment';
import * as natural from 'natural';

export interface SentimentConfig {
  thresholds: {
    veryNegative: number;
    negative: number;
    neutral: number;
    positive: number;
    veryPositive: number;
  };
  analysis: {
    trackTrends: boolean;
    detectEmotions: boolean;
    analyzeContext: boolean;
    groupAnalysis: boolean;
  };
  monitoring: {
    alertThreshold: number; // Percentage of negative sentiment to trigger alerts
    trendWindow: number; // Time window in hours to analyze trends
    minSampleSize: number; // Minimum messages needed for trend analysis
  };
  actions: {
    flagNegativeSpikes: boolean;
    notifyModerators: boolean;
    generateReports: boolean;
    trackUserWellbeing: boolean;
  };
}

export interface SentimentResult {
  score: number; // -5 to 5 scale
  comparative: number; // Score normalized by word count
  magnitude: number; // Intensity of sentiment (0-1)
  classification: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number; // 0-1 confidence in classification
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
  };
  keywords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  context: {
    sarcasm: number;
    irony: number;
    intensity: number;
    subjectivity: number;
  };
}

export interface CommunityHealthMetrics {
  serverId: string;
  timeWindow: { start: Date; end: Date };
  overallSentiment: {
    average: number;
    distribution: { [classification: string]: number };
    trend: 'improving' | 'declining' | 'stable';
  };
  channelAnalysis: Array<{
    channelId: string;
    sentiment: number;
    messageCount: number;
    activeUsers: number;
    hotspots: string[]; // Topics causing negative sentiment
  }>;
  userWellbeing: Array<{
    userId: string;
    averageSentiment: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recentMessages: number;
    supportNeeded: boolean;
  }>;
  recommendations: Array<{
    type: 'moderation' | 'community' | 'support';
    priority: 'low' | 'medium' | 'high';
    description: string;
    suggestedActions: string[];
  }>;
}

export interface SentimentTrend {
  timestamp: Date;
  sentiment: number;
  messageCount: number;
  activeUsers: number;
  topKeywords: string[];
  events?: string[];
}

export class SentimentAnalysisService {
  private aiService: AIIntegrationService;
  private queue: Queue;
  private config: SentimentConfig;
  private sentiment: Sentiment;
  private emotionClassifier: natural.BayesClassifier;
  
  // Data storage
  private sentimentHistory: Map<string, SentimentTrend[]> = new Map();
  private userSentimentProfiles: Map<string, {
    userId: string;
    recentSentiments: Array<{ score: number; timestamp: Date }>;
    averageSentiment: number;
    volatility: number;
    lastAnalysis: Date;
  }> = new Map();
  private channelMetrics: Map<string, {
    channelId: string;
    serverId: string;
    sentimentBuffer: Array<{ score: number; timestamp: Date; userId: string }>;
    lastUpdate: Date;
  }> = new Map();

  constructor(aiService: AIIntegrationService, moderationQueue: Queue) {
    this.aiService = aiService;
    this.queue = moderationQueue;
    this.config = this.getDefaultConfig();
    this.sentiment = new Sentiment();
    this.emotionClassifier = new natural.BayesClassifier();
    
    this.initializeEmotionClassifier();
    this.startTrendAnalysis();
    this.startDataCleanup();
  }

  /**
   * Analyze sentiment of message content
   */
  async analyzeMessage(
    messageId: string,
    content: string,
    userId: string,
    channelId: string,
    serverId?: string
  ): Promise<SentimentResult> {
    try {
      // Multi-layered sentiment analysis
      const analyses = await Promise.allSettled([
        this.basicSentimentAnalysis(content),
        this.emotionDetection(content),
        this.contextualAnalysis(content),
        this.aiSentimentAnalysis(content, userId)
      ]);

      // Combine results
      const result = this.combineSentimentAnalysis(analyses, content);
      
      // Update user profile
      this.updateUserSentimentProfile(userId, result);
      
      // Update channel metrics
      if (serverId) {
        this.updateChannelMetrics(channelId, serverId, result, userId);
      }
      
      // Check for concerning patterns
      await this.checkSentimentAlerts(messageId, userId, result, serverId);
      
      // Log analysis
      await this.logSentimentAnalysis(messageId, userId, result, serverId);
      
      return result;
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return this.createNeutralResult(content);
    }
  }

  /**
   * Basic sentiment analysis using sentiment library
   */
  private async basicSentimentAnalysis(content: string): Promise<{
    score: number;
    comparative: number;
    positive: string[];
    negative: string[];
  }> {
    const analysis = this.sentiment.analyze(content);
    return {
      score: analysis.score,
      comparative: analysis.comparative,
      positive: analysis.positive || [],
      negative: analysis.negative || []
    };
  }

  /**
   * Emotion detection using ML classifier
   */
  private async emotionDetection(content: string): Promise<{
    emotions: { [emotion: string]: number };
    primaryEmotion: string;
    intensity: number;
  }> {
    try {
      // Use Naive Bayes classifier for basic emotion detection
      const classification = this.emotionClassifier.getClassifications(content);
      
      const emotions = {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        trust: 0,
        anticipation: 0
      };

      // Map classifications to emotions
      classification.forEach(({ label, value }) => {
        if (label in emotions) {
          emotions[label as keyof typeof emotions] = value;
        }
      });

      const primaryEmotion = classification[0]?.label || 'neutral';
      const intensity = classification[0]?.value || 0;

      return { emotions, primaryEmotion, intensity };
    } catch (error) {
      console.error('Emotion detection failed:', error);
      return {
        emotions: {
          joy: 0, sadness: 0, anger: 0, fear: 0,
          surprise: 0, disgust: 0, trust: 0, anticipation: 0
        },
        primaryEmotion: 'neutral',
        intensity: 0
      };
    }
  }

  /**
   * Contextual analysis for sarcasm, irony, etc.
   */
  private async contextualAnalysis(content: string): Promise<{
    sarcasm: number;
    irony: number;
    intensity: number;
    subjectivity: number;
  }> {
    let sarcasm = 0;
    let irony = 0;
    let intensity = 0;
    let subjectivity = 0;

    // Sarcasm detection patterns
    const sarcasmPatterns = [
      /\b(oh wow|oh great|fantastic|brilliant|perfect)\b.*\b(not|yeah right|sure)\b/gi,
      /\b(really|seriously|obviously)\?\s*$/gi,
      /\b(thanks|helpful|amazing|wonderful)\s*(\/s|😒|🙄)/gi
    ];

    sarcasmPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        sarcasm = Math.min(sarcasm + 0.3, 1.0);
      }
    });

    // Irony detection
    const ironyPatterns = [
      /\b(love|enjoy|adore)\b.*\b(monday|dentist|taxes|traffic)\b/gi,
      /\b(perfect timing|just what I needed|exactly what I wanted)\b/gi
    ];

    ironyPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        irony = Math.min(irony + 0.4, 1.0);
      }
    });

    // Intensity markers
    const intensityMarkers = [
      /[!]{2,}/g, // Multiple exclamation marks
      /[A-Z]{3,}/g, // ALL CAPS words
      /\b(very|extremely|incredibly|absolutely|totally|completely)\b/gi,
      /[😡😤🤬💢]/g // Angry emojis
    ];

    intensityMarkers.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        intensity = Math.min(intensity + matches.length * 0.1, 1.0);
      }
    });

    // Subjectivity (opinion vs fact)
    const subjectiveMarkers = [
      /\b(I think|I feel|I believe|in my opinion|personally|seems like)\b/gi,
      /\b(maybe|probably|possibly|likely|might|could)\b/gi,
      /\b(love|hate|like|dislike|prefer|enjoy)\b/gi
    ];

    subjectiveMarkers.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        subjectivity = Math.min(subjectivity + matches.length * 0.2, 1.0);
      }
    });

    return { sarcasm, irony, intensity, subjectivity };
  }

  /**
   * AI-powered sentiment analysis
   */
  private async aiSentimentAnalysis(content: string, userId: string): Promise<{
    score: number;
    confidence: number;
    reasoning: string[];
  }> {
    try {
      const analysis = await this.aiService.analyzeContent(content, userId, {
        checkSentiment: true,
        categorize: true
      });

      const sentimentScore = analysis.sentiment.comparative || 0;
      const confidence = analysis.confidence || 0.5;
      
      const reasoning: string[] = [];
      if (analysis.sentiment.positive.length > 0) {
        reasoning.push(`Positive words: ${analysis.sentiment.positive.join(', ')}`);
      }
      if (analysis.sentiment.negative.length > 0) {
        reasoning.push(`Negative words: ${analysis.sentiment.negative.join(', ')}`);
      }

      return {
        score: sentimentScore,
        confidence,
        reasoning
      };
    } catch (error) {
      console.error('AI sentiment analysis failed:', error);
      return { score: 0, confidence: 0, reasoning: [] };
    }
  }

  /**
   * Combine all sentiment analysis results
   */
  private combineSentimentAnalysis(
    analyses: PromiseSettledResult<any>[],
    content: string
  ): SentimentResult {
    let finalScore = 0;
    let totalWeight = 0;
    let emotions = {
      joy: 0, sadness: 0, anger: 0, fear: 0,
      surprise: 0, disgust: 0, trust: 0, anticipation: 0
    };
    let context = { sarcasm: 0, irony: 0, intensity: 0, subjectivity: 0 };
    const allPositive: string[] = [];
    const allNegative: string[] = [];

    // Process basic sentiment (weight: 0.4)
    if (analyses[0].status === 'fulfilled') {
      const basic = analyses[0].value;
      finalScore += basic.comparative * 0.4;
      totalWeight += 0.4;
      allPositive.push(...basic.positive);
      allNegative.push(...basic.negative);
    }

    // Process emotion detection (weight: 0.3)
    if (analyses[1].status === 'fulfilled') {
      const emotion = analyses[1].value;
      emotions = emotion.emotions;
      // Convert emotions to sentiment contribution
      const emotionalScore = (emotion.emotions.joy + emotion.emotions.trust) - 
                            (emotion.emotions.sadness + emotion.emotions.anger + emotion.emotions.fear);
      finalScore += emotionalScore * 0.3;
      totalWeight += 0.3;
    }

    // Process contextual analysis (weight: 0.2)
    if (analyses[2].status === 'fulfilled') {
      const contextual = analyses[2].value;
      context = contextual;
      // Adjust score based on context
      if (contextual.sarcasm > 0.5) {
        finalScore *= -1; // Flip sentiment if sarcastic
      }
    }

    // Process AI analysis (weight: 0.1)
    if (analyses[3].status === 'fulfilled') {
      const ai = analyses[3].value;
      finalScore += ai.score * 0.1;
      totalWeight += 0.1;
    }

    // Normalize final score
    if (totalWeight > 0) {
      finalScore = finalScore / totalWeight;
    }

    // Calculate magnitude and classification
    const magnitude = Math.abs(finalScore);
    const classification = this.classifySentiment(finalScore);
    const confidence = Math.min(magnitude, 1.0);

    // Calculate comparative score
    const wordCount = content.split(/\s+/).length;
    const comparative = wordCount > 0 ? finalScore / wordCount : 0;

    return {
      score: Math.max(-5, Math.min(5, finalScore * 5)), // Scale to -5 to 5
      comparative,
      magnitude,
      classification,
      confidence,
      emotions,
      keywords: {
        positive: [...new Set(allPositive)],
        negative: [...new Set(allNegative)],
        neutral: this.extractNeutralKeywords(content)
      },
      context
    };
  }

  /**
   * Classify sentiment based on score
   */
  private classifySentiment(score: number): 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive' {
    if (score <= this.config.thresholds.veryNegative) return 'very_negative';
    if (score <= this.config.thresholds.negative) return 'negative';
    if (score >= this.config.thresholds.veryPositive) return 'very_positive';
    if (score >= this.config.thresholds.positive) return 'positive';
    return 'neutral';
  }

  /**
   * Extract neutral keywords
   */
  private extractNeutralKeywords(content: string): string[] {
    const neutralWords = content
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.sentiment.analyze(word).comparative) // Words with no sentiment
      .slice(0, 5);
    
    return neutralWords;
  }

  /**
   * Update user sentiment profile
   */
  private updateUserSentimentProfile(userId: string, result: SentimentResult): void {
    let profile = this.userSentimentProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        recentSentiments: [],
        averageSentiment: 0,
        volatility: 0,
        lastAnalysis: new Date()
      };
    }

    // Add new sentiment score
    profile.recentSentiments.push({
      score: result.score,
      timestamp: new Date()
    });

    // Keep only last 50 messages
    if (profile.recentSentiments.length > 50) {
      profile.recentSentiments = profile.recentSentiments.slice(-50);
    }

    // Calculate average sentiment
    profile.averageSentiment = profile.recentSentiments.reduce((sum, s) => sum + s.score, 0) / 
                              profile.recentSentiments.length;

    // Calculate volatility (standard deviation)
    const variance = profile.recentSentiments.reduce((sum, s) => 
      sum + Math.pow(s.score - profile.averageSentiment, 2), 0) / profile.recentSentiments.length;
    profile.volatility = Math.sqrt(variance);

    profile.lastAnalysis = new Date();
    this.userSentimentProfiles.set(userId, profile);
  }

  /**
   * Update channel metrics
   */
  private updateChannelMetrics(
    channelId: string,
    serverId: string,
    result: SentimentResult,
    userId: string
  ): void {
    let metrics = this.channelMetrics.get(channelId);
    
    if (!metrics) {
      metrics = {
        channelId,
        serverId,
        sentimentBuffer: [],
        lastUpdate: new Date()
      };
    }

    metrics.sentimentBuffer.push({
      score: result.score,
      timestamp: new Date(),
      userId
    });

    // Keep only last 1000 messages
    if (metrics.sentimentBuffer.length > 1000) {
      metrics.sentimentBuffer = metrics.sentimentBuffer.slice(-1000);
    }

    metrics.lastUpdate = new Date();
    this.channelMetrics.set(channelId, metrics);
  }

  /**
   * Check for sentiment-based alerts
   */
  private async checkSentimentAlerts(
    messageId: string,
    userId: string,
    result: SentimentResult,
    serverId?: string
  ): Promise<void> {
    try {
      // Check for very negative user sentiment patterns
      const userProfile = this.userSentimentProfiles.get(userId);
      if (userProfile && this.config.actions.trackUserWellbeing) {
        const recentNegative = userProfile.recentSentiments
          .filter(s => s.score < -2)
          .filter(s => Date.now() - s.timestamp.getTime() < 24 * 60 * 60 * 1000); // Last 24 hours

        if (recentNegative.length >= 5) { // 5+ very negative messages in 24 hours
          await this.queue.add('user-wellbeing-alert', {
            userId,
            averageSentiment: userProfile.averageSentiment,
            negativeMessageCount: recentNegative.length,
            serverId,
            recommendation: 'Consider reaching out with support resources'
          });
        }
      }

      // Check for negative community trends
      if (serverId && this.config.actions.flagNegativeSpikes) {
        const serverTrends = this.sentimentHistory.get(serverId);
        if (serverTrends && serverTrends.length >= 3) {
          const recentTrends = serverTrends.slice(-3);
          const averageRecent = recentTrends.reduce((sum, t) => sum + t.sentiment, 0) / recentTrends.length;
          
          if (averageRecent < -1.5) { // Consistently negative trend
            await this.queue.add('community-sentiment-alert', {
              serverId,
              averageSentiment: averageRecent,
              trendDirection: 'declining',
              recommendation: 'Review recent community activity and moderate discussions'
            });
          }
        }
      }
    } catch (error) {
      console.error('Sentiment alert check failed:', error);
    }
  }

  /**
   * Generate community health report
   */
  async generateCommunityHealthReport(serverId: string, hours: number = 24): Promise<CommunityHealthMetrics> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

      // Get server sentiment trends
      const trends = this.sentimentHistory.get(serverId) || [];
      const relevantTrends = trends.filter(t => t.timestamp >= startTime);

      if (relevantTrends.length === 0) {
        return this.createEmptyHealthReport(serverId, startTime, endTime);
      }

      // Calculate overall sentiment metrics
      const overallSentiment = this.calculateOverallSentiment(relevantTrends);
      
      // Analyze channels
      const channelAnalysis = this.analyzeChannelSentiments(serverId, startTime);
      
      // Analyze user wellbeing
      const userWellbeing = this.analyzeUserWellbeing(serverId, startTime);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        overallSentiment,
        channelAnalysis,
        userWellbeing
      );

      return {
        serverId,
        timeWindow: { start: startTime, end: endTime },
        overallSentiment,
        channelAnalysis,
        userWellbeing,
        recommendations
      };
    } catch (error) {
      console.error('Community health report generation failed:', error);
      return this.createEmptyHealthReport(serverId, new Date(), new Date());
    }
  }

  /**
   * Calculate overall sentiment metrics
   */
  private calculateOverallSentiment(trends: SentimentTrend[]): {
    average: number;
    distribution: { [classification: string]: number };
    trend: 'improving' | 'declining' | 'stable';
  } {
    const average = trends.reduce((sum, t) => sum + t.sentiment, 0) / trends.length;
    
    // Calculate distribution
    const distribution = {
      very_negative: 0,
      negative: 0,
      neutral: 0,
      positive: 0,
      very_positive: 0
    };

    trends.forEach(t => {
      const classification = this.classifySentiment(t.sentiment / 5); // Normalize to -1 to 1
      distribution[classification]++;
    });

    // Normalize distribution to percentages
    Object.keys(distribution).forEach(key => {
      distribution[key] = (distribution[key] / trends.length) * 100;
    });

    // Calculate trend direction
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (trends.length >= 3) {
      const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
      const secondHalf = trends.slice(Math.floor(trends.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, t) => sum + t.sentiment, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, t) => sum + t.sentiment, 0) / secondHalf.length;
      
      const difference = secondAvg - firstAvg;
      if (difference > 0.5) trend = 'improving';
      else if (difference < -0.5) trend = 'declining';
    }

    return { average, distribution, trend };
  }

  /**
   * Analyze channel sentiments
   */
  private analyzeChannelSentiments(serverId: string, startTime: Date): Array<{
    channelId: string;
    sentiment: number;
    messageCount: number;
    activeUsers: number;
    hotspots: string[];
  }> {
    const channelAnalysis: Array<{
      channelId: string;
      sentiment: number;
      messageCount: number;
      activeUsers: number;
      hotspots: string[];
    }> = [];

    for (const [channelId, metrics] of this.channelMetrics.entries()) {
      if (metrics.serverId !== serverId) continue;

      const recentMessages = metrics.sentimentBuffer.filter(s => s.timestamp >= startTime);
      if (recentMessages.length === 0) continue;

      const averageSentiment = recentMessages.reduce((sum, s) => sum + s.score, 0) / recentMessages.length;
      const uniqueUsers = new Set(recentMessages.map(s => s.userId)).size;

      // Identify negative sentiment hotspots (simplified)
      const negativeMessages = recentMessages.filter(s => s.score < -2);
      const hotspots = negativeMessages.length > 3 ? ['Negative discussion spike'] : [];

      channelAnalysis.push({
        channelId,
        sentiment: averageSentiment,
        messageCount: recentMessages.length,
        activeUsers: uniqueUsers,
        hotspots
      });
    }

    return channelAnalysis;
  }

  /**
   * Analyze user wellbeing
   */
  private analyzeUserWellbeing(serverId: string, startTime: Date): Array<{
    userId: string;
    averageSentiment: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recentMessages: number;
    supportNeeded: boolean;
  }> {
    const userAnalysis: Array<{
      userId: string;
      averageSentiment: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recentMessages: number;
      supportNeeded: boolean;
    }> = [];

    for (const [userId, profile] of this.userSentimentProfiles.entries()) {
      const recentSentiments = profile.recentSentiments.filter(s => s.timestamp >= startTime);
      if (recentSentiments.length === 0) continue;

      const averageSentiment = recentSentiments.reduce((sum, s) => sum + s.score, 0) / recentSentiments.length;
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (averageSentiment < -3) riskLevel = 'critical';
      else if (averageSentiment < -2) riskLevel = 'high';
      else if (averageSentiment < -1) riskLevel = 'medium';

      const supportNeeded = riskLevel === 'high' || riskLevel === 'critical';

      userAnalysis.push({
        userId,
        averageSentiment,
        riskLevel,
        recentMessages: recentSentiments.length,
        supportNeeded
      });
    }

    return userAnalysis.sort((a, b) => a.averageSentiment - b.averageSentiment); // Most negative first
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    overallSentiment: any,
    channelAnalysis: any[],
    userWellbeing: any[]
  ): Array<{
    type: 'moderation' | 'community' | 'support';
    priority: 'low' | 'medium' | 'high';
    description: string;
    suggestedActions: string[];
  }> {
    const recommendations: Array<{
      type: 'moderation' | 'community' | 'support';
      priority: 'low' | 'medium' | 'high';
      description: string;
      suggestedActions: string[];
    }> = [];

    // Overall sentiment recommendations
    if (overallSentiment.average < -1.5) {
      recommendations.push({
        type: 'community',
        priority: 'high',
        description: 'Community sentiment is significantly negative',
        suggestedActions: [
          'Review recent events or changes',
          'Increase positive community activities',
          'Consider community feedback session',
          'Review moderation policies'
        ]
      });
    } else if (overallSentiment.trend === 'declining') {
      recommendations.push({
        type: 'community',
        priority: 'medium',
        description: 'Community sentiment is declining',
        suggestedActions: [
          'Monitor trending topics',
          'Engage with community more frequently',
          'Plan positive community events'
        ]
      });
    }

    // Channel-specific recommendations
    const negativeChannels = channelAnalysis.filter(c => c.sentiment < -1);
    if (negativeChannels.length > 0) {
      recommendations.push({
        type: 'moderation',
        priority: 'medium',
        description: `${negativeChannels.length} channel(s) showing negative sentiment patterns`,
        suggestedActions: [
          'Review channel discussions',
          'Increase moderation presence',
          'Consider temporary topic restrictions',
          'Facilitate constructive discussions'
        ]
      });
    }

    // User wellbeing recommendations
    const usersNeedingSupport = userWellbeing.filter(u => u.supportNeeded);
    if (usersNeedingSupport.length > 0) {
      recommendations.push({
        type: 'support',
        priority: 'high',
        description: `${usersNeedingSupport.length} user(s) may need support or intervention`,
        suggestedActions: [
          'Reach out to users privately',
          'Provide mental health resources',
          'Consider professional support referrals',
          'Monitor for concerning behavior patterns'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private createNeutralResult(content: string): SentimentResult {
    return {
      score: 0,
      comparative: 0,
      magnitude: 0,
      classification: 'neutral',
      confidence: 0.5,
      emotions: {
        joy: 0, sadness: 0, anger: 0, fear: 0,
        surprise: 0, disgust: 0, trust: 0, anticipation: 0
      },
      keywords: {
        positive: [],
        negative: [],
        neutral: content.split(/\s+/).slice(0, 3)
      },
      context: { sarcasm: 0, irony: 0, intensity: 0, subjectivity: 0 }
    };
  }

  private createEmptyHealthReport(serverId: string, start: Date, end: Date): CommunityHealthMetrics {
    return {
      serverId,
      timeWindow: { start, end },
      overallSentiment: {
        average: 0,
        distribution: { neutral: 100, positive: 0, negative: 0, very_positive: 0, very_negative: 0 },
        trend: 'stable'
      },
      channelAnalysis: [],
      userWellbeing: [],
      recommendations: []
    };
  }

  private async logSentimentAnalysis(
    messageId: string,
    userId: string,
    result: SentimentResult,
    serverId?: string
  ): Promise<void> {
    try {
      if (serverId && (result.classification === 'very_negative' || result.classification === 'very_positive')) {
        await prisma.auditLog.create({
          data: {
            serverId,
            userId: 'system',
            targetId: userId,
            actionType: 994, // Sentiment analysis action type
            reason: `Sentiment analysis: ${result.classification}`,
            options: {
              messageId,
              score: result.score,
              classification: result.classification,
              confidence: result.confidence,
              primaryEmotion: Object.keys(result.emotions).reduce((a, b) => 
                result.emotions[a as keyof typeof result.emotions] > result.emotions[b as keyof typeof result.emotions] ? a : b
              ),
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      console.log(`😊 Sentiment: ${result.classification} (${result.score.toFixed(2)}) - Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Failed to log sentiment analysis:', error);
    }
  }

  /**
   * Initialize emotion classifier
   */
  private initializeEmotionClassifier(): void {
    try {
      // Basic training data for emotions
      const emotionTrainingData = [
        { text: 'I love this so much happy excited amazing', label: 'joy' },
        { text: 'this is terrible awful bad disappointed sad', label: 'sadness' },
        { text: 'I am furious angry mad frustrated upset', label: 'anger' },
        { text: 'I am scared worried afraid nervous anxious', label: 'fear' },
        { text: 'wow amazing incredible unbelievable surprised', label: 'surprise' },
        { text: 'disgusting gross horrible revolting sick', label: 'disgust' },
        { text: 'I trust believe confident reliable honest', label: 'trust' },
        { text: 'excited looking forward anticipating eager', label: 'anticipation' }
      ];

      emotionTrainingData.forEach(item => {
        this.emotionClassifier.addDocument(item.text, item.label);
      });

      this.emotionClassifier.train();
      console.log('🧠 Emotion classifier initialized');
    } catch (error) {
      console.error('Failed to initialize emotion classifier:', error);
    }
  }

  /**
   * Start trend analysis
   */
  private startTrendAnalysis(): void {
    setInterval(() => {
      this.generateTrendSnapshots();
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  /**
   * Generate trend snapshots
   */
  private generateTrendSnapshots(): void {
    const now = new Date();
    
    for (const [channelId, metrics] of this.channelMetrics.entries()) {
      const serverId = metrics.serverId;
      const recentMessages = metrics.sentimentBuffer.filter(s => 
        now.getTime() - s.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
      );

      if (recentMessages.length === 0) continue;

      const averageSentiment = recentMessages.reduce((sum, s) => sum + s.score, 0) / recentMessages.length;
      const activeUsers = new Set(recentMessages.map(s => s.userId)).size;

      // Get server trends
      let serverTrends = this.sentimentHistory.get(serverId) || [];
      
      // Add new trend point
      serverTrends.push({
        timestamp: now,
        sentiment: averageSentiment,
        messageCount: recentMessages.length,
        activeUsers,
        topKeywords: [] // Would extract from actual messages
      });

      // Keep only last 96 data points (24 hours of 15-minute intervals)
      if (serverTrends.length > 96) {
        serverTrends = serverTrends.slice(-96);
      }

      this.sentimentHistory.set(serverId, serverTrends);
    }
  }

  /**
   * Start data cleanup
   */
  private startDataCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

      // Clean up user profiles
      for (const [userId, profile] of this.userSentimentProfiles.entries()) {
        profile.recentSentiments = profile.recentSentiments.filter(s => 
          s.timestamp.getTime() > oneWeekAgo
        );
        
        if (profile.recentSentiments.length === 0) {
          this.userSentimentProfiles.delete(userId);
        }
      }

      // Clean up channel metrics
      for (const [channelId, metrics] of this.channelMetrics.entries()) {
        metrics.sentimentBuffer = metrics.sentimentBuffer.filter(s => 
          s.timestamp.getTime() > oneWeekAgo
        );
        
        if (metrics.sentimentBuffer.length === 0) {
          this.channelMetrics.delete(channelId);
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): SentimentConfig {
    return {
      thresholds: {
        veryNegative: -0.8,
        negative: -0.3,
        neutral: 0.3,
        positive: 0.3,
        veryPositive: 0.8
      },
      analysis: {
        trackTrends: true,
        detectEmotions: true,
        analyzeContext: true,
        groupAnalysis: true
      },
      monitoring: {
        alertThreshold: 70, // 70% negative sentiment
        trendWindow: 24, // 24 hours
        minSampleSize: 10
      },
      actions: {
        flagNegativeSpikes: true,
        notifyModerators: true,
        generateReports: true,
        trackUserWellbeing: true
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SentimentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalAnalyses: number;
    userProfiles: number;
    channelsMonitored: number;
    averageServerSentiment: { [serverId: string]: number };
    emotionDistribution: { [emotion: string]: number };
  } {
    const averageServerSentiment: { [serverId: string]: number } = {};
    
    for (const [serverId, trends] of this.sentimentHistory.entries()) {
      if (trends.length > 0) {
        averageServerSentiment[serverId] = trends.reduce((sum, t) => sum + t.sentiment, 0) / trends.length;
      }
    }

    // This would be implemented with proper metrics collection
    return {
      totalAnalyses: 0,
      userProfiles: this.userSentimentProfiles.size,
      channelsMonitored: this.channelMetrics.size,
      averageServerSentiment,
      emotionDistribution: {}
    };
  }
}