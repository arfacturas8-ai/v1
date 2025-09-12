const crypto = require('crypto');
const { io } = require('socket.io-client');

// Discord-specific configuration
const DISCORD_CONFIG = {
  maxServersPerUser: 100,
  maxChannelsPerServer: 500,
  maxMembersPerServer: 800000,
  messageRateLimit: 5, // 5 messages per 5 seconds per channel
  voiceTimeout: 30000,
  maxVoiceUsers: 99
};

// Tracking variables
let userCounter = 0;
let serverCounter = 0;
let messageCounter = 0;
const activeServers = new Map();
const activeVoiceConnections = new Map();
const discordWebSockets = new Map();

// Pre-created test users for Discord load testing
const discordUsers = [
  { email: 'gamer1@example.com', password: 'DiscordTest123!', username: 'ProGamer2024' },
  { email: 'streamer@example.com', password: 'DiscordTest123!', username: 'StreamMaster' },
  { email: 'moderator@example.com', password: 'DiscordTest123!', username: 'ModSquad' },
  { email: 'community@example.com', password: 'DiscordTest123!', username: 'CommunityLead' },
  { email: 'developer@example.com', password: 'DiscordTest123!', username: 'CodeWizard' },
  { email: 'artist@example.com', password: 'DiscordTest123!', username: 'PixelArtist' },
  { email: 'musician@example.com', password: 'DiscordTest123!', username: 'BeatMaker' },
  { email: 'student@example.com', password: 'DiscordTest123!', username: 'StudyBuddy' },
  { email: 'teacher@example.com', password: 'DiscordTest123!', username: 'EduMentor' },
  { email: 'casual@example.com', password: 'DiscordTest123!', username: 'CasualUser' }
];

// Server types and their characteristics
const serverTypes = {
  gaming: {
    categories: ['General', 'Gaming', 'Voice Channels', 'Events'],
    defaultChannels: ['welcome', 'general', 'announcements', 'gaming', 'lfg', 'voice-lobby'],
    description: 'A community for gamers to connect and play together'
  },
  community: {
    categories: ['Welcome', 'General Chat', 'Projects', 'Help'],
    defaultChannels: ['rules', 'introductions', 'general', 'projects', 'help', 'voice-general'],
    description: 'A welcoming community for everyone to share and learn'
  },
  study: {
    categories: ['Study Rooms', 'Resources', 'Social'],
    defaultChannels: ['announcements', 'study-general', 'homework-help', 'resources', 'study-room-1'],
    description: 'Study together and achieve academic success'
  },
  tech: {
    categories: ['Development', 'Support', 'Showcase'],
    defaultChannels: ['general', 'development', 'code-review', 'showcase', 'help', 'dev-voice'],
    description: 'Technology enthusiasts sharing knowledge and building together'
  }
};

/**
 * Authenticate Discord user with realistic data
 */
function authenticateDiscordUser(context, ee, next) {
  const user = discordUsers[userCounter % discordUsers.length];
  userCounter++;
  
  // Set user context
  context.vars.email = user.email;
  context.vars.username = user.username;
  context.vars.password = user.password;
  context.vars.authToken = generateDiscordToken(user);
  
  // Set server type for this session
  const serverTypeKeys = Object.keys(serverTypes);
  context.vars.serverType = serverTypeKeys[Math.floor(Math.random() * serverTypeKeys.length)];
  context.vars.channelTypes = serverTypes[context.vars.serverType].defaultChannels.map(name => ({
    name: name,
    type: name.includes('voice') ? 'voice' : 'text'
  }));
  
  ee.emit('counter', 'discord.users.authenticated', 1);
  return next();
}

/**
 * Generate realistic Discord JWT token
 */
function generateDiscordToken(user) {
  const payload = {
    userId: `discord-user-${crypto.randomBytes(8).toString('hex')}`,
    username: user.username,
    discriminator: String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0'),
    email: user.email,
    verified: true,
    mfaEnabled: Math.random() > 0.7, // 30% have MFA enabled
    flags: 0,
    premiumType: Math.random() > 0.8 ? 2 : 0, // 20% have Discord Nitro
    publicFlags: 0,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  };
  
  return `discord.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

/**
 * Join a random existing server for testing
 */
function joinRandomServer(context, ee, next) {
  const serverIds = Array.from(activeServers.keys());
  
  if (serverIds.length > 0) {
    const randomServer = serverIds[Math.floor(Math.random() * serverIds.length)];
    const serverData = activeServers.get(randomServer);
    
    context.vars.serverId = randomServer;
    context.vars.inviteCode = serverData.inviteCode;
    context.vars.channelId = serverData.channels[Math.floor(Math.random() * serverData.channels.length)];
    
    ee.emit('counter', 'discord.servers.joined_existing', 1);
  } else {
    // Create a default server if none exist
    const serverId = `discord-server-${crypto.randomBytes(8).toString('hex')}`;
    const channelId = `discord-channel-${crypto.randomBytes(8).toString('hex')}`;
    
    activeServers.set(serverId, {
      inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
      channels: [channelId],
      voiceChannels: []
    });
    
    context.vars.serverId = serverId;
    context.vars.channelId = channelId;
    
    ee.emit('counter', 'discord.servers.default_created', 1);
  }
  
  return next();
}

/**
 * Generate realistic Discord message content
 */
function generateMessageContent(requestParams, context, ee, next) {
  const messageTypes = [
    'text',      // 60%
    'embed',     // 15%
    'file',      // 10%
    'reaction',  // 10%
    'mention'    // 5%
  ];
  
  const weights = [60, 15, 10, 10, 5];
  let random = Math.random() * 100;
  let messageType = 'text';
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      messageType = messageTypes[i];
      break;
    }
  }
  
  const messageTemplates = {
    text: [
      'Hey everyone! How\'s your day going?',
      'Just finished a great gaming session 🎮',
      'Anyone want to join voice chat?',
      'Check out this cool project I\'m working on',
      'Thanks for the help earlier @everyone',
      'Loading test message with random content {{ $randomString() }}',
      'GG everyone, great match!',
      'Who\'s ready for the event tonight?',
      'Just discovered this amazing feature!',
      'Can someone help me with this issue?'
    ],
    embed: {
      title: 'Load Test Embed',
      description: 'This is an embedded message for load testing',
      color: 0x7289DA,
      fields: [
        { name: 'Field 1', value: 'Value 1', inline: true },
        { name: 'Field 2', value: 'Value 2', inline: true }
      ],
      timestamp: new Date().toISOString()
    },
    file: 'Loading test file attachment simulation',
    reaction: '👍 React to this message!',
    mention: 'Hey <@!{{ $randomInt(100000000000000000, 999999999999999999) }}>, check this out!'
  };
  
  let content, embed = null;
  
  switch (messageType) {
    case 'embed':
      content = 'Check out this embed!';
      embed = messageTemplates.embed;
      break;
    case 'file':
      content = messageTemplates.file;
      break;
    case 'reaction':
      content = messageTemplates.reaction;
      break;
    case 'mention':
      content = messageTemplates.mention;
      break;
    default:
      content = messageTemplates.text[Math.floor(Math.random() * messageTemplates.text.length)];
  }
  
  context.vars.messageContent = content;
  context.vars.messageEmbed = embed;
  context.vars.messageNonce = `${Date.now()}-${messageCounter++}`;
  context.vars.messageType = messageType;
  
  ee.emit('counter', `discord.messages.type.${messageType}`, 1);
  
  return next();
}

/**
 * Maybe react to a message (20% chance)
 */
function maybeReactToMessage(context, ee, next) {
  if (Math.random() > 0.8) { // 20% chance
    const messageId = context.vars.messageId;
    const reactions = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯'];
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    
    // Simulate reaction API call (would be actual HTTP request in real implementation)
    setTimeout(() => {
      ee.emit('counter', 'discord.messages.reactions_added', 1);
      ee.emit('histogram', 'discord.reaction_time', 50 + Math.random() * 100);
    }, 100);
  }
  
  return next();
}

/**
 * Maybe edit a message (10% chance)
 */
function maybeEditMessage(context, ee, next) {
  if (Math.random() > 0.9) { // 10% chance
    const messageId = context.vars.messageId;
    const editedContent = `${context.vars.messageContent} (edited)`;
    
    // Simulate edit API call
    setTimeout(() => {
      ee.emit('counter', 'discord.messages.edited', 1);
      ee.emit('histogram', 'discord.edit_time', 100 + Math.random() * 200);
    }, 150);
  }
  
  return next();
}

/**
 * Maybe bulk delete messages (1% chance, moderator action)
 */
function maybeBulkDeleteMessages(context, ee, next) {
  if (Math.random() > 0.99) { // 1% chance
    const channelId = context.vars.channelId;
    const messagesToDelete = Math.floor(Math.random() * 10) + 2; // 2-11 messages
    
    // Simulate bulk delete API call
    setTimeout(() => {
      ee.emit('counter', 'discord.messages.bulk_deleted', messagesToDelete);
      ee.emit('histogram', 'discord.bulk_delete_time', 500 + Math.random() * 1000);
    }, 200);
  }
  
  return next();
}

/**
 * Find available voice channel
 */
function findVoiceChannel(context, ee, next) {
  const serverId = context.vars.serverId;
  const serverData = activeServers.get(serverId);
  
  if (serverData && serverData.voiceChannels && serverData.voiceChannels.length > 0) {
    context.vars.voiceChannelId = serverData.voiceChannels[0];
  } else {
    // Create a default voice channel
    const voiceChannelId = `discord-voice-${crypto.randomBytes(8).toString('hex')}`;
    context.vars.voiceChannelId = voiceChannelId;
    
    if (serverData) {
      serverData.voiceChannels = serverData.voiceChannels || [];
      serverData.voiceChannels.push(voiceChannelId);
    }
  }
  
  return next();
}

/**
 * Connect to Discord WebSocket
 */
function connectDiscordWebSocket(context, ee, next) {
  const startTime = Date.now();
  const userId = context.vars.userId || crypto.randomBytes(8).toString('hex');
  
  try {
    const socket = io('http://localhost:3002', {
      auth: { 
        token: context.vars.authToken,
        type: 'discord'
      },
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true
    });
    
    socket.on('connect', () => {
      const connectionTime = Date.now() - startTime;
      
      ee.emit('histogram', 'discord.websocket.connection_time', connectionTime);
      ee.emit('counter', 'discord.websocket.connections_established', 1);
      
      discordWebSockets.set(userId, socket);
      context.vars.discordWebSocketConnected = true;
      
      // Send identify payload
      socket.emit('identify', {
        token: context.vars.authToken,
        properties: {
          $os: 'linux',
          $browser: 'load-test',
          $device: 'load-test'
        },
        compress: false,
        large_threshold: 50,
        shard: [0, 1],
        presence: {
          status: 'online',
          afk: false,
          activities: [{
            name: 'Load Testing',
            type: 0 // Playing
          }]
        },
        intents: 32767 // All intents for testing
      });
      
      next();
    });
    
    socket.on('connect_error', (error) => {
      ee.emit('counter', 'discord.websocket.connection_errors', 1);
      console.error('Discord WebSocket connection error:', error);
      next(error);
    });
    
    socket.on('disconnect', (reason) => {
      ee.emit('counter', 'discord.websocket.disconnections', 1);
      discordWebSockets.delete(userId);
    });
    
    // Handle Discord gateway events
    socket.on('hello', (data) => {
      ee.emit('counter', 'discord.gateway.hello_received', 1);
      // Start heartbeat interval
      if (data.heartbeat_interval) {
        const heartbeatInterval = setInterval(() => {
          if (socket.connected) {
            socket.emit('heartbeat', Date.now());
          } else {
            clearInterval(heartbeatInterval);
          }
        }, data.heartbeat_interval);
      }
    });
    
    socket.on('ready', (data) => {
      ee.emit('counter', 'discord.gateway.ready_received', 1);
      context.vars.discordSessionId = data.session_id;
      context.vars.discordUserId = data.user.id;
    });
    
  } catch (error) {
    ee.emit('counter', 'discord.websocket.connection_failed', 1);
    console.error('Discord WebSocket connection failed:', error);
    next(error);
  }
}

/**
 * Subscribe to guild events
 */
function subscribeToGuildEvents(context, ee, next) {
  const userId = context.vars.userId || crypto.randomBytes(8).toString('hex');
  const socket = discordWebSockets.get(userId);
  
  if (!socket || !socket.connected) {
    return next();
  }
  
  const serverId = context.vars.serverId;
  
  // Subscribe to guild events
  socket.emit('guild_subscribe', {
    guild_id: serverId,
    typing: true,
    activities: true,
    threads: true
  });
  
  // Handle various Discord events
  socket.on('message_create', (data) => {
    ee.emit('counter', 'discord.events.message_create', 1);
  });
  
  socket.on('message_update', (data) => {
    ee.emit('counter', 'discord.events.message_update', 1);
  });
  
  socket.on('message_delete', (data) => {
    ee.emit('counter', 'discord.events.message_delete', 1);
  });
  
  socket.on('typing_start', (data) => {
    ee.emit('counter', 'discord.events.typing_start', 1);
  });
  
  socket.on('presence_update', (data) => {
    ee.emit('counter', 'discord.events.presence_update', 1);
  });
  
  socket.on('voice_state_update', (data) => {
    ee.emit('counter', 'discord.events.voice_state_update', 1);
  });
  
  setTimeout(next, 1000); // Wait for subscription to establish
}

/**
 * Simulate user activity on Discord
 */
function simulateUserActivity(context, ee, next) {
  const userId = context.vars.userId || crypto.randomBytes(8).toString('hex');
  const socket = discordWebSockets.get(userId);
  
  if (!socket || !socket.connected) {
    return next();
  }
  
  const activities = [
    () => {
      // Send typing indicator
      socket.emit('typing_start', {
        channel_id: context.vars.channelId
      });
      ee.emit('counter', 'discord.activity.typing_started', 1);
      
      setTimeout(() => {
        socket.emit('typing_stop', {
          channel_id: context.vars.channelId
        });
        ee.emit('counter', 'discord.activity.typing_stopped', 1);
      }, 2000 + Math.random() * 3000);
    },
    () => {
      // Update presence
      socket.emit('presence_update', {
        status: ['online', 'idle', 'dnd'][Math.floor(Math.random() * 3)],
        activities: [{
          name: ['Load Testing', 'Gaming', 'Coding', 'Streaming'][Math.floor(Math.random() * 4)],
          type: Math.floor(Math.random() * 4)
        }]
      });
      ee.emit('counter', 'discord.activity.presence_updated', 1);
    },
    () => {
      // Request guild members
      socket.emit('request_guild_members', {
        guild_id: context.vars.serverId,
        query: '',
        limit: 0
      });
      ee.emit('counter', 'discord.activity.members_requested', 1);
    }
  ];
  
  // Perform random activities
  const numActivities = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numActivities; i++) {
    setTimeout(() => {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      activity();
    }, i * 1000);
  }
  
  setTimeout(next, numActivities * 1000 + 2000);
}

/**
 * Handle real-time Discord events
 */
function handleRealtimeEvents(context, ee, next) {
  const userId = context.vars.userId || crypto.randomBytes(8).toString('hex');
  const socket = discordWebSockets.get(userId);
  
  if (!socket || !socket.connected) {
    return next();
  }
  
  let eventsHandled = 0;
  const startTime = Date.now();
  
  // Set up event handlers with performance tracking
  const eventHandlers = {
    'message_create': (data) => {
      eventsHandled++;
      ee.emit('counter', 'discord.events.handled.message_create', 1);
      ee.emit('histogram', 'discord.event_processing_time', Date.now() - data.timestamp);
    },
    'guild_member_add': (data) => {
      eventsHandled++;
      ee.emit('counter', 'discord.events.handled.member_add', 1);
    },
    'guild_member_remove': (data) => {
      eventsHandled++;
      ee.emit('counter', 'discord.events.handled.member_remove', 1);
    },
    'channel_create': (data) => {
      eventsHandled++;
      ee.emit('counter', 'discord.events.handled.channel_create', 1);
    },
    'channel_update': (data) => {
      eventsHandled++;
      ee.emit('counter', 'discord.events.handled.channel_update', 1);
    },
    'channel_delete': (data) => {
      eventsHandled++;
      ee.emit('counter', 'discord.events.handled.channel_delete', 1);
    }
  };
  
  // Register event handlers
  Object.entries(eventHandlers).forEach(([event, handler]) => {
    socket.on(event, handler);
  });
  
  // Wait and then clean up handlers
  setTimeout(() => {
    Object.keys(eventHandlers).forEach(event => {
      socket.off(event);
    });
    
    const duration = Date.now() - startTime;
    const eventsPerSecond = eventsHandled / (duration / 1000);
    
    ee.emit('histogram', 'discord.events.handling_duration', duration);
    ee.emit('histogram', 'discord.events.rate', eventsPerSecond);
    ee.emit('counter', 'discord.events.total_handled', eventsHandled);
    
    next();
  }, 10000); // Listen for 10 seconds
}

/**
 * Disconnect Discord WebSocket
 */
function disconnectDiscordWebSocket(context, ee, next) {
  const userId = context.vars.userId || crypto.randomBytes(8).toString('hex');
  const socket = discordWebSockets.get(userId);
  
  if (socket && socket.connected) {
    socket.disconnect();
    discordWebSockets.delete(userId);
    ee.emit('counter', 'discord.websocket.connections_closed', 1);
  }
  
  next();
}

/**
 * Monitor Discord-specific performance metrics
 */
function monitorDiscordMetrics(context, ee, next) {
  // Server metrics
  ee.emit('gauge', 'discord.active_servers', activeServers.size);
  ee.emit('gauge', 'discord.active_voice_connections', activeVoiceConnections.size);
  ee.emit('gauge', 'discord.active_websockets', discordWebSockets.size);
  
  // Calculate total channels across all servers
  let totalChannels = 0;
  let totalVoiceChannels = 0;
  
  for (const serverData of activeServers.values()) {
    totalChannels += serverData.channels ? serverData.channels.length : 0;
    totalVoiceChannels += serverData.voiceChannels ? serverData.voiceChannels.length : 0;
  }
  
  ee.emit('gauge', 'discord.total_channels', totalChannels);
  ee.emit('gauge', 'discord.total_voice_channels', totalVoiceChannels);
  ee.emit('gauge', 'discord.messages_sent', messageCounter);
  
  return next();
}

/**
 * Cleanup Discord resources
 */
function cleanupDiscordResources() {
  console.log('🧹 Cleaning up Discord load test resources...');
  
  // Close all WebSocket connections
  for (const [userId, socket] of discordWebSockets) {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }
  discordWebSockets.clear();
  
  // Clear active connections
  activeVoiceConnections.clear();
  activeServers.clear();
  
  console.log('✅ Discord load test cleanup completed');
}

// Register cleanup handlers
process.on('SIGINT', cleanupDiscordResources);
process.on('SIGTERM', cleanupDiscordResources);
process.on('beforeExit', cleanupDiscordResources);

module.exports = {
  authenticateDiscordUser,
  generateDiscordToken,
  joinRandomServer,
  generateMessageContent,
  maybeReactToMessage,
  maybeEditMessage,
  maybeBulkDeleteMessages,
  findVoiceChannel,
  connectDiscordWebSocket,
  subscribeToGuildEvents,
  simulateUserActivity,
  handleRealtimeEvents,
  disconnectDiscordWebSocket,
  monitorDiscordMetrics,
  cleanupDiscordResources
};