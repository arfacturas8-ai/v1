// WebSocket load test processor functions
const crypto = require('crypto');

module.exports = {
  // Generate random string for message IDs
  randomString: function(context, events, done) {
    context.vars.randomId = crypto.randomBytes(8).toString('hex');
    return done();
  },

  // Generate timestamp for messages
  timestamp: function(context, events, done) {
    context.vars.timestamp = Date.now();
    return done();
  },

  // Generate random integer within range
  randomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Validate WebSocket connection
  validateConnection: function(context, events, done) {
    if (context.ws && context.ws.readyState === 1) {
      context.vars.connected = true;
    } else {
      context.vars.connected = false;
      console.error('WebSocket connection failed');
    }
    return done();
  },

  // Handle WebSocket messages
  handleMessage: function(context, events, done) {
    context.ws.on('message', function(data) {
      try {
        const message = JSON.parse(data);
        
        // Track different message types
        if (message.event === 'message_received') {
          context.vars.messagesReceived = (context.vars.messagesReceived || 0) + 1;
        } else if (message.event === 'user_joined') {
          context.vars.userJoined = (context.vars.userJoined || 0) + 1;
        } else if (message.event === 'typing_indicator') {
          context.vars.typingIndicators = (context.vars.typingIndicators || 0) + 1;
        }
        
        // Log errors
        if (message.error) {
          console.error('WebSocket error:', message.error);
          context.vars.wsErrors = (context.vars.wsErrors || 0) + 1;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
    
    return done();
  },

  // Simulate realistic user behavior
  simulateUserBehavior: function(context, events, done) {
    const behaviors = [
      'active',      // Sends messages frequently
      'passive',     // Reads but rarely sends
      'lurker',      // Connects but minimal activity
      'moderator'    // Higher activity, uses mod features
    ];
    
    context.vars.userBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
    
    // Adjust activity based on behavior
    switch (context.vars.userBehavior) {
      case 'active':
        context.vars.messageFrequency = 'high';
        context.vars.reactionRate = 0.8;
        break;
      case 'passive':
        context.vars.messageFrequency = 'low';
        context.vars.reactionRate = 0.3;
        break;
      case 'lurker':
        context.vars.messageFrequency = 'minimal';
        context.vars.reactionRate = 0.1;
        break;
      case 'moderator':
        context.vars.messageFrequency = 'high';
        context.vars.reactionRate = 0.5;
        context.vars.hasModerationRights = true;
        break;
    }
    
    return done();
  },

  // Generate realistic message content
  generateMessageContent: function(context, events, done) {
    const messageTemplates = [
      "Hey everyone! How's it going?",
      "Just joined the conversation 👋",
      "Great discussion happening here",
      "I have a question about {{topic}}",
      "Thanks for sharing that link!",
      "{{emoji}} {{emoji}} {{emoji}}",
      "Anyone else experiencing this issue?",
      "Load test message {{timestamp}}",
      "Testing platform performance",
      "Real-time messaging works great!"
    ];
    
    const emojis = ['👍', '❤️', '😂', '😮', '🚀', '💯', '🔥', '✨'];
    const topics = ['JavaScript', 'React', 'Node.js', 'WebSockets', 'Performance', 'Testing'];
    
    let template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
    
    // Replace placeholders
    template = template.replace('{{emoji}}', emojis[Math.floor(Math.random() * emojis.length)]);
    template = template.replace('{{topic}}', topics[Math.floor(Math.random() * topics.length)]);
    template = template.replace('{{timestamp}}', Date.now());
    
    context.vars.messageContent = template;
    return done();
  },

  // Track performance metrics
  trackMetrics: function(context, events, done) {
    const startTime = context.vars.startTime || Date.now();
    const currentTime = Date.now();
    const duration = currentTime - startTime;
    
    // Track connection duration
    context.vars.connectionDuration = duration;
    
    // Calculate message rate
    const messagesSent = context.vars.messagesSent || 0;
    context.vars.messageRate = messagesSent / (duration / 1000);
    
    // Track latency (simplified)
    if (context.vars.lastMessageSent && context.vars.lastMessageReceived) {
      context.vars.messageLatency = context.vars.lastMessageReceived - context.vars.lastMessageSent;
    }
    
    return done();
  },

  // Clean up resources
  cleanup: function(context, events, done) {
    if (context.ws) {
      context.ws.close();
    }
    
    // Log final metrics
    console.log('Test session completed:', {
      duration: context.vars.connectionDuration,
      messagesSent: context.vars.messagesSent || 0,
      messagesReceived: context.vars.messagesReceived || 0,
      messageRate: context.vars.messageRate || 0,
      errors: context.vars.wsErrors || 0
    });
    
    return done();
  },

  // Handle connection errors
  handleConnectionError: function(context, events, done) {
    context.ws.on('error', function(error) {
      console.error('WebSocket connection error:', error);
      context.vars.connectionErrors = (context.vars.connectionErrors || 0) + 1;
    });
    
    context.ws.on('close', function(code, reason) {
      console.log('WebSocket connection closed:', code, reason);
      context.vars.connectionClosed = true;
    });
    
    return done();
  },

  // Simulate network conditions
  simulateNetworkConditions: function(context, events, done) {
    const conditions = ['good', 'fair', 'poor', 'unstable'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    context.vars.networkCondition = condition;
    
    // Adjust behavior based on network condition
    switch (condition) {
      case 'good':
        context.vars.messageDelay = 0;
        context.vars.dropRate = 0;
        break;
      case 'fair':
        context.vars.messageDelay = Math.random() * 100;
        context.vars.dropRate = 0.02;
        break;
      case 'poor':
        context.vars.messageDelay = Math.random() * 500;
        context.vars.dropRate = 0.05;
        break;
      case 'unstable':
        context.vars.messageDelay = Math.random() * 1000;
        context.vars.dropRate = 0.1;
        break;
    }
    
    return done();
  },

  // Monitor memory usage
  monitorMemory: function(context, events, done) {
    const memUsage = process.memoryUsage();
    context.vars.memoryUsage = {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };
    
    // Log memory usage periodically
    if (Math.random() < 0.1) { // 10% chance to log
      console.log('Memory usage:', context.vars.memoryUsage);
    }
    
    return done();
  },

  // Validate message integrity
  validateMessage: function(context, events, done) {
    if (context.vars.lastReceivedMessage) {
      const message = context.vars.lastReceivedMessage;
      
      // Basic validation
      if (!message.id || !message.timestamp || !message.author) {
        console.error('Invalid message structure:', message);
        context.vars.invalidMessages = (context.vars.invalidMessages || 0) + 1;
      }
      
      // Check for message ordering
      if (context.vars.lastMessageTimestamp && 
          message.timestamp < context.vars.lastMessageTimestamp) {
        console.warn('Message received out of order');
        context.vars.outOfOrderMessages = (context.vars.outOfOrderMessages || 0) + 1;
      }
      
      context.vars.lastMessageTimestamp = message.timestamp;
    }
    
    return done();
  }
};