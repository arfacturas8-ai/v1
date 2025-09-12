import { Queue } from 'bullmq';
import { AIIntegrationService } from './ai-integration';
import { ToxicityDetectionService } from './toxicity-detection';
import { SpamDetectionService } from './spam-detection';
import { NSFWDetectionService } from './nsfw-detection';
import { SentimentAnalysisService } from './sentiment-analysis';
import { RecommendationEngine } from './recommendation-engine';
import { SmartTaggingService } from './smart-tagging';
import { FraudDetectionService } from './fraud-detection';
import { AutomatedBanSystem } from './automated-ban-system';
import { AutoModerationEngine } from './auto-moderation-engine';
import { prisma } from '@cryb/database';

export interface EnhancedModerationConfig {
  services: {
    toxicity: boolean;
    spam: boolean;
    nsfw: boolean;
    sentiment: boolean;
    fraud: boolean;
    smartTagging: boolean;
    recommendations: boolean;
    automatedBans: boolean;
    autoModeration: boolean;
  };
  performance: {
    enableCaching: boolean;
    parallelProcessing: boolean;
    priorityQueue: boolean;
    rateLimiting: boolean;
  };
  fallback: {
    enableFallbacks: boolean;
    maxRetries: number;
    timeoutMs: number;
    degradedMode: boolean;
  };
  analytics: {
    enableMetrics: boolean;
    enableReporting: boolean;
    retentionDays: number;
  };
}

export interface ModerationRequest {
  id: string;
  type: 'message' | 'user_join' | 'transaction' | 'upload' | 'profile_update';
  data: {
    messageId?: string;
    userId: string;
    content?: string;
    attachments?: any[];
    serverId?: string;
    channelId?: string;
    metadata?: any;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface ModerationResult {
  requestId: string;
  overallRisk: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actions: Array<{
    type: string;
    executed: boolean;
    reason: string;
    service: string;
  }>;
  serviceResults: {
    toxicity?: any;
    spam?: any;
    nsfw?: any;
    sentiment?: any;
    fraud?: any;
    tagging?: any;
    recommendations?: any;
  };
  performance: {
    totalProcessingTime: number;
    serviceTimings: { [service: string]: number };
    cacheHits: number;
    fallbacksUsed: number;
  };
  blocked: boolean;
  escalated: boolean;
  requiresReview: boolean;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export class EnhancedModerationService {
  private config: EnhancedModerationConfig;
  private queue: Queue;
  
  // Service instances
  private aiService: AIIntegrationService;
  private toxicityService: ToxicityDetectionService;
  private spamService: SpamDetectionService;
  private nsfwService: NSFWDetectionService;
  private sentimentService: SentimentAnalysisService;
  private recommendationEngine: RecommendationEngine;
  private smartTagging: SmartTaggingService;
  private fraudDetection: FraudDetectionService;
  private banSystem: AutomatedBanSystem;
  private autoModeration: AutoModerationEngine;
  
  // Caching and monitoring
  private resultCache: Map<string, { result: ModerationResult; timestamp: number }> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private metrics: Map<string, { count: number; totalTime: number; errors: number }> = new Map();
  private rateLimiter: Map<string, Array<{ timestamp: number; requests: number }>> = new Map();

  constructor(queue: Queue) {
    this.queue = queue;
    this.config = this.getDefaultConfig();
    
    this.initializeServices(queue);
    
    this.startHealthMonitoring();
    this.startMetricsCollection();
    
    console.log('🚀 Enhanced Moderation Service initialized successfully');
  }

  /**
   * Initialize all services with proper error handling
   */
  private initializeServices(queue: Queue): void {
    try {
      // Initialize AI service first (required by others)
      console.log('🤖 Initializing AI integration service...');
      this.aiService = new AIIntegrationService(
        {
          openaiApiKey: process.env.OPENAI_API_KEY || '',
          maxRetries: this.config.fallback.maxRetries,
          timeoutMs: this.config.fallback.timeoutMs,
          fallbackEnabled: this.config.fallback.enableFallbacks,
          cacheTtl: 300000 // 5 minutes
        },
        queue
      );
      
      // Initialize detection services
      console.log('🔍 Initializing detection services...');
      this.toxicityService = new ToxicityDetectionService(this.aiService, queue);
      this.spamService = new SpamDetectionService(this.aiService, queue);
      this.nsfwService = new NSFWDetectionService(this.aiService, queue);
      this.sentimentService = new SentimentAnalysisService(this.aiService, queue);
      
      // Initialize enhancement services
      console.log('⚡ Initializing enhancement services...');
      this.recommendationEngine = new RecommendationEngine(this.aiService, queue);
      this.smartTagging = new SmartTaggingService(this.aiService, queue);
      this.fraudDetection = new FraudDetectionService(this.aiService, queue);
      
      // Initialize auto-moderation engine
      console.log('🤖 Initializing auto-moderation engine...');
      this.autoModeration = new AutoModerationEngine(
        this.aiService,
        this.toxicityService,
        this.spamService,
        queue
      );
      
      // Initialize automated ban system
      console.log('🔨 Initializing automated ban system...');
      this.banSystem = new AutomatedBanSystem(
        queue,
        this.toxicityService,
        this.spamService,
        this.autoModeration
      );
      
      console.log('✅ All moderation services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize moderation services:', error);
      
      if (!this.config.fallback.enableFallbacks) {
        throw new Error(`Enhanced moderation initialization failed: ${error.message}`);
      }
      
      // Create fallback implementations
      this.createFallbackServices(queue);
    }
  }

  /**
   * Create minimal fallback services when main services fail
   */
  private createFallbackServices(queue: Queue): void {
    console.warn('⚠️ Creating fallback moderation services...');
    
    // Create minimal fallback services that always return safe results
    const createFallbackService = (name: string) => ({
      analyze: async (...args: any[]) => ({ 
        isViolation: false, 
        confidence: 0, 
        riskLevel: 'safe',
        fallback: true,
        serviceName: name
      }),
      analyzeAndModerate: async (...args: any[]) => ({ 
        processed: false, 
        actions: [], 
        fallback: true,
        serviceName: name
      })
    });
    
    if (!this.aiService) {
      this.aiService = createFallbackService('ai-integration') as any;
    }
    if (!this.toxicityService) {
      this.toxicityService = createFallbackService('toxicity') as any;
    }
    if (!this.spamService) {
      this.spamService = createFallbackService('spam') as any;
    }
    if (!this.nsfwService) {
      this.nsfwService = createFallbackService('nsfw') as any;
    }
    if (!this.sentimentService) {
      this.sentimentService = createFallbackService('sentiment') as any;
    }
    if (!this.recommendationEngine) {
      this.recommendationEngine = createFallbackService('recommendations') as any;
    }
    if (!this.smartTagging) {
      this.smartTagging = createFallbackService('smart-tagging') as any;
    }
    if (!this.fraudDetection) {
      this.fraudDetection = createFallbackService('fraud-detection') as any;
    }
    if (!this.autoModeration) {
      this.autoModeration = createFallbackService('auto-moderation') as any;
    }
    if (!this.banSystem) {
      this.banSystem = createFallbackService('ban-system') as any;
    }
    
    console.log('✅ Fallback services created - operating in degraded mode');
  }

  /**
   * Process a moderation request with comprehensive AI analysis
   */
  async processRequest(request: ModerationRequest): Promise<ModerationResult> {
    const startTime = Date.now();
    
    try {
      // Check rate limiting
      if (this.config.performance.rateLimiting && !this.checkRateLimit(request.data.userId)) {
        throw new Error('Rate limit exceeded');
      }

      // Check cache
      if (this.config.performance.enableCaching) {
        const cached = this.getCachedResult(request);
        if (cached) {
          cached.result.performance.cacheHits = 1;
          return cached.result;
        }
      }

      // Initialize result
      const result: ModerationResult = {
        requestId: request.id,
        overallRisk: 0,
        riskLevel: 'safe',
        confidence: 0,
        actions: [],
        serviceResults: {},
        performance: {
          totalProcessingTime: 0,
          serviceTimings: {},
          cacheHits: 0,
          fallbacksUsed: 0
        },
        blocked: false,
        escalated: false,
        requiresReview: false
      };

      // Process based on request type
      switch (request.type) {
        case 'message':
          await this.processMessage(request, result);
          break;
        case 'transaction':
          await this.processTransaction(request, result);
          break;
        case 'user_join':
          await this.processUserJoin(request, result);
          break;
        case 'upload':
          await this.processUpload(request, result);
          break;
        case 'profile_update':
          await this.processProfileUpdate(request, result);
          break;
      }

      // Calculate overall risk and confidence
      this.calculateOverallResult(result);

      // Execute actions based on results
      await this.executeActions(request, result);

      // Cache result
      if (this.config.performance.enableCaching) {
        this.cacheResult(request, result);
      }

      // Update metrics
      result.performance.totalProcessingTime = Date.now() - startTime;
      this.updateMetrics(request.type, result.performance.totalProcessingTime, false);

      // Log result
      await this.logModerationResult(request, result);

      return result;
    } catch (error) {
      console.error('Enhanced moderation failed:', error);
      this.updateMetrics(request.type, Date.now() - startTime, true);
      return this.createErrorResult(request.id, error.message, Date.now() - startTime);
    }
  }

  /**
   * Process message content through all applicable services
   */
  private async processMessage(request: ModerationRequest, result: ModerationResult): Promise<void> {
    const { messageId, userId, content, attachments, serverId, channelId } = request.data;
    
    if (!content && (!attachments || attachments.length === 0)) {
      return;
    }

    const servicePromises: Array<{ service: string; promise: Promise<any> }> = [];

    // Toxicity detection
    if (this.config.services.toxicity && content) {
      servicePromises.push({
        service: 'toxicity',
        promise: this.runServiceSafely('toxicity', () =>
          this.toxicityService.analyzeAndModerate(
            messageId || '',
            content,
            userId,
            channelId || '',
            serverId
          )
        )
      });
    }

    // Spam detection
    if (this.config.services.spam && content) {
      servicePromises.push({
        service: 'spam',
        promise: this.runServiceSafely('spam', () =>
          this.spamService.analyzeMessage(
            messageId || '',
            content,
            userId,
            channelId || '',
            serverId
          )
        )
      });
    }

    // NSFW detection
    if (this.config.services.nsfw) {
      servicePromises.push({
        service: 'nsfw',
        promise: this.runServiceSafely('nsfw', () =>
          this.nsfwService.analyzeContent(
            messageId || '',
            content || '',
            attachments || [],
            userId,
            channelId || '',
            serverId
          )
        )
      });
    }

    // Sentiment analysis
    if (this.config.services.sentiment && content) {
      servicePromises.push({
        service: 'sentiment',
        promise: this.runServiceSafely('sentiment', () =>
          this.sentimentService.analyzeMessage(
            messageId || '',
            content,
            userId,
            channelId || '',
            serverId
          )
        )
      });
    }

    // Smart tagging
    if (this.config.services.smartTagging && content) {
      servicePromises.push({
        service: 'tagging',
        promise: this.runServiceSafely('tagging', () =>
          this.smartTagging.analyzeAndTag(
            messageId || '',
            content,
            userId,
            { serverId, channelId, contentType: 'message' }
          )
        )
      });
    }

    // Process services
    if (this.config.performance.parallelProcessing) {
      // Parallel execution
      const results = await Promise.allSettled(
        servicePromises.map(async ({ service, promise }) => {
          const serviceStart = Date.now();
          const serviceResult = await promise;
          result.performance.serviceTimings[service] = Date.now() - serviceStart;
          return { service, result: serviceResult };
        })
      );

      // Process results
      results.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          const { service, result: serviceResult } = promiseResult.value;
          result.serviceResults[service as keyof typeof result.serviceResults] = serviceResult;
        } else {
          console.error(`Service ${servicePromises[index].service} failed:`, promiseResult.reason);
        }
      });
    } else {
      // Sequential execution
      for (const { service, promise } of servicePromises) {
        try {
          const serviceStart = Date.now();
          const serviceResult = await promise;
          result.performance.serviceTimings[service] = Date.now() - serviceStart;
          result.serviceResults[service as keyof typeof result.serviceResults] = serviceResult;
        } catch (error) {
          console.error(`Service ${service} failed:`, error);
        }
      }
    }

    // Auto-moderation engine processing
    if (this.config.services.autoModeration) {
      try {
        const autoModResults = await this.autoModeration.processEvent('message_create', {
          messageId: messageId || '',
          userId,
          serverId,
          channelId,
          content,
          timestamp: new Date(),
          attachments,
          userRoles: request.data.metadata?.userRoles
        });

        result.serviceResults.autoModeration = autoModResults;
      } catch (error) {
        console.error('Auto-moderation failed:', error);
      }
    }
  }

  /**
   * Process transaction for fraud detection
   */
  private async processTransaction(request: ModerationRequest, result: ModerationResult): Promise<void> {
    if (!this.config.services.fraud) return;

    const { userId, metadata } = request.data;
    
    if (!metadata?.transactionData) return;

    try {
      const fraudResult = await this.runServiceSafely('fraud', () =>
        this.fraudDetection.analyzeTransaction(metadata.transactionData)
      );

      result.serviceResults.fraud = fraudResult;
      
      // Handle fraud violations
      if (fraudResult.blocked || fraudResult.riskLevel === 'critical') {
        if (this.config.services.automatedBans) {
          await this.banSystem.processViolation(
            userId,
            'fraud',
            fraudResult.riskLevel === 'critical' ? 'critical' : 'high',
            { fraudAnalysis: fraudResult },
            request.data.serverId
          );
        }
      }
    } catch (error) {
      console.error('Fraud detection failed:', error);
    }
  }

  /**
   * Process user join events
   */
  private async processUserJoin(request: ModerationRequest, result: ModerationResult): Promise<void> {
    const { userId, serverId, metadata } = request.data;

    // Track user session for ban evasion detection
    if (this.config.services.automatedBans && metadata?.ipAddress) {
      try {
        await this.banSystem.trackUserSession(
          userId,
          metadata.ipAddress,
          metadata.userAgent || '',
          serverId
        );
      } catch (error) {
        console.error('User session tracking failed:', error);
      }
    }

    // Generate recommendations for new users
    if (this.config.services.recommendations) {
      try {
        const recommendations = await this.recommendationEngine.getRecommendations({
          userId,
          context: { currentServer: serverId },
          count: 5
        });
        
        result.serviceResults.recommendations = recommendations;
      } catch (error) {
        console.error('Recommendation generation failed:', error);
      }
    }
  }

  /**
   * Process file uploads
   */
  private async processUpload(request: ModerationRequest, result: ModerationResult): Promise<void> {
    const { userId, attachments, serverId, channelId } = request.data;

    if (!attachments || attachments.length === 0) return;

    // NSFW detection for uploads
    if (this.config.services.nsfw) {
      try {
        const nsfwResults = await this.runServiceSafely('nsfw', () =>
          this.nsfwService.analyzeContent(
            request.id,
            '',
            attachments,
            userId,
            channelId || '',
            serverId
          )
        );

        result.serviceResults.nsfw = nsfwResults;
      } catch (error) {
        console.error('NSFW detection for uploads failed:', error);
      }
    }
  }

  /**
   * Process profile updates
   */
  private async processProfileUpdate(request: ModerationRequest, result: ModerationResult): Promise<void> {
    const { userId, content, serverId } = request.data;

    if (!content) return;

    // Check profile content for toxicity
    if (this.config.services.toxicity) {
      try {
        const toxicityResult = await this.runServiceSafely('toxicity', () =>
          this.toxicityService.analyzeAndModerate(
            request.id,
            content,
            userId,
            'profile',
            serverId
          )
        );

        result.serviceResults.toxicity = toxicityResult;
      } catch (error) {
        console.error('Profile toxicity check failed:', error);
      }
    }
  }

  /**
   * Run service with error handling and health monitoring
   */
  private async runServiceSafely<T>(
    serviceName: string,
    serviceCall: () => Promise<T>
  ): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        serviceCall(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Service timeout')), this.config.fallback.timeoutMs)
        )
      ]);
      
      this.updateServiceHealth(serviceName, true, Date.now() - startTime);
      return result;
    } catch (error) {
      this.updateServiceHealth(serviceName, false, Date.now() - startTime);
      
      if (this.config.fallback.enableFallbacks) {
        console.warn(`Service ${serviceName} failed, using fallback:`, error);
        return null; // Graceful degradation
      } else {
        throw error;
      }
    }
  }

  /**
   * Calculate overall risk and confidence from service results
   */
  private calculateOverallResult(result: ModerationResult): void {
    let totalRisk = 0;
    let totalConfidence = 0;
    let serviceCount = 0;

    // Toxicity contribution
    if (result.serviceResults.toxicity) {
      const toxicity = result.serviceResults.toxicity;
      totalRisk += this.getRiskScore(toxicity) * 0.3;
      totalConfidence += toxicity.confidence || 0.5;
      serviceCount++;
    }

    // Spam contribution
    if (result.serviceResults.spam) {
      const spam = result.serviceResults.spam;
      totalRisk += spam.confidence * 0.25;
      totalConfidence += spam.confidence || 0.5;
      serviceCount++;
    }

    // NSFW contribution
    if (result.serviceResults.nsfw && Array.isArray(result.serviceResults.nsfw)) {
      const nsfwResults = result.serviceResults.nsfw;
      const maxNsfwRisk = Math.max(...nsfwResults.map(r => r.confidence), 0);
      totalRisk += maxNsfwRisk * 0.25;
      totalConfidence += maxNsfwRisk;
      serviceCount++;
    }

    // Fraud contribution
    if (result.serviceResults.fraud) {
      const fraud = result.serviceResults.fraud;
      totalRisk += fraud.riskScore * 0.4;
      totalConfidence += fraud.confidence || 0.5;
      serviceCount++;
    }

    // Sentiment (negative impact)
    if (result.serviceResults.sentiment) {
      const sentiment = result.serviceResults.sentiment;
      if (sentiment.classification === 'very_negative') {
        totalRisk += 0.1; // Small contribution for very negative sentiment
      }
    }

    // Calculate final scores
    result.overallRisk = serviceCount > 0 ? Math.min(totalRisk, 1) : 0;
    result.confidence = serviceCount > 0 ? totalConfidence / serviceCount : 0.5;

    // Determine risk level
    if (result.overallRisk >= 0.8) result.riskLevel = 'critical';
    else if (result.overallRisk >= 0.6) result.riskLevel = 'high';
    else if (result.overallRisk >= 0.3) result.riskLevel = 'medium';
    else if (result.overallRisk >= 0.1) result.riskLevel = 'low';
    else result.riskLevel = 'safe';

    // Determine actions needed
    result.blocked = result.riskLevel === 'critical' || 
                    (result.riskLevel === 'high' && result.confidence > 0.8);
    result.requiresReview = result.riskLevel === 'high' || 
                          (result.riskLevel === 'medium' && result.confidence > 0.7);
    result.escalated = result.blocked || result.requiresReview;
  }

  /**
   * Extract risk score from service result
   */
  private getRiskScore(serviceResult: any): number {
    if (typeof serviceResult.riskScore === 'number') return serviceResult.riskScore;
    if (typeof serviceResult.confidence === 'number') return serviceResult.confidence;
    if (serviceResult.severity) {
      const severityScores = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
      return severityScores[serviceResult.severity] || 0.5;
    }
    return 0;
  }

  /**
   * Execute actions based on moderation results
   */
  private async executeActions(request: ModerationRequest, result: ModerationResult): Promise<void> {
    try {
      // Handle violations through automated ban system
      if (this.config.services.automatedBans && result.riskLevel !== 'safe') {
        const violationType = this.determineViolationType(result);
        const severity = this.mapRiskToSeverity(result.riskLevel);
        
        const banResult = await this.banSystem.processViolation(
          request.data.userId,
          violationType,
          severity,
          { moderationResult: result },
          request.data.serverId,
          request.data.messageId,
          request.data.channelId
        );

        if (banResult.punishmentIssued) {
          result.actions.push({
            type: 'automated_punishment',
            executed: true,
            reason: `${banResult.punishment?.type} issued for ${violationType} violation`,
            service: 'automated_ban_system'
          });
        }
      }

      // Block content if needed
      if (result.blocked && request.data.messageId) {
        await this.queue.add('delete-message', {
          messageId: request.data.messageId,
          reason: `Content blocked by AI moderation (${result.riskLevel} risk)`,
          moderatorId: 'system'
        });

        result.actions.push({
          type: 'delete_message',
          executed: true,
          reason: 'Content blocked due to high risk',
          service: 'enhanced_moderation'
        });
      }

      // Queue for manual review if needed
      if (result.requiresReview) {
        await this.queue.add('manual-review', {
          requestId: request.id,
          requestType: request.type,
          userId: request.data.userId,
          riskLevel: result.riskLevel,
          confidence: result.confidence,
          serviceResults: result.serviceResults,
          priority: result.riskLevel === 'high' ? 'high' : 'medium'
        });

        result.actions.push({
          type: 'queue_manual_review',
          executed: true,
          reason: 'Queued for manual moderator review',
          service: 'enhanced_moderation'
        });
      }

      // Notify moderators for critical cases
      if (result.riskLevel === 'critical') {
        await this.queue.add('notify-moderators', {
          urgency: 'critical',
          userId: request.data.userId,
          serverId: request.data.serverId,
          reason: 'Critical AI moderation alert',
          details: result
        });

        result.actions.push({
          type: 'notify_moderators',
          executed: true,
          reason: 'Critical risk detected, moderators notified',
          service: 'enhanced_moderation'
        });
      }

    } catch (error) {
      console.error('Action execution failed:', error);
      result.actions.push({
        type: 'error',
        executed: false,
        reason: `Failed to execute actions: ${error.message}`,
        service: 'enhanced_moderation'
      });
    }
  }

  /**
   * Determine violation type from results
   */
  private determineViolationType(result: ModerationResult): 'toxicity' | 'spam' | 'nsfw' | 'harassment' | 'fraud' | 'custom' {
    if (result.serviceResults.fraud?.blocked) return 'fraud';
    if (result.serviceResults.toxicity?.matched) return 'toxicity';
    if (result.serviceResults.spam?.isSpam) return 'spam';
    if (result.serviceResults.nsfw?.some?.((r: any) => r.isNSFW)) return 'nsfw';
    return 'custom';
  }

  /**
   * Map risk level to violation severity
   */
  private mapRiskToSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (riskLevel) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Caching methods
   */
  private getCachedResult(request: ModerationRequest): { result: ModerationResult; timestamp: number } | null {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.resultCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes TTL
      return cached;
    }
    
    if (cached) {
      this.resultCache.delete(cacheKey);
    }
    
    return null;
  }

  private cacheResult(request: ModerationRequest, result: ModerationResult): void {
    const cacheKey = this.generateCacheKey(request);
    this.resultCache.set(cacheKey, { result, timestamp: Date.now() });
    
    // Cleanup old cache entries
    if (this.resultCache.size > 10000) {
      const entries = Array.from(this.resultCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 1000).forEach(([key]) => this.resultCache.delete(key));
    }
  }

  private generateCacheKey(request: ModerationRequest): string {
    const keyData = {
      type: request.type,
      userId: request.data.userId,
      content: request.data.content?.substring(0, 100),
      attachmentCount: request.data.attachments?.length || 0
    };
    
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Rate limiting
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 100; // Max requests per minute
    
    let userRequests = this.rateLimiter.get(userId) || [];
    
    // Clean old entries
    userRequests = userRequests.filter(req => now - req.timestamp < windowMs);
    
    if (userRequests.length >= maxRequests) {
      return false;
    }
    
    userRequests.push({ timestamp: now, requests: 1 });
    this.rateLimiter.set(userId, userRequests);
    
    return true;
  }

  /**
   * Health monitoring
   */
  private updateServiceHealth(serviceName: string, success: boolean, responseTime: number): void {
    let health = this.serviceHealth.get(serviceName);
    
    if (!health) {
      health = {
        service: serviceName,
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        errorRate: 0,
        uptime: 100
      };
      this.serviceHealth.set(serviceName, health);
    }
    
    // Update metrics
    health.lastCheck = new Date();
    health.responseTime = (health.responseTime + responseTime) / 2; // Simple moving average
    
    if (success) {
      health.uptime = Math.min(health.uptime + 0.1, 100);
      health.errorRate = Math.max(health.errorRate - 0.05, 0);
    } else {
      health.uptime = Math.max(health.uptime - 1, 0);
      health.errorRate = Math.min(health.errorRate + 0.1, 100);
    }
    
    // Update status
    if (health.errorRate > 50 || health.uptime < 50) {
      health.status = 'down';
    } else if (health.errorRate > 20 || health.uptime < 80) {
      health.status = 'degraded';
    } else {
      health.status = 'healthy';
    }
  }

  private updateMetrics(requestType: string, processingTime: number, error: boolean): void {
    let metric = this.metrics.get(requestType);
    
    if (!metric) {
      metric = { count: 0, totalTime: 0, errors: 0 };
      this.metrics.set(requestType, metric);
    }
    
    metric.count++;
    metric.totalTime += processingTime;
    if (error) metric.errors++;
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, 60000); // Every minute
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.reportMetrics();
    }, 5 * 60000); // Every 5 minutes
  }

  private async performHealthChecks(): Promise<void> {
    // Check AI service health
    const aiHealth = this.aiService.getHealthStatus();
    this.updateServiceHealth('ai_integration', aiHealth.healthy, 0);
    
    // Additional health checks would go here
  }

  private reportMetrics(): void {
    if (!this.config.analytics.enableMetrics) return;
    
    const metrics = {
      timestamp: new Date(),
      serviceHealth: Array.from(this.serviceHealth.values()),
      requestMetrics: Array.from(this.metrics.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        avgTime: data.totalTime / data.count,
        errorRate: (data.errors / data.count) * 100
      })),
      cacheStats: {
        size: this.resultCache.size,
        hitRate: 0 // Would calculate actual hit rate
      }
    };
    
    console.log('📊 Enhanced moderation metrics:', JSON.stringify(metrics, null, 2));
  }

  /**
   * Logging
   */
  private async logModerationResult(request: ModerationRequest, result: ModerationResult): Promise<void> {
    try {
      if (request.data.serverId && result.riskLevel !== 'safe') {
        await prisma.auditLog.create({
          data: {
            serverId: request.data.serverId,
            userId: 'system',
            targetId: request.data.userId,
            actionType: 989, // Enhanced moderation action type
            reason: `AI Moderation: ${result.riskLevel} risk detected`,
            options: {
              requestId: request.id,
              requestType: request.type,
              overallRisk: result.overallRisk,
              riskLevel: result.riskLevel,
              confidence: result.confidence,
              actionsExecuted: result.actions.length,
              servicesUsed: Object.keys(result.serviceResults).length,
              processingTime: result.performance.totalProcessingTime,
              blocked: result.blocked,
              requiresReview: result.requiresReview,
              timestamp: new Date().toISOString()
            },
            changes: null
          }
        });
      }

      const logLevel = result.riskLevel === 'critical' ? 'ERROR' : 
                      result.riskLevel === 'high' ? 'WARN' : 'INFO';
      
      console.log(`${logLevel === 'ERROR' ? '🚨' : logLevel === 'WARN' ? '⚠️' : '✅'} Enhanced moderation: ${request.id} - ${result.riskLevel} risk (${(result.overallRisk * 100).toFixed(1)}%) - ${result.actions.length} actions`);
    } catch (error) {
      console.error('Failed to log moderation result:', error);
    }
  }

  private createErrorResult(requestId: string, errorMessage: string, processingTime: number): ModerationResult {
    return {
      requestId,
      overallRisk: 0.5, // Default to medium risk on error
      riskLevel: 'medium',
      confidence: 0.1,
      actions: [],
      serviceResults: {},
      performance: {
        totalProcessingTime: processingTime,
        serviceTimings: {},
        cacheHits: 0,
        fallbacksUsed: 1
      },
      blocked: false,
      escalated: false,
      requiresReview: true // Error cases should be reviewed
    };
  }

  /**
   * Configuration management
   */
  private getDefaultConfig(): EnhancedModerationConfig {
    return {
      services: {
        toxicity: true,
        spam: true,
        nsfw: true,
        sentiment: true,
        fraud: true,
        smartTagging: true,
        recommendations: true,
        automatedBans: true,
        autoModeration: true
      },
      performance: {
        enableCaching: true,
        parallelProcessing: true,
        priorityQueue: true,
        rateLimiting: true
      },
      fallback: {
        enableFallbacks: true,
        maxRetries: 3,
        timeoutMs: 10000,
        degradedMode: true
      },
      analytics: {
        enableMetrics: true,
        enableReporting: true,
        retentionDays: 30
      }
    };
  }

  updateConfig(newConfig: Partial<EnhancedModerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get comprehensive service statistics
   */
  getStats(): {
    overallHealth: 'healthy' | 'degraded' | 'down';
    servicesHealth: { [service: string]: ServiceHealth };
    requestMetrics: { [type: string]: any };
    performanceMetrics: any;
  } {
    const healthStatuses = Array.from(this.serviceHealth.values()).map(h => h.status);
    const downCount = healthStatuses.filter(s => s === 'down').length;
    const degradedCount = healthStatuses.filter(s => s === 'degraded').length;
    
    let overallHealth: 'healthy' | 'degraded' | 'down';
    if (downCount > healthStatuses.length / 2) {
      overallHealth = 'down';
    } else if (downCount > 0 || degradedCount > healthStatuses.length / 3) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'healthy';
    }

    const requestMetrics: { [type: string]: any } = {};
    for (const [type, data] of this.metrics.entries()) {
      requestMetrics[type] = {
        count: data.count,
        averageTime: data.count > 0 ? data.totalTime / data.count : 0,
        errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0
      };
    }

    return {
      overallHealth,
      servicesHealth: Object.fromEntries(this.serviceHealth.entries()),
      requestMetrics,
      performanceMetrics: {
        cacheSize: this.resultCache.size,
        rateLimiterSize: this.rateLimiter.size
      }
    };
  }
}