#!/usr/bin/env node

/**
 * Core Discord Features Test Script
 * Tests essential server, channel, and messaging functionality
 */

const API_BASE = 'http://localhost:3002/api/v1';

// Simple logging with colors
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`),
  step: (msg) => console.log(`\x1b[35m🔹 ${msg}\x1b[0m`)
};

// Simple HTTP client using curl
async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    let curlCmd = `curl -s -X ${method} "${url}"`;
    curlCmd += ` -H "Content-Type: application/json"`;
    
    if (token) {
      curlCmd += ` -H "Authorization: Bearer ${token}"`;
    }
    
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      curlCmd += ` -d '${JSON.stringify(data)}'`;
    }
    
    const { stdout } = await execAsync(curlCmd);
    const result = JSON.parse(stdout);
    
    return {
      ok: result.success !== false,
      status: result.success ? 200 : 400,
      data: result.data || result,
      success: result.success !== false,
      error: result.error
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function testDiscordFeatures() {
  log.info('🚀 Testing Core Discord-style Features');
  console.log('=' * 50);

  let testData = {
    users: [],
    server: null,
    channels: [],
    messages: []
  };

  // Step 1: Create test users
  log.step('Creating test users...');
  const users = [
    { username: 'testowner', email: 'owner@test.local', password: 'test123' },
    { username: 'testmember', email: 'member@test.local', password: 'test123' }
  ];

  for (const userData of users) {
    const result = await apiRequest('POST', '/auth/register', userData);
    if (result.ok && result.data.token) {
      testData.users.push({
        ...userData,
        id: result.data.user.id,
        token: result.data.token
      });
      log.success(`Created user: ${userData.username}`);
    } else {
      log.error(`Failed to create user ${userData.username}: ${result.error}`);
    }
  }

  if (testData.users.length < 2) {
    log.error('Need at least 2 users to continue testing');
    return;
  }

  const owner = testData.users[0];
  const member = testData.users[1];

  // Step 2: Create server
  log.step('Creating Discord-style server...');
  const serverData = {
    name: 'Test Discord Server',
    description: 'A test server for Discord-style features',
    isPublic: true,
    maxMembers: 100
  };

  const serverResult = await apiRequest('POST', '/servers', serverData, owner.token);
  if (serverResult.ok) {
    testData.server = serverResult.data;
    log.success(`Created server: ${testData.server.name} (ID: ${testData.server.id})`);
    
    // Store default channels
    if (testData.server.channels) {
      testData.channels = testData.server.channels;
      log.info(`Server created with ${testData.channels.length} default channels`);
    }
  } else {
    log.error(`Failed to create server: ${serverResult.error}`);
    return;
  }

  // Step 3: Member joins server
  log.step('Member joining server...');
  const joinResult = await apiRequest('POST', `/servers/${testData.server.id}/join`, {}, member.token);
  if (joinResult.ok) {
    log.success('Member joined server successfully');
  } else {
    log.warning(`Member join failed: ${joinResult.error}`);
  }

  // Step 4: Create additional channels
  log.step('Creating additional channels...');
  
  const newChannels = [
    { name: 'test-chat', type: 'TEXT', description: 'General chat channel' },
    { name: 'announcements', type: 'TEXT', description: 'Server announcements' },
    { name: 'voice-lounge', type: 'VOICE', description: 'Voice chat room' }
  ];

  for (const channelData of newChannels) {
    const result = await apiRequest('POST', '/channels', {
      serverId: testData.server.id,
      ...channelData
    }, owner.token);
    
    if (result.ok) {
      testData.channels.push(result.data);
      log.success(`Created ${channelData.type.toLowerCase()} channel: ${channelData.name}`);
    } else {
      log.warning(`Failed to create channel ${channelData.name}: ${result.error}`);
    }
  }

  // Step 5: Test messaging
  log.step('Testing messaging system...');
  const textChannel = testData.channels.find(c => c.type === 'TEXT' && c.name.includes('test'));
  
  if (textChannel) {
    // Send messages
    const messages = [
      'Hello everyone! 👋',
      'This is a test of the messaging system',
      `Welcome to ${testData.server.name}!`
    ];

    for (const content of messages) {
      const result = await apiRequest('POST', '/messages', {
        channelId: textChannel.id,
        content
      }, owner.token);
      
      if (result.ok) {
        testData.messages.push(result.data);
        log.success(`Sent message: "${content}"`);
      } else {
        log.warning(`Failed to send message: ${result.error}`);
      }
    }

    // Test reply
    if (testData.messages.length > 0) {
      const replyResult = await apiRequest('POST', '/messages', {
        channelId: textChannel.id,
        content: 'Thanks for the welcome! 🎉',
        replyToId: testData.messages[0].id
      }, member.token);
      
      if (replyResult.ok) {
        log.success('Reply message sent successfully');
      } else {
        log.warning(`Reply failed: ${replyResult.error}`);
      }
    }

    // Get messages
    const messagesResult = await apiRequest('GET', `/channels/${textChannel.id}/messages`, null, owner.token);
    if (messagesResult.ok && messagesResult.data.messages) {
      log.success(`Retrieved ${messagesResult.data.messages.length} messages from channel`);
    }
  } else {
    log.warning('No test channel found for messaging tests');
  }

  // Step 6: Test roles
  log.step('Testing role system...');
  const roleResult = await apiRequest('POST', `/servers/${testData.server.id}/roles`, {
    name: 'Test Role',
    color: '#FF6B6B',
    permissions: '1024', // SEND_MESSAGES permission
    hoist: true
  }, owner.token);
  
  if (roleResult.ok) {
    log.success(`Created role: ${roleResult.data.name}`);
    
    // Assign role to member
    const assignResult = await apiRequest('PATCH', `/servers/${testData.server.id}/members/${member.id}/roles`, {
      roleIds: [roleResult.data.id]
    }, owner.token);
    
    if (assignResult.ok) {
      log.success('Role assigned to member successfully');
    } else {
      log.warning(`Role assignment failed: ${assignResult.error}`);
    }
  } else {
    log.warning(`Role creation failed: ${roleResult.error}`);
  }

  // Step 7: Test voice channel
  log.step('Testing voice channel...');
  const voiceChannel = testData.channels.find(c => c.type === 'VOICE');
  
  if (voiceChannel) {
    const voiceJoinResult = await apiRequest('POST', `/voice/channels/${voiceChannel.id}/join`, {
      mute: false,
      deaf: false
    }, owner.token);
    
    if (voiceJoinResult.ok) {
      log.success('Joined voice channel successfully');
      log.info(`Voice token generated: ${voiceJoinResult.data.liveKitToken ? 'Yes' : 'No'}`);
      
      // Leave voice channel
      const leaveResult = await apiRequest('POST', `/voice/channels/${voiceChannel.id}/leave`, {}, owner.token);
      if (leaveResult.ok) {
        log.success('Left voice channel successfully');
      }
    } else {
      log.warning(`Voice join failed: ${voiceJoinResult.error}`);
    }
  }

  // Step 8: Test invites
  log.step('Testing invite system...');
  const inviteResult = await apiRequest('POST', `/servers/${testData.server.id}/invites`, {
    maxUses: 5,
    maxAge: 3600
  }, owner.token);
  
  if (inviteResult.ok && inviteResult.data.code) {
    log.success(`Created invite: ${inviteResult.data.code}`);
  } else {
    log.warning(`Invite creation failed: ${inviteResult.error}`);
  }

  // Step 9: Health check
  log.step('Checking system health...');
  const healthResult = await apiRequest('GET', '/health');
  if (healthResult.ok || healthResult.status === 503) {
    log.success('Health check endpoint responding');
  } else {
    log.warning('Health check failed');
  }

  // Summary
  console.log('\n' + '=' * 50);
  log.info('🎯 Test Summary:');
  console.log(`Users created: ${testData.users.length}`);
  console.log(`Server created: ${testData.server ? 'Yes' : 'No'}`);
  console.log(`Channels created: ${testData.channels.length}`);
  console.log(`Messages sent: ${testData.messages.length}`);
  
  log.info('\n📋 Manual Testing Info:');
  if (testData.users.length > 0) {
    console.log(`Owner token: ${testData.users[0].token}`);
  }
  if (testData.server) {
    console.log(`Server ID: ${testData.server.id}`);
  }
  if (testData.channels.length > 0) {
    const textChannel = testData.channels.find(c => c.type === 'TEXT');
    if (textChannel) {
      console.log(`Text Channel ID: ${textChannel.id}`);
    }
  }

  log.success('✨ Discord-style features test completed!');
}

// Use curl for HTTP requests in Node.js environment
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Run tests
testDiscordFeatures().catch(error => {
  log.error(`Test failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});