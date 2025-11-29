/**
 * Comprehensive AI-Powered Content Moderation System
 * Usage Examples and Integration Guide
 * 
 * This file demonstrates how to integrate and use the moderation system
 * in your Cryb platform application.
 */

import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { 
  ComprehensiveModerationSystem, 
  createModerationSystem,
  ModerationSystemConfig 
} from '../services/comprehensive-moderation-system';

// Example 1: Basic Setup and Initialization
export async function setupModerationSystem(): Promise<ComprehensiveModerationSystem> {
  const prisma = new PrismaClient();
  
  const config: ModerationSystemConfig = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
      maxTokens: 500,
      temperature: 0.1
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6380',
      prefix: 'cryb:moderation:'
    },
    queue: {
      name: 'moderation-queue',
      concurrency: 5
    },
    thresholds: {
      toxicity: 0.7,
      hate_speech: 0.8,
      harassment: 0.7,
      spam: 0.8,
      nsfw: 0.6,
      violence: 0.8,
      self_harm: 0.5,
      identity_attack: 0.8,
      profanity: 0.7,
      threat: 0.8
    },
    autoActions: {
      critical_threshold: 0.9,
      high_threshold: 0.8,
      medium_threshold: 0.6,
      low_threshold: 0.4
    },
    rateLimits: {
      requests_per_minute: 60,
      burst_limit: 10
    },
    features: {
      realTimeModeration: true,
      imageModeration: true,
      appealSystem: true,
      analytics: true,
      autoActions: true
    }
  };

  const moderationSystem = await createModerationSystem(prisma, config);
  return moderationSystem;
}

// Example 2: Integrating with Fastify Routes
export async function setupModerationRoutes(
  fastify: FastifyInstance,
  moderationSystem: ComprehensiveModerationSystem
): Promise<void> {
  
  // Add moderation middleware to post creation
  fastify.post('/api/v1/posts', {
    preHandler: [
      // Authentication middleware (your existing auth)
      // ... 
      moderationSystem.middleware.moderateContent()
    ]
  }, async (request, reply) => {
    const { title, content, communityId } = request.body as any;
    const userId = (request as any).user.id;

    // Content has already been moderated by middleware
    // If we reach here, content is allowed or flagged for review
    
    const post = await fastify.prisma.post.create({
      data: {
        title,
        content,
        userId,
        communityId
      }
    });

    return { success: true, post };
  });

  // Add image moderation endpoint
  fastify.post('/api/v1/moderate/image', async (request, reply) => {
    const { imageUrl, fileId } = request.body as any;
    const userId = (request as any).user?.id;

    const result = await moderationSystem.moderateImage(
      imageUrl,
      fileId,
      userId,
      { communityId: request.body.communityId }
    );

    if (!result.allowed) {
      return reply.code(400).send({
        success: false,
        error: result.reason,
        action: result.action
      });
    }

    return { success: true, result };
  });

  // Appeal submission endpoint
  fastify.post('/api/v1/moderation/appeals', async (request, reply) => {
    const { actionId, reason, evidence, evidenceUrls } = request.body as any;
    const userId = (request as any).user.id;

    const result = await moderationSystem.submitAppeal(
      actionId,
      userId,
      reason,
      evidence,
      evidenceUrls
    );

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        error: result.error
      });
    }

    return {
      success: true,
      appealId: result.appealId,
      message: 'Appeal submitted successfully'
    };
  });

  // Admin analytics endpoint
  fastify.get('/api/v1/admin/moderation/analytics', {
    preHandler: [/* admin auth middleware */]
  }, async (request, reply) => {
    const { timeframe, communityId, serverId } = request.query as any;

    const analytics = await moderationSystem.getStatistics(
      timeframe || '24h',
      communityId,
      serverId
    );

    return { success: true, analytics };
  });

  // System status endpoint
  fastify.get('/api/v1/moderation/status', async (request, reply) => {
    const status = await moderationSystem.getSystemStatus();
    return { success: true, status };
  });
}

// Example 3: Manual Content Moderation
export async function moderatePostContent(
  moderationSystem: ComprehensiveModerationSystem,
  postData: {
    id: string;
    title: string;
    content: string;
    userId: string;
    communityId?: string;
  }
): Promise<{
  allowed: boolean;
  action: string;
  reason?: string;
  moderationId?: string;
}> {
  
  // Combine title and content for analysis
  const fullContent = `${postData.title}\n\n${postData.content}`;
  
  const result = await moderationSystem.moderateContent(
    fullContent,
    postData.id,
    'post',
    postData.userId,
    {
      communityId: postData.communityId,
      // Add additional context as needed
    }
  );

  console.log(`📋 Post ${postData.id} moderation result:`, {
    action: result.action,
    confidence: result.confidence,
    categories: result.categories
  });

  return result;
}

// Example 4: Batch Content Moderation
export async function batchModerateContent(
  moderationSystem: ComprehensiveModerationSystem,
  contentItems: Array<{
    id: string;
    content: string;
    type: 'post' | 'comment' | 'message';
    userId: string;
  }>
): Promise<Array<{
  id: string;
  result: any;
  error?: string;
}>> {
  
  const results = [];

  // Process in batches to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < contentItems.length; i += batchSize) {
    const batch = contentItems.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (item) => {
      try {
        const result = await moderationSystem.moderateContent(
          item.content,
          item.id,
          item.type,
          item.userId
        );
        
        return { id: item.id, result };
      } catch (error) {
        return { 
          id: item.id, 
          result: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add small delay between batches to respect rate limits
    if (i + batchSize < contentItems.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Example 5: Custom Moderation Rules
export async function setupCustomModerationRules(
  moderationSystem: ComprehensiveModerationSystem,
  communityId: string
): Promise<void> {
  
  // Create a community-specific rule for cryptocurrency discussions
  await moderationSystem.config.createRule({
    name: 'Crypto Spam Filter',
    description: 'Filters cryptocurrency promotional content',
    rule_type: 'keyword',
    severity: 'medium',
    action: 'flag',
    auto_action: true,
    enabled: true,
    config: {
      keywords: ['pump', 'diamond hands', 'to the moon', 'HODL', 'buy now'],
      require_multiple: true,
      threshold: 2
    },
    community_id: communityId
  });

  // Create an AI threshold rule for toxicity
  await moderationSystem.config.createRule({
    name: 'Community Toxicity Filter',
    description: 'Enhanced toxicity detection for sensitive communities',
    rule_type: 'ai_threshold',
    severity: 'high',
    action: 'quarantine',
    auto_action: true,
    enabled: true,
    config: {
      ai_model: 'openai',
      threshold: 0.6, // Lower threshold for this community
      categories: ['toxicity', 'harassment', 'hate_speech']
    },
    community_id: communityId
  });

  console.log(`✅ Custom moderation rules created for community ${communityId}`);
}

// Example 6: Real-time Monitoring and Alerts
export async function setupModerationMonitoring(
  moderationSystem: ComprehensiveModerationSystem
): Promise<void> {
  
  // Set up periodic health checks
  setInterval(async () => {
    try {
      const status = await moderationSystem.getSystemStatus();
      
      if (status.status === 'error') {
        console.error('🚨 MODERATION SYSTEM ALERT:', {
          status: status.status,
          alerts: status.alerts,
          metrics: status.metrics
        });
        
        // Here you would typically:
        // - Send notifications to admins
        // - Log to monitoring systems
        // - Trigger automatic recovery procedures
        await sendAlertToAdmins(status);
      }
      
      // Log metrics for trending
      console.log('📊 Moderation System Metrics:', {
        pending_queue: status.metrics.pending_queue,
        actions_last_hour: status.metrics.actions_last_hour,
        active_moderators: status.metrics.active_moderators,
        system_load: status.metrics.system_load
      });
      
    } catch (error) {
      console.error('❌ Error in monitoring check:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('✅ Moderation monitoring setup complete');
}

// Example 7: Configuration Management
export async function updateModerationConfiguration(
  moderationSystem: ComprehensiveModerationSystem,
  updates: {
    thresholds?: any;
    whitelist_users?: string[];
    blacklist_keywords?: string[];
  }
): Promise<void> {
  
  // Update thresholds
  if (updates.thresholds) {
    const result = await moderationSystem.config.updateThresholds(
      updates.thresholds,
      undefined, // global scope
      undefined,
      'system_admin'
    );
    
    if (result.success) {
      console.log('✅ Moderation thresholds updated');
    } else {
      console.error('❌ Failed to update thresholds:', result.error);
    }
  }

  // Update whitelist
  if (updates.whitelist_users?.length) {
    await moderationSystem.config.updateList(
      'whitelist',
      'users',
      'add',
      updates.whitelist_users,
      undefined,
      undefined,
      'system_admin'
    );
    console.log(`✅ Added ${updates.whitelist_users.length} users to whitelist`);
  }

  // Update blacklist
  if (updates.blacklist_keywords?.length) {
    await moderationSystem.config.updateList(
      'blacklist',
      'keywords',
      'add',
      updates.blacklist_keywords,
      undefined,
      undefined,
      'system_admin'
    );
    console.log(`✅ Added ${updates.blacklist_keywords.length} keywords to blacklist`);
  }
}

// Example 8: Graceful Shutdown
export async function shutdownModerationSystem(
  moderationSystem: ComprehensiveModerationSystem
): Promise<void> {
  console.log('🔄 Initiating graceful shutdown of moderation system...');
  
  try {
    // Allow current operations to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Shutdown the system
    await moderationSystem.shutdown();
    
    console.log('✅ Moderation system shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    throw error;
  }
}

// Helper function for admin alerts
async function sendAlertToAdmins(status: any): Promise<void> {
  // Implementation would depend on your notification system
  // Examples: Discord webhook, Slack notification, email, etc.
  console.log('📧 Sending alert to administrators:', status.alerts);
}

// Example usage in main application
export async function initializeModerationInApp(): Promise<void> {
  try {
    // Initialize the moderation system
    const moderationSystem = await setupModerationSystem();
    
    // Set up monitoring
    await setupModerationMonitoring(moderationSystem);
    
    // Create some example custom rules
    // await setupCustomModerationRules(moderationSystem, 'example-community-id');
    
    console.log('🎉 Comprehensive AI Moderation System ready for production!');
    
    // Example of how to integrate with your existing routes
    // setupModerationRoutes(fastifyInstance, moderationSystem);
    
  } catch (error) {
    console.error('❌ Failed to initialize moderation system:', error);
    process.exit(1);
  }
}

// Export for use in other parts of your application
export {
  moderatePostContent,
  batchModerateContent,
  setupCustomModerationRules,
  updateModerationConfiguration
};