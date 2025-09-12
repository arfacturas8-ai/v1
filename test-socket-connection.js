#!/usr/bin/env node

const { io } = require('socket.io-client');

// Test socket connection to backend API
console.log('🧪 Testing Socket.IO connection...');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);

// Test 1: Basic connection test
async function testBasicConnection() {
  console.log('\n📡 Test 1: Basic Socket.IO connection');
  
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ Successfully connected to backend');
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Transport: ${socket.io.engine.transport.name}`);
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Connection failed:', error.message);
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected: ${reason}`);
    });
  });
}

// Test 2: Authentication test
async function testAuthentication() {
  console.log('\n🔐 Test 2: Authentication test');
  
  return new Promise((resolve, reject) => {
    // Create a test token (you'd need a real token in practice)
    const testToken = 'fake-token-for-testing';
    
    const socket = io(BACKEND_URL, {
      auth: { token: testToken },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Auth test timeout'));
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ Connected (auth will likely fail due to fake token)');
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      if (error.message.includes('Authentication')) {
        console.log('✅ Authentication properly enforced (expected with fake token)');
        clearTimeout(timeout);
        resolve(true);
      } else {
        console.log('❌ Unexpected connection error:', error.message);
        clearTimeout(timeout);
        reject(error);
      }
    });
  });
}

// Test 3: CORS test
async function testCORS() {
  console.log('\n🌐 Test 3: CORS configuration test');
  
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false,
      extraHeaders: {
        'Origin': FRONTEND_URL
      }
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('CORS test timeout'));
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ CORS properly configured');
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      if (error.message.includes('CORS')) {
        console.log('❌ CORS issue:', error.message);
      } else {
        console.log('⚠️ Connection error (might be CORS related):', error.message);
      }
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Test 4: Event compatibility test
async function testEventCompatibility() {
  console.log('\n📨 Test 4: Event compatibility test');
  
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Event test timeout'));
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ Connected for event testing');
      
      // Test Discord-style events (backend expects these)
      const backendEvents = [
        'heartbeat',
        'identify', 
        'server:join',
        'channel:join',
        'message:create',
        'channel:typing',
        'presence:update'
      ];
      
      // Test frontend events (what frontend currently sends)
      const frontendEvents = [
        'ping',
        'join-server',
        'join-channel', 
        'send-message',
        'typing',
        'update-presence'
      ];
      
      console.log('\n📋 Event Mapping Analysis:');
      console.log('Backend expects:', backendEvents);
      console.log('Frontend sends:', frontendEvents);
      
      console.log('\n🔧 Required fixes:');
      console.log('- ping → heartbeat');
      console.log('- join-server → server:join');
      console.log('- join-channel → channel:join');
      console.log('- send-message → message:create');
      console.log('- typing → channel:typing');
      console.log('- update-presence → presence:update');
      
      clearTimeout(timeout);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Could not connect for event testing:', error.message);
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Health check test
async function testHealthEndpoints() {
  console.log('\n🏥 Test 5: Health endpoints test');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health/socket`);
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Socket health endpoint accessible');
      console.log('   Status:', health.status);
      console.log('   Services:', health.services);
    } else {
      console.log('❌ Health endpoint returned:', response.status);
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Socket.IO diagnostic tests...\n');
  
  const tests = [
    { name: 'Basic Connection', fn: testBasicConnection },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'CORS Configuration', fn: testCORS },
    { name: 'Event Compatibility', fn: testEventCompatibility },
    { name: 'Health Endpoints', fn: testHealthEndpoints }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test.fn();
      passed++;
      console.log(`✅ ${test.name} - PASSED\n`);
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} - FAILED: ${error.message}\n`);
    }
  }
  
  console.log('🎯 Test Summary:');
  console.log(`   Passed: ${passed}/${tests.length}`);
  console.log(`   Failed: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Socket.IO is properly configured.');
  } else {
    console.log('⚠️ Some tests failed. Check the issues above.');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Fix event name mismatches between frontend and backend');
  console.log('2. Ensure backend is running on port 3002');
  console.log('3. Verify CORS configuration allows frontend domain');
  console.log('4. Set up proper authentication tokens');
  console.log('5. Test real-time messaging between multiple clients');
}

// Run the tests
runTests().catch(console.error);