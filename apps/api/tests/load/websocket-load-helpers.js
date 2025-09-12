const crypto = require('crypto');
const { io } = require('socket.io-client');

// WebSocket load test configuration
const WEBSOCKET_CONFIG = {
  maxConnectionsPerUser: 3,
  maxChannelsPerConnection: 10,
  messageRateLimit: 60, // messages per minute per user
  typingIndicatorTimeout: 3000,
  presenceUpdateInterval: 30000,
  reconnectionAttempts: 5,
  connectionTimeout: 10000,
  heartbeatInterval: 25000
};

// Real-time event types
const EVENT_TYPES = {
  MESSAGE: 'message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  PRESENCE_UPDATE: 'presence_update',
  VOICE_STATE_UPDATE: 'voice_state_update',
  REACTION_ADD: 'reaction_add',
  NOTIFICATION: 'notification',
  LIVE_EVENT: 'live_event'
};

// Tracking variables
let connectionCounter = 0;
let messageCounter = 0;
let eventCounter = 0;
const activeConnections = new Map();
const connectionMetrics = new Map();
const messageDeliveryTimes = [];
const typingIndicatorTimes = [];
const presenceUpdateTimes = [];

// WebSocket connection pool management
class WebSocketConnectionManager {
  constructor() {
    this.connections = new Map();
    this.connectionStats = {
      established: 0,
      failed: 0,
      dropped: 0,
      recovered: 0
    };
  }
  
  addConnection(id, socket) {
    this.connections.set(id, {
      socket: socket,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      channels: new Set(),
      status: 'connected'
    });
    
    this.connectionStats.established++;
  }
  
  removeConnection(id) {
    const connection = this.connections.get(id);
    if (connection) {
      connection.socket.disconnect();
      this.connections.delete(id);
    }
  }
  
  getConnection(id) {
    return this.connections.get(id);
  }
  
  getAllConnections() {
    return Array.from(this.connections.values());
  }
  
  getStats() {
    return {
      ...this.connectionStats,
      active: this.connections.size,
      totalMessages: Array.from(this.connections.values())
        .reduce((sum, conn) => sum + conn.messagesSent + conn.messagesReceived, 0)
    };
  }
}

const connectionManager = new WebSocketConnectionManager();

/**
 * Authenticate WebSocket connection
 */
function authenticateWebSocket(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done(new Error('No WebSocket connection available'));
  }
  
  const startTime = Date.now();
  const userId = `user-${crypto.randomBytes(6).toString('hex')}`;
  const authToken = generateWebSocketAuthToken(userId);
  
  // Store connection info in context
  context.vars.userId = userId;
  context.vars.authToken = authToken;
  context.vars.connectionId = `conn-${connectionCounter++}`;
  
  // Send authentication
  socket.emit('authenticate', {
    token: authToken,
    userId: userId,
    sessionId: crypto.randomBytes(8).toString('hex')
  });
  
  // Listen for authentication response
  socket.once('authenticated', (data) => {
    const authTime = Date.now() - startTime;
    events.emit('histogram', 'websocket.auth_time', authTime);
    events.emit('counter', 'websocket.auth.successful', 1);
    
    // Add to connection manager
    connectionManager.addConnection(context.vars.connectionId, socket);
    
    // Set up connection event handlers
    setupConnectionEventHandlers(socket, context, events);
    
    done();
  });
  
  socket.once('auth_error', (error) => {
    const authTime = Date.now() - startTime;
    events.emit('histogram', 'websocket.auth_time', authTime);
    events.emit('counter', 'websocket.auth.failed', 1);
    
    done(new Error(`Authentication failed: ${error.message}`));
  });
  
  // Timeout for authentication
  setTimeout(() => {
    if (!context.vars.authenticated) {
      events.emit('counter', 'websocket.auth.timeout', 1);
      done(new Error('Authentication timeout'));
    }
  }, 5000);
}

/**
 * Join multiple channels for realistic usage
 */
function joinMultipleChannels(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done(new Error('No WebSocket connection available'));
  }
  
  const channelsToJoin = [
    'general',
    'random',
    'announcements',
    'gaming',
    'tech-talk'
  ];
  
  const selectedChannels = channelsToJoin
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 2); // Join 2-4 channels
  
  let joinedCount = 0;
  const startTime = Date.now();
  
  selectedChannels.forEach((channelName, index) => {
    setTimeout(() => {
      const joinStartTime = Date.now();
      
      socket.emit('channel:join', {
        channelName: channelName,
        userId: context.vars.userId
      });
      
      socket.once(`channel:joined:${channelName}`, (data) => {
        const joinTime = Date.now() - joinStartTime;
        events.emit('histogram', 'websocket.channel_join_time', joinTime);
        events.emit('counter', 'websocket.channels.joined', 1);
        
        joinedCount++;
        
        if (joinedCount === selectedChannels.length) {
          const totalTime = Date.now() - startTime;
          events.emit('histogram', 'websocket.multi_channel_join_time', totalTime);
          
          context.vars.joinedChannels = selectedChannels;
          
          // Update connection manager
          const connection = connectionManager.getConnection(context.vars.connectionId);
          if (connection) {
            selectedChannels.forEach(ch => connection.channels.add(ch));
          }
          
          done();
        }
      });
      
    }, index * 500); // Stagger joins by 500ms
  });
  
  // Timeout for channel joining
  setTimeout(() => {
    if (joinedCount < selectedChannels.length) {
      events.emit('counter', 'websocket.channel_join.timeout', 1);
      done(new Error('Channel joining timeout'));
    }
  }, 10000);
}

/**
 * Send real-time message
 */
function sendRealtimeMessage(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done(new Error('No WebSocket connection available'));
  }
  
  const channels = context.vars.joinedChannels || ['general'];
  const channel = channels[Math.floor(Math.random() * channels.length)];
  const messageId = `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  
  const messageContent = generateRealisticMessage();
  const sendTime = Date.now();
  
  // Send message
  socket.emit('message:send', {
    channelId: channel,
    content: messageContent,
    messageId: messageId,
    timestamp: sendTime,
    userId: context.vars.userId
  });
  
  // Listen for delivery confirmation
  socket.once(`message:delivered:${messageId}`, (data) => {
    const deliveryTime = Date.now() - sendTime;
    messageDeliveryTimes.push(deliveryTime);
    
    events.emit('histogram', 'websocket.message_delivery_time', deliveryTime);
    events.emit('counter', 'websocket.messages.delivered', 1);
    
    messageCounter++;
    
    // Update connection stats
    const connection = connectionManager.getConnection(context.vars.connectionId);
    if (connection) {
      connection.messagesSent++;
      connection.lastActivity = Date.now();
    }
    
    done();
  });
  
  // Listen for message broadcast (other users receiving)
  socket.on('message:broadcast', (data) => {
    if (data.messageId !== messageId) {
      events.emit('counter', 'websocket.messages.received', 1);
      
      const connection = connectionManager.getConnection(context.vars.connectionId);
      if (connection) {
        connection.messagesReceived++;
        connection.lastActivity = Date.now();
      }
    }
  });
  
  events.emit('counter', 'websocket.messages.sent', 1);
  
  // Timeout for message delivery
  setTimeout(() => {
    events.emit('counter', 'websocket.messages.timeout', 1);
    done(new Error('Message delivery timeout'));
  }, 5000);
}

/**
 * Test typing indicators
 */
function testTypingIndicators(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const channels = context.vars.joinedChannels || ['general'];
  const channel = channels[Math.floor(Math.random() * channels.length)];
  
  const startTime = Date.now();
  
  // Start typing
  socket.emit('typing:start', {
    channelId: channel,
    userId: context.vars.userId
  });
  
  events.emit('counter', 'websocket.typing.started', 1);
  
  // Listen for typing broadcast
  socket.once('typing:user_started', (data) => {
    if (data.userId === context.vars.userId) {
      const indicatorTime = Date.now() - startTime;
      typingIndicatorTimes.push(indicatorTime);
      
      events.emit('histogram', 'websocket.typing_indicator_latency', indicatorTime);
      events.emit('counter', 'websocket.typing.indicator_received', 1);
    }
  });
  
  // Stop typing after realistic duration
  setTimeout(() => {
    socket.emit('typing:stop', {
      channelId: channel,
      userId: context.vars.userId
    });
    
    events.emit('counter', 'websocket.typing.stopped', 1);
    done();
  }, 2000 + Math.random() * 3000); // 2-5 seconds of typing
}

/**
 * Test message reactions
 */
function testMessageReactions(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const reactions = ['👍', '👎', '❤️', '😂', '😮', '🔥'];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  const messageId = `msg-${crypto.randomBytes(6).toString('hex')}`;
  
  const startTime = Date.now();
  
  // Add reaction
  socket.emit('reaction:add', {
    messageId: messageId,
    reaction: reaction,
    userId: context.vars.userId
  });
  
  socket.once('reaction:added', (data) => {
    if (data.userId === context.vars.userId) {
      const reactionTime = Date.now() - startTime;
      events.emit('histogram', 'websocket.reaction_time', reactionTime);
      events.emit('counter', 'websocket.reactions.added', 1);
    }
    done();
  });
  
  events.emit('counter', 'websocket.reactions.sent', 1);
  
  setTimeout(() => {
    events.emit('counter', 'websocket.reactions.timeout', 1);
    done();
  }, 3000);
}

/**
 * Join voice channel
 */
function joinVoiceChannel(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const voiceChannelId = `voice-${Math.floor(Math.random() * 5) + 1}`;
  const startTime = Date.now();
  
  socket.emit('voice:join', {
    channelId: voiceChannelId,
    userId: context.vars.userId,
    muted: Math.random() > 0.7, // 30% start muted
    deafened: Math.random() > 0.9 // 10% start deafened
  });
  
  socket.once('voice:joined', (data) => {
    const joinTime = Date.now() - startTime;
    events.emit('histogram', 'websocket.voice_join_time', joinTime);
    events.emit('counter', 'websocket.voice.joined', 1);
    
    context.vars.voiceChannelId = voiceChannelId;
    done();
  });
  
  setTimeout(() => {
    events.emit('counter', 'websocket.voice.join_timeout', 1);
    done();
  }, 5000);
}

/**
 * Simulate WebRTC signaling
 */
function simulateWebRTCSignaling(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const signaling = [
    'offer',
    'answer',
    'ice-candidate',
    'ice-candidate',
    'ice-candidate'
  ];
  
  let step = 0;
  const startTime = Date.now();
  
  function sendNextSignal() {
    if (step >= signaling.length) {
      const totalTime = Date.now() - startTime;
      events.emit('histogram', 'websocket.webrtc_signaling_time', totalTime);
      events.emit('counter', 'websocket.webrtc.signaling_completed', 1);
      return done();
    }
    
    const signal = signaling[step];
    const stepStartTime = Date.now();
    
    socket.emit('webrtc:signal', {
      type: signal,
      channelId: context.vars.voiceChannelId,
      userId: context.vars.userId,
      data: generateWebRTCSignalData(signal)
    });
    
    socket.once(`webrtc:${signal}_processed`, () => {
      const stepTime = Date.now() - stepStartTime;
      events.emit('histogram', `websocket.webrtc.${signal}_time`, stepTime);
      events.emit('counter', `websocket.webrtc.${signal}`, 1);
      
      step++;
      setTimeout(sendNextSignal, 200 + Math.random() * 300);
    });
  }
  
  sendNextSignal();
  
  setTimeout(() => {
    events.emit('counter', 'websocket.webrtc.signaling_timeout', 1);
    done();
  }, 15000);
}

/**
 * Update voice state
 */
function updateVoiceState(context, events, done) {
  const socket = context.ws;
  if (!socket || !context.vars.voiceChannelId) {
    return done();
  }
  
  const states = ['muted', 'unmuted', 'deafened', 'undeafened'];
  const state = states[Math.floor(Math.random() * states.length)];
  
  socket.emit('voice:state_update', {
    channelId: context.vars.voiceChannelId,
    userId: context.vars.userId,
    state: state,
    timestamp: Date.now()
  });
  
  events.emit('counter', `websocket.voice.${state}`, 1);
  
  setTimeout(done, 100);
}

/**
 * Leave voice channel
 */
function leaveVoiceChannel(context, events, done) {
  const socket = context.ws;
  if (!socket || !context.vars.voiceChannelId) {
    return done();
  }
  
  socket.emit('voice:leave', {
    channelId: context.vars.voiceChannelId,
    userId: context.vars.userId
  });
  
  socket.once('voice:left', () => {
    events.emit('counter', 'websocket.voice.left', 1);
    done();
  });
  
  setTimeout(done, 3000);
}

/**
 * Subscribe to presence updates
 */
function subscribeToPresence(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  socket.emit('presence:subscribe', {
    userId: context.vars.userId
  });
  
  // Listen for presence updates from other users
  socket.on('presence:user_update', (data) => {
    events.emit('counter', 'websocket.presence.updates_received', 1);
  });
  
  events.emit('counter', 'websocket.presence.subscribed', 1);
  setTimeout(done, 500);
}

/**
 * Update presence status
 */
function updatePresenceStatus(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const statuses = ['online', 'idle', 'dnd', 'invisible'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const startTime = Date.now();
  
  socket.emit('presence:update', {
    userId: context.vars.userId,
    status: status,
    lastSeen: Date.now()
  });
  
  socket.once('presence:updated', (data) => {
    if (data.userId === context.vars.userId) {
      const updateTime = Date.now() - startTime;
      presenceUpdateTimes.push(updateTime);
      
      events.emit('histogram', 'websocket.presence_update_latency', updateTime);
      events.emit('counter', 'websocket.presence.updated', 1);
    }
    done();
  });
  
  setTimeout(() => {
    events.emit('counter', 'websocket.presence.update_timeout', 1);
    done();
  }, 2000);
}

/**
 * Update activity status
 */
function updateActivityStatus(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const activities = [
    { type: 'playing', name: 'Load Test Game' },
    { type: 'listening', name: 'Performance Metrics' },
    { type: 'watching', name: 'System Monitoring' },
    { type: 'streaming', name: 'Load Testing Stream' }
  ];
  
  const activity = activities[Math.floor(Math.random() * activities.length)];
  
  socket.emit('activity:update', {
    userId: context.vars.userId,
    activity: activity
  });
  
  events.emit('counter', 'websocket.activity.updated', 1);
  setTimeout(done, 300);
}

/**
 * Subscribe to notifications
 */
function subscribeToNotifications(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  socket.emit('notifications:subscribe', {
    userId: context.vars.userId,
    types: ['messages', 'mentions', 'system']
  });
  
  // Handle incoming notifications
  socket.on('notification:received', (data) => {
    events.emit('counter', 'websocket.notifications.received', 1);
    
    // Acknowledge notification
    socket.emit('notification:ack', {
      notificationId: data.id,
      userId: context.vars.userId
    });
  });
  
  events.emit('counter', 'websocket.notifications.subscribed', 1);
  setTimeout(done, 500);
}

/**
 * Handle notification stream
 */
function handleNotificationStream(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  let notificationsReceived = 0;
  const maxNotifications = 5;
  
  // Simulate notifications
  const notificationInterval = setInterval(() => {
    if (notificationsReceived >= maxNotifications) {
      clearInterval(notificationInterval);
      return done();
    }
    
    // Simulate server sending notification
    socket.emit('notification:simulate', {
      userId: context.vars.userId,
      type: 'test',
      content: `Test notification ${notificationsReceived + 1}`
    });
    
    notificationsReceived++;
  }, 2000);
  
  setTimeout(() => {
    clearInterval(notificationInterval);
    done();
  }, 15000);
}

/**
 * Update notification preferences
 */
function updateNotificationPreferences(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const preferences = {
    messages: Math.random() > 0.2, // 80% enable
    mentions: Math.random() > 0.1, // 90% enable
    system: Math.random() > 0.5,   // 50% enable
    marketing: Math.random() > 0.8 // 20% enable
  };
  
  socket.emit('notifications:preferences', {
    userId: context.vars.userId,
    preferences: preferences
  });
  
  events.emit('counter', 'websocket.notifications.preferences_updated', 1);
  setTimeout(done, 500);
}

/**
 * Join live event stream
 */
function joinLiveEventStream(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  const eventId = `live-event-${Math.floor(Math.random() * 3) + 1}`;
  
  socket.emit('live_event:join', {
    eventId: eventId,
    userId: context.vars.userId
  });
  
  socket.once('live_event:joined', (data) => {
    context.vars.liveEventId = eventId;
    events.emit('counter', 'websocket.live_events.joined', 1);
    done();
  });
  
  setTimeout(done, 3000);
}

/**
 * Send live reaction
 */
function sendLiveReaction(context, events, done) {
  const socket = context.ws;
  if (!socket || !context.vars.liveEventId) {
    return done();
  }
  
  const reactions = ['👏', '🔥', '❤️', '😂', '😮', '👍'];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  
  socket.emit('live_event:reaction', {
    eventId: context.vars.liveEventId,
    userId: context.vars.userId,
    reaction: reaction,
    timestamp: Date.now()
  });
  
  events.emit('counter', 'websocket.live_events.reactions_sent', 1);
  setTimeout(done, 100);
}

/**
 * Participate in live poll
 */
function participateInLivePoll(context, events, done) {
  const socket = context.ws;
  if (!socket || !context.vars.liveEventId) {
    return done();
  }
  
  const pollOptions = ['A', 'B', 'C', 'D'];
  const choice = pollOptions[Math.floor(Math.random() * pollOptions.length)];
  
  socket.emit('live_poll:vote', {
    eventId: context.vars.liveEventId,
    userId: context.vars.userId,
    choice: choice
  });
  
  events.emit('counter', 'websocket.live_polls.votes_cast', 1);
  setTimeout(done, 500);
}

/**
 * Leave live event stream
 */
function leaveLiveEventStream(context, events, done) {
  const socket = context.ws;
  if (!socket || !context.vars.liveEventId) {
    return done();
  }
  
  socket.emit('live_event:leave', {
    eventId: context.vars.liveEventId,
    userId: context.vars.userId
  });
  
  events.emit('counter', 'websocket.live_events.left', 1);
  setTimeout(done, 1000);
}

/**
 * Test connection recovery
 */
function testConnectionRecovery(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  // Simulate connection drop and recovery
  const recoveryStartTime = Date.now();
  
  socket.disconnect();
  events.emit('counter', 'websocket.connections.intentional_drop', 1);
  
  setTimeout(() => {
    socket.connect();
    
    socket.once('connect', () => {
      const recoveryTime = Date.now() - recoveryStartTime;
      events.emit('histogram', 'websocket.connection_recovery_time', recoveryTime);
      events.emit('counter', 'websocket.connections.recovered', 1);
      
      // Re-authenticate after recovery
      authenticateWebSocket(context, events, done);
    });
    
  }, 1000 + Math.random() * 2000); // 1-3 second recovery delay
}

/**
 * Simulate network interruption
 */
function simulateNetworkInterruption(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  // Simulate packet loss by dropping some messages
  const originalEmit = socket.emit;
  let messagesDropped = 0;
  
  socket.emit = function(...args) {
    if (Math.random() > 0.1) { // 10% packet loss
      return originalEmit.apply(this, args);
    } else {
      messagesDropped++;
      events.emit('counter', 'websocket.simulated_packet_loss', 1);
    }
  };
  
  // Test messaging with packet loss
  sendRealtimeMessage(context, events, () => {
    // Restore original emit
    socket.emit = originalEmit;
    
    events.emit('counter', 'websocket.network_interruption_test', 1);
    events.emit('histogram', 'websocket.simulated_packet_drops', messagesDropped);
    
    done();
  });
}

/**
 * Graceful disconnect
 */
function gracefulDisconnect(context, events, done) {
  const socket = context.ws;
  if (!socket) {
    return done();
  }
  
  // Send disconnect intent
  socket.emit('disconnect_intent', {
    userId: context.vars.userId,
    reason: 'load_test_complete'
  });
  
  // Clean disconnect
  socket.disconnect();
  
  // Remove from connection manager
  if (context.vars.connectionId) {
    connectionManager.removeConnection(context.vars.connectionId);
  }
  
  events.emit('counter', 'websocket.connections.graceful_disconnect', 1);
  
  setTimeout(done, 500);
}

/**
 * Utility Functions
 */

function generateWebSocketAuthToken(userId) {
  const payload = {
    userId: userId,
    type: 'websocket',
    permissions: ['send_message', 'join_channel', 'voice_chat'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  return `ws.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

function generateRealisticMessage() {
  const messageTypes = [
    'Hey everyone! 👋',
    'Anyone online?',
    'Just finished a great gaming session',
    'Check out this cool project I\'m working on',
    'Load test message with random data: {{ randomData }}',
    'How\'s everyone doing today?',
    'GG everyone!',
    'Thanks for the help',
    'Who wants to join voice chat?',
    'This is a longer message to test various message lengths and see how the system handles different content sizes and types'
  ];
  
  let message = messageTypes[Math.floor(Math.random() * messageTypes.length)];
  
  // Replace template variables
  message = message.replace('{{ randomData }}', crypto.randomBytes(4).toString('hex'));
  
  return message;
}

function generateWebRTCSignalData(signalType) {
  const mockData = {
    offer: { sdp: 'mock-offer-sdp', type: 'offer' },
    answer: { sdp: 'mock-answer-sdp', type: 'answer' },
    'ice-candidate': { 
      candidate: 'candidate:mock-ice-candidate',
      sdpMid: 'audio',
      sdpMLineIndex: 0 
    }
  };
  
  return mockData[signalType] || { mock: true };
}

function setupConnectionEventHandlers(socket, context, events) {
  // Connection quality monitoring
  socket.on('ping', () => {
    const pongTime = Date.now();
    socket.emit('pong', pongTime);
  });
  
  // Error handling
  socket.on('error', (error) => {
    events.emit('counter', 'websocket.errors', 1);
    console.error('WebSocket error:', error);
  });
  
  // Connection events
  socket.on('disconnect', (reason) => {
    events.emit('counter', 'websocket.disconnections', 1);
    
    const connection = connectionManager.getConnection(context.vars.connectionId);
    if (connection) {
      connection.status = 'disconnected';
      connectionManager.connectionStats.dropped++;
    }
  });
  
  socket.on('reconnect', () => {
    events.emit('counter', 'websocket.reconnections', 1);
    
    const connection = connectionManager.getConnection(context.vars.connectionId);
    if (connection) {
      connection.status = 'connected';
      connectionManager.connectionStats.recovered++;
    }
  });
}

/**
 * Monitor WebSocket metrics
 */
function monitorWebSocketMetrics(context, events, done) {
  const stats = connectionManager.getStats();
  
  // Connection metrics
  events.emit('gauge', 'websocket.active_connections', stats.active);
  events.emit('gauge', 'websocket.total_established', stats.established);
  events.emit('gauge', 'websocket.total_failed', stats.failed);
  events.emit('gauge', 'websocket.total_dropped', stats.dropped);
  events.emit('gauge', 'websocket.total_recovered', stats.recovered);
  
  // Message metrics
  events.emit('gauge', 'websocket.total_messages', messageCounter);
  events.emit('gauge', 'websocket.total_events', eventCounter);
  
  // Performance metrics
  if (messageDeliveryTimes.length > 0) {
    const avgDeliveryTime = messageDeliveryTimes.reduce((a, b) => a + b, 0) / messageDeliveryTimes.length;
    events.emit('histogram', 'websocket.avg_message_delivery_time', avgDeliveryTime);
  }
  
  if (typingIndicatorTimes.length > 0) {
    const avgTypingTime = typingIndicatorTimes.reduce((a, b) => a + b, 0) / typingIndicatorTimes.length;
    events.emit('histogram', 'websocket.avg_typing_indicator_time', avgTypingTime);
  }
  
  if (presenceUpdateTimes.length > 0) {
    const avgPresenceTime = presenceUpdateTimes.reduce((a, b) => a + b, 0) / presenceUpdateTimes.length;
    events.emit('histogram', 'websocket.avg_presence_update_time', avgPresenceTime);
  }
  
  done();
}

/**
 * Cleanup WebSocket resources
 */
function cleanupWebSocketResources() {
  console.log('🧹 Cleaning up WebSocket load test resources...');
  
  // Close all active connections
  const connections = connectionManager.getAllConnections();
  connections.forEach(connection => {
    if (connection.socket && connection.socket.connected) {
      connection.socket.disconnect();
    }
  });
  
  // Clear tracking data
  activeConnections.clear();
  connectionMetrics.clear();
  messageDeliveryTimes.length = 0;
  typingIndicatorTimes.length = 0;
  presenceUpdateTimes.length = 0;
  
  console.log('✅ WebSocket load test cleanup completed');
}

// Register cleanup handlers
process.on('SIGINT', cleanupWebSocketResources);
process.on('SIGTERM', cleanupWebSocketResources);
process.on('beforeExit', cleanupWebSocketResources);

module.exports = {
  authenticateWebSocket,
  joinMultipleChannels,
  sendRealtimeMessage,
  testTypingIndicators,
  testMessageReactions,
  joinVoiceChannel,
  simulateWebRTCSignaling,
  updateVoiceState,
  leaveVoiceChannel,
  subscribeToPresence,
  updatePresenceStatus,
  updateActivityStatus,
  subscribeToNotifications,
  handleNotificationStream,
  updateNotificationPreferences,
  joinLiveEventStream,
  sendLiveReaction,
  participateInLivePoll,
  leaveLiveEventStream,
  testConnectionRecovery,
  simulateNetworkInterruption,
  gracefulDisconnect,
  monitorWebSocketMetrics,
  cleanupWebSocketResources
};