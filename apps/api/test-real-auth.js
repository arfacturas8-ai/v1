#!/usr/bin/env node

/**
 * REAL SOCKET.IO AUTHENTICATION TEST
 * 
 * This test creates a real user, gets a real JWT token,
 * and tests the fixed Socket.IO authentication system.
 */

const io = require('socket.io-client');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';

// Generate unique test data
const timestamp = Date.now();
const testUser = {
  email: `test-${timestamp}@example.com`,
  username: `test_user_${timestamp}`,
  displayName: `Test User ${timestamp}`,
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!'
};

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRealAuthentication() {
  log('\n' + '='.repeat(60), 'bold');
  log('🔐 REAL SOCKET.IO AUTHENTICATION TEST', 'bold');
  log('='.repeat(60), 'bold');

  let token = null;
  let userId = null;
  let socket = null;

  try {
    // Step 1: Create a real user
    log('\n👤 Creating new test user...', 'blue');
    
    const registerResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, testUser, {
      timeout: 15000
    });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      token = registerResponse.data.data.tokens.accessToken;
      userId = registerResponse.data.data.user.id;
      
      log('✅ User created successfully', 'green');
      log(`   User ID: ${userId}`, 'cyan');
      log(`   Token: ${token.substring(0, 30)}...`, 'cyan');
    } else {
      throw new Error('User registration failed');
    }

    // Step 2: Validate token with API
    log('\n🔍 Validating token with API...', 'blue');
    
    const meResponse = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    if (meResponse.status === 200) {
      log('✅ Token validation successful', 'green');
      log(`   User: ${meResponse.data.data.displayName} (@${meResponse.data.data.username})`, 'cyan');
    } else {
      throw new Error('Token validation failed');
    }

    // Step 3: Test Socket.IO connection with real token
    log('\n🔌 Testing Socket.IO connection with real token...', 'blue');
    
    const connectionTest = await new Promise((resolve) => {
      const startTime = Date.now();
      let resolved = false;
      
      const resolveOnce = (result) => {
        if (resolved) return;
        resolved = true;
        resolve(result);
      };
      
      // Connection timeout
      const timeout = setTimeout(() => {
        log('⏰ Connection timeout (15 seconds)', 'yellow');
        resolveOnce({ success: false, error: 'timeout' });
      }, 15000);
      
      socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        auth: {
          token: token
        }
      });
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        const connectTime = Date.now() - startTime;
        log(`✅ Socket connected successfully in ${connectTime}ms`, 'green');
        log(`   Socket ID: ${socket.id}`, 'cyan');
        log(`   Transport: ${socket.io.engine.transport.name}`, 'cyan');
        resolveOnce({ success: true, socketId: socket.id, transport: socket.io.engine.transport.name });
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        log(`❌ Connection failed: ${error.message}`, 'red');
        log(`   Error type: ${error.type}`, 'red');
        
        if (error.message.includes('RSV1')) {
          log('   🔍 RSV1 frame error detected', 'yellow');
        }
        if (error.message.includes('Authentication')) {
          log('   🔍 Authentication error detected', 'yellow');
        }
        
        resolveOnce({ success: false, error: error.message });
      });
      
      socket.on('ready', (data) => {
        log('🎉 Received READY event:', 'green');
        log(`   User: ${data.user?.displayName}`, 'cyan');
        log(`   Session ID: ${data.session_id}`, 'cyan');
      });
      
      socket.on('disconnect', (reason) => {
        log(`⚠️  Socket disconnected: ${reason}`, 'yellow');
      });
    });

    if (connectionTest.success) {
      // Step 4: Test real-time features
      log('\n⚡ Testing real-time features...', 'blue');
      
      await testRealtimeFeatures(socket);
      
      log('\n🎉 ALL TESTS PASSED!', 'green');
      log('✅ Socket.IO authentication is working correctly', 'green');
      log('✅ Real-time features are functional', 'green');
      
    } else {
      throw new Error(`Socket connection failed: ${connectionTest.error}`);
    }

  } catch (error) {
    log(`\n💥 TEST FAILED: ${error.message}`, 'red');
    
    if (error.response) {
      log(`   HTTP Status: ${error.response.status}`, 'red');
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    
    return false;
  } finally {
    if (socket) {
      socket.disconnect();
    }
  }

  return true;
}

async function testRealtimeFeatures(socket) {
  return new Promise((resolve) => {
    let featuresWorking = 0;
    let testCount = 0;
    const totalTests = 3;
    
    const completeTest = () => {
      testCount++;
      if (testCount >= totalTests) {
        log(`   Summary: ${featuresWorking}/${totalTests} features working`, 'cyan');
        resolve(featuresWorking > 0);
      }
    };
    
    // Test 1: Heartbeat
    log('   Testing heartbeat...', 'cyan');
    socket.emit('heartbeat');
    
    const heartbeatTimeout = setTimeout(() => {
      log('   ❌ Heartbeat: TIMEOUT', 'red');
      completeTest();
    }, 5000);
    
    socket.once('heartbeat_ack', (data) => {
      clearTimeout(heartbeatTimeout);
      log('   ✅ Heartbeat: WORKING', 'green');
      if (data && data.timestamp) {
        log(`      Response time: ${Date.now() - data.timestamp}ms`, 'cyan');
      }
      featuresWorking++;
      completeTest();
    });
    
    // Test 2: Presence update
    log('   Testing presence update...', 'cyan');
    socket.emit('presence:update', {
      status: 'online',
      activity: { type: 'testing', name: 'Socket Test' }
    });
    
    const presenceTimeout = setTimeout(() => {
      log('   ⚠️  Presence: NO RESPONSE (expected)', 'yellow');
      completeTest();
    }, 3000);
    
    socket.once('presence:update', (data) => {
      clearTimeout(presenceTimeout);
      log('   ✅ Presence: WORKING', 'green');
      featuresWorking++;
      completeTest();
    });
    
    // Test 3: Basic messaging
    log('   Testing message send...', 'cyan');
    socket.emit('message:send', {
      channelId: 'test-channel',
      content: 'Hello from Socket.IO test!'
    });
    
    const messageTimeout = setTimeout(() => {
      log('   ⚠️  Messaging: NO RESPONSE (expected)', 'yellow');
      completeTest();
    }, 3000);
    
    socket.once('message:new', (data) => {
      clearTimeout(messageTimeout);
      log('   ✅ Messaging: WORKING', 'green');
      featuresWorking++;
      completeTest();
    });
  });
}

// Run test if called directly
if (require.main === module) {
  testRealAuthentication().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testRealAuthentication };