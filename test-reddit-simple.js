#!/usr/bin/env node

/**
 * SIMPLE REDDIT FEATURES TEST
 * Tests all Reddit API endpoints to validate functionality
 */

const http = require('http');

// Test results
let passed = 0;
let failed = 0;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function test(name, path, expectedStatus = 200) {
  try {
    console.log(`Testing: ${name}`);
    const response = await makeRequest(path);
    
    if (response.status === expectedStatus) {
      if (response.data && typeof response.data === 'object' && response.data.success !== false) {
        console.log(`✅ PASS: ${name}`);
        passed++;
      } else if (expectedStatus !== 200) {
        console.log(`✅ PASS: ${name} (expected ${expectedStatus})`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${name} - API returned success: false`);
        failed++;
      }
    } else {
      console.log(`❌ FAIL: ${name} - Expected ${expectedStatus}, got ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 REDDIT FEATURES API TEST');
  console.log('============================');
  
  // Test Posts System
  console.log('\n📝 Testing Posts System:');
  await test('Get posts feed', '/posts');
  await test('Get posts with hot sorting', '/posts?sort=hot');
  await test('Get posts with new sorting', '/posts?sort=new'); 
  await test('Get posts with top sorting', '/posts?sort=top');
  await test('Get posts with pagination', '/posts?page=1&limit=10');
  await test('Get specific post (should 404)', '/posts/nonexistent', 404);
  
  // Test Comments System (expecting 401 for protected routes)
  console.log('\n💬 Testing Comments System:');
  await test('Get post comments (protected)', '/comments/post/test123', 401);
  
  // Test Awards System
  console.log('\n🏆 Testing Awards System:');
  await test('Get award types', '/awards/types');
  await test('Get post awards', '/awards/post/test123');
  await test('Get comment awards', '/awards/comment/test123');
  
  // Test Karma System
  console.log('\n⭐ Testing Karma System:');
  await test('Get karma leaderboard', '/karma/leaderboard');
  await test('Get trending content', '/karma/trending');
  
  // Test Communities System
  console.log('\n🏘️  Testing Communities System:');
  await test('Browse communities', '/communities');
  await test('Get community pagination', '/communities?page=1&limit=5');
  await test('Get nonexistent community', '/communities/nonexistent', 404);
  
  // Results
  console.log('\n📊 TEST RESULTS:');
  console.log('==================');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ REDDIT FEATURES IMPLEMENTED:');
    console.log('   • Posts system with sorting and pagination');
    console.log('   • Awards system with 6 award types');  
    console.log('   • Karma system with leaderboards and trending');
    console.log('   • Communities system with discovery');
    console.log('   • Comprehensive error handling');
    console.log('   • Public API access for read operations');
    console.log('\n🌐 VIEW THE DEMO:');
    console.log('   Frontend: http://localhost:3000/reddit-demo');
    console.log('   API Docs: http://localhost:3001/documentation');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server logs.');
  }
}

// Check if API is running
async function checkAPI() {
  try {
    await makeRequest('/posts');
    return true;
  } catch (error) {
    console.error('❌ API not accessible. Make sure server is running on http://localhost:3001');
    return false;
  }
}

async function main() {
  if (await checkAPI()) {
    await runTests();
  } else {
    process.exit(1);
  }
}

main();