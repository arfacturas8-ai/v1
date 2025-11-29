import { io } from 'socket.io-client';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.cryb.ai', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.emit('connection_error', error);
    });

    // Message events
    this.socket.on('message', (data) => {
      this.emit('message', data);
    });

    this.socket.on('message_updated', (data) => {
      this.emit('message_updated', data);
    });

    this.socket.on('message_deleted', (data) => {
      this.emit('message_deleted', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    // User presence
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Channel events
    this.socket.on('channel_created', (data) => {
      this.emit('channel_created', data);
    });

    this.socket.on('channel_updated', (data) => {
      this.emit('channel_updated', data);
    });

    // Community events
    this.socket.on('community_updated', (data) => {
      this.emit('community_updated', data);
    });

    this.socket.on('member_joined', (data) => {
      this.emit('member_joined', data);
    });

    this.socket.on('member_left', (data) => {
      this.emit('member_left', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join/leave rooms
  joinChannel(channelId) {
    if (this.socket) {
      this.socket.emit('join_channel', { channelId });
    }
  }

  leaveChannel(channelId) {
    if (this.socket) {
      this.socket.emit('leave_channel', { channelId });
    }
  }

  joinCommunity(communityId) {
    if (this.socket) {
      this.socket.emit('join_community', { communityId });
    }
  }

  leaveCommunity(communityId) {
    if (this.socket) {
      this.socket.emit('leave_community', { communityId });
    }
  }

  // Send messages
  sendMessage(channelId, content) {
    if (this.socket) {
      this.socket.emit('send_message', {
        channelId,
        content,
        timestamp: Date.now()
      });
    }
  }

  // Typing indicators
  startTyping(channelId) {
    if (this.socket) {
      this.socket.emit('start_typing', { channelId });
    }
  }

  stopTyping(channelId) {
    if (this.socket) {
      this.socket.emit('stop_typing', { channelId });
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

export default new WebSocketClient();