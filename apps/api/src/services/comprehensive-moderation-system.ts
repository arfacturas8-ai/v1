import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import OpenAI from 'openai';

// Import all moderation services
import { AIModerationService } from './ai-moderation';
import { ModerationQueueProcessor } from './moderation-queue-processor';
import { AppealSystemService } from './appeal-system';
import { ModerationConfigService } from './moderation-config';
import { ModerationAnalyticsService } from './moderation-analytics';
import { ModerationMiddleware } from '../middleware/moderation';

export interface ModerationSystemConfig {
  openai: {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
  redis: {
    url: string;
    prefix?: string;
  };
  queue: {
    name?: string;
    concurrency?: number;
  };
  thresholds: {
    toxicity?: number;
    hate_speech?: number;
    harassment?: number;
    spam?: number;
    nsfw?: number;
    violence?: number;
    self_harm?: number;
    identity_attack?: number;
    profanity?: number;
    threat?: number;
  };
  autoActions: {
    critical_threshold?: number;
    high_threshold?: number;
    medium_threshold?: number;
    low_threshold?: number;
  };
  rateLimits: {
    requests_per_minute?: number;
    burst_limit?: number;
  };
  features: {
    realTimeModeration?: boolean;
    imageModeration?: boolean;
    appealSystem?: boolean;
    analytics?: boolean;
    autoActions?: boolean;
  };
}

/**
 * Comprehensive AI-Powered Content Moderation System
 * 
 * This class orchestrates all moderation components:
 * - AI-powered content analysis (text and images)
 * - Real-time content filtering
 * - Queue-based processing for scalability
 * - Appeal system for disputed actions
 * - Analytics and reporting
 * - Configuration management
 * - User action management (bans, warnings, etc.)
 */
export class ComprehensiveModerationSystem {
  private prisma: PrismaClient;
  private redis: Redis;
  private openai: OpenAI;
  private queues: Map<string, Queue> = new Map();

  // Core services
  public aiModeration: AIModerationService;
  public queueProcessor: ModerationQueueProcessor;
  public appealSystem: AppealSystemService;
  public config: ModerationConfigService;
  public analytics: ModerationAnalyticsService;
  public middleware: ModerationMiddleware;

  private isInitialized = false;
  private systemConfig: ModerationSystemConfig;

  constructor(
    prisma: PrismaClient,
    systemConfig: ModerationSystemConfig
  ) {
    this.prisma = prisma;
    this.systemConfig = systemConfig;

    // Initialize Redis connection
    this.redis = new Redis(systemConfig.redis.url, {
      keyPrefix: systemConfig.redis.prefix || 'moderation:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: systemConfig.openai.apiKey,
    });

    // Initialize core services
    this.initializeServices();
  }

  private initializeServices(): void {
    try {
      // Initialize AI moderation service
      this.aiModeration = new AIModerationService(
        this.redis,
        this.getQueue('moderation-actions')
      );

      // Initialize configuration service
      this.config = new ModerationConfigService(this.prisma, this.redis);

      // Initialize analytics service
      this.analytics = new ModerationAnalyticsService(this.prisma, this.redis);

      // Initialize appeal system
      this.appealSystem = new AppealSystemService();

      // Initialize queue processor
      this.queueProcessor = new ModerationQueueProcessor(
        this.prisma,
        this.redis,
        this.aiModeration
      );

      // Initialize middleware
      this.middleware = new ModerationMiddleware(
        this.aiModeration,
        this.redis,
        {
          enableCaching: true,
          cacheExpiryMinutes: 30,
          skipForTrustedUsers: true,
          trustLevelThreshold: 4,
          enableRateLimiting: true,
          maxRequestsPerMinute: this.systemConfig.rateLimits.requests_per_minute || 60,
          bypassRoles: ['admin', 'moderator', 'super_admin'],
          contentTypes: ['post', 'comment', 'message']
        }
      );

      console.log('✅ Comprehensive Moderation System services initialized');
    } catch (error) {
      console.error('❌ Failed to initialize moderation services:', error);
      throw error;
    }
  }

  /**
   * Initialize the complete moderation system
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('⚠️ Moderation system already initialized');
        return;
      }

      console.log('🚀 Initializing Comprehensive AI Moderation System...');

      // Test connections
      await this.testConnections();

      // Initialize database schema if needed
      await this.initializeDatabase();

      // Load and validate configuration
      await this.loadConfiguration();

      // Start background jobs
      await this.startBackgroundJobs();

      // Initialize monitoring
      await this.initializeMonitoring();

      this.isInitialized = true;
      console.log('✅ Comprehensive AI Moderation System initialized successfully');

      // Log system status
      await this.logSystemStatus();

    } catch (error) {
      console.error('❌ Failed to initialize moderation system:', error);
      throw error;
    }
  }

  /**
   * Moderate content (main entry point)
   */
  async moderateContent(
    content: string,
    contentId: string,
    contentType: 'post' | 'comment' | 'message',
    userId?: string,
    context?: {
      communityId?: string;
      serverId?: string;
      parentContentId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{
    allowed: boolean;
    action: string;
    reason?: string;
    confidence: number;
    categories: string[];
    moderationId?: string;
  }> {
    try {
      if (!this.isInitialized) {
        throw new Error('Moderation system not initialized');
      }

      // Check whitelist/blacklist first
      if (userId && await this.config.isBlacklisted('user', userId, context?.communityId, context?.serverId)) {
        return {
          allowed: false,
          action: 'ban_user',
          reason: 'User is blacklisted',
          confidence: 1.0,
          categories: ['blacklisted']
        };
      }

      if (userId && await this.config.isWhitelisted('user', userId, context?.communityId, context?.serverId)) {
        return {
          allowed: true,
          action: 'allow',
          reason: 'User is whitelisted',
          confidence: 1.0,
          categories: []
        };
      }

      // Check for blacklisted keywords
      if (await this.config.isBlacklisted('keyword', content, context?.communityId, context?.serverId)) {
        return {
          allowed: false,
          action: 'remove',
          reason: 'Content contains blacklisted keywords',
          confidence: 1.0,
          categories: ['blacklisted_keyword']
        };
      }

      // Perform AI moderation analysis
      const analysis = await this.aiModeration.analyzeTextContent(
        content,
        contentId,
        contentType,
        userId,
        context
      );

      // Convert analysis to result format
      return {
        allowed: analysis.recommended_action === 'none',
        action: analysis.recommended_action,
        reason: this.getActionReason(analysis.recommended_action, analysis.flagged_categories),
        confidence: analysis.overall_confidence,
        categories: analysis.flagged_categories,
        moderationId: contentId // This would be the stored analysis ID
      };

    } catch (error) {
      console.error('Error in moderateContent:', error);
      
      // Fail safely - allow content but log error
      return {
        allowed: true,
        action: 'allow',
        reason: 'Moderation system error - manual review required',
        confidence: 0,
        categories: ['system_error']
      };
    }
  }

  /**
   * Moderate image content
   */
  async moderateImage(
    imageUrl: string,
    fileId: string,
    userId?: string,
    context?: {
      communityId?: string;
      serverId?: string;
    }
  ): Promise<{
    allowed: boolean;
    action: string;
    reason?: string;
    confidence: number;
    nsfw_score: number;
    violence_score: number;
  }> {
    try {
      if (!this.systemConfig.features.imageModeration) {
        return {
          allowed: true,
          action: 'allow',
          reason: 'Image moderation disabled',
          confidence: 0,
          nsfw_score: 0,
          violence_score: 0
        };
      }

      const analysis = await this.aiModeration.moderateImage(imageUrl, fileId, userId);

      return {
        allowed: analysis.action === 'allow',
        action: analysis.action,
        reason: this.getImageActionReason(analysis.action, analysis.moderation_labels),
        confidence: analysis.confidence_score,
        nsfw_score: analysis.nsfw_score,
        violence_score: analysis.violence_score
      };

    } catch (error) {
      console.error('Error in moderateImage:', error);
      
      // Fail safely for images - require manual review
      return {
        allowed: false,
        action: 'flag',
        reason: 'Image moderation system error - manual review required',
        confidence: 0,
        nsfw_score: 0,
        violence_score: 0
      };
    }
  }

  /**
   * Submit an appeal
   */
  async submitAppeal(
    actionId: string,
    userId: string,
    reason: string,
    evidence?: string,
    evidenceUrls?: string[]
  ): Promise<{ success: boolean; appealId?: string; error?: string }> {
    try {
      if (!this.systemConfig.features.appealSystem) {
        return { success: false, error: 'Appeal system is disabled' };
      }

      return await this.appealSystem.submitAppeal({
        action_id: actionId,
        appellant_id: userId,
        appeal_reason: reason,
        evidence_provided: evidence,
        evidence_urls: evidenceUrls || []
      });

    } catch (error) {
      console.error('Error submitting appeal:', error);
      return { success: false, error: 'Failed to submit appeal' };
    }
  }

  /**
   * Get moderation statistics
   */
  async getStatistics(
    timeframe: '1h' | '24h' | '7d' | '30d' | '90d' = '24h',
    communityId?: string,
    serverId?: string
  ): Promise<any> {
    try {
      if (!this.systemConfig.features.analytics) {
        return { error: 'Analytics disabled' };
      }

      return await this.analytics.getModerationMetrics(timeframe, communityId, serverId);

    } catch (error) {
      console.error('Error getting statistics:', error);
      return { error: 'Failed to fetch statistics' };
    }
  }

  /**
   * Get real-time system status
   */
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    services: {
      ai_moderation: boolean;
      queue_processor: boolean;
      appeal_system: boolean;
      analytics: boolean;
      redis: boolean;
      database: boolean;
    };
    metrics: {
      pending_queue: number;
      actions_last_hour: number;
      active_moderators: number;
      system_load: string;
    };
    alerts: string[];
  }> {
    try {
      const [realTimeStats, serviceHealth] = await Promise.all([
        this.analytics.getRealTimeStats(),
        this.checkServiceHealth()
      ]);

      const alerts = [];
      if (realTimeStats.pending_queue > 100) {
        alerts.push('High queue backlog detected');
      }
      if (realTimeStats.avg_response_time > 60) {
        alerts.push('High response times detected');
      }
      if (realTimeStats.active_moderators === 0) {
        alerts.push('No active moderators online');
      }

      const allServicesHealthy = Object.values(serviceHealth).every(Boolean);
      const status = alerts.length === 0 && allServicesHealthy ? 'healthy' : 
                    alerts.length < 3 ? 'degraded' : 'error';

      return {
        status,
        services: serviceHealth,
        metrics: {
          pending_queue: realTimeStats.pending_queue,
          actions_last_hour: realTimeStats.actions_last_hour,
          active_moderators: realTimeStats.active_moderators,
          system_load: realTimeStats.alert_level
        },
        alerts
      };

    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        status: 'error',
        services: {
          ai_moderation: false,
          queue_processor: false,
          appeal_system: false,
          analytics: false,
          redis: false,
          database: false
        },
        metrics: {
          pending_queue: 0,
          actions_last_hour: 0,
          active_moderators: 0,
          system_load: 'unknown'
        },
        alerts: ['System status check failed']
      };
    }
  }

  /**
   * Gracefully shutdown the moderation system
   */
  async shutdown(): Promise<void> {
    try {
      console.log('🔄 Shutting down Comprehensive AI Moderation System...');

      // Close queue processors
      await this.queueProcessor.shutdown();

      // Close queues
      for (const [name, queue] of this.queues) {
        await queue.close();
        console.log(`✅ Queue ${name} closed`);
      }

      // Close Redis connection
      await this.redis.quit();
      console.log('✅ Redis connection closed');

      this.isInitialized = false;
      console.log('✅ Comprehensive AI Moderation System shut down successfully');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  // Private helper methods

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6380'),
          password: process.env.REDIS_PASSWORD
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  private async testConnections(): Promise<void> {
    // Test Redis connection
    try {
      await this.redis.ping();
      console.log('✅ Redis connection successful');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }

    // Test database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }

    // Test OpenAI connection
    try {
      if (this.systemConfig.openai.apiKey) {
        await this.openai.models.list();
        console.log('✅ OpenAI connection successful');
      } else {
        console.warn('⚠️ OpenAI API key not configured');
      }
    } catch (error) {
      console.warn('⚠️ OpenAI connection failed:', error);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Check if moderation tables exist
      const tableCheck = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('moderation_rules', 'ai_content_analysis', 'moderation_actions')
      ` as any[];

      if (tableCheck.length < 3) {
        console.log('⚠️ Moderation tables not found. Please run database migrations.');
        // In a real implementation, you might want to run migrations automatically
      } else {
        console.log('✅ Database schema validated');
      }
    } catch (error) {
      console.error('❌ Database schema validation failed:', error);
      throw error;
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      // Load default configuration
      const config = await this.config.getConfig();
      console.log('✅ Configuration loaded successfully');
      
      // Validate critical settings
      if (!config.openai_config.api_key) {
        console.warn('⚠️ OpenAI API key not configured in database, using environment variable');
      }
      
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }

  private async startBackgroundJobs(): Promise<void> {
    try {
      // Start appeal processing job
      if (this.systemConfig.features.appealSystem) {
        setInterval(async () => {
          try {
            await this.appealSystem.processOverdueAppeals();
          } catch (error) {
            console.error('Error processing overdue appeals:', error);
          }
        }, 60 * 60 * 1000); // Every hour
        
        console.log('✅ Appeal processing job started');
      }

      // Start metrics collection job
      if (this.systemConfig.features.analytics) {
        setInterval(async () => {
          try {
            // Collect and aggregate metrics
            await this.collectMetrics();
          } catch (error) {
            console.error('Error collecting metrics:', error);
          }
        }, 5 * 60 * 1000); // Every 5 minutes
        
        console.log('✅ Metrics collection job started');
      }

      console.log('✅ Background jobs started');
    } catch (error) {
      console.error('❌ Failed to start background jobs:', error);
      throw error;
    }
  }

  private async initializeMonitoring(): Promise<void> {
    try {
      // Set up health checks
      setInterval(async () => {
        try {
          const status = await this.getSystemStatus();
          if (status.status === 'error') {
            console.error('🚨 System health check failed:', status.alerts);
          }
        } catch (error) {
          console.error('Health check error:', error);
        }
      }, 2 * 60 * 1000); // Every 2 minutes

      console.log('✅ Monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize monitoring:', error);
      throw error;
    }
  }

  private async checkServiceHealth(): Promise<{
    ai_moderation: boolean;
    queue_processor: boolean;
    appeal_system: boolean;
    analytics: boolean;
    redis: boolean;
    database: boolean;
  }> {
    const health = {
      ai_moderation: false,
      queue_processor: false,
      appeal_system: false,
      analytics: false,
      redis: false,
      database: false
    };

    try {
      // Test Redis
      await this.redis.ping();
      health.redis = true;
    } catch {}

    try {
      // Test Database
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = true;
    } catch {}

    // Test other services (simplified checks)
    health.ai_moderation = this.aiModeration !== undefined;
    health.queue_processor = this.queueProcessor !== undefined;
    health.appeal_system = this.appealSystem !== undefined;
    health.analytics = this.analytics !== undefined;

    return health;
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.analytics.getRealTimeStats();
      
      // Store metrics in Redis for trending
      const timestamp = Date.now();
      await this.redis.zadd(
        'system:metrics:timeline',
        timestamp,
        JSON.stringify({
          timestamp,
          ...metrics
        })
      );

      // Keep only last 24 hours of metrics
      const oneDayAgo = timestamp - (24 * 60 * 60 * 1000);
      await this.redis.zremrangebyscore('system:metrics:timeline', '-inf', oneDayAgo);

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private async logSystemStatus(): Promise<void> {
    try {
      const status = await this.getSystemStatus();
      console.log('📊 System Status:', {
        status: status.status,
        services_healthy: Object.values(status.services).filter(Boolean).length,
        total_services: Object.keys(status.services).length,
        pending_queue: status.metrics.pending_queue,
        alerts: status.alerts.length
      });
    } catch (error) {
      console.error('Error logging system status:', error);
    }
  }

  private getActionReason(action: string, categories: string[]): string {
    const reasons = {
      'remove': 'Content removed due to policy violations',
      'quarantine': 'Content quarantined for manual review',
      'hide': 'Content hidden from public view',
      'flag': 'Content flagged for moderator review',
      'ban_user': 'User banned due to severe violations',
      'warn': 'User warned about content violations',
      'allow': 'Content approved'
    };

    const categoryText = categories.length > 0 ? ` (${categories.join(', ')})` : '';
    return (reasons[action as keyof typeof reasons] || 'Action taken') + categoryText;
  }

  private getImageActionReason(action: string, labels: string[]): string {
    const reasons = {
      'remove': 'Image removed due to policy violations',
      'quarantine': 'Image quarantined for manual review',
      'hide': 'Image hidden due to inappropriate content',
      'flag': 'Image flagged for review',
      'allow': 'Image approved'
    };

    const labelText = labels.length > 0 ? ` (${labels.join(', ')})` : '';
    return (reasons[action as keyof typeof reasons] || 'Action taken') + labelText;
  }
}

/**
 * Factory function to create and initialize the comprehensive moderation system
 */
export async function createModerationSystem(
  prisma: PrismaClient,
  config: ModerationSystemConfig
): Promise<ComprehensiveModerationSystem> {
  const system = new ComprehensiveModerationSystem(prisma, config);
  await system.initialize();
  return system;
}

// Export type definitions for external use
export type {
  ModerationSystemConfig,
  ModerationMetrics,
  ContentAnalyticsData,
  ModeratorPerformance,
  AIModelMetrics
} from './moderation-analytics';