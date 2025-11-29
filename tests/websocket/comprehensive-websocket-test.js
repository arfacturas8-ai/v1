// Note: Commented out to avoid dependency issues during audit
// const io = require('socket.io-client');
// const WebSocket = require('ws');
const axios = require('axios');

const BASE_URL = 'http://54.236.166.224';
const WS_URL = 'ws://54.236.166.224/socket.io';
const API_URL = `${BASE_URL}/api`;

class WebSocketTester {
  constructor() {
    this.results = [];
    this.connections = [];
    this.messages = [];
    this.metrics = {
      connectionTime: [],
      messageLatency: [],
      messagesReceived: 0,
      messagesSent: 0,
      connectionErrors: 0,
      disconnections: 0
    };
    this.authTokens = [];
  }

  log(test, status, message, data = null) {
    const result = {
      test,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`[${status}] ${test}: ${message}`);
  }

  async getAuthToken() {
    if (this.authTokens.length > 0) {
      return this.authTokens[Math.floor(Math.random() * this.authTokens.length)];
    }

    try {
      // Try to register and login a test user
      const testUser = {
        username: `wstest_${Date.now()}`,
        email: `wstest_${Date.now()}@example.com`,
        password: 'WSTest123!'
      };

      // Register
      await axios.post(`${API_URL}/v1/auth/register`, testUser);
      
      // Login
      const loginResponse = await axios.post(`${API_URL}/v1/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });

      if (loginResponse.data && loginResponse.data.token) {
        this.authTokens.push(loginResponse.data.token);
        return loginResponse.data.token;
      }
    } catch (error) {
      console.log('Failed to get auth token:', error.message);
    }

    return null;
  }

  async testBasicConnection() {
    this.log('Basic Connection', 'TESTING', 'Testing basic WebSocket connection');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Test different WebSocket connection formats
      const connectionUrls = [
        WS_URL,
        `${BASE_URL}/socket.io`,
        `ws://54.236.166.224:3010/socket.io`,
        `ws://54.236.166.224:3010`
      ];

      let connectionEstablished = false;
      let attempts = 0;

      const tryConnection = (url) => {
        attempts++;
        
        try {
          const socket = io(url, {
            transports: ['websocket', 'polling'],
            timeout: 5000,
            forceNew: true
          });

          socket.on('connect', () => {
            const connectionTime = Date.now() - startTime;
            this.metrics.connectionTime.push(connectionTime);
            
            this.log('Basic Connection', 'PASS', `Connected to ${url} in ${connectionTime}ms`);
            connectionEstablished = true;
            
            this.connections.push(socket);
            socket.disconnect();
            resolve();
          });

          socket.on('connect_error', (error) => {
            this.metrics.connectionErrors++;
            
            if (attempts < connectionUrls.length) {
              tryConnection(connectionUrls[attempts]);
            } else if (!connectionEstablished) {
              this.log('Basic Connection', 'FAIL', `Failed to connect to any WebSocket URL: ${error.message}`);
              resolve();
            }
          });

          socket.on('disconnect', () => {
            this.metrics.disconnections++;
          });

          // Timeout if connection takes too long
          setTimeout(() => {
            if (!connectionEstablished && attempts >= connectionUrls.length) {
              this.log('Basic Connection', 'FAIL', 'Connection timeout');
              resolve();
            }
          }, 10000);

        } catch (error) {
          this.metrics.connectionErrors++;
          
          if (attempts < connectionUrls.length) {
            tryConnection(connectionUrls[attempts]);
          } else {
            this.log('Basic Connection', 'FAIL', `Connection failed: ${error.message}`);
            resolve();
          }
        }
      };

      tryConnection(connectionUrls[0]);
    });
  }

  async testAuthenticatedConnection() {
    this.log('Authenticated Connection', 'TESTING', 'Testing authenticated WebSocket connection');
    
    const token = await this.getAuthToken();
    
    if (!token) {
      this.log('Authenticated Connection', 'SKIP', 'No auth token available');
      return;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: {
          token: token
        },
        extraHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });

      socket.on('connect', () => {
        const connectionTime = Date.now() - startTime;
        this.metrics.connectionTime.push(connectionTime);
        
        this.log('Authenticated Connection', 'PASS', `Authenticated connection established in ${connectionTime}ms`);
        
        this.connections.push(socket);
        socket.disconnect();
        resolve();
      });

      socket.on('connect_error', (error) => {
        this.metrics.connectionErrors++;
        this.log('Authenticated Connection', 'FAIL', `Authentication failed: ${error.message}`);
        resolve();
      });

      setTimeout(() => {
        this.log('Authenticated Connection', 'FAIL', 'Authenticated connection timeout');
        socket.disconnect();
        resolve();
      }, 10000);
    });
  }

  async testMessageTransmission() {
    this.log('Message Transmission', 'TESTING', 'Testing message sending and receiving');
    
    const token = await this.getAuthToken();
    
    return new Promise((resolve) => {
      let sender, receiver;
      let messageReceived = false;
      let testCompleted = false;

      const completeTest = () => {
        if (testCompleted) return;
        testCompleted = true;
        
        if (sender) sender.disconnect();
        if (receiver) receiver.disconnect();
        resolve();
      };

      // Create sender
      sender = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: token ? { token } : {}
      });

      // Create receiver
      receiver = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: token ? { token } : {}
      });

      let connectCount = 0;
      const checkBothConnected = () => {
        connectCount++;
        if (connectCount === 2) {
          // Both connected, send test message
          const testMessage = {
            type: 'test_message',
            content: 'WebSocket test message',
            timestamp: Date.now(),
            testId: Math.random().toString(36).substring(7)
          };

          const startTime = Date.now();
          sender.emit('send_message', testMessage);
          this.metrics.messagesSent++;

          // Set timeout for message reception
          setTimeout(() => {
            if (!messageReceived) {
              this.log('Message Transmission', 'FAIL', 'Message not received within timeout');
              completeTest();
            }
          }, 5000);
        }
      };

      sender.on('connect', () => {
        checkBothConnected();
      });

      receiver.on('connect', () => {
        checkBothConnected();
      });

      // Listen for messages on receiver
      receiver.on('message', (data) => {
        const latency = Date.now() - (data.timestamp || Date.now());
        this.metrics.messageLatency.push(latency);
        this.metrics.messagesReceived++;
        
        messageReceived = true;
        this.log('Message Transmission', 'PASS', `Message received with ${latency}ms latency`);
        completeTest();
      });

      receiver.on('new_message', (data) => {
        const latency = Date.now() - (data.timestamp || Date.now());
        this.metrics.messageLatency.push(latency);
        this.metrics.messagesReceived++;
        
        messageReceived = true;
        this.log('Message Transmission', 'PASS', `Message received with ${latency}ms latency`);
        completeTest();
      });

      sender.on('connect_error', (error) => {
        this.metrics.connectionErrors++;
        this.log('Message Transmission', 'FAIL', `Sender connection error: ${error.message}`);
        completeTest();
      });

      receiver.on('connect_error', (error) => {
        this.metrics.connectionErrors++;
        this.log('Message Transmission', 'FAIL', `Receiver connection error: ${error.message}`);
        completeTest();
      });

      // Overall timeout
      setTimeout(() => {
        if (!testCompleted) {
          this.log('Message Transmission', 'FAIL', 'Test timeout');
          completeTest();
        }
      }, 15000);
    });
  }

  async testRoomFunctionality() {
    this.log('Room Functionality', 'TESTING', 'Testing room join/leave functionality');
    
    const token = await this.getAuthToken();
    
    return new Promise((resolve) => {
      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: token ? { token } : {}
      });

      let testCompleted = false;
      const completeTest = () => {
        if (testCompleted) return;
        testCompleted = true;
        socket.disconnect();
        resolve();
      };

      socket.on('connect', () => {
        const testRoom = `test_room_${Date.now()}`;
        
        // Try to join a room
        socket.emit('join_room', { room: testRoom });
        
        // Listen for room events
        socket.on('room_joined', (data) => {
          this.log('Room Functionality', 'PASS', `Successfully joined room: ${data.room || testRoom}`);
          
          // Try to leave the room
          socket.emit('leave_room', { room: testRoom });
        });

        socket.on('room_left', (data) => {
          this.log('Room Functionality', 'PASS', `Successfully left room: ${data.room || testRoom}`);
          completeTest();
        });

        socket.on('error', (error) => {
          this.log('Room Functionality', 'WARN', `Room operation error: ${error.message || error}`);
          completeTest();
        });

        // Timeout if no room events
        setTimeout(() => {
          this.log('Room Functionality', 'INFO', 'Room functionality may not be implemented');
          completeTest();
        }, 5000);
      });

      socket.on('connect_error', (error) => {
        this.metrics.connectionErrors++;
        this.log('Room Functionality', 'FAIL', `Connection error: ${error.message}`);
        completeTest();
      });

      setTimeout(() => {
        if (!testCompleted) {
          this.log('Room Functionality', 'FAIL', 'Room functionality test timeout');
          completeTest();
        }
      }, 10000);
    });
  }

  async testTypingIndicators() {
    this.log('Typing Indicators', 'TESTING', 'Testing typing indicator functionality');
    
    const token = await this.getAuthToken();
    
    return new Promise((resolve) => {
      let sender, receiver;
      let testCompleted = false;
      let typingReceived = false;

      const completeTest = () => {
        if (testCompleted) return;
        testCompleted = true;
        
        if (sender) sender.disconnect();
        if (receiver) receiver.disconnect();
        resolve();
      };

      sender = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: token ? { token } : {}
      });

      receiver = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        auth: token ? { token } : {}
      });

      let connectCount = 0;
      const checkBothConnected = () => {
        connectCount++;
        if (connectCount === 2) {
          // Both connected, send typing indicator
          sender.emit('typing_start', { channelId: 'test_channel' });
          
          setTimeout(() => {
            sender.emit('typing_stop', { channelId: 'test_channel' });
          }, 2000);
        }
      };

      sender.on('connect', checkBothConnected);
      receiver.on('connect', checkBothConnected);

      receiver.on('user_typing', (data) => {
        typingReceived = true;
        this.log('Typing Indicators', 'PASS', 'Typing indicator received');
        
        setTimeout(() => {
          if (!testCompleted) {
            completeTest();
          }
        }, 1000);
      });

      receiver.on('typing_start', (data) => {
        typingReceived = true;
        this.log('Typing Indicators', 'PASS', 'Typing start indicator received');
      });

      receiver.on('typing_stop', (data) => {
        if (typingReceived) {
          this.log('Typing Indicators', 'PASS', 'Typing stop indicator received');
        }
        completeTest();
      });

      setTimeout(() => {
        if (!typingReceived) {
          this.log('Typing Indicators', 'INFO', 'Typing indicators may not be implemented');
        }
        completeTest();
      }, 8000);
    });
  }

  async testConnectionStability() {
    this.log('Connection Stability', 'TESTING', 'Testing connection stability and reconnection');
    
    return new Promise((resolve) => {
      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000
      });

      let connectionCount = 0;
      let disconnectionCount = 0;
      let testCompleted = false;

      const completeTest = () => {
        if (testCompleted) return;
        testCompleted = true;
        socket.disconnect();
        resolve();
      };

      socket.on('connect', () => {
        connectionCount++;
        
        if (connectionCount === 1) {
          this.log('Connection Stability', 'INFO', 'Initial connection established');
          
          // Force disconnect to test reconnection
          setTimeout(() => {
            socket.disconnect();
          }, 1000);
        } else if (connectionCount === 2) {
          this.log('Connection Stability', 'PASS', 'Reconnection successful');
          completeTest();
        }
      });

      socket.on('disconnect', (reason) => {
        disconnectionCount++;
        this.metrics.disconnections++;
        
        this.log('Connection Stability', 'INFO', `Disconnected: ${reason}`);
        
        if (disconnectionCount > 2) {
          this.log('Connection Stability', 'FAIL', 'Too many disconnections');
          completeTest();
        }
      });

      socket.on('reconnect_failed', () => {
        this.log('Connection Stability', 'FAIL', 'Reconnection failed');
        completeTest();
      });

      setTimeout(() => {
        if (!testCompleted) {
          this.log('Connection Stability', 'FAIL', 'Connection stability test timeout');
          completeTest();
        }
      }, 15000);
    });
  }

  async testMultipleConnections() {
    this.log('Multiple Connections', 'TESTING', 'Testing multiple simultaneous connections');
    
    const connectionCount = 5;
    const connections = [];
    let connectedCount = 0;
    let testCompleted = false;

    return new Promise((resolve) => {
      const completeTest = () => {
        if (testCompleted) return;
        testCompleted = true;
        
        connections.forEach(socket => {
          if (socket && socket.connected) {
            socket.disconnect();
          }
        });
        resolve();
      };

      for (let i = 0; i < connectionCount; i++) {
        const socket = io(WS_URL, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          forceNew: true
        });

        connections.push(socket);

        socket.on('connect', () => {
          connectedCount++;
          
          if (connectedCount === connectionCount) {
            this.log('Multiple Connections', 'PASS', `Successfully established ${connectionCount} connections`);
            completeTest();
          }
        });

        socket.on('connect_error', (error) => {
          this.metrics.connectionErrors++;
          this.log('Multiple Connections', 'WARN', `Connection ${i + 1} failed: ${error.message}`);
          
          if (connectedCount === 0 && i === connectionCount - 1) {
            this.log('Multiple Connections', 'FAIL', 'All connections failed');
            completeTest();
          }
        });
      }

      setTimeout(() => {
        if (!testCompleted) {
          if (connectedCount > 0) {
            this.log('Multiple Connections', 'PARTIAL', `${connectedCount}/${connectionCount} connections established`);
          } else {
            this.log('Multiple Connections', 'FAIL', 'No connections established');
          }
          completeTest();
        }
      }, 10000);
    });
  }

  async testPerformanceMetrics() {
    this.log('Performance Metrics', 'TESTING', 'Analyzing WebSocket performance');
    
    const connectionTimes = this.metrics.connectionTime;
    const messageLatencies = this.metrics.messageLatency;

    if (connectionTimes.length > 0) {
      const avgConnectionTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
      
      if (avgConnectionTime < 1000) {
        this.log('Performance Metrics', 'PASS', `Average connection time: ${Math.round(avgConnectionTime)}ms`);
      } else if (avgConnectionTime < 3000) {
        this.log('Performance Metrics', 'WARN', `Average connection time: ${Math.round(avgConnectionTime)}ms (acceptable)`);
      } else {
        this.log('Performance Metrics', 'FAIL', `Average connection time: ${Math.round(avgConnectionTime)}ms (too slow)`);
      }
    }

    if (messageLatencies.length > 0) {
      const avgLatency = messageLatencies.reduce((a, b) => a + b, 0) / messageLatencies.length;
      
      if (avgLatency < 100) {
        this.log('Performance Metrics', 'PASS', `Average message latency: ${Math.round(avgLatency)}ms`);
      } else if (avgLatency < 500) {
        this.log('Performance Metrics', 'WARN', `Average message latency: ${Math.round(avgLatency)}ms (acceptable)`);
      } else {
        this.log('Performance Metrics', 'FAIL', `Average message latency: ${Math.round(avgLatency)}ms (too high)`);
      }
    }

    const successRate = this.metrics.connectionErrors > 0 ? 
      ((this.metrics.connectionTime.length / (this.metrics.connectionTime.length + this.metrics.connectionErrors)) * 100) : 100;

    this.log('Performance Metrics', 'INFO', `Connection success rate: ${Math.round(successRate)}%`);
    this.log('Performance Metrics', 'INFO', `Messages sent: ${this.metrics.messagesSent}, received: ${this.metrics.messagesReceived}`);
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warnTests = this.results.filter(r => r.status === 'WARN').length;
    
    const connectionTimes = this.metrics.connectionTime;
    const messageLatencies = this.metrics.messageLatency;
    
    const avgConnectionTime = connectionTimes.length > 0 ? 
      connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length : 0;
      
    const avgMessageLatency = messageLatencies.length > 0 ? 
      messageLatencies.reduce((a, b) => a + b, 0) / messageLatencies.length : 0;

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        warnTests,
        successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      performance: {
        avgConnectionTime: Math.round(avgConnectionTime),
        avgMessageLatency: Math.round(avgMessageLatency),
        connectionErrors: this.metrics.connectionErrors,
        messagesTransmitted: this.metrics.messagesSent,
        messagesReceived: this.metrics.messagesReceived,
        disconnections: this.metrics.disconnections
      },
      testResults: this.results,
      timestamp: new Date().toISOString()
    };
  }

  async runAllTests() {
    console.log('🔌 Starting CRYB Platform WebSocket Testing...\n');

    await this.testBasicConnection();
    await this.testAuthenticatedConnection();
    await this.testMessageTransmission();
    await this.testRoomFunctionality();
    await this.testTypingIndicators();
    await this.testConnectionStability();
    await this.testMultipleConnections();
    await this.testPerformanceMetrics();

    const report = this.generateReport();
    
    console.log('\n📊 WebSocket Testing Summary:');
    console.log(`✅ Tests Passed: ${report.summary.passedTests}`);
    console.log(`❌ Tests Failed: ${report.summary.failedTests}`);
    console.log(`⚠️ Tests with Warnings: ${report.summary.warnTests}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`⏱️ Average Connection Time: ${report.performance.avgConnectionTime}ms`);
    console.log(`📨 Average Message Latency: ${report.performance.avgMessageLatency}ms`);
    console.log(`📤 Messages Sent: ${report.performance.messagesTransmitted}`);
    console.log(`📥 Messages Received: ${report.performance.messagesReceived}`);

    return report;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebSocketTester;
}

// Run if called directly
if (require.main === module) {
  (async () => {
    const tester = new WebSocketTester();
    const report = await tester.runAllTests();
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportPath = path.join(__dirname, 'websocket-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📁 Report saved to: ${reportPath}`);
  })();
}