#!/usr/bin/env node

/**
 * SIMPLE REAL-TIME SYSTEMS TEST FOR CRYB PLATFORM
 * 
 * This script tests the real-time communication systems without external dependencies
 */

const io = require('socket.io-client');
const http = require('http');
const https = require('https');
const Redis = require('ioredis');

// Configuration - Updated to use correct port
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3002';
const REDIS_URL = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';

class SimpleRealtimeTest {
  constructor() {
    this.results = {
      apiServer: 'unknown',
      redisConnection: 'unknown',
      socketConnection: 'unknown',
      realTimeMessaging: 'unknown',
      presenceTracking: 'unknown',
      typingIndicators: 'unknown',
      voiceChannels: 'unknown'
    };
    
    this.socket = null;
    this.redis = null;
    this.testToken = null;
  }

  async execute() {
    console.log('\n🚀 SIMPLE REAL-TIME SYSTEMS TEST');
    console.log('=================================\n');
    
    try {
      await this.testAPIServer();
      await this.testRedisConnection();
      await this.setupTestAuthentication();
      await this.testSocketConnection();
      await this.testRealTimeFeatures();
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  async testAPIServer() {
    console.log('🌐 Testing API Server...');
    
    try {
      const data = await this.makeHttpRequest('/health');
      if (data && (data.includes('healthy') || data.includes('api'))) {
        console.log('✅ API Server is running');
        this.results.apiServer = 'healthy';
      } else {
        console.log('⚠️  API Server responded but health status unclear');
        this.results.apiServer = 'degraded';
      }
    } catch (error) {
      console.log('❌ API Server not accessible:', error.message);
      this.results.apiServer = 'unhealthy';
    }
  }

  async testRedisConnection() {
    console.log('📡 Testing Redis Connection...');
    
    try {
      this.redis = new Redis(REDIS_URL);
      const result = await this.redis.ping();
      
      if (result === 'PONG') {
        console.log('✅ Redis connection successful');
        this.results.redisConnection = 'healthy';
      } else {
        console.log('⚠️  Redis connection unclear');
        this.results.redisConnection = 'degraded';
      }
    } catch (error) {
      console.log('❌ Redis connection failed:', error.message);
      this.results.redisConnection = 'unhealthy';
    }
  }

  async setupTestAuthentication() {
    console.log('🔐 Setting up test authentication...');
    
    // Use a mock token for testing
    this.testToken = 'test-token-for-realtime-testing';
    console.log('⚠️  Using mock authentication token');
  }

  async testSocketConnection() {
    console.log('🔌 Testing Socket.IO Connection...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('❌ Socket.IO connection timeout');
        this.results.socketConnection = 'timeout';
        resolve();
      }, 10000);
      
      this.socket = io(SOCKET_URL, {
        auth: {
          token: this.testToken
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });
      
      this.socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket.IO connection successful');
        this.results.socketConnection = 'healthy';
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.log('❌ Socket.IO connection failed:', error.message);
        this.results.socketConnection = 'unhealthy';
        resolve();
      });
      
      this.socket.on('error', (error) => {
        console.log('⚠️  Socket.IO error:', error.message);
      });
    });
  }

  async testRealTimeFeatures() {
    if (!this.socket || !this.socket.connected) {
      console.log('⚠️  Skipping real-time feature tests - no socket connection');
      return;
    }
    
    console.log('⚡ Testing Real-time Features...');
    
    // Test messaging
    await this.testMessaging();
    
    // Test presence tracking
    await this.testPresence();
    
    // Test typing indicators
    await this.testTyping();
    
    // Test voice channels
    await this.testVoice();
  }

  async testMessaging() {
    console.log('💬 Testing real-time messaging...');
    
    return new Promise((resolve) => {
      let messageReceived = false;
      
      // Set up message listener
      this.socket.on('message:new', (message) => {
        console.log('✅ Message received successfully');
        messageReceived = true;
        this.results.realTimeMessaging = 'healthy';
        resolve();
      });
      
      // Send test message
      this.socket.emit('message:send', {
        channelId: 'test-channel',
        content: 'Test message from real-time audit',
        timestamp: Date.now()
      }, (response) => {
        if (response && response.success) {
          console.log('✅ Message sent successfully');
        } else {
          console.log('⚠️  Message send response unclear');
        }
      });
      
      // Timeout if no response
      setTimeout(() => {
        if (!messageReceived) {
          console.log('⚠️  Message test timeout - no message received');
          this.results.realTimeMessaging = 'timeout';
          resolve();
        }
      }, 3000);
    });
  }

  async testPresence() {
    console.log('👥 Testing presence tracking...');
    
    return new Promise((resolve) => {
      let presenceReceived = false;
      
      // Set up presence listener
      this.socket.on('presence:update', (presence) => {
        console.log('✅ Presence update received');
        presenceReceived = true;
        this.results.presenceTracking = 'healthy';
        resolve();
      });
      
      // Send presence update
      this.socket.emit('presence:update', {
        status: 'online',
        activity: {
          type: 'testing',
          name: 'Real-time system audit'
        },
        timestamp: Date.now()
      });
      
      // Timeout
      setTimeout(() => {
        if (!presenceReceived) {
          console.log('⚠️  Presence test timeout');
          this.results.presenceTracking = 'timeout';
          resolve();
        }
      }, 2000);
    });
  }

  async testTyping() {
    console.log('⌨️  Testing typing indicators...');
    
    return new Promise((resolve) => {
      let typingReceived = false;
      
      // Set up typing listener
      this.socket.on('typing:start', (data) => {
        console.log('✅ Typing indicator received');
        typingReceived = true;
        this.results.typingIndicators = 'healthy';
        resolve();
      });
      
      // Send typing indicator
      this.socket.emit('typing:start', {
        channelId: 'test-channel',
        timestamp: Date.now()
      });
      
      // Timeout
      setTimeout(() => {
        if (!typingReceived) {
          console.log('⚠️  Typing indicator test timeout');
          this.results.typingIndicators = 'timeout';
          resolve();
        }
      }, 2000);
    });
  }

  async testVoice() {
    console.log('🎙️  Testing voice channels...');
    
    return new Promise((resolve) => {
      let voiceResponseReceived = false;
      
      // Set up voice listeners
      this.socket.on('voice:joined', (data) => {
        console.log('✅ Voice channel join successful');
        voiceResponseReceived = true;
        this.results.voiceChannels = 'healthy';
        resolve();
      });
      
      this.socket.on('voice:error', (error) => {
        console.log('⚠️  Voice channel error:', error.message);
        voiceResponseReceived = true;
        this.results.voiceChannels = 'error';
        resolve();
      });
      
      // Join voice channel
      this.socket.emit('voice:join', {
        channelId: 'test-voice-channel',
        capabilities: {
          audio: true,
          video: false,
          screenShare: false
        }
      });
      
      // Timeout
      setTimeout(() => {
        if (!voiceResponseReceived) {
          console.log('⚠️  Voice channel test timeout');
          this.results.voiceChannels = 'timeout';
          resolve();
        }
      }, 3000);
    });
  }

  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================\n');
    
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️ ',
      unhealthy: '❌',
      timeout: '⏰',
      error: '🔴',
      unknown: '❓'
    };
    
    console.log('INFRASTRUCTURE:');
    console.log(`  API Server: ${statusEmoji[this.results.apiServer]} ${this.results.apiServer}`);
    console.log(`  Redis Connection: ${statusEmoji[this.results.redisConnection]} ${this.results.redisConnection}`);
    console.log(`  Socket.IO Connection: ${statusEmoji[this.results.socketConnection]} ${this.results.socketConnection}`);
    
    console.log('\nREAL-TIME FEATURES:');
    console.log(`  Real-time Messaging: ${statusEmoji[this.results.realTimeMessaging]} ${this.results.realTimeMessaging}`);
    console.log(`  Presence Tracking: ${statusEmoji[this.results.presenceTracking]} ${this.results.presenceTracking}`);
    console.log(`  Typing Indicators: ${statusEmoji[this.results.typingIndicators]} ${this.results.typingIndicators}`);
    console.log(`  Voice Channels: ${statusEmoji[this.results.voiceChannels]} ${this.results.voiceChannels}`);
    
    // Calculate overall health
    const healthyCount = Object.values(this.results).filter(status => status === 'healthy').length;
    const totalCount = Object.keys(this.results).length;
    const healthPercentage = (healthyCount / totalCount) * 100;
    
    console.log(`\nOVERALL HEALTH: ${healthPercentage.toFixed(1)}% (${healthyCount}/${totalCount} systems healthy)`);
    
    if (healthPercentage >= 80) {
      console.log('🎉 Real-time systems are functioning well!');
    } else if (healthPercentage >= 60) {
      console.log('⚠️  Some real-time systems need attention');
    } else {
      console.log('❌ Critical issues with real-time systems detected');
    }
    
    console.log('\n✅ SIMPLE REAL-TIME TEST COMPLETED\n');
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.redis) {
      await this.redis.quit().catch(() => {});
    }
    
    console.log('✅ Cleanup completed');
  }

  // Simple HTTP request helper using built-in modules
  makeHttpRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(API_BASE_URL + path);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'RealTimeTest/1.0'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }
}

// Execute test if run directly
if (require.main === module) {
  const test = new SimpleRealtimeTest();
  test.execute().catch(console.error);
}

module.exports = { SimpleRealtimeTest };
