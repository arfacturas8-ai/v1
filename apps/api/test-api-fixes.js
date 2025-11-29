#!/usr/bin/env node

// Test script to validate API fixes
const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testApiEndpoints() {
  console.log('🧪 Testing API endpoints...\n');

  // Test 1: Registration with displayName (should work)
  console.log('1. Testing registration with displayName:');
  try {
    const result = await makeRequest('POST', '/auth/register', {
      username: 'testuser123',
      displayName: 'Test User Display',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    if (result.status === 201 || result.data.success) {
      console.log('   ✅ PASS: Registration with displayName works\n');
    } else {
      console.log('   ❌ FAIL: Registration should succeed\n');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 2: Registration without displayName (should fail)
  console.log('2. Testing registration without displayName:');
  try {
    const result = await makeRequest('POST', '/auth/register', {
      username: 'testuser456',
      email: 'test2@example.com',
      password: 'password123'
    });
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    if (result.status === 400) {
      console.log('   ✅ PASS: Registration correctly rejects missing displayName\n');
    } else {
      console.log('   ❌ FAIL: Should reject missing displayName\n');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 3: Search endpoint
  console.log('3. Testing search endpoint:');
  try {
    const result = await makeRequest('GET', '/search?q=test');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    if (result.status === 200 && result.data.success) {
      console.log('   ✅ PASS: Search endpoint works\n');
    } else if (result.status === 500) {
      console.log('   ❌ FAIL: Search endpoint returns 500 error\n');
    } else {
      console.log('   ⚠️  WARN: Unexpected response\n');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  // Test 4: Health check
  console.log('4. Testing health endpoint:');
  try {
    const result = await makeRequest('GET', '/health');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    if (result.status === 200) {
      console.log('   ✅ PASS: Health endpoint works\n');
    } else {
      console.log('   ❌ FAIL: Health endpoint not working\n');
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}\n`);
  }

  console.log('🏁 Test completed');
}

// Wait a moment for server to be ready
console.log('⏳ Waiting 3 seconds for API server...');
setTimeout(testApiEndpoints, 3000);
