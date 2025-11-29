import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

export interface QueryOptimizationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    queryPattern?: RegExp;
    responseTimeThreshold?: number;
    resultCountThreshold?: number;
    errorRateThreshold?: number;
    searchType?: string[];
  };
  optimization: {
    type: 'boost' | 'filter' | 'rewrite' | 'fallback' | 'cache';
    parameters: Record<string, any>;
  };
  priority: number;
  active: boolean;
  performance: {
    applicationsCount: number;
    avgImprovementMs: number;
    successRate: number;
  };
}

export interface SearchOptimizationMetrics {
  totalOptimizations: number;
  successfulOptimizations: number;
  avgPerformanceImprovement: number;
  topOptimizations: QueryOptimizationRule[];
  queryPatterns: Array<{
    pattern: string;
    count: number;
    avgImprovement: number;
  }>;
  recommendations: Array<{
    type: 'index' | 'query' | 'mapping' | 'cache' | 'infrastructure';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImpact: string;
    implementation: string;
  }>;
}

export class SearchOptimizationService {
  private esClient: Client;
  private redis: Redis;
  private optimizationRules: QueryOptimizationRule[] = [];
  private performanceBaseline = new Map<string, number>();
  private queryCache = new Map<string, any>();
  private learningMode = true;

  constructor(esClient: Client, redis: Redis) {
    this.esClient = esClient;
    this.redis = redis;
    
    this.initializeDefaultRules();
    this.startPerformanceMonitoring();
  }

  /**
   * Initialize default optimization rules
   */
  private initializeDefaultRules(): void {
    this.optimizationRules = [
      {
        id: 'slow-fuzzy-search',
        name: 'Optimize Slow Fuzzy Searches',
        description: 'Reduce fuzziness for slow fuzzy searches to improve performance',
        conditions: {
          responseTimeThreshold: 1000,
          queryPattern: /.*\w+.*/
        },
        optimization: {
          type: 'rewrite',
          parameters: {
            reduceFuzziness: true,
            fallbackToExact: true
          }
        },
        priority: 8,
        active: true,
        performance: {
          applicationsCount: 0,
          avgImprovementMs: 0,
          successRate: 0
        }
      },
      {
        id: 'popular-query-cache',
        name: 'Cache Popular Queries',
        description: 'Cache results for frequently searched queries',
        conditions: {
          queryPattern: /^.{3,50}$/,
        },
        optimization: {
          type: 'cache',
          parameters: {
            ttl: 300, // 5 minutes
            minSearchCount: 10
          }
        },
        priority: 9,
        active: true,
        performance: {
          applicationsCount: 0,
          avgImprovementMs: 0,
          successRate: 0
        }
      },
      {
        id: 'zero-results-expansion',
        name: 'Query Expansion for Zero Results',
        description: 'Expand queries that return zero results with synonyms and related terms',
        conditions: {
          resultCountThreshold: 0
        },
        optimization: {
          type: 'rewrite',
          parameters: {
            expandWithSynonyms: true,
            reducePrecision: true,
            enableFuzzy: true
          }
        },
        priority: 7,
        active: true,
        performance: {
          applicationsCount: 0,
          avgImprovementMs: 0,
          successRate: 0
        }
      },
      {
        id: 'boost-popular-content',
        name: 'Boost Popular Content',
        description: 'Boost scoring for content with high engagement',
        conditions: {
          queryPattern: /^(?!@|#).{2,}$/  // Not username or hashtag searches
        },
        optimization: {
          type: 'boost',
          parameters: {
            scoreBoost: 1.5,
            viewCountBoost: 1.2,
            recentBoost: 1.3
          }
        },
        priority: 6,
        active: true,
        performance: {
          applicationsCount: 0,
          avgImprovementMs: 0,
          successRate: 0
        }
      },
      {
        id: 'simple-query-optimization',
        name: 'Optimize Simple Queries',
        description: 'Use faster search methods for simple queries',
        conditions: {
          queryPattern: /^[a-zA-Z0-9\s]{1,20}$/
        },
        optimization: {
          type: 'fallback',
          parameters: {
            usePostgreSQL: true,
            skipComplexAnalysis: true
          }
        },
        priority: 5,
        active: true,
        performance: {
          applicationsCount: 0,
          avgImprovementMs: 0,
          successRate: 0
        }
      },
      {
        id: 'user-search-exact-match',
        name: 'Exact Match for User Searches',
        description: 'Prioritize exact username matches in user searches',
        conditions: {
          queryPattern: /^@?\w+$/,
          searchType: ['users']
        },
        optimization: {
          type: 'boost',
          parameters: {
            exactMatchBoost: 3.0,
            usernameBoost: 2.0
          }
        },
        priority: 9,
        active: true,
        performance: {
          applicationsCount: 0,
          avgImprovementMs: 0,
          successRate: 0
        }
      },
      {
        id: 'long-query-optimization',
        name: 'Optimize Long Queries',
        description: 'Break down and optimize very long search queries',
        conditions: {
          queryPattern: /^.{100,}$/
        },
        optimization: {
          type: 'rewrite',
          parameters: {
            extractKeywords: true,
            limitTerms: 10,
            prioritizeNouns: true
          }
        },
        priority: 7,
        active: true,
        performance: {
          applicationsCount: 0,
          avgImprovementMs: 0,
          successRate: 0
        }
      }
    ];

    logger.info(`✅ Initialized ${this.optimizationRules.length} search optimization rules`);
  }

  /**
   * Optimize a search query before execution
   */
  async optimizeQuery(
    originalQuery: string,
    searchType: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<{
    optimizedQuery: string;
    optimizations: string[];
    estimatedImprovement: number;
    fallbackStrategy?: string;
  }> {
    const startTime = Date.now();
    const appliedOptimizations: string[] = [];
    let optimizedQuery = originalQuery;
    let estimatedImprovement = 0;
    let fallbackStrategy: string | undefined;

    try {
      // Get query performance history
      const queryHistory = await this.getQueryPerformanceHistory(originalQuery);
      
      // Find applicable optimization rules
      const applicableRules = this.findApplicableRules(
        originalQuery,
        searchType,
        queryHistory
      );

      // Apply optimizations in priority order
      for (const rule of applicableRules) {
        const optimizationResult = await this.applyOptimization(
          optimizedQuery,
          rule,
          searchType,
          userId,
          metadata
        );

        if (optimizationResult.applied) {
          optimizedQuery = optimizationResult.query;
          appliedOptimizations.push(rule.name);
          estimatedImprovement += optimizationResult.estimatedImprovement;
          
          if (optimizationResult.fallbackStrategy) {
            fallbackStrategy = optimizationResult.fallbackStrategy;
          }

          // Track rule performance
          await this.trackOptimizationApplication(rule.id, optimizationResult.estimatedImprovement);
        }
      }

      // Cache optimization result for similar queries
      await this.cacheOptimizationResult(originalQuery, {
        optimizedQuery,
        optimizations: appliedOptimizations,
        estimatedImprovement
      });

      const processingTime = Date.now() - startTime;
      
      logger.debug('Query optimization completed', {
        originalQuery: originalQuery.substring(0, 100),
        optimizedQuery: optimizedQuery.substring(0, 100),
        optimizations: appliedOptimizations,
        estimatedImprovement,
        processingTime
      });

      return {
        optimizedQuery,
        optimizations: appliedOptimizations,
        estimatedImprovement,
        fallbackStrategy
      };

    } catch (error) {
      logger.error('Query optimization failed:', error);
      return {
        optimizedQuery: originalQuery,
        optimizations: [],
        estimatedImprovement: 0
      };
    }
  }

  /**
   * Find applicable optimization rules for a query
   */
  private findApplicableRules(
    query: string,
    searchType: string,
    history?: any
  ): QueryOptimizationRule[] {
    return this.optimizationRules
      .filter(rule => {
        if (!rule.active) return false;

        // Check query pattern
        if (rule.conditions.queryPattern && !rule.conditions.queryPattern.test(query)) {
          return false;
        }

        // Check search type
        if (rule.conditions.searchType && !rule.conditions.searchType.includes(searchType)) {
          return false;
        }

        // Check performance thresholds
        if (history) {
          if (rule.conditions.responseTimeThreshold && 
              history.avgResponseTime < rule.conditions.responseTimeThreshold) {
            return false;
          }

          if (rule.conditions.resultCountThreshold !== undefined && 
              history.avgResultCount >= rule.conditions.resultCountThreshold) {
            return false;
          }

          if (rule.conditions.errorRateThreshold && 
              history.errorRate < rule.conditions.errorRateThreshold) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Apply a specific optimization rule
   */
  private async applyOptimization(
    query: string,
    rule: QueryOptimizationRule,
    searchType: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<{
    applied: boolean;
    query: string;
    estimatedImprovement: number;
    fallbackStrategy?: string;
  }> {
    try {
      switch (rule.optimization.type) {
        case 'rewrite':
          return await this.applyQueryRewrite(query, rule, searchType, metadata);
        
        case 'boost':
          return await this.applyScoreBoost(query, rule, searchType, metadata);
        
        case 'filter':
          return await this.applyQueryFilter(query, rule, searchType, metadata);
        
        case 'cache':
          return await this.applyCacheOptimization(query, rule, searchType, userId);
        
        case 'fallback':
          return await this.applyFallbackStrategy(query, rule, searchType, metadata);
        
        default:
          return { applied: false, query, estimatedImprovement: 0 };
      }
    } catch (error) {
      logger.error(`Failed to apply optimization ${rule.id}:`, error);
      return { applied: false, query, estimatedImprovement: 0 };
    }
  }

  private async applyQueryRewrite(
    query: string,
    rule: QueryOptimizationRule,
    searchType: string,
    metadata?: Record<string, any>
  ): Promise<{ applied: boolean; query: string; estimatedImprovement: number }> {
    const params = rule.optimization.parameters;
    let rewrittenQuery = query;
    let estimatedImprovement = 0;

    // Reduce fuzziness for performance
    if (params.reduceFuzziness && query.includes('~')) {
      rewrittenQuery = query.replace(/~\d*/g, '~1');
      estimatedImprovement += 200; // Estimated 200ms improvement
    }

    // Expand query with synonyms for zero results
    if (params.expandWithSynonyms) {
      const expandedTerms = await this.expandQueryWithSynonyms(query);
      if (expandedTerms.length > 0) {
        rewrittenQuery = `${query} OR ${expandedTerms.join(' OR ')}`;
        estimatedImprovement += 50;
      }
    }

    // Extract keywords from long queries
    if (params.extractKeywords && query.length > 100) {
      rewrittenQuery = await this.extractKeywords(query, params.limitTerms || 10);
      estimatedImprovement += 300; // Significant improvement for long queries
    }

    // Enable fuzzy search for better recall
    if (params.enableFuzzy && !query.includes('~')) {
      const terms = query.split(' ');
      if (terms.length <= 3) { // Only for short queries to avoid performance issues
        rewrittenQuery = terms.map(term => `${term}~1`).join(' ');
        estimatedImprovement += 30;
      }
    }

    return {
      applied: rewrittenQuery !== query,
      query: rewrittenQuery,
      estimatedImprovement
    };
  }

  private async applyScoreBoost(
    query: string,
    rule: QueryOptimizationRule,
    searchType: string,
    metadata?: Record<string, any>
  ): Promise<{ applied: boolean; query: string; estimatedImprovement: number }> {
    const params = rule.optimization.parameters;
    
    // This would typically modify the Elasticsearch query structure
    // For now, we'll store boost parameters for later use
    await this.redis.setex(
      `query_boost:${query}`,
      3600,
      JSON.stringify(params)
    );

    return {
      applied: true,
      query,
      estimatedImprovement: 10 // Small improvement from better relevance
    };
  }

  private async applyQueryFilter(
    query: string,
    rule: QueryOptimizationRule,
    searchType: string,
    metadata?: Record<string, any>
  ): Promise<{ applied: boolean; query: string; estimatedImprovement: number }> {
    // Apply query filters (would be implementation specific)
    return {
      applied: true,
      query,
      estimatedImprovement: 50
    };
  }

  private async applyCacheOptimization(
    query: string,
    rule: QueryOptimizationRule,
    searchType: string,
    userId?: string
  ): Promise<{ applied: boolean; query: string; estimatedImprovement: number }> {
    const params = rule.optimization.parameters;
    
    // Check if query is popular enough to cache
    const searchCount = await this.redis.get(`search_count:${query}`) || '0';
    
    if (parseInt(searchCount) >= (params.minSearchCount || 10)) {
      // Mark query for caching
      await this.redis.setex(
        `cache_query:${query}`,
        params.ttl || 300,
        JSON.stringify({ searchType, userId, timestamp: Date.now() })
      );

      return {
        applied: true,
        query,
        estimatedImprovement: 500 // Significant improvement from caching
      };
    }

    return { applied: false, query, estimatedImprovement: 0 };
  }

  private async applyFallbackStrategy(
    query: string,
    rule: QueryOptimizationRule,
    searchType: string,
    metadata?: Record<string, any>
  ): Promise<{ 
    applied: boolean; 
    query: string; 
    estimatedImprovement: number; 
    fallbackStrategy?: string;
  }> {
    const params = rule.optimization.parameters;
    let fallbackStrategy: string | undefined;

    if (params.usePostgreSQL) {
      fallbackStrategy = 'postgresql';
    }

    return {
      applied: true,
      query,
      estimatedImprovement: params.usePostgreSQL ? 100 : 0,
      fallbackStrategy
    };
  }

  /**
   * Track performance of search queries
   */
  async trackSearchPerformance(
    query: string,
    responseTime: number,
    resultCount: number,
    searchType: string,
    success: boolean,
    optimizations: string[] = []
  ): Promise<void> {
    try {
      // Store query performance data
      await this.redis.lpush(
        `query_perf:${query}`,
        JSON.stringify({
          responseTime,
          resultCount,
          searchType,
          success,
          optimizations,
          timestamp: Date.now()
        })
      );
      
      // Keep only recent data
      await this.redis.ltrim(`query_perf:${query}`, 0, 99);

      // Increment search count for caching decisions
      await this.redis.incr(`search_count:${query}`);
      await this.redis.expire(`search_count:${query}`, 86400); // 24 hours

      // Update performance baselines
      this.updatePerformanceBaseline(query, responseTime);

      // Learn from performance data if in learning mode
      if (this.learningMode) {
        await this.learnFromPerformanceData(query, responseTime, resultCount, success, optimizations);
      }

    } catch (error) {
      logger.error('Failed to track search performance:', error);
    }
  }

  /**
   * Get optimization metrics and insights
   */
  async getOptimizationMetrics(): Promise<SearchOptimizationMetrics> {
    try {
      // Calculate overall optimization statistics
      const totalOptimizations = this.optimizationRules.reduce(
        (sum, rule) => sum + rule.performance.applicationsCount, 
        0
      );

      const successfulOptimizations = this.optimizationRules.reduce(
        (sum, rule) => sum + (rule.performance.applicationsCount * rule.performance.successRate), 
        0
      );

      const avgPerformanceImprovement = this.optimizationRules.reduce(
        (sum, rule) => sum + rule.performance.avgImprovementMs, 
        0
      ) / this.optimizationRules.length;

      // Get top performing optimizations
      const topOptimizations = this.optimizationRules
        .filter(rule => rule.performance.applicationsCount > 0)
        .sort((a, b) => b.performance.avgImprovementMs - a.performance.avgImprovementMs)
        .slice(0, 5);

      // Analyze query patterns
      const queryPatterns = await this.analyzeQueryPatterns();

      // Generate recommendations
      const recommendations = await this.generateRecommendations();

      return {
        totalOptimizations,
        successfulOptimizations,
        avgPerformanceImprovement,
        topOptimizations,
        queryPatterns,
        recommendations
      };

    } catch (error) {
      logger.error('Failed to get optimization metrics:', error);
      return {
        totalOptimizations: 0,
        successfulOptimizations: 0,
        avgPerformanceImprovement: 0,
        topOptimizations: [],
        queryPatterns: [],
        recommendations: []
      };
    }
  }

  /**
   * Generate performance improvement recommendations
   */
  private async generateRecommendations(): Promise<Array<{
    type: 'index' | 'query' | 'mapping' | 'cache' | 'infrastructure';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImpact: string;
    implementation: string;
  }>> {
    const recommendations = [];

    // Analyze slow queries
    const slowQueries = await this.getSlowQueries();
    if (slowQueries.length > 0) {
      recommendations.push({
        type: 'query' as const,
        priority: 'high' as const,
        title: 'Optimize Slow Queries',
        description: `${slowQueries.length} queries are taking longer than 1 second to execute`,
        estimatedImpact: '30-50% reduction in response time',
        implementation: 'Review and optimize query structure, add appropriate indexes'
      });
    }

    // Check cache hit rate
    const cacheHitRate = await this.getCacheHitRate();
    if (cacheHitRate < 0.3) {
      recommendations.push({
        type: 'cache' as const,
        priority: 'medium' as const,
        title: 'Improve Query Caching',
        description: `Cache hit rate is ${(cacheHitRate * 100).toFixed(1)}%, below optimal threshold`,
        estimatedImpact: '20-40% reduction in response time for popular queries',
        implementation: 'Implement intelligent query caching with longer TTL for popular searches'
      });
    }

    // Check zero result queries
    const zeroResultRate = await this.getZeroResultRate();
    if (zeroResultRate > 0.1) {
      recommendations.push({
        type: 'query' as const,
        priority: 'medium' as const,
        title: 'Reduce Zero Result Queries',
        description: `${(zeroResultRate * 100).toFixed(1)}% of queries return no results`,
        estimatedImpact: '15-25% improvement in user satisfaction',
        implementation: 'Implement query expansion, better synonyms, and spell correction'
      });
    }

    // Infrastructure recommendations
    const avgResponseTime = await this.getAverageResponseTime();
    if (avgResponseTime > 500) {
      recommendations.push({
        type: 'infrastructure' as const,
        priority: 'high' as const,
        title: 'Scale Search Infrastructure',
        description: `Average response time is ${avgResponseTime}ms, above recommended threshold`,
        estimatedImpact: '40-60% improvement in response times',
        implementation: 'Add more Elasticsearch nodes or upgrade hardware resources'
      });
    }

    return recommendations;
  }

  // Helper methods for optimization

  private async expandQueryWithSynonyms(query: string): Promise<string[]> {
    // Simple synonym expansion (in production, use a proper synonym service)
    const synonymMap: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript'],
      'python': ['py'],
      'programming': ['coding', 'development'],
      'ai': ['artificial intelligence', 'machine learning'],
      'crypto': ['cryptocurrency', 'blockchain']
    };

    const terms = query.toLowerCase().split(' ');
    const expandedTerms: string[] = [];

    for (const term of terms) {
      if (synonymMap[term]) {
        expandedTerms.push(...synonymMap[term]);
      }
    }

    return expandedTerms;
  }

  private async extractKeywords(query: string, maxTerms: number): Promise<string> {
    // Simple keyword extraction (in production, use NLP library)
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    const keywords = words
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, maxTerms);

    return keywords.join(' ');
  }

  private async getQueryPerformanceHistory(query: string): Promise<any> {
    try {
      const data = await this.redis.lrange(`query_perf:${query}`, 0, 9);
      const performances = data.map(d => JSON.parse(d));

      if (performances.length === 0) return null;

      return {
        avgResponseTime: performances.reduce((sum, p) => sum + p.responseTime, 0) / performances.length,
        avgResultCount: performances.reduce((sum, p) => sum + p.resultCount, 0) / performances.length,
        errorRate: performances.filter(p => !p.success).length / performances.length,
        searchCount: performances.length
      };
    } catch (error) {
      return null;
    }
  }

  private updatePerformanceBaseline(query: string, responseTime: number): void {
    const current = this.performanceBaseline.get(query) || responseTime;
    // Exponential moving average
    const alpha = 0.1;
    const updated = alpha * responseTime + (1 - alpha) * current;
    this.performanceBaseline.set(query, updated);
  }

  private async learnFromPerformanceData(
    query: string,
    responseTime: number,
    resultCount: number,
    success: boolean,
    optimizations: string[]
  ): Promise<void> {
    // Simple learning algorithm to adjust rule performance
    for (const optimization of optimizations) {
      const rule = this.optimizationRules.find(r => r.name === optimization);
      if (rule) {
        rule.performance.applicationsCount++;
        
        // Update success rate
        const prevSuccessRate = rule.performance.successRate;
        const totalApplications = rule.performance.applicationsCount;
        rule.performance.successRate = 
          (prevSuccessRate * (totalApplications - 1) + (success ? 1 : 0)) / totalApplications;

        // Update average improvement (simplified)
        const baseline = this.performanceBaseline.get(query) || responseTime;
        const improvement = Math.max(0, baseline - responseTime);
        rule.performance.avgImprovementMs = 
          (rule.performance.avgImprovementMs * (totalApplications - 1) + improvement) / totalApplications;
      }
    }
  }

  private async cacheOptimizationResult(query: string, result: any): Promise<void> {
    await this.redis.setex(
      `optimization:${query}`,
      3600, // 1 hour
      JSON.stringify(result)
    );
  }

  private async trackOptimizationApplication(ruleId: string, improvement: number): Promise<void> {
    await this.redis.hincrby('optimization_stats', `${ruleId}:applications`, 1);
    await this.redis.hincrbyfloat('optimization_stats', `${ruleId}:improvement`, improvement);
  }

  private async analyzeQueryPatterns(): Promise<Array<{
    pattern: string;
    count: number;
    avgImprovement: number;
  }>> {
    // Analyze query patterns (simplified)
    return [];
  }

  private async getSlowQueries(): Promise<any[]> {
    const slowQueries = await this.redis.lrange('search:slow_queries', 0, 49);
    return slowQueries.map(q => JSON.parse(q));
  }

  private async getCacheHitRate(): Promise<number> {
    // Calculate cache hit rate
    return 0.25; // Placeholder
  }

  private async getZeroResultRate(): Promise<number> {
    // Calculate zero result rate
    return 0.05; // Placeholder
  }

  private async getAverageResponseTime(): Promise<number> {
    // Calculate average response time
    return 300; // Placeholder
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance and adjust rules
    setInterval(async () => {
      try {
        await this.adjustOptimizationRules();
        await this.cleanupOldData();
      } catch (error) {
        logger.error('Performance monitoring error:', error);
      }
    }, 300000); // Every 5 minutes
  }

  private async adjustOptimizationRules(): Promise<void> {
    // Automatically adjust rule parameters based on performance
    for (const rule of this.optimizationRules) {
      if (rule.performance.applicationsCount > 10) {
        // Disable rules with poor success rate
        if (rule.performance.successRate < 0.3) {
          rule.active = false;
          logger.warn(`Disabled optimization rule: ${rule.name} (low success rate)`);
        }
        
        // Increase priority for high-performing rules
        if (rule.performance.successRate > 0.8 && rule.performance.avgImprovementMs > 100) {
          rule.priority = Math.min(10, rule.priority + 1);
        }
      }
    }
  }

  private async cleanupOldData(): Promise<void> {
    // Clean up old performance data
    const keys = await this.redis.keys('query_perf:*');
    for (const key of keys) {
      await this.redis.expire(key, 86400); // 24 hours
    }
  }

  /**
   * Manually add a new optimization rule
   */
  async addOptimizationRule(rule: Omit<QueryOptimizationRule, 'performance'>): Promise<void> {
    const newRule: QueryOptimizationRule = {
      ...rule,
      performance: {
        applicationsCount: 0,
        avgImprovementMs: 0,
        successRate: 0
      }
    };

    this.optimizationRules.push(newRule);
    logger.info(`Added new optimization rule: ${rule.name}`);
  }

  /**
   * Get all current optimization rules
   */
  getOptimizationRules(): QueryOptimizationRule[] {
    return this.optimizationRules;
  }

  /**
   * Enable or disable learning mode
   */
  setLearningMode(enabled: boolean): void {
    this.learningMode = enabled;
    logger.info(`Learning mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clean up any resources
    this.queryCache.clear();
    this.performanceBaseline.clear();
    logger.info('Search optimization service cleaned up');
  }
}

export default SearchOptimizationService;