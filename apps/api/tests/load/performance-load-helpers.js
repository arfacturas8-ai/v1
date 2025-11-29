const crypto = require('crypto');
const { io } = require('socket.io-client');

// Global variables to track test state
let socketConnections = new Map();
let testData = {
  userCount: 0,
  serverCount: 0,
  postCount: 0,
  commentCount: 0
};

/**
 * Generate unique user data for registration
 */
function generateUniqueUserData(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  context.vars.username = `loadtest_${timestamp}_${random}`;
  context.vars.displayName = `Load Test User ${random}`;
  context.vars.email = `loadtest_${timestamp}_${random}@example.com`;
  context.vars.password = 'LoadTest123!';
  
  testData.userCount++;
  
  return next();
}

/**
 * Generate server data for creation
 */
function generateServerData(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  context.vars.serverName = `LoadTest Server ${random}`;
  context.vars.serverDescription = `Performance test server created at ${new Date(timestamp).toISOString()}`;
  
  testData.serverCount++;
  
  return next();
}

/**
 * Generate post data for creation
 */
function generatePostData(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  const titles = [
    'Performance Test Post',
    'Load Testing Discussion',
    'API Benchmark Results',
    'Server Stress Test Update',
    'Concurrent User Analysis'
  ];
  
  const contentTemplates = [
    'This is a performance test post created during load testing. Content length: {length} characters.',
    'Load testing in progress. Random data: {random}. Timestamp: {timestamp}.',
    'API performance analysis post. Generated content for stress testing purposes.',
    'Concurrent user simulation post. Testing database performance under load.',
    'Benchmark data collection post. Monitoring response times and throughput.'
  ];
  
  const selectedTitle = titles[Math.floor(Math.random() * titles.length)];
  const selectedTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  
  const content = selectedTemplate
    .replace('{length}', Math.floor(Math.random() * 500) + 100)
    .replace('{random}', random)
    .replace('{timestamp}', timestamp);
  
  context.vars.postTitle = `${selectedTitle} ${random}`;
  context.vars.postContent = content;
  
  testData.postCount++;
  
  return next();
}

/**
 * Generate comment data for creation
 */
function generateCommentData(requestParams, context, ee, next) {
  const random = Math.random().toString(36).substring(2, 10);
  
  const comments = [
    'Great post! Load testing comment.',
    'Interesting analysis. Performance looks good.',
    'Thanks for sharing this benchmark data.',
    'Concurrent testing results are impressive.',
    'API response times seem reasonable.',
    'Database performance holding up well.',
    'Real-time features working smoothly.'
  ];
  
  const selectedComment = comments[Math.floor(Math.random() * comments.length)];
  context.vars.commentContent = `${selectedComment} Random: ${random}`;
  
  testData.commentCount++;
  
  return next();
}

/**
 * Get random post ID for testing
 */
function getRandomPostId(requestParams, context, ee, next) {
  // Generate a realistic-looking post ID
  const randomId = Math.random().toString(36).substring(2, 15);
  context.vars.randomPostId = randomId;
  return next();
}

/**
 * Generate small image file data for upload testing
 */
function generateSmallImageFile(requestParams, context, ee, next) {
  // Generate a small fake image (1KB)
  const size = 1024;
  const imageData = crypto.randomBytes(size);
  const fileName = `small_image_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  
  context.vars.smallImageData = imageData;
  context.vars.fileName = fileName;
  
  return next();
}

/**
 * Generate medium image file data for upload testing
 */
function generateMediumImageFile(requestParams, context, ee, next) {
  // Generate a medium fake image (100KB)
  const size = 100 * 1024;
  const imageData = crypto.randomBytes(size);
  const fileName = `medium_image_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
  
  context.vars.mediumImageData = imageData;
  context.vars.fileName = fileName;
  
  return next();
}

/**
 * Test WebSocket connection performance
 */
function testWebSocketConnection(requestParams, context, ee, next) {
  const startTime = Date.now();
  const token = context.vars.accessToken;
  const userId = context.vars.userId || Math.random().toString(36);
  
  const socket = io(process.env.API_URL || 'http://localhost:3002', {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    auth: {
      token: token
    }
  });
  
  socket.on('connect', () => {
    const connectionTime = Date.now() - startTime;
    
    // Record connection time metric
    ee.emit('histogram', 'websocket.connection_time', connectionTime);
    ee.emit('counter', 'websocket.connections.established', 1);
    
    socketConnections.set(userId, {
      socket: socket,
      connectedAt: Date.now(),
      messagesSent: 0
    });
    
    context.vars.socketConnected = true;
    context.vars.connectionTime = connectionTime;
    
    next();
  });
  
  socket.on('connect_error', (error) => {
    ee.emit('counter', 'websocket.connections.failed', 1);
    context.vars.socketConnected = false;
    context.vars.connectionError = error.message;
    
    next();
  });
  
  socket.on('disconnect', () => {
    ee.emit('counter', 'websocket.connections.disconnected', 1);
    socketConnections.delete(userId);
  });
  
  // Store socket for cleanup
  context.vars.socketId = userId;
}

/**
 * Perform real-time messaging performance test
 */
function performRealtimeMessaging(requestParams, context, ee, next) {
  const userId = context.vars.socketId;
  const connection = socketConnections.get(userId);
  
  if (!connection || !connection.socket.connected) {
    return next();
  }
  
  const socket = connection.socket;
  const messageCount = 5;
  const channelId = `perf_channel_${Math.random().toString(36).substring(2, 8)}`;
  
  let messagesSent = 0;
  let messagesReceived = 0;
  const startTime = Date.now();
  
  // Join a channel first
  socket.emit('channel:join', { channelId: channelId });
  
  // Listen for message confirmations
  socket.on('message:new', (data) => {
    messagesReceived++;
    ee.emit('counter', 'websocket.messages.received', 1);
    
    if (messagesReceived >= messageCount) {
      const totalTime = Date.now() - startTime;
      ee.emit('histogram', 'websocket.messaging_performance', totalTime);
      next();
    }
  });
  
  // Send messages
  const sendMessage = () => {
    if (messagesSent < messageCount) {
      const message = {
        channelId: channelId,
        content: `Performance test message ${messagesSent + 1} from user ${userId}`,
        type: 'text'
      };
      
      socket.emit('message:send', message);
      messagesSent++;
      connection.messagesSent++;
      
      ee.emit('counter', 'websocket.messages.sent', 1);
      
      // Send next message after short delay
      setTimeout(sendMessage, 100);
    }
  };
  
  // Start sending messages
  sendMessage();
  
  // Timeout handling
  setTimeout(() => {
    if (messagesReceived < messageCount) {
      ee.emit('counter', 'websocket.messaging.timeouts', 1);
      next();
    }
  }, 10000);
}

/**
 * Clean up WebSocket connections
 */
function cleanupWebSocketConnection(requestParams, context, ee, next) {
  const userId = context.vars.socketId;
  const connection = socketConnections.get(userId);
  
  if (connection) {
    connection.socket.disconnect();
    socketConnections.delete(userId);
    
    ee.emit('counter', 'websocket.connections.cleaned_up', 1);
  }
  
  return next();
}

/**
 * Custom metrics collection
 */
function collectCustomMetrics(requestParams, context, ee, next) {
  // Collect memory usage (simplified)
  const memUsage = process.memoryUsage();
  ee.emit('gauge', 'system.memory.rss', memUsage.rss / 1024 / 1024);
  ee.emit('gauge', 'system.memory.heapUsed', memUsage.heapUsed / 1024 / 1024);
  
  // Collect test data metrics
  ee.emit('gauge', 'test.users.created', testData.userCount);
  ee.emit('gauge', 'test.servers.created', testData.serverCount);
  ee.emit('gauge', 'test.posts.created', testData.postCount);
  ee.emit('gauge', 'test.comments.created', testData.commentCount);
  
  // Collect WebSocket metrics
  ee.emit('gauge', 'websocket.active_connections', socketConnections.size);
  
  return next();
}

/**
 * Generate realistic user behavior patterns
 */
function simulateUserBehavior(requestParams, context, ee, next) {
  const behaviors = ['reader', 'contributor', 'lurker', 'power_user'];
  const selectedBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
  
  context.vars.userBehavior = selectedBehavior;
  
  // Set different think times based on behavior
  switch (selectedBehavior) {
    case 'reader':
      context.vars.thinkTime = Math.random() * 3 + 1; // 1-4 seconds
      break;
    case 'contributor':
      context.vars.thinkTime = Math.random() * 2 + 2; // 2-4 seconds
      break;
    case 'lurker':
      context.vars.thinkTime = Math.random() * 5 + 2; // 2-7 seconds
      break;
    case 'power_user':
      context.vars.thinkTime = Math.random() * 1 + 0.5; // 0.5-1.5 seconds
      break;
  }
  
  ee.emit('counter', `user_behavior.${selectedBehavior}`, 1);
  
  return next();
}

/**
 * Performance monitoring hooks
 */
function monitorPerformance(requestParams, context, ee, next) {
  const startTime = Date.now();
  
  // Override the original next function to capture timing
  const originalNext = next;
  context.vars._performanceStart = startTime;
  
  return originalNext();
}

/**
 * Error analysis and categorization
 */
function analyzeError(requestParams, response, context, ee, next) {
  if (response && response.statusCode >= 400) {
    const errorCategory = categorizeError(response.statusCode);
    ee.emit('counter', `errors.${errorCategory}`, 1);
    
    // Log specific error details for analysis
    if (response.statusCode >= 500) {
      ee.emit('counter', 'errors.server_errors', 1);
    } else if (response.statusCode >= 400) {
      ee.emit('counter', 'errors.client_errors', 1);
    }
  }
  
  return next();
}

function categorizeError(statusCode) {
  if (statusCode === 401) return 'unauthorized';
  if (statusCode === 403) return 'forbidden';
  if (statusCode === 404) return 'not_found';
  if (statusCode === 409) return 'conflict';
  if (statusCode === 413) return 'payload_too_large';
  if (statusCode === 429) return 'rate_limited';
  if (statusCode >= 500) return 'server_error';
  return 'client_error';
}

/**
 * Load test completion handler
 */
function onLoadTestComplete(ee) {
  // Clean up any remaining socket connections
  socketConnections.forEach((connection, userId) => {
    if (connection.socket) {
      connection.socket.disconnect();
    }
  });
  
  socketConnections.clear();
  
  // Log final statistics
  console.log('Load test completed. Final statistics:');
  console.log(`Users created: ${testData.userCount}`);
  console.log(`Servers created: ${testData.serverCount}`);
  console.log(`Posts created: ${testData.postCount}`);
  console.log(`Comments created: ${testData.commentCount}`);
}

// Export all functions for Artillery to use
module.exports = {
  generateUniqueUserData,
  generateServerData,
  generatePostData,
  generateCommentData,
  getRandomPostId,
  generateSmallImageFile,
  generateMediumImageFile,
  testWebSocketConnection,
  performRealtimeMessaging,
  cleanupWebSocketConnection,
  collectCustomMetrics,
  simulateUserBehavior,
  monitorPerformance,
  analyzeError,
  onLoadTestComplete
};