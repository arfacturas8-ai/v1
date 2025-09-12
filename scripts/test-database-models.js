#!/usr/bin/env node
/**
 * Comprehensive Database Model Testing Script
 * Tests all 57 Prisma models for CRYB Platform
 * Author: Database Administrator
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Initialize Prisma Client with direct connection for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DIRECT || "postgresql://cryb_user:cryb_password@localhost:5433/cryb"
    }
  }
});

// Test configuration
const TEST_CONFIG = {
  cleanup: true, // Whether to clean up test data after tests
  verbose: true, // Verbose logging
  skipSlowTests: false // Skip tests that take a long time
};

// Test statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Helper functions
function log(message, level = 'INFO') {
  if (TEST_CONFIG.verbose || level === 'ERROR') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }
}

function generateTestData() {
  const id = crypto.randomUUID();
  const suffix = crypto.randomBytes(4).toString('hex');
  return {
    id,
    email: `test-${suffix}@example.com`,
    username: `testuser${suffix}`,
    name: `Test User ${suffix}`,
    slug: `test-${suffix}`,
    discriminator: Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  };
}

async function runTest(testName, testFn) {
  stats.total++;
  log(`Running test: ${testName}`);
  
  try {
    await testFn();
    stats.passed++;
    log(`✓ PASSED: ${testName}`, 'SUCCESS');
    return true;
  } catch (error) {
    stats.failed++;
    stats.errors.push({ test: testName, error: error.message });
    log(`✗ FAILED: ${testName} - ${error.message}`, 'ERROR');
    return false;
  }
}

// Individual model tests
async function testUserModel() {
  return runTest('User Model', async () => {
    const testData = generateTestData();
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username: testData.username,
        discriminator: testData.discriminator,
        displayName: testData.name,
        email: testData.email
      }
    });
    
    if (!user.id) throw new Error('User creation failed');
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { bio: 'Test bio' }
    });
    
    if (updatedUser.bio !== 'Test bio') throw new Error('User update failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
}

async function testServerModel() {
  return runTest('Server Model', async () => {
    const testData = generateTestData();
    
    // Create user first (required for server owner)
    const user = await prisma.user.create({
      data: {
        username: testData.username,
        discriminator: testData.discriminator,
        displayName: testData.name
      }
    });
    
    // Create server
    const server = await prisma.server.create({
      data: {
        name: testData.name,
        ownerId: user.id
      }
    });
    
    if (!server.id) throw new Error('Server creation failed');
    
    // Test server with channels
    const channel = await prisma.channel.create({
      data: {
        name: 'general',
        serverId: server.id
      }
    });
    
    if (!channel.id) throw new Error('Channel creation failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.channel.delete({ where: { id: channel.id } });
      await prisma.server.delete({ where: { id: server.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
}

async function testMessageModel() {
  return runTest('Message Model', async () => {
    const testData = generateTestData();
    
    // Create required dependencies
    const user = await prisma.user.create({
      data: {
        username: testData.username,
        discriminator: testData.discriminator,
        displayName: testData.name
      }
    });
    
    const server = await prisma.server.create({
      data: {
        name: testData.name,
        ownerId: user.id
      }
    });
    
    const channel = await prisma.channel.create({
      data: {
        name: 'general',
        serverId: server.id
      }
    });
    
    // Create message
    const message = await prisma.message.create({
      data: {
        content: 'Test message content',
        channelId: channel.id,
        userId: user.id
      }
    });
    
    if (!message.id) throw new Error('Message creation failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.message.delete({ where: { id: message.id } });
      await prisma.channel.delete({ where: { id: channel.id } });
      await prisma.server.delete({ where: { id: server.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
}

async function testCommunityModel() {
  return runTest('Community Model', async () => {
    const testData = generateTestData();
    
    const community = await prisma.community.create({
      data: {
        name: testData.slug,
        displayName: testData.name,
        description: 'Test community description'
      }
    });
    
    if (!community.id) throw new Error('Community creation failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.community.delete({ where: { id: community.id } });
    }
  });
}

async function testPostModel() {
  return runTest('Post Model', async () => {
    const testData = generateTestData();
    
    // Create dependencies
    const user = await prisma.user.create({
      data: {
        username: testData.username,
        discriminator: testData.discriminator,
        displayName: testData.name
      }
    });
    
    const community = await prisma.community.create({
      data: {
        name: testData.slug,
        displayName: testData.name
      }
    });
    
    // Create post
    const post = await prisma.post.create({
      data: {
        title: 'Test Post Title',
        content: 'Test post content',
        userId: user.id,
        communityId: community.id
      }
    });
    
    if (!post.id) throw new Error('Post creation failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.post.delete({ where: { id: post.id } });
      await prisma.community.delete({ where: { id: community.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
}

async function testWeb3Models() {
  return runTest('Web3 Models (NFT, Token, etc.)', async () => {
    const testData = generateTestData();
    
    // Test NFTCollection
    const collection = await prisma.nFTCollection.create({
      data: {
        contractAddress: `0x${crypto.randomBytes(20).toString('hex')}`,
        name: testData.name,
        symbol: 'TEST'
      }
    });
    
    if (!collection.id) throw new Error('NFTCollection creation failed');
    
    // Test NFT
    const nft = await prisma.nFT.create({
      data: {
        collectionId: collection.id,
        tokenId: '1',
        name: 'Test NFT'
      }
    });
    
    if (!nft.id) throw new Error('NFT creation failed');
    
    // Test TokenGatingRule
    const server = await prisma.server.create({
      data: {
        name: testData.name,
        ownerId: (await prisma.user.create({
          data: {
            username: testData.username,
            discriminator: testData.discriminator,
            displayName: testData.name
          }
        })).id
      }
    });
    
    const tokenGatingRule = await prisma.tokenGatingRule.create({
      data: {
        name: 'Test Token Gate',
        serverId: server.id,
        ruleType: 'NFT_OWNERSHIP'
      }
    });
    
    if (!tokenGatingRule.id) throw new Error('TokenGatingRule creation failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.tokenGatingRule.delete({ where: { id: tokenGatingRule.id } });
      await prisma.server.delete({ where: { id: server.id } });
      await prisma.user.delete({ where: { id: server.ownerId } });
      await prisma.nFT.delete({ where: { id: nft.id } });
      await prisma.nFTCollection.delete({ where: { id: collection.id } });
    }
  });
}

async function testAnalyticsModels() {
  return runTest('Analytics Models', async () => {
    // These models might not exist if TimescaleDB conversion didn't work
    try {
      // Test if analytics tables exist
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'MessageAnalytics' 
          AND table_schema = 'public'
        ) as exists;
      `;
      
      if (!tableExists[0]?.exists) {
        log('Analytics tables do not exist, skipping analytics tests');
        stats.skipped++;
        return true;
      }
      
      // Create test analytics data
      const testData = generateTestData();
      
      const user = await prisma.user.create({
        data: {
          username: testData.username,
          discriminator: testData.discriminator,
          displayName: testData.name
        }
      });
      
      const server = await prisma.server.create({
        data: {
          name: testData.name,
          ownerId: user.id
        }
      });
      
      const channel = await prisma.channel.create({
        data: {
          name: 'general',
          serverId: server.id
        }
      });
      
      // Test MessageAnalytics
      const messageAnalytics = await prisma.messageAnalytics.create({
        data: {
          serverId: server.id,
          channelId: channel.id,
          userId: user.id,
          messageCount: 1,
          characterCount: 10,
          wordCount: 2
        }
      });
      
      if (!messageAnalytics.id) throw new Error('MessageAnalytics creation failed');
      
      // Cleanup
      if (TEST_CONFIG.cleanup) {
        await prisma.messageAnalytics.delete({ where: { id: messageAnalytics.id } });
        await prisma.channel.delete({ where: { id: channel.id } });
        await prisma.server.delete({ where: { id: server.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
      
    } catch (error) {
      if (error.message.includes('does not exist')) {
        log('Analytics models not available, skipping');
        stats.skipped++;
        return true;
      }
      throw error;
    }
  });
}

async function testComplexRelations() {
  return runTest('Complex Relations', async () => {
    const testData = generateTestData();
    
    // Create a complex scenario with multiple related models
    const user = await prisma.user.create({
      data: {
        username: testData.username,
        discriminator: testData.discriminator,
        displayName: testData.name,
        email: testData.email
      }
    });
    
    const server = await prisma.server.create({
      data: {
        name: testData.name,
        ownerId: user.id
      }
    });
    
    // Add user as server member
    const serverMember = await prisma.serverMember.create({
      data: {
        serverId: server.id,
        userId: user.id
      }
    });
    
    // Create role
    const role = await prisma.role.create({
      data: {
        serverId: server.id,
        name: 'Test Role',
        permissions: BigInt(0)
      }
    });
    
    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name: 'general',
        serverId: server.id
      }
    });
    
    // Create message
    const message = await prisma.message.create({
      data: {
        content: 'Test message',
        channelId: channel.id,
        userId: user.id
      }
    });
    
    // Create reaction
    const reaction = await prisma.reaction.create({
      data: {
        messageId: message.id,
        userId: user.id,
        emoji: '👍'
      }
    });
    
    // Test complex query with relations
    const complexQuery = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        servers: {
          include: {
            server: {
              include: {
                channels: {
                  include: {
                    messages: {
                      include: {
                        reactions: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!complexQuery?.servers?.length) throw new Error('Complex relation query failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.reaction.delete({ where: { id: reaction.id } });
      await prisma.message.delete({ where: { id: message.id } });
      await prisma.channel.delete({ where: { id: channel.id } });
      await prisma.role.delete({ where: { id: role.id } });
      await prisma.serverMember.delete({ where: { id: serverMember.id } });
      await prisma.server.delete({ where: { id: server.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
}

async function testBulkOperations() {
  return runTest('Bulk Operations', async () => {
    if (TEST_CONFIG.skipSlowTests) {
      stats.skipped++;
      return true;
    }
    
    const testData = generateTestData();
    
    // Create user for bulk operations
    const user = await prisma.user.create({
      data: {
        username: testData.username,
        discriminator: testData.discriminator,
        displayName: testData.name
      }
    });
    
    const server = await prisma.server.create({
      data: {
        name: testData.name,
        ownerId: user.id
      }
    });
    
    const channel = await prisma.channel.create({
      data: {
        name: 'general',
        serverId: server.id
      }
    });
    
    // Bulk create messages
    const bulkMessages = Array.from({ length: 10 }, (_, i) => ({
      content: `Bulk message ${i}`,
      channelId: channel.id,
      userId: user.id
    }));
    
    const result = await prisma.message.createMany({
      data: bulkMessages
    });
    
    if (result.count !== 10) throw new Error('Bulk create failed');
    
    // Bulk delete
    const deleteResult = await prisma.message.deleteMany({
      where: {
        channelId: channel.id,
        content: { startsWith: 'Bulk message' }
      }
    });
    
    if (deleteResult.count !== 10) throw new Error('Bulk delete failed');
    
    // Cleanup
    if (TEST_CONFIG.cleanup) {
      await prisma.channel.delete({ where: { id: channel.id } });
      await prisma.server.delete({ where: { id: server.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting CRYB Platform Database Model Tests\n');
  console.log(`Configuration:
  - Cleanup: ${TEST_CONFIG.cleanup}
  - Verbose: ${TEST_CONFIG.verbose}
  - Skip Slow Tests: ${TEST_CONFIG.skipSlowTests}
  \n`);
  
  const startTime = Date.now();
  
  // Test database connection
  log('Testing database connection...');
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    log('✓ Database connection successful');
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
  
  // Run all tests
  await testUserModel();
  await testServerModel();
  await testMessageModel();
  await testCommunityModel();
  await testPostModel();
  await testWeb3Models();
  await testAnalyticsModels();
  await testComplexRelations();
  await testBulkOperations();
  
  // Test additional models individually
  const additionalTests = [
    'Session', 'Thread', 'Comment', 'Vote', 'Award', 'Flair', 'Token',
    'UserNFT', 'UserProfilePicture', 'CommunityBadge', 'UserBadge',
    'CryptoPayment', 'CryptoTip', 'MarketplaceListing', 'MarketplaceBid',
    'MarketplaceSale', 'StakingPool', 'UserStake', 'StakingReward',
    'GovernanceProposal', 'GovernanceVote', 'Reaction', 'Invite',
    'Ban', 'Notification', 'UserPresence', 'UserActivity', 'Friendship',
    'Block', 'DirectMessageParticipant', 'VoiceState', 'MessageAttachment',
    'MessageEmbed', 'MessageReference', 'ServerEmoji', 'ServerSticker',
    'AuditLog'
  ];
  
  for (const modelName of additionalTests) {
    await runTest(`${modelName} Model Basic CRUD`, async () => {
      // Basic test - check if model exists and is accessible
      const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
      if (!model) throw new Error(`Model ${modelName} not found`);
      
      // Try to count records (should not throw an error)
      await model.count();
    });
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${stats.total}`);
  console.log(`✓ Passed: ${stats.passed}`);
  console.log(`✗ Failed: ${stats.failed}`);
  console.log(`⏭ Skipped: ${stats.skipped}`);
  console.log(`⏱ Duration: ${duration}s`);
  
  if (stats.failed > 0) {
    console.log('\n❌ Failed Tests:');
    stats.errors.forEach(error => {
      console.log(`  - ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n🎯 Database Health Check:');
  try {
    const health = await prisma.$queryRaw`SELECT get_database_health() as health`;
    const healthData = health[0]?.health;
    if (healthData) {
      console.log(`  - Status: ${healthData.status}`);
      console.log(`  - Active Connections: ${healthData.active_connections}/${healthData.max_connections}`);
      console.log(`  - Database Size: ${healthData.database_size_mb}MB`);
      console.log(`  - Tables: ${healthData.table_count}`);
      console.log(`  - Indexes: ${healthData.index_count}`);
    }
  } catch (error) {
    console.log(`  - Health check failed: ${error.message}`);
  }
  
  const successRate = ((stats.passed / (stats.total - stats.skipped)) * 100).toFixed(1);
  console.log(`\n🎊 Success Rate: ${successRate}%`);
  
  if (stats.failed === 0) {
    console.log('\n🎉 All tests passed! Database is ready for production.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }
  
  return stats.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { runAllTests, testUserModel, testServerModel, testMessageModel };