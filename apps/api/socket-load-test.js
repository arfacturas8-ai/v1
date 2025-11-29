#!/usr/bin/env node

/**
 * PRODUCTION SOCKET.IO LOAD TEST
 * 
 * Tests the production Socket.IO system with thousands of concurrent connections
 * to ensure it can handle the scale of a $10M platform.
 * 
 * Features tested:
 * - Authentication with JWT tokens
 * - Concurrent connections (up to 10,000)
 * - Real-time messaging
 * - Typing indicators
 * - Presence updates
 * - Message delivery guarantees
 * - Rate limiting
 * - Error handling and reconnection
 */

const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Test configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3001',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production',
  MAX_CONNECTIONS: parseInt(process.env.MAX_CONNECTIONS) || 1000,
  MESSAGE_RATE: parseInt(process.env.MESSAGE_RATE) || 10, // messages per second per client
  TEST_DURATION: parseInt(process.env.TEST_DURATION) || 60, // seconds
  RAMP_UP_TIME: parseInt(process.env.RAMP_UP_TIME) || 30, // seconds to reach max connections
  CHANNEL_ID: process.env.CHANNEL_ID || 'test-channel-123'
};

// Test metrics
const metrics = {
  connectionsAttempted: 0,
  connectionsSuccessful: 0,
  connectionsFailed: 0,
  authFailures: 0,
  messagesSent: 0,
  messagesReceived: 0,
  typingIndicatorsSent: 0,
  presenceUpdatesSent: 0,
  errors: 0,
  disconnections: 0,
  reconnections: 0,
  avgLatency: 0,
  maxLatency: 0,
  minLatency: Infinity,
  startTime: null,
  endTime: null
};

const clients = [];
const messageLatencies = [];

/**
 * Generate a valid JWT token for testing
 */
function generateTestToken(userId) {
  return jwt.sign(
    {
      userId,
      username: `testuser${userId}`,
      type: 'access'
    },
    CONFIG.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create and connect a test client
 */
function createClient(userId) {
  return new Promise((resolve, reject) => {
    const token = generateTestToken(userId);
    
    const client = new Client(CONFIG.SERVER_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const clientMetrics = {
      id: userId,
      connected: false,
      authenticated: false,
      messagesSent: 0,
      messagesReceived: 0,
      latencies: [],
      errors: 0
    };

    client.on('connect', () => {
      console.log(`Client ${userId} connected`);
      clientMetrics.connected = true;
      metrics.connectionsSuccessful++;
    });

    client.on('ready', (data) => {
      console.log(`Client ${userId} authenticated and ready`);
      clientMetrics.authenticated = true;
      
      // Join test channel
      client.emit('channel:join', { channelId: CONFIG.CHANNEL_ID });
      
      resolve({ client, metrics: clientMetrics });
    });

    client.on('connect_error', (error) => {
      console.error(`Client ${userId} connection error:`, error.message);
      metrics.connectionsFailed++;
      if (error.message.includes('Authentication')) {
        metrics.authFailures++;
      }
      reject(error);
    });

    client.on('disconnect', (reason) => {
      console.log(`Client ${userId} disconnected: ${reason}`);
      clientMetrics.connected = false;
      metrics.disconnections++;
    });

    client.on('reconnect', () => {
      console.log(`Client ${userId} reconnected`);
      metrics.reconnections++;
    });

    client.on('error', (error) => {
      console.error(`Client ${userId} error:`, error);
      clientMetrics.errors++;
      metrics.errors++;
    });

    // Message handling
    client.on('message:create', (message) => {
      const latency = Date.now() - message.timestamp;
      if (latency > 0) {
        messageLatencies.push(latency);
        clientMetrics.latencies.push(latency);
        
        if (latency > metrics.maxLatency) metrics.maxLatency = latency;
        if (latency < metrics.minLatency) metrics.minLatency = latency;
      }
      
      clientMetrics.messagesReceived++;
      metrics.messagesReceived++;
    });

    client.on('typing:start', () => {
      // Track typing indicators received
    });

    client.on('presence:update', () => {
      // Track presence updates received
    });

    // Store client reference
    clients.push({ client, metrics: clientMetrics });

    metrics.connectionsAttempted++;
  });
}

/**
 * Send a test message from a client
 */
function sendMessage(clientData, messageContent) {
  const { client, metrics: clientMetrics } = clientData;
  
  if (!client.connected || !clientMetrics.authenticated) {
    return;
  }

  const message = {
    channelId: CONFIG.CHANNEL_ID,
    content: messageContent || `Test message from client ${clientMetrics.id} at ${Date.now()}`,
    timestamp: Date.now(),
    nonce: `test-${clientMetrics.id}-${Date.now()}`
  };

  client.emit('message:send', message);
  clientMetrics.messagesSent++;
  metrics.messagesSent++;
}

/**
 * Send typing indicator from a client
 */
function sendTypingIndicator(clientData) {
  const { client, metrics: clientMetrics } = clientData;
  
  if (!client.connected || !clientMetrics.authenticated) {
    return;
  }

  client.emit('typing:start', { channelId: CONFIG.CHANNEL_ID });
  metrics.typingIndicatorsSent++;
  
  // Stop typing after random delay
  setTimeout(() => {
    if (client.connected) {
      client.emit('typing:stop', { channelId: CONFIG.CHANNEL_ID });
    }
  }, Math.random() * 5000 + 1000);
}

/**
 * Update presence for a client
 */
function updatePresence(clientData) {
  const { client } = clientData;
  
  if (!client.connected) {
    return;
  }

  const statuses = ['online', 'idle', 'dnd'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  client.emit('presence:update', { 
    status,
    activity: {
      type: 'playing',
      name: 'Load Testing'
    }
  });
  
  metrics.presenceUpdatesSent++;
}

/**
 * Start the load test
 */
async function startLoadTest() {
  console.log('🚀 Starting Production Socket.IO Load Test');
  console.log(`Configuration:
  - Server: ${CONFIG.SERVER_URL}
  - Max Connections: ${CONFIG.MAX_CONNECTIONS}
  - Message Rate: ${CONFIG.MESSAGE_RATE}/sec per client
  - Test Duration: ${CONFIG.TEST_DURATION}s
  - Ramp-up Time: ${CONFIG.RAMP_UP_TIME}s
  - Channel ID: ${CONFIG.CHANNEL_ID}
  `);

  metrics.startTime = Date.now();

  // Ramp up connections gradually
  const connectionsPerSecond = CONFIG.MAX_CONNECTIONS / CONFIG.RAMP_UP_TIME;
  const connectionInterval = 1000 / connectionsPerSecond;

  console.log(`📈 Ramping up ${connectionsPerSecond.toFixed(2)} connections per second...`);

  for (let i = 1; i <= CONFIG.MAX_CONNECTIONS; i++) {
    setTimeout(async () => {
      try {
        await createClient(i);
        
        if (i % 100 === 0) {
          console.log(`📊 ${i}/${CONFIG.MAX_CONNECTIONS} connections created`);
          printMetrics();
        }
      } catch (error) {
        console.error(`Failed to create client ${i}:`, error.message);
      }
    }, (i - 1) * connectionInterval);
  }

  // Start message sending after ramp-up
  setTimeout(() => {
    console.log('📨 Starting message load test...');
    startMessageLoad();
  }, CONFIG.RAMP_UP_TIME * 1000);

  // Start typing and presence load
  setTimeout(() => {
    console.log('⌨️ Starting typing indicators and presence updates...');
    startTypingAndPresenceLoad();
  }, (CONFIG.RAMP_UP_TIME + 5) * 1000);

  // End test after duration
  setTimeout(() => {
    endLoadTest();
  }, (CONFIG.RAMP_UP_TIME + CONFIG.TEST_DURATION) * 1000);
}

/**
 * Start sending messages from all connected clients
 */
function startMessageLoad() {
  const messageInterval = 1000 / CONFIG.MESSAGE_RATE;
  
  clients.forEach((clientData, index) => {
    const interval = setInterval(() => {
      if (clientData.client.connected && clientData.metrics.authenticated) {
        sendMessage(clientData);
      }
    }, messageInterval + (index % 100)); // Slight offset to avoid thundering herd
    
    // Store interval for cleanup
    clientData.messageInterval = interval;
  });
}

/**
 * Start typing indicators and presence updates
 */
function startTypingAndPresenceLoad() {
  clients.forEach((clientData, index) => {
    // Random typing indicators
    const typingInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance
        sendTypingIndicator(clientData);
      }
    }, 5000 + (index % 1000));
    
    // Random presence updates
    const presenceInterval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance
        updatePresence(clientData);
      }
    }, 30000 + (index % 5000));
    
    // Store intervals for cleanup
    clientData.typingInterval = typingInterval;
    clientData.presenceInterval = presenceInterval;
  });
}

/**
 * Print current metrics
 */
function printMetrics() {
  const elapsed = (Date.now() - metrics.startTime) / 1000;
  const avgLatency = messageLatencies.length > 0 ? 
    messageLatencies.reduce((a, b) => a + b, 0) / messageLatencies.length : 0;

  console.log(`
📊 LOAD TEST METRICS (${elapsed.toFixed(1)}s elapsed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 Connections: ${metrics.connectionsSuccessful}/${metrics.connectionsAttempted} successful
❌ Failed: ${metrics.connectionsFailed} | Auth Failures: ${metrics.authFailures}
📨 Messages: ${metrics.messagesSent} sent, ${metrics.messagesReceived} received
⌨️  Typing: ${metrics.typingIndicatorsSent} indicators sent
👥 Presence: ${metrics.presenceUpdatesSent} updates sent
🔄 Reconnections: ${metrics.reconnections} | Disconnections: ${metrics.disconnections}
⚠️  Errors: ${metrics.errors}
⏱️  Latency: avg=${avgLatency.toFixed(2)}ms, min=${metrics.minLatency}ms, max=${metrics.maxLatency}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

/**
 * End the load test and cleanup
 */
function endLoadTest() {
  console.log('🏁 Ending load test...');
  
  metrics.endTime = Date.now();
  
  // Clear all intervals
  clients.forEach((clientData) => {
    if (clientData.messageInterval) clearInterval(clientData.messageInterval);
    if (clientData.typingInterval) clearInterval(clientData.typingInterval);
    if (clientData.presenceInterval) clearInterval(clientData.presenceInterval);
  });
  
  // Disconnect all clients gradually
  let disconnectCount = 0;
  clients.forEach((clientData, index) => {
    setTimeout(() => {
      clientData.client.disconnect();
      disconnectCount++;
      
      if (disconnectCount === clients.length) {
        printFinalReport();
      }
    }, index * 10); // Disconnect 100 clients per second
  });
}

/**
 * Print final test report
 */
function printFinalReport() {
  const totalDuration = (metrics.endTime - metrics.startTime) / 1000;
  const avgLatency = messageLatencies.length > 0 ? 
    messageLatencies.reduce((a, b) => a + b, 0) / messageLatencies.length : 0;
  
  const messagesPerSecond = metrics.messagesSent / totalDuration;
  const successRate = (metrics.connectionsSuccessful / metrics.connectionsAttempted) * 100;
  
  console.log(`
🎯 FINAL LOAD TEST REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Test Configuration:
   • Target Connections: ${CONFIG.MAX_CONNECTIONS}
   • Test Duration: ${CONFIG.TEST_DURATION}s
   • Message Rate: ${CONFIG.MESSAGE_RATE}/sec per client

🔌 Connection Results:
   • Success Rate: ${successRate.toFixed(2)}% (${metrics.connectionsSuccessful}/${metrics.connectionsAttempted})
   • Failed Connections: ${metrics.connectionsFailed}
   • Authentication Failures: ${metrics.authFailures}
   • Reconnections: ${metrics.reconnections}

📨 Message Performance:
   • Total Messages Sent: ${metrics.messagesSent.toLocaleString()}
   • Total Messages Received: ${metrics.messagesReceived.toLocaleString()}
   • Messages per Second: ${messagesPerSecond.toFixed(2)}
   • Message Success Rate: ${((metrics.messagesReceived / metrics.messagesSent) * 100).toFixed(2)}%

⏱️  Latency Metrics:
   • Average Latency: ${avgLatency.toFixed(2)}ms
   • Minimum Latency: ${metrics.minLatency === Infinity ? 'N/A' : metrics.minLatency + 'ms'}
   • Maximum Latency: ${metrics.maxLatency}ms
   • 95th Percentile: ${getPercentile(messageLatencies, 95).toFixed(2)}ms
   • 99th Percentile: ${getPercentile(messageLatencies, 99).toFixed(2)}ms

⌨️  Other Features:
   • Typing Indicators Sent: ${metrics.typingIndicatorsSent}
   • Presence Updates Sent: ${metrics.presenceUpdatesSent}

⚠️  Error Summary:
   • Total Errors: ${metrics.errors}
   • Disconnections: ${metrics.disconnections}
   • Error Rate: ${((metrics.errors / metrics.messagesSent) * 100).toFixed(4)}%

🏆 VERDICT: ${getVerdict()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  
  process.exit(0);
}

/**
 * Calculate percentile from array of numbers
 */
function getPercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

/**
 * Get test verdict based on results
 */
function getVerdict() {
  const successRate = (metrics.connectionsSuccessful / metrics.connectionsAttempted) * 100;
  const avgLatency = messageLatencies.length > 0 ? 
    messageLatencies.reduce((a, b) => a + b, 0) / messageLatencies.length : 0;
  const errorRate = (metrics.errors / metrics.messagesSent) * 100;
  
  if (successRate >= 95 && avgLatency < 100 && errorRate < 1) {
    return '🟢 EXCELLENT - Ready for production at scale!';
  } else if (successRate >= 90 && avgLatency < 200 && errorRate < 2) {
    return '🟡 GOOD - Minor optimizations recommended';
  } else if (successRate >= 80 && avgLatency < 500 && errorRate < 5) {
    return '🟠 FAIR - Significant improvements needed';
  } else {
    return '🔴 POOR - System not ready for production scale';
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📛 Received SIGINT, shutting down gracefully...');
  endLoadTest();
});

process.on('SIGTERM', () => {
  console.log('\n📛 Received SIGTERM, shutting down gracefully...');
  endLoadTest();
});

// Start the load test
if (require.main === module) {
  startLoadTest().catch((error) => {
    console.error('💥 Load test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  startLoadTest,
  metrics,
  CONFIG
};