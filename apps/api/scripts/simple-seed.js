#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public'
    }
  }
});

async function seed() {
  console.log('🌱 Simple Database Seeding...\n');

  try {
    // Check existing users
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} existing users`);
    
    // Get a sample user to work with
    let users = await prisma.user.findMany({ take: 5 });
    
    // If no users, create one
    if (users.length === 0) {
      console.log('Creating sample users...');
      const user = await prisma.user.create({
        data: {
          id: `demo_user_${Date.now()}`,
          username: `demouser${Date.now()}`,
          email: `demo${Date.now()}@example.com`
        }
      });
      users = [user];
      console.log('Created demo user:', user.username);
    }
    
    // Check communities
    const commCount = await prisma.community.count();
    console.log(`\nFound ${commCount} existing communities`);
    
    // Create a community if none exist
    if (commCount === 0 && users.length > 0) {
      console.log('Creating demo community...');
      const community = await prisma.community.create({
        data: {
          id: `demo_comm_${Date.now()}`,
          name: `democommunity${Date.now()}`,
          displayName: 'Demo Community',
          description: 'Demo community for testing',
          isPublic: true,
          memberCount: 1,
          updatedAt: new Date()
        }
      });
      console.log('Created community:', community.name);
    }
    
    // Get communities
    const communities = await prisma.community.findMany({ take: 5 });
    
    // Check posts
    const postCount = await prisma.post.count();
    console.log(`\nFound ${postCount} existing posts`);
    
    // Create demo posts if needed
    if (postCount < 10 && users.length > 0 && communities.length > 0) {
      console.log('Creating demo posts...');
      for (let i = 0; i < 5; i++) {
        try {
          const post = await prisma.post.create({
            data: {
              id: `demo_post_${i}_${Date.now()}`,
              title: `Demo Post #${i + 1}`,
              content: `This is demo post content number ${i + 1}. Welcome to CRYB!`,
              userId: users[0].id,
              communityId: communities[0].id,
              score: Math.floor(Math.random() * 100),
              updatedAt: new Date()
            }
          });
          console.log(`  Created: ${post.title}`);
        } catch (err) {
          console.log(`  Skipped post ${i + 1}: ${err.message}`);
        }
      }
    }
    
    // Get posts for comments
    const posts = await prisma.post.findMany({ take: 5 });
    
    // Check comments
    const commentCount = await prisma.comment.count();
    console.log(`\nFound ${commentCount} existing comments`);
    
    // Create demo comments if needed
    if (commentCount < 10 && users.length > 0 && posts.length > 0) {
      console.log('Creating demo comments...');
      for (let i = 0; i < 10; i++) {
        try {
          const userIndex = Math.floor(Math.random() * Math.min(users.length, 5));
          const postIndex = Math.floor(Math.random() * posts.length);
          
          const comment = await prisma.comment.create({
            data: {
              id: `demo_comment_${i}_${Date.now()}`,
              content: `This is demo comment #${i + 1}. Great post!`,
              userId: users[userIndex].id,
              postId: posts[postIndex].id,
              score: Math.floor(Math.random() * 50),
              updatedAt: new Date()
            }
          });
          console.log(`  Created comment ${i + 1}`);
        } catch (err) {
          console.log(`  Skipped comment ${i + 1}: ${err.message}`);
        }
      }
    }
    
    // Final summary
    console.log('\n========================================');
    console.log('📊 Database Status');
    console.log('========================================');
    
    const finalCounts = await prisma.$transaction([
      prisma.user.count(),
      prisma.community.count(),
      prisma.post.count(),
      prisma.comment.count()
    ]);

    console.log(`Total Users:       ${finalCounts[0]}`);
    console.log(`Total Communities: ${finalCounts[1]}`);
    console.log(`Total Posts:       ${finalCounts[2]}`);
    console.log(`Total Comments:    ${finalCounts[3]}`);
    
    if (finalCounts[0] > 0 && finalCounts[1] > 0 && finalCounts[2] > 0) {
      console.log('\n✅ Database has test data and is ready!');
    } else {
      console.log('\n⚠️  Database needs more data');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();