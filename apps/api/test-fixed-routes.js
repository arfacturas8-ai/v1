#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:4000';

async function testRoutes() {
  console.log('🧪 Testing Fixed Route Endpoints');
  console.log('================================\n');

  // Test 1: Health check
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health endpoint:', health.status === 200 ? 'WORKING' : 'FAILED');
  } catch (error) {
    console.log('❌ Health endpoint: FAILED -', error.message);
  }

  // Test 2: Register a test user to get auth token
  let authToken = null;
  try {
    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, {
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      username: `testuser_${Date.now()}`
    });
    console.log('✅ User registration:', registerResponse.status === 201 ? 'WORKING' : 'FAILED');
    
    if (registerResponse.data && registerResponse.data.token) {
      authToken = registerResponse.data.token;
      console.log('✅ Auth token obtained');
    }
  } catch (error) {
    console.log('❌ User registration: FAILED -', error.response?.data?.message || error.message);
  }

  if (!authToken) {
    console.log('❌ Cannot test protected routes without auth token');
    return;
  }

  const headers = { 
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Test 3: Channels endpoint (with serverId query param)
  try {
    const response = await axios.get(`${API_BASE}/api/v1/channels?serverId=test-server-id`, { headers });
    console.log('✅ Channels endpoint:', response.status === 200 ? 'WORKING' : 'FAILED');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Channels endpoint: FAILED -', error.response?.status, error.response?.data?.error || error.message);
  }

  // Test 4: Messages endpoint (with channelId query param)
  try {
    const response = await axios.get(`${API_BASE}/api/v1/messages?channelId=test-channel-id`, { headers });
    console.log('✅ Messages endpoint:', response.status === 200 ? 'WORKING' : 'FAILED');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Messages endpoint: FAILED -', error.response?.status, error.response?.data?.error || error.message);
  }

  // Test 5: Comments endpoint (general list)
  try {
    const response = await axios.get(`${API_BASE}/api/v1/comments`, { headers });
    console.log('✅ Comments endpoint:', response.status === 200 ? 'WORKING' : 'FAILED');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Comments endpoint: FAILED -', error.response?.status, error.response?.data?.error || error.message);
  }

  // Test 6: Uploads endpoint
  try {
    const response = await axios.get(`${API_BASE}/api/v1/uploads`, { headers });
    console.log('✅ Uploads endpoint:', response.status === 200 ? 'WORKING' : 'FAILED');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Uploads endpoint: FAILED -', error.response?.status, error.response?.data?.error || error.message);
  }

  console.log('\n🏁 Testing Complete!');
}

testRoutes().catch(console.error);