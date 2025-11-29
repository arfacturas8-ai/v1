/**
 * CRASH-SAFE SOCKET STORE
 * Handles WebSocket connections with comprehensive error handling and auto-reconnection
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import { AppState, Platform } from 'react-native';
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
// Use api.cryb.ai for production, local for development
const getSocketUrl = () => {
  // In production, always use the live API
  if (!__DEV__) {
    return 'wss://api.cryb.ai';
  }
  
  // In development, check for explicit dev server or use live API as fallback
  const devUrl = process.env.EXPO_PUBLIC_SOCKET_URL || config.socketUrl;
  if (devUrl) {
    return Platform.OS === 'android' && devUrl.includes('localhost') 
      ? devUrl.replace('localhost', '10.0.2.2')
      : devUrl;
  }
  
  // Default to live API
  return 'wss://api.cryb.ai';
};
const SOCKET_URL = getSocketUrl();
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
      // Get token from the same storage key used by ApiService
      const tokensData = await AsyncStorage.getItem('@cryb_auth_tokens');
      let token = null;
      
      if (tokensData) {
        const tokens = JSON.parse(tokensData);
        token = tokens.accessToken;
      }
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
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
          'Authorization': `Bearer ${token}`,
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

  // Discord-style Socket Methods
  joinServer: (serverId: string) => {
    const { socket } = get();
    socket?.emit('server:join', { serverId });
  },

  leaveServer: (serverId: string) => {
    const { socket } = get();
    socket?.emit('server:leave', { serverId });
  },

  joinChannel: (channelId: string) => {
    const { socket } = get();
    socket?.emit('channel:join', { channelId });
  },

  leaveChannel: (channelId: string) => {
    const { socket } = get();
    socket?.emit('channel:leave', { channelId });
  },

  sendChatMessage: (channelId: string, content: string, options?: {
    replyTo?: string;
    attachments?: any[];
    embeds?: any[];
  }) => {
    const { socket } = get();
    socket?.emit('message:send', {
      channelId,
      content,
      messageReference: options?.replyTo ? { messageId: options.replyTo } : undefined,
      attachments: options?.attachments,
      embeds: options?.embeds
    });
  },

  startTyping: (channelId: string) => {
    const { socket } = get();
    socket?.emit('typing:start', { channelId });
  },

  stopTyping: (channelId: string) => {
    const { socket } = get();
    socket?.emit('typing:stop', { channelId });
  },

  updateVoiceState: (state: {
    channelId?: string | null;
    serverId?: string;
    selfMute?: boolean;
    selfDeaf?: boolean;
    selfVideo?: boolean;
  }) => {
    const { socket } = get();
    socket?.emit('voice:state_update', state);
  },

  updatePresence: (status: 'online' | 'idle' | 'dnd' | 'invisible', activity?: any) => {
    const { socket } = get();
    socket?.emit('presence:update', {
      status,
      activities: activity ? [activity] : [],
      clientStatus: { mobile: status },
      afk: status === 'idle'
    });
  },

  addMessageReaction: (messageId: string, emoji: string) => {
    const { socket } = get();
    socket?.emit('message:react', { messageId, emoji });
  },

  removeMessageReaction: (messageId: string, emoji: string) => {
    const { socket } = get();
    socket?.emit('message:reaction_remove', { messageId, emoji });
  },

  editMessage: (messageId: string, content: string) => {
    const { socket } = get();
    socket?.emit('message:update', { messageId, content });
  },

  deleteMessage: (messageId: string, channelId: string) => {
    const { socket } = get();
    socket?.emit('message:delete', { messageId, channelId });
  },

  createThread: (channelId: string, messageId: string, name: string) => {
    const { socket } = get();
    socket?.emit('thread:create', { channelId, messageId, name });
  },

  executeSlashCommand: (commandName: string, options: Record<string, any>, channelId: string, serverId?: string) => {
    const { socket } = get();
    socket?.emit('interaction:create', {
      type: 2, // APPLICATION_COMMAND
      data: {
        name: commandName,
        options: Object.entries(options).map(([name, value]) => ({ name, value }))
      },
      channel_id: channelId,
      guild_id: serverId,
      token: 'interaction_token',
      version: 1
    });
  },

  // Utility method to set up common Discord event listeners
  setupDiscordListeners: (handlers: {
    onMessageCreate?: (message: any) => void;
    onMessageUpdate?: (message: any) => void;
    onMessageDelete?: (data: { messageId: string; channelId: string }) => void;
    onTypingStart?: (data: { channelId: string; userId: string; username: string }) => void;
    onTypingStop?: (data: { channelId: string; userId: string }) => void;
    onVoiceStateUpdate?: (data: any) => void;
    onPresenceUpdate?: (data: any) => void;
    onReactionAdd?: (data: { messageId: string; userId: string; emoji: string }) => void;
    onReactionRemove?: (data: { messageId: string; userId: string; emoji: string }) => void;
    onServerJoined?: (data: { server: any; member: any }) => void;
    onChannelCreate?: (channel: any) => void;
    onChannelUpdate?: (channel: any) => void;
    onChannelDelete?: (data: { channelId: string; serverId: string }) => void;
    onMemberJoin?: (data: { serverId: string; member: any }) => void;
    onMemberLeave?: (data: { serverId: string; userId: string }) => void;
    onMemberUpdate?: (data: { serverId: string; member: any }) => void;
  }) => {
    const { socket } = get();
    if (!socket) return;

    // Message events
    if (handlers.onMessageCreate) socket.on('message:create', handlers.onMessageCreate);
    if (handlers.onMessageUpdate) socket.on('message:updated', handlers.onMessageUpdate);
    if (handlers.onMessageDelete) socket.on('message:deleted', handlers.onMessageDelete);

    // Typing events
    if (handlers.onTypingStart) socket.on('typing:user_start', handlers.onTypingStart);
    if (handlers.onTypingStop) socket.on('typing:user_stop', handlers.onTypingStop);

    // Voice events
    if (handlers.onVoiceStateUpdate) socket.on('voice:state_update', handlers.onVoiceStateUpdate);

    // Presence events
    if (handlers.onPresenceUpdate) socket.on('presence:user_update', handlers.onPresenceUpdate);

    // Reaction events
    if (handlers.onReactionAdd) socket.on('message:reaction_add', handlers.onReactionAdd);
    if (handlers.onReactionRemove) socket.on('message:reaction_remove', handlers.onReactionRemove);

    // Server events
    if (handlers.onServerJoined) socket.on('server:joined', handlers.onServerJoined);

    // Channel events
    if (handlers.onChannelCreate) socket.on('channel:created', handlers.onChannelCreate);
    if (handlers.onChannelUpdate) socket.on('channel:updated', handlers.onChannelUpdate);
    if (handlers.onChannelDelete) socket.on('channel:deleted', handlers.onChannelDelete);

    // Member events
    if (handlers.onMemberJoin) socket.on('server:member_join', handlers.onMemberJoin);
    if (handlers.onMemberLeave) socket.on('server:member_leave', handlers.onMemberLeave);
    if (handlers.onMemberUpdate) socket.on('server:member_update', handlers.onMemberUpdate);
  },

  // Clean up Discord event listeners
  cleanupDiscordListeners: () => {
    const { socket } = get();
    if (!socket) return;

    const events = [
      'message:create', 'message:updated', 'message:deleted',
      'typing:user_start', 'typing:user_stop',
      'voice:state_update', 'presence:user_update',
      'message:reaction_add', 'message:reaction_remove',
      'server:joined', 'channel:created', 'channel:updated', 'channel:deleted',
      'server:member_join', 'server:member_leave', 'server:member_update'
    ];

    events.forEach(event => socket.off(event));
  },

  clearError: () => {
    set({ error: null });
  },

  setUserId: (userId: string | null) => {
    set({ userId });
  },
}));