const { buildApp } = require('./src/app');
const { prisma } = require('@cryb/database');
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

// Inline createTestUser function
async function createTestUser(overrides = {}) {
  const userId = randomUUID();
  const baseUsername = overrides.username || `testuser_${userId.substring(0, 8)}`;
  const username = baseUsername;
  const email = overrides.email || `${username}@test.example`;

  return await prisma.user.create({
    data: {
      id: userId,
      username,
      email,
      displayName: overrides.displayName || `Test User ${userId.substring(0, 8)}`,
      password: await bcrypt.hash('testpassword123', 10),
      isVerified: true,
      status: 'online',
      avatar: null,
      banner: null,
      bio: 'Test user created for integration tests',
      ...overrides
    }
  });
}

async function testChannelFunctionality() {
  console.log('🚀 Starting manual channel functionality test...');
  
  let app;
  
  try {
    // Build app
    console.log('📱 Building app...');
    app = await buildApp({ logger: false });
    await app.ready();
    console.log('✅ App ready');
    
    // Health check
    console.log('🏥 Running health check...');
    const healthResponse = await app.inject({
      method: 'GET',
      url: '/health'
    });
    console.log(`Health status: ${healthResponse.statusCode}`);
    
    // Create test user
    console.log('👤 Creating test user...');
    const testUser = await createTestUser({ username: `test_${Date.now()}` });
    console.log(`Created user: ${testUser.username}`);
    
    // Create test server
    console.log('🏠 Creating test server...');
    const testServer = await prisma.server.create({
      data: {
        id: randomUUID(),
        name: 'Test Server',
        description: 'Test server for channel functionality',
        ownerId: testUser.id,
        memberCount: 1
      }
    });
    
    // Add owner as member
    await prisma.serverMember.create({
      data: {
        serverId: testServer.id,
        userId: testUser.id
      }
    });
    console.log(`Created server: ${testServer.name}`);
    
    // Login user
    console.log('🔐 Logging in user...');
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        username: testUser.username,
        password: 'testpassword123'
      }
    });
    
    if (loginResponse.statusCode !== 200) {
      throw new Error(`Login failed: ${loginResponse.statusCode} - ${loginResponse.body}`);
    }
    
    const authToken = JSON.parse(loginResponse.body).data.accessToken;
    console.log('✅ Login successful');
    
    // Test 1: Create a text channel
    console.log('📝 Testing channel creation...');
    const channelResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/channels',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        serverId: testServer.id,
        name: 'test-channel',
        description: 'A test channel',
        type: 'TEXT'
      }
    });
    
    if (channelResponse.statusCode !== 201) {
      throw new Error(`Channel creation failed: ${channelResponse.statusCode} - ${channelResponse.body}`);
    }
    
    const channelData = JSON.parse(channelResponse.body).data;
    console.log(`✅ Created channel: ${channelData.name} (${channelData.type})`);
    
    // Test 2: Get channel details
    console.log('📖 Testing channel retrieval...');
    const getChannelResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${channelData.id}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });
    
    if (getChannelResponse.statusCode !== 200) {
      throw new Error(`Get channel failed: ${getChannelResponse.statusCode} - ${getChannelResponse.body}`);
    }
    console.log('✅ Channel retrieval successful');
    
    // Test 3: Update channel
    console.log('✏️ Testing channel update...');
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/channels/${channelData.id}`,
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        name: 'updated-channel',
        description: 'Updated description'
      }
    });
    
    if (updateResponse.statusCode !== 200) {
      throw new Error(`Channel update failed: ${updateResponse.statusCode} - ${updateResponse.body}`);
    }
    console.log('✅ Channel update successful');
    
    // Test 4: Send a message
    console.log('💬 Testing message sending...');
    const messageResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/messages',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        channelId: channelData.id,
        content: 'Hello, this is a test message!'
      }
    });
    
    if (messageResponse.statusCode !== 201) {
      throw new Error(`Message creation failed: ${messageResponse.statusCode} - ${messageResponse.body}`);
    }
    
    const messageData = JSON.parse(messageResponse.body).data;
    console.log(`✅ Created message: ${messageData.content}`);
    
    // Test 5: Get channel messages
    console.log('📥 Testing message retrieval...');
    const messagesResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${channelData.id}/messages`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });
    
    if (messagesResponse.statusCode !== 200) {
      throw new Error(`Message retrieval failed: ${messagesResponse.statusCode} - ${messagesResponse.body}`);
    }
    
    const messagesData = JSON.parse(messagesResponse.body).data;
    console.log(`✅ Retrieved ${messagesData.messages.length} messages`);
    
    // Test 6: Add reaction
    console.log('👍 Testing message reactions...');
    const reactionResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/${messageData.id}/reactions`,
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        emoji: '👍'
      }
    });
    
    if (reactionResponse.statusCode !== 201) {
      throw new Error(`Reaction failed: ${reactionResponse.statusCode} - ${reactionResponse.body}`);
    }
    console.log('✅ Reaction added successfully');
    
    // Test 7: Pin message
    console.log('📌 Testing message pinning...');
    const pinResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/${messageData.id}/pin`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });
    
    if (pinResponse.statusCode !== 200) {
      throw new Error(`Message pinning failed: ${pinResponse.statusCode} - ${pinResponse.body}`);
    }
    console.log('✅ Message pinned successfully');
    
    // Test 8: Test typing indicator
    console.log('⌨️ Testing typing indicator...');
    const typingResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/channels/${channelData.id}/typing`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });
    
    if (typingResponse.statusCode !== 200) {
      throw new Error(`Typing indicator failed: ${typingResponse.statusCode} - ${typingResponse.body}`);
    }
    console.log('✅ Typing indicator sent successfully');
    
    // Test 9: Create voice channel
    console.log('🎤 Testing voice channel creation...');
    const voiceResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/channels',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        serverId: testServer.id,
        name: 'voice-test',
        type: 'VOICE'
      }
    });
    
    if (voiceResponse.statusCode !== 201) {
      throw new Error(`Voice channel creation failed: ${voiceResponse.statusCode} - ${voiceResponse.body}`);
    }
    console.log('✅ Voice channel created successfully');
    
    // Test 10: Channel permissions
    console.log('🔒 Testing channel permissions...');
    const permissionsResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${channelData.id}/permissions`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });
    
    if (permissionsResponse.statusCode !== 200) {
      throw new Error(`Permissions check failed: ${permissionsResponse.statusCode} - ${permissionsResponse.body}`);
    }
    console.log('✅ Channel permissions checked successfully');
    
    console.log('\n🎉 ALL CHANNEL TESTS PASSED! 🎉');
    console.log('✅ Channel CRUD operations work correctly');
    console.log('✅ Message functionality is operational'); 
    console.log('✅ Real-time features (typing, reactions, pins) work');
    console.log('✅ Voice channels can be created');
    console.log('✅ Permission system is functional');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.message.deleteMany({
      where: { channelId: channelData.id }
    });
    await prisma.channel.deleteMany({
      where: { serverId: testServer.id }
    });
    await prisma.serverMember.deleteMany({
      where: { serverId: testServer.id }
    });
    await prisma.server.delete({
      where: { id: testServer.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Cleanup completed');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    return false;
    
  } finally {
    if (app) {
      try {
        await app.close();
        console.log('🔥 App closed');
      } catch (closeError) {
        console.error('Error closing app:', closeError);
      }
    }
  }
}

// Run the test
testChannelFunctionality()
  .then(success => {
    console.log(success ? '\n✅ CHANNEL FUNCTIONALITY VERIFIED' : '\n❌ CHANNEL FUNCTIONALITY HAS ISSUES');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 CRITICAL ERROR:', error);
    process.exit(1);
  });