import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';
import { io, Socket } from 'socket.io-client';

describe('Comprehensive Voice/Video LiveKit Tests', () => {
  let app: FastifyInstance;
  let authToken1: string;
  let authToken2: string;
  let serverId: string;
  let voiceChannelId: string;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  
  const testUser1 = {
    email: `voice-test-1-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `voiceuser1${Date.now()}`
  };
  
  const testUser2 = {
    email: `voice-test-2-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `voiceuser2${Date.now()}`
  };

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();

    // Register and login test users
    await request(app.server)
      .post('/api/auth/register')
      .send(testUser1);

    await request(app.server)
      .post('/api/auth/register')
      .send(testUser2);

    const loginResponse1 = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUser1.email,
        password: testUser1.password
      });

    const loginResponse2 = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUser2.email,
        password: testUser2.password
      });

    authToken1 = loginResponse1.body.token;
    authToken2 = loginResponse2.body.token;

    // Create test server and voice channel
    const serverResponse = await request(app.server)
      .post('/api/servers')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({
        name: 'Voice Test Server',
        description: 'Test server for voice tests'
      });

    serverId = serverResponse.body.server.id;

    const channelResponse = await request(app.server)
      .post(`/api/servers/${serverId}/channels`)
      .set('Authorization', `Bearer ${authToken1}`)
      .send({
        name: 'voice-channel',
        type: 'voice'
      });

    voiceChannelId = channelResponse.body.channel.id;

    // Join server with second user
    await request(app.server)
      .post(`/api/servers/${serverId}/join`)
      .set('Authorization', `Bearer ${authToken2}`)
      .send({ inviteCode: serverResponse.body.server.inviteCode });

    // Setup socket connections
    clientSocket1 = io('http://localhost:3002', {
      auth: { token: authToken1 },
      transports: ['websocket']
    });

    clientSocket2 = io('http://localhost:3002', {
      auth: { token: authToken2 },
      transports: ['websocket']
    });

    await new Promise((resolve) => {
      let connectCount = 0;
      const checkConnections = () => {
        connectCount++;
        if (connectCount === 2) resolve(undefined);
      };
      
      clientSocket1.on('connect', checkConnections);
      clientSocket2.on('connect', checkConnections);
    });
  }, 30000);

  afterAll(async () => {
    clientSocket1?.disconnect();
    clientSocket2?.disconnect();
    await app.close();
  });

  describe('LiveKit Room Management', () => {
    it('should create LiveKit room for voice channel', async () => {
      const response = await request(app.server)
        .post('/api/voice/rooms')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          channelId: voiceChannelId,
          roomType: 'voice'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('roomName');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('wsUrl');
      expect(response.body.roomName).toContain(voiceChannelId);
    });

    it('should generate LiveKit access tokens', async () => {
      const response = await request(app.server)
        .post('/api/voice/token')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          roomName: `voice_${voiceChannelId}`,
          participantName: testUser1.username,
          permissions: {
            canPublish: true,
            canSubscribe: true,
            canPublishData: true
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('wsUrl');
      expect(response.body).toHaveProperty('roomName');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(50);
    });

    it('should validate room permissions', async () => {
      await request(app.server)
        .post('/api/voice/token')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          roomName: 'unauthorized_room',
          participantName: testUser2.username
        })
        .expect(403);
    });

    it('should handle room capacity limits', async () => {
      const roomData = {
        channelId: voiceChannelId,
        roomType: 'voice',
        maxParticipants: 2
      };

      const response = await request(app.server)
        .post('/api/voice/rooms')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(roomData)
        .expect(201);

      expect(response.body.room.maxParticipants).toBe(2);
    });
  });

  describe('Voice Channel Operations', () => {
    let roomName: string;

    beforeAll(async () => {
      const roomResponse = await request(app.server)
        .post('/api/voice/rooms')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          channelId: voiceChannelId,
          roomType: 'voice'
        });
      roomName = roomResponse.body.roomName;
    });

    it('should join voice channel successfully', async () => {
      const response = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          audioEnabled: true,
          videoEnabled: false
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('roomName');
      expect(response.body).toHaveProperty('participant');
    });

    it('should track voice channel participants', async () => {
      // First user joins
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          audioEnabled: true,
          videoEnabled: false
        });

      // Second user joins
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          audioEnabled: true,
          videoEnabled: true
        });

      // Get participants list
      const response = await request(app.server)
        .get(`/api/voice/channels/${voiceChannelId}/participants`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(response.body.participants)).toBe(true);
      expect(response.body.participants).toHaveLength(2);
      expect(response.body.participants.some((p: any) => p.username === testUser1.username)).toBe(true);
      expect(response.body.participants.some((p: any) => p.username === testUser2.username)).toBe(true);
    });

    it('should handle voice channel leave', async () => {
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/leave`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      const response = await request(app.server)
        .get(`/api/voice/channels/${voiceChannelId}/participants`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.participants).toHaveLength(1);
      expect(response.body.participants[0].username).toBe(testUser2.username);
    });
  });

  describe('Audio/Video Controls', () => {
    it('should mute/unmute audio', async () => {
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ audioEnabled: true, videoEnabled: false });

      const muteResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/mute`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(muteResponse.body.audioEnabled).toBe(false);

      const unmuteResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/unmute`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(unmuteResponse.body.audioEnabled).toBe(true);
    });

    it('should enable/disable video', async () => {
      const enableVideoResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/video/enable`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(enableVideoResponse.body.videoEnabled).toBe(true);

      const disableVideoResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/video/disable`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(disableVideoResponse.body.videoEnabled).toBe(false);
    });

    it('should handle screen sharing', async () => {
      const startShareResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/screen-share/start`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(startShareResponse.body.screenSharing).toBe(true);

      const stopShareResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/screen-share/stop`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(stopShareResponse.body.screenSharing).toBe(false);
    });
  });

  describe('Voice Quality and Optimization', () => {
    it('should provide voice quality metrics', async () => {
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ audioEnabled: true, videoEnabled: false });

      const response = await request(app.server)
        .get(`/api/voice/channels/${voiceChannelId}/quality`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('bitrate');
      expect(response.body.metrics).toHaveProperty('latency');
      expect(response.body.metrics).toHaveProperty('packetLoss');
      expect(response.body.metrics).toHaveProperty('jitter');
    });

    it('should adapt bitrate based on network conditions', async () => {
      const adaptResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/adapt-quality`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          networkQuality: 'poor',
          targetBitrate: 64000
        })
        .expect(200);

      expect(adaptResponse.body.adaptedBitrate).toBeLessThanOrEqual(64000);
      expect(adaptResponse.body).toHaveProperty('qualityLevel');
    });

    it('should provide bandwidth optimization', async () => {
      const optimizeResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/optimize`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          connectionType: 'mobile',
          maxBandwidth: 500000
        })
        .expect(200);

      expect(optimizeResponse.body).toHaveProperty('optimizations');
      expect(optimizeResponse.body.optimizations).toHaveProperty('videoDisabled');
      expect(optimizeResponse.body.optimizations).toHaveProperty('audioBitrate');
    });
  });

  describe('Real-time Voice Events', () => {
    it('should notify users when someone joins voice channel', (done) => {
      clientSocket2.on('voice_user_joined', (data) => {
        expect(data.channelId).toBe(voiceChannelId);
        expect(data.user.username).toBe(testUser1.username);
        expect(data.audioEnabled).toBeDefined();
        expect(data.videoEnabled).toBeDefined();
        done();
      });

      clientSocket1.emit('join_voice_channel', {
        channelId: voiceChannelId,
        audioEnabled: true,
        videoEnabled: false
      });
    }, 10000);

    it('should notify users of audio/video state changes', (done) => {
      clientSocket2.on('voice_state_changed', (data) => {
        expect(data.channelId).toBe(voiceChannelId);
        expect(data.userId).toBeDefined();
        expect(data.changes).toHaveProperty('audioEnabled');
        done();
      });

      clientSocket1.emit('voice_state_change', {
        channelId: voiceChannelId,
        audioEnabled: false
      });
    }, 10000);

    it('should handle voice activity detection', (done) => {
      clientSocket2.on('voice_activity', (data) => {
        expect(data.channelId).toBe(voiceChannelId);
        expect(data.userId).toBeDefined();
        expect(data.speaking).toBe(true);
        done();
      });

      clientSocket1.emit('voice_activity_start', {
        channelId: voiceChannelId
      });
    }, 10000);
  });

  describe('Voice Permissions and Moderation', () => {
    it('should enforce voice channel permissions', async () => {
      // Create a new user without server permissions
      const unauthorizedUser = {
        email: `unauthorized-voice-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        username: `unauthorizedvoice${Date.now()}`
      };

      await request(app.server)
        .post('/api/auth/register')
        .send(unauthorizedUser);

      const loginResponse = await request(app.server)
        .post('/api/auth/login')
        .send({
          email: unauthorizedUser.email,
          password: unauthorizedUser.password
        });

      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send({ audioEnabled: true, videoEnabled: false })
        .expect(403);
    });

    it('should allow server admins to mute users', async () => {
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ audioEnabled: true, videoEnabled: false });

      const response = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/admin-mute`)
        .set('Authorization', `Bearer ${authToken1}`) // Server owner
        .send({ userId: testUser2.username })
        .expect(200);

      expect(response.body.muted).toBe(true);
    });

    it('should allow server admins to kick users from voice', async () => {
      const response = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/kick`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ userId: testUser2.username })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was removed
      const participantsResponse = await request(app.server)
        .get(`/api/voice/channels/${voiceChannelId}/participants`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(participantsResponse.body.participants.some((p: any) => p.username === testUser2.username)).toBe(false);
    });
  });

  describe('Recording and Transcription', () => {
    it('should start voice channel recording', async () => {
      const response = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/recording/start`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          audioOnly: false,
          includeScreenShare: true
        })
        .expect(200);

      expect(response.body).toHaveProperty('recordingId');
      expect(response.body).toHaveProperty('status', 'recording');
    });

    it('should stop voice channel recording', async () => {
      const startResponse = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/recording/start`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ audioOnly: true });

      const recordingId = startResponse.body.recordingId;

      const response = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/recording/stop`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ recordingId })
        .expect(200);

      expect(response.body).toHaveProperty('recordingUrl');
      expect(response.body).toHaveProperty('duration');
    });

    it('should provide live transcription', async () => {
      const response = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/transcription/start`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          language: 'en-US',
          realTime: true
        })
        .expect(200);

      expect(response.body).toHaveProperty('transcriptionId');
      expect(response.body).toHaveProperty('status', 'active');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle LiveKit connection failures', async () => {
      const response = await request(app.server)
        .post('/api/voice/connection/test')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          wsUrl: 'ws://invalid-livekit-url:7880',
          token: 'invalid_token'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('connection');
    });

    it('should recover from voice channel disconnection', (done) => {
      clientSocket1.on('voice_connection_recovery', (data) => {
        expect(data.channelId).toBe(voiceChannelId);
        expect(data.recovered).toBe(true);
        done();
      });

      // Simulate disconnection and recovery
      clientSocket1.emit('voice_connection_lost', { channelId: voiceChannelId });
      
      setTimeout(() => {
        clientSocket1.emit('voice_reconnect_attempt', { channelId: voiceChannelId });
      }, 1000);
    }, 10000);

    it('should handle codec compatibility issues', async () => {
      const response = await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/codec-test`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          supportedCodecs: ['opus', 'pcmu']
        })
        .expect(200);

      expect(response.body).toHaveProperty('recommendedCodec');
      expect(response.body).toHaveProperty('fallbackOptions');
    });
  });

  describe('Performance Metrics', () => {
    it('should provide detailed performance statistics', async () => {
      await request(app.server)
        .post(`/api/voice/channels/${voiceChannelId}/join`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ audioEnabled: true, videoEnabled: true });

      // Wait for some data to accumulate
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await request(app.server)
        .get(`/api/voice/channels/${voiceChannelId}/stats`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('connectionStats');
      expect(response.body).toHaveProperty('audioStats');
      expect(response.body).toHaveProperty('videoStats');
      expect(response.body.connectionStats).toHaveProperty('rtt');
      expect(response.body.audioStats).toHaveProperty('packetsReceived');
    });

    it('should monitor room resource usage', async () => {
      const response = await request(app.server)
        .get(`/api/voice/rooms/${voiceChannelId}/resources`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('participants');
      expect(response.body).toHaveProperty('bandwidthUsage');
      expect(response.body).toHaveProperty('cpuUsage');
      expect(response.body).toHaveProperty('memoryUsage');
    });
  });
});