#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001';

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  if (passed) {
    log(`✅ ${name}`, 'green');
  } else {
    log(`❌ ${name}`, 'red');
    if (details) {
      log(`   ${details}`, 'yellow');
    }
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    log(`🔗 Making request to: ${url}`, 'cyan');
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    log(`📄 Response status: ${response.status}`, response.status >= 400 ? 'red' : 'green');
    log(`📄 Response body: ${JSON.stringify(data, null, 2)}`, 'cyan');
    
    return { response, data, status: response.status };
  } catch (error) {
    log(`💥 Request error: ${error.message}`, 'red');
    return { error: error.message, status: 0 };
  }
}

// Valid JWT token for testing
const validJWT = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItc29ja2V0LWF1dGgtMTIzIiwic2Vzc2lvbklkIjoiY2MyY2ZhYzItMThmMC00NjIzLWI2OWUtNjk2YzcwMmE0MTNmIiwiZW1haWwiOiJzb2NrZXR0ZXN0QGNyeWIuYWkiLCJ3YWxsZXRBZGRyZXNzIjpudWxsLCJpc1ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NTc1OTUxMjAsImV4cCI6MTc1NzU5NjAyMCwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.MGHXnu9w0O61zfyz-8Py0AeuR4pegf3kRsIuCFNyHm8';

async function testCommunityCreation() {
  log('🚀 Testing Community Creation Endpoint', 'bold');
  log('=' .repeat(60), 'cyan');
  
  // Test 1: Community creation with valid data (but without auth - should fail)
  log('\n🔒 Test 1: Community creation without authentication...', 'blue');
  const noAuthResult = await makeRequest('/api/v1/communities', {
    method: 'POST',
    body: JSON.stringify({
      name: 'testcommunity',
      displayName: 'Test Community',
      description: 'A test community for debugging',
      isPublic: true,
      isNsfw: false
    })
  });
  
  logTest('Creation without auth (should fail with 401)', noAuthResult.status === 401);
  
  // Test 2: Community creation with mock auth
  log('\n🔑 Test 2: Community creation with authentication...', 'blue');
  const withAuthResult = await makeRequest('/api/v1/communities', {
    method: 'POST',
    headers: {
      'Authorization': validJWT
    },
    body: JSON.stringify({
      name: 'testcommunity123',
      displayName: 'Test Community 123',
      description: 'A test community for debugging',
      isPublic: true,
      isNsfw: false
    })
  });
  
  logTest('Creation with auth', withAuthResult.status === 200 || withAuthResult.status === 201);
  
  // Test 3: Test with invalid data to trigger validation
  log('\n❌ Test 3: Community creation with invalid data...', 'blue');
  const invalidDataResult = await makeRequest('/api/v1/communities', {
    method: 'POST',
    headers: {
      'Authorization': validJWT
    },
    body: JSON.stringify({
      name: 'a', // Too short
      displayName: '', // Empty
      description: 'A' .repeat(2000), // Too long
    })
  });
  
  logTest('Creation with invalid data (should fail)', invalidDataResult.status >= 400);
  
  // Test 4: Test with missing required fields
  log('\n📋 Test 4: Community creation with missing fields...', 'blue');
  const missingFieldsResult = await makeRequest('/api/v1/communities', {
    method: 'POST',
    headers: {
      'Authorization': validJWT
    },
    body: JSON.stringify({
      // Missing name and displayName
      description: 'Missing required fields'
    })
  });
  
  logTest('Creation with missing fields (should fail)', missingFieldsResult.status >= 400);
  
  // Test 5: Check if communities are actually created by listing them
  log('\n📋 Test 5: Listing communities...', 'blue');
  const listResult = await makeRequest('/api/v1/communities');
  logTest('List communities', listResult.status === 200);
  
  if (listResult.data && listResult.data.data && listResult.data.data.items) {
    log(`   Found ${listResult.data.data.items.length} communities`, 'cyan');
    listResult.data.data.items.forEach(community => {
      log(`   - ${community.name} (${community.displayName})`, 'yellow');
    });
  }
  
  log('\n' + '=' .repeat(60), 'cyan');
  log('🏁 Community Creation Test Complete!', 'bold');
}

// Run the tests
if (require.main === module) {
  testCommunityCreation().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}