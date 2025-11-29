#!/usr/bin/env node

const io = require('socket.io-client');

console.log('🔌 MINIMAL SOCKET.IO CONNECTION TEST');
console.log('=====================================');

const socket = io('http://localhost:3002', {
  transports: ['polling'], // Force polling only to avoid websocket issues
  timeout: 15000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('🎉 SUCCESS! Socket.io connected!');
  console.log('✅ Socket ID:', socket.id);
  console.log('✅ Transport:', socket.io.engine.transport.name);
  
  // Test basic communication
  socket.emit('ping', { message: 'Hello from client!' });
  
  setTimeout(() => {
    console.log('✅ Connection test completed successfully!');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Timeout fallback
setTimeout(() => {
  console.log('❌ Test timed out');
  process.exit(1);
}, 20000);