#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { Client } = require('@elastic/elasticsearch');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public'
    }
  }
});

const elasticsearch = new Client({
  node: 'http://localhost:9200'
});

async function indexData() {
  console.log('🔍 Starting Elasticsearch reindexing...\n');

  try {
    // 1. Index all users
    console.log('Indexing users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        createdAt: true
      }
    });

    for (const user of users) {
      await elasticsearch.index({
        index: 'users',
        id: user.id,
        body: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio || '',
          createdAt: user.createdAt,
          type: 'user'
        }
      }).catch(err => console.log(`Failed to index user ${user.id}:`, err.message));
    }
    console.log(`✅ Indexed ${users.length} users`);

    // 2. Index all communities
    console.log('\nIndexing communities...');
    const communities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        memberCount: true,
        createdAt: true
      }
    });

    for (const community of communities) {
      await elasticsearch.index({
        index: 'communities',
        id: community.id,
        body: {
          id: community.id,
          name: community.name,
          displayName: community.displayName,
          description: community.description || '',
          memberCount: community.memberCount,
          createdAt: community.createdAt,
          type: 'community'
        }
      }).catch(err => console.log(`Failed to index community ${community.id}:`, err.message));
    }
    console.log(`✅ Indexed ${communities.length} communities`);

    // 3. Index all posts
    console.log('\nIndexing posts...');
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        score: true,
        userId: true,
        communityId: true,
        createdAt: true
      }
    });

    for (const post of posts) {
      await elasticsearch.index({
        index: 'posts',
        id: post.id,
        body: {
          id: post.id,
          title: post.title,
          content: post.content,
          score: post.score,
          userId: post.userId,
          communityId: post.communityId,
          createdAt: post.createdAt,
          type: 'post'
        }
      }).catch(err => console.log(`Failed to index post ${post.id}:`, err.message));
    }
    console.log(`✅ Indexed ${posts.length} posts`);

    // 4. Index all comments
    console.log('\nIndexing comments...');
    const comments = await prisma.comment.findMany({
      select: {
        id: true,
        content: true,
        userId: true,
        postId: true,
        score: true,
        createdAt: true
      }
    });

    for (const comment of comments) {
      await elasticsearch.index({
        index: 'comments',
        id: comment.id,
        body: {
          id: comment.id,
          content: comment.content,
          userId: comment.userId,
          postId: comment.postId,
          score: comment.score,
          createdAt: comment.createdAt,
          type: 'comment'
        }
      }).catch(err => console.log(`Failed to index comment ${comment.id}:`, err.message));
    }
    console.log(`✅ Indexed ${comments.length} comments`);

    // 5. Refresh all indices
    console.log('\nRefreshing indices...');
    await elasticsearch.indices.refresh({ index: '_all' });
    
    // 6. Get index stats
    const stats = await elasticsearch.indices.stats({ index: 'users,communities,posts,comments' });
    
    console.log('\n========================================');
    console.log('📊 Indexing Complete!');
    console.log('========================================');
    console.log(`Total documents indexed: ${stats.body._all.total.docs.count}`);
    console.log(`Index size: ${(stats.body._all.total.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
    
    // 7. Test search
    console.log('\n🔍 Testing search...');
    const searchResult = await elasticsearch.search({
      index: 'posts',
      body: {
        query: {
          match: {
            content: 'demo'
          }
        }
      }
    });
    
    console.log(`Search test: Found ${searchResult.body.hits.total.value} posts containing "demo"`);

  } catch (error) {
    console.error('❌ Indexing failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Elasticsearch reindexing complete!');
  }
}

indexData();