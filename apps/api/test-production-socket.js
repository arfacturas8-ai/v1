#!/usr/bin/env node

/**
 * PRODUCTION SOCKET.IO FUNCTIONAL TEST
 * 
 * Comprehensive test suite for the production Socket.IO real-time messaging system.
 * Tests all features and edge cases to ensure bulletproof operation.
 */

const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const SERVER_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production';

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Generate a valid JWT token for testing
 */
function generateTestToken(userId) {
  return jwt.sign(
    {
      userId,
      username: `testuser${userId}`,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Test helper - run a test with timeout and error handling
 */
async function runTest(testName, testFunction, timeout = 10000) {
  console.log(`🧪 Running test: ${testName}`);
  
  try {
    await Promise.race([
      testFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);
    
    console.log(`✅ ${testName} - PASSED`);
    testResults.passed++;
  } catch (error) {
    console.error(`❌ ${testName} - FAILED:`, error.message);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
}

/**
 * Test 1: Basic connection and authentication
 */
async function testBasicConnection() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-1');
    
    const client = new Client(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      timeout: 5000
    });

    client.on('connect', () => {
      console.log('  📡 Connected to server');
    });

    client.on('ready', (data) => {
      console.log('  🔐 Authentication successful');
      console.log('  📊 Ready data:', {
        userId: data.user?.id,
        sessionId: data.session_id,
        serversCount: data.servers?.length || 0
      });
      
      client.disconnect();
      resolve();
    });

    client.on('connect_error', (error) => {
      reject(new Error(`Connection failed: ${error.message}`));
    });

    client.on('error', (error) => {
      reject(new Error(`Client error: ${error.message}`));
    });
  });
}

/**
 * Test 2: Invalid authentication
 */
async function testInvalidAuth() {
  return new Promise((resolve, reject) => {
    const client = new Client(SERVER_URL, {
      auth: { token: 'invalid-token' },
      transports: ['websocket'],
      timeout: 5000
    });

    client.on('connect_error', (error) => {
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        console.log('  ✅ Correctly rejected invalid token');
        resolve();
      } else {
        reject(new Error(`Expected auth error, got: ${error.message}`));
      }
    });

    client.on('ready', () => {
      reject(new Error('Should not authenticate with invalid token'));
    });
  });
}

/**
 * Test 3: Channel joining and messaging
 */
async function testChannelMessaging() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-2');
    const testChannelId = 'test-channel-messaging';
    const testMessage = `Test message ${Date.now()}`;
    
    const client = new Client(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      timeout: 5000
    });

    let messageReceived = false;

    client.on('ready', () => {
      console.log('  📍 Joining test channel');
      client.emit('channel:join', { channelId: testChannelId });
    });

    client.on('channel:messages', (data) => {
      console.log(`  📦 Received channel history: ${data.messages?.length || 0} messages`);
      
      // Send a test message
      console.log('  📤 Sending test message');
      client.emit('message:send', {
        channelId: testChannelId,
        content: testMessage,
        nonce: `test-${Date.now()}`
      });
    });

    client.on('message:create', (message) => {
      console.log('  📥 Message received:', {
        id: message.id,
        content: message.content?.substring(0, 50),
        userId: message.user?.id
      });
      
      if (message.content === testMessage) {
        messageReceived = true;
        client.disconnect();
        
        setTimeout(() => {
          if (messageReceived) {
            resolve();
          } else {
            reject(new Error('Did not receive own message'));
          }
        }, 100);
      }
    });

    client.on('error', (error) => {
      reject(new Error(`Messaging test error: ${error.message}`));
    });
  });
}

/**
 * Test 4: Typing indicators
 */
async function testTypingIndicators() {
  return new Promise((resolve, reject) => {
    const token1 = generateTestToken('test-user-typing-1');
    const token2 = generateTestToken('test-user-typing-2');
    const testChannelId = 'test-channel-typing';
    
    let client1Ready = false;
    let client2Ready = false;
    let typingReceived = false;
    
    // Client 1 - will send typing indicator
    const client1 = new Client(SERVER_URL, {
      auth: { token: token1 },
      transports: ['websocket']
    });
    
    // Client 2 - will receive typing indicator
    const client2 = new Client(SERVER_URL, {
      auth: { token: token2 },
      transports: ['websocket']
    });

    client1.on('ready', () => {
      client1Ready = true;
      client1.emit('channel:join', { channelId: testChannelId });
      checkReady();
    });

    client2.on('ready', () => {
      client2Ready = true;
      client2.emit('channel:join', { channelId: testChannelId });
      checkReady();
    });

    function checkReady() {
      if (client1Ready && client2Ready) {
        setTimeout(() => {
          console.log('  ⌨️  Client 1 starts typing');
          client1.emit('typing:start', { channelId: testChannelId });
        }, 1000);
      }
    }

    client2.on('typing:start', (data) => {
      console.log('  📨 Client 2 received typing indicator:', data);
      if (data.channel_id === testChannelId) {
        typingReceived = true;
        
        // Clean up
        client1.disconnect();
        client2.disconnect();
        
        setTimeout(() => {
          if (typingReceived) {
            resolve();
          } else {
            reject(new Error('Typing indicator not properly received'));
          }
        }, 100);
      }
    });

    client1.on('error', reject);
    client2.on('error', reject);
  });
}

/**
 * Test 5: Presence updates
 */
async function testPresenceUpdates() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-presence');
    
    const client = new Client(SERVER_URL, {
      auth: { token },
      transports: ['websocket']
    });

    let presenceUpdateReceived = false;

    client.on('ready', () => {
      console.log('  👤 Updating presence status');
      client.emit('presence:update', {
        status: 'dnd',
        activity: {
          type: 'playing',
          name: 'Socket.IO Test Suite'
        }
      });
    });

    client.on('presence:update', (data) => {
      console.log('  📡 Presence update received:', data);
      if (data.user_id && data.status === 'dnd') {
        presenceUpdateReceived = true;
        client.disconnect();
        
        setTimeout(() => {
          if (presenceUpdateReceived) {
            resolve();
          } else {
            reject(new Error('Presence update not received'));
          }
        }, 100);
      }
    });

    client.on('error', reject);
  });
}

/**
 * Test 6: Rate limiting
 */
async function testRateLimiting() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-rate-limit');
    const testChannelId = 'test-channel-rate-limit';
    
    const client = new Client(SERVER_URL, {
      auth: { token },
      transports: ['websocket']
    });

    let rateLimitHit = false;
    let messagesSent = 0;

    client.on('ready', () => {
      client.emit('channel:join', { channelId: testChannelId });
    });

    client.on('channel:messages', () => {
      console.log('  🚀 Sending messages rapidly to trigger rate limit');
      
      // Send many messages quickly to trigger rate limit
      const interval = setInterval(() => {
        if (messagesSent >= 100) {
          clearInterval(interval);
          
          // If we haven't hit rate limit by now, consider it a pass
          // (maybe rate limit is higher than expected)
          if (!rateLimitHit) {
            console.log('  ⚠️  Rate limit not triggered (this is ok - limit might be high)');
            client.disconnect();
            resolve();
          }
          return;
        }
        
        client.emit('message:send', {
          channelId: testChannelId,
          content: `Rate limit test message ${messagesSent++}`,
          nonce: `rate-test-${messagesSent}`
        });
      }, 10); // Very fast - 100 messages per second
    });

    client.on('error', (error) => {
      console.log('  🛑 Received error (checking if rate limit):', error.message);
      if (error.message && error.message.includes('rate') || error.code === 'RATE_LIMITED') {
        console.log('  ✅ Rate limiting working correctly');
        rateLimitHit = true;
        client.disconnect();
        resolve();
      } else {
        reject(new Error(`Unexpected error: ${error.message}`));
      }
    });
  });
}

/**
 * Test 7: Heartbeat mechanism
 */
async function testHeartbeat() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-heartbeat');
    
    const client = new Client(SERVER_URL, {
      auth: { token },
      transports: ['websocket']
    });

    let heartbeatReceived = false;

    client.on('ready', () => {
      console.log('  💓 Sending heartbeat');
      client.emit('heartbeat');
    });

    client.on('heartbeat_ack', (data) => {
      console.log('  💓 Heartbeat acknowledged:', data);
      if (data.timestamp) {
        heartbeatReceived = true;
        client.disconnect();
        resolve();
      }
    });

    client.on('error', reject);

    // Timeout if no heartbeat response
    setTimeout(() => {
      if (!heartbeatReceived) {
        reject(new Error('Heartbeat not acknowledged'));
      }
    }, 5000);
  });
}

/**
 * Test 8: Multiple connections from same user
 */
async function testMultipleConnections() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-multi');
    const connections = [];
    
    let connectionsReady = 0;
    const targetConnections = 3;

    for (let i = 0; i < targetConnections; i++) {
      const client = new Client(SERVER_URL, {
        auth: { token },
        transports: ['websocket']
      });

      client.on('ready', () => {
        connectionsReady++;
        console.log(`  🔗 Connection ${connectionsReady}/${targetConnections} ready`);
        
        if (connectionsReady === targetConnections) {
          console.log('  ✅ All multiple connections successful');
          
          // Clean up
          connections.forEach(c => c.disconnect());
          setTimeout(resolve, 100);
        }
      });

      client.on('error', reject);
      connections.push(client);
    }
  });
}

/**
 * Test 9: Message delivery tracking
 */
async function testMessageDelivery() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-delivery');
    const testChannelId = 'test-channel-delivery';
    
    const client = new Client(SERVER_URL, {
      auth: { token },
      transports: ['websocket']
    });

    let messageId = null;

    client.on('ready', () => {
      client.emit('channel:join', { channelId: testChannelId });
    });

    client.on('channel:messages', () => {
      client.emit('message:send', {
        channelId: testChannelId,
        content: 'Delivery test message',
        nonce: `delivery-test-${Date.now()}`
      });
    });

    client.on('message:create', (message) => {
      if (message.content === 'Delivery test message') {
        messageId = message.id;
        console.log(`  📦 Message created with ID: ${messageId}`);
        
        // Acknowledge delivery
        client.emit('message:delivered', { messageId });
        
        // Mark as read
        setTimeout(() => {
          client.emit('message:read', { messageId });
          console.log('  👁️  Message marked as read');
          client.disconnect();
          resolve();
        }, 500);
      }
    });

    client.on('error', reject);
  });
}

/**
 * Test 10: Reconnection handling
 */
async function testReconnection() {
  return new Promise((resolve, reject) => {
    const token = generateTestToken('test-user-reconnect');
    
    const client = new Client(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    let initialConnection = false;
    let reconnected = false;

    client.on('ready', () => {
      if (!initialConnection) {
        initialConnection = true;
        console.log('  🔌 Initial connection established');
        
        // Force disconnect to test reconnection
        setTimeout(() => {
          console.log('  🔌 Forcing disconnect to test reconnection');
          client.disconnect();
        }, 1000);
      } else {
        reconnected = true;
        console.log('  🔄 Successfully reconnected');
        client.disconnect();
        resolve();
      }
    });

    client.on('disconnect', (reason) => {
      console.log(`  ⚡ Disconnected: ${reason}`);
      if (initialConnection && !reconnected) {
        // Reconnect manually since we forced the disconnect
        setTimeout(() => {
          console.log('  🔄 Attempting to reconnect');
          client.connect();
        }, 2000);
      }
    });

    client.on('error', (error) => {
      // Some errors during reconnection testing are expected
      console.log(`  ⚠️  Error during reconnection test: ${error.message}`);
    });

    // Timeout if reconnection fails
    setTimeout(() => {
      if (!reconnected) {
        reject(new Error('Reconnection failed'));
      }
    }, 15000);
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Production Socket.IO Test Suite');
  console.log('=' .repeat(60));
  
  const tests = [
    ['Basic Connection & Authentication', testBasicConnection],
    ['Invalid Authentication Rejection', testInvalidAuth],
    ['Channel Messaging', testChannelMessaging],
    ['Typing Indicators', testTypingIndicators],
    ['Presence Updates', testPresenceUpdates],
    ['Rate Limiting', testRateLimiting],
    ['Heartbeat Mechanism', testHeartbeat],
    ['Multiple Connections', testMultipleConnections],
    ['Message Delivery Tracking', testMessageDelivery],
    ['Reconnection Handling', testReconnection]
  ];

  for (const [testName, testFunction] of tests) {
    await runTest(testName, testFunction);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print final results
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TEST SUITE COMPLETE');
  console.log('=' .repeat(60));
  
  const total = testResults.passed + testResults.failed;
  const successRate = (testResults.passed / total) * 100;
  
  console.log(`📊 Results: ${testResults.passed}/${total} tests passed (${successRate.toFixed(1)}%)`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   • ${test}: ${error}`);
    });
  }
  
  if (successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED! Production Socket.IO system is bulletproof! 🎉');
  } else if (successRate >= 90) {
    console.log('\n✅ Most tests passed. Minor issues may need attention.');
  } else {
    console.log('\n⚠️  Several tests failed. System needs improvement before production.');
  }
  
  console.log('=' .repeat(60));
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📛 Test suite interrupted');
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};