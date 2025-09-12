#!/usr/bin/env node

const axios = require('axios');

// Configure axios to not throw on error status codes
axios.defaults.validateStatus = (status) => status < 600;

const API_BASE_URL = 'http://localhost:3002/api/v1';

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow...\n');

  // Step 1: Register a user
  console.log('1. Testing User Registration...');
  const testUser = {
    email: `auth-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
    username: `authtest${Date.now()}`,
    displayName: 'Auth Test User'
  };

  try {
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log(`   Registration Status: ${registerResponse.status}`);
    console.log(`   Registration Data: ${JSON.stringify(registerResponse.data, null, 2)}`);
    
    if (registerResponse.status !== 201) {
      console.log('❌ Registration failed');
      return;
    }

    console.log('✅ Registration successful');
    
    // Extract token
    const token = registerResponse.data?.data?.tokens?.accessToken || registerResponse.data?.token;
    console.log(`   Token extracted: ${token ? 'Yes' : 'No'}`);

    // Step 2: Test login
    console.log('\n2. Testing User Login...');
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log(`   Login Status: ${loginResponse.status}`);
    console.log(`   Login Data: ${JSON.stringify(loginResponse.data, null, 2)}`);

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed');
      return;
    }

    console.log('✅ Login successful');

    const loginToken = loginResponse.data?.data?.tokens?.accessToken || loginResponse.data?.token;
    console.log(`   Login token extracted: ${loginToken ? 'Yes' : 'No'}`);

    // Step 3: Test protected route
    console.log('\n3. Testing Protected Route Access...');
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${loginToken || token}` }
    });

    console.log(`   /auth/me Status: ${meResponse.status}`);
    console.log(`   /auth/me Data: ${JSON.stringify(meResponse.data, null, 2)}`);

    if (meResponse.status === 200) {
      console.log('✅ Protected route access successful');
    } else {
      console.log('❌ Protected route access failed');
    }

    // Step 4: Test invalid token
    console.log('\n4. Testing Invalid Token Rejection...');
    const invalidResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });

    console.log(`   Invalid token Status: ${invalidResponse.status}`);
    if (invalidResponse.status === 401) {
      console.log('✅ Invalid token properly rejected');
    } else {
      console.log('❌ Invalid token not properly rejected');
    }

  } catch (error) {
    console.log(`❌ Error during auth flow: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('\n🔐 Authentication flow test complete!');
}

testAuthFlow();