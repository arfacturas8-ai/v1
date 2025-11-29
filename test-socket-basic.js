const io = require('socket.io-client');

// Test basic Socket.IO connection without authentication (should work in development mode)
const SERVER_URL = 'http://localhost:3001';

console.log('🔌 Testing Basic Socket.IO Connection...');
console.log('Server URL:', SERVER_URL);

const socket = io(SERVER_URL, {
  transports: ['polling', 'websocket']
});

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // Test heartbeat
  socket.emit('heartbeat');
  
  console.log('🎉 Basic connection working! Socket.IO server is operational.');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('Error type:', error.type);
  console.error('Error description:', error.description);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Ready event (if authentication allows anonymous users)
socket.on('ready', (data) => {
  console.log('🎉 Ready event received:');
  console.log('User:', data.user);
  console.log('Session ID:', data.session_id);
});

// Heartbeat response
socket.on('heartbeat_ack', (data) => {
  console.log('💓 Heartbeat acknowledged:', data);
});

// Test duration
setTimeout(() => {
  console.log('🔄 Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 5000); // 5 seconds

// Handle process exit
process.on('SIGINT', () => {
  console.log('👋 Shutting down...');
  socket.disconnect();
  process.exit(0);
});