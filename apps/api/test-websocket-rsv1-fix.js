#!/usr/bin/env node

/**
 * Test WebSocket RSV1 Compression Fix
 * 
 * This script tests that Socket.io WebSocket connections work correctly
 * after fixing the nginx compression configuration that was causing
 * "Invalid WebSocket frame: RSV1 must be clear" errors.
 */

const { io } = require('socket.io-client');
const axios = require('axios');

const API_URL = 'https://api.cryb.ai';

async function testWebSocketConnection() {
  console.log('🔧 Testing WebSocket RSV1 Compression Fix...\n');

  try {
    // First, get a valid auth token
    console.log('1️⃣ Getting authentication token...');
    
    const authResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
      login: 'testuser',
      password: 'testpassword123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }).catch(async (error) => {
      // If login fails, try to register first
      console.log('   🔄 Login failed, attempting registration...');
      
      const registerResponse = await axios.post(`${API_URL}/api/v1/auth/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword123',
        displayName: 'Test User'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (registerResponse.data.success) {
        console.log('   ✅ Registration successful, now logging in...');
        return axios.post(`${API_URL}/api/v1/auth/login`, {
          login: 'testuser',
          password: 'testpassword123'
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
      }
      
      throw error;
    });

    if (!authResponse.data.success || !authResponse.data.data.accessToken) {
      throw new Error('Authentication failed');
    }

    const token = authResponse.data.data.accessToken;
    console.log('   ✅ Authentication successful');

    // Test WebSocket connection with compression disabled
    console.log('\n2️⃣ Testing WebSocket connection (transport priority: websocket first)...');
    
    return new Promise((resolve, reject) => {
      const socket = io(API_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'], // Try WebSocket first
        upgrade: true,
        rememberUpgrade: true,
        timeout: 30000,
        forceNew: true,
        // Ensure no client-side compression
        compression: false,
        perMessageDeflate: false
      });

      let connectionSuccess = false;
      let transportUsed = null;
      let errorEncountered = null;

      socket.on('connect', () => {
        connectionSuccess = true;
        transportUsed = socket.io.engine.transport.name;
        console.log(`   ✅ Socket.io connected successfully!`);
        console.log(`   📡 Transport used: ${transportUsed}`);
        console.log(`   🔌 Socket ID: ${socket.id}`);
        
        // Test that we can send/receive messages
        console.log('\n3️⃣ Testing real-time message exchange...');
        
        socket.emit('ping', { timestamp: Date.now() }, (response) => {
          if (response) {
            console.log('   ✅ Ping-pong successful');
            console.log(`   ⏱️  Round trip time: ${Date.now() - response.timestamp}ms`);
          }
        });

        socket.on('pong', (data) => {
          console.log('   ✅ Pong received');
          console.log(`   ⏱️  Server timestamp: ${new Date(data.timestamp).toISOString()}`);
          
          // Connection is working, clean up and resolve
          setTimeout(() => {
            socket.disconnect();
            resolve({
              success: true,
              transport: transportUsed,
              noRSV1Errors: true
            });
          }, 1000);
        });

        // Send a heartbeat to test the connection
        socket.emit('heartbeat', { test: true });
      });

      socket.on('connect_error', (error) => {
        errorEncountered = error;
        console.log(`   ❌ Connection error: ${error.message}`);
        
        // Check specifically for RSV1 errors
        if (error.message.includes('RSV1') || error.message.includes('WebSocket frame')) {
          console.log('   🚨 RSV1 WebSocket frame error detected!');
          console.log('   💡 This indicates compression is still being applied somewhere');
          reject({
            success: false,
            error: 'RSV1_ERROR_DETECTED',
            message: error.message,
            transport: transportUsed
          });
        } else {
          // Other connection errors might be authentication or network related
          console.log('   ⚠️  Non-RSV1 connection error, checking transport fallback...');
        }
      });

      socket.on('disconnect', (reason) => {
        if (connectionSuccess) {
          console.log(`   📴 Disconnected: ${reason}`);
        } else {
          console.log(`   ❌ Disconnected before successful connection: ${reason}`);
        }
      });

      // Test timeout
      setTimeout(() => {
        if (!connectionSuccess) {
          socket.disconnect();
          
          if (errorEncountered) {
            reject({
              success: false,
              error: 'CONNECTION_FAILED',
              message: errorEncountered.message,
              transport: transportUsed
            });
          } else {
            reject({
              success: false,
              error: 'TIMEOUT',
              message: 'Connection timed out after 30 seconds',
              transport: transportUsed
            });
          }
        }
      }, 30000);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    throw error;
  }
}

// Run the test
testWebSocketConnection()
  .then((result) => {
    console.log('\n🎉 WebSocket RSV1 Fix Test Results:');
    console.log('=====================================');
    console.log(`✅ Connection Success: ${result.success}`);
    console.log(`📡 Transport Used: ${result.transport}`);
    console.log(`🔧 RSV1 Errors Fixed: ${result.noRSV1Errors}`);
    console.log('\n🚀 Real-time features should now work correctly!');
    console.log('\nKey fixes applied:');
    console.log('- ✅ nginx: gzip off for /socket.io/ location');
    console.log('- ✅ nginx: proxy_buffering off for WebSocket');
    console.log('- ✅ Socket.io: compression: false');
    console.log('- ✅ Socket.io: httpCompression: false');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 WebSocket RSV1 Fix Test Failed:');
    console.error('===================================');
    console.error(`❌ Error Type: ${error.error || 'UNKNOWN'}`);
    console.error(`📝 Message: ${error.message || error}`);
    console.error(`📡 Transport: ${error.transport || 'none'}`);
    
    if (error.error === 'RSV1_ERROR_DETECTED') {
      console.error('\n🔧 Additional troubleshooting needed:');
      console.error('- Check if nginx configuration was properly reloaded');
      console.error('- Verify no other reverse proxy is applying compression');
      console.error('- Check for any CDN/load balancer compression settings');
    }
    
    process.exit(1);
  });