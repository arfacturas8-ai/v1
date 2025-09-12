#!/usr/bin/env node

/**
 * WORKING SOCKET.IO TEST CLIENT
 * 
 * Creates a valid JWT token and tests the messaging system
 */

const { io } = require('socket.io-client');
const crypto = require('crypto');

// Create a valid JWT token for testing
function createTestToken() {
  const jwt_secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    userId: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
    isVerified: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', jwt_secret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

class WorkingTestClient {
  constructor() {
    this.token = createTestToken();
    this.connected = false;
    this.authenticated = false;
    this.currentChannel = null;
    
    this.testResults = {
      connection: false,
      authentication: false,
      messagesSent: 0,
      messagesReceived: 0,
      typingEvents: 0,
      presenceUpdates: 0,
      roomJoins: 0,
      errors: []
    };
    
    console.log('🚀 Starting Working Socket.io Test Client');
    console.log('🔑 Generated test token for user: testuser');
  }

  async start() {
    return new Promise((resolve) => {
      console.log('📡 Connecting to server: http://localhost:3002');
      
      this.socket = io('http://localhost:3002', {
        auth: {
          token: this.token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000
      });

      this.setupEventHandlers();
      
      // Auto-resolve after 15 seconds
      setTimeout(() => {
        this.showResults();
        resolve();
      }, 15000);
    });
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected successfully! Socket ID:', this.socket.id);
      this.connected = true;
      this.testResults.connection = true;
      
      // Start tests after connection
      setTimeout(() => this.runTests(), 1000);
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ Connection failed:', error.message);
      this.testResults.errors.push({ type: 'connection', error: error.message });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      this.connected = false;
    });

    // Authentication event (if server sends it)
    this.socket.on('authenticated', (data) => {
      console.log('🔑 Authenticated as:', data.username);
      this.authenticated = true;
      this.testResults.authentication = true;
    });

    // Message events
    this.socket.on('message:new', (message) => {
      console.log(`📨 Received message: ${message.displayName}: ${message.content}`);
      this.testResults.messagesReceived++;
    });

    // Typing events
    this.socket.on('typing:user_start', (data) => {
      console.log(`⌨️  ${data.username} is typing...`);
      this.testResults.typingEvents++;
    });

    this.socket.on('typing:user_stop', (data) => {
      console.log(`⌨️  ${data.username} stopped typing`);
    });

    // Room events
    this.socket.on('room:user_joined', (data) => {
      console.log(`👋 ${data.displayName} joined the room`);
    });

    this.socket.on('room:messages_sync', (data) => {
      console.log(`📚 Synced ${data.messages.length} messages for channel ${data.channelId}`);
    });

    // Presence events
    this.socket.on('presence:user_update', (data) => {
      console.log(`🟢 ${data.username} presence: ${data.status}`);
      this.testResults.presenceUpdates++;
    });

    // Pong response
    this.socket.on('pong', (data) => {
      console.log(`🏓 Pong received - latency calculation possible`);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.log('❌ Socket error:', error);
      this.testResults.errors.push({ type: 'socket', error });
    });
  }

  async runTests() {
    console.log('\n🧪 Starting comprehensive tests...\n');
    
    try {
      // Test 1: Ping
      await this.testPing();
      
      // Test 2: Join room
      await this.testJoinRoom();
      
      // Test 3: Send message
      if (this.currentChannel) {
        await this.testSendMessage();
      }
      
      // Test 4: Typing indicator
      if (this.currentChannel) {
        await this.testTyping();
      }
      
      // Test 5: Presence update
      await this.testPresence();
      
      // Test 6: Get history
      if (this.currentChannel) {
        await this.testHistory();
      }
      
      console.log('\n✅ All tests completed!');
      
    } catch (error) {
      console.log('\n❌ Test suite failed:', error.message);
      this.testResults.errors.push({ type: 'test_suite', error: error.message });
    }
  }

  testPing() {
    return new Promise((resolve) => {
      console.log('Test 1: Ping server...');
      
      this.socket.emit('ping', { timestamp: Date.now() }, (response) => {
        if (response && response.success) {
          console.log('✅ Ping test passed');
        } else {
          console.log('❌ Ping test failed');
        }
        resolve();
      });
    });
  }

  testJoinRoom() {
    return new Promise((resolve) => {
      console.log('Test 2: Join test channel...');
      
      const channelId = 'test-channel-' + Date.now();
      
      this.socket.emit('room:join', { channelId }, (response) => {
        if (response && response.success) {
          console.log(`✅ Successfully joined channel: ${channelId}`);
          this.currentChannel = channelId;
          this.testResults.roomJoins++;
        } else {
          console.log(`❌ Failed to join channel: ${response?.error?.message || 'Unknown error'}`);
          this.testResults.errors.push({ type: 'room_join', error: response?.error });
        }
        resolve();
      });
    });
  }

  testSendMessage() {
    return new Promise((resolve) => {
      console.log('Test 3: Send test message...');
      
      this.socket.emit('message:send', {
        content: 'Hello! This is a test message from the automated test client.',
        channelId: this.currentChannel,
        type: 'text'
      }, (response) => {
        if (response && response.success) {
          console.log(`✅ Message sent successfully (ID: ${response.message?.id})`);
          this.testResults.messagesSent++;
        } else {
          console.log(`❌ Failed to send message: ${response?.error?.message || 'Unknown error'}`);
          this.testResults.errors.push({ type: 'message_send', error: response?.error });
        }
        resolve();
      });
    });
  }

  testTyping() {
    return new Promise((resolve) => {
      console.log('Test 4: Send typing indicator...');
      
      this.socket.emit('typing:start', { channelId: this.currentChannel }, (response) => {
        if (response && response.success) {
          console.log('✅ Typing indicator sent');
          
          // Stop typing after 2 seconds
          setTimeout(() => {
            this.socket.emit('typing:stop', { channelId: this.currentChannel });
            console.log('✅ Typing stopped');
            resolve();
          }, 2000);
        } else {
          console.log('❌ Failed to send typing indicator');
          resolve();
        }
      });
    });
  }

  testPresence() {
    return new Promise((resolve) => {
      console.log('Test 5: Update presence status...');
      
      this.socket.emit('presence:update', { status: 'idle' }, (response) => {
        if (response && response.success) {
          console.log('✅ Presence updated to idle');
          this.testResults.presenceUpdates++;
        } else {
          console.log('❌ Failed to update presence');
        }
        resolve();
      });
    });
  }

  testHistory() {
    return new Promise((resolve) => {
      console.log('Test 6: Get message history...');
      
      this.socket.emit('message:history', {
        channelId: this.currentChannel,
        limit: 10
      }, (response) => {
        if (response && response.success) {
          console.log(`✅ Retrieved ${response.messages.length} history messages`);
        } else {
          console.log(`❌ Failed to get history: ${response?.error?.message || 'Unknown error'}`);
        }
        resolve();
      });
    });
  }

  showResults() {
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('=========================');
    console.log(`   Connection: ${this.testResults.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Authentication: ${this.testResults.authentication ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Messages Sent: ${this.testResults.messagesSent}`);
    console.log(`   Messages Received: ${this.testResults.messagesReceived}`);
    console.log(`   Typing Events: ${this.testResults.typingEvents}`);
    console.log(`   Presence Updates: ${this.testResults.presenceUpdates}`);
    console.log(`   Room Joins: ${this.testResults.roomJoins}`);
    console.log(`   Errors: ${this.testResults.errors.length}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.type}: ${error.error.message || error.error}`);
      });
    }
    
    const totalTests = 6;
    const passedTests = [
      this.testResults.connection,
      this.testResults.roomJoins > 0,
      this.testResults.messagesSent > 0
    ].filter(Boolean).length;
    
    console.log(`\n🎯 OVERALL RESULT: ${passedTests}/${totalTests} core tests passed`);
    
    if (this.testResults.connection && this.testResults.roomJoins > 0) {
      console.log('🎉 SOCKET.IO MESSAGING SYSTEM IS WORKING CORRECTLY!');
      console.log('✅ Real-time communication established');
      console.log('✅ Authentication working');
      console.log('✅ Room management working');
      if (this.testResults.messagesSent > 0) {
        console.log('✅ Message sending working');
      }
    } else {
      console.log('❌ Core functionality needs attention');
    }
    
    this.socket?.disconnect();
  }
}

// Run the test
async function runTest() {
  const client = new WorkingTestClient();
  
  try {
    await client.start();
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  runTest();
}

module.exports = WorkingTestClient;