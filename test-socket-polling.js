#!/usr/bin/env node

/**
 * Socket.io Authentication Test - Using Polling Transport Only
 * This bypasses WebSocket compression issues
 */

const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3002';

console.log('🔍 Testing Socket.io Authentication with Polling Transport...');
console.log(`📡 Server: ${SERVER_URL}`);

// Test with polling transport only (no WebSocket compression issues)
console.log('\n--- TEST: Authentication with polling transport ---');

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['polling'], // Use polling only
  auth: {
    token: 'fake.jwt.token'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected successfully with polling transport!');
  
  // Test a simple message
  socket.emit('test', { message: 'Hello Server!' }, (response) => {
    console.log('📨 Server response:', response);
  });
  
  setTimeout(() => {
    socket.disconnect();
    console.log('🔌 Disconnected from server');
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed with polling:', {
    message: error.message,
    description: error.description,
    type: error.type,
    data: error.data
  });
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('🚨 Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Start the test
console.log('🚀 Starting authentication test with polling...\n');
socket.connect();