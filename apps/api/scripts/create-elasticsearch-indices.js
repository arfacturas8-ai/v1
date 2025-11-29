#!/usr/bin/env node

const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_AUTH ? {
    username: process.env.ELASTICSEARCH_USER,
    password: process.env.ELASTICSEARCH_PASSWORD
  } : undefined
});

async function createIndices() {
  console.log('🔍 Creating Elasticsearch indices...');

  const indices = [
    {
      name: 'posts',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              content_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'snowball']
              }
            }
          }
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { 
              type: 'text', 
              analyzer: 'content_analyzer',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            content: { 
              type: 'text', 
              analyzer: 'content_analyzer' 
            },
            authorId: { type: 'keyword' },
            authorUsername: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            communityId: { type: 'keyword' },
            communityName: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            tags: { type: 'keyword' },
            upvotes: { type: 'integer' },
            downvotes: { type: 'integer' },
            commentCount: { type: 'integer' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        }
      }
    },
    {
      name: 'users',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            username: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' }
              }
            },
            displayName: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            bio: { type: 'text' },
            reputation: { type: 'integer' },
            createdAt: { type: 'date' }
          }
        }
      }
    },
    {
      name: 'communities',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' }
              }
            },
            description: { type: 'text' },
            memberCount: { type: 'integer' },
            postCount: { type: 'integer' },
            isPublic: { type: 'boolean' },
            createdAt: { type: 'date' }
          }
        }
      }
    },
    {
      name: 'messages',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            content: { type: 'text' },
            channelId: { type: 'keyword' },
            serverId: { type: 'keyword' },
            authorId: { type: 'keyword' },
            authorUsername: { type: 'text' },
            attachments: { type: 'object' },
            createdAt: { type: 'date' }
          }
        }
      }
    }
  ];

  for (const index of indices) {
    try {
      // Check if index exists
      const exists = await client.indices.exists({ index: index.name });
      
      if (exists) {
        console.log(`⚠️  Index ${index.name} already exists, skipping...`);
        continue;
      }

      // Create index
      await client.indices.create({
        index: index.name,
        body: index.body
      });
      
      console.log(`✅ Created index: ${index.name}`);
    } catch (error) {
      console.error(`❌ Failed to create index ${index.name}:`, error.message);
    }
  }

  // Verify cluster health
  try {
    const health = await client.cluster.health();
    console.log('\n📊 Cluster Health:', health.status);
    console.log('Active shards:', health.active_shards);
  } catch (error) {
    console.error('Failed to get cluster health:', error.message);
  }

  console.log('\n✅ Elasticsearch indices setup complete!');
}

createIndices().catch(console.error);