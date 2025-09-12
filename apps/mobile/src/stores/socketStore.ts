/**
 * CRASH-SAFE SOCKET STORE
 * Handles WebSocket connections with comprehensive error handling and auto-reconnection
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { CrashDetector } from '../utils/CrashDetector';

export interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'offline';
  error: string | null;
  reconnectAttempts: number;
  lastConnectTime: number | null;
  networkStatus: string;
  userId: string | null;

  // Actions
  connect: (userId?: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  sendMessage: (event: string, data: any) => Promise<boolean>;
  clearError: () => void;
  setUserId: (userId: string | null) => void;
}

const config = Constants.expoConfig?.extra || {};
const SOCKET_URL = config.wsUrl || 'ws://localhost:3002';
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVALS = [1000, 2000, 5000, 10000, 30000]; // Progressive backoff
const PING_INTERVAL = 30000; // 30 seconds
const PONG_TIMEOUT = 5000; // 5 seconds

class SocketService {
  private static instance: SocketService;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private pongTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private netInfoSubscription: any = null;
  private lastPongTime = 0;

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async initializeSocket(userId?: string): Promise<Socket> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false, // We handle reconnection manually
        forceNew: true,
        auth: {
          token,
          userId,
        },
        extraHeaders: {
          'User-Agent': 'CRYB-Mobile/1.0.0',
        },
      });

      this.setupSocketListeners(socket);
      return socket;
    } catch (error) {
      console.error('[SocketService] Initialize error:', error);
      throw error;
    }
  }

  private setupSocketListeners(socket: Socket) {
    socket.on('connect', () => {
      console.log('[Socket] Connected');
      this.lastPongTime = Date.now();
      this.startPingMonitoring(socket);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      this.stopPingMonitoring();
      this.handleDisconnect(socket, reason);
    });

    socket.on('connect_error', (error: any) => {
      console.error('[Socket] Connect error:', error);
      this.handleConnectionError(socket, error);
    });

    socket.on('error', (error: any) => {
      console.error('[Socket] Socket error:', error);
      this.handleSocketError(socket, error);
    });

    socket.on('pong', () => {
      this.lastPongTime = Date.now();
      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
        this.pongTimer = null;
      }
    });

    // Handle server-side reconnection
    socket.on('reconnect', () => {
      console.log('[Socket] Server requested reconnection');
      this.handleReconnectRequest(socket);
    });
  }

  private startPingMonitoring(socket: Socket) {
    this.stopPingMonitoring();
    
    this.pingTimer = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
        
        this.pongTimer = setTimeout(() => {
          console.warn('[Socket] Pong timeout - connection may be stale');
          socket.disconnect();
        }, PONG_TIMEOUT);
      }
    }, PING_INTERVAL);
  }

  private stopPingMonitoring() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private async handleDisconnect(socket: Socket, reason: string) {
    await CrashDetector.reportError(
      new Error(`Socket disconnected: ${reason}`),
      { reason, socketId: socket.id },
      'medium'
    );
  }

  private async handleConnectionError(socket: Socket, error: any) {
    await CrashDetector.reportError(
      error instanceof Error ? error : new Error(String(error)),
      { action: 'socketConnect' },
      'high'
    );
  }

  private async handleSocketError(socket: Socket, error: any) {
    await CrashDetector.reportError(
      error instanceof Error ? error : new Error(String(error)),
      { action: 'socketError', socketId: socket.id },
      'high'
    );
  }

  private async handleReconnectRequest(socket: Socket) {
    try {
      // Clean disconnect first
      socket.disconnect();
      
      // Small delay before reconnecting
      setTimeout(() => {
        const store = useSocketStore.getState();
        store.reconnect();
      }, 1000);
    } catch (error) {
      console.error('[Socket] Reconnect request error:', error);
    }
  }

  setupNetworkMonitoring(store: any) {
    // Monitor network changes
    this.netInfoSubscription = NetInfo.addEventListener(state => {
      const networkStatus = `${state.type}-${state.isConnected ? 'connected' : 'disconnected'}`;
      
      store.setState({ networkStatus });
      AsyncStorage.setItem('@cryb_network_status', networkStatus);
      
      if (state.isConnected && store.getState().connectionStatus === 'offline') {
        console.log('[Socket] Network restored, attempting reconnection');
        store.reconnect();
      } else if (!state.isConnected) {
        store.setState({ connectionStatus: 'offline' });
      }
    });

    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      const currentState = store.getState();
      
      if (nextAppState === 'active' && currentState.socket && !currentState.isConnected) {
        console.log('[Socket] App became active, checking connection');
        setTimeout(() => {
          if (!currentState.isConnected) {
            store.reconnect();
          }
        }, 1000);
      } else if (nextAppState === 'background') {
        console.log('[Socket] App went to background');
        // Keep connection alive but reduce activity
      }
    });
  }

  cleanup() {
    this.stopPingMonitoring();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  scheduleReconnect(store: any, attempt: number) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = RECONNECT_INTERVALS[Math.min(attempt, RECONNECT_INTERVALS.length - 1)];
    
    console.log(`[Socket] Scheduling reconnect attempt ${attempt + 1} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      store.reconnect();
    }, delay);
  }
}

const socketService = SocketService.getInstance();

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionStatus: 'disconnected',
  error: null,
  reconnectAttempts: 0,
  lastConnectTime: null,
  networkStatus: 'unknown',
  userId: null,

  connect: async (userId?: string) => {
    const state = get();
    
    if (state.isConnecting || state.isConnected) {
      return;
    }

    set({ 
      isConnecting: true, 
      connectionStatus: 'connecting',
      error: null,
      userId: userId || state.userId
    });

    try {
      // Check network connectivity first
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error('No network connection');
      }

      // Clean up existing socket
      if (state.socket) {
        state.socket.disconnect();
      }

      const socket = await socketService.initializeSocket(userId || state.userId || undefined);

      // Set up custom event handlers
      socket.on('connect', () => {
        set({
          isConnected: true,
          isConnecting: false,
          connectionStatus: 'connected',
          error: null,
          reconnectAttempts: 0,
          lastConnectTime: Date.now(),
        });
      });

      socket.on('disconnect', () => {
        set({
          isConnected: false,
          isConnecting: false,
          connectionStatus: 'disconnected',
        });

        // Auto-reconnect unless it was intentional
        const currentState = get();
        if (currentState.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          socketService.scheduleReconnect(
            { reconnect: get().reconnect },
            currentState.reconnectAttempts
          );
        }
      });

      socket.on('connect_error', (error: any) => {
        const currentState = get();
        
        set({
          isConnected: false,
          isConnecting: false,
          connectionStatus: 'error',
          error: error.message || 'Connection failed',
          reconnectAttempts: currentState.reconnectAttempts + 1,
        });

        // Schedule reconnect if we haven't exceeded max attempts
        if (currentState.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          socketService.scheduleReconnect(
            { reconnect: get().reconnect },
            currentState.reconnectAttempts
          );
        }
      });

      set({ socket });

      // Initialize network monitoring
      socketService.setupNetworkMonitoring({ setState: set, getState: get });

    } catch (error) {
      console.error('[SocketStore] Connect error:', error);

      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'socketConnect', userId: userId || 'unknown' },
        'high'
      );

      set({
        isConnecting: false,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
        reconnectAttempts: state.reconnectAttempts + 1,
      });

      // Schedule reconnect
      if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        socketService.scheduleReconnect(
          { reconnect: get().reconnect },
          state.reconnectAttempts
        );
      }
    }
  },

  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      socket.disconnect();
      socketService.cleanup();
    }

    set({
      socket: null,
      isConnected: false,
      isConnecting: false,
      connectionStatus: 'disconnected',
      error: null,
      reconnectAttempts: 0,
    });
  },

  reconnect: async () => {
    const state = get();
    
    // Prevent multiple simultaneous reconnect attempts
    if (state.isConnecting) {
      return;
    }

    console.log(`[Socket] Reconnect attempt ${state.reconnectAttempts + 1}`);

    // Disconnect current socket if exists
    if (state.socket) {
      state.socket.disconnect();
    }

    // Clear state
    set({
      socket: null,
      isConnected: false,
      isConnecting: false,
    });

    // Small delay before reconnecting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Attempt to connect
    await get().connect(state.userId || undefined);
  },

  sendMessage: async (event: string, data: any) => {
    const { socket, isConnected } = get();

    if (!socket || !isConnected) {
      console.warn('[Socket] Cannot send message - not connected');
      return false;
    }

    try {
      // Add timeout to message sending
      return await new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message send timeout'));
        }, 5000);

        socket.emit(event, data, (response: any) => {
          clearTimeout(timeout);
          
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('[Socket] Send message error:', error);

      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'sendMessage', event, socketId: socket.id },
        'medium'
      );

      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUserId: (userId: string | null) => {
    set({ userId });
  },
}));