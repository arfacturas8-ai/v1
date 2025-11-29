#!/usr/bin/env node

/**
 * Create a simple JWT token for testing real-time features
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Use the same JWT secret as the server
const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_key_change_in_production_32_chars_minimum';

async function createSimpleTestToken() {
  try {
    console.log('🔧 Creating test user and JWT token...');

    // Check if test user already exists
    let testUser = await prisma.user.findUnique({
      where: { username: 'realtimetest' }
    });

    if (!testUser) {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          username: 'realtimetest',
          displayName: 'Realtime Test User',
          email: 'realtime@test.com',
          avatar: null,
          isVerified: true,
          bannedAt: null,
          lastSeenAt: new Date(),
        }
      });
      console.log('✅ Created test user:', testUser.username);
    } else {
      console.log('✅ Test user exists:', testUser.username);
      
      // Update last seen
      await prisma.user.update({
        where: { id: testUser.id },
        data: { lastSeenAt: new Date(), bannedAt: null }
      });
    }

    // Create JWT token payload
    const payload = {
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email,
      isVerified: testUser.isVerified,
      sessionId: 'test-session-' + Date.now(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Generate token
    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'cryb-platform',
      audience: 'cryb-users'
    });

    console.log('✅ Generated JWT token');
    console.log('\nTest User Details:');
    console.log('- ID:', testUser.id);
    console.log('- Username:', testUser.username);
    console.log('- Display Name:', testUser.displayName);
    console.log('- Email:', testUser.email);
    console.log('- Is Verified:', testUser.isVerified);

    console.log('\nJWT Token (copy this for testing):');
    console.log(token);

    // Verify the token works
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('\n✅ Token verification successful');
      console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return null;
    }

    // Create test server and channel if they don't exist
    let testServer = await prisma.server.findFirst({
      where: { name: 'Test Server' }
    });

    if (!testServer) {
      testServer = await prisma.server.create({
        data: {
          name: 'Test Server',
          description: 'Test server for realtime features',
          ownerId: testUser.id,
          isPublic: true
        }
      });
      console.log('✅ Created test server');
    }

    // Add user to server if not already a member
    const membership = await prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: testServer.id,
          userId: testUser.id
        }
      }
    });

    if (!membership) {
      await prisma.serverMember.create({
        data: {
          serverId: testServer.id,
          userId: testUser.id,
          joinedAt: new Date()
        }
      });
      console.log('✅ Added user to test server');
    }

    // Create test channel if it doesn't exist
    let testChannel = await prisma.channel.findFirst({
      where: { 
        name: 'test-channel',
        serverId: testServer.id 
      }
    });

    if (!testChannel) {
      testChannel = await prisma.channel.create({
        data: {
          name: 'test-channel',
          type: 'TEXT',
          serverId: testServer.id,
          position: 0,
          isPrivate: false
        }
      });
      console.log('✅ Created test channel');
    }

    // Create test voice channel
    let voiceChannel = await prisma.channel.findFirst({
      where: { 
        name: 'test-voice',
        type: 'VOICE',
        serverId: testServer.id 
      }
    });

    if (!voiceChannel) {
      voiceChannel = await prisma.channel.create({
        data: {
          name: 'test-voice',
          type: 'VOICE',
          serverId: testServer.id,
          position: 1,
          isPrivate: false
        }
      });
      console.log('✅ Created test voice channel');
    }

    console.log('\n🚀 Test Environment Ready!');
    console.log('- Test Server ID:', testServer.id);
    console.log('- Test Channel ID:', testChannel.id);
    console.log('- Voice Channel ID:', voiceChannel.id);
    console.log('\nUse this token for real-time testing:');
    console.log(token);

    return {
      user: testUser,
      token,
      server: testServer,
      channel: testChannel,
      voiceChannel
    };

  } catch (error) {
    console.error('❌ Error creating test environment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createSimpleTestToken()
    .then(() => {
      console.log('\n✅ Test setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create test environment:', error);
      process.exit(1);
    });
}

module.exports = { createSimpleTestToken };