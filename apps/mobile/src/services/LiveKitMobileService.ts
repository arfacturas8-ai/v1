/**
 * LiveKit Mobile Service
 * Optimized for React Native mobile applications with Discord-style functionality
 */

import { 
  Room, 
  RoomEvent, 
  Track, 
  RemoteTrack, 
  RemoteParticipant, 
  LocalParticipant,
  ConnectionQuality,
  ParticipantEvent,
  TrackEvent,
  VideoPresets,
  AudioPresets,
  RoomOptions
} from 'livekit-client';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface MobileParticipantInfo {
  identity: string;
  name?: string;
  metadata?: string;
  audioTrack?: MediaStreamTrack | null;
  videoTrack?: MediaStreamTrack | null;
  screenShareTrack?: MediaStreamTrack | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  isSpeaking: boolean;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  volume: number;
  joinedAt: Date;
  audioLevel: number; // 0-1 for visual feedback
  role?: 'owner' | 'moderator' | 'member';
}

export interface LiveKitMobileConfig {
  serverUrl: string;
  token: string;
  options?: {
    autoSubscribe?: boolean;
    adaptiveStream?: boolean;
    dynacast?: boolean;
    publishDefaults?: {
      audioPreset?: AudioPresets;
      videoPreset?: VideoPresets;
      dtx?: boolean; // Discontinuous transmission for mobile battery optimization
      red?: boolean; // Redundant encoding
      simulcast?: boolean;
    };
    videoCaptureDefaults?: {
      resolution?: VideoPresets;
      facingMode?: 'user' | 'environment';
    };
    // Mobile-specific optimizations
    mobile?: {
      enableBatteryOptimization?: boolean;
      enableDataSaver?: boolean;
      enableBackgroundMode?: boolean;
      maxAudioBitrate?: number;
      maxVideoBitrate?: number;
    };
  };
}

export interface MobileVoiceEventHandlers {
  onParticipantJoined?: (participant: MobileParticipantInfo) => void;
  onParticipantLeft?: (participantId: string) => void;
  onTrackSubscribed?: (track: RemoteTrack, participant: RemoteParticipant) => void;
  onTrackUnsubscribed?: (track: RemoteTrack, participant: RemoteParticipant) => void;
  onActiveSpeakersChanged?: (speakerIds: string[]) => void;
  onConnectionQualityChanged?: (participantId: string, quality: ConnectionQuality) => void;
  onDisconnected?: (reason?: string) => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onError?: (error: Error) => void;
  onAudioLevelChanged?: (participantId: string, level: number) => void;
}

export class LiveKitMobileService {
  private room: Room | null = null;
  private participants = new Map<string, MobileParticipantInfo>();
  private eventHandlers: MobileVoiceEventHandlers = {};
  private isConnected = false;
  private localAudioTrack: Track | null = null;
  private localVideoTrack: Track | null = null;
  private localScreenShareTrack: Track | null = null;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private connectionRetryCount = 0;
  private maxRetries = 3;
  private config: LiveKitMobileConfig;

  constructor(config: LiveKitMobileConfig) {
    this.config = config;
    this.setupRoom();
  }

  private setupRoom() {
    const roomOptions: RoomOptions = {
      ...this.config.options,
      // Mobile-specific optimizations
      publishDefaults: {
        audioPreset: AudioPresets.music, // High quality for voice
        videoPreset: VideoPresets.h360, // Optimized for mobile
        dtx: true, // Battery optimization
        red: true, // Network reliability
        simulcast: true, // Adaptive quality
        ...this.config.options?.publishDefaults
      },
      videoCaptureDefaults: {
        resolution: VideoPresets.h540,
        facingMode: 'user',
        ...this.config.options?.videoCaptureDefaults
      },
      // Mobile connectivity optimizations
      webRtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle'
      }
    };

    this.room = new Room(roomOptions);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.room) return;

    // Connection events
    this.room.on(RoomEvent.Connected, this.handleConnected.bind(this));
    this.room.on(RoomEvent.Disconnected, this.handleDisconnected.bind(this));
    this.room.on(RoomEvent.Reconnecting, this.handleReconnecting.bind(this));
    this.room.on(RoomEvent.Reconnected, this.handleReconnected.bind(this));

    // Participant events
    this.room.on(RoomEvent.ParticipantConnected, this.handleParticipantConnected.bind(this));
    this.room.on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected.bind(this));

    // Track events
    this.room.on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this));
    this.room.on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed.bind(this));
    this.room.on(RoomEvent.TrackMuted, this.handleTrackMuted.bind(this));
    this.room.on(RoomEvent.TrackUnmuted, this.handleTrackUnmuted.bind(this));

    // Speaking events
    this.room.on(RoomEvent.ActiveSpeakersChanged, this.handleActiveSpeakersChanged.bind(this));

    // Connection quality
    this.room.on(RoomEvent.ConnectionQualityChanged, this.handleConnectionQualityChanged.bind(this));
  }

  async connect(): Promise<void> {
    if (!this.room) throw new Error('Room not initialized');
    
    try {
      console.log('🔗 Connecting to LiveKit mobile service...');
      await this.room.connect(this.config.serverUrl, this.config.token);
      this.isConnected = true;
      this.connectionRetryCount = 0;
      
      // Start audio level monitoring
      this.startAudioLevelMonitoring();
      
      // Mobile haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      console.log('✅ Connected to LiveKit mobile service');
    } catch (error) {
      console.error('❌ Failed to connect to LiveKit mobile service:', error);
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      this.stopAudioLevelMonitoring();
      await this.room.disconnect();
      this.isConnected = false;
      this.participants.clear();
      
      // Mobile haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      console.log('👋 Disconnected from LiveKit mobile service');
    }
  }

  async enableMicrophone(enabled: boolean): Promise<void> {
    if (!this.room?.localParticipant) return;

    try {
      if (enabled) {
        this.localAudioTrack = await this.room.localParticipant.setMicrophoneEnabled(
          true,
          {
            deviceId: this.config.options?.mobile?.enableDataSaver ? undefined : 'default',
            // Mobile audio optimizations
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: this.config.options?.mobile?.enableDataSaver ? 16000 : 48000
          }
        );
      } else {
        await this.room.localParticipant.setMicrophoneEnabled(false);
      }
      
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(
          enabled ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy
        );
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error('Microphone toggle failed'));
      throw error;
    }
  }

  async enableCamera(enabled: boolean): Promise<void> {
    if (!this.room?.localParticipant) return;

    try {
      if (enabled) {
        this.localVideoTrack = await this.room.localParticipant.setCameraEnabled(
          true,
          {
            // Mobile video optimizations
            resolution: this.config.options?.mobile?.enableDataSaver 
              ? VideoPresets.h360 
              : VideoPresets.h720,
            frameRate: this.config.options?.mobile?.enableDataSaver ? 15 : 30
          }
        );
      } else {
        await this.room.localParticipant.setCameraEnabled(false);
      }
      
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to toggle camera:', error);
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error('Camera toggle failed'));
      throw error;
    }
  }

  async enableScreenShare(enabled: boolean): Promise<void> {
    if (!this.room?.localParticipant) return;

    try {
      if (enabled) {
        this.localScreenShareTrack = await this.room.localParticipant.setScreenShareEnabled(true);
      } else {
        await this.room.localParticipant.setScreenShareEnabled(false);
      }
      
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error('Screen share toggle failed'));
      throw error;
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.room?.localParticipant) return;

    try {
      const videoTrack = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (videoTrack && videoTrack.track) {
        // Toggle between front and back camera
        await (videoTrack.track as any).switchCamera?.();
        
        // Haptic feedback
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error('Camera switch failed'));
      throw error;
    }
  }

  setParticipantVolume(participantIdentity: string, volume: number): void {
    const participant = this.room?.getParticipantByIdentity(participantIdentity);
    if (participant) {
      participant.audioTrackPublications.forEach((publication) => {
        if (publication.track) {
          // Set volume (0.0 to 1.0)
          (publication.track as any).setVolume?.(volume / 100);
        }
      });
      
      // Update local participant info
      const participantInfo = this.participants.get(participantIdentity);
      if (participantInfo) {
        participantInfo.volume = volume;
        this.participants.set(participantIdentity, participantInfo);
      }
    }
  }

  getParticipants(): MobileParticipantInfo[] {
    return Array.from(this.participants.values());
  }

  getLocalParticipant(): MobileParticipantInfo | null {
    if (!this.room?.localParticipant) return null;
    
    const localParticipant = this.room.localParticipant;
    return {
      identity: localParticipant.identity,
      name: localParticipant.name,
      metadata: localParticipant.metadata,
      audioTrack: this.localAudioTrack?.mediaStreamTrack || null,
      videoTrack: this.localVideoTrack?.mediaStreamTrack || null,
      screenShareTrack: this.localScreenShareTrack?.mediaStreamTrack || null,
      audioEnabled: localParticipant.isMicrophoneEnabled,
      videoEnabled: localParticipant.isCameraEnabled,
      screenShareEnabled: localParticipant.isScreenShareEnabled,
      isSpeaking: localParticipant.isSpeaking,
      connectionQuality: this.mapConnectionQuality(localParticipant.connectionQuality),
      volume: 100,
      joinedAt: new Date(),
      audioLevel: 0,
      role: 'member'
    };
  }

  // Event handler registration
  on<K extends keyof MobileVoiceEventHandlers>(event: K, handler: NonNullable<MobileVoiceEventHandlers[K]>): void {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof MobileVoiceEventHandlers>(event: K): void {
    delete this.eventHandlers[event];
  }

  // Connection retry with exponential backoff
  async retry(): Promise<void> {
    if (this.connectionRetryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    this.connectionRetryCount++;
    const delay = Math.pow(2, this.connectionRetryCount) * 1000; // Exponential backoff
    
    console.log(`🔄 Retrying connection (attempt ${this.connectionRetryCount}/${this.maxRetries}) in ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await this.connect();
  }

  // Mobile-specific methods
  enableDataSaverMode(enabled: boolean): void {
    if (this.config.options?.mobile) {
      this.config.options.mobile.enableDataSaver = enabled;
      
      // Apply data saver settings to existing tracks
      if (enabled && this.room?.localParticipant) {
        // Reduce audio bitrate
        const audioTrack = this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
        if (audioTrack && audioTrack.track) {
          (audioTrack.track as any).setMaxBitrate?.(32000); // 32 kbps
        }
        
        // Reduce video bitrate
        const videoTrack = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (videoTrack && videoTrack.track) {
          (videoTrack.track as any).setMaxBitrate?.(200000); // 200 kbps
        }
      }
    }
  }

  enableBatteryOptimization(enabled: boolean): void {
    if (this.config.options?.mobile) {
      this.config.options.mobile.enableBatteryOptimization = enabled;
      
      if (enabled) {
        // Reduce frame rate and quality for battery optimization
        const videoTrack = this.room?.localParticipant?.getTrackPublication(Track.Source.Camera);
        if (videoTrack && videoTrack.track) {
          (videoTrack.track as any).setMaxFrameRate?.(15);
        }
      }
    }
  }

  // Private event handlers
  private handleConnected() {
    this.isConnected = true;
    console.log('📱 Connected to mobile voice room');
    
    // Initialize local participant
    if (this.room?.localParticipant) {
      this.updateParticipantInfo(this.room.localParticipant);
    }
    
    // Initialize existing remote participants
    this.room?.remoteParticipants.forEach((participant) => {
      this.updateParticipantInfo(participant);
    });
  }

  private handleDisconnected(reason?: string) {
    this.isConnected = false;
    this.participants.clear();
    this.stopAudioLevelMonitoring();
    console.log('📱 Disconnected from mobile voice room:', reason);
    this.eventHandlers.onDisconnected?.(reason);
  }

  private handleReconnecting() {
    console.log('📱 Reconnecting to mobile voice room...');
    this.eventHandlers.onReconnecting?.();
  }

  private handleReconnected() {
    console.log('📱 Reconnected to mobile voice room');
    this.eventHandlers.onReconnected?.();
  }

  private handleParticipantConnected(participant: RemoteParticipant) {
    console.log('📱 Participant joined:', participant.identity);
    this.updateParticipantInfo(participant);
    
    const participantInfo = this.participants.get(participant.identity);
    if (participantInfo) {
      this.eventHandlers.onParticipantJoined?.(participantInfo);
    }
  }

  private handleParticipantDisconnected(participant: RemoteParticipant) {
    console.log('📱 Participant left:', participant.identity);
    this.participants.delete(participant.identity);
    this.eventHandlers.onParticipantLeft?.(participant.identity);
  }

  private handleTrackSubscribed(track: RemoteTrack, participant: RemoteParticipant) {
    console.log('📱 Track subscribed:', track.source, 'from', participant.identity);
    this.updateParticipantInfo(participant);
    this.eventHandlers.onTrackSubscribed?.(track, participant);
  }

  private handleTrackUnsubscribed(track: RemoteTrack, participant: RemoteParticipant) {
    console.log('📱 Track unsubscribed:', track.source, 'from', participant.identity);
    this.updateParticipantInfo(participant);
    this.eventHandlers.onTrackUnsubscribed?.(track, participant);
  }

  private handleTrackMuted(track: any, participant: any) {
    console.log('📱 Track muted:', track.source, 'from', participant.identity);
    this.updateParticipantInfo(participant);
  }

  private handleTrackUnmuted(track: any, participant: any) {
    console.log('📱 Track unmuted:', track.source, 'from', participant.identity);
    this.updateParticipantInfo(participant);
  }

  private handleActiveSpeakersChanged(speakers: Array<RemoteParticipant>) {
    const speakerIds = speakers.map(s => s.identity);
    
    // Update speaking status for all participants
    this.participants.forEach((participantInfo, identity) => {
      participantInfo.isSpeaking = speakerIds.includes(identity);
    });
    
    this.eventHandlers.onActiveSpeakersChanged?.(speakerIds);
  }

  private handleConnectionQualityChanged(quality: ConnectionQuality, participant: RemoteParticipant) {
    const participantInfo = this.participants.get(participant.identity);
    if (participantInfo) {
      participantInfo.connectionQuality = this.mapConnectionQuality(quality);
      this.participants.set(participant.identity, participantInfo);
    }
    
    this.eventHandlers.onConnectionQualityChanged?.(participant.identity, quality);
  }

  private updateParticipantInfo(participant: LocalParticipant | RemoteParticipant) {
    const audioTrack = participant.getTrackPublication(Track.Source.Microphone)?.track as RemoteTrack;
    const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.track as RemoteTrack;
    const screenShareTrack = participant.getTrackPublication(Track.Source.ScreenShare)?.track as RemoteTrack;

    const participantInfo: MobileParticipantInfo = {
      identity: participant.identity,
      name: participant.name,
      metadata: participant.metadata,
      audioTrack: audioTrack?.mediaStreamTrack || null,
      videoTrack: videoTrack?.mediaStreamTrack || null,
      screenShareTrack: screenShareTrack?.mediaStreamTrack || null,
      audioEnabled: !participant.getTrackPublication(Track.Source.Microphone)?.isMuted,
      videoEnabled: !participant.getTrackPublication(Track.Source.Camera)?.isMuted,
      screenShareEnabled: !participant.getTrackPublication(Track.Source.ScreenShare)?.isMuted,
      isSpeaking: participant.isSpeaking,
      connectionQuality: this.mapConnectionQuality(participant.connectionQuality),
      volume: this.participants.get(participant.identity)?.volume || 100,
      joinedAt: this.participants.get(participant.identity)?.joinedAt || new Date(),
      audioLevel: this.participants.get(participant.identity)?.audioLevel || 0,
      role: this.participants.get(participant.identity)?.role || 'member'
    };

    this.participants.set(participant.identity, participantInfo);
  }

  private mapConnectionQuality(quality: ConnectionQuality): 'poor' | 'fair' | 'good' | 'excellent' {
    switch (quality) {
      case ConnectionQuality.Poor:
        return 'poor';
      case ConnectionQuality.Good:
        return 'good';
      case ConnectionQuality.Excellent:
        return 'excellent';
      default:
        return 'fair';
    }
  }

  private startAudioLevelMonitoring() {
    this.audioLevelInterval = setInterval(() => {
      if (!this.room) return;

      // Monitor local participant audio level
      const localParticipant = this.room.localParticipant;
      if (localParticipant?.isMicrophoneEnabled) {
        const audioLevel = Math.random() * 0.8; // Simulate audio level for now
        const participantInfo = this.participants.get(localParticipant.identity);
        if (participantInfo) {
          participantInfo.audioLevel = audioLevel;
          this.participants.set(localParticipant.identity, participantInfo);
          this.eventHandlers.onAudioLevelChanged?.(localParticipant.identity, audioLevel);
        }
      }

      // Monitor remote participants audio levels
      this.room.remoteParticipants.forEach(participant => {
        if (participant.getTrackPublication(Track.Source.Microphone)?.track) {
          const audioLevel = Math.random() * 0.6; // Simulate audio level for now
          const participantInfo = this.participants.get(participant.identity);
          if (participantInfo) {
            participantInfo.audioLevel = audioLevel;
            this.participants.set(participant.identity, participantInfo);
            this.eventHandlers.onAudioLevelChanged?.(participant.identity, audioLevel);
          }
        }
      });
    }, 100); // Update every 100ms for smooth animations
  }

  private stopAudioLevelMonitoring() {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
  }

  // Utility methods
  isConnectedToRoom(): boolean {
    return this.isConnected && this.room?.state === 'connected';
  }

  getRoomInfo() {
    return {
      name: this.room?.name,
      numParticipants: this.participants.size,
      isConnected: this.isConnected,
      serverUrl: this.config.serverUrl,
      connectionRetries: this.connectionRetryCount
    };
  }

  getConnectionStats() {
    return this.room?.getStats();
  }
}

// Helper function to create mobile LiveKit service
export async function createMobileLiveKitService(
  serverUrl: string, 
  token: string, 
  options?: LiveKitMobileConfig['options']
): Promise<LiveKitMobileService> {
  const config: LiveKitMobileConfig = {
    serverUrl,
    token,
    options: {
      autoSubscribe: true,
      adaptiveStream: true,
      dynacast: true,
      mobile: {
        enableBatteryOptimization: Platform.OS !== 'web',
        enableDataSaver: false,
        enableBackgroundMode: true,
        maxAudioBitrate: 64000,
        maxVideoBitrate: 800000
      },
      ...options
    }
  };

  const service = new LiveKitMobileService(config);
  await service.connect();
  return service;
}

export default LiveKitMobileService;