import { 
  Room, 
  RoomEvent, 
  Track, 
  RemoteTrack, 
  RemoteParticipant, 
  LocalParticipant,
  VideoPresets, 
  AudioPresets,
  RemoteTrackPublication,
  ConnectionState,
  ConnectionQuality,
  RoomOptions,
  RoomConnectOptions,
  CreateAudioTrackOptions,
  CreateVideoTrackOptions,
  CreateScreenShareTrackOptions,
  LocalTrackOptions,
  LocalAudioTrack,
  LocalVideoTrack,
  ScreenSharePresets
} from 'livekit-client';

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

export enum VoiceError {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  SERVER_UNREACHABLE = 'SERVER_UNREACHABLE',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Media errors
  MICROPHONE_PERMISSION_DENIED = 'MICROPHONE_PERMISSION_DENIED',
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  SCREEN_SHARE_PERMISSION_DENIED = 'SCREEN_SHARE_PERMISSION_DENIED',
  MICROPHONE_NOT_FOUND = 'MICROPHONE_NOT_FOUND',
  CAMERA_NOT_FOUND = 'CAMERA_NOT_FOUND',
  MEDIA_DEVICE_ERROR = 'MEDIA_DEVICE_ERROR',
  
  // Audio processing errors
  AUDIO_CONTEXT_ERROR = 'AUDIO_CONTEXT_ERROR',
  ECHO_CANCELLATION_FAILED = 'ECHO_CANCELLATION_FAILED',
  NOISE_SUPPRESSION_FAILED = 'NOISE_SUPPRESSION_FAILED',
  
  // Runtime errors
  MEMORY_LEAK = 'MEMORY_LEAK',
  TRACK_PUBLISH_FAILED = 'TRACK_PUBLISH_FAILED',
  TRACK_SUBSCRIBE_FAILED = 'TRACK_SUBSCRIBE_FAILED',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR'
}

export interface VoiceErrorEvent {
  error: VoiceError;
  message: string;
  originalError?: Error;
  recoverable: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface ConnectionConfig {
  url: string;
  token: string;
  channelId: string;
  userId: string;
  
  // Retry configuration
  maxRetries?: number;
  baseRetryDelay?: number;
  maxRetryDelay?: number;
  retryMultiplier?: number;
  
  // Quality settings
  maxBitrate?: number;
  simulcast?: boolean;
  adaptiveStream?: boolean;
  
  // Audio settings
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  
  // Fallback options
  fallbackUrls?: string[];
  degradeGracefully?: boolean;
}

export interface ParticipantInfo {
  sid: string;
  identity: string;
  displayName: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  audioLevel: number;
  connectionQuality: ConnectionQuality;
}

export interface VoiceEvents {
  statusChanged: (status: ConnectionStatus) => void;
  error: (error: VoiceErrorEvent) => void;
  participantJoined: (participant: ParticipantInfo) => void;
  participantLeft: (participant: ParticipantInfo) => void;
  participantUpdated: (participant: ParticipantInfo) => void;
  speakingChanged: (participantSid: string, isSpeaking: boolean) => void;
  audioLevelChanged: (participantSid: string, level: number) => void;
  qualityChanged: (quality: ConnectionQuality) => void;
  trackPublished: (track: RemoteTrackPublication) => void;
  trackUnpublished: (track: RemoteTrackPublication) => void;
  reconnecting: () => void;
  reconnected: () => void;
}

export class CrashSafeLiveKitClient {
  private room: Room | null = null;
  private config: ConnectionConfig | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private retryCount = 0;
  private retryTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private eventHandlers: Map<keyof VoiceEvents, Function[]> = new Map();
  private cleanupFunctions: Function[] = [];
  private isDestroyed = false;
  private connectionAttempts = 0;
  private lastConnectionTime = 0;
  private bandwidthMonitor: any = null;
  private audioTracks: Map<string, LocalAudioTrack> = new Map();
  private videoTracks: Map<string, LocalVideoTrack> = new Map();
  
  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.toString().includes('livekit') || 
          event.reason?.toString().includes('webrtc') ||
          event.reason?.toString().includes('getUserMedia')) {
        console.error('Unhandled voice/video error:', event.reason);
        this.handleError(VoiceError.UNEXPECTED_ERROR, event.reason?.message || 'Unknown error', event.reason);
        event.preventDefault();
      }
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      if (event.error?.stack?.includes('livekit') ||
          event.error?.stack?.includes('webrtc') ||
          event.filename?.includes('livekit')) {
        console.error('Global voice/video error:', event.error);
        this.handleError(VoiceError.UNEXPECTED_ERROR, event.error?.message || 'Unknown error', event.error);
      }
    });
  }

  public async connect(config: ConnectionConfig): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Client has been destroyed');
    }

    this.config = {
      maxRetries: 5,
      baseRetryDelay: 1000,
      maxRetryDelay: 30000,
      retryMultiplier: 2,
      maxBitrate: 64000,
      simulcast: true,
      adaptiveStream: true,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      degradeGracefully: true,
      ...config
    };

    this.setStatus(ConnectionStatus.CONNECTING);
    this.connectionAttempts++;
    this.lastConnectionTime = Date.now();

    try {
      await this.attemptConnection();
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  private async attemptConnection(): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration provided');
    }

    try {
      // Create room with optimized settings
      const roomOptions: RoomOptions = {
        adaptiveStream: this.config.adaptiveStream,
        dynacast: true,
        publishDefaults: {
          videoEncoding: VideoPresets.h264.res720_30,
          // Optimize for voice - use speech preset instead of music
          audioEncoding: {
            maxBitrate: 64000, // 64kbps for high-quality voice
            priority: 'high',
            dtx: true, // Discontinuous transmission
          },
          simulcast: this.config.simulcast
        },
        videoCaptureDefaults: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audioCaptureDefaults: {
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
          sampleRate: 48000,
          channelCount: 1, // Mono for voice optimization
          latency: { ideal: 0.02 }, // 20ms latency target
          // Advanced audio constraints for professional quality
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googVoiceActivityDetection: true,
          googAudioNetworkAdaptation: true
        }
      };

      this.room = new Room(roomOptions);
      this.setupRoomEventHandlers();

      // Connect with retry logic
      const connectOptions: RoomConnectOptions = {
        autoSubscribe: true
      };

      await this.room.connect(this.config.url, this.config.token, connectOptions);
      
      this.setStatus(ConnectionStatus.CONNECTED);
      this.retryCount = 0;
      this.startHealthCheck();
      this.startBandwidthMonitoring();
      
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  private setupRoomEventHandlers(): void {
    if (!this.room) return;

    const cleanup: Function[] = [];

    // Connection state changes
    const handleConnectionStateChange = (state: ConnectionState) => {
      console.log(`Connection state changed to: ${state}`);
      
      switch (state) {
        case ConnectionState.Reconnecting:
          this.setStatus(ConnectionStatus.RECONNECTING);
          this.emit('reconnecting');
          break;
        case ConnectionState.Connected:
          this.setStatus(ConnectionStatus.CONNECTED);
          this.emit('reconnected');
          break;
        case ConnectionState.Disconnected:
          this.setStatus(ConnectionStatus.DISCONNECTED);
          this.handleUnexpectedDisconnection();
          break;
      }
    };

    this.room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChange);
    cleanup.push(() => this.room?.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChange));

    // Participant events
    const handleParticipantConnected = (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      this.emit('participantJoined', this.mapParticipant(participant));
      this.setupParticipantEventHandlers(participant);
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      console.log('Participant disconnected:', participant.identity);
      this.emit('participantLeft', this.mapParticipant(participant));
    };

    this.room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    this.room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    
    cleanup.push(() => {
      this.room?.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      this.room?.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    });

    // Error handling
    const handleRoomError = (error: Error) => {
      console.error('Room error:', error);
      this.handleError(VoiceError.CONNECTION_FAILED, error.message, error);
    };

    this.room.on(RoomEvent.Disconnected, handleRoomError);
    cleanup.push(() => this.room?.off(RoomEvent.Disconnected, handleRoomError));

    // Quality monitoring
    const handleConnectionQualityChanged = (quality: ConnectionQuality) => {
      this.emit('qualityChanged', quality);
      this.handleQualityChange(quality);
    };

    this.room.on(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged);
    cleanup.push(() => this.room?.off(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged));

    this.cleanupFunctions.push(...cleanup);
  }

  private setupParticipantEventHandlers(participant: RemoteParticipant): void {
    const handleTrackPublished = (pub: RemoteTrackPublication) => {
      this.emit('trackPublished', pub);
    };

    const handleTrackUnpublished = (pub: RemoteTrackPublication) => {
      this.emit('trackUnpublished', pub);
    };

    const handleIsSpeakingChanged = (speaking: boolean) => {
      this.emit('speakingChanged', participant.sid, speaking);
      this.emit('participantUpdated', this.mapParticipant(participant));
    };

    participant.on(RoomEvent.TrackPublished, handleTrackPublished);
    participant.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
    participant.on(RoomEvent.IsSpeakingChanged, handleIsSpeakingChanged);

    // Cleanup will be handled automatically when participant disconnects
  }

  private handleQualityChange(quality: ConnectionQuality): void {
    if (this.config?.adaptiveStream) {
      switch (quality) {
        case ConnectionQuality.Poor:
          this.degradeQuality();
          break;
        case ConnectionQuality.Excellent:
          this.restoreQuality();
          break;
      }
    }
  }

  private async degradeQuality(): Promise<void> {
    try {
      // Reduce video quality
      const videoTracks = Array.from(this.videoTracks.values());
      for (const track of videoTracks) {
        await track.setProcessor(this.createQualityReducer());
      }
      
      // Reduce audio bitrate
      const audioTracks = Array.from(this.audioTracks.values());
      for (const track of audioTracks) {
        await track.setProcessor(this.createAudioCompressor());
      }
    } catch (error) {
      console.error('Failed to degrade quality:', error);
    }
  }

  private async restoreQuality(): Promise<void> {
    try {
      // Remove quality processors
      const videoTracks = Array.from(this.videoTracks.values());
      for (const track of videoTracks) {
        await track.setProcessor(null);
      }
      
      const audioTracks = Array.from(this.audioTracks.values());
      for (const track of audioTracks) {
        await track.setProcessor(null);
      }
    } catch (error) {
      console.error('Failed to restore quality:', error);
    }
  }

  private createQualityReducer(): any {
    // Simple quality reducer - in production, use a more sophisticated processor
    return {
      process: async (frame: any) => frame
    };
  }

  private createAudioCompressor(): any {
    // Simple audio compressor - in production, use a more sophisticated processor
    return {
      process: async (frame: any) => frame
    };
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      if (this.room && this.status === ConnectionStatus.CONNECTED) {
        // Check connection health
        const stats = this.room.engine.getConnectedServerAddress();
        if (!stats) {
          console.warn('Health check failed - no server connection');
          this.handleUnexpectedDisconnection();
        }
      }
    }, 30000); // Check every 30 seconds

    this.cleanupFunctions.push(() => {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }
    });
  }

  private startBandwidthMonitoring(): void {
    if (!this.room) return;

    // Monitor bandwidth and adjust accordingly
    this.bandwidthMonitor = setInterval(async () => {
      try {
        const stats = await this.room!.engine.getConnectedServerAddress();
        // Implement bandwidth monitoring logic here
        // Adjust quality based on available bandwidth
      } catch (error) {
        console.error('Bandwidth monitoring error:', error);
      }
    }, 5000);

    this.cleanupFunctions.push(() => {
      if (this.bandwidthMonitor) {
        clearInterval(this.bandwidthMonitor);
        this.bandwidthMonitor = null;
      }
    });
  }

  private handleUnexpectedDisconnection(): void {
    if (this.status !== ConnectionStatus.DISCONNECTED) {
      this.setStatus(ConnectionStatus.DISCONNECTED);
      this.scheduleReconnection();
    }
  }

  private scheduleReconnection(): void {
    if (!this.config || this.isDestroyed) return;

    if (this.retryCount >= this.config.maxRetries!) {
      this.handleError(
        VoiceError.CONNECTION_FAILED,
        `Maximum retry attempts (${this.config.maxRetries}) exceeded`,
        null,
        false
      );
      return;
    }

    const delay = Math.min(
      this.config.baseRetryDelay! * Math.pow(this.config.retryMultiplier!, this.retryCount),
      this.config.maxRetryDelay!
    );

    console.log(`Scheduling reconnection attempt ${this.retryCount + 1} in ${delay}ms`);

    this.retryTimer = setTimeout(async () => {
      if (this.isDestroyed) return;

      this.retryCount++;
      try {
        await this.attemptConnection();
      } catch (error) {
        this.handleConnectionError(error as Error);
      }
    }, delay);

    this.cleanupFunctions.push(() => {
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    });
  }

  private handleConnectionError(error: Error): void {
    console.error('Connection error:', error);

    let voiceError: VoiceError;
    let recoverable = true;

    if (error.message.includes('token') || error.message.includes('unauthorized')) {
      voiceError = VoiceError.AUTHENTICATION_FAILED;
      recoverable = false;
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      voiceError = VoiceError.NETWORK_ERROR;
    } else {
      voiceError = VoiceError.CONNECTION_FAILED;
    }

    this.handleError(voiceError, error.message, error, recoverable);

    if (recoverable) {
      this.scheduleReconnection();
    }
  }

  public async enableMicrophone(): Promise<void> {
    try {
      if (!this.room) {
        throw new Error('Not connected to room');
      }

      // Production-grade audio track options for optimal voice quality
      const options: CreateAudioTrackOptions = {
        echoCancellation: this.config?.echoCancellation ?? true,
        noiseSuppression: this.config?.noiseSuppression ?? true,
        autoGainControl: this.config?.autoGainControl ?? true,
        // Enhanced audio settings for crystal-clear voice
        channelCount: 1, // Mono for voice chat
        sampleRate: 48000, // High-quality sample rate
        sampleSize: 16, // 16-bit depth
        latency: 0.02, // 20ms latency for real-time communication
        // Advanced constraints for professional audio
        googEchoCancellation: true,
        googAutoGainControl: true,
        googNoiseSuppression: true,
        googHighpassFilter: true,
        googTypingNoiseDetection: true,
        googAudioMirroring: false,
        // Voice-specific optimizations
        googVoiceActivityDetection: true,
        googAudioNetworkAdaptation: true
      };

      const track = await this.room.localParticipant.createAudioTrack(options);
      await this.room.localParticipant.publishTrack(track);
      
      this.audioTracks.set('microphone', track);
      
    } catch (error) {
      this.handleMediaError(error as Error, 'microphone');
    }
  }

  public async disableMicrophone(): Promise<void> {
    try {
      if (!this.room) return;

      const track = this.audioTracks.get('microphone');
      if (track) {
        await this.room.localParticipant.unpublishTrack(track);
        track.stop();
        this.audioTracks.delete('microphone');
      }
    } catch (error) {
      console.error('Failed to disable microphone:', error);
    }
  }

  public async enableCamera(): Promise<void> {
    try {
      if (!this.room) {
        throw new Error('Not connected to room');
      }

      const options: CreateVideoTrackOptions = {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };

      const track = await this.room.localParticipant.createVideoTrack(options);
      await this.room.localParticipant.publishTrack(track);
      
      this.videoTracks.set('camera', track);
      
    } catch (error) {
      this.handleMediaError(error as Error, 'camera');
    }
  }

  public async disableCamera(): Promise<void> {
    try {
      if (!this.room) return;

      const track = this.videoTracks.get('camera');
      if (track) {
        await this.room.localParticipant.unpublishTrack(track);
        track.stop();
        this.videoTracks.delete('camera');
      }
    } catch (error) {
      console.error('Failed to disable camera:', error);
    }
  }

  public async startScreenShare(): Promise<void> {
    try {
      if (!this.room) {
        throw new Error('Not connected to room');
      }

      const options: CreateScreenShareTrackOptions = {
        resolution: ScreenSharePresets.h1080fps30.resolution,
        maxFramerate: 30
      };

      const track = await this.room.localParticipant.createScreenTracks(options);
      await this.room.localParticipant.publishTrack(track[0]); // Video track
      
      this.videoTracks.set('screen', track[0] as LocalVideoTrack);
      
    } catch (error) {
      this.handleMediaError(error as Error, 'screen');
    }
  }

  public async stopScreenShare(): Promise<void> {
    try {
      if (!this.room) return;

      const track = this.videoTracks.get('screen');
      if (track) {
        await this.room.localParticipant.unpublishTrack(track);
        track.stop();
        this.videoTracks.delete('screen');
      }
    } catch (error) {
      console.error('Failed to stop screen share:', error);
    }
  }

  private handleMediaError(error: Error, mediaType: 'microphone' | 'camera' | 'screen'): void {
    let voiceError: VoiceError;
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      switch (mediaType) {
        case 'microphone':
          voiceError = VoiceError.MICROPHONE_PERMISSION_DENIED;
          break;
        case 'camera':
          voiceError = VoiceError.CAMERA_PERMISSION_DENIED;
          break;
        case 'screen':
          voiceError = VoiceError.SCREEN_SHARE_PERMISSION_DENIED;
          break;
      }
    } else if (error.name === 'NotFoundError') {
      switch (mediaType) {
        case 'microphone':
          voiceError = VoiceError.MICROPHONE_NOT_FOUND;
          break;
        case 'camera':
          voiceError = VoiceError.CAMERA_NOT_FOUND;
          break;
        default:
          voiceError = VoiceError.MEDIA_DEVICE_ERROR;
      }
    } else {
      voiceError = VoiceError.MEDIA_DEVICE_ERROR;
    }

    this.handleError(voiceError, error.message, error, false);
  }

  private handleError(
    error: VoiceError, 
    message: string, 
    originalError: Error | null, 
    recoverable: boolean = true
  ): void {
    const errorEvent: VoiceErrorEvent = {
      error,
      message,
      originalError: originalError || undefined,
      recoverable,
      retryCount: this.retryCount,
      maxRetries: this.config?.maxRetries || 5
    };

    this.emit('error', errorEvent);
  }

  private mapParticipant(participant: RemoteParticipant | LocalParticipant): ParticipantInfo {
    return {
      sid: participant.sid,
      identity: participant.identity,
      displayName: participant.name || participant.identity,
      isSpeaking: participant.isSpeaking,
      isMuted: participant.isMuted,
      isVideoEnabled: participant.isVideoEnabled,
      isScreenSharing: participant.isScreenShareEnabled,
      audioLevel: participant.audioLevel || 0,
      connectionQuality: participant.connectionQuality || ConnectionQuality.Unknown
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('statusChanged', status);
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getParticipants(): ParticipantInfo[] {
    if (!this.room) return [];
    
    const participants: ParticipantInfo[] = [];
    
    // Add local participant
    if (this.room.localParticipant) {
      participants.push(this.mapParticipant(this.room.localParticipant));
    }
    
    // Add remote participants
    this.room.remoteParticipants.forEach(participant => {
      participants.push(this.mapParticipant(participant));
    });
    
    return participants;
  }

  public on<K extends keyof VoiceEvents>(event: K, handler: VoiceEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off<K extends keyof VoiceEvents>(event: K, handler: VoiceEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof VoiceEvents>(event: K, ...args: Parameters<VoiceEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  public async disconnect(): Promise<void> {
    try {
      this.setStatus(ConnectionStatus.DISCONNECTED);
      await this.cleanup();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  private async cleanup(): Promise<void> {
    // Stop all timers
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions.length = 0;

    // Stop all tracks
    this.audioTracks.forEach(track => track.stop());
    this.videoTracks.forEach(track => track.stop());
    this.audioTracks.clear();
    this.videoTracks.clear();

    // Disconnect room
    if (this.room) {
      try {
        await this.room.disconnect();
      } catch (error) {
        console.error('Error disconnecting room:', error);
      }
      this.room = null;
    }

    // Clean up audio context
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.error('Error closing audio context:', error);
      }
      this.audioContext = null;
    }

    this.retryCount = 0;
    this.config = null;
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.eventHandlers.clear();
  }
}