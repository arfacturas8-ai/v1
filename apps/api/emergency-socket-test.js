#!/usr/bin/env node

const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3002';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZ2azM5b3gwMDAxcXQ2b2Nyb29mcDk4Iiwic2Vzc2lvbklkIjoiZGFmZGIwYjYtYzNhZS00OTZlLWEzZTgtODJmZjEyMTM1MDk5IiwiZW1haWwiOiJ0ZXN0c29ja2V0QGV4YW1wbGUuY29tIiwid2FsbGV0QWRkcmVzcyI6bnVsbCwiaXNWZXJpZmllZCI6ZmFsc2UsImp0aSI6IjM4MTQyNmY1LWFlMjctNGNlYi1iZjFlLWI1NTNjYzUwNDQ3NyIsImlhdCI6MTc1ODU3MTg4NywiZXhwIjoxNzU4NTcyNzg3LCJhdWQiOiJjcnliLXVzZXJzIiwiaXNzIjoiY3J5Yi1wbGF0Zm9ybSJ9.ZWXuvNwEP41jkVr8zsawtkd27V_19K-bJrTjZyrf0YQ';

console.log('🚀 EMERGENCY SOCKET.IO TEST');
console.log('==========================');

const socket = io(SOCKET_URL, {
  auth: { token: TEST_TOKEN },
  transports: ['polling'], // Use polling first for emergency mode
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Emergency Socket.io connected!', socket.id);
  
  socket.on('emergency_mode', (data) => {
    console.log('🆘 Emergency mode message received:', data);
  });
  
  socket.on('pong', (data) => {
    console.log('🏓 Pong received:', data);
  });
  
  // Test ping
  console.log('🏓 Sending ping...');
  socket.emit('ping');
  
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ Emergency Socket.io test completed successfully!');
    process.exit(0);
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Emergency Socket.io connection failed:', error.message);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

setTimeout(() => {
  console.log('❌ Connection timeout');
  process.exit(1);
}, 15000);
