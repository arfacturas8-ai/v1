import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant, LocalParticipant, RoomOptions, RoomConnectOptions } from 'livekit-client';

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

export interface SimpleVoiceParticipant {
  sid: string;
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  audioLevel: number;
}

export interface VoiceManagerEvents {
  statusChanged: (status: ConnectionStatus) => void;
  error: (error: Error) => void;
  participantJoined: (participant: SimpleVoiceParticipant) => void;
  participantLeft: (participant: SimpleVoiceParticipant) => void;
  participantUpdated: (participant: SimpleVoiceParticipant) => void;
  speakingChanged: (participantSid: string, isSpeaking: boolean) => void;
}

export class SimpleVoiceManager {
  private room: Room | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private eventHandlers: Map<keyof VoiceManagerEvents, Function[]> = new Map();
  private apiBaseUrl: string;
  private authToken: string | null = null;
  private userId: string | null = null;
  private isDestroyed = false;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  public setAuth(token: string, userId: string): void {
    this.authToken = token;
    this.userId = userId;
  }

  public async connect(channelId: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Voice manager has been destroyed');
    }

    try {
      this.setStatus(ConnectionStatus.CONNECTING);

      // Get voice token from API
      const voiceData = await this.getVoiceToken(channelId);
      if (!voiceData) {
        throw new Error('Failed to get voice token');
      }

      // Create room with simple settings
      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          audioEncoding: {
            maxBitrate: 64000,
            priority: 'high',
          }
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      };

      this.room = new Room(roomOptions);
      this.setupRoomEventHandlers();

      // Connect to room
      const connectOptions: RoomConnectOptions = {
        autoSubscribe: true
      };

      await this.room.connect(voiceData.liveKitUrl, voiceData.liveKitToken, connectOptions);
      this.setStatus(ConnectionStatus.CONNECTED);

    } catch (error) {
      this.setStatus(ConnectionStatus.FAILED);
      this.emit('error', error as Error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.room) {
      try {
        await this.room.disconnect();
      } catch (error) {
        console.error('Error disconnecting room:', error);
      }
      this.room = null;
    }
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  public async enableMicrophone(): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    try {
      const track = await this.room.localParticipant.createAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      await this.room.localParticipant.publishTrack(track);
    } catch (error) {
      console.error('Failed to enable microphone:', error);
      throw error;
    }
  }

  public async disableMicrophone(): Promise<void> {
    if (!this.room) return;

    try {
      const publication = this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (publication) {
        await this.room.localParticipant.unpublishTrack(publication.track);
      }
    } catch (error) {
      console.error('Failed to disable microphone:', error);
    }
  }

  public async toggleMute(): Promise<void> {
    if (!this.room) return;

    const publication = this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (publication) {
      await this.disableMicrophone();
    } else {
      await this.enableMicrophone();
    }
  }

  public isMuted(): boolean {
    if (!this.room) return true;
    const publication = this.room.localParticipant.getTrackPublication(Track.Source.Microphone);
    return !publication || publication.isMuted;
  }

  public getParticipants(): SimpleVoiceParticipant[] {
    if (!this.room) return [];

    const participants: SimpleVoiceParticipant[] = [];

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

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  private async getVoiceToken(channelId: string): Promise<{liveKitUrl: string, liveKitToken: string} | null> {
    if (!this.authToken) {
      throw new Error('No auth token provided');
    }

    try {
      // For testing, use the test endpoint that doesn't require auth
      const response = await fetch(`${this.apiBaseUrl}/api/voice-test/test-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId,
          userId: this.userId,
          username: `User_${this.userId}`
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

  private setupRoomEventHandlers(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      this.emit('participantJoined', this.mapParticipant(participant));
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      this.emit('participantLeft', this.mapParticipant(participant));
    });

    this.room.on(RoomEvent.IsSpeakingChanged, (participant: LocalParticipant | RemoteParticipant) => {
      this.emit('speakingChanged', participant.sid, participant.isSpeaking);
      this.emit('participantUpdated', this.mapParticipant(participant));
    });

    this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
      switch (state) {
        case 'connecting':
        case 'reconnecting':
          this.setStatus(ConnectionStatus.RECONNECTING);
          break;
        case 'connected':
          this.setStatus(ConnectionStatus.CONNECTED);
          break;
        case 'disconnected':
          this.setStatus(ConnectionStatus.DISCONNECTED);
          break;
      }
    });

    this.room.on(RoomEvent.Disconnected, (reason?: string) => {
      this.setStatus(ConnectionStatus.DISCONNECTED);
      if (reason) {
        this.emit('error', new Error(`Disconnected: ${reason}`));
      }
    });
  }

  private mapParticipant(participant: RemoteParticipant | LocalParticipant): SimpleVoiceParticipant {
    return {
      sid: participant.sid,
      identity: participant.identity,
      name: participant.name || participant.identity,
      isSpeaking: participant.isSpeaking,
      isMuted: participant.isMuted,
      isVideoEnabled: participant.isVideoEnabled,
      audioLevel: participant.audioLevel || 0,
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('statusChanged', status);
    }
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
    this.disconnect();
    this.eventHandlers.clear();
  }
}