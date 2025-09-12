#!/usr/bin/env node

/**
 * Create a test user and generate a valid JWT token for testing
 */

const { prisma } = require('@cryb/database');
const jwt = require('jsonwebtoken');

async function createTestUser() {
  try {
    console.log('🔧 Creating test user for Socket.io testing...');

    // Check if test user already exists
    let testUser = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });

    if (!testUser) {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          id: 'test-user-' + Date.now(),
          username: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User',
          passwordHash: 'dummy-hash', // Not used for this test
          isVerified: true,
          status: 'online'
        }
      });
      console.log('✅ Test user created:', testUser.username);
    } else {
      console.log('✅ Test user already exists:', testUser.username);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    const payload = {
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email,
      isVerified: testUser.isVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = jwt.sign(payload, jwtSecret);

    console.log('\n🔑 Test User Details:');
    console.log(`   User ID: ${testUser.id}`);
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Display Name: ${testUser.displayName}`);
    console.log('\n🎟️  JWT Token (use this in your test client):');
    console.log(token);

    // Also create a second test user for multi-user testing
    let testUser2 = await prisma.user.findUnique({
      where: { username: 'testuser2' }
    });

    if (!testUser2) {
      testUser2 = await prisma.user.create({
        data: {
          id: 'test-user-2-' + Date.now(),
          username: 'testuser2',
          email: 'test2@example.com',
          displayName: 'Test User 2',
          passwordHash: 'dummy-hash',
          isVerified: true,
          status: 'online'
        }
      });
      console.log('✅ Second test user created:', testUser2.username);
    }

    const token2 = jwt.sign({
      userId: testUser2.id,
      username: testUser2.username,
      email: testUser2.email,
      isVerified: testUser2.isVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, jwtSecret);

    console.log('\n🎟️  Second User Token:');
    console.log(token2);

    // Create a test channel
    let testChannel = await prisma.channel.findUnique({
      where: { id: 'test-channel-1' }
    });

    if (!testChannel) {
      // Create a server first
      let testServer = await prisma.server.findUnique({
        where: { id: 'test-server-1' }
      });

      if (!testServer) {
        testServer = await prisma.server.create({
          data: {
            id: 'test-server-1',
            name: 'Test Server',
            ownerId: testUser.id,
            type: 'PUBLIC'
          }
        });
      }

      testChannel = await prisma.channel.create({
        data: {
          id: 'test-channel-1',
          name: 'general',
          type: 'TEXT',
          serverId: testServer.id
        }
      });
      console.log('✅ Test channel created:', testChannel.name);
    } else {
      console.log('✅ Test channel already exists:', testChannel.name);
    }

    console.log('\n🧪 Ready for testing! Use these tokens in your Socket.io client.');
    console.log('📝 Test channel ID: test-channel-1');

    // Write tokens to a file for easy access
    const fs = require('fs');
    const testData = {
      user1: {
        id: testUser.id,
        username: testUser.username,
        token: token
      },
      user2: {
        id: testUser2.id,
        username: testUser2.username,
        token: token2
      },
      testChannel: 'test-channel-1'
    };

    fs.writeFileSync('./test-tokens.json', JSON.stringify(testData, null, 2));
    console.log('✅ Test tokens saved to test-tokens.json');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    // Prisma is managed by the @cryb/database package
  }
}

createTestUser();