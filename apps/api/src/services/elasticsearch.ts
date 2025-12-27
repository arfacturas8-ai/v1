import { Client } from '@elastic/elasticsearch';

export interface ElasticsearchConfig {
  node: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export interface SearchOptions {
  page?: number;
  size?: number;
  fuzzy?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  results: any[];
  total: number;
  took: number;
  page?: number;
  size?: number;
}

export class ElasticsearchService {
  private client: Client;
  private isConnected = false;

  constructor(config: ElasticsearchConfig) {
    this.client = new Client({
      node: config.node,
      auth: config.username && config.password ? {
        username: config.username,
        password: config.password,
      } : undefined,
      tls: config.ssl ? {
        rejectUnauthorized: false
      } : undefined,
      // Fix for ES client v9 connecting to ES server v8
      capiVersion: '8'
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.ping();
      this.isConnected = true;
      console.log('✅ Elasticsearch connected successfully');
    } catch (error) {
      console.warn('⚠️ Elasticsearch connection failed:', error);
      this.isConnected = false;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async indexMessage(messageId: string, content: string, metadata: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.index({
        index: 'messages',
        id: messageId,
        body: {
          content,
          content_suggest: {
            input: content.split(' ').slice(0, 10), // First 10 words for suggestions
            weight: 1
          },
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to index message:', error);
    }
  }

  async indexDirectMessage(messageId: string, content: string, metadata: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.index({
        index: 'direct_messages',
        id: messageId,
        body: {
          content,
          content_suggest: {
            input: content.split(' ').slice(0, 10),
            weight: 1
          },
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to index direct message:', error);
    }
  }

  async searchMessages(query: string, filters: any = {}, options: SearchOptions = {}): Promise<SearchResult> {
    if (!this.isConnected) return { results: [], total: 0, took: 0 };

    const { page = 1, size = 20, fuzzy = false, sortBy = 'timestamp', sortOrder = 'desc' } = options;
    const from = (page - 1) * size;

    try {
      const searchQuery: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      // Add main query
      if (fuzzy) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['content^2', 'user.username', 'user.displayName'],
            fuzziness: 'AUTO',
            prefix_length: 2
          }
        });
      } else {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['content^2', 'user.username', 'user.displayName'],
            type: 'best_fields'
          }
        });
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          searchQuery.bool.filter.push({
            term: { [field]: value }
          });
        }
      });

      const result = await this.client.search({
        index: 'messages',
        body: {
          query: searchQuery,
          sort: [{ [sortBy]: { order: sortOrder } }],
          from,
          size,
          highlight: {
            fields: {
              content: {},
              'user.username': {},
              'user.displayName': {}
            }
          }
        }
      });

      const hits = result.body.hits;
      return {
        results: hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          highlight: hit.highlight,
          ...hit._source
        })),
        total: hits.total?.value || hits.total || 0,
        took: result.body.took,
        page,
        size
      };
    } catch (error) {
      console.error('Message search failed:', error);
      return { results: [], total: 0, took: 0 };
    }
  }

  async createIndex(name: string, mapping: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      const exists = await this.client.indices.exists({ index: name });
      if (exists) {
        // Index already exists, skip creation
        return;
      }

      await this.client.indices.create({
        index: name,
        body: {
          mappings: mapping
        }
      });
    } catch (error: any) {
      // Ignore "index already exists" errors - they're harmless
      const errorString = String(error);
      if (errorString.includes('resource_already_exists_exception') || errorString.includes('already exists')) {
        return;
      }
      console.error(`Failed to create index ${name}:`, error);
    }
  }

  async searchUsers(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    if (!this.isConnected) return { results: [], total: 0, took: 0 };

    const { page = 1, size = 20, fuzzy = false } = options;
    const from = (page - 1) * size;

    try {
      const searchQuery: any = {
        bool: {
          must: []
        }
      };

      if (fuzzy) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['username^3', 'displayName^2', 'bio'],
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['username^3', 'displayName^2', 'bio'],
            type: 'best_fields'
          }
        });
      }

      const result = await this.client.search({
        index: 'users',
        body: {
          query: searchQuery,
          sort: [{ _score: { order: 'desc' } }],
          from,
          size,
          highlight: {
            fields: {
              username: {},
              displayName: {},
              bio: {}
            }
          }
        }
      });

      const hits = result.body.hits;
      return {
        results: hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          highlight: hit.highlight,
          ...hit._source
        })),
        total: hits.total?.value || hits.total || 0,
        took: result.body.took,
        page,
        size
      };
    } catch (error) {
      console.error('User search failed:', error);
      return { results: [], total: 0, took: 0 };
    }
  }

  async searchPosts(query: string, filters: any = {}, options: SearchOptions = {}): Promise<SearchResult> {
    if (!this.isConnected) return { results: [], total: 0, took: 0 };

    const { page = 1, size = 20, fuzzy = false, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const from = (page - 1) * size;

    try {
      const searchQuery: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      if (fuzzy) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['title^3', 'content^2', 'user.username'],
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['title^3', 'content^2', 'user.username'],
            type: 'best_fields'
          }
        });
      }

      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          searchQuery.bool.filter.push({
            term: { [field]: value }
          });
        }
      });

      const result = await this.client.search({
        index: 'posts',
        body: {
          query: searchQuery,
          sort: [{ [sortBy]: { order: sortOrder } }],
          from,
          size,
          highlight: {
            fields: {
              title: {},
              content: {},
              'user.username': {}
            }
          }
        }
      });

      const hits = result.body.hits;
      return {
        results: hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          highlight: hit.highlight,
          ...hit._source
        })),
        total: hits.total?.value || hits.total || 0,
        took: result.body.took,
        page,
        size
      };
    } catch (error) {
      console.error('Post search failed:', error);
      return { results: [], total: 0, took: 0 };
    }
  }

  async indexUser(userId: string, userData: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.index({
        index: 'users',
        id: userId,
        body: {
          ...userData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to index user:', error);
    }
  }

  async indexPost(postId: string, postData: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.index({
        index: 'posts',
        id: postId,
        body: {
          ...postData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to index post:', error);
    }
  }

  async initializeIndexes(): Promise<void> {
    if (!this.isConnected) return;

    // Messages index mapping
    const messageMapping = {
      properties: {
        content: { 
          type: 'text',
          analyzer: 'standard',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        content_suggest: {
          type: 'completion'
        },
        user: {
          properties: {
            id: { type: 'keyword' },
            username: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            },
            displayName: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
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
        mentions: { type: 'nested' },
        attachments: { type: 'nested' },
        reactions: { type: 'nested' },
        timestamp: { type: 'date' },
        createdAt: { type: 'date' }
      }
    };

    // Direct Messages index mapping
    const directMessageMapping = {
      properties: {
        content: { 
          type: 'text',
          analyzer: 'standard',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        content_suggest: {
          type: 'completion'
        },
        author: {
          properties: {
            id: { type: 'keyword' },
            username: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            },
            displayName: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            }
          }
        },
        conversation: {
          properties: {
            id: { type: 'keyword' },
            type: { type: 'keyword' },
            participants: { type: 'keyword' }
          }
        },
        attachments: { type: 'nested' },
        timestamp: { type: 'date' },
        createdAt: { type: 'date' }
      }
    };

    // Users index mapping
    const userMapping = {
      properties: {
        username: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } }
        },
        displayName: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } }
        },
        bio: { type: 'text' },
        isVerified: { type: 'boolean' },
        isBot: { type: 'boolean' },
        premiumType: { type: 'keyword' },
        servers: { type: 'keyword' },
        friends: { type: 'keyword' },
        timestamp: { type: 'date' },
        createdAt: { type: 'date' }
      }
    };

    // Posts index mapping
    const postMapping = {
      properties: {
        title: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } }
        },
        content: { type: 'text' },
        user: {
          properties: {
            id: { type: 'keyword' },
            username: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            },
            displayName: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            }
          }
        },
        community: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'keyword' },
            displayName: { type: 'text' }
          }
        },
        score: { type: 'integer' },
        viewCount: { type: 'integer' },
        commentCount: { type: 'integer' },
        type: { type: 'keyword' },
        tags: { type: 'keyword' },
        timestamp: { type: 'date' },
        createdAt: { type: 'date' }
      }
    };

    // Servers index mapping
    const serverMapping = {
      properties: {
        name: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } }
        },
        description: { type: 'text' },
        owner: {
          properties: {
            id: { type: 'keyword' },
            username: { type: 'keyword' }
          }
        },
        isPublic: { type: 'boolean' },
        memberCount: { type: 'integer' },
        categories: { type: 'keyword' },
        tags: { type: 'keyword' },
        timestamp: { type: 'date' },
        createdAt: { type: 'date' }
      }
    };

    // Communities index mapping
    const communityMapping = {
      properties: {
        name: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } }
        },
        displayName: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } }
        },
        description: { type: 'text' },
        isPublic: { type: 'boolean' },
        memberCount: { type: 'integer' },
        postCount: { type: 'integer' },
        categories: { type: 'keyword' },
        tags: { type: 'keyword' },
        timestamp: { type: 'date' },
        createdAt: { type: 'date' }
      }
    };

    await Promise.all([
      this.createIndex('messages', messageMapping),
      this.createIndex('direct_messages', directMessageMapping),
      this.createIndex('users', userMapping),
      this.createIndex('posts', postMapping),
      this.createIndex('servers', serverMapping),
      this.createIndex('communities', communityMapping)
    ]);
  }

  /**
   * Advanced search across all content types
   */
  async globalSearch(query: string, filters: any = {}, options: SearchOptions = {}): Promise<{
    users: SearchResult;
    posts: SearchResult;
    messages: SearchResult;
    servers: SearchResult;
    communities: SearchResult;
    suggestions: string[];
  }> {
    if (!this.isConnected) {
      return {
        users: { results: [], total: 0, took: 0 },
        posts: { results: [], total: 0, took: 0 },
        messages: { results: [], total: 0, took: 0 },
        servers: { results: [], total: 0, took: 0 },
        communities: { results: [], total: 0, took: 0 },
        suggestions: []
      };
    }

    const { page = 1, size = 10, fuzzy = false } = options;

    try {
      const [users, posts, messages, servers, communities, suggestions] = await Promise.all([
        this.searchUsers(query, { ...options, size }),
        this.searchPosts(query, filters, { ...options, size }),
        this.searchMessages(query, filters, { ...options, size }),
        this.searchServers(query, { ...options, size }),
        this.searchCommunities(query, { ...options, size }),
        this.getSuggestions(query, 5)
      ]);

      return {
        users,
        posts,
        messages,
        servers,
        communities,
        suggestions
      };
    } catch (error) {
      console.error('Global search failed:', error);
      return {
        users: { results: [], total: 0, took: 0 },
        posts: { results: [], total: 0, took: 0 },
        messages: { results: [], total: 0, took: 0 },
        servers: { results: [], total: 0, took: 0 },
        communities: { results: [], total: 0, took: 0 },
        suggestions: []
      };
    }
  }

  /**
   * Search servers
   */
  async searchServers(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    if (!this.isConnected) return { results: [], total: 0, took: 0 };

    const { page = 1, size = 20, fuzzy = false } = options;
    const from = (page - 1) * size;

    try {
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [
            { term: { isPublic: true } } // Only public servers
          ]
        }
      };

      if (fuzzy) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['name^3', 'description^2'],
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['name^3', 'description^2'],
            type: 'best_fields'
          }
        });
      }

      const result = await this.client.search({
        index: 'servers',
        body: {
          query: searchQuery,
          sort: [
            { memberCount: { order: 'desc' } },
            { _score: { order: 'desc' } }
          ],
          from,
          size,
          highlight: {
            fields: {
              name: {},
              description: {}
            }
          }
        }
      });

      const hits = result.body.hits;
      return {
        results: hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          highlight: hit.highlight,
          ...hit._source
        })),
        total: hits.total?.value || hits.total || 0,
        took: result.body.took,
        page,
        size
      };
    } catch (error) {
      console.error('Server search failed:', error);
      return { results: [], total: 0, took: 0 };
    }
  }

  /**
   * Search communities
   */
  async searchCommunities(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    if (!this.isConnected) return { results: [], total: 0, took: 0 };

    const { page = 1, size = 20, fuzzy = false } = options;
    const from = (page - 1) * size;

    try {
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [
            { term: { isPublic: true } } // Only public communities
          ]
        }
      };

      if (fuzzy) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['name^3', 'displayName^3', 'description^2'],
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['name^3', 'displayName^3', 'description^2'],
            type: 'best_fields'
          }
        });
      }

      const result = await this.client.search({
        index: 'communities',
        body: {
          query: searchQuery,
          sort: [
            { memberCount: { order: 'desc' } },
            { _score: { order: 'desc' } }
          ],
          from,
          size,
          highlight: {
            fields: {
              name: {},
              displayName: {},
              description: {}
            }
          }
        }
      });

      const hits = result.body.hits;
      return {
        results: hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          highlight: hit.highlight,
          ...hit._source
        })),
        total: hits.total?.value || hits.total || 0,
        took: result.body.took,
        page,
        size
      };
    } catch (error) {
      console.error('Community search failed:', error);
      return { results: [], total: 0, took: 0 };
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string, size: number = 5): Promise<string[]> {
    if (!this.isConnected) return [];

    try {
      const result = await this.client.search({
        index: ['messages', 'posts', 'users'],
        body: {
          suggest: {
            content_suggest: {
              prefix: query,
              completion: {
                field: 'content_suggest',
                size
              }
            }
          }
        }
      });

      const suggestions = result.body.suggest?.content_suggest?.[0]?.options || [];
      return suggestions.map((suggestion: any) => suggestion.text);
    } catch (error) {
      console.error('Suggestions failed:', error);
      return [];
    }
  }

  /**
   * Search direct messages for a user
   */
  async searchDirectMessages(query: string, userId: string, conversationIds: string[] = [], options: SearchOptions = {}): Promise<SearchResult> {
    if (!this.isConnected) return { results: [], total: 0, took: 0 };

    const { page = 1, size = 20, fuzzy = false, sortBy = 'timestamp', sortOrder = 'desc' } = options;
    const from = (page - 1) * size;

    try {
      const searchQuery: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      // Add main query
      if (fuzzy) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['content^2', 'author.username', 'author.displayName'],
            fuzziness: 'AUTO',
            prefix_length: 2
          }
        });
      } else {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['content^2', 'author.username', 'author.displayName'],
            type: 'best_fields'
          }
        });
      }

      // Filter by conversation access (user must be participant)
      if (conversationIds.length > 0) {
        searchQuery.bool.filter.push({
          terms: { 'conversation.id': conversationIds }
        });
      }

      const result = await this.client.search({
        index: 'direct_messages',
        body: {
          query: searchQuery,
          sort: [{ [sortBy]: { order: sortOrder } }],
          from,
          size,
          highlight: {
            fields: {
              content: {},
              'author.username': {},
              'author.displayName': {}
            }
          }
        }
      });

      const hits = result.body.hits;
      return {
        results: hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          highlight: hit.highlight,
          ...hit._source
        })),
        total: hits.total?.value || hits.total || 0,
        took: result.body.took,
        page,
        size
      };
    } catch (error) {
      console.error('Direct message search failed:', error);
      return { results: [], total: 0, took: 0 };
    }
  }

  /**
   * Index server data
   */
  async indexServer(serverId: string, serverData: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.index({
        index: 'servers',
        id: serverId,
        body: {
          ...serverData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to index server:', error);
    }
  }

  /**
   * Index community data
   */
  async indexCommunity(communityId: string, communityData: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.index({
        index: 'communities',
        id: communityId,
        body: {
          ...communityData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to index community:', error);
    }
  }

  /**
   * Delete document from index
   */
  async deleteDocument(index: string, documentId: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.delete({
        index,
        id: documentId
      });
    } catch (error) {
      console.error(`Failed to delete document ${documentId} from ${index}:`, error);
    }
  }

  /**
   * Bulk index operation
   */
  async bulkIndex(operations: Array<{
    index: string;
    id: string;
    body: any;
  }>): Promise<void> {
    if (!this.isConnected || operations.length === 0) return;

    try {
      const body = operations.flatMap(op => [
        { index: { _index: op.index, _id: op.id } },
        { ...op.body, timestamp: new Date().toISOString() }
      ]);

      await this.client.bulk({ body });
    } catch (error) {
      console.error('Bulk index operation failed:', error);
    }
  }
}
