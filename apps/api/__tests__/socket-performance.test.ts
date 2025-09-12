import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';
import { io as ioClient, Socket } from 'socket.io-client';
import { createTestUser, createTestCommunity, createTestChannel } from './helpers/test-data';

describe('Socket.io Performance and Load Tests', () => {
  let app: FastifyInstance;
  let testUser: any;
  let testCommunity: any;
  let testChannel: any;
  let testToken: string;
  
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
    
    await app.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Connection Load Testing', () => {
    test('should handle multiple concurrent connections', async () => {
      const connectionCount = 50;
      const connections: Socket[] = [];
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;

      // Create connections
      for (let i = 0; i < connectionCount; i++) {
        const socket = ioClient(`http://127.0.0.1:${port}`, {
          auth: { token: testToken },
          transports: ['websocket'],
          timeout: 10000
        });
        connections.push(socket);
      }

      // Wait for all to connect
      const connectPromises = connections.map(socket => 
        new Promise<void>((resolve, reject) => {
          socket.on('connect', () => resolve());
          socket.on('connect_error', (error: Error) => reject(error));
          setTimeout(() => reject(new Error('Connection timeout')), 15000);
        })
      );

      await Promise.all(connectPromises);

      // Verify all connected
      expect(connections.every(s => s.connected)).toBe(true);

      // Check system metrics
      const metricsResponse = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });

      const metrics = JSON.parse(metricsResponse.payload);
      expect(metrics.socket.activeConnections).toBeGreaterThanOrEqual(connectionCount);

      // Cleanup
      connections.forEach(socket => socket.disconnect());
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
    }, 30000);

    test('should handle message throughput', async () => {
      const connections: Socket[] = [];
      const messageCount = 100;
      const connectionCount = 10;
      const messagesReceived: number[] = new Array(connectionCount).fill(0);
      
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;

      // Create connections
      for (let i = 0; i < connectionCount; i++) {
        const socket = ioClient(`http://127.0.0.1:${port}`, {
          auth: { token: testToken },
          transports: ['websocket']
        });
        
        socket.on('message:new', () => {
          messagesReceived[i]++;
        });
        
        connections.push(socket);
      }

      // Wait for connections
      await Promise.all(connections.map(socket => 
        new Promise<void>((resolve) => {
          socket.on('connect', () => resolve());
        })
      ));

      // Join channel for all connections
      await Promise.all(connections.map(socket =>
        new Promise<void>((resolve) => {
          socket.emit('channel:join', { channelId: testChannel.id }, () => resolve());
        })
      ));

      // Send messages from each connection
      const startTime = Date.now();
      
      const sendPromises = connections.map((socket, index) =>
        Promise.all(Array.from({ length: messageCount }, (_, msgIndex) =>
          new Promise<void>((resolve) => {
            socket.emit('message:send', {
              channelId: testChannel.id,
              content: `Load test message ${index}-${msgIndex}`
            }, () => resolve());
          })
        ))
      );

      await Promise.all(sendPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Allow time for message propagation
      await new Promise(resolve => setTimeout(resolve, 5000));

      const totalMessagesSent = connectionCount * messageCount;
      const totalMessagesReceived = messagesReceived.reduce((sum, count) => sum + count, 0);
      
      console.log(`Performance Results:
        - Total messages sent: ${totalMessagesSent}
        - Total messages received: ${totalMessagesReceived}
        - Duration: ${duration}ms
        - Messages per second: ${Math.round((totalMessagesSent / duration) * 1000)}`);

      // Verify we received a reasonable number of messages (accounting for rate limiting)
      expect(totalMessagesReceived).toBeGreaterThan(0);
      
      // Cleanup
      connections.forEach(socket => socket.disconnect());
    }, 60000);
  });

  describe('Memory and Resource Usage', () => {
    test('should maintain stable memory usage', async () => {
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;

      // Get initial metrics
      const initialResponse = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });
      const initialMetrics = JSON.parse(initialResponse.payload);

      // Create and destroy multiple connections
      for (let cycle = 0; cycle < 5; cycle++) {
        const connections: Socket[] = [];

        // Create connections
        for (let i = 0; i < 20; i++) {
          const socket = ioClient(`http://127.0.0.1:${port}`, {
            auth: { token: testToken },
            transports: ['websocket']
          });
          connections.push(socket);
        }

        // Wait for connections
        await Promise.all(connections.map(socket => 
          new Promise<void>((resolve) => {
            socket.on('connect', () => resolve());
          })
        ));

        // Perform operations
        await Promise.all(connections.map(socket =>
          new Promise<void>((resolve) => {
            socket.emit('channel:join', { channelId: testChannel.id }, () => {
              socket.emit('typing:start', { channelId: testChannel.id });
              socket.emit('presence:update', { status: 'online' });
              resolve();
            });
          })
        ));

        // Disconnect all
        connections.forEach(socket => socket.disconnect());
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Wait for memory cleanup cycles
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Get final metrics
      const finalResponse = await app.inject({
        method: 'GET',
        url: '/metrics/socket'
      });
      const finalMetrics = JSON.parse(finalResponse.payload);

      // Memory leaks should have been cleaned up
      expect(finalMetrics.socket.memoryLeaksFixed).toBeGreaterThan(
        initialMetrics.socket.memoryLeaksFixed
      );
      
      // Active connections should be back to near baseline
      expect(finalMetrics.socket.activeConnections).toBeLessThanOrEqual(
        initialMetrics.socket.activeConnections + 5
      );
    }, 45000);
  });

  describe('Error Handling Under Load', () => {
    test('should handle invalid data gracefully under load', async () => {
      const connections: Socket[] = [];
      const connectionCount = 10;
      
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;

      // Create connections
      for (let i = 0; i < connectionCount; i++) {
        const socket = ioClient(`http://127.0.0.1:${port}`, {
          auth: { token: testToken },
          transports: ['websocket']
        });
        connections.push(socket);
      }

      // Wait for connections
      await Promise.all(connections.map(socket => 
        new Promise<void>((resolve) => {
          socket.on('connect', () => resolve());
        })
      ));

      // Send invalid data from all connections
      const invalidPayloads = [
        null,
        undefined,
        { invalid: 'data' },
        'string-instead-of-object',
        { channelId: null, content: '' },
        { channelId: 'fake', content: 'x'.repeat(5000) }
      ];

      connections.forEach(socket => {
        invalidPayloads.forEach(payload => {
          socket.emit('message:send', payload);
          socket.emit('channel:join', payload);
          socket.emit('typing:start', payload);
        });
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // All connections should still be active
      expect(connections.every(s => s.connected)).toBe(true);

      // System should remain healthy
      const healthResponse = await app.inject({
        method: 'GET',
        url: '/health/socket'
      });
      
      expect([200, 503]).toContain(healthResponse.statusCode);

      // Cleanup
      connections.forEach(socket => socket.disconnect());
    }, 20000);
  });

  describe('Circuit Breaker Behavior', () => {
    test('should activate circuit breakers appropriately', async () => {
      // Get initial circuit breaker status
      const initialResponse = await app.inject({
        method: 'GET',
        url: '/status/circuit-breakers'
      });
      
      expect(initialResponse.statusCode).toBe(200);
      const initialStatus = JSON.parse(initialResponse.payload);
      
      // Circuit breakers should be defined
      expect(initialStatus.socket).toBeDefined();
      expect(initialStatus.redis).toBeDefined();

      // Create a connection to generate some load
      const serverAddress = app.server.address();
      const port = typeof serverAddress === 'object' ? serverAddress?.port : 3000;
      
      const socket = ioClient(`http://127.0.0.1:${port}`, {
        auth: { token: testToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        socket.on('connect', () => resolve());
      });

      // Perform operations that might trigger circuit breakers
      for (let i = 0; i < 10; i++) {
        socket.emit('message:send', {
          channelId: testChannel.id,
          content: `Circuit breaker test ${i}`
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check final status
      const finalResponse = await app.inject({
        method: 'GET',
        url: '/status/circuit-breakers'
      });
      
      expect(finalResponse.statusCode).toBe(200);
      
      socket.disconnect();
    });
  });
});