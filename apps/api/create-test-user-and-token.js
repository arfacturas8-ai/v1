#!/usr/bin/env node

/**
 * Create a test user and generate a valid JWT token for real-time testing
 */

const { PrismaClient } = require('@prisma/client');
const { createToken } = require('@cryb/auth');

const prisma = new PrismaClient();

async function createTestUserAndToken() {
  try {
    console.log('🔧 Creating test user for real-time testing...');

    // Check if test user already exists
    let testUser = await prisma.user.findUnique({
      where: { username: 'realtime-test-user' }
    });

    if (!testUser) {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          id: 'realtime-test-user-id',
          username: 'realtime-test-user',
          displayName: 'Realtime Test User',
          email: 'realtime-test@cryb.app',
          avatar: null,
          isVerified: true,
          bannedAt: null,
          lastSeenAt: new Date(),
        }
      });
      console.log('✅ Created test user:', testUser.username);
    } else {
      console.log('✅ Test user already exists:', testUser.username);
    }

    // Generate JWT token
    const payload = {
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email,
      isVerified: testUser.isVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = createToken(payload);
    
    console.log('✅ Generated JWT token for testing');
    console.log('Token:', token);
    console.log('\nUser details:');
    console.log('- ID:', testUser.id);
    console.log('- Username:', testUser.username);
    console.log('- Display Name:', testUser.displayName);
    console.log('- Email:', testUser.email);

    // Test token verification
    try {
      const { verifyToken } = require('@cryb/auth');
      const verified = verifyToken(token);
      console.log('✅ Token verification successful');
      console.log('Verified payload:', JSON.stringify(verified, null, 2));
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
    }

    // Create a test channel for the user
    let testChannel = await prisma.channel.findFirst({
      where: { name: 'realtime-test-channel' }
    });

    if (!testChannel) {
      // We need a server first
      let testServer = await prisma.server.findFirst({
        where: { name: 'Realtime Test Server' }
      });

      if (!testServer) {
        testServer = await prisma.server.create({
          data: {
            id: 'realtime-test-server-id',
            name: 'Realtime Test Server',
            description: 'Server for testing realtime features',
            ownerId: testUser.id,
            isPublic: true,
            icon: null,
            banner: null
          }
        });
        console.log('✅ Created test server:', testServer.name);
      }

      // Add user as member of the server
      const existingMembership = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: testServer.id,
            userId: testUser.id
          }
        }
      });

      if (!existingMembership) {
        await prisma.serverMember.create({
          data: {
            serverId: testServer.id,
            userId: testUser.id,
            joinedAt: new Date()
          }
        });
        console.log('✅ Added user to test server');
      }

      // Create test channel
      testChannel = await prisma.channel.create({
        data: {
          id: 'realtime-test-channel-id',
          name: 'realtime-test-channel',
          type: 'TEXT',
          serverId: testServer.id,
          position: 0,
          isPrivate: false,
          nsfw: false
        }
      });
      console.log('✅ Created test channel:', testChannel.name);
    } else {
      console.log('✅ Test channel already exists:', testChannel.name);
    }

    // Also create a voice channel for voice tests
    let voiceChannel = await prisma.channel.findFirst({
      where: { name: 'realtime-test-voice', type: 'VOICE' }
    });

    if (!voiceChannel) {
      const testServer = await prisma.server.findFirst({
        where: { name: 'Realtime Test Server' }
      });

      if (testServer) {
        voiceChannel = await prisma.channel.create({
          data: {
            id: 'realtime-test-voice-id',
            name: 'realtime-test-voice',
            type: 'VOICE',
            serverId: testServer.id,
            position: 1,
            isPrivate: false
          }
        });
        console.log('✅ Created test voice channel:', voiceChannel.name);
      }
    }

    console.log('\n🚀 Test environment ready!');
    console.log('Use this token in your real-time tests:');
    console.log(token);

    return {
      user: testUser,
      token,
      channel: testChannel,
      voiceChannel
    };

  } catch (error) {
    console.error('❌ Failed to create test user and token:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestUserAndToken()
    .then(() => {
      console.log('✅ Test setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUserAndToken };