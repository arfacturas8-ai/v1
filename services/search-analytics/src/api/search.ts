/**
 * CRYB Platform - Search API
 * Advanced search endpoints with full-text search, filters, and faceting
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { elasticsearchClient } from '../elasticsearch/client';
import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { rateLimit } from '../middleware/rateLimit';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Search schemas
const searchPostsSchema = z.object({
  query: z.string().optional(),
  community: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  content_type: z.enum(['text', 'link', 'image', 'video', 'poll']).optional(),
  sort: z.enum(['relevance', 'newest', 'oldest', 'hot', 'top', 'most_upvotes', 'most_comments']).default('relevance'),
  from: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
  nsfw: z.boolean().optional(),
  verified_only: z.boolean().optional(),
  time_range: z.enum(['hour', 'day', 'week', 'month', 'year', 'all']).optional(),
  min_score: z.number().optional()
});

const autocompleteSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['posts', 'users', 'communities']).default('posts'),
  limit: z.number().int().min(1).max(20).default(10)
});

const advancedSearchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    communities: z.array(z.string()).optional(),
    authors: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    content_types: z.array(z.string()).optional(),
    date_range: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional()
    }).optional(),
    score_range: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional(),
    engagement_range: z.object({
      min_comments: z.number().optional(),
      min_upvotes: z.number().optional(),
      min_views: z.number().optional()
    }).optional()
  }).optional(),
  sort: z.array(z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']).default('desc')
  })).optional(),
  aggregations: z.array(z.string()).optional(),
  from: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20)
});

// Apply rate limiting to search endpoints
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many search requests'
});

const autocompleteRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200, // Higher limit for autocomplete
  message: 'Too many autocomplete requests'
});

/**
 * @route POST /search/posts
 * @desc Search posts with filters and faceting
 */
router.post('/posts', 
  searchRateLimit,
  validateRequest(searchPostsSchema),
  cacheMiddleware(300), // 5-minute cache
  async (req: Request, res: Response) => {
    try {
      const params = req.validatedData;
      
      // Add time range filter if specified
      if (params.time_range && params.time_range !== 'all') {
        const timeRanges = {
          hour: '1h',
          day: '1d',
          week: '7d',
          month: '30d',
          year: '365d'
        };
        params.filters = {
          ...params.filters,
          time_range: timeRanges[params.time_range]
        };
      }

      const results = await elasticsearchClient.searchPosts(params);
      
      // Add search analytics
      await logSearchEvent(req, 'post_search', {
        query: params.query,
        results_count: results.total.value || results.total,
        filters_used: Object.keys(params.filters || {}).length
      });

      res.json({
        success: true,
        data: {
          results: results.posts,
          total: results.total,
          aggregations: results.aggregations,
          took: results.took,
          pagination: {
            from: params.from,
            size: params.size,
            has_more: (params.from + params.size) < (results.total.value || results.total)
          }
        }
      });
    } catch (error) {
      logger.error('Search posts error', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: 'An error occurred while searching posts'
      });
    }
  }
);

/**
 * @route GET /search/autocomplete
 * @desc Autocomplete search suggestions
 */
router.get('/autocomplete',
  autocompleteRateLimit,
  validateRequest(autocompleteSchema, 'query'),
  cacheMiddleware(600), // 10-minute cache for autocomplete
  async (req: Request, res: Response) => {
    try {
      const { query, type, limit } = req.validatedData;
      
      const suggestions = await elasticsearchClient.autocomplete(query, type);
      
      res.json({
        success: true,
        data: {
          suggestions: suggestions.slice(0, limit),
          query,
          type
        }
      });
    } catch (error) {
      logger.error('Autocomplete error', { error, query: req.query });
      res.status(500).json({
        success: false,
        error: 'Autocomplete failed'
      });
    }
  }
);

/**
 * @route POST /search/advanced
 * @desc Advanced search with complex filters and aggregations
 */
router.post('/advanced',
  searchRateLimit,
  validateRequest(advancedSearchSchema),
  cacheMiddleware(300),
  async (req: Request, res: Response) => {
    try {
      const params = req.validatedData;
      
      const searchQuery = buildAdvancedSearchQuery(params);
      const results = await elasticsearchClient.getClient().search({
        index: 'cryb-posts-*',
        body: searchQuery
      });

      await logSearchEvent(req, 'advanced_search', {
        filters_count: Object.keys(params.filters || {}).length,
        aggregations_count: (params.aggregations || []).length,
        results_count: results.hits.total.value || results.hits.total
      });

      res.json({
        success: true,
        data: {
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            ...hit._source,
            highlight: hit.highlight
          })),
          total: results.hits.total,
          aggregations: results.aggregations,
          took: results.took
        }
      });
    } catch (error) {
      logger.error('Advanced search error', { error, body: req.body });
      res.status(500).json({
        success: false,
        error: 'Advanced search failed'
      });
    }
  }
);

/**
 * @route GET /search/trending
 * @desc Get trending searches and content
 */
router.get('/trending',
  cacheMiddleware(900), // 15-minute cache
  async (req: Request, res: Response) => {
    try {
      const trendingQueries = await getTrendingQueries();
      const trendingPosts = await getTrendingPosts();
      const trendingCommunities = await getTrendingCommunities();

      res.json({
        success: true,
        data: {
          queries: trendingQueries,
          posts: trendingPosts,
          communities: trendingCommunities,
          last_updated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Trending search error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get trending data'
      });
    }
  }
);

/**
 * @route POST /search/similar
 * @desc Find similar posts using More Like This query
 */
router.post('/similar/:postId',
  searchRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { size = 10 } = req.body;

      const similarPosts = await findSimilarPosts(postId, size);

      res.json({
        success: true,
        data: {
          similar_posts: similarPosts,
          reference_post_id: postId
        }
      });
    } catch (error) {
      logger.error('Similar posts error', { error, postId: req.params.postId });
      res.status(500).json({
        success: false,
        error: 'Failed to find similar posts'
      });
    }
  }
);

/**
 * @route GET /search/stats
 * @desc Get search statistics and analytics
 */
router.get('/stats',
  async (req: Request, res: Response) => {
    try {
      const stats = await getSearchStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Search stats error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get search statistics'
      });
    }
  }
);

// Helper functions

function buildAdvancedSearchQuery(params: any): any {
  const query: any = {
    query: {
      bool: {
        must: [],
        filter: [],
        must_not: [
          { term: { 'status.removed': true } }
        ]
      }
    },
    from: params.from,
    size: params.size,
    highlight: {
      fields: {
        title: {},
        content: {}
      }
    }
  };

  // Main search query
  if (params.query) {
    query.query.bool.must.push({
      multi_match: {
        query: params.query,
        fields: ['title^3', 'content', 'community.name^2', 'author.username^1.5'],
        type: 'best_fields',
        fuzziness: 'AUTO'
      }
    });
  } else {
    query.query.bool.must.push({ match_all: {} });
  }

  // Apply filters
  if (params.filters) {
    const { filters } = params;

    if (filters.communities?.length) {
      query.query.bool.filter.push({
        terms: { 'community.name.raw': filters.communities }
      });
    }

    if (filters.authors?.length) {
      query.query.bool.filter.push({
        terms: { 'author.username.raw': filters.authors }
      });
    }

    if (filters.tags?.length) {
      query.query.bool.filter.push({
        terms: { tags: filters.tags }
      });
    }

    if (filters.content_types?.length) {
      query.query.bool.filter.push({
        terms: { content_type: filters.content_types }
      });
    }

    if (filters.date_range) {
      const dateFilter: any = { range: { 'timestamps.created_at': {} } };
      if (filters.date_range.start) {
        dateFilter.range['timestamps.created_at'].gte = filters.date_range.start;
      }
      if (filters.date_range.end) {
        dateFilter.range['timestamps.created_at'].lte = filters.date_range.end;
      }
      query.query.bool.filter.push(dateFilter);
    }

    if (filters.score_range) {
      const scoreFilter: any = { range: { 'metrics.score': {} } };
      if (filters.score_range.min !== undefined) {
        scoreFilter.range['metrics.score'].gte = filters.score_range.min;
      }
      if (filters.score_range.max !== undefined) {
        scoreFilter.range['metrics.score'].lte = filters.score_range.max;
      }
      query.query.bool.filter.push(scoreFilter);
    }

    if (filters.engagement_range) {
      const { engagement_range } = filters;
      if (engagement_range.min_comments) {
        query.query.bool.filter.push({
          range: { 'metrics.comments': { gte: engagement_range.min_comments } }
        });
      }
      if (engagement_range.min_upvotes) {
        query.query.bool.filter.push({
          range: { 'metrics.upvotes': { gte: engagement_range.min_upvotes } }
        });
      }
      if (engagement_range.min_views) {
        query.query.bool.filter.push({
          range: { 'metrics.views': { gte: engagement_range.min_views } }
        });
      }
    }
  }

  // Apply sorting
  if (params.sort?.length) {
    query.sort = params.sort.map((s: any) => ({
      [s.field]: { order: s.order }
    }));
  }

  // Add aggregations
  if (params.aggregations?.length) {
    query.aggs = {};
    for (const agg of params.aggregations) {
      switch (agg) {
        case 'communities':
          query.aggs.communities = {
            terms: { field: 'community.name.raw', size: 20 }
          };
          break;
        case 'authors':
          query.aggs.authors = {
            terms: { field: 'author.username.raw', size: 20 }
          };
          break;
        case 'content_types':
          query.aggs.content_types = {
            terms: { field: 'content_type', size: 10 }
          };
          break;
        case 'tags':
          query.aggs.tags = {
            terms: { field: 'tags', size: 50 }
          };
          break;
        case 'score_histogram':
          query.aggs.score_histogram = {
            histogram: { field: 'metrics.score', interval: 10 }
          };
          break;
        case 'date_histogram':
          query.aggs.date_histogram = {
            date_histogram: {
              field: 'timestamps.created_at',
              calendar_interval: 'day'
            }
          };
          break;
      }
    }
  }

  return query;
}

async function findSimilarPosts(postId: string, size: number): Promise<any[]> {
  try {
    const response = await elasticsearchClient.getClient().search({
      index: 'cryb-posts-*',
      body: {
        query: {
          more_like_this: {
            fields: ['title', 'content', 'tags'],
            like: [
              {
                _index: 'cryb-posts-*',
                _id: postId
              }
            ],
            min_term_freq: 1,
            max_query_terms: 12,
            min_doc_freq: 1
          }
        },
        size
      }
    });

    return response.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      ...hit._source
    }));
  } catch (error) {
    logger.error('Find similar posts error', { error, postId });
    return [];
  }
}

async function getTrendingQueries(): Promise<any[]> {
  // Implementation would connect to analytics database
  // This is a placeholder - would integrate with TimescaleDB analytics
  return [
    { query: 'crypto', count: 1250, growth: 15.2 },
    { query: 'ai', count: 980, growth: 22.1 },
    { query: 'programming', count: 875, growth: 8.5 }
  ];
}

async function getTrendingPosts(): Promise<any[]> {
  try {
    const response = await elasticsearchClient.getClient().search({
      index: 'cryb-posts-*',
      body: {
        query: {
          bool: {
            filter: [
              { range: { 'timestamps.created_at': { gte: 'now-24h' } } },
              { term: { 'status.published': true } },
              { term: { 'status.removed': false } }
            ]
          }
        },
        sort: [
          { 'metrics.hot_score': 'desc' }
        ],
        size: 10
      }
    });

    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    logger.error('Get trending posts error', { error });
    return [];
  }
}

async function getTrendingCommunities(): Promise<any[]> {
  try {
    const response = await elasticsearchClient.getClient().search({
      index: 'cryb-communities-*',
      body: {
        sort: [
          { 'stats.active_members': 'desc' }
        ],
        size: 10
      }
    });

    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    logger.error('Get trending communities error', { error });
    return [];
  }
}

async function getSearchStatistics(): Promise<any> {
  try {
    const clusterStats = await elasticsearchClient.getClient().cluster.stats();
    const indexStats = await elasticsearchClient.getClient().indices.stats({
      index: 'cryb-*'
    });

    return {
      cluster: {
        status: clusterStats.status,
        nodes: clusterStats.nodes.count,
        indices: clusterStats.indices.count
      },
      indices: Object.keys(indexStats.indices).map(indexName => ({
        name: indexName,
        documents: indexStats.indices[indexName].total.docs.count,
        size: indexStats.indices[indexName].total.store.size_in_bytes
      })),
      performance: {
        search_time: indexStats._all.total.search.time_in_millis,
        search_count: indexStats._all.total.search.query_total,
        indexing_time: indexStats._all.total.indexing.time_in_millis
      }
    };
  } catch (error) {
    logger.error('Get search statistics error', { error });
    throw error;
  }
}

async function logSearchEvent(req: Request, eventType: string, data: any): Promise<void> {
  try {
    // This would integrate with your analytics pipeline
    logger.info('Search event', {
      event_type: eventType,
      user_id: req.user?.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      data
    });
  } catch (error) {
    logger.error('Log search event error', { error });
  }
}

export default router;