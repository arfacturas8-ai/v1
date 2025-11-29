#!/usr/bin/env node

/**
 * Quick test script to verify the API fixes
 */

const http = require('http');

async function testEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode === expectedStatus
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function testRegistration() {
  const testData = {
    username: 'testuser123',
    displayName: 'Test User',
    email: 'test@example.com',
    password: 'testpassword123'
    // Note: No confirmPassword field
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode < 500 // Should not be a server error
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing API fixes...\n');

  const tests = [
    { name: 'Health Check', test: () => testEndpoint('/health') },
    { name: 'API Documentation Redirect', test: () => testEndpoint('/docs', 302) },
    { name: 'Swagger Documentation', test: () => testEndpoint('/documentation') },
    { name: 'Public Communities', test: () => testEndpoint('/api/v1/communities/public') },
    { name: 'Trending Posts', test: () => testEndpoint('/api/v1/posts/trending') },
    { name: 'Registration without confirmPassword', test: testRegistration }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`🔄 Testing: ${test.name}...`);
      const result = await test.test();
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test.name}: Status ${result.status}`);
      
      if (!result.success && result.data) {
        try {
          const parsed = JSON.parse(result.data);
          if (parsed.error) {
            console.log(`   Error: ${parsed.error}`);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      results.push({ name: test.name, success: result.success, status: result.status });
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results.push({ name: test.name, success: false, error: error.message });
    }
    console.log('');
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log('📊 Test Summary:');
  console.log(`   Successful: ${successful}/${total}`);
  console.log(`   Success Rate: ${Math.round(successful/total * 100)}%`);
  
  if (successful === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the API server.');
    process.exit(1);
  }
}

// Check if API is running first
testEndpoint('/health').then(() => {
  console.log('✅ API server is running on localhost:3002\n');
  runTests();
}).catch(() => {
  console.log('❌ API server is not running on localhost:3002');
  console.log('💡 Please start the API server with: npm start');
  process.exit(1);
});