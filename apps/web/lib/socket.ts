"use client";

import { io, Socket } from "socket.io-client";
import { SocketEvents } from "./types";

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
      this.setupVisibilityHandlers();
    }
  }

  private setupVisibilityHandlers() {
    if (typeof document === 'undefined') return;

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, ensure connection
        if (this.connectionStatus === 'disconnected' && !this.isManualDisconnect) {
          this.connect();
        }
      } else {
        // Page became hidden, gracefully handle connection
        this.clearHeartbeat();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      if (!this.isManualDisconnect && this.connectionStatus !== 'connected') {
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      this.connectionStatus = 'disconnected';
      this.clearHeartbeat();
    });
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
      }
    }, 25000); // 25 seconds
  }

  private clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  connect(token?: string) {
    if (this.socket?.connected && this.connectionStatus === 'connected') {
      return this.socket;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    this.connectionStatus = 'connecting';
    this.isManualDisconnect = false;
    
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null);
    
    this.socket = io(serverUrl, {
      auth: {
        token: authToken,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 30000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      randomizationFactor: 0.5,
      autoConnect: true,
      path: '/socket.io/',
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      
      // Emit user presence using Discord-style events
      this.emit('update-presence', { status: 'online' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.connectionStatus = 'disconnected';
      this.clearHeartbeat();
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't try to reconnect
        return;
      }

      // Attempt to reconnect
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connectionStatus = 'error';
      this.clearHeartbeat();
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Auth events
    this.socket.on('auth_error', (error) => {
      console.error('Authentication error:', error);
      // Redirect to login or refresh token
      window.location.href = '/login';
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }

  disconnect() {
    this.isManualDisconnect = true;
    this.connectionStatus = 'disconnected';
    this.clearHeartbeat();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Check if socket is connected
  get isConnected() {
    return this.socket?.connected && this.connectionStatus === 'connected';
  }

  emit<K extends keyof SocketEvents>(event: K, data?: Parameters<SocketEvents[K]>[0]) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      return true;
    }
    console.warn('Socket not connected, cannot emit:', event);
    return false;
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (this.socket) {
      this.socket.on(event as string, callback);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) {
    if (this.socket) {
      this.socket.off(event as string, callback);
    }
  }

  once<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (this.socket) {
      this.socket.once(event as string, callback);
    }
  }

  // Join/leave rooms - match Discord-style server event names
  joinServer(serverId: string) {
    this.emit('join-server', { serverId });
  }

  leaveServer(serverId: string) {
    this.emit('leave-server', { serverId });
  }

  joinChannel(channelId: string) {
    this.emit('join-channel', { channelId });
  }

  leaveChannel(channelId: string) {
    this.emit('leave-channel', { channelId });
  }

  joinVoiceChannel(channelId: string) {
    this.emit('voice:join', { channelId });
  }

  leaveVoiceChannel() {
    this.emit('voice:leave');
  }

  // Message events - match Discord-style server event names
  sendMessage(channelId: string, content: string, attachments?: string[], replyToId?: string, embeds?: any[]) {
    this.emit('send-message', {
      channelId,
      content,
      attachments,
      replyTo: replyToId,
      embeds,
    });
  }

  sendDirectMessage(recipientId: string, content: string, attachments?: string[]) {
    this.emit('send-dm', {
      recipientId,
      content,
      attachments,
    });
  }

  editMessage(messageId: string, content: string) {
    this.emit('edit-message', {
      messageId,
      content,
    });
  }

  deleteMessage(messageId: string) {
    this.emit('delete-message', { messageId });
  }

  // Typing indicators - match Discord-style server event names
  startTyping(channelId: string) {
    this.emit('typing', { channelId });
  }

  stopTyping(channelId: string) {
    this.emit('stop-typing', { channelId });
  }

  // User presence - match Discord-style server event names
  updatePresence(status: 'online' | 'idle' | 'dnd' | 'offline', activity?: any) {
    this.emit('update-presence', { status, activity });
  }

  // Get presence data
  getPresence(userIds: string[]) {
    this.emit('get-presence', { userIds });
  }

  // Voice events - match Discord-style server event names
  updateVoiceState(state: {
    muted?: boolean;
    deafened?: boolean;
    selfMute?: boolean;
    selfDeaf?: boolean;
  }) {
    this.emit('voice:state_update', state);
  }

  // Utility methods
  get connected() {
    return this.socket?.connected || false;
  }

  get id() {
    return this.socket?.id;
  }

  // React hook integration
  useSocket() {
    return {
      socket: this.socket,
      connected: this.connected,
      emit: this.emit.bind(this),
      on: this.on.bind(this),
      off: this.off.bind(this),
      once: this.once.bind(this),
    };
  }
}

// Create singleton instance
let socketManager: SocketManager | null = null;

export function getSocketManager(): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager();
  }
  return socketManager;
}

// Export for direct use
export const socket = getSocketManager();

// React hook for using socket in components
export function useSocket() {
  return getSocketManager().useSocket();
}