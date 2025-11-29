import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USER || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
});

// Index mappings
const indexMappings = {
  posts: {
    properties: {
      id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'standard' },
      content: { type: 'text', analyzer: 'standard' },
      author: { type: 'keyword' },
      authorName: { type: 'text' },
      communityId: { type: 'keyword' },
      communityName: { type: 'text' },
      tags: { type: 'keyword' },
      score: { type: 'integer' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  },
  users: {
    properties: {
      id: { type: 'keyword' },
      username: { type: 'keyword' },
      displayName: { type: 'text' },
      bio: { type: 'text' },
      karma: { type: 'integer' },
      createdAt: { type: 'date' },
    },
  },
  communities: {
    properties: {
      id: { type: 'keyword' },
      name: { type: 'keyword' },
      displayName: { type: 'text' },
      description: { type: 'text' },
      memberCount: { type: 'integer' },
      createdAt: { type: 'date' },
    },
  },
  comments: {
    properties: {
      id: { type: 'keyword' },
      content: { type: 'text', analyzer: 'standard' },
      author: { type: 'keyword' },
      postId: { type: 'keyword' },
      score: { type: 'integer' },
      createdAt: { type: 'date' },
    },
  },
};

// Initialize indices
export async function initializeIndices() {
  try {
    for (const [indexName, mapping] of Object.entries(indexMappings)) {
      const indexExists = await client.indices.exists({ index: indexName });
      
      if (!indexExists) {
        await client.indices.create({
          index: indexName,
          body: {
            mappings: mapping,
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
            },
          },
        });
        console.log(`✅ Created index: ${indexName}`);
      }
    }
  } catch (error) {
    console.error('Failed to initialize indices:', error);
  }
}

// Index a document
export async function indexDocument(type: string, id: string, data: any) {
  try {
    await client.index({
      index: type,
      id,
      body: data,
      refresh: true,
    });
    console.log(`Indexed ${type}:${id}`);
  } catch (error) {
    console.error(`Failed to index ${type}:${id}`, error);
    throw error;
  }
}

// Search documents
export async function searchDocuments(query: string, options: {
  type?: string;
  page?: number;
  limit?: number;
  filters?: any;
} = {}) {
  const { type = '_all', page = 1, limit = 20, filters = {} } = options;
  
  try {
    const from = (page - 1) * limit;
    
    const body: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['title^3', 'content^2', 'displayName^2', 'description', 'username'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
      highlight: {
        fields: {
          title: {},
          content: {},
          displayName: {},
          description: {},
        },
      },
      from,
      size: limit,
    };
    
    // Add filters
    if (filters.communityId) {
      body.query.bool.filter = body.query.bool.filter || [];
      body.query.bool.filter.push({
        term: { communityId: filters.communityId },
      });
    }
    
    if (filters.author) {
      body.query.bool.filter = body.query.bool.filter || [];
      body.query.bool.filter.push({
        term: { author: filters.author },
      });
    }
    
    if (filters.dateFrom || filters.dateTo) {
      const dateRange: any = {};
      if (filters.dateFrom) dateRange.gte = filters.dateFrom;
      if (filters.dateTo) dateRange.lte = filters.dateTo;
      
      body.query.bool.filter = body.query.bool.filter || [];
      body.query.bool.filter.push({
        range: { createdAt: dateRange },
      });
    }
    
    const result = await client.search({
      index: type === '_all' ? '*' : type,
      body,
    });
    
    return {
      hits: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        type: hit._index,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight,
      })),
      total: result.hits.total,
      page,
      limit,
    };
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

// Delete document
export async function deleteDocument(type: string, id: string) {
  try {
    await client.delete({
      index: type,
      id,
      refresh: true,
    });
    console.log(`Deleted ${type}:${id}`);
  } catch (error) {
    console.error(`Failed to delete ${type}:${id}`, error);
    throw error;
  }
}

// Bulk index documents
export async function bulkIndex(type: string, documents: any[]) {
  try {
    const body = documents.flatMap(doc => [
      { index: { _index: type, _id: doc.id } },
      doc,
    ]);
    
    const result = await client.bulk({
      body,
      refresh: true,
    });
    
    console.log(`Bulk indexed ${documents.length} documents to ${type}`);
    return result;
  } catch (error) {
    console.error('Bulk indexing failed:', error);
    throw error;
  }
}

// Get suggestions
export async function getSuggestions(query: string, type: string = '_all') {
  try {
    const result = await client.search({
      index: type === '_all' ? '*' : type,
      body: {
        suggest: {
          text: query,
          'title-suggest': {
            term: {
              field: 'title',
              size: 5,
            },
          },
        },
      },
    });
    
    return result.suggest;
  } catch (error) {
    console.error('Failed to get suggestions:', error);
    throw error;
  }
}

export default {
  initializeIndices,
  indexDocument,
  searchDocuments,
  deleteDocument,
  bulkIndex,
  getSuggestions,
};