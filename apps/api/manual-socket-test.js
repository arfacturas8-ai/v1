const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cryb_development_jwt_secret_key_2023_very_secure_and_long_key_for_development_only_never_use_in_production';
const API_BASE = 'http://localhost:3002';

console.log('🔧 Manual Socket.io Connection Test with JWT Token');
console.log('=================================================');

// Create a test JWT token manually
const tokenPayload = {
  userId: 'test-user-socket-123',
  sessionId: 'test-session-socket-456',  
  email: 'sockettest@example.com',
  username: 'sockettestuser',
  isVerified: true,
  jti: 'test-socket-jti-789',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  aud: 'cryb-users',
  iss: 'cryb-platform'
};

const testToken = jwt.sign(tokenPayload, JWT_SECRET);

console.log('✅ JWT Token created:');
console.log('   Payload:', JSON.stringify(tokenPayload, null, 2));
console.log('   Token:', testToken.substring(0, 50) + '...');

// Test different connection methods
async function testSocketConnection(method, authData) {
  console.log(`\n📡 Testing connection method: ${method}`);
  
  return new Promise((resolve) => {
    let socket;
    
    try {
      switch (method) {
        case 'auth-object':
          socket = io(API_BASE, {
            auth: authData,
            timeout: 10000,
            transports: ['websocket', 'polling'],
            forceNew: true
          });
          break;
          
        case 'query-token':
          socket = io(`${API_BASE}?token=${authData.token}`, {
            timeout: 10000,
            transports: ['websocket', 'polling'],
            forceNew: true
          });
          break;
          
        case 'header-auth':
          socket = io(API_BASE, {
            timeout: 10000,
            transports: ['websocket', 'polling'],
            forceNew: true,
            extraHeaders: {
              'Authorization': `Bearer ${authData.token}`
            }
          });
          break;
          
        default:
          console.log('❌ Unknown method');
          resolve(false);
          return;
      }
      
      const timeout = setTimeout(() => {
        console.log('❌ Connection timeout');
        socket.disconnect();
        resolve(false);
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket connected!');
        console.log('   Socket ID:', socket.id);
        console.log('   Transport:', socket.io.engine.transport.name);
        
        // Test basic events
        socket.emit('heartbeat');
        socket.emit('ping');
        
        setTimeout(() => {
          socket.disconnect();
          resolve(true);
        }, 2000);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.log('❌ Connection error:', error.message);
        console.log('   Error type:', error.type);
        console.log('   Error description:', error.description);
        resolve(false);
      });

      socket.on('authenticated', (data) => {
        console.log('✅ Authentication successful:', data);
      });

      socket.on('unauthorized', (error) => {
        console.log('❌ Authentication failed:', error);
      });

      socket.on('ready', (data) => {
        console.log('✅ Ready event received:');
        console.log('   User:', data.user?.username);
        console.log('   Session ID:', data.session_id);
      });

      socket.on('heartbeat_ack', (data) => {
        console.log('✅ Heartbeat acknowledged:', data.timestamp);
      });

      socket.on('pong', (data) => {
        console.log('✅ Pong received:', data.timestamp || 'no timestamp');
      });

      socket.on('error', (error) => {
        console.log('❌ Socket error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('   Disconnected:', reason);
      });

    } catch (error) {
      console.log('❌ Connection setup error:', error.message);
      resolve(false);
    }
  });
}

async function runSocketTests() {
  console.log('\n🚀 Starting Socket.io connection tests...\n');
  
  const authMethods = [
    { 
      method: 'auth-object', 
      authData: { token: testToken, accessToken: testToken }
    },
    { 
      method: 'query-token', 
      authData: { token: testToken }
    },
    { 
      method: 'header-auth', 
      authData: { token: testToken }
    }
  ];
  
  const results = [];
  
  for (const { method, authData } of authMethods) {
    const success = await testSocketConnection(method, authData);
    results.push({ method, success });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 SOCKET CONNECTION TEST RESULTS:');
  console.log('====================================');
  
  results.forEach(({ method, success }) => {
    console.log(`${success ? '✅' : '❌'} ${method}: ${success ? 'SUCCESS' : 'FAILED'}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\nOverall: ${successCount}/${results.length} methods worked`);
  
  if (successCount > 0) {
    console.log('🎉 Socket.io is working! Some connection methods are successful.');
  } else {
    console.log('🔧 Socket.io needs fixing. No connection methods worked.');
    console.log('\nPossible issues:');
    console.log('- Socket.io server not properly initialized');
    console.log('- Authentication middleware blocking connections');
    console.log('- CORS configuration issues');
    console.log('- JWT token validation problems');
  }
}

// Test authenticated socket connection with token in auth
async function testAuthenticatedConnection() {
  console.log('\n🧪 Testing authenticated socket connection...');
  
  return new Promise((resolve) => {
    const socket = io(API_BASE, {
      auth: { token: testToken },
      timeout: 10000,
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    const timeout = setTimeout(() => {
      console.log('❌ Authenticated connection timeout');
      socket.disconnect();
      resolve(false);
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log('✅ Authenticated socket connected:', socket.id);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('❌ Authenticated connection error:', error.message);
      console.log('   Error details:', error.description || 'No additional details');
      resolve(false);
    });

    socket.on('ready', (data) => {
      console.log('✅ Ready event received from server');
      console.log('   User:', data.user?.username);
      console.log('   Session ID:', data.session_id);
    });

    socket.on('error', (error) => {
      console.log('❌ Socket error after connection:', error);
    });
  });
}

async function main() {
  // First test authenticated connection directly
  console.log('🚀 Testing Socket.io with authentication...\n');
  
  const authWorking = await testAuthenticatedConnection();
  
  if (!authWorking) {
    console.log('\n🔧 Authenticated connection failed. Let\'s try different auth methods...');
    // Run authenticated connection tests with different methods
    await runSocketTests();
  } else {
    console.log('\n🎉 Socket.io is working with authentication!');
    console.log('✅ Real-time features should be functional');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSocketConnection, testPlainConnection };