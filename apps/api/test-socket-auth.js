#!/usr/bin/env node

const { io } = require('socket.io-client');

// Test Socket.IO authentication
async function testSocketAuth() {
  console.log('🔄 Testing Socket.IO authentication...');

  // Test 1: Connection without token (should fail)
  console.log('\n1️⃣ Testing connection without token...');
  const socketNoAuth = io('http://localhost:3002', {
    timeout: 5000,
    transports: ['websocket', 'polling']
  });

  socketNoAuth.on('connect_error', (error) => {
    console.log('✅ Expected failure - No auth:', error.message);
    socketNoAuth.disconnect();
  });

  socketNoAuth.on('connect', () => {
    console.log('❌ Unexpected success - should have failed without token');
    socketNoAuth.disconnect();
  });

  // Wait for first test
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: Connection with invalid token (should fail)
  console.log('\n2️⃣ Testing connection with invalid token...');
  const socketBadAuth = io('http://localhost:3002', {
    auth: {
      token: 'invalid-token-12345'
    },
    timeout: 5000,
    transports: ['websocket', 'polling']
  });

  socketBadAuth.on('connect_error', (error) => {
    console.log('✅ Expected failure - Bad token:', error.message);
    socketBadAuth.disconnect();
  });

  socketBadAuth.on('connect', () => {
    console.log('❌ Unexpected success - should have failed with bad token');
    socketBadAuth.disconnect();
  });

  // Wait for second test
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 3: Try to get a valid token first
  console.log('\n3️⃣ Attempting to get a valid token from API...');
  
  try {
    // First, let's try to register or login to get a valid token
    const fetch = require('node-fetch');
    
    // Try health check first
    const healthResponse = await fetch('http://localhost:3002/health');
    const healthData = await healthResponse.json();
    console.log('📊 API Health:', healthData.status);
    
    // Check if we can create a test user or login
    console.log('🔄 Attempting test authentication...');
    
    // Try to create a test user account
    const testUser = {
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'test123456'
    };
    
    const registerResponse = await fetch('http://localhost:3002/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Test user created successfully');
      
      const token = registerData.accessToken;
      if (token) {
        console.log('✅ Got valid token:', token.substring(0, 20) + '...');
        
        // Test 4: Connection with valid token
        console.log('\n4️⃣ Testing connection with valid token...');
        const socketValidAuth = io('http://localhost:3002', {
          auth: {
            token: token
          },
          timeout: 10000,
          transports: ['websocket', 'polling']
        });

        socketValidAuth.on('connect', () => {
          console.log('🎉 SUCCESS! Connected with valid token');
          
          // Test real-time messaging
          socketValidAuth.emit('ping', (response) => {
            console.log('🏓 Ping response:', response);
          });
          
          setTimeout(() => {
            socketValidAuth.disconnect();
            console.log('✅ Socket.IO authentication test completed');
            process.exit(0);
          }, 2000);
        });

        socketValidAuth.on('connect_error', (error) => {
          console.log('❌ Failed to connect with valid token:', error.message);
          process.exit(1);
        });

        socketValidAuth.on('heartbeat', (data) => {
          console.log('💓 Received heartbeat:', data);
        });

      } else {
        console.log('❌ No access token in response');
        console.log('Response:', JSON.stringify(registerData, null, 2));
      }
    } else {
      console.log('❌ Failed to register test user:', registerResponse.status);
      const errorData = await registerResponse.text();
      console.log('Error:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Error during token test:', error.message);
  }

  // Cleanup timeout
  setTimeout(() => {
    console.log('⏰ Test timeout reached');
    process.exit(1);
  }, 30000);
}

testSocketAuth().catch(console.error);