import { 
  CrashSafeLiveKitClient, 
  ConnectionConfig, 
  ConnectionStatus, 
  VoiceError, 
  VoiceErrorEvent, 
  ParticipantInfo,
  VoiceEvents
} from './crash-safe-livekit';

export interface VoiceConnectionState {
  channelId: string | null;
  status: ConnectionStatus;
  participants: Map<string, ParticipantInfo>;
  localMuted: boolean;
  localDeafened: boolean;
  localVideoEnabled: boolean;
  localScreenSharing: boolean;
  error: VoiceErrorEvent | null;
  connectionAttempts: number;
  lastConnectedAt: number | null;
  bandwidthKbps: number;
  latencyMs: number;
  packetLoss: number;
}

export interface VoiceManagerEvents {
  stateChanged: (state: VoiceConnectionState) => void;
  error: (error: VoiceErrorEvent) => void;
  participantJoined: (participant: ParticipantInfo) => void;
  participantLeft: (participant: ParticipantInfo) => void;
  participantUpdated: (participant: ParticipantInfo) => void;
  speakingChanged: (participantSid: string, isSpeaking: boolean) => void;
  audioLevelChanged: (participantSid: string, level: number) => void;
  reconnecting: () => void;
  reconnected: () => void;
}

export interface ConnectionOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableAudio?: boolean;
  enableVideo?: boolean;
  enableScreenShare?: boolean;
  audioConstraints?: MediaTrackConstraints;
  videoConstraints?: MediaTrackConstraints;
  fallbackUrls?: string[];
}

export class VoiceConnectionManager {
  private client: CrashSafeLiveKitClient;
  private state: VoiceConnectionState;
  private eventHandlers: Map<keyof VoiceManagerEvents, Function[]> = new Map();
  private cleanupFunctions: Function[] = [];
  private stateUpdateTimer: NodeJS.Timeout | null = null;
  private connectionHealthTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  private apiBaseUrl: string;
  private authToken: string | null = null;
  private userId: string | null = null;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.client = new CrashSafeLiveKitClient();
    
    this.state = {
      channelId: null,
      status: ConnectionStatus.DISCONNECTED,
      participants: new Map(),
      localMuted: false,
      localDeafened: false,
      localVideoEnabled: false,
      localScreenSharing: false,
      error: null,
      connectionAttempts: 0,
      lastConnectedAt: null,
      bandwidthKbps: 0,
      latencyMs: 0,
      packetLoss: 0
    };

    this.setupClientEventHandlers();
    this.startStateMonitoring();
  }

  private setupClientEventHandlers(): void {
    // Forward client events
    this.client.on('statusChanged', (status) => {
      this.updateState({ status });
      
      if (status === ConnectionStatus.CONNECTED) {
        this.updateState({ 
          lastConnectedAt: Date.now(),
          error: null
        });
      }
    });

    this.client.on('error', (error) => {
      this.updateState({ error });
      this.emit('error', error);
      
      // Handle specific error cases
      this.handleVoiceError(error);
    });

    this.client.on('participantJoined', (participant) => {
      this.state.participants.set(participant.sid, participant);
      this.emitStateChange();
      this.emit('participantJoined', participant);
    });

    this.client.on('participantLeft', (participant) => {
      this.state.participants.delete(participant.sid);
      this.emitStateChange();
      this.emit('participantLeft', participant);
    });

    this.client.on('participantUpdated', (participant) => {
      this.state.participants.set(participant.sid, participant);
      this.emitStateChange();
      this.emit('participantUpdated', participant);
    });

    this.client.on('speakingChanged', (participantSid, isSpeaking) => {
      const participant = this.state.participants.get(participantSid);
      if (participant) {
        participant.isSpeaking = isSpeaking;
        this.state.participants.set(participantSid, participant);
        this.emitStateChange();
      }
      this.emit('speakingChanged', participantSid, isSpeaking);
    });

    this.client.on('audioLevelChanged', (participantSid, level) => {
      const participant = this.state.participants.get(participantSid);
      if (participant) {
        participant.audioLevel = level;
        this.state.participants.set(participantSid, participant);
      }
      this.emit('audioLevelChanged', participantSid, level);
    });

    this.client.on('reconnecting', () => {
      this.emit('reconnecting');
    });

    this.client.on('reconnected', () => {
      // Refresh participant list after reconnection
      this.refreshParticipants();
      this.emit('reconnected');
    });
  }

  private startStateMonitoring(): void {
    // Update connection statistics periodically
    this.stateUpdateTimer = setInterval(() => {
      if (this.state.status === ConnectionStatus.CONNECTED) {
        this.updateConnectionStats();
      }
    }, 1000);

    // Monitor connection health
    this.connectionHealthTimer = setInterval(() => {
      if (this.state.status === ConnectionStatus.CONNECTED) {
        this.checkConnectionHealth();
      }
    }, 5000);

    this.cleanupFunctions.push(() => {
      if (this.stateUpdateTimer) {
        clearInterval(this.stateUpdateTimer);
        this.stateUpdateTimer = null;
      }
      if (this.connectionHealthTimer) {
        clearInterval(this.connectionHealthTimer);
        this.connectionHealthTimer = null;
      }
    });
  }

  private async updateConnectionStats(): Promise<void> {
    try {
      // In a real implementation, you would get these stats from the LiveKit client
      // For now, we'll simulate realistic values
      const participants = this.client.getParticipants();
      
      this.updateState({
        bandwidthKbps: Math.random() * 100 + 50, // Simulate 50-150 kbps
        latencyMs: Math.random() * 50 + 20, // Simulate 20-70ms
        packetLoss: Math.random() * 2 // Simulate 0-2% packet loss
      });
      
      // Update participants from client
      this.state.participants.clear();
      participants.forEach(participant => {
        this.state.participants.set(participant.sid, participant);
      });
      
      this.emitStateChange();
    } catch (error) {
      console.error('Failed to update connection stats:', error);
    }
  }

  private async checkConnectionHealth(): Promise<void> {
    try {
      // Check if we've been connected for a while without issues
      if (this.state.lastConnectedAt && 
          Date.now() - this.state.lastConnectedAt > 30000 && // 30 seconds
          this.state.packetLoss > 5) { // High packet loss
        
        console.warn('Connection health degraded, considering reconnection');
        // Could trigger a proactive reconnection here
      }
    } catch (error) {
      console.error('Connection health check failed:', error);
    }
  }

  private refreshParticipants(): void {
    try {
      const participants = this.client.getParticipants();
      this.state.participants.clear();
      participants.forEach(participant => {
        this.state.participants.set(participant.sid, participant);
      });
      this.emitStateChange();
    } catch (error) {
      console.error('Failed to refresh participants:', error);
    }
  }

  private handleVoiceError(error: VoiceErrorEvent): void {
    switch (error.error) {
      case VoiceError.MICROPHONE_PERMISSION_DENIED:
      case VoiceError.CAMERA_PERMISSION_DENIED:
      case VoiceError.SCREEN_SHARE_PERMISSION_DENIED:
        // These are user-recoverable errors, show appropriate UI
        break;
        
      case VoiceError.SERVER_UNREACHABLE:
        // Try fallback servers if available
        this.tryFallbackConnection();
        break;
        
      case VoiceError.AUTHENTICATION_FAILED:
        // Refresh token and retry
        this.refreshTokenAndRetry();
        break;
        
      default:
        // Log unexpected errors
        console.error('Unhandled voice error:', error);
    }
  }

  private async tryFallbackConnection(): Promise<void> {
    // Implementation would try alternative LiveKit server URLs
    console.log('Attempting fallback connection...');
  }

  private async refreshTokenAndRetry(): Promise<void> {
    if (!this.state.channelId || !this.userId) {
      return;
    }

    try {
      const token = await this.getVoiceToken(this.state.channelId);
      if (token && this.state.channelId) {
        await this.connectToChannel(this.state.channelId, { forceReauth: true });
      }
    } catch (error) {
      console.error('Failed to refresh token and retry:', error);
    }
  }

  public setAuth(token: string, userId: string): void {
    this.authToken = token;
    this.userId = userId;
  }

  public async connectToChannel(
    channelId: string, 
    options: ConnectionOptions & { forceReauth?: boolean } = {}
  ): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('VoiceConnectionManager has been destroyed');
    }

    // Disconnect from current channel if different
    if (this.state.channelId && this.state.channelId !== channelId) {
      await this.disconnect();
    }

    try {
      this.updateState({ 
        channelId, 
        connectionAttempts: this.state.connectionAttempts + 1,
        error: null
      });

      // Get voice token from API
      const voiceData = await this.getVoiceToken(channelId);
      if (!voiceData) {
        throw new Error('Failed to get voice token');
      }

      // Configure connection
      const config: ConnectionConfig = {
        url: voiceData.liveKitUrl,
        token: voiceData.liveKitToken,
        channelId,
        userId: this.userId!,
        maxRetries: options.maxRetries || 5,
        baseRetryDelay: options.retryDelay || 1000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        adaptiveStream: true,
        simulcast: true
      };

      // Connect to voice channel
      await this.client.connect(config);

      // Enable media based on options
      if (options.enableAudio !== false) {
        await this.enableMicrophone();
      }

      if (options.enableVideo) {
        await this.enableCamera();
      }

    } catch (error) {
      const voiceError: VoiceErrorEvent = {
        error: VoiceError.CONNECTION_FAILED,
        message: (error as Error).message,
        originalError: error as Error,
        recoverable: true,
        retryCount: this.state.connectionAttempts,
        maxRetries: options.maxRetries || 5
      };
      
      this.updateState({ error: voiceError });
      throw error;
    }
  }

  private async getVoiceToken(channelId: string): Promise<{liveKitUrl: string, liveKitToken: string} | null> {
    if (!this.authToken) {
      throw new Error('No auth token provided');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/voice/channels/${channelId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mute: this.state.localMuted,
          deaf: this.state.localDeafened
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        liveKitUrl: data.data.liveKitUrl,
        liveKitToken: data.data.liveKitToken
      };
    } catch (error) {
      console.error('Failed to get voice token:', error);
      return null;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.state.channelId && this.authToken) {
      // Notify API of disconnection
      try {
        await fetch(`${this.apiBaseUrl}/api/voice/channels/${this.state.channelId}/leave`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Failed to notify API of disconnection:', error);
      }
    }

    await this.client.disconnect();
    
    this.updateState({
      channelId: null,
      status: ConnectionStatus.DISCONNECTED,
      localVideoEnabled: false,
      localScreenSharing: false,
      error: null
    });
    
    this.state.participants.clear();
    this.emitStateChange();
  }

  public async toggleMute(): Promise<void> {
    try {
      if (this.state.localMuted) {
        await this.client.enableMicrophone();
        this.updateState({ localMuted: false });
      } else {
        await this.client.disableMicrophone();
        this.updateState({ localMuted: true });
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      throw error;
    }
  }

  public async toggleDeafen(): Promise<void> {
    const newDeafened = !this.state.localDeafened;
    this.updateState({ 
      localDeafened: newDeafened,
      // Auto-mute when deafening
      localMuted: newDeafened ? true : this.state.localMuted
    });
    
    if (newDeafened && !this.state.localMuted) {
      await this.client.disableMicrophone();
    }
  }

  public async enableMicrophone(): Promise<void> {
    if (this.state.localDeafened) {
      return; // Can't unmute while deafened
    }
    
    try {
      await this.client.enableMicrophone();
      this.updateState({ localMuted: false });
    } catch (error) {
      console.error('Failed to enable microphone:', error);
      throw error;
    }
  }

  public async disableMicrophone(): Promise<void> {
    try {
      await this.client.disableMicrophone();
      this.updateState({ localMuted: true });
    } catch (error) {
      console.error('Failed to disable microphone:', error);
      throw error;
    }
  }

  public async enableCamera(): Promise<void> {
    try {
      await this.client.enableCamera();
      this.updateState({ localVideoEnabled: true });
    } catch (error) {
      console.error('Failed to enable camera:', error);
      throw error;
    }
  }

  public async disableCamera(): Promise<void> {
    try {
      await this.client.disableCamera();
      this.updateState({ localVideoEnabled: false });
    } catch (error) {
      console.error('Failed to disable camera:', error);
      throw error;
    }
  }

  public async startScreenShare(): Promise<void> {
    try {
      await this.client.startScreenShare();
      this.updateState({ localScreenSharing: true });
    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }

  public async stopScreenShare(): Promise<void> {
    try {
      await this.client.stopScreenShare();
      this.updateState({ localScreenSharing: false });
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      throw error;
    }
  }

  public getState(): VoiceConnectionState {
    return { 
      ...this.state,
      participants: new Map(this.state.participants)
    };
  }

  public getParticipants(): ParticipantInfo[] {
    return Array.from(this.state.participants.values());
  }

  public isConnected(): boolean {
    return this.state.status === ConnectionStatus.CONNECTED;
  }

  public getCurrentChannel(): string | null {
    return this.state.channelId;
  }

  private updateState(updates: Partial<VoiceConnectionState>): void {
    const oldState = { ...this.state };
    Object.assign(this.state, updates);
    
    // Only emit if something meaningful changed
    if (JSON.stringify(oldState) !== JSON.stringify(this.state)) {
      this.emitStateChange();
    }
  }

  private emitStateChange(): void {
    this.emit('stateChanged', this.getState());
  }

  public on<K extends keyof VoiceManagerEvents>(event: K, handler: VoiceManagerEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off<K extends keyof VoiceManagerEvents>(event: K, handler: VoiceManagerEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof VoiceManagerEvents>(event: K, ...args: Parameters<VoiceManagerEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in voice manager event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    
    // Clean up timers and resources
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions.length = 0;
    
    // Disconnect and destroy client
    this.client.destroy();
    
    // Clear event handlers
    this.eventHandlers.clear();
  }
}