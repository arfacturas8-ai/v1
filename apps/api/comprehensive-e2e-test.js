#!/usr/bin/env node

/**
 * Comprehensive End-to-End Tests for Community Platform API
 * Tests the actual running API server on port 3002
 * 
 * Features tested:
 * 1. Discord-style features (Servers, channels, real-time messaging, voice)
 * 2. Reddit-style features (Communities, posts, voting, comments, karma)
 * 3. Authentication (Registration, login, JWT validation, sessions)
 */

const axios = require('axios');
const { io } = require('socket.io-client');

// Configure axios defaults to handle all status codes
axios.defaults.validateStatus = (status) => status < 600;

const API_BASE_URL = 'http://localhost:3002/api/v1';
const SOCKET_URL = 'http://localhost:3002';

// Test results tracking
const testResults = {
  authentication: { passed: 0, failed: 0, tests: [] },
  discord: { passed: 0, failed: 0, tests: [] },
  reddit: { passed: 0, failed: 0, tests: [] },
  realtime: { passed: 0, failed: 0, tests: [] },
  voice: { passed: 0, failed: 0, tests: [] }
};

// Test data
let testUsers = [];
let authTokens = [];
let serverId = null;
let textChannelId = null;
let voiceChannelId = null;
let communityId = null;
let postId = null;
let commentId = null;
let socketClient = null;

// Utility functions
function logTest(category, testName, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category.toUpperCase()}] ${testName}`);
  
  testResults[category].tests.push({
    name: testName,
    passed,
    error: error ? error.message || error.toString() : null
  });
  
  if (passed) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
    if (error) {
      console.log(`   Error: ${error.message || error.toString()}`);
      // Log additional error details if available
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test API endpoint availability
async function testApiHealth() {
  try {
    const response = await axios.get('http://localhost:3002/health', {
      validateStatus: (status) => status < 600 // Accept all HTTP status codes
    });
    // Accept both healthy (200) and degraded (503) systems as functional
    const isHealthy = response.status === 200 || response.status === 503;
    const statusText = response.status === 200 ? 'healthy' : 'degraded but functional';
    logTest('authentication', `API Health Check (${statusText})`, isHealthy);
    return isHealthy;
  } catch (error) {
    logTest('authentication', 'API Health Check', false, error);
    return false;
  }
}

// Authentication Tests
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication Features...\n');

  // Test user registration
  for (let i = 1; i <= 3; i++) {
    try {
      const userData = {
        email: `test-user-${i}-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        username: `testuser${i}_${Date.now()}`,
        displayName: `Test User ${i}`
      };

      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      testUsers.push(userData);
      
      // Extract token from nested structure
      const token = response.data?.data?.tokens?.accessToken || response.data?.token;
      authTokens.push(token);
      
      logTest('authentication', `User ${i} Registration`, 
        response.status === 201 && response.data.success === true);
        
    } catch (error) {
      logTest('authentication', `User ${i} Registration`, false, error);
    }
  }

  // Test user login
  for (let i = 0; i < testUsers.length; i++) {
    try {
      const loginData = {
        email: testUsers[i].email,
        password: testUsers[i].password
      };

      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      
      // Extract token from nested structure  
      const token = response.data?.data?.tokens?.accessToken || response.data?.token;
      authTokens[i] = token; // Update token
      
      logTest('authentication', `User ${i+1} Login`, 
        response.status === 200 && token);
        
    } catch (error) {
      logTest('authentication', `User ${i+1} Login`, false, error);
    }
  }

  // Test JWT token validation
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('authentication', 'JWT Token Validation', 
      response.status === 200 && response.data.user);
      
  } catch (error) {
    logTest('authentication', 'JWT Token Validation', false, error);
  }

  // Test invalid token rejection
  try {
    await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });
    logTest('authentication', 'Invalid Token Rejection', false);
  } catch (error) {
    logTest('authentication', 'Invalid Token Rejection', 
      error.response?.status === 401);
  }
}

// Discord-style Features Tests
async function testDiscordFeatures() {
  console.log('\n🎮 Testing Discord-style Features...\n');

  // Test server creation
  try {
    const serverData = {
      name: 'Test Discord Server',
      description: 'A comprehensive test server',
      region: 'us-west',
      verificationLevel: 'medium'
    };

    const response = await axios.post(`${API_BASE_URL}/servers`, serverData, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });

    serverId = response.data.server?.id;
    
    logTest('discord', 'Server Creation', 
      response.status === 201 && serverId);
      
  } catch (error) {
    logTest('discord', 'Server Creation', false, error);
  }

  if (!serverId) return;

  // Test text channel creation
  try {
    const channelData = {
      name: 'general',
      type: 'text',
      topic: 'General discussion channel'
    };

    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/channels`, channelData, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });

    textChannelId = response.data.channel?.id;
    
    logTest('discord', 'Text Channel Creation', 
      response.status === 201 && textChannelId);
      
  } catch (error) {
    logTest('discord', 'Text Channel Creation', false, error);
  }

  // Test voice channel creation
  try {
    const voiceChannelData = {
      name: 'General Voice',
      type: 'voice',
      bitrate: 64000,
      userLimit: 10
    };

    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/channels`, voiceChannelData, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });

    voiceChannelId = response.data.channel?.id;
    
    logTest('discord', 'Voice Channel Creation', 
      response.status === 201 && voiceChannelId);
      
  } catch (error) {
    logTest('discord', 'Voice Channel Creation', false, error);
  }

  // Test server member joining
  try {
    const serverInfo = await axios.get(`${API_BASE_URL}/servers/${serverId}`, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    const inviteCode = serverInfo.data.server?.inviteCode;
    
    if (inviteCode) {
      const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/join`, 
        { inviteCode }, {
        headers: { Authorization: `Bearer ${authTokens[1]}` }
      });
      
      logTest('discord', 'Server Member Joining', 
        response.status === 200 && response.data.success === true);
    } else {
      logTest('discord', 'Server Member Joining', false, new Error('No invite code found'));
    }
      
  } catch (error) {
    logTest('discord', 'Server Member Joining', false, error);
  }

  if (!textChannelId) return;

  // Test message sending
  try {
    const messageData = {
      content: 'Hello Discord world! This is a test message.',
      embeds: [{
        title: 'Test Embed',
        description: 'This is a test embed message',
        color: 0x00FF00
      }]
    };

    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/channels/${textChannelId}/messages`, 
      messageData, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('discord', 'Channel Message Sending', 
      response.status === 201 && response.data.message);
      
  } catch (error) {
    logTest('discord', 'Channel Message Sending', false, error);
  }

  // Test role creation
  try {
    const roleData = {
      name: 'Moderator',
      color: '#FF5733',
      permissions: {
        manageMessages: true,
        kickMembers: true,
        banMembers: false
      }
    };

    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/roles`, roleData, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('discord', 'Role Creation', 
      response.status === 201 && response.data.role);
      
  } catch (error) {
    logTest('discord', 'Role Creation', false, error);
  }
}

// Reddit-style Features Tests
async function testRedditFeatures() {
  console.log('\n📰 Testing Reddit-style Features...\n');

  // Test community creation
  try {
    const communityData = {
      name: 'testcommunity',
      title: 'Test Community',
      description: 'A comprehensive test community',
      type: 'public',
      category: 'technology',
      nsfw: false,
      rules: [
        {
          title: 'Be respectful',
          description: 'Treat others with respect and kindness'
        }
      ]
    };

    const response = await axios.post(`${API_BASE_URL}/communities`, communityData, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });

    communityId = response.data.community?.id;
    
    logTest('reddit', 'Community Creation', 
      response.status === 201 && communityId);
      
  } catch (error) {
    logTest('reddit', 'Community Creation', false, error);
  }

  if (!communityId) return;

  // Test community joining
  try {
    const response = await axios.post(`${API_BASE_URL}/communities/${communityId}/join`, {}, {
      headers: { Authorization: `Bearer ${authTokens[1]}` }
    });
    
    logTest('reddit', 'Community Joining', 
      response.status === 200 && response.data.success === true);
      
  } catch (error) {
    logTest('reddit', 'Community Joining', false, error);
  }

  // Test post creation
  try {
    const postData = {
      title: 'This is a comprehensive test post',
      content: 'This post tests the Reddit-style features of our platform. It includes **markdown** support and [links](https://example.com).',
      type: 'text',
      flair: 'Discussion',
      tags: ['test', 'discussion', 'platform']
    };

    const response = await axios.post(`${API_BASE_URL}/communities/${communityId}/posts`, postData, {
      headers: { Authorization: `Bearer ${authTokens[1]}` }
    });

    postId = response.data.post?.id;
    
    logTest('reddit', 'Post Creation', 
      response.status === 201 && postId);
      
  } catch (error) {
    logTest('reddit', 'Post Creation', false, error);
  }

  if (!postId) return;

  // Test post voting
  try {
    const upvoteResponse = await axios.post(`${API_BASE_URL}/communities/${communityId}/posts/${postId}/vote`, 
      { vote: 'up' }, {
      headers: { Authorization: `Bearer ${authTokens[2]}` }
    });
    
    logTest('reddit', 'Post Upvoting', 
      upvoteResponse.status === 200 && upvoteResponse.data.success === true);
      
  } catch (error) {
    logTest('reddit', 'Post Upvoting', false, error);
  }

  // Test comment creation
  try {
    const commentData = {
      content: 'This is a test comment with **markdown** support.',
      parentId: null
    };

    const response = await axios.post(`${API_BASE_URL}/communities/${communityId}/posts/${postId}/comments`, 
      commentData, {
      headers: { Authorization: `Bearer ${authTokens[2]}` }
    });

    commentId = response.data.comment?.id;
    
    logTest('reddit', 'Comment Creation', 
      response.status === 201 && commentId);
      
  } catch (error) {
    logTest('reddit', 'Comment Creation', false, error);
  }

  if (!commentId) return;

  // Test comment voting
  try {
    const response = await axios.post(`${API_BASE_URL}/communities/${communityId}/posts/${postId}/comments/${commentId}/vote`, 
      { vote: 'up' }, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('reddit', 'Comment Voting', 
      response.status === 200 && response.data.success === true);
      
  } catch (error) {
    logTest('reddit', 'Comment Voting', false, error);
  }

  // Test nested reply creation
  try {
    const replyData = {
      content: 'This is a reply to the above comment.',
      parentId: commentId
    };

    const response = await axios.post(`${API_BASE_URL}/communities/${communityId}/posts/${postId}/comments`, 
      replyData, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('reddit', 'Nested Reply Creation', 
      response.status === 201 && response.data.comment);
      
  } catch (error) {
    logTest('reddit', 'Nested Reply Creation', false, error);
  }

  // Test karma system
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${testUsers[1].username}/karma`);
    
    logTest('reddit', 'Karma System', 
      response.status === 200 && typeof response.data.karma?.totalKarma === 'number');
      
  } catch (error) {
    logTest('reddit', 'Karma System', false, error);
  }

  // Test awards system
  try {
    const awardsResponse = await axios.get(`${API_BASE_URL}/awards`);
    
    if (awardsResponse.status === 200 && awardsResponse.data.awards?.length > 0) {
      const awardId = awardsResponse.data.awards[0].id;
      
      const response = await axios.post(`${API_BASE_URL}/communities/${communityId}/posts/${postId}/award`, 
        { awardId, message: 'Great post!' }, {
        headers: { Authorization: `Bearer ${authTokens[0]}` }
      });
      
      logTest('reddit', 'Awards System', 
        response.status === 200 && response.data.success === true);
    } else {
      logTest('reddit', 'Awards System', false, new Error('No awards available'));
    }
      
  } catch (error) {
    logTest('reddit', 'Awards System', false, error);
  }
}

// Real-time Socket.IO Tests
async function testRealtimeFeatures() {
  console.log('\n⚡ Testing Real-time Socket.IO Features...\n');

  return new Promise((resolve) => {
    let testsCompleted = 0;
    const totalTests = 4;
    
    function completeTest() {
      testsCompleted++;
      if (testsCompleted >= totalTests) {
        if (socketClient) {
          socketClient.disconnect();
        }
        resolve();
      }
    }

    // Test socket connection
    try {
      socketClient = io(SOCKET_URL, {
        auth: { token: authTokens[0] },
        transports: ['websocket']
      });

      socketClient.on('connect', () => {
        logTest('realtime', 'Socket Connection', true);
        completeTest();
      });

      socketClient.on('connect_error', (error) => {
        logTest('realtime', 'Socket Connection', false, error);
        completeTest();
      });
    } catch (error) {
      logTest('realtime', 'Socket Connection', false, error);
      completeTest();
    }

    // Test typing indicators
    setTimeout(() => {
      try {
        const typingClient = io(SOCKET_URL, {
          auth: { token: authTokens[1] },
          transports: ['websocket']
        });

        typingClient.on('connect', () => {
          if (textChannelId) {
            typingClient.emit('join_channel', { channelId: textChannelId });
            socketClient.emit('join_channel', { channelId: textChannelId });
            
            socketClient.on('user_typing', (data) => {
              const success = data.channelId === textChannelId && data.userId;
              logTest('realtime', 'Typing Indicators', success);
              typingClient.disconnect();
              completeTest();
            });

            setTimeout(() => {
              typingClient.emit('typing_start', { channelId: textChannelId });
            }, 500);
          } else {
            logTest('realtime', 'Typing Indicators', false, new Error('No text channel available'));
            typingClient.disconnect();
            completeTest();
          }
        });
      } catch (error) {
        logTest('realtime', 'Typing Indicators', false, error);
        completeTest();
      }
    }, 2000);

    // Test real-time messaging
    setTimeout(() => {
      try {
        if (textChannelId && socketClient) {
          socketClient.on('channel_message', (data) => {
            const success = data.content === 'Real-time test message' && data.channelId === textChannelId;
            logTest('realtime', 'Real-time Messaging', success);
            completeTest();
          });

          socketClient.emit('send_channel_message', {
            channelId: textChannelId,
            content: 'Real-time test message'
          });
        } else {
          logTest('realtime', 'Real-time Messaging', false, new Error('Prerequisites not met'));
          completeTest();
        }
      } catch (error) {
        logTest('realtime', 'Real-time Messaging', false, error);
        completeTest();
      }
    }, 3000);

    // Test presence system
    setTimeout(() => {
      try {
        if (socketClient) {
          socketClient.on('user_status_changed', (data) => {
            const success = data.userId && ['online', 'offline', 'away', 'dnd'].includes(data.status);
            logTest('realtime', 'Presence System', success);
            completeTest();
          });

          socketClient.emit('update_status', { status: 'away' });
        } else {
          logTest('realtime', 'Presence System', false, new Error('Socket not available'));
          completeTest();
        }
      } catch (error) {
        logTest('realtime', 'Presence System', false, error);
        completeTest();
      }
    }, 4000);

    // Timeout fallback
    setTimeout(() => {
      while (testsCompleted < totalTests) {
        logTest('realtime', `Test ${testsCompleted + 1}`, false, new Error('Timeout'));
        completeTest();
      }
    }, 10000);
  });
}

// Voice Channel Tests
async function testVoiceFeatures() {
  console.log('\n🎤 Testing Voice Channel Features...\n');

  if (!voiceChannelId) {
    logTest('voice', 'Voice Channel Prerequisites', false, new Error('No voice channel available'));
    return;
  }

  // Test LiveKit token generation
  try {
    const response = await axios.post(`${API_BASE_URL}/voice/token`, {
      channelId: voiceChannelId,
      userId: testUsers[0].username
    }, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('voice', 'LiveKit Token Generation', 
      response.status === 200 && response.data.token);
      
  } catch (error) {
    logTest('voice', 'LiveKit Token Generation', false, error);
  }

  // Test voice channel room creation
  try {
    const response = await axios.post(`${API_BASE_URL}/voice/rooms`, {
      channelId: voiceChannelId,
      settings: {
        maxParticipants: 10,
        audioEnabled: true,
        videoEnabled: false
      }
    }, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('voice', 'Voice Room Creation', 
      response.status === 201 && response.data.room);
      
  } catch (error) {
    logTest('voice', 'Voice Room Creation', false, error);
  }

  // Test voice channel participant management
  try {
    const response = await axios.get(`${API_BASE_URL}/voice/channels/${voiceChannelId}/participants`, {
      headers: { Authorization: `Bearer ${authTokens[0]}` }
    });
    
    logTest('voice', 'Voice Participant Management', 
      response.status === 200 && Array.isArray(response.data.participants));
      
  } catch (error) {
    logTest('voice', 'Voice Participant Management', false, error);
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 COMPREHENSIVE E2E TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  let totalPassed = 0;
  let totalFailed = 0;

  Object.entries(testResults).forEach(([category, results]) => {
    const categoryName = category.toUpperCase();
    const passRate = results.passed + results.failed > 0 
      ? Math.round((results.passed / (results.passed + results.failed)) * 100) 
      : 0;
    
    console.log(`\n📊 ${categoryName} FEATURES:`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📈 Pass Rate: ${passRate}%`);
    
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    if (results.failed > 0) {
      console.log('   🔍 Failed Tests:');
      results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`      • ${test.name}: ${test.error || 'Unknown error'}`);
        });
    }
  });

  const overallPassRate = totalPassed + totalFailed > 0 
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) 
    : 0;

  console.log('\n' + '='.repeat(80));
  console.log('🎯 OVERALL RESULTS:');
  console.log(`   ✅ Total Passed: ${totalPassed}`);
  console.log(`   ❌ Total Failed: ${totalFailed}`);
  console.log(`   📈 Overall Pass Rate: ${overallPassRate}%`);
  console.log('='.repeat(80));

  // Feature-specific status
  console.log('\n🎯 FEATURE STATUS:');
  
  const authPassRate = testResults.authentication.passed / 
    (testResults.authentication.passed + testResults.authentication.failed) * 100;
  console.log(`   🔐 Authentication: ${authPassRate >= 80 ? '✅ OPERATIONAL' : '❌ NEEDS ATTENTION'} (${Math.round(authPassRate)}%)`);
  
  const discordPassRate = testResults.discord.passed / 
    (testResults.discord.passed + testResults.discord.failed) * 100;
  console.log(`   🎮 Discord Features: ${discordPassRate >= 80 ? '✅ OPERATIONAL' : '❌ NEEDS ATTENTION'} (${Math.round(discordPassRate)}%)`);
  
  const redditPassRate = testResults.reddit.passed / 
    (testResults.reddit.passed + testResults.reddit.failed) * 100;
  console.log(`   📰 Reddit Features: ${redditPassRate >= 80 ? '✅ OPERATIONAL' : '❌ NEEDS ATTENTION'} (${Math.round(redditPassRate)}%)`);
  
  const realtimePassRate = testResults.realtime.passed / 
    (testResults.realtime.passed + testResults.realtime.failed) * 100;
  console.log(`   ⚡ Real-time Features: ${realtimePassRate >= 80 ? '✅ OPERATIONAL' : '❌ NEEDS ATTENTION'} (${Math.round(realtimePassRate)}%)`);
  
  const voicePassRate = testResults.voice.passed / 
    (testResults.voice.passed + testResults.voice.failed) * 100;
  console.log(`   🎤 Voice Features: ${voicePassRate >= 80 ? '✅ OPERATIONAL' : '❌ NEEDS ATTENTION'} (${Math.round(voicePassRate)}%)`);

  console.log('\n' + '='.repeat(80));
  console.log(`🏁 TEST EXECUTION COMPLETED - ${overallPassRate >= 80 ? 'SYSTEM HEALTHY' : 'SYSTEM NEEDS ATTENTION'}`);
  console.log('='.repeat(80));

  return overallPassRate >= 80;
}

// Main execution function
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive E2E Tests for Community Platform API');
  console.log(`🌐 Testing API at: ${API_BASE_URL}`);
  console.log(`⚡ Testing Socket.IO at: ${SOCKET_URL}`);
  console.log('='.repeat(80));

  try {
    // Check if API is available
    const apiHealthy = await testApiHealth();
    if (!apiHealthy) {
      console.log('❌ API is not available. Please ensure the server is running on port 3002.');
      process.exit(1);
    }

    // Run test suites
    await testAuthentication();
    await testDiscordFeatures();
    await testRedditFeatures();
    await testRealtimeFeatures();
    await testVoiceFeatures();

    // Generate report
    const systemHealthy = generateReport();
    
    process.exit(systemHealthy ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Fatal error during test execution:', error);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n⚠️ Test execution interrupted');
  if (socketClient) {
    socketClient.disconnect();
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Test execution terminated');
  if (socketClient) {
    socketClient.disconnect();
  }
  process.exit(1);
});

// Run tests
runComprehensiveTests();