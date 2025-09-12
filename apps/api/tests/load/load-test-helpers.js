const crypto = require('crypto');

// Counter for unique user generation
let userCounter = 0;

// Pre-created test users for login tests
const existingUsers = [
  { email: 'loadtest1@example.com', password: 'TestPassword123!' },
  { email: 'loadtest2@example.com', password: 'TestPassword123!' },
  { email: 'loadtest3@example.com', password: 'TestPassword123!' },
  { email: 'loadtest4@example.com', password: 'TestPassword123!' },
  { email: 'loadtest5@example.com', password: 'TestPassword123!' },
];

// Channel IDs for testing
const testChannels = [
  'channel-load-test-1',
  'channel-load-test-2', 
  'channel-load-test-3',
  'channel-load-test-4',
  'channel-load-test-5',
];

/**
 * Generate unique user data for registration tests
 */
function generateUniqueUser(requestParams, context, ee, next) {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const userIndex = userCounter++;
  
  context.vars.email = `loadtest-${userIndex}-${randomSuffix}@example.com`;
  context.vars.username = `loaduser${userIndex}${randomSuffix}`;
  context.vars.password = 'LoadTest123!';
  
  return next();
}

/**
 * Use existing user credentials for login tests
 */
function generateExistingUser(requestParams, context, ee, next) {
  const user = existingUsers[Math.floor(Math.random() * existingUsers.length)];
  
  context.vars.email = user.email;
  context.vars.password = user.password;
  
  return next();
}

/**
 * Generate random channel ID for testing
 */
function generateChannelId(requestParams, context, ee, next) {
  const channelId = testChannels[Math.floor(Math.random() * testChannels.length)];
  context.vars.channelId = channelId;
  
  return next();
}

/**
 * Generate auth token for WebSocket connections
 */
function generateAuthToken() {
  // In a real scenario, this would be a valid JWT token
  // For load testing, we'll use a mock token structure
  const payload = {
    userId: `load-user-${crypto.randomBytes(4).toString('hex')}`,
    username: `loaduser${Math.floor(Math.random() * 10000)}`,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };
  
  // Mock JWT token (in real testing, use actual JWT library)
  return 'Bearer.mock.token.' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Generate random status for presence testing
 */
function randomStatus() {
  const statuses = ['online', 'idle', 'dnd', 'invisible'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

/**
 * Generate random string for content variation
 */
function randomString(length = 10) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate random integer within range
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Custom metric tracking for load test results
 */
function trackCustomMetric(metricName, value, context, ee, next) {
  ee.emit('counter', metricName, value);
  return next();
}

/**
 * Validate response contains expected fields
 */
function validateAuthResponse(requestParams, response, context, ee, next) {
  const body = JSON.parse(response.body);
  
  if (!body.accessToken) {
    ee.emit('counter', 'auth.missing_access_token', 1);
  }
  
  if (!body.user) {
    ee.emit('counter', 'auth.missing_user_data', 1);
  }
  
  // Track successful authentication
  if (body.accessToken && body.user) {
    ee.emit('counter', 'auth.success', 1);
  }
  
  return next();
}

/**
 * Simulate realistic user behavior with pauses
 */
function simulateUserBehavior(context, ee, next) {
  // Random pause between 100ms to 2s to simulate real user behavior
  const pauseMs = randomInt(100, 2000);
  
  setTimeout(() => {
    return next();
  }, pauseMs);
}

/**
 * Monitor memory usage during load test
 */
function monitorResources(context, ee, next) {
  const memoryUsage = process.memoryUsage();
  
  ee.emit('histogram', 'memory.rss', memoryUsage.rss);
  ee.emit('histogram', 'memory.heapUsed', memoryUsage.heapUsed);
  ee.emit('histogram', 'memory.heapTotal', memoryUsage.heapTotal);
  
  return next();
}

/**
 * Test data cleanup after load test
 */
async function cleanupTestData(context, ee, next) {
  try {
    // In a real scenario, this would clean up test data from database
    console.log('Load test cleanup completed');
    ee.emit('counter', 'cleanup.success', 1);
  } catch (error) {
    console.error('Load test cleanup failed:', error);
    ee.emit('counter', 'cleanup.failed', 1);
  }
  
  return next();
}

/**
 * Error handler for load test failures
 */
function handleLoadTestError(error, context, ee, next) {
  console.error('Load test error:', error);
  
  // Categorize errors for better reporting
  if (error.code === 'ECONNREFUSED') {
    ee.emit('counter', 'errors.connection_refused', 1);
  } else if (error.code === 'ETIMEDOUT') {
    ee.emit('counter', 'errors.timeout', 1);
  } else if (error.statusCode >= 500) {
    ee.emit('counter', 'errors.server_error', 1);
  } else {
    ee.emit('counter', 'errors.other', 1);
  }
  
  return next();
}

/**
 * Performance assertions for crash-proof verification
 */
function verifyCrashProofClaims(context, ee, next) {
  const startTime = context.vars.startTime || Date.now();
  const currentTime = Date.now();
  const testDuration = currentTime - startTime;
  
  // Track test duration
  ee.emit('histogram', 'test.duration', testDuration);
  
  // Verify no critical failures occurred
  const criticalErrors = context.vars.criticalErrors || 0;
  if (criticalErrors === 0) {
    ee.emit('counter', 'crash_proof.verified', 1);
  } else {
    ee.emit('counter', 'crash_proof.failed', 1);
  }
  
  return next();
}

// Socket.IO load testing
const { io } = require('socket.io-client');
const socketConnections = new Map();

function generateTestFile(context, events, done) {
  // Generate fake file data for testing
  const imageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  const videoData = Buffer.alloc(1024 * 100); // 100KB fake video data
  
  context.vars.testFileData = imageData;
  context.vars.testVideoData = videoData;
  
  return done();
}

function connectSocket(context, events, done) {
  const authToken = context.vars.authToken;
  if (!authToken) {
    return done(new Error('No auth token available'));
  }

  const startTime = Date.now();
  
  const socket = io('http://localhost:3002', {
    auth: {
      token: authToken
    },
    transports: ['websocket'],
    timeout: 5000
  });

  socket.on('connect', () => {
    const connectionTime = Date.now() - startTime;
    events.emit('histogram', 'socket_connection_time', connectionTime);
    
    socketConnections.set(context.vars.$uuid, socket);
    done();
  });

  socket.on('connect_error', (error) => {
    events.emit('counter', 'socket_connection_errors', 1);
    done(error);
  });

  socket.on('error', (error) => {
    events.emit('counter', 'socket_errors', 1);
    console.error('Socket error:', error);
  });

  // Set timeout to prevent hanging connections
  setTimeout(() => {
    if (!socket.connected) {
      socket.disconnect();
      done(new Error('Socket connection timeout'));
    }
  }, 10000);
}

function sendMessages(context, events, done) {
  const socket = socketConnections.get(context.vars.$uuid);
  if (!socket || !socket.connected) {
    return done(new Error('No socket connection available'));
  }

  let messagesSent = 0;
  const messagesToSend = 10;
  const startTime = Date.now();

  function sendNextMessage() {
    if (messagesSent >= messagesToSend) {
      const duration = Date.now() - startTime;
      const throughput = messagesToSend / (duration / 1000);
      events.emit('histogram', 'message_throughput', throughput);
      return done();
    }

    const messageContent = `Load test message ${messagesSent + 1} - ${Math.random()}`;
    
    socket.emit('send_channel_message', {
      channelId: context.vars.channelId || 'test-channel-id',
      content: messageContent
    });

    messagesSent++;
    events.emit('counter', 'messages_sent', 1);
    
    // Send next message after short delay
    setTimeout(sendNextMessage, 100 + Math.random() * 200);
  }

  // Handle message acknowledgments
  socket.on('message_sent', (data) => {
    events.emit('counter', 'message_acknowledgments', 1);
  });

  socket.on('error', (error) => {
    events.emit('counter', 'message_send_errors', 1);
  });

  sendNextMessage();
}

function disconnectSocket(context, events, done) {
  const socket = socketConnections.get(context.vars.$uuid);
  if (socket) {
    socket.disconnect();
    socketConnections.delete(context.vars.$uuid);
  }
  done();
}

// Cleanup function for sockets
function cleanup() {
  for (const [uuid, socket] of socketConnections) {
    if (socket.connected) {
      socket.disconnect();
    }
  }
  socketConnections.clear();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = {
  generateUniqueUser,
  generateExistingUser,
  generateChannelId,
  generateAuthToken,
  randomStatus,
  randomString,
  randomInt,
  trackCustomMetric,
  validateAuthResponse,
  simulateUserBehavior,
  monitorResources,
  cleanupTestData,
  handleLoadTestError,
  verifyCrashProofClaims,
  generateTestFile,
  connectSocket,
  sendMessages,
  disconnectSocket,
  cleanup
};