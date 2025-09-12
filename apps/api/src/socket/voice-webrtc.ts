import { Server, Socket } from 'socket.io';
import { LiveKitService, ParticipantInfo } from '../services/livekit';
import { VoiceQualityService, VoiceAnalytics } from '../services/voice-quality';
import { ScreenSharingService } from '../services/screen-sharing';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

export interface WebRTCSocket extends Socket {
  userId?: string;
  username?: string;
  displayName?: string;
  isAuthenticated?: boolean;
  currentVoiceChannel?: string;
  liveKitRoom?: string;
  voiceCapabilities?: {
    audio: boolean;
    video: boolean;
    screenShare: boolean;
  };
}

export interface VoiceConnection {
  userId: string;
  channelId: string;
  serverId?: string;
  sessionId: string;
  liveKitToken?: string;
  roomName?: string;
  
  // WebRTC state
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  
  // Voice state
  muted: boolean;
  deafened: boolean;
  selfMute: boolean;
  selfDeaf: boolean;
  speaking: boolean;
  
  // Connection quality
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  lastPing?: number;
  quality?: {
    jitter: number;
    packetLoss: number;
    rtt: number;
    audioLevel: number;
  };
  
  joinedAt: Date;
  updatedAt: Date;
}

export interface ScreenShareRequest {
  participantId: string;
  trackSid?: string;
  enabled: boolean;
  source?: 'screen' | 'window' | 'tab';
  metadata?: any;
}

export class VoiceWebRTCHandler {
  private io: Server;
  private redis: Redis;
  private liveKitService: LiveKitService;
  private qualityService: VoiceQualityService;
  private screenSharingService: ScreenSharingService;
  private connections: Map<string, VoiceConnection> = new Map();
  private roomParticipants: Map<string, Set<string>> = new Map();
  
  constructor(io: Server, redis: Redis, liveKitService: LiveKitService) {
    this.io = io;
    this.redis = redis;
    this.liveKitService = liveKitService;
    this.qualityService = new VoiceQualityService(io, redis);
    this.screenSharingService = new ScreenSharingService(io, redis, liveKitService);
    this.setupVoiceHandlers();
    this.setupConnectionCleanup();
  }

  private setupVoiceHandlers() {
    this.io.on('connection', (socket: WebRTCSocket) => {
      if (!socket.isAuthenticated) return;

      this.handleVoiceChannelEvents(socket);
      this.handleWebRTCSignaling(socket);
      this.handleVoiceStateUpdates(socket);
      this.handleScreenSharing(socket);
      this.handleConnectionQuality(socket);
      this.handleVoiceQualitySettings(socket);
      this.handleParticipantManagement(socket);
      this.handleDisconnection(socket);
    });
  }

  private handleVoiceChannelEvents(socket: WebRTCSocket) {
    // Enhanced voice channel join with WebRTC support
    socket.on('voice:join_channel', async (data: {
      channelId: string;
      capabilities?: {
        audio?: boolean;
        video?: boolean;
        screenShare?: boolean;
      };
      audioSettings?: {
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
        autoGainControl?: boolean;
      };
    }) => {
      try {
        const { channelId, capabilities, audioSettings } = data;
        
        // Validate channel access
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { server: true }
        });

        if (!channel || !['VOICE', 'STAGE'].includes(channel.type)) {
          return socket.emit('voice:error', {
            code: 'INVALID_CHANNEL',
            message: 'Channel is not a voice channel'
          });
        }

        // Check permissions
        if (channel.serverId) {
          const member = await prisma.serverMember.findUnique({
            where: {
              serverId_userId: {
                serverId: channel.serverId,
                userId: socket.userId!
              }
            },
            include: { roles: { include: { role: true } } }
          });

          if (!member) {
            return socket.emit('voice:error', {
              code: 'FORBIDDEN',
              message: 'Not a member of this server'
            });
          }

          const canConnect = member.roles.some(mr => 
            mr.role.permissions & BigInt(0x100000) // CONNECT permission
          );

          if (!canConnect) {
            return socket.emit('voice:error', {
              code: 'FORBIDDEN',
              message: 'No permission to connect to voice channels'
            });
          }
        }

        // Leave current voice channel if connected
        await this.leaveVoiceChannel(socket);

        // Create LiveKit room name
        const roomName = `channel_${channelId}`;
        
        // Ensure LiveKit room exists
        try {
          await this.liveKitService.getRoom(roomName);
        } catch {
          await this.liveKitService.createRoom({
            name: roomName,
            maxParticipants: channel.userLimit || 100,
            enableRecording: false,
            emptyTimeout: 300,
            metadata: JSON.stringify({
              channelId,
              serverId: channel.serverId,
              channelName: channel.name,
              type: 'voice_channel'
            })
          });
        }

        // Generate LiveKit token
        const participantInfo: ParticipantInfo = {
          identity: `user_${socket.userId}`,
          name: socket.displayName || socket.username!,
          metadata: JSON.stringify({
            userId: socket.userId,
            channelId,
            joinedAt: Date.now(),
            capabilities: capabilities || { audio: true, video: false, screenShare: false }
          }),
          permissions: {
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            hidden: false,
            recorder: false
          }
        };

        const liveKitToken = this.liveKitService.generateAccessToken(roomName, participantInfo);

        // Create voice connection
        const connection: VoiceConnection = {
          userId: socket.userId!,
          channelId,
          serverId: channel.serverId || undefined,
          sessionId: socket.id,
          liveKitToken,
          roomName,
          audioEnabled: capabilities?.audio !== false,
          videoEnabled: capabilities?.video === true,
          screenShareEnabled: false,
          muted: false,
          deafened: false,
          selfMute: false,
          selfDeaf: false,
          speaking: false,
          connectionState: 'connecting',
          joinedAt: new Date(),
          updatedAt: new Date()
        };

        this.connections.set(socket.userId!, connection);
        socket.currentVoiceChannel = channelId;
        socket.liveKitRoom = roomName;
        socket.voiceCapabilities = capabilities || { audio: true, video: false, screenShare: false };

        // Add to room participants tracking
        if (!this.roomParticipants.has(roomName)) {
          this.roomParticipants.set(roomName, new Set());
        }
        this.roomParticipants.get(roomName)!.add(socket.userId!);

        // Join socket room for real-time events
        await socket.join(`voice:${channelId}`);
        await socket.join(`livekit:${roomName}`);

        // Update voice state in database
        await prisma.voiceState.upsert({
          where: {
            userId_serverId: {
              userId: socket.userId!,
              serverId: channel.serverId || 'dm'
            }
          },
          update: {
            channelId,
            sessionId: socket.id,
            connectedAt: new Date(),
            updatedAt: new Date()
          },
          create: {
            userId: socket.userId!,
            serverId: channel.serverId,
            channelId,
            sessionId: socket.id
          }
        });

        // Notify channel participants
        socket.to(`voice:${channelId}`).emit('voice:participant_joined', {
          participant: {
            userId: socket.userId,
            username: socket.username,
            displayName: socket.displayName,
            capabilities: socket.voiceCapabilities
          },
          channelId
        });

        // Send successful join response
        socket.emit('voice:joined', {
          channelId,
          roomName,
          liveKitToken,
          liveKitUrl: process.env.LIVEKIT_URL,
          sessionId: socket.id,
          capabilities: socket.voiceCapabilities,
          serverInfo: {
            maxParticipants: channel.userLimit || 100,
            audioSettings: {
              echoCancellation: audioSettings?.echoCancellation !== false,
              noiseSuppression: audioSettings?.noiseSuppression !== false,
              autoGainControl: audioSettings?.autoGainControl !== false,
              voiceBitrate: parseInt(process.env.VOICE_BITRATE || '64000'),
              videoBitrate: parseInt(process.env.VIDEO_BITRATE || '1500000')
            }
          }
        });

        console.log(`🎙️ User ${socket.username} joined voice channel ${channelId} (LiveKit room: ${roomName})`);
        
      } catch (error) {
        console.error('Voice join error:', error);
        socket.emit('voice:error', {
          code: 'JOIN_FAILED',
          message: 'Failed to join voice channel'
        });
      }
    });

    // Leave voice channel
    socket.on('voice:leave_channel', () => {
      this.leaveVoiceChannel(socket);
    });
  }

  private handleWebRTCSignaling(socket: WebRTCSocket) {
    // WebRTC signaling events for peer-to-peer connection establishment
    socket.on('webrtc:offer', (data: {
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
      channelId?: string;
    }) => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;

      // Forward offer to target user
      this.io.to(`user:${data.targetUserId}`).emit('webrtc:offer', {
        fromUserId: socket.userId,
        offer: data.offer,
        channelId: data.channelId || connection.channelId
      });
    });

    socket.on('webrtc:answer', (data: {
      targetUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      // Forward answer to target user
      this.io.to(`user:${data.targetUserId}`).emit('webrtc:answer', {
        fromUserId: socket.userId,
        answer: data.answer
      });
    });

    socket.on('webrtc:ice_candidate', (data: {
      targetUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      // Forward ICE candidate to target user
      this.io.to(`user:${data.targetUserId}`).emit('webrtc:ice_candidate', {
        fromUserId: socket.userId,
        candidate: data.candidate
      });
    });

    socket.on('webrtc:connection_state', (data: {
      state: RTCPeerConnectionState;
      targetUserId?: string;
    }) => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;

      connection.connectionState = data.state as any;
      connection.updatedAt = new Date();

      // Notify channel participants of connection state changes
      if (connection.channelId) {
        socket.to(`voice:${connection.channelId}`).emit('voice:connection_state_changed', {
          userId: socket.userId,
          state: data.state,
          channelId: connection.channelId
        });
      }
    });
  }

  private handleVoiceStateUpdates(socket: WebRTCSocket) {
    socket.on('voice:update_state', async (data: {
      muted?: boolean;
      deafened?: boolean;
      selfMute?: boolean;
      selfDeaf?: boolean;
      speaking?: boolean;
      audioEnabled?: boolean;
      videoEnabled?: boolean;
    }) => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;

      // Update connection state
      Object.assign(connection, data, { updatedAt: new Date() });

      // Update database
      try {
        await prisma.voiceState.updateMany({
          where: { userId: socket.userId!, sessionId: socket.id },
          data: {
            selfMute: connection.selfMute,
            selfDeaf: connection.selfDeaf,
            updatedAt: new Date()
          }
        });
      } catch (error) {
        console.error('Failed to update voice state:', error);
      }

      // Broadcast state update to channel participants
      if (connection.channelId) {
        socket.to(`voice:${connection.channelId}`).emit('voice:state_updated', {
          userId: socket.userId,
          channelId: connection.channelId,
          state: {
            muted: connection.muted,
            deafened: connection.deafened,
            selfMute: connection.selfMute,
            selfDeaf: connection.selfDeaf,
            speaking: connection.speaking,
            audioEnabled: connection.audioEnabled,
            videoEnabled: connection.videoEnabled
          }
        });
      }
    });

    socket.on('voice:speaking_state', (data: { speaking: boolean }) => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;

      connection.speaking = data.speaking;
      connection.updatedAt = new Date();

      // Broadcast speaking state to channel participants
      if (connection.channelId) {
        socket.to(`voice:${connection.channelId}`).emit('voice:speaking_update', {
          userId: socket.userId,
          speaking: data.speaking,
          channelId: connection.channelId
        });
      }
    });
  }

  private handleScreenSharing(socket: WebRTCSocket) {
    socket.on('screenshare:start', async (data: {
      source?: 'screen' | 'window' | 'tab';
      audio?: boolean;
      metadata?: any;
    }) => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;

      try {
        connection.screenShareEnabled = true;
        connection.updatedAt = new Date();

        // Notify channel participants
        if (connection.channelId) {
          socket.to(`voice:${connection.channelId}`).emit('screenshare:started', {
            userId: socket.userId,
            username: socket.username,
            channelId: connection.channelId,
            source: data.source,
            hasAudio: data.audio
          });
        }

        socket.emit('screenshare:start_success', {
          sessionId: socket.id
        });

        console.log(`🖥️ User ${socket.username} started screen sharing in channel ${connection.channelId}`);
        
      } catch (error) {
        console.error('Screen share start error:', error);
        socket.emit('screenshare:error', {
          code: 'START_FAILED',
          message: 'Failed to start screen sharing'
        });
      }
    });

    socket.on('screenshare:stop', () => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;

      connection.screenShareEnabled = false;
      connection.updatedAt = new Date();

      // Notify channel participants
      if (connection.channelId) {
        socket.to(`voice:${connection.channelId}`).emit('screenshare:stopped', {
          userId: socket.userId,
          channelId: connection.channelId
        });
      }

      socket.emit('screenshare:stop_success');
      console.log(`🖥️ User ${socket.username} stopped screen sharing`);
    });

    socket.on('screenshare:request_control', (data: { fromUserId: string }) => {
      // Forward screen share control request
      this.io.to(`user:${data.fromUserId}`).emit('screenshare:control_requested', {
        fromUserId: socket.userId,
        username: socket.username
      });
    });

    socket.on('screenshare:control_response', (data: {
      targetUserId: string;
      granted: boolean;
    }) => {
      // Forward control response
      this.io.to(`user:${data.targetUserId}`).emit('screenshare:control_response', {
        granted: data.granted,
        fromUserId: socket.userId
      });
    });
  }

  private handleConnectionQuality(socket: WebRTCSocket) {
    socket.on('voice:quality_report', (data: {
      jitter: number;
      packetLoss: number;
      rtt: number;
      audioLevel: number;
    }) => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;

      connection.quality = data;
      connection.lastPing = Date.now();
      connection.updatedAt = new Date();

      // Store quality metrics in Redis for monitoring
      this.redis.hset(
        `voice_quality:${socket.userId}`,
        {
          jitter: data.jitter,
          packetLoss: data.packetLoss,
          rtt: data.rtt,
          audioLevel: data.audioLevel,
          timestamp: Date.now()
        }
      ).catch(console.error);
    });

    socket.on('voice:ping', () => {
      socket.emit('voice:pong', { timestamp: Date.now() });
    });
    
    // Enhanced quality reporting with analytics
    socket.on('voice:quality_analytics', async (analytics: Omit<VoiceAnalytics, 'userId' | 'timestamp'>) => {
      const connection = this.connections.get(socket.userId!);
      if (!connection) return;
      
      const fullAnalytics: VoiceAnalytics = {
        ...analytics,
        userId: socket.userId!,
        channelId: connection.channelId,
        sessionId: connection.sessionId,
        timestamp: new Date()
      };
      
      await this.qualityService.recordAnalytics(fullAnalytics);
    });
  }

  private handleVoiceQualitySettings(socket: WebRTCSocket) {
    // Get user's voice quality settings
    socket.on('voice:get_quality_settings', async () => {
      try {
        const settings = await this.qualityService.getUserSettings(socket.userId!);
        socket.emit('voice:quality_settings', { settings });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'SETTINGS_ERROR',
          message: 'Failed to get quality settings'
        });
      }
    });

    // Update voice quality settings
    socket.on('voice:update_quality_settings', async (data: { updates: any }) => {
      try {
        const updatedSettings = await this.qualityService.updateUserSettings(
          socket.userId!, 
          data.updates
        );
        
        socket.emit('voice:quality_settings_updated', { settings: updatedSettings });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'SETTINGS_UPDATE_FAILED',
          message: error.message || 'Failed to update quality settings'
        });
      }
    });

    // Apply quality preset
    socket.on('voice:apply_preset', async (data: { presetId: string }) => {
      try {
        const settings = await this.qualityService.applyPreset(socket.userId!, data.presetId);
        socket.emit('voice:preset_applied', { 
          presetId: data.presetId, 
          settings 
        });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'PRESET_APPLY_FAILED',
          message: error.message || 'Failed to apply preset'
        });
      }
    });

    // Get available presets
    socket.on('voice:get_presets', () => {
      const presets = this.qualityService.getPresets();
      socket.emit('voice:presets', { presets });
    });

    // Optimize settings for current network
    socket.on('voice:optimize_for_network', async (data: {
      networkInfo: {
        type: 'ethernet' | 'wifi' | 'cellular' | 'vpn';
        bandwidth: number;
        latency: number;
        jitter: number;
        packetLoss: number;
      }
    }) => {
      try {
        const optimizedSettings = await this.qualityService.optimizeForNetwork(
          socket.userId!,
          data.networkInfo
        );
        
        socket.emit('voice:settings_optimized', { 
          settings: optimizedSettings,
          networkInfo: data.networkInfo
        });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'OPTIMIZATION_FAILED',
          message: 'Failed to optimize settings for network'
        });
      }
    });

    // Get quality analytics
    socket.on('voice:get_analytics', async (data: { limit?: number } = {}) => {
      try {
        const analytics = await this.qualityService.getAnalytics(
          socket.userId!,
          data.limit || 50
        );
        
        socket.emit('voice:analytics', { analytics });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to get analytics'
        });
      }
    });

    // Get quality statistics
    socket.on('voice:get_quality_stats', async (data: {
      timeframe?: 'hour' | 'day' | 'week' | 'month'
    } = {}) => {
      try {
        const stats = await this.qualityService.getQualityStats(
          socket.userId!,
          data.timeframe || 'day'
        );
        
        socket.emit('voice:quality_stats', { stats });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'STATS_ERROR',
          message: 'Failed to get quality statistics'
        });
      }
    });
  }

  private handleParticipantManagement(socket: WebRTCSocket) {
    // Get channel participants with enhanced info
    socket.on('voice:get_channel_participants', async (data: { channelId: string }) => {
      try {
        const participants = this.getChannelParticipants(data.channelId);
        const participantDetails = [];

        for (const userId of participants) {
          const connection = this.connections.get(userId);
          if (connection) {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            });

            if (user) {
              participantDetails.push({
                user,
                connection: {
                  joinedAt: connection.joinedAt,
                  speaking: connection.speaking,
                  audioEnabled: connection.audioEnabled,
                  videoEnabled: connection.videoEnabled,
                  screenShareEnabled: connection.screenShareEnabled,
                  muted: connection.muted || connection.selfMute,
                  deafened: connection.deafened || connection.selfDeaf,
                  connectionState: connection.connectionState,
                  quality: connection.quality
                }
              });
            }
          }
        }

        socket.emit('voice:channel_participants', {
          channelId: data.channelId,
          participants: participantDetails
        });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'PARTICIPANTS_ERROR',
          message: 'Failed to get channel participants'
        });
      }
    });

    // Kick participant (admin only)
    socket.on('voice:kick_participant', async (data: {
      channelId: string;
      targetUserId: string;
      reason?: string;
    }) => {
      try {
        // Check permissions
        const channel = await prisma.channel.findUnique({
          where: { id: data.channelId },
          select: { serverId: true }
        });

        if (!channel?.serverId) {
          throw new Error('Cannot kick from DM channels');
        }

        const member = await prisma.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId: channel.serverId,
              userId: socket.userId!
            }
          },
          include: { roles: { include: { role: true } } }
        });

        const canKick = member?.roles.some(mr => 
          mr.role.permissions & BigInt(0x2) // KICK_MEMBERS permission
        );

        if (!canKick) {
          throw new Error('No permission to kick members');
        }

        // Force disconnect the target user
        const success = await this.forceDisconnectUser(
          data.targetUserId,
          data.reason || 'Kicked by moderator'
        );

        if (success) {
          socket.emit('voice:participant_kicked', {
            targetUserId: data.targetUserId,
            channelId: data.channelId,
            reason: data.reason
          });

          // Notify the kicked user
          this.io.to(`user:${data.targetUserId}`).emit('voice:kicked', {
            channelId: data.channelId,
            kickedBy: socket.userId,
            reason: data.reason || 'Kicked by moderator'
          });
        }
      } catch (error) {
        socket.emit('voice:error', {
          code: 'KICK_FAILED',
          message: error.message || 'Failed to kick participant'
        });
      }
    });

    // Mute participant (admin only)
    socket.on('voice:mute_participant', async (data: {
      channelId: string;
      targetUserId: string;
      muted: boolean;
    }) => {
      try {
        // Check permissions
        const channel = await prisma.channel.findUnique({
          where: { id: data.channelId },
          select: { serverId: true }
        });

        if (!channel?.serverId) {
          throw new Error('Cannot mute in DM channels');
        }

        const member = await prisma.serverMember.findUnique({
          where: {
            serverId_userId: {
              serverId: channel.serverId,
              userId: socket.userId!
            }
          },
          include: { roles: { include: { role: true } } }
        });

        const canMute = member?.roles.some(mr => 
          mr.role.permissions & BigInt(0x400000) // MUTE_MEMBERS permission
        );

        if (!canMute) {
          throw new Error('No permission to mute members');
        }

        // Update target user's connection
        const targetConnection = this.connections.get(data.targetUserId);
        if (targetConnection) {
          targetConnection.muted = data.muted;
          targetConnection.updatedAt = new Date();

          // Notify the muted user
          this.io.to(`user:${data.targetUserId}`).emit('voice:server_muted', {
            channelId: data.channelId,
            muted: data.muted,
            mutedBy: socket.userId
          });

          // Notify channel participants
          this.io.to(`voice:${data.channelId}`).emit('voice:participant_muted', {
            targetUserId: data.targetUserId,
            muted: data.muted,
            mutedBy: socket.userId
          });
        }
      } catch (error) {
        socket.emit('voice:error', {
          code: 'MUTE_FAILED',
          message: error.message || 'Failed to mute participant'
        });
      }
    });

    // Create temporary voice room
    socket.on('voice:create_temp_room', async (data: {
      name: string;
      maxParticipants?: number;
      isPrivate?: boolean;
    }) => {
      try {
        const { sessionId, session } = await this.screenSharingService.startScreenShare({
          userId: socket.userId!,
          roomName: `temp_room_${Date.now()}_${socket.userId}`,
          source: 'application',
          hasAudio: true,
          quality: 'medium',
          maxViewers: data.maxParticipants || 10,
          requiresPermission: data.isPrivate || false,
          allowViewerControl: false,
          annotations: false,
          recording: false,
          metadata: {
            type: 'temporary_voice_room',
            name: data.name,
            createdBy: socket.userId
          }
        });

        socket.emit('voice:temp_room_created', {
          roomId: sessionId,
          roomName: session.roomName,
          name: data.name,
          maxParticipants: data.maxParticipants || 10,
          isPrivate: data.isPrivate || false
        });
      } catch (error) {
        socket.emit('voice:error', {
          code: 'ROOM_CREATION_FAILED',
          message: error.message || 'Failed to create temporary room'
        });
      }
    });
  }

  private handleDisconnection(socket: WebRTCSocket) {
    socket.on('disconnect', async () => {
      await this.leaveVoiceChannel(socket);
      this.cleanupConnection(socket.userId!);
    });
  }

  private async leaveVoiceChannel(socket: WebRTCSocket) {
    const connection = this.connections.get(socket.userId!);
    if (!connection) return;

    try {
      // Leave socket rooms
      await socket.leave(`voice:${connection.channelId}`);
      if (connection.roomName) {
        await socket.leave(`livekit:${connection.roomName}`);
      }

      // Remove from room participants tracking
      if (connection.roomName) {
        const participants = this.roomParticipants.get(connection.roomName);
        if (participants) {
          participants.delete(socket.userId!);
          if (participants.size === 0) {
            this.roomParticipants.delete(connection.roomName);
          }
        }
      }

      // Remove from LiveKit room if needed
      if (connection.roomName && connection.liveKitToken) {
        try {
          await this.liveKitService.removeParticipant(
            connection.roomName, 
            `user_${socket.userId}`
          );
        } catch (error) {
          console.warn('Failed to remove participant from LiveKit:', error);
        }
      }

      // Update database
      await prisma.voiceState.deleteMany({
        where: { userId: socket.userId!, sessionId: socket.id }
      });

      // Notify channel participants
      if (connection.channelId) {
        socket.to(`voice:${connection.channelId}`).emit('voice:participant_left', {
          userId: socket.userId,
          username: socket.username,
          channelId: connection.channelId
        });
      }

      console.log(`🎙️ User ${socket.username} left voice channel ${connection.channelId}`);
      
    } catch (error) {
      console.error('Error leaving voice channel:', error);
    } finally {
      // Clean up local state
      socket.currentVoiceChannel = undefined;
      socket.liveKitRoom = undefined;
      this.connections.delete(socket.userId!);
    }
  }

  private cleanupConnection(userId: string) {
    this.connections.delete(userId);
    
    // Clean up quality metrics
    this.redis.del(`voice_quality:${userId}`).catch(console.error);
  }

  private setupConnectionCleanup() {
    // Clean up stale connections every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 10 * 60 * 1000; // 10 minutes

      for (const [userId, connection] of this.connections.entries()) {
        if (now - connection.updatedAt.getTime() > staleThreshold) {
          console.log(`🧹 Cleaning up stale voice connection for user ${userId}`);
          this.cleanupConnection(userId);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Public methods for external use
  public getActiveConnections(): Map<string, VoiceConnection> {
    return new Map(this.connections);
  }

  public getChannelParticipants(channelId: string): string[] {
    const participants: string[] = [];
    for (const [userId, connection] of this.connections.entries()) {
      if (connection.channelId === channelId) {
        participants.push(userId);
      }
    }
    return participants;
  }

  public getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      totalRooms: this.roomParticipants.size,
      connectionsPerRoom: Array.from(this.roomParticipants.entries()).map(([room, participants]) => ({
        room,
        count: participants.size
      }))
    };
  }

  public async forceDisconnectUser(userId: string, reason?: string) {
    const connection = this.connections.get(userId);
    if (!connection) return false;

    // Find socket by user ID
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    for (const socket of sockets) {
      if ((socket as any).userId === userId) {
        socket.emit('voice:force_disconnect', { reason });
        await this.leaveVoiceChannel(socket as WebRTCSocket);
        socket.disconnect(true);
        break;
      }
    }

    return true;
  }
}