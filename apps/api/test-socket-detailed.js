const { io } = require('socket.io-client');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSocketDetailed() {
  console.log('🔍 Testing Socket.IO with detailed step-by-step analysis...');
  
  try {
    // Load the token for real user
    const tokenData = JSON.parse(fs.readFileSync('/home/ubuntu/cryb-platform/apps/api/real-user-token.json', 'utf8'));
    const token = tokenData.token;
    
    console.log('🔑 Using token for user:', tokenData.payload.username);
    
    const socket = io('http://localhost:3002', {
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true,
      auth: {
        token: token
      }
    });

    socket.on('connect', async () => {
      console.log('✅ Socket connected successfully with authentication!');
      console.log('   Connection ID:', socket.id);
      console.log('   Transport:', socket.io.engine.transport.name);
      
      const testChannelId = 'cmfluxccx000a7me2teu4vrkq'; // 'general' text channel
      
      console.log('\n📨 Step 1: Testing channel join...');
      
      socket.emit('channel:join', { 
        channelId: testChannelId
      }, (response) => {
        console.log('🏠 Channel join response:', response);
      });
      
      // Wait for channel join to complete
      await sleep(2000);
      
      console.log('\n📨 Step 2: Testing message creation...');
      
      socket.emit('message:create', {
        content: 'Hello from Socket.IO detailed test! Time: ' + new Date().toISOString(),
        channelId: testChannelId,
        nonce: 'test-nonce-' + Date.now()
      }, (msgResponse) => {
        console.log('📨 Message create response:', msgResponse);
      });
      
      // Wait for message creation
      await sleep(2000);
      
      console.log('\n📨 Step 3: Testing typing indicators...');
      
      socket.emit('channel:typing', { 
        channelId: testChannelId 
      }, (typingResponse) => {
        console.log('⌨️  Channel typing response:', typingResponse);
      });
      
      await sleep(3000);
      
      socket.emit('channel:typing_stop', { 
        channelId: testChannelId 
      }, (stopResponse) => {
        console.log('⌨️  Channel typing stop response:', stopResponse);
      });
      
      // Wait for typing to stop
      await sleep(2000);
      
      console.log('\n📨 Step 4: Testing presence update...');
      
      socket.emit('presence:update', {
        status: 'online',
        activity: {
          type: 'playing',
          name: 'Socket.IO Detailed Testing',
          details: 'Running step-by-step integration tests'
        }
      }, (presenceResponse) => {
        console.log('👤 Presence update response:', presenceResponse);
      });
      
      // Wait for presence update
      await sleep(2000);
      
      console.log('\n📨 Step 5: Testing ping...');
      
      socket.emit('ping', { clientTime: Date.now() }, (response) => {
        console.log('🏓 Ping response:', response);
      });
      
      // Wait for ping response
      await sleep(2000);
      
      console.log('\n🔌 All tests completed, disconnecting...');
      socket.disconnect();
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('   Error details:', error);
      process.exit(1);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      process.exit(0);
    });

    socket.on('error', (error) => {
      console.error('💥 Socket error:', error);
    });

    // Listen for all real-time events
    socket.on('message:create', (message) => {
      console.log('📨 ✅ Message create event received:', message);
    });
    
    socket.on('channel:typing_start', (data) => {
      console.log('⌨️  ✅ Typing start event received:', data);
    });
    
    socket.on('channel:typing_stop', (data) => {
      console.log('⌨️  ✅ Typing stop event received:', data);
    });
    
    socket.on('presence:update', (data) => {
      console.log('👤 ✅ Presence update event received:', data);
    });
    
    socket.on('channel:member_join', (data) => {
      console.log('🏠 ✅ Member join event received:', data);
    });
    
    socket.on('channel:member_leave', (data) => {
      console.log('🏠 ✅ Member leave event received:', data);
    });
    
    socket.on('channel:messages', (data) => {
      console.log('📚 ✅ Channel messages event received:', {
        channelId: data.channel_id,
        messageCount: data.messages?.length || 0,
        messages: data.messages?.map(m => ({ id: m.id, content: m.content?.substring(0, 50) })) || []
      });
    });
    
    socket.on('pong', (data) => {
      console.log('🏓 ✅ Pong event received:', data);
    });

    socket.on('heartbeat', (data) => {
      console.log('💓 ✅ Heartbeat event received:', data);
      socket.emit('heartbeat_ack', { timestamp: Date.now() });
    });

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

testSocketDetailed();