import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';

describe('Comprehensive Socket.IO Real-time Tests', () => {
  let app: FastifyInstance;
  let clientSocket: Socket;
  let clientSocket2: Socket;
  let authToken1: string;
  let authToken2: string;
  let serverId: string;
  let channelId: string;
  
  const testUser1 = {
    email: `socket-test-1-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `socketuser1${Date.now()}`
  };
  
  const testUser2 = {
    email: `socket-test-2-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `socketuser2${Date.now()}`
  };

  beforeAll(async () => {
    app = build({ logger: false });
    await app.listen({ port: 3004, host: '0.0.0.0' }); // Use different port for tests
    await new Promise(resolve => setTimeout(resolve, 1000));

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

    // Create test server and channel
    const serverResponse = await request(app.server)
      .post('/api/servers')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({
        name: 'Test Server',
        description: 'Test server for socket tests'
      });

    serverId = serverResponse.body.server.id;

    const channelResponse = await request(app.server)
      .post(`/api/servers/${serverId}/channels`)
      .set('Authorization', `Bearer ${authToken1}`)
      .send({
        name: 'test-channel',
        type: 'text'
      });

    channelId = channelResponse.body.channel.id;

    // Join server with second user
    await request(app.server)
      .post(`/api/servers/${serverId}/join`)
      .set('Authorization', `Bearer ${authToken2}`)
      .send({ inviteCode: serverResponse.body.server.inviteCode });
  }, 30000);

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    if (clientSocket2?.connected) {
      clientSocket2.disconnect();
    }
    await app.close();
  }, 10000);

  describe('Socket Connection Tests', () => {
    it('should establish socket connection with valid auth token', (done) => {
      clientSocket = io('http://localhost:3004', {
        auth: {
          token: authToken1
        },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    }, 10000);

    it('should reject socket connection with invalid auth token', (done) => {
      const invalidSocket = io('http://localhost:3004', {
        auth: {
          token: 'invalid_token'
        },
        transports: ['websocket']
      });

      invalidSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        invalidSocket.disconnect();
        done();
      });

      invalidSocket.on('connect', () => {
        invalidSocket.disconnect();
        done(new Error('Should not connect with invalid token'));
      });
    }, 10000);

    it('should handle reconnection gracefully', (done) => {
      const reconnectSocket = io('http://localhost:3004', {
        auth: {
          token: authToken1
        },
        transports: ['websocket']
      });

      let connectCount = 0;

      reconnectSocket.on('connect', () => {
        connectCount++;
        if (connectCount === 1) {
          // First connection - disconnect to test reconnection
          reconnectSocket.disconnect();
          setTimeout(() => {
            reconnectSocket.connect();
          }, 100);
        } else if (connectCount === 2) {
          // Reconnected successfully
          reconnectSocket.disconnect();
          done();
        }
      });

      reconnectSocket.on('connect_error', done);
    }, 10000);
  });

  describe('Real-time Messaging Tests', () => {
    beforeAll((done) => {
      // Ensure both clients are connected
      let connectCount = 0;
      
      clientSocket2 = io('http://localhost:3004', {
        auth: {
          token: authToken2
        },
        transports: ['websocket']
      });

      const checkConnections = () => {
        connectCount++;
        if (connectCount === 2) {
          done();
        }
      };

      if (!clientSocket.connected) {
        clientSocket.on('connect', checkConnections);
      } else {
        checkConnections();
      }

      clientSocket2.on('connect', checkConnections);
    }, 10000);

    it('should send and receive direct messages', (done) => {
      const messageContent = 'Hello from socket test!';
      
      clientSocket2.on('direct_message', (data) => {
        expect(data.content).toBe(messageContent);
        expect(data.senderId).toBeDefined();
        done();
      });

      clientSocket.emit('send_direct_message', {
        recipientId: testUser2.username,
        content: messageContent
      });
    }, 10000);

    it('should send and receive channel messages', (done) => {
      const messageContent = 'Channel message test';
      
      // Both clients join the channel
      clientSocket.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      clientSocket2.on('channel_message', (data) => {
        expect(data.content).toBe(messageContent);
        expect(data.channelId).toBe(channelId);
        expect(data.author).toBeDefined();
        done();
      });

      setTimeout(() => {
        clientSocket.emit('send_channel_message', {
          channelId,
          content: messageContent
        });
      }, 500);
    }, 10000);

    it('should handle message reactions in real-time', (done) => {
      const messageContent = 'React to this message';
      let messageId: string;

      clientSocket.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      clientSocket2.on('channel_message', (data) => {
        messageId = data.id;
        
        // Add reaction
        clientSocket.emit('add_reaction', {
          messageId,
          emoji: '👍'
        });
      });

      clientSocket2.on('message_reaction_added', (data) => {
        expect(data.messageId).toBe(messageId);
        expect(data.emoji).toBe('👍');
        expect(data.userId).toBeDefined();
        done();
      });

      clientSocket.emit('send_channel_message', {
        channelId,
        content: messageContent
      });
    }, 15000);

    it('should show typing indicators', (done) => {
      clientSocket.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      clientSocket2.on('user_typing', (data) => {
        expect(data.channelId).toBe(channelId);
        expect(data.userId).toBeDefined();
        expect(data.username).toBe(testUser1.username);
        done();
      });

      clientSocket.emit('typing_start', { channelId });
    }, 10000);

    it('should handle typing stop events', (done) => {
      clientSocket.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      let typingStartReceived = false;

      clientSocket2.on('user_typing', () => {
        typingStartReceived = true;
      });

      clientSocket2.on('user_typing_stop', (data) => {
        expect(typingStartReceived).toBe(true);
        expect(data.channelId).toBe(channelId);
        expect(data.userId).toBeDefined();
        done();
      });

      clientSocket.emit('typing_start', { channelId });
      
      setTimeout(() => {
        clientSocket.emit('typing_stop', { channelId });
      }, 1000);
    }, 15000);
  });

  describe('Presence and Status Tests', () => {
    it('should track user online status', (done) => {
      clientSocket2.on('user_status_changed', (data) => {
        expect(data.userId).toBeDefined();
        expect(['online', 'offline', 'away', 'dnd']).toContain(data.status);
        done();
      });

      clientSocket.emit('update_status', { status: 'away' });
    }, 10000);

    it('should show user presence in channels', (done) => {
      clientSocket.emit('join_channel', { channelId });

      clientSocket.on('channel_users_updated', (data) => {
        expect(data.channelId).toBe(channelId);
        expect(Array.isArray(data.users)).toBe(true);
        expect(data.users.length).toBeGreaterThan(0);
        done();
      });

      clientSocket2.emit('join_channel', { channelId });
    }, 10000);
  });

  describe('Voice Chat Integration Tests', () => {
    it('should handle voice channel join requests', (done) => {
      const voiceChannelData = {
        channelId,
        audioEnabled: true,
        videoEnabled: false
      };

      clientSocket.on('voice_channel_joined', (data) => {
        expect(data.channelId).toBe(channelId);
        expect(data.participants).toBeDefined();
        done();
      });

      clientSocket.emit('join_voice_channel', voiceChannelData);
    }, 10000);

    it('should notify users of voice channel events', (done) => {
      clientSocket.emit('join_channel', { channelId });
      clientSocket2.emit('join_channel', { channelId });

      clientSocket2.on('user_joined_voice', (data) => {
        expect(data.channelId).toBe(channelId);
        expect(data.userId).toBeDefined();
        done();
      });

      clientSocket.emit('join_voice_channel', {
        channelId,
        audioEnabled: true,
        videoEnabled: false
      });
    }, 10000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed message payloads', (done) => {
      clientSocket.on('error', (data) => {
        expect(data.type).toBe('validation_error');
        done();
      });

      clientSocket.emit('send_channel_message', {
        // Missing required fields
        content: ''
      });
    }, 10000);

    it('should handle unauthorized channel access', (done) => {
      const unauthorizedChannelId = 'unauthorized_channel_id';

      clientSocket.on('error', (data) => {
        expect(data.type).toBe('unauthorized');
        expect(data.message).toContain('access');
        done();
      });

      clientSocket.emit('send_channel_message', {
        channelId: unauthorizedChannelId,
        content: 'This should fail'
      });
    }, 10000);

    it('should handle connection drops gracefully', (done) => {
      let disconnectCount = 0;
      let reconnectCount = 0;

      const testSocket = io('http://localhost:3004', {
        auth: {
          token: authToken1
        },
        transports: ['websocket']
      });

      testSocket.on('disconnect', () => {
        disconnectCount++;
      });

      testSocket.on('connect', () => {
        if (reconnectCount === 0) {
          reconnectCount++;
          // Simulate connection drop
          testSocket.disconnect();
          setTimeout(() => {
            testSocket.connect();
          }, 100);
        } else {
          // Reconnected
          expect(disconnectCount).toBe(1);
          testSocket.disconnect();
          done();
        }
      });
    }, 15000);
  });

  describe('Message History and Persistence', () => {
    it('should load message history when joining channel', (done) => {
      // Send a message first
      clientSocket.emit('send_channel_message', {
        channelId,
        content: 'Historical message'
      });

      setTimeout(() => {
        const newSocket = io('http://localhost:3004', {
          auth: {
            token: authToken2
          },
          transports: ['websocket']
        });

        newSocket.on('connect', () => {
          newSocket.emit('join_channel', { channelId });
        });

        newSocket.on('message_history', (data) => {
          expect(Array.isArray(data.messages)).toBe(true);
          expect(data.messages.length).toBeGreaterThan(0);
          expect(data.messages.some((msg: any) => msg.content === 'Historical message')).toBe(true);
          newSocket.disconnect();
          done();
        });
      }, 1000);
    }, 15000);
  });

  describe('Rate Limiting and Spam Protection', () => {
    it('should enforce message rate limits', (done) => {
      let messagesSent = 0;
      let rateLimitHit = false;

      clientSocket.on('rate_limit_exceeded', () => {
        rateLimitHit = true;
        expect(messagesSent).toBeGreaterThan(5);
        done();
      });

      const sendMessage = () => {
        if (messagesSent < 20 && !rateLimitHit) {
          clientSocket.emit('send_channel_message', {
            channelId,
            content: `Spam message ${messagesSent}`
          });
          messagesSent++;
          setTimeout(sendMessage, 50);
        } else if (!rateLimitHit) {
          done(new Error('Rate limit not enforced'));
        }
      };

      sendMessage();
    }, 15000);
  });

  describe('Server Events and Notifications', () => {
    it('should notify users of server events', (done) => {
      clientSocket.emit('join_server', { serverId });
      clientSocket2.emit('join_server', { serverId });

      clientSocket2.on('server_event', (data) => {
        expect(data.type).toBe('member_joined');
        expect(data.serverId).toBe(serverId);
        done();
      });

      // Create a new user and join the server
      setTimeout(async () => {
        const newUser = {
          email: `new-member-${Date.now()}@example.com`,
          password: 'SecurePassword123!',
          username: `newmember${Date.now()}`
        };

        await request(app.server)
          .post('/api/auth/register')
          .send(newUser);

        const loginResponse = await request(app.server)
          .post('/api/auth/login')
          .send({
            email: newUser.email,
            password: newUser.password
          });

        await request(app.server)
          .post(`/api/servers/${serverId}/join`)
          .set('Authorization', `Bearer ${loginResponse.body.token}`)
          .send({ inviteCode: 'test_invite' });
      }, 500);
    }, 15000);
  });
});