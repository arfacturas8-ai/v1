const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    let user = await prisma.user.findUnique({
      where: { username: 'discordtest' }
    });

    if (!user) {
      console.log('Creating test user...');
      user = await prisma.user.create({
        data: {
          id: 'test-user-123',
          username: 'discordtest',
          displayName: 'Discord Test User',
          email: 'discordtest@cryb.ai',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('Test user created:', user.username);
    } else {
      console.log('Test user already exists:', user.username);
    }

    // Create a session for the user
    const sessionId = randomUUID();
    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Session created:', session.id);

    // Create a test server for testing channels
    let server = await prisma.server.findFirst({
      where: { ownerId: user.id }
    });

    if (!server) {
      server = await prisma.server.create({
        data: {
          id: 'test-server-123',
          name: 'Test Discord Server',
          description: 'A test server for Discord functionality',
          ownerId: user.id,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('Test server created:', server.name);

      // Add user as server member
      await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: user.id,
          joinedAt: new Date()
        }
      });
      console.log('User added as server member');
    } else {
      console.log('Test server already exists:', server.name);
    }

    console.log('\n✅ Test environment ready!');
    console.log('User ID:', user.id);
    console.log('Server ID:', server.id);
    console.log('Session ID:', session.id);
    
    return { user, server, session };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();