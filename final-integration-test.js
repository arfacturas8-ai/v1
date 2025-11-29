#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3001';
const WEB_URL = 'http://localhost:3003';

async function testIntegration() {
  console.log('🔍 CRYB Platform Integration Test\n');
  
  const results = {
    backend: {},
    frontend: {},
    features: {}
  };
  
  // Test Backend API
  console.log('📡 Testing Backend API...');
  try {
    const health = await axios.get(`${API_URL}/health`);
    results.backend.health = '✅ API Health: ' + health.data.status;
    results.backend.services = Object.entries(health.data.checks)
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n');
  } catch (e) {
    results.backend.health = '❌ API not responding';
  }
  
  // Test Frontend
  console.log('\n🖥️  Testing Frontend...');
  try {
    const response = await axios.get(WEB_URL);
    results.frontend.status = '✅ Frontend running on port 3003';
    results.frontend.title = response.data.includes('CRYB Platform') ? 
      '✅ CRYB Platform loaded' : '❌ Wrong page loaded';
  } catch (e) {
    results.frontend.status = '❌ Frontend not accessible';
  }
  
  // Test Authentication Flow
  console.log('\n🔐 Testing Authentication...');
  const timestamp = Date.now();
  const testUser = {
    username: `test${timestamp}`,
    displayName: 'Test User',
    email: `test${timestamp}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };
  
  try {
    // Register
    const regResponse = await axios.post(`${API_URL}/api/v1/auth/register`, testUser);
    results.features.register = '✅ Registration works';
    const token = regResponse.data.data.tokens.accessToken;
    
    // Login
    const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    results.features.login = '✅ Login works';
    
    // Create Community
    const communityResponse = await axios.post(
      `${API_URL}/api/v1/communities`,
      {
        name: `test${timestamp}`.substring(0, 20),
        displayName: 'Test Community',
        description: 'Test Description'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    results.features.community = '✅ Community creation works';
    const communityId = communityResponse.data.data.id;
    
    // Create Post
    const postResponse = await axios.post(
      `${API_URL}/api/v1/posts`,
      {
        communityId,
        title: 'Test Post',
        content: 'Test content'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    results.features.post = '✅ Post creation works';
    const postId = postResponse.data.data.id;
    
    // Vote on Post
    const voteResponse = await axios.post(
      `${API_URL}/api/v1/posts/${postId}/vote`,
      { value: 1 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    results.features.voting = '✅ Voting works';
    
    // Create Comment
    const commentResponse = await axios.post(
      `${API_URL}/api/v1/comments`,
      {
        postId,
        content: 'Test comment'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    results.features.comments = '✅ Comments work';
    
  } catch (e) {
    if (!results.features.register) results.features.register = '❌ Registration failed: ' + e.response?.data?.error;
    if (!results.features.login) results.features.login = '❌ Login failed';
    if (!results.features.community) results.features.community = '❌ Community creation failed';
    if (!results.features.post) results.features.post = '❌ Post creation failed';
    if (!results.features.voting) results.features.voting = '❌ Voting failed';
    if (!results.features.comments) results.features.comments = '❌ Comments failed';
  }
  
  // Test Socket.IO Health
  console.log('\n🔌 Testing Socket.IO...');
  try {
    const socketHealth = await axios.get(`${API_URL}/health/socket`);
    results.features.socketio = '✅ Socket.IO health endpoint working';
    results.features.socketMetrics = `  - Active connections: ${socketHealth.data.metrics.socket.activeConnections}`;
  } catch (e) {
    results.features.socketio = '❌ Socket.IO health check failed';
  }
  
  // Print Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 INTEGRATION TEST RESULTS');
  console.log('='.repeat(50));
  
  console.log('\n🔧 Backend Status:');
  console.log(results.backend.health || '❌ Not working');
  if (results.backend.services) {
    console.log(results.backend.services);
  }
  
  console.log('\n💻 Frontend Status:');
  console.log(results.frontend.status || '❌ Not working');
  if (results.frontend.title) {
    console.log(results.frontend.title);
  }
  
  console.log('\n✨ Feature Tests:');
  Object.values(results.features).forEach(result => console.log(result));
  
  // Summary
  const working = Object.values(results.features)
    .filter(r => typeof r === 'string' && r.includes('✅')).length;
  const total = Object.keys(results.features).length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 SUMMARY: ${working}/${total} features working`);
  console.log('='.repeat(50));
  
  if (working === total) {
    console.log('🎉 All integration tests passed! Platform is ready!');
  } else {
    console.log('⚠️  Some features need attention');
  }
}

testIntegration().catch(console.error);