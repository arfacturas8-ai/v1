#!/usr/bin/env node
/**
 * Frontend-Backend Integration Test
 * 
 * This script tests the complete user flow through the frontend APIs:
 * 1. User registration
 * 2. User login
 * 3. Community creation
 * 4. Post creation
 * 5. Socket.IO connection
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3002';
const FRONTEND_BASE = 'http://localhost:3003';

// Test configuration
const testUser = {
  email: `test-frontend-${Date.now()}@example.com`,
  username: `testuser${Date.now()}`,
  displayName: 'Test User',
  password: 'Password123!',
  confirmPassword: 'Password123!'
};

const testCommunity = {
  name: `testcommunity${Date.now()}`,
  displayName: 'Test Community',
  description: 'A test community for integration testing',
  isPublic: true,
  isNsfw: false
};

let authToken = null;
let userId = null;
let communityId = null;

// Test results
const results = {
  healthCheck: false,
  userRegistration: false,
  userLogin: false,
  communityCreation: false,
  postCreation: false,
  socketConnection: false
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  console.log('🔍 Testing API health check...');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    if (response.status === 200) {
      console.log('✅ API health check passed');
      results.healthCheck = true;
      return true;
    }
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('🔍 Testing user registration...');
  try {
    const response = await axios.post(`${API_BASE}/api/v1/auth/register`, testUser, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 201 && response.data.success) {
      console.log('✅ User registration successful');
      authToken = response.data.data.tokens.accessToken;
      userId = response.data.data.user.id;
      results.userRegistration = true;
      return true;
    } else {
      throw new Error('Registration failed: ' + (response.data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ User registration failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('🔍 Testing user login...');
  try {
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ User login successful');
      authToken = response.data.data.tokens.accessToken;
      results.userLogin = true;
      return true;
    } else {
      throw new Error('Login failed: ' + (response.data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testCommunityCreation() {
  console.log('🔍 Testing community creation...');
  try {
    const response = await axios.post(`${API_BASE}/api/v1/communities`, testCommunity, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Community creation successful');
      communityId = response.data.data.id;
      results.communityCreation = true;
      return true;
    } else {
      throw new Error('Community creation failed: ' + (response.data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Community creation failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testPostCreation() {
  console.log('🔍 Testing post creation...');
  try {
    const postData = {
      community: communityId,
      title: `Test Post ${Date.now()}`,
      content: 'This is a test post created by the integration test.',
      type: 'text'
    };

    const response = await axios.post(`${API_BASE}/api/v1/posts`, postData, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Post creation successful');
      results.postCreation = true;
      return true;
    } else {
      throw new Error('Post creation failed: ' + (response.data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Post creation failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testSocketConnection() {
  console.log('🔍 Testing Socket.IO connection...');
  try {
    // Import Socket.IO client
    const { io } = await import('socket.io-client');
    
    return new Promise((resolve) => {
      const socket = io(`${API_BASE}`, {
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
        timeout: 10000
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        console.error('❌ Socket.IO connection timeout');
        resolve(false);
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket.IO connection successful');
        results.socketConnection = true;
        socket.disconnect();
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Socket.IO connection failed:', error.message);
        socket.disconnect();
        resolve(false);
      });
    });
  } catch (error) {
    console.error('❌ Socket.IO test failed:', error.message);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('🔍 Testing frontend accessibility...');
  try {
    const response = await axios.get(`${FRONTEND_BASE}`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      return true;
    }
  } catch (error) {
    console.error('❌ Frontend access failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests\n');
  
  // Test API health
  if (!(await testHealthCheck())) {
    console.log('\n❌ Basic API health check failed. Cannot proceed with tests.');
    return;
  }

  // Test frontend accessibility
  await testFrontendAccess();

  await delay(1000);

  // Test user registration
  if (!(await testUserRegistration())) {
    console.log('\n❌ User registration failed. Cannot proceed with authenticated tests.');
    return;
  }

  await delay(1000);

  // Test user login (to ensure login works even after registration)
  await testUserLogin();

  await delay(1000);

  // Test community creation
  await testCommunityCreation();

  await delay(1000);

  // Test post creation
  await testPostCreation();

  await delay(1000);

  // Test Socket.IO connection
  await testSocketConnection();

  // Print results
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${testName}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All integration tests passed! Frontend is properly connected to backend APIs.');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
  }

  console.log('\n🔗 Frontend URLs to test manually:');
  console.log(`   - Homepage: ${FRONTEND_BASE}`);
  console.log(`   - Login: ${FRONTEND_BASE}/login`);
  console.log(`   - Register: ${FRONTEND_BASE}/register`);
  console.log(`   - Dashboard: ${FRONTEND_BASE}/dashboard`);
  console.log(`   - Communities: ${FRONTEND_BASE}/communities`);
  
  if (authToken) {
    console.log(`\n🔑 Test user credentials for manual testing:`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Community: r/${testCommunity.name}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});