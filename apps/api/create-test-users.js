#!/usr/bin/env node

/**
 * Create Test Users for Socket.IO Testing
 * Creates test users in the database and generates valid tokens
 */

const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, hashPassword } = require('@cryb/auth');

const prisma = new PrismaClient();

const testUsers = [
  {
    id: 'test-user-socket-1',
    username: 'sockettest1',
    displayName: 'Socket Test User 1',
    email: 'sockettest1@example.com',
    password: 'TestPassword123!'
  },
  {
    id: 'test-user-socket-2',
    username: 'sockettest2', 
    displayName: 'Socket Test User 2',
    email: 'sockettest2@example.com',
    password: 'TestPassword123!'
  }
];

async function createTestUsers() {
  console.log('🔄 Creating test users for Socket.IO testing...');

  try {
    const createdUsers = [];
    
    for (const userData of testUsers) {
      console.log(`👤 Creating user: ${userData.displayName}`);
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          username: userData.username,
          displayName: userData.displayName,
          password: hashedPassword,
          isVerified: true,
          emailVerifiedAt: new Date()
        },
        create: {
          id: userData.id,
          username: userData.username,
          displayName: userData.displayName,
          email: userData.email,
          password: hashedPassword,
          isVerified: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Generate valid access token
      const token = generateAccessToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        sessionId: `session-${user.id}-${Date.now()}`
      });

      createdUsers.push({
        user,
        token
      });

      console.log(`✅ User created: ${user.displayName} (${user.id})`);
      console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    }

    console.log('\n📊 Test Users Summary:');
    console.log('======================');
    
    for (const { user, token } of createdUsers) {
      console.log(`👤 ${user.displayName}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Token: ${token}`);
      console.log('');
    }

    // Save tokens to a file for the test script
    const tokenData = {
      user1: {
        id: createdUsers[0].user.id,
        username: createdUsers[0].user.username,
        displayName: createdUsers[0].user.displayName,
        token: createdUsers[0].token
      },
      user2: {
        id: createdUsers[1].user.id,
        username: createdUsers[1].user.username,
        displayName: createdUsers[1].user.displayName,
        token: createdUsers[1].token
      }
    };

    const fs = require('fs');
    fs.writeFileSync('./test-tokens.json', JSON.stringify(tokenData, null, 2));
    console.log('💾 Tokens saved to test-tokens.json');

    return tokenData;

  } catch (error) {
    console.error('❌ Failed to create test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUsers()
    .then(() => {
      console.log('✅ Test users created successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { createTestUsers };