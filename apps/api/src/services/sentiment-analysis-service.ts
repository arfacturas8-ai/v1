import { AIIntegrationService } from './ai-integration';
import { Queue } from 'bullmq';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';
import * as natural from 'natural';

export interface SentimentAnalysisConfig {
  processing: {
    batchSize: number;
    processingInterval: number; // milliseconds
    enableRealTime: boolean;
    enableBatchProcessing: boolean;
  };
  analysis: {
    useAI: boolean;
    useNLP: boolean;
    enableEmotionDetection: boolean;
    enableIntentAnalysis: boolean;
    enableContextualAnalysis: boolean;
    confidenceThreshold: number;
  };
  monitoring: {
    enableDashboard: boolean;
    alertThresholds: {
      negativeSentimentSpike: number;
      toxicityLevel: number;
      communityHealthScore: number;
    };
    trackingWindow: number; // hours
    aggregationLevels: ('user' | 'channel' | 'server' | 'global')[];
  };
  storage: {
    retentionPeriod: number; // days
    enableHistoricalAnalysis: boolean;
    compressionLevel: 'none' | 'basic' | 'aggressive';
  };
}

export interface SentimentData {
  messageId: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId?: string;
  timestamp: Date;
  sentiment: {
    score: number; // -1 to 1
    magnitude: number; // 0 to 1
    classification: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    confidence: number;
  };
  emotions?: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    trust: number;
    anticipation: number;
    disgust: number;
  };
  context: {
    replyTo?: string;
    threadContext?: string[];
    conversationFlow?: 'escalating' | 'de-escalating' | 'neutral';
    topicSentiment?: string;
  };
  metadata: {
    processingTime: number;
    algorithmUsed: string;
    version: string;
    flags?: string[];
  };
}

export interface SentimentTrend {
  timeframe: string; // '1h', '24h', '7d', etc.
  scope: {
    type: 'user' | 'channel' | 'server' | 'global';
    id?: string;
  };
  metrics: {
    averageSentiment: number;
    sentimentVolatility: number;
    messageCount: number;
    distribution: {
      veryNegative: number;
      negative: number;
      neutral: number;
      positive: number;
      veryPositive: number;
    };
    topEmotions: Array<{ emotion: string; score: number }>;
    healthScore: number; // 0-100
  };
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  timestamp: Date;
}

export interface CommunityHealthMetrics {
  overall: {
    healthScore: number; // 0-100
    trendDirection: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
  };
  breakdown: {
    sentimentHealth: number;
    engagementHealth: number;
    toxicityLevel: number;
    communityGrowth: number;
  };
  channels: Array<{
    channelId: string;
    channelName: string;
    healthScore: number;
    primaryIssues: string[];
    messageVolume: number;
    averageSentiment: number;
  }>;
  users: Array<{
    userId: string;
    username: string;
    sentimentProfile: 'positive' | 'neutral' | 'negative' | 'volatile';
    riskLevel: 'low' | 'medium' | 'high';
    recentTrend: 'improving' | 'stable' | 'declining';
    interventionRecommended: boolean;
  }>;
  recommendations: Array<{
    type: 'channel_moderation' | 'user_support' | 'community_event' | 'policy_update';
    priority: number;
    description: string;
    estimatedImpact: string;
  }>;
}

export class SentimentAnalysisService {
  private config: SentimentAnalysisConfig;
  private aiService: AIIntegrationService;
  private queue: Queue;
  private redis: Redis;

  // Analysis components
  private sentimentAnalyzer: natural.SentimentAnalyzer;
  private stemmer: natural.PorterStemmer;
  private tokenizer: any;

  // Data storage and caching
  private sentimentCache: Map<string, SentimentData> = new Map();
  private trendCache: Map<string, SentimentTrend> = new Map();
  private healthMetricsCache: CommunityHealthMetrics | null = null;

  // Real-time tracking
  private realTimeBuffer: Map<string, SentimentData[]> = new Map();
  private alertSubscribers: Set<(alert: any) => void> = new Set();

  // Performance monitoring
  private processingStats: {
    totalProcessed: number;
    averageProcessingTime: number;
    errorRate: number;
    cacheHitRate: number;
  } = {
    totalProcessed: 0,
    averageProcessingTime: 0,
    errorRate: 0,
    cacheHitRate: 0
  };

  constructor(
    aiService: AIIntegrationService,
    queue: Queue,
    config?: Partial<SentimentAnalysisConfig>
  ) {
    this.aiService = aiService;
    this.queue = queue;
    this.config = this.mergeConfig(config);

    this.initializeRedis();
    this.initializeNLPComponents();
    this.startBackgroundProcessing();

    console.log('📊 Sentiment Analysis Service initialized');
  }

  /**
   * Analyze sentiment of a single message
   */
  async analyzeSentiment(
    messageId: string,
    content: string,
    authorId: string,
    channelId: string,
    serverId?: string,
    context?: any
  ): Promise<SentimentData> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(messageId, content);
      const cached = this.sentimentCache.get(cacheKey);
      if (cached) {
        this.processingStats.cacheHitRate = (this.processingStats.cacheHitRate * 0.9) + (1 * 0.1);
        return cached;
      }

      const sentimentData: SentimentData = {
        messageId,
        content,
        authorId,
        channelId,
        serverId,
        timestamp: new Date(),
        sentiment: {
          score: 0,
          magnitude: 0,
          classification: 'neutral',
          confidence: 0
        },
        context: {
          replyTo: context?.replyTo,
          threadContext: context?.threadContext || [],
          conversationFlow: 'neutral'
        },
        metadata: {
          processingTime: 0,
          algorithmUsed: '',
          version: '1.0'
        }
      };

      // Run multiple analysis methods
      const analyses = await Promise.allSettled([
        this.nlpSentimentAnalysis(content),
        this.aiSentimentAnalysis(content, authorId),
        this.emotionAnalysis(content),
        this.contextualAnalysis(content, context)
      ]);

      // Aggregate results
      this.aggregateAnalysisResults(sentimentData, analyses);

      // Enhance with contextual information
      await this.enhanceWithContext(sentimentData, context);

      // Calculate final metrics
      this.finalizeSentimentData(sentimentData);

      // Cache result
      sentimentData.metadata.processingTime = Date.now() - startTime;
      this.sentimentCache.set(cacheKey, sentimentData);

      // Add to real-time buffer if enabled
      if (this.config.monitoring.enableDashboard) {
        this.addToRealTimeBuffer(sentimentData);
      }

      // Update processing stats
      this.updateProcessingStats(sentimentData);

      // Check for alerts
      await this.checkAlerts(sentimentData);

      return sentimentData;
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      this.processingStats.errorRate = (this.processingStats.errorRate * 0.9) + (1 * 0.1);
      
      return this.createErrorSentimentData(messageId, content, authorId, channelId, serverId, error);
    }
  }

  /**
   * Batch analyze multiple messages
   */
  async batchAnalyzeSentiment(messages: Array<{
    messageId: string;
    content: string;
    authorId: string;
    channelId: string;
    serverId?: string;
    context?: any;
  }>): Promise<SentimentData[]> {
    const results: SentimentData[] = [];
    const batchSize = this.config.processing.batchSize;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(message => 
        this.analyzeSentiment(
          message.messageId,
          message.content,
          message.authorId,
          message.channelId,
          message.serverId,
          message.context
        )
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`📊 Batch processed ${results.length}/${messages.length} messages`);
    return results;
  }

  /**
   * Get sentiment trends for a specific scope and timeframe
   */
  async getSentimentTrends(
    scope: { type: 'user' | 'channel' | 'server' | 'global'; id?: string },
    timeframe: string = '24h'
  ): Promise<SentimentTrend> {
    const cacheKey = `trend_${scope.type}_${scope.id || 'all'}_${timeframe}`;
    
    // Check cache first
    const cached = this.trendCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < 300000) { // 5 minutes cache
      return cached;
    }

    const trend = await this.calculateSentimentTrend(scope, timeframe);
    this.trendCache.set(cacheKey, trend);
    
    return trend;
  }

  /**
   * Get comprehensive community health metrics
   */
  async getCommunityHealthMetrics(serverId?: string): Promise<CommunityHealthMetrics> {
    // Check cache
    if (this.healthMetricsCache && 
        Date.now() - this.healthMetricsCache.overall.lastUpdated.getTime() < 600000) { // 10 minutes cache
      return this.healthMetricsCache;
    }

    const metrics = await this.calculateCommunityHealth(serverId);
    this.healthMetricsCache = metrics;
    
    return metrics;
  }

  /**
   * Subscribe to real-time sentiment alerts
   */
  subscribeToAlerts(callback: (alert: any) => void): () => void {
    this.alertSubscribers.add(callback);
    
    return () => {
      this.alertSubscribers.delete(callback);
    };
  }

  /**
   * Get real-time sentiment data for dashboard
   */
  getRealTimeSentimentData(scope?: { type: string; id?: string }): {
    recent: SentimentData[];
    trends: any;
    alerts: any[];
  } {
    const key = scope ? `${scope.type}_${scope.id || 'all'}` : 'global';
    const recentData = this.realTimeBuffer.get(key) || [];
    
    // Get last 50 messages
    const recent = recentData.slice(-50);
    
    // Calculate quick trends
    const trends = this.calculateQuickTrends(recent);
    
    // Get recent alerts (would come from alert system)
    const alerts = this.getRecentAlerts(scope);
    
    return { recent, trends, alerts };
  }

  /**
   * Individual analysis methods
   */
  private async nlpSentimentAnalysis(content: string): Promise<any> {
    try {
      // Clean and tokenize text
      const cleanedText = this.cleanText(content);
      const tokens = this.tokenizer.tokenize(cleanedText);
      const stemmedTokens = tokens.map((token: string) => this.stemmer.stem(token));
      
      // Calculate sentiment using natural library
      const score = natural.SentimentAnalyzer.analyze(stemmedTokens);
      
      // Normalize score to -1 to 1 range
      const normalizedScore = Math.max(-1, Math.min(1, score));
      
      // Calculate magnitude
      const magnitude = Math.abs(normalizedScore);
      
      // Classify sentiment
      const classification = this.classifySentiment(normalizedScore);
      
      return {
        score: normalizedScore,
        magnitude,
        classification,
        confidence: 0.7, // Base confidence for NLP
        algorithm: 'nlp'
      };
    } catch (error) {
      console.error('NLP sentiment analysis failed:', error);
      return {
        score: 0,
        magnitude: 0,
        classification: 'neutral',
        confidence: 0.1,
        algorithm: 'nlp_error'
      };
    }
  }

  private async aiSentimentAnalysis(content: string, authorId: string): Promise<any> {
    if (!this.config.analysis.useAI) {
      return null;
    }

    try {
      const analysis = await this.aiService.analyzeContent(content, authorId, {
        checkSentiment: true,
        extractEntities: true
      });

      if (analysis.sentiment) {
        return {
          score: analysis.sentiment.comparative || 0,
          magnitude: Math.abs(analysis.sentiment.comparative || 0),
          classification: this.classifySentiment(analysis.sentiment.comparative || 0),
          confidence: analysis.confidence || 0.8,
          algorithm: 'ai',
          entities: analysis.entities,
          categories: analysis.categories
        };
      }

      return null;
    } catch (error) {
      console.error('AI sentiment analysis failed:', error);
      return null;
    }
  }

  private async emotionAnalysis(content: string): Promise<any> {
    if (!this.config.analysis.enableEmotionDetection) {
      return null;
    }

    try {
      // Simple emotion detection based on keywords
      // In production, this would use more sophisticated models
      const emotions = {
        joy: this.detectEmotion(content, ['happy', 'joy', 'excited', 'love', 'great', 'awesome']),
        anger: this.detectEmotion(content, ['angry', 'mad', 'furious', 'hate', 'stupid', 'idiot']),
        fear: this.detectEmotion(content, ['scared', 'afraid', 'worried', 'anxious', 'nervous']),
        sadness: this.detectEmotion(content, ['sad', 'depressed', 'down', 'crying', 'tears']),
        surprise: this.detectEmotion(content, ['wow', 'amazing', 'incredible', 'unbelievable']),
        trust: this.detectEmotion(content, ['trust', 'reliable', 'believe', 'confident']),
        anticipation: this.detectEmotion(content, ['excited', 'looking forward', 'can\'t wait']),
        disgust: this.detectEmotion(content, ['gross', 'disgusting', 'sick', 'revolting'])
      };

      return emotions;
    } catch (error) {
      console.error('Emotion analysis failed:', error);
      return null;
    }
  }

  private async contextualAnalysis(content: string, context?: any): Promise<any> {
    if (!this.config.analysis.enableContextualAnalysis) {
      return null;
    }

    try {
      const contextualData: any = {};

      // Analyze conversation flow if thread context is available
      if (context?.threadContext && context.threadContext.length > 0) {
        contextualData.conversationFlow = this.analyzeConversationFlow(
          context.threadContext,
          content
        );
      }

      // Analyze topic sentiment
      if (context?.topic) {
        contextualData.topicSentiment = this.analyzeTopicSentiment(content, context.topic);
      }

      // Check for escalation patterns
      contextualData.escalationRisk = this.checkEscalationRisk(content, context);

      return contextualData;
    } catch (error) {
      console.error('Contextual analysis failed:', error);
      return null;
    }
  }

  /**
   * Helper methods for analysis
   */
  private cleanText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private classifySentiment(score: number): string {
    if (score <= -0.6) return 'very_negative';
    if (score <= -0.2) return 'negative';
    if (score >= 0.6) return 'very_positive';
    if (score >= 0.2) return 'positive';
    return 'neutral';
  }

  private detectEmotion(content: string, keywords: string[]): number {
    const lowerContent = content.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.2; // Each keyword adds 0.2
      }
    }
    
    return Math.min(score, 1.0);
  }

  private analyzeConversationFlow(threadContext: string[], currentMessage: string): string {
    // Simplified conversation flow analysis
    if (threadContext.length < 2) return 'neutral';
    
    // Analyze sentiment progression
    const sentiments = threadContext.map(msg => {
      // Quick sentiment estimation
      const positiveWords = ['good', 'great', 'thanks', 'awesome', 'love'];
      const negativeWords = ['bad', 'hate', 'stupid', 'wrong', 'terrible'];
      
      const positive = positiveWords.some(word => msg.toLowerCase().includes(word));
      const negative = negativeWords.some(word => msg.toLowerCase().includes(word));
      
      if (positive && !negative) return 1;
      if (negative && !positive) return -1;
      return 0;
    });
    
    // Check for escalation pattern
    const recentTrend = sentiments.slice(-3).reduce((sum, s) => sum + s, 0);
    
    if (recentTrend <= -2) return 'escalating';
    if (recentTrend >= 2) return 'de-escalating';
    return 'neutral';
  }

  private analyzeTopicSentiment(content: string, topic: string): string {
    // Analyze sentiment specifically related to a topic
    // This is a simplified implementation
    const topicMentioned = content.toLowerCase().includes(topic.toLowerCase());
    if (!topicMentioned) return 'neutral';
    
    // Basic topic sentiment analysis
    const positiveIndicators = ['like', 'love', 'great', 'good'];
    const negativeIndicators = ['hate', 'dislike', 'bad', 'terrible'];
    
    const hasPositive = positiveIndicators.some(word => content.toLowerCase().includes(word));
    const hasNegative = negativeIndicators.some(word => content.toLowerCase().includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'mixed';
  }

  private checkEscalationRisk(content: string, context?: any): number {
    let riskScore = 0;
    
    // Check for aggressive language
    const aggressiveWords = ['fight', 'kill', 'destroy', 'hate', 'stupid'];
    const aggressiveCount = aggressiveWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    riskScore += aggressiveCount * 0.2;
    
    // Check caps usage
    const capsRatio = (content.match(/[A-Z]/g) || []).length / Math.max(content.length, 1);
    if (capsRatio > 0.5) riskScore += 0.3;
    
    // Check excessive punctuation
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 3) riskScore += 0.2;
    
    return Math.min(riskScore, 1.0);
  }

  /**
   * Result aggregation methods
   */
  private aggregateAnalysisResults(sentimentData: SentimentData, analyses: PromiseSettledResult<any>[]): void {
    const validResults = analyses
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    if (validResults.length === 0) {
      // Use default neutral values
      return;
    }

    // Aggregate sentiment scores with weighted average
    const weights = { nlp: 0.4, ai: 0.6 };
    let totalScore = 0;
    let totalMagnitude = 0;
    let totalWeight = 0;
    let bestConfidence = 0;
    let algorithmUsed = '';

    for (const result of validResults) {
      if (result.score !== undefined) {
        const weight = weights[result.algorithm] || 0.3;
        totalScore += result.score * weight;
        totalMagnitude += result.magnitude * weight;
        totalWeight += weight;
        
        if (result.confidence > bestConfidence) {
          bestConfidence = result.confidence;
          algorithmUsed = result.algorithm;
        }
      }
    }

    if (totalWeight > 0) {
      sentimentData.sentiment.score = totalScore / totalWeight;
      sentimentData.sentiment.magnitude = totalMagnitude / totalWeight;
      sentimentData.sentiment.classification = this.classifySentiment(sentimentData.sentiment.score);
      sentimentData.sentiment.confidence = bestConfidence;
      sentimentData.metadata.algorithmUsed = algorithmUsed;
    }

    // Add emotions if available
    const emotionResult = validResults.find(r => r.joy !== undefined);
    if (emotionResult) {
      sentimentData.emotions = emotionResult;
    }

    // Add contextual data
    const contextResult = validResults.find(r => r.conversationFlow !== undefined);
    if (contextResult) {
      sentimentData.context.conversationFlow = contextResult.conversationFlow;
      sentimentData.context.topicSentiment = contextResult.topicSentiment;
    }
  }

  private async enhanceWithContext(sentimentData: SentimentData, context?: any): Promise<void> {
    // Enhance sentiment data with additional context
    if (context?.replyTo) {
      // Get sentiment of the message being replied to
      const originalSentiment = await this.getSentimentFromCache(context.replyTo);
      if (originalSentiment) {
        // Adjust current sentiment based on reply context
        this.adjustForReplyContext(sentimentData, originalSentiment);
      }
    }
  }

  private async getSentimentFromCache(messageId: string): Promise<SentimentData | null> {
    // Look for cached sentiment data
    for (const [key, data] of this.sentimentCache.entries()) {
      if (data.messageId === messageId) {
        return data;
      }
    }
    return null;
  }

  private adjustForReplyContext(current: SentimentData, original: SentimentData): void {
    // If replying to negative message with positive sentiment, it might be supportive
    if (original.sentiment.score < -0.3 && current.sentiment.score > 0.3) {
      current.context.conversationFlow = 'de-escalating';
      current.metadata.flags = ['supportive_reply'];
    }
    
    // If replying to positive message with negative sentiment, it might be contrarian
    if (original.sentiment.score > 0.3 && current.sentiment.score < -0.3) {
      current.context.conversationFlow = 'escalating';
      current.metadata.flags = ['contrarian_reply'];
    }
  }

  private finalizeSentimentData(sentimentData: SentimentData): void {
    // Apply final adjustments and validations
    
    // Ensure score is within bounds
    sentimentData.sentiment.score = Math.max(-1, Math.min(1, sentimentData.sentiment.score));
    sentimentData.sentiment.magnitude = Math.max(0, Math.min(1, sentimentData.sentiment.magnitude));
    sentimentData.sentiment.confidence = Math.max(0, Math.min(1, sentimentData.sentiment.confidence));
    
    // Apply confidence threshold
    if (sentimentData.sentiment.confidence < this.config.analysis.confidenceThreshold) {
      sentimentData.sentiment.classification = 'neutral';
      sentimentData.sentiment.score = 0;
      sentimentData.metadata.flags = (sentimentData.metadata.flags || []).concat(['low_confidence']);
    }
  }

  /**
   * Trend and health calculation methods
   */
  private async calculateSentimentTrend(
    scope: { type: string; id?: string },
    timeframe: string
  ): Promise<SentimentTrend> {
    // This would typically query a database
    // For now, simulate with recent cache data
    
    const trend: SentimentTrend = {
      timeframe,
      scope,
      metrics: {
        averageSentiment: 0,
        sentimentVolatility: 0,
        messageCount: 0,
        distribution: {
          veryNegative: 0,
          negative: 0,
          neutral: 0,
          positive: 0,
          veryPositive: 0
        },
        topEmotions: [],
        healthScore: 75 // Default health score
      },
      alerts: [],
      timestamp: new Date()
    };

    // Calculate from recent data (simplified)
    const recentData = this.getRecentDataForScope(scope, timeframe);
    
    if (recentData.length > 0) {
      // Calculate metrics
      const scores = recentData.map(d => d.sentiment.score);
      trend.metrics.averageSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      trend.metrics.messageCount = recentData.length;
      
      // Calculate distribution
      recentData.forEach(data => {
        switch (data.sentiment.classification) {
          case 'very_negative': trend.metrics.distribution.veryNegative++; break;
          case 'negative': trend.metrics.distribution.negative++; break;
          case 'neutral': trend.metrics.distribution.neutral++; break;
          case 'positive': trend.metrics.distribution.positive++; break;
          case 'very_positive': trend.metrics.distribution.veryPositive++; break;
        }
      });

      // Calculate health score
      const negativeRatio = (trend.metrics.distribution.veryNegative + trend.metrics.distribution.negative) / 
                           Math.max(recentData.length, 1);
      const positiveRatio = (trend.metrics.distribution.veryPositive + trend.metrics.distribution.positive) / 
                           Math.max(recentData.length, 1);
      
      trend.metrics.healthScore = Math.round((1 - negativeRatio + positiveRatio) * 50);
      
      // Check for alerts
      if (negativeRatio > 0.4) {
        trend.alerts.push({
          type: 'high_negative_sentiment',
          severity: negativeRatio > 0.6 ? 'high' : 'medium',
          message: `High negative sentiment detected: ${(negativeRatio * 100).toFixed(1)}%`,
          timestamp: new Date()
        });
      }
    }

    return trend;
  }

  private async calculateCommunityHealth(serverId?: string): Promise<CommunityHealthMetrics> {
    const metrics: CommunityHealthMetrics = {
      overall: {
        healthScore: 75, // Default
        trendDirection: 'stable',
        lastUpdated: new Date()
      },
      breakdown: {
        sentimentHealth: 75,
        engagementHealth: 80,
        toxicityLevel: 15,
        communityGrowth: 70
      },
      channels: [],
      users: [],
      recommendations: []
    };

    // Calculate based on recent sentiment data
    // This would typically involve complex database queries
    
    // Simulate channel analysis
    const recentChannelData = this.getChannelSentimentData(serverId);
    metrics.channels = recentChannelData.map(channel => ({
      channelId: channel.id,
      channelName: channel.name,
      healthScore: channel.healthScore,
      primaryIssues: channel.issues,
      messageVolume: channel.messageCount,
      averageSentiment: channel.averageSentiment
    }));

    // Calculate overall health score
    const channelHealthAvg = metrics.channels.length > 0 
      ? metrics.channels.reduce((sum, ch) => sum + ch.healthScore, 0) / metrics.channels.length
      : 75;

    metrics.overall.healthScore = Math.round(
      (metrics.breakdown.sentimentHealth * 0.3) +
      (metrics.breakdown.engagementHealth * 0.25) +
      ((100 - metrics.breakdown.toxicityLevel) * 0.25) +
      (channelHealthAvg * 0.2)
    );

    // Generate recommendations based on health metrics
    if (metrics.overall.healthScore < 60) {
      metrics.recommendations.push({
        type: 'community_event',
        priority: 8,
        description: 'Consider organizing a positive community event to boost morale',
        estimatedImpact: 'Medium-term sentiment improvement'
      });
    }

    if (metrics.breakdown.toxicityLevel > 25) {
      metrics.recommendations.push({
        type: 'channel_moderation',
        priority: 9,
        description: 'Increase moderation efforts in high-toxicity channels',
        estimatedImpact: 'Immediate toxicity reduction'
      });
    }

    return metrics;
  }

  /**
   * Real-time processing and alerts
   */
  private addToRealTimeBuffer(sentimentData: SentimentData): void {
    const globalKey = 'global';
    const channelKey = `channel_${sentimentData.channelId}`;
    const serverKey = sentimentData.serverId ? `server_${sentimentData.serverId}` : null;

    // Add to appropriate buffers
    this.addToBuffer(globalKey, sentimentData);
    this.addToBuffer(channelKey, sentimentData);
    if (serverKey) {
      this.addToBuffer(serverKey, sentimentData);
    }
  }

  private addToBuffer(key: string, data: SentimentData): void {
    if (!this.realTimeBuffer.has(key)) {
      this.realTimeBuffer.set(key, []);
    }
    
    const buffer = this.realTimeBuffer.get(key)!;
    buffer.push(data);
    
    // Keep only last 100 messages per buffer
    if (buffer.length > 100) {
      buffer.splice(0, buffer.length - 100);
    }
  }

  private async checkAlerts(sentimentData: SentimentData): Promise<void> {
    const alerts = [];

    // Check for individual message alerts
    if (sentimentData.sentiment.score < -0.8 && sentimentData.sentiment.confidence > 0.7) {
      alerts.push({
        type: 'very_negative_message',
        severity: 'medium',
        data: sentimentData,
        message: 'Very negative message detected'
      });
    }

    // Check for conversation escalation
    if (sentimentData.context.conversationFlow === 'escalating') {
      alerts.push({
        type: 'conversation_escalation',
        severity: 'high',
        data: sentimentData,
        message: 'Conversation escalation detected'
      });
    }

    // Send alerts to subscribers
    for (const alert of alerts) {
      this.alertSubscribers.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Alert callback failed:', error);
        }
      });
    }
  }

  private calculateQuickTrends(recentData: SentimentData[]): any {
    if (recentData.length === 0) {
      return {
        averageSentiment: 0,
        messageCount: 0,
        trend: 'stable'
      };
    }

    const scores = recentData.map(d => d.sentiment.score);
    const averageSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate trend (last 10 vs previous 10)
    let trend = 'stable';
    if (recentData.length >= 20) {
      const recent10 = scores.slice(-10).reduce((sum, score) => sum + score, 0) / 10;
      const previous10 = scores.slice(-20, -10).reduce((sum, score) => sum + score, 0) / 10;
      
      if (recent10 > previous10 + 0.1) trend = 'improving';
      else if (recent10 < previous10 - 0.1) trend = 'declining';
    }

    return {
      averageSentiment,
      messageCount: recentData.length,
      trend
    };
  }

  private getRecentAlerts(scope?: any): any[] {
    // Return recent alerts for the scope
    // This would typically come from a persistent alert store
    return [];
  }

  /**
   * Utility and helper methods
   */
  private getCacheKey(messageId: string, content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(`${messageId}_${content}`).digest('hex');
  }

  private getRecentDataForScope(scope: any, timeframe: string): SentimentData[] {
    // Get recent sentiment data for the specified scope
    // This would typically query a database
    const key = `${scope.type}_${scope.id || 'all'}`;
    return this.realTimeBuffer.get(key) || [];
  }

  private getChannelSentimentData(serverId?: string): any[] {
    // Return mock channel data
    return [
      {
        id: 'channel1',
        name: 'general',
        healthScore: 82,
        issues: [],
        messageCount: 150,
        averageSentiment: 0.3
      },
      {
        id: 'channel2',
        name: 'debate',
        healthScore: 65,
        issues: ['heated_discussions'],
        messageCount: 200,
        averageSentiment: -0.1
      }
    ];
  }

  private createErrorSentimentData(
    messageId: string,
    content: string,
    authorId: string,
    channelId: string,
    serverId?: string,
    error?: any
  ): SentimentData {
    return {
      messageId,
      content,
      authorId,
      channelId,
      serverId,
      timestamp: new Date(),
      sentiment: {
        score: 0,
        magnitude: 0,
        classification: 'neutral',
        confidence: 0
      },
      context: {},
      metadata: {
        processingTime: 0,
        algorithmUsed: 'error',
        version: '1.0',
        flags: ['processing_error']
      }
    };
  }

  private updateProcessingStats(sentimentData: SentimentData): void {
    this.processingStats.totalProcessed++;
    this.processingStats.averageProcessingTime = 
      (this.processingStats.averageProcessingTime * 0.9) + 
      (sentimentData.metadata.processingTime * 0.1);
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
      
      console.log('✅ Redis initialized for sentiment analysis');
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
    }
  }

  private initializeNLPComponents(): void {
    try {
      // Initialize sentiment analyzer
      this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', 
        natural.PorterStemmer, 'afinn');
      
      // Initialize stemmer
      this.stemmer = natural.PorterStemmer;
      
      // Initialize tokenizer
      this.tokenizer = new natural.WordTokenizer();
      
      console.log('✅ NLP components initialized for sentiment analysis');
    } catch (error) {
      console.error('❌ Failed to initialize NLP components:', error);
    }
  }

  private startBackgroundProcessing(): void {
    // Process sentiment trends every 5 minutes
    if (this.config.monitoring.enableDashboard) {
      setInterval(() => {
        this.processTrendUpdates();
      }, 300000); // 5 minutes
    }

    // Clean caches every 30 minutes
    setInterval(() => {
      this.cleanupCaches();
    }, 1800000); // 30 minutes

    // Update health metrics every 15 minutes
    setInterval(() => {
      this.updateHealthMetrics();
    }, 900000); // 15 minutes
  }

  private async processTrendUpdates(): Promise<void> {
    console.log('📊 Processing sentiment trend updates...');
    
    // Clear trend cache to force recalculation
    this.trendCache.clear();
    
    // Recalculate community health
    this.healthMetricsCache = null;
  }

  private cleanupCaches(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    // Clean sentiment cache
    for (const [key, data] of this.sentimentCache.entries()) {
      if (now - data.timestamp.getTime() > maxAge) {
        this.sentimentCache.delete(key);
      }
    }

    // Clean trend cache
    for (const [key, trend] of this.trendCache.entries()) {
      if (now - trend.timestamp.getTime() > 600000) { // 10 minutes
        this.trendCache.delete(key);
      }
    }

    console.log('🧹 Cleaned sentiment analysis caches');
  }

  private async updateHealthMetrics(): Promise<void> {
    console.log('📈 Updating community health metrics...');
    
    // Force recalculation
    this.healthMetricsCache = null;
  }

  private mergeConfig(partialConfig?: Partial<SentimentAnalysisConfig>): SentimentAnalysisConfig {
    const defaultConfig: SentimentAnalysisConfig = {
      processing: {
        batchSize: 50,
        processingInterval: 5000,
        enableRealTime: true,
        enableBatchProcessing: true
      },
      analysis: {
        useAI: !!process.env.OPENAI_API_KEY,
        useNLP: true,
        enableEmotionDetection: true,
        enableIntentAnalysis: false,
        enableContextualAnalysis: true,
        confidenceThreshold: 0.3
      },
      monitoring: {
        enableDashboard: true,
        alertThresholds: {
          negativeSentimentSpike: 0.6,
          toxicityLevel: 0.3,
          communityHealthScore: 60
        },
        trackingWindow: 24,
        aggregationLevels: ['user', 'channel', 'server', 'global']
      },
      storage: {
        retentionPeriod: 30,
        enableHistoricalAnalysis: true,
        compressionLevel: 'basic'
      }
    };

    return { ...defaultConfig, ...partialConfig };
  }

  /**
   * Public API methods
   */
  updateConfig(newConfig: Partial<SentimentAnalysisConfig>): void {
    this.config = this.mergeConfig(newConfig);
    console.log('⚙️ Sentiment analysis configuration updated');
  }

  getStats(): any {
    return {
      processing: this.processingStats,
      cacheStats: {
        sentimentCacheSize: this.sentimentCache.size,
        trendCacheSize: this.trendCache.size,
        realTimeBufferSize: Array.from(this.realTimeBuffer.values())
          .reduce((sum, buffer) => sum + buffer.length, 0)
      },
      subscribers: this.alertSubscribers.size,
      config: this.config
    };
  }

  async getHistoricalTrends(
    scope: { type: string; id?: string },
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' = 'day'
  ): Promise<any[]> {
    // This would query historical data from database
    // For now, return mock data
    console.log(`📊 Getting historical trends for ${scope.type} from ${startDate} to ${endDate}`);
    
    return [
      {
        timestamp: startDate,
        averageSentiment: 0.2,
        messageCount: 150,
        healthScore: 75
      }
    ];
  }
}