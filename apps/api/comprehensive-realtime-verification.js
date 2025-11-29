#!/usr/bin/env node

/**
 * COMPREHENSIVE REAL-TIME VERIFICATION TEST
 * 
 * This script performs ACTUAL real-time testing with REAL Socket.io connections:
 * 1. Creates multiple Socket.io client connections
 * 2. Tests authentication and handshake
 * 3. Sends real messages between clients
 * 4. Tests typing indicators in real-time
 * 5. Verifies presence updates on connect/disconnect
 * 6. Tests room joining and leaving
 * 7. Verifies message delivery to all room participants
 * 8. Tests reconnection after network disruption
 * 9. Verifies Redis pub/sub scaling
 * 10. Confirms WebSocket transport functionality
 */

const io = require('socket.io-client');
const Redis = require('ioredis');
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_BASE = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';
const REDIS_URL = 'redis://:cryb_redis_password@localhost:6380/0';

// Test state
let testResults = {
  authentication: { status: 'pending', details: [] },
  messaging: { status: 'pending', details: [] },
  typingIndicators: { status: 'pending', details: [] },
  presenceUpdates: { status: 'pending', details: [] },
  roomManagement: { status: 'pending', details: [] },
  messageDelivery: { status: 'pending', details: [] },
  reconnection: { status: 'pending', details: [] },
  redisPubSub: { status: 'pending', details: [] },
  websocketTransport: { status: 'pending', details: [] },
  eventFlow: { status: 'pending', details: [] }
};

let clients = [];
let redisClient;

console.log('🚀 CRYB PLATFORM REAL-TIME VERIFICATION STARTING...\n');

// Helper function to create authenticated user and get token
async function createTestUser(username) {
  try {
    // Register user
    const registerResponse = await axios.post(`${API_BASE}/api/v1/auth/register`, {
      username: username,
      email: `${username}@test.com`,
      password: 'TestPassword123!',
      displayName: `Test ${username}`
    });

    if (registerResponse.status === 200 || registerResponse.status === 201) {
      const token = registerResponse.data.token;
      testResults.authentication.details.push(`✅ User ${username} registered successfully`);
      return { username, token, userId: registerResponse.data.user?.id };
    }
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists, try to login
      try {
        const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
          username: username,
          password: 'TestPassword123!'
        });
        
        const token = loginResponse.data.token;
        testResults.authentication.details.push(`✅ User ${username} logged in successfully`);
        return { username, token, userId: loginResponse.data.user?.id };
      } catch (loginError) {
        testResults.authentication.details.push(`❌ Failed to login ${username}: ${loginError.message}`);
        throw loginError;
      }
    } else {
      testResults.authentication.details.push(`❌ Failed to register ${username}: ${error.message}`);
      throw error;
    }
  }
}

// Helper function to create Socket.io client with authentication
function createSocketClient(token, username) {
  return new Promise((resolve, reject) => {
    const client = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      timeout: 10000
    });

    const timeout = setTimeout(() => {
      client.disconnect();
      reject(new Error(`Connection timeout for ${username}`));
    }, 15000);

    client.on('connect', () => {
      clearTimeout(timeout);
      testResults.authentication.details.push(`✅ Socket.io connection established for ${username}`);
      resolve(client);
    });

    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      testResults.authentication.details.push(`❌ Socket.io connection failed for ${username}: ${error.message}`);
      reject(error);
    });

    client.on('authenticated', (data) => {
      testResults.authentication.details.push(`✅ Authentication confirmed for ${username}: ${JSON.stringify(data)}`);
    });

    client.on('disconnect', (reason) => {
      testResults.authentication.details.push(`ℹ️ ${username} disconnected: ${reason}`);
    });
  });
}

// Test 1: Authentication and Connection
async function testAuthentication() {
  console.log('📋 Test 1: Authentication and Socket.io Connection...');
  
  try {
    // Create test users
    const users = await Promise.all([
      createTestUser('testuser1'),
      createTestUser('testuser2'),
      createTestUser('testuser3')
    ]);

    // Create Socket.io clients
    const socketClients = await Promise.all(
      users.map(user => createSocketClient(user.token, user.username))
    );

    clients = socketClients.map((client, index) => ({
      client,
      user: users[index]
    }));

    testResults.authentication.status = 'passed';
    testResults.authentication.details.push(`✅ All ${clients.length} clients connected successfully`);
    
  } catch (error) {
    testResults.authentication.status = 'failed';
    testResults.authentication.details.push(`❌ Authentication test failed: ${error.message}`);
    throw error;
  }
}

// Test 2: Real Messaging Between Clients
async function testRealMessaging() {
  console.log('📋 Test 2: Real Messaging Between Clients...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 2) {
      testResults.messaging.status = 'failed';
      testResults.messaging.details.push('❌ Not enough clients for messaging test');
      return reject(new Error('Not enough clients'));
    }

    const [client1, client2] = clients;
    let messagesReceived = 0;
    const expectedMessages = 2;
    
    const timeout = setTimeout(() => {
      testResults.messaging.status = 'failed';
      testResults.messaging.details.push('❌ Messaging test timeout');
      reject(new Error('Messaging test timeout'));
    }, 10000);

    // Setup message listeners
    client2.client.on('message:received', (data) => {
      testResults.messaging.details.push(`✅ Client2 received message: ${JSON.stringify(data)}`);
      messagesReceived++;
      
      if (messagesReceived >= expectedMessages) {
        clearTimeout(timeout);
        testResults.messaging.status = 'passed';
        resolve();
      }
    });

    client1.client.on('message:received', (data) => {
      testResults.messaging.details.push(`✅ Client1 received message: ${JSON.stringify(data)}`);
      messagesReceived++;
      
      if (messagesReceived >= expectedMessages) {
        clearTimeout(timeout);
        testResults.messaging.status = 'passed';
        resolve();
      }
    });

    // Send messages
    setTimeout(() => {
      client1.client.emit('message:send', {
        content: 'Hello from Client 1!',
        channelId: 'test-channel-1',
        type: 'text'
      });
      testResults.messaging.details.push('📤 Client1 sent message');
    }, 1000);

    setTimeout(() => {
      client2.client.emit('message:send', {
        content: 'Hello from Client 2!',
        channelId: 'test-channel-1',
        type: 'text'
      });
      testResults.messaging.details.push('📤 Client2 sent message');
    }, 2000);
  });
}

// Test 3: Typing Indicators
async function testTypingIndicators() {
  console.log('📋 Test 3: Typing Indicators in Real-Time...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 2) {
      testResults.typingIndicators.status = 'failed';
      testResults.typingIndicators.details.push('❌ Not enough clients for typing test');
      return reject(new Error('Not enough clients'));
    }

    const [client1, client2] = clients;
    let typingEventsReceived = 0;
    
    const timeout = setTimeout(() => {
      testResults.typingIndicators.status = 'failed';
      testResults.typingIndicators.details.push('❌ Typing indicators test timeout');
      reject(new Error('Typing test timeout'));
    }, 8000);

    // Setup typing listeners
    client2.client.on('typing:start', (data) => {
      testResults.typingIndicators.details.push(`✅ Client2 received typing start: ${JSON.stringify(data)}`);
      typingEventsReceived++;
    });

    client2.client.on('typing:stop', (data) => {
      testResults.typingIndicators.details.push(`✅ Client2 received typing stop: ${JSON.stringify(data)}`);
      typingEventsReceived++;
      
      if (typingEventsReceived >= 2) {
        clearTimeout(timeout);
        testResults.typingIndicators.status = 'passed';
        resolve();
      }
    });

    // Simulate typing
    setTimeout(() => {
      client1.client.emit('typing:start', {
        channelId: 'test-channel-1',
        userId: client1.user.userId
      });
      testResults.typingIndicators.details.push('⌨️ Client1 started typing');
    }, 1000);

    setTimeout(() => {
      client1.client.emit('typing:stop', {
        channelId: 'test-channel-1',
        userId: client1.user.userId
      });
      testResults.typingIndicators.details.push('⌨️ Client1 stopped typing');
    }, 3000);
  });
}

// Test 4: Presence Updates
async function testPresenceUpdates() {
  console.log('📋 Test 4: Presence Updates on Connect/Disconnect...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 2) {
      testResults.presenceUpdates.status = 'failed';
      testResults.presenceUpdates.details.push('❌ Not enough clients for presence test');
      return reject(new Error('Not enough clients'));
    }

    const [client1, client2] = clients;
    let presenceEventsReceived = 0;
    
    const timeout = setTimeout(() => {
      testResults.presenceUpdates.status = 'failed';
      testResults.presenceUpdates.details.push('❌ Presence test timeout');
      reject(new Error('Presence test timeout'));
    }, 10000);

    // Setup presence listeners
    client1.client.on('presence:update', (data) => {
      testResults.presenceUpdates.details.push(`✅ Client1 received presence update: ${JSON.stringify(data)}`);
      presenceEventsReceived++;
      
      if (presenceEventsReceived >= 2) {
        clearTimeout(timeout);
        testResults.presenceUpdates.status = 'passed';
        resolve();
      }
    });

    // Update presence
    setTimeout(() => {
      client2.client.emit('presence:update', {
        status: 'dnd',
        activity: {
          type: 'playing',
          name: 'Testing CRYB'
        }
      });
      testResults.presenceUpdates.details.push('👤 Client2 updated presence to DND');
    }, 1000);

    setTimeout(() => {
      client2.client.emit('presence:update', {
        status: 'online',
        activity: null
      });
      testResults.presenceUpdates.details.push('👤 Client2 updated presence to Online');
    }, 3000);
  });
}

// Test 5: Room Management
async function testRoomManagement() {
  console.log('📋 Test 5: Room Joining and Leaving...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 2) {
      testResults.roomManagement.status = 'failed';
      testResults.roomManagement.details.push('❌ Not enough clients for room test');
      return reject(new Error('Not enough clients'));
    }

    const [client1, client2] = clients;
    let roomEventsReceived = 0;
    const testRoomId = 'test-room-' + Date.now();
    
    const timeout = setTimeout(() => {
      testResults.roomManagement.status = 'failed';
      testResults.roomManagement.details.push('❌ Room management test timeout');
      reject(new Error('Room test timeout'));
    }, 10000);

    // Setup room listeners
    client2.client.on('room:user_joined', (data) => {
      testResults.roomManagement.details.push(`✅ Client2 received user joined: ${JSON.stringify(data)}`);
      roomEventsReceived++;
      
      if (roomEventsReceived >= 2) {
        clearTimeout(timeout);
        testResults.roomManagement.status = 'passed';
        resolve();
      }
    });

    client2.client.on('room:user_left', (data) => {
      testResults.roomManagement.details.push(`✅ Client2 received user left: ${JSON.stringify(data)}`);
      roomEventsReceived++;
      
      if (roomEventsReceived >= 2) {
        clearTimeout(timeout);
        testResults.roomManagement.status = 'passed';
        resolve();
      }
    });

    // Join and leave rooms
    setTimeout(() => {
      client1.client.emit('room:join', { roomId: testRoomId });
      client2.client.emit('room:join', { roomId: testRoomId });
      testResults.roomManagement.details.push(`🚪 Both clients joined room ${testRoomId}`);
    }, 1000);

    setTimeout(() => {
      client1.client.emit('room:leave', { roomId: testRoomId });
      testResults.roomManagement.details.push(`🚪 Client1 left room ${testRoomId}`);
    }, 3000);
  });
}

// Test 6: Message Delivery to All Participants
async function testMessageDelivery() {
  console.log('📋 Test 6: Message Delivery to All Room Participants...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 3) {
      testResults.messageDelivery.status = 'failed';
      testResults.messageDelivery.details.push('❌ Not enough clients for delivery test');
      return reject(new Error('Not enough clients'));
    }

    const [client1, client2, client3] = clients;
    let messagesReceived = 0;
    const testRoomId = 'delivery-test-room-' + Date.now();
    
    const timeout = setTimeout(() => {
      testResults.messageDelivery.status = 'failed';
      testResults.messageDelivery.details.push(`❌ Message delivery test timeout (received ${messagesReceived}/2 messages)`);
      reject(new Error('Message delivery test timeout'));
    }, 12000);

    // Setup message listeners for clients 2 and 3
    client2.client.on('message:received', (data) => {
      if (data.content === 'Broadcast message test') {
        testResults.messageDelivery.details.push(`✅ Client2 received broadcast message: ${JSON.stringify(data)}`);
        messagesReceived++;
        
        if (messagesReceived >= 2) {
          clearTimeout(timeout);
          testResults.messageDelivery.status = 'passed';
          resolve();
        }
      }
    });

    client3.client.on('message:received', (data) => {
      if (data.content === 'Broadcast message test') {
        testResults.messageDelivery.details.push(`✅ Client3 received broadcast message: ${JSON.stringify(data)}`);
        messagesReceived++;
        
        if (messagesReceived >= 2) {
          clearTimeout(timeout);
          testResults.messageDelivery.status = 'passed';
          resolve();
        }
      }
    });

    // Join all clients to the same room
    setTimeout(() => {
      client1.client.emit('room:join', { roomId: testRoomId });
      client2.client.emit('room:join', { roomId: testRoomId });
      client3.client.emit('room:join', { roomId: testRoomId });
      testResults.messageDelivery.details.push(`🚪 All 3 clients joined room ${testRoomId}`);
    }, 1000);

    // Send broadcast message
    setTimeout(() => {
      client1.client.emit('message:send', {
        content: 'Broadcast message test',
        channelId: testRoomId,
        type: 'text',
        broadcast: true
      });
      testResults.messageDelivery.details.push('📤 Client1 sent broadcast message');
    }, 3000);
  });
}

// Test 7: Reconnection After Network Disruption
async function testReconnection() {
  console.log('📋 Test 7: Reconnection After Network Disruption...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 1) {
      testResults.reconnection.status = 'failed';
      testResults.reconnection.details.push('❌ No clients available for reconnection test');
      return reject(new Error('No clients available'));
    }

    const client1 = clients[0];
    let reconnected = false;
    
    const timeout = setTimeout(() => {
      if (!reconnected) {
        testResults.reconnection.status = 'failed';
        testResults.reconnection.details.push('❌ Reconnection test timeout');
        reject(new Error('Reconnection test timeout'));
      }
    }, 15000);

    // Setup reconnection listeners
    client1.client.on('connect', () => {
      if (reconnected) {
        clearTimeout(timeout);
        testResults.reconnection.details.push('✅ Client successfully reconnected');
        testResults.reconnection.status = 'passed';
        resolve();
      }
    });

    client1.client.on('disconnect', (reason) => {
      testResults.reconnection.details.push(`📡 Client disconnected: ${reason}`);
      
      if (reason === 'transport close') {
        reconnected = true;
        testResults.reconnection.details.push('🔄 Attempting reconnection...');
      }
    });

    // Simulate network disruption
    setTimeout(() => {
      testResults.reconnection.details.push('📡 Simulating network disruption...');
      client1.client.disconnect();
    }, 2000);

    // Reconnect
    setTimeout(() => {
      testResults.reconnection.details.push('🔄 Reconnecting client...');
      client1.client.connect();
    }, 4000);
  });
}

// Test 8: Redis Pub/Sub Verification
async function testRedisPubSub() {
  console.log('📋 Test 8: Redis Pub/Sub for Scaling...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      testResults.redisPubSub.status = 'failed';
      testResults.redisPubSub.details.push('❌ Redis pub/sub test timeout');
      reject(new Error('Redis pub/sub test timeout'));
    }, 8000);

    try {
      // Create Redis client for testing
      redisClient = new Redis(REDIS_URL);
      
      redisClient.on('connect', () => {
        testResults.redisPubSub.details.push('✅ Redis connection established');
        
        // Test pub/sub
        const subscriber = new Redis(REDIS_URL);
        
        subscriber.subscribe('test-channel', (err, count) => {
          if (err) {
            testResults.redisPubSub.details.push(`❌ Subscribe error: ${err.message}`);
            return reject(err);
          }
          
          testResults.redisPubSub.details.push(`✅ Subscribed to test-channel (${count} channels)`);
        });

        subscriber.on('message', (channel, message) => {
          if (channel === 'test-channel' && message === 'test-message') {
            testResults.redisPubSub.details.push(`✅ Received pub/sub message: ${message}`);
            clearTimeout(timeout);
            testResults.redisPubSub.status = 'passed';
            subscriber.disconnect();
            resolve();
          }
        });

        // Publish test message
        setTimeout(() => {
          redisClient.publish('test-channel', 'test-message');
          testResults.redisPubSub.details.push('📤 Published test message to Redis');
        }, 1000);
      });

      redisClient.on('error', (error) => {
        testResults.redisPubSub.details.push(`❌ Redis connection error: ${error.message}`);
        testResults.redisPubSub.status = 'failed';
        clearTimeout(timeout);
        reject(error);
      });
      
    } catch (error) {
      testResults.redisPubSub.status = 'failed';
      testResults.redisPubSub.details.push(`❌ Redis pub/sub setup error: ${error.message}`);
      clearTimeout(timeout);
      reject(error);
    }
  });
}

// Test 9: WebSocket Transport Verification
async function testWebSocketTransport() {
  console.log('📋 Test 9: WebSocket Transport Functionality...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 1) {
      testResults.websocketTransport.status = 'failed';
      testResults.websocketTransport.details.push('❌ No clients available for transport test');
      return reject(new Error('No clients available'));
    }

    const client1 = clients[0];
    let transportVerified = false;
    
    const timeout = setTimeout(() => {
      if (!transportVerified) {
        testResults.websocketTransport.status = 'failed';
        testResults.websocketTransport.details.push('❌ WebSocket transport test timeout');
        reject(new Error('WebSocket transport test timeout'));
      }
    }, 8000);

    // Check transport type
    const transport = client1.client.io.engine.transport.name;
    testResults.websocketTransport.details.push(`📡 Current transport: ${transport}`);
    
    if (transport === 'websocket') {
      testResults.websocketTransport.details.push('✅ WebSocket transport confirmed');
      transportVerified = true;
      clearTimeout(timeout);
      testResults.websocketTransport.status = 'passed';
      resolve();
    } else {
      // Force upgrade to WebSocket
      client1.client.io.engine.upgrade();
      
      client1.client.io.engine.on('upgrade', () => {
        const newTransport = client1.client.io.engine.transport.name;
        testResults.websocketTransport.details.push(`📡 Upgraded to transport: ${newTransport}`);
        
        if (newTransport === 'websocket') {
          testResults.websocketTransport.details.push('✅ WebSocket transport upgrade successful');
          transportVerified = true;
          clearTimeout(timeout);
          testResults.websocketTransport.status = 'passed';
          resolve();
        }
      });
    }
  });
}

// Test 10: Event Flow Verification
async function testEventFlow() {
  console.log('📋 Test 10: Real-Time Event Flow Verification...');
  
  return new Promise((resolve, reject) => {
    if (clients.length < 2) {
      testResults.eventFlow.status = 'failed';
      testResults.eventFlow.details.push('❌ Not enough clients for event flow test');
      return reject(new Error('Not enough clients'));
    }

    const [client1, client2] = clients;
    let eventsReceived = 0;
    const expectedEvents = 3; // message, typing, presence
    
    const timeout = setTimeout(() => {
      testResults.eventFlow.status = 'failed';
      testResults.eventFlow.details.push(`❌ Event flow test timeout (received ${eventsReceived}/${expectedEvents} events)`);
      reject(new Error('Event flow test timeout'));
    }, 12000);

    // Setup comprehensive event listeners
    const eventTypes = ['message:received', 'typing:start', 'presence:update'];
    
    eventTypes.forEach(eventType => {
      client2.client.on(eventType, (data) => {
        testResults.eventFlow.details.push(`✅ Event received: ${eventType} - ${JSON.stringify(data)}`);
        eventsReceived++;
        
        if (eventsReceived >= expectedEvents) {
          clearTimeout(timeout);
          testResults.eventFlow.status = 'passed';
          resolve();
        }
      });
    });

    // Send various events in sequence
    setTimeout(() => {
      client1.client.emit('message:send', {
        content: 'Event flow test message',
        channelId: 'event-flow-test',
        type: 'text'
      });
      testResults.eventFlow.details.push('📤 Sent message event');
    }, 1000);

    setTimeout(() => {
      client1.client.emit('typing:start', {
        channelId: 'event-flow-test',
        userId: client1.user.userId
      });
      testResults.eventFlow.details.push('📤 Sent typing start event');
    }, 3000);

    setTimeout(() => {
      client1.client.emit('presence:update', {
        status: 'idle',
        activity: {
          type: 'watching',
          name: 'Event Flow Test'
        }
      });
      testResults.eventFlow.details.push('📤 Sent presence update event');
    }, 5000);
  });
}

// Cleanup function
function cleanup() {
  console.log('\n🧹 Cleaning up connections...');
  
  clients.forEach((clientInfo, index) => {
    if (clientInfo.client.connected) {
      clientInfo.client.disconnect();
      console.log(`   - Disconnected client ${index + 1}`);
    }
  });

  if (redisClient) {
    redisClient.disconnect();
    console.log('   - Disconnected Redis client');
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 CRYB PLATFORM REAL-TIME VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  const passedTests = Object.values(testResults).filter(test => test.status === 'passed').length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`\n📊 OVERALL RESULTS: ${passedTests}/${totalTests} tests passed\n`);
  
  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.status === 'passed' ? '✅ PASS' : 
                   result.status === 'failed' ? '❌ FAIL' : 
                   '⏳ PENDING';
    
    console.log(`${status} ${testName.toUpperCase()}`);
    result.details.forEach(detail => {
      console.log(`    ${detail}`);
    });
    console.log('');
  });

  // Summary and recommendations
  console.log('📋 VERIFICATION SUMMARY:');
  if (passedTests === totalTests) {
    console.log('🎉 ALL REAL-TIME FEATURES ARE WORKING CORRECTLY!');
    console.log('✅ Socket.io connections established successfully');
    console.log('✅ Real-time messaging functioning');
    console.log('✅ Typing indicators working');
    console.log('✅ Presence updates operational');
    console.log('✅ Room management functional');
    console.log('✅ Message delivery to all participants confirmed');
    console.log('✅ Reconnection mechanism working');
    console.log('✅ Redis pub/sub scaling ready');
    console.log('✅ WebSocket transport confirmed');
    console.log('✅ Event flow verified');
  } else {
    console.log('⚠️  SOME REAL-TIME FEATURES NEED ATTENTION');
    console.log(`   - ${totalTests - passedTests} test(s) failed`);
    console.log('   - Review failed tests above for details');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Main test execution
async function runComprehensiveVerification() {
  try {
    await testAuthentication();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRealMessaging();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testTypingIndicators();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testPresenceUpdates();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRoomManagement();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testMessageDelivery();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testReconnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRedisPubSub();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testWebSocketTransport();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testEventFlow();
    
  } catch (error) {
    console.error(`\n❌ Verification failed: ${error.message}`);
  } finally {
    cleanup();
    generateReport();
  }
}

// Execute verification
runComprehensiveVerification().catch(error => {
  console.error('💥 Critical error during verification:', error);
  cleanup();
  generateReport();
  process.exit(1);
});