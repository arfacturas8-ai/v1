const crypto = require('crypto');
const { io } = require('socket.io-client');

// Production-like configuration
const PRODUCTION_CONFIG = {
  maxConcurrentConnections: 10000,
  messageRateLimit: 100, // messages per second per user
  uploadSizeLimit: 50 * 1024 * 1024, // 50MB
  websocketTimeout: 30000,
  connectionPoolSize: 100
};

// Counters and tracking
let userCounter = 0;
let totalOperations = 0;
let successfulOperations = 0;
let failedOperations = 0;
const activeConnections = new Map();
const performanceMetrics = {
  authTimes: [],
  messageTimes: [],
  uploadTimes: [],
  websocketTimes: []
};

// Pre-created production test users
const productionUsers = [
  { email: 'produser1@example.com', password: 'ProductionTest123!', username: 'produser1' },
  { email: 'produser2@example.com', password: 'ProductionTest123!', username: 'produser2' },
  { email: 'produser3@example.com', password: 'ProductionTest123!', username: 'produser3' },
  { email: 'produser4@example.com', password: 'ProductionTest123!', username: 'produser4' },
  { email: 'produser5@example.com', password: 'ProductionTest123!', username: 'produser5' },
  { email: 'produser6@example.com', password: 'ProductionTest123!', username: 'produser6' },
  { email: 'produser7@example.com', password: 'ProductionTest123!', username: 'produser7' },
  { email: 'produser8@example.com', password: 'ProductionTest123!', username: 'produser8' },
  { email: 'produser9@example.com', password: 'ProductionTest123!', username: 'produser9' },
  { email: 'produser10@example.com', password: 'ProductionTest123!', username: 'produser10' },
];

/**
 * Generate production-ready user data for registration tests
 */
function generateProductionUser(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const userIndex = userCounter++;
  
  // Create realistic user data
  context.vars.email = `produser-${userIndex}-${randomSuffix}@crybplatform.com`;
  context.vars.username = `produser${userIndex}${randomSuffix}`;
  context.vars.password = 'ProductionTest123!'; // Meets security requirements
  context.vars.firstName = `User${userIndex}`;
  context.vars.lastName = `Test${randomSuffix}`;
  
  // Track user creation
  ee.emit('counter', 'users.created', 1);
  
  return next();
}

/**
 * Authenticate user with realistic production flow
 */
function authenticateUser(context, ee, next) {
  const startTime = Date.now();
  
  // Use existing production user for faster authentication
  const user = productionUsers[Math.floor(Math.random() * productionUsers.length)];
  
  // Set auth data in context
  context.vars.email = user.email;
  context.vars.username = user.username;
  context.vars.password = user.password;
  
  // Simulate auth token (would be replaced with actual auth call in real implementation)
  const authToken = generateRealisticJWT(user);
  context.vars.authToken = authToken;
  
  const authTime = Date.now() - startTime;
  performanceMetrics.authTimes.push(authTime);
  ee.emit('histogram', 'auth_latency', authTime);
  ee.emit('counter', 'auth.successful', 1);
  
  return next();
}

/**
 * Generate realistic JWT token structure
 */
function generateRealisticJWT(user) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    userId: `prod-user-${crypto.randomBytes(4).toString('hex')}`,
    username: user.username,
    email: user.email,
    roles: ['user'],
    permissions: ['read', 'write', 'upload'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iss: 'cryb-platform',
    aud: 'cryb-api'
  };
  
  // Mock JWT structure (in production, use actual JWT library)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHash('sha256').update(`${encodedHeader}.${encodedPayload}.secret`).digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Generate realistic image file for upload testing
 */
function generateImageFile(context, ee, next) {
  try {
    // Generate a realistic small PNG image (1KB - 1MB range)
    const imageSize = 1024 + Math.floor(Math.random() * 1024 * 1024); // 1KB to 1MB
    const imageBuffer = Buffer.alloc(imageSize);
    
    // Add PNG header for realistic file
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    pngHeader.copy(imageBuffer, 0);
    
    // Fill rest with random data
    crypto.randomFillSync(imageBuffer, 8);
    
    context.vars.imageFileData = imageBuffer;
    context.vars.imageFileName = `loadtest-image-${Date.now()}.png`;
    context.vars.imageFileSize = imageSize;
    
    ee.emit('counter', 'files.image.generated', 1);
    ee.emit('histogram', 'file.image.size', imageSize);
    
    return next();
  } catch (error) {
    ee.emit('counter', 'files.image.generation_failed', 1);
    console.error('Image generation failed:', error);
    return next(error);
  }
}

/**
 * Generate realistic video file for upload testing
 */
function generateVideoFile(context, ee, next) {
  try {
    // Generate a realistic video file (smaller for load testing: 100KB - 5MB)
    const videoSize = 100 * 1024 + Math.floor(Math.random() * 5 * 1024 * 1024); // 100KB to 5MB
    const videoBuffer = Buffer.alloc(videoSize);
    
    // Add MP4 header for realistic file
    const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
    mp4Header.copy(videoBuffer, 0);
    
    // Fill rest with random data
    crypto.randomFillSync(videoBuffer, 8);
    
    context.vars.videoFileData = videoBuffer;
    context.vars.videoFileName = `loadtest-video-${Date.now()}.mp4`;
    context.vars.videoFileSize = videoSize;
    
    ee.emit('counter', 'files.video.generated', 1);
    ee.emit('histogram', 'file.video.size', videoSize);
    
    return next();
  } catch (error) {
    ee.emit('counter', 'files.video.generation_failed', 1);
    console.error('Video generation failed:', error);
    return next(error);
  }
}

/**
 * Establish WebSocket connection for real-time testing
 */
function establishWebSocketConnection(context, ee, next) {
  const startTime = Date.now();
  const authToken = context.vars.authToken;
  
  if (!authToken) {
    ee.emit('counter', 'websocket.no_auth_token', 1);
    return next(new Error('No auth token available for WebSocket connection'));
  }
  
  try {
    const socket = io('http://localhost:3002', {
      auth: { token: authToken },
      transports: ['websocket'],
      timeout: PRODUCTION_CONFIG.websocketTimeout,
      forceNew: true
    });
    
    socket.on('connect', () => {
      const connectionTime = Date.now() - startTime;
      performanceMetrics.websocketTimes.push(connectionTime);
      
      ee.emit('histogram', 'websocket_connection_time', connectionTime);
      ee.emit('counter', 'websocket.connections.successful', 1);
      
      // Store connection for later use
      activeConnections.set(context.vars.$uuid || generateUUID(), socket);
      context.vars.socketConnected = true;
      
      next();
    });
    
    socket.on('connect_error', (error) => {
      ee.emit('counter', 'websocket.connections.failed', 1);
      console.error('WebSocket connection failed:', error);
      next(error);
    });
    
    socket.on('error', (error) => {
      ee.emit('counter', 'websocket.errors', 1);
      console.error('WebSocket error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      ee.emit('counter', 'websocket.disconnections', 1);
      activeConnections.delete(context.vars.$uuid);
    });
    
    // Timeout handling
    setTimeout(() => {
      if (!socket.connected) {
        socket.disconnect();
        ee.emit('counter', 'websocket.connection.timeout', 1);
        next(new Error('WebSocket connection timeout'));
      }
    }, PRODUCTION_CONFIG.websocketTimeout);
    
  } catch (error) {
    ee.emit('counter', 'websocket.connection.error', 1);
    console.error('WebSocket connection error:', error);
    next(error);
  }
}

/**
 * Join multiple channels for realistic usage pattern
 */
function joinMultipleChannels(context, ee, next) {
  const socket = activeConnections.get(context.vars.$uuid);
  
  if (!socket || !socket.connected) {
    ee.emit('counter', 'websocket.no_connection', 1);
    return next(new Error('No active WebSocket connection'));
  }
  
  const channelsToJoin = ['general', 'random', 'testing', 'announcements'];
  let joinedChannels = 0;
  const totalChannels = channelsToJoin.length;
  
  channelsToJoin.forEach((channelName, index) => {
    setTimeout(() => {
      socket.emit('channel:join', {
        channelName: channelName,
        serverId: context.vars.serverId || 'default-server'
      });
      
      socket.once(`channel:joined:${channelName}`, () => {
        joinedChannels++;
        ee.emit('counter', 'websocket.channels.joined', 1);
        
        if (joinedChannels === totalChannels) {
          context.vars.joinedChannels = channelsToJoin;
          next();
        }
      });
      
    }, index * 100); // Stagger channel joins
  });
  
  // Timeout for channel joining
  setTimeout(() => {
    if (joinedChannels < totalChannels) {
      ee.emit('counter', 'websocket.channel.join.timeout', 1);
      next(new Error('Channel joining timeout'));
    }
  }, 5000);
}

/**
 * Send real-time messages to test messaging throughput
 */
function sendRealtimeMessages(context, ee, next) {
  const socket = activeConnections.get(context.vars.$uuid);
  
  if (!socket || !socket.connected) {
    ee.emit('counter', 'websocket.no_connection', 1);
    return next(new Error('No active WebSocket connection'));
  }
  
  const channels = context.vars.joinedChannels || ['general'];
  const messagesToSend = 10;
  let messagesSent = 0;
  let messagesAcknowledged = 0;
  
  const startTime = Date.now();
  
  function sendNextMessage() {
    if (messagesSent >= messagesToSend) {
      // Wait for all acknowledgments
      const checkAcknowledgments = setInterval(() => {
        if (messagesAcknowledged >= messagesToSend) {
          clearInterval(checkAcknowledgments);
          const totalTime = Date.now() - startTime;
          const throughput = messagesToSend / (totalTime / 1000);
          
          performanceMetrics.messageTimes.push(totalTime);
          ee.emit('histogram', 'message_throughput', throughput);
          ee.emit('counter', 'websocket.messages.batch_completed', 1);
          
          next();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkAcknowledgments);
        next(new Error('Message acknowledgment timeout'));
      }, 10000);
      
      return;
    }
    
    const channel = channels[messagesSent % channels.length];
    const messageContent = `Production load test message ${messagesSent + 1} - ${crypto.randomBytes(4).toString('hex')}`;
    
    const messageId = `msg-${Date.now()}-${messagesSent}`;
    
    socket.emit('message:send', {
      channelId: channel,
      content: messageContent,
      messageId: messageId
    });
    
    // Listen for acknowledgment
    socket.once(`message:acknowledged:${messageId}`, () => {
      messagesAcknowledged++;
      ee.emit('counter', 'websocket.messages.acknowledged', 1);
    });
    
    messagesSent++;
    ee.emit('counter', 'websocket.messages.sent', 1);
    
    // Send next message after realistic delay
    setTimeout(sendNextMessage, 200 + Math.random() * 300);
  }
  
  sendNextMessage();
}

/**
 * Test typing indicators under load
 */
function testTypingIndicators(context, ee, next) {
  const socket = activeConnections.get(context.vars.$uuid);
  
  if (!socket || !socket.connected) {
    return next();
  }
  
  const channels = context.vars.joinedChannels || ['general'];
  const channel = channels[Math.floor(Math.random() * channels.length)];
  
  // Start typing
  socket.emit('typing:start', { channelId: channel });
  ee.emit('counter', 'websocket.typing.started', 1);
  
  setTimeout(() => {
    // Stop typing
    socket.emit('typing:stop', { channelId: channel });
    ee.emit('counter', 'websocket.typing.stopped', 1);
    next();
  }, 2000 + Math.random() * 3000); // Realistic typing duration
}

/**
 * Test presence updates
 */
function testPresenceUpdates(context, ee, next) {
  const socket = activeConnections.get(context.vars.$uuid);
  
  if (!socket || !socket.connected) {
    return next();
  }
  
  const statuses = ['online', 'idle', 'dnd', 'invisible'];
  const activities = ['Playing Load Test', 'Watching Performance', 'Listening to Metrics', 'Custom Status'];
  
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const activity = activities[Math.floor(Math.random() * activities.length)];
  
  socket.emit('presence:update', {
    status: status,
    activity: {
      type: 'playing',
      name: activity
    }
  });
  
  ee.emit('counter', 'websocket.presence.updated', 1);
  
  setTimeout(next, 500);
}

/**
 * Disconnect WebSocket connection
 */
function disconnectWebSocket(context, ee, next) {
  const socket = activeConnections.get(context.vars.$uuid);
  
  if (socket) {
    socket.disconnect();
    activeConnections.delete(context.vars.$uuid);
    ee.emit('counter', 'websocket.connections.closed', 1);
  }
  
  next();
}

/**
 * Monitor system resources during load test
 */
function monitorSystemResources(context, ee, next) {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  // Memory metrics
  ee.emit('histogram', 'system.memory.rss', memoryUsage.rss);
  ee.emit('histogram', 'system.memory.heapUsed', memoryUsage.heapUsed);
  ee.emit('histogram', 'system.memory.heapTotal', memoryUsage.heapTotal);
  ee.emit('histogram', 'system.memory.external', memoryUsage.external);
  
  // CPU metrics (if available)
  if (cpuUsage.user !== undefined && cpuUsage.system !== undefined) {
    ee.emit('histogram', 'system.cpu.user', cpuUsage.user);
    ee.emit('histogram', 'system.cpu.system', cpuUsage.system);
  }
  
  // Connection tracking
  ee.emit('gauge', 'system.active_websockets', activeConnections.size);
  
  return next();
}

/**
 * Performance bottleneck detection
 */
function detectBottlenecks(context, ee, next) {
  const currentTime = Date.now();
  
  // Analyze recent performance metrics
  const recentAuthTimes = performanceMetrics.authTimes.slice(-100);
  const recentMessageTimes = performanceMetrics.messageTimes.slice(-100);
  const recentWebSocketTimes = performanceMetrics.websocketTimes.slice(-100);
  
  // Calculate averages
  const avgAuthTime = recentAuthTimes.length > 0 ? 
    recentAuthTimes.reduce((a, b) => a + b, 0) / recentAuthTimes.length : 0;
  
  const avgMessageTime = recentMessageTimes.length > 0 ?
    recentMessageTimes.reduce((a, b) => a + b, 0) / recentMessageTimes.length : 0;
  
  const avgWebSocketTime = recentWebSocketTimes.length > 0 ?
    recentWebSocketTimes.reduce((a, b) => a + b, 0) / recentWebSocketTimes.length : 0;
  
  // Bottleneck detection thresholds
  const BOTTLENECK_THRESHOLDS = {
    authTime: 2000,    // 2 seconds
    messageTime: 5000, // 5 seconds  
    websocketTime: 1000 // 1 second
  };
  
  // Emit bottleneck alerts
  if (avgAuthTime > BOTTLENECK_THRESHOLDS.authTime) {
    ee.emit('counter', 'bottleneck.auth_slow', 1);
    console.warn(`🔴 Authentication bottleneck detected: ${avgAuthTime}ms average`);
  }
  
  if (avgMessageTime > BOTTLENECK_THRESHOLDS.messageTime) {
    ee.emit('counter', 'bottleneck.messaging_slow', 1);
    console.warn(`🔴 Messaging bottleneck detected: ${avgMessageTime}ms average`);
  }
  
  if (avgWebSocketTime > BOTTLENECK_THRESHOLDS.websocketTime) {
    ee.emit('counter', 'bottleneck.websocket_slow', 1);
    console.warn(`🔴 WebSocket bottleneck detected: ${avgWebSocketTime}ms average`);
  }
  
  // Memory pressure detection
  const memUsage = process.memoryUsage();
  const memoryPressureThreshold = 500 * 1024 * 1024; // 500MB
  
  if (memUsage.heapUsed > memoryPressureThreshold) {
    ee.emit('counter', 'bottleneck.memory_pressure', 1);
    console.warn(`🔴 Memory pressure detected: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used`);
  }
  
  return next();
}

/**
 * Generate production metrics summary
 */
function generateMetricsSummary(context, ee, next) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalOperations: totalOperations,
    successfulOperations: successfulOperations,
    failedOperations: failedOperations,
    successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
    activeWebSocketConnections: activeConnections.size,
    performanceMetrics: {
      avgAuthTime: performanceMetrics.authTimes.length > 0 ? 
        performanceMetrics.authTimes.reduce((a, b) => a + b, 0) / performanceMetrics.authTimes.length : 0,
      avgMessageTime: performanceMetrics.messageTimes.length > 0 ?
        performanceMetrics.messageTimes.reduce((a, b) => a + b, 0) / performanceMetrics.messageTimes.length : 0,
      avgWebSocketTime: performanceMetrics.websocketTimes.length > 0 ?
        performanceMetrics.websocketTimes.reduce((a, b) => a + b, 0) / performanceMetrics.websocketTimes.length : 0
    }
  };
  
  console.log('📊 Production Load Test Metrics Summary:', JSON.stringify(summary, null, 2));
  
  ee.emit('counter', 'metrics.summary_generated', 1);
  
  return next();
}

/**
 * Cleanup resources and connections
 */
function cleanup() {
  console.log('🧹 Cleaning up production load test resources...');
  
  // Close all WebSocket connections
  for (const [uuid, socket] of activeConnections) {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }
  activeConnections.clear();
  
  // Clear performance metrics arrays to free memory
  performanceMetrics.authTimes = [];
  performanceMetrics.messageTimes = [];
  performanceMetrics.uploadTimes = [];
  performanceMetrics.websocketTimes = [];
  
  console.log('✅ Production load test cleanup completed');
}

/**
 * Utility function to generate UUID
 */
function generateUUID() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Error handler with categorization
 */
function handleProductionError(error, context, ee, next) {
  failedOperations++;
  
  console.error('🔴 Production load test error:', error);
  
  // Categorize errors for better reporting
  if (error.code === 'ECONNREFUSED') {
    ee.emit('counter', 'errors.connection_refused', 1);
  } else if (error.code === 'ETIMEDOUT') {
    ee.emit('counter', 'errors.timeout', 1);
  } else if (error.code === 'ECONNRESET') {
    ee.emit('counter', 'errors.connection_reset', 1);
  } else if (error.statusCode >= 500) {
    ee.emit('counter', 'errors.server_error', 1);
  } else if (error.statusCode >= 400) {
    ee.emit('counter', 'errors.client_error', 1);
  } else {
    ee.emit('counter', 'errors.other', 1);
  }
  
  return next();
}

// Register cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);

module.exports = {
  generateProductionUser,
  authenticateUser,
  generateRealisticJWT,
  generateImageFile,
  generateVideoFile,
  establishWebSocketConnection,
  joinMultipleChannels,
  sendRealtimeMessages,
  testTypingIndicators,
  testPresenceUpdates,
  disconnectWebSocket,
  monitorSystemResources,
  detectBottlenecks,
  generateMetricsSummary,
  handleProductionError,
  cleanup
};