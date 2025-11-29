/**
 * WebSocket Service for CRYB Platform
 * Handles real-time communication via Socket.IO with HTTP polling fallback
 */

import { io } from 'socket.io-client';
import apiService, { WS_BASE_URL, API_BASE_URL } from './api';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;
    this.eventHandlers = new Map();
    this.currentUser = null;
    this.currentChannel = null;
    this.currentServer = null;
    this.onlineUsers = new Set();
    this.typingUsers = new Map();

    // Fallback polling mechanism
    this.usePolling = false;
    this.pollingInterval = null;
    this.pollingRate = 2000; // 2 seconds
    this.lastMessageTimestamp = Date.now();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.socketIOFailed = false;
  }

  // Initialize WebSocket connection with fallback
  async connect(user = null) {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.currentUser = user || this.getCurrentUser();

    if (!this.currentUser) {
      console.error('Cannot connect WebSocket: No user data available');
      this.isConnecting = false;
      return;
    }

    // Try Socket.IO WebSocket first
    if (!this.socketIOFailed && this.connectionAttempts < this.maxConnectionAttempts) {
      try {
        await this.connectSocketIO();
      } catch (error) {
        console.warn('Socket.IO connection failed, attempting fallback to HTTP polling:', error);
        this.connectionAttempts++;

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.socketIOFailed = true;
          this.fallbackToPolling();
        } else {
          this.isConnecting = false;
          this.handleConnectionError(error);
        }
      }
    } else {
      // Use HTTP polling fallback
      this.fallbackToPolling();
    }
  }

  // Connect via Socket.IO
  async connectSocketIO() {
    return new Promise((resolve, reject) => {
      try {
        const token = apiService.getAuthToken();

        this.socket = io(WS_BASE_URL, {
          auth: {
            token: token,
            user: this.currentUser
          },
          transports: ['websocket', 'polling'],
          upgrade: true,
          timeout: 10000,
          forceNew: true
        });

        this.setupEventHandlers();
        this.setupConnectionHandlers();

        // Set up a timeout to reject if connection doesn't establish
        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Socket.IO connection timeout'));
          }
        }, 10000);

        // Resolve on successful connection
        this.socket.once('connect', () => {
          clearTimeout(connectionTimeout);
          this.connectionAttempts = 0;
          this.socketIOFailed = false;
          resolve();
        });

        // Reject on connection error
        this.socket.once('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Fallback to HTTP polling
  fallbackToPolling() {
    console.log('Switching to HTTP polling fallback for real-time updates');
    this.usePolling = true;
    this.isConnected = true;
    this.isConnecting = false;

    // Emit connection success event
    this.emit('connection:success', {
      connectionType: 'polling',
      message: 'Connected via HTTP polling fallback'
    });

    // Start polling for events
    this.startPolling();
  }

  // Start HTTP long-polling
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    const poll = async () => {
      if (!this.usePolling || !this.currentUser) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/events/poll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiService.getAuthToken()}`
          },
          body: JSON.stringify({
            lastTimestamp: this.lastMessageTimestamp,
            userId: this.currentUser.id,
            serverId: this.currentServer?.id,
            channelId: this.currentChannel?.id
          })
        });

        if (response.ok) {
          const data = await response.json();

          if (data.events && data.events.length > 0) {
            data.events.forEach(event => {
              this.handlePollingEvent(event);
            });

            this.lastMessageTimestamp = data.events[data.events.length - 1].timestamp || Date.now();
          }
        } else if (response.status === 401) {
          console.error('Polling authentication failed');
          this.emit('connection:auth_error', { error: 'Authentication failed' });
          this.stopPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Don't stop polling on temporary errors
      }
    };

    // Initial poll
    poll();

    // Set up interval polling
    this.pollingInterval = setInterval(poll, this.pollingRate);
  }

  // Stop HTTP polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Handle events from polling
  handlePollingEvent(event) {
    try {
      const { type, data } = event;

      // Map polling event types to Socket.IO event types
      switch (type) {
        case 'message:new':
          this.emit('message:received', data);
          break;
        case 'message:updated':
          this.emit('message:updated', data);
          break;
        case 'message:deleted':
          this.emit('message:deleted', data);
          break;
        case 'typing:start':
          if (data.userId !== this.currentUser.id) {
            this.typingUsers.set(data.userId, { ...data, timestamp: Date.now() });
            this.emit('typing:start', data);
          }
          break;
        case 'typing:stop':
          this.typingUsers.delete(data.userId);
          this.emit('typing:stop', data);
          break;
        case 'user:online':
          this.onlineUsers.add(data.userId);
          this.emit('user:online', data);
          break;
        case 'user:offline':
          this.onlineUsers.delete(data.userId);
          this.emit('user:offline', data);
          break;
        case 'user:status':
          this.emit('user:status', data);
          break;
        case 'channel:joined':
          this.emit('channel:user_joined', data);
          break;
        case 'channel:left':
          this.emit('channel:user_left', data);
          break;
        case 'channel:updated':
          this.emit('channel:updated', data);
          break;
        case 'server:updated':
          this.emit('server:updated', data);
          break;
        case 'server:member_joined':
          this.emit('server:member_joined', data);
          break;
        case 'server:member_left':
          this.emit('server:member_left', data);
          break;
        case 'voice:user_joined':
          this.emit('voice:user_joined', data);
          break;
        case 'voice:user_left':
          this.emit('voice:user_left', data);
          break;
        case 'voice:speaking':
          this.emit('voice:speaking', data);
          break;
        case 'notification:new':
          this.emit('notification:received', data);
          break;
        case 'system:maintenance':
          this.emit('system:maintenance', data);
          break;
        default:
          console.warn('Unknown polling event type:', type);
      }
    } catch (error) {
      console.error('Error handling polling event:', error);
    }
  }

  // Setup connection event handlers
  setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Clear any existing reconnect interval
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      // Emit user presence
      this.socket.emit('user:presence', {
        userId: this.currentUser.id,
        status: 'online',
        timestamp: new Date().toISOString()
      });

      // Rejoin current server/channel if applicable
      if (this.currentServer) {
        this.joinServer(this.currentServer.id);
      }
      if (this.currentChannel) {
        this.joinChannel(this.currentChannel.id);
      }

      // Notify connection success
      this.emit('connection:success');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      // Notify disconnection
      this.emit('connection:lost', { reason });
      
      // Auto-reconnect unless disconnected intentionally
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.handleConnectionError(error);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('connection:error', { error });
    });
  }

  // Setup application event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    // Message events
    this.socket.on('message:new', (data) => {
      this.emit('message:received', data);
    });

    this.socket.on('message:updated', (data) => {
      this.emit('message:updated', data);
    });

    this.socket.on('message:deleted', (data) => {
      this.emit('message:deleted', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data) => {
      this.typingUsers.set(data.userId, {
        ...data,
        timestamp: Date.now()
      });
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data) => {
      this.typingUsers.delete(data.userId);
      this.emit('typing:stop', data);
    });

    // User presence
    this.socket.on('user:online', (data) => {
      this.onlineUsers.add(data.userId);
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data) => {
      this.onlineUsers.delete(data.userId);
      this.emit('user:offline', data);
    });

    this.socket.on('user:status', (data) => {
      this.emit('user:status', data);
    });

    // Channel events
    this.socket.on('channel:joined', (data) => {
      this.emit('channel:user_joined', data);
    });

    this.socket.on('channel:left', (data) => {
      this.emit('channel:user_left', data);
    });

    this.socket.on('channel:updated', (data) => {
      this.emit('channel:updated', data);
    });

    // Server events
    this.socket.on('server:updated', (data) => {
      this.emit('server:updated', data);
    });

    this.socket.on('server:member_joined', (data) => {
      this.emit('server:member_joined', data);
    });

    this.socket.on('server:member_left', (data) => {
      this.emit('server:member_left', data);
    });

    // Voice/Video events
    this.socket.on('voice:user_joined', (data) => {
      this.emit('voice:user_joined', data);
    });

    this.socket.on('voice:user_left', (data) => {
      this.emit('voice:user_left', data);
    });

    this.socket.on('voice:speaking', (data) => {
      this.emit('voice:speaking', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.emit('notification:received', data);
    });

    // System events
    this.socket.on('system:maintenance', (data) => {
      this.emit('system:maintenance', data);
    });
  }

  // Handle connection errors
  handleConnectionError(error) {
    console.error('WebSocket connection failed:', error);
    
    // Check if it's an authentication error
    if (error.message && error.message.includes('Authentication')) {
      this.emit('connection:auth_error', { error });
      return;
    }
    
    this.emit('connection:error', { error });
    this.attemptReconnect();
  }

  // Attempt to reconnect
  attemptReconnect() {
    // If already using polling, don't try to reconnect via Socket.IO yet
    if (this.usePolling) {
      // Periodically try to upgrade from polling to WebSocket
      if (!this.reconnectInterval) {
        this.reconnectInterval = setTimeout(() => {
          this.reconnectInterval = null;
          // Reset Socket.IO failure flag after some time to retry
          if (Date.now() - this.lastMessageTimestamp > 60000) { // 1 minute
            console.log('Attempting to upgrade from polling to WebSocket...');
            this.socketIOFailed = false;
            this.connectionAttempts = 0;
          }
        }, 60000); // Try to upgrade every minute
      }
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached, falling back to polling');
      this.socketIOFailed = true;
      this.fallbackToPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s


    this.reconnectInterval = setTimeout(() => {
      if (!this.isConnected && !this.isConnecting) {
        this.emit('connection:reconnecting', { attempt: this.reconnectAttempts });
        this.connect(this.currentUser);
      }
    }, delay);
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    // Stop polling if active
    this.stopPolling();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.usePolling = false;
    this.socketIOFailed = false;
    this.connectionAttempts = 0;
    this.onlineUsers.clear();
    this.typingUsers.clear();
  }

  // Send event via Socket.IO or HTTP
  async sendEvent(eventType, data) {
    if (!this.isConnected) {
      console.warn('Cannot send event: Not connected');
      return false;
    }

    if (this.usePolling) {
      // Send via HTTP POST when using polling fallback
      try {
        const response = await fetch(`${API_BASE_URL}/events/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiService.getAuthToken()}`
          },
          body: JSON.stringify({
            type: eventType,
            data: data
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to send event`);
        }

        return true;
      } catch (error) {
        console.error('Error sending event via HTTP:', error);
        return false;
      }
    } else if (this.socket) {
      // Send via Socket.IO
      this.socket.emit(eventType, data);
      return true;
    }

    return false;
  }

  // Join a server
  joinServer(serverId) {
    if (!this.isConnected) {
      return;
    }

    this.currentServer = { id: serverId };
    this.sendEvent('server:join', {
      serverId,
      userId: this.currentUser.id
    });
  }

  // Leave a server
  leaveServer(serverId) {
    if (!this.isConnected) return;

    this.sendEvent('server:leave', {
      serverId,
      userId: this.currentUser.id
    });

    if (this.currentServer && this.currentServer.id === serverId) {
      this.currentServer = null;
    }
  }

  // Join a channel
  joinChannel(channelId) {
    if (!this.isConnected) {
      return;
    }

    // Leave current channel first
    if (this.currentChannel) {
      this.leaveChannel(this.currentChannel.id);
    }

    this.currentChannel = { id: channelId };
    this.sendEvent('channel:join', {
      channelId,
      userId: this.currentUser.id
    });
  }

  // Leave a channel
  leaveChannel(channelId) {
    if (!this.isConnected) return;

    this.sendEvent('channel:leave', {
      channelId,
      userId: this.currentUser.id
    });

    if (this.currentChannel && this.currentChannel.id === channelId) {
      this.currentChannel = null;
    }
  }

  // Send a message
  sendMessage(channelId, content, type = 'text', metadata = {}) {
    if (!this.isConnected) {
      return false;
    }

    const messageData = {
      channelId,
      content,
      type,
      metadata,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      timestamp: new Date().toISOString()
    };

    return this.sendEvent('message:send', messageData);
  }

  // Start typing indicator
  startTyping(channelId) {
    if (!this.isConnected) return;

    this.sendEvent('typing:start', {
      channelId,
      userId: this.currentUser.id,
      username: this.currentUser.username
    });
  }

  // Stop typing indicator
  stopTyping(channelId) {
    if (!this.isConnected) return;

    this.sendEvent('typing:stop', {
      channelId,
      userId: this.currentUser.id
    });
  }

  // Update user status
  updateStatus(status) {
    if (!this.isConnected) return;

    this.sendEvent('user:status', {
      userId: this.currentUser.id,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Join voice channel
  joinVoiceChannel(channelId) {
    if (!this.isConnected) return;

    this.sendEvent('voice:join', {
      channelId,
      userId: this.currentUser.id
    });
  }

  // Leave voice channel
  leaveVoiceChannel(channelId) {
    if (!this.isConnected) return;

    this.sendEvent('voice:leave', {
      channelId,
      userId: this.currentUser.id
    });
  }

  // Event handling system
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  getTypingUsers(channelId) {
    const typing = [];
    for (const [userId, data] of this.typingUsers) {
      if (data.channelId === channelId && Date.now() - data.timestamp < 5000) { // 5 second timeout
        typing.push(data);
      }
    }
    return typing;
  }

  // Clean up expired typing indicators
  cleanupTypingIndicators() {
    const now = Date.now();
    for (const [userId, data] of this.typingUsers) {
      if (now - data.timestamp > 5000) { // 5 second timeout
        this.typingUsers.delete(userId);
        this.emit('typing:stop', data);
      }
    }
  }

  // Connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      currentServer: this.currentServer,
      currentChannel: this.currentChannel,
      onlineUsersCount: this.onlineUsers.size,
      connectionType: this.usePolling ? 'polling' : 'websocket',
      usePolling: this.usePolling,
      socketIOFailed: this.socketIOFailed
    };
  }
}

// Create and export singleton instance
const websocketService = new WebSocketService();

// Cleanup typing indicators periodically
setInterval(() => {
  websocketService.cleanupTypingIndicators();
}, 1000);

export default websocketService;