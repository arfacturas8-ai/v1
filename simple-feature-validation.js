#!/usr/bin/env node

/**
 * SIMPLE FEATURE VALIDATION
 * Direct API calls to test actual functionality without complex error handling
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3002';

// Test results
const results = {
  authentication: { working: false, notes: '' },
  discord: {
    servers: { working: false, notes: '' },
    channels: { working: false, notes: '' },
    messages: { working: false, notes: '' }
  },
  reddit: {
    communities: { working: false, notes: '' },
    posts: { working: false, notes: '' },
    comments: { working: false, notes: '' },
    voting: { working: false, notes: '' }
  },
  realtime: {
    socketio: { working: false, notes: '' }
  },
  summary: {
    totalFeatures: 0,
    workingFeatures: 0,
    completionPercentage: 0,
    status: 'unknown'
  }
};

let authToken = null;

const makeRequest = async (method, path, data = null, headers = {}) => {
  try {
    const url = path.startsWith('/api/v1') ? path : `/api/v1${path}`;
    const response = await axios({
      method,
      url: `${API_BASE}${url}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

const testAuthentication = async () => {
  console.log('🔐 Testing Authentication...');
  
  const user = {
    username: `testuser${Date.now()}`,
    displayName: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!@#',
    confirmPassword: 'TestPassword123!@#'
  };
  
  const result = await makeRequest('POST', '/auth/register', user);
  
  if (result.success) {
    authToken = result.data?.data?.tokens?.accessToken;
    if (authToken) {
      results.authentication.working = true;
      results.authentication.notes = 'Registration and token generation successful';
      console.log('✅ Authentication: WORKING');
      return true;
    } else {
      results.authentication.notes = 'Registration successful but no access token';
      console.log('❌ Authentication: Failed - no token');
      return false;
    }
  } else {
    results.authentication.notes = `Registration failed: ${result.error?.message || result.error}`;
    console.log('❌ Authentication: FAILED');
    return false;
  }
};

const testDiscordFeatures = async () => {
  console.log('🎮 Testing Discord Features...');
  
  if (!authToken) {
    console.log('❌ Skipping Discord tests - no auth token');
    return;
  }
  
  // Test server creation
  const serverResult = await makeRequest('POST', '/servers', {
    name: 'Test Server',
    description: 'Test server for validation'
  }, { Authorization: `Bearer ${authToken}` });
  
  if (serverResult.success && serverResult.data?.data?.id) {
    results.discord.servers.working = true;
    results.discord.servers.notes = 'Server creation successful with full data structure';
    console.log('✅ Discord Servers: WORKING');
    
    const serverId = serverResult.data.data.id;
    
    // Test channel creation (we know the API structure now)
    const channelResult = await makeRequest('POST', '/channels', {
      name: 'test-channel',
      serverId: serverId,
      type: 'TEXT',
      description: 'Test channel'
    }, { Authorization: `Bearer ${authToken}` });
    
    if (channelResult.success) {
      results.discord.channels.working = true;
      results.discord.channels.notes = 'Channel creation successful';
      console.log('✅ Discord Channels: WORKING');
      
      // Test message creation if channel worked
      const channelId = channelResult.data?.data?.id || channelResult.data?.id;
      if (channelId) {
        const messageResult = await makeRequest('POST', `/channels/${channelId}/messages`, {
          content: 'Test message',
          type: 'TEXT'
        }, { Authorization: `Bearer ${authToken}` });
        
        if (messageResult.success) {
          results.discord.messages.working = true;
          results.discord.messages.notes = 'Message creation successful';
          console.log('✅ Discord Messages: WORKING');
        } else {
          results.discord.messages.notes = `Message creation failed: ${messageResult.error?.message || messageResult.error}`;
          console.log('❌ Discord Messages: FAILED');
        }
      } else {
        results.discord.messages.notes = 'Cannot test messages - no channel ID returned';
        console.log('❌ Discord Messages: SKIPPED');
      }
    } else {
      results.discord.channels.notes = `Channel creation failed: ${channelResult.error?.message || channelResult.error}`;
      console.log('❌ Discord Channels: FAILED');
    }
  } else {
    results.discord.servers.notes = `Server creation failed: ${serverResult.error?.message || serverResult.error}`;
    console.log('❌ Discord Servers: FAILED');
  }
};

const testRedditFeatures = async () => {
  console.log('📝 Testing Reddit Features...');
  
  if (!authToken) {
    console.log('❌ Skipping Reddit tests - no auth token');
    return;
  }
  
  // Test community creation
  const communityResult = await makeRequest('POST', '/communities', {
    name: `testcommunity${Date.now()}`,
    title: 'Test Community',
    description: 'Test community for validation',
    category: 'general',
    isPublic: true
  }, { Authorization: `Bearer ${authToken}` });
  
  if (communityResult.success) {
    results.reddit.communities.working = true;
    results.reddit.communities.notes = 'Community creation successful';
    console.log('✅ Reddit Communities: WORKING');
    
    const communityId = communityResult.data?.data?.id || communityResult.data?.id;
    if (communityId) {
      // Test post creation
      const postResult = await makeRequest('POST', '/posts', {
        title: 'Test Post',
        content: 'This is a test post',
        type: 'TEXT',
        communityId: communityId
      }, { Authorization: `Bearer ${authToken}` });
      
      if (postResult.success) {
        results.reddit.posts.working = true;
        results.reddit.posts.notes = 'Post creation successful';
        console.log('✅ Reddit Posts: WORKING');
        
        const postId = postResult.data?.data?.id || postResult.data?.id;
        if (postId) {
          // Test voting
          const voteResult = await makeRequest('POST', `/posts/${postId}/vote`, {
            type: 'UPVOTE'
          }, { Authorization: `Bearer ${authToken}` });
          
          if (voteResult.success) {
            results.reddit.voting.working = true;
            results.reddit.voting.notes = 'Post voting successful';
            console.log('✅ Reddit Voting: WORKING');
          } else {
            results.reddit.voting.notes = `Voting failed: ${voteResult.error?.message || voteResult.error}`;
            console.log('❌ Reddit Voting: FAILED');
          }
          
          // Test comments
          const commentResult = await makeRequest('POST', `/posts/${postId}/comments`, {
            content: 'This is a test comment',
            parentId: null
          }, { Authorization: `Bearer ${authToken}` });
          
          if (commentResult.success) {
            results.reddit.comments.working = true;
            results.reddit.comments.notes = 'Comment creation successful';
            console.log('✅ Reddit Comments: WORKING');
          } else {
            results.reddit.comments.notes = `Comment creation failed: ${commentResult.error?.message || commentResult.error}`;
            console.log('❌ Reddit Comments: FAILED');
          }
        }
      } else {
        results.reddit.posts.notes = `Post creation failed: ${postResult.error?.message || postResult.error}`;
        console.log('❌ Reddit Posts: FAILED');
      }
    }
  } else {
    results.reddit.communities.notes = `Community creation failed: ${communityResult.error?.message || communityResult.error}`;
    console.log('❌ Reddit Communities: FAILED');
  }
};

const testRealtimeFeatures = async () => {
  console.log('⚡ Testing Real-time Features...');
  
  // Test Socket.IO connection
  try {
    const { io } = require('socket.io-client');
    
    return new Promise((resolve) => {
      const socket = io(`${API_BASE}`, {
        auth: authToken ? { token: authToken } : {},
        timeout: 5000
      });
      
      const timeout = setTimeout(() => {
        results.realtime.socketio.notes = 'Connection timeout';
        console.log('❌ Socket.IO: TIMEOUT');
        socket.disconnect();
        resolve();
      }, 5000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        results.realtime.socketio.working = true;
        results.realtime.socketio.notes = 'Socket.IO connection successful';
        console.log('✅ Socket.IO: WORKING');
        socket.disconnect();
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        results.realtime.socketio.notes = `Connection failed: ${error.message}`;
        console.log('❌ Socket.IO: FAILED');
        resolve();
      });
    });
  } catch (error) {
    results.realtime.socketio.notes = `Socket.IO test failed: ${error.message}`;
    console.log('❌ Socket.IO: ERROR');
  }
};

const generateSummary = () => {
  console.log('\n📊 FEATURE VALIDATION SUMMARY');
  console.log('=' .repeat(50));
  
  // Count working features
  let total = 0;
  let working = 0;
  
  // Count authentication
  total++;
  if (results.authentication.working) working++;
  
  // Count Discord features
  Object.values(results.discord).forEach(feature => {
    total++;
    if (feature.working) working++;
  });
  
  // Count Reddit features
  Object.values(results.reddit).forEach(feature => {
    total++;
    if (feature.working) working++;
  });
  
  // Count realtime features
  Object.values(results.realtime).forEach(feature => {
    total++;
    if (feature.working) working++;
  });
  
  const percentage = Math.round((working / total) * 100);
  
  results.summary.totalFeatures = total;
  results.summary.workingFeatures = working;
  results.summary.completionPercentage = percentage;
  
  // Determine status
  if (percentage >= 85) results.summary.status = 'Production Ready';
  else if (percentage >= 70) results.summary.status = 'Near Complete';
  else if (percentage >= 50) results.summary.status = 'Partially Complete';
  else if (percentage >= 30) results.summary.status = 'Basic Functionality';
  else results.summary.status = 'Early Development';
  
  console.log(`\n📈 Implementation Status: ${results.summary.status}`);
  console.log(`📊 Completion: ${working}/${total} features (${percentage}%)`);
  
  console.log('\n🔍 Feature Breakdown:');
  console.log(`   🔐 Authentication: ${results.authentication.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   🎮 Discord Servers: ${results.discord.servers.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   🏷️  Discord Channels: ${results.discord.channels.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   💬 Discord Messages: ${results.discord.messages.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   🏘️  Reddit Communities: ${results.reddit.communities.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   📝 Reddit Posts: ${results.reddit.posts.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   💭 Reddit Comments: ${results.reddit.comments.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   👍 Reddit Voting: ${results.reddit.voting.working ? 'WORKING' : 'FAILED'}`);
  console.log(`   ⚡ Real-time Socket.IO: ${results.realtime.socketio.working ? 'WORKING' : 'FAILED'}`);
  
  return results;
};

const runValidation = async () => {
  console.log('🚀 CRYB PLATFORM - SIMPLE FEATURE VALIDATION');
  console.log('=' .repeat(50));
  
  try {
    await testAuthentication();
    await testDiscordFeatures();
    await testRedditFeatures();
    await testRealtimeFeatures();
    
    const summary = generateSummary();
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('/home/ubuntu/cryb-platform/SIMPLE_VALIDATION_RESULTS.json', JSON.stringify(summary, null, 2));
    
    console.log('\n💾 Results saved to SIMPLE_VALIDATION_RESULTS.json');
    return summary;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return null;
  }
};

if (require.main === module) {
  runValidation().then(() => process.exit(0));
}

module.exports = { runValidation };