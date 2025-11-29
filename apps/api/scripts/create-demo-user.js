/**
 * Script to create a demo user account for testing
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('@cryb/auth');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@cryb.ai' }
    });

    if (existingUser) {
      console.log('Demo user already exists:', existingUser);
      return existingUser;
    }

    // Create demo user
    const hashedPassword = await hashPassword('demo123');
    
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@cryb.ai',
        username: 'DemoUser',
        displayName: 'Demo User',
        passwordHash: hashedPassword,
        isVerified: true,
        bio: 'This is a demo account for testing the CRYB platform',
        avatar: null
      }
    });

    console.log('✅ Demo user created successfully:');
    console.log('Email: demo@cryb.ai');
    console.log('Password: demo123');
    console.log('Username:', demoUser.username);
    console.log('ID:', demoUser.id);

    // Create a demo community
    const demoCommunity = await prisma.community.create({
      data: {
        name: 'Demo Community',
        description: 'A demo community for testing features',
        ownerId: demoUser.id
      }
    });

    console.log('✅ Demo community created:', demoCommunity.name);

    // Create some demo posts
    const posts = await Promise.all([
      prisma.post.create({
        data: {
          title: 'Welcome to CRYB Platform!',
          content: 'This is a demo post to showcase the platform features. Feel free to interact!',
          userId: demoUser.id,
          communityId: demoCommunity.id,
          upvotes: 42,
          downvotes: 2
        }
      }),
      prisma.post.create({
        data: {
          title: 'Check out the real-time features',
          content: 'Try sending messages, they update in real-time thanks to Socket.io!',
          userId: demoUser.id,
          communityId: demoCommunity.id,
          upvotes: 23,
          downvotes: 1
        }
      }),
      prisma.post.create({
        data: {
          title: 'File uploads and media sharing',
          content: 'You can upload images, videos, and other files. MinIO handles all the storage!',
          userId: demoUser.id,
          communityId: demoCommunity.id,
          upvotes: 18,
          downvotes: 0
        }
      })
    ]);

    console.log(`✅ Created ${posts.length} demo posts`);

    // Create some demo comments
    const comment = await prisma.comment.create({
      data: {
        content: 'This is a demo comment. The comment system supports nested replies!',
        postId: posts[0].id,
        userId: demoUser.id,
        upvotes: 5,
        downvotes: 0
      }
    });

    console.log('✅ Created demo comment');

    return demoUser;
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser()
  .then(() => {
    console.log('\n🎉 Demo setup complete!');
    console.log('You can now login with:');
    console.log('Email: demo@cryb.ai');
    console.log('Password: demo123');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create demo user:', error);
    process.exit(1);
  });