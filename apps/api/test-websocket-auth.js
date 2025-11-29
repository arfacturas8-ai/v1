const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';

// Create token for our test user
const tokenPayload = {
  id: 'cmg788wf300005sb4h6e3oloy',
  username: 'testuser1759277242',
  displayName: 'Test User',
  email: 'test1759277242@example.com'
};

const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('Testing WebSocket connection with authentication...');
console.log('Token:', token.substring(0, 50) + '...');

const socket = io('https://api.cryb.ai', {
  auth: { token },
  transports: ['websocket', 'polling'],
  timeout: 5000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully with authentication!');
  console.log('Socket ID:', socket.id);
  
  // Test joining a channel
  socket.emit('channel:join', { channelId: 'general' }, (response) => {
    console.log('Channel join response:', response);
  });
  
  // Test sending a message
  socket.emit('message:send', {
    channelId: 'general',
    content: 'Hello from authenticated WebSocket test!'
  }, (response) => {
    console.log('Message send response:', response);
  });
  
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ WebSocket authentication test completed successfully');
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason);
});

socket.on('message:new', (message) => {
  console.log('📨 Received message:', message);
});

setTimeout(() => {
  console.error('❌ WebSocket connection timeout');
  process.exit(1);
}, 10000);