#!/usr/bin/env node
/**
 * Comprehensive Socket.io Real-time Features Test
 * Tests authentication, messaging, presence, voice, and WebRTC features
 */

const { io } = require('socket.io-client');
const chalk = require('chalk');

const SOCKET_URL = 'http://localhost:3002';
const TEST_TIMEOUT = 30000;

// Test user token - we'll need to generate this
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNjk1MTM1MDAwLCJleHAiOjE3MjY2NzEwMDB9.test-signature';

class SocketTester {
  constructor() {
    this.results = {
      connection: false,
      authentication: false,
      messaging: false,
      presence: false,
      voice: false,
      webrtc: false,
      typing: false,
      rooms: false,
      errors: []
    };
    this.socket = null;
  }

  log(type, message) {
    const prefix = {
      info: chalk.blue('ℹ'),
      success: chalk.green('✅'),
      error: chalk.red('❌'),
      warning: chalk.yellow('⚠'),
      test: chalk.cyan('🧪')
    };
    console.log(`${prefix[type]} ${message}`);
  }

  async runTests() {
    this.log('info', 'Starting comprehensive Socket.io test suite...');
    
    try {
      await this.testConnection();
      await this.testAuthentication();
      await this.testBasicEvents();
      await this.testMessaging();
      await this.testPresence();
      await this.testTypingIndicators();
      await this.testVoiceFeatures();
      await this.testWebRTC();
      await this.testRoomManagement();
      
      this.printResults();
    } catch (error) {
      this.log('error', `Test suite failed: ${error.message}`);
      this.results.errors.push(error.message);
    } finally {
      if (this.socket) {
        this.socket.close();
      }
    }
  }

  async testConnection() {
    this.log('test', 'Testing Socket.io connection...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      try {
        this.socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          auth: {
            token: TEST_TOKEN
          }
        });

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.log('success', `Connected to Socket.io server (${this.socket.id})`);
          this.results.connection = true;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.log('error', `Connection failed: ${error.message}`);
          this.results.errors.push(`Connection: ${error.message}`);
          // Continue with tests even if auth fails
          resolve();
        });

        this.socket.on('error', (error) => {
          this.log('error', `Socket error: ${error.message || error}`);
          this.results.errors.push(`Socket: ${error.message || error}`);
        });

      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async testAuthentication() {
    this.log('test', 'Testing authentication system...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping auth test');
        resolve();
        return;
      }

      // Test various auth events
      this.socket.on('ready', (data) => {
        this.log('success', `Authentication successful - received ready event`);
        this.log('info', `User data: ${JSON.stringify(data.user || {}, null, 2)}`);
        this.results.authentication = true;
      });

      this.socket.on('auth_error', (error) => {
        this.log('error', `Auth error: ${error.message}`);
        this.results.errors.push(`Auth: ${error.message}`);
      });

      // Send identify event
      this.socket.emit('identify', {
        large_threshold: 250,
        presence: {
          status: 'online',
          activity: {
            type: 'testing',
            name: 'Socket.io Test Suite'
          }
        }
      });

      setTimeout(resolve, 2000);
    });
  }

  async testBasicEvents() {
    this.log('test', 'Testing basic event handling...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping basic events test');
        resolve();
        return;
      }

      let responseCount = 0;
      const expectedResponses = 2;

      // Test heartbeat
      this.socket.on('heartbeat_ack', () => {
        this.log('success', 'Heartbeat acknowledged');
        responseCount++;
        if (responseCount >= expectedResponses) resolve();
      });

      // Test server info
      this.socket.on('server_info', (info) => {
        this.log('success', `Received server info: ${JSON.stringify(info)}`);
        responseCount++;
        if (responseCount >= expectedResponses) resolve();
      });

      // Send test events
      this.socket.emit('heartbeat');
      this.socket.emit('get_server_info');

      setTimeout(resolve, 3000);
    });
  }

  async testMessaging() {
    this.log('test', 'Testing messaging system...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping messaging test');
        resolve();
        return;
      }

      // Listen for message events
      this.socket.on('message:create', (message) => {
        this.log('success', `Message created: ${message.content}`);
        this.results.messaging = true;
      });

      this.socket.on('message:update', (message) => {
        this.log('success', `Message updated: ${message.id}`);
      });

      this.socket.on('message:delete', (data) => {
        this.log('success', `Message deleted: ${data.id}`);
      });

      // Test message creation (will likely fail due to permissions)
      this.socket.emit('message:create', {
        channelId: 'test-channel-id',
        content: 'Test message from socket audit',
        nonce: `test-${Date.now()}`
      });

      setTimeout(resolve, 2000);
    });
  }

  async testPresence() {
    this.log('test', 'Testing presence system...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping presence test');
        resolve();
        return;
      }

      // Listen for presence events
      this.socket.on('presence:update', (data) => {
        this.log('success', `Presence update: ${data.user_id} is ${data.status}`);
        this.results.presence = true;
      });

      this.socket.on('presence:update_bulk', (presenceData) => {
        this.log('success', `Bulk presence update: ${presenceData.length} users`);
        this.results.presence = true;
      });

      // Test presence update
      this.socket.emit('presence:update', {
        status: 'dnd',
        activity: {
          type: 'testing',
          name: 'Socket.io Audit',
          details: 'Running comprehensive tests'
        }
      });

      // Request presence for test users
      this.socket.emit('presence:request', {
        userIds: ['test-user-1', 'test-user-2']
      });

      setTimeout(resolve, 2000);
    });
  }

  async testTypingIndicators() {
    this.log('test', 'Testing typing indicators...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping typing test');
        resolve();
        return;
      }

      // Listen for typing events
      this.socket.on('channel:typing_start', (data) => {
        this.log('success', `User ${data.user_id} started typing in ${data.channel_id}`);
        this.results.typing = true;
      });

      this.socket.on('channel:typing_stop', (data) => {
        this.log('success', `User ${data.user_id} stopped typing in ${data.channel_id}`);
        this.results.typing = true;
      });

      // Test typing indicators
      this.socket.emit('channel:typing', {
        channelId: 'test-channel-id'
      });

      setTimeout(() => {
        this.socket.emit('channel:typing_stop', {
          channelId: 'test-channel-id'
        });
      }, 1000);

      setTimeout(resolve, 2500);
    });
  }

  async testVoiceFeatures() {
    this.log('test', 'Testing voice features...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping voice test');
        resolve();
        return;
      }

      // Listen for voice events
      this.socket.on('voice:joined', (data) => {
        this.log('success', `Voice joined: ${data.channelId} with token: ${data.liveKitToken ? 'YES' : 'NO'}`);
        this.results.voice = true;
      });

      this.socket.on('voice:error', (error) => {
        this.log('error', `Voice error: ${error.message}`);
        this.results.errors.push(`Voice: ${error.message}`);
      });

      this.socket.on('voice:state_updated', (data) => {
        this.log('success', `Voice state updated for ${data.userId}`);
        this.results.voice = true;
      });

      this.socket.on('voice:participant_joined', (data) => {
        this.log('success', `Voice participant joined: ${data.participant.username}`);
      });

      // Test voice channel join
      this.socket.emit('voice:join_channel', {
        channelId: 'test-voice-channel',
        capabilities: {
          audio: true,
          video: false,
          screenShare: false
        }
      });

      setTimeout(resolve, 3000);
    });
  }

  async testWebRTC() {
    this.log('test', 'Testing WebRTC features...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping WebRTC test');
        resolve();
        return;
      }

      // Listen for WebRTC events
      this.socket.on('webrtc:offer', (data) => {
        this.log('success', `WebRTC offer received from ${data.fromUserId}`);
        this.results.webrtc = true;
      });

      this.socket.on('webrtc:answer', (data) => {
        this.log('success', `WebRTC answer received from ${data.fromUserId}`);
        this.results.webrtc = true;
      });

      this.socket.on('webrtc:ice_candidate', (data) => {
        this.log('success', `ICE candidate received from ${data.fromUserId}`);
        this.results.webrtc = true;
      });

      // Test screen sharing events
      this.socket.on('screenshare:started', (data) => {
        this.log('success', `Screen share started by ${data.username}`);
        this.results.webrtc = true;
      });

      this.socket.on('screenshare:stopped', (data) => {
        this.log('success', `Screen share stopped by user ${data.userId}`);
      });

      // Test WebRTC signaling (won't work without real peer)
      this.socket.emit('webrtc:offer', {
        targetUserId: 'test-target-user',
        offer: {
          type: 'offer',
          sdp: 'test-sdp-data'
        }
      });

      setTimeout(resolve, 2000);
    });
  }

  async testRoomManagement() {
    this.log('test', 'Testing room management...');
    
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        this.log('warning', 'Socket not connected, skipping room test');
        resolve();
        return;
      }

      // Listen for room events
      this.socket.on('server:state', (data) => {
        this.log('success', `Server state received: ${data.id || 'unknown'}`);
        this.results.rooms = true;
      });

      this.socket.on('channel:messages', (data) => {
        this.log('success', `Channel messages: ${data.messages?.length || 0} messages`);
        this.results.rooms = true;
      });

      this.socket.on('server:members_chunk', (data) => {
        this.log('success', `Server members: ${data.members?.length || 0} members`);
        this.results.rooms = true;
      });

      // Test room operations
      this.socket.emit('server:join', {
        serverId: 'test-server-id'
      });

      this.socket.emit('channel:join', {
        channelId: 'test-channel-id'
      });

      setTimeout(resolve, 2000);
    });
  }

  printResults() {
    this.log('info', '\n=== COMPREHENSIVE SOCKET.IO AUDIT RESULTS ===');
    
    const tests = [
      { name: 'Connection', result: this.results.connection },
      { name: 'Authentication', result: this.results.authentication },
      { name: 'Messaging', result: this.results.messaging },
      { name: 'Presence System', result: this.results.presence },
      { name: 'Voice Features', result: this.results.voice },
      { name: 'WebRTC/Signaling', result: this.results.webrtc },
      { name: 'Typing Indicators', result: this.results.typing },
      { name: 'Room Management', result: this.results.rooms }
    ];

    tests.forEach(test => {
      const status = test.result ? chalk.green('PASS') : chalk.red('FAIL');
      console.log(`${status} ${test.name}`);
    });

    const passCount = tests.filter(t => t.result).length;
    const totalCount = tests.length;
    
    console.log(`\n${chalk.blue('Summary:')} ${passCount}/${totalCount} tests passed`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n${chalk.red('Errors encountered:')}`);
      this.results.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      connection: {
        successful: this.results.connection,
        socketId: this.socket?.id,
        transport: this.socket?.io.engine.transport.name
      },
      features: {
        authentication: this.results.authentication,
        messaging: this.results.messaging,
        presence: this.results.presence,
        voice: this.results.voice,
        webrtc: this.results.webrtc,
        typing: this.results.typing,
        rooms: this.results.rooms
      },
      errors: this.results.errors,
      score: `${passCount}/${totalCount}`
    };

    require('fs').writeFileSync(
      '/home/ubuntu/cryb-platform/socket-audit-report.json',
      JSON.stringify(report, null, 2)
    );
    
    this.log('info', 'Detailed report saved to socket-audit-report.json');
  }
}

// Run the test suite
const tester = new SocketTester();
tester.runTests().catch(console.error);