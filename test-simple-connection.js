#!/usr/bin/env node

const { io } = require('socket.io-client');

console.log('🔍 Testing simple Socket.IO connection...\n');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

async function testSimpleConnection() {
  console.log(`Connecting to: ${BACKEND_URL}`);
  
  // Try with polling only first
  console.log('\n📡 Test 1: Polling transport only');
  
  const socket = io(BACKEND_URL, {
    transports: ['polling'], // Only polling
    timeout: 10000,
    reconnection: false,
    forceNew: true,
    upgrade: false
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 15000);

    socket.on('connect', () => {
      console.log('✅ Connected successfully with polling!');
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Transport: ${socket.io.engine.transport.name}`);
      console.log(`   Connected: ${socket.connected}`);
      
      // Try a simple heartbeat
      console.log('📡 Testing heartbeat...');
      socket.emit('heartbeat');
      
      clearTimeout(timeout);
      
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 3000);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Connection failed:', error.message);
      console.log('   Error type:', error.type);
      console.log('   Error description:', error.description);
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected: ${reason}`);
    });

    socket.on('heartbeat_ack', () => {
      console.log('✅ Heartbeat acknowledged!');
    });

    socket.on('error', (error) => {
      console.log('⚠️ Socket error:', error);
    });
  });
}

async function testWithAuth() {
  console.log('\n🔐 Test 2: Connection with fake auth token');
  
  const socket = io(BACKEND_URL, {
    auth: { token: 'fake-test-token' },
    transports: ['polling'],
    timeout: 10000,
    reconnection: false,
    forceNew: true
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Auth test timeout'));
    }, 15000);

    socket.on('connect', () => {
      console.log('✅ Connected with auth token!');
      clearTimeout(timeout);
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.log('⚠️ Auth connection error (expected):', error.message);
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        console.log('✅ Authentication is properly enforced');
        clearTimeout(timeout);
        resolve(true);
      } else {
        console.log('❌ Unexpected error:', error);
        clearTimeout(timeout);
        reject(error);
      }
    });
  });
}

async function testWebSocket() {
  console.log('\n🌐 Test 3: WebSocket transport');
  
  const socket = io(BACKEND_URL, {
    transports: ['websocket'],
    timeout: 10000,
    reconnection: false,
    forceNew: true
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      resolve(false); // Don't reject, just mark as failed
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully!');
      clearTimeout(timeout);
      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection failed:', error.message);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// Run tests sequentially
async function runTests() {
  console.log('🚀 Starting connection diagnostic tests...\n');
  
  try {
    await testSimpleConnection();
    console.log('\n✅ Polling transport test: PASSED');
  } catch (error) {
    console.log('\n❌ Polling transport test: FAILED -', error.message);
    console.log('\n🔧 ISSUE: Basic Socket.IO connection is not working');
    console.log('   This suggests the Socket.IO server is not properly initialized');
    process.exit(1);
  }

  try {
    await testWithAuth();
    console.log('✅ Authentication test: PASSED');
  } catch (error) {
    console.log('❌ Authentication test: FAILED -', error.message);
  }

  try {
    const wsResult = await testWebSocket();
    if (wsResult) {
      console.log('✅ WebSocket transport test: PASSED');
    } else {
      console.log('❌ WebSocket transport test: FAILED');
      console.log('   This might be a server configuration issue');
    }
  } catch (error) {
    console.log('❌ WebSocket transport test: ERROR -', error.message);
  }

  console.log('\n🎯 DIAGNOSIS COMPLETE');
  console.log('='.repeat(50));
  console.log('If polling works but WebSocket fails:');
  console.log('- Check server WebSocket upgrade handling');
  console.log('- Verify reverse proxy configuration');
  console.log('- Check firewall settings');
  console.log('\nIf both fail:');
  console.log('- Socket.IO server not properly initialized');
  console.log('- Check server startup logs');
  console.log('- Verify Socket.IO middleware setup');
}

runTests().catch(console.error);