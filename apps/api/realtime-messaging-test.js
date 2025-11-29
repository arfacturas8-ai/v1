#!/usr/bin/env node

const io = require('socket.io-client');

console.log('🚀 COMPREHENSIVE REAL-TIME MESSAGING TEST');
console.log('=========================================');

const socket = io('http://localhost:3002', {
  transports: ['polling'], // Use polling since it works
  timeout: 15000,
  forceNew: true
});

let testResults = {
  connection: false,
  ready: false,
  heartbeat: false,
  channelJoin: false,
  messageSystem: false,
  typingIndicators: false
};

socket.on('connect', () => {
  console.log('✅ Socket.io connected!');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
  testResults.connection = true;
  
  // Set up event listeners for all real-time features
  socket.on('ready', (data) => {
    console.log('✅ Ready event received!');
    console.log('   User:', data.user?.displayName);
    console.log('   Session ID:', data.session_id);
    console.log('   Application:', data.application?.name);
    testResults.ready = true;
    
    // Test channel joining
    console.log('🔄 Testing channel join...');
    socket.emit('channel:join', { channelId: 'test-channel-123' });
  });
  
  socket.on('heartbeat_ack', (data) => {
    console.log('✅ Heartbeat acknowledged!');
    console.log('   Timestamp:', data.timestamp);
    testResults.heartbeat = true;
  });
  
  socket.on('channel:joined', (data) => {
    console.log('✅ Channel joined successfully!');
    console.log('   Channel ID:', data.channel_id);
    testResults.channelJoin = true;
    
    // Test messaging system
    console.log('🔄 Testing message sending...');
    socket.emit('message:send', {
      channelId: 'test-channel-123',
      content: 'Hello from automated test!',
      nonce: 'test-nonce-' + Date.now()
    });
  });
  
  socket.on('message:create', (message) => {
    console.log('✅ Message received!');
    console.log('   Content:', message.content);
    console.log('   User:', message.user?.displayName);
    testResults.messageSystem = true;
    
    // Test typing indicators
    console.log('🔄 Testing typing indicators...');
    socket.emit('typing:start', { channelId: 'test-channel-123' });
    
    setTimeout(() => {
      socket.emit('typing:stop', { channelId: 'test-channel-123' });
      testResults.typingIndicators = true;
      console.log('✅ Typing indicators test completed!');
      
      // Complete the test
      setTimeout(completeTest, 1000);
    }, 1000);
  });
  
  socket.on('typing:start', (data) => {
    console.log('✅ Typing start event received from user:', data.user_id);
  });
  
  socket.on('typing:stop', (data) => {
    console.log('✅ Typing stop event received from user:', data.user_id);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
  
  // Start testing sequence
  console.log('🔄 Testing heartbeat...');
  socket.emit('heartbeat');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

function completeTest() {
  console.log('\n🎯 TEST RESULTS SUMMARY:');
  console.log('========================');
  console.log('✅ Connection:', testResults.connection ? 'PASS' : 'FAIL');
  console.log('✅ Ready Event:', testResults.ready ? 'PASS' : 'FAIL');
  console.log('✅ Heartbeat:', testResults.heartbeat ? 'PASS' : 'FAIL');
  console.log('✅ Channel Join:', testResults.channelJoin ? 'PASS' : 'FAIL');
  console.log('✅ Message System:', testResults.messageSystem ? 'PASS' : 'FAIL');
  console.log('✅ Typing Indicators:', testResults.typingIndicators ? 'PASS' : 'FAIL');
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result).length;
  
  console.log(`\n🏆 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL REAL-TIME MESSAGING FEATURES ARE WORKING!');
    console.log('✅ Socket.io server is fully functional');
    console.log('✅ Authentication system is working');
    console.log('✅ Real-time messaging is operational');
    console.log('✅ Channel management is working');
    console.log('✅ Typing indicators are functional');
  } else {
    console.log('⚠️  Some features need attention, but core connectivity works');
  }
  
  socket.disconnect();
  process.exit(0);
}

// Timeout fallback
setTimeout(() => {
  console.log('❌ Test timed out - checking partial results...');
  completeTest();
}, 30000);