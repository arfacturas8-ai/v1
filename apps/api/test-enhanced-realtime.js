#!/usr/bin/env node

/**
 * COMPREHENSIVE REAL-TIME FEATURE TEST
 * 
 * This test script validates all the enhanced real-time features:
 * - Socket.io connection stability
 * - Message delivery with acknowledgments
 * - Presence tracking
 * - Typing indicators
 * - Notifications
 * - Voice channel management
 * - Race condition handling
 * - Performance under load
 */

const { io } = require('socket.io-client');
// Simple color functions
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`, 
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  white: (s) => s
};

const API_URL = 'http://localhost:3002';

// Test configuration
const TEST_CONFIG = {
  users: 3,
  messagesPerUser: 10,
  typingInterval: 2000,
  presenceInterval: 5000,
  testDuration: 30000, // 30 seconds
};

// Mock JWT token for testing (replace with actual token)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSIsInVzZXJuYW1lIjoidGVzdHVzZXIxIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE4MDAwMDAwMDB9.test';

class RealtimeFeatureTester {
  constructor() {
    this.clients = [];
    this.results = {
      connectionSuccess: 0,
      connectionFailures: 0,
      messagesSent: 0,
      messagesReceived: 0,
      typingEventsSent: 0,
      typingEventsReceived: 0,
      presenceUpdates: 0,
      notificationsReceived: 0,
      errors: [],
      averageLatency: 0,
      latencyMeasurements: []
    };
    this.startTime = Date.now();
    this.testChannelId = 'test-channel-' + Date.now();
  }

  log(message, color = 'white') {
    const timestamp = new Date().toISOString();
    const colorFn = colors[color] || ((s) => s);
    console.log(`[${timestamp}] ${colorFn(message)}`);
  }

  async runAllTests() {
    this.log('🚀 Starting Enhanced Real-time Feature Test Suite', 'cyan');
    
    try {
      // Test 1: Connection Stability
      await this.testConnectionStability();
      
      // Test 2: Authentication
      await this.testAuthentication();
      
      // Test 3: Message Delivery
      await this.testMessageDelivery();
      
      // Test 4: Presence Tracking
      await this.testPresenceTracking();
      
      // Test 5: Typing Indicators
      await this.testTypingIndicators();
      
      // Test 6: Notifications
      await this.testNotifications();
      
      // Test 7: Voice Channel Features
      await this.testVoiceChannels();
      
      // Test 8: Race Conditions
      await this.testRaceConditions();
      
      // Test 9: Load Testing
      await this.testLoadHandling();
      
      // Test 10: Error Recovery
      await this.testErrorRecovery();
      
      // Generate final report
      this.generateReport();
      
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Test Suite',
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      await this.cleanup();
    }
  }

  async testConnectionStability() {
    this.log('🔌 Testing Socket.io Connection Stability...', 'blue');
    
    try {
      const promises = [];
      
      for (let i = 0; i < TEST_CONFIG.users; i++) {
        promises.push(this.createTestClient(`test-user-${i + 1}`));
      }
      
      const clients = await Promise.all(promises);
      this.clients = clients;
      
      // Wait for all connections to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const connectedCount = this.clients.filter(c => c.connected).length;
      this.results.connectionSuccess = connectedCount;
      this.results.connectionFailures = TEST_CONFIG.users - connectedCount;
      
      if (connectedCount === TEST_CONFIG.users) {
        this.log(`✅ All ${TEST_CONFIG.users} clients connected successfully`, 'green');
      } else {
        this.log(`⚠️ Only ${connectedCount}/${TEST_CONFIG.users} clients connected`, 'yellow');
      }
      
    } catch (error) {
      this.log(`❌ Connection test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Connection Stability',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testAuthentication() {
    this.log('🔒 Testing Authentication...', 'blue');
    
    try {
      // Test valid authentication
      const client = await this.createTestClient('auth-test-user', TEST_TOKEN);
      
      await new Promise((resolve) => {
        client.on('ready', (data) => {
          this.log('✅ Authentication successful', 'green');
          this.log(`   User ID: ${data.userId}`, 'cyan');
          this.log(`   Session ID: ${data.sessionId}`, 'cyan');
          resolve();
        });
        
        setTimeout(() => {
          this.log('❌ Authentication timeout', 'red');
          resolve();
        }, 5000);
      });
      
      client.disconnect();
      
      // Test invalid authentication
      try {
        const invalidClient = await this.createTestClient('invalid-user', 'invalid-token');
        this.log('❌ Invalid authentication should have failed', 'red');
        invalidClient.disconnect();
      } catch (error) {
        this.log('✅ Invalid authentication properly rejected', 'green');
      }
      
    } catch (error) {
      this.log(`❌ Authentication test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Authentication',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testMessageDelivery() {
    this.log('💬 Testing Message Delivery...', 'blue');
    
    if (this.clients.length === 0) {
      this.log('⚠️ No clients available for message test', 'yellow');
      return;
    }
    
    try {
      // Set up message listeners
      this.clients.forEach((client, index) => {
        client.on('message:new', (message) => {
          this.results.messagesReceived++;
          const latency = Date.now() - message.timestamp;
          if (!isNaN(latency) && latency > 0) {
            this.results.latencyMeasurements.push(latency);
          }
          this.log(`📨 Client ${index + 1} received message: "${message.content}" (${latency}ms)`, 'cyan');
        });
        
        // Join test channel
        client.emit('channel:join', { channelId: this.testChannelId }, (response) => {
          if (response?.success) {
            this.log(`✅ Client ${index + 1} joined channel`, 'green');
          } else {
            this.log(`❌ Client ${index + 1} failed to join channel: ${response?.error}`, 'red');
          }
        });
      });
      
      // Wait for channel joins
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send test messages
      for (let i = 0; i < TEST_CONFIG.messagesPerUser; i++) {
        for (let clientIndex = 0; clientIndex < this.clients.length; clientIndex++) {
          const client = this.clients[clientIndex];
          const message = {
            channelId: this.testChannelId,
            content: `Test message ${i + 1} from user ${clientIndex + 1}`,
            timestamp: Date.now()
          };
          
          client.emit('message:send', message, (ack) => {
            if (ack?.success) {
              this.results.messagesSent++;
              this.log(`✅ Message sent successfully: ${message.content}`, 'green');
            } else {
              this.log(`❌ Message failed: ${ack?.error}`, 'red');
              this.results.errors.push({
                test: 'Message Delivery',
                error: ack?.error || 'Unknown error',
                timestamp: new Date()
              });
            }
          });
          
          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const deliveryRate = (this.results.messagesReceived / this.results.messagesSent * 100).toFixed(2);
      this.log(`📊 Message delivery rate: ${deliveryRate}% (${this.results.messagesReceived}/${this.results.messagesSent})`, 'cyan');
      
    } catch (error) {
      this.log(`❌ Message delivery test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Message Delivery',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testPresenceTracking() {
    this.log('🟢 Testing Presence Tracking...', 'blue');
    
    if (this.clients.length === 0) {
      this.log('⚠️ No clients available for presence test', 'yellow');
      return;
    }
    
    try {
      // Set up presence listeners
      this.clients.forEach((client, index) => {
        client.on('presence:update', (presence) => {
          this.results.presenceUpdates++;
          this.log(`👤 Client ${index + 1} received presence update: ${presence.userId} is ${presence.status}`, 'cyan');
        });
      });
      
      // Test different presence states
      const states = ['online', 'idle', 'dnd', 'offline'];
      
      for (const state of states) {
        for (let i = 0; i < this.clients.length; i++) {
          const client = this.clients[i];
          
          client.emit('presence:update', {
            status: state,
            activity: {
              type: 'playing',
              name: 'Test Game',
              details: 'Testing presence'
            },
            customStatus: `Testing ${state} status`
          });
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Wait for presence propagation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.log(`📊 Presence updates processed: ${this.results.presenceUpdates}`, 'cyan');
      
    } catch (error) {
      this.log(`❌ Presence tracking test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Presence Tracking',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testTypingIndicators() {
    this.log('⌨️ Testing Typing Indicators...', 'blue');
    
    if (this.clients.length === 0) {
      this.log('⚠️ No clients available for typing test', 'yellow');
      return;
    }
    
    try {
      // Set up typing listeners
      this.clients.forEach((client, index) => {
        client.on('typing:start', (data) => {
          this.results.typingEventsReceived++;
          this.log(`⌨️ Client ${index + 1} received typing start: ${data.username} in ${data.channelId}`, 'cyan');
        });
        
        client.on('typing:stop', (data) => {
          this.results.typingEventsReceived++;
          this.log(`⌨️ Client ${index + 1} received typing stop: ${data.userId} in ${data.channelId}`, 'cyan');
        });
      });
      
      // Test typing indicators
      for (let i = 0; i < this.clients.length; i++) {
        const client = this.clients[i];
        
        // Start typing
        client.emit('typing:start', { channelId: this.testChannelId });
        this.results.typingEventsSent++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Stop typing
        client.emit('typing:stop', { channelId: this.testChannelId });
        this.results.typingEventsSent++;
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Wait for typing events to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.log(`📊 Typing events: ${this.results.typingEventsSent} sent, ${this.results.typingEventsReceived} received`, 'cyan');
      
    } catch (error) {
      this.log(`❌ Typing indicators test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Typing Indicators',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testNotifications() {
    this.log('🔔 Testing Notifications...', 'blue');
    
    if (this.clients.length < 2) {
      this.log('⚠️ Need at least 2 clients for notification test', 'yellow');
      return;
    }
    
    try {
      // Set up notification listeners
      this.clients.forEach((client, index) => {
        client.on('notification:new', (notification) => {
          this.results.notificationsReceived++;
          this.log(`🔔 Client ${index + 1} received notification: ${notification.title}`, 'cyan');
        });
        
        client.on('message:mention', (data) => {
          this.results.notificationsReceived++;
          this.log(`📢 Client ${index + 1} received mention from ${data.author.username}`, 'cyan');
        });
      });
      
      // Send messages with mentions
      const client1 = this.clients[0];
      const client2 = this.clients[1];
      
      // Client 1 mentions Client 2
      client1.emit('message:send', {
        channelId: this.testChannelId,
        content: 'Hey @test-user-2, this is a mention test!',
        mentions: ['test-user-2']
      }, (ack) => {
        if (ack?.success) {
          this.log('✅ Mention message sent successfully', 'green');
        } else {
          this.log(`❌ Mention message failed: ${ack?.error}`, 'red');
        }
      });
      
      // Wait for notifications
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test getting unread notifications
      client2.emit('notification:get_unread', {}, (response) => {
        if (response?.success) {
          this.log(`📊 Unread notifications: ${response.notifications?.length || 0}`, 'cyan');
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      this.log(`❌ Notifications test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Notifications',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testVoiceChannels() {
    this.log('🎙️ Testing Voice Channel Features...', 'blue');
    
    if (this.clients.length === 0) {
      this.log('⚠️ No clients available for voice test', 'yellow');
      return;
    }
    
    try {
      const voiceChannelId = 'test-voice-channel-' + Date.now();
      
      // Set up voice event listeners
      this.clients.forEach((client, index) => {
        client.on('voice:user_joined', (data) => {
          this.log(`🎙️ Client ${index + 1} received voice join: ${data.username}`, 'cyan');
        });
        
        client.on('voice:user_left', (data) => {
          this.log(`🎙️ Client ${index + 1} received voice leave: ${data.userId}`, 'cyan');
        });
        
        client.on('voice:state_update', (data) => {
          this.log(`🎙️ Client ${index + 1} received voice state update: ${data.userId}`, 'cyan');
        });
      });
      
      // Test joining voice channel
      for (let i = 0; i < Math.min(2, this.clients.length); i++) {
        const client = this.clients[i];
        
        client.emit('voice:join', { channelId: voiceChannelId }, (response) => {
          if (response?.success) {
            this.log(`✅ Client ${i + 1} joined voice channel`, 'green');
          } else {
            this.log(`❌ Client ${i + 1} failed to join voice: ${response?.error}`, 'red');
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Test voice state updates
      if (this.clients.length > 0) {
        this.clients[0].emit('voice:state_update', {
          muted: true,
          deafened: false,
          speaking: false
        });
      }
      
      // Wait for voice events
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Leave voice channels
      for (let i = 0; i < Math.min(2, this.clients.length); i++) {
        this.clients[i].emit('voice:leave');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      this.log(`❌ Voice channels test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Voice Channels',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testRaceConditions() {
    this.log('⚡ Testing Race Condition Handling...', 'blue');
    
    if (this.clients.length < 2) {
      this.log('⚠️ Need at least 2 clients for race condition test', 'yellow');
      return;
    }
    
    try {
      // Simulate rapid concurrent actions
      const promises = [];
      const raceChannelId = 'race-test-' + Date.now();
      
      // All clients join the same channel simultaneously
      for (const client of this.clients) {
        promises.push(
          new Promise(resolve => {
            client.emit('channel:join', { channelId: raceChannelId }, resolve);
          })
        );
      }
      
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Rapid message sending
      const rapidMessages = [];
      for (let i = 0; i < 10; i++) {
        for (const client of this.clients) {
          rapidMessages.push(
            new Promise(resolve => {
              client.emit('message:send', {
                channelId: raceChannelId,
                content: `Rapid message ${i} from ${client.id}`
              }, resolve);
            })
          );
        }
      }
      
      await Promise.all(rapidMessages);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simultaneous typing
      const typingPromises = this.clients.map(client => 
        new Promise(resolve => {
          client.emit('typing:start', { channelId: raceChannelId });
          setTimeout(() => {
            client.emit('typing:stop', { channelId: raceChannelId });
            resolve();
          }, 1000);
        })
      );
      
      await Promise.all(typingPromises);
      
      this.log('✅ Race condition tests completed without errors', 'green');
      
    } catch (error) {
      this.log(`❌ Race conditions test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Race Conditions',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testLoadHandling() {
    this.log('📈 Testing Load Handling...', 'blue');
    
    if (this.clients.length === 0) {
      this.log('⚠️ No clients available for load test', 'yellow');
      return;
    }
    
    try {
      const loadTestStart = Date.now();
      const loadPromises = [];
      
      // Simulate high-frequency events
      for (let i = 0; i < 100; i++) {
        for (const client of this.clients) {
          loadPromises.push(
            new Promise(resolve => {
              client.emit('presence:update', {
                status: 'online',
                activity: { type: 'playing', name: `Load test ${i}` }
              });
              setTimeout(resolve, Math.random() * 100);
            })
          );
        }
      }
      
      await Promise.all(loadPromises);
      
      const loadTestDuration = Date.now() - loadTestStart;
      this.log(`📊 Load test completed in ${loadTestDuration}ms`, 'cyan');
      
      // Test rate limiting
      let rateLimitHit = false;
      const rapidRequests = [];
      
      for (let i = 0; i < 200; i++) {
        rapidRequests.push(
          new Promise(resolve => {
            this.clients[0]?.emit('message:send', {
              channelId: this.testChannelId,
              content: `Rate limit test ${i}`
            }, (ack) => {
              if (!ack?.success && ack?.error?.includes('rate')) {
                rateLimitHit = true;
              }
              resolve();
            });
          })
        );
      }
      
      await Promise.all(rapidRequests);
      
      if (rateLimitHit) {
        this.log('✅ Rate limiting is working correctly', 'green');
      } else {
        this.log('⚠️ Rate limiting may not be working', 'yellow');
      }
      
    } catch (error) {
      this.log(`❌ Load handling test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Load Handling',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async testErrorRecovery() {
    this.log('🔧 Testing Error Recovery...', 'blue');
    
    if (this.clients.length === 0) {
      this.log('⚠️ No clients available for error recovery test', 'yellow');
      return;
    }
    
    try {
      // Test invalid operations
      const client = this.clients[0];
      
      // Try to send to non-existent channel
      client.emit('message:send', {
        channelId: 'non-existent-channel',
        content: 'This should fail'
      }, (ack) => {
        if (!ack?.success) {
          this.log('✅ Non-existent channel properly rejected', 'green');
        } else {
          this.log('❌ Invalid channel should have been rejected', 'red');
        }
      });
      
      // Try to join invalid voice channel
      client.emit('voice:join', { channelId: 'invalid-voice-channel' }, (response) => {
        if (!response?.success) {
          this.log('✅ Invalid voice channel properly rejected', 'green');
        } else {
          this.log('❌ Invalid voice channel should have been rejected', 'red');
        }
      });
      
      // Test malformed data
      client.emit('message:send', {
        channelId: this.testChannelId,
        content: 'a'.repeat(3000) // Too long
      }, (ack) => {
        if (!ack?.success) {
          this.log('✅ Oversized message properly rejected', 'green');
        } else {
          this.log('❌ Oversized message should have been rejected', 'red');
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      this.log(`❌ Error recovery test failed: ${error.message}`, 'red');
      this.results.errors.push({
        test: 'Error Recovery',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  async createTestClient(userId, token = TEST_TOKEN) {
    return new Promise((resolve, reject) => {
      const client = io(API_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });

      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout for ${userId}`));
      }, 10000);

      client.on('connect', () => {
        clearTimeout(timeout);
        this.log(`✅ Client ${userId} connected with ID: ${client.id}`, 'green');
        resolve(client);
      });

      client.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.log(`❌ Client ${userId} connection failed: ${error.message}`, 'red');
        reject(error);
      });

      client.on('error', (error) => {
        this.log(`⚠️ Client ${userId} error: ${error.message}`, 'yellow');
      });

      client.on('disconnect', (reason) => {
        this.log(`❌ Client ${userId} disconnected: ${reason}`, 'yellow');
      });
    });
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    
    // Calculate average latency
    if (this.results.latencyMeasurements.length > 0) {
      this.results.averageLatency = Math.round(
        this.results.latencyMeasurements.reduce((a, b) => a + b, 0) / 
        this.results.latencyMeasurements.length
      );
    }
    
    this.log('\n📊 ENHANCED REAL-TIME SYSTEM TEST REPORT', 'cyan');
    this.log('='.repeat(50), 'cyan');
    
    this.log(`⏱️ Test Duration: ${Math.round(duration / 1000)}s`, 'blue');
    this.log(`🔌 Connection Success Rate: ${(this.results.connectionSuccess / TEST_CONFIG.users * 100).toFixed(1)}%`, 'blue');
    this.log(`💬 Message Delivery Rate: ${(this.results.messagesReceived / this.results.messagesSent * 100).toFixed(1)}%`, 'blue');
    this.log(`⚡ Average Latency: ${this.results.averageLatency}ms`, 'blue');
    this.log(`🟢 Presence Updates: ${this.results.presenceUpdates}`, 'blue');
    this.log(`⌨️ Typing Events: ${this.results.typingEventsSent}/${this.results.typingEventsReceived}`, 'blue');
    this.log(`🔔 Notifications: ${this.results.notificationsReceived}`, 'blue');
    this.log(`❌ Total Errors: ${this.results.errors.length}`, this.results.errors.length > 0 ? 'red' : 'green');
    
    if (this.results.errors.length > 0) {
      this.log('\n❌ ERROR DETAILS:', 'red');
      this.results.errors.forEach((error, index) => {
        this.log(`${index + 1}. [${error.test}] ${error.error}`, 'red');
      });
    }
    
    // Overall assessment
    let score = 0;
    if (this.results.connectionSuccess / TEST_CONFIG.users >= 0.9) score += 20;
    if (this.results.messagesReceived / this.results.messagesSent >= 0.9) score += 30;
    if (this.results.averageLatency < 200) score += 20;
    if (this.results.presenceUpdates > 0) score += 10;
    if (this.results.typingEventsReceived > 0) score += 10;
    if (this.results.errors.length === 0) score += 10;
    
    this.log(`\n🏆 OVERALL SCORE: ${score}/100`, score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red');
    
    if (score >= 90) {
      this.log('🚀 EXCELLENT! Real-time system is performing optimally', 'green');
    } else if (score >= 70) {
      this.log('✅ GOOD! Real-time system is working well with minor issues', 'yellow');
    } else if (score >= 50) {
      this.log('⚠️ FAIR! Real-time system has some issues that need attention', 'yellow');
    } else {
      this.log('❌ POOR! Real-time system has significant issues', 'red');
    }
  }

  async cleanup() {
    this.log('🧹 Cleaning up test connections...', 'blue');
    
    for (const client of this.clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    
    this.clients = [];
    this.log('✅ Cleanup completed', 'green');
  }
}

// Run the tests
async function main() {
  const tester = new RealtimeFeatureTester();
  await tester.runAllTests();
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}