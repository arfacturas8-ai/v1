#!/usr/bin/env node

/**
 * Socket.io Authentication Debug Test
 * 
 * This script tests Socket.io authentication to identify the core issue
 */

const { io } = require('socket.io-client');

// Test configurations
const SERVER_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTcwOTU3NzYwMCwiZXhwIjoxNzA5NTgxMjAwfQ.test-signature'; // Fake JWT for testing

console.log('🔍 Starting Socket.io Authentication Debug Test...');
console.log(`📡 Server: ${SERVER_URL}`);

// Test 1: Connection with no authentication
console.log('\n--- TEST 1: Connection without authentication ---');
const socket1 = io(SERVER_URL, {
  autoConnect: false
});

socket1.on('connect', () => {
  console.log('✅ Connected without auth (unexpected!)');
  socket1.disconnect();
});

socket1.on('connect_error', (error) => {
  console.log('❌ Connection failed without auth (expected):', error.message);
});

// Test 2: Connection with auth token in auth property
console.log('\n--- TEST 2: Connection with auth.token ---');
const socket2 = io(SERVER_URL, {
  autoConnect: false,
  auth: {
    token: TEST_TOKEN
  }
});

socket2.on('connect', () => {
  console.log('✅ Connected with auth.token');
  
  // Test message sending
  socket2.emit('message:send', {
    channelId: 'test-channel',
    content: 'Hello World!'
  }, (response) => {
    console.log('📨 Message send response:', response);
  });
  
  setTimeout(() => socket2.disconnect(), 1000);
});

socket2.on('connect_error', (error) => {
  console.log('❌ Connection failed with auth.token:', error.message);
});

// Test 3: Connection with Authorization header
console.log('\n--- TEST 3: Connection with Authorization header ---');
const socket3 = io(SERVER_URL, {
  autoConnect: false,
  extraHeaders: {
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

socket3.on('connect', () => {
  console.log('✅ Connected with Authorization header');
  setTimeout(() => socket3.disconnect(), 1000);
});

socket3.on('connect_error', (error) => {
  console.log('❌ Connection failed with Authorization header:', error.message);
});

// Test 4: Connection with query token
console.log('\n--- TEST 4: Connection with query token ---');
const socket4 = io(SERVER_URL, {
  autoConnect: false,
  query: {
    token: TEST_TOKEN
  }
});

socket4.on('connect', () => {
  console.log('✅ Connected with query token');
  setTimeout(() => socket4.disconnect(), 1000);
});

socket4.on('connect_error', (error) => {
  console.log('❌ Connection failed with query token:', error.message);
});

// Run tests sequentially
async function runTests() {
  try {
    console.log('\nStarting test sequence...\n');
    
    // Test 1
    socket1.connect();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2  
    socket2.connect();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3
    socket3.connect();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4
    socket4.connect();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✅ All tests completed');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Test error:', error);
    process.exit(1);
  }
}

// Handle connection events
[socket1, socket2, socket3, socket4].forEach((socket, i) => {
  socket.on('error', (error) => {
    console.log(`Socket ${i+1} error:`, error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`Socket ${i+1} disconnected:`, reason);
  });
});

// Start tests
runTests();