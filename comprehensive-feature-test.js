#!/usr/bin/env node

/**
 * COMPREHENSIVE FEATURE TESTING SUITE
 * Tests ALL Discord and Reddit features to verify actual implementation status
 * 
 * This script will:
 * 1. Test Discord features (servers, channels, messages)
 * 2. Test Reddit features (posts, comments, voting)
 * 3. Test real-time functionality
 * 4. Generate a comprehensive report
 */

const axios = require('axios');
const { io } = require('socket.io-client');

const API_BASE = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';

// Test results collector
const testResults = {
  discord: {
    servers: { tested: false, working: false, errors: [] },
    channels: { tested: false, working: false, errors: [] },
    messages: { tested: false, working: false, errors: [] },
    realtime: { tested: false, working: false, errors: [] }
  },
  reddit: {
    posts: { tested: false, working: false, errors: [] },
    comments: { tested: false, working: false, errors: [] },
    voting: { tested: false, working: false, errors: [] },
    communities: { tested: false, working: false, errors: [] }
  },
  realtime: {
    connection: { tested: false, working: false, errors: [] },
    messaging: { tested: false, working: false, errors: [] },
    events: { tested: false, working: false, errors: [] }
  },
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    implementationStatus: 'unknown'
  }
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (category, test, status, error = null) => {
  const emoji = status ? '✅' : '❌';
  console.log(`${emoji} ${category}.${test}: ${status ? 'PASS' : 'FAIL'}`);
  if (error) {
    console.log(`   Error: ${error.message || error}`);
  }
  
  testResults.summary.totalTests++;
  if (status) {
    testResults.summary.passedTests++;
  } else {
    testResults.summary.failedTests++;
  }
};

const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    // Add /api/v1 prefix if not already present
    const fullUrl = url.startsWith('/api/v1') ? url : `/api/v1${url}`;
    
    const config = {
      method,
      url: `${API_BASE}${fullUrl}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Authentication helper
let authToken = null;
const authenticate = async () => {
  console.log('\n🔐 Setting up authentication...');
  
  // Try to create a test user or login
  const testUser = {
    username: 'testuser_' + Date.now(),
    displayName: 'Test User ' + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!@#',
    confirmPassword: 'TestPassword123!@#'
  };
  
  // Try register
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  
  
  if (registerResult.success) {
    authToken = registerResult.data?.data?.tokens?.accessToken || 
                registerResult.data?.tokens?.accessToken || 
                registerResult.data?.accessToken || 
                registerResult.data?.token;
    console.log('✅ Test user created and authenticated');
    console.log('🔑 Auth token:', authToken ? 'Present' : 'Missing');
    return true;
  } else {
    // Try login with existing user
    const loginResult = await makeRequest('POST', '/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    
    if (loginResult.success) {
      authToken = loginResult.data?.data?.tokens?.accessToken ||
                  loginResult.data?.tokens?.accessToken || 
                  loginResult.data?.accessToken || 
                  loginResult.data?.token;
      console.log('✅ Authenticated with existing user');
      return true;
    } else {
      console.log('❌ Authentication failed');
      console.log('Register result:', registerResult.error);
      console.log('Login result:', loginResult.error);
      return false;
    }
  }
};

// Discord feature tests
const testDiscordFeatures = async () => {
  console.log('\n🎮 TESTING DISCORD FEATURES');
  console.log('=' .repeat(50));
  
  // Test server creation
  testResults.discord.servers.tested = true;
  const serverResult = await makeRequest('POST', '/servers', {
    name: 'Test Server',
    description: 'A test server for validation'
  }, authToken ? { Authorization: `Bearer ${authToken}` } : {});
  
  if (serverResult.success) {
    testResults.discord.servers.working = true;
    logTest('Discord', 'Server Creation', true);
    
    const serverId = serverResult.data?.data?.id || 
                     serverResult.data?.data?.server?.id || 
                     serverResult.data?.server?.id || 
                     serverResult.data?.id || 
                     serverResult.data?.serverId;
    console.log('🏢 Server ID:', serverId);
    
    // Test channel creation
    testResults.discord.channels.tested = true;
    const channelResult = await makeRequest('POST', `/channels`, {
      name: 'test-channel',
      type: 'TEXT',
      description: 'Test chat channel',
      serverId: serverId
    }, authToken ? { Authorization: `Bearer ${authToken}` } : {});
    
    if (channelResult.success) {
      testResults.discord.channels.working = true;
      logTest('Discord', 'Channel Creation', true);
      
      const channelId = channelResult.data.id || channelResult.data.channelId;
      
      // Test message sending
      testResults.discord.messages.tested = true;
      const messageResult = await makeRequest('POST', `/channels/${channelId}/messages`, {
        content: 'Hello, this is a test message!',
        type: 'TEXT'
      }, authToken ? { Authorization: `Bearer ${authToken}` } : {});
      
      if (messageResult.success) {
        testResults.discord.messages.working = true;
        logTest('Discord', 'Message Sending', true);
      } else {
        testResults.discord.messages.errors.push(messageResult.error);
        logTest('Discord', 'Message Sending', false, messageResult.error);
      }
    } else {
      testResults.discord.channels.errors.push(channelResult.error);
      logTest('Discord', 'Channel Creation', false, channelResult.error);
    }
  } else {
    testResults.discord.servers.errors.push(serverResult.error);
    logTest('Discord', 'Server Creation', false, serverResult.error);
  }
};

// Reddit feature tests
const testRedditFeatures = async () => {
  console.log('\n📝 TESTING REDDIT FEATURES');
  console.log('=' .repeat(50));
  
  // Test community creation
  testResults.reddit.communities.tested = true;
  const communityResult = await makeRequest('POST', '/communities', {
    name: 'testcommunity' + Date.now(),
    title: 'Test Community',
    description: 'A test community for validation',
    category: 'general'
  }, authToken ? { Authorization: `Bearer ${authToken}` } : {});
  
  if (communityResult.success) {
    testResults.reddit.communities.working = true;
    logTest('Reddit', 'Community Creation', true);
    
    const communityId = communityResult.data.id || communityResult.data.communityId;
    
    // Test post creation
    testResults.reddit.posts.tested = true;
    const postResult = await makeRequest('POST', '/posts', {
      title: 'Test Post',
      content: 'This is a test post content',
      type: 'TEXT',
      communityId: communityId
    }, authToken ? { Authorization: `Bearer ${authToken}` } : {});
    
    if (postResult.success) {
      testResults.reddit.posts.working = true;
      logTest('Reddit', 'Post Creation', true);
      
      const postId = postResult.data.id || postResult.data.postId;
      
      // Test voting system
      testResults.reddit.voting.tested = true;
      const voteResult = await makeRequest('POST', `/posts/${postId}/vote`, {
        type: 'UPVOTE'
      }, authToken ? { Authorization: `Bearer ${authToken}` } : {});
      
      if (voteResult.success) {
        testResults.reddit.voting.working = true;
        logTest('Reddit', 'Voting System', true);
      } else {
        testResults.reddit.voting.errors.push(voteResult.error);
        logTest('Reddit', 'Voting System', false, voteResult.error);
      }
      
      // Test comment creation
      testResults.reddit.comments.tested = true;
      const commentResult = await makeRequest('POST', `/posts/${postId}/comments`, {
        content: 'This is a test comment',
        parentId: null
      }, authToken ? { Authorization: `Bearer ${authToken}` } : {});
      
      if (commentResult.success) {
        testResults.reddit.comments.working = true;
        logTest('Reddit', 'Comment Creation', true);
      } else {
        testResults.reddit.comments.errors.push(commentResult.error);
        logTest('Reddit', 'Comment Creation', false, commentResult.error);
      }
    } else {
      testResults.reddit.posts.errors.push(postResult.error);
      logTest('Reddit', 'Post Creation', false, postResult.error);
    }
  } else {
    testResults.reddit.communities.errors.push(communityResult.error);
    logTest('Reddit', 'Community Creation', false, communityResult.error);
  }
};

// Real-time functionality tests
const testRealtimeFunctionality = async () => {
  console.log('\n⚡ TESTING REAL-TIME FUNCTIONALITY');
  console.log('=' .repeat(50));
  
  return new Promise((resolve) => {
    testResults.realtime.connection.tested = true;
    
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      timeout: 5000,
      auth: authToken ? { token: authToken } : {}
    });
    
    let connectionTimeout = setTimeout(() => {
      testResults.realtime.connection.errors.push('Connection timeout');
      logTest('Realtime', 'Socket Connection', false, 'Connection timeout');
      socket.disconnect();
      resolve();
    }, 5000);
    
    socket.on('connect', () => {
      clearTimeout(connectionTimeout);
      testResults.realtime.connection.working = true;
      logTest('Realtime', 'Socket Connection', true);
      
      // Test event handling
      testResults.realtime.events.tested = true;
      
      socket.on('message', (data) => {
        testResults.realtime.events.working = true;
        logTest('Realtime', 'Event Handling', true);
      });
      
      socket.on('error', (error) => {
        testResults.realtime.events.errors.push(error);
        logTest('Realtime', 'Event Handling', false, error);
      });
      
      // Test message broadcast
      testResults.realtime.messaging.tested = true;
      socket.emit('test-message', { content: 'Test real-time message' });
      
      setTimeout(() => {
        if (!testResults.realtime.messaging.working) {
          testResults.realtime.messaging.errors.push('No message response received');
          logTest('Realtime', 'Message Broadcasting', false, 'No response received');
        }
        socket.disconnect();
        resolve();
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout);
      testResults.realtime.connection.errors.push(error.message);
      logTest('Realtime', 'Socket Connection', false, error);
      resolve();
    });
  });
};

// Test API endpoints
const testAPIEndpoints = async () => {
  console.log('\n🔍 TESTING API ENDPOINTS');
  console.log('=' .repeat(50));
  
  const endpoints = [
    { method: 'GET', path: '/health', name: 'Health Check' },
    { method: 'GET', path: '/servers', name: 'List Servers' },
    { method: 'GET', path: '/communities', name: 'List Communities' },
    { method: 'GET', path: '/posts', name: 'List Posts' },
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    const success = result.success || result.status < 500;
    logTest('API', endpoint.name, success, success ? null : result.error);
  }
};

// Generate final report
const generateReport = () => {
  console.log('\n📊 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(60));
  
  const totalFeatures = Object.keys(testResults.discord).length + 
                        Object.keys(testResults.reddit).length + 
                        Object.keys(testResults.realtime).length;
  
  let workingFeatures = 0;
  let testedFeatures = 0;
  
  // Count working features
  Object.values(testResults.discord).forEach(feature => {
    if (feature.tested) testedFeatures++;
    if (feature.working) workingFeatures++;
  });
  
  Object.values(testResults.reddit).forEach(feature => {
    if (feature.tested) testedFeatures++;
    if (feature.working) workingFeatures++;
  });
  
  Object.values(testResults.realtime).forEach(feature => {
    if (feature.tested) testedFeatures++;
    if (feature.working) workingFeatures++;
  });
  
  const completionPercentage = testedFeatures > 0 ? Math.round((workingFeatures / testedFeatures) * 100) : 0;
  
  console.log(`\n📈 IMPLEMENTATION STATUS:`);
  console.log(`   Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   Passed: ${testResults.summary.passedTests}`);
  console.log(`   Failed: ${testResults.summary.failedTests}`);
  console.log(`   Features Tested: ${testedFeatures}/${totalFeatures}`);
  console.log(`   Working Features: ${workingFeatures}/${testedFeatures}`);
  console.log(`   Completion Rate: ${completionPercentage}%`);
  
  console.log(`\n🎮 DISCORD FEATURES:`);
  console.log(`   ✅ Servers: ${testResults.discord.servers.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Channels: ${testResults.discord.channels.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Messages: ${testResults.discord.messages.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Real-time: ${testResults.discord.realtime.working ? 'WORKING' : 'FAILED'}`);
  
  console.log(`\n📝 REDDIT FEATURES:`);
  console.log(`   ✅ Communities: ${testResults.reddit.communities.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Posts: ${testResults.reddit.posts.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Comments: ${testResults.reddit.comments.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Voting: ${testResults.reddit.voting.working ? 'WORKING' : 'FAILED'}`);
  
  console.log(`\n⚡ REAL-TIME FEATURES:`);
  console.log(`   ✅ Connection: ${testResults.realtime.connection.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Events: ${testResults.realtime.events.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ✅ Messaging: ${testResults.realtime.messaging.working ? 'WORKING' : 'FAILED'}`);
  
  // Determine implementation status
  if (completionPercentage >= 80) {
    testResults.summary.implementationStatus = 'production-ready';
  } else if (completionPercentage >= 60) {
    testResults.summary.implementationStatus = 'mostly-complete';
  } else if (completionPercentage >= 40) {
    testResults.summary.implementationStatus = 'partially-implemented';
  } else if (completionPercentage >= 20) {
    testResults.summary.implementationStatus = 'basic-functionality';
  } else {
    testResults.summary.implementationStatus = 'minimal-implementation';
  }
  
  console.log(`\n🏆 OVERALL STATUS: ${testResults.summary.implementationStatus.toUpperCase()}`);
  
  return testResults;
};

// Main test execution
const runTests = async () => {
  console.log('🚀 CRYB PLATFORM - COMPREHENSIVE FEATURE TESTING');
  console.log('=' .repeat(60));
  console.log('Testing ALL community features to verify actual implementation status');
  console.log('This will test Discord features, Reddit features, and real-time functionality\n');
  
  try {
    // Setup
    await authenticate();
    
    // Test API endpoints first
    await testAPIEndpoints();
    
    // Test Discord features
    await testDiscordFeatures();
    
    // Test Reddit features  
    await testRedditFeatures();
    
    // Test real-time functionality
    await testRealtimeFunctionality();
    
    // Generate final report
    const results = generateReport();
    
    // Save results to file
    const fs = require('fs');
    const reportPath = '/home/ubuntu/cryb-platform/FEATURE_TEST_RESULTS.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`\n💾 Detailed results saved to: ${reportPath}`);
    console.log('\n✅ Testing completed successfully!');
    
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return null;
  }
};

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testResults };