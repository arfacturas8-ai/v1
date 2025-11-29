const { io } = require('socket.io-client');
const fs = require('fs');

async function testSocketWithRealToken() {
  console.log('🔍 Testing Socket.IO with real authentication token...');
  
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

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully with authentication!');
      console.log('   Connection ID:', socket.id);
      console.log('   Transport:', socket.io.engine.transport.name);
      
      // Test basic messaging functionality
      console.log('\n📨 Testing real-time messaging...');
      
      // Test ping
      socket.emit('ping', { clientTime: Date.now() }, (response) => {
        console.log('🏓 Ping response:', response);
      });
      
      // Test joining a channel (Discord-style) - using real channel ID
      const testChannelId = 'cmfluxccx000a7me2teu4vrkq'; // 'general' text channel
      
      socket.emit('channel:join', { 
        channelId: testChannelId
      }, (response) => {
        console.log('🏠 Channel join response:', response);
        
        // Test sending a message (Discord-style)
        socket.emit('message:create', {
          content: 'Hello from Socket.IO test! Time: ' + new Date().toISOString(),
          channelId: testChannelId,
          nonce: 'test-nonce-' + Date.now()
        }, (msgResponse) => {
          console.log('📨 Message create response:', msgResponse);
        });
        
        // Test typing indicator (Discord-style)
        socket.emit('channel:typing', { 
          channelId: testChannelId 
        }, (typingResponse) => {
          console.log('⌨️  Channel typing response:', typingResponse);
          
          // Stop typing after 2 seconds
          setTimeout(() => {
            socket.emit('channel:typing_stop', { 
              channelId: testChannelId 
            }, (stopResponse) => {
              console.log('⌨️  Channel typing stop response:', stopResponse);
            });
          }, 2000);
        });
        
        // Test presence update
        socket.emit('presence:update', {
          status: 'online',
          activity: {
            type: 'playing',
            name: 'Socket.IO Testing',
            details: 'Running integration tests'
          }
        }, (presenceResponse) => {
          console.log('👤 Presence update response:', presenceResponse);
        });
      });
      
      // Listen for real-time events (Discord-style)
      socket.on('message:create', (message) => {
        console.log('📨 New message created:', message);
      });
      
      socket.on('channel:typing_start', (data) => {
        console.log('⌨️  User started typing in channel:', data);
      });
      
      socket.on('channel:typing_stop', (data) => {
        console.log('⌨️  User stopped typing in channel:', data);
      });
      
      socket.on('presence:update', (data) => {
        console.log('👤 User presence updated:', data);
      });
      
      socket.on('channel:member_join', (data) => {
        console.log('🏠 User joined channel:', data);
      });
      
      socket.on('channel:member_leave', (data) => {
        console.log('🏠 User left channel:', data);
      });
      
      socket.on('channel:messages', (data) => {
        console.log('📚 Channel messages received:', {
          channelId: data.channel_id,
          messageCount: data.messages?.length || 0
        });
      });
      
      socket.on('error', (error) => {
        console.error('🚨 Socket error event:', error);
      });
      
      // Disconnect after testing all features
      setTimeout(() => {
        console.log('\n🔌 Disconnecting after tests...');
        socket.disconnect();
        process.exit(0);
      }, 15000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('   Error details:', error);
      process.exit(1);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('error', (error) => {
      console.error('💥 Socket error:', error);
    });

    socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    socket.on('heartbeat', (data) => {
      console.log('💓 Heartbeat received:', data);
      // Send heartbeat acknowledgment
      socket.emit('heartbeat_ack', { timestamp: Date.now() });
    });

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

testSocketWithRealToken();