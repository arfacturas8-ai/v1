const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const API_BASE = 'http://localhost:3002';
const WS_URL = 'http://localhost:3002';

// Test configuration
const testConfig = {
  apiBase: API_BASE,
  wsUrl: WS_URL,
  timeout: 10000,
  verbose: true
};

console.log('🔧 CRYB Platform Real-time Diagnostic Test');
console.log('==========================================');
console.log(`API Base: ${testConfig.apiBase}`);
console.log(`WebSocket URL: ${testConfig.wsUrl}`);
console.log('');

class RealtimeDiagnostic {
  constructor() {
    this.testResults = {
      apiConnection: false,
      socketConnection: false,
      authentication: false,
      messaging: false,
      presence: false,
      typing: false,
      crossTab: false,
      notifications: false,
      eventHandling: false
    };
    
    this.testUser = null;
    this.authToken = null;
    this.socket = null;
    this.socket2 = null; // For cross-tab testing
  }

  async runFullDiagnostic() {
    console.log('🚀 Starting comprehensive real-time diagnostic...\n');
    
    try {
      // Test 1: API Connection
      await this.testApiConnection();
      
      // Test 2: Authentication and Token Generation
      await this.testAuthentication();
      
      // Test 3: Socket.io Connection
      await this.testSocketConnection();
      
      // Test 4: Socket Authentication
      await this.testSocketAuthentication();
      
      // Test 5: Real-time Messaging
      await this.testRealtimeMessaging();
      
      // Test 6: Presence Tracking
      await this.testPresenceTracking();
      
      // Test 7: Typing Indicators
      await this.testTypingIndicators();
      
      // Test 8: Cross-tab Synchronization
      await this.testCrossTabSync();
      
      // Test 9: Live Updates for Posts/Comments
      await this.testLiveUpdates();
      
      // Test 10: Event-driven Architecture
      await this.testEventHandling();
      
      // Final Report
      this.generateReport();
      
    } catch (error) {
      console.error('💥 Diagnostic failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  async testApiConnection() {
    console.log('📡 Testing API Connection...');
    
    try {
      const response = await axios.get(`${testConfig.apiBase}/health`, {
        timeout: testConfig.timeout
      });
      
      if (response.status === 200) {
        console.log('✅ API Connection: WORKING');
        console.log(`   Status: ${response.data.status}`);
        if (response.data.checks) {
          console.log(`   Database: ${response.data.checks.database}`);
          console.log(`   Redis: ${response.data.checks.redis}`);
          console.log(`   Real-time: ${response.data.checks.realtime}`);
        }
        this.testResults.apiConnection = true;
      } else {
        console.log('❌ API Connection: FAILED');
        console.log(`   Status Code: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ API Connection: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    try {
      // Try to get or create a test user
      const testUserData = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!'
      };

      // First try to register a user
      try {
        const registerResponse = await axios.post(`${testConfig.apiBase}/api/v1/auth/register`, testUserData, {
          timeout: testConfig.timeout,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (registerResponse.data.success && registerResponse.data.tokens) {
          this.authToken = registerResponse.data.tokens.accessToken;
          this.testUser = registerResponse.data.user;
          console.log('✅ User Registration: SUCCESS');
          console.log(`   User ID: ${this.testUser.id}`);
          console.log(`   Username: ${this.testUser.username}`);
        }
      } catch (registerError) {
        // If registration fails, try login
        console.log('   Registration failed, trying login...');
        
        const loginResponse = await axios.post(`${testConfig.apiBase}/api/v1/auth/login`, {
          email: testUserData.email,
          password: testUserData.password
        }, {
          timeout: testConfig.timeout,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (loginResponse.data.success && loginResponse.data.tokens) {
          this.authToken = loginResponse.data.tokens.accessToken;
          this.testUser = loginResponse.data.user;
          console.log('✅ User Login: SUCCESS');
          console.log(`   User ID: ${this.testUser.id}`);
          console.log(`   Username: ${this.testUser.username}`);
        }
      }
      
      if (this.authToken) {
        // Verify token works
        const verifyResponse = await axios.get(`${testConfig.apiBase}/api/v1/users/profile`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: testConfig.timeout
        });
        
        if (verifyResponse.status === 200) {
          console.log('✅ Token Verification: SUCCESS');
          this.testResults.authentication = true;
        }
      }
      
    } catch (error) {
      console.log('❌ Authentication: FAILED');
      console.log(`   Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    console.log('');
  }

  async testSocketConnection() {
    console.log('🔌 Testing Socket.io Connection...');
    
    return new Promise((resolve) => {
      try {
        const socket = io(testConfig.wsUrl, {
          timeout: testConfig.timeout,
          transports: ['websocket', 'polling'],
          forceNew: true
        });

        const connectionTimeout = setTimeout(() => {
          console.log('❌ Socket Connection: TIMEOUT');
          socket.disconnect();
          resolve();
        }, testConfig.timeout);

        socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          console.log('✅ Socket Connection: SUCCESS');
          console.log(`   Socket ID: ${socket.id}`);
          console.log(`   Transport: ${socket.io.engine.transport.name}`);
          this.testResults.socketConnection = true;
          
          // Keep socket for further tests
          this.socket = socket;
          resolve();
        });

        socket.on('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          console.log('❌ Socket Connection: FAILED');
          console.log(`   Error: ${error.message}`);
          socket.disconnect();
          resolve();
        });

        socket.on('disconnect', (reason) => {
          console.log(`   Socket disconnected: ${reason}`);
        });

      } catch (error) {
        console.log('❌ Socket Connection: FAILED');
        console.log(`   Error: ${error.message}`);
        resolve();
      }
    }).then(() => {
      console.log('');
    });
  }

  async testSocketAuthentication() {
    console.log('🔑 Testing Socket Authentication...');
    
    if (!this.socket || !this.authToken) {
      console.log('❌ Socket Authentication: SKIPPED (Prerequisites failed)');
      console.log('');
      return;
    }

    return new Promise((resolve) => {
      const authTimeout = setTimeout(() => {
        console.log('❌ Socket Authentication: TIMEOUT');
        resolve();
      }, testConfig.timeout);

      // Try multiple auth methods
      this.socket.emit('authenticate', { token: this.authToken });
      
      // Also try auth in handshake
      this.socket.auth = { token: this.authToken };
      this.socket.connect();

      this.socket.on('authenticated', () => {
        clearTimeout(authTimeout);
        console.log('✅ Socket Authentication: SUCCESS');
        this.testResults.authentication = true;
        resolve();
      });

      this.socket.on('unauthorized', (error) => {
        clearTimeout(authTimeout);
        console.log('❌ Socket Authentication: FAILED');
        console.log(`   Error: ${error.message || error}`);
        resolve();
      });

      this.socket.on('ready', (data) => {
        clearTimeout(authTimeout);
        console.log('✅ Socket Authentication: SUCCESS (Ready Event)');
        console.log(`   Session ID: ${data.session_id || 'N/A'}`);
        console.log(`   User: ${data.user?.username || 'N/A'}`);
        this.testResults.authentication = true;
        resolve();
      });

    }).then(() => {
      console.log('');
    });
  }

  async testRealtimeMessaging() {
    console.log('💬 Testing Real-time Messaging...');
    
    if (!this.socket || !this.testResults.authentication) {
      console.log('❌ Real-time Messaging: SKIPPED (Prerequisites failed)');
      console.log('');
      return;
    }

    return new Promise((resolve) => {
      const msgTimeout = setTimeout(() => {
        console.log('❌ Real-time Messaging: TIMEOUT');
        resolve();
      }, testConfig.timeout);

      // Test message sending
      const testMessage = {
        channelId: 'test-channel',
        content: 'Test message from diagnostic',
        timestamp: Date.now()
      };

      this.socket.on('message:create', (message) => {
        if (message.content === testMessage.content) {
          clearTimeout(msgTimeout);
          console.log('✅ Real-time Messaging: SUCCESS');
          console.log(`   Message ID: ${message.id || 'N/A'}`);
          this.testResults.messaging = true;
          resolve();
        }
      });

      this.socket.on('message:error', (error) => {
        clearTimeout(msgTimeout);
        console.log('❌ Real-time Messaging: ERROR');
        console.log(`   Error: ${error.message || error}`);
        resolve();
      });

      // Send test message
      this.socket.emit('message:send', testMessage);

    }).then(() => {
      console.log('');
    });
  }

  async testPresenceTracking() {
    console.log('👥 Testing Presence Tracking...');
    
    if (!this.socket || !this.testResults.authentication) {
      console.log('❌ Presence Tracking: SKIPPED (Prerequisites failed)');
      console.log('');
      return;
    }

    return new Promise((resolve) => {
      const presenceTimeout = setTimeout(() => {
        console.log('❌ Presence Tracking: TIMEOUT');
        resolve();
      }, testConfig.timeout);

      this.socket.on('presence:update', (presence) => {
        if (presence.user_id === this.testUser?.id) {
          clearTimeout(presenceTimeout);
          console.log('✅ Presence Tracking: SUCCESS');
          console.log(`   Status: ${presence.status}`);
          console.log(`   Device: ${presence.device || 'N/A'}`);
          this.testResults.presence = true;
          resolve();
        }
      });

      // Update presence
      this.socket.emit('presence:update', {
        status: 'online',
        activity: {
          type: 'custom',
          name: 'Running diagnostics'
        }
      });

    }).then(() => {
      console.log('');
    });
  }

  async testTypingIndicators() {
    console.log('⌨️ Testing Typing Indicators...');
    
    if (!this.socket || !this.testResults.authentication) {
      console.log('❌ Typing Indicators: SKIPPED (Prerequisites failed)');
      console.log('');
      return;
    }

    return new Promise((resolve) => {
      const typingTimeout = setTimeout(() => {
        console.log('❌ Typing Indicators: TIMEOUT');
        resolve();
      }, testConfig.timeout);

      this.socket.on('typing:start', (data) => {
        if (data.user_id === this.testUser?.id) {
          clearTimeout(typingTimeout);
          console.log('✅ Typing Indicators: SUCCESS');
          console.log(`   Channel: ${data.channel_id}`);
          this.testResults.typing = true;
          
          // Test typing stop
          setTimeout(() => {
            this.socket.emit('typing:stop', { channelId: 'test-channel' });
          }, 1000);
          
          resolve();
        }
      });

      // Start typing
      this.socket.emit('typing:start', { channelId: 'test-channel' });

    }).then(() => {
      console.log('');
    });
  }

  async testCrossTabSync() {
    console.log('🔄 Testing Cross-tab Synchronization...');
    
    if (!this.authToken) {
      console.log('❌ Cross-tab Sync: SKIPPED (No auth token)');
      console.log('');
      return;
    }

    return new Promise((resolve) => {
      const crossTabTimeout = setTimeout(() => {
        console.log('❌ Cross-tab Sync: TIMEOUT');
        resolve();
      }, testConfig.timeout);

      // Create second socket connection (simulating second tab)
      this.socket2 = io(testConfig.wsUrl, {
        auth: { token: this.authToken },
        timeout: 5000,
        forceNew: true
      });

      this.socket2.on('connect', () => {
        console.log('   Second tab connected');
        
        // Listen for message on second socket
        this.socket2.on('message:create', (message) => {
          if (message.content.includes('cross-tab-test')) {
            clearTimeout(crossTabTimeout);
            console.log('✅ Cross-tab Sync: SUCCESS');
            console.log('   Message synchronized between tabs');
            this.testResults.crossTab = true;
            resolve();
          }
        });

        // Send message from first socket
        if (this.socket) {
          this.socket.emit('message:send', {
            channelId: 'test-channel',
            content: 'cross-tab-test message'
          });
        }
      });

      this.socket2.on('connect_error', (error) => {
        clearTimeout(crossTabTimeout);
        console.log('❌ Cross-tab Sync: FAILED (Connection error)');
        console.log(`   Error: ${error.message}`);
        resolve();
      });

    }).then(() => {
      console.log('');
    });
  }

  async testLiveUpdates() {
    console.log('📢 Testing Live Updates for Posts/Comments...');
    
    if (!this.socket || !this.testResults.authentication) {
      console.log('❌ Live Updates: SKIPPED (Prerequisites failed)');
      console.log('');
      return;
    }

    return new Promise((resolve) => {
      const updatesTimeout = setTimeout(() => {
        console.log('❌ Live Updates: TIMEOUT');
        resolve();
      }, testConfig.timeout);

      // Listen for live updates
      this.socket.on('post:create', (post) => {
        clearTimeout(updatesTimeout);
        console.log('✅ Live Updates: SUCCESS (Post)');
        console.log(`   Post ID: ${post.id || 'N/A'}`);
        this.testResults.notifications = true;
        resolve();
      });

      this.socket.on('comment:create', (comment) => {
        clearTimeout(updatesTimeout);
        console.log('✅ Live Updates: SUCCESS (Comment)');
        console.log(`   Comment ID: ${comment.id || 'N/A'}`);
        this.testResults.notifications = true;
        resolve();
      });

      // Simulate creating a post (this would normally come from API)
      setTimeout(() => {
        this.socket.emit('test:post_create', {
          title: 'Test post from diagnostic',
          content: 'This is a test post'
        });
      }, 1000);

    }).then(() => {
      console.log('');
    });
  }

  async testEventHandling() {
    console.log('⚙️ Testing Event-driven Architecture...');
    
    if (!this.socket) {
      console.log('❌ Event Handling: SKIPPED (No socket connection)');
      console.log('');
      return;
    }

    return new Promise((resolve) => {
      const eventTimeout = setTimeout(() => {
        console.log('❌ Event Handling: TIMEOUT');
        resolve();
      }, 5000);

      let eventsReceived = 0;
      const expectedEvents = ['heartbeat_ack', 'pong'];
      
      const checkEventHandling = () => {
        if (eventsReceived > 0) {
          clearTimeout(eventTimeout);
          console.log('✅ Event Handling: SUCCESS');
          console.log(`   Events processed: ${eventsReceived}`);
          this.testResults.eventHandling = true;
          resolve();
        }
      };

      // Listen for heartbeat response
      this.socket.on('heartbeat_ack', () => {
        eventsReceived++;
        console.log('   Heartbeat acknowledged');
        checkEventHandling();
      });

      // Listen for ping response  
      this.socket.on('pong', () => {
        eventsReceived++;
        console.log('   Pong received');
        checkEventHandling();
      });

      // Send events to test handling
      this.socket.emit('heartbeat');
      this.socket.emit('ping');

    }).then(() => {
      console.log('');
    });
  }

  generateReport() {
    console.log('📊 DIAGNOSTIC REPORT');
    console.log('====================');
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(Boolean).length;
    const passRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`Overall Status: ${passedTests}/${totalTests} tests passed (${passRate}%)`);
    console.log('');
    
    console.log('Detailed Results:');
    Object.entries(this.testResults).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`  ${status} - ${testName}`);
    });
    
    console.log('');
    
    if (passedTests === totalTests) {
      console.log('🎉 All real-time features are working perfectly!');
    } else {
      console.log('🔧 Issues found that need attention:');
      Object.entries(this.testResults).forEach(([test, passed]) => {
        if (!passed) {
          const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          console.log(`  - Fix ${testName}`);
        }
      });
    }
    
    console.log('');
    console.log('🏁 Diagnostic complete!');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test connections...');
    
    try {
      if (this.socket) {
        this.socket.disconnect();
      }
      if (this.socket2) {
        this.socket2.disconnect();
      }
    } catch (error) {
      console.log('   Cleanup error:', error.message);
    }
    
    console.log('✅ Cleanup complete');
  }
}

// Run the diagnostic
async function main() {
  const diagnostic = new RealtimeDiagnostic();
  await diagnostic.runFullDiagnostic();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RealtimeDiagnostic;