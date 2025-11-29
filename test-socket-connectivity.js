#!/usr/bin/env node

/**
 * Socket.io Connectivity Test
 * Tests Socket.io connection between frontend and backend
 */

const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3002';

async function testSocketConnectivity() {
  console.log('🔌 Testing Socket.io Connectivity\n');
  console.log('Socket URL:', SOCKET_URL);
  console.log('Current time:', new Date().toISOString());
  console.log('');
  
  return new Promise((resolve) => {
    let connected = false;
    let errorOccurred = false;
    
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });
    
    const timeout = setTimeout(() => {
      if (!connected && !errorOccurred) {
        console.log('⏰ Connection attempt timed out after 10 seconds');
        socket.disconnect();
        resolve(false);
      }
    }, 10000);
    
    socket.on('connect', () => {
      console.log('✅ Socket.io connected successfully!');
      console.log('   Socket ID:', socket.id);
      console.log('   Transport:', socket.io.engine.transport.name);
      connected = true;
      clearTimeout(timeout);
      
      // Test a simple message
      socket.emit('ping', { timestamp: Date.now() });
      
      setTimeout(() => {
        socket.disconnect();
        console.log('✅ Socket.io test completed successfully');
        resolve(true);
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket.io connection error:', error.message);
      errorOccurred = true;
      clearTimeout(timeout);
      resolve(false);
    });
    
    socket.on('disconnect', (reason) => {
      if (connected) {
        console.log('🔌 Socket.io disconnected:', reason);
      }
    });
    
    socket.on('pong', (data) => {
      console.log('🏓 Received pong response:', data);
    });
    
    console.log('🔄 Attempting to connect to Socket.io...');
  });
}

testSocketConnectivity()
  .then(success => {
    if (success) {
      console.log('\n🎉 Socket.io connectivity test PASSED!');
      process.exit(0);
    } else {
      console.log('\n💥 Socket.io connectivity test FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Socket.io test suite failed:', error.message);
    process.exit(1);
  });