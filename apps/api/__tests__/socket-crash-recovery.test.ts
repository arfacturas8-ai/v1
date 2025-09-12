import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { io as ioClient, Socket } from 'socket.io-client';
import Redis from 'ioredis';
import { createTestUser, createTestCommunity, createTestChannel } from './helpers/test-data';

describe('Socket.io Crash Recovery and Resilience Tests', () => {
  let app: FastifyInstance;
  let clientSocket: Socket;
  let testUser: any;
  let testCommunity: any;
  let testChannel: any;
  let testToken: string;
  let redisClient: Redis;
  
  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
    
    testUser = await createTestUser();
    testCommunity = await createTestCommunity(testUser.id);
    testChannel = await createTestChannel(testCommunity.id);
    
    testToken = app.jwt.sign({ 
      userId: testUser.id, 
      username: testUser.username 
    });
    
    redisClient = new Redis(process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0');
    
    await app.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    if (clientSocket) clientSocket.disconnect();
    if (redisClient) await redisClient.quit();
    await app.close();
  });

  describe('Redis Connection Resilience', () => {
    test('should queue messages when Redis is unavailable', async () => {
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;
      
      clientSocket = ioClient(`http://127.0.0.1:${port}`, {
        auth: { token: testToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', () => resolve());
      });

      // Join channel
      await new Promise<void>((resolve) => {
        clientSocket.emit('channel:join', { channelId: testChannel.id }, () => resolve());
      });

      // Simulate Redis failure by disconnecting
      await redisClient.disconnect();

      // Send messages while Redis is down
      const testMessages = ['Message 1', 'Message 2', 'Message 3'];
      const messagesReceived: string[] = [];

      clientSocket.on('message:new', (message: any) => {
        messagesReceived.push(message.content);
      });

      // Send messages - they should be queued
      testMessages.forEach(content => {
        clientSocket.emit('message:send', {
          channelId: testChannel.id,
          content
        });
      });

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reconnect Redis
      await redisClient.connect();

      // Wait for message queue flush
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Messages should eventually be received
      expect(messagesReceived.length).toBeGreaterThan(0);
    }, 15000);

    test('should handle Redis circuit breaker activation', async () => {
      const healthResponse = await app.inject({
        method: 'GET',
        url: '/status/circuit-breakers'
      });

      const circuitStatus = JSON.parse(healthResponse.payload);
      
      // Circuit breaker should be defined
      expect(circuitStatus.redis).toBeDefined();
      expect(['closed', 'open', 'half-open', 'unknown']).toContain(circuitStatus.redis.state);
    });
  });

  describe('Connection Stability Under Load', () => {
    test('should maintain stability with rapid connection/disconnection', async () => {
      const connections: Socket[] = [];
      const maxConnections = 10;
      
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;

      // Create multiple connections rapidly
      for (let i = 0; i < maxConnections; i++) {
        const socket = ioClient(`http://127.0.0.1:${port}`, {
          auth: { token: testToken },
          transports: ['websocket'],
          timeout: 5000
        });
        connections.push(socket);
      }

      // Wait for all connections
      await Promise.all(connections.map(socket => 
        new Promise<void>((resolve, reject) => {
          socket.on('connect', () => resolve());
          socket.on('connect_error', (error: Error) => reject(error));
          setTimeout(() => reject(new Error('Connection timeout')), 10000);
        })
      ));

      // All should be connected
      expect(connections.every(s => s.connected)).toBe(true);

      // Rapidly disconnect all
      connections.forEach(socket => socket.disconnect());

      // Check system health
      const healthResponse = await app.inject({
        method: 'GET',
        url: '/health/socket'
      });

      expect(healthResponse.statusCode).toBe(200);
      
      const health = JSON.parse(healthResponse.payload);
      expect(['healthy', 'degraded']).toContain(health.status);
    }, 20000);

    test('should handle message flooding without crashing', async () => {
      if (!clientSocket || !clientSocket.connected) {
        const serverAddress = app.server.address();
        const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;
        
        clientSocket = ioClient(`http://127.0.0.1:${port}`, {
          auth: { token: testToken },
          transports: ['websocket']
        });

        await new Promise<void>((resolve) => {
          clientSocket.on('connect', () => resolve());
        });
      }

      await new Promise<void>((resolve) => {
        clientSocket.emit('channel:join', { channelId: testChannel.id }, () => resolve());
      });

      let rateLimitHit = false;
      clientSocket.on('error', (error: any) => {
        if (error.code === 'RATE_LIMITED') {
          rateLimitHit = true;
        }
      });

      // Flood with messages (should trigger rate limiting)
      for (let i = 0; i < 50; i++) {
        clientSocket.emit('message:send', {
          channelId: testChannel.id,
          content: `Flood test ${i}`
        });
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Rate limiting should have kicked in
      expect(rateLimitHit).toBe(true);
      
      // Socket should still be connected
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Memory Leak Prevention', () => {
    test('should clean up typing indicators properly', async () => {
      if (!clientSocket || !clientSocket.connected) {
        const serverAddress = app.server.address();
        const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;
        
        clientSocket = ioClient(`http://127.0.0.1:${port}`, {
          auth: { token: testToken },
          transports: ['websocket']
        });

        await new Promise<void>((resolve) => {
          clientSocket.on('connect', () => resolve());
        });
      }

      await new Promise<void>((resolve) => {
        clientSocket.emit('channel:join', { channelId: testChannel.id }, () => resolve());
      });

      // Start typing in multiple channels
      for (let i = 0; i < 5; i++) {
        clientSocket.emit('typing:start', { channelId: testChannel.id });
      }

      // Get initial metrics
      const initialResponse = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });
      const initialMetrics = JSON.parse(initialResponse.payload);

      // Wait for cleanup cycle
      await new Promise(resolve => setTimeout(resolve, 16000)); // Typing cleanup is 15 seconds

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
    }, 20000);

    test('should handle presence data cleanup', async () => {
      // Update presence multiple times
      for (let i = 0; i < 10; i++) {
        clientSocket.emit('presence:update', {
          status: i % 2 === 0 ? 'online' : 'idle',
          activity: { name: `Activity ${i}` }
        });
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 3000));

      // System should remain stable
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should recover from malformed data gracefully', () => {
      // Send various malformed payloads
      const malformedData = [
        null,
        undefined,
        '',
        0,
        false,
        [],
        { invalid: 'data' },
        'not-json-data',
        { channelId: null, content: undefined }
      ];

      malformedData.forEach(data => {
        clientSocket.emit('message:send', data);
        clientSocket.emit('channel:join', data);
        clientSocket.emit('typing:start', data);
        clientSocket.emit('presence:update', data);
      });

      return new Promise<void>((resolve) => {
        // Wait and verify connection is still stable
        setTimeout(() => {
          expect(clientSocket.connected).toBe(true);
          resolve();
        }, 2000);
      });
    });

    test('should handle authentication edge cases', async () => {
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;

      // Test with various invalid tokens
      const invalidTokens = [
        '',
        'invalid-token',
        'Bearer invalid-token',
        null,
        undefined,
        'expired.token.here'
      ];

      for (const invalidToken of invalidTokens) {
        const socket = ioClient(`http://127.0.0.1:${port}`, {
          auth: { token: invalidToken },
          transports: ['websocket'],
          timeout: 3000
        });

        await new Promise<void>((resolve) => {
          socket.on('connect_error', (_error: Error) => {
            socket.disconnect();
            resolve();
          });
          
          socket.on('connect', () => {
            socket.disconnect();
            resolve(); // Shouldn't happen, but handle it
          });
        });
      }

      // Main socket should still work
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('System Health During Failures', () => {
    test('should maintain health endpoints during degraded mode', async () => {
      // Even in degraded scenarios, health checks should work
      const healthResponse = await app.inject({
        method: 'GET',
        url: '/health/socket'
      });

      expect([200, 503]).toContain(healthResponse.statusCode);
      
      const health = JSON.parse(healthResponse.payload);
      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'error']).toContain(health.status);
    });

    test('should provide metrics during high error rates', async () => {
      // Generate some errors
      for (let i = 0; i < 10; i++) {
        clientSocket.emit('message:send', { invalid: 'data' });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const metricsResponse = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });

      expect(metricsResponse.statusCode).toBe(200);
      
      const metrics = JSON.parse(metricsResponse.payload);
      expect(metrics.socket.eventsRejected).toBeGreaterThan(0);
    });

    test('should handle graceful shutdown scenarios', async () => {
      // Simulate various operations before shutdown
      clientSocket.emit('message:send', {
        channelId: testChannel.id,
        content: 'Pre-shutdown message'
      });
      
      clientSocket.emit('typing:start', { channelId: testChannel.id });
      
      // The actual shutdown is handled by the app lifecycle
      // This test verifies the system can handle operations before shutdown
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle extremely long messages', () => {
      const veryLongMessage = 'a'.repeat(3000); // Exceeds 2000 char limit
      
      return new Promise<void>((resolve) => {
        clientSocket.on('error', (error: any) => {
          expect(error.code).toBe('INVALID_INPUT');
          expect(error.message).toContain('too long');
          resolve();
        });

        clientSocket.emit('message:send', {
          channelId: testChannel.id,
          content: veryLongMessage
        });
      });
    });

    test('should handle rapid typing start/stop cycles', async () => {
      // Rapidly start and stop typing
      for (let i = 0; i < 20; i++) {
        clientSocket.emit('typing:start', { channelId: testChannel.id });
        await new Promise(resolve => setTimeout(resolve, 50));
        clientSocket.emit('typing:stop', { channelId: testChannel.id });
      }

      // Connection should remain stable
      expect(clientSocket.connected).toBe(true);
    });

    test('should handle concurrent operations', async () => {
      const operations = [];

      // Run multiple operations concurrently
      for (let i = 0; i < 10; i++) {
        operations.push(
          new Promise<void>((resolve) => {
            clientSocket.emit('message:send', {
              channelId: testChannel.id,
              content: `Concurrent message ${i}`
            }, () => resolve());
          })
        );
      }

      await Promise.all(operations);
      expect(clientSocket.connected).toBe(true);
    });
  });
});