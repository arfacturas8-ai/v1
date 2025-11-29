const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'cryb_development_jwt_secret_key_2023_very_secure_and_long_key_for_development_only_never_use_in_production';
const API_BASE = 'http://localhost:3002';

console.log('🚀 Simple Socket.io Test');

// Create token payload
const tokenPayload = {
  userId: 'test-user-socket-123',
  sessionId: 'test-session-socket-456',
  email: 'sockettest@example.com',
  username: 'sockettestuser',
  displayName: 'Socket Test User',
  isVerified: true,
  jti: 'test-socket-jti-789',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
  aud: 'cryb-users',
  iss: 'cryb-platform'
};

const testToken = jwt.sign(tokenPayload, JWT_SECRET);
console.log('✅ Test token created for user:', tokenPayload.displayName);

async function testSocket() {
  console.log('\n🔌 Connecting to Socket.io server...');
  
  return new Promise((resolve) => {
    const socket = io(API_BASE, {
      auth: { token: testToken },
      timeout: 10000,
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    let connected = false;
    let readyReceived = false;

    const timeout = setTimeout(() => {
      console.log('⏰ Connection timeout');
      socket.disconnect();
      resolve({ 
        connected: false, 
        authenticated: false, 
        readyReceived: false, 
        reason: 'timeout'
      });
    }, 10000);

    socket.on('connect', () => {
      connected = true;
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('❌ Connection error:', error.message);
      socket.disconnect();
      resolve({ 
        connected: false, 
        authenticated: false, 
        readyReceived: false, 
        reason: error.message
      });
    });

    socket.on('ready', (data) => {
      readyReceived = true;
      console.log('🎉 Ready event received!');
      console.log('   User:', data.user?.displayName);
      
      clearTimeout(timeout);
      socket.disconnect();
      
      resolve({ 
        connected: true, 
        authenticated: true, 
        readyReceived: true, 
        reason: 'success'
      });
    });

    socket.on('unauthorized', (error) => {
      clearTimeout(timeout);
      console.log('🚫 Unauthorized:', error);
      socket.disconnect();
      resolve({ 
        connected: connected, 
        authenticated: false, 
        readyReceived: false, 
        reason: 'unauthorized'
      });
    });
  });
}

async function main() {
  try {
    const result = await testSocket();
    
    console.log('\n📊 RESULTS:');
    console.log('Connected:', result.connected ? '✅' : '❌');
    console.log('Authenticated:', result.authenticated ? '✅' : '❌'); 
    console.log('Ready Event:', result.readyReceived ? '✅' : '❌');
    console.log('Reason:', result.reason);
    
    if (result.connected && result.authenticated && result.readyReceived) {
      console.log('\n🎉 SUCCESS: Socket.io is fully functional!');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

main().catch(console.error);
