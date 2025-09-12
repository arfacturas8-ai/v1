#!/usr/bin/env node

/**
 * BASIC SOCKET.IO CONNECTION TEST
 * 
 * Tests if the Socket.io server is running and responding to connections
 * This bypasses authentication to test core infrastructure
 */

const { io } = require('socket.io-client');

console.log('🚀 Basic Socket.io Infrastructure Test');
console.log('📡 Testing connection to: http://localhost:3002');
console.log('ℹ️  This test checks if the Socket.io server is running correctly\n');

// Test with no authentication to see server response
const socket = io('http://localhost:3002', {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  forceNew: true,
  // No auth token - we expect this to fail with proper error handling
});

let testResults = {
  serverResponding: false,
  properErrorHandling: false,
  emergencyMode: false,
  connectionAttempted: true,
  errorMessage: null
};

socket.on('connect', () => {
  console.log('✅ Unexpected success - connected without authentication!');
  console.log('   Socket ID:', socket.id);
  testResults.serverResponding = true;
  
  // If we somehow connected, test basic functionality
  socket.emit('ping', (response) => {
    console.log('✅ Ping response:', response);
    showResults();
  });
  
  setTimeout(() => {
    showResults();
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.log('📋 Connection error (expected):', error.message);
  testResults.errorMessage = error.message;
  testResults.serverResponding = true; // Server is responding with proper error
  
  // Check if error message indicates proper authentication handling
  if (error.message.includes('Authentication') || error.message.includes('token')) {
    testResults.properErrorHandling = true;
    console.log('✅ Server properly requires authentication');
  } else {
    console.log('❌ Unexpected error type - server might not be configured correctly');
  }
  
  showResults();
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('emergency_mode', (data) => {
  console.log('🆘 Server in emergency mode:', data.message);
  testResults.emergencyMode = true;
  testResults.serverResponding = true;
  showResults();
});

function showResults() {
  console.log('\n📊 INFRASTRUCTURE TEST RESULTS:');
  console.log('====================================');
  console.log(`   Server Responding: ${testResults.serverResponding ? '✅ YES' : '❌ NO'}`);
  console.log(`   Proper Auth Handling: ${testResults.properErrorHandling ? '✅ YES' : '❌ NO'}`);
  console.log(`   Emergency Mode Active: ${testResults.emergencyMode ? '🆘 YES' : '✅ NO'}`);
  console.log(`   Error Message: ${testResults.errorMessage || 'None'}`);
  
  console.log('\n🎯 ASSESSMENT:');
  
  if (testResults.serverResponding && testResults.properErrorHandling) {
    console.log('🎉 EXCELLENT! Socket.io server is working correctly');
    console.log('   ✅ Server is running and accepting connections');
    console.log('   ✅ Authentication is properly enforced');
    console.log('   ✅ Error handling is working as expected');
    console.log('\n💡 NEXT STEPS:');
    console.log('   • Create a valid user account in the database');
    console.log('   • Generate a proper JWT token using the auth service');
    console.log('   • Test with authenticated connection');
  } else if (testResults.serverResponding && testResults.emergencyMode) {
    console.log('🆘 Server is running in EMERGENCY MODE');
    console.log('   ✅ Socket.io server is responsive');
    console.log('   ⚠️  Some core services are degraded');
    console.log('   ⚠️  This explains authentication failures');
  } else if (testResults.serverResponding) {
    console.log('⚠️  Server is responding but with unexpected behavior');
    console.log('   ✅ Socket.io server is running');
    console.log('   ❌ Authentication handling needs review');
  } else {
    console.log('❌ CRITICAL: Socket.io server is not responding');
    console.log('   • Check if the API server is running on port 3002');
    console.log('   • Check server logs for startup errors');
    console.log('   • Verify Socket.io configuration');
  }
  
  // Test HTTP endpoint as well
  console.log('\n🔍 Testing HTTP health endpoint...');
  
  const http = require('http');
  const req = http.request('http://localhost:3002/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const health = JSON.parse(data);
        console.log('✅ HTTP health endpoint responding');
        console.log(`   Status: ${health.status}`);
        console.log(`   API: ${health.checks?.api || 'Unknown'}`);
        console.log(`   Database: ${health.checks?.database || 'Unknown'}`);
        console.log(`   Redis: ${health.checks?.redis || 'Unknown'}`);
        console.log(`   Realtime: ${health.checks?.realtime || 'Unknown'}`);
      } catch (e) {
        console.log('✅ HTTP endpoint responding (non-JSON response)');
      }
      
      socket.disconnect();
      process.exit(testResults.serverResponding ? 0 : 1);
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ HTTP health endpoint not responding:', error.message);
    socket.disconnect();
    process.exit(1);
  });
  
  req.setTimeout(3000, () => {
    console.log('❌ HTTP health endpoint timeout');
    req.destroy();
    socket.disconnect();
    process.exit(1);
  });
  
  req.end();
}

// Auto-exit if no response within 8 seconds
setTimeout(() => {
  if (!testResults.serverResponding && !testResults.emergencyMode) {
    console.log('\n⏰ No response from server within timeout period');
    console.log('❌ Socket.io server appears to be down or unreachable');
    showResults();
  }
}, 8000);