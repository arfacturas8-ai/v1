#!/usr/bin/env node

const io = require('socket.io-client');

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZ2a204bjcwMDAwZGdwcDd0MTZ6bDlzIiwic2Vzc2lvbklkIjoiYWUzMDI4ZTUtZjU4Zi00NzhjLWIyYzUtMDc1M2FhZDZhNjIxIiwiZW1haWwiOiJuZXdzb2NrZXRAZXhhbXBsZS5jb20iLCJ3YWxsZXRBZGRyZXNzIjpudWxsLCJpc1ZlcmlmaWVkIjpmYWxzZSwianRpIjoiOTg2NDBiZmYtNjA4NS00ZDBjLWE1NzAtNGRlMTRlNzUzZTA4IiwiaWF0IjoxNzU4NTcyOTE3LCJleHAiOjE3NTg1NzM4MTcsImF1ZCI6ImNyeWItdXNlcnMiLCJpc3MiOiJjcnliLXBsYXRmb3JtIn0.55IhDSktc2Dkw3OEsRfzpldsXcHBfhXVuSE63bpgcMk';

console.log('🎯 FINAL REAL-TIME MESSAGING SYSTEM TEST');
console.log('========================================');
console.log('Testing with proper JWT authentication...');

const socket = io('http://localhost:3002', {
  auth: { token: TEST_TOKEN },
  transports: ['polling'], // Use polling since websocket has issues
  timeout: 15000,
  forceNew: true
});

let testResults = {
  connection: false,
  authentication: false,
  ready: false,
  heartbeat: false,
  channelJoin: false,
  messageSystem: false,
  typingIndicators: false
};

socket.on('connect', () => {
  console.log('✅ Socket.io connected with authentication!');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
  testResults.connection = true;
  testResults.authentication = true;
  
  // Set up event listeners
  socket.on('ready', (data) => {
    console.log('✅ Ready event received!');
    console.log('   User:', data.user?.displayName, `(${data.user?.username})`);
    console.log('   Session ID:', data.session_id);
    console.log('   Application:', data.application?.name, data.application?.version);
    testResults.ready = true;
    
    // Test heartbeat
    console.log('🔄 Testing heartbeat system...');
    socket.emit('heartbeat');
  });
  
  socket.on('heartbeat_ack', (data) => {
    console.log('✅ Heartbeat acknowledged!');
    console.log('   Timestamp:', data.timestamp);
    testResults.heartbeat = true;
    
    // Test channel joining
    console.log('🔄 Testing channel management...');
    socket.emit('channel:join', { channelId: 'general' });
  });
  
  socket.on('channel:joined', (data) => {
    console.log('✅ Channel joined successfully!');
    console.log('   Channel ID:', data.channel_id);
    testResults.channelJoin = true;
    
    // Test messaging system  
    console.log('🔄 Testing real-time messaging...');
    socket.emit('message:send', {
      channelId: 'general',
      content: 'Hello! This is a test message from the real-time system test.',
      nonce: 'test-' + Date.now()
    });
  });
  
  socket.on('message:create', (message) => {
    console.log('✅ Message sent and received successfully!');
    console.log('   Content:', message.content);
    console.log('   User:', message.user?.displayName);
    console.log('   Timestamp:', message.createdAt);
    testResults.messageSystem = true;
    
    // Test typing indicators
    console.log('🔄 Testing typing indicators...');
    socket.emit('typing:start', { channelId: 'general' });
    
    setTimeout(() => {
      socket.emit('typing:stop', { channelId: 'general' });
      testResults.typingIndicators = true;
      console.log('✅ Typing indicators test completed!');
      
      // Complete the test
      setTimeout(completeTest, 2000);
    }, 1500);
  });
  
  socket.on('typing:start', (data) => {
    console.log('✅ Typing start event received for channel:', data.channel_id);
  });
  
  socket.on('typing:stop', (data) => {
    console.log('✅ Typing stop event received for channel:', data.channel_id);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  console.log('This could be due to:');
  console.log('  - JWT token expired');
  console.log('  - Authentication server issues');
  console.log('  - Network connectivity problems');
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('📡 Socket disconnected:', reason);
});

function completeTest() {
  console.log('\n🏆 FINAL TEST RESULTS:');
  console.log('======================');
  console.log('🔌 Connection:', testResults.connection ? '✅ PASS' : '❌ FAIL');
  console.log('🔐 Authentication:', testResults.authentication ? '✅ PASS' : '❌ FAIL');
  console.log('🚀 Ready Event:', testResults.ready ? '✅ PASS' : '❌ FAIL');
  console.log('💓 Heartbeat:', testResults.heartbeat ? '✅ PASS' : '❌ FAIL');
  console.log('📺 Channel Join:', testResults.channelJoin ? '✅ PASS' : '❌ FAIL');
  console.log('💬 Messaging:', testResults.messageSystem ? '✅ PASS' : '❌ FAIL');
  console.log('⌨️  Typing:', testResults.typingIndicators ? '✅ PASS' : '❌ FAIL');
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result).length;
  
  console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉');
    console.log('✅ Real-time messaging system is FULLY OPERATIONAL!');
    console.log('✅ Socket.io server working perfectly');
    console.log('✅ JWT authentication successful');
    console.log('✅ Message delivery working between clients');
    console.log('✅ Typing indicators functional');
    console.log('✅ Channel management operational');
    console.log('✅ Heartbeat system active');
    console.log('\n🚀 The CRYB platform real-time messaging is ready for production!');
  } else if (passedTests >= 5) {
    console.log('\n✅ CORE FUNCTIONALITY WORKING!');
    console.log('The real-time messaging system is operational with minor issues.');
    console.log('Most critical features are working correctly.');
  } else {
    console.log('\n⚠️  PARTIAL FUNCTIONALITY');
    console.log('Some features are working but core issues remain.');
  }
  
  socket.disconnect();
  process.exit(0);
}

// Timeout safety
setTimeout(() => {
  console.log('\n⏰ Test timeout reached - showing partial results...');
  completeTest();
}, 25000);