"use client";

import { io, Socket } from "socket.io-client";
import { SocketEvents } from "./types";

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  error: Error | null;
  reconnectAttempts: number;
  lastConnected: Date | null;
}

interface QueuedEvent {
  event: string;
  data: any;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

interface SafeSocketOptions {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  timeout: number;
  queueOfflineEvents: boolean;
  maxQueueSize: number;
  eventRetryLimit: number;
}

const DEFAULT_OPTIONS: SafeSocketOptions = {
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  timeout: 20000,
  queueOfflineEvents: true,
  maxQueueSize: 100,
  eventRetryLimit: 3,
};

class CrashSafeSocketManager {
  private socket: Socket | null = null;
  private options: SafeSocketOptions;
  private connectionState: ConnectionState;
  private eventQueue: QueuedEvent[] = [];
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();

  constructor(options: Partial<SafeSocketOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.connectionState = {
      status: 'disconnected',
      error: null,
      reconnectAttempts: 0,
      lastConnected: null,
    };

    // Auto-connect if in browser environment
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  // Public API methods
  connect(token?: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket?.connected) {
          resolve(this.socket);
          return;
        }

        this.updateConnectionState({ status: 'connecting', error: null });

        const serverUrl = this.getServerUrl();
        
        this.socket = io(serverUrl, {
          auth: {
            token: token || this.getStoredToken(),
          },
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: this.options.timeout,
          forceNew: false,
          autoConnect: false,
        });

        this.setupEventHandlers(resolve, reject);
        this.socket.connect();
      } catch (error) {
        this.handleConnectionError(error as Error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearReconnectTimeout();
    this.clearHeartbeat();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.updateConnectionState({ status: 'disconnected', error: null });
    this.eventQueue = [];
  }

  emit<K extends keyof SocketEvents>(
    event: K, 
    data?: Parameters<SocketEvents[K]>[0],
    options: { retry?: boolean; maxRetries?: number } = {}
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const eventData = {
        event: event as string,
        data,
        timestamp: new Date(),
        retries: 0,
        maxRetries: options.maxRetries ?? this.options.eventRetryLimit,
      };

      if (this.socket?.connected) {
        try {
          this.socket.emit(event as string, data);
          resolve(true);
        } catch (error) {
          console.error('Socket emit error:', error);
          this.queueEvent(eventData);
          resolve(false);
        }
      } else {
        if (options.retry !== false && this.options.queueOfflineEvents) {
          this.queueEvent(eventData);
        }
        resolve(false);
      }
    });
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const eventStr = event as string;
    
    if (!this.eventListeners.has(eventStr)) {
      this.eventListeners.set(eventStr, new Set());
    }
    
    this.eventListeners.get(eventStr)!.add(callback);

    if (this.socket) {
      this.socket.on(eventStr, this.createSafeCallback(callback));
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    const eventStr = event as string;
    const listeners = this.eventListeners.get(eventStr);
    
    if (listeners) {
      if (callback) {
        listeners.delete(callback);
      } else {
        listeners.clear();
      }
    }

    if (this.socket) {
      if (callback) {
        this.socket.off(eventStr, this.createSafeCallback(callback));
      } else {
        this.socket.off(eventStr);
      }
    }
  }

  once<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const safeCallback = this.createSafeCallback(callback);
    const wrappedCallback = (...args: any[]) => {
      try {
        safeCallback(...args);
      } catch (error) {
        console.error(`Error in once callback for event ${event}:`, error);
      }
    };

    if (this.socket) {
      this.socket.once(event as string, wrappedCallback);
    }
  }

  // Connection state management
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.add(callback);
    
    // Call immediately with current state
    callback(this.connectionState);
    
    // Return cleanup function
    return () => {
      this.connectionStateListeners.delete(callback);
    };
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Utility methods for common operations
  async joinServer(serverId: string): Promise<boolean> {
    return this.emit('join_server', serverId);
  }

  async leaveServer(serverId: string): Promise<boolean> {
    return this.emit('leave_server', serverId);
  }

  async joinChannel(channelId: string): Promise<boolean> {
    return this.emit('join_channel', channelId);
  }

  async leaveChannel(channelId: string): Promise<boolean> {
    return this.emit('leave_channel', channelId);
  }

  async sendMessage(channelId: string, content: string, attachments?: string[]): Promise<boolean> {
    return this.emit('send_message', {
      channelId,
      content,
      attachments,
    }, { retry: true, maxRetries: 5 });
  }

  async sendDirectMessage(recipientId: string, content: string, attachments?: string[]): Promise<boolean> {
    return this.emit('send_dm', {
      recipientId,
      content,
      attachments,
    }, { retry: true, maxRetries: 5 });
  }

  // Private methods
  private setupEventHandlers(resolve: (socket: Socket) => void, reject: (error: Error) => void): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.updateConnectionState({ 
        status: 'connected', 
        error: null, 
        reconnectAttempts: 0,
        lastConnected: new Date()
      });
      
      this.startHeartbeat();
      this.processEventQueue();
      this.reattachEventListeners();
      
      resolve(this.socket!);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.clearHeartbeat();
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't try to reconnect
        this.updateConnectionState({ status: 'disconnected', error: null });
      } else {
        // Network issue or client disconnect, try to reconnect
        this.handleDisconnection(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleConnectionError(error);
      reject(error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.updateConnectionState({ error });
    });

    // Auth events
    this.socket.on('auth_error', (error) => {
      console.error('Authentication error:', error);
      this.handleAuthError(error);
    });

    // Connection quality events
    this.socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  }

  private createSafeCallback(callback: Function): Function {
    return (...args: any[]) => {
      try {
        callback(...args);
      } catch (error) {
        console.error('Error in socket event callback:', error);
        // Don't throw to prevent crashing the socket connection
      }
    };
  }

  private reattachEventListeners(): void {
    if (!this.socket) return;

    for (const [event, listeners] of this.eventListeners) {
      for (const listener of listeners) {
        this.socket.on(event, this.createSafeCallback(listener));
      }
    }
  }

  private handleDisconnection(reason: string): void {
    this.updateConnectionState({ status: 'reconnecting' });
    this.scheduleReconnect();
  }

  private handleConnectionError(error: Error): void {
    this.updateConnectionState({ 
      status: 'error', 
      error,
      reconnectAttempts: this.connectionState.reconnectAttempts + 1
    });
    
    if (this.connectionState.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.updateConnectionState({ status: 'disconnected' });
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimeout();
    
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts),
      this.options.maxReconnectDelay
    );
    
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.connectionState.reconnectAttempts + 1})`);
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatIntervalId = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // 30 second heartbeat
  }

  private clearHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private queueEvent(eventData: QueuedEvent): void {
    if (this.eventQueue.length >= this.options.maxQueueSize) {
      // Remove oldest event
      this.eventQueue.shift();
    }
    
    this.eventQueue.push(eventData);
  }

  private processEventQueue(): void {
    if (!this.socket?.connected) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const eventData of events) {
      if (eventData.retries < eventData.maxRetries) {
        try {
          this.socket.emit(eventData.event, eventData.data);
        } catch (error) {
          console.error('Error processing queued event:', error);
          eventData.retries++;
          if (eventData.retries < eventData.maxRetries) {
            this.queueEvent(eventData);
          }
        }
      }
    }
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    
    // Notify listeners
    for (const listener of this.connectionStateListeners) {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    }
  }

  private handleAuthError(error: any): void {
    console.error('Authentication failed:', error);
    // Clear stored token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
    
    // Disconnect and redirect to login
    this.disconnect();
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private getServerUrl(): string {
    return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth-token');
  }
}

// Create singleton instance
let crashSafeSocketManager: CrashSafeSocketManager | null = null;

export function getCrashSafeSocketManager(): CrashSafeSocketManager {
  if (!crashSafeSocketManager) {
    crashSafeSocketManager = new CrashSafeSocketManager();
  }
  return crashSafeSocketManager;
}

// Export for direct use
export const crashSafeSocket = getCrashSafeSocketManager();

// React hook for using crash-safe socket in components
export function useCrashSafeSocket() {
  const [connectionState, setConnectionState] = React.useState<ConnectionState>({
    status: 'disconnected',
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
  });

  React.useEffect(() => {
    const manager = getCrashSafeSocketManager();
    const cleanup = manager.onConnectionStateChange(setConnectionState);
    
    return cleanup;
  }, []);

  const manager = React.useMemo(() => getCrashSafeSocketManager(), []);

  return {
    socket: manager,
    connectionState,
    isConnected: manager.isConnected(),
    emit: manager.emit.bind(manager),
    on: manager.on.bind(manager),
    off: manager.off.bind(manager),
    once: manager.once.bind(manager),
  };
}

// Missing import
import * as React from "react";