const axios = require('axios');

const API_BASE = 'http://localhost:3002/api/v1';

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

async function runValidationTests() {
  console.log('🔍 Testing specific validation issues...\n');

  // Create a unique user for testing
  const timestamp = Date.now();
  const uniqueUser = {
    username: `testuser${timestamp}`,
    displayName: 'Validation Test User',
    email: `test${timestamp}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!'
  };

  console.log('=== Creating Test User ===');
  const registerResult = await testEndpoint('POST', '/auth/register', uniqueUser);
  console.log('\n');

  if (!registerResult.success) {
    console.log('❌ Cannot test validation without user registration');
    return;
  }

  // Login to get token
  console.log('=== Logging In Test User ===');
  const loginResult = await testEndpoint('POST', '/auth/login', {
    username: uniqueUser.username,
    password: 'Password123!'
  });

  if (!loginResult.success || !loginResult.data?.data?.tokens?.accessToken) {
    console.log('❌ Cannot test validation without authentication token');
    return;
  }

  const token = loginResult.data.data.tokens.accessToken;
  console.log('🔑 Got auth token:', token.substring(0, 20) + '...');
  console.log('\n');

  // Test validation errors: Community creation with invalid name (too short)
  console.log('=== Testing Community Validation (Name Too Short) ===');
  await testEndpoint('POST', '/communities', {
    name: 'ab', // Too short - should be min 3 characters
    displayName: 'Test Community'
  }, token);
  console.log('\n');

  // Test validation errors: Community creation with invalid name (special chars)
  console.log('=== Testing Community Validation (Invalid Characters) ===');
  await testEndpoint('POST', '/communities', {
    name: 'test-community!', // Contains invalid character !
    displayName: 'Test Community'
  }, token);
  console.log('\n');

  // Test validation errors: Community creation missing required field
  console.log('=== Testing Community Validation (Missing Display Name) ===');
  await testEndpoint('POST', '/communities', {
    name: 'testcommunity'
    // Missing displayName which is required
  }, token);
  console.log('\n');

  // Test valid community creation
  console.log('=== Testing Valid Community Creation ===');
  await testEndpoint('POST', '/communities', {
    name: 'validcommunity' + timestamp,
    displayName: 'Valid Community',
    description: 'A valid community for testing',
    isPublic: true,
    isNsfw: false
  }, token);
  console.log('\n');

  // Test invalid message creation (empty content)
  console.log('=== Testing Message Validation (Empty Content) ===');
  await testEndpoint('POST', '/messages', {
    channelId: 'ckm8xtj3q0002g6o6v2h9z5z2', // Example CUID
    content: '' // Empty content should fail validation
  }, token);
  console.log('\n');

  // Test invalid message creation (invalid channelId)
  console.log('=== Testing Message Validation (Invalid Channel ID) ===');
  await testEndpoint('POST', '/messages', {
    channelId: 'not-a-cuid', // Invalid CUID format
    content: 'Hello world!'
  }, token);
  console.log('\n');

  // Test channel creation with invalid serverId
  console.log('=== Testing Channel Validation (Invalid Server ID) ===');
  await testEndpoint('POST', '/channels', {
    serverId: 'not-a-cuid', // Invalid CUID format
    name: 'general',
    type: 'TEXT'
  }, token);
  console.log('\n');

  // Test channel creation with invalid name
  console.log('=== Testing Channel Validation (Invalid Name) ===');
  await testEndpoint('POST', '/channels', {
    serverId: 'ckm8xtj3q0001g6o6v2h9z5z1', // Valid CUID
    name: 'ch@nnel!', // Invalid characters
    type: 'TEXT'
  }, token);
  console.log('\n');

  console.log('🎯 Validation testing complete!');
}

// Add delay to ensure server is ready
setTimeout(runValidationTests, 1000);