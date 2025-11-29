#!/usr/bin/env node

/**
 * Test just the Socket.io connection without auth requirements
 */

const { io } = require('socket.io-client');

const API_URL = 'http://localhost:3002';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function testSocketConnection() {
  log('🔌 Testing basic Socket.io connection (no auth)...');

  let client = null;

  try {
    // First, check if Socket.io endpoint is available
    log('📡 Checking if Socket.io endpoint is available...');
    
    const response = await fetch(API_URL + '/socket.io/', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Socket.io Test Client'
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      if (text.includes('socket.io')) {
        log('✅ Socket.io endpoint is responding');
      } else {
        log('⚠️ Endpoint responding but might not be Socket.io');
      }
    } else {
      log(`❌ Socket.io endpoint returned ${response.status}: ${response.statusText}`, 'error');
      return false;
    }

    // Test connection without token
    log('🔌 Attempting connection without authentication...');
    
    client = io(API_URL, {
      transports: ['polling', 'websocket'], // Try polling first
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: false
    });

    const connectionResult = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Connection timeout' });
      }, 15000);

      client.on('connect', () => {
        clearTimeout(timeout);
        log('✅ Basic connection successful! Socket ID: ' + client.id, 'success');
        resolve({ success: true, socketId: client.id });
      });

      client.on('connect_error', (error) => {
        clearTimeout(timeout);
        log('❌ Connection failed: ' + error.message, 'error');
        resolve({ success: false, error: error.message });
      });

      client.on('disconnect', (reason) => {
        log('❌ Disconnected: ' + reason, 'warning');
      });
    });

    if (connectionResult.success) {
      // Test basic events
      log('📨 Testing basic events...');
      
      // Test ping/pong
      client.emit('ping');
      
      await new Promise(resolve => {
        client.on('pong', (data) => {
          log('✅ Ping/Pong working! Latency: ' + (Date.now() - data.timestamp) + 'ms', 'success');
          resolve();
        });
        
        setTimeout(() => {
          log('⚠️ No pong received (might be expected)', 'warning');
          resolve();
        }, 2000);
      });

      log('🔒 Testing with authentication token...');
      
      // Disconnect and reconnect with auth
      client.disconnect();
      
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQtMTIzNDUiLCJ1c2VybmFtZSI6InJlYWx0aW1ldGVzdCIsImVtYWlsIjoicmVhbHRpbWVAdGVzdC5jb20iLCJpc1ZlcmlmaWVkIjp0cnVlLCJzZXNzaW9uSWQiOiJ0ZXN0LXNlc3Npb24tMTc1ODc0MDM1MTcyNSIsImlhdCI6MTc1ODc0MDM1MSwiZXhwIjoxNzU4ODI2NzUxLCJhdWQiOiJjcnliLXVzZXJzIiwiaXNzIjoiY3J5Yi1wbGF0Zm9ybSJ9.2WC84fudMmPYyRCPnKsEFVO9ubmD8TPzH_eZCTOjHhA';
      
      const authClient = io(API_URL, {
        auth: { token },
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: true
      });

      const authResult = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Auth connection timeout' });
        }, 10000);

        authClient.on('connect', () => {
          clearTimeout(timeout);
          log('✅ Authenticated connection successful! Socket ID: ' + authClient.id, 'success');
          resolve({ success: true, socketId: authClient.id });
        });

        authClient.on('connect_error', (error) => {
          clearTimeout(timeout);
          log('❌ Auth connection failed: ' + error.message, 'error');
          resolve({ success: false, error: error.message });
        });

        authClient.on('ready', (data) => {
          log('✅ Ready event received! User: ' + data.userId, 'success');
        });

        authClient.on('error', (error) => {
          log('⚠️ Socket error: ' + error, 'warning');
        });
      });

      if (authResult.success) {
        log('🎉 Full authentication successful!', 'success');
        
        // Test a simple event
        authClient.emit('presence:update', { status: 'online' });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        authClient.disconnect();
      }
      
      return authResult.success;
    }

    return false;

  } catch (error) {
    log('💥 Test failed with exception: ' + error.message, 'error');
    return false;
  } finally {
    if (client && client.connected) {
      client.disconnect();
    }
  }
}

// Also test the health endpoint
async function testHealthEndpoints() {
  log('\n📊 Testing health endpoints...');
  
  try {
    const healthResponse = await fetch(API_URL + '/health');
    const health = await healthResponse.json();
    
    log('API Health Status: ' + health.status, health.status === 'healthy' ? 'success' : 'warning');
    log('Services: ' + JSON.stringify(health.checks, null, 2));
    
    const socketHealthResponse = await fetch(API_URL + '/health/socket');
    const socketHealth = await socketHealthResponse.json();
    
    log('Socket Health Status: ' + socketHealth.status, socketHealth.status === 'healthy' ? 'success' : 'warning');
    log('Active Connections: ' + socketHealth.metrics.socket.activeConnections);
    log('Total Connections: ' + socketHealth.metrics.socket.totalConnections);
    log('Redis Status: ' + (socketHealth.services.redis ? 'Connected' : 'Disconnected'));
    log('System Uptime: ' + Math.round(socketHealth.uptime / 1000) + ' seconds');
    
    return true;
  } catch (error) {
    log('❌ Health check failed: ' + error.message, 'error');
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting Socket.io Connection Tests\n');
  
  const healthResult = await testHealthEndpoints();
  const connectionResult = await testSocketConnection();
  
  log('\n📊 TEST SUMMARY');
  log('='.repeat(30));
  log('Health Endpoints: ' + (healthResult ? 'PASS' : 'FAIL'), healthResult ? 'success' : 'error');
  log('Socket Connection: ' + (connectionResult ? 'PASS' : 'FAIL'), connectionResult ? 'success' : 'error');
  
  const overallScore = (healthResult ? 50 : 0) + (connectionResult ? 50 : 0);
  log('Overall Score: ' + overallScore + '%', overallScore >= 75 ? 'success' : overallScore >= 25 ? 'warning' : 'error');
  
  if (overallScore >= 75) {
    log('🎉 Socket.io system is working well!', 'success');
  } else if (overallScore >= 25) {
    log('⚠️ Socket.io system has some issues', 'warning');
  } else {
    log('❌ Socket.io system needs attention', 'error');
  }
  
  return overallScore >= 50;
}

if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testSocketConnection, testHealthEndpoints };