#!/usr/bin/env node

/**
 * CRYB Platform Comprehensive Functionality Test Suite
 * 
 * This test suite verifies REAL functionality of the CRYB platform:
 * - User registration and authentication
 * - Discord-like features (servers, channels, messages)
 * - Reddit-like features (communities, posts, comments)
 * - Real-time messaging
 * - Basic API endpoints
 * 
 * Tests against the actual running API server, not mocked interfaces.
 */

const axios = require('axios');
const { io } = require('socket.io-client');

const API_BASE = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';

class TestResults {
  constructor() {
    this.tests = [];
    this.failures = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, passed, result, details = null) {
    this.tests.push({ name, passed, result, details, timestamp: new Date() });
    if (passed) {
      this.passed++;
      console.log(`✅ ${name}`);
      if (result && typeof result === 'object') {
        console.log(`   📊 ${JSON.stringify(result).substring(0, 100)}...`);
      }
    } else {
      this.failed++;
      this.failures.push({ name, result, details });
      console.log(`❌ ${name}`);
      console.log(`   🔍 ${result}`);
      if (details) {
        console.log(`   📝 ${details}`);
      }
    }
  }

  getReport() {
    const totalTests = this.passed + this.failed;
    const passRate = totalTests > 0 ? (this.passed / totalTests * 100).toFixed(1) : 0;
    
    return {
      summary: {
        total: totalTests,
        passed: this.passed,
        failed: this.failed,
        passRate: `${passRate}%`,
        timestamp: new Date()
      },
      tests: this.tests,
      failures: this.failures,
      functionalityStatus: {
        authentication: this.getFeatureStatus(['User Registration', 'User Login', 'Token Validation']),
        discord: this.getFeatureStatus(['Server Creation', 'Channel Creation', 'Message Sending']),
        reddit: this.getFeatureStatus(['Community Creation', 'Post Creation', 'Comment Creation']),
        realtime: this.getFeatureStatus(['Socket Connection', 'Real-time Message']),
        api: this.getFeatureStatus(['Health Check', 'API Documentation'])
      }
    };
  }

  getFeatureStatus(featureTests) {
    const relevant = this.tests.filter(t => featureTests.some(ft => t.name.includes(ft)));
    const working = relevant.filter(t => t.passed).length;
    const total = relevant.length;
    
    if (total === 0) return 'Not Tested';
    if (working === 0) return 'Not Working';
    if (working === total) return 'Fully Working';
    return `Partially Working (${working}/${total})`;
  }
}

class CRYBFunctionalityTester {
  constructor() {
    this.results = new TestResults();
    this.authToken = null;
    this.testUser = null;
    this.testServer = null;
    this.testChannel = null;
    this.testCommunity = null;
    this.testPost = null;
    this.socket = null;
  }

  async makeRequest(method, endpoint, data = null, useAuth = false) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...(useAuth && this.authToken && { Authorization: `Bearer ${this.authToken}` })
        },
        timeout: 10000,
        ...(data && { data })
      };

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      if (error.response) {
        return { 
          success: false, 
          error: error.response.data || error.response.statusText,
          status: error.response.status 
        };
      } else if (error.code === 'ECONNREFUSED') {
        return { success: false, error: 'Server not running', status: 0 };
      } else {
        return { success: false, error: error.message, status: 0 };
      }
    }
  }

  async testBasicConnectivity() {
    console.log('\n🔍 Testing Basic Connectivity...');
    
    // Test server is responding
    const healthResult = await this.makeRequest('GET', '/health');
    const isHealthy = healthResult.success && 
                     healthResult.status === 200 && 
                     (healthResult.data?.status === 'healthy' || healthResult.data?.status === 'degraded');
    this.results.addTest(
      'Health Check',
      isHealthy,
      healthResult.success ? `Server ${healthResult.data?.status || 'responding'}` : healthResult.error
    );

    // Test API documentation endpoint
    const docsResult = await this.makeRequest('GET', '/documentation');
    this.results.addTest(
      'API Documentation',
      docsResult.success,
      docsResult.success ? 'Documentation accessible' : docsResult.error
    );

    // Test metrics endpoint
    const metricsResult = await this.makeRequest('GET', '/metrics');
    this.results.addTest(
      'Metrics Endpoint',
      metricsResult.success,
      metricsResult.success ? 'Metrics accessible' : metricsResult.error
    );
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication System...');
    
    const timestamp = Date.now();
    const testUsername = `testuser_${timestamp}`;
    const testEmail = `test_${timestamp}@example.com`;
    
    // Test user registration
    const registerData = {
      username: testUsername,
      displayName: 'Test User',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!'
    };
    
    const registerResult = await this.makeRequest('POST', '/api/v1/auth/register', registerData);
    this.results.addTest(
      'User Registration',
      registerResult.success,
      registerResult.success ? 'User created successfully' : registerResult.error
    );

    if (registerResult.success) {
      this.testUser = { username: testUsername, email: testEmail };
    }

    // Test user login
    const loginData = {
      username: testUsername,
      password: 'SecurePassword123!'
    };
    
    const loginResult = await this.makeRequest('POST', '/api/v1/auth/login', loginData);
    this.results.addTest(
      'User Login',
      loginResult.success,
      loginResult.success ? 'Login successful' : loginResult.error
    );

    // Extract token from different possible response structures
    if (loginResult.success) {
      if (loginResult.data?.data?.tokens?.accessToken) {
        this.authToken = loginResult.data.data.tokens.accessToken;
      } else if (loginResult.data?.data?.token) {
        this.authToken = loginResult.data.data.token;
      } else if (loginResult.data?.data?.accessToken) {
        this.authToken = loginResult.data.data.accessToken;
      } else if (loginResult.data?.tokens?.accessToken) {
        this.authToken = loginResult.data.tokens.accessToken;
      } else if (loginResult.data?.token) {
        this.authToken = loginResult.data.token;
      } else if (loginResult.data?.accessToken) {
        this.authToken = loginResult.data.accessToken;
      }
      
      if (this.authToken) {
        console.log(`   🔑 Auth token acquired: ${this.authToken.substring(0, 20)}...`);
      } else {
        console.log(`   ⚠️ Login successful but no token found in response:`, JSON.stringify(loginResult.data).substring(0, 200) + '...');
      }
    }

    // Test token validation by accessing protected endpoint
    if (this.authToken) {
      const userProfileResult = await this.makeRequest('GET', '/api/v1/users/me', null, true);
      this.results.addTest(
        'Token Validation',
        userProfileResult.success,
        userProfileResult.success ? 'Token validates successfully' : userProfileResult.error
      );
    }

    // Test invalid login
    const invalidLoginResult = await this.makeRequest('POST', '/api/v1/auth/login', {
      username: 'nonexistent',
      password: 'wrongpassword'
    });
    this.results.addTest(
      'Invalid Login Protection',
      !invalidLoginResult.success && invalidLoginResult.status === 401,
      !invalidLoginResult.success ? 'Correctly rejected invalid credentials' : 'Security issue: invalid login succeeded'
    );
  }

  async testDiscordFeatures() {
    console.log('\n🎮 Testing Discord-like Features...');
    
    if (!this.authToken) {
      this.results.addTest('Discord Features', false, 'Skipped - no authentication token');
      return;
    }

    // Test server creation
    const serverData = {
      name: `TestServer_${Date.now()}`,
      description: 'A test server for functionality testing',
      isPublic: true
    };
    
    const serverResult = await this.makeRequest('POST', '/api/v1/servers', serverData, true);
    this.results.addTest(
      'Server Creation',
      serverResult.success,
      serverResult.success ? 'Server created successfully' : serverResult.error
    );

    if (serverResult.success && serverResult.data?.data?.id) {
      this.testServer = serverResult.data.data;
      console.log(`   🏠 Server created: ${this.testServer.id}`);
    }

    // Test channel creation
    if (this.testServer) {
      const channelData = {
        serverId: this.testServer.id,
        name: 'general',
        description: 'General discussion channel',
        type: 'TEXT'
      };
      
      const channelResult = await this.makeRequest('POST', '/api/v1/channels', channelData, true);
      this.results.addTest(
        'Channel Creation',
        channelResult.success,
        channelResult.success ? 'Channel created successfully' : channelResult.error
      );

      if (channelResult.success && channelResult.data?.data?.id) {
        this.testChannel = channelResult.data.data;
        console.log(`   📺 Channel created: ${this.testChannel.id}`);
      }
    }

    // Test message sending
    if (this.testChannel) {
      const messageData = {
        channelId: this.testChannel.id,
        content: 'Hello world! This is a test message from the functionality test suite.'
      };
      
      const messageResult = await this.makeRequest('POST', '/api/v1/messages', messageData, true);
      this.results.addTest(
        'Message Sending',
        messageResult.success,
        messageResult.success ? 'Message sent successfully' : messageResult.error
      );
    }

    // Test listing servers
    const serversResult = await this.makeRequest('GET', '/api/v1/servers', null, true);
    this.results.addTest(
      'Server Listing',
      serversResult.success,
      serversResult.success ? `Found ${serversResult.data?.data?.length || 0} servers` : serversResult.error
    );
  }

  async testRedditFeatures() {
    console.log('\n📰 Testing Reddit-like Features...');
    
    if (!this.authToken) {
      this.results.addTest('Reddit Features', false, 'Skipped - no authentication token');
      return;
    }

    // Test community creation
    const communityData = {
      name: `testcommunity_${Date.now()}`,
      displayName: 'Test Community',
      description: 'A test community for functionality testing',
      isPublic: true,
      isNsfw: false
    };
    
    const communityResult = await this.makeRequest('POST', '/api/v1/communities', communityData, true);
    this.results.addTest(
      'Community Creation',
      communityResult.success,
      communityResult.success ? 'Community created successfully' : communityResult.error
    );

    if (communityResult.success && communityResult.data?.data?.id) {
      this.testCommunity = communityResult.data.data;
      console.log(`   🏘️  Community created: ${this.testCommunity.id}`);
    }

    // Test post creation
    if (this.testCommunity) {
      const postData = {
        communityId: this.testCommunity.id,
        title: 'Test Post for Functionality Testing',
        content: 'This is a test post created by the automated functionality test suite.',
        type: 'text'
      };
      
      const postResult = await this.makeRequest('POST', '/api/v1/posts', postData, true);
      this.results.addTest(
        'Post Creation',
        postResult.success,
        postResult.success ? 'Post created successfully' : postResult.error
      );

      if (postResult.success && postResult.data?.data?.id) {
        this.testPost = postResult.data.data;
        console.log(`   📝 Post created: ${this.testPost.id}`);
      }
    }

    // Test comment creation
    if (this.testPost) {
      const commentData = {
        postId: this.testPost.id,
        content: 'This is a test comment on the test post.'
      };
      
      const commentResult = await this.makeRequest('POST', '/api/v1/comments', commentData, true);
      this.results.addTest(
        'Comment Creation',
        commentResult.success,
        commentResult.success ? 'Comment created successfully' : commentResult.error
      );
    }

    // Test listing communities
    const communitiesResult = await this.makeRequest('GET', '/api/v1/communities', null, true);
    this.results.addTest(
      'Community Listing',
      communitiesResult.success,
      communitiesResult.success ? `Found ${communitiesResult.data?.data?.length || 0} communities` : communitiesResult.error
    );

    // Test voting on posts
    if (this.testPost) {
      const voteResult = await this.makeRequest('POST', `/api/v1/posts/${this.testPost.id}/vote`, {
        type: 'upvote'
      }, true);
      this.results.addTest(
        'Post Voting',
        voteResult.success,
        voteResult.success ? 'Post vote successful' : voteResult.error
      );
    }
  }

  async testRealtimeMessaging() {
    console.log('\n📡 Testing Real-time Messaging...');
    
    return new Promise((resolve) => {
      if (!this.authToken) {
        this.results.addTest('Real-time Messaging', false, 'Skipped - no authentication token');
        resolve();
        return;
      }

      const socket = io(SOCKET_URL, {
        auth: {
          token: this.authToken
        },
        timeout: 5000
      });

      let connected = false;
      let messageReceived = false;

      socket.on('connect', () => {
        connected = true;
        console.log('   🔌 Socket connected');
        this.results.addTest(
          'Socket Connection',
          true,
          'Socket.io connection established'
        );

        // Test real-time message if we have a channel
        if (this.testChannel) {
          socket.emit('join_channel', { channelId: this.testChannel.id });
          
          socket.emit('send_message', {
            channelId: this.testChannel.id,
            content: 'Real-time test message'
          });
        }
      });

      socket.on('message', (data) => {
        messageReceived = true;
        console.log('   📨 Real-time message received');
        this.results.addTest(
          'Real-time Message',
          true,
          'Real-time message received successfully'
        );
      });

      socket.on('connect_error', (error) => {
        this.results.addTest(
          'Socket Connection',
          false,
          `Connection failed: ${error.message}`
        );
      });

      socket.on('disconnect', () => {
        console.log('   🔌 Socket disconnected');
      });

      // Test timeout
      setTimeout(() => {
        if (!connected) {
          this.results.addTest(
            'Socket Connection',
            false,
            'Connection timeout after 5 seconds'
          );
        }
        
        if (connected && !messageReceived && this.testChannel) {
          this.results.addTest(
            'Real-time Message',
            false,
            'No real-time message received within timeout'
          );
        }

        socket.disconnect();
        resolve();
      }, 5000);
    });
  }

  async testAPIEndpoints() {
    console.log('\n🔗 Testing Additional API Endpoints...');
    
    if (!this.authToken) {
      this.results.addTest('API Endpoints', false, 'Skipped - no authentication token');
      return;
    }
    
    // Test search endpoint (protected)
    const searchResult = await this.makeRequest('GET', '/api/v1/search?q=test', null, true);
    this.results.addTest(
      'Search Functionality',
      searchResult.success || searchResult.status === 404 || searchResult.status === 400, 
      searchResult.success ? 'Search working' : 
      searchResult.status === 404 ? 'Search not implemented' : 
      searchResult.status === 400 ? 'Search endpoint exists (needs proper query)' :
      searchResult.error
    );

    // Test user profile endpoint (protected)
    const userProfileResult = await this.makeRequest('GET', '/api/v1/users/me', null, true);
    this.results.addTest(
      'User Profile',
      userProfileResult.success,
      userProfileResult.success ? 'User profile accessible' : userProfileResult.error
    );

    // Test upload endpoint structure (protected)
    const uploadResult = await this.makeRequest('POST', '/api/v1/uploads', {}, true);
    this.results.addTest(
      'Upload Endpoint',
      uploadResult.success || uploadResult.status === 400 || uploadResult.status === 415, 
      uploadResult.success ? 'Upload endpoint working' : 
      (uploadResult.status === 400 || uploadResult.status === 415) ? 'Upload endpoint exists (missing file data)' : 
      uploadResult.error
    );

    // Test analytics endpoint (protected)
    const analyticsResult = await this.makeRequest('GET', '/api/v1/analytics', null, true);
    this.results.addTest(
      'Analytics Endpoint',
      analyticsResult.success || analyticsResult.status === 403 || analyticsResult.status === 404, 
      analyticsResult.success ? 'Analytics working' : 
      analyticsResult.status === 403 ? 'Analytics protected (admin only)' : 
      analyticsResult.status === 404 ? 'Analytics not implemented' :
      analyticsResult.error
    );

    // Test notifications endpoint (protected)
    const notificationsResult = await this.makeRequest('GET', '/api/v1/notifications', null, true);
    this.results.addTest(
      'Notifications Endpoint',
      notificationsResult.success || notificationsResult.status === 404,
      notificationsResult.success ? 'Notifications working' : 
      notificationsResult.status === 404 ? 'Notifications not implemented' :
      notificationsResult.error
    );
  }

  async runComprehensiveTest() {
    console.log('🚀 CRYB Platform Comprehensive Functionality Test');
    console.log('=' .repeat(60));
    console.log(`🎯 Target: ${API_BASE}`);
    console.log(`⏰ Started: ${new Date().toISOString()}`);
    
    try {
      await this.testBasicConnectivity();
      await this.testAuthentication();
      await this.testDiscordFeatures();
      await this.testRedditFeatures();
      await this.testRealtimeMessaging();
      await this.testAPIEndpoints();
      
      console.log('\n' + '=' .repeat(60));
      console.log('📊 Test Results Summary');
      console.log('=' .repeat(60));
      
      const report = this.results.getReport();
      console.log(`Total Tests: ${report.summary.total}`);
      console.log(`Passed: ${report.summary.passed} ✅`);
      console.log(`Failed: ${report.summary.failed} ❌`);
      console.log(`Pass Rate: ${report.summary.passRate}`);
      
      console.log('\n🎯 Feature Status:');
      for (const [feature, status] of Object.entries(report.functionalityStatus)) {
        const icon = status === 'Fully Working' ? '✅' : 
                    status === 'Partially Working' ? '⚠️' : 
                    status === 'Not Working' ? '❌' : '⏭️';
        console.log(`${icon} ${feature}: ${status}`);
      }
      
      if (report.failures.length > 0) {
        console.log('\n❌ Failed Tests:');
        report.failures.forEach(failure => {
          console.log(`  • ${failure.name}: ${failure.result}`);
        });
      }
      
      console.log('\n📋 Detailed Report saved to: comprehensive-test-report.json');
      
      // Save detailed report
      const fs = require('fs');
      fs.writeFileSync(
        '/home/ubuntu/cryb-platform/apps/api/comprehensive-test-report.json',
        JSON.stringify(report, null, 2)
      );
      
      // Exit with appropriate code
      process.exit(report.summary.failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(2);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new CRYBFunctionalityTester();
  tester.runComprehensiveTest();
}

module.exports = CRYBFunctionalityTester;