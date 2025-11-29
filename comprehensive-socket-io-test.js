#!/usr/bin/env node

/**
 * COMPREHENSIVE SOCKET.IO AND REAL-TIME TESTING
 * 
 * This script tests WebSocket/Socket.IO functionality in detail
 */

const io = require('socket.io-client');
const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3002';
const SOCKET_URL = 'http://localhost:3002';

class SocketIOTester {
  constructor() {
    this.socket = null;
    this.authToken = null;
    this.results = {
      timestamp: new Date().toISOString(),
      socketTests: {},
      realTimeTests: {},
      performanceMetrics: {},
      summary: {}
    };
  }

  async makeAuthenticatedRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        error: error.message,
        data: error.response?.data || null
      };
    }
  }

  async setupAuthentication() {
    console.log('🔐 Setting up authentication for Socket.IO tests...');
    
    // Register a test user
    const timestamp = Date.now();
    const userData = {
      username: `sockettest_${timestamp}`,
      displayName: `Socket Test User ${timestamp}`,
      email: `sockettest_${timestamp}@example.com`,
      password: 'SocketTest123!',
      confirmPassword: 'SocketTest123!'
    };

    const registerResult = await this.makeAuthenticatedRequest('POST', '/api/v1/auth/register', userData);
    
    if (registerResult.success) {
      console.log('✅ User registration successful');
      
      // Extract token from cookies if available
      const cookies = registerResult.headers['set-cookie'];
      if (cookies) {
        const tokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
        if (tokenCookie) {
          this.authToken = tokenCookie.split('=')[1].split(';')[0];
          console.log('✅ Auth token extracted from cookies');
        }
      }
      
      return { success: true, user: registerResult.data?.data?.user };
    } else {
      console.log('❌ Registration failed, trying with existing user...');
      
      // Try with a demo user
      const loginResult = await this.makeAuthenticatedRequest('POST', '/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginResult.success) {
        const cookies = loginResult.headers['set-cookie'];
        if (cookies) {
          const tokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
          if (tokenCookie) {
            this.authToken = tokenCookie.split('=')[1].split(';')[0];
            console.log('✅ Auth token extracted from login');
          }
        }
        return { success: true, user: loginResult.data?.data?.user };
      }
      
      return { success: false, error: 'Could not authenticate' };
    }
  }

  async testBasicSocketConnection() {
    console.log('\n🔌 Testing basic Socket.IO connection...');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Test connection without authentication first
      this.socket = io(SOCKET_URL, {
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      let resolved = false;

      this.socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          const connectionTime = Date.now() - startTime;
          console.log('✅ Socket.IO connection established');
          console.log(`🔗 Socket ID: ${this.socket.id}`);
          console.log(`⏱️  Connection time: ${connectionTime}ms`);
          
          this.results.socketTests.basicConnection = {
            success: true,
            socketId: this.socket.id,
            connectionTime,
            transport: this.socket.io.engine.transport.name
          };
          resolve(true);
        }
      });

      this.socket.on('connect_error', (error) => {
        if (!resolved) {
          resolved = true;
          console.log('❌ Socket.IO connection failed:', error.message);
          this.results.socketTests.basicConnection = {
            success: false,
            error: error.message,
            connectionTime: Date.now() - startTime
          };
          resolve(false);
        }
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('❌ Socket.IO connection timeout');
          this.results.socketTests.basicConnection = {
            success: false,
            error: 'Connection timeout',
            connectionTime: Date.now() - startTime
          };
          resolve(false);
        }
      }, 15000);
    });
  }

  async testAuthenticatedSocketConnection() {
    console.log('\n🔐 Testing authenticated Socket.IO connection...');
    
    if (!this.authToken) {
      console.log('❌ No auth token available for authenticated connection test');
      this.results.socketTests.authenticatedConnection = {
        success: false,
        error: 'No auth token available'
      };
      return false;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Disconnect previous socket if connected
      if (this.socket && this.socket.connected) {
        this.socket.disconnect();
      }

      // Connect with authentication
      this.socket = io(SOCKET_URL, {
        timeout: 10000,
        auth: {
          token: this.authToken
        },
        extraHeaders: {
          'Authorization': `Bearer ${this.authToken}`
        },
        transports: ['websocket', 'polling']
      });

      let resolved = false;

      this.socket.on('connect', () => {
        if (!resolved) {
          resolved = true;
          const connectionTime = Date.now() - startTime;
          console.log('✅ Authenticated Socket.IO connection established');
          console.log(`🔗 Authenticated Socket ID: ${this.socket.id}`);
          console.log(`⏱️  Auth connection time: ${connectionTime}ms`);
          
          this.results.socketTests.authenticatedConnection = {
            success: true,
            socketId: this.socket.id,
            connectionTime,
            transport: this.socket.io.engine.transport.name
          };
          resolve(true);
        }
      });

      this.socket.on('connect_error', (error) => {
        if (!resolved) {
          resolved = true;
          console.log('❌ Authenticated Socket.IO connection failed:', error.message);
          this.results.socketTests.authenticatedConnection = {
            success: false,
            error: error.message,
            connectionTime: Date.now() - startTime
          };
          resolve(false);
        }
      });

      this.socket.on('authenticated', (data) => {
        console.log('✅ Socket authentication confirmed:', data);
      });

      this.socket.on('authentication_error', (error) => {
        console.log('❌ Socket authentication error:', error);
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('❌ Authenticated Socket.IO connection timeout');
          this.results.socketTests.authenticatedConnection = {
            success: false,
            error: 'Connection timeout',
            connectionTime: Date.now() - startTime
          };
          resolve(false);
        }
      }, 15000);
    });
  }

  async testRealTimeMessaging() {
    console.log('\n💬 Testing real-time messaging...');
    
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No active socket connection for messaging test');
      this.results.realTimeTests.messaging = {
        success: false,
        error: 'No active socket connection'
      };
      return false;
    }

    return new Promise((resolve) => {
      const testMessage = {
        content: 'Test message from Socket.IO test suite',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      };

      let messageReceived = false;
      const startTime = Date.now();

      // Listen for message response
      this.socket.on('message_received', (data) => {
        if (data.testId === testMessage.testId) {
          messageReceived = true;
          const responseTime = Date.now() - startTime;
          console.log('✅ Real-time message received:', data);
          console.log(`⏱️  Message round-trip time: ${responseTime}ms`);
          
          this.results.realTimeTests.messaging = {
            success: true,
            responseTime,
            messageData: data
          };
          resolve(true);
        }
      });

      this.socket.on('message_error', (error) => {
        console.log('❌ Real-time message error:', error);
        this.results.realTimeTests.messaging = {
          success: false,
          error: error.message || error,
          responseTime: Date.now() - startTime
        };
        resolve(false);
      });

      // Send test message
      console.log('📤 Sending test message...');
      this.socket.emit('send_message', testMessage);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!messageReceived) {
          console.log('❌ Real-time message timeout');
          this.results.realTimeTests.messaging = {
            success: false,
            error: 'Message timeout',
            responseTime: Date.now() - startTime
          };
          resolve(false);
        }
      }, 10000);
    });
  }

  async testPresenceSystem() {
    console.log('\n👥 Testing presence system...');
    
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No active socket connection for presence test');
      this.results.realTimeTests.presence = {
        success: false,
        error: 'No active socket connection'
      };
      return false;
    }

    return new Promise((resolve) => {
      let presenceReceived = false;
      const startTime = Date.now();

      // Listen for presence updates
      this.socket.on('user_presence', (data) => {
        presenceReceived = true;
        const responseTime = Date.now() - startTime;
        console.log('✅ Presence update received:', data);
        console.log(`⏱️  Presence response time: ${responseTime}ms`);
        
        this.results.realTimeTests.presence = {
          success: true,
          responseTime,
          presenceData: data
        };
        resolve(true);
      });

      this.socket.on('presence_error', (error) => {
        console.log('❌ Presence system error:', error);
        this.results.realTimeTests.presence = {
          success: false,
          error: error.message || error,
          responseTime: Date.now() - startTime
        };
        resolve(false);
      });

      // Request presence update
      console.log('📡 Requesting presence update...');
      this.socket.emit('request_presence', { status: 'online' });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!presenceReceived) {
          console.log('❌ Presence system timeout');
          this.results.realTimeTests.presence = {
            success: false,
            error: 'Presence timeout',
            responseTime: Date.now() - startTime
          };
          resolve(false);
        }
      }, 10000);
    });
  }

  async testVoiceChannelEvents() {
    console.log('\n🎤 Testing voice channel events...');
    
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No active socket connection for voice test');
      this.results.realTimeTests.voiceChannel = {
        success: false,
        error: 'No active socket connection'
      };
      return false;
    }

    return new Promise((resolve) => {
      let voiceEventReceived = false;
      const startTime = Date.now();

      // Listen for voice events
      this.socket.on('voice_channel_update', (data) => {
        voiceEventReceived = true;
        const responseTime = Date.now() - startTime;
        console.log('✅ Voice channel event received:', data);
        console.log(`⏱️  Voice event response time: ${responseTime}ms`);
        
        this.results.realTimeTests.voiceChannel = {
          success: true,
          responseTime,
          voiceData: data
        };
        resolve(true);
      });

      this.socket.on('voice_error', (error) => {
        console.log('❌ Voice channel error:', error);
        this.results.realTimeTests.voiceChannel = {
          success: false,
          error: error.message || error,
          responseTime: Date.now() - startTime
        };
        resolve(false);
      });

      // Join a test voice channel
      console.log('🎤 Joining test voice channel...');
      this.socket.emit('join_voice_channel', { 
        channelId: 'test-voice-channel',
        userId: 'test-user'
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!voiceEventReceived) {
          console.log('❌ Voice channel timeout (this may be expected if voice is not implemented)');
          this.results.realTimeTests.voiceChannel = {
            success: false,
            error: 'Voice channel timeout - may not be implemented',
            responseTime: Date.now() - startTime
          };
          resolve(false);
        }
      }, 10000);
    });
  }

  async testSocketDisconnection() {
    console.log('\n🔌 Testing socket disconnection...');
    
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No active socket connection to disconnect');
      this.results.socketTests.disconnection = {
        success: false,
        error: 'No active socket connection'
      };
      return false;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();

      this.socket.on('disconnect', (reason) => {
        const disconnectionTime = Date.now() - startTime;
        console.log('✅ Socket disconnected cleanly:', reason);
        console.log(`⏱️  Disconnection time: ${disconnectionTime}ms`);
        
        this.results.socketTests.disconnection = {
          success: true,
          reason,
          disconnectionTime
        };
        resolve(true);
      });

      // Initiate disconnection
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();

      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('❌ Socket disconnection timeout');
        this.results.socketTests.disconnection = {
          success: false,
          error: 'Disconnection timeout',
          disconnectionTime: Date.now() - startTime
        };
        resolve(false);
      }, 5000);
    });
  }

  calculatePerformanceMetrics() {
    console.log('\n📊 Calculating performance metrics...');
    
    const connectionTimes = [];
    const responseTimes = [];

    // Collect connection times
    if (this.results.socketTests.basicConnection?.connectionTime) {
      connectionTimes.push(this.results.socketTests.basicConnection.connectionTime);
    }
    if (this.results.socketTests.authenticatedConnection?.connectionTime) {
      connectionTimes.push(this.results.socketTests.authenticatedConnection.connectionTime);
    }

    // Collect response times
    if (this.results.realTimeTests.messaging?.responseTime) {
      responseTimes.push(this.results.realTimeTests.messaging.responseTime);
    }
    if (this.results.realTimeTests.presence?.responseTime) {
      responseTimes.push(this.results.realTimeTests.presence.responseTime);
    }
    if (this.results.realTimeTests.voiceChannel?.responseTime) {
      responseTimes.push(this.results.realTimeTests.voiceChannel.responseTime);
    }

    this.results.performanceMetrics = {
      averageConnectionTime: connectionTimes.length > 0 ? 
        connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length : 0,
      averageResponseTime: responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      maxConnectionTime: connectionTimes.length > 0 ? Math.max(...connectionTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minConnectionTime: connectionTimes.length > 0 ? Math.min(...connectionTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0
    };
  }

  generateSummaryReport() {
    console.log('\n📋 Generating Socket.IO test summary...');
    
    const socketTests = Object.values(this.results.socketTests);
    const realtimeTests = Object.values(this.results.realTimeTests);
    const allTests = [...socketTests, ...realtimeTests];

    const successfulTests = allTests.filter(test => test.success).length;
    const totalTests = allTests.length;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    this.results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: successRate.toFixed(2) + '%',
      socketConnectionWorking: this.results.socketTests.basicConnection?.success || false,
      authenticatedConnectionWorking: this.results.socketTests.authenticatedConnection?.success || false,
      realTimeMessagingWorking: this.results.realTimeTests.messaging?.success || false,
      presenceSystemWorking: this.results.realTimeTests.presence?.success || false,
      voiceChannelWorking: this.results.realTimeTests.voiceChannel?.success || false
    };

    // Save detailed report
    fs.writeFileSync('socket-io-test-report.json', JSON.stringify(this.results, null, 2));

    console.log(`\n🎯 SOCKET.IO & REAL-TIME TEST RESULTS`);
    console.log(`====================================`);
    console.log(`📊 Total tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${totalTests - successfulTests}`);
    console.log(`📈 Success rate: ${successRate.toFixed(2)}%`);
    console.log(`🔌 Basic connection: ${this.results.socketTests.basicConnection?.success ? 'Working' : 'Failed'}`);
    console.log(`🔐 Authenticated connection: ${this.results.socketTests.authenticatedConnection?.success ? 'Working' : 'Failed'}`);
    console.log(`💬 Real-time messaging: ${this.results.realTimeTests.messaging?.success ? 'Working' : 'Failed'}`);
    console.log(`👥 Presence system: ${this.results.realTimeTests.presence?.success ? 'Working' : 'Failed'}`);
    console.log(`🎤 Voice channels: ${this.results.realTimeTests.voiceChannel?.success ? 'Working' : 'Failed'}`);

    if (this.results.performanceMetrics.averageConnectionTime > 0) {
      console.log(`\n⚡ Performance Metrics:`);
      console.log(`   Average connection time: ${this.results.performanceMetrics.averageConnectionTime.toFixed(2)}ms`);
      console.log(`   Average response time: ${this.results.performanceMetrics.averageResponseTime.toFixed(2)}ms`);
    }

    console.log(`\n📄 Detailed report saved to: socket-io-test-report.json`);
  }

  async run() {
    console.log('🚀 STARTING COMPREHENSIVE SOCKET.IO TESTING');
    console.log('============================================');

    try {
      // Setup authentication
      const authResult = await this.setupAuthentication();
      if (!authResult.success) {
        console.log('⚠️  Continuing without authentication...');
      }

      // Test basic socket connection
      await this.testBasicSocketConnection();

      // Test authenticated socket connection
      if (this.authToken) {
        await this.testAuthenticatedSocketConnection();
      }

      // Test real-time features
      await this.testRealTimeMessaging();
      await this.testPresenceSystem();
      await this.testVoiceChannelEvents();

      // Test disconnection
      await this.testSocketDisconnection();

      // Calculate performance metrics
      this.calculatePerformanceMetrics();

      // Generate summary
      this.generateSummaryReport();

    } catch (error) {
      console.error('❌ Critical error during Socket.IO testing:', error);
      this.results.criticalError = error.message;
      this.generateSummaryReport();
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const tester = new SocketIOTester();
  tester.run().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SocketIOTester;