#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public'
    }
  }
});

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Clean up existing test data
    console.log('Cleaning up existing test data...');
    await prisma.$executeRaw`DELETE FROM "Comment" WHERE content LIKE 'Test comment%'`;
    await prisma.$executeRaw`DELETE FROM "Post" WHERE title LIKE 'Test Post%'`;
    await prisma.$executeRaw`DELETE FROM "Community" WHERE name LIKE 'test%'`;
    await prisma.$executeRaw`DELETE FROM "User" WHERE username LIKE 'testuser%'`;
    
    // Create test users
    console.log('\nCreating users...');
    const users = [];
    
    for (let i = 1; i <= 10; i++) {
      try {
        const user = await prisma.user.create({
          data: {
            id: `test_user_${i}_${Date.now()}`,
            username: `testuser${i}`,
            email: `testuser${i}@example.com`,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
            bio: `I'm test user number ${i}. Love coding and gaming!`,
            reputation: Math.floor(Math.random() * 1000)
          }
        });
        users.push(user);
        console.log(`  ✅ Created user: ${user.username}`);
      } catch (err) {
        console.log(`  ⚠️  User testuser${i} might already exist`);
      }
    }

    if (users.length === 0) {
      // Get existing users if creation failed
      const existingUsers = await prisma.user.findMany({
        where: { username: { startsWith: 'testuser' } },
        take: 10
      });
      users.push(...existingUsers);
      console.log(`  ℹ️  Using ${users.length} existing users`);
    }

    // Create communities
    console.log('\nCreating communities...');
    const communities = [];
    
    const communityData = [
      { name: 'testprogramming', description: 'Test community for programming' },
      { name: 'testgaming', description: 'Test community for gaming' },
      { name: 'testtech', description: 'Test community for technology' },
      { name: 'testscience', description: 'Test community for science' },
      { name: 'testmusic', description: 'Test community for music' }
    ];

    for (const data of communityData) {
      try {
        const community = await prisma.community.create({
          data: {
            id: `test_comm_${data.name}_${Date.now()}`,
            name: data.name,
            description: data.description,
            owner_id: users[0]?.id || 'test_user_1',
            is_public: true,
            member_count: Math.floor(Math.random() * 1000) + 100
          }
        });
        communities.push(community);
        console.log(`  ✅ Created community: ${community.name}`);
      } catch (err) {
        console.log(`  ⚠️  Community ${data.name} might already exist`);
      }
    }

    // Get communities if creation failed
    if (communities.length === 0) {
      const existingCommunities = await prisma.community.findMany({
        where: { name: { startsWith: 'test' } },
        take: 5
      });
      communities.push(...existingCommunities);
      console.log(`  ℹ️  Using ${communities.length} existing communities`);
    }

    // Create posts
    console.log('\nCreating posts...');
    const posts = [];
    
    const postTitles = [
      'Test Post: Welcome to CRYB!',
      'Test Post: Getting Started Guide',
      'Test Post: Best Practices',
      'Test Post: Community Rules',
      'Test Post: Feature Showcase',
      'Test Post: Development Update',
      'Test Post: User Feedback',
      'Test Post: Tips and Tricks',
      'Test Post: Future Roadmap',
      'Test Post: Thank You Message'
    ];

    for (let i = 0; i < postTitles.length && users.length > 0 && communities.length > 0; i++) {
      try {
        const post = await prisma.post.create({
          data: {
            id: `test_post_${i}_${Date.now()}`,
            title: postTitles[i],
            content: `This is test content for "${postTitles[i]}". This is a sample post to demonstrate the platform's capabilities.`,
            author_id: users[Math.floor(Math.random() * users.length)].id,
            community_id: communities[Math.floor(Math.random() * communities.length)].id,
            upvotes: Math.floor(Math.random() * 500),
            downvotes: Math.floor(Math.random() * 50),
            is_pinned: i === 0
          }
        });
        posts.push(post);
        console.log(`  ✅ Created post: "${post.title}"`);
      } catch (err) {
        console.log(`  ⚠️  Could not create post: ${postTitles[i]}`);
      }
    }

    // Create comments
    console.log('\nCreating comments...');
    let commentCount = 0;
    
    for (const post of posts.slice(0, Math.min(5, posts.length))) {
      for (let i = 0; i < 3 && users.length > 0; i++) {
        try {
          await prisma.comment.create({
            data: {
              id: `test_comment_${commentCount}_${Date.now()}`,
              content: `Test comment ${i + 1} on this post. Great content!`,
              author_id: users[Math.floor(Math.random() * users.length)].id,
              post_id: post.id,
              upvotes: Math.floor(Math.random() * 50),
              downvotes: Math.floor(Math.random() * 10)
            }
          });
          commentCount++;
        } catch (err) {
          console.log(`  ⚠️  Could not create comment`);
        }
      }
    }
    console.log(`  ✅ Created ${commentCount} comments`);

    // Summary
    console.log('\n========================================');
    console.log('📊 Database Seeding Summary');
    console.log('========================================');
    
    const counts = await prisma.$transaction([
      prisma.user.count(),
      prisma.community.count(),
      prisma.post.count(),
      prisma.comment.count()
    ]);

    console.log(`Total Users:       ${counts[0]}`);
    console.log(`Total Communities: ${counts[1]}`);
    console.log(`Total Posts:       ${counts[2]}`);
    console.log(`Total Comments:    ${counts[3]}`);
    
    // Show some sample data
    console.log('\n📝 Sample Users:');
    const sampleUsers = await prisma.user.findMany({ take: 5, orderBy: { created_at: 'desc' } });
    sampleUsers.forEach(u => console.log(`  - ${u.username} (${u.email})`));
    
    console.log('\n📝 Sample Communities:');
    const sampleCommunities = await prisma.community.findMany({ take: 5, orderBy: { created_at: 'desc' } });
    sampleCommunities.forEach(c => console.log(`  - ${c.name}: ${c.description}`));
    
    console.log('\n✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch(error => {
  console.error('Failed to seed:', error);
  process.exit(1);
});