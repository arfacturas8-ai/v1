/**
 * WebSocket Client
 * Handles real-time connections for messages, notifications, and live updates
 */

import { environment } from '../config/environment';
import { useAuthStore } from '../stores/authStore';
import { APP_CONSTANTS } from '../config/constants';

type EventCallback = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = APP_CONSTANTS.WS_MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = APP_CONSTANTS.WS_RECONNECT_DELAY;
  private pingInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnecting = false;

  // Connect to WebSocket
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      console.warn('Cannot connect WebSocket: No auth token');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = `${environment.WS_URL}?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // Send message
  send(event: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Subscribe to event
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // Unsubscribe from event
  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit event to listeners
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Handle WebSocket open
  private handleOpen() {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Start ping/pong
    this.startPing();

    // Emit connected event
    this.emit('connected', null);
  }

  // Handle WebSocket close
  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.isConnecting = false;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Emit disconnected event
    this.emit('disconnected', { code: event.code, reason: event.reason });

    // Attempt reconnect if not intentional close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  // Handle WebSocket error
  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.emit('error', event);
  }

  // Handle incoming message
  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      const { event: eventName, data } = message;

      // Handle pong response
      if (eventName === 'pong') {
        return;
      }

      // Emit event to listeners
      this.emit(eventName, data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // Start ping interval
  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, APP_CONSTANTS.WS_PING_INTERVAL);
  }

  // Schedule reconnect with exponential backoff
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.emit('reconnect-failed', null);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Get connection state
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const websocket = new WebSocketClient();

// Event types
export const WS_EVENTS = {
  // Connection
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECT_FAILED: 'reconnect-failed',

  // Messages
  NEW_MESSAGE: 'message:new',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Notifications
  NEW_NOTIFICATION: 'notification:new',
  NOTIFICATION_READ: 'notification:read',

  // Posts
  POST_CREATED: 'post:created',
  POST_UPDATED: 'post:updated',
  POST_DELETED: 'post:deleted',
  POST_LIKED: 'post:liked',
  POST_COMMENTED: 'post:commented',

  // Community
  COMMUNITY_POST: 'community:post',
  COMMUNITY_MEMBER_JOINED: 'community:member:joined',
  COMMUNITY_MEMBER_LEFT: 'community:member:left',

  // Calls
  CALL_INCOMING: 'call:incoming',
  CALL_ANSWERED: 'call:answered',
  CALL_ENDED: 'call:ended',
  CALL_REJECTED: 'call:rejected',
} as const;

export default websocket;
