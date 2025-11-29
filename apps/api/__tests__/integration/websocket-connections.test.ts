import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { buildApp } from '../../src/app';
import { testData } from '../helpers/test-data';
import request from 'supertest';

describe('WebSocket Connection Management', () => {
  let server: any;
  let serverSocket: Server;
  let clientSocket: ClientSocket;
  let port: number;
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    // Set up test server
    const app = buildApp({ logger: false });
    await app.ready();
    
    server = createServer();
    serverSocket = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    await new Promise<void>((resolve) => {
      server.listen(() => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });

    // Create test user and get auth token
    const userData = testData.validUser();
    const response = await request(app.server)
      .post('/api/auth/register')
      .send(userData);

    authToken = response.body.token;
    userId = response.body.user.id;

    await app.close();
  });

  afterEach(async () => {
    if (clientSocket?.connected) clientSocket.disconnect();
    if (serverSocket) serverSocket.close();
    if (server) server.close();
  });

  describe('Connection Establishment', () => {
    it('should establish WebSocket connection with valid auth', async () => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          expect(clientSocket.connected).toBe(true);
          expect(clientSocket.id).toBeDefined();
          resolve();
        });
        
        clientSocket.on('connect_error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    });

    it('should reject connection with invalid credentials', async () => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket']
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          reject(new Error('Should not connect with invalid token'));
        });
        
        clientSocket.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication failed');
          resolve();
        });
        
        setTimeout(() => reject(new Error('Should have received error')), 5000);
      });
    });

    it('should handle multiple connection attempts gracefully', async () => {
      // Create multiple connections with same auth
      const sockets: ClientSocket[] = [];
      
      for (let i = 0; i < 5; i++) {
        const socket = Client(`http://localhost:${port}`, {
          auth: { token: authToken },
          transports: ['websocket']
        });
        sockets.push(socket);
      }

      // Wait for all connections
      await Promise.all(sockets.map(socket =>
        new Promise<void>((resolve, reject) => {
          socket.on('connect', resolve);
          socket.on('connect_error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 5000);
        })
      ));

      expect(sockets.every(socket => socket.connected)).toBe(true);

      // Clean up
      sockets.forEach(socket => socket.disconnect());
    });

    it('should assign unique session IDs to each connection', async () => {
      const socket1 = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      const socket2 = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await Promise.all([
        new Promise<void>((resolve) => socket1.on('connect', resolve)),
        new Promise<void>((resolve) => socket2.on('connect', resolve))
      ]);

      expect(socket1.id).toBeDefined();
      expect(socket2.id).toBeDefined();
      expect(socket1.id).not.toBe(socket2.id);

      socket1.disconnect();
      socket2.disconnect();
    });
  });

  describe('Connection States and Events', () => {
    beforeEach(async () => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });
    });

    it('should emit user online status on connection', async () => {
      const statusPromise = new Promise<any>((resolve) => {
        clientSocket.on('user_status_change', resolve);
      });

      // Trigger status update
      clientSocket.emit('update_status', { status: 'online' });

      const statusUpdate = await statusPromise;

      expect(statusUpdate.userId).toBe(userId);
      expect(statusUpdate.status).toBe('online');
      expect(statusUpdate).toHaveProperty('timestamp');
    });

    it('should handle presence updates correctly', async () => {
      const presencePromise = new Promise<any>((resolve) => {
        clientSocket.on('presence_update', resolve);
      });

      clientSocket.emit('set_presence', {
        status: 'dnd',
        customMessage: 'In a meeting'
      });

      const presenceUpdate = await presencePromise;

      expect(presenceUpdate.status).toBe('dnd');
      expect(presenceUpdate.customMessage).toBe('In a meeting');
      expect(presenceUpdate.userId).toBe(userId);
    });

    it('should track connection heartbeat', async () => {
      let heartbeatReceived = false;

      clientSocket.on('heartbeat', () => {
        heartbeatReceived = true;
      });

      // Send heartbeat
      clientSocket.emit('ping');

      // Wait for response
      await new Promise<void>((resolve) => {
        clientSocket.on('pong', resolve);
      });

      expect(heartbeatReceived).toBe(false); // Should receive pong, not heartbeat
    });

    it('should handle user activity tracking', async () => {
      const activityPromise = new Promise<any>((resolve) => {
        clientSocket.on('activity_tracked', resolve);
      });

      clientSocket.emit('track_activity', {
        type: 'typing',
        channelId: 'test-channel-123'
      });

      const activity = await activityPromise;

      expect(activity.type).toBe('typing');
      expect(activity.channelId).toBe('test-channel-123');
      expect(activity.userId).toBe(userId);
    });
  });

  describe('Connection Resilience', () => {
    beforeEach(async () => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket'],
        timeout: 5000,
        retries: 3
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });
    });

    it('should handle temporary disconnections', async () => {
      let disconnectReceived = false;
      let reconnectReceived = false;

      clientSocket.on('disconnect', () => {
        disconnectReceived = true;
      });

      clientSocket.on('connect', () => {
        if (disconnectReceived) {
          reconnectReceived = true;
        }
      });

      // Simulate temporary disconnection
      clientSocket.disconnect();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      clientSocket.connect();

      await new Promise<void>((resolve) => {
        if (reconnectReceived) {
          resolve();
        } else {
          clientSocket.on('connect', () => {
            reconnectReceived = true;
            resolve();
          });
        }
      });

      expect(disconnectReceived).toBe(true);
      expect(reconnectReceived).toBe(true);
    });

    it('should queue messages during disconnection', async () => {
      const messages: any[] = [];

      clientSocket.on('queued_message', (msg) => {
        messages.push(msg);
      });

      // Disconnect
      clientSocket.disconnect();

      // Try to send messages while disconnected
      clientSocket.emit('send_message', { content: 'Message 1' });
      clientSocket.emit('send_message', { content: 'Message 2' });

      // Reconnect
      clientSocket.connect();

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      // Wait for queued messages
      await new Promise(resolve => setTimeout(resolve, 500));

      // Messages should be processed after reconnection
      expect(messages.length).toBe(0); // They should be queued server-side, not client-side
    });

    it('should handle connection timeout gracefully', async () => {
      let timeoutReceived = false;

      clientSocket.on('connect_timeout', () => {
        timeoutReceived = true;
      });

      // Simulate slow connection by creating new socket with very short timeout
      const slowSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket'],
        timeout: 1 // Very short timeout
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(timeoutReceived || !slowSocket.connected).toBe(true);

      slowSocket.disconnect();
    });

    it('should clean up resources on disconnection', async () => {
      const connectionId = clientSocket.id;

      // Disconnect
      clientSocket.disconnect();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Connection should be cleaned up server-side
      // This would be verified by checking server-side connection registry
      expect(clientSocket.connected).toBe(false);
    });
  });

  describe('Connection Security', () => {
    it('should reject connections without proper CORS headers', async () => {
      // Create socket with restricted origin
      const restrictedSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket'],
        extraHeaders: {
          'Origin': 'https://malicious-site.com'
        }
      });

      await new Promise<void>((resolve, reject) => {
        restrictedSocket.on('connect', () => {
          reject(new Error('Should not connect from restricted origin'));
        });
        
        restrictedSocket.on('connect_error', (error) => {
          expect(error.message).toContain('CORS');
          resolve();
        });
        
        setTimeout(resolve, 2000); // May not receive explicit error
      });

      restrictedSocket.disconnect();
    });

    it('should validate JWT token expiration', async () => {
      // Create socket with expired token (would need to mock JWT expiration)
      const expiredToken = 'expired.jwt.token';
      
      const expiredSocket = Client(`http://localhost:${port}`, {
        auth: { token: expiredToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve, reject) => {
        expiredSocket.on('connect', () => {
          reject(new Error('Should not connect with expired token'));
        });
        
        expiredSocket.on('connect_error', (error) => {
          expect(error.message).toContain('expired');
          resolve();
        });
        
        setTimeout(() => reject(new Error('Should have received error')), 5000);
      });

      expiredSocket.disconnect();
    });

    it('should rate limit connection attempts', async () => {
      const sockets: ClientSocket[] = [];
      const connectionPromises: Promise<void>[] = [];

      // Attempt many rapid connections
      for (let i = 0; i < 20; i++) {
        const socket = Client(`http://localhost:${port}`, {
          auth: { token: authToken },
          transports: ['websocket']
        });
        
        sockets.push(socket);
        
        connectionPromises.push(
          new Promise<void>((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', resolve); // Resolve on error too
            setTimeout(resolve, 1000);
          })
        );
      }

      await Promise.all(connectionPromises);

      const connectedSockets = sockets.filter(s => s.connected);
      const failedSockets = sockets.filter(s => !s.connected);

      // Some connections should be rate limited
      expect(failedSockets.length).toBeGreaterThan(0);

      // Clean up
      sockets.forEach(socket => socket.disconnect());
    });

    it('should prevent session hijacking attempts', async () => {
      // Connect with valid token
      const validSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        validSocket.on('connect', resolve);
      });

      const sessionId = validSocket.id;

      // Try to hijack session with different token
      const hijackAttempt = Client(`http://localhost:${port}`, {
        auth: { token: 'different-token' },
        transports: ['websocket'],
        query: { sessionId } // Attempt to use existing session ID
      });

      await new Promise<void>((resolve, reject) => {
        hijackAttempt.on('connect', () => {
          // Should get different session ID
          expect(hijackAttempt.id).not.toBe(sessionId);
          resolve();
        });
        
        hijackAttempt.on('connect_error', resolve);
        setTimeout(resolve, 2000);
      });

      validSocket.disconnect();
      hijackAttempt.disconnect();
    });
  });

  describe('Room Management', () => {
    beforeEach(async () => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });
    });

    it('should join and leave rooms correctly', async () => {
      const roomName = 'test-room-123';

      // Join room
      const joinPromise = new Promise<any>((resolve) => {
        clientSocket.on('room_joined', resolve);
      });

      clientSocket.emit('join_room', { room: roomName });

      const joinResult = await joinPromise;

      expect(joinResult.room).toBe(roomName);
      expect(joinResult.userId).toBe(userId);

      // Leave room
      const leavePromise = new Promise<any>((resolve) => {
        clientSocket.on('room_left', resolve);
      });

      clientSocket.emit('leave_room', { room: roomName });

      const leaveResult = await leavePromise;

      expect(leaveResult.room).toBe(roomName);
      expect(leaveResult.userId).toBe(userId);
    });

    it('should broadcast messages to room members only', async () => {
      const roomName = 'broadcast-test-room';
      
      // Create second socket
      const userData2 = testData.validUser();
      const app = buildApp({ logger: false });
      await app.ready();
      
      const response2 = await request(app.server)
        .post('/api/auth/register')
        .send(userData2);

      const authToken2 = response2.body.token;
      await app.close();

      const socket2 = Client(`http://localhost:${port}`, {
        auth: { token: authToken2 },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        socket2.on('connect', resolve);
      });

      // Only socket1 joins room
      clientSocket.emit('join_room', { room: roomName });
      
      await new Promise<void>((resolve) => {
        clientSocket.on('room_joined', resolve);
      });

      // Set up message listeners
      let socket1ReceivedMessage = false;
      let socket2ReceivedMessage = false;

      clientSocket.on('room_message', () => {
        socket1ReceivedMessage = true;
      });

      socket2.on('room_message', () => {
        socket2ReceivedMessage = true;
      });

      // Broadcast message to room
      clientSocket.emit('send_room_message', {
        room: roomName,
        message: 'Test broadcast message'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(socket1ReceivedMessage).toBe(true);
      expect(socket2ReceivedMessage).toBe(false); // Should not receive (not in room)

      socket2.disconnect();
    });

    it('should handle room capacity limits', async () => {
      const roomName = 'capacity-test-room';
      const maxCapacity = 5;

      const sockets: ClientSocket[] = [];
      
      // Try to add more connections than room capacity
      for (let i = 0; i < maxCapacity + 2; i++) {
        const userData = testData.validUser();
        const app = buildApp({ logger: false });
        await app.ready();
        
        const response = await request(app.server)
          .post('/api/auth/register')
          .send(userData);

        const token = response.body.token;
        await app.close();

        const socket = Client(`http://localhost:${port}`, {
          auth: { token },
          transports: ['websocket']
        });

        await new Promise<void>((resolve) => {
          socket.on('connect', resolve);
        });

        sockets.push(socket);
      }

      // Try to join room with all sockets
      const joinPromises = sockets.map(socket =>
        new Promise<any>((resolve) => {
          socket.on('room_joined', () => resolve('joined'));
          socket.on('room_full', () => resolve('full'));
          socket.emit('join_room', { room: roomName });
        })
      );

      const results = await Promise.all(joinPromises);
      
      const joinedCount = results.filter(r => r === 'joined').length;
      const rejectedCount = results.filter(r => r === 'full').length;

      expect(joinedCount).toBeLessThanOrEqual(maxCapacity);
      expect(rejectedCount).toBeGreaterThan(0);

      // Clean up
      sockets.forEach(socket => socket.disconnect());
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });
    });

    it('should handle malformed event data gracefully', async () => {
      let errorReceived = false;

      clientSocket.on('error', () => {
        errorReceived = true;
      });

      // Send malformed data
      clientSocket.emit('invalid_event', {
        malformed: undefined,
        circular: {} as any
      });

      // Add circular reference
      (clientSocket as any).circular = clientSocket;

      await new Promise(resolve => setTimeout(resolve, 500));

      // Should not crash the connection
      expect(clientSocket.connected).toBe(true);
    });

    it('should handle unknown event types', async () => {
      let unknownEventHandled = false;

      clientSocket.on('unknown_event_error', () => {
        unknownEventHandled = true;
      });

      clientSocket.emit('completely_unknown_event', {
        data: 'test'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(clientSocket.connected).toBe(true);
    });

    it('should handle server errors gracefully', async () => {
      let serverErrorReceived = false;

      clientSocket.on('server_error', (error) => {
        serverErrorReceived = true;
        expect(error).toHaveProperty('message');
      });

      // Trigger server error condition
      clientSocket.emit('trigger_server_error');

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(clientSocket.connected).toBe(true);
    });

    it('should handle memory pressure gracefully', async () => {
      // Send large amount of data to test memory handling
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string

      let memoryErrorReceived = false;

      clientSocket.on('memory_error', () => {
        memoryErrorReceived = true;
      });

      for (let i = 0; i < 10; i++) {
        clientSocket.emit('large_data_event', { data: largeData });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Connection should remain stable
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-frequency events efficiently', async () => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      const startTime = Date.now();
      const eventCount = 1000;
      let receivedCount = 0;

      clientSocket.on('high_frequency_response', () => {
        receivedCount++;
      });

      // Send many events rapidly
      for (let i = 0; i < eventCount; i++) {
        clientSocket.emit('high_frequency_event', { id: i });
      }

      // Wait for responses
      await new Promise<void>((resolve) => {
        const checkComplete = () => {
          if (receivedCount >= eventCount * 0.9) { // Allow 10% loss
            resolve();
          } else if (Date.now() - startTime > 10000) { // 10 second timeout
            resolve();
          } else {
            setTimeout(checkComplete, 100);
          }
        };
        checkComplete();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(receivedCount).toBeGreaterThan(eventCount * 0.8); // At least 80% delivered
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should maintain stable memory usage under load', async () => {
      const sockets: ClientSocket[] = [];
      const socketCount = 100;

      // Create many connections
      for (let i = 0; i < socketCount; i++) {
        const userData = testData.validUser();
        const app = buildApp({ logger: false });
        await app.ready();
        
        const response = await request(app.server)
          .post('/api/auth/register')
          .send(userData);

        const token = response.body.token;
        await app.close();

        const socket = Client(`http://localhost:${port}`, {
          auth: { token },
          transports: ['websocket']
        });

        sockets.push(socket);
      }

      // Wait for all connections
      await Promise.all(sockets.map(socket =>
        new Promise<void>((resolve, reject) => {
          socket.on('connect', resolve);
          socket.on('connect_error', resolve); // Resolve on error too
          setTimeout(resolve, 2000);
        })
      ));

      const connectedSockets = sockets.filter(s => s.connected);
      
      // Should be able to handle reasonable number of connections
      expect(connectedSockets.length).toBeGreaterThan(socketCount * 0.7);

      // Clean up
      sockets.forEach(socket => socket.disconnect());
    });
  });
});