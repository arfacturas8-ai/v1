import {
  Room,
  RoomEvent,
  ConnectionQuality,
  Track,
  LocalTrack,
  RemoteTrack,
  Participant,
  LocalParticipant,
  RemoteParticipant,
  AudioTrack,
  VideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
  TrackSource,
  VideoPresets,
  ConnectOptions,
  RoomOptions,
  DisconnectReason,
  createLocalAudioTrack,
  createLocalVideoTrack,
  createLocalScreenTracks
} from 'livekit-client';

export enum VoiceError {
  MICROPHONE_PERMISSION_DENIED = 'microphone_permission_denied',
  CAMERA_PERMISSION_DENIED = 'camera_permission_denied',
  SCREEN_SHARE_PERMISSION_DENIED = 'screen_share_permission_denied',
  MICROPHONE_NOT_FOUND = 'microphone_not_found',
  CAMERA_NOT_FOUND = 'camera_not_found',
  CONNECTION_FAILED = 'connection_failed',
  NETWORK_ERROR = 'network_error',
  SERVER_UNREACHABLE = 'server_unreachable',
  AUTHENTICATION_FAILED = 'authentication_failed',
  ROOM_FULL = 'room_full',
  ROOM_NOT_FOUND = 'room_not_found',
  TRACK_PUBLISH_FAILED = 'track_publish_failed',
  TRACK_UNPUBLISH_FAILED = 'track_unpublish_failed'
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTING = 'disconnecting'
}

export interface VoiceErrorEvent {
  error: VoiceError;
  message: string;
  originalError?: any;
  recoverable: boolean;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
}

export interface ParticipantInfo {
  identity: string;
  name?: string;
  metadata?: string;
  permissions?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
    hidden?: boolean;
    recorder?: boolean;
  };
}

export interface VoiceEvents {
  statusChanged: (status: ConnectionStatus) => void;
  error: (error: VoiceErrorEvent) => void;
  participantConnected: (participant: RemoteParticipant) => void;
  participantDisconnected: (participant: RemoteParticipant) => void;
  trackSubscribed: (track: RemoteTrack, participant: RemoteParticipant) => void;
  trackUnsubscribed: (track: RemoteTrack, participant: RemoteParticipant) => void;
  trackPublished: (track: LocalTrack, participant: LocalParticipant) => void;
  trackUnpublished: (track: LocalTrack, participant: LocalParticipant) => void;
  speakingChanged: (participant: Participant, speaking: boolean) => void;
  audioLevelChanged: (level: number, participant: Participant) => void;
  connectionQualityChanged: (quality: ConnectionQuality, participant: Participant) => void;
  dataReceived: (data: Uint8Array, participant?: RemoteParticipant) => void;
}

export interface ConnectionConfig {
  url: string;
  token: string;
  autoSubscribe?: boolean;
  publishDefaults?: {
    audioPreset?: any;
    videoPreset?: any;
    videoEncoding?: any;
    dtx?: boolean;
    red?: boolean;
    simulcast?: boolean;
  };
  adaptiveStream?: boolean;
  dynacast?: boolean;
  videoCaptureDefaults?: {
    resolution?: any;
    deviceId?: string;
  };
  audioCaptureDefaults?: {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
    deviceId?: string;
  };
}

export class ModernLiveKitClient {
  private room: Room | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private eventHandlers: Map<keyof VoiceEvents, Function[]> = new Map();
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 2000;
  private isDestroyed = false;
  private connectionConfig: ConnectionConfig | null = null;
  
  // Safety mechanisms
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
  private readonly HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    // Catch unhandled promise rejections from LiveKit
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('livekit') || 
          event.reason?.message?.includes('webrtc')) {
        console.warn('Caught LiveKit unhandled rejection:', event.reason);
        event.preventDefault();
        this.handleConnectionError(event.reason);
      }
    });

    // Catch global errors that might affect the voice connection
    window.addEventListener('error', (event) => {
      if (event.error?.stack?.includes('livekit') ||
          event.error?.stack?.includes('webrtc')) {
        console.warn('Caught LiveKit global error:', event.error);
        this.handleConnectionError(event.error);
      }
    });
  }

  public async connect(config: ConnectionConfig): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Client has been destroyed');
    }

    this.connectionConfig = config;
    this.updateStatus(ConnectionStatus.CONNECTING);
    this.startConnectionTimeout();

    try {
      // Create new room instance
      this.room = new Room({
        adaptiveStream: config.adaptiveStream ?? true,
        dynacast: config.dynacast ?? true,
        publishDefaults: {
          simulcast: config.publishDefaults?.simulcast ?? true,
          dtx: config.publishDefaults?.dtx ?? true,
        },
        videoCaptureDefaults: config.videoCaptureDefaults,
        audioCaptureDefaults: {
          echoCancellation: config.audioCaptureDefaults?.echoCancellation ?? true,
          noiseSuppression: config.audioCaptureDefaults?.noiseSuppression ?? true,
          autoGainControl: config.audioCaptureDefaults?.autoGainControl ?? true,
        },
      } as RoomOptions);

      this.setupRoomEventHandlers();

      // Connect to room
      await this.room.connect(config.url, config.token, {
        autoSubscribe: config.autoSubscribe ?? true,
      } as ConnectOptions);

      this.clearConnectionTimeout();
      this.updateStatus(ConnectionStatus.CONNECTED);
      this.retryCount = 0;
      this.startHealthCheck();

      console.log('Successfully connected to LiveKit room');

    } catch (error) {
      this.clearConnectionTimeout();
      this.handleConnectionError(error);
      throw error;
    }
  }

  private setupRoomEventHandlers(): void {
    if (!this.room) return;

    // Connection events
    this.room.on(RoomEvent.Connected, () => {
      console.log('LiveKit room connected');
      this.updateStatus(ConnectionStatus.CONNECTED);
    });

    this.room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      console.log('LiveKit room disconnected:', reason);
      this.updateStatus(ConnectionStatus.DISCONNECTED);
      this.handleDisconnection(reason);
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log('LiveKit room reconnecting');
      this.updateStatus(ConnectionStatus.RECONNECTING);
    });

    this.room.on(RoomEvent.Reconnected, () => {
      console.log('LiveKit room reconnected');
      this.updateStatus(ConnectionStatus.CONNECTED);
      this.retryCount = 0;
    });

    // Participant events
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      this.emit('participantConnected', participant);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('Participant disconnected:', participant.identity);
      this.emit('participantDisconnected', participant);
    });

    // Track events
    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
      console.log('Track subscribed:', track.kind, 'from', participant.identity);
      this.emit('trackSubscribed', track, participant);
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
      console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      this.emit('trackUnsubscribed', track, participant);
    });

    this.room.on(RoomEvent.LocalTrackPublished, (track: LocalTrack, participant: LocalParticipant) => {
      console.log('Local track published:', track.kind);
      this.emit('trackPublished', track, participant);
    });

    this.room.on(RoomEvent.LocalTrackUnpublished, (track: LocalTrack, participant: LocalParticipant) => {
      console.log('Local track unpublished:', track.kind);
      this.emit('trackUnpublished', track, participant);
    });

    // Audio level events
    this.room.on(RoomEvent.AudioLevelChanged, (level: number, participant: Participant) => {
      this.emit('audioLevelChanged', level, participant);
    });

    // Connection quality events
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant: Participant) => {
      this.emit('connectionQualityChanged', quality, participant);
    });

    // Data events
    this.room.on(RoomEvent.DataReceived, (data: Uint8Array, participant?: RemoteParticipant) => {
      this.emit('dataReceived', data, participant);
    });
  }

  private handleDisconnection(reason?: DisconnectReason): void {
    this.stopHealthCheck();
    
    // Auto-reconnect logic
    if (!this.isDestroyed && 
        this.connectionConfig && 
        this.retryCount < this.maxRetries && 
        reason !== DisconnectReason.CLIENT_INITIATED) {
      
      const delay = this.calculateRetryDelay();
      console.log(`Attempting reconnection in ${delay}ms (attempt ${this.retryCount + 1}/${this.maxRetries})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.attemptReconnection();
      }, delay);
    } else {
      this.emitError({
        error: VoiceError.CONNECTION_FAILED,
        message: `Connection lost: ${reason}`,
        recoverable: false,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
        timestamp: Date.now()
      });
    }
  }

  private async attemptReconnection(): Promise<void> {
    if (this.isDestroyed || !this.connectionConfig) return;

    this.retryCount++;
    
    try {
      await this.connect(this.connectionConfig);
      console.log('Reconnection successful');
    } catch (error) {
      console.error(`Reconnection attempt ${this.retryCount} failed:`, error);
      this.handleConnectionError(error);
    }
  }

  private calculateRetryDelay(): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, this.retryCount);
    const jitter = Math.random() * 1000; // 0-1000ms jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  public async publishAudioTrack(): Promise<LocalAudioTrack | null> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    try {
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: this.connectionConfig?.audioCaptureDefaults?.echoCancellation ?? true,
        noiseSuppression: this.connectionConfig?.audioCaptureDefaults?.noiseSuppression ?? true,
        autoGainControl: this.connectionConfig?.audioCaptureDefaults?.autoGainControl ?? true,
        deviceId: this.connectionConfig?.audioCaptureDefaults?.deviceId,
      });

      await this.room.localParticipant.publishTrack(audioTrack, {
        source: TrackSource.Microphone,
        dtx: this.connectionConfig?.publishDefaults?.dtx ?? true,
      });

      return audioTrack;
    } catch (error) {
      this.emitError({
        error: VoiceError.MICROPHONE_PERMISSION_DENIED,
        message: 'Failed to publish audio track',
        originalError: error,
        recoverable: true,
        retryCount: 0,
        maxRetries: 3,
        timestamp: Date.now()
      });
      return null;
    }
  }

  public async publishVideoTrack(): Promise<LocalVideoTrack | null> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    try {
      const videoTrack = await createLocalVideoTrack({
        resolution: this.connectionConfig?.videoCaptureDefaults?.resolution ?? VideoPresets.h720.resolution,
        deviceId: this.connectionConfig?.videoCaptureDefaults?.deviceId,
      });

      await this.room.localParticipant.publishTrack(videoTrack, {
        source: TrackSource.Camera,
        simulcast: this.connectionConfig?.publishDefaults?.simulcast ?? true,
        videoEncoding: this.connectionConfig?.publishDefaults?.videoEncoding,
      });

      return videoTrack;
    } catch (error) {
      this.emitError({
        error: VoiceError.CAMERA_PERMISSION_DENIED,
        message: 'Failed to publish video track',
        originalError: error,
        recoverable: true,
        retryCount: 0,
        maxRetries: 3,
        timestamp: Date.now()
      });
      return null;
    }
  }

  public async publishScreenShareTrack(): Promise<LocalTrack[] | null> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    try {
      const screenTracks = await createLocalScreenTracks({
        video: true,
        audio: true,
      });

      const publishPromises = screenTracks.map(track => 
        this.room!.localParticipant.publishTrack(track, {
          source: track.kind === 'video' ? TrackSource.ScreenShare : TrackSource.ScreenShareAudio,
        })
      );

      await Promise.all(publishPromises);
      return screenTracks;
    } catch (error) {
      this.emitError({
        error: VoiceError.SCREEN_SHARE_PERMISSION_DENIED,
        message: 'Failed to publish screen share track',
        originalError: error,
        recoverable: true,
        retryCount: 0,
        maxRetries: 3,
        timestamp: Date.now()
      });
      return null;
    }
  }

  public async unpublishTrack(track: LocalTrack): Promise<void> {
    if (!this.room) return;

    try {
      await this.room.localParticipant.unpublishTrack(track);
      track.stop();
    } catch (error) {
      console.error('Failed to unpublish track:', error);
      this.emitError({
        error: VoiceError.TRACK_UNPUBLISH_FAILED,
        message: 'Failed to unpublish track',
        originalError: error,
        recoverable: true,
        retryCount: 0,
        maxRetries: 3,
        timestamp: Date.now()
      });
    }
  }

  private startConnectionTimeout(): void {
    this.connectionTimeout = setTimeout(() => {
      if (this.status === ConnectionStatus.CONNECTING) {
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.CONNECTION_TIMEOUT);
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private performHealthCheck(): void {
    if (!this.room || this.status !== ConnectionStatus.CONNECTED) {
      return;
    }

    // Check connection state
    const connectionState = this.room.engine?.client?.pc?.connectionState;
    if (connectionState === 'failed' || connectionState === 'disconnected') {
      console.warn('Health check detected failed connection state');
      this.handleConnectionError(new Error('Connection health check failed'));
    }
  }

  private handleConnectionError(error: any): void {
    console.error('Connection error:', error);

    const voiceError: VoiceErrorEvent = {
      error: VoiceError.CONNECTION_FAILED,
      message: error.message || 'Connection failed',
      originalError: error,
      recoverable: this.retryCount < this.maxRetries,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      timestamp: Date.now()
    };

    this.emitError(voiceError);
    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }

  private updateStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('statusChanged', status);
    }
  }

  private emitError(error: VoiceErrorEvent): void {
    this.emit('error', error);
  }

  public getCurrentStatus(): ConnectionStatus {
    return this.status;
  }

  public getRoom(): Room | null {
    return this.room;
  }

  public isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED && this.room?.state === 'connected';
  }

  public async disconnect(): Promise<void> {
    this.updateStatus(ConnectionStatus.DISCONNECTING);
    this.stopHealthCheck();
    this.clearConnectionTimeout();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.room) {
      try {
        await this.room.disconnect();
      } catch (error) {
        console.error('Error during disconnect:', error);
      }
      this.room = null;
    }

    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }

  public on<T extends keyof VoiceEvents>(event: T, handler: VoiceEvents[T]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler as Function);
  }

  public off<T extends keyof VoiceEvents>(event: T, handler: VoiceEvents[T]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler as Function);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<T extends keyof VoiceEvents>(event: T, ...args: Parameters<VoiceEvents[T]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in voice event handler for ${event}:`, error);
        }
      });
    }
  }

  public async destroy(): Promise<void> {
    this.isDestroyed = true;
    await this.disconnect();
    this.eventHandlers.clear();
    console.log('ModernLiveKitClient destroyed');
  }
}