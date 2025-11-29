const { io } = require('socket.io-client');

async function testSocketConnection() {
  console.log('🔍 Testing Socket.IO connection...');
  
  try {
    // Test without authentication first to see basic connectivity
    const socket = io('http://localhost:3002', {
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      console.log('   Connection ID:', socket.id);
      console.log('   Transport:', socket.io.engine.transport.name);
      
      // Test ping
      socket.emit('ping', { clientTime: Date.now() });
      
      setTimeout(() => {
        socket.disconnect();
      }, 3000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('   Error type:', error.type);
      console.error('   Error description:', error.description);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      process.exit(0);
    });

    socket.on('pong', (data) => {
      console.log('📡 Pong received:', data);
    });

    socket.on('emergency_mode', (data) => {
      console.log('🆘 Emergency mode active:', data);
    });

    // Test with authentication
    setTimeout(() => {
      console.log('\n🔒 Testing with authentication...');
      
      const authenticatedSocket = io('http://localhost:3002', {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true,
        auth: {
          token: 'test-token-123' // This will fail authentication but test the flow
        }
      });

      authenticatedSocket.on('connect', () => {
        console.log('✅ Authenticated socket connected!');
        setTimeout(() => authenticatedSocket.disconnect(), 2000);
      });

      authenticatedSocket.on('connect_error', (error) => {
        console.log('🔒 Authentication failed as expected:', error.message);
        setTimeout(() => authenticatedSocket.disconnect(), 1000);
      });

    }, 5000);

  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

testSocketConnection();