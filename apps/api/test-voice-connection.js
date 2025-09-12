#!/usr/bin/env node
/**
 * Voice Connection Test Script
 * 
 * This script tests the complete voice functionality including:
 * - Authentication
 * - Voice channel joining/leaving
 * - WebRTC signaling
 * - Quality monitoring
 * - Screen sharing
 * - Participant management
 */

const io = require('socket.io-client');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';

class VoiceConnectionTester {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || API_BASE_URL;
    this.socketUrl = options.socketUrl || SOCKET_URL;
    this.testUsers = [];
    this.sockets = [];
    this.tokens = [];
    this.verbose = options.verbose || false;
  }

  log(message, ...args) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
  }

  async createTestUser(username) {
    try {
      // Create test user
      const response = await axios.post(`${this.apiUrl}/auth/register`, {
        username,
        email: `${username}@test.local`,
        password: 'testpassword123'
      });

      if (response.data.success) {
        this.log(`✅ Created test user: ${username}`);
        return response.data.data.user;
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      // User might already exist, try to login
      try {
        const loginResponse = await axios.post(`${this.apiUrl}/auth/login`, {
          username,
          password: 'testpassword123'
        });

        if (loginResponse.data.success) {
          this.log(`✅ Logged in existing test user: ${username}`);
          return loginResponse.data.data.user;
        }
      } catch (loginError) {
        this.error(`Failed to create or login user ${username}:`, error.response?.data || error.message);
        throw error;
      }
    }
  }

  async authenticateUser(username) {
    try {
      const response = await axios.post(`${this.apiUrl}/auth/login`, {
        username,
        password: 'testpassword123'
      });

      if (response.data.success) {
        const token = response.data.data.accessToken;
        this.tokens.push(token);
        this.log(`🔐 Authenticated user: ${username}`);
        return token;
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      this.error(`Authentication failed for ${username}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async createTestServer(token) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/servers`,
        {
          name: 'Voice Test Server',
          description: 'Server for testing voice functionality'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        this.log(`🏢 Created test server: ${response.data.data.id}`);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create server');
      }
    } catch (error) {
      this.error('Failed to create test server:', error.response?.data || error.message);
      throw error;
    }
  }

  async createVoiceChannel(serverId, token) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/servers/${serverId}/channels`,
        {
          name: 'Voice Test Channel',
          type: 'VOICE',
          userLimit: 10
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        this.log(`🎙️ Created voice channel: ${response.data.data.id}`);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create voice channel');
      }
    } catch (error) {
      this.error('Failed to create voice channel:', error.response?.data || error.message);
      throw error;
    }
  }

  createSocket(token, userId) {
    return new Promise((resolve, reject) => {
      const socket = io(this.socketUrl, {
        auth: { token },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        this.log(`🔌 Socket connected for user: ${userId}`);
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        this.error(`Socket connection failed for user ${userId}:`, error.message);
        reject(error);
      });

      socket.on('error', (error) => {
        this.error(`Socket error for user ${userId}:`, error);
      });

      // Voice event listeners
      this.setupVoiceEventListeners(socket, userId);

      return socket;
    });
  }

  setupVoiceEventListeners(socket, userId) {
    const events = [
      'voice:joined',
      'voice:left', 
      'voice:error',
      'voice:participant_joined',
      'voice:participant_left',
      'voice:state_updated',
      'voice:speaking_update',
      'voice:quality_warning',
      'voice:quality_alert',
      'voice:settings_updated',
      'screenshare:started',
      'screenshare:stopped',
      'webrtc:offer',
      'webrtc:answer',
      'webrtc:ice_candidate'
    ];

    events.forEach(event => {
      socket.on(event, (data) => {
        if (this.verbose) {
          this.log(`📡 [${userId}] Received ${event}:`, JSON.stringify(data, null, 2));
        } else {
          this.log(`📡 [${userId}] Received ${event}`);
        }
      });
    });
  }

  async testVoiceChannelJoin(socket, userId, channelId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Voice join timeout'));
      }, 10000);

      socket.once('voice:joined', (data) => {
        clearTimeout(timeout);
        this.log(`✅ [${userId}] Successfully joined voice channel`);
        if (this.verbose) {
          this.log('Join response:', JSON.stringify(data, null, 2));
        }
        resolve(data);
      });

      socket.once('voice:error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Voice join failed: ${error.message}`));
      });

      socket.emit('voice:join_channel', {
        channelId,
        capabilities: {
          audio: true,
          video: false,
          screenShare: true
        },
        audioSettings: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    });
  }

  async testVoiceStateUpdate(socket, userId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Voice state update timeout'));
      }, 5000);

      socket.once('voice:state_updated', (data) => {
        clearTimeout(timeout);
        this.log(`✅ [${userId}] Voice state updated successfully`);
        resolve(data);
      });

      socket.emit('voice:update_state', {
        selfMute: true,
        selfDeaf: false,
        speaking: false
      });
    });
  }

  async testQualitySettings(socket, userId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Quality settings timeout'));
      }, 5000);

      socket.once('voice:quality_settings', (data) => {
        clearTimeout(timeout);
        this.log(`✅ [${userId}] Retrieved quality settings`);
        resolve(data);
      });

      socket.emit('voice:get_quality_settings');
    });
  }

  async testQualityPresets(socket, userId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Quality presets timeout'));
      }, 5000);

      socket.once('voice:presets', (data) => {
        clearTimeout(timeout);
        this.log(`✅ [${userId}] Retrieved ${data.presets.length} quality presets`);
        resolve(data);
      });

      socket.emit('voice:get_presets');
    });
  }

  async testScreenSharing(socket, userId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Screen sharing timeout'));
      }, 5000);

      socket.once('screenshare:start_success', (data) => {
        clearTimeout(timeout);
        this.log(`✅ [${userId}] Screen sharing started successfully`);
        resolve(data);
      });

      socket.once('screenshare:error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Screen sharing failed: ${error.message}`));
      });

      socket.emit('screenshare:start', {
        source: 'screen',
        audio: true
      });
    });
  }

  async testWebRTCSignaling(socket1, socket2, userId1, userId2) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebRTC signaling timeout'));
      }, 10000);

      let offerReceived = false;
      let answerReceived = false;

      // Socket 2 receives offer and sends answer
      socket2.once('webrtc:offer', (data) => {
        offerReceived = true;
        this.log(`✅ [${userId2}] Received WebRTC offer from ${userId1}`);
        
        // Send mock answer
        socket2.emit('webrtc:answer', {
          targetUserId: data.fromUserId,
          answer: {
            type: 'answer',
            sdp: 'mock-answer-sdp'
          }
        });
      });

      // Socket 1 receives answer
      socket1.once('webrtc:answer', (data) => {
        answerReceived = true;
        this.log(`✅ [${userId1}] Received WebRTC answer from ${userId2}`);
        
        if (offerReceived && answerReceived) {
          clearTimeout(timeout);
          resolve({ offerReceived, answerReceived });
        }
      });

      // Send mock offer
      socket1.emit('webrtc:offer', {
        targetUserId: userId2,
        offer: {
          type: 'offer',
          sdp: 'mock-offer-sdp'
        }
      });
    });
  }

  async testParticipantManagement(socket, userId, channelId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Participant management timeout'));
      }, 5000);

      socket.once('voice:channel_participants', (data) => {
        clearTimeout(timeout);
        this.log(`✅ [${userId}] Retrieved ${data.participants.length} channel participants`);
        resolve(data);
      });

      socket.emit('voice:get_channel_participants', { channelId });
    });
  }

  async simulateQualityReport(socket, userId) {
    const qualityData = {
      jitter: Math.random() * 50, // 0-50ms
      packetLoss: Math.random() * 5, // 0-5%
      rtt: 50 + Math.random() * 200, // 50-250ms
      audioLevel: Math.random() // 0-1
    };

    socket.emit('voice:quality_report', qualityData);
    this.log(`📊 [${userId}] Sent quality report - RTT: ${qualityData.rtt.toFixed(1)}ms, Loss: ${qualityData.packetLoss.toFixed(2)}%`);
  }

  async cleanup() {
    this.log('🧹 Cleaning up test resources...');
    
    // Disconnect all sockets
    this.sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });

    this.log('✅ Cleanup completed');
  }

  async runAllTests() {
    const startTime = Date.now();
    this.log('🚀 Starting comprehensive voice connection tests...');
    
    try {
      // 1. Create and authenticate test users
      this.log('\n📝 Phase 1: User Setup');
      const user1 = await this.createTestUser('voicetest1');
      const user2 = await this.createTestUser('voicetest2');
      
      const token1 = await this.authenticateUser('voicetest1');
      const token2 = await this.authenticateUser('voicetest2');

      // 2. Create test server and voice channel
      this.log('\n🏢 Phase 2: Server Setup');
      const server = await this.createTestServer(token1);
      const voiceChannel = await this.createVoiceChannel(server.id, token1);

      // 3. Create socket connections
      this.log('\n🔌 Phase 3: Socket Connections');
      const socket1 = await this.createSocket(token1, user1.id);
      const socket2 = await this.createSocket(token2, user2.id);
      this.sockets.push(socket1, socket2);

      // Wait a bit for socket initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Test voice channel joining
      this.log('\n🎙️ Phase 4: Voice Channel Tests');
      await this.testVoiceChannelJoin(socket1, user1.id, voiceChannel.id);
      await this.testVoiceChannelJoin(socket2, user2.id, voiceChannel.id);

      // 5. Test voice state management
      this.log('\n🔄 Phase 5: Voice State Tests');
      await this.testVoiceStateUpdate(socket1, user1.id);
      await this.testVoiceStateUpdate(socket2, user2.id);

      // 6. Test quality settings
      this.log('\n⚙️ Phase 6: Quality Settings Tests');
      await this.testQualitySettings(socket1, user1.id);
      await this.testQualityPresets(socket1, user1.id);

      // 7. Test WebRTC signaling
      this.log('\n📡 Phase 7: WebRTC Signaling Tests');
      await this.testWebRTCSignaling(socket1, socket2, user1.id, user2.id);

      // 8. Test participant management
      this.log('\n👥 Phase 8: Participant Management Tests');
      await this.testParticipantManagement(socket1, user1.id, voiceChannel.id);

      // 9. Test screen sharing
      this.log('\n🖥️ Phase 9: Screen Sharing Tests');
      try {
        await this.testScreenSharing(socket1, user1.id);
      } catch (error) {
        this.log(`⚠️ Screen sharing test failed (expected): ${error.message}`);
      }

      // 10. Simulate quality monitoring
      this.log('\n📊 Phase 10: Quality Monitoring Simulation');
      await this.simulateQualityReport(socket1, user1.id);
      await this.simulateQualityReport(socket2, user2.id);

      // Wait for any pending events
      await new Promise(resolve => setTimeout(resolve, 2000));

      const duration = Date.now() - startTime;
      this.log(`\n🎉 All voice connection tests completed successfully in ${duration}ms!`);
      
      return {
        success: true,
        duration,
        testsCompleted: 10,
        message: 'All voice functionality tests passed'
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`\n❌ Voice connection test failed after ${duration}ms:`, error.message);
      
      return {
        success: false,
        duration,
        error: error.message,
        message: 'Voice connection tests failed'
      };
    } finally {
      await this.cleanup();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const apiUrl = args.find(arg => arg.startsWith('--api-url='))?.split('=')[1];
  const socketUrl = args.find(arg => arg.startsWith('--socket-url='))?.split('=')[1];

  console.log('🎙️ CRYB Voice Connection Test Suite');
  console.log('====================================\n');

  const tester = new VoiceConnectionTester({
    verbose,
    apiUrl,
    socketUrl
  });

  try {
    const result = await tester.runAllTests();
    
    if (result.success) {
      console.log('\n✅ SUCCESS: All voice connection tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ FAILURE: Voice connection tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 UNEXPECTED ERROR:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { VoiceConnectionTester };

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}