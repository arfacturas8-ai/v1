/**
 * CRYB Platform - Elasticsearch Client
 * Production-ready search infrastructure with clustering and optimization
 */

import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';
import { config } from '../config';

export class ElasticsearchClient {
  private client: Client;
  private readonly maxRetries = 3;
  private readonly timeout = 30000;
  private circuitBreakerThreshold = 0.95; // 95% memory threshold
  private isCircuitOpen = false;
  private lastHealthCheck = 0;

  constructor() {
    this.client = new Client({
      nodes: config.elasticsearch.nodes,
      auth: config.elasticsearch.auth,
      maxRetries: this.maxRetries,
      requestTimeout: this.timeout,
      sniffOnStart: true,
      sniffInterval: 300000, // 5 minutes
      sniffOnConnectionFault: true,
      compression: 'gzip',
      ssl: {
        rejectUnauthorized: false
      },
      // Connection pool optimization
      resurrectStrategy: 'ping',
      pingTimeout: 3000,
      deadTimeout: 60000,
      maxConnections: 50,
      keepAlive: true,
      keepAliveInterval: 1000,
      // Memory and performance optimizations
      suggestCompression: true,
      headers: {
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000'
      }
    });

    this.setupEventHandlers();
    this.setupCircuitBreakers();
  }

  private setupEventHandlers(): void {
    this.client.on('request', (err, result) => {
      if (err) {
        logger.error('Elasticsearch request error', { error: err });
      }
    });

    this.client.on('response', (err, result) => {
      if (err) {
        logger.error('Elasticsearch response error', { error: err });
      }
    });
  }

  private setupCircuitBreakers(): void {
    // Setup circuit breaker monitoring
    setInterval(async () => {
      try {
        const now = Date.now();
        if (now - this.lastHealthCheck > 30000) { // Check every 30 seconds
          await this.checkMemoryUsage();
          this.lastHealthCheck = now;
        }
      } catch (error) {
        logger.error('Circuit breaker health check failed', { error });
      }
    }, 30000);
  }

  private async checkMemoryUsage(): Promise<void> {
    try {
      const stats = await this.client.cluster.stats();
      const memoryUsage = stats.nodes.jvm.mem.heap_used_percent / 100;
      
      if (memoryUsage > this.circuitBreakerThreshold) {
        if (!this.isCircuitOpen) {
          this.isCircuitOpen = true;
          logger.warn('Elasticsearch circuit breaker opened', { 
            memoryUsage: `${(memoryUsage * 100).toFixed(2)}%`,
            threshold: `${(this.circuitBreakerThreshold * 100).toFixed(2)}%`
          });
        }
      } else if (memoryUsage < this.circuitBreakerThreshold - 0.1) { // 10% buffer
        if (this.isCircuitOpen) {
          this.isCircuitOpen = false;
          logger.info('Elasticsearch circuit breaker closed', { 
            memoryUsage: `${(memoryUsage * 100).toFixed(2)}%` 
          });
        }
      }
    } catch (error) {
      logger.error('Failed to check memory usage', { error });
    }
  }

  private async checkCircuitBreaker(): Promise<void> {
    if (this.isCircuitOpen) {
      throw new Error('Circuit breaker is open - Elasticsearch memory usage too high');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const health = await this.client.cluster.health({
        wait_for_status: 'yellow',
        timeout: '10s'
      });
      
      logger.info('Elasticsearch health check', { 
        status: health.status,
        cluster_name: health.cluster_name,
        number_of_nodes: health.number_of_nodes
      });

      return health.status === 'green' || health.status === 'yellow';
    } catch (error) {
      logger.error('Elasticsearch health check failed', { error });
      return false;
    }
  }

  async initializeIndices(): Promise<void> {
    const indices = [
      'cryb-posts-' + new Date().getFullYear(),
      'cryb-comments-' + new Date().getFullYear(),
      'cryb-users',
      'cryb-communities'
    ];

    for (const index of indices) {
      try {
        const exists = await this.client.indices.exists({ index });
        if (!exists) {
          await this.createIndex(index);
          logger.info(`Created index: ${index}`);
        }
      } catch (error) {
        logger.error(`Failed to create index ${index}`, { error });
      }
    }
  }

  private async createIndex(indexName: string): Promise<void> {
    const templateName = this.getTemplateName(indexName);
    const settings = this.getIndexSettings(indexName);
    const mappings = this.getIndexMappings(indexName);

    await this.client.indices.create({
      index: indexName,
      body: {
        settings,
        mappings
      }
    });
  }

  private getTemplateName(indexName: string): string {
    if (indexName.includes('posts')) return 'cryb_posts_template';
    if (indexName.includes('comments')) return 'cryb_comments_template';
    if (indexName.includes('users')) return 'cryb_users_template';
    if (indexName.includes('communities')) return 'cryb_communities_template';
    return 'default_template';
  }

  private getIndexSettings(indexName: string): any {
    const baseSettings = {
      analysis: {
        analyzer: {
          cryb_text_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding', 'stop', 'snowball']
          },
          cryb_autocomplete_analyzer: {
            type: 'custom',
            tokenizer: 'keyword',
            filter: ['lowercase', 'asciifolding', 'edge_ngram_filter']
          }
        },
        filter: {
          edge_ngram_filter: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 20
          }
        }
      },
      // Memory and performance optimizations
      'index.codec': 'best_compression',
      'index.store.preload': ['nvd', 'dvd'],
      'index.queries.cache.enabled': true,
      'index.requests.cache.enable': true,
      'index.max_result_window': 10000,
      'index.max_rescore_window': 10000,
      'index.max_inner_result_window': 100,
      'index.max_terms_count': 65536,
      'index.routing_partition_size': 1,
      'index.soft_deletes.enabled': true,
      'index.soft_deletes.retention_lease.period': '12h'
    };

    if (indexName.includes('posts')) {
      return {
        ...baseSettings,
        number_of_shards: 3,
        number_of_replicas: 1,
        refresh_interval: '5s',
        max_result_window: 50000,
        // Memory optimizations for large post index
        'index.merge.policy.max_merge_at_once': 5,
        'index.merge.policy.segments_per_tier': 5,
        'index.translog.flush_threshold_size': '1gb',
        'index.translog.sync_interval': '30s'
      };
    }

    if (indexName.includes('comments')) {
      return {
        ...baseSettings,
        number_of_shards: 2,
        number_of_replicas: 1,
        refresh_interval: '5s',
        // Optimized for frequent writes
        'index.translog.flush_threshold_size': '512mb',
        'index.translog.sync_interval': '15s'
      };
    }

    return {
      ...baseSettings,
      number_of_shards: 1,
      number_of_replicas: 1,
      refresh_interval: '30s',
      // Conservative settings for smaller indices
      'index.translog.flush_threshold_size': '256mb'
    };
  }

  private getIndexMappings(indexName: string): any {
    if (indexName.includes('posts')) {
      return {
        properties: {
          id: { type: 'keyword' },
          title: {
            type: 'text',
            analyzer: 'cryb_text_analyzer',
            fields: {
              autocomplete: {
                type: 'text',
                analyzer: 'cryb_autocomplete_analyzer'
              },
              raw: { type: 'keyword' }
            }
          },
          content: {
            type: 'text',
            analyzer: 'cryb_text_analyzer'
          },
          content_type: { type: 'keyword' },
          community: {
            properties: {
              id: { type: 'keyword' },
              name: {
                type: 'text',
                fields: {
                  raw: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'cryb_autocomplete_analyzer'
                  }
                }
              }
            }
          },
          author: {
            properties: {
              id: { type: 'keyword' },
              username: {
                type: 'text',
                fields: {
                  raw: { type: 'keyword' },
                  autocomplete: {
                    type: 'text',
                    analyzer: 'cryb_autocomplete_analyzer'
                  }
                }
              },
              verified: { type: 'boolean' }
            }
          },
          metrics: {
            properties: {
              upvotes: { type: 'integer' },
              downvotes: { type: 'integer' },
              score: { type: 'integer' },
              comments: { type: 'integer' },
              views: { type: 'long' },
              hot_score: { type: 'double' },
              engagement_rate: { type: 'double' }
            }
          },
          status: {
            properties: {
              published: { type: 'boolean' },
              removed: { type: 'boolean' },
              nsfw: { type: 'boolean' },
              pinned: { type: 'boolean' }
            }
          },
          timestamps: {
            properties: {
              created_at: { type: 'date' },
              updated_at: { type: 'date' }
            }
          },
          tags: { type: 'keyword' },
          search_boost: { type: 'double' }
        }
      };
    }

    // Add mappings for other index types...
    return {};
  }

  // Search methods
  async searchPosts(params: {
    query?: string;
    community?: string;
    author?: string;
    tags?: string[];
    content_type?: string;
    sort?: string;
    from?: number;
    size?: number;
    filters?: any;
  }): Promise<any> {
    // Check circuit breaker before executing search
    await this.checkCircuitBreaker();
    
    const { query, community, author, tags, content_type, sort = 'relevance', from = 0, size = 20, filters } = params;
    
    // Limit search size to prevent memory issues
    const limitedSize = Math.min(size, 100);
    const limitedFrom = Math.min(from, 9900); // Elasticsearch default max_result_window - 100

    const searchBody: any = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
          must_not: [
            { term: { 'status.removed': true } }
          ]
        }
      },
      from: limitedFrom,
      size: limitedSize,
      // Performance optimizations
      timeout: '30s',
      allow_partial_search_results: false,
      terminate_after: 50000, // Limit documents examined
      track_total_hits: limitedFrom + limitedSize > 1000 ? false : true,
      // Memory-efficient highlighting
      highlight: {
        fields: {
          title: { 
            fragment_size: 100, 
            number_of_fragments: 1,
            no_match_size: 0 // Don't return content if no match
          },
          content: { 
            fragment_size: 200, 
            number_of_fragments: 1, // Reduced from 2
            no_match_size: 0
          }
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
        require_field_match: true, // Only highlight matching fields
        max_analyzed_offset: 1000000 // Limit analysis
      },
      // Reduced aggregation sizes to save memory
      aggs: limitedFrom === 0 ? { // Only add aggregations on first page
        communities: {
          terms: { field: 'community.name.raw', size: 10 }
        },
        content_types: {
          terms: { field: 'content_type', size: 5 }
        },
        tags: {
          terms: { field: 'tags', size: 20 }
        }
      } : undefined,
      // Source filtering to reduce response size
      _source: {
        excludes: ['content'] // Exclude large content field unless needed
      }
    };

    // Full-text search
    if (query) {
      searchBody.query.bool.must.push({
        multi_match: {
          query,
          fields: [
            'title^3',
            'title.autocomplete^2',
            'content^1',
            'community.name^2',
            'author.username^1.5'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 1
        }
      });
    } else {
      searchBody.query.bool.must.push({ match_all: {} });
    }

    // Filters
    if (community) {
      searchBody.query.bool.filter.push({
        term: { 'community.name.raw': community }
      });
    }

    if (author) {
      searchBody.query.bool.filter.push({
        term: { 'author.username.raw': author }
      });
    }

    if (tags && tags.length > 0) {
      searchBody.query.bool.filter.push({
        terms: { tags }
      });
    }

    if (content_type) {
      searchBody.query.bool.filter.push({
        term: { content_type }
      });
    }

    // Apply additional filters
    if (filters) {
      if (filters.nsfw !== undefined) {
        searchBody.query.bool.filter.push({
          term: { 'status.nsfw': filters.nsfw }
        });
      }
      if (filters.verified_only) {
        searchBody.query.bool.filter.push({
          term: { 'author.verified': true }
        });
      }
    }

    // Sorting
    const sortConfig = this.getSortConfig(sort);
    if (sortConfig) {
      searchBody.sort = sortConfig;
    }

    try {
      const response = await this.client.search({
        index: 'cryb-posts-*',
        body: searchBody
      });

      return {
        total: response.hits.total,
        posts: response.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
          highlight: hit.highlight
        })),
        aggregations: response.aggregations,
        took: response.took
      };
    } catch (error) {
      logger.error('Search posts error', { error, params });
      throw error;
    }
  }

  private getSortConfig(sort: string): any[] | null {
    switch (sort) {
      case 'newest':
        return [{ 'timestamps.created_at': 'desc' }];
      case 'oldest':
        return [{ 'timestamps.created_at': 'asc' }];
      case 'most_upvotes':
        return [{ 'metrics.upvotes': 'desc' }];
      case 'most_comments':
        return [{ 'metrics.comments': 'desc' }];
      case 'hot':
        return [{ 'metrics.hot_score': 'desc' }];
      case 'top':
        return [{ 'metrics.score': 'desc' }];
      case 'relevance':
      default:
        return null; // Use Elasticsearch's default relevance scoring
    }
  }

  async autocomplete(query: string, type: 'posts' | 'users' | 'communities' = 'posts'): Promise<any> {
    // Check circuit breaker for autocomplete requests
    await this.checkCircuitBreaker();
    
    const index = `cryb-${type}-*`;
    const field = type === 'posts' ? 'title.autocomplete' : 
                  type === 'users' ? 'username.autocomplete' : 
                  'name.autocomplete';

    try {
      const response = await this.client.search({
        index,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    [field]: {
                      query,
                      fuzziness: query.length > 4 ? 'AUTO' : 0, // Reduce fuzziness for short queries
                      prefix_length: 1
                    }
                  }
                }
              ],
              filter: type === 'posts' ? [
                { term: { 'status.published': true } },
                { term: { 'status.removed': false } }
              ] : []
            }
          },
          size: 10,
          timeout: '5s', // Faster timeout for autocomplete
          terminate_after: 1000, // Limit search scope
          track_total_hits: false, // Don't track total for autocomplete
          _source: this.getAutocompleteFields(type)
        }
      });

      return response.hits.hits.map(hit => hit._source);
    } catch (error) {
      logger.error('Autocomplete error', { error, query, type });
      throw error;
    }
  }

  private getAutocompleteFields(type: string): string[] {
    switch (type) {
      case 'posts':
        return ['id', 'title', 'community.name', 'author.username'];
      case 'users':
        return ['id', 'username', 'display_name', 'status.verified'];
      case 'communities':
        return ['id', 'name', 'display_name', 'stats.members'];
      default:
        return ['id'];
    }
  }

  async indexDocument(index: string, id: string, document: any): Promise<void> {
    try {
      await this.client.index({
        index,
        id,
        body: document,
        refresh: 'wait_for'
      });
    } catch (error) {
      logger.error('Index document error', { error, index, id });
      throw error;
    }
  }

  async bulkIndex(operations: any[]): Promise<void> {
    await this.checkCircuitBreaker();
    
    // Process operations in smaller batches to prevent memory issues
    const batchSize = 500; // Reduced batch size for memory efficiency
    const batches = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }

    try {
      for (const batch of batches) {
        const response = await this.client.bulk({
          body: batch,
          refresh: false, // Use false for better performance, refresh manually if needed
          timeout: '60s',
          wait_for_active_shards: 1 // Reduce wait time
        });

        if (response.errors) {
          const errorItems = response.items.filter(item => 
            item.index?.error || item.update?.error || item.delete?.error
          );
          logger.error('Bulk index batch errors', { 
            errorCount: errorItems.length,
            totalItems: batch.length / 2,
            errors: errorItems.slice(0, 5) // Log only first 5 errors
          });
        } else {
          logger.debug('Bulk index batch completed', { 
            itemsProcessed: batch.length / 2,
            took: response.took 
          });
        }
      }
    } catch (error) {
      logger.error('Bulk index error', { error, operationsCount: operations.length });
      throw error;
    }
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    try {
      await this.client.delete({
        index,
        id,
        refresh: 'wait_for'
      });
    } catch (error) {
      logger.error('Delete document error', { error, index, id });
      throw error;
    }
  }

  getClient(): Client {
    return this.client;
  }

  // Memory and performance monitoring methods
  async getClusterPerformanceStats(): Promise<any> {
    try {
      const [clusterStats, nodeStats, indexStats] = await Promise.all([
        this.client.cluster.stats(),
        this.client.nodes.stats(),
        this.client.indices.stats({ index: 'cryb-*' })
      ]);

      const totalHeapUsed = Object.values(nodeStats.nodes).reduce((sum: number, node: any) => {
        return sum + node.jvm.mem.heap_used_in_bytes;
      }, 0);

      const totalHeapMax = Object.values(nodeStats.nodes).reduce((sum: number, node: any) => {
        return sum + node.jvm.mem.heap_max_in_bytes;
      }, 0);

      return {
        cluster: {
          status: clusterStats.status,
          nodes: clusterStats.nodes.count.total,
          heap_usage_percent: Math.round((totalHeapUsed / totalHeapMax) * 100),
          indices_count: clusterStats.indices.count,
          docs_count: clusterStats.indices.docs.count,
          store_size_bytes: clusterStats.indices.store.size_in_bytes
        },
        performance: {
          search_time_ms: indexStats._all.total.search.time_in_millis,
          search_count: indexStats._all.total.search.query_total,
          indexing_time_ms: indexStats._all.total.indexing.time_in_millis,
          indexing_count: indexStats._all.total.indexing.index_total,
          avg_search_time_ms: indexStats._all.total.search.query_total > 0 ? 
            Math.round(indexStats._all.total.search.time_in_millis / indexStats._all.total.search.query_total) : 0
        },
        memory: {
          circuit_breaker_status: this.isCircuitOpen ? 'open' : 'closed',
          heap_usage_percent: Math.round((totalHeapUsed / totalHeapMax) * 100),
          total_heap_gb: Math.round(totalHeapMax / (1024 * 1024 * 1024) * 100) / 100
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get cluster performance stats', { error });
      throw error;
    }
  }

  async optimizeIndices(): Promise<void> {
    try {
      logger.info('Starting index optimization');
      
      // Force merge indices with low segment count
      const response = await this.client.indices.forcemerge({
        index: 'cryb-*',
        max_num_segments: 1,
        only_expunge_deletes: true,
        wait_for_completion: false
      });

      logger.info('Index optimization initiated', { task: response.task });
    } catch (error) {
      logger.error('Index optimization failed', { error });
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.client.indices.clearCache({
        index: 'cryb-*',
        query: true,
        fielddata: true,
        request: true
      });
      
      logger.info('Elasticsearch cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', { error });
      throw error;
    }
  }

  async refreshIndices(): Promise<void> {
    try {
      await this.client.indices.refresh({
        index: 'cryb-*'
      });
      
      logger.info('Indices refreshed');
    } catch (error) {
      logger.error('Failed to refresh indices', { error });
      throw error;
    }
  }

  // Get memory usage for monitoring
  getMemoryUsage(): any {
    return {
      circuit_breaker_open: this.isCircuitOpen,
      threshold: this.circuitBreakerThreshold,
      last_health_check: new Date(this.lastHealthCheck).toISOString()
    };
  }

  // Adjust circuit breaker threshold dynamically
  setCircuitBreakerThreshold(threshold: number): void {
    if (threshold >= 0.5 && threshold <= 1.0) {
      this.circuitBreakerThreshold = threshold;
      logger.info('Circuit breaker threshold updated', { threshold });
    } else {
      logger.warn('Invalid circuit breaker threshold', { threshold });
    }
  }
}

export const elasticsearchClient = new ElasticsearchClient();