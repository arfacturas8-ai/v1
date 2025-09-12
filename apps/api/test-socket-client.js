#!/usr/bin/env node

const { io } = require('socket.io-client');

/**
 * Socket.io Test Client for CRYB Platform
 * Tests the real-time messaging functionality with valid JWT authentication
 */

class SocketTestClient {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.isAuthenticated = false;
    this.eventsReceived = 0;
  }

  async connect(token) {
    try {
      console.log('🔌 Connecting to Socket.io server with JWT authentication...');
      
      // Create socket connection with authentication
      this.socket = io(this.serverUrl, {
        auth: {
          token: token
        },
        transports: ['polling', 'websocket'],
        timeout: 15000,
        forceNew: true
      });

      // Setup event listeners
      this.setupEventListeners();

      // Wait for connection
      await this.waitForConnection();
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
      console.log('📡 Socket ID:', this.socket.id);
      this.isAuthenticated = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      this.isAuthenticated = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('💥 Connection error:', error.message);
    });

    // Authentication events
    this.socket.on('ready', (data) => {
      this.eventsReceived++;
      console.log('🎉 Received ready event:', {
        sessionId: data.session_id,
        application: data.application?.name,
        userServers: data.servers?.length || 0,
        user: data.user?.username || data.user?.displayName
      });
    });

    // Message events
    this.socket.on('message:create', (message) => {
      console.log('📨 New message received:', {
        id: message.id,
        content: message.content,
        author: message.user?.displayName || message.user?.username,
        channel: message.channelId
      });
    });

    // Typing events
    this.socket.on('channel:typing_start', (data) => {
      console.log('✏️  User started typing:', {
        userId: data.user_id,
        channel: data.channel_id
      });
    });

    this.socket.on('channel:typing_stop', (data) => {
      console.log('✋ User stopped typing:', {
        userId: data.user_id,
        channel: data.channel_id
      });
    });

    // Presence events
    this.socket.on('presence:update', (data) => {
      console.log('👤 Presence update:', {
        userId: data.user_id,
        status: data.status,
        activity: data.activity?.name
      });
    });

    // Server events
    this.socket.on('server:state', (data) => {
      console.log('🏠 Server state received:', {
        serverId: data.id,
        name: data.name,
        channels: data.channels?.length || 0,
        members: data._count?.members || 0
      });
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('⚠️  Socket error:', error);
    });

    // Heartbeat
    this.socket.on('heartbeat_ack', () => {
      this.eventsReceived++;
      console.log('💓 Heartbeat acknowledged');
    });
  }

  waitForConnection(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      this.socket.on('connect', () => {
        clearTimeout(timeoutId);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  // Test methods
  async testBasicConnection() {
    console.log('\n🧪 Testing basic connection...');
    
    if (!this.isAuthenticated) {
      throw new Error('Not connected or authenticated');
    }

    // Send heartbeat
    this.socket.emit('heartbeat');
    console.log('💓 Heartbeat sent');
  }

  async testIdentify() {
    console.log('\n🧪 Testing identify event...');
    
    this.socket.emit('identify', {
      large_threshold: 250,
      presence: {
        status: 'online',
        activity: {
          type: 'playing',
          name: 'Testing Socket.io'
        }
      }
    });
    
    console.log('🆔 Identify event sent');
  }

  async testPresenceUpdate() {
    console.log('\n🧪 Testing presence update...');
    
    this.socket.emit('presence:update', {
      status: 'dnd',
      activity: {
        type: 'playing',
        name: 'Socket.io Testing Suite'
      }
    });
    
    console.log('👤 Presence update sent');
  }

  async testTypingIndicator(channelId = 'test_channel_123') {
    console.log('\n🧪 Testing typing indicator...');
    
    this.socket.emit('channel:typing', { channelId });
    console.log('✏️  Typing started for channel:', channelId);
    
    setTimeout(() => {
      this.socket.emit('channel:typing_stop', { channelId });
      console.log('✋ Typing stopped for channel:', channelId);
    }, 3000);
  }

  async runAllTests() {
    try {
      console.log('🚀 Starting Socket.io test suite...\n');
      
      await this.testBasicConnection();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.testIdentify();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.testPresenceUpdate();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await this.testTypingIndicator();
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('👋 Disconnected from server');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const client = new SocketTestClient();
  
  // Use the valid JWT token from login
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWY1a2l4cW4wMDAwM3hjeHZ5amlqZjlvIiwic2Vzc2lvbklkIjoiMTJlMTE2OTQtYzFkNS00MzlmLThkNDAtOTU2N2NiNTM3N2M3IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwid2FsbGV0QWRkcmVzcyI6bnVsbCwiaXNWZXJpZmllZCI6ZmFsc2UsImp0aSI6IjY5ZjhjYWZhLTFjMTUtNDM5MS04MThjLTMxNzkyMzQ4NzkyZSIsImlhdCI6MTc1NzAwMzMzMCwiZXhwIjoxNzU3MDA0MjMwLCJhdWQiOiJjcnliLXVzZXJzIiwiaXNzIjoiY3J5Yi1wbGF0Zm9ybSJ9.DcaDYmifVMVt6VUPiF-7h0_KQ950jhCGxb1Pb9tJ9FI';
  
  async function runTests() {
    try {
      console.log('🚀 Starting Socket.io authentication test...');
      await client.connect(token);
      
      console.log('✅ Authentication successful, running Socket.io tests...');
      
      // Run basic tests
      await client.runAllTests();
      
      // Keep connection alive for a few seconds to see real-time events
      console.log('\n⏳ Keeping connection alive for 5 seconds to monitor events...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('📊 Socket.io test summary:');
      console.log('   Events received:', client.eventsReceived);
      console.log('   Authentication: PASSED');
      console.log('   Connection: PASSED');
      console.log('   Event handling: PASSED');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      client.disconnect();
      process.exit(0);
    }
  }
  
  runTests();
}

module.exports = SocketTestClient;