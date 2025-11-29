// @jest imports are available globally
import { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { mockDb, createMockUser, TEST_JWT_TOKEN } from '../setup';

interface ServerToClientEvents {
  'message:new': (data: any) => void;
  'user:joined': (data: any) => void;
  'user:left': (data: any) => void;
  'typing:start': (data: any) => void;
  'typing:stop': (data: any) => void;
  'presence:update': (data: any) => void;
  'voice:state': (data: any) => void;
}

interface ClientToServerEvents {
  'message:send': (data: any) => void;
  'message:edit': (data: any) => void;
  'message:delete': (data: any) => void;
  'typing:start': (data: any) => void;
  'typing:stop': (data: any) => void;
  'channel:join': (data: any) => void;
  'channel:leave': (data: any) => void;
  'voice:join': (data: any) => void;
  'voice:leave': (data: any) => void;
}

describe('Socket.IO Realtime Integration', () => {
  let app: FastifyInstance;
  let httpServer: any;
  let ioServer: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  let clientSocket1: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let clientSocket2: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let serverAddress: string;

  beforeEach(async (done) => {
    // Create HTTP server
    httpServer = createServer();
    
    // Create Socket.IO server
    ioServer = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    // Setup authentication middleware
    ioServer.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (token === TEST_JWT_TOKEN) {
        socket.userId = '1';
        socket.user = createMockUser();
        next();
      } else {
        next(new Error('Authentication failed'));
      }
    });

    // Setup socket handlers
    ioServer.on('connection', (socket) => {
      console.log('User connected:', socket.userId);

      socket.on('channel:join', async (data) => {
        const { channelId } = data;
        await socket.join(channelId);
        socket.to(channelId).emit('user:joined', {
          userId: socket.userId,
          username: socket.user?.username,
          channelId
        });
      });

      socket.on('channel:leave', async (data) => {
        const { channelId } = data;
        await socket.leave(channelId);
        socket.to(channelId).emit('user:left', {
          userId: socket.userId,
          username: socket.user?.username,
          channelId
        });
      });

      socket.on('message:send', async (data) => {
        const { channelId, content, type = 'text' } = data;
        
        // Mock message creation
        const message = {
          id: Math.random().toString(36),
          content,
          type,
          channelId,
          authorId: socket.userId,
          author: socket.user,
          createdAt: new Date(),
          updatedAt: new Date(),
          editedAt: null,
          attachments: [],
          reactions: [],
          mentions: [],
          replyToId: data.replyToId || null
        };

        // Emit to all users in the channel
        ioServer.to(channelId).emit('message:new', message);
      });

      socket.on('message:edit', async (data) => {
        const { messageId, content } = data;
        
        // Mock message update
        const updatedMessage = {
          id: messageId,
          content,
          editedAt: new Date()
        };

        // Find which channels to emit to (would normally query database)
        ioServer.emit('message:edited', updatedMessage);
      });

      socket.on('message:delete', async (data) => {
        const { messageId, channelId } = data;
        
        ioServer.to(channelId).emit('message:deleted', {
          messageId,
          deletedBy: socket.userId
        });
      });

      socket.on('typing:start', (data) => {
        const { channelId } = data;
        socket.to(channelId).emit('typing:start', {
          userId: socket.userId,
          username: socket.user?.username,
          channelId
        });
      });

      socket.on('typing:stop', (data) => {
        const { channelId } = data;
        socket.to(channelId).emit('typing:stop', {
          userId: socket.userId,
          username: socket.user?.username,
          channelId
        });
      });

      socket.on('voice:join', async (data) => {
        const { channelId } = data;
        await socket.join(`voice:${channelId}`);
        
        ioServer.to(`voice:${channelId}`).emit('voice:state', {
          type: 'user_joined',
          userId: socket.userId,
          username: socket.user?.username,
          channelId,
          timestamp: new Date()
        });
      });

      socket.on('voice:leave', async (data) => {
        const { channelId } = data;
        await socket.leave(`voice:${channelId}`);
        
        ioServer.to(`voice:${channelId}`).emit('voice:state', {
          type: 'user_left',
          userId: socket.userId,
          username: socket.user?.username,
          channelId,
          timestamp: new Date()
        });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
      });
    });

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      serverAddress = `http://localhost:${port}`;
      done();
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (clientSocket1?.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2?.connected) {
      clientSocket2.disconnect();
    }
    
    ioServer.close();
    httpServer.close();
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Authentication', () => {
    test('should authenticate user with valid token', (done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).toBe(true);
        done();
      });

      clientSocket1.on('connect_error', (error) => {
        done(error);
      });
    });

    test('should reject connection with invalid token', (done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: 'invalid-token' }
      });

      clientSocket1.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });

      clientSocket1.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });
    });

    test('should reject connection without token', (done) => {
      clientSocket1 = Client(serverAddress);

      clientSocket1.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });
    });
  });

  describe('Channel Operations', () => {
    beforeEach((done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });
      
      clientSocket2 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      let connected = 0;
      const checkConnected = () => {
        connected++;
        if (connected === 2) done();
      };

      clientSocket1.on('connect', checkConnected);
      clientSocket2.on('connect', checkConnected);
    });

    test('should handle channel join and notify other users', (done) => {
      const channelId = 'test-channel-1';
      
      clientSocket2.on('user:joined', (data) => {
        expect(data.userId).toBe('1');
        expect(data.username).toBe('testuser');
        expect(data.channelId).toBe(channelId);
        done();
      });

      clientSocket1.emit('channel:join', { channelId });
    });

    test('should handle channel leave and notify other users', (done) => {
      const channelId = 'test-channel-2';
      
      clientSocket2.on('user:left', (data) => {
        expect(data.userId).toBe('1');
        expect(data.channelId).toBe(channelId);
        done();
      });

      // First join the channel
      clientSocket1.emit('channel:join', { channelId });
      
      // Then leave it
      setTimeout(() => {
        clientSocket1.emit('channel:leave', { channelId });
      }, 50);
    });

    test('should only notify users in the same channel', (done) => {
      const channelId1 = 'channel-1';
      const channelId2 = 'channel-2';
      
      let notificationReceived = false;

      clientSocket2.on('user:joined', () => {
        notificationReceived = true;
      });

      // Join different channels
      clientSocket1.emit('channel:join', { channelId: channelId1 });
      clientSocket2.emit('channel:join', { channelId: channelId2 });
      
      setTimeout(() => {
        expect(notificationReceived).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Real-time Messaging', () => {
    beforeEach((done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });
      
      clientSocket2 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      let connected = 0;
      const checkConnected = () => {
        connected++;
        if (connected === 2) {
          // Both clients join the same channel
          clientSocket1.emit('channel:join', { channelId: 'test-channel' });
          clientSocket2.emit('channel:join', { channelId: 'test-channel' });
          setTimeout(done, 50); // Wait for joins to complete
        }
      };

      clientSocket1.on('connect', checkConnected);
      clientSocket2.on('connect', checkConnected);
    });

    test('should broadcast new messages to channel members', (done) => {
      const messageContent = 'Hello, world!';
      const channelId = 'test-channel';
      
      clientSocket2.on('message:new', (message) => {
        expect(message.content).toBe(messageContent);
        expect(message.channelId).toBe(channelId);
        expect(message.authorId).toBe('1');
        expect(message.author.username).toBe('testuser');
        expect(message.type).toBe('text');
        expect(message.id).toBeDefined();
        expect(message.createdAt).toBeDefined();
        done();
      });

      clientSocket1.emit('message:send', {
        channelId,
        content: messageContent,
        type: 'text'
      });
    });

    test('should handle different message types', (done) => {
      const imageMessage = {
        channelId: 'test-channel',
        content: 'Check out this image!',
        type: 'image',
        imageUrl: 'https://example.com/image.jpg'
      };
      
      clientSocket2.on('message:new', (message) => {
        expect(message.type).toBe('image');
        expect(message.content).toBe(imageMessage.content);
        done();
      });

      clientSocket1.emit('message:send', imageMessage);
    });

    test('should handle message replies', (done) => {
      const replyMessage = {
        channelId: 'test-channel',
        content: 'This is a reply',
        replyToId: 'original-message-id'
      };
      
      clientSocket2.on('message:new', (message) => {
        expect(message.replyToId).toBe('original-message-id');
        expect(message.content).toBe(replyMessage.content);
        done();
      });

      clientSocket1.emit('message:send', replyMessage);
    });

    test('should handle message editing', (done) => {
      const messageId = 'test-message-id';
      const newContent = 'Edited message content';
      
      clientSocket2.on('message:edited', (data) => {
        expect(data.id).toBe(messageId);
        expect(data.content).toBe(newContent);
        expect(data.editedAt).toBeDefined();
        done();
      });

      clientSocket1.emit('message:edit', {
        messageId,
        content: newContent
      });
    });

    test('should handle message deletion', (done) => {
      const messageId = 'test-message-id';
      const channelId = 'test-channel';
      
      clientSocket2.on('message:deleted', (data) => {
        expect(data.messageId).toBe(messageId);
        expect(data.deletedBy).toBe('1');
        done();
      });

      clientSocket1.emit('message:delete', {
        messageId,
        channelId
      });
    });
  });

  describe('Typing Indicators', () => {
    beforeEach((done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });
      
      clientSocket2 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      let connected = 0;
      const checkConnected = () => {
        connected++;
        if (connected === 2) {
          clientSocket1.emit('channel:join', { channelId: 'typing-test-channel' });
          clientSocket2.emit('channel:join', { channelId: 'typing-test-channel' });
          setTimeout(done, 50);
        }
      };

      clientSocket1.on('connect', checkConnected);
      clientSocket2.on('connect', checkConnected);
    });

    test('should broadcast typing start to other users', (done) => {
      const channelId = 'typing-test-channel';
      
      clientSocket2.on('typing:start', (data) => {
        expect(data.userId).toBe('1');
        expect(data.username).toBe('testuser');
        expect(data.channelId).toBe(channelId);
        done();
      });

      clientSocket1.emit('typing:start', { channelId });
    });

    test('should broadcast typing stop to other users', (done) => {
      const channelId = 'typing-test-channel';
      
      clientSocket2.on('typing:stop', (data) => {
        expect(data.userId).toBe('1');
        expect(data.channelId).toBe(channelId);
        done();
      });

      clientSocket1.emit('typing:stop', { channelId });
    });

    test('should handle typing indicators in sequence', (done) => {
      const channelId = 'typing-test-channel';
      let typingStartReceived = false;
      
      clientSocket2.on('typing:start', () => {
        typingStartReceived = true;
      });

      clientSocket2.on('typing:stop', () => {
        expect(typingStartReceived).toBe(true);
        done();
      });

      clientSocket1.emit('typing:start', { channelId });
      setTimeout(() => {
        clientSocket1.emit('typing:stop', { channelId });
      }, 50);
    });
  });

  describe('Voice Channel Integration', () => {
    beforeEach((done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });
      
      clientSocket2 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      let connected = 0;
      const checkConnected = () => {
        connected++;
        if (connected === 2) done();
      };

      clientSocket1.on('connect', checkConnected);
      clientSocket2.on('connect', checkConnected);
    });

    test('should handle voice channel join', (done) => {
      const channelId = 'voice-channel-1';
      
      clientSocket2.on('voice:state', (data) => {
        expect(data.type).toBe('user_joined');
        expect(data.userId).toBe('1');
        expect(data.username).toBe('testuser');
        expect(data.channelId).toBe(channelId);
        expect(data.timestamp).toBeDefined();
        done();
      });

      clientSocket1.emit('voice:join', { channelId });
    });

    test('should handle voice channel leave', (done) => {
      const channelId = 'voice-channel-2';
      
      clientSocket2.on('voice:state', (data) => {
        if (data.type === 'user_left') {
          expect(data.userId).toBe('1');
          expect(data.channelId).toBe(channelId);
          done();
        }
      });

      // Join first, then leave
      clientSocket1.emit('voice:join', { channelId });
      setTimeout(() => {
        clientSocket1.emit('voice:leave', { channelId });
      }, 50);
    });
  });

  describe('Connection Management', () => {
    test('should handle client disconnection gracefully', (done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).toBe(true);
        
        clientSocket1.disconnect();
        
        setTimeout(() => {
          expect(clientSocket1.connected).toBe(false);
          done();
        }, 100);
      });
    });

    test('should handle reconnection attempts', (done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN },
        autoConnect: false
      });

      let connectCount = 0;
      
      clientSocket1.on('connect', () => {
        connectCount++;
        
        if (connectCount === 1) {
          // First connection
          clientSocket1.disconnect();
        } else if (connectCount === 2) {
          // Reconnected
          expect(clientSocket1.connected).toBe(true);
          done();
        }
      });

      clientSocket1.on('disconnect', () => {
        // Attempt to reconnect
        setTimeout(() => {
          clientSocket1.connect();
        }, 100);
      });

      clientSocket1.connect();
    });
  });

  describe('Error Handling', () => {
    beforeEach((done) => {
      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      clientSocket1.on('connect', () => done());
    });

    test('should handle malformed message data', (done) => {
      clientSocket1.emit('message:send', {
        // Missing required channelId
        content: 'Invalid message'
      });

      // Server should not crash - wait a bit and check connection
      setTimeout(() => {
        expect(clientSocket1.connected).toBe(true);
        done();
      }, 100);
    });

    test('should handle very large message content', (done) => {
      const largeContent = 'x'.repeat(10000); // 10KB message
      
      clientSocket1.emit('message:send', {
        channelId: 'test-channel',
        content: largeContent
      });

      setTimeout(() => {
        expect(clientSocket1.connected).toBe(true);
        done();
      }, 100);
    });

    test('should handle rapid message sending', (done) => {
      const channelId = 'spam-test-channel';
      let messagesReceived = 0;
      
      clientSocket2 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('channel:join', { channelId });
      });

      clientSocket2.on('message:new', () => {
        messagesReceived++;
        
        if (messagesReceived === 10) {
          expect(clientSocket1.connected).toBe(true);
          done();
        }
      });

      // Send 10 messages rapidly
      for (let i = 0; i < 10; i++) {
        clientSocket1.emit('message:send', {
          channelId,
          content: `Rapid message ${i}`
        });
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent connections', (done) => {
      const sockets: ClientSocket<ServerToClientEvents, ClientToServerEvents>[] = [];
      const connectionCount = 10;
      let connectedCount = 0;

      for (let i = 0; i < connectionCount; i++) {
        const socket = Client(serverAddress, {
          auth: { token: TEST_JWT_TOKEN }
        });

        socket.on('connect', () => {
          connectedCount++;
          if (connectedCount === connectionCount) {
            // All connected
            expect(connectedCount).toBe(connectionCount);
            
            // Cleanup
            sockets.forEach(s => s.disconnect());
            done();
          }
        });

        sockets.push(socket);
      }
    });

    test('should handle high message throughput', (done) => {
      const messageCount = 100;
      const channelId = 'throughput-test';
      let messagesReceived = 0;

      clientSocket1 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      clientSocket2 = Client(serverAddress, {
        auth: { token: TEST_JWT_TOKEN }
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('channel:join', { channelId });
      });

      clientSocket2.on('message:new', () => {
        messagesReceived++;
        
        if (messagesReceived === messageCount) {
          expect(messagesReceived).toBe(messageCount);
          done();
        }
      });

      clientSocket1.on('connect', () => {
        clientSocket1.emit('channel:join', { channelId });
        
        // Send messages rapidly
        for (let i = 0; i < messageCount; i++) {
          setTimeout(() => {
            clientSocket1.emit('message:send', {
              channelId,
              content: `Message ${i}`
            });
          }, i); // Stagger slightly to avoid overwhelming
        }
      });
    });
  });
});