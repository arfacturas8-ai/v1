/**
 * CRYB Platform - Recommendations API
 * Content, user, and community recommendation endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { recommendationEngine } from '../recommendations/engine';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { rateLimit } from '../middleware/rateLimit';
import { cacheMiddleware } from '../middleware/cache';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Recommendation schemas
const contentRecommendationSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  context: z.object({
    current_post_id: z.string().optional(),
    current_community_id: z.string().optional(),
    session_context: z.record(z.any()).optional()
  }).optional(),
  filters: z.object({
    communities: z.array(z.string()).optional(),
    content_types: z.array(z.string()).optional(),
    min_score: z.number().min(0).max(100).optional(),
    exclude_nsfw: z.boolean().optional(),
    time_range: z.enum(['1h', '6h', '24h', '7d', '30d']).optional()
  }).optional()
});

const userRecommendationSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  context: z.object({
    recommendation_type: z.enum(['follow', 'connect', 'collaborate']).optional(),
    shared_interests: z.array(z.string()).optional()
  }).optional(),
  filters: z.object({
    min_karma: z.number().optional(),
    verified_only: z.boolean().optional(),
    active_users_only: z.boolean().optional(),
    exclude_followed: z.boolean().default(true)
  }).optional()
});

const communityRecommendationSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  context: z.object({
    interests: z.array(z.string()).optional(),
    current_communities: z.array(z.string()).optional()
  }).optional(),
  filters: z.object({
    min_members: z.number().optional(),
    max_members: z.number().optional(),
    activity_level: z.enum(['low', 'medium', 'high']).optional(),
    exclude_joined: z.boolean().default(true)
  }).optional()
});

const feedGenerationSchema = z.object({
  algorithm: z.enum(['personalized', 'trending', 'fresh', 'mixed']).default('mixed'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  time_range: z.enum(['1h', '6h', '24h', '7d']).default('24h'),
  diversity_factor: z.number().min(0).max(1).default(0.3)
});

// Rate limiting for recommendation endpoints
const recommendationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many recommendation requests'
});

const feedRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // Higher limit for feed requests
  message: 'Too many feed requests'
});

/**
 * @route GET /recommendations/content
 * @desc Get personalized content recommendations
 */
router.get('/content',
  recommendationRateLimit,
  requireAuth,
  validateRequest(contentRecommendationSchema, 'query'),
  cacheMiddleware(300), // 5-minute cache
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { limit, context, filters } = req.validatedData;

      const recommendations = await recommendationEngine.getRecommendations({
        user_id: userId,
        type: 'content',
        limit,
        context,
        filters
      });

      // Track recommendation request for analytics
      await trackRecommendationRequest(req, 'content', {
        user_id: userId,
        recommendations_count: recommendations.length,
        filters_applied: Object.keys(filters || {}).length
      });

      res.json({
        success: true,
        data: {
          recommendations,
          algorithm: 'hybrid',
          personalization_score: calculatePersonalizationScore(recommendations),
          diversity_score: calculateDiversityScore(recommendations),
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get content recommendations', { 
        error, 
        userId: req.user?.id,
        query: req.query 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to generate content recommendations'
      });
    }
  }
);

/**
 * @route GET /recommendations/users
 * @desc Get user recommendations (people to follow/connect with)
 */
router.get('/users',
  recommendationRateLimit,
  requireAuth,
  validateRequest(userRecommendationSchema, 'query'),
  cacheMiddleware(600), // 10-minute cache
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { limit, context, filters } = req.validatedData;

      const recommendations = await recommendationEngine.getRecommendations({
        user_id: userId,
        type: 'users',
        limit,
        context,
        filters
      });

      await trackRecommendationRequest(req, 'users', {
        user_id: userId,
        recommendations_count: recommendations.length
      });

      res.json({
        success: true,
        data: {
          recommendations,
          algorithm: 'collaborative_filtering',
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get user recommendations', { 
        error, 
        userId: req.user?.id 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to generate user recommendations'
      });
    }
  }
);

/**
 * @route GET /recommendations/communities
 * @desc Get community recommendations
 */
router.get('/communities',
  recommendationRateLimit,
  requireAuth,
  validateRequest(communityRecommendationSchema, 'query'),
  cacheMiddleware(600), // 10-minute cache
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { limit, context, filters } = req.validatedData;

      const recommendations = await recommendationEngine.getRecommendations({
        user_id: userId,
        type: 'communities',
        limit,
        context,
        filters
      });

      await trackRecommendationRequest(req, 'communities', {
        user_id: userId,
        recommendations_count: recommendations.length
      });

      res.json({
        success: true,
        data: {
          recommendations,
          algorithm: 'topic_based',
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get community recommendations', { 
        error, 
        userId: req.user?.id 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to generate community recommendations'
      });
    }
  }
);

/**
 * @route POST /recommendations/feed
 * @desc Generate personalized feed
 */
router.post('/feed',
  feedRateLimit,
  requireAuth,
  validateRequest(feedGenerationSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { algorithm, limit, offset, time_range, diversity_factor } = req.validatedData;

      let feedRecommendations;

      switch (algorithm) {
        case 'personalized':
          feedRecommendations = await generatePersonalizedFeed(userId, limit, offset, time_range);
          break;
        case 'trending':
          feedRecommendations = await generateTrendingFeed(userId, limit, offset, time_range);
          break;
        case 'fresh':
          feedRecommendations = await generateFreshFeed(userId, limit, offset, time_range);
          break;
        case 'mixed':
        default:
          feedRecommendations = await generateMixedFeed(userId, limit, offset, time_range, diversity_factor);
          break;
      }

      await trackRecommendationRequest(req, 'feed', {
        user_id: userId,
        algorithm,
        recommendations_count: feedRecommendations.length,
        offset
      });

      res.json({
        success: true,
        data: {
          feed: feedRecommendations,
          algorithm,
          offset,
          has_more: feedRecommendations.length === limit,
          next_offset: offset + limit,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to generate feed', { 
        error, 
        userId: req.user?.id,
        body: req.body 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to generate personalized feed'
      });
    }
  }
);

/**
 * @route POST /recommendations/similar/:postId
 * @desc Get posts similar to a specific post
 */
router.get('/similar/:postId',
  recommendationRateLimit,
  cacheMiddleware(900), // 15-minute cache for similar posts
  async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { limit = 5 } = req.query;

      const similarPosts = await getSimilarPosts(postId, Number(limit));

      res.json({
        success: true,
        data: {
          reference_post_id: postId,
          similar_posts: similarPosts,
          algorithm: 'content_similarity',
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get similar posts', { 
        error, 
        postId: req.params.postId 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to find similar posts'
      });
    }
  }
);

/**
 * @route POST /recommendations/feedback
 * @desc Provide feedback on recommendations (for learning)
 */
router.post('/feedback',
  recommendationRateLimit,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { recommendation_id, feedback_type, feedback_value, context } = req.body;

      if (!recommendation_id || !feedback_type) {
        return res.status(400).json({
          success: false,
          error: 'recommendation_id and feedback_type are required'
        });
      }

      await recordRecommendationFeedback({
        user_id: userId,
        recommendation_id,
        feedback_type, // 'click', 'like', 'share', 'hide', 'not_interested'
        feedback_value, // 1 for positive, -1 for negative, 0 for neutral
        context,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Feedback recorded successfully'
      });
    } catch (error) {
      logger.error('Failed to record recommendation feedback', { 
        error, 
        userId: req.user?.id,
        body: req.body 
      });
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback'
      });
    }
  }
);

/**
 * @route GET /recommendations/stats
 * @desc Get recommendation system statistics (admin only)
 */
router.get('/stats',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const stats = await getRecommendationStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get recommendation stats', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recommendation statistics'
      });
    }
  }
);

// Helper functions

async function generatePersonalizedFeed(userId: string, limit: number, offset: number, timeRange: string): Promise<any[]> {
  // Get personalized content recommendations with higher weight on user preferences
  const recommendations = await recommendationEngine.getRecommendations({
    user_id: userId,
    type: 'content',
    limit: limit * 2, // Get more to filter and diversify
    context: { feed_generation: true, time_range: timeRange }
  });

  // Apply pagination
  return recommendations.slice(offset, offset + limit);
}

async function generateTrendingFeed(userId: string, limit: number, offset: number, timeRange: string): Promise<any[]> {
  // Focus on trending content across platform
  const recommendations = await recommendationEngine.getRecommendations({
    user_id: userId,
    type: 'content',
    limit: limit * 2,
    context: { 
      algorithm: 'trending_only',
      time_range: timeRange,
      minimize_personalization: true 
    }
  });

  return recommendations.slice(offset, offset + limit);
}

async function generateFreshFeed(userId: string, limit: number, offset: number, timeRange: string): Promise<any[]> {
  // Focus on newest content with minimal filtering
  const recommendations = await recommendationEngine.getRecommendations({
    user_id: userId,
    type: 'content',
    limit: limit * 2,
    context: { 
      algorithm: 'chronological',
      time_range: timeRange,
      fresh_content_bias: true 
    }
  });

  return recommendations.slice(offset, offset + limit);
}

async function generateMixedFeed(userId: string, limit: number, offset: number, timeRange: string, diversityFactor: number): Promise<any[]> {
  // Mix of personalized, trending, and fresh content
  const personalizedLimit = Math.floor(limit * (1 - diversityFactor));
  const trendingLimit = Math.floor(limit * diversityFactor * 0.6);
  const freshLimit = limit - personalizedLimit - trendingLimit;

  const [personalizedRecs, trendingRecs, freshRecs] = await Promise.all([
    generatePersonalizedFeed(userId, personalizedLimit, 0, timeRange),
    generateTrendingFeed(userId, trendingLimit, 0, timeRange),
    generateFreshFeed(userId, freshLimit, 0, timeRange)
  ]);

  // Interleave recommendations to maintain diversity
  const mixedFeed = interleaveRecommendations([
    { recs: personalizedRecs, weight: 3 },
    { recs: trendingRecs, weight: 2 },
    { recs: freshRecs, weight: 1 }
  ]);

  return mixedFeed.slice(offset, offset + limit);
}

function interleaveRecommendations(sources: { recs: any[], weight: number }[]): any[] {
  const result = [];
  const indices = sources.map(() => 0);
  let totalWeight = sources.reduce((sum, source) => sum + source.weight, 0);

  while (result.length < 100 && sources.some((source, i) => indices[i] < source.recs.length)) {
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const probability = source.weight / totalWeight;
      
      if (Math.random() < probability && indices[i] < source.recs.length) {
        result.push(source.recs[indices[i]]);
        indices[i]++;
      }
    }
  }

  return result;
}

async function getSimilarPosts(postId: string, limit: number): Promise<any[]> {
  // Use the recommendation engine's similar content functionality
  try {
    // This would integrate with the recommendation engine's similar content method
    return [];
  } catch (error) {
    logger.error('Failed to get similar posts', { error, postId });
    return [];
  }
}

function calculatePersonalizationScore(recommendations: any[]): number {
  // Calculate how personalized the recommendations are based on various factors
  if (recommendations.length === 0) return 0;

  let score = 0;
  recommendations.forEach(rec => {
    if (rec.reason && rec.reason.includes('similar')) score += 0.3;
    if (rec.reason && rec.reason.includes('interests')) score += 0.4;
    if (rec.reason && rec.reason.includes('communities')) score += 0.2;
    if (rec.reason && rec.reason.includes('trending')) score += 0.1;
  });

  return Math.min(score / recommendations.length, 1.0);
}

function calculateDiversityScore(recommendations: any[]): number {
  // Calculate diversity based on communities, authors, and content types
  if (recommendations.length === 0) return 0;

  const uniqueCommunities = new Set(recommendations.map(r => r.community?.id)).size;
  const uniqueAuthors = new Set(recommendations.map(r => r.author?.id)).size;
  
  const communityDiversity = uniqueCommunities / Math.min(recommendations.length, 10);
  const authorDiversity = uniqueAuthors / recommendations.length;

  return (communityDiversity + authorDiversity) / 2;
}

async function trackRecommendationRequest(req: Request, type: string, data: any): Promise<void> {
  try {
    // Track recommendation request for analytics and improvement
    logger.info('Recommendation request', {
      type,
      user_id: req.user?.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      data
    });

    // Could also store in TimescaleDB for analytics
  } catch (error) {
    logger.error('Failed to track recommendation request', { error });
  }
}

async function recordRecommendationFeedback(feedback: any): Promise<void> {
  try {
    // Store feedback for machine learning improvements
    logger.info('Recommendation feedback', feedback);

    // Store in database for model training
    // This would integrate with your ML pipeline
  } catch (error) {
    logger.error('Failed to record recommendation feedback', { error });
  }
}

async function getRecommendationStats(): Promise<any> {
  try {
    // Return statistics about recommendation system performance
    return {
      total_recommendations_served: 0, // Would get from analytics
      click_through_rate: 0.0,
      engagement_rate: 0.0,
      diversity_score: 0.0,
      personalization_score: 0.0,
      algorithm_performance: {
        collaborative_filtering: { ctr: 0.0, engagement: 0.0 },
        content_based: { ctr: 0.0, engagement: 0.0 },
        trending: { ctr: 0.0, engagement: 0.0 }
      },
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to get recommendation stats', { error });
    throw error;
  }
}

export default router;