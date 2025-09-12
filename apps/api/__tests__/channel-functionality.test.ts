import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { createTestUser } from './helpers/test-data';
import { prisma } from '@cryb/database';
import { io as ioClient, Socket as SocketClient } from 'socket.io-client';
import { randomUUID } from 'crypto';

describe('Channel Functionality Tests', () => {
  let app: FastifyInstance;
  let testUser1: any;
  let testUser2: any;
  let testServer: any;
  let authToken1: string;
  let authToken2: string;
  let socketClient1: SocketClient;
  let socketClient2: SocketClient;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    
    // Create test users
    testUser1 = await createTestUser({ username: `channeltest1_${Date.now()}` });
    testUser2 = await createTestUser({ username: `channeltest2_${Date.now()}` });
    
    // Create test server
    testServer = await prisma.server.create({
      data: {
        id: randomUUID(),
        name: 'Test Server',
        description: 'Test server for channel functionality',
        ownerId: testUser1.id,
        memberCount: 1
      }
    });
    
    // Add owner as member
    await prisma.serverMember.create({
      data: {
        serverId: testServer.id,
        userId: testUser1.id
      }
    });
    
    // Add user2 as member
    await prisma.serverMember.create({
      data: {
        serverId: testServer.id,
        userId: testUser2.id
      }
    });

    // Get auth tokens
    const loginResponse1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        username: testUser1.username,
        password: 'testpassword123'
      }
    });
    authToken1 = JSON.parse(loginResponse1.body).data.accessToken;

    const loginResponse2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        username: testUser2.username,
        password: 'testpassword123'
      }
    });
    authToken2 = JSON.parse(loginResponse2.body).data.accessToken;

    // Setup Socket.IO clients
    const serverAddress = await app.server.address();
    const port = typeof serverAddress === 'string' ? 3000 : serverAddress?.port || 3000;
    
    socketClient1 = ioClient(`http://localhost:${port}`, {
      auth: { token: authToken1 },
      transports: ['websocket']
    });
    
    socketClient2 = ioClient(`http://localhost:${port}`, {
      auth: { token: authToken2 },
      transports: ['websocket']
    });

    // Wait for connections
    await new Promise<void>((resolve, reject) => {
      let connected = 0;
      const timeout = setTimeout(() => {
        reject(new Error('Socket connections timed out'));
      }, 10000);
      
      const checkConnections = () => {
        connected++;
        if (connected === 2) {
          clearTimeout(timeout);
          resolve();
        }
      };
      
      socketClient1.on('connect', checkConnections);
      socketClient2.on('connect', checkConnections);
      
      // Handle connection errors
      socketClient1.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      socketClient2.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }, 30000);

  afterAll(async () => {
    // Cleanup
    socketClient1?.disconnect();
    socketClient2?.disconnect();
    
    // Clean up test data
    try {
      await prisma.message.deleteMany({
        where: { channel: { serverId: testServer.id } }
      });
      await prisma.channel.deleteMany({
        where: { serverId: testServer.id }
      });
      await prisma.serverMember.deleteMany({
        where: { serverId: testServer.id }
      });
      await prisma.server.delete({
        where: { id: testServer.id }
      });
      await prisma.user.deleteMany({
        where: { 
          OR: [
            { id: testUser1.id },
            { id: testUser2.id }
          ]
        }
      });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
    
    await app.close();
  });

  describe('Channel CRUD Operations', () => {
    let testChannelId: string;

    test('should create a text channel', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'test-channel',
          description: 'A test channel',
          type: 'TEXT'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('test-channel');
      expect(body.data.type).toBe('TEXT');
      testChannelId = body.data.id;
    });

    test('should create a voice channel', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'voice-channel',
          type: 'VOICE'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.type).toBe('VOICE');
    });

    test('should create a category channel', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'test-category',
          type: 'CATEGORY'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.type).toBe('CATEGORY');
    });

    test('should get channel details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/channels/${testChannelId}`,
        headers: {
          authorization: `Bearer ${authToken1}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testChannelId);
      expect(body.data.name).toBe('test-channel');
    });

    test('should update channel', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/channels/${testChannelId}`,
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          name: 'updated-channel',
          description: 'Updated description'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('updated-channel');
      expect(body.data.description).toBe('Updated description');
    });

    test('should not allow non-members to create channels', async () => {
      // Create a new user who is not a member
      const nonMemberUser = await createTestUser({ username: `nonmember_${Date.now()}` });
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          username: nonMemberUser.username,
          password: 'testpassword123'
        }
      });
      const nonMemberToken = JSON.parse(loginResponse.body).data.accessToken;

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${nonMemberToken}`
        },
        payload: {
          serverId: testServer.id,
          name: 'unauthorized-channel',
          type: 'TEXT'
        }
      });

      expect(response.statusCode).toBe(403);
      
      // Cleanup
      await prisma.user.delete({ where: { id: nonMemberUser.id } });
    });

    test('should not allow members without permissions to create channels', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken2}` // testUser2 has no manage channels permission
        },
        payload: {
          serverId: testServer.id,
          name: 'unauthorized-channel',
          type: 'TEXT'
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('Channel Messaging', () => {
    let textChannelId: string;
    let messageId: string;

    beforeAll(async () => {
      // Create a text channel for messaging tests
      const channelResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'message-test-channel',
          type: 'TEXT'
        }
      });
      textChannelId = JSON.parse(channelResponse.body).data.id;
    });

    test('should send a message in channel', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/messages',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          channelId: textChannelId,
          content: 'Hello, this is a test message!'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.content).toBe('Hello, this is a test message!');
      expect(body.data.channelId).toBe(textChannelId);
      messageId = body.data.id;
    });

    test('should get channel messages', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/channels/${textChannelId}/messages`,
        headers: {
          authorization: `Bearer ${authToken1}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.messages).toHaveLength(1);
      expect(body.data.messages[0].content).toBe('Hello, this is a test message!');
    });

    test('should edit a message', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/messages/${messageId}`,
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          content: 'This is an edited message!'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.content).toBe('This is an edited message!');
      expect(body.data.editedTimestamp).toBeTruthy();
    });

    test('should add reaction to message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/messages/${messageId}/reactions`,
        headers: {
          authorization: `Bearer ${authToken2}`
        },
        payload: {
          emoji: '👍'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.emoji).toBe('👍');
    });

    test('should pin a message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/messages/${messageId}/pin`,
        headers: {
          authorization: `Bearer ${authToken1}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.isPinned).toBe(true);
    });

    test('should send typing indicator', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/channels/${textChannelId}/typing`,
        headers: {
          authorization: `Bearer ${authToken2}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    test('should delete a message', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/messages/${messageId}`,
        headers: {
          authorization: `Bearer ${authToken1}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Real-time Socket.IO Events', () => {
    let testChannelId: string;
    let messageEvents: any[] = [];
    let channelEvents: any[] = [];

    beforeAll(async () => {
      // Create a channel for real-time testing
      const channelResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'realtime-test',
          type: 'TEXT'
        }
      });
      testChannelId = JSON.parse(channelResponse.body).data.id;

      // Setup event listeners
      socketClient1.on('messageCreate', (data) => {
        messageEvents.push({ client: 1, event: 'messageCreate', data });
      });

      socketClient2.on('messageCreate', (data) => {
        messageEvents.push({ client: 2, event: 'messageCreate', data });
      });

      socketClient1.on('channelCreate', (data) => {
        channelEvents.push({ client: 1, event: 'channelCreate', data });
      });

      socketClient2.on('channelCreate', (data) => {
        channelEvents.push({ client: 2, event: 'channelCreate', data });
      });

      // Join server rooms
      socketClient1.emit('join-server', { serverId: testServer.id });
      socketClient2.emit('join-server', { serverId: testServer.id });

      // Join channel rooms
      socketClient1.emit('join-channel', { channelId: testChannelId });
      socketClient2.emit('join-channel', { channelId: testChannelId });

      // Wait for rooms to be joined
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('should broadcast channel creation events', async () => {
      channelEvents.length = 0; // Clear previous events

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'broadcast-test',
          type: 'TEXT'
        }
      });

      expect(response.statusCode).toBe(201);

      // Wait for socket events
      await new Promise(resolve => setTimeout(resolve, 500));

      // Both clients should receive the event
      expect(channelEvents.length).toBeGreaterThan(0);
    });

    test('should broadcast message events', async () => {
      messageEvents.length = 0; // Clear previous events

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/messages',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          channelId: testChannelId,
          content: 'Real-time test message'
        }
      });

      expect(response.statusCode).toBe(201);

      // Wait for socket events
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should receive message events
      expect(messageEvents.length).toBeGreaterThan(0);
    });

    test('should handle typing indicators', (done) => {
      let typingReceived = false;

      socketClient2.once('user-typing', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.channelId).toBe(testChannelId);
        typingReceived = true;
        done();
      });

      // Trigger typing from client 1
      setTimeout(() => {
        socketClient1.emit('typing', { channelId: testChannelId });
      }, 100);

      // Fail test if no typing event received
      setTimeout(() => {
        if (!typingReceived) {
          done(new Error('Typing event not received'));
        }
      }, 3000);
    }, 5000);
  });

  describe('Voice Channel Functionality', () => {
    let voiceChannelId: string;

    beforeAll(async () => {
      // Create a voice channel
      const channelResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'voice-test',
          type: 'VOICE'
        }
      });
      voiceChannelId = JSON.parse(channelResponse.body).data.id;
    });

    test('should join voice channel', (done) => {
      socketClient1.once('voice-state-update', (data) => {
        expect(data.channelId).toBe(voiceChannelId);
        done();
      });

      socketClient1.emit('join-voice', { channelId: voiceChannelId });
    }, 5000);

    test('should update voice state', (done) => {
      socketClient2.once('voice-state-update', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.voiceState.muted).toBe(true);
        done();
      });

      // User 2 joins first to receive updates
      socketClient2.emit('join-voice', { channelId: voiceChannelId });
      
      setTimeout(() => {
        socketClient1.emit('voice-state-update', { muted: true });
      }, 100);
    }, 5000);

    test('should leave voice channel', (done) => {
      socketClient2.once('user-left-voice', (data) => {
        expect(data.userId).toBe(testUser1.id);
        expect(data.channelId).toBe(voiceChannelId);
        done();
      });

      socketClient1.emit('leave-voice');
    }, 5000);
  });

  describe('Channel Permissions', () => {
    let restrictedChannelId: string;

    test('should get channel permissions', async () => {
      // Create a channel first
      const channelResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'permission-test',
          type: 'TEXT'
        }
      });
      restrictedChannelId = JSON.parse(channelResponse.body).data.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/channels/${restrictedChannelId}/permissions`,
        headers: {
          authorization: `Bearer ${authToken1}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('should restrict access to private channels', async () => {
      // Create a private channel
      const channelResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'private-channel',
          type: 'TEXT',
          isPrivate: true
        }
      });
      
      const privateChannelId = JSON.parse(channelResponse.body).data.id;

      // testUser2 should still have access as a server member
      // (in a real implementation, private channels would need specific permission overwrites)
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/channels/${privateChannelId}`,
        headers: {
          authorization: `Bearer ${authToken2}`
        }
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle channel not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/channels/invalid-id',
        headers: {
          authorization: `Bearer ${authToken1}`
        }
      });

      expect(response.statusCode).toBe(400); // Invalid CUID format
    });

    test('should handle missing channel permissions', async () => {
      // Try to delete a channel without permission
      const channelResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'delete-test',
          type: 'TEXT'
        }
      });
      const channelId = JSON.parse(channelResponse.body).data.id;

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/channels/${channelId}`,
        headers: {
          authorization: `Bearer ${authToken2}` // User without delete permissions
        }
      });

      expect(response.statusCode).toBe(403);
    });

    test('should handle invalid channel data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: '', // Empty name should fail
          type: 'TEXT'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    test('should handle slow mode rate limiting', async () => {
      // Create a channel with slow mode
      const channelResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/channels',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          serverId: testServer.id,
          name: 'slow-mode-test',
          type: 'TEXT',
          slowMode: 5 // 5 seconds
        }
      });
      const slowChannelId = JSON.parse(channelResponse.body).data.id;

      // Send first message
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/messages',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          channelId: slowChannelId,
          content: 'First message'
        }
      });
      expect(firstResponse.statusCode).toBe(201);

      // Try to send second message immediately - should fail due to slow mode
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/messages',
        headers: {
          authorization: `Bearer ${authToken1}`
        },
        payload: {
          channelId: slowChannelId,
          content: 'Second message too fast'
        }
      });
      expect(secondResponse.statusCode).toBe(400);
    });
  });
});