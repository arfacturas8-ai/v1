#!/usr/bin/env node

const { build } = require('./apps/api/src/app');
const { prisma } = require('./packages/database');

async function testRedditFunctionality() {
  console.log('🚀 Starting Reddit Features Test Suite');
  console.log('=====================================');

  const app = build({ logger: { level: 'error' } });
  await app.ready();

  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Helper function to make authenticated requests
  let testToken = null;
  let testUserId = null;
  let testCommunityId = null;
  let testPostId = null;
  let testCommentId = null;

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
      testResults.errors.push({ test: name, error: error.message });
    }
  }

  // Test 1: Create test user and authenticate
  await test('User Authentication', async () => {
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: `testuser${Date.now()}`
      }
    });

    if (userRes.statusCode !== 201) {
      throw new Error(`Registration failed: ${userRes.body}`);
    }

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: JSON.parse(userRes.body).data.user.email,
        password: 'TestPassword123!'
      }
    });

    if (loginRes.statusCode !== 200) {
      throw new Error(`Login failed: ${loginRes.body}`);
    }

    const loginData = JSON.parse(loginRes.body);
    testToken = loginData.data.token;
    testUserId = loginData.data.user.id;
  });

  // Test 2: Create Community
  await test('Create Community', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/communities',
      headers: { authorization: `Bearer ${testToken}` },
      payload: {
        name: `testcommunity${Date.now()}`,
        displayName: 'Test Community',
        description: 'A test community',
        isPublic: true
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Community creation failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !data.data || !data.data.id) {
      throw new Error(`Invalid community response: ${res.body}`);
    }

    testCommunityId = data.data.id;
  });

  // Test 3: List Communities
  await test('List Communities', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/communities'
    });

    if (res.statusCode !== 200) {
      throw new Error(`List communities failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !Array.isArray(data.data.items)) {
      throw new Error(`Invalid communities response: ${res.body}`);
    }
  });

  // Test 4: Create Post
  await test('Create Post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/posts',
      headers: { authorization: `Bearer ${testToken}` },
      payload: {
        communityId: testCommunityId,
        title: 'Test Post',
        content: 'This is a test post content'
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Post creation failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !data.data || !data.data.id) {
      throw new Error(`Invalid post response: ${res.body}`);
    }

    testPostId = data.data.id;
  });

  // Test 5: List Posts
  await test('List Posts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/posts'
    });

    if (res.statusCode !== 200) {
      throw new Error(`List posts failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !Array.isArray(data.data.items)) {
      throw new Error(`Invalid posts response: ${res.body}`);
    }
  });

  // Test 6: Vote on Post
  await test('Vote on Post', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/posts/${testPostId}/vote`,
      headers: { authorization: `Bearer ${testToken}` },
      payload: { value: 1 }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Post voting failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success) {
      throw new Error(`Invalid voting response: ${res.body}`);
    }
  });

  // Test 7: Create Comment
  await test('Create Comment', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/comments',
      headers: { authorization: `Bearer ${testToken}` },
      payload: {
        postId: testPostId,
        content: 'This is a test comment'
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Comment creation failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !data.data || !data.data.id) {
      throw new Error(`Invalid comment response: ${res.body}`);
    }

    testCommentId = data.data.id;
  });

  // Test 8: List Comments
  await test('List Comments for Post', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/comments/post/${testPostId}`
    });

    if (res.statusCode !== 200) {
      throw new Error(`List comments failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(`Invalid comments response: ${res.body}`);
    }
  });

  // Test 9: Vote on Comment
  await test('Vote on Comment', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/comments/${testCommentId}/vote`,
      headers: { authorization: `Bearer ${testToken}` },
      payload: { value: 1 }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Comment voting failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success) {
      throw new Error(`Invalid comment voting response: ${res.body}`);
    }
  });

  // Test 10: Get User Karma
  await test('Get User Karma', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/karma/user/${testUserId}`
    });

    if (res.statusCode !== 200) {
      throw new Error(`Get karma failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !data.data || typeof data.data.karma !== 'object') {
      throw new Error(`Invalid karma response: ${res.body}`);
    }
  });

  // Test 11: Get Award Types
  await test('Get Award Types', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/awards/types'
    });

    if (res.statusCode !== 200) {
      throw new Error(`Get awards failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(`Invalid awards response: ${res.body}`);
    }
  });

  // Test 12: Give Award to Post
  await test('Give Award to Post', async () => {
    // First create another user to give award to avoid self-awarding
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: `awardgiver-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: `awardgiver${Date.now()}`
      }
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: JSON.parse(userRes.body).data.user.email,
        password: 'TestPassword123!'
      }
    });

    const awardGiverToken = JSON.parse(loginRes.body).data.token;

    const res = await app.inject({
      method: 'POST',
      url: `/api/awards/post/${testPostId}`,
      headers: { authorization: `Bearer ${awardGiverToken}` },
      payload: {
        awardType: 'silver',
        message: 'Great post!'
      }
    });

    if (res.statusCode !== 200) {
      throw new Error(`Give award failed: ${res.statusCode} - ${res.body}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success) {
      throw new Error(`Invalid award giving response: ${res.body}`);
    }
  });

  await app.close();

  console.log('\n🏁 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  return testResults.passed === (testResults.passed + testResults.failed);
}

testRedditFunctionality().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});