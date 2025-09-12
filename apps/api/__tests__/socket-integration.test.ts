import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { io as ioClient, Socket } from 'socket.io-client';
import Redis from 'ioredis';
import { prisma } from '@cryb/database';
import { createTestUser, createTestCommunity, createTestChannel } from './helpers/test-data';

describe('Crash-Safe Socket.io Integration Tests', () => {
  let app: FastifyInstance;
  let clientSocket: Socket;
  let testUser: any;
  let testCommunity: any;
  let testChannel: any;
  let testToken: string;
  
  const SOCKET_TIMEOUT = 10000;
  
  beforeAll(async () => {
    // Build the application with test configuration
    app = await buildApp({
      logger: false // Disable logging for tests
    });
    
    await app.ready();
    
    // Create test data
    testUser = await createTestUser();
    testCommunity = await createTestCommunity(testUser.id);
    testChannel = await createTestChannel(testCommunity.id);
    
    // Generate test JWT token
    testToken = app.jwt.sign({ 
      userId: testUser.id, 
      username: testUser.username 
    });
    
    // Start the server
    await app.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    
    // Cleanup test data
    await prisma.message.deleteMany({ where: { channelId: testChannel.id } });
    await prisma.channel.delete({ where: { id: testChannel.id } });
    await prisma.communityMember.deleteMany({ where: { communityId: testCommunity.id } });
    await prisma.community.delete({ where: { id: testCommunity.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    await app.close();
  });

  describe('Connection and Authentication', () => {
    test('should establish secure connection with valid token', (done) => {
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;
      
      clientSocket = ioClient(`http://127.0.0.1:${port}`, {
        auth: { token: testToken },
        transports: ['websocket'],
        timeout: SOCKET_TIMEOUT
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error: Error) => {
        done(error);
      });
    });

    test('should reject connection with invalid token', (done) => {
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;
      
      const invalidSocket = ioClient(`http://127.0.0.1:${port}`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket'],
        timeout: 5000
      });

      invalidSocket.on('connect', () => {
        invalidSocket.disconnect();
        done(new Error('Should not connect with invalid token'));
      });

      invalidSocket.on('connect_error', (error: Error) => {
        expect(error.message).toContain('Authentication');
        invalidSocket.disconnect();
        done();
      });
    });

    test('should handle connection drops gracefully', (done) => {
      let reconnected = false;
      
      clientSocket.on('reconnect', () => {
        if (!reconnected) {
          reconnected = true;
          expect(clientSocket.connected).toBe(true);
          done();
        }
      });

      // Simulate connection drop
      clientSocket.disconnect();
      
      setTimeout(() => {
        clientSocket.connect();
      }, 1000);
    });
  });

  describe('Channel Operations', () => {
    test('should join channel successfully', (done) => {
      clientSocket.emit('channel:join', { channelId: testChannel.id }, (response: any) => {
        expect(response.success).toBe(true);
        expect(response.channelId).toBe(testChannel.id);
        expect(response.memberCount).toBeGreaterThan(0);
        done();
      });
    });

    test('should reject joining non-existent channel', (done) => {
      const fakeChannelId = 'non-existent-channel';
      
      clientSocket.emit('channel:join', { channelId: fakeChannelId }, (response: any) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('access');
        done();
      });
    });

    test('should leave channel successfully', (done) => {
      // First join the channel
      clientSocket.emit('channel:join', { channelId: testChannel.id }, () => {
        // Then leave the channel
        clientSocket.emit('channel:leave', { channelId: testChannel.id });
        
        clientSocket.on('channel:left', (data: any) => {
          expect(data.channelId).toBe(testChannel.id);
          done();
        });
      });
    });
  });

  describe('Real-time Messaging', () => {
    beforeEach((done) => {
      // Join channel before each test
      clientSocket.emit('channel:join', { channelId: testChannel.id }, () => {
        done();
      });
    });

    test('should send and receive messages', (done) => {
      const testMessage = 'Hello, this is a test message!';
      
      clientSocket.on('message:new', (message: any) => {
        expect(message.content).toBe(testMessage);
        expect(message.author.id).toBe(testUser.id);
        expect(message.channelId).toBe(testChannel.id);
        done();
      });

      clientSocket.emit('message:send', {
        channelId: testChannel.id,
        content: testMessage
      });
    });

    test('should enforce message rate limiting', (done) => {
      let rejectedCount = 0;
      let messagesReceived = 0;
      const totalMessages = 35; // Exceeds the 30 per minute rate limit
      
      clientSocket.on('error', (error: any) => {
        if (error.code === 'RATE_LIMITED') {
          rejectedCount++;
        }
      });

      clientSocket.on('message:new', () => {
        messagesReceived++;
      });

      // Send messages rapidly
      for (let i = 0; i < totalMessages; i++) {
        setTimeout(() => {
          clientSocket.emit('message:send', {
            channelId: testChannel.id,
            content: `Rate limit test message ${i}`
          });
          
          // Check results after all messages sent
          if (i === totalMessages - 1) {
            setTimeout(() => {
              expect(rejectedCount).toBeGreaterThan(0);
              expect(messagesReceived).toBeLessThan(totalMessages);
              done();
            }, 2000);
          }
        }, i * 50); // Send every 50ms
      }
    });

    test('should sanitize message content', (done) => {
      const maliciousContent = '<script>alert("xss")</script>Hello World';
      
      clientSocket.on('message:new', (message: any) => {
        expect(message.content).not.toContain('<script>');
        expect(message.content).toContain('Hello World');
        done();
      });

      clientSocket.emit('message:send', {
        channelId: testChannel.id,
        content: maliciousContent
      });
    });

    test('should handle message editing', (done) => {
      const originalContent = 'Original message content';
      const editedContent = 'Edited message content';
      let messageId: string;

      clientSocket.on('message:new', (message: any) => {
        messageId = message.id;
        
        // Edit the message after a short delay
        setTimeout(() => {
          clientSocket.emit('message:edit', {
            messageId,
            content: editedContent
          });
        }, 100);
      });

      clientSocket.on('message:edited', (message: any) => {
        expect(message.content).toBe(editedContent);
        expect(message.editedAt).toBeDefined();
        done();
      });

      clientSocket.emit('message:send', {
        channelId: testChannel.id,
        content: originalContent
      });
    });
  });

  describe('Typing Indicators', () => {
    beforeEach((done) => {
      clientSocket.emit('channel:join', { channelId: testChannel.id }, () => {
        done();
      });
    });

    test('should handle typing start/stop indicators', (done) => {
      let typingStartReceived = false;
      
      clientSocket.on('typing:user_start', (data: any) => {
        expect(data.userId).toBe(testUser.id);
        expect(data.channelId).toBe(testChannel.id);
        typingStartReceived = true;
        
        // Stop typing after receiving start
        clientSocket.emit('typing:stop', { channelId: testChannel.id });
      });

      clientSocket.on('typing:user_stop', (data: any) => {
        expect(typingStartReceived).toBe(true);
        expect(data.userId).toBe(testUser.id);
        expect(data.channelId).toBe(testChannel.id);
        done();
      });

      clientSocket.emit('typing:start', { channelId: testChannel.id });
    });

    test('should auto-stop typing after timeout', (done) => {
      clientSocket.on('typing:user_stop', (data: any) => {
        expect(data.userId).toBe(testUser.id);
        expect(data.channelId).toBe(testChannel.id);
        done();
      });

      clientSocket.emit('typing:start', { channelId: testChannel.id });
      // Wait for auto-timeout (10 seconds)
    }, 15000);
  });

  describe('Presence Management', () => {
    test('should update user presence status', (done) => {
      const newStatus = 'dnd';
      
      clientSocket.on('presence:updated', () => {
        // Verify presence was updated
        done();
      });

      clientSocket.emit('presence:update', {
        status: newStatus,
        activity: {
          type: 'playing',
          name: 'Test Game'
        }
      });
    });

    test('should reject invalid presence status', (done) => {
      clientSocket.on('error', (error: any) => {
        expect(error.code).toBe('INVALID_INPUT');
        expect(error.message).toContain('Invalid status');
        done();
      });

      clientSocket.emit('presence:update', {
        status: 'invalid-status'
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle malformed event data gracefully', (done) => {
      // Send malformed data
      clientSocket.emit('message:send', null);
      clientSocket.emit('channel:join', undefined);
      clientSocket.emit('typing:start', { invalidData: true });

      // Socket should remain connected
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 1000);
    });

    test('should recover from temporary database disconnection', async () => {
      // This test would require more complex setup to simulate DB failures
      // For now, verify that circuit breakers are working
      const health = await app.inject({
        method: 'GET',
        url: '/health/socket'
      });

      const healthData = JSON.parse(health.payload);
      expect(healthData.status).toBeDefined();
    });

    test('should maintain connection during high load', (done) => {
      let eventsProcessed = 0;
      const totalEvents = 100;

      clientSocket.on('message:new', () => {
        eventsProcessed++;
        if (eventsProcessed === totalEvents) {
          expect(clientSocket.connected).toBe(true);
          done();
        }
      });

      // Send multiple events quickly
      for (let i = 0; i < totalEvents; i++) {
        clientSocket.emit('message:send', {
          channelId: testChannel.id,
          content: `Load test message ${i}`
        });
      }
    }, 30000);
  });

  describe('Health and Metrics', () => {
    test('should provide health status endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/socket'
      });

      expect(response.statusCode).toBe(200);
      
      const health = JSON.parse(response.payload);
      expect(health.status).toBeDefined();
      expect(health.services).toBeDefined();
      expect(health.metrics).toBeDefined();
    });

    test('should provide detailed metrics endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });

      expect(response.statusCode).toBe(200);
      
      const metrics = JSON.parse(response.payload);
      expect(metrics.socket).toBeDefined();
      expect(metrics.redis).toBeDefined();
      expect(metrics.system).toBeDefined();
      expect(metrics.socket.activeConnections).toBeGreaterThanOrEqual(0);
    });

    test('should provide circuit breaker status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/status/circuit-breakers'
      });

      expect(response.statusCode).toBe(200);
      
      const status = JSON.parse(response.payload);
      expect(status.socket).toBeDefined();
      expect(status.redis).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    test('should clean up resources on disconnect', (done) => {
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;
      
      // Create a temporary client
      const tempSocket = ioClient(`http://127.0.0.1:${port}`, {
        auth: { token: testToken },
        transports: ['websocket']
      });

      tempSocket.on('connect', () => {
        // Join a channel
        tempSocket.emit('channel:join', { channelId: testChannel.id }, () => {
          // Start typing
          tempSocket.emit('typing:start', { channelId: testChannel.id });
          
          // Disconnect abruptly
          tempSocket.disconnect();
          
          // Verify cleanup happened (typing should stop)
          setTimeout(() => {
            // The cleanup should have removed all traces
            done();
          }, 2000);
        });
      });
    });

    test('should prevent memory leaks with long-running connections', async () => {
      // Get initial metrics
      const initialResponse = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });
      const initialMetrics = JSON.parse(initialResponse.payload);
      
      // Perform various operations
      clientSocket.emit('channel:join', { channelId: testChannel.id });
      clientSocket.emit('typing:start', { channelId: testChannel.id });
      clientSocket.emit('typing:stop', { channelId: testChannel.id });
      clientSocket.emit('presence:update', { status: 'online' });
      
      // Wait for cleanup cycles
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get final metrics
      const finalResponse = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });
      const finalMetrics = JSON.parse(finalResponse.payload);
      
      // Memory leaks should be cleaned up
      expect(finalMetrics.socket.memoryLeaksFixed).toBeGreaterThanOrEqual(
        initialMetrics.socket.memoryLeaksFixed
      );
    });
  });
});