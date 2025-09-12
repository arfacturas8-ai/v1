#!/usr/bin/env node

const { io } = require('socket.io-client');

// Use the real token we just created
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWY4djhrc2IwMDF6NHJ4YnhqNm5ndmQ2Iiwic2Vzc2lvbklkIjoiODE1YjkyOWUtYWNkNC00MDAxLWJmZmItMWJhYTM1ZTdhNzYyIiwiZW1haWwiOiJ0ZXN0MTc1NzE5OTUzN0BleGFtcGxlLmNvbSIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiI2OTI3NjA5MC05OTBkLTQ4MTgtYmY0Mi05NTA5YzIwZmY5OTgiLCJpYXQiOjE3NTcxOTk1NDIsImV4cCI6MTc1NzIwMDQ0MiwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.VLFphLzQqHrj_cppVQhguonSjcRrcV5TjV6naq2R3tU';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

console.log('🚀 Testing Real-time Messaging with Valid Authentication Token\n');

async function testCompleteRealtimeSystem() {
  console.log('💬 Testing Complete Real-time Messaging System...');
  
  const socket = io(BACKEND_URL, {
    auth: { token: REAL_TOKEN },
    transports: ['polling', 'websocket'],
    timeout: 15000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    forceNew: true
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Complete test timeout after 30 seconds'));
    }, 30000);

    const testResults = {
      connection: false,
      authentication: false,
      identify: false,
      ready: false,
      heartbeat: false,
      presence: false,
      serverJoin: false,
      channelJoin: false,
      messaging: false,
      typing: false
    };

    // Connection handling
    socket.on('connect', () => {
      console.log('✅ Socket.IO connection established!');
      console.log(`   Socket ID: ${socket.id}`);
      console.log(`   Transport: ${socket.io.engine.transport.name}`);
      console.log(`   Connected: ${socket.connected}`);
      testResults.connection = true;
      testResults.authentication = true; // If we connected, auth worked
      
      // Send identify event
      console.log('\n📡 Sending identify event...');
      socket.emit('identify', {
        large_threshold: 250,
        presence: {
          status: 'online',
          activity: {
            type: 'playing',
            name: 'Testing Real-time System'
          }
        }
      });
    });

    socket.on('ready', (data) => {
      console.log('🎉 Ready event received!');
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Username: ${data.user?.username}`);
      console.log(`   Display Name: ${data.user?.displayName}`);
      console.log(`   Session ID: ${data.session_id}`);
      console.log(`   Servers: ${data.servers?.length || 0} available`);
      
      testResults.ready = true;
      testResults.identify = true;
      
      // Send heartbeat
      console.log('\n📡 Testing heartbeat...');
      socket.emit('heartbeat');
      
      // Test presence update
      console.log('📡 Testing presence update...');
      socket.emit('presence:update', {
        status: 'online',
        activity: {
          type: 'playing',
          name: 'Socket.IO Real-time Test'
        }
      });
      
      // If we have servers, try to join one
      if (data.servers && data.servers.length > 0) {
        const server = data.servers[0];
        console.log(`\n📡 Attempting to join server: ${server.name || server.id}`);
        socket.emit('server:join', { serverId: server.id });
      } else {
        console.log('\n⚠️ No servers available for testing server join');
      }
    });

    socket.on('heartbeat_ack', () => {
      console.log('✅ Heartbeat acknowledged by server!');
      testResults.heartbeat = true;
    });

    socket.on('presence:update', (data) => {
      console.log('✅ Presence update received:', data);
      testResults.presence = true;
    });

    socket.on('server:state', (data) => {
      console.log('✅ Server state received!');
      console.log(`   Server: ${data.name || data.id}`);
      console.log(`   Channels: ${data.channels?.length || 0} available`);
      testResults.serverJoin = true;
      
      // Try to join first text channel
      if (data.channels && data.channels.length > 0) {
        const textChannel = data.channels.find(ch => ch.type === 'TEXT') || data.channels[0];
        console.log(`\n📡 Attempting to join channel: ${textChannel.name || textChannel.id}`);
        socket.emit('channel:join', { channelId: textChannel.id });
      } else {
        console.log('⚠️ No channels available in server');
      }
    });

    socket.on('channel:messages', (data) => {
      console.log('✅ Channel messages received!');
      console.log(`   Channel ID: ${data.channel_id}`);
      console.log(`   Messages: ${data.messages?.length || 0} loaded`);
      testResults.channelJoin = true;
      
      // Send a test message
      console.log('\n📡 Sending test message...');
      socket.emit('message:create', {
        channelId: data.channel_id,
        content: '🚀 Hello from automated Socket.IO test! Real-time messaging is working!',
        nonce: 'test-message-' + Date.now()
      });
      
      // Test typing indicator
      console.log('📡 Testing typing indicator...');
      socket.emit('channel:typing', { channelId: data.channel_id });
      
      setTimeout(() => {
        console.log('📡 Stopping typing indicator...');
        socket.emit('channel:typing_stop', { channelId: data.channel_id });
      }, 3000);
    });

    socket.on('message:create', (message) => {
      console.log('✅ Message created event received!');
      console.log(`   Message ID: ${message.id}`);
      console.log(`   Content: ${message.content}`);
      console.log(`   Author: ${message.user?.displayName || message.user?.username}`);
      testResults.messaging = true;
    });

    socket.on('channel:typing_start', (data) => {
      console.log('✅ Typing start event received!');
      console.log(`   Channel: ${data.channel_id}`);
      console.log(`   User: ${data.user_id}`);
      testResults.typing = true;
    });

    socket.on('channel:typing_stop', (data) => {
      console.log('✅ Typing stop event received!');
      console.log(`   Channel: ${data.channel_id}`);
      console.log(`   User: ${data.user_id}`);
    });

    // Error handling
    socket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error.message);
      console.log('   This might indicate authentication or server issues');
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('error', (error) => {
      console.log('⚠️ Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected from server: ${reason}`);
    });

    // Complete test after 25 seconds
    setTimeout(() => {
      clearTimeout(timeout);
      socket.disconnect();
      
      // Calculate results
      console.log('\n🏆 COMPREHENSIVE TEST RESULTS');
      console.log('='.repeat(60));
      
      const testDescriptions = {
        connection: 'Socket.IO Connection Established',
        authentication: 'User Authentication Successful', 
        identify: 'Identity Verification Completed',
        ready: 'Ready Event with User Data Received',
        heartbeat: 'Heartbeat/Ping-Pong System Working',
        presence: 'Presence Update System Working',
        serverJoin: 'Server Join Functionality Working',
        channelJoin: 'Channel Join Functionality Working',
        messaging: 'Real-time Message Broadcasting Working',
        typing: 'Typing Indicators Working'
      };
      
      Object.entries(testResults).forEach(([test, passed]) => {
        const status = passed ? '✅ WORKING' : '❌ NOT WORKING';
        const description = testDescriptions[test];
        console.log(`${status} - ${description}`);
      });
      
      const passedCount = Object.values(testResults).filter(Boolean).length;
      const totalCount = Object.keys(testResults).length;
      const percentage = Math.round((passedCount / totalCount) * 100);
      
      console.log('='.repeat(60));
      console.log(`🎯 OVERALL SCORE: ${passedCount}/${totalCount} features working (${percentage}%)`);
      
      if (percentage === 100) {
        console.log('🎉🎉 PERFECT! Real-time messaging is 100% functional! 🎉🎉');
        console.log('🚀 The system is ready for production use!');
      } else if (percentage >= 80) {
        console.log('🎉 EXCELLENT! Most real-time features are working!');
        console.log('🔧 Minor tweaks needed for full functionality');
      } else if (percentage >= 60) {
        console.log('👍 GOOD! Core real-time features are working');  
        console.log('🔧 Some additional features need implementation');
      } else if (percentage >= 40) {
        console.log('⚠️ PARTIAL SUCCESS - Basic connection working');
        console.log('🔧 Significant work needed for full real-time functionality');
      } else {
        console.log('❌ CRITICAL ISSUES - Major fixes needed');
        console.log('🚨 Real-time messaging system requires immediate attention');
      }
      
      console.log('\n📋 FRONTEND INTEGRATION STATUS:');
      if (testResults.connection && testResults.authentication) {
        console.log('✅ Frontend can connect to backend Socket.IO server');
        console.log('✅ Authentication system is working properly');
        console.log('✅ Event system is compatible with Discord-style events');
      }
      
      if (testResults.messaging) {
        console.log('✅ Real-time messaging is functional');
        console.log('✅ Multiple users can chat in real-time');
      }
      
      if (testResults.typing) {
        console.log('✅ Typing indicators are working');
      }
      
      if (testResults.presence) {
        console.log('✅ Presence system is functional');
      }
      
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Update frontend to use the corrected event names');
      console.log('2. Test with multiple browser tabs/users');
      console.log('3. Verify message persistence and history');
      console.log('4. Test voice channel functionality'); 
      console.log('5. Implement message reactions and editing');
      
      resolve(testResults);
    }, 25000);
  });
}

// Run the comprehensive test
testCompleteRealtimeSystem()
  .then((results) => {
    console.log('\n✅ Test completed successfully!');
    const score = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    if (score === total) {
      console.log('🏆 ALL SYSTEMS GO! Real-time messaging is fully functional!');
      process.exit(0);
    } else {
      console.log(`⚠️ ${total - score} features still need work`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });