import { AccessToken, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';

export interface LiveKitConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

export interface RoomConfig {
  name: string;
  maxParticipants?: number;
  enableRecording?: boolean;
  emptyTimeout?: number;
  metadata?: string;
}

export interface ParticipantInfo {
  identity: string;
  name: string;
  metadata?: string;
  permissions?: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
    hidden?: boolean;
    recorder?: boolean;
  };
}

export class LiveKitService {
  private roomService: RoomServiceClient;
  private config: LiveKitConfig;

  constructor(config: LiveKitConfig) {
    this.config = config;
    // Convert WebSocket URL to HTTP for API client
    const apiUrl = config.url.replace('ws://', 'http://').replace('wss://', 'https://');
    console.log(`🔧 Initializing LiveKit service with URL: ${apiUrl}`);
    this.roomService = new RoomServiceClient(apiUrl, config.apiKey, config.apiSecret);
  }

  /**
   * Generate access token for participant to join room
   */
  generateAccessToken(roomName: string, participant: ParticipantInfo): string {
    try {
      console.log(`🎟️ Generating token for participant: ${participant.identity} in room: ${roomName}`);
      
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('LiveKit API key or secret not configured');
      }
      
      const token = new AccessToken(this.config.apiKey, this.config.apiSecret, {
        identity: participant.identity,
        name: participant.name,
        metadata: participant.metadata
      });

      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: participant.permissions?.canPublish !== false,
        canSubscribe: participant.permissions?.canSubscribe !== false,
        canPublishData: participant.permissions?.canPublishData !== false,
        hidden: participant.permissions?.hidden || false,
        recorder: participant.permissions?.recorder || false
      });

      const jwt = token.toJwt();
      console.log(`✅ Token generated successfully for ${participant.identity}`);
      return jwt;
    } catch (error) {
      console.error('Failed to generate access token:', error);
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  /**
   * Create a new room
   */
  async createRoom(config: RoomConfig) {
    try {
      console.log(`🏠 Creating LiveKit room: ${config.name}`);
      
      const room = await this.roomService.createRoom({
        name: config.name,
        maxParticipants: config.maxParticipants || 100,
        emptyTimeout: config.emptyTimeout || 300, // 5 minutes
        metadata: config.metadata || '',
        enableRecording: config.enableRecording || false
      });

      console.log(`✅ Created LiveKit room: ${config.name} with ${config.maxParticipants || 100} max participants`);
      return room;
    } catch (error) {
      console.error(`❌ Failed to create room ${config.name}:`, error);
      
      // If room already exists, try to get it instead
      if (error.message?.includes('already exists') || error.message?.includes('room exists')) {
        console.log(`🔄 Room ${config.name} already exists, getting existing room`);
        return await this.getRoom(config.name);
      }
      
      throw new Error(`Failed to create voice room: ${error.message}`);
    }
  }

  /**
   * List all rooms
   */
  async listRooms() {
    try {
      const response = await this.roomService.listRooms();
      return response;
    } catch (error) {
      console.error('Failed to list rooms:', error);
      return [];
    }
  }

  /**
   * Get room information
   */
  async getRoom(roomName: string) {
    try {
      console.log(`🔍 Getting room: ${roomName}`);
      const rooms = await this.roomService.listRooms([roomName]);
      const room = rooms[0] || null;
      
      if (room) {
        console.log(`✅ Found room: ${roomName} with ${room.numParticipants} participants`);
      } else {
        console.log(`❌ Room not found: ${roomName}`);
      }
      
      return room;
    } catch (error) {
      console.error(`❌ Failed to get room ${roomName}:`, error);
      return null;
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string) {
    try {
      await this.roomService.deleteRoom(roomName);
      console.log(`🗑️ Deleted LiveKit room: ${roomName}`);
    } catch (error) {
      console.error('Failed to delete room:', error);
      throw new Error('Failed to delete voice room');
    }
  }

  /**
   * List participants in a room
   */
  async listParticipants(roomName: string) {
    try {
      const participants = await this.roomService.listParticipants(roomName);
      return participants;
    } catch (error) {
      console.error('Failed to list participants:', error);
      return [];
    }
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(roomName: string, identity: string) {
    try {
      await this.roomService.removeParticipant(roomName, identity);
      console.log(`👋 Removed participant ${identity} from room ${roomName}`);
    } catch (error) {
      console.error('Failed to remove participant:', error);
      throw new Error('Failed to remove participant');
    }
  }

  /**
   * Mute participant's track
   */
  async muteParticipantTrack(roomName: string, identity: string, trackSid: string, muted: boolean) {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
      console.log(`🔇 ${muted ? 'Muted' : 'Unmuted'} track ${trackSid} for ${identity}`);
    } catch (error) {
      console.error('Failed to mute track:', error);
      throw new Error('Failed to mute/unmute track');
    }
  }

  /**
   * Send data message to room
   */
  async sendData(roomName: string, data: string, destinationSids?: string[]) {
    try {
      await this.roomService.sendData(roomName, Buffer.from(data), {
        destinationSids: destinationSids || []
      });
    } catch (error) {
      console.error('Failed to send data:', error);
      throw new Error('Failed to send data message');
    }
  }

  /**
   * Update room metadata
   */
  async updateRoomMetadata(roomName: string, metadata: string) {
    try {
      await this.roomService.updateRoomMetadata(roomName, metadata);
      console.log(`📝 Updated metadata for room ${roomName}`);
    } catch (error) {
      console.error('Failed to update room metadata:', error);
      throw new Error('Failed to update room metadata');
    }
  }

  /**
   * Verify webhook signature (for webhook endpoints)
   */
  verifyWebhook(body: string, headerValue: string): any {
    try {
      const receiver = new WebhookReceiver(this.config.apiKey, this.config.apiSecret);
      return receiver.receive(body, headerValue);
    } catch (error) {
      console.error('Webhook verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get connection statistics
   */
  async getRoomStats(roomName: string) {
    try {
      const room = await this.getRoom(roomName);
      const participants = await this.listParticipants(roomName);

      return {
        roomName,
        numParticipants: room?.numParticipants || 0,
        creationTime: room?.creationTime || null,
        metadata: room?.metadata || '',
        participants: participants.length,
        isActive: room?.numParticipants > 0
      };
    } catch (error) {
      console.error('Failed to get room stats:', error);
      return null;
    }
  }
}