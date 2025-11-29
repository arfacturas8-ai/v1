const io = require('socket.io-client');

console.log('Testing Socket.IO connection...\n');

// Test without auth first
const socket = io('http://localhost:3001', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  reconnection: false,
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected without auth! Socket ID:', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  
  // Now try with auth token
  console.log('\nTrying with auth token...');
  
  const authSocket = io('http://localhost:3001', {
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    auth: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZwbXFzNWswMDB6YXphOHZrMjBqNW0wIiwic2Vzc2lvbklkIjoiZGQ5NTRhMDktNzE3ZS00NDk3LWIxOTAtMDU0Mjk3ODI5ZTU2IiwiZW1haWwiOiJ0ZXN0MTczNDYyNDAwMUBleGFtcGxlLmNvbSIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiI2MjEwZjhkZC1hMjRiLTRmNjAtYjBhYi00NzI0MDQ2MGJlZTMiLCJpYXQiOjE3NTgyMTUzMDQsImV4cCI6MTc1ODIxNjIwNCwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.zpdestBpS5lmJTjsgpnfll3natQPZ16W6V3_jbaegZ8'
    },
    reconnection: false,
    timeout: 5000
  });
  
  authSocket.on('connect', () => {
    console.log('✅ Connected with auth! Socket ID:', authSocket.id);
    authSocket.disconnect();
    process.exit(0);
  });
  
  authSocket.on('connect_error', (authError) => {
    console.log('❌ Auth connection error:', authError.message);
    process.exit(1);
  });
});

setTimeout(() => {
  console.log('⏰ Timeout - no connection established');
  process.exit(1);
}, 10000);