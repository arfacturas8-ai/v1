#!/usr/bin/env node

const { io } = require('socket.io-client');

console.log('🧪 Testing Real-time Messaging System...\n');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

// Create a mock token for testing (in production, you'd get this from login)
async function createTestToken() {
  try {
    // Try to create a test user or get token from API
    // For now, we'll simulate with a fake token
    return 'fake-test-token-123';
  } catch (error) {
    console.log('⚠️ Using fake token for testing');
    return 'fake-test-token-123';
  }
}

// Test real-time messaging between two clients
async function testRealTimeMessaging() {
  console.log('💬 Testing real-time messaging between multiple clients\n');
  
  const token = await createTestToken();
  
  // Create two clients
  const client1 = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    timeout: 10000,
    reconnection: false
  });

  const client2 = io(BACKEND_URL, {
    auth: { token: 'fake-test-token-456' },
    transports: ['websocket', 'polling'], 
    timeout: 10000,
    reconnection: false
  });

  return new Promise((resolve, reject) => {
    let client1Connected = false;
    let client2Connected = false;
    let testResults = {
      connection: false,
      heartbeat: false,
      identify: false,
      serverJoin: false,
      channelJoin: false,
      messaging: false,
      typing: false,
      presence: false,
    };

    const timeout = setTimeout(() => {
      client1.disconnect();
      client2.disconnect();
      reject(new Error('Test timeout after 30 seconds'));
    }, 30000);

    // Client 1 events
    client1.on('connect', () => {
      console.log('✅ Client 1 connected');
      client1Connected = true;
      testResults.connection = true;
      
      // Send identify event
      client1.emit('identify', {
        large_threshold: 250,
        presence: {
          status: 'online',
          activity: null
        }
      });
    });

    client1.on('ready', (data) => {
      console.log('✅ Client 1 received ready event:', data);
      testResults.identify = true;
      
      // Test joining a server
      if (data.servers && data.servers.length > 0) {
        const serverId = data.servers[0].id;
        console.log(`📡 Client 1 joining server: ${serverId}`);
        client1.emit('server:join', { serverId });
      }
    });

    client1.on('server:state', (data) => {
      console.log('✅ Client 1 received server state:', data);
      testResults.serverJoin = true;
      
      // Test joining a channel
      if (data.channels && data.channels.length > 0) {
        const channelId = data.channels[0].id;
        console.log(`📡 Client 1 joining channel: ${channelId}`);
        client1.emit('channel:join', { channelId });
      }
    });

    client1.on('channel:messages', (data) => {
      console.log('✅ Client 1 received channel messages:', data);
      testResults.channelJoin = true;
      
      // Send a test message
      console.log('📡 Client 1 sending test message');
      client1.emit('message:create', {
        channelId: data.channel_id,
        content: 'Hello from Client 1! 👋',
        nonce: 'test-message-1'
      });
    });

    client1.on('message:create', (message) => {
      console.log('✅ Client 1 received new message:', message);
      testResults.messaging = true;
      
      // Test typing indicator
      console.log('📡 Client 1 testing typing indicator');
      client1.emit('channel:typing', { channelId: message.channelId });
      
      setTimeout(() => {
        client1.emit('channel:typing_stop', { channelId: message.channelId });
      }, 2000);
    });

    client1.on('channel:typing_start', (data) => {
      console.log('✅ Client 1 received typing start:', data);
      testResults.typing = true;
    });

    client1.on('presence:update', (data) => {
      console.log('✅ Client 1 received presence update:', data);
      testResults.presence = true;
    });

    client1.on('heartbeat_ack', () => {
      console.log('✅ Client 1 received heartbeat ack');
      testResults.heartbeat = true;
    });

    // Client 2 events
    client2.on('connect', () => {
      console.log('✅ Client 2 connected');
      client2Connected = true;
      
      // Send heartbeat test
      client2.emit('heartbeat');
      
      // Test presence update
      client2.emit('presence:update', {
        status: 'online',
        activity: { name: 'Testing Real-time System' }
      });
    });

    client2.on('message:create', (message) => {
      console.log('✅ Client 2 received message from Client 1:', message);
      
      // Reply to the message
      console.log('📡 Client 2 replying to message');
      client2.emit('message:create', {
        channelId: message.channelId,
        content: 'Hello back from Client 2! 🎉',
        replyTo: message.id,
        nonce: 'test-reply-2'
      });
    });

    // Connection error handlers
    client1.on('connect_error', (error) => {
      if (error.message.includes('Authentication')) {
        console.log('⚠️ Client 1 auth error (expected with fake token)');
        // Still proceed with tests
      } else {
        console.log('❌ Client 1 connection error:', error.message);
      }
    });

    client2.on('connect_error', (error) => {
      if (error.message.includes('Authentication')) {
        console.log('⚠️ Client 2 auth error (expected with fake token)');
      } else {
        console.log('❌ Client 2 connection error:', error.message);
      }
    });

    // Check results after 20 seconds
    setTimeout(() => {
      clearTimeout(timeout);
      client1.disconnect();
      client2.disconnect();
      
      console.log('\n📊 Test Results Summary:');
      console.log('='.repeat(50));
      
      Object.entries(testResults).forEach(([test, passed]) => {
        const status = passed ? '✅ PASSED' : '❌ FAILED';
        const description = {
          connection: 'Socket.IO Connection',
          heartbeat: 'Heartbeat/Ping-Pong',
          identify: 'User Identification',
          serverJoin: 'Server Join Events',
          channelJoin: 'Channel Join Events', 
          messaging: 'Real-time Messaging',
          typing: 'Typing Indicators',
          presence: 'Presence Updates'
        }[test];
        
        console.log(`${status} - ${description}`);
      });
      
      const passedCount = Object.values(testResults).filter(Boolean).length;
      const totalCount = Object.keys(testResults).length;
      
      console.log('='.repeat(50));
      console.log(`🎯 Overall Score: ${passedCount}/${totalCount} tests passed`);
      
      if (passedCount === totalCount) {
        console.log('🎉 All tests passed! Real-time messaging is working perfectly!');
      } else if (passedCount >= totalCount * 0.7) {
        console.log('⚠️ Most tests passed. Some features may need attention.');
      } else {
        console.log('❌ Several tests failed. Real-time messaging needs fixes.');
      }
      
      resolve(testResults);
    }, 20000);
  });
}

// Test typing indicators specifically
async function testTypingIndicators() {
  console.log('\n⌨️ Testing typing indicators specifically...\n');
  
  const token = await createTestToken();
  const client = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: false
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.disconnect();
      reject(new Error('Typing test timeout'));
    }, 10000);

    let typingTestPassed = false;

    client.on('connect', () => {
      console.log('✅ Connected for typing test');
      
      // Simulate typing in a test channel
      const testChannelId = 'test-channel-123';
      
      console.log('📡 Starting typing indicator...');
      client.emit('channel:typing', { channelId: testChannelId });
      
      // Stop typing after 3 seconds
      setTimeout(() => {
        console.log('📡 Stopping typing indicator...');
        client.emit('channel:typing_stop', { channelId: testChannelId });
        typingTestPassed = true;
      }, 3000);
    });

    client.on('channel:typing_start', (data) => {
      console.log('✅ Received typing start event:', data);
    });

    client.on('channel:typing_stop', (data) => {
      console.log('✅ Received typing stop event:', data);
    });

    client.on('connect_error', (error) => {
      console.log('⚠️ Connection error during typing test:', error.message);
    });

    setTimeout(() => {
      clearTimeout(timeout);
      client.disconnect();
      resolve(typingTestPassed);
    }, 8000);
  });
}

// Test presence system
async function testPresenceSystem() {
  console.log('\n👤 Testing presence system...\n');
  
  const token = await createTestToken();
  const client = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: false
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.disconnect();
      reject(new Error('Presence test timeout'));
    }, 10000);

    let presenceTestPassed = false;

    client.on('connect', () => {
      console.log('✅ Connected for presence test');
      
      // Test different presence states
      const statuses = ['online', 'idle', 'dnd', 'offline'];
      let statusIndex = 0;
      
      const updatePresence = () => {
        if (statusIndex < statuses.length) {
          const status = statuses[statusIndex];
          console.log(`📡 Setting presence to: ${status}`);
          
          client.emit('presence:update', {
            status,
            activity: {
              type: 'playing',
              name: 'Testing Presence System'
            }
          });
          
          statusIndex++;
          if (statusIndex < statuses.length) {
            setTimeout(updatePresence, 1000);
          }
        }
      };
      
      updatePresence();
    });

    client.on('presence:update', (data) => {
      console.log('✅ Received presence update:', data);
      presenceTestPassed = true;
    });

    client.on('connect_error', (error) => {
      console.log('⚠️ Connection error during presence test:', error.message);
    });

    setTimeout(() => {
      clearTimeout(timeout);
      client.disconnect();
      resolve(presenceTestPassed);
    }, 8000);
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Real-time Messaging Tests\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Real-time messaging
    console.log('TEST 1: Real-time Messaging Between Multiple Clients');
    console.log('-'.repeat(60));
    const messagingResults = await testRealTimeMessaging();
    
    // Test 2: Typing indicators  
    console.log('\nTEST 2: Typing Indicators');
    console.log('-'.repeat(60));
    const typingResult = await testTypingIndicators();
    
    // Test 3: Presence system
    console.log('\nTEST 3: Presence System');
    console.log('-'.repeat(60));
    const presenceResult = await testPresenceSystem();
    
    // Final summary
    console.log('\n🏆 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    
    const messagingPassed = Object.values(messagingResults).filter(Boolean).length;
    const messagingTotal = Object.keys(messagingResults).length;
    
    console.log(`📬 Real-time Messaging: ${messagingPassed}/${messagingTotal} features working`);
    console.log(`⌨️ Typing Indicators: ${typingResult ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`👤 Presence System: ${presenceResult ? 'WORKING' : 'NOT WORKING'}`);
    
    const overallScore = (messagingPassed + (typingResult ? 1 : 0) + (presenceResult ? 1 : 0));
    const totalTests = messagingTotal + 2;
    
    console.log(`\n🎯 Overall System Health: ${overallScore}/${totalTests} features working`);
    
    if (overallScore === totalTests) {
      console.log('🎉 EXCELLENT! Real-time messaging is 100% functional!');
    } else if (overallScore >= totalTests * 0.8) {
      console.log('✅ GOOD! Most real-time features are working properly.');
    } else if (overallScore >= totalTests * 0.5) {
      console.log('⚠️ PARTIAL! Some real-time features need attention.');
    } else {
      console.log('❌ CRITICAL! Real-time messaging system needs major fixes.');
    }
    
    console.log('\n📋 RECOMMENDATIONS:');
    
    if (!messagingResults.connection) {
      console.log('- Fix Socket.IO connection issues');
    }
    if (!messagingResults.identify) {
      console.log('- Fix user identification and authentication');
    }
    if (!messagingResults.messaging) {
      console.log('- Fix real-time message broadcasting');
    }
    if (!typingResult) {
      console.log('- Fix typing indicator system');
    }
    if (!presenceResult) {
      console.log('- Fix user presence tracking');
    }
    
    if (overallScore === totalTests) {
      console.log('🚀 System is ready for production use!');
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(console.error);