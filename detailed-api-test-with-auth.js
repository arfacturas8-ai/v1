#!/usr/bin/env node

/**
 * DETAILED CRYB API TEST WITH PROPER AUTHENTICATION
 * 
 * This script creates a proper auth flow and tests endpoints systematically
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3002';

class DetailedAPITester {
  constructor() {
    this.authToken = null;
    this.testUserId = null;
    this.testUser = null;
    this.results = {
      timestamp: new Date().toISOString(),
      authFlow: {},
      endpointTests: {},
      workingEndpoints: [],
      failedEndpoints: [],
      summary: {}
    };
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        method,
        url,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();

      return {
        success: true,
        status: response.status,
        data: response.data,
        responseTime: endTime - startTime,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        error: error.message,
        data: error.response?.data || null,
        responseTime: 0
      };
    }
  }

  async testAuthenticationFlow() {
    console.log('\n=== TESTING AUTHENTICATION FLOW ===');
    
    // Test registration with proper schema
    const timestamp = Date.now();
    const registrationData = {
      username: `testuser_${timestamp}`,
      displayName: `Test User ${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    console.log('Testing user registration...');
    const registerResult = await this.makeRequest('POST', '/api/v1/auth/register', registrationData);
    this.results.authFlow.registration = registerResult;

    if (registerResult.success) {
      console.log('✅ Registration successful');
      this.testUser = registerResult.data?.data?.user;
      this.testUserId = this.testUser?.id;
      this.authToken = registerResult.data?.data?.tokens?.accessToken;
      
      console.log('User created:', this.testUser);
      console.log('Auth token received:', this.authToken ? 'Yes' : 'No');
    } else {
      console.log('❌ Registration failed:', registerResult.error);
      console.log('Registration error details:', registerResult.data);
      
      // Try login with existing user if registration failed
      console.log('\nTrying login with existing test user...');
      const loginResult = await this.makeRequest('POST', '/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      this.results.authFlow.login = loginResult;
      
      if (loginResult.success) {
        console.log('✅ Login successful with existing user');
        this.testUser = loginResult.data?.data?.user;
        this.testUserId = this.testUser?.id;
        this.authToken = loginResult.data?.data?.tokens?.accessToken;
      } else {
        console.log('❌ Login also failed:', loginResult.error);
      }
    }
    
    // Test token verification if we have a token
    if (this.authToken) {
      console.log('\nTesting token verification...');
      const verifyResult = await this.makeRequest('GET', '/api/v1/auth/verify', null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      this.results.authFlow.tokenVerification = verifyResult;
      
      if (verifyResult.success) {
        console.log('✅ Token verification successful');
      } else {
        console.log('❌ Token verification failed:', verifyResult.error);
      }
    }
  }

  async testProtectedEndpoint(name, method, endpoint, data = null) {
    console.log(`Testing ${name}: ${method} ${endpoint}`);
    
    const headers = {};
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const result = await this.makeRequest(method, endpoint, data, headers);
    this.results.endpointTests[name] = result;

    if (result.success) {
      console.log(`✅ ${name} - Success (${result.status})`);
      this.results.workingEndpoints.push({ name, method, endpoint, status: result.status });
    } else {
      console.log(`❌ ${name} - Failed (${result.status}) - ${result.error}`);
      this.results.failedEndpoints.push({ name, method, endpoint, status: result.status, error: result.error });
    }

    return result;
  }

  async testPublicEndpoint(name, method, endpoint, data = null) {
    console.log(`Testing ${name}: ${method} ${endpoint}`);
    
    const result = await this.makeRequest(method, endpoint, data);
    this.results.endpointTests[name] = result;

    if (result.success) {
      console.log(`✅ ${name} - Success (${result.status})`);
      this.results.workingEndpoints.push({ name, method, endpoint, status: result.status });
    } else {
      console.log(`❌ ${name} - Failed (${result.status}) - ${result.error}`);
      this.results.failedEndpoints.push({ name, method, endpoint, status: result.status, error: result.error });
    }

    return result;
  }

  async testCoreWorkflows() {
    console.log('\n=== TESTING CORE WORKFLOWS ===');

    // Test all documented endpoints systematically
    
    // Public endpoints
    await this.testPublicEndpoint('Health Check', 'GET', '/health');
    await this.testPublicEndpoint('API Documentation', 'GET', '/documentation');
    await this.testPublicEndpoint('API Metrics', 'GET', '/metrics');
    
    // Communities (public read, auth required for write)
    await this.testPublicEndpoint('List Communities', 'GET', '/api/v1/communities');
    
    // Posts (public read, auth required for write)
    await this.testPublicEndpoint('List Posts', 'GET', '/api/v1/posts');
    
    // Search (public)
    await this.testPublicEndpoint('Global Search', 'GET', '/api/v1/search?q=test');
    
    // User endpoints (require auth)
    if (this.authToken) {
      await this.testProtectedEndpoint('Get Current User', 'GET', '/api/v1/users/me');
      await this.testProtectedEndpoint('Update User Profile', 'PATCH', '/api/v1/users/me', {
        displayName: 'Updated Test User'
      });
      
      // Test community creation
      const createCommunityResult = await this.testProtectedEndpoint('Create Community', 'POST', '/api/v1/communities', {
        name: `testcommunity_${Date.now()}`,
        displayName: 'Test Community for API Testing',
        description: 'A test community created during API testing'
      });
      
      let testCommunityId = null;
      if (createCommunityResult.success) {
        testCommunityId = createCommunityResult.data?.data?.id;
        console.log('Created test community with ID:', testCommunityId);
        
        // Test community operations
        await this.testPublicEndpoint('Get Community', 'GET', `/api/v1/communities/${testCommunityId}`);
        await this.testProtectedEndpoint('Join Community', 'POST', `/api/v1/communities/${testCommunityId}/join`);
        await this.testPublicEndpoint('Get Community Members', 'GET', `/api/v1/communities/${testCommunityId}/members`);
        
        // Test post creation in community
        const createPostResult = await this.testProtectedEndpoint('Create Post', 'POST', '/api/v1/posts', {
          title: 'Test Post from API Testing',
          content: 'This is a test post created during comprehensive API testing',
          communityId: testCommunityId,
          type: 'text'
        });
        
        let testPostId = null;
        if (createPostResult.success) {
          testPostId = createPostResult.data?.data?.id;
          console.log('Created test post with ID:', testPostId);
          
          // Test post operations
          await this.testPublicEndpoint('Get Post', 'GET', `/api/v1/posts/${testPostId}`);
          await this.testProtectedEndpoint('Vote on Post', 'POST', `/api/v1/posts/${testPostId}/vote`, { type: 'up' });
          await this.testPublicEndpoint('Get Post Comments', 'GET', `/api/v1/posts/${testPostId}/comments`);
          
          // Test comment creation
          const createCommentResult = await this.testProtectedEndpoint('Create Comment', 'POST', '/api/v1/comments', {
            content: 'This is a test comment from API testing',
            postId: testPostId
          });
          
          if (createCommentResult.success) {
            const commentId = createCommentResult.data?.data?.id;
            console.log('Created test comment with ID:', commentId);
            
            await this.testPublicEndpoint('Get Comment', 'GET', `/api/v1/comments/${commentId}`);
            await this.testProtectedEndpoint('Vote on Comment', 'POST', `/api/v1/comments/${commentId}/vote`, { type: 'up' });
          }
        }
      }
      
      // Test messaging and notifications
      await this.testProtectedEndpoint('Get Notifications', 'GET', '/api/v1/notifications');
      await this.testProtectedEndpoint('Get Direct Messages', 'GET', '/api/v1/messages/direct');
      
      // Test admin endpoints (may fail without admin privileges)
      await this.testProtectedEndpoint('Admin Dashboard', 'GET', '/api/v1/admin/dashboard');
      await this.testProtectedEndpoint('Admin Users', 'GET', '/api/v1/admin/users');
      
      // Test other protected endpoints
      await this.testProtectedEndpoint('Analytics Dashboard', 'GET', '/api/v1/analytics/dashboard');
      await this.testProtectedEndpoint('Track Analytics Event', 'POST', '/api/v1/analytics/track', {
        event: 'api_test_event',
        properties: { source: 'api_testing' }
      });
    }
    
    // Test file upload endpoints
    await this.testProtectedEndpoint('Get Upload URL', 'POST', '/api/v1/uploads/url', {
      filename: 'test-file.jpg',
      contentType: 'image/jpeg',
      size: 1024
    });
    
    // Test voice/video endpoints
    await this.testPublicEndpoint('Voice Test Connection', 'GET', '/api/voice-test/connection');
    await this.testPublicEndpoint('Voice Test Token', 'POST', '/api/voice-test/token', {
      room: 'test-room',
      participant: 'test-user'
    });
    
    // Test WebSocket endpoints
    await this.testPublicEndpoint('Socket Test', 'GET', '/api/v1/socket-test');
    await this.testPublicEndpoint('Socket Connection Info', 'GET', '/api/v1/socket-test/connection');
    
    // Test bot framework
    await this.testPublicEndpoint('List Bots', 'GET', '/api/v1/bots');
    await this.testPublicEndpoint('Get Bot Commands', 'GET', '/api/v1/bots/commands');
    
    // Test Web3 endpoints
    await this.testPublicEndpoint('Web3 Status', 'GET', '/api/v1/web3/status');
    
    // Test moderation endpoints
    await this.testProtectedEndpoint('Moderation Queue', 'GET', '/api/v1/moderation/queue');
    await this.testProtectedEndpoint('User Reports', 'GET', '/api/v1/moderation/reports');
  }

  generateSummaryReport() {
    console.log('\n=== GENERATING SUMMARY REPORT ===');
    
    const totalEndpoints = this.results.workingEndpoints.length + this.results.failedEndpoints.length;
    const successRate = totalEndpoints > 0 ? (this.results.workingEndpoints.length / totalEndpoints) * 100 : 0;
    
    this.results.summary = {
      totalEndpointsTested: totalEndpoints,
      workingEndpoints: this.results.workingEndpoints.length,
      failedEndpoints: this.results.failedEndpoints.length,
      successRate: successRate.toFixed(2) + '%',
      authenticationWorking: !!this.authToken,
      testUserId: this.testUserId,
      keyFindings: {
        authenticationFlow: this.authToken ? 'Working' : 'Failed',
        publicEndpointsWorking: this.results.workingEndpoints.filter(e => 
          e.endpoint.includes('/health') || 
          e.endpoint.includes('/documentation') || 
          e.endpoint.includes('/metrics') ||
          e.endpoint.includes('/communities') ||
          e.endpoint.includes('/posts') ||
          e.endpoint.includes('/search')
        ).length,
        protectedEndpointsWorking: this.results.workingEndpoints.filter(e => 
          e.endpoint.includes('/users/me') || 
          e.endpoint.includes('/admin') ||
          e.endpoint.includes('/analytics')
        ).length
      }
    };
    
    // Save detailed report
    fs.writeFileSync('detailed-api-test-report.json', JSON.stringify(this.results, null, 2));
    
    console.log(`\n📊 COMPREHENSIVE API TEST RESULTS`);
    console.log(`===================================`);
    console.log(`📈 Total endpoints tested: ${totalEndpoints}`);
    console.log(`✅ Working endpoints: ${this.results.workingEndpoints.length}`);
    console.log(`❌ Failed endpoints: ${this.results.failedEndpoints.length}`);
    console.log(`📊 Success rate: ${successRate.toFixed(2)}%`);
    console.log(`🔐 Authentication: ${this.authToken ? 'Working' : 'Failed'}`);
    
    if (this.results.workingEndpoints.length > 0) {
      console.log(`\n✅ WORKING ENDPOINTS:`);
      this.results.workingEndpoints.forEach(endpoint => {
        console.log(`   ${endpoint.method} ${endpoint.endpoint} (${endpoint.status})`);
      });
    }
    
    if (this.results.failedEndpoints.length > 0) {
      console.log(`\n❌ FAILED ENDPOINTS:`);
      this.results.failedEndpoints.forEach(endpoint => {
        console.log(`   ${endpoint.method} ${endpoint.endpoint} (${endpoint.status}) - ${endpoint.error}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: detailed-api-test-report.json`);
  }

  async run() {
    console.log('🚀 STARTING DETAILED CRYB API TESTING');
    console.log('=====================================');

    try {
      await this.testAuthenticationFlow();
      await this.testCoreWorkflows();
      this.generateSummaryReport();
    } catch (error) {
      console.error('❌ Critical error during testing:', error);
      this.results.criticalError = error.message;
      this.generateSummaryReport();
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const tester = new DetailedAPITester();
  tester.run().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DetailedAPITester;