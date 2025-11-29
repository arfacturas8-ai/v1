/**
 * Simple script to create demo data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDemoData() {
  try {
    console.log('Creating demo data...');
    
    // Check if demo community exists
    let community = await prisma.community.findFirst({
      where: { name: 'Demo Community' }
    });

    if (!community) {
      // Create demo community
      community = await prisma.community.create({
        data: {
          name: 'Demo Community',
          description: 'A demo community for testing the CRYB platform features',
          member_count: 100
        }
      });
      console.log('✅ Created demo community:', community.name);
    } else {
      console.log('Demo community already exists');
    }

    // Check for existing demo user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      // Create a simple test user
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'TestUser',
          avatar_url: null
        }
      });
      console.log('✅ Created test user:', user.username);
    } else {
      console.log('Test user already exists');
    }

    // Create some demo posts if none exist
    const existingPosts = await prisma.post.count({
      where: { community_id: community.id }
    });

    if (existingPosts === 0) {
      const posts = await Promise.all([
        prisma.post.create({
          data: {
            title: '🚀 Welcome to CRYB Platform!',
            content: 'This is the ultimate Discord + Reddit hybrid platform. Real-time chat meets community discussions!',
            user_id: user.id,
            community_id: community.id,
            upvotes: 42,
            downvotes: 2
          }
        }),
        prisma.post.create({
          data: {
            title: '💬 Real-time Features',
            content: 'Experience instant messaging with Socket.io, voice channels with LiveKit, and live updates across the platform.',
            user_id: user.id,
            community_id: community.id,
            upvotes: 28,
            downvotes: 1
          }
        }),
        prisma.post.create({
          data: {
            title: '🎮 Gaming Community Hub',
            content: 'Join gaming communities, share clips, organize tournaments, and connect with players worldwide.',
            user_id: user.id,
            community_id: community.id,
            upvotes: 35,
            downvotes: 3
          }
        }),
        prisma.post.create({
          data: {
            title: '🎨 NFT Integration Coming Soon',
            content: 'Token-gate your communities, showcase NFT collections, and trade digital assets directly on the platform.',
            user_id: user.id,
            community_id: community.id,
            upvotes: 19,
            downvotes: 5
          }
        }),
        prisma.post.create({
          data: {
            title: '📱 Mobile App in Development',
            content: 'Access CRYB on the go! Our React Native app brings the full experience to iOS and Android.',
            user_id: user.id,
            community_id: community.id,
            upvotes: 31,
            downvotes: 0
          }
        })
      ]);

      console.log(`✅ Created ${posts.length} demo posts`);

      // Create some demo comments
      for (const post of posts.slice(0, 2)) {
        await prisma.comment.create({
          data: {
            content: 'This is amazing! Can\'t wait to see where this platform goes.',
            post_id: post.id,
            user_id: user.id,
            upvotes: 8,
            downvotes: 0
          }
        });
      }
      
      console.log('✅ Created demo comments');
    } else {
      console.log(`Community already has ${existingPosts} posts`);
    }

    // Display summary
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.community.count(),
      prisma.post.count(),
      prisma.comment.count()
    ]);

    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${stats[0]}`);
    console.log(`   Communities: ${stats[1]}`);
    console.log(`   Posts: ${stats[2]}`);
    console.log(`   Comments: ${stats[3]}`);

    return { user, community };
  } catch (error) {
    console.error('Error creating demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData()
  .then(() => {
    console.log('\n✅ Demo data setup complete!');
    console.log('\n📝 Note: Since we cannot hash passwords in this script,');
    console.log('please use the registration form on the website to create a real account.');
    console.log('\nOr use the existing test credentials if they were set up previously:');
    console.log('Email: demo@cryb.ai');
    console.log('Password: demo123');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create demo data:', error);
    process.exit(1);
  });