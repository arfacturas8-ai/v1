import { Client } from '@elastic/elasticsearch';
import { Connection } from '@elastic/elasticsearch/lib/pool/index';
import EventEmitter from 'events';
import { logger } from '../utils/logger';

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  nextAttempt: number;
}

export interface ElasticsearchConfig {
  nodes: string[];
  username?: string;
  password?: string;
  ssl?: boolean;
  maxRetries?: number;
  requestTimeout?: number;
  pingTimeout?: number;
  sniffOnStart?: boolean;
  sniffInterval?: number;
  resurrectStrategy?: 'ping' | 'optimistic' | 'none';
  circuitBreaker?: {
    failureThreshold: number;
    timeout: number;
    monitoringPeriod: number;
  };
}

export class CrashProofElasticsearchService extends EventEmitter {
  private client: Client;
  private isConnected = false;
  private config: ElasticsearchConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private circuitBreaker: CircuitBreakerState;
  private connectionPool: Connection[] = [];
  private currentNodeIndex = 0;
  private retryCount = 0;
  private maxRetries: number;

  constructor(config: ElasticsearchConfig) {
    super();
    this.config = {
      maxRetries: 3,
      requestTimeout: 30000,
      pingTimeout: 3000,
      sniffOnStart: true,
      sniffInterval: 300000, // 5 minutes
      resurrectStrategy: 'ping',
      circuitBreaker: {
        failureThreshold: 5,
        timeout: 60000, // 1 minute
        monitoringPeriod: 120000 // 2 minutes
      },
      ...config
    };

    this.maxRetries = this.config.maxRetries || 3;
    this.circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      nextAttempt: 0
    };

    this.initializeClient();
    this.startHealthChecking();
  }

  private initializeClient(): void {
    try {
      this.client = new Client({
        nodes: this.config.nodes,
        auth: this.config.username && this.config.password ? {
          username: this.config.username,
          password: this.config.password
        } : undefined,
        tls: this.config.ssl ? {
          rejectUnauthorized: false
        } : undefined,
        maxRetries: this.config.maxRetries,
        requestTimeout: this.config.requestTimeout,
        pingTimeout: this.config.pingTimeout,
        sniffOnStart: this.config.sniffOnStart,
        sniffInterval: this.config.sniffInterval,
        resurrectStrategy: this.config.resurrectStrategy,
        // Connection pool configuration
        Connection: class extends Connection {
          onMarkDead() {
            logger.warn('Elasticsearch node marked as dead:', this.url.toString());
          }
          onMarkAlive() {
            logger.info('Elasticsearch node marked as alive:', this.url.toString());
          }
        }
      });

      // Set up client event handlers
      this.client.on('response', (err, result) => {
        if (err) {
          this.handleConnectionError(err);
        } else {
          this.handleSuccessfulRequest();
        }
      });

      this.client.on('sniff', (err, request) => {
        if (err) {
          logger.warn('Elasticsearch sniffing failed:', err.message);
        } else {
          logger.info('Elasticsearch cluster sniffed successfully');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize Elasticsearch client:', error);
      this.emit('error', error);
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.isCircuitBreakerOpen()) {
        throw new Error('Circuit breaker is open - Elasticsearch unavailable');
      }

      await this.performHealthCheck();
      this.isConnected = true;
      this.resetCircuitBreaker();
      
      logger.info('✅ Elasticsearch connected successfully', {
        nodes: this.config.nodes,
        circuitBreakerState: this.circuitBreaker.state
      });
      
      this.emit('connected');
    } catch (error) {
      this.handleConnectionError(error);
      logger.warn('⚠️ Elasticsearch connection failed:', error instanceof Error ? error.message : error);
      this.isConnected = false;
      this.emit('disconnected', error);
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    try {
      if (this.isCircuitBreakerOpen()) {
        return false;
      }

      await this.client.ping({
        timeout: this.config.pingTimeout
      });
      
      this.handleSuccessfulRequest();
      return true;
    } catch (error) {
      this.handleConnectionError(error);
      return false;
    }
  }

  private async performHealthCheck(): Promise<void> {
    const healthResponse = await this.client.cluster.health({
      timeout: '30s',
      wait_for_status: 'yellow'
    });

    if (healthResponse.body.status === 'red') {
      throw new Error(`Elasticsearch cluster health is red: ${healthResponse.body.status}`);
    }

    logger.info('Elasticsearch cluster health check passed', {
      status: healthResponse.body.status,
      numberOfNodes: healthResponse.body.number_of_nodes,
      activeShards: healthResponse.body.active_shards
    });
  }

  private startHealthChecking(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await this.ping();
        if (!isHealthy && this.isConnected) {
          this.isConnected = false;
          this.emit('disconnected');
        } else if (isHealthy && !this.isConnected) {
          this.isConnected = true;
          this.emit('reconnected');
        }
      } catch (error) {
        logger.warn('Health check failed:', error instanceof Error ? error.message : error);
      }
    }, 30000);
  }

  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() > this.circuitBreaker.nextAttempt) {
        this.circuitBreaker.state = 'HALF_OPEN';
        logger.info('Circuit breaker moved to HALF_OPEN state');
        return false;
      }
      return true;
    }
    return false;
  }

  private handleConnectionError(error: any): void {
    this.circuitBreaker.failures++;
    
    logger.warn('Elasticsearch operation failed', {
      error: error instanceof Error ? error.message : error,
      failures: this.circuitBreaker.failures,
      circuitBreakerState: this.circuitBreaker.state
    });

    if (this.circuitBreaker.failures >= (this.config.circuitBreaker?.failureThreshold || 5)) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttempt = Date.now() + (this.config.circuitBreaker?.timeout || 60000);
      
      logger.error('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreaker.failures,
        nextAttempt: new Date(this.circuitBreaker.nextAttempt).toISOString()
      });
      
      this.emit('circuit_breaker_opened');
    }
  }

  private handleSuccessfulRequest(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.resetCircuitBreaker();
      logger.info('Circuit breaker closed after successful request');
    }
    
    // Reset failure count on successful requests
    if (this.circuitBreaker.failures > 0) {
      this.circuitBreaker.failures = Math.max(0, this.circuitBreaker.failures - 1);
    }
  }

  private resetCircuitBreaker(): void {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.nextAttempt = 0;
  }

  async indexDocument(index: string, id: string, document: any): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const response = await this.client.index({
        index,
        id,
        document: {
          ...document,
          indexed_at: new Date().toISOString()
        },
        refresh: 'wait_for'
      });

      logger.debug(`Document indexed successfully in ${index}`, {
        id,
        index,
        result: response.body?.result || response.result
      });

      return true;
    }, `indexDocument-${index}`);
  }

  async indexMessage(messageId: string, content: string, metadata: any): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const response = await this.client.index({
        index: 'messages',
        id: messageId,
        document: {
          content,
          ...metadata,
          timestamp: new Date().toISOString(),
          indexed_at: new Date().toISOString()
        },
        refresh: 'wait_for' // Ensure document is available for search immediately
      });

      logger.debug('Message indexed successfully', {
        messageId,
        index: 'messages',
        result: response.body.result
      });

      return true;
    }, 'indexMessage');
  }

  async indexBulkMessages(messages: Array<{id: string, content: string, metadata: any}>): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const body = messages.flatMap(msg => [
        { index: { _index: 'messages', _id: msg.id } },
        {
          content: msg.content,
          ...msg.metadata,
          timestamp: new Date().toISOString(),
          indexed_at: new Date().toISOString()
        }
      ]);

      const response = await this.client.bulk({
        body,
        refresh: 'wait_for'
      });

      if (response.body.errors) {
        const erroredDocs = response.body.items.filter((item: any) => 
          item.index && item.index.error
        );
        logger.warn('Some documents failed to index', {
          total: messages.length,
          errors: erroredDocs.length,
          erroredDocs: erroredDocs.slice(0, 5) // Log first 5 errors
        });
      }

      logger.info('Bulk indexing completed', {
        total: messages.length,
        took: response.body.took,
        errors: response.body.errors
      });

      return true;
    }, 'indexBulkMessages');
  }

  async searchMessages(
    query: string, 
    filters: any = {}, 
    options: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      fuzzy?: boolean;
      highlight?: boolean;
    } = {}
  ): Promise<{results: any[], total: number, took: number}> {
    const defaultOptions = {
      page: 1,
      size: 20,
      sortBy: 'timestamp',
      sortOrder: 'desc' as const,
      fuzzy: false,
      highlight: true
    };
    const opts = { ...defaultOptions, ...options };

    return this.executeWithRetry(async () => {
      const from = (opts.page - 1) * opts.size;
      
      const searchQuery: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      if (query.trim()) {
        const matchQuery: any = {
          multi_match: {
            query,
            fields: [
              'content^2', // Boost content matches
              'author.username^1.5',
              'author.displayName',
              'channel.name'
            ],
            type: 'best_fields',
            operator: 'and',
            minimum_should_match: '75%'
          }
        };

        if (opts.fuzzy) {
          matchQuery.multi_match.fuzziness = 'AUTO';
          matchQuery.multi_match.prefix_length = 2;
        }

        searchQuery.bool.must.push(matchQuery);
      } else {
        searchQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          searchQuery.bool.filter.push({
            terms: { [field]: value }
          });
        } else {
          searchQuery.bool.filter.push({
            term: { [field]: value }
          });
        }
      });

      const searchBody: any = {
        query: searchQuery,
        sort: [{ [opts.sortBy]: { order: opts.sortOrder } }],
        from,
        size: opts.size,
        track_total_hits: true
      };

      if (opts.highlight) {
        searchBody.highlight = {
          fields: {
            content: {
              fragment_size: 100,
              number_of_fragments: 3,
              pre_tags: ['<mark>'],
              post_tags: ['</mark>']
            },
            'author.username': {},
            'author.displayName': {}
          }
        };
      }

      const result = await this.client.search({
        index: 'messages',
        body: searchBody
      });

      const hits = result.body.hits;
      const results = hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
        highlights: hit.highlight || {}
      }));

      logger.debug('Search completed', {
        query,
        total: hits.total.value,
        took: result.body.took,
        page: opts.page,
        size: opts.size
      });

      return {
        results,
        total: hits.total.value,
        took: result.body.took
      };
    }, 'searchMessages');
  }

  async search(
    index: string,
    query: string,
    searchFields: string[],
    filters: any = {},
    options: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      fuzzy?: boolean;
      highlight?: boolean;
    } = {}
  ): Promise<{results: any[], total: number, took: number}> {
    const defaultOptions = {
      page: 1,
      size: 20,
      sortBy: '_score',
      sortOrder: 'desc' as const,
      fuzzy: false,
      highlight: false
    };
    const opts = { ...defaultOptions, ...options };

    return this.executeWithRetry(async () => {
      const from = (opts.page - 1) * opts.size;
      
      const searchQuery: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      if (query.trim()) {
        const matchQuery: any = {
          multi_match: {
            query,
            fields: searchFields,
            type: 'best_fields',
            operator: 'and',
            minimum_should_match: '75%'
          }
        };

        if (opts.fuzzy) {
          matchQuery.multi_match.fuzziness = 'AUTO';
          matchQuery.multi_match.prefix_length = 2;
        }

        searchQuery.bool.must.push(matchQuery);
      } else {
        searchQuery.bool.must.push({ match_all: {} });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          searchQuery.bool.filter.push({
            terms: { [field]: value }
          });
        } else if (value !== undefined && value !== null) {
          searchQuery.bool.filter.push({
            term: { [field]: value }
          });
        }
      });

      const searchBody: any = {
        query: searchQuery,
        sort: [{ [opts.sortBy]: { order: opts.sortOrder } }],
        from,
        size: opts.size,
        track_total_hits: true
      };

      if (opts.highlight) {
        searchBody.highlight = {
          fields: searchFields.reduce((acc, field) => {
            acc[field] = {
              fragment_size: 100,
              number_of_fragments: 3,
              pre_tags: ['<mark>'],
              post_tags: ['</mark>']
            };
            return acc;
          }, {} as any)
        };
      }

      const result = await this.client.search({
        index,
        body: searchBody
      });

      const hits = result.body.hits;
      const results = hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
        highlights: hit.highlight || {}
      }));

      logger.debug(`Search completed in ${index}`, {
        query,
        total: hits.total.value,
        took: result.body.took,
        page: opts.page,
        size: opts.size
      });

      return {
        results,
        total: hits.total.value,
        took: result.body.took
      };
    }, `search-${index}`);
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      try {
        await this.client.delete({
          index,
          id
        });
        
        logger.info(`Document deleted from ${index}`, { id });
      } catch (error: any) {
        if (error.statusCode === 404) {
          logger.debug(`Document not found for deletion`, { index, id });
          return;
        }
        throw error;
      }
    }, `delete-${index}-${id}`);
  }

  async searchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    return this.executeWithRetry(async () => {
      const result = await this.client.search({
        index: 'messages',
        body: {
          query: {
            match: {
              'content.autocomplete': {
                query,
                operator: 'and'
              }
            }
          },
          _source: ['content'],
          size: limit
        }
      });

      const suggestions = result.body.hits.hits
        .map((hit: any) => hit._source.content)
        .filter((content: string, index: number, array: string[]) => 
          array.indexOf(content) === index // Remove duplicates
        );

      return suggestions;
    }, 'searchSuggestions');
  }

  async createIndex(name: string, mapping: any): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const exists = await this.client.indices.exists({ index: name });
      
      if (exists.body) {
        logger.info(`Index ${name} already exists`);
        return true;
      }

      const response = await this.client.indices.create({
        index: name,
        body: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                custom_text_analyzer: {
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'asciifolding',
                    'stop',
                    'snowball'
                  ]
                },
                autocomplete_analyzer: {
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase', 'asciifolding']
                },
                search_analyzer: {
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding']
                }
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 20,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          },
          mappings: mapping
        }
      });

      logger.info(`Index ${name} created successfully`, {
        acknowledged: response.body.acknowledged,
        shardsAcknowledged: response.body.shards_acknowledged
      });

      return true;
    }, 'createIndex');
  }

  async initializeDefaultIndexes(): Promise<void> {
    // Messages index mapping
    const messageMapping = {
      properties: {
        content: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            },
            keyword: {
              type: 'keyword'
            }
          }
        },
        author: {
          properties: {
            id: { type: 'keyword' },
            username: {
              type: 'text',
              analyzer: 'custom_text_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete_analyzer',
                  search_analyzer: 'search_analyzer'
                }
              }
            },
            displayName: {
              type: 'text',
              analyzer: 'custom_text_analyzer'
            }
          }
        },
        channel: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'keyword' },
            serverId: { type: 'keyword' }
          }
        },
        timestamp: {
          type: 'date',
          format: 'strict_date_optional_time||epoch_millis'
        },
        indexed_at: {
          type: 'date',
          format: 'strict_date_optional_time||epoch_millis'
        },
        attachments: {
          type: 'nested',
          properties: {
            filename: { type: 'text' },
            contentType: { type: 'keyword' },
            size: { type: 'long' }
          }
        },
        mentions: {
          type: 'nested',
          properties: {
            userId: { type: 'keyword' },
            username: { type: 'keyword' }
          }
        },
        reactions: {
          type: 'nested',
          properties: {
            emoji: { type: 'keyword' },
            count: { type: 'integer' }
          }
        }
      }
    };

    await this.createIndex('messages', messageMapping);

    // Posts index mapping (Reddit-style)
    const postMapping = {
      properties: {
        title: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            },
            keyword: { type: 'keyword' }
          }
        },
        content: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            }
          }
        },
        author: {
          properties: {
            id: { type: 'keyword' },
            username: {
              type: 'text',
              analyzer: 'custom_text_analyzer',
              fields: { keyword: { type: 'keyword' } }
            },
            displayName: { type: 'text', analyzer: 'custom_text_analyzer' }
          }
        },
        community: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'keyword' },
            displayName: { type: 'text', analyzer: 'custom_text_analyzer' }
          }
        },
        type: { type: 'keyword' }, // text, link, image, video, poll
        score: { type: 'integer' },
        upvotes: { type: 'integer' },
        downvotes: { type: 'integer' },
        commentCount: { type: 'integer' },
        timestamp: { type: 'date', format: 'strict_date_optional_time||epoch_millis' },
        indexed_at: { type: 'date', format: 'strict_date_optional_time||epoch_millis' },
        tags: { type: 'keyword' },
        isNsfw: { type: 'boolean' },
        isStickied: { type: 'boolean' },
        isLocked: { type: 'boolean' }
      }
    };

    await this.createIndex('posts', postMapping);

    // Users index mapping
    const userMapping = {
      properties: {
        username: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            },
            keyword: { type: 'keyword' }
          }
        },
        displayName: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            }
          }
        },
        bio: {
          type: 'text',
          analyzer: 'custom_text_analyzer'
        },
        isVerified: { type: 'boolean' },
        isBot: { type: 'boolean' },
        createdAt: { type: 'date', format: 'strict_date_optional_time||epoch_millis' },
        lastSeenAt: { type: 'date', format: 'strict_date_optional_time||epoch_millis' },
        indexed_at: { type: 'date', format: 'strict_date_optional_time||epoch_millis' }
      }
    };

    await this.createIndex('users', userMapping);

    // Communities index mapping
    const communityMapping = {
      properties: {
        name: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            },
            keyword: { type: 'keyword' }
          }
        },
        displayName: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            }
          }
        },
        description: {
          type: 'text',
          analyzer: 'custom_text_analyzer'
        },
        memberCount: { type: 'integer' },
        isPublic: { type: 'boolean' },
        isNsfw: { type: 'boolean' },
        category: { type: 'keyword' },
        tags: { type: 'keyword' },
        createdAt: { type: 'date', format: 'strict_date_optional_time||epoch_millis' },
        indexed_at: { type: 'date', format: 'strict_date_optional_time||epoch_millis' }
      }
    };

    await this.createIndex('communities', communityMapping);

    // Servers index mapping (Discord-style)
    const serverMapping = {
      properties: {
        name: {
          type: 'text',
          analyzer: 'custom_text_analyzer',
          fields: {
            autocomplete: {
              type: 'text',
              analyzer: 'autocomplete_analyzer',
              search_analyzer: 'search_analyzer'
            },
            keyword: { type: 'keyword' }
          }
        },
        description: {
          type: 'text',
          analyzer: 'custom_text_analyzer'
        },
        memberCount: { type: 'integer' },
        isPublic: { type: 'boolean' },
        features: { type: 'keyword' },
        categories: { type: 'keyword' },
        createdAt: { type: 'date', format: 'strict_date_optional_time||epoch_millis' },
        indexed_at: { type: 'date', format: 'strict_date_optional_time||epoch_millis' }
      }
    };

    await this.createIndex('servers', serverMapping);

    logger.info('✅ All Elasticsearch indexes initialized successfully');
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (this.isCircuitBreakerOpen()) {
      throw new Error(`Circuit breaker is open - ${operationName} unavailable`);
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        this.handleSuccessfulRequest();
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt <= this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff with max 10s
          
          logger.warn(`${operationName} failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries: this.maxRetries,
            error: error instanceof Error ? error.message : error
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.handleConnectionError(error);
        }
      }
    }
    
    throw lastError;
  }

  async getClusterStats(): Promise<any> {
    return this.executeWithRetry(async () => {
      const stats = await this.client.cluster.stats();
      return stats.body;
    }, 'getClusterStats');
  }

  async getIndexStats(index: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const stats = await this.client.indices.stats({ index });
      return stats.body;
    }, 'getIndexStats');
  }

  getConnectionStatus(): {
    isConnected: boolean;
    circuitBreakerState: string;
    failures: number;
    nodes: string[];
  } {
    return {
      isConnected: this.isConnected,
      circuitBreakerState: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      nodes: this.config.nodes
    };
  }

  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    try {
      await this.client.close();
      logger.info('Elasticsearch client closed successfully');
    } catch (error) {
      logger.error('Error closing Elasticsearch client:', error);
    }
  }
}