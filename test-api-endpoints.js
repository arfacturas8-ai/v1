#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

async function startServerAndTest() {
  console.log('🚀 Starting API Server and Testing Reddit Endpoints');
  console.log('==================================================');

  // Start the API server
  const serverProcess = spawn('npm', ['run', 'dev:api'], {
    cwd: '/home/ubuntu/cryb-platform',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  let serverReady = false;
  let testResults = { passed: 0, failed: 0 };

  // Wait for server to start
  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output.trim());
      if (output.includes('Server listening') || output.includes('listening on')) {
        serverReady = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    // Fallback timeout
    setTimeout(() => {
      if (!serverReady) {
        console.log('⏰ Server startup timeout, proceeding with tests...');
        serverReady = true;
        resolve();
      }
    }, 15000);
  });

  // Give server additional time to fully initialize
  await new Promise(resolve => setTimeout(resolve, 3000));

  const baseUrl = 'http://localhost:3001';
  let authToken = null;
  let testUserId = null;
  let testCommunityId = null;
  let testPostId = null;

  async function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/api${path}`,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({
              statusCode: res.statusCode,
              body: parsed,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              body: responseData,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          statusCode: 500,
          body: { error: error.message },
          headers: {}
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async function test(name, testFn) {
    try {
      console.log(`\n📝 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
      testResults.failed++;
    }
  }

  try {
    // Test 1: Health Check
    await test('Health Check', async () => {
      const response = await makeRequest('GET', '/health');
      if (response.statusCode !== 200) {
        throw new Error(`Health check failed: ${response.statusCode}`);
      }
    });

    // Test 2: User Registration and Login
    await test('User Registration and Login', async () => {
      // Register
      const registerResponse = await makeRequest('POST', '/auth/register', {
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        password: 'TestPassword123!'
      });

      if (registerResponse.statusCode !== 201 && registerResponse.statusCode !== 200) {
        throw new Error(`Registration failed: ${registerResponse.statusCode} - ${JSON.stringify(registerResponse.body)}`);
      }

      const userData = registerResponse.body.data || registerResponse.body;
      testUserId = userData.user?.id || userData.id;

      // Login
      const loginResponse = await makeRequest('POST', '/auth/login', {
        email: userData.user?.email || userData.email,
        password: 'TestPassword123!'
      });

      if (loginResponse.statusCode !== 200) {
        throw new Error(`Login failed: ${loginResponse.statusCode} - ${JSON.stringify(loginResponse.body)}`);
      }

      authToken = loginResponse.body.data?.token || loginResponse.body.token;
      if (!authToken) {
        throw new Error('No auth token received');
      }
    });

    // Test 3: Get Award Types
    await test('Get Award Types', async () => {
      const response = await makeRequest('GET', '/awards/types');
      if (response.statusCode !== 200) {
        throw new Error(`Get award types failed: ${response.statusCode}`);
      }
      if (!response.body.success || !Array.isArray(response.body.data)) {
        throw new Error('Invalid award types response');
      }
    });

    // Test 4: Create Community
    await test('Create Community', async () => {
      const response = await makeRequest('POST', '/communities', {
        name: `testcommunity${Date.now()}`,
        displayName: 'Test Community',
        description: 'A test community for validation',
        isPublic: true
      }, { authorization: `Bearer ${authToken}` });

      if (response.statusCode !== 200) {
        throw new Error(`Community creation failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      }

      testCommunityId = response.body.data?.id || response.body.id;
      if (!testCommunityId) {
        throw new Error('No community ID received');
      }
    });

    // Test 5: List Communities
    await test('List Communities', async () => {
      const response = await makeRequest('GET', '/communities');
      if (response.statusCode !== 200) {
        throw new Error(`List communities failed: ${response.statusCode}`);
      }
      if (!response.body.success || !Array.isArray(response.body.data.items)) {
        throw new Error('Invalid communities response');
      }
    });

    // Test 6: Create Post
    await test('Create Post', async () => {
      const response = await makeRequest('POST', '/posts', {
        communityId: testCommunityId,
        title: 'Test Post',
        content: 'This is a test post for validation'
      }, { authorization: `Bearer ${authToken}` });

      if (response.statusCode !== 200) {
        throw new Error(`Post creation failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      }

      testPostId = response.body.data?.id || response.body.id;
      if (!testPostId) {
        throw new Error('No post ID received');
      }
    });

    // Test 7: Vote on Post
    await test('Vote on Post', async () => {
      const response = await makeRequest('POST', `/posts/${testPostId}/vote`, {
        value: 1
      }, { authorization: `Bearer ${authToken}` });

      if (response.statusCode !== 200) {
        throw new Error(`Post voting failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      }
    });

    // Test 8: Create Comment
    await test('Create Comment', async () => {
      const response = await makeRequest('POST', '/comments', {
        postId: testPostId,
        content: 'This is a test comment'
      }, { authorization: `Bearer ${authToken}` });

      if (response.statusCode !== 200) {
        throw new Error(`Comment creation failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      }
    });

    // Test 9: Get User Karma
    await test('Get User Karma', async () => {
      if (testUserId) {
        const response = await makeRequest('GET', `/karma/user/${testUserId}`);
        if (response.statusCode !== 200) {
          throw new Error(`Get karma failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
        }
      }
    });

    console.log('\n🏁 Test Results');
    console.log('================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    // Kill the server
    console.log('\n🛑 Stopping server...');
    serverProcess.kill('SIGTERM');
    
    // Give it time to shut down gracefully
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
  }

  return testResults.failed === 0;
}

startServerAndTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});