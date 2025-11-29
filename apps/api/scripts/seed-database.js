#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public'
    }
  }
});

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create test users
    console.log('Creating users...');
    const users = [];
    
    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.create({
        data: {
          username: `user${i}`,
          email: `user${i}@example.com`,
          passwordHash: await bcrypt.hash('password123', 10),
          bio: `I'm test user number ${i}. Love coding and gaming!`,
          isVerified: i <= 3, // First 3 users are verified
          reputation: Math.floor(Math.random() * 1000),
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`
        }
      });
      users.push(user);
      console.log(`  ✅ Created user: ${user.username}`);
    }

    // Create communities
    console.log('\nCreating communities...');
    const communities = [];
    
    const communityData = [
      { name: 'programming', displayName: 'Programming', description: 'All things coding and development' },
      { name: 'gaming', displayName: 'Gaming', description: 'Video games, board games, and more' },
      { name: 'technology', displayName: 'Technology', description: 'Latest tech news and discussions' },
      { name: 'science', displayName: 'Science', description: 'Scientific discoveries and research' },
      { name: 'music', displayName: 'Music', description: 'Share and discuss music' }
    ];

    for (const data of communityData) {
      const community = await prisma.community.create({
        data: {
          name: data.name,
          description: data.description,
          owner_id: users[Math.floor(Math.random() * 3)].id, // Random owner from first 3 users
          is_public: true,
          member_count: Math.floor(Math.random() * 1000) + 100
        }
      });
      communities.push(community);
      console.log(`  ✅ Created community: r/${community.name}`);
    }

    // Create posts
    console.log('\nCreating posts...');
    const posts = [];
    
    const postTitles = [
      'Welcome to CRYB Platform!',
      'How to get started with React',
      'Best gaming setup 2025',
      'Understanding quantum computing',
      'Top 10 programming languages to learn',
      'The future of AI and machine learning',
      'Building a Discord clone',
      'Favorite indie games of the year',
      'Space exploration updates',
      'Music production tips for beginners'
    ];

    for (let i = 0; i < postTitles.length; i++) {
      const post = await prisma.post.create({
        data: {
          title: postTitles[i],
          content: `This is the content for "${postTitles[i]}". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          author_id: users[Math.floor(Math.random() * users.length)].id,
          community_id: communities[Math.floor(Math.random() * communities.length)].id,
          upvotes: Math.floor(Math.random() * 500),
          downvotes: Math.floor(Math.random() * 50),
          is_pinned: i === 0,
          view_count: Math.floor(Math.random() * 1000)
        }
      });
      posts.push(post);
      console.log(`  ✅ Created post: "${post.title.substring(0, 30)}..."`);
    }

    // Create comments
    console.log('\nCreating comments...');
    let commentCount = 0;
    
    for (const post of posts.slice(0, 5)) { // Add comments to first 5 posts
      for (let i = 0; i < 3; i++) {
        await prisma.comment.create({
          data: {
            content: `This is comment ${i + 1} on the post. Great content!`,
            author_id: users[Math.floor(Math.random() * users.length)].id,
            post_id: post.id,
            upvotes: Math.floor(Math.random() * 50),
            downvotes: Math.floor(Math.random() * 10)
          }
        });
        commentCount++;
      }
    }
    console.log(`  ✅ Created ${commentCount} comments`);

    // Create some friendships/follows
    console.log('\nCreating follows...');
    let followCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < Math.min(i + 3, users.length); j++) {
        if (Math.random() > 0.5) {
          await prisma.follow.create({
            data: {
              follower_id: users[i].id,
              following_id: users[j].id
            }
          });
          followCount++;
        }
      }
    }
    console.log(`  ✅ Created ${followCount} follow relationships`);

    // Summary
    const counts = await prisma.$transaction([
      prisma.user.count(),
      prisma.community.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.follow.count()
    ]);

    console.log('\n========================================');
    console.log('📊 Database Seeding Complete!');
    console.log('========================================');
    console.log(`Users:       ${counts[0]}`);
    console.log(`Communities: ${counts[1]}`);
    console.log(`Posts:       ${counts[2]}`);
    console.log(`Comments:    ${counts[3]}`);
    console.log(`Follows:     ${counts[4]}`);
    console.log('\n✅ Database is now populated with test data!');
    console.log('\nTest credentials:');
    console.log('  Username: user1 to user10');
    console.log('  Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();