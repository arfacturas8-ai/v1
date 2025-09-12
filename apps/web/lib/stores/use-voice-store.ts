import { create } from 'zustand';
import { VoiceState, VoiceParticipant, User } from '@/lib/types';
import { ConnectionPoolManager, ConnectionInstance, PoolStatistics } from '@/lib/voice/connection-pool-manager';
import { VoiceConnectionState } from '@/lib/voice/voice-connection-manager';
import { VoiceError, VoiceErrorEvent } from '@/lib/voice/crash-safe-livekit';
import { MediaErrorHandler, ErrorRecoveryAction } from '@/lib/voice/media-error-handler';
import { NetworkRecoveryManager, RecoveryAttempt } from '@/lib/voice/network-recovery-manager';

interface VoiceStateStore {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isRecovering: boolean;
  currentChannelId: string | null;
  currentConnectionId: string | null;
  
  // Audio state
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  volume: number;
  audioLevel: number;
  
  // Participants
  participants: Record<string, VoiceParticipant>; // userId -> participant
  speakingUsers: Set<string>;
  
  // Devices
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudioDevice: string | null;
  selectedVideoDevice: string | null;
  
  // Video/Screen sharing
  hasVideo: boolean;
  isScreenSharing: boolean;
  videoStream: MediaStream | null;
  screenStream: MediaStream | null;
  
  // Error state and recovery
  error: VoiceErrorEvent | null;
  lastError: VoiceErrorEvent | null;
  recoveryAttempts: RecoveryAttempt[];
  errorRecoveryAction: ErrorRecoveryAction | null;
  
  // Network and performance
  networkQuality: 'excellent' | 'good' | 'poor' | 'critical';
  bandwidthKbps: number;
  latencyMs: number;
  packetLoss: number;
  
  // Pool management
  poolStatistics: PoolStatistics | null;
  connectionInstances: Record<string, ConnectionInstance>;
  
  // Safety state
  safetyEnabled: boolean;
  crashRecoveryEnabled: boolean;
  autoReconnectEnabled: boolean;
  fallbackModeEnabled: boolean;
}

interface VoiceActions {
  // Connection actions
  connect: (channelId: string, options?: any) => Promise<void>;
  disconnect: () => Promise<void>;
  forceReconnect: () => Promise<void>;
  setConnecting: (connecting: boolean) => void;
  setConnected: (connected: boolean) => void;
  setRecovering: (recovering: boolean) => void;
  
  // Audio actions
  toggleMute: () => Promise<void>;
  toggleDeafen: () => Promise<void>;
  setVolume: (volume: number) => void;
  setSpeaking: (speaking: boolean) => void;
  setAudioLevel: (level: number) => void;
  
  // Participant actions
  addParticipant: (participant: VoiceParticipant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, updates: Partial<VoiceParticipant>) => void;
  setParticipantSpeaking: (userId: string, speaking: boolean) => void;
  clearParticipants: () => void;
  
  // Device actions
  setAudioDevices: (devices: MediaDeviceInfo[]) => void;
  setVideoDevices: (devices: MediaDeviceInfo[]) => void;
  selectAudioDevice: (deviceId: string) => Promise<void>;
  selectVideoDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
  
  // Video/Screen sharing actions
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  setVideoStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  
  // Error handling and recovery
  setError: (error: VoiceErrorEvent | null) => void;
  setLastError: (error: VoiceErrorEvent | null) => void;
  addRecoveryAttempt: (attempt: RecoveryAttempt) => void;
  setErrorRecoveryAction: (action: ErrorRecoveryAction | null) => void;
  clearErrors: () => void;
  executeRecoveryAction: () => Promise<void>;
  
  // Network and performance
  updateNetworkStats: (stats: { bandwidthKbps: number; latencyMs: number; packetLoss: number; quality: string }) => void;
  
  // Pool management
  updatePoolStatistics: (stats: PoolStatistics) => void;
  addConnectionInstance: (instance: ConnectionInstance) => void;
  removeConnectionInstance: (instanceId: string) => void;
  
  // Safety and configuration
  setSafetyEnabled: (enabled: boolean) => void;
  setCrashRecoveryEnabled: (enabled: boolean) => void;
  setAutoReconnectEnabled: (enabled: boolean) => void;
  setFallbackModeEnabled: (enabled: boolean) => void;
  
  // Utility actions
  reset: () => void;
  emergencyReset: () => void;
  getParticipant: (userId: string) => VoiceParticipant | null;
  getParticipantCount: () => number;
  getSpeakingCount: () => number;
  getHealthStatus: () => 'healthy' | 'degraded' | 'critical';
  getDiagnostics: () => any;
}

const initialState: VoiceStateStore = {
  isConnected: false,
  isConnecting: false,
  isRecovering: false,
  currentChannelId: null,
  currentConnectionId: null,
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  volume: 100,
  audioLevel: 0,
  participants: {},
  speakingUsers: new Set(),
  audioDevices: [],
  videoDevices: [],
  selectedAudioDevice: null,
  selectedVideoDevice: null,
  hasVideo: false,
  isScreenSharing: false,
  videoStream: null,
  screenStream: null,
  error: null,
  lastError: null,
  recoveryAttempts: [],
  errorRecoveryAction: null,
  networkQuality: 'good',
  bandwidthKbps: 0,
  latencyMs: 0,
  packetLoss: 0,
  poolStatistics: null,
  connectionInstances: {},
  safetyEnabled: true,
  crashRecoveryEnabled: true,
  autoReconnectEnabled: true,
  fallbackModeEnabled: true,
};

// Global connection pool manager instance
let connectionPoolManager: ConnectionPoolManager | null = null;
let mediaErrorHandler: MediaErrorHandler | null = null;

const initializeManagers = () => {
  if (!connectionPoolManager) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    connectionPoolManager = new ConnectionPoolManager(apiBaseUrl, {
      maxConnections: 3,
      connectionTimeout: 300000, // 5 minutes
      isolationMode: 'strict',
      resourceSharing: false,
      autoCleanup: true,
      cleanupInterval: 60000
    });
  }
  
  if (!mediaErrorHandler) {
    mediaErrorHandler = new MediaErrorHandler();
  }
};

export const useVoiceStore = create<VoiceStateStore & VoiceActions>()((set, get) => ({
  ...initialState,

  // Connection actions
  connect: async (channelId, options = {}) => {
    const state = get();
    
    if (!state.safetyEnabled) {
      console.warn('Safety mechanisms disabled - connecting without crash protection');
    }
    
    try {
      initializeManagers();
      
      set({ 
        currentChannelId: channelId, 
        isConnecting: true, 
        error: null,
        lastError: null
      });
      
      // Create connection through pool manager
      const connectionId = await connectionPoolManager!.createConnection(channelId, options);
      const connection = await connectionPoolManager!.getConnection(connectionId);
      
      if (connection) {
        set({
          currentConnectionId: connectionId,
          isConnected: true,
          isConnecting: false
        });
        
        // Set up connection event handlers
        connection.manager.on('stateChanged', (connectionState: VoiceConnectionState) => {
          const currentState = get();
          set({
            participants: Object.fromEntries(connectionState.participants),
            isMuted: connectionState.localMuted,
            isDeafened: connectionState.localDeafened,
            hasVideo: connectionState.localVideoEnabled,
            isScreenSharing: connectionState.localScreenSharing,
            bandwidthKbps: connectionState.bandwidthKbps,
            latencyMs: connectionState.latencyMs,
            packetLoss: connectionState.packetLoss
          });
        });
        
        connection.manager.on('error', (error: VoiceErrorEvent) => {
          set({ 
            error, 
            lastError: error 
          });
          
          if (state.crashRecoveryEnabled) {
            get().handleVoiceError(error);
          }
        });
      }
      
    } catch (error) {
      console.error('Voice connection failed:', error);
      const voiceError: VoiceErrorEvent = {
        error: VoiceError.CONNECTION_FAILED,
        message: (error as Error).message,
        originalError: error as Error,
        recoverable: true,
        retryCount: 0,
        maxRetries: 5
      };
      
      set({ 
        error: voiceError,
        lastError: voiceError,
        isConnecting: false 
      });
      
      if (state.crashRecoveryEnabled) {
        get().handleVoiceError(voiceError);
      }
    }
  },

  disconnect: async () => {
    const { currentConnectionId, videoStream, screenStream } = get();
    
    try {
      if (currentConnectionId && connectionPoolManager) {
        await connectionPoolManager.disconnectConnection(currentConnectionId);
        await connectionPoolManager.destroyConnection(currentConnectionId);
      }
      
      // Clean up streams safely
      if (videoStream) {
        try {
          videoStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (trackError) {
              console.warn('Error stopping video track:', trackError);
            }
          });
        } catch (streamError) {
          console.warn('Error cleaning up video stream:', streamError);
        }
      }
      
      if (screenStream) {
        try {
          screenStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (trackError) {
              console.warn('Error stopping screen track:', trackError);
            }
          });
        } catch (streamError) {
          console.warn('Error cleaning up screen stream:', streamError);
        }
      }
      
      set({
        isConnected: false,
        isConnecting: false,
        isRecovering: false,
        currentChannelId: null,
        currentConnectionId: null,
        participants: {},
        speakingUsers: new Set(),
        hasVideo: false,
        isScreenSharing: false,
        videoStream: null,
        screenStream: null,
        error: null,
        audioLevel: 0,
        bandwidthKbps: 0,
        latencyMs: 0,
        packetLoss: 0
      });
      
    } catch (error) {
      console.error('Error during disconnect:', error);
      // Force reset even if disconnect fails
      get().emergencyReset();
    }
  },
  
  forceReconnect: async () => {
    const { currentChannelId } = get();
    if (currentChannelId) {
      await get().disconnect();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await get().connect(currentChannelId);
    }
  },

  setConnecting: (connecting) => {
    set({ isConnecting: connecting });
  },
  
  setRecovering: (recovering) => {
    set({ isRecovering: recovering });
  },

  setConnected: (connected) => {
    set({ 
      isConnected: connected, 
      isConnecting: false,
      error: connected ? null : get().error
    });
  },

  // Audio actions
  toggleMute: async () => {
    const { currentConnectionId, isMuted } = get();
    
    if (currentConnectionId && connectionPoolManager) {
      try {
        const connection = await connectionPoolManager.getConnection(currentConnectionId);
        if (connection) {
          await connection.manager.toggleMute();
          set({ isMuted: !isMuted });
        }
      } catch (error) {
        console.error('Failed to toggle mute:', error);
        const voiceError: VoiceErrorEvent = {
          error: VoiceError.MEDIA_DEVICE_ERROR,
          message: 'Failed to toggle microphone',
          originalError: error as Error,
          recoverable: true,
          retryCount: 0,
          maxRetries: 3
        };
        set({ error: voiceError });
      }
    } else {
      // Fallback for local state update
      set(state => ({ isMuted: !state.isMuted }));
    }
  },

  toggleDeafen: async () => {
    const { currentConnectionId, isDeafened } = get();
    
    if (currentConnectionId && connectionPoolManager) {
      try {
        const connection = await connectionPoolManager.getConnection(currentConnectionId);
        if (connection) {
          await connection.manager.toggleDeafen();
          set(state => ({ 
            isDeafened: !isDeafened,
            isMuted: !isDeafened ? true : state.isMuted
          }));
        }
      } catch (error) {
        console.error('Failed to toggle deafen:', error);
        const voiceError: VoiceErrorEvent = {
          error: VoiceError.MEDIA_DEVICE_ERROR,
          message: 'Failed to toggle deafen',
          originalError: error as Error,
          recoverable: true,
          retryCount: 0,
          maxRetries: 3
        };
        set({ error: voiceError });
      }
    } else {
      // Fallback for local state update
      set(state => ({ 
        isDeafened: !state.isDeafened,
        isMuted: !state.isDeafened ? true : state.isMuted
      }));
    }
  },

  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(200, volume)) });
  },

  setSpeaking: (speaking) => {
    set({ isSpeaking: speaking });
  },
  
  setAudioLevel: (level) => {
    set({ audioLevel: Math.max(0, Math.min(100, level)) });
  },

  // Participant actions
  addParticipant: (participant) => {
    set(state => ({
      participants: { ...state.participants, [participant.userId]: participant }
    }));
  },

  removeParticipant: (userId) => {
    set(state => {
      const { [userId]: removed, ...participants } = state.participants;
      const speakingUsers = new Set(state.speakingUsers);
      speakingUsers.delete(userId);
      
      return { participants, speakingUsers };
    });
  },

  updateParticipant: (userId, updates) => {
    set(state => {
      const participant = state.participants[userId];
      if (!participant) return state;
      
      return {
        participants: {
          ...state.participants,
          [userId]: { ...participant, ...updates }
        }
      };
    });
  },

  setParticipantSpeaking: (userId, speaking) => {
    set(state => {
      const speakingUsers = new Set(state.speakingUsers);
      
      if (speaking) {
        speakingUsers.add(userId);
      } else {
        speakingUsers.delete(userId);
      }
      
      // Update participant speaking state
      const participant = state.participants[userId];
      if (participant) {
        return {
          speakingUsers,
          participants: {
            ...state.participants,
            [userId]: { ...participant, isSpeaking: speaking }
          }
        };
      }
      
      return { speakingUsers };
    });
  },

  clearParticipants: () => {
    set({ 
      participants: {}, 
      speakingUsers: new Set() 
    });
  },

  // Device actions
  setAudioDevices: (devices) => {
    set({ audioDevices: devices });
  },

  setVideoDevices: (devices) => {
    set({ videoDevices: devices });
  },

  selectAudioDevice: async (deviceId) => {
    set({ selectedAudioDevice: deviceId });
    
    // Apply device selection to active connection
    const { currentConnectionId } = get();
    if (currentConnectionId && connectionPoolManager) {
      try {
        const connection = await connectionPoolManager.getConnection(currentConnectionId);
        if (connection) {
          // Device switching logic would be implemented here
          console.log(`Switched to audio device: ${deviceId}`);
        }
      } catch (error) {
        console.error('Failed to switch audio device:', error);
      }
    }
  },

  selectVideoDevice: async (deviceId) => {
    set({ selectedVideoDevice: deviceId });
    
    // Apply device selection to active connection
    const { currentConnectionId } = get();
    if (currentConnectionId && connectionPoolManager) {
      try {
        const connection = await connectionPoolManager.getConnection(currentConnectionId);
        if (connection) {
          // Device switching logic would be implemented here
          console.log(`Switched to video device: ${deviceId}`);
        }
      } catch (error) {
        console.error('Failed to switch video device:', error);
      }
    }
  },

  refreshDevices: async () => {
    try {
      if (!mediaErrorHandler) {
        initializeManagers();
      }
      
      const devices = await mediaErrorHandler!.checkDeviceAvailability();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      set({ audioDevices, videoDevices });
    } catch (error) {
      console.error('Failed to refresh devices:', error);
      const voiceError: VoiceErrorEvent = {
        error: VoiceError.MEDIA_DEVICE_ERROR,
        message: 'Failed to access media devices',
        originalError: error as Error,
        recoverable: true,
        retryCount: 0,
        maxRetries: 3
      };
      set({ error: voiceError });
    }
  },

  // Video/Screen sharing actions
  toggleVideo: async () => {
    const { currentConnectionId, hasVideo } = get();
    
    if (currentConnectionId && connectionPoolManager) {
      try {
        const connection = await connectionPoolManager.getConnection(currentConnectionId);
        if (connection) {
          if (hasVideo) {
            await connection.manager.disableCamera();
          } else {
            await connection.manager.enableCamera();
          }
          set({ hasVideo: !hasVideo });
        }
      } catch (error) {
        console.error('Failed to toggle video:', error);
        const voiceError: VoiceErrorEvent = {
          error: VoiceError.CAMERA_PERMISSION_DENIED,
          message: 'Failed to toggle camera',
          originalError: error as Error,
          recoverable: true,
          retryCount: 0,
          maxRetries: 3
        };
        set({ error: voiceError });
        
        if (get().crashRecoveryEnabled) {
          get().handleVoiceError(voiceError);
        }
      }
    } else {
      set(state => ({ hasVideo: !state.hasVideo }));
    }
  },

  toggleScreenShare: async () => {
    const { currentConnectionId, isScreenSharing } = get();
    
    if (currentConnectionId && connectionPoolManager) {
      try {
        const connection = await connectionPoolManager.getConnection(currentConnectionId);
        if (connection) {
          if (isScreenSharing) {
            await connection.manager.stopScreenShare();
          } else {
            await connection.manager.startScreenShare();
          }
          set({ isScreenSharing: !isScreenSharing });
        }
      } catch (error) {
        console.error('Failed to toggle screen share:', error);
        const voiceError: VoiceErrorEvent = {
          error: VoiceError.SCREEN_SHARE_PERMISSION_DENIED,
          message: 'Failed to toggle screen sharing',
          originalError: error as Error,
          recoverable: true,
          retryCount: 0,
          maxRetries: 3
        };
        set({ error: voiceError });
        
        if (get().crashRecoveryEnabled) {
          get().handleVoiceError(voiceError);
        }
      }
    } else {
      const { isScreenSharing, screenStream } = get();
      
      if (isScreenSharing && screenStream) {
        try {
          screenStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (trackError) {
              console.warn('Error stopping screen track:', trackError);
            }
          });
        } catch (streamError) {
          console.warn('Error stopping screen stream:', streamError);
        }
        set({ isScreenSharing: false, screenStream: null });
      } else {
        set({ isScreenSharing: !isScreenSharing });
      }
    }
  },

  setVideoStream: (stream) => {
    const currentStream = get().videoStream;
    if (currentStream && currentStream !== stream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    set({ videoStream: stream });
  },

  setScreenStream: (stream) => {
    const currentStream = get().screenStream;
    if (currentStream && currentStream !== stream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    set({ screenStream: stream });
  },

  // Error handling and recovery
  setError: (error) => {
    set({ error });
    if (error) {
      set({ lastError: error });
    }
  },
  
  setLastError: (error) => {
    set({ lastError: error });
  },
  
  addRecoveryAttempt: (attempt) => {
    set(state => ({
      recoveryAttempts: [...state.recoveryAttempts, attempt].slice(-10) // Keep last 10 attempts
    }));
  },
  
  setErrorRecoveryAction: (action) => {
    set({ errorRecoveryAction: action });
  },
  
  clearErrors: () => {
    set({ 
      error: null, 
      lastError: null, 
      errorRecoveryAction: null 
    });
  },
  
  executeRecoveryAction: async () => {
    const { errorRecoveryAction } = get();
    if (errorRecoveryAction?.callback) {
      try {
        await errorRecoveryAction.callback();
        get().clearErrors();
      } catch (error) {
        console.error('Recovery action failed:', error);
      }
    }
  },
  
  // Network and performance
  updateNetworkStats: (stats) => {
    set({
      bandwidthKbps: stats.bandwidthKbps,
      latencyMs: stats.latencyMs,
      packetLoss: stats.packetLoss,
      networkQuality: stats.quality as any
    });
  },
  
  // Pool management
  updatePoolStatistics: (stats) => {
    set({ poolStatistics: stats });
  },
  
  addConnectionInstance: (instance) => {
    set(state => ({
      connectionInstances: {
        ...state.connectionInstances,
        [instance.id]: instance
      }
    }));
  },
  
  removeConnectionInstance: (instanceId) => {
    set(state => {
      const { [instanceId]: removed, ...connectionInstances } = state.connectionInstances;
      return { connectionInstances };
    });
  },
  
  // Safety and configuration
  setSafetyEnabled: (enabled) => {
    set({ safetyEnabled: enabled });
    console.log(`Voice safety mechanisms ${enabled ? 'enabled' : 'disabled'}`);
  },
  
  setCrashRecoveryEnabled: (enabled) => {
    set({ crashRecoveryEnabled: enabled });
    console.log(`Crash recovery ${enabled ? 'enabled' : 'disabled'}`);
  },
  
  setAutoReconnectEnabled: (enabled) => {
    set({ autoReconnectEnabled: enabled });
    console.log(`Auto-reconnect ${enabled ? 'enabled' : 'disabled'}`);
  },
  
  setFallbackModeEnabled: (enabled) => {
    set({ fallbackModeEnabled: enabled });
    console.log(`Fallback mode ${enabled ? 'enabled' : 'disabled'}`);
  },

  // Utility actions
  reset: () => {
    const { videoStream, screenStream } = get();
    
    try {
      // Clean up streams safely
      if (videoStream) {
        try {
          videoStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (trackError) {
              console.warn('Error stopping video track during reset:', trackError);
            }
          });
        } catch (streamError) {
          console.warn('Error cleaning video stream during reset:', streamError);
        }
      }
      if (screenStream) {
        try {
          screenStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (trackError) {
              console.warn('Error stopping screen track during reset:', trackError);
            }
          });
        } catch (streamError) {
          console.warn('Error cleaning screen stream during reset:', streamError);
        }
      }
      
      // Clean up connection pool
      if (connectionPoolManager) {
        connectionPoolManager.forceCleanup().catch(error => {
          console.warn('Error during pool cleanup:', error);
        });
      }
      
      set({ ...initialState, speakingUsers: new Set() });
    } catch (error) {
      console.error('Error during reset:', error);
      // Force reset even if cleanup fails
      set({ ...initialState, speakingUsers: new Set() });
    }
  },
  
  emergencyReset: () => {
    console.warn('Performing emergency reset of voice store');
    
    try {
      // Force destroy connection pool
      if (connectionPoolManager) {
        connectionPoolManager.destroy().catch(() => {});
        connectionPoolManager = null;
      }
      
      // Force destroy error handler
      if (mediaErrorHandler) {
        mediaErrorHandler.destroy();
        mediaErrorHandler = null;
      }
      
      // Force reset state
      set({ ...initialState, speakingUsers: new Set() });
    } catch (error) {
      console.error('Emergency reset failed:', error);
      // Last resort - just reset state
      set({ ...initialState, speakingUsers: new Set() });
    }
  },

  getParticipant: (userId) => {
    return get().participants[userId] || null;
  },

  getParticipantCount: () => {
    return Object.keys(get().participants).length;
  },

  getSpeakingCount: () => {
    return get().speakingUsers.size;
  },
  
  getHealthStatus: () => {
    const { error, isConnected, networkQuality, packetLoss } = get();
    
    if (error && !error.recoverable) {
      return 'critical';
    }
    
    if (!isConnected || networkQuality === 'critical' || packetLoss > 10) {
      return 'critical';
    }
    
    if (networkQuality === 'poor' || packetLoss > 5 || error) {
      return 'degraded';
    }
    
    return 'healthy';
  },
  
  getDiagnostics: () => {
    const state = get();
    return {
      connectionState: {
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        isRecovering: state.isRecovering,
        currentChannelId: state.currentChannelId,
        currentConnectionId: state.currentConnectionId
      },
      audioState: {
        isMuted: state.isMuted,
        isDeafened: state.isDeafened,
        isSpeaking: state.isSpeaking,
        audioLevel: state.audioLevel,
        volume: state.volume
      },
      networkStats: {
        quality: state.networkQuality,
        bandwidth: state.bandwidthKbps,
        latency: state.latencyMs,
        packetLoss: state.packetLoss
      },
      errorState: {
        currentError: state.error,
        lastError: state.lastError,
        recoveryAttempts: state.recoveryAttempts.length,
        recoveryAction: state.errorRecoveryAction
      },
      safetyConfig: {
        safetyEnabled: state.safetyEnabled,
        crashRecoveryEnabled: state.crashRecoveryEnabled,
        autoReconnectEnabled: state.autoReconnectEnabled,
        fallbackModeEnabled: state.fallbackModeEnabled
      },
      poolStats: state.poolStatistics,
      healthStatus: get().getHealthStatus()
    };
  },
  
  // Private helper method for error handling
  handleVoiceError: async (error: VoiceErrorEvent) => {
    if (!mediaErrorHandler) {
      initializeManagers();
    }
    
    try {
      const recoveryAction = await mediaErrorHandler!.analyzeError(error);
      set({ errorRecoveryAction: recoveryAction });
      
      // Auto-execute certain recovery actions
      if (recoveryAction.type === 'retry' && get().autoReconnectEnabled) {
        set({ isRecovering: true });
        
        setTimeout(async () => {
          try {
            if (recoveryAction.callback) {
              await recoveryAction.callback();
            } else {
              await get().forceReconnect();
            }
            get().clearErrors();
          } catch (recoveryError) {
            console.error('Auto-recovery failed:', recoveryError);
            const attempt: RecoveryAttempt = {
              attempt: get().recoveryAttempts.length + 1,
              timestamp: Date.now(),
              method: 'auto',
              success: false,
              error: (recoveryError as Error).message
            };
            get().addRecoveryAttempt(attempt);
          } finally {
            set({ isRecovering: false });
          }
        }, recoveryAction.delay || 0);
      }
    } catch (analysisError) {
      console.error('Error analysis failed:', analysisError);
    }
  }
}));