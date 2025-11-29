import { Client } from '@elastic/elasticsearch';
import { prisma } from '@cryb/database';

const client = new Client({
  node: 'http://localhost:9200',
  apiVersion: '7.17',
});

async function createIndices() {
  const indices = ['posts', 'users', 'communities', 'comments'];
  
  for (const index of indices) {
    try {
      const exists = await client.indices.exists({ index });
      
      if (!exists) {
        await client.indices.create({
          index,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
            },
          },
        });
        console.log(`✅ Created index: ${index}`);
      } else {
        console.log(`Index ${index} already exists`);
      }
    } catch (error) {
      console.error(`Failed to create index ${index}:`, error);
    }
  }
}

async function indexPosts() {
  console.log('Indexing posts...');
  const posts = await prisma.post.findMany({
    include: {
      User: true,
      Community: true,
    },
    take: 1000,
  });

  for (const post of posts) {
    try {
      await client.index({
        index: 'posts',
        id: post.id,
        body: {
          id: post.id,
          title: post.title,
          content: post.content,
          author: post.User?.username || 'unknown',
          authorName: post.User?.displayName || post.User?.username,
          communityId: post.communityId,
          communityName: post.Community?.name,
          score: post.score,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      });
    } catch (error) {
      console.error(`Failed to index post ${post.id}:`, error);
    }
  }
  console.log(`✅ Indexed ${posts.length} posts`);
}

async function indexUsers() {
  console.log('Indexing users...');
  const users = await prisma.user.findMany({
    take: 1000,
  });

  for (const user of users) {
    try {
      await client.index({
        index: 'users',
        id: user.id,
        body: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          email: user.email,
          bio: user.bio,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error(`Failed to index user ${user.id}:`, error);
    }
  }
  console.log(`✅ Indexed ${users.length} users`);
}

async function indexCommunities() {
  console.log('Indexing communities...');
  const communities = await prisma.community.findMany({
    take: 1000,
  });

  for (const community of communities) {
    try {
      await client.index({
        index: 'communities',
        id: community.id,
        body: {
          id: community.id,
          name: community.name,
          displayName: community.displayName,
          description: community.description,
          memberCount: community.memberCount,
          createdAt: community.createdAt,
        },
      });
    } catch (error) {
      console.error(`Failed to index community ${community.id}:`, error);
    }
  }
  console.log(`✅ Indexed ${communities.length} communities`);
}

async function indexComments() {
  console.log('Indexing comments...');
  const comments = await prisma.comment.findMany({
    include: {
      User: true,
    },
    take: 1000,
  });

  for (const comment of comments) {
    try {
      await client.index({
        index: 'comments',
        id: comment.id,
        body: {
          id: comment.id,
          content: comment.content,
          author: comment.User?.username || 'unknown',
          postId: comment.postId,
          score: comment.score,
          createdAt: comment.createdAt,
        },
      });
    } catch (error) {
      console.error(`Failed to index comment ${comment.id}:`, error);
    }
  }
  console.log(`✅ Indexed ${comments.length} comments`);
}

async function main() {
  console.log('🔍 Starting Elasticsearch indexing...');
  
  try {
    // Check Elasticsearch connection
    const health = await client.cluster.health();
    console.log('Elasticsearch cluster health:', health.status);
    
    // Create indices
    await createIndices();
    
    // Index data
    await indexPosts();
    await indexUsers();
    await indexCommunities();
    await indexComments();
    
    console.log('✅ Elasticsearch indexing complete!');
  } catch (error) {
    console.error('Indexing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);