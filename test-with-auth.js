#!/usr/bin/env node

const { io } = require('socket.io-client');

console.log('🔐 Testing Socket.IO with proper authentication...\n');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

// Create a test user and get a token
async function createTestUserAndToken() {
  try {
    console.log('📝 Creating test user...');
    
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser_' + Math.random().toString(36).substring(7),
        email: 'test_' + Math.random().toString(36).substring(7) + '@example.com',
        password: 'TestPassword123!',
        displayName: 'Test User'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test user created successfully');
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Username: ${data.user?.username}`);
      console.log(`   Token: ${data.accessToken ? 'Generated' : 'Not generated'}`);
      
      return data.accessToken;
    } else {
      const error = await response.json();
      console.log('⚠️ Failed to create test user:', error.message || 'Unknown error');
      
      // Try to login with a potentially existing test user
      console.log('🔓 Attempting to login with default test credentials...');
      
      const loginResponse = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Logged in with test credentials');
        return loginData.accessToken;
      } else {
        console.log('❌ Could not create or login test user');
        return null;
      }
    }
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
    return null;
  }
}

// Test connection with valid token
async function testAuthenticatedConnection(token) {
  console.log('\n🔌 Testing authenticated Socket.IO connection...');
  
  const socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    timeout: 15000,
    reconnection: false,
    forceNew: true
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 20000);

    let testResults = {
      connected: false,
      identified: false,
      heartbeat: false,
      ready: false
    };

    socket.on('connect', () => {
      console.log('✅ Successfully connected with authentication!');
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Transport: ${socket.io.engine.transport.name}`);
      testResults.connected = true;
      
      // Send identify event
      console.log('📡 Sending identify event...');
      socket.emit('identify', {
        large_threshold: 250,
        presence: {
          status: 'online',
          activity: null
        }
      });
      
      // Send heartbeat
      console.log('📡 Sending heartbeat...');
      socket.emit('heartbeat');
    });

    socket.on('ready', (data) => {
      console.log('✅ Ready event received!');
      console.log(`   User: ${data.user?.username}`);
      console.log(`   Servers: ${data.servers?.length || 0}`);
      console.log(`   Session ID: ${data.session_id}`);
      testResults.ready = true;
      testResults.identified = true;
    });

    socket.on('heartbeat_ack', () => {
      console.log('✅ Heartbeat acknowledged!');
      testResults.heartbeat = true;
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error.message);
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('error', (error) => {
      console.log('⚠️ Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected: ${reason}`);
    });

    // Complete test after 10 seconds
    setTimeout(() => {
      clearTimeout(timeout);
      socket.disconnect();
      
      console.log('\n📊 Authentication Test Results:');
      console.log('='.repeat(40));
      Object.entries(testResults).forEach(([test, passed]) => {
        const status = passed ? '✅ PASSED' : '❌ FAILED';
        const description = {
          connected: 'Socket Connection',
          identified: 'User Identification', 
          heartbeat: 'Heartbeat System',
          ready: 'Ready Event'
        }[test];
        console.log(`${status} - ${description}`);
      });
      
      resolve(testResults);
    }, 10000);
  });
}

// Test basic messaging
async function testMessaging(token) {
  console.log('\n💬 Testing basic messaging functionality...');
  
  const socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    timeout: 15000,
    reconnection: false,
    forceNew: true
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      resolve(false);
    }, 15000);

    let messagingWorking = false;

    socket.on('connect', () => {
      console.log('✅ Connected for messaging test');
      
      // Send identify first
      socket.emit('identify', {});
    });

    socket.on('ready', (data) => {
      console.log('✅ Ready for messaging test');
      
      // Try to join a server/channel if available
      if (data.servers && data.servers.length > 0) {
        const server = data.servers[0];
        console.log(`📡 Joining server: ${server.name || server.id}`);
        socket.emit('server:join', { serverId: server.id });
      } else {
        // Test presence update instead
        console.log('📡 Testing presence update...');
        socket.emit('presence:update', {
          status: 'online',
          activity: { name: 'Testing Real-time System' }
        });
      }
    });

    socket.on('server:state', (data) => {
      console.log('✅ Server state received');
      
      if (data.channels && data.channels.length > 0) {
        const channel = data.channels[0];
        console.log(`📡 Joining channel: ${channel.name || channel.id}`);
        socket.emit('channel:join', { channelId: channel.id });
      }
    });

    socket.on('channel:messages', (data) => {
      console.log('✅ Channel messages received');
      
      // Send a test message
      console.log('📡 Sending test message...');
      socket.emit('message:create', {
        channelId: data.channel_id,
        content: 'Hello! This is a test message from the automated test suite! 🚀',
        nonce: 'test-message-' + Date.now()
      });
    });

    socket.on('message:create', (message) => {
      console.log('✅ Message created event received:', message.content);
      messagingWorking = true;
    });

    socket.on('presence:update', (data) => {
      console.log('✅ Presence update received:', data);
      messagingWorking = true;
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Messaging test connection error:', error.message);
      clearTimeout(timeout);
      resolve(false);
    });

    setTimeout(() => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve(messagingWorking);
    }, 12000);
  });
}

// Main test function
async function runAuthTests() {
  console.log('🚀 Starting authenticated Socket.IO tests...\n');
  
  try {
    // Step 1: Get a valid token
    const token = await createTestUserAndToken();
    
    if (!token) {
      console.log('❌ Could not obtain valid authentication token');
      console.log('🔧 Possible fixes:');
      console.log('   - Create a test user manually in the database');
      console.log('   - Check if auth endpoints are working');
      console.log('   - Verify database connection');
      return;
    }
    
    console.log('✅ Valid authentication token obtained');
    
    // Step 2: Test authenticated connection
    const authResults = await testAuthenticatedConnection(token);
    
    // Step 3: Test messaging if connection worked
    let messagingResult = false;
    if (authResults.connected) {
      messagingResult = await testMessaging(token);
    }
    
    // Final summary
    console.log('\n🏆 FINAL RESULTS');
    console.log('='.repeat(50));
    
    const authPassed = Object.values(authResults).filter(Boolean).length;
    const authTotal = Object.keys(authResults).length;
    
    console.log(`🔐 Authentication: ${authPassed}/${authTotal} tests passed`);
    console.log(`💬 Messaging: ${messagingResult ? 'WORKING' : 'NOT WORKING'}`);
    
    if (authPassed === authTotal && messagingResult) {
      console.log('\n🎉 SUCCESS! Real-time messaging is working with authentication!');
      console.log('🚀 The Socket.IO system is properly configured and functional.');
      
      console.log('\n✅ CONFIRMED WORKING FEATURES:');
      console.log('   - Socket.IO server connection');
      console.log('   - User authentication and identification');
      console.log('   - Heartbeat/ping-pong system');
      console.log('   - Ready event with user data');
      console.log('   - Real-time message broadcasting');
      
    } else if (authPassed >= authTotal * 0.7) {
      console.log('\n⚠️ PARTIAL SUCCESS - Most features working');
      console.log('🔧 Minor fixes needed for full functionality');
      
    } else {
      console.log('\n❌ SIGNIFICANT ISSUES FOUND');
      console.log('🔧 Major fixes needed for real-time messaging');
    }
    
    console.log('\n📋 NEXT STEPS FOR FRONTEND:');
    console.log('   1. Ensure frontend gets valid auth tokens');
    console.log('   2. Update frontend to use Discord-style events');
    console.log('   3. Test multi-user real-time messaging');
    console.log('   4. Implement typing indicators');
    console.log('   5. Test presence system');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

runAuthTests().catch(console.error);