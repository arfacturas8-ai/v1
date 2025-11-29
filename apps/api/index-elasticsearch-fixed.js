const { Client } = require('@elastic/elasticsearch');
const { PrismaClient } = require('@prisma/client');

async function indexData() {
  const prisma = new PrismaClient();
  const elastic = new Client({ node: 'http://localhost:9200' });

  try {
    console.log('Starting Elasticsearch indexing...');
    
    // Index posts
    const posts = await prisma.post.findMany({
      include: {
        User: true,
        Community: true
      }
    });
    
    console.log(`Indexing ${posts.length} posts...`);
    for (const post of posts) {
      await elastic.index({
        index: 'posts',
        id: post.id,
        body: {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.author_id,
          authorUsername: post.User?.username,
          communityId: post.community_id,
          communityName: post.Community?.name,
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          createdAt: post.created_at,
          updatedAt: post.updated_at
        }
      });
    }
    
    // Index users
    const users = await prisma.user.findMany();
    console.log(`Indexing ${users.length} users...`);
    for (const user of users) {
      await elastic.index({
        index: 'users',
        id: user.id,
        body: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name,
          bio: user.bio,
          createdAt: user.created_at
        }
      });
    }
    
    // Index communities  
    const communities = await prisma.community.findMany();
    console.log(`Indexing ${communities.length} communities...`);
    for (const community of communities) {
      await elastic.index({
        index: 'communities',
        id: community.id,
        body: {
          id: community.id,
          name: community.name,
          description: community.description,
          memberCount: community.member_count,
          isPublic: community.is_public,
          createdAt: community.created_at
        }
      });
    }
    
    // Index comments
    const comments = await prisma.comment.findMany({
      include: {
        User: true
      }
    });
    console.log(`Indexing ${comments.length} comments...`);
    for (const comment of comments) {
      await elastic.index({
        index: 'comments',
        id: comment.id,
        body: {
          id: comment.id,
          content: comment.content,
          authorId: comment.user_id,
          authorUsername: comment.User?.username,
          postId: comment.post_id,
          createdAt: comment.created_at
        }
      });
    }
    
    // Refresh indices to make data searchable immediately
    await elastic.indices.refresh({ index: 'posts,users,communities,comments' });
    
    console.log('✅ Elasticsearch indexing completed successfully!');
    console.log(`Indexed: ${posts.length} posts, ${users.length} users, ${communities.length} communities, ${comments.length} comments`);
    
  } catch (error) {
    console.error('Error indexing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

indexData();