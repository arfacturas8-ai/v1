/**
 * React Native hook for LiveKit mobile voice/video functionality
 * Optimized for Discord-style mobile experience
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { 
  LiveKitMobileService, 
  MobileParticipantInfo, 
  MobileVoiceEventHandlers, 
  createMobileLiveKitService,
  LiveKitMobileConfig
} from '../services/LiveKitMobileService';

interface UseMobileLiveKitOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  enableDataSaver?: boolean;
  enableBatteryOptimization?: boolean;
  enableBackgroundMode?: boolean;
  onError?: (error: Error) => void;
  onParticipantJoined?: (participant: MobileParticipantInfo) => void;
  onParticipantLeft?: (participantId: string) => void;
  onConnectionQualityChanged?: (participantId: string, quality: string) => void;
  onAudioLevelChanged?: (participantId: string, level: number) => void;
}

interface MobileLiveKitState {
  isConnected: boolean;
  isConnecting: boolean;
  participants: MobileParticipantInfo[];
  localParticipant: MobileParticipantInfo | null;
  error: Error | null;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  roomInfo: {
    name?: string;
    numParticipants: number;
    serverUrl?: string;
    connectionRetries: number;
  } | null;
  isInBackground: boolean;
}

interface UseMobileLiveKitReturn extends MobileLiveKitState {
  service: LiveKitMobileService | null;
  connect: (token: string, channelId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  switchCamera: () => Promise<void>;
  setParticipantVolume: (participantId: string, volume: number) => void;
  retry: () => Promise<void>;
  enableDataSaverMode: (enabled: boolean) => void;
  enableBatteryOptimization: (enabled: boolean) => void;
}

export function useMobileLiveKit(options: UseMobileLiveKitOptions = {}): UseMobileLiveKitReturn {
  const {
    serverUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
    autoConnect = false,
    enableDataSaver = false,
    enableBatteryOptimization = Platform.OS !== 'web',
    enableBackgroundMode = true,
    onError,
    onParticipantJoined,
    onParticipantLeft,
    onConnectionQualityChanged,
    onAudioLevelChanged
  } = options;

  const [state, setState] = useState<MobileLiveKitState>({
    isConnected: false,
    isConnecting: false,
    participants: [],
    localParticipant: null,
    error: null,
    connectionQuality: 'good',
    roomInfo: null,
    isInBackground: false
  });

  const serviceRef = useRef<LiveKitMobileService | null>(null);
  const lastTokenRef = useRef<string>('');
  const lastChannelIdRef = useRef<string>('');
  const appStateRef = useRef(AppState.currentState);

  const updateState = useCallback((updates: Partial<MobileLiveKitState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('📱 Mobile LiveKit error:', error);
    updateState({ error, isConnecting: false });
    onError?.(error);
    
    // Provide haptic feedback for errors
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [onError, updateState]);

  const setupServiceEventHandlers = useCallback((service: LiveKitMobileService) => {
    const handlers: MobileVoiceEventHandlers = {
      onParticipantJoined: (participant) => {
        console.log('📱 Mobile participant joined:', participant.identity);
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        updateState({ 
          participants, 
          localParticipant,
          roomInfo: service.getRoomInfo()
        });
        
        onParticipantJoined?.(participant);
        
        // Haptic feedback for participant join
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },

      onParticipantLeft: (participantId) => {
        console.log('📱 Mobile participant left:', participantId);
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        updateState({ 
          participants, 
          localParticipant,
          roomInfo: service.getRoomInfo()
        });
        
        onParticipantLeft?.(participantId);
        
        // Haptic feedback for participant leave
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },

      onTrackSubscribed: (track, participant) => {
        console.log('📱 Mobile track subscribed:', track.source, 'from', participant.identity);
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        updateState({ participants, localParticipant });
      },

      onTrackUnsubscribed: (track, participant) => {
        console.log('📱 Mobile track unsubscribed:', track.source, 'from', participant.identity);
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        updateState({ participants, localParticipant });
      },

      onActiveSpeakersChanged: (speakerIds) => {
        // Participants are already updated in the service
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        updateState({ participants, localParticipant });
      },

      onConnectionQualityChanged: (quality, participant) => {
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        const connectionQuality = service.getLocalParticipant()?.connectionQuality || 'good';
        updateState({ participants, localParticipant, connectionQuality });
        onConnectionQualityChanged?.(participant.identity, quality.toString());
      },

      onAudioLevelChanged: (participantId, level) => {
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        updateState({ participants, localParticipant });
        onAudioLevelChanged?.(participantId, level);
      },

      onDisconnected: (reason) => {
        console.log('📱 Mobile disconnected from LiveKit:', reason);
        updateState({
          isConnected: false,
          isConnecting: false,
          participants: [],
          localParticipant: null,
          roomInfo: null,
          error: reason ? new Error(`Disconnected: ${reason}`) : null
        });
        
        // Haptic feedback for disconnection
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      },

      onReconnecting: () => {
        console.log('📱 Mobile reconnecting to LiveKit...');
        updateState({ isConnecting: true, error: null });
      },

      onReconnected: () => {
        console.log('📱 Mobile reconnected to LiveKit');
        const participants = service.getParticipants();
        const localParticipant = service.getLocalParticipant();
        updateState({
          isConnected: true,
          isConnecting: false,
          participants,
          localParticipant,
          roomInfo: service.getRoomInfo(),
          error: null
        });
        
        // Haptic feedback for reconnection
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },

      onError: handleError
    };

    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      if (handler) {
        service.on(event as keyof MobileVoiceEventHandlers, handler);
      }
    });

    return () => {
      // Cleanup event handlers
      Object.keys(handlers).forEach(event => {
        service.off(event as keyof MobileVoiceEventHandlers);
      });
    };
  }, [updateState, onParticipantJoined, onParticipantLeft, onConnectionQualityChanged, onAudioLevelChanged, handleError]);

  const connect = useCallback(async (token: string, channelId?: string) => {
    if (!token) {
      handleError(new Error('Token is required to connect'));
      return;
    }

    try {
      updateState({ isConnecting: true, error: null });
      
      lastTokenRef.current = token;
      lastChannelIdRef.current = channelId || '';

      // Disconnect existing service if any
      if (serviceRef.current) {
        await serviceRef.current.disconnect();
      }

      // Create new mobile service with optimized settings
      const serviceConfig: LiveKitMobileConfig['options'] = {
        autoSubscribe: true,
        adaptiveStream: true,
        dynacast: true,
        mobile: {
          enableBatteryOptimization,
          enableDataSaver,
          enableBackgroundMode,
          maxAudioBitrate: enableDataSaver ? 32000 : 64000,
          maxVideoBitrate: enableDataSaver ? 200000 : 800000
        }
      };

      const service = await createMobileLiveKitService(serverUrl, token, serviceConfig);
      serviceRef.current = service;

      // Setup event handlers
      const cleanup = setupServiceEventHandlers(service);

      // Update state
      const participants = service.getParticipants();
      const localParticipant = service.getLocalParticipant();
      
      updateState({
        isConnected: true,
        isConnecting: false,
        participants,
        localParticipant,
        roomInfo: service.getRoomInfo(),
        error: null
      });

      console.log('✅ Successfully connected to mobile LiveKit service');
      
      // Success haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Store cleanup function
      return cleanup;

    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to connect'));
    }
  }, [serverUrl, enableBatteryOptimization, enableDataSaver, enableBackgroundMode, handleError, updateState, setupServiceEventHandlers]);

  const disconnect = useCallback(async () => {
    if (serviceRef.current) {
      try {
        await serviceRef.current.disconnect();
        serviceRef.current = null;
        updateState({
          isConnected: false,
          isConnecting: false,
          participants: [],
          localParticipant: null,
          roomInfo: null,
          error: null
        });
      } catch (error) {
        console.error('Error disconnecting mobile service:', error);
      }
    }
  }, [updateState]);

  const toggleMicrophone = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      const localParticipant = serviceRef.current.getLocalParticipant();
      const newState = !localParticipant?.audioEnabled;
      
      await serviceRef.current.enableMicrophone(newState);
      
      // Update state
      const participants = serviceRef.current.getParticipants();
      const updatedLocalParticipant = serviceRef.current.getLocalParticipant();
      updateState({ participants, localParticipant: updatedLocalParticipant });
      
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to toggle microphone'));
    }
  }, [handleError, updateState]);

  const toggleCamera = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      const localParticipant = serviceRef.current.getLocalParticipant();
      const newState = !localParticipant?.videoEnabled;
      
      await serviceRef.current.enableCamera(newState);
      
      // Update state
      const participants = serviceRef.current.getParticipants();
      const updatedLocalParticipant = serviceRef.current.getLocalParticipant();
      updateState({ participants, localParticipant: updatedLocalParticipant });
      
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to toggle camera'));
    }
  }, [handleError, updateState]);

  const toggleScreenShare = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      const localParticipant = serviceRef.current.getLocalParticipant();
      const newState = !localParticipant?.screenShareEnabled;
      
      await serviceRef.current.enableScreenShare(newState);
      
      // Update state
      const participants = serviceRef.current.getParticipants();
      const updatedLocalParticipant = serviceRef.current.getLocalParticipant();
      updateState({ participants, localParticipant: updatedLocalParticipant });
      
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to toggle screen share'));
    }
  }, [handleError, updateState]);

  const switchCamera = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.switchCamera();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to switch camera'));
    }
  }, [handleError]);

  const setParticipantVolume = useCallback((participantId: string, volume: number) => {
    if (!serviceRef.current) return;

    try {
      serviceRef.current.setParticipantVolume(participantId, volume);
      
      // Update state
      const participants = serviceRef.current.getParticipants();
      updateState({ participants });
      
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to set participant volume'));
    }
  }, [handleError, updateState]);

  const retry = useCallback(async () => {
    if (serviceRef.current && lastTokenRef.current) {
      try {
        await serviceRef.current.retry();
      } catch (error) {
        handleError(error instanceof Error ? error : new Error('Retry failed'));
      }
    } else if (lastTokenRef.current) {
      await connect(lastTokenRef.current, lastChannelIdRef.current);
    }
  }, [connect, handleError]);

  const enableDataSaverMode = useCallback((enabled: boolean) => {
    if (serviceRef.current) {
      serviceRef.current.enableDataSaverMode(enabled);
    }
  }, []);

  const enableBatteryOptimizationMode = useCallback((enabled: boolean) => {
    if (serviceRef.current) {
      serviceRef.current.enableBatteryOptimization(enabled);
    }
  }, []);

  // App state change handler
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      const isBackground = nextAppState === 'background' || nextAppState === 'inactive';
      
      updateState({ isInBackground: isBackground });
      
      if (isBackground && serviceRef.current?.isConnectedToRoom()) {
        console.log('📱 App going to background - maintaining voice connection');
        // Optionally reduce quality or pause video in background
        if (state.localParticipant?.videoEnabled) {
          serviceRef.current.enableCamera(false);
        }
      } else if (nextAppState === 'active' && serviceRef.current?.isConnectedToRoom()) {
        console.log('📱 App becoming active - resuming voice connection');
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [updateState, state.localParticipant]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && !state.isConnected && !state.isConnecting && lastTokenRef.current) {
      connect(lastTokenRef.current, lastChannelIdRef.current);
    }
  }, [autoConnect, state.isConnected, state.isConnecting, connect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    service: serviceRef.current,
    connect,
    disconnect,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    switchCamera,
    setParticipantVolume,
    retry,
    enableDataSaverMode,
    enableBatteryOptimization: enableBatteryOptimizationMode
  };
}

export default useMobileLiveKit;