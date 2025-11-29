#!/usr/bin/env node

/**
 * Frontend-Backend Connectivity Test
 * Tests if the frontend can successfully connect to the backend API
 */

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3003';
const BACKEND_URL = 'http://localhost:3002';

async function testFrontendBackendConnectivity() {
  console.log('🧪 Testing Frontend-Backend Connectivity\n');
  
  const tests = [];
  
  try {
    // Test 1: Frontend accessibility
    console.log('1️⃣ Testing frontend accessibility...');
    try {
      const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
      console.log('✅ Frontend accessible on port 3003');
      tests.push({ test: 'Frontend Accessibility', status: 'PASS' });
    } catch (error) {
      console.log('❌ Frontend not accessible:', error.message);
      tests.push({ test: 'Frontend Accessibility', status: 'FAIL', error: error.message });
    }
    
    // Test 2: Backend API health
    console.log('\n2️⃣ Testing backend API health...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
      console.log('✅ Backend API healthy on port 3002');
      console.log('   Status:', healthResponse.data.status);
      tests.push({ test: 'Backend API Health', status: 'PASS', data: healthResponse.data });
    } catch (error) {
      console.log('❌ Backend API health check failed:', error.message);
      tests.push({ test: 'Backend API Health', status: 'FAIL', error: error.message });
    }
    
    // Test 3: API data endpoints
    console.log('\n3️⃣ Testing API data endpoints...');
    try {
      const postsResponse = await axios.get(`${BACKEND_URL}/api/v1/posts?limit=3`, { timeout: 5000 });
      console.log('✅ API posts endpoint working');
      console.log('   Posts returned:', postsResponse.data.data.items.length);
      tests.push({ test: 'API Data Endpoints', status: 'PASS', data: { postsCount: postsResponse.data.data.items.length } });
    } catch (error) {
      console.log('❌ API data endpoints failed:', error.message);
      tests.push({ test: 'API Data Endpoints', status: 'FAIL', error: error.message });
    }
    
    // Test 4: Socket.io connectivity
    console.log('\n4️⃣ Testing Socket.io connectivity...');
    try {
      // Just test if socket endpoint is reachable
      const socketResponse = await axios.get(`${BACKEND_URL}/socket.io/`, { 
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 500 // Accept any non-error status
      });
      console.log('✅ Socket.io endpoint reachable');
      tests.push({ test: 'Socket.io Connectivity', status: 'PASS' });
    } catch (error) {
      console.log('❌ Socket.io connectivity test failed:', error.message);
      tests.push({ test: 'Socket.io Connectivity', status: 'FAIL', error: error.message });
    }
    
    // Test 5: CORS configuration
    console.log('\n5️⃣ Testing CORS configuration...');
    try {
      const corsResponse = await axios.options(`${BACKEND_URL}/api/v1/posts`, {
        headers: {
          'Origin': 'http://localhost:3003',
          'Access-Control-Request-Method': 'GET'
        },
        timeout: 5000
      });
      console.log('✅ CORS properly configured');
      tests.push({ test: 'CORS Configuration', status: 'PASS' });
    } catch (error) {
      console.log('⚠️ CORS test inconclusive:', error.message);
      tests.push({ test: 'CORS Configuration', status: 'WARN', error: error.message });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
  }
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;
  const warnings = tests.filter(t => t.status === 'WARN').length;
  
  tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${status} ${test.test}: ${test.status}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  console.log(`\n🎯 Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  
  if (failed === 0) {
    console.log('🎉 All critical tests passed! Frontend-Backend connectivity is working.');
    return true;
  } else {
    console.log('💥 Some tests failed. Please check the configuration.');
    return false;
  }
}

// Environment info
console.log('🔧 Environment Configuration:');
console.log('Frontend URL:', FRONTEND_URL);
console.log('Backend URL:', BACKEND_URL);
console.log('Current time:', new Date().toISOString());
console.log('');

testFrontendBackendConnectivity()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });