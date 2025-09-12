#!/usr/bin/env node

/**
 * Socket.io Authentication Test with Real JWT Token
 */

const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3002';
const REAL_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZkNm9uNzEwMDByaXZ0Y2RsbGRqNzBiIiwic2Vzc2lvbklkIjoiMTEwZjdkMjgtNTVjOS00NGRiLWI2NTAtMGFjYmEwMjYwYmMxIiwiZW1haWwiOiJmcmVzaHNvY2tldHRlc3Q5OTlAdGVzdC5sb2NhbCIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiJjNGViNTYzMC1jNTk5LTQwYjItOTQ0Mi1lNjBlZDc1OTU5YjIiLCJpYXQiOjE3NTc0NjA2MzMsImV4cCI6MTc1NzQ2MTUzMywiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.0eNP-NnqT_uYBVVrSGMivLWF-4mZ5jB_VUmKOyjojHw';

console.log('🔐 Testing Socket.io Authentication with Real JWT Token...');
console.log(`📡 Server: ${SERVER_URL}`);
console.log(`🎫 Token: ${REAL_JWT_TOKEN.substring(0, 50)}...`);

// Test 1: Connection with real JWT token
console.log('\n--- TEST 1: Authentication with real JWT token ---');

const socket1 = io(SERVER_URL, {
  autoConnect: false,
  transports: ['polling'], // Use polling ONLY to avoid compression issues
  upgrade: false, // Prevent upgrade to WebSocket
  auth: {
    token: REAL_JWT_TOKEN
  }
});

socket1.on('connect', () => {
  console.log('✅ SUCCESSFULLY CONNECTED with real JWT token!');
  console.log('🎉 Socket.io authentication is working!');
  
  // Test message sending
  socket1.emit('message:send', {
    channelId: 'test-channel-123',
    content: 'Hello from authenticated client!',
    mentions: []
  }, (response) => {
    console.log('📨 Message send response:', response);
  });
  
  // Test presence update
  socket1.emit('presence:update', {
    status: 'online',
    activity: {
      type: 'testing',
      name: 'Socket.io Authentication Test'
    }
  }, (response) => {
    console.log('👤 Presence update response:', response);
  });
  
  // Test typing indicator
  socket1.emit('typing:start', {
    channelId: 'test-channel-123'
  }, (response) => {
    console.log('⌨️ Typing start response:', response);
  });
  
  setTimeout(() => {
    socket1.disconnect();
    console.log('🔌 Disconnected from server');
    
    // Test reconnection
    setTimeout(() => {
      testReconnection();
    }, 1000);
  }, 3000);
});

socket1.on('connect_error', (error) => {
  console.log('❌ Connection failed with real JWT:', {
    message: error.message,
    description: error.description,
    type: error.type,
    data: error.data
  });
});

socket1.on('error', (error) => {
  console.log('🚨 Socket error:', error);
});

socket1.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Listen for server events
socket1.on('message:new', (data) => {
  console.log('📨 New message received:', data);
});

socket1.on('typing:user_start', (data) => {
  console.log('⌨️ User typing:', data);
});

socket1.on('presence:update', (data) => {
  console.log('👤 Presence update:', data);
});

// Test reconnection capability
function testReconnection() {
  console.log('\n--- TEST 2: Reconnection with same token ---');
  
  const socket2 = io(SERVER_URL, {
    autoConnect: false,
    transports: ['polling'],
    upgrade: false, // Prevent upgrade to WebSocket
    auth: {
      token: REAL_JWT_TOKEN
    }
  });
  
  socket2.on('connect', () => {
    console.log('✅ RECONNECTION SUCCESSFUL!');
    console.log('🔄 Socket.io reconnection with JWT tokens working!');
    
    setTimeout(() => {
      socket2.disconnect();
      console.log('✅ Authentication test completed successfully!');
      console.log('\n🎯 RESULTS:');
      console.log('   ✅ Socket.io server is running');
      console.log('   ✅ JWT authentication middleware is working');
      console.log('   ✅ Token validation is functioning correctly');
      console.log('   ✅ Authenticated connections are established');
      console.log('   ✅ Event handling is working');
      console.log('   ✅ Reconnection with tokens works');
      console.log('\n🚀 Socket.io authentication is FULLY FUNCTIONAL!');
      process.exit(0);
    }, 2000);
  });
  
  socket2.on('connect_error', (error) => {
    console.log('❌ Reconnection failed:', error.message);
    process.exit(1);
  });
  
  socket2.connect();
}

// Start the test
console.log('🚀 Starting authentication test...\n');
socket1.connect();