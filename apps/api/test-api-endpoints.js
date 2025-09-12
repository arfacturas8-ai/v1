const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testEndpoint(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...(data && { data })
    };

    console.log(`🔄 Testing ${method.toUpperCase()} ${url}`);
    console.log('📤 Request data:', JSON.stringify(data, null, 2));

    const response = await axios(config);
    console.log('✅ Success:', response.status, response.data);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.status, error.response.data);
      return { success: false, error: error.response.data, status: error.response.status };
    } else {
      console.log('❌ Network Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

async function runTests() {
  console.log('🚀 Testing API endpoints with validation...\n');

  // Test 1: Health check (should work)
  console.log('=== Health Check ===');
  await testEndpoint('GET', '/../../health');
  console.log('\n');

  // Test 2: Create user (public endpoint)
  console.log('=== User Registration ===');
  const registerResult = await testEndpoint('POST', '/auth/register', {
    username: 'testuser123',
    displayName: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  });
  console.log('\n');

  // Test 3: Login user
  console.log('=== User Login ===');
  const loginResult = await testEndpoint('POST', '/auth/login', {
    username: 'testuser123',
    password: 'password123'
  });
  
  let token = null;
  if (loginResult.success && loginResult.data?.data?.token) {
    token = loginResult.data.data.token;
    console.log('🔑 Got auth token:', token.substring(0, 20) + '...');
  }
  console.log('\n');

  // Test 4: Create community (public endpoint but with validation)
  console.log('=== Community Creation ===');
  await testEndpoint('POST', '/communities', {
    name: 'testcommunity',
    displayName: 'Test Community',
    description: 'A test community for validation testing',
    isPublic: true,
    isNsfw: false
  }, token);
  console.log('\n');

  // Test 5: Create community with invalid data
  console.log('=== Community Creation (Invalid Data) ===');
  await testEndpoint('POST', '/communities', {
    name: 'ab', // Too short
    displayName: 'Test Community'
  }, token);
  console.log('\n');

  // Test 6: Create channel (requires auth)
  console.log('=== Channel Creation ===');
  if (token) {
    await testEndpoint('POST', '/channels', {
      serverId: 'ckm8xtj3q0001g6o6v2h9z5z1', // Example CUID
      name: 'general',
      description: 'General discussion',
      type: 'TEXT'
    }, token);
  } else {
    console.log('⏭️ Skipping channel creation - no auth token');
  }
  console.log('\n');

  // Test 7: Create message (requires auth)
  console.log('=== Message Creation ===');
  if (token) {
    await testEndpoint('POST', '/messages', {
      channelId: 'ckm8xtj3q0002g6o6v2h9z5z2', // Example CUID
      content: 'Hello world! This is a test message.'
    }, token);
  } else {
    console.log('⏭️ Skipping message creation - no auth token');
  }
  console.log('\n');

  // Test 8: Invalid request (missing required field)
  console.log('=== Message Creation (Invalid Data) ===');
  if (token) {
    await testEndpoint('POST', '/messages', {
      channelId: 'ckm8xtj3q0002g6o6v2h9z5z2',
      content: '' // Empty content
    }, token);
  } else {
    console.log('⏭️ Skipping invalid message test - no auth token');
  }

  console.log('\n🎯 API endpoint testing complete!');
}

// Add a small delay to ensure server is ready
setTimeout(runTests, 1000);