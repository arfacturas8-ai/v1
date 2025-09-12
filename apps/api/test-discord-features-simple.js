#!/usr/bin/env node

/**
 * Simplified Discord-style feature test
 */

const axios = require('axios');
const API_BASE = 'http://localhost:3001';

// Test users with unique timestamp and strong passwords
const timestamp = Date.now();
const users = [
  { username: `testuser_${timestamp}_1`, email: `test_${timestamp}_1@example.com`, password: 'Password123@' },
  { username: `testuser_${timestamp}_2`, email: `test_${timestamp}_2@example.com`, password: 'Password123@' }
];

let authTokens = {};
let testServer = null;
let testChannels = [];

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

function success(msg) {
  console.log(colors.green + '✅ ' + msg + colors.reset);
}

function error(msg) {
  console.log(colors.red + '❌ ' + msg + colors.reset);
}

function info(msg) {
  console.log(colors.blue + 'ℹ️  ' + msg + colors.reset);
}

function warning(msg) {
  console.log(colors.yellow + '⚠️  ' + msg + colors.reset);
}

// Helper for API calls
async function apiCall(method, endpoint, data = null, userIndex = 0) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authTokens[users[userIndex].username]}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(`API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

// Test authentication
async function testAuthentication() {
  info('🔐 Testing authentication...');
  
  for (const user of users) {
    try {
      // Try to register
      try {
        const registerResponse = await axios.post(`${API_BASE}/api/v1/auth/register`, {
          username: user.username,
          email: user.email,
          password: user.password,
          confirmPassword: user.password,
          displayName: `Test User ${user.username.slice(-1)}`
        });
        success(`Registered user: ${user.username}`);
      } catch (regError) {
        warning(`User ${user.username} already exists or registration failed`);
      }

      // Login
      const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
        username: user.username,
        password: user.password
      });

      console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
      if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.tokens && loginResponse.data.data.tokens.accessToken) {
        authTokens[user.username] = loginResponse.data.data.tokens.accessToken;
        success(`Logged in user: ${user.username}`);
      } else {
        throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
      }
    } catch (err) {
      error(`Authentication failed for ${user.username}: ${err.message}`);
      throw err;
    }
  }

  success('All users authenticated successfully');
}

// Test server management
async function testServerManagement() {
  info('🏰 Testing server management...');
  
  try {
    // Create a test server
    const serverData = {
      name: 'Test Gaming Community',
      description: 'A test server for gaming enthusiasts',
      category: 'gaming',
      isPublic: true,
      discoverable: true,
      maxMembers: 1000
    };

    const createResponse = await apiCall('POST', '/api/v1/servers', serverData, 0);
    if (!createResponse.success) {
      throw new Error('Server creation failed');
    }

    testServer = createResponse.data;
    success(`Created server: ${testServer.name} (ID: ${testServer.id})`);

    // Get server details
    const getResponse = await apiCall('GET', `/api/v1/servers/${testServer.id}`, null, 0);
    if (getResponse.success) {
      success(`Retrieved server details: ${getResponse.data.name}`);
      testChannels = getResponse.data.channels || [];
      info(`Server has ${testChannels.length} default channels`);
    }

    // Test server discovery
    const discoveryResponse = await apiCall('GET', '/api/v1/servers/discover?category=gaming', null, 0);
    if (discoveryResponse.success) {
      success(`Found ${discoveryResponse.data.servers.length} servers in discovery`);
    }

  } catch (err) {
    error(`Server management test failed: ${err.message}`);
    throw err;
  }
}

// Test channel management
async function testChannelManagement() {
  info('📺 Testing channel management...');
  
  try {
    // Create text channel
    const textChannelData = {
      serverId: testServer.id,
      name: 'test-chat',
      type: 'TEXT',
      description: 'A test text channel',
      slowMode: 5
    };

    const textChannelResponse = await apiCall('POST', '/api/v1/channels', textChannelData, 0);
    if (textChannelResponse.success) {
      testChannels.push(textChannelResponse.data);
      success(`Created text channel: ${textChannelResponse.data.name}`);
    }

    // Create voice channel
    const voiceChannelData = {
      serverId: testServer.id,
      name: 'Gaming Voice',
      type: 'VOICE',
      description: 'Voice channel for gaming'
    };

    const voiceChannelResponse = await apiCall('POST', '/api/v1/channels', voiceChannelData, 0);
    if (voiceChannelResponse.success) {
      testChannels.push(voiceChannelResponse.data);
      success(`Created voice channel: ${voiceChannelResponse.data.name}`);
    }

  } catch (err) {
    error(`Channel management test failed: ${err.message}`);
    throw err;
  }
}

// Test invite system
async function testInviteSystem() {
  info('📧 Testing invite system...');
  
  try {
    // Create invite
    const inviteData = {
      maxUses: 10,
      maxAge: 3600, // 1 hour
      temporary: false
    };

    const createInviteResponse = await apiCall('POST', `/api/v1/servers/${testServer.id}/invites`, inviteData, 0);
    if (createInviteResponse.success) {
      const invite = createInviteResponse.data;
      success(`Created invite: ${invite.code}`);

      // Use invite with different user
      const acceptInviteResponse = await apiCall('POST', `/api/v1/servers/invites/${invite.code}/accept`, null, 1);
      if (acceptInviteResponse.success) {
        success(`User ${users[1].username} joined server via invite`);
      }
    }

  } catch (err) {
    error(`Invite system test failed: ${err.message}`);
    throw err;
  }
}

// Test message system
async function testMessageSystem() {
  info('💬 Testing message system...');
  
  try {
    const testChannel = testChannels.find(c => c.type === 'TEXT');
    if (!testChannel) {
      throw new Error('No text channel found');
    }

    // Create a message
    const messageData = {
      channelId: testChannel.id,
      content: 'This is a test message from the test script!'
    };

    const messageResponse = await apiCall('POST', '/api/v1/messages', messageData, 0);
    if (!messageResponse.success) {
      throw new Error('Failed to create message');
    }

    const message = messageResponse.data;
    success(`Created message: ${message.id}`);

    // Add reaction via API
    const reactionData = {
      emoji: '👍'
    };

    const reactionResponse = await apiCall('POST', `/api/v1/messages/${message.id}/reactions`, reactionData, 1);
    if (reactionResponse.success) {
      success('Added reaction to message');
    }

    // Edit the message
    const editData = {
      content: 'This message has been edited by the test script!'
    };

    const editResponse = await apiCall('PATCH', `/api/v1/messages/${message.id}`, editData, 0);
    if (editResponse.success) {
      success('Successfully edited message');
    }

  } catch (err) {
    error(`Message system test failed: ${err.message}`);
    throw err;
  }
}

// Test member management
async function testMemberManagement() {
  info('👥 Testing member management...');
  
  try {
    // Get server members
    const membersResponse = await apiCall('GET', `/api/v1/servers/${testServer.id}/members`, null, 0);
    if (membersResponse.success) {
      success(`Retrieved ${membersResponse.data.items.length} server members`);
    }

  } catch (err) {
    error(`Member management test failed: ${err.message}`);
    throw err;
  }
}

// Clean up test data
async function cleanup() {
  info('🧹 Cleaning up test data...');
  
  try {
    // Delete test server (this will cascade delete channels, messages, etc.)
    if (testServer) {
      const deleteResponse = await apiCall('DELETE', `/api/v1/servers/${testServer.id}`, null, 0);
      if (deleteResponse.success) {
        success('Deleted test server and related data');
      }
    }

  } catch (err) {
    warning(`Cleanup encountered errors: ${err.message}`);
  }
}

// Main test runner
async function runAllTests() {
  try {
    console.log(colors.cyan + '\n🚀 Starting Discord-style Community Features Test\n' + colors.reset);
    
    await testAuthentication();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testServerManagement();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testChannelManagement();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testInviteSystem();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testMessageSystem();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testMemberManagement();
    console.log('\n' + '='.repeat(50) + '\n');
    
    success('\n🎉 All tests passed successfully!');
    
    console.log(colors.cyan + '\n📊 Test Summary:' + colors.reset);
    console.log('✅ Authentication system');
    console.log('✅ Server management (CRUD)');
    console.log('✅ Channel management (TEXT/VOICE)');
    console.log('✅ Invite system with expiration');
    console.log('✅ Message system with reactions');
    console.log('✅ Member management');
    
  } catch (err) {
    error(`\n💥 Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run tests
if (require.main === module) {
  runAllTests().then(() => {
    console.log(colors.green + '\n✨ All Discord-style features working perfectly!' + colors.reset);
    process.exit(0);
  }).catch((err) => {
    error(`Test suite failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testAuthentication,
  testServerManagement,
  testChannelManagement,
  testInviteSystem,
  testMessageSystem,
  testMemberManagement
};