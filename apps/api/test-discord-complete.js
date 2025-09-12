#!/usr/bin/env node

/**
 * Comprehensive Discord-style Features Test Script
 * Tests all server, channel, messaging, voice, and moderation features
 */

const API_BASE = 'http://localhost:3002/api/v1';
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m'
};

class DiscordTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.users = [];
    this.servers = [];
    this.channels = [];
    this.messages = [];
    this.roles = [];
  }

  log(message, color = COLORS.WHITE) {
    console.log(`${color}${message}${COLORS.RESET}`);
  }

  async request(method, endpoint, data = null, token = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      let responseData;
      
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { success: false, error: 'Invalid JSON response' };
      }

      return {
        status: response.status,
        success: responseData.success !== false,
        data: responseData.data || responseData,
        error: responseData.error
      };
    } catch (error) {
      return {
        status: 0,
        success: false,
        error: error.message
      };
    }
  }

  async test(name, testFn) {
    process.stdout.write(`${COLORS.CYAN}Testing: ${name}... ${COLORS.RESET}`);
    
    try {
      const result = await testFn();
      if (result) {
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASS' });
        console.log(`${COLORS.GREEN}PASS${COLORS.RESET}`);
        return true;
      } else {
        this.results.failed++;
        this.results.tests.push({ name, status: 'FAIL' });
        console.log(`${COLORS.RED}FAIL${COLORS.RESET}`);
        return false;
      }
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'ERROR', error: error.message });
      console.log(`${COLORS.RED}ERROR: ${error.message}${COLORS.RESET}`);
      return false;
    }
  }

  async setupTestUsers() {
    this.log('\n🔧 Setting up test users...', COLORS.YELLOW);
    
    const testUsers = [
      { username: 'server_owner', email: 'owner@test.com', password: 'password123' },
      { username: 'moderator', email: 'mod@test.com', password: 'password123' },
      { username: 'member1', email: 'member1@test.com', password: 'password123' },
      { username: 'member2', email: 'member2@test.com', password: 'password123' },
      { username: 'troublemaker', email: 'trouble@test.com', password: 'password123' }
    ];

    for (const user of testUsers) {
      const result = await this.request('POST', '/auth/register', user);
      if (result.success && result.data.token) {
        this.users.push({
          ...user,
          id: result.data.user.id,
          token: result.data.token
        });
        this.log(`✅ Created user: ${user.username}`, COLORS.GREEN);
      } else {
        this.log(`❌ Failed to create user: ${user.username} - ${result.error}`, COLORS.RED);
      }
    }

    return this.users.length >= 3; // Need at least 3 users for tests
  }

  async runServerTests() {
    this.log('\n🏛️ Running Server Management Tests...', COLORS.BLUE);

    const owner = this.users.find(u => u.username === 'server_owner');
    const member = this.users.find(u => u.username === 'member1');

    await this.test('Create Discord-style server', async () => {
      const serverData = {
        name: 'CRYB Test Server',
        description: 'A test server for Discord-style functionality',
        isPublic: true,
        discoverable: true,
        category: 'Gaming',
        maxMembers: 1000
      };

      const result = await this.request('POST', '/servers', serverData, owner.token);
      if (result.success && result.data.id) {
        this.servers.push({
          id: result.data.id,
          name: result.data.name,
          ownerId: result.data.ownerId
        });

        // Store default channels
        if (result.data.channels && result.data.channels.length > 0) {
          this.channels.push(...result.data.channels);
        }

        this.log(`   Server ID: ${result.data.id}`, COLORS.CYAN);
        return true;
      }
      return false;
    });

    if (this.servers.length === 0) {
      this.log('❌ Cannot continue server tests without a server', COLORS.RED);
      return false;
    }

    const server = this.servers[0];

    await this.test('Get server details', async () => {
      const result = await this.request('GET', `/servers/${server.id}`, null, owner.token);
      return result.success && result.data.id === server.id;
    });

    await this.test('Update server settings', async () => {
      const updateData = {
        description: 'Updated Discord-style test server',
        isPublic: true
      };
      const result = await this.request('PATCH', `/servers/${server.id}`, updateData, owner.token);
      return result.success;
    });

    await this.test('Member joins server', async () => {
      const result = await this.request('POST', `/servers/${server.id}/join`, {}, member.token);
      return result.success;
    });

    await this.test('List server members', async () => {
      const result = await this.request('GET', `/servers/${server.id}/members`, null, owner.token);
      return result.success && result.data.items && result.data.items.length >= 2;
    });

    await this.test('Server discovery', async () => {
      const result = await this.request('GET', '/servers/discover', null, member.token);
      return result.success && result.data.servers && result.data.servers.length > 0;
    });

    return true;
  }

  async runChannelTests() {
    this.log('\n📺 Running Channel Management Tests...', COLORS.BLUE);

    if (this.servers.length === 0) {
      this.log('❌ No servers available for channel tests', COLORS.RED);
      return false;
    }

    const owner = this.users.find(u => u.username === 'server_owner');
    const server = this.servers[0];

    // Get existing channels first
    await this.test('Get server channels', async () => {
      const result = await this.request('GET', `/servers/${server.id}`, null, owner.token);
      if (result.success && result.data.channels) {
        this.channels = result.data.channels;
        return true;
      }
      return false;
    });

    await this.test('Create text channel', async () => {
      const channelData = {
        serverId: server.id,
        name: 'test-chat',
        description: 'A test text channel',
        type: 'TEXT',
        isPrivate: false,
        slowMode: 0,
        nsfw: false
      };

      const result = await this.request('POST', '/channels', channelData, owner.token);
      if (result.success && result.data.id) {
        this.channels.push(result.data);
        this.log(`   Channel ID: ${result.data.id}`, COLORS.CYAN);
        return true;
      }
      return false;
    });

    await this.test('Create voice channel', async () => {
      const channelData = {
        serverId: server.id,
        name: 'voice-chat',
        description: 'A test voice channel',
        type: 'VOICE',
        isPrivate: false
      };

      const result = await this.request('POST', '/channels', channelData, owner.token);
      if (result.success && result.data.id) {
        this.channels.push(result.data);
        this.log(`   Voice Channel ID: ${result.data.id}`, COLORS.CYAN);
        return true;
      }
      return false;
    });

    await this.test('Create category channel', async () => {
      const channelData = {
        serverId: server.id,
        name: 'Test Category',
        type: 'CATEGORY',
        isPrivate: false
      };

      const result = await this.request('POST', '/channels', channelData, owner.token);
      if (result.success && result.data.id) {
        this.channels.push(result.data);
        return true;
      }
      return false;
    });

    // Find a text channel to test with
    const textChannel = this.channels.find(c => c.type === 'TEXT');
    if (textChannel) {
      await this.test('Get channel details', async () => {
        const result = await this.request('GET', `/channels/${textChannel.id}`, null, owner.token);
        return result.success && result.data.id === textChannel.id;
      });

      await this.test('Update channel', async () => {
        const updateData = {
          description: 'Updated channel description',
          slowMode: 5
        };
        const result = await this.request('PATCH', `/channels/${textChannel.id}`, updateData, owner.token);
        return result.success;
      });
    }

    return true;
  }

  async runMessagingTests() {
    this.log('\n💬 Running Messaging System Tests...', COLORS.BLUE);

    const textChannel = this.channels.find(c => c.type === 'TEXT');
    if (!textChannel) {
      this.log('❌ No text channel available for messaging tests', COLORS.RED);
      return false;
    }

    const owner = this.users.find(u => u.username === 'server_owner');
    const member = this.users.find(u => u.username === 'member1');

    await this.test('Send message', async () => {
      const messageData = {
        channelId: textChannel.id,
        content: 'Hello, this is a test message! 👋'
      };

      const result = await this.request('POST', '/messages', messageData, owner.token);
      if (result.success && result.data.id) {
        this.messages.push(result.data);
        this.log(`   Message ID: ${result.data.id}`, COLORS.CYAN);
        return true;
      }
      return false;
    });

    await this.test('Send message with mention', async () => {
      const messageData = {
        channelId: textChannel.id,
        content: `Hey <@${member.id}>, how are you doing?`
      };

      const result = await this.request('POST', '/messages', messageData, owner.token);
      if (result.success && result.data.id) {
        this.messages.push(result.data);
        return true;
      }
      return false;
    });

    await this.test('Reply to message', async () => {
      if (this.messages.length === 0) return false;

      const messageData = {
        channelId: textChannel.id,
        content: 'This is a reply to the test message!',
        replyToId: this.messages[0].id
      };

      const result = await this.request('POST', '/messages', messageData, member.token);
      if (result.success && result.data.id) {
        this.messages.push(result.data);
        return true;
      }
      return false;
    });

    await this.test('Get channel messages', async () => {
      const result = await this.request('GET', `/channels/${textChannel.id}/messages`, null, owner.token);
      return result.success && result.data.messages && result.data.messages.length > 0;
    });

    if (this.messages.length > 0) {
      const message = this.messages[0];

      await this.test('Add reaction to message', async () => {
        const reactionData = { emoji: '👍' };
        const result = await this.request('POST', `/messages/${message.id}/reactions`, reactionData, member.token);
        return result.success;
      });

      await this.test('Edit message', async () => {
        const editData = { content: 'Hello, this is an edited test message! ✏️' };
        const result = await this.request('PATCH', `/messages/${message.id}`, editData, owner.token);
        return result.success;
      });

      await this.test('Pin message', async () => {
        const result = await this.request('POST', `/messages/${message.id}/pin`, {}, owner.token);
        return result.success;
      });
    }

    await this.test('Send typing indicator', async () => {
      const result = await this.request('POST', `/channels/${textChannel.id}/typing`, {}, member.token);
      return result.success;
    });

    return true;
  }

  async runRoleTests() {
    this.log('\n🎭 Running Role Management Tests...', COLORS.BLUE);

    if (this.servers.length === 0) {
      this.log('❌ No servers available for role tests', COLORS.RED);
      return false;
    }

    const owner = this.users.find(u => u.username === 'server_owner');
    const member = this.users.find(u => u.username === 'member1');
    const server = this.servers[0];

    await this.test('Create moderator role', async () => {
      const roleData = {
        name: 'Moderator',
        color: '#FF6B6B',
        permissions: BigInt(0x2 | 0x4 | 0x2000 | 0x10), // KICK_MEMBERS | BAN_MEMBERS | MANAGE_MESSAGES | MANAGE_CHANNELS
        hoist: true,
        mentionable: true
      };

      const result = await this.request('POST', `/servers/${server.id}/roles`, roleData, owner.token);
      if (result.success && result.data.id) {
        this.roles.push(result.data);
        this.log(`   Role ID: ${result.data.id}`, COLORS.CYAN);
        return true;
      }
      return false;
    });

    await this.test('Create VIP role', async () => {
      const roleData = {
        name: 'VIP',
        color: '#4ECDC4',
        permissions: BigInt(0x400), // SEND_MESSAGES
        hoist: true,
        mentionable: false
      };

      const result = await this.request('POST', `/servers/${server.id}/roles`, roleData, owner.token);
      if (result.success && result.data.id) {
        this.roles.push(result.data);
        return true;
      }
      return false;
    });

    await this.test('Get server roles', async () => {
      const result = await this.request('GET', `/servers/${server.id}/roles`, null, owner.token);
      return result.success && result.data && result.data.length >= 3; // @everyone + created roles
    });

    if (this.roles.length > 0) {
      const moderatorRole = this.roles.find(r => r.name === 'Moderator');

      await this.test('Update role', async () => {
        const updateData = {
          name: 'Senior Moderator',
          color: '#E74C3C'
        };
        const result = await this.request('PATCH', `/servers/${server.id}/roles/${moderatorRole.id}`, updateData, owner.token);
        return result.success;
      });

      await this.test('Assign role to member', async () => {
        const roleData = { roleIds: [moderatorRole.id] };
        const result = await this.request('PATCH', `/servers/${server.id}/members/${member.id}/roles`, roleData, owner.token);
        return result.success;
      });
    }

    return true;
  }

  async runModerationTests() {
    this.log('\n🛡️ Running Moderation Tests...', COLORS.BLUE);

    if (this.servers.length === 0 || this.users.length < 5) {
      this.log('❌ Not enough users/servers for moderation tests', COLORS.RED);
      return false;
    }

    const owner = this.users.find(u => u.username === 'server_owner');
    const troublemaker = this.users.find(u => u.username === 'troublemaker');
    const server = this.servers[0];

    // First, troublemaker joins the server
    await this.request('POST', `/servers/${server.id}/join`, {}, troublemaker.token);

    await this.test('Kick member', async () => {
      const kickData = { reason: 'Testing kick functionality' };
      const result = await this.request('POST', `/servers/${server.id}/members/${troublemaker.id}/kick`, kickData, owner.token);
      return result.success;
    });

    // Troublemaker rejoins for ban test
    await this.request('POST', `/servers/${server.id}/join`, {}, troublemaker.token);

    await this.test('Ban member', async () => {
      const banData = { 
        reason: 'Testing ban functionality',
        deleteMessageDays: 1
      };
      const result = await this.request('POST', `/servers/${server.id}/members/${troublemaker.id}/ban`, banData, owner.token);
      return result.success;
    });

    await this.test('Get server bans', async () => {
      const result = await this.request('GET', `/servers/${server.id}/bans`, null, owner.token);
      return result.success && result.data.items && result.data.items.length > 0;
    });

    await this.test('Unban member', async () => {
      const result = await this.request('DELETE', `/servers/${server.id}/bans/${troublemaker.id}`, null, owner.token);
      return result.success;
    });

    await this.test('Get audit logs', async () => {
      const result = await this.request('GET', `/servers/${server.id}/audit-logs`, null, owner.token);
      return result.success && result.data.items && result.data.items.length > 0;
    });

    return true;
  }

  async runVoiceTests() {
    this.log('\n🎤 Running Voice Channel Tests...', COLORS.BLUE);

    const voiceChannel = this.channels.find(c => c.type === 'VOICE');
    if (!voiceChannel) {
      this.log('❌ No voice channel available for voice tests', COLORS.RED);
      return false;
    }

    const owner = this.users.find(u => u.username === 'server_owner');
    const member = this.users.find(u => u.username === 'member1');

    await this.test('Join voice channel', async () => {
      const voiceData = { mute: false, deaf: false };
      const result = await this.request('POST', `/voice/channels/${voiceChannel.id}/join`, voiceData, owner.token);
      return result.success && result.data.liveKitToken;
    });

    await this.test('Get voice channel participants', async () => {
      const result = await this.request('GET', `/voice/channels/${voiceChannel.id}/participants`, null, member.token);
      return result.success && result.data.participants !== undefined;
    });

    await this.test('Update voice state', async () => {
      const stateData = { selfMute: true, selfDeaf: false };
      const result = await this.request('PATCH', '/voice/state', stateData, owner.token);
      return result.success;
    });

    await this.test('Create custom voice room', async () => {
      const roomData = {
        name: 'Test Voice Room',
        description: 'A custom voice room for testing',
        isPrivate: false,
        maxParticipants: 10
      };
      const result = await this.request('POST', '/voice/rooms', roomData, owner.token);
      return result.success && result.data.room && result.data.token;
    });

    await this.test('Voice service health check', async () => {
      const result = await this.request('GET', '/voice/health', null, owner.token);
      return result.success || result.status === 503; // May be unhealthy but should respond
    });

    await this.test('Leave voice channel', async () => {
      const result = await this.request('POST', `/voice/channels/${voiceChannel.id}/leave`, {}, owner.token);
      return result.success;
    });

    return true;
  }

  async runInviteTests() {
    this.log('\n🔗 Running Invite System Tests...', COLORS.BLUE);

    if (this.servers.length === 0) {
      this.log('❌ No servers available for invite tests', COLORS.RED);
      return false;
    }

    const owner = this.users.find(u => u.username === 'server_owner');
    const newUser = this.users.find(u => u.username === 'member2');
    const server = this.servers[0];
    let inviteCode;

    await this.test('Create server invite', async () => {
      const inviteData = {
        maxUses: 10,
        maxAge: 3600, // 1 hour
        temporary: false
      };
      const result = await this.request('POST', `/servers/${server.id}/invites`, inviteData, owner.token);
      if (result.success && result.data.code) {
        inviteCode = result.data.code;
        this.log(`   Invite Code: ${inviteCode}`, COLORS.CYAN);
        return true;
      }
      return false;
    });

    await this.test('Get server invites', async () => {
      const result = await this.request('GET', `/servers/${server.id}/invites`, null, owner.token);
      return result.success && result.data && result.data.length > 0;
    });

    if (inviteCode) {
      await this.test('Accept invite', async () => {
        const result = await this.request('POST', `/servers/invites/${inviteCode}/accept`, {}, newUser.token);
        return result.success;
      });
    }

    return true;
  }

  async runSystemTests() {
    this.log('\n⚙️ Running System Tests...', COLORS.BLUE);

    await this.test('Health check', async () => {
      const result = await this.request('GET', '/health');
      return result.success || result.status === 503; // May be degraded but should respond
    });

    await this.test('API documentation', async () => {
      try {
        const response = await fetch('http://localhost:3002/documentation');
        return response.status === 200;
      } catch (error) {
        return false;
      }
    });

    return true;
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Discord-style Features Test Suite\n', COLORS.MAGENTA);

    const setupSuccess = await this.setupTestUsers();
    if (!setupSuccess) {
      this.log('❌ Failed to setup test users. Cannot continue.', COLORS.RED);
      return;
    }

    // Run all test suites
    await this.runSystemTests();
    await this.runServerTests();
    await this.runChannelTests();
    await this.runMessagingTests();
    await this.runRoleTests();
    await this.runModerationTests();
    await this.runVoiceTests();
    await this.runInviteTests();

    // Print results
    this.printResults();
  }

  printResults() {
    this.log('\n📊 Test Results Summary', COLORS.MAGENTA);
    this.log('=' * 50, COLORS.WHITE);
    
    this.log(`✅ Passed: ${this.results.passed}`, COLORS.GREEN);
    this.log(`❌ Failed: ${this.results.failed}`, COLORS.RED);
    this.log(`📊 Total: ${this.results.passed + this.results.failed}`, COLORS.WHITE);
    this.log(`🏆 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`, COLORS.CYAN);

    if (this.results.failed > 0) {
      this.log('\n❌ Failed Tests:', COLORS.RED);
      this.results.tests
        .filter(t => t.status !== 'PASS')
        .forEach(test => {
          this.log(`  • ${test.name} - ${test.status}${test.error ? ` (${test.error})` : ''}`, COLORS.RED);
        });
    }

    this.log('\n🎯 Test Data Created:', COLORS.CYAN);
    this.log(`  • Users: ${this.users.length}`, COLORS.WHITE);
    this.log(`  • Servers: ${this.servers.length}`, COLORS.WHITE);
    this.log(`  • Channels: ${this.channels.length}`, COLORS.WHITE);
    this.log(`  • Messages: ${this.messages.length}`, COLORS.WHITE);
    this.log(`  • Roles: ${this.roles.length}`, COLORS.WHITE);

    this.log('\n🔧 Manual Testing Commands:', COLORS.YELLOW);
    if (this.users.length > 0) {
      this.log(`  • Test with token: ${this.users[0].token.substring(0, 20)}...`, COLORS.WHITE);
    }
    if (this.servers.length > 0) {
      this.log(`  • Test server ID: ${this.servers[0].id}`, COLORS.WHITE);
    }
    if (this.channels.length > 0) {
      const textChannel = this.channels.find(c => c.type === 'TEXT');
      if (textChannel) {
        this.log(`  • Test channel ID: ${textChannel.id}`, COLORS.WHITE);
      }
    }

    this.log('\n🌐 API Endpoints Tested:', COLORS.BLUE);
    this.log('  • Authentication & User Registration', COLORS.WHITE);
    this.log('  • Server Management (CRUD)', COLORS.WHITE);
    this.log('  • Channel Management (Text/Voice/Category)', COLORS.WHITE);
    this.log('  • Real-time Messaging System', COLORS.WHITE);
    this.log('  • Role-based Permission System', COLORS.WHITE);
    this.log('  • Moderation Tools (Kick/Ban/Audit)', COLORS.WHITE);
    this.log('  • Voice Channel Integration', COLORS.WHITE);
    this.log('  • Invite System', COLORS.WHITE);
    this.log('  • System Health & Documentation', COLORS.WHITE);

    if (this.results.passed >= (this.results.passed + this.results.failed) * 0.8) {
      this.log('\n🎉 Discord-style features are working well!', COLORS.GREEN);
    } else {
      this.log('\n⚠️  Some features need attention.', COLORS.YELLOW);
    }
  }
}

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the test suite
const testSuite = new DiscordTestSuite();
testSuite.runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});