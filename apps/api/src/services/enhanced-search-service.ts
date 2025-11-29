import { ElasticsearchService } from "./elasticsearch";
import { logger } from "../utils/logger";
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

export interface SearchFilters {
  type?: 'all' | 'users' | 'servers' | 'communities' | 'posts' | 'messages';
  sortBy?: 'relevance' | 'date' | 'popularity';
  timeRange?: 'all' | 'day' | 'week' | 'month' | 'year';
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  serverId?: string;
  communityId?: string;
  verified?: boolean;
  hasAttachments?: boolean;
  minScore?: number;
  tags?: string[];
  category?: string;
  nsfw?: boolean;
  language?: string;
  contentLength?: { min?: number; max?: number };
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  fuzzy?: boolean;
  highlight?: boolean;
  includeAggregations?: boolean;
  includeRelated?: boolean;
  personalizeForUser?: string;
  trackAnalytics?: boolean;
  cacheResults?: boolean;
  semanticSearch?: boolean;
  explainRelevance?: boolean;
}

export interface EnhancedSearchResult {
  id: string;
  type: 'post' | 'user' | 'community' | 'server' | 'message';
  title: string;
  content?: string;
  excerpt?: string;
  url?: string;
  thumbnail?: string;
  author?: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    verified?: boolean;
    reputation?: number;
  };
  community?: {
    id: string;
    name: string;
    displayName?: string;
    memberCount?: number;
    category?: string;
  };
  server?: {
    id: string;
    name: string;
    memberCount?: number;
    isPublic?: boolean;
  };
  metrics?: {
    score?: number;
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    engagement?: number;
  };
  relevanceScore: number;
  personalizedScore?: number;
  trendingScore?: number;
  qualityScore?: number;
  freshnessScore?: number;
  highlights?: Record<string, string[]>;
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: EnhancedSearchResult[];
    total: number;
    took: number;
    page: number;
    limit: number;
    hasMore: boolean;
    aggregations?: {
      categories?: Array<{ key: string; count: number }>;
      tags?: Array<{ key: string; count: number }>;
      timeRange?: Array<{ key: string; count: number }>;
      authors?: Array<{ key: string; count: number }>;
      communities?: Array<{ key: string; count: number }>;
    };
    relatedQueries?: string[];
    suggestions?: string[];
    didYouMean?: string;
    trends?: Array<{ term: string; growth: number }>;
    personalizedRecommendations?: EnhancedSearchResult[];
  };
  query: string;
  filters: SearchFilters;
  searchMeta: {
    searchId: string;
    searchEngine: string;
    searchTime: string;
    cached: boolean;
    personalized: boolean;
    fallbackUsed: boolean;
    qualityGate: boolean;
    suggestions?: string[];
  };
}

export class EnhancedSearchService {
  private elasticsearch: ElasticsearchService | null;
  private redis: Redis;
  private prisma: PrismaClient;
  private searchCache = new Map<string, { result: any; timestamp: number }>();
  private popularQueries = new Map<string, number>();
  private userSearchProfiles = new Map<string, any>();
  private cacheTimeout = 300000; // 5 minutes
  private popularityWindow = 86400000; // 24 hours
  private qualityThreshold = 0.3;

  constructor(elasticsearch: ElasticsearchService | null, redis: Redis, prisma: PrismaClient) {
    this.elasticsearch = elasticsearch;
    this.redis = redis;
    this.prisma = prisma;

    // Initialize background tasks
    this.initializeBackgroundTasks();
  }

  /**
   * Main search method with enhanced relevance and personalization
   */
  async search(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();
    const cacheKey = this.generateCacheKey(query, filters, options);

    // Input validation and sanitization
    if (!query || query.trim().length < 1) {
      return this.getEmptyResponse(query, filters, searchId, startTime);
    }

    query = this.sanitizeQuery(query);

    try {
      // Check cache first
      if (options.cacheResults !== false) {
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          return this.formatCachedResponse(cached, query, filters, searchId, startTime);
        }
      }

      // Prepare search options
      const searchOptions = this.prepareSearchOptions(options, filters);
      
      // Execute search with fallback strategy
      let searchResult;
      let searchEngine = 'elasticsearch';
      let fallbackUsed = false;

      if (this.elasticsearch && await this.elasticsearch.ping()) {
        searchResult = await this.executeElasticsearchSearch(query, filters, searchOptions);
      } else {
        searchResult = await this.executeFallbackSearch(query, filters, searchOptions);
        searchEngine = 'postgresql_fts';
        fallbackUsed = true;
      }

      // Apply post-processing enhancements
      const enhancedResults = await this.enhanceSearchResults(
        searchResult.results,
        query,
        filters,
        options
      );

      // Get additional data
      const [suggestions, relatedQueries, trends] = await Promise.all([
        this.getSuggestions(query, 10),
        this.getRelatedQueries(query, options.personalizeForUser),
        this.getTrends(query)
      ]);

      // Get personalized recommendations if user provided
      let personalizedRecommendations = [];
      if (options.personalizeForUser && enhancedResults.length > 0) {
        personalizedRecommendations = await this.getPersonalizedRecommendations(
          options.personalizeForUser,
          query,
          enhancedResults.slice(0, 3)
        );
      }

      const response: SearchResponse = {
        success: true,
        data: {
          results: enhancedResults,
          total: searchResult.total,
          took: Date.now() - startTime,
          page: searchOptions.page,
          limit: searchOptions.limit,
          hasMore: searchResult.total > searchOptions.page * searchOptions.limit,
          aggregations: searchResult.aggregations,
          relatedQueries,
          suggestions,
          didYouMean: await this.getDidYouMean(query),
          trends,
          personalizedRecommendations
        },
        query,
        filters,
        searchMeta: {
          searchId,
          searchEngine,
          searchTime: `${Date.now() - startTime}ms`,
          cached: false,
          personalized: !!options.personalizeForUser,
          fallbackUsed,
          qualityGate: enhancedResults.length > 0,
          suggestions
        }
      };

      // Cache results
      if (options.cacheResults !== false) {
        await this.cacheResult(cacheKey, response);
      }

      // Track analytics
      if (options.trackAnalytics !== false) {
        await this.trackSearchAnalytics({
          searchId,
          query,
          userId: options.personalizeForUser,
          filters,
          resultCount: enhancedResults.length,
          responseTime: Date.now() - startTime,
          searchEngine,
          fallbackUsed
        });
      }

      return response;

    } catch (error) {
      logger.error('Enhanced search failed:', error);
      return this.getErrorResponse(query, filters, searchId, startTime, error);
    }
  }

  /**
   * Fast autocomplete search with intelligent suggestions
   */
  async autocomplete(
    query: string,
    options: { limit?: number; userId?: string; includePopular?: boolean } = {}
  ): Promise<string[]> {
    const { limit = 10, userId, includePopular = true } = options;

    if (!query || query.trim().length < 2) {
      return includePopular ? await this.getPopularQueries(limit) : [];
    }

    const sanitizedQuery = this.sanitizeQuery(query);

    try {
      const suggestions = new Set<string>();

      // Get Elasticsearch suggestions if available
      if (this.elasticsearch && await this.elasticsearch.ping()) {
        const elasticSuggestions = await this.elasticsearch.getSuggestions(sanitizedQuery, limit);
        elasticSuggestions.forEach(s => suggestions.add(s));
      }

      // Add database-based suggestions
      const dbSuggestions = await this.getDatabaseSuggestions(sanitizedQuery, Math.max(limit - suggestions.size, 5));
      dbSuggestions.forEach(s => suggestions.add(s));

      // Add personalized suggestions if user provided
      if (userId) {
        const personalSuggestions = await this.getPersonalizedSuggestions(userId, sanitizedQuery, 3);
        personalSuggestions.forEach(s => suggestions.add(s));
      }

      // Add popular queries if still need more
      if (suggestions.size < limit && includePopular) {
        const popular = await this.getPopularQueries(limit - suggestions.size);
        popular.forEach(s => suggestions.add(s));
      }

      return Array.from(suggestions).slice(0, limit);

    } catch (error) {
      logger.error('Autocomplete failed:', error);
      return includePopular ? await this.getPopularQueries(limit) : [];
    }
  }

  /**
   * Get trending topics with smart categorization
   */
  async getTrending(
    options: {
      limit?: number;
      timeframe?: '1h' | '6h' | '1d' | '3d' | '7d';
      category?: string;
      minGrowth?: number;
    } = {}
  ): Promise<Array<{ term: string; count: number; growth: number; category?: string }>> {
    const { limit = 20, timeframe = '1d', category, minGrowth = 10 } = options;

    try {
      // Get from cache first
      const cacheKey = `trending:${timeframe}:${category || 'all'}:${limit}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const trends = await this.calculateTrendingTopics(timeframe, category, minGrowth);
      const result = trends.slice(0, limit);

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Get trending failed:', error);
      return [];
    }
  }

  /**
   * Get personalized user recommendations
   */
  async getUserRecommendations(
    userId: string,
    options: { limit?: number; categories?: string[]; excludeViewed?: boolean } = {}
  ): Promise<EnhancedSearchResult[]> {
    const { limit = 10, categories, excludeViewed = true } = options;

    try {
      // Get user profile and preferences
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        return this.getDefaultRecommendations(limit);
      }

      // Build recommendation query based on user preferences
      const recommendationQuery = this.buildRecommendationQuery(userProfile, categories, excludeViewed);
      
      // Execute recommendation search
      const results = await this.executeRecommendationSearch(recommendationQuery, limit);
      
      // Enhance with personalization scores
      return this.enhanceWithPersonalizationScores(results, userProfile);

    } catch (error) {
      logger.error('Get user recommendations failed:', error);
      return this.getDefaultRecommendations(limit);
    }
  }

  /**
   * Community discovery with improved algorithms
   */
  async discoverCommunities(
    userId?: string,
    options: {
      limit?: number;
      category?: string;
      minMembers?: number;
      sortBy?: 'relevance' | 'members' | 'activity' | 'new';
      includeJoined?: boolean;
    } = {}
  ): Promise<Array<{
    id: string;
    name: string;
    displayName: string;
    description: string;
    memberCount: number;
    category: string;
    activityScore: number;
    relevanceScore: number;
    isJoined?: boolean;
    recommendationReason?: string;
  }>> {
    const { limit = 20, category, minMembers = 10, sortBy = 'relevance', includeJoined = false } = options;

    try {
      let communities;

      if (this.elasticsearch && await this.elasticsearch.ping()) {
        communities = await this.discoverCommunitiesElastic(userId, options);
      } else {
        communities = await this.discoverCommunitiesDatabase(userId, options);
      }

      // Apply community scoring algorithm
      return this.scoreAndRankCommunities(communities, userId, sortBy).slice(0, limit);

    } catch (error) {
      logger.error('Discover communities failed:', error);
      return [];
    }
  }

  // Private methods

  private initializeBackgroundTasks(): void {
    // Update popular queries every 10 minutes
    setInterval(async () => {
      await this.updatePopularQueries();
    }, 600000);

    // Clean old cache entries every hour
    setInterval(() => {
      this.cleanupCache();
    }, 3600000);
  }

  private sanitizeQuery(query: string): string {
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS
      .replace(/^\s*["']|["']\s*$/g, '') // Remove surrounding quotes
      .substring(0, 500); // Limit length
  }

  private prepareSearchOptions(options: SearchOptions, filters: SearchFilters): any {
    return {
      page: Math.max(1, options.page || 1),
      limit: Math.min(100, Math.max(1, options.limit || 20)),
      fuzzy: options.fuzzy !== false,
      highlight: options.highlight !== false,
      includeAggregations: options.includeAggregations !== false,
      sortBy: filters.sortBy || 'relevance',
      minScore: filters.minScore || this.qualityThreshold
    };
  }

  private async executeElasticsearchSearch(
    query: string, 
    filters: SearchFilters, 
    options: any
  ): Promise<any> {
    if (!this.elasticsearch) {
      throw new Error('Elasticsearch not available');
    }

    // Build comprehensive search query
    const searchQuery = this.buildElasticsearchQuery(query, filters, options);
    
    // Execute search across relevant indices
    const indices = this.getSearchIndices(filters.type);
    
    return await this.elasticsearch.globalSearch(query, filters, {
      page: options.page,
      size: options.limit,
      fuzzy: options.fuzzy,
      sortBy: this.mapSortByToElastic(options.sortBy),
      sortOrder: 'desc',
      highlight: options.highlight,
      aggregations: options.includeAggregations,
      minScore: options.minScore
    });
  }

  private async executeFallbackSearch(
    query: string,
    filters: SearchFilters,
    options: any
  ): Promise<any> {
    const searchQuery = query.trim().split(/\s+/).join(' | ');
    const likeQuery = `%${query.toLowerCase()}%`;
    const offset = (options.page - 1) * options.limit;

    // Execute PostgreSQL full-text search
    const results = await this.searchWithPostgreSQL(searchQuery, likeQuery, filters, offset, options.limit);
    
    return {
      results: results.map(item => this.formatDatabaseResult(item)),
      total: results.length,
      aggregations: null
    };
  }

  private async enhanceSearchResults(
    results: any[],
    query: string,
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<EnhancedSearchResult[]> {
    return Promise.all(results.map(async (result) => {
      // Calculate enhanced scores
      const relevanceScore = this.calculateRelevanceScore(result, query);
      const qualityScore = this.calculateQualityScore(result);
      const freshnessScore = this.calculateFreshnessScore(result);
      const trendingScore = await this.calculateTrendingScore(result, query);
      
      let personalizedScore;
      if (options.personalizeForUser) {
        personalizedScore = await this.calculatePersonalizedScore(result, options.personalizeForUser);
      }

      return {
        id: result.id || result._id,
        type: this.inferResultType(result),
        title: result.title || result.name || result.displayName,
        content: result.content || result.description,
        excerpt: this.generateExcerpt(result, query),
        url: this.generateResultUrl(result),
        thumbnail: result.thumbnail || result.icon || result.avatar,
        author: this.extractAuthorInfo(result),
        community: this.extractCommunityInfo(result),
        server: this.extractServerInfo(result),
        metrics: this.extractMetrics(result),
        relevanceScore,
        personalizedScore,
        trendingScore,
        qualityScore,
        freshnessScore,
        highlights: result.highlight || result.highlights,
        tags: result.tags || [],
        category: result.category,
        createdAt: result.createdAt || result.timestamp,
        updatedAt: result.updatedAt || result.editedAt,
        metadata: this.extractMetadata(result)
      };
    }));
  }

  private calculateRelevanceScore(result: any, query: string): number {
    let score = result._score || result.score || 0;
    
    // Boost exact matches
    const queryLower = query.toLowerCase();
    const titleLower = (result.title || '').toLowerCase();
    const contentLower = (result.content || '').toLowerCase();
    
    if (titleLower.includes(queryLower)) {
      score *= 1.5;
    }
    
    if (contentLower.includes(queryLower)) {
      score *= 1.2;
    }

    // Normalize to 0-1 scale
    return Math.min(1, Math.max(0, score / 100));
  }

  private calculateQualityScore(result: any): number {
    let score = 0.5; // Base score

    // Factor in engagement metrics
    if (result.upvotes || result.likes) {
      score += Math.min(0.3, (result.upvotes || result.likes) / 1000);
    }

    if (result.commentCount || result.comments) {
      score += Math.min(0.2, (result.commentCount || result.comments) / 100);
    }

    // Factor in author reputation
    if (result.user?.reputation || result.author?.reputation) {
      const reputation = result.user?.reputation || result.author?.reputation;
      score += Math.min(0.2, reputation / 10000);
    }

    // Factor in verification status
    if (result.user?.isVerified || result.author?.verified) {
      score += 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateFreshnessScore(result: any): number {
    const now = Date.now();
    const created = new Date(result.createdAt || result.timestamp || now);
    const age = now - created.getTime();
    
    // Fresh content (< 1 day) gets full score
    if (age < 86400000) return 1;
    
    // Decay over time
    const days = age / 86400000;
    return Math.max(0.1, Math.exp(-days / 30));
  }

  private async calculateTrendingScore(result: any, query: string): Promise<number> {
    try {
      // Check if content matches trending topics
      const trending = await this.getTrends(query);
      const resultText = `${result.title || ''} ${result.content || ''}`.toLowerCase();
      
      let trendingScore = 0;
      for (const trend of trending) {
        if (resultText.includes(trend.term.toLowerCase())) {
          trendingScore += trend.growth / 100;
        }
      }
      
      return Math.min(1, trendingScore);
    } catch (error) {
      return 0;
    }
  }

  private async calculatePersonalizedScore(result: any, userId: string): Promise<number> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return 0.5;

      let score = 0.5;

      // Match user interests
      const userInterests = userProfile.interests || [];
      const resultCategories = [result.category, ...(result.tags || [])];
      
      const interestMatch = userInterests.some((interest: string) => 
        resultCategories.some(cat => cat?.toLowerCase().includes(interest.toLowerCase()))
      );
      
      if (interestMatch) {
        score += 0.3;
      }

      // Match search history patterns
      if (userProfile.searchHistory) {
        const historyTerms = userProfile.searchHistory.join(' ').toLowerCase();
        const resultText = `${result.title || ''} ${result.content || ''}`.toLowerCase();
        
        if (this.textSimilarity(historyTerms, resultText) > 0.3) {
          score += 0.2;
        }
      }

      return Math.min(1, Math.max(0, score));
    } catch (error) {
      return 0.5;
    }
  }

  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private inferResultType(result: any): 'post' | 'user' | 'community' | 'server' | 'message' {
    if (result.username || result.displayName) return 'user';
    if (result.memberCount !== undefined) return 'community';
    if (result.serverId || result.server) return 'message';
    if (result.channelId || result.channel) return 'message';
    return 'post';
  }

  private generateExcerpt(result: any, query: string, maxLength: number = 200): string {
    const content = result.content || result.description || '';
    if (!content) return '';

    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    const excerpt = content.substring(start, end);

    return (start > 0 ? '...' : '') + excerpt + (end < content.length ? '...' : '');
  }

  private generateResultUrl(result: any): string {
    switch (this.inferResultType(result)) {
      case 'user':
        return `/u/${result.username}`;
      case 'community':
        return `/r/${result.name}`;
      case 'post':
        return `/r/${result.community?.name}/post/${result.id}`;
      case 'message':
        return `/server/${result.serverId || result.server?.id}/channel/${result.channelId || result.channel?.id}`;
      default:
        return '#';
    }
  }

  private extractAuthorInfo(result: any): any {
    const user = result.user || result.author;
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      verified: user.isVerified || user.verified,
      reputation: user.reputation
    };
  }

  private extractCommunityInfo(result: any): any {
    const community = result.community;
    if (!community) return null;

    return {
      id: community.id,
      name: community.name,
      displayName: community.displayName,
      memberCount: community.memberCount || community._count?.members,
      category: community.category
    };
  }

  private extractServerInfo(result: any): any {
    const server = result.server;
    if (!server) return null;

    return {
      id: server.id,
      name: server.name,
      memberCount: server.memberCount || server._count?.members,
      isPublic: server.isPublic
    };
  }

  private extractMetrics(result: any): any {
    return {
      score: result.score || (result.upvotes || 0) - (result.downvotes || 0),
      views: result.viewCount || result.views,
      likes: result.upvotes || result.likes,
      comments: result.commentCount || result._count?.comments,
      shares: result.shareCount || result.shares,
      engagement: this.calculateEngagementScore(result)
    };
  }

  private calculateEngagementScore(result: any): number {
    const views = result.viewCount || result.views || 1;
    const likes = result.upvotes || result.likes || 0;
    const comments = result.commentCount || result._count?.comments || 0;
    const shares = result.shareCount || result.shares || 0;

    return ((likes * 2 + comments * 3 + shares * 5) / views) * 100;
  }

  private extractMetadata(result: any): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (result.nsfw) metadata.nsfw = true;
    if (result.isPinned) metadata.pinned = true;
    if (result.isLocked) metadata.locked = true;
    if (result.flair) metadata.flair = result.flair;
    if (result.language) metadata.language = result.language;

    return metadata;
  }

  private async getSuggestions(query: string, limit: number): Promise<string[]> {
    try {
      if (this.elasticsearch && await this.elasticsearch.ping()) {
        return await this.elasticsearch.getSuggestions(query, limit);
      }
      
      return await this.getDatabaseSuggestions(query, limit);
    } catch (error) {
      logger.error('Get suggestions failed:', error);
      return [];
    }
  }

  private async getDatabaseSuggestions(query: string, limit: number): Promise<string[]> {
    const likeQuery = `%${query.toLowerCase()}%`;
    
    try {
      const suggestions = await this.prisma.$queryRaw`
        (SELECT DISTINCT title as suggestion FROM "Post" 
         WHERE LOWER(title) LIKE ${likeQuery} AND "isRemoved" = false
         ORDER BY "viewCount" DESC NULLS LAST LIMIT ${Math.ceil(limit / 3)})
        UNION ALL
        (SELECT DISTINCT name as suggestion FROM "Community"
         WHERE LOWER(name) LIKE ${likeQuery} AND "isPublic" = true
         ORDER BY "memberCount" DESC NULLS LAST LIMIT ${Math.ceil(limit / 3)})
        UNION ALL
        (SELECT DISTINCT username as suggestion FROM "User"
         WHERE LOWER(username) LIKE ${likeQuery} AND "bannedAt" IS NULL
         ORDER BY "createdAt" DESC LIMIT ${Math.ceil(limit / 3)})
        LIMIT ${limit}
      ` as Array<{ suggestion: string }>;

      return suggestions.map(s => s.suggestion);
    } catch (error) {
      logger.error('Database suggestions failed:', error);
      return [];
    }
  }

  private async getRelatedQueries(query: string, userId?: string): Promise<string[]> {
    try {
      const cacheKey = `related:${query}:${userId || 'anonymous'}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const related = await this.calculateRelatedQueries(query, userId);
      
      // Cache for 1 hour
      await this.redis.setex(cacheKey, 3600, JSON.stringify(related));
      
      return related;
    } catch (error) {
      logger.error('Get related queries failed:', error);
      return [];
    }
  }

  private async calculateRelatedQueries(query: string, userId?: string): Promise<string[]> {
    const related = new Set<string>();
    
    // Add variations of the query
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 1) {
      // Add partial queries
      for (let i = 0; i < words.length; i++) {
        related.add(words.slice(0, i + 1).join(' '));
        related.add(words.slice(i).join(' '));
      }
    }

    // Add user-specific related queries
    if (userId) {
      const userProfile = await this.getUserProfile(userId);
      if (userProfile?.searchHistory) {
        userProfile.searchHistory
          .filter((q: string) => q !== query && this.textSimilarity(q.toLowerCase(), query.toLowerCase()) > 0.3)
          .slice(0, 3)
          .forEach((q: string) => related.add(q));
      }
    }

    return Array.from(related).slice(0, 10);
  }

  private async getTrends(query: string): Promise<Array<{ term: string; growth: number }>> {
    try {
      return await this.getTrending({ limit: 5 });
    } catch (error) {
      return [];
    }
  }

  private async getDidYouMean(query: string): Promise<string | undefined> {
    // Simple spell checking logic - in production, use a proper spell checker
    if (query.length < 4) return undefined;
    
    try {
      const similar = await this.findSimilarQueries(query);
      return similar.length > 0 ? similar[0] : undefined;
    } catch (error) {
      return undefined;
    }
  }

  private async findSimilarQueries(query: string): Promise<string[]> {
    // This would implement edit distance or phonetic matching
    // For now, return empty array
    return [];
  }

  private async getUserProfile(userId: string): Promise<any> {
    try {
      if (this.userSearchProfiles.has(userId)) {
        return this.userSearchProfiles.get(userId);
      }

      const cacheKey = `user_profile:${userId}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const profile = JSON.parse(cached);
        this.userSearchProfiles.set(userId, profile);
        return profile;
      }

      // Build profile from user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          posts: { take: 10, orderBy: { createdAt: 'desc' } },
          communities: { take: 10 },
          _count: {
            select: {
              posts: true,
              comments: true,
              communities: true
            }
          }
        }
      });

      if (!user) return null;

      const profile = {
        id: userId,
        interests: this.extractUserInterests(user),
        searchHistory: [], // Would be populated from search analytics
        preferredCategories: this.extractPreferredCategories(user),
        activityLevel: this.calculateActivityLevel(user),
        reputation: user.karma || 0
      };

      this.userSearchProfiles.set(userId, profile);
      await this.redis.setex(cacheKey, 3600, JSON.stringify(profile));

      return profile;
    } catch (error) {
      logger.error('Get user profile failed:', error);
      return null;
    }
  }

  private extractUserInterests(user: any): string[] {
    const interests = new Set<string>();
    
    // Extract from post titles and content
    if (user.posts) {
      user.posts.forEach((post: any) => {
        if (post.tags) {
          post.tags.forEach((tag: string) => interests.add(tag));
        }
      });
    }

    // Extract from communities
    if (user.communities) {
      user.communities.forEach((community: any) => {
        if (community.category) {
          interests.add(community.category);
        }
      });
    }

    return Array.from(interests).slice(0, 10);
  }

  private extractPreferredCategories(user: any): string[] {
    const categories = new Map<string, number>();
    
    if (user.communities) {
      user.communities.forEach((community: any) => {
        if (community.category) {
          const count = categories.get(community.category) || 0;
          categories.set(community.category, count + 1);
        }
      });
    }

    return Array.from(categories.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
  }

  private calculateActivityLevel(user: any): 'low' | 'medium' | 'high' {
    const totalActivity = (user._count?.posts || 0) + (user._count?.comments || 0);
    if (totalActivity > 100) return 'high';
    if (totalActivity > 20) return 'medium';
    return 'low';
  }

  private async getPersonalizedRecommendations(
    userId: string,
    query: string,
    results: EnhancedSearchResult[]
  ): Promise<EnhancedSearchResult[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return [];

      // Build recommendation query based on user interests and search context
      const recommendationQuery = this.buildPersonalizationQuery(userProfile, query, results);
      
      // Execute search for recommendations
      const recommendations = await this.executePersonalizedSearch(recommendationQuery, userId, 5);
      
      return recommendations;
    } catch (error) {
      logger.error('Get personalized recommendations failed:', error);
      return [];
    }
  }

  private buildPersonalizationQuery(userProfile: any, query: string, results: EnhancedSearchResult[]): string {
    const interests = userProfile.interests || [];
    const categories = userProfile.preferredCategories || [];
    
    // Combine user interests with query context
    const queryTerms = [query, ...interests.slice(0, 3), ...categories.slice(0, 2)];
    
    return queryTerms.join(' ');
  }

  private async executePersonalizedSearch(
    query: string,
    userId: string,
    limit: number
  ): Promise<EnhancedSearchResult[]> {
    const results = await this.search(query, {}, { 
      limit, 
      personalizeForUser: userId,
      cacheResults: false 
    });
    
    return results.data.results;
  }

  private async trackSearchAnalytics(analytics: {
    searchId: string;
    query: string;
    userId?: string;
    filters: SearchFilters;
    resultCount: number;
    responseTime: number;
    searchEngine: string;
    fallbackUsed: boolean;
  }): Promise<void> {
    try {
      // Store in Redis for real-time analytics
      await this.redis.lpush('search_analytics', JSON.stringify({
        ...analytics,
        timestamp: new Date().toISOString()
      }));

      // Keep only last 10000 entries
      await this.redis.ltrim('search_analytics', 0, 9999);

      // Update popular queries
      const currentCount = this.popularQueries.get(analytics.query) || 0;
      this.popularQueries.set(analytics.query, currentCount + 1);

    } catch (error) {
      logger.error('Track search analytics failed:', error);
    }
  }

  private async getCachedResult(cacheKey: string): Promise<any> {
    const cached = this.searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }

    const redisCached = await this.redis.get(cacheKey);
    if (redisCached) {
      const result = JSON.parse(redisCached);
      this.searchCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    return null;
  }

  private async cacheResult(cacheKey: string, result: SearchResponse): Promise<void> {
    this.searchCache.set(cacheKey, { result, timestamp: Date.now() });
    await this.redis.setex(cacheKey, Math.floor(this.cacheTimeout / 1000), JSON.stringify(result));
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(query: string, filters: SearchFilters, options: SearchOptions): string {
    return `search:${Buffer.from(`${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`).toString('base64')}`;
  }

  private getEmptyResponse(query: string, filters: SearchFilters, searchId: string, startTime: number): SearchResponse {
    return {
      success: true,
      data: {
        results: [],
        total: 0,
        took: Date.now() - startTime,
        page: 1,
        limit: 20,
        hasMore: false,
        suggestions: [],
        relatedQueries: []
      },
      query,
      filters,
      searchMeta: {
        searchId,
        searchEngine: 'none',
        searchTime: `${Date.now() - startTime}ms`,
        cached: false,
        personalized: false,
        fallbackUsed: false,
        qualityGate: false
      }
    };
  }

  private formatCachedResponse(cached: any, query: string, filters: SearchFilters, searchId: string, startTime: number): SearchResponse {
    return {
      ...cached,
      searchMeta: {
        ...cached.searchMeta,
        searchId,
        searchTime: `${Date.now() - startTime}ms`,
        cached: true
      }
    };
  }

  private getErrorResponse(query: string, filters: SearchFilters, searchId: string, startTime: number, error: any): SearchResponse {
    return {
      success: false,
      data: {
        results: [],
        total: 0,
        took: Date.now() - startTime,
        page: 1,
        limit: 20,
        hasMore: false,
        suggestions: []
      },
      query,
      filters,
      searchMeta: {
        searchId,
        searchEngine: 'error',
        searchTime: `${Date.now() - startTime}ms`,
        cached: false,
        personalized: false,
        fallbackUsed: true,
        qualityGate: false,
        error: error.message
      }
    };
  }

  // Additional helper methods would go here...
  private buildElasticsearchQuery(query: string, filters: SearchFilters, options: any): any {
    // Implementation for building Elasticsearch query
    return {};
  }

  private getSearchIndices(type?: string): string[] {
    switch (type) {
      case 'users': return ['users'];
      case 'communities': return ['communities'];
      case 'posts': return ['posts'];
      case 'messages': return ['messages'];
      default: return ['posts', 'users', 'communities', 'messages'];
    }
  }

  private mapSortByToElastic(sortBy: string): string {
    switch (sortBy) {
      case 'date': return 'createdAt';
      case 'popularity': return 'popularity_score';
      default: return '_score';
    }
  }

  private async searchWithPostgreSQL(
    searchQuery: string, 
    likeQuery: string, 
    filters: SearchFilters, 
    offset: number, 
    limit: number
  ): Promise<any[]> {
    // Implementation for PostgreSQL search
    return [];
  }

  private formatDatabaseResult(item: any): any {
    return {
      id: item.id,
      title: item.title || item.name,
      content: item.content || item.description,
      score: 1,
      createdAt: item.createdAt,
      ...item
    };
  }

  private async updatePopularQueries(): Promise<void> {
    // Implementation to update popular queries from analytics
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }

  private async getPopularQueries(limit: number): Promise<string[]> {
    return Array.from(this.popularQueries.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query);
  }

  private async calculateTrendingTopics(timeframe: string, category?: string, minGrowth?: number): Promise<any[]> {
    // Implementation for calculating trending topics
    return [];
  }

  private async getPersonalizedSuggestions(userId: string, query: string, limit: number): Promise<string[]> {
    // Implementation for personalized suggestions
    return [];
  }

  private async getDefaultRecommendations(limit: number): Promise<EnhancedSearchResult[]> {
    // Implementation for default recommendations
    return [];
  }

  private buildRecommendationQuery(userProfile: any, categories?: string[], excludeViewed?: boolean): any {
    // Implementation for building recommendation query
    return {};
  }

  private async executeRecommendationSearch(query: any, limit: number): Promise<EnhancedSearchResult[]> {
    // Implementation for executing recommendation search
    return [];
  }

  private enhanceWithPersonalizationScores(results: EnhancedSearchResult[], userProfile: any): EnhancedSearchResult[] {
    // Implementation for enhancing with personalization scores
    return results;
  }

  private async discoverCommunitiesElastic(userId?: string, options?: any): Promise<any[]> {
    // Implementation for Elasticsearch community discovery
    return [];
  }

  private async discoverCommunitiesDatabase(userId?: string, options?: any): Promise<any[]> {
    // Implementation for database community discovery
    return [];
  }

  private scoreAndRankCommunities(communities: any[], userId?: string, sortBy?: string): any[] {
    // Implementation for scoring and ranking communities
    return communities;
  }
}