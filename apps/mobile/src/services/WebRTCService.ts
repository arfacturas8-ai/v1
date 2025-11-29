/**
 * WebRTC Service for CRYB Mobile
 * Real-time voice and video communication using LiveKit
 */

import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  LocalParticipant,
  TrackPublication,
  ConnectionState,
  ConnectionQuality,
  AudioTrack,
  VideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
} from '@livekit/react-native';
import { registerGlobals } from '@livekit/react-native-webrtc';
import { apiService } from './ApiService';
import { EventEmitter } from 'eventemitter3';
import { Platform } from 'react-native';
import { callKitService } from './CallKitService';
import { CrashDetector } from '../utils/CrashDetector';

// Register WebRTC globals
registerGlobals();

export interface VoiceChannelInfo {
  id: string;
  name: string;
  serverId?: string;
  maxParticipants: number;
}

export interface ParticipantInfo {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  connectionQuality: ConnectionQuality;
  audioLevel: number;
  isConnected: boolean;
}

class WebRTCService extends EventEmitter {
  private static instance: WebRTCService;
  private room: Room | null = null;
  private localParticipant: LocalParticipant | null = null;
  private participants: Map<string, RemoteParticipant> = new Map();
  private currentChannel: VoiceChannelInfo | null = null;
  
  // Connection settings
  private serverUrl: string;
  private connectionState: ConnectionState = ConnectionState.Disconnected;
  private localAudioTrack: LocalAudioTrack | null = null;
  private localVideoTrack: LocalVideoTrack | null = null;
  
  // Audio settings
  private isMuted: boolean = false;
  private isDeafened: boolean = false;
  private volume: number = 1.0;
  
  // Quality metrics
  private lastQualityUpdate: Map<string, ConnectionQuality> = new Map();
  private audioLevels: Map<string, number> = new Map();

  private constructor() {
    super();
    // Use production URL if available, otherwise localhost
    this.serverUrl = __DEV__ 
      ? Platform.OS === 'android' 
        ? 'ws://10.0.2.2:7880' 
        : 'ws://localhost:7880'
      : 'wss://voice.cryb.ai';
  }

  static getInstance(): WebRTCService {
    if (!WebRTCService.instance) {
      WebRTCService.instance = new WebRTCService();
    }
    return WebRTCService.instance;
  }

  // Connect to voice channel
  async connectToChannel(channel: VoiceChannelInfo): Promise<void> {
    try {
      if (this.room && this.connectionState === ConnectionState.Connected) {
        await this.disconnect();
      }

      this.currentChannel = channel;
      this.emit('connecting', channel);

      // Get access token from API
      const accessToken = await apiService.voice.getAccessToken(channel.id);

      // Create room
      this.room = new Room();
      this.setupRoomEventHandlers();

      // Connect to LiveKit server
      await this.room.connect(this.serverUrl, accessToken, {
        autoSubscribe: true,
        publishDefaults: {
          videoCodec: 'h264',
          simulcast: true,
          audioBitrate: 32_000,
        },
      });

      this.localParticipant = this.room.localParticipant;
      
      // Create and publish audio track
      await this.enableAudio();

      this.emit('connected', {
        channel,
        localParticipant: this.serializeLocalParticipant(),
      });

    } catch (error) {
      console.error('Failed to connect to voice channel:', error);
      this.emit('error', error);
      throw error;
    }
  }

  // Setup room event handlers
  private setupRoomEventHandlers(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('Connected to room');
      this.connectionState = ConnectionState.Connected;
      this.emit('connectionStateChanged', ConnectionState.Connected);
    });

    this.room.on(RoomEvent.Disconnected, (reason?: string) => {
      console.log('Disconnected from room:', reason);
      this.connectionState = ConnectionState.Disconnected;
      this.emit('connectionStateChanged', ConnectionState.Disconnected);
      this.emit('disconnected', reason);
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('Participant connected:', participant.identity);
      this.participants.set(participant.sid, participant);
      this.emit('participantConnected', this.serializeParticipant(participant));
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('Participant disconnected:', participant.identity);
      this.participants.delete(participant.sid);
      this.emit('participantDisconnected', participant.sid);
    });

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers: RemoteParticipant[]) => {
      const speakerIds = speakers.map(s => s.sid);
      this.emit('activeSpeakersChanged', speakerIds);
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant?: RemoteParticipant) => {
      if (participant) {
        this.lastQualityUpdate.set(participant.sid, quality);
        this.emit('connectionQualityChanged', {
          participantId: participant.sid,
          quality,
        });
      } else if (this.localParticipant) {
        this.lastQualityUpdate.set(this.localParticipant.sid, quality);
        this.emit('connectionQualityChanged', {
          participantId: this.localParticipant.sid,
          quality,
          isLocal: true,
        });
      }
    });

    this.room.on(RoomEvent.AudioLevelChanged, (level: number, track: AudioTrack, participant?: RemoteParticipant) => {
      const participantId = participant?.sid || this.localParticipant?.sid;
      if (participantId) {
        this.audioLevels.set(participantId, level);
        this.emit('audioLevelChanged', {
          participantId,
          level,
        });
      }
    });

    this.room.on(RoomEvent.TrackMuted, (publication: TrackPublication, participant: RemoteParticipant) => {
      this.emit('trackMuted', {
        participantId: participant.sid,
        trackKind: publication.kind,
      });
    });

    this.room.on(RoomEvent.TrackUnmuted, (publication: TrackPublication, participant: RemoteParticipant) => {
      this.emit('trackUnmuted', {
        participantId: participant.sid,
        trackKind: publication.kind,
      });
    });
  }

  // Audio controls
  async enableAudio(): Promise<void> {
    if (!this.room || !this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    if (!this.localAudioTrack) {
      this.localAudioTrack = await this.room.localParticipant.setMicrophoneEnabled(true);
    }

    this.isMuted = false;
    this.emit('audioStateChanged', { enabled: true, muted: false });
  }

  async disableAudio(): Promise<void> {
    if (!this.room || !this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    await this.room.localParticipant.setMicrophoneEnabled(false);
    this.localAudioTrack = null;
    this.isMuted = true;
    this.emit('audioStateChanged', { enabled: false, muted: true });
  }

  async toggleMute(): Promise<void> {
    if (this.isMuted) {
      await this.enableAudio();
    } else {
      await this.disableAudio();
    }
  }

  async setDeafened(deafened: boolean): Promise<void> {
    this.isDeafened = deafened;
    
    // Mute all remote audio tracks when deafened
    if (this.room) {
      this.room.remoteParticipants.forEach(participant => {
        participant.audioTrackPublications.forEach(publication => {
          if (publication.track) {
            publication.track.setEnabled(!deafened);
          }
        });
      });
    }

    // Auto-mute microphone when deafened
    if (deafened && !this.isMuted) {
      await this.disableAudio();
    }

    this.emit('deafenStateChanged', deafened);
  }

  // Video controls
  async enableVideo(): Promise<void> {
    if (!this.room || !this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    if (!this.localVideoTrack) {
      this.localVideoTrack = await this.room.localParticipant.setCameraEnabled(true);
    }

    this.emit('videoStateChanged', { enabled: true });
  }

  async disableVideo(): Promise<void> {
    if (!this.room || !this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    await this.room.localParticipant.setCameraEnabled(false);
    this.localVideoTrack = null;
    this.emit('videoStateChanged', { enabled: false });
  }

  async toggleVideo(): Promise<void> {
    if (this.localVideoTrack) {
      await this.disableVideo();
    } else {
      await this.enableVideo();
    }
  }

  // Screen sharing
  async startScreenShare(): Promise<void> {
    if (!this.room || !this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    await this.room.localParticipant.setScreenShareEnabled(true);
    this.emit('screenShareStateChanged', { enabled: true });
  }

  async stopScreenShare(): Promise<void> {
    if (!this.room || !this.localParticipant) {
      throw new Error('Not connected to a room');
    }

    await this.room.localParticipant.setScreenShareEnabled(false);
    this.emit('screenShareStateChanged', { enabled: false });
  }

  // Disconnect from channel
  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }

    this.localParticipant = null;
    this.participants.clear();
    this.currentChannel = null;
    this.connectionState = ConnectionState.Disconnected;
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.isMuted = false;
    this.isDeafened = false;

    this.emit('disconnected', 'User initiated disconnect');
  }

  // Get current participants
  getParticipants(): ParticipantInfo[] {
    const participants: ParticipantInfo[] = [];

    // Add local participant
    if (this.localParticipant) {
      participants.push(this.serializeLocalParticipant());
    }

    // Add remote participants
    this.participants.forEach(participant => {
      participants.push(this.serializeParticipant(participant));
    });

    return participants;
  }

  // Serialize participant data
  private serializeParticipant(participant: RemoteParticipant): ParticipantInfo {
    const audioLevel = this.audioLevels.get(participant.sid) || 0;
    const quality = this.lastQualityUpdate.get(participant.sid) || ConnectionQuality.Unknown;
    const audioTrack = participant.getTrackPublication(Track.Source.Microphone);

    return {
      id: participant.sid,
      username: participant.identity,
      displayName: participant.name || participant.identity,
      avatar: participant.metadata ? JSON.parse(participant.metadata).avatar : undefined,
      isMuted: audioTrack?.isMuted || false,
      isDeafened: false, // Remote participants can't be deafened locally
      isSpeaking: audioLevel > 0.1,
      connectionQuality: quality,
      audioLevel,
      isConnected: true,
    };
  }

  private serializeLocalParticipant(): ParticipantInfo {
    if (!this.localParticipant) {
      throw new Error('Local participant not available');
    }

    const audioLevel = this.audioLevels.get(this.localParticipant.sid) || 0;
    const quality = this.lastQualityUpdate.get(this.localParticipant.sid) || ConnectionQuality.Unknown;

    return {
      id: this.localParticipant.sid,
      username: this.localParticipant.identity,
      displayName: this.localParticipant.name || this.localParticipant.identity,
      avatar: this.localParticipant.metadata ? JSON.parse(this.localParticipant.metadata).avatar : undefined,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
      isSpeaking: audioLevel > 0.1,
      connectionQuality: quality,
      audioLevel,
      isConnected: true,
    };
  }

  // Getters
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getCurrentChannel(): VoiceChannelInfo | null {
    return this.currentChannel;
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.Connected;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  getIsDeafened(): boolean {
    return this.isDeafened;
  }

  // Volume control
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Apply volume to all remote audio tracks
    if (this.room) {
      this.room.remoteParticipants.forEach(participant => {
        participant.audioTrackPublications.forEach(publication => {
          if (publication.track && publication.track instanceof AudioTrack) {
            // Note: Volume control implementation may vary based on platform
            // This is a placeholder for the actual volume control
          }
        });
      });
    }

    this.emit('volumeChanged', this.volume);
  }

  getVolume(): number {
    return this.volume;
  }
}

export default WebRTCService.getInstance();