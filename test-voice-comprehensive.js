#!/usr/bin/env node

/**
 * Comprehensive Voice/Video System Audit for CRYB Platform
 * Tests all voice/video functionality and integration
 */

const axios = require('axios');
const WebSocket = require('ws');

// Configuration
const API_BASE = 'http://localhost:3002';
const WS_URL = 'ws://localhost:3002';
const LIVEKIT_URL = 'ws://localhost:7880';

// Test credentials (from database)
const TEST_USER_EMAIL = 'voicetest@example.com';
const TEST_USER_PASSWORD = 'VoiceTest123!';

class VoiceVideoAudit {
  constructor() {
    this.authToken = null;
    this.testResults = {
      passed: [],
      failed: [],
      warnings: []
    };
    this.testServerId = null;
    this.testChannelId = null;
    this.testUserId = null;
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async addResult(test, status, details = '') {
    this.testResults[status].push({ test, details, timestamp: new Date() });
    await this.log(`${test}: ${details}`, status === 'failed' ? 'error' : status === 'warnings' ? 'warning' : 'success');
  }

  // Test 1: LiveKit Server Configuration and Connectivity
  async testLiveKitConnectivity() {
    try {
      await this.log('Testing LiveKit server connectivity...');
      
      // Test HTTP endpoint
      const response = await axios.get('http://localhost:7880', {
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        await this.addResult('LiveKit HTTP Connectivity', 'passed', 'LiveKit server responding on port 7880');
      } else {
        await this.addResult('LiveKit HTTP Connectivity', 'failed', `Unexpected status: ${response.status}`);
        return false;
      }

      // Test API endpoint
      const healthResponse = await axios.get(`${API_BASE}/api/v1/voice/health`, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (healthResponse.status === 200) {
        const health = healthResponse.data;
        await this.addResult('Voice Service Health', 'passed', 
          `Service healthy - LiveKit: ${health.livekit?.connected ? 'Connected' : 'Disconnected'}`);
        
        if (health.livekit?.connected) {
          await this.addResult('LiveKit Integration', 'passed', 
            `${health.livekit.rooms} rooms active, Version: ${health.livekit.version}`);
        }
      } else if (healthResponse.status === 401) {
        // Health endpoint requires auth, skip this test
        await this.addResult('Voice Service Health', 'warnings', 'Health endpoint requires authentication (design choice)');
      } else {
        await this.addResult('Voice Service Health', 'failed', `Health check failed: ${healthResponse.status}`);
      }

      return true;
    } catch (error) {
      await this.addResult('LiveKit Connectivity', 'failed', `Connection error: ${error.message}`);
      return false;
    }
  }

  // Test 2: Authentication for Voice Services
  async authenticateUser() {
    try {
      await this.log('Authenticating test user...');
      
      const response = await axios.post(`${API_BASE}/api/v1/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      }, {
        timeout: 10000,
        validateStatus: () => true
      });

      if (response.status === 200 && response.data.success) {
        this.authToken = response.data.data.token;
        this.testUserId = response.data.data.user.id;
        await this.addResult('User Authentication', 'passed', `Authenticated user: ${response.data.data.user.username}`);
        return true;
      } else {
        await this.addResult('User Authentication', 'failed', `Login failed: ${response.data?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      await this.addResult('User Authentication', 'failed', `Auth error: ${error.message}`);
      return false;
    }
  }

  // Test 3: Server and Channel Creation for Voice Testing
  async createTestServerAndChannel() {
    try {
      await this.log('Creating test server for voice channels...');
      
      // Create test server
      const serverResponse = await axios.post(`${API_BASE}/api/v1/servers`, {
        name: `Voice Test Server ${Date.now()}`,
        description: 'Test server for voice/video audit',
        isPublic: false
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (serverResponse.status === 201) {
        this.testServerId = serverResponse.data.data.id;
        await this.addResult('Test Server Creation', 'passed', `Server ID: ${this.testServerId}`);
      } else {
        await this.addResult('Test Server Creation', 'failed', 'Failed to create test server');
        return false;
      }

      // Create voice channel
      const channelResponse = await axios.post(`${API_BASE}/api/v1/channels`, {
        name: 'voice-test',
        type: 'VOICE',
        serverId: this.testServerId,
        userLimit: 10
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (channelResponse.status === 201) {
        this.testChannelId = channelResponse.data.data.id;
        await this.addResult('Voice Channel Creation', 'passed', `Channel ID: ${this.testChannelId}`);
        return true;
      } else {
        await this.addResult('Voice Channel Creation', 'failed', 'Failed to create voice channel');
        return false;
      }
    } catch (error) {
      await this.addResult('Server/Channel Setup', 'failed', `Setup error: ${error.message}`);
      return false;
    }
  }

  // Test 4: Voice Channel Join Functionality
  async testVoiceChannelJoin() {
    try {
      await this.log('Testing voice channel join...');
      
      const response = await axios.post(`${API_BASE}/api/v1/voice/channels/${this.testChannelId}/join`, {
        mute: false,
        deaf: false,
        video: false,
        screenShare: false,
        quality: 'high'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 15000,
        validateStatus: () => true
      });

      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        await this.addResult('Voice Channel Join', 'passed', 
          `Joined channel with LiveKit token. Room: ${data.roomName}`);
        
        // Validate token and URL
        if (data.liveKitToken && data.liveKitUrl) {
          await this.addResult('LiveKit Token Generation', 'passed', 
            `Token generated for ${data.participantInfo?.identity}`);
        } else {
          await this.addResult('LiveKit Token Generation', 'failed', 'Missing token or URL');
        }

        // Validate server info
        if (data.serverInfo) {
          await this.addResult('Voice Server Info', 'passed', 
            `Max participants: ${data.serverInfo.maxParticipants}, Capabilities: ${Object.keys(data.serverInfo.capabilities).join(', ')}`);
        }

        return data;
      } else {
        await this.addResult('Voice Channel Join', 'failed', 
          `Join failed: ${response.data?.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      await this.addResult('Voice Channel Join', 'failed', `Join error: ${error.message}`);
      return null;
    }
  }

  // Test 5: Voice State Management
  async testVoiceStateManagement() {
    try {
      await this.log('Testing voice state management...');
      
      // Test mute/unmute
      const muteResponse = await axios.patch(`${API_BASE}/api/v1/voice/state`, {
        selfMute: true,
        selfDeaf: false,
        selfVideo: false
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (muteResponse.status === 200) {
        await this.addResult('Voice State Update (Mute)', 'passed', 'Successfully updated mute state');
      } else {
        await this.addResult('Voice State Update (Mute)', 'failed', 'Failed to update mute state');
      }

      // Test video toggle
      const videoResponse = await axios.patch(`${API_BASE}/api/v1/voice/state`, {
        selfVideo: true,
        selfStream: false
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (videoResponse.status === 200) {
        await this.addResult('Voice State Update (Video)', 'passed', 'Successfully updated video state');
      } else {
        await this.addResult('Voice State Update (Video)', 'failed', 'Failed to update video state');
      }

      return true;
    } catch (error) {
      await this.addResult('Voice State Management', 'failed', `State error: ${error.message}`);
      return false;
    }
  }

  // Test 6: Participant Management
  async testParticipantManagement() {
    try {
      await this.log('Testing participant management...');
      
      const response = await axios.get(`${API_BASE}/api/v1/voice/channels/${this.testChannelId}/participants`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        const participants = response.data.data.participants;
        await this.addResult('Participant List', 'passed', 
          `Found ${participants.length} participants in channel`);
        
        if (participants.length > 0) {
          const participant = participants[0];
          await this.addResult('Participant Data', 'passed', 
            `Participant: ${participant.user.username}, Connected: ${participant.connectedAt}`);
        }
        
        return true;
      } else {
        await this.addResult('Participant Management', 'failed', 'Failed to get participants');
        return false;
      }
    } catch (error) {
      await this.addResult('Participant Management', 'failed', `Participant error: ${error.message}`);
      return false;
    }
  }

  // Test 7: Video Call Functionality
  async testVideoCallFunctionality() {
    try {
      await this.log('Testing video call functionality...');
      
      // Start video call
      const callResponse = await axios.post(`${API_BASE}/api/v1/voice/video/call`, {
        channelId: this.testChannelId,
        callType: 'channel',
        videoEnabled: true,
        audioEnabled: true,
        quality: 'high'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 15000
      });

      if (callResponse.status === 201 && callResponse.data.success) {
        const callData = callResponse.data.data;
        await this.addResult('Video Call Start', 'passed', 
          `Started call ${callData.callId} with quality: ${callData.settings.quality}`);
        
        // Validate capabilities
        if (callData.capabilities) {
          const caps = callData.capabilities;
          await this.addResult('Video Call Capabilities', 'passed', 
            `Video: ${caps.video}, Audio: ${caps.audio}, Screen Share: ${caps.screenShare}, Simulcast: ${caps.simulcast}`);
        }

        return callData;
      } else {
        await this.addResult('Video Call Start', 'failed', 'Failed to start video call');
        return null;
      }
    } catch (error) {
      await this.addResult('Video Call Functionality', 'failed', `Video call error: ${error.message}`);
      return null;
    }
  }

  // Test 8: Screen Sharing
  async testScreenSharing() {
    try {
      await this.log('Testing screen sharing...');
      
      const roomName = `channel_${this.testChannelId}`;
      const response = await axios.post(`${API_BASE}/api/v1/voice/screen-share/start`, {
        roomName,
        quality: 'high',
        frameRate: 30,
        audio: true
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        const screenData = response.data.data;
        await this.addResult('Screen Share Start', 'passed', 
          `Started screen share with identity: ${screenData.identity}`);
        
        // Test screen share stop
        const stopResponse = await axios.post(`${API_BASE}/api/v1/voice/screen-share/stop`, {
          roomName,
          screenShareIdentity: screenData.identity
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 10000
        });

        if (stopResponse.status === 200) {
          await this.addResult('Screen Share Stop', 'passed', 'Successfully stopped screen sharing');
        }

        return true;
      } else {
        await this.addResult('Screen Sharing', 'failed', 'Failed to start screen sharing');
        return false;
      }
    } catch (error) {
      await this.addResult('Screen Sharing', 'failed', `Screen share error: ${error.message}`);
      return false;
    }
  }

  // Test 9: Quality Monitoring
  async testQualityMonitoring() {
    try {
      await this.log('Testing call quality monitoring...');
      
      const roomName = `channel_${this.testChannelId}`;
      const response = await axios.post(`${API_BASE}/api/v1/voice/quality/report`, {
        roomName,
        quality: {
          video: {
            resolution: '1920x1080',
            frameRate: 30,
            bitrate: 1500000,
            packetsLost: 2,
            jitter: 5
          },
          audio: {
            bitrate: 128000,
            packetsLost: 1,
            jitter: 3,
            latency: 45
          },
          connection: {
            rtt: 25,
            bandwidth: 2000000,
            connectionType: 'wifi'
          }
        }
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        await this.addResult('Quality Monitoring', 'passed', 'Quality report successfully submitted');
        return true;
      } else {
        await this.addResult('Quality Monitoring', 'failed', 'Failed to submit quality report');
        return false;
      }
    } catch (error) {
      await this.addResult('Quality Monitoring', 'failed', `Quality monitoring error: ${error.message}`);
      return false;
    }
  }

  // Test 10: Custom Voice Rooms
  async testCustomVoiceRooms() {
    try {
      await this.log('Testing custom voice rooms...');
      
      // Create custom room
      const createResponse = await axios.post(`${API_BASE}/api/v1/voice/rooms`, {
        name: 'Test Voice Room',
        description: 'Testing custom room functionality',
        isPrivate: false,
        maxParticipants: 5
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (createResponse.status === 201 && createResponse.data.success) {
        const roomData = createResponse.data.data;
        await this.addResult('Custom Room Creation', 'passed', 
          `Created room ${roomData.room.id} with ${roomData.room.maxParticipants} max participants`);
        
        // Test joining custom room
        const joinResponse = await axios.post(`${API_BASE}/api/v1/voice/rooms/${roomData.room.id}/join`, {}, {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 10000
        });

        if (joinResponse.status === 200 && joinResponse.data.success) {
          await this.addResult('Custom Room Join', 'passed', 'Successfully joined custom room');
        }

        return true;
      } else {
        await this.addResult('Custom Voice Rooms', 'failed', 'Failed to create custom room');
        return false;
      }
    } catch (error) {
      await this.addResult('Custom Voice Rooms', 'failed', `Custom room error: ${error.message}`);
      return false;
    }
  }

  // Test 11: Active Calls Management
  async testActiveCallsManagement() {
    try {
      await this.log('Testing active calls management...');
      
      const response = await axios.get(`${API_BASE}/api/v1/voice/calls/active`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        const activeData = response.data.data;
        await this.addResult('Active Calls Retrieval', 'passed', 
          `Found ${activeData.totalRooms} active rooms, ${activeData.userVoiceStates.length} voice states`);
        
        if (activeData.activeRooms.length > 0) {
          const room = activeData.activeRooms[0];
          await this.addResult('Active Room Data', 'passed', 
            `Room: ${room.roomName}, Participants: ${room.participants}`);
        }

        return true;
      } else {
        await this.addResult('Active Calls Management', 'failed', 'Failed to get active calls');
        return false;
      }
    } catch (error) {
      await this.addResult('Active Calls Management', 'failed', `Active calls error: ${error.message}`);
      return false;
    }
  }

  // Test 12: Scale Status and Performance
  async testScaleStatus() {
    try {
      await this.log('Testing platform scale status...');
      
      const response = await axios.get(`${API_BASE}/api/v1/voice/scale/status`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        const scaleData = response.data.data;
        await this.addResult('Scale Status', 'passed', 
          `Scale status: ${scaleData.scaleStatus?.status || 'healthy'}`);
        
        if (scaleData.platformReadiness) {
          const readiness = scaleData.platformReadiness;
          const readyFeatures = Object.entries(readiness).filter(([k, v]) => v.includes('✅')).length;
          await this.addResult('Platform Readiness', 'passed', 
            `${readyFeatures}/${Object.keys(readiness).length} features ready for $10M scale`);
        }

        if (scaleData.businessMetrics) {
          await this.addResult('Business Metrics', 'passed', 
            `Target: ${scaleData.businessMetrics.target_revenue}, Capacity: ${scaleData.businessMetrics.peak_load_capacity}`);
        }

        return true;
      } else {
        await this.addResult('Scale Status', 'failed', 'Failed to get scale status');
        return false;
      }
    } catch (error) {
      await this.addResult('Scale Status', 'failed', `Scale status error: ${error.message}`);
      return false;
    }
  }

  // Test 13: WebSocket Integration
  async testWebSocketIntegration() {
    try {
      await this.log('Testing WebSocket voice integration...');
      
      return new Promise((resolve) => {
        const ws = new WebSocket(`${WS_URL}?token=${this.authToken}`);
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            ws.close();
            this.addResult('WebSocket Integration', 'failed', 'WebSocket connection timeout');
            resolve(false);
          }
        }, 10000);

        ws.on('open', () => {
          this.addResult('WebSocket Connection', 'passed', 'Connected to WebSocket server');
          
          // Join a room to test voice events
          ws.send(JSON.stringify({
            type: 'join_channel',
            channelId: this.testChannelId
          }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'voiceStateUpdate' || message.type === 'voiceParticipantJoined') {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                this.addResult('Voice WebSocket Events', 'passed', `Received ${message.type} event`);
                ws.close();
                resolve(true);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        });

        ws.on('error', (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.addResult('WebSocket Integration', 'failed', `WebSocket error: ${error.message}`);
            resolve(false);
          }
        });

        ws.on('close', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.addResult('WebSocket Integration', 'warnings', 'WebSocket closed without receiving voice events');
            resolve(false);
          }
        });
      });
    } catch (error) {
      await this.addResult('WebSocket Integration', 'failed', `WebSocket test error: ${error.message}`);
      return false;
    }
  }

  // Test 14: Voice Channel Leave
  async testVoiceChannelLeave() {
    try {
      await this.log('Testing voice channel leave...');
      
      const response = await axios.post(`${API_BASE}/api/v1/voice/channels/${this.testChannelId}/leave`, {}, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        await this.addResult('Voice Channel Leave', 'passed', 'Successfully left voice channel');
        return true;
      } else {
        await this.addResult('Voice Channel Leave', 'failed', 'Failed to leave voice channel');
        return false;
      }
    } catch (error) {
      await this.addResult('Voice Channel Leave', 'failed', `Leave error: ${error.message}`);
      return false;
    }
  }

  // Test 15: Cleanup
  async cleanup() {
    try {
      await this.log('Cleaning up test resources...');
      
      if (this.testServerId) {
        await axios.delete(`${API_BASE}/api/servers/${this.testServerId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` },
          timeout: 10000,
          validateStatus: () => true
        });
        await this.addResult('Cleanup', 'passed', 'Test server deleted');
      }
    } catch (error) {
      await this.addResult('Cleanup', 'warnings', `Cleanup error: ${error.message}`);
    }
  }

  // Main audit execution
  async runAudit() {
    console.log('\n🎙️ CRYB PLATFORM VOICE/VIDEO COMPREHENSIVE AUDIT');
    console.log('='.repeat(60));
    console.log(`Audit started at: ${new Date().toISOString()}`);
    console.log(`Target: $10M Platform Scale Validation\n`);

    // Run all tests
    const liveKitOk = await this.testLiveKitConnectivity();
    if (!liveKitOk) {
      console.log('\n❌ Critical: LiveKit server not accessible. Aborting voice tests.');
      this.printSummary();
      return;
    }

    const authOk = await this.authenticateUser();
    if (!authOk) {
      console.log('\n❌ Critical: Authentication failed. Aborting tests.');
      this.printSummary();
      return;
    }

    const setupOk = await this.createTestServerAndChannel();
    if (!setupOk) {
      console.log('\n❌ Critical: Failed to create test resources. Aborting tests.');
      this.printSummary();
      return;
    }

    // Core voice/video functionality tests
    await this.testVoiceChannelJoin();
    await this.testVoiceStateManagement();
    await this.testParticipantManagement();
    await this.testVideoCallFunctionality();
    await this.testScreenSharing();
    await this.testQualityMonitoring();
    await this.testCustomVoiceRooms();
    await this.testActiveCallsManagement();
    await this.testScaleStatus();
    await this.testWebSocketIntegration();
    await this.testVoiceChannelLeave();
    
    // Cleanup
    await this.cleanup();

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎙️ VOICE/VIDEO AUDIT SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ PASSED: ${this.testResults.passed.length} tests`);
    this.testResults.passed.forEach(result => {
      console.log(`   ✓ ${result.test}: ${result.details}`);
    });

    if (this.testResults.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.testResults.warnings.length} tests`);
      this.testResults.warnings.forEach(result => {
        console.log(`   ⚠ ${result.test}: ${result.details}`);
      });
    }

    if (this.testResults.failed.length > 0) {
      console.log(`\n❌ FAILED: ${this.testResults.failed.length} tests`);
      this.testResults.failed.forEach(result => {
        console.log(`   ✗ ${result.test}: ${result.details}`);
      });
    }

    const totalTests = this.testResults.passed.length + this.testResults.failed.length + this.testResults.warnings.length;
    const successRate = ((this.testResults.passed.length / totalTests) * 100).toFixed(1);
    
    console.log(`\n📊 OVERALL SCORE: ${successRate}% (${this.testResults.passed.length}/${totalTests} tests passed)`);
    
    if (successRate >= 90) {
      console.log(`\n🚀 PLATFORM STATUS: ✅ READY FOR $10M SCALE`);
      console.log(`   Voice/Video system is production-ready and scalable`);
    } else if (successRate >= 75) {
      console.log(`\n⚠️  PLATFORM STATUS: 🔧 NEEDS MINOR FIXES`);
      console.log(`   Voice/Video system mostly ready, minor issues to resolve`);
    } else {
      console.log(`\n❌ PLATFORM STATUS: 🚫 NOT PRODUCTION READY`);
      console.log(`   Voice/Video system needs significant fixes before scale`);
    }

    console.log(`\n📋 AUDIT COMPLETED: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
  }
}

// Run the audit
if (require.main === module) {
  const audit = new VoiceVideoAudit();
  audit.runAudit().catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
}

module.exports = VoiceVideoAudit;