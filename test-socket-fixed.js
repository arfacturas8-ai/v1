#!/usr/bin/env node

/**
 * Socket.io Authentication Test with Real Token
 */

const { io } = require('socket.io-client');

// Test with a server running on port 3002
const SERVER_URL = 'http://localhost:3002';

// Create a simple test token manually (we'll extract this from auth later)
// For now, let's test the authentication flow to see what exactly is failing

console.log('🔍 Testing Socket.io Authentication Flow...');
console.log(`📡 Server: ${SERVER_URL}`);

// Test 1: Connect without token to see exact error
console.log('\n--- TEST 1: Connection without token to check error details ---');
const socket1 = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

socket1.on('connect', () => {
  console.log('✅ Connected without token (should not happen)');
  socket1.disconnect();
});

socket1.on('connect_error', (error) => {
  console.log('❌ Connection error details:', {
    message: error.message,
    description: error.description,
    type: error.type,
    data: error.data
  });
});

// Test 2: Try with a fake token to see how authentication is handled
console.log('\n--- TEST 2: Connection with fake token ---');
const fakeToken = 'fake.token.here';

const socket2 = io(SERVER_URL, {
  autoConnect: false,
  auth: {
    token: fakeToken
  },
  transports: ['websocket', 'polling']
});

socket2.on('connect', () => {
  console.log('✅ Connected with fake token (should not happen)');
  socket2.disconnect();
});

socket2.on('connect_error', (error) => {
  console.log('❌ Connection error with fake token:', {
    message: error.message,
    description: error.description,
    type: error.type,
    data: error.data
  });
});

socket2.on('error', (error) => {
  console.log('🚨 Socket error:', error);
});

// Test 3: Check if server is requiring authentication at all
console.log('\n--- TEST 3: Check server Socket.io endpoint ---');
const socket3 = io(SERVER_URL, {
  autoConnect: false,
  forceNew: true,
  timeout: 5000
});

socket3.on('connect', () => {
  console.log('✅ Connected to server (authentication may not be enabled)');
  
  // Try to send a message to see if it requires auth
  socket3.emit('ping', {test: true}, (response) => {
    console.log('📨 Ping response:', response);
  });
  
  setTimeout(() => socket3.disconnect(), 1000);
});

socket3.on('connect_error', (error) => {
  console.log('❌ Base connection failed:', {
    message: error.message,
    type: error.type
  });
});

socket3.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Run tests
async function runTests() {
  console.log('\n🚀 Starting authentication tests...\n');
  
  try {
    // Test 1
    socket1.connect();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2
    socket2.connect();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3
    socket3.connect();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n✅ Tests completed');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Test error:', error);
    process.exit(1);
  }
}

runTests();