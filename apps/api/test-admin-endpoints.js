#!/usr/bin/env node

/**
 * Admin API Endpoints Test Script
 * 
 * This script tests all admin endpoints with real PostgreSQL data
 * to ensure they work correctly and return actual database results.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';

// Test configuration
const config = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

let authToken = null;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}${details ? ': ' + details : ''}`);
  }
  testResults.details.push({ name, passed, details });
}

async function makeRequest(method, url, data = null, token = null) {
  try {
    const headers = { ...config.headers };
    if (token || authToken) {
      headers.Authorization = `Bearer ${token || authToken}`;
    }

    const response = await axios({
      method,
      url: `${config.baseURL}${url}`,
      data,
      headers,
      timeout: config.timeout,
      validateStatus: () => true // Don't throw on non-2xx status codes
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: error.response?.status || 0,
      data: error.response?.data || { error: error.message },
      headers: error.response?.headers || {}
    };
  }
}

async function createTestUser() {
  console.log('\n🔧 Creating test admin user...');
  
  // First try to register a test user
  const registerData = {
    username: 'testadmin',
    email: 'testadmin@cryb.ai',
    password: 'TestAdmin123!',
    confirmPassword: 'TestAdmin123!',
    displayName: 'Test Admin User'
  };

  const registerResponse = await makeRequest('POST', '/api/v1/auth/register', registerData);
  
  if (registerResponse.status === 201 || registerResponse.status === 409) {
    // Now login
    const loginData = {
      email: 'testadmin@cryb.ai',
      password: 'TestAdmin123!'
    };

    const loginResponse = await makeRequest('POST', '/api/v1/auth/login', loginData);
    
    if (loginResponse.status === 200 && loginResponse.data.data?.tokens?.accessToken) {
      authToken = loginResponse.data.data.tokens.accessToken;
      console.log('✅ Test admin user authenticated successfully');
      return true;
    } else {
      console.log('❌ Failed to authenticate test admin user:', loginResponse.data);
      return false;
    }
  } else {
    console.log('❌ Failed to create test admin user:', registerResponse.data);
    return false;
  }
}

async function testAdminDashboard() {
  console.log('\n📊 Testing Admin Dashboard...');
  
  const response = await makeRequest('GET', '/api/v1/admin');
  logTest('Admin Dashboard Access', 
    response.status === 200 && response.data.success,
    response.status !== 200 ? `Status: ${response.status}` : ''
  );

  if (response.status === 200) {
    const hasRequiredFields = response.data.data?.message && 
                             response.data.data?.endpoints;
    logTest('Admin Dashboard Data Structure', hasRequiredFields);
  }
}

async function testUserManagement() {
  console.log('\n👥 Testing User Management...');

  // Test user list
  const listResponse = await makeRequest('GET', '/api/v1/admin/users?limit=5');
  logTest('List Users', 
    listResponse.status === 200 && Array.isArray(listResponse.data.data?.users),
    listResponse.status !== 200 ? `Status: ${listResponse.status}` : ''
  );

  // Test user stats
  const statsResponse = await makeRequest('GET', '/api/v1/admin/users/stats');
  logTest('User Statistics', 
    statsResponse.status === 200 && statsResponse.data.data?.stats,
    statsResponse.status !== 200 ? `Status: ${statsResponse.status}` : ''
  );

  if (statsResponse.status === 200) {
    const stats = statsResponse.data.data.stats;
    console.log(`   📈 Total Users: ${stats.totalUsers || 0}`);
    console.log(`   ✅ Verified Users: ${stats.verifiedUsers || 0}`);
    console.log(`   🚫 Banned Users: ${stats.bannedUsers || 0}`);
  }

  // Test user search
  const searchResponse = await makeRequest('GET', '/api/v1/admin/users?search=test&limit=3');
  logTest('User Search', 
    searchResponse.status === 200 && Array.isArray(searchResponse.data.data?.users)
  );

  // If we have users, test getting user details
  if (listResponse.status === 200 && listResponse.data.data?.users?.length > 0) {
    const firstUser = listResponse.data.data.users[0];
    const userDetailResponse = await makeRequest('GET', `/api/v1/admin/users/${firstUser.id}`);
    logTest('Get User Details', 
      userDetailResponse.status === 200 && userDetailResponse.data.data?.user
    );
  }
}

async function testModeration() {
  console.log('\n🛡️ Testing Content Moderation...');

  // Test reports list
  const reportsResponse = await makeRequest('GET', '/api/v1/admin/moderation/reports?limit=5');
  logTest('List Reports', 
    reportsResponse.status === 200 && Array.isArray(reportsResponse.data.data?.reports),
    reportsResponse.status !== 200 ? `Status: ${reportsResponse.status}` : ''
  );

  // Test flagged posts
  const postsResponse = await makeRequest('GET', '/api/v1/admin/moderation/posts?limit=5');
  logTest('List Flagged Posts', 
    postsResponse.status === 200 && Array.isArray(postsResponse.data.data?.posts),
    postsResponse.status !== 200 ? `Status: ${postsResponse.status}` : ''
  );

  // Test flagged comments
  const commentsResponse = await makeRequest('GET', '/api/v1/admin/moderation/comments?limit=5');
  logTest('List Flagged Comments', 
    commentsResponse.status === 200 && Array.isArray(commentsResponse.data.data?.comments),
    commentsResponse.status !== 200 ? `Status: ${commentsResponse.status}` : ''
  );

  // Test moderation stats
  const moderationStatsResponse = await makeRequest('GET', '/api/v1/admin/moderation/stats');
  logTest('Moderation Statistics', 
    moderationStatsResponse.status === 200 && moderationStatsResponse.data.data?.stats,
    moderationStatsResponse.status !== 200 ? `Status: ${moderationStatsResponse.status}` : ''
  );

  if (moderationStatsResponse.status === 200) {
    const stats = moderationStatsResponse.data.data.stats;
    console.log(`   📊 Pending Reports: ${stats.pendingReports || 0}`);
    console.log(`   📋 Total Reports: ${stats.totalReports || 0}`);
    console.log(`   🚩 Flagged Posts: ${stats.flaggedPosts || 0}`);
  }
}

async function testAnalytics() {
  console.log('\n📈 Testing Analytics...');

  // Test overview analytics
  const overviewResponse = await makeRequest('GET', '/api/v1/admin/analytics/overview');
  logTest('Analytics Overview', 
    overviewResponse.status === 200 && overviewResponse.data.data?.overview,
    overviewResponse.status !== 200 ? `Status: ${overviewResponse.status}` : ''
  );

  if (overviewResponse.status === 200) {
    const overview = overviewResponse.data.data.overview;
    console.log(`   👥 Total Users: ${overview.users?.total || 0}`);
    console.log(`   📝 Total Posts: ${overview.content?.posts?.total || 0}`);
    console.log(`   💬 Total Comments: ${overview.content?.comments?.total || 0}`);
  }

  // Test user analytics
  const userAnalyticsResponse = await makeRequest('GET', '/api/v1/admin/analytics/users?timeframe=7d');
  logTest('User Analytics', 
    userAnalyticsResponse.status === 200 && userAnalyticsResponse.data.data
  );

  // Test content analytics
  const contentAnalyticsResponse = await makeRequest('GET', '/api/v1/admin/analytics/content?timeframe=7d');
  logTest('Content Analytics', 
    contentAnalyticsResponse.status === 200 && contentAnalyticsResponse.data.data
  );

  // Test engagement analytics
  const engagementResponse = await makeRequest('GET', '/api/v1/admin/analytics/engagement?timeframe=7d');
  logTest('Engagement Analytics', 
    engagementResponse.status === 200 && engagementResponse.data.data
  );

  // Test real-time analytics
  const realTimeResponse = await makeRequest('GET', '/api/v1/admin/analytics/real-time');
  logTest('Real-time Analytics', 
    realTimeResponse.status === 200 && realTimeResponse.data.data?.realTime
  );
}

async function testPermissions() {
  console.log('\n🔒 Testing Admin Permissions...');

  // Test without token (should fail)
  const noTokenResponse = await makeRequest('GET', '/api/v1/admin', null, '');
  logTest('Reject Unauthenticated Access', 
    noTokenResponse.status === 401,
    `Expected 401, got ${noTokenResponse.status}`
  );

  // Test with invalid token (should fail)
  const invalidTokenResponse = await makeRequest('GET', '/api/v1/admin', null, 'invalid-token');
  logTest('Reject Invalid Token', 
    invalidTokenResponse.status === 401,
    `Expected 401, got ${invalidTokenResponse.status}`
  );
}

async function testDatabaseConnectivity() {
  console.log('\n🗄️ Testing Database Connectivity...');

  // Test health endpoint to verify database connection
  const healthResponse = await makeRequest('GET', '/health');
  logTest('API Health Check', 
    healthResponse.status === 200 || healthResponse.status === 503,
    healthResponse.status === 0 ? 'Connection failed' : ''
  );

  if (healthResponse.status === 200 || healthResponse.status === 503) {
    const checks = healthResponse.data.checks;
    logTest('Database Connection', 
      checks?.database === 'healthy',
      `Database status: ${checks?.database || 'unknown'}`
    );
  }
}

async function runTests() {
  console.log('🚀 Starting Admin API Endpoint Tests');
  console.log('=====================================');

  try {
    // Test basic connectivity first
    await testDatabaseConnectivity();

    // Create test admin user and authenticate
    const authSuccess = await createTestUser();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed. Cannot proceed with admin tests.');
      return;
    }

    // Test permissions
    await testPermissions();

    // Test admin endpoints
    await testAdminDashboard();
    await testUserManagement();
    await testModeration();
    await testAnalytics();

  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Print final results
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total:  ${testResults.total}`);
  console.log(`📈 Success Rate: ${testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}${test.details ? ': ' + test.details : ''}`);
      });
  }

  console.log('\n✨ Admin API testing completed!');
  
  // Exit with proper code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️ Test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});