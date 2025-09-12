#!/usr/bin/env node

const axios = require('axios');

// Configure axios to not throw on error status codes
axios.defaults.validateStatus = (status) => status < 600;

const API_BASE_URL = 'http://localhost:3002/api/v1';

async function testRoutes() {
  console.log('🔍 Testing Available Routes...\n');

  // First register and login to get a valid token
  const testUser = {
    email: `route-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    username: `routetest${Date.now()}`,
    displayName: 'Route Test User'
  };

  try {
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    const token = registerResponse.data?.data?.tokens?.accessToken;
    console.log('✅ Got valid token for testing');

    // Test auth/me endpoint
    console.log('\n1. Testing /auth/me...');
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Status: ${meResponse.status}`);
    if (meResponse.status !== 200) {
      console.log(`   Error: ${JSON.stringify(meResponse.data, null, 2)}`);
    }

    // Test servers endpoint
    console.log('\n2. Testing /servers...');
    const serverData = {
      name: 'Test Discord Server',
      description: 'A comprehensive test server'
    };
    const serversResponse = await axios.post(`${API_BASE_URL}/servers`, serverData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Status: ${serversResponse.status}`);
    console.log(`   Data: ${JSON.stringify(serversResponse.data, null, 2)}`);

    // Test communities endpoint
    console.log('\n3. Testing /communities...');
    const communityData = {
      name: 'testcommunity',
      title: 'Test Community',
      description: 'A test community'
    };
    const communitiesResponse = await axios.post(`${API_BASE_URL}/communities`, communityData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   Status: ${communitiesResponse.status}`);
    console.log(`   Data: ${JSON.stringify(communitiesResponse.data, null, 2)}`);

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n🔍 Route testing complete!');
}

testRoutes();