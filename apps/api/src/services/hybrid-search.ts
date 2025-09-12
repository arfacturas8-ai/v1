import { CrashProofElasticsearchService } from './crash-proof-elasticsearch';
import { prisma } from '@cryb/database';
import { logger } from '../utils/logger';
import EventEmitter from 'events';

interface SearchOptions {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fuzzy?: boolean;
  highlight?: boolean;
  useElasticsearch?: boolean;
}

interface SearchFilters {
  serverId?: string;
  channelId?: string;
  userId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  hasAttachments?: boolean;
  messageType?: string;
}

interface SearchResult {
  results: any[];
  total: number;
  took: number;
  source: 'elasticsearch' | 'database';
  fallbackUsed: boolean;
}

export class HybridSearchService extends EventEmitter {
  private elasticsearch: CrashProofElasticsearchService;
  private fallbackMetrics = {
    elasticsearchAttempts: 0,
    elasticsearchSuccesses: 0,
    fallbackAttempts: 0,
    fallbackSuccesses: 0,
    lastFallbackUsed: null as Date | null
  };

  constructor(elasticsearchService: CrashProofElasticsearchService) {
    super();
    this.elasticsearch = elasticsearchService;

    // Listen to Elasticsearch events
    this.elasticsearch.on('circuit_breaker_opened', () => {
      logger.warn('Elasticsearch circuit breaker opened - will use database fallback');
      this.emit('fallback_activated', 'circuit_breaker');
    });

    this.elasticsearch.on('disconnected', () => {
      logger.warn('Elasticsearch disconnected - will use database fallback');
      this.emit('fallback_activated', 'disconnected');
    });

    this.elasticsearch.on('reconnected', () => {
      logger.info('Elasticsearch reconnected - hybrid search restored');
      this.emit('elasticsearch_restored');
    });
  }

  /**
   * Hybrid search that tries Elasticsearch first, falls back to database
   */
  async searchMessages(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    
    // Try Elasticsearch first unless explicitly disabled
    if (options.useElasticsearch !== false) {
      try {
        this.fallbackMetrics.elasticsearchAttempts++;
        
        const esResult = await this.searchWithElasticsearch(query, filters, options);
        this.fallbackMetrics.elasticsearchSuccesses++;
        
        return {
          ...esResult,
          source: 'elasticsearch',
          fallbackUsed: false,
          took: Date.now() - startTime
        };
      } catch (error) {
        logger.warn('Elasticsearch search failed, falling back to database', {
          error: error instanceof Error ? error.message : error,
          query: query.substring(0, 50),
          filters
        });
        
        this.emit('elasticsearch_failed', error);
        // Fall through to database search
      }
    }

    // Database fallback
    try {
      this.fallbackMetrics.fallbackAttempts++;
      this.fallbackMetrics.lastFallbackUsed = new Date();
      
      const dbResult = await this.searchWithDatabase(query, filters, options);
      this.fallbackMetrics.fallbackSuccesses++;
      
      return {
        ...dbResult,
        source: 'database',
        fallbackUsed: true,
        took: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Both Elasticsearch and database search failed', {
        error: error instanceof Error ? error.message : error,
        query: query.substring(0, 50),
        filters
      });
      
      this.emit('search_failed', error);
      throw error;
    }
  }

  /**
   * Search using Elasticsearch
   */
  private async searchWithElasticsearch(
    query: string,
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<{results: any[], total: number}> {
    const esFilters: any = {};
    
    if (filters.serverId) esFilters['channel.serverId'] = filters.serverId;
    if (filters.channelId) esFilters['channel.id'] = filters.channelId;
    if (filters.userId) esFilters['author.id'] = filters.userId;
    
    // Date range filter
    if (filters.dateRange) {
      esFilters.timestamp = {
        gte: filters.dateRange.from.toISOString(),
        lte: filters.dateRange.to.toISOString()
      };
    }

    const result = await this.elasticsearch.searchMessages(query, esFilters, {
      page: options.page || 1,
      size: options.size || 20,
      sortBy: options.sortBy || 'timestamp',
      sortOrder: options.sortOrder || 'desc',
      fuzzy: options.fuzzy || false,
      highlight: options.highlight !== false
    });

    return {
      results: result.results.map(hit => this.normalizeSearchResult(hit, 'elasticsearch')),
      total: result.total
    };
  }

  /**
   * Search using database as fallback
   */
  private async searchWithDatabase(
    query: string,
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<{results: any[], total: number}> {
    const page = options.page || 1;
    const size = Math.min(options.size || 20, 100); // Limit database queries
    const skip = (page - 1) * size;

    // Build where clause
    const whereClause: any = {
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        { user: { username: { contains: query, mode: 'insensitive' } } },
        { user: { displayName: { contains: query, mode: 'insensitive' } } }
      ]
    };

    // Apply filters
    if (filters.serverId || filters.channelId) {
      whereClause.channel = {};
      if (filters.serverId) whereClause.channel.serverId = filters.serverId;
      if (filters.channelId) whereClause.channel.id = filters.channelId;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to
      };
    }

    if (filters.hasAttachments !== undefined) {
      if (filters.hasAttachments) {
        whereClause.attachments = { some: {} };
      } else {
        whereClause.attachments = { none: {} };
      }
    }

    // Get total count and results in parallel
    const [total, messages] = await Promise.all([
      prisma.message.count({ where: whereClause }),
      prisma.message.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          channel: {
            select: {
              id: true,
              name: true,
              serverId: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              contentType: true,
              size: true,
              url: true
            }
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        },
        orderBy: this.buildDatabaseOrderBy(options),
        skip,
        take: size
      })
    ]);

    return {
      results: messages.map(msg => this.normalizeSearchResult(msg, 'database')),
      total
    };
  }

  /**
   * Search suggestions with fallback
   */
  async searchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    try {
      if (this.elasticsearch.getConnectionStatus().isConnected) {
        return await this.elasticsearch.searchSuggestions(query, limit);
      }
    } catch (error) {
      logger.warn('Elasticsearch suggestions failed, using database fallback');
    }

    // Database fallback for suggestions
    try {
      const messages = await prisma.message.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' }
        },
        select: { content: true },
        take: limit * 2, // Get more to filter duplicates
        orderBy: { createdAt: 'desc' }
      });

      // Extract unique suggestions
      const suggestions = new Set<string>();
      for (const message of messages) {
        const words = message.content.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.includes(query.toLowerCase()) && word.length > 2) {
            suggestions.add(word);
            if (suggestions.size >= limit) break;
          }
        }
        if (suggestions.size >= limit) break;
      }

      return Array.from(suggestions);
    } catch (error) {
      logger.error('Database suggestion fallback failed:', error);
      return [];
    }
  }

  /**
   * Autocomplete search with fallback
   */
  async autocomplete(query: string, type: 'users' | 'channels' | 'content' = 'content', limit: number = 5): Promise<any[]> {
    try {
      // Try Elasticsearch first for better performance
      if (this.elasticsearch.getConnectionStatus().isConnected && type === 'content') {
        const result = await this.elasticsearch.searchMessages(query, {}, {
          size: limit,
          highlight: false
        });
        return result.results.map(r => ({
          id: r.id,
          text: r.content.substring(0, 100),
          type: 'message'
        }));
      }
    } catch (error) {
      logger.warn('Elasticsearch autocomplete failed, using database');
    }

    // Database fallback
    try {
      switch (type) {
        case 'users':
          const users = await prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } }
              ]
            },
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            },
            take: limit
          });
          return users.map(u => ({
            id: u.id,
            text: u.displayName || u.username,
            type: 'user',
            avatar: u.avatar
          }));

        case 'channels':
          const channels = await prisma.channel.findMany({
            where: {
              name: { contains: query, mode: 'insensitive' },
              type: 'TEXT'
            },
            select: {
              id: true,
              name: true,
              serverId: true
            },
            take: limit
          });
          return channels.map(c => ({
            id: c.id,
            text: c.name,
            type: 'channel'
          }));

        case 'content':
        default:
          const messages = await prisma.message.findMany({
            where: {
              content: { contains: query, mode: 'insensitive' }
            },
            select: {
              id: true,
              content: true,
              user: {
                select: { username: true }
              }
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
          });
          return messages.map(m => ({
            id: m.id,
            text: m.content.substring(0, 100),
            type: 'message',
            author: m.user.username
          }));
      }
    } catch (error) {
      logger.error('Autocomplete database fallback failed:', error);
      return [];
    }
  }

  /**
   * Global search across multiple content types
   */
  async globalSearch(query: string, filters: SearchFilters = {}, options: SearchOptions = {}): Promise<{
    messages: SearchResult;
    users?: any[];
    servers?: any[];
    communities?: any[];
  }> {
    const results: any = {};

    // Search messages (with fallback)
    try {
      results.messages = await this.searchMessages(query, filters, options);
    } catch (error) {
      logger.error('Message search failed in global search:', error);
      results.messages = { results: [], total: 0, took: 0, source: 'database', fallbackUsed: true };
    }

    // Search other content types using database (more reliable for metadata)
    try {
      const [users, servers, communities] = await Promise.all([
        // Users
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          },
          take: 5
        }),

        // Servers
        prisma.server.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ],
            isPublic: true
          },
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            _count: {
              select: { members: true }
            }
          },
          take: 5
        }),

        // Communities
        prisma.community.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ],
            isPublic: true
          },
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            memberCount: true
          },
          take: 5
        })
      ]);

      results.users = users;
      results.servers = servers;
      results.communities = communities;
    } catch (error) {
      logger.error('Global search metadata failed:', error);
      results.users = [];
      results.servers = [];
      results.communities = [];
    }

    return results;
  }

  /**
   * Get search metrics and health status
   */
  getSearchMetrics(): {
    elasticsearch: {
      isConnected: boolean;
      circuitBreakerState: string;
      attempts: number;
      successes: number;
      successRate: number;
    };
    fallback: {
      attempts: number;
      successes: number;
      successRate: number;
      lastUsed: Date | null;
    };
    overall: {
      totalAttempts: number;
      totalSuccesses: number;
      overallSuccessRate: number;
    };
  } {
    const esStatus = this.elasticsearch.getConnectionStatus();
    const esSuccessRate = this.fallbackMetrics.elasticsearchAttempts > 0 
      ? (this.fallbackMetrics.elasticsearchSuccesses / this.fallbackMetrics.elasticsearchAttempts) * 100 
      : 0;
    
    const fallbackSuccessRate = this.fallbackMetrics.fallbackAttempts > 0 
      ? (this.fallbackMetrics.fallbackSuccesses / this.fallbackMetrics.fallbackAttempts) * 100 
      : 0;

    const totalAttempts = this.fallbackMetrics.elasticsearchAttempts + this.fallbackMetrics.fallbackAttempts;
    const totalSuccesses = this.fallbackMetrics.elasticsearchSuccesses + this.fallbackMetrics.fallbackSuccesses;
    const overallSuccessRate = totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;

    return {
      elasticsearch: {
        isConnected: esStatus.isConnected,
        circuitBreakerState: esStatus.circuitBreakerState,
        attempts: this.fallbackMetrics.elasticsearchAttempts,
        successes: this.fallbackMetrics.elasticsearchSuccesses,
        successRate: esSuccessRate
      },
      fallback: {
        attempts: this.fallbackMetrics.fallbackAttempts,
        successes: this.fallbackMetrics.fallbackSuccesses,
        successRate: fallbackSuccessRate,
        lastUsed: this.fallbackMetrics.lastFallbackUsed
      },
      overall: {
        totalAttempts,
        totalSuccesses,
        overallSuccessRate
      }
    };
  }

  /**
   * Normalize search results from different sources
   */
  private normalizeSearchResult(result: any, source: 'elasticsearch' | 'database'): any {
    if (source === 'elasticsearch') {
      return {
        id: result.id,
        content: result.content,
        author: result.author,
        channel: result.channel,
        timestamp: result.timestamp,
        highlights: result.highlights,
        score: result.score,
        attachments: result.attachments || [],
        mentions: result.mentions || [],
        reactions: result.reactions || []
      };
    } else {
      // Database result
      return {
        id: result.id,
        content: result.content,
        author: {
          id: result.user.id,
          username: result.user.username,
          displayName: result.user.displayName
        },
        channel: {
          id: result.channel.id,
          name: result.channel.name,
          serverId: result.channel.serverId
        },
        timestamp: result.createdAt.toISOString(),
        highlights: {}, // No highlighting in database search
        score: 1.0, // No relevance scoring in database search
        attachments: result.attachments || [],
        mentions: (result.mentions || []).map((m: any) => ({
          userId: m.user.id,
          username: m.user.username
        })),
        reactions: (result.reactions || []).map((r: any) => ({
          emoji: r.emoji,
          count: 1 // Simplified for fallback
        }))
      };
    }
  }

  /**
   * Build database order by clause
   */
  private buildDatabaseOrderBy(options: SearchOptions): any {
    const sortBy = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';

    const orderMap: any = {
      timestamp: { createdAt: sortOrder },
      relevance: { createdAt: 'desc' }, // Fallback to timestamp for database
      author: { user: { username: sortOrder } }
    };

    return orderMap[sortBy] || orderMap.timestamp;
  }

  /**
   * Reset metrics (for testing/monitoring)
   */
  resetMetrics(): void {
    this.fallbackMetrics = {
      elasticsearchAttempts: 0,
      elasticsearchSuccesses: 0,
      fallbackAttempts: 0,
      fallbackSuccesses: 0,
      lastFallbackUsed: null
    };
  }
}