import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

export interface IndexMapping {
  properties: Record<string, any>;
  settings?: Record<string, any>;
  aliases?: Record<string, any>;
}

export interface IndexTemplate {
  name: string;
  pattern: string;
  mapping: IndexMapping;
  lifecycle?: {
    rollover?: {
      maxSize?: string;
      maxAge?: string;
      maxDocs?: number;
    };
    delete?: {
      minAge?: string;
    };
  };
}

export class SearchIndexManager {
  private esClient: Client;
  private indexPrefix: string;

  constructor(esClient: Client, indexPrefix: string = 'cryb') {
    this.esClient = esClient;
    this.indexPrefix = indexPrefix;
  }

  /**
   * Initialize all search indexes with optimized mappings
   */
  async initializeAllIndexes(): Promise<void> {
    try {
      logger.info('🔍 Initializing search indexes...');

      const indexes = [
        this.getPostsIndexConfig(),
        this.getUsersIndexConfig(),
        this.getCommunitiesIndexConfig(),
        this.getServersIndexConfig(),
        this.getMessagesIndexConfig(),
        this.getSearchAnalyticsIndexConfig()
      ];

      for (const indexConfig of indexes) {
        await this.createOrUpdateIndex(indexConfig);
      }

      // Create index templates for time-series data
      await this.createIndexTemplates();

      // Setup index lifecycle policies
      await this.setupIndexLifecyclePolicies();

      logger.info('✅ All search indexes initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize search indexes:', error);
      throw error;
    }
  }

  /**
   * Posts index configuration with advanced text analysis
   */
  private getPostsIndexConfig(): { name: string; config: any } {
    return {
      name: `${this.indexPrefix}_posts`,
      config: {
        settings: {
          number_of_shards: 2,
          number_of_replicas: 1,
          index: {
            max_result_window: 50000,
            refresh_interval: '5s',
            'query.default_field': ['title^3', 'content^2'],
            'highlight.max_analyzed_offset': 1000000
          },
          analysis: {
            analyzer: {
              content_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: [
                  'lowercase',
                  'asciifolding',
                  'stop',
                  'stemmer',
                  'synonym_filter',
                  'edge_ngram_filter'
                ]
              },
              search_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: [
                  'lowercase',
                  'asciifolding',
                  'stop',
                  'stemmer',
                  'synonym_filter'
                ]
              },
              tag_analyzer: {
                type: 'custom',
                tokenizer: 'keyword',
                filter: ['lowercase', 'trim']
              }
            },
            filter: {
              edge_ngram_filter: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 20
              },
              synonym_filter: {
                type: 'synonym',
                synonyms: [
                  'js,javascript,ecmascript',
                  'py,python',
                  'cpp,c++',
                  'programming,coding,development',
                  'ai,artificial intelligence,machine learning,ml',
                  'crypto,cryptocurrency,bitcoin,blockchain'
                ]
              }
            }
          }
        },
        mappings: {
          dynamic: 'strict',
          properties: {
            title: {
              type: 'text',
              analyzer: 'content_analyzer',
              search_analyzer: 'search_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: {
                  type: 'completion',
                  contexts: [
                    { name: 'category', type: 'category' },
                    { name: 'community', type: 'category' }
                  ]
                },
                raw: { type: 'text', index: false }
              }
            },
            content: {
              type: 'text',
              analyzer: 'content_analyzer',
              search_analyzer: 'search_analyzer',
              fields: {
                raw: { type: 'text', index: false }
              }
            },
            type: {
              type: 'keyword',
              fields: {
                text: { type: 'text' }
              }
            },
            url: {
              type: 'keyword',
              index: false
            },
            tags: {
              type: 'keyword',
              analyzer: 'tag_analyzer',
              fields: {
                text: {
                  type: 'text',
                  analyzer: 'content_analyzer'
                }
              }
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'keyword' },
                username: {
                  type: 'text',
                  analyzer: 'content_analyzer',
                  fields: { keyword: { type: 'keyword' } }
                },
                displayName: {
                  type: 'text',
                  analyzer: 'content_analyzer'
                },
                reputation: { type: 'integer' },
                verified: { type: 'boolean' },
                avatar: { type: 'keyword', index: false }
              }
            },
            community: {
              type: 'object',
              properties: {
                id: { type: 'keyword' },
                name: { type: 'keyword' },
                displayName: {
                  type: 'text',
                  analyzer: 'content_analyzer'
                },
                category: { type: 'keyword' },
                memberCount: { type: 'integer' }
              }
            },
            // Engagement metrics
            score: { type: 'integer' },
            upvotes: { type: 'integer' },
            downvotes: { type: 'integer' },
            viewCount: { type: 'long' },
            commentCount: { type: 'integer' },
            shareCount: { type: 'integer' },
            
            // ML-powered scores
            popularityScore: { type: 'float' },
            qualityScore: { type: 'float' },
            engagementScore: { type: 'float' },
            freshnessScore: { type: 'float' },
            relevanceBoost: { type: 'float' },
            
            // Content flags
            isNsfw: { type: 'boolean' },
            isStickied: { type: 'boolean' },
            isLocked: { type: 'boolean' },
            isRemoved: { type: 'boolean' },
            
            // Timestamps
            createdAt: { type: 'date' },
            editedAt: { type: 'date' },
            indexedAt: { type: 'date' },
            
            // Location data (if applicable)
            location: {
              type: 'geo_point'
            },
            
            // Attachments/media
            hasImage: { type: 'boolean' },
            hasVideo: { type: 'boolean' },
            hasAudio: { type: 'boolean' },
            mediaCount: { type: 'integer' },
            
            // Advanced features
            language: { type: 'keyword' },
            sentiment: { type: 'float' },
            readingTime: { type: 'integer' }, // in seconds
            
            // Search optimization
            searchKeywords: {
              type: 'text',
              analyzer: 'content_analyzer',
              search_analyzer: 'search_analyzer'
            }
          }
        }
      }
    };
  }

  /**
   * Users index configuration
   */
  private getUsersIndexConfig(): { name: string; config: any } {
    return {
      name: `${this.indexPrefix}_users`,
      config: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
          analysis: {
            analyzer: {
              username_analyzer: {
                type: 'custom',
                tokenizer: 'keyword',
                filter: ['lowercase', 'trim']
              },
              profile_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding', 'stop']
              }
            }
          }
        },
        mappings: {
          dynamic: 'strict',
          properties: {
            username: {
              type: 'text',
              analyzer: 'username_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' },
                ngram: {
                  type: 'text',
                  analyzer: 'profile_analyzer'
                }
              }
            },
            displayName: {
              type: 'text',
              analyzer: 'profile_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' }
              }
            },
            bio: {
              type: 'text',
              analyzer: 'profile_analyzer'
            },
            email: {
              type: 'keyword',
              index: false // For privacy
            },
            avatar: { type: 'keyword', index: false },
            banner: { type: 'keyword', index: false },
            
            // Profile metrics
            reputation: { type: 'integer' },
            postCount: { type: 'integer' },
            commentCount: { type: 'integer' },
            followerCount: { type: 'integer' },
            followingCount: { type: 'integer' },
            
            // Profile flags
            isVerified: { type: 'boolean' },
            isBot: { type: 'boolean' },
            isPremium: { type: 'boolean' },
            
            // Activity metrics
            lastSeenAt: { type: 'date' },
            activityScore: { type: 'float' },
            engagementScore: { type: 'float' },
            
            // User preferences (for personalization)
            interests: { type: 'keyword' },
            preferredLanguages: { type: 'keyword' },
            timezone: { type: 'keyword' },
            
            // Account info
            createdAt: { type: 'date' },
            bannedAt: { type: 'date' },
            suspendedAt: { type: 'date' },
            
            // Location (if public)
            location: {
              type: 'geo_point'
            },
            country: { type: 'keyword' },
            
            // Search optimization
            searchableContent: {
              type: 'text',
              analyzer: 'profile_analyzer'
            }
          }
        }
      }
    };
  }

  /**
   * Communities index configuration
   */
  private getCommunitiesIndexConfig(): { name: string; config: any } {
    return {
      name: `${this.indexPrefix}_communities`,
      config: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
          analysis: {
            analyzer: {
              community_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding', 'stop', 'stemmer']
              }
            }
          }
        },
        mappings: {
          dynamic: 'strict',
          properties: {
            name: {
              type: 'text',
              analyzer: 'community_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' }
              }
            },
            displayName: {
              type: 'text',
              analyzer: 'community_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' }
              }
            },
            description: {
              type: 'text',
              analyzer: 'community_analyzer'
            },
            rules: {
              type: 'text',
              analyzer: 'community_analyzer',
              index: false
            },
            
            // Community metadata
            category: { type: 'keyword' },
            subcategory: { type: 'keyword' },
            tags: { type: 'keyword' },
            language: { type: 'keyword' },
            
            // Community metrics
            memberCount: { type: 'integer' },
            activeMembers: { type: 'integer' },
            postCount: { type: 'integer' },
            dailyPostCount: { type: 'integer' },
            weeklyPostCount: { type: 'integer' },
            
            // Community flags
            isPublic: { type: 'boolean' },
            isNsfw: { type: 'boolean' },
            isOfficial: { type: 'boolean' },
            requiresApproval: { type: 'boolean' },
            
            // Growth metrics
            growthRate: { type: 'float' },
            activityScore: { type: 'float' },
            qualityScore: { type: 'float' },
            
            // Moderator info
            moderatorCount: { type: 'integer' },
            
            // Timestamps
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            
            // Visual assets
            icon: { type: 'keyword', index: false },
            banner: { type: 'keyword', index: false },
            
            // Location (for local communities)
            location: {
              type: 'geo_point'
            },
            
            // Search optimization
            searchKeywords: {
              type: 'text',
              analyzer: 'community_analyzer'
            }
          }
        }
      }
    };
  }

  /**
   * Discord-style servers index configuration
   */
  private getServersIndexConfig(): { name: string; config: any } {
    return {
      name: `${this.indexPrefix}_servers`,
      config: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
          analysis: {
            analyzer: {
              server_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding', 'stop']
              }
            }
          }
        },
        mappings: {
          dynamic: 'strict',
          properties: {
            name: {
              type: 'text',
              analyzer: 'server_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' }
              }
            },
            description: {
              type: 'text',
              analyzer: 'server_analyzer'
            },
            
            // Server metadata
            features: { type: 'keyword' },
            categories: { type: 'keyword' },
            tags: { type: 'keyword' },
            language: { type: 'keyword' },
            
            // Server metrics
            memberCount: { type: 'integer' },
            channelCount: { type: 'integer' },
            messageCount: { type: 'long' },
            voiceChannelCount: { type: 'integer' },
            
            // Server flags
            isPublic: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            isPartnered: { type: 'boolean' },
            hasVoice: { type: 'boolean' },
            
            // Activity metrics
            activityScore: { type: 'float' },
            popularityScore: { type: 'float' },
            
            // Owner info
            owner: {
              type: 'object',
              properties: {
                id: { type: 'keyword' },
                username: { type: 'keyword' }
              }
            },
            
            // Timestamps
            createdAt: { type: 'date' },
            
            // Visual assets
            icon: { type: 'keyword', index: false },
            banner: { type: 'keyword', index: false },
            
            // Search optimization
            searchableContent: {
              type: 'text',
              analyzer: 'server_analyzer'
            }
          }
        }
      }
    };
  }

  /**
   * Messages index configuration (time-series optimized)
   */
  private getMessagesIndexConfig(): { name: string; config: any } {
    return {
      name: `${this.indexPrefix}_messages`,
      config: {
        settings: {
          number_of_shards: 3, // More shards for high volume
          number_of_replicas: 1,
          index: {
            refresh_interval: '1s', // Near real-time
            'codec': 'best_compression'
          },
          analysis: {
            analyzer: {
              message_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding', 'stop']
              }
            }
          }
        },
        mappings: {
          dynamic: 'strict',
          properties: {
            content: {
              type: 'text',
              analyzer: 'message_analyzer',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            
            // Message metadata
            type: { type: 'keyword' }, // text, image, video, etc.
            edited: { type: 'boolean' },
            pinned: { type: 'boolean' },
            
            // Author info
            author: {
              type: 'object',
              properties: {
                id: { type: 'keyword' },
                username: { type: 'keyword' },
                displayName: { type: 'text', index: false },
                avatar: { type: 'keyword', index: false },
                bot: { type: 'boolean' }
              }
            },
            
            // Channel/Server info
            channel: {
              type: 'object',
              properties: {
                id: { type: 'keyword' },
                name: { type: 'keyword' },
                type: { type: 'keyword' },
                serverId: { type: 'keyword' }
              }
            },
            
            // Message interactions
            reactions: {
              type: 'nested',
              properties: {
                emoji: { type: 'keyword' },
                count: { type: 'integer' },
                users: { type: 'keyword' }
              }
            },
            
            mentions: {
              type: 'nested',
              properties: {
                userId: { type: 'keyword' },
                username: { type: 'keyword' },
                type: { type: 'keyword' } // user, role, channel
              }
            },
            
            // Attachments
            attachments: {
              type: 'nested',
              properties: {
                filename: { type: 'text', index: false },
                contentType: { type: 'keyword' },
                size: { type: 'long' },
                url: { type: 'keyword', index: false }
              }
            },
            
            // Embeds
            embeds: {
              type: 'nested',
              properties: {
                title: { type: 'text' },
                description: { type: 'text' },
                url: { type: 'keyword', index: false },
                type: { type: 'keyword' }
              }
            },
            
            // Thread info (if applicable)
            thread: {
              type: 'object',
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text' },
                messageCount: { type: 'integer' }
              }
            },
            
            // Timestamps
            timestamp: { type: 'date' },
            editedTimestamp: { type: 'date' },
            
            // Message flags
            deleted: { type: 'boolean' },
            
            // Content analysis
            language: { type: 'keyword' },
            sentiment: { type: 'float' },
            toxicity: { type: 'float' },
            
            // Search optimization
            searchableText: {
              type: 'text',
              analyzer: 'message_analyzer'
            }
          }
        }
      }
    };
  }

  /**
   * Search analytics index configuration (TimescaleDB-style)
   */
  private getSearchAnalyticsIndexConfig(): { name: string; config: any } {
    return {
      name: `${this.indexPrefix}_search_analytics`,
      config: {
        settings: {
          number_of_shards: 2,
          number_of_replicas: 0, // Analytics data doesn't need high availability
          index: {
            refresh_interval: '30s', // Less frequent refresh for analytics
            'codec': 'best_compression'
          }
        },
        mappings: {
          dynamic: 'strict',
          properties: {
            query: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            type: { type: 'keyword' },
            userId: { type: 'keyword' },
            serverId: { type: 'keyword' },
            communityId: { type: 'keyword' },
            resultCount: { type: 'integer' },
            responseTimeMs: { type: 'integer' },
            searchEngine: { type: 'keyword' },
            success: { type: 'boolean' },
            clicked: { type: 'boolean' },
            clickPosition: { type: 'integer' },
            timestamp: { type: 'date' },
            userAgent: { type: 'keyword' },
            ipAddress: { type: 'ip' },
            sessionId: { type: 'keyword' },
            filters: { type: 'object' },
            source: { type: 'keyword' }
          }
        }
      }
    };
  }

  /**
   * Create or update an index with the given configuration
   */
  private async createOrUpdateIndex(indexConfig: { name: string; config: any }): Promise<void> {
    try {
      const { name, config } = indexConfig;
      
      // Check if index exists
      const exists = await this.esClient.indices.exists({ index: name });
      
      if (exists.body) {
        logger.info(`Index ${name} already exists, checking if update needed...`);
        
        // In production, you might want to check mapping differences
        // and perform rolling updates if necessary
        await this.updateIndexIfNeeded(name, config);
      } else {
        // Create new index
        await this.esClient.indices.create({
          index: name,
          body: config
        });
        
        logger.info(`✅ Created index: ${name}`);
      }
      
    } catch (error) {
      logger.error(`Failed to create/update index ${indexConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Update index mapping if needed (for existing indexes)
   */
  private async updateIndexIfNeeded(indexName: string, newConfig: any): Promise<void> {
    try {
      // Update settings that can be updated on existing index
      const updateableSettings = {
        'index.refresh_interval': newConfig.settings?.index?.refresh_interval,
        'index.max_result_window': newConfig.settings?.index?.max_result_window
      };

      // Remove undefined values
      Object.keys(updateableSettings).forEach(key => {
        if (updateableSettings[key as keyof typeof updateableSettings] === undefined) {
          delete updateableSettings[key as keyof typeof updateableSettings];
        }
      });

      if (Object.keys(updateableSettings).length > 0) {
        await this.esClient.indices.putSettings({
          index: indexName,
          body: {
            settings: updateableSettings
          }
        });
        
        logger.info(`Updated settings for index: ${indexName}`);
      }

      // Add new field mappings (cannot modify existing ones)
      try {
        await this.esClient.indices.putMapping({
          index: indexName,
          body: newConfig.mappings
        });
        
        logger.info(`Updated mapping for index: ${indexName}`);
      } catch (mappingError) {
        // Mapping conflicts are expected when trying to update existing fields
        logger.debug(`Mapping update skipped for ${indexName} (likely due to existing fields)`);
      }
      
    } catch (error) {
      logger.warn(`Failed to update index ${indexName}:`, error);
    }
  }

  /**
   * Create index templates for time-series data
   */
  private async createIndexTemplates(): Promise<void> {
    const templates: IndexTemplate[] = [
      {
        name: `${this.indexPrefix}_messages_template`,
        pattern: `${this.indexPrefix}_messages_*`,
        mapping: this.getMessagesIndexConfig().config,
        lifecycle: {
          rollover: {
            maxSize: '10GB',
            maxAge: '30d'
          },
          delete: {
            minAge: '365d'
          }
        }
      },
      {
        name: `${this.indexPrefix}_analytics_template`,
        pattern: `${this.indexPrefix}_search_analytics_*`,
        mapping: this.getSearchAnalyticsIndexConfig().config,
        lifecycle: {
          rollover: {
            maxSize: '5GB',
            maxAge: '7d'
          },
          delete: {
            minAge: '90d'
          }
        }
      }
    ];

    for (const template of templates) {
      try {
        await this.esClient.indices.putIndexTemplate({
          name: template.name,
          body: {
            index_patterns: [template.pattern],
            template: {
              settings: template.mapping.settings,
              mappings: template.mapping.mappings
            },
            priority: 100
          }
        });
        
        logger.info(`✅ Created index template: ${template.name}`);
      } catch (error) {
        logger.error(`Failed to create index template ${template.name}:`, error);
      }
    }
  }

  /**
   * Setup index lifecycle management policies
   */
  private async setupIndexLifecyclePolicies(): Promise<void> {
    const policies = [
      {
        name: `${this.indexPrefix}_messages_policy`,
        policy: {
          phases: {
            hot: {
              actions: {
                rollover: {
                  max_size: '10GB',
                  max_age: '30d'
                }
              }
            },
            warm: {
              min_age: '30d',
              actions: {
                allocate: {
                  number_of_replicas: 0
                },
                forcemerge: {
                  max_num_segments: 1
                }
              }
            },
            cold: {
              min_age: '90d',
              actions: {
                allocate: {
                  number_of_replicas: 0
                }
              }
            },
            delete: {
              min_age: '365d'
            }
          }
        }
      },
      {
        name: `${this.indexPrefix}_analytics_policy`,
        policy: {
          phases: {
            hot: {
              actions: {
                rollover: {
                  max_size: '5GB',
                  max_age: '7d'
                }
              }
            },
            warm: {
              min_age: '7d',
              actions: {
                allocate: {
                  number_of_replicas: 0
                },
                forcemerge: {
                  max_num_segments: 1
                }
              }
            },
            delete: {
              min_age: '90d'
            }
          }
        }
      }
    ];

    for (const { name, policy } of policies) {
      try {
        await this.esClient.ilm.putLifecycle({
          name,
          body: { policy }
        });
        
        logger.info(`✅ Created ILM policy: ${name}`);
      } catch (error) {
        logger.error(`Failed to create ILM policy ${name}:`, error);
      }
    }
  }

  /**
   * Optimize indexes for search performance
   */
  async optimizeIndexes(): Promise<void> {
    try {
      logger.info('🔧 Optimizing search indexes...');

      const indexes = [
        `${this.indexPrefix}_posts`,
        `${this.indexPrefix}_users`,
        `${this.indexPrefix}_communities`,
        `${this.indexPrefix}_servers`
      ];

      for (const index of indexes) {
        // Force merge to optimize segments
        await this.esClient.indices.forcemerge({
          index,
          max_num_segments: 1,
          wait_for_completion: false
        });
        
        // Refresh index
        await this.esClient.indices.refresh({ index });
        
        logger.info(`Optimized index: ${index}`);
      }

      logger.info('✅ Index optimization completed');
    } catch (error) {
      logger.error('Index optimization failed:', error);
    }
  }

  /**
   * Get index statistics and health information
   */
  async getIndexHealth(): Promise<Record<string, any>> {
    try {
      const indexes = [
        `${this.indexPrefix}_posts`,
        `${this.indexPrefix}_users`,
        `${this.indexPrefix}_communities`,
        `${this.indexPrefix}_servers`,
        `${this.indexPrefix}_messages`,
        `${this.indexPrefix}_search_analytics`
      ];

      const stats = await this.esClient.indices.stats({
        index: indexes.join(','),
        metric: ['docs', 'store', 'search', 'indexing']
      });

      const health = await this.esClient.cluster.health({
        index: indexes.join(',')
      });

      return {
        cluster_health: health.body.status,
        indexes: Object.entries(stats.body.indices || {}).map(([name, data]: [string, any]) => ({
          name,
          documents: data.total?.docs?.count || 0,
          size: data.total?.store?.size_in_bytes || 0,
          search_queries: data.total?.search?.query_total || 0,
          indexing_operations: data.total?.indexing?.index_total || 0
        }))
      };
    } catch (error) {
      logger.error('Failed to get index health:', error);
      return { error: 'Failed to retrieve index health' };
    }
  }

  /**
   * Delete old indexes based on retention policy
   */
  async cleanupOldIndexes(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Get all indexes matching our patterns
      const response = await this.esClient.cat.indices({
        index: `${this.indexPrefix}_*`,
        format: 'json'
      });

      const indexes = response.body as Array<{ index: string; 'creation.date.string': string }>;
      
      for (const indexInfo of indexes) {
        if (indexInfo['creation.date.string']) {
          const creationDate = new Date(indexInfo['creation.date.string']);
          
          if (creationDate < cutoffDate) {
            await this.esClient.indices.delete({
              index: indexInfo.index
            });
            
            logger.info(`Deleted old index: ${indexInfo.index}`);
          }
        }
      }
      
      logger.info(`Cleanup completed for indexes older than ${retentionDays} days`);
    } catch (error) {
      logger.error('Index cleanup failed:', error);
    }
  }

  /**
   * Reindex data with improved mappings
   */
  async reindexWithImprovedMappings(sourceIndex: string, destIndex: string): Promise<void> {
    try {
      logger.info(`Starting reindex from ${sourceIndex} to ${destIndex}...`);

      await this.esClient.reindex({
        body: {
          source: { index: sourceIndex },
          dest: { index: destIndex },
          conflicts: 'proceed'
        },
        wait_for_completion: false,
        requests_per_second: 500 // Throttle to avoid overloading
      });

      logger.info(`Reindex operation started for ${sourceIndex} -> ${destIndex}`);
    } catch (error) {
      logger.error(`Reindex failed for ${sourceIndex}:`, error);
      throw error;
    }
  }
}

export default SearchIndexManager;