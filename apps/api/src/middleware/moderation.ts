import { FastifyRequest, FastifyReply } from 'fastify';
import { AIModerationService } from '../services/ai-moderation';
import { createHash } from 'crypto';
import Redis from 'ioredis';

interface ModerationOptions {
  enableCaching?: boolean;
  cacheExpiryMinutes?: number;
  skipForTrustedUsers?: boolean;
  trustLevelThreshold?: number;
  enableRateLimiting?: boolean;
  maxRequestsPerMinute?: number;
  bypassRoles?: string[];
  contentTypes?: ('post' | 'comment' | 'message' | 'profile')[];
}

interface ModerationContext {
  userId?: string;
  userTrustLevel?: number;
  userRoles?: string[];
  communityId?: string;
  serverId?: string;
  contentType: string;
  content: string;
  contentId?: string;
}

export class ModerationMiddleware {
  private moderationService: AIModerationService;
  private redis: Redis;
  private options: Required<ModerationOptions>;

  constructor(
    moderationService: AIModerationService,
    redis: Redis,
    options: ModerationOptions = {}
  ) {
    this.moderationService = moderationService;
    this.redis = redis;
    this.options = {
      enableCaching: true,
      cacheExpiryMinutes: 30,
      skipForTrustedUsers: true,
      trustLevelThreshold: 4,
      enableRateLimiting: true,
      maxRequestsPerMinute: 10,
      bypassRoles: ['admin', 'moderator', 'super_admin'],
      contentTypes: ['post', 'comment', 'message'],
      ...options
    };
  }

  /**
   * Middleware for moderating content before it's saved
   */
  moderateContent = () => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const context = this.extractModerationContext(request);
        
        // Skip moderation for certain conditions
        if (await this.shouldSkipModeration(context)) {
          return;
        }

        // Rate limiting check
        if (this.options.enableRateLimiting) {
          await this.enforceRateLimit(context.userId!, reply);
        }

        // Check cache first
        if (this.options.enableCaching) {
          const cachedResult = await this.getCachedResult(context.content);
          if (cachedResult) {
            const action = await this.handleModerationResult(cachedResult, context, reply);
            if (action === 'block') return;
          }
        }

        // Perform moderation analysis
        const result = await this.moderationService.analyzeTextContent(
          context.content,
          context.contentId || this.generateContentId(),
          context.contentType as any,
          context.userId,
          {
            communityId: context.communityId,
            serverId: context.serverId
          }
        );

        // Cache result
        if (this.options.enableCaching) {
          await this.cacheResult(context.content, result);
        }

        // Handle the moderation result
        const action = await this.handleModerationResult(result, context, reply);
        if (action === 'block') return;

      } catch (error) {
        console.error('Moderation middleware error:', error);
        // In case of error, log but don't block the request
        request.log.error({ error }, 'Moderation failed, allowing content through');
      }
    };
  };

  /**
   * Middleware for moderating image uploads
   */
  moderateImage = () => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const context = this.extractImageModerationContext(request);
        
        if (await this.shouldSkipModeration(context)) {
          return;
        }

        if (this.options.enableRateLimiting) {
          await this.enforceRateLimit(context.userId!, reply);
        }

        // Extract image URL from request
        const imageUrl = this.extractImageUrl(request);
        if (!imageUrl) return;

        // Perform image moderation
        const result = await this.moderationService.analyzeImageContent(
          imageUrl,
          context.contentId || this.generateContentId(),
          context.userId
        );

        // Handle the result
        const action = await this.handleImageModerationResult(result, context, reply);
        if (action === 'block') return;

      } catch (error) {
        console.error('Image moderation middleware error:', error);
        request.log.error({ error }, 'Image moderation failed, allowing upload');
      }
    };
  };

  /**
   * Real-time message moderation for chat/messaging
   */
  moderateMessage = () => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const context = this.extractModerationContext(request);
        context.contentType = 'message';

        if (await this.shouldSkipModeration(context)) {
          return;
        }

        // More aggressive rate limiting for messages
        if (this.options.enableRateLimiting) {
          await this.enforceRateLimit(context.userId!, reply, 20); // 20 messages per minute max
        }

        // Quick local analysis first for real-time response
        const quickResult = await this.performQuickAnalysis(context.content);
        if (quickResult.block) {
          return reply.code(400).send({
            success: false,
            error: 'Message blocked by content filter',
            reason: quickResult.reason
          });
        }

        // Full analysis in background for learning/improvement
        this.performBackgroundAnalysis(context);

      } catch (error) {
        console.error('Message moderation middleware error:', error);
      }
    };
  };

  private extractModerationContext(request: FastifyRequest): ModerationContext {
    const body = request.body as any;
    const user = (request as any).user;
    
    return {
      userId: user?.id,
      userTrustLevel: user?.trust_level || 1,
      userRoles: user?.roles || [],
      communityId: body.communityId || body.community_id,
      serverId: body.serverId || body.server_id,
      contentType: this.inferContentType(request.url),
      content: body.content || body.text || body.message || '',
      contentId: body.id
    };
  }

  private extractImageModerationContext(request: FastifyRequest): ModerationContext {
    const user = (request as any).user;
    
    return {
      userId: user?.id,
      userTrustLevel: user?.trust_level || 1,
      userRoles: user?.roles || [],
      contentType: 'image',
      content: '',
      contentId: this.generateContentId()
    };
  }

  private inferContentType(url: string): string {
    if (url.includes('/posts')) return 'post';
    if (url.includes('/comments')) return 'comment';
    if (url.includes('/messages')) return 'message';
    if (url.includes('/profile')) return 'profile';
    return 'unknown';
  }

  private async shouldSkipModeration(context: ModerationContext): Promise<boolean> {
    // Skip for empty content
    if (!context.content || context.content.trim().length === 0) {
      return true;
    }

    // Skip for bypass roles
    if (context.userRoles?.some(role => this.options.bypassRoles.includes(role))) {
      return true;
    }

    // Skip for trusted users
    if (this.options.skipForTrustedUsers && 
        context.userTrustLevel! >= this.options.trustLevelThreshold) {
      return true;
    }

    // Skip if content type not in scope
    if (!this.options.contentTypes.includes(context.contentType as any)) {
      return true;
    }

    return false;
  }

  private async enforceRateLimit(
    userId: string, 
    reply: FastifyReply, 
    maxRequests: number = this.options.maxRequestsPerMinute
  ): Promise<void> {
    const key = `moderation:ratelimit:${userId}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 minute
    }
    
    if (current > maxRequests) {
      throw reply.code(429).send({
        success: false,
        error: 'Too many requests',
        message: 'Content moderation rate limit exceeded'
      });
    }
  }

  private async getCachedResult(content: string): Promise<any> {
    const cacheKey = `moderation:result:${createHash('sha256').update(content).digest('hex')}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheResult(content: string, result: any): Promise<void> {
    const cacheKey = `moderation:result:${createHash('sha256').update(content).digest('hex')}`;
    await this.redis.setex(
      cacheKey,
      this.options.cacheExpiryMinutes * 60,
      JSON.stringify(result)
    );
  }

  private async handleModerationResult(
    result: any,
    context: ModerationContext,
    reply: FastifyReply
  ): Promise<'allow' | 'block'> {
    const { recommended_action, flagged_categories, overall_confidence } = result;

    switch (recommended_action) {
      case 'remove':
        reply.code(400).send({
          success: false,
          error: 'Content blocked',
          message: 'This content violates community guidelines and cannot be posted.',
          categories: flagged_categories,
          confidence: overall_confidence
        });
        
        // Log high-severity block
        this.logModerationAction(context, result, 'blocked');
        return 'block';

      case 'quarantine':
        reply.code(400).send({
          success: false,
          error: 'Content requires review',
          message: 'This content has been flagged for manual review before publication.',
          categories: flagged_categories
        });
        
        this.logModerationAction(context, result, 'quarantined');
        return 'block';

      case 'hide':
        // Allow through but mark for hiding from public
        this.flagContentForHiding(context, result);
        this.logModerationAction(context, result, 'hidden');
        return 'allow';

      case 'flag':
        // Allow through but flag for moderator review
        this.flagContentForReview(context, result);
        this.logModerationAction(context, result, 'flagged');
        return 'allow';

      case 'ban_user':
        reply.code(403).send({
          success: false,
          error: 'Account suspended',
          message: 'Your account has been suspended due to severe policy violations.'
        });
        
        this.triggerUserBan(context, result);
        return 'block';

      default:
        return 'allow';
    }
  }

  private async handleImageModerationResult(
    result: any,
    context: ModerationContext,
    reply: FastifyReply
  ): Promise<'allow' | 'block'> {
    if (result.flagged || result.action === 'remove') {
      reply.code(400).send({
        success: false,
        error: 'Image blocked',
        message: 'This image contains content that violates our guidelines.',
        details: result.moderation_labels
      });
      
      this.logModerationAction(context, result, 'image_blocked');
      return 'block';
    }

    if (result.action === 'quarantine' || result.action === 'flag') {
      this.flagImageForReview(context, result);
    }

    return 'allow';
  }

  private async performQuickAnalysis(content: string): Promise<{ block: boolean; reason?: string }> {
    // Quick local analysis for real-time response
    const lowerContent = content.toLowerCase();
    
    // Check for common immediate-block patterns
    const severeProfanity = /\b(fuck|shit|damn|bitch|asshole)\b/gi;
    const threats = /\b(kill|murder|die|hurt)\s+(you|yourself|him|her)\b/gi;
    const spam = /(.)\1{10,}|https?:\/\/[^\s]{20,}/gi;
    
    if (threats.test(content)) {
      return { block: true, reason: 'Threatening language detected' };
    }
    
    if (spam.test(content)) {
      return { block: true, reason: 'Spam detected' };
    }
    
    const profanityMatches = content.match(severeProfanity);
    if (profanityMatches && profanityMatches.length > 2) {
      return { block: true, reason: 'Excessive profanity' };
    }
    
    return { block: false };
  }

  private async performBackgroundAnalysis(context: ModerationContext): Promise<void> {
    // Perform full AI analysis in background
    try {
      await this.moderationService.analyzeTextContent(
        context.content,
        context.contentId || this.generateContentId(),
        'message',
        context.userId,
        {
          communityId: context.communityId,
          serverId: context.serverId
        }
      );
    } catch (error) {
      console.error('Background analysis failed:', error);
    }
  }

  private extractImageUrl(request: FastifyRequest): string | null {
    // Extract image URL from various possible locations
    const body = request.body as any;
    return body.url || body.imageUrl || body.file_url || null;
  }

  private flagContentForHiding(context: ModerationContext, result: any): void {
    // Queue content for hiding
    // This would integrate with your content management system
    console.log(`🔍 Flagging content for hiding: ${context.contentType} by ${context.userId}`);
  }

  private flagContentForReview(context: ModerationContext, result: any): void {
    // Queue content for moderator review
    console.log(`🚩 Flagging content for review: ${context.contentType} by ${context.userId}`);
  }

  private flagImageForReview(context: ModerationContext, result: any): void {
    // Queue image for moderator review
    console.log(`🖼️ Flagging image for review: ${context.contentId} by ${context.userId}`);
  }

  private triggerUserBan(context: ModerationContext, result: any): void {
    // Trigger user ban process
    console.log(`🔨 Triggering user ban for: ${context.userId}`);
  }

  private logModerationAction(context: ModerationContext, result: any, action: string): void {
    // Log moderation action for analytics
    const logData = {
      action,
      userId: context.userId,
      contentType: context.contentType,
      confidence: result.overall_confidence,
      categories: result.flagged_categories,
      timestamp: new Date().toISOString()
    };
    
    // Store in Redis for real-time metrics
    this.redis.lpush('moderation:actions', JSON.stringify(logData));
    this.redis.ltrim('moderation:actions', 0, 999); // Keep last 1000 actions
    
    console.log(`📊 Moderation action logged:`, logData);
  }

  private generateContentId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get real-time moderation metrics
   */
  async getMetrics(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const metrics = await this.redis.hgetall(`moderation:metrics:${today}`);
    
    return {
      date: today,
      total_actions: parseInt(metrics.total_actions || '0'),
      actions_by_type: {
        blocked: parseInt(metrics['action:blocked'] || '0'),
        quarantined: parseInt(metrics['action:quarantined'] || '0'),
        flagged: parseInt(metrics['action:flagged'] || '0'),
        hidden: parseInt(metrics['action:hidden'] || '0')
      },
      content_types: {
        posts: parseInt(metrics['type:post'] || '0'),
        comments: parseInt(metrics['type:comment'] || '0'),
        messages: parseInt(metrics['type:message'] || '0')
      }
    };
  }

  /**
   * Get recent moderation actions
   */
  async getRecentActions(limit: number = 50): Promise<any[]> {
    const actions = await this.redis.lrange('moderation:actions', 0, limit - 1);
    return actions.map(action => JSON.parse(action));
  }
}

export const createModerationMiddleware = (
  moderationService: AIModerationService,
  redis: Redis,
  options?: ModerationOptions
): ModerationMiddleware => {
  return new ModerationMiddleware(moderationService, redis, options);
};