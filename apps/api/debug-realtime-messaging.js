#!/usr/bin/env node

/**
 * REALTIME MESSAGING DEBUG TEST
 * 
 * This script tests the Socket.io real-time messaging system to identify
 * and fix issues with message broadcasting between clients.
 */

const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';

async function createTestUser() {
  try {
    // Register a test user
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: `Test User ${Date.now()}`
    };

    console.log('🔄 Creating test user:', userData.username);
    
    const registerResponse = await axios.post(`${API_URL}/api/v1/auth/register`, userData);
    
    if (registerResponse.status === 201) {
      console.log('✅ Test user created successfully');
      
      // Login to get token
      const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Test user logged in successfully');
        return {
          token: loginResponse.data.token,
          user: loginResponse.data.user
        };
      }
    }
  } catch (error) {
    console.error('❌ Error creating test user:', error.response?.data || error.message);
    
    // Try to login with existing user
    try {
      const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email: 'testuser@example.com',
        password: 'TestPassword123!'
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Using existing test user');
        return {
          token: loginResponse.data.token,
          user: loginResponse.data.user
        };
      }
    } catch (loginError) {
      console.error('❌ Could not login with existing user either');
      return null;
    }
  }
  return null;
}

async function createTestChannel(token) {
  try {
    console.log('🔄 Creating test channel...');
    
    // First create a test server
    const serverResponse = await axios.post(`${API_URL}/api/v1/servers`, {
      name: `Test Server ${Date.now()}`,
      description: 'Test server for message debugging'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (serverResponse.status === 201) {
      const serverId = serverResponse.data.id;
      console.log('✅ Test server created:', serverId);
      
      // Create a text channel
      const channelResponse = await axios.post(`${API_URL}/api/v1/channels`, {
        serverId: serverId,
        name: 'general',
        type: 'TEXT',
        description: 'General discussion channel'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (channelResponse.status === 201) {
        console.log('✅ Test channel created:', channelResponse.data.id);
        return {
          serverId: serverId,
          channelId: channelResponse.data.id
        };
      }
    }
  } catch (error) {
    console.error('❌ Error creating test channel:', error.response?.data || error.message);
    
    // Try to get existing channels
    try {
      const channelsResponse = await axios.get(`${API_URL}/api/v1/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (channelsResponse.data && channelsResponse.data.length > 0) {
        const channel = channelsResponse.data[0];
        console.log('✅ Using existing channel:', channel.id);
        return {
          serverId: channel.serverId,
          channelId: channel.id
        };
      }
    } catch (getError) {
      console.error('❌ Could not get existing channels either');
    }
  }
  return null;
}

function createSocketConnection(token, userId, displayName) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Creating socket connection for ${displayName}...`);
    
    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    socket.on('connect', () => {
      console.log(`✅ Socket connected for ${displayName}:`, socket.id);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ Socket connection error for ${displayName}:`, error.message);
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected for ${displayName}:`, reason);
    });

    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${displayName}:`, error);
    });

    // Setup message listeners
    socket.on('ready', (data) => {
      console.log(`📦 Ready event received for ${displayName}:`, {
        user: data.user?.displayName,
        sessionId: data.session_id
      });
    });

    socket.on('message:create', (message) => {
      console.log(`📨 Message received by ${displayName}:`, {
        id: message.id,
        content: message.content,
        author: message.user?.displayName,
        channelId: message.channelId,
        timestamp: message.createdAt
      });
    });

    socket.on('typing:start', (data) => {
      console.log(`⌨️  Typing started by user ${data.user_id} in channel ${data.channel_id}`);
    });

    socket.on('typing:stop', (data) => {
      console.log(`⌨️  Typing stopped by user ${data.user_id} in channel ${data.channel_id}`);
    });

    socket.on('channel:messages', (data) => {
      console.log(`📚 Channel messages received for ${displayName}:`, {
        channelId: data.channel_id,
        messageCount: data.messages?.length || 0
      });
    });

    setTimeout(() => {
      if (!socket.connected) {
        reject(new Error(`Connection timeout for ${displayName}`));
      }
    }, 15000);
  });
}

async function testRealtimeMessaging() {
  console.log('🚀 STARTING REALTIME MESSAGING DEBUG TEST');
  console.log('==========================================');

  try {
    // Step 1: Create test users
    console.log('\n📝 Step 1: Creating test users...');
    
    const user1Data = await createTestUser();
    if (!user1Data) {
      throw new Error('Failed to create first test user');
    }
    
    const user2Data = await createTestUser();
    if (!user2Data) {
      throw new Error('Failed to create second test user');
    }

    console.log('✅ Test users created successfully');

    // Step 2: Create test channel
    console.log('\n📝 Step 2: Creating test channel...');
    
    const channelData = await createTestChannel(user1Data.token);
    if (!channelData) {
      throw new Error('Failed to create test channel');
    }

    console.log('✅ Test channel created successfully');

    // Step 3: Connect sockets
    console.log('\n📝 Step 3: Connecting WebSocket clients...');
    
    const socket1 = await createSocketConnection(
      user1Data.token, 
      user1Data.user.id, 
      user1Data.user.displayName
    );
    
    const socket2 = await createSocketConnection(
      user2Data.token, 
      user2Data.user.id, 
      user2Data.user.displayName
    );

    console.log('✅ Both sockets connected successfully');

    // Step 4: Join channel
    console.log('\n📝 Step 4: Joining test channel...');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for ready events
    
    socket1.emit('channel:join', { channelId: channelData.channelId });
    socket2.emit('channel:join', { channelId: channelData.channelId });
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for join to complete

    console.log('✅ Both users joined the channel');

    // Step 5: Test typing indicators
    console.log('\n📝 Step 5: Testing typing indicators...');
    
    socket1.emit('typing:start', { channelId: channelData.channelId });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    socket1.emit('typing:stop', { channelId: channelData.channelId });
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Typing indicators tested');

    // Step 6: Send test messages
    console.log('\n📝 Step 6: Testing message delivery...');
    
    let messagesReceived = 0;
    let expectedMessages = 4;
    
    // Set up message counters
    socket1.on('message:create', () => messagesReceived++);
    socket2.on('message:create', () => messagesReceived++);
    
    // Send messages from both users
    console.log('📤 Sending message from User 1...');
    socket1.emit('message:send', {
      channelId: channelData.channelId,
      content: 'Hello from User 1! Testing real-time messaging.',
      nonce: `test-msg-1-${Date.now()}`
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📤 Sending message from User 2...');
    socket2.emit('message:send', {
      channelId: channelData.channelId,
      content: 'Hello from User 2! This is a response message.',
      nonce: `test-msg-2-${Date.now()}`
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send another round of messages
    console.log('📤 Sending follow-up message from User 1...');
    socket1.emit('message:send', {
      channelId: channelData.channelId,
      content: 'This is a follow-up message to test broadcasting.',
      nonce: `test-msg-3-${Date.now()}`
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📤 Sending final message from User 2...');
    socket2.emit('message:send', {
      channelId: channelData.channelId,
      content: 'Final test message - checking if all clients receive this.',
      nonce: `test-msg-4-${Date.now()}`
    });

    // Wait for messages to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 7: Analyze results
    console.log('\n📝 Step 7: Analyzing results...');
    console.log(`📊 Messages received: ${messagesReceived}/${expectedMessages}`);
    
    if (messagesReceived === expectedMessages) {
      console.log('✅ ALL MESSAGES DELIVERED SUCCESSFULLY!');
      console.log('✅ Real-time messaging system is working correctly.');
    } else if (messagesReceived > 0) {
      console.log('⚠️  PARTIAL MESSAGE DELIVERY - Some messages were received');
      console.log('🔧 Message broadcasting may have issues but basic connectivity works');
    } else {
      console.log('❌ NO MESSAGES RECEIVED - Message broadcasting is broken');
      console.log('🔧 Need to debug message sending and receiving logic');
    }

    // Step 8: Test presence updates
    console.log('\n📝 Step 8: Testing presence updates...');
    
    socket1.emit('presence:update', {
      status: 'idle',
      activity: {
        type: 'custom',
        name: 'Testing presence system'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Cleanup
    console.log('\n📝 Cleanup: Disconnecting sockets...');
    socket1.disconnect();
    socket2.disconnect();

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    
    return {
      success: true,
      messagesReceived,
      expectedMessages,
      deliveryRate: (messagesReceived / expectedMessages) * 100
    };

  } catch (error) {
    console.error('\n💥 TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Additional diagnostic function
async function diagnoseSocketConnection() {
  console.log('\n🔍 RUNNING SOCKET CONNECTION DIAGNOSTICS');
  console.log('=========================================');

  try {
    // Test basic API connectivity
    console.log('🔄 Testing API connectivity...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ API is responding:', healthResponse.status);

    // Test socket.io endpoint
    console.log('🔄 Testing Socket.io endpoint...');
    const socketInfoResponse = await axios.get(`${API_URL}/socket.io/`);
    console.log('✅ Socket.io endpoint is available');

    // Test health endpoints
    console.log('🔄 Testing socket health endpoints...');
    try {
      const socketHealthResponse = await axios.get(`${API_URL}/health/socket`);
      console.log('✅ Socket health:', socketHealthResponse.data);
    } catch (healthError) {
      console.log('⚠️  Socket health endpoint not available');
    }

    try {
      const socketMetricsResponse = await axios.get(`${API_URL}/metrics/socket`);
      console.log('✅ Socket metrics:', socketMetricsResponse.data);
    } catch (metricsError) {
      console.log('⚠️  Socket metrics endpoint not available');
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  }
}

// Run the test
async function main() {
  console.log('🚀 REALTIME MESSAGING SYSTEM DIAGNOSTIC TOOL');
  console.log('============================================');
  
  // Run diagnostics first
  await diagnoseSocketConnection();
  
  // Run the main test
  const result = await testRealtimeMessaging();
  
  if (result.success) {
    console.log(`\n🎯 FINAL RESULT: ${result.deliveryRate.toFixed(1)}% message delivery rate`);
    
    if (result.deliveryRate === 100) {
      console.log('🎉 REAL-TIME MESSAGING IS WORKING PERFECTLY!');
    } else if (result.deliveryRate >= 50) {
      console.log('⚠️  REAL-TIME MESSAGING HAS ISSUES BUT IS PARTIALLY FUNCTIONAL');
    } else {
      console.log('❌ REAL-TIME MESSAGING IS SEVERELY BROKEN');
    }
  } else {
    console.log('\n❌ TEST FAILED - Unable to complete message delivery test');
  }
  
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRealtimeMessaging, diagnoseSocketConnection };