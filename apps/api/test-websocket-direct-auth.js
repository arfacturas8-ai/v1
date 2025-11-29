const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

console.log('Creating proper auth token directly...');

// Use the same JWT secret that the auth package would use
const JWT_SECRET = process.env.JWT_SECRET || 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';

// Create a token using the auth package format
const tokenPayload = {
  userId: 'cmg788wf300005sb4h6e3oloy',
  email: 'test1759277242@example.com',
  sessionId: 'session-' + Date.now(),
  isVerified: false,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
};

const token = jwt.sign(tokenPayload, JWT_SECRET, {
  algorithm: 'HS256',
  issuer: 'cryb-platform',
  audience: 'cryb-users'
});

console.log('Generated token:', token.substring(0, 50) + '...');
console.log('Testing WebSocket connection with proper authentication...');

const socket = io('https://api.cryb.ai', {
  auth: { token },
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully with proper authentication!');
  console.log('Socket ID:', socket.id);
  
  // Test basic Discord-like operations
  setTimeout(() => {
    console.log('🔥 Testing Discord-like events...');
    
    // Test server join
    socket.emit('server:join', { serverId: 'general' }, (response) => {
      console.log('Server join response:', response);
    });
    
    // Test channel join
    socket.emit('channel:join', { channelId: 'general' }, (response) => {
      console.log('Channel join response:', response);
    });
    
    // Test presence update
    socket.emit('presence:update', {
      status: 'online',
      activity: { type: 'testing', name: 'WebSocket Authentication' }
    }, (response) => {
      console.log('Presence update response:', response);
    });
    
  }, 1000);
  
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ WebSocket authentication test completed successfully');
    process.exit(0);
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason);
});

socket.on('server:joined', (data) => {
  console.log('📨 Server joined event:', data);
});

socket.on('channel:joined', (data) => {
  console.log('📨 Channel joined event:', data);
});

socket.on('presence:updated', (data) => {
  console.log('📨 Presence updated event:', data);
});

setTimeout(() => {
  console.error('❌ WebSocket connection timeout');
  process.exit(1);
}, 15000);