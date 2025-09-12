/**
 * Socket.IO Authentication Test Script
 * Tests authentication handshake with the backend Socket.io server
 */

const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3001';

// Mock JWT tokens for testing (these should be generated from your auth system)
const TEST_TOKENS = {
  // Valid JWT structure (but fake payload)
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJzZXNzaW9uSWQiOiJ0ZXN0LXNlc3Npb24iLCJpYXQiOjE3MzE0NTQ4MDBdLCJleHAiOjE3MzE0NTg0MDB9.fake-signature-for-testing',
  // Invalid format
  invalid: 'invalid-token',
  // Missing
  missing: null,
  // Empty
  empty: ''
};

async function testSocketAuthentication() {
  console.log('🔌 Testing Socket.IO Authentication');
  console.log('Server URL:', SOCKET_URL);
  console.log('');

  const testCases = [
    {
      name: 'Valid token in auth.token',
      config: {
        auth: { token: TEST_TOKENS.valid },
        transports: ['polling'],
        timeout: 5000
      },
      expectedResult: 'success or auth_error (if token validation fails)'
    },
    {
      name: 'Valid token in Authorization header',
      config: {
        extraHeaders: { 
          'Authorization': `Bearer ${TEST_TOKENS.valid}` 
        },
        transports: ['polling'],
        timeout: 5000
      },
      expectedResult: 'success or auth_error (if token validation fails)'
    },
    {
      name: 'Valid token in query parameter',
      config: {
        query: { token: TEST_TOKENS.valid },
        transports: ['polling'],
        timeout: 5000
      },
      expectedResult: 'success or auth_error (if token validation fails)'
    },
    {
      name: 'Invalid token format',
      config: {
        auth: { token: TEST_TOKENS.invalid },
        transports: ['polling'],
        timeout: 5000
      },
      expectedResult: 'connect_error with JWT structure error'
    },
    {
      name: 'Missing token',
      config: {
        transports: ['polling'],
        timeout: 5000
      },
      expectedResult: 'connect_error with authentication required'
    },
    {
      name: 'Empty token',
      config: {
        auth: { token: TEST_TOKENS.empty },
        transports: ['polling'],
        timeout: 5000
      },
      expectedResult: 'connect_error with invalid token format'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Test: ${testCase.name}`);
    console.log(`Expected: ${testCase.expectedResult}`);
    console.log('---');

    await runSingleTest(testCase);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 All Socket.IO Authentication tests completed!');
}

function runSingleTest(testCase) {
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, testCase.config);
    let testCompleted = false;

    // Set timeout for each test
    const testTimeout = setTimeout(() => {
      if (!testCompleted) {
        console.log('❌ Test timed out after 10 seconds');
        testCompleted = true;
        socket.disconnect();
        resolve();
      }
    }, 10000);

    // Connection success
    socket.on('connect', () => {
      if (!testCompleted) {
        console.log('✅ Connection successful');
        console.log('   Socket ID:', socket.id);
        console.log('   Transport:', socket.io.engine.transport.name);
        
        // Test authenticated functionality
        socket.emit('heartbeat');
        
        testCompleted = true;
        clearTimeout(testTimeout);
        socket.disconnect();
        resolve();
      }
    });

    // Connection error (expected for invalid tokens)
    socket.on('connect_error', (error) => {
      if (!testCompleted) {
        console.log('❌ Connection error:', error.message);
        console.log('   Error type:', error.type || 'unknown');
        console.log('   Description:', error.description || 'none');
        
        testCompleted = true;
        clearTimeout(testTimeout);
        socket.disconnect();
        resolve();
      }
    });

    // Authentication error
    socket.on('auth_error', (error) => {
      if (!testCompleted) {
        console.log('🔒 Authentication error:', error);
        
        testCompleted = true;
        clearTimeout(testTimeout);
        socket.disconnect();
        resolve();
      }
    });

    // Disconnection
    socket.on('disconnect', (reason) => {
      if (!testCompleted) {
        console.log('🔌 Disconnected:', reason);
        
        testCompleted = true;
        clearTimeout(testTimeout);
        resolve();
      }
    });

    // Heartbeat response (indicates successful auth)
    socket.on('heartbeat_ack', () => {
      if (!testCompleted) {
        console.log('💓 Heartbeat acknowledged - authentication working!');
      }
    });

    // Emergency mode (server in degraded state)
    socket.on('emergency_mode', (data) => {
      if (!testCompleted) {
        console.log('🆘 Server in emergency mode:', data.message);
      }
    });

    // Ready event (Discord-style authentication success)
    socket.on('ready', (data) => {
      if (!testCompleted) {
        console.log('🎯 Ready event received - Discord auth successful!');
        console.log('   User data:', data.user || 'none');
        console.log('   Session ID:', data.session_id || 'none');
      }
    });
  });
}

// Check dependencies and run tests
async function main() {
  // Test if socket.io-client is available
  try {
    require.resolve('socket.io-client');
  } catch (error) {
    console.log('❌ socket.io-client not found. Installing...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install socket.io-client', { stdio: 'inherit' });
      console.log('✅ socket.io-client installed successfully');
    } catch (installError) {
      console.error('💥 Failed to install socket.io-client:', installError.message);
      process.exit(1);
    }
  }

  console.log('🚀 Starting Socket.IO Authentication Tests...');
  console.log('');
  console.log('📋 This test will check:');
  console.log('- Token extraction from auth.token');
  console.log('- Token extraction from Authorization header');  
  console.log('- Token extraction from query parameter');
  console.log('- Invalid token format handling');
  console.log('- Missing token handling');
  console.log('- JWT structure validation');
  console.log('- Authentication middleware response');
  console.log('');

  try {
    await testSocketAuthentication();
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

main();