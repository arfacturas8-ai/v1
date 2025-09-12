// No need to import Jest globals - they're available globally
import { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
// import { buildApp } from '../src/app'; // Will create manual setup instead
import { AuthService } from '../src/services/auth';
import { prisma } from '@cryb/database';
import Redis from 'ioredis';

describe('Socket.IO Authentication Integration', () => {
  let app: FastifyInstance;
  let client: ClientSocket;
  let authService: AuthService;
  let redis: Redis;
  let testUser: any;
  let validToken: string;
  let serverUrl: string;

  beforeAll(async () => {
    // Initialize the app
    app = await buildApp();
    await app.ready();
    
    // Start the server
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    const port = typeof address === 'string' ? 3000 : address?.port || 3000;
    serverUrl = `http://127.0.0.1:${port}`;
    
    // Initialize Redis and AuthService
    redis = new Redis(process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0');
    authService = new AuthService(redis);
    
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        id: 'test-user-socket-auth',
        username: 'sockettest',
        displayName: 'Socket Test User',
        email: 'socket@test.com',
        isVerified: true
      }
    });
    
    // Generate a valid JWT token
    const tokens = await authService.generateTokens(testUser.id, {
      deviceInfo: 'test-device',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent'
    });
    validToken = tokens.accessToken;
    
  }, 30000);
  
  afterAll(async () => {
    // Cleanup test user
    try {
      await prisma.session.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
    
    await redis.quit();
    await app.close();
  }, 15000);
  
  beforeEach(async () => {
    // Wait a bit between tests to avoid connection issues
    await new Promise(resolve => setTimeout(resolve, 500));
  });
  
  afterEach(async () => {
    if (client) {
      client.disconnect();
    }
  });

  test('should successfully authenticate with valid JWT token', (done: jest.DoneCallback) => {
    client = Client(serverUrl, {
      auth: {
        token: validToken
      }
    });
    
    client.on('connect', () => {
      expect(client.connected).toBe(true);
      done();
    });
    
    client.on('connect_error', (error) => {
      done(new Error(`Connection failed: ${error.message}`));
    });
    
    // Set a timeout in case connection hangs
    setTimeout(() => {
      if (!client.connected) {
        done(new Error('Connection timeout - authentication may have failed'));
      }
    }, 10000);
  }, 15000);

  test('should reject connection with missing token', (done: jest.DoneCallback) => {
    client = Client(serverUrl);
    
    client.on('connect', () => {
      done(new Error('Should not have connected without token'));
    });
    
    client.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication token required');
      done();
    });
    
    setTimeout(() => {
      done(new Error('Expected connection error but got timeout'));
    }, 5000);
  }, 10000);

  test('should reject connection with invalid token', (done: jest.DoneCallback) => {
    client = Client(serverUrl, {
      auth: {
        token: 'invalid-token'
      }
    });
    
    client.on('connect', () => {
      done(new Error('Should not have connected with invalid token'));
    });
    
    client.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication failed');
      done();
    });
    
    setTimeout(() => {
      done(new Error('Expected connection error but got timeout'));
    }, 5000);
  }, 10000);

  test('should reject connection with blacklisted token', async () => {
    // First, blacklist the token
    await authService.blacklistToken(validToken);
    
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Expected connection error but got timeout'));
      }, 10000);
      
      client = Client(serverUrl, {
        auth: {
          token: validToken
        }
      });
      
      client.on('connect', () => {
        clearTimeout(timeout);
        reject(new Error('Should not have connected with blacklisted token'));
      });
      
      client.on('connect_error', (error) => {
        clearTimeout(timeout);
        expect(error.message).toContain('Token has been revoked');
        resolve();
      });
    });
  }, 15000);

  test('should receive ready event after successful authentication', (done: jest.DoneCallback) => {
    client = Client(serverUrl, {
      auth: {
        token: validToken
      }
    });
    
    client.on('connect', () => {
      // Send identify event to get ready response
      client.emit('identify');
    });
    
    client.on('ready', (data) => {
      expect(data).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(testUser.id);
      expect(data.user.username).toBe(testUser.username);
      expect(data.session_id).toBeDefined();
      done();
    });
    
    client.on('connect_error', (error) => {
      done(new Error(`Connection failed: ${error.message}`));
    });
    
    setTimeout(() => {
      done(new Error('Did not receive ready event in time'));
    }, 10000);
  }, 15000);

  test('should handle heartbeat properly', (done: jest.DoneCallback) => {
    client = Client(serverUrl, {
      auth: {
        token: validToken
      }
    });
    
    client.on('connect', () => {
      // Send heartbeat
      client.emit('heartbeat');
    });
    
    client.on('heartbeat_ack', () => {
      // Received heartbeat acknowledgment
      done();
    });
    
    client.on('connect_error', (error) => {
      done(new Error(`Connection failed: ${error.message}`));
    });
    
    setTimeout(() => {
      done(new Error('Did not receive heartbeat_ack in time'));
    }, 8000);
  }, 10000);

  test('should handle typing indicators', (done: jest.DoneCallback) => {
    const channelId = 'test-channel-123';
    
    client = Client(serverUrl, {
      auth: {
        token: validToken
      }
    });
    
    client.on('connect', () => {
      // Send typing start event
      client.emit('channel:typing', { channelId });
    });
    
    client.on('channel:typing_start', (data) => {
      expect(data.channel_id).toBe(channelId);
      expect(data.user_id).toBe(testUser.id);
      expect(data.timestamp).toBeDefined();
      done();
    });
    
    client.on('connect_error', (error) => {
      done(new Error(`Connection failed: ${error.message}`));
    });
    
    setTimeout(() => {
      done(new Error('Did not receive typing_start event in time'));
    }, 8000);
  }, 10000);
});