import { Client } from '@elastic/elasticsearch';

export interface ElasticsearchConfig {
  node: string;
  username?: string;
  password?: string;
  ssl?: boolean;
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
      } : undefined
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
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to index message:', error);
    }
  }

  async searchMessages(query: string, filters: any = {}): Promise<any[]> {
    if (!this.isConnected) return [];

    try {
      const result = await this.client.search({
        index: 'messages',
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['content', 'author.username']
                  }
                }
              ],
              filter: Object.entries(filters).map(([field, value]) => ({
                term: { [field]: value }
              }))
            }
          },
          sort: [{ timestamp: { order: 'desc' } }],
          size: 50
        }
      });

      return result.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async createIndex(name: string, mapping: any): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.indices.create({
        index: name,
        body: {
          mappings: mapping
        }
      });
    } catch (error) {
      console.error(`Failed to create index ${name}:`, error);
    }
  }
}