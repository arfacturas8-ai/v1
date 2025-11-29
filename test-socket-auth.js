const io = require('socket.io-client');

// Test Socket.IO authentication with our test user token
const SERVER_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZvZWc2b24wMDAwMTFmd2pkazRreTFkIiwic2Vzc2lvbklkIjoiMTRmZWMxNmYtNjRiOC00ZGRmLWJlYmUtMGY5YzAyNWJiODdiIiwiZW1haWwiOiJkaXNjb3JkdGVzdEB0ZXN0LmNvbSIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOnRydWUsImp0aSI6ImU1Nzk2YmVkLWVmODMtNDA5Yi05ZjZkLTFmMTQ2ZTQxMzI4NSIsImlhdCI6MTc1ODE0MzQ0NywiZXhwIjoxNzU4MTQ0MzQ3LCJhdWQiOiJjcnliLXVzZXJzIiwiaXNzIjoiY3J5Yi1wbGF0Zm9ybSJ9.csBVdVcRgYAg2z5P-bU3axj5iAJyxYQ4NpuXMsU32IY';

console.log('🔌 Testing Socket.IO Authentication...');
console.log('Server URL:', SERVER_URL);
console.log('Test Token:', TEST_TOKEN.substring(0, 50) + '...');

const socket = io(SERVER_URL, {
  auth: {
    token: TEST_TOKEN
  },
  transports: ['polling', 'websocket']
});

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // Test heartbeat
  socket.emit('heartbeat');
  
  // Test presence update
  socket.emit('presence:update', {
    status: 'online',
    activity: { type: 'testing', name: 'Socket.IO functionality' }
  });
  
  // Test message sending (if channels exist)
  setTimeout(() => {
    socket.emit('message:send', {
      channelId: 'test-channel',
      content: 'Hello from Socket.IO test!'
    });
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('Error details:', error);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Authentication events
socket.on('auth_error', (error) => {
  console.error('🔐 Authentication error:', error);
});

// Ready event
socket.on('ready', (data) => {
  console.log('🎉 Ready event received:');
  console.log('User:', data.user);
  console.log('Session ID:', data.session_id);
  console.log('Timestamp:', data.timestamp);
});

// Heartbeat response
socket.on('heartbeat_ack', (data) => {
  console.log('💓 Heartbeat acknowledged:', data);
});

// Presence updates
socket.on('presence:update', (data) => {
  console.log('👤 Presence update:', data);
});

// Message events
socket.on('message:new', (data) => {
  console.log('💬 New message:', data);
});

// Typing events
socket.on('typing:user_start', (data) => {
  console.log('⌨️ User started typing:', data);
});

socket.on('typing:user_stop', (data) => {
  console.log('⌨️ User stopped typing:', data);
});

// Test duration
setTimeout(() => {
  console.log('🔄 Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000); // 10 seconds

// Handle process exit
process.on('SIGINT', () => {
  console.log('👋 Shutting down...');
  socket.disconnect();
  process.exit(0);
});