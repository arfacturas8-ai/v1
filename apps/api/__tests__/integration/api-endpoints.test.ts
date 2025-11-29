// @jest imports are available globally
import { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import supertest from 'supertest';
import { mockDb, createMockUser, createMockPost, createMockServer, TEST_JWT_TOKEN } from '../setup';

// Import all route modules
import authRoutes from '../../src/routes/auth';
import postsRoutes from '../../src/routes/posts';
import commentsRoutes from '../../src/routes/comments';
import serversRoutes from '../../src/routes/servers';
import channelsRoutes from '../../src/routes/channels';
import usersRoutes from '../../src/routes/users';
import healthRoutes from '../../src/routes/health';
import uploadRoutes from '../../src/routes/uploads';
import notificationsRoutes from '../../src/routes/notifications';
import moderationRoutes from '../../src/routes/moderation';

describe('API Endpoint Integration Tests', () => {
  let app: FastifyInstance;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    app = fastify({ 
      logger: false,
      trustProxy: true 
    });

    // Register CORS
    await app.register(require('@fastify/cors'), {
      origin: true,
      credentials: true
    });

    // Register error handler
    app.setErrorHandler((error, request, reply) => {
      if (error.validation) {
        reply.status(400).send({
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.validation
          }
        });
      } else {
        reply.status(error.statusCode || 500).send({
          success: false,
          error: {
            message: error.message || 'Internal Server Error',
            code: error.code || 'INTERNAL_ERROR'
          }
        });
      }
    });

    // Mock authentication middleware
    app.addHook('preHandler', async (request) => {
      if (request.headers.authorization?.includes(TEST_JWT_TOKEN)) {
        request.userId = '1';
        request.user = createMockUser();
      }
    });

    // Register all routes
    await app.register(healthRoutes, { prefix: '/health' });
    await app.register(authRoutes, { prefix: '/auth' });
    await app.register(usersRoutes, { prefix: '/users' });
    await app.register(postsRoutes, { prefix: '/posts' });
    await app.register(commentsRoutes, { prefix: '/comments' });
    await app.register(serversRoutes, { prefix: '/servers' });
    await app.register(channelsRoutes, { prefix: '/channels' });
    await app.register(uploadRoutes, { prefix: '/uploads' });
    await app.register(notificationsRoutes, { prefix: '/notifications' });
    await app.register(moderationRoutes, { prefix: '/moderation' });

    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Endpoints', () => {
    test('GET /health should return server status', async () => {
      const response = await request.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        }
      });
    });

    test('GET /health/detailed should return detailed status', async () => {
      // Mock service checks
      mockDb.user.count.mockResolvedValue(100);
      
      const response = await request.get('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data).toHaveProperty('redis');
      expect(response.body.data).toHaveProperty('services');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/register', () => {
      test('should register new user successfully', async () => {
        const userData = {
          username: 'newuser',
          displayName: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        };

        mockDb.user.findFirst.mockResolvedValue(null);
        mockDb.user.create.mockResolvedValue(createMockUser(userData));

        const response = await request
          .post('/auth/register')
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.username).toBe(userData.username);
        expect(response.body.data.tokens).toHaveProperty('accessToken');
        expect(response.body.data.tokens).toHaveProperty('refreshToken');
      });

      test('should validate required fields', async () => {
        const response = await request
          .post('/auth/register')
          .send({
            username: 'test'
            // Missing required fields
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      test('should reject duplicate username', async () => {
        const existingUser = createMockUser({ username: 'existing' });
        mockDb.user.findFirst.mockResolvedValue(existingUser);

        const response = await request
          .post('/auth/register')
          .send({
            username: 'existing',
            displayName: 'Test',
            email: 'test@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          });

        expect(response.status).toBe(409);
        expect(response.body.error.code).toBe('USERNAME_EXISTS');
      });
    });

    describe('POST /auth/login', () => {
      test('should login with valid credentials', async () => {
        const mockUser = createMockUser();
        mockDb.user.findUnique.mockResolvedValue(mockUser);

        const response = await request
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe('test@example.com');
        expect(response.body.data.tokens).toHaveProperty('accessToken');
      });

      test('should reject invalid credentials', async () => {
        mockDb.user.findUnique.mockResolvedValue(null);

        const response = await request
          .post('/auth/login')
          .send({
            email: 'invalid@example.com',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      });
    });

    describe('GET /auth/me', () => {
      test('should return current user profile', async () => {
        const mockUser = createMockUser();
        mockDb.user.findUnique.mockResolvedValue({
          ...mockUser,
          _count: { servers: 5, posts: 10, comments: 25 }
        });

        const response = await request
          .get('/auth/me')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.id).toBe('1');
        expect(response.body.data.user._count).toBeDefined();
      });

      test('should reject unauthorized requests', async () => {
        const response = await request.get('/auth/me');

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Posts Endpoints', () => {
    describe('GET /posts', () => {
      test('should return paginated posts', async () => {
        const mockPosts = [
          createMockPost({ title: 'Post 1' }),
          createMockPost({ id: '2', title: 'Post 2' })
        ];

        mockDb.post.findMany.mockResolvedValue(mockPosts);
        mockDb.post.count.mockResolvedValue(2);

        const response = await request.get('/posts');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toHaveLength(2);
        expect(response.body.data.pagination).toHaveProperty('total', 2);
      });

      test('should handle pagination parameters', async () => {
        const mockPosts = [createMockPost()];
        mockDb.post.findMany.mockResolvedValue(mockPosts);
        mockDb.post.count.mockResolvedValue(100);

        const response = await request.get('/posts?page=2&limit=5');

        expect(response.status).toBe(200);
        expect(mockDb.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 5,
            take: 5
          })
        );
      });

      test('should handle sorting options', async () => {
        mockDb.post.findMany.mockResolvedValue([]);
        mockDb.post.count.mockResolvedValue(0);

        await request.get('/posts?sort=hot');
        expect(mockDb.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [{ score: 'desc' }, { createdAt: 'desc' }]
          })
        );

        await request.get('/posts?sort=new');
        expect(mockDb.post.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { createdAt: 'desc' }
          })
        );
      });
    });

    describe('POST /posts', () => {
      test('should create new post with authentication', async () => {
        const newPost = createMockPost({
          title: 'New Post',
          content: 'New content'
        });

        mockDb.post.create.mockResolvedValue(newPost);

        const response = await request
          .post('/posts')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            title: 'New Post',
            content: 'New content',
            type: 'text'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.post.title).toBe('New Post');
      });

      test('should require authentication', async () => {
        const response = await request
          .post('/posts')
          .send({
            title: 'Unauthorized Post',
            content: 'Content'
          });

        expect(response.status).toBe(401);
      });

      test('should validate post data', async () => {
        const response = await request
          .post('/posts')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            // Missing title and content
            type: 'text'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /posts/:id', () => {
      test('should return single post', async () => {
        const mockPost = createMockPost();
        mockDb.post.findUnique.mockResolvedValue(mockPost);
        mockDb.post.update.mockResolvedValue(mockPost);

        const response = await request.get('/posts/1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.post.id).toBe('1');
      });

      test('should increment view count', async () => {
        const mockPost = createMockPost();
        mockDb.post.findUnique.mockResolvedValue(mockPost);
        mockDb.post.update.mockResolvedValue(mockPost);

        await request.get('/posts/1');

        expect(mockDb.post.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { viewCount: { increment: 1 } }
        });
      });

      test('should return 404 for non-existent post', async () => {
        mockDb.post.findUnique.mockResolvedValue(null);

        const response = await request.get('/posts/nonexistent');

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /posts/:id', () => {
      test('should update own post', async () => {
        const existingPost = createMockPost({ authorId: '1' });
        const updatedPost = { ...existingPost, title: 'Updated Title' };
        
        mockDb.post.findUnique.mockResolvedValue(existingPost);
        mockDb.post.update.mockResolvedValue(updatedPost);

        const response = await request
          .put('/posts/1')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            title: 'Updated Title',
            content: 'Updated content'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.post.title).toBe('Updated Title');
      });

      test('should not update others posts', async () => {
        const othersPost = createMockPost({ authorId: '2' });
        mockDb.post.findUnique.mockResolvedValue(othersPost);

        const response = await request
          .put('/posts/1')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            title: 'Hacked Title'
          });

        expect(response.status).toBe(403);
      });
    });

    describe('POST /posts/:id/vote', () => {
      test('should upvote post', async () => {
        const post = createMockPost();
        mockDb.post.findUnique.mockResolvedValue(post);
        mockDb.vote.findUnique.mockResolvedValue(null);
        mockDb.vote.create.mockResolvedValue({ id: '1', userId: '1', postId: '1', type: 'up' });

        const response = await request
          .post('/posts/1/vote')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({ type: 'up' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      test('should require authentication for voting', async () => {
        const response = await request
          .post('/posts/1/vote')
          .send({ type: 'up' });

        expect(response.status).toBe(401);
      });

      test('should validate vote type', async () => {
        const response = await request
          .post('/posts/1/vote')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({ type: 'invalid' });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Comments Endpoints', () => {
    describe('GET /comments', () => {
      test('should return comments for post', async () => {
        const mockComments = [
          { id: '1', content: 'Comment 1', authorId: '1', postId: '1' },
          { id: '2', content: 'Comment 2', authorId: '2', postId: '1' }
        ];

        mockDb.comment.findMany.mockResolvedValue(mockComments);

        const response = await request.get('/comments?postId=1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.comments).toHaveLength(2);
      });
    });

    describe('POST /comments', () => {
      test('should create new comment', async () => {
        const newComment = {
          id: '1',
          content: 'New comment',
          authorId: '1',
          postId: '1',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockDb.comment.create.mockResolvedValue(newComment);

        const response = await request
          .post('/comments')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            content: 'New comment',
            postId: '1'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.comment.content).toBe('New comment');
      });

      test('should require authentication', async () => {
        const response = await request
          .post('/comments')
          .send({
            content: 'Unauthorized comment',
            postId: '1'
          });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Servers Endpoints', () => {
    describe('GET /servers', () => {
      test('should return user servers', async () => {
        const mockServers = [
          createMockServer({ name: 'Server 1' }),
          createMockServer({ id: '2', name: 'Server 2' })
        ];

        mockDb.server.findMany.mockResolvedValue(mockServers);

        const response = await request
          .get('/servers')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.servers).toHaveLength(2);
      });

      test('should require authentication', async () => {
        const response = await request.get('/servers');
        expect(response.status).toBe(401);
      });
    });

    describe('POST /servers', () => {
      test('should create new server', async () => {
        const newServer = createMockServer({
          name: 'New Server',
          description: 'A new test server'
        });

        mockDb.server.create.mockResolvedValue(newServer);

        const response = await request
          .post('/servers')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            name: 'New Server',
            description: 'A new test server'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.server.name).toBe('New Server');
      });

      test('should validate server name', async () => {
        const response = await request
          .post('/servers')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            name: '', // Empty name
            description: 'Description'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /servers/:id', () => {
      test('should return server details', async () => {
        const mockServer = createMockServer();
        mockDb.server.findUnique.mockResolvedValue({
          ...mockServer,
          channels: [
            { id: '1', name: 'general', type: 'text' },
            { id: '2', name: 'voice', type: 'voice' }
          ],
          members: [
            { id: '1', username: 'testuser', role: 'owner' }
          ]
        });

        const response = await request
          .get('/servers/1')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.server.channels).toHaveLength(2);
        expect(response.body.data.server.members).toHaveLength(1);
      });

      test('should check server membership', async () => {
        // Mock user not being a member
        mockDb.server.findUnique.mockResolvedValue(null);

        const response = await request
          .get('/servers/1')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(404);
      });
    });
  });

  describe('Upload Endpoints', () => {
    describe('POST /uploads/image', () => {
      test('should handle image upload', async () => {
        const mockUploadResult = {
          id: 'upload-123',
          filename: 'test.jpg',
          url: 'https://cdn.example.com/test.jpg',
          size: 1024,
          type: 'image/jpeg'
        };

        // Mock file upload handling
        mockDb.upload.create.mockResolvedValue(mockUploadResult);

        const response = await request
          .post('/uploads/image')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .attach('file', Buffer.from('fake image data'), 'test.jpg');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.upload.filename).toBe('test.jpg');
      });

      test('should validate file type', async () => {
        const response = await request
          .post('/uploads/image')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .attach('file', Buffer.from('not an image'), 'test.txt');

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('Invalid file type');
      });

      test('should validate file size', async () => {
        const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB

        const response = await request
          .post('/uploads/image')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .attach('file', largeFile, 'large.jpg');

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('File too large');
      });
    });
  });

  describe('Notifications Endpoints', () => {
    describe('GET /notifications', () => {
      test('should return user notifications', async () => {
        const mockNotifications = [
          {
            id: '1',
            type: 'message',
            title: 'New message',
            content: 'You have a new message',
            read: false,
            createdAt: new Date()
          },
          {
            id: '2',
            type: 'mention',
            title: 'You were mentioned',
            content: 'Someone mentioned you',
            read: true,
            createdAt: new Date()
          }
        ];

        mockDb.notification.findMany.mockResolvedValue(mockNotifications);

        const response = await request
          .get('/notifications')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.notifications).toHaveLength(2);
      });

      test('should filter unread notifications', async () => {
        const unreadNotifications = [
          { id: '1', read: false, type: 'message' }
        ];

        mockDb.notification.findMany.mockResolvedValue(unreadNotifications);

        const response = await request
          .get('/notifications?unread=true')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(200);
        expect(mockDb.notification.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              read: false
            })
          })
        );
      });
    });

    describe('PUT /notifications/:id/read', () => {
      test('should mark notification as read', async () => {
        const updatedNotification = {
          id: '1',
          read: true,
          updatedAt: new Date()
        };

        mockDb.notification.update.mockResolvedValue(updatedNotification);

        const response = await request
          .put('/notifications/1/read')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockDb.notification.update).toHaveBeenCalledWith({
          where: { id: '1', userId: '1' },
          data: { read: true, readAt: expect.any(Date) }
        });
      });
    });
  });

  describe('Moderation Endpoints', () => {
    describe('POST /moderation/report', () => {
      test('should create content report', async () => {
        const reportData = {
          contentId: 'post-123',
          contentType: 'post',
          reason: 'spam',
          description: 'This is spam content'
        };

        const mockReport = {
          id: 'report-123',
          ...reportData,
          reporterId: '1',
          status: 'pending',
          createdAt: new Date()
        };

        mockDb.report.create.mockResolvedValue(mockReport);

        const response = await request
          .post('/moderation/report')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send(reportData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.report.reason).toBe('spam');
      });

      test('should validate report data', async () => {
        const response = await request
          .post('/moderation/report')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`)
          .send({
            // Missing required fields
            reason: 'spam'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /moderation/reports', () => {
      test('should return reports for moderators', async () => {
        // Mock user as moderator
        const moderatorUser = createMockUser({ role: 'moderator' });
        mockDb.user.findUnique.mockResolvedValue(moderatorUser);

        const mockReports = [
          {
            id: '1',
            reason: 'spam',
            status: 'pending',
            contentType: 'post',
            createdAt: new Date()
          }
        ];

        mockDb.report.findMany.mockResolvedValue(mockReports);

        const response = await request
          .get('/moderation/reports')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.reports).toHaveLength(1);
      });

      test('should require moderator permissions', async () => {
        // Mock regular user
        const regularUser = createMockUser({ role: 'user' });
        mockDb.user.findUnique.mockResolvedValue(regularUser);

        const response = await request
          .get('/moderation/reports')
          .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 routes', async () => {
      const response = await request.get('/non-existent-endpoint');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          message: 'Route not found',
          code: 'NOT_FOUND'
        }
      });
    });

    test('should handle malformed JSON', async () => {
      const response = await request
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    test('should handle rate limiting', async () => {
      // Make multiple requests rapidly
      const requests = Array.from({ length: 20 }, () =>
        request.post('/auth/login').send({
          email: 'test@example.com',
          password: 'password'
        })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should handle database errors gracefully', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('should sanitize error messages in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockDb.user.findUnique.mockRejectedValue(new Error('Sensitive database error'));

      const response = await request
        .get('/auth/me')
        .set('Authorization', `Bearer ${TEST_JWT_TOKEN}`);

      expect(response.status).toBe(500);
      expect(response.body.error.message).not.toContain('Sensitive');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request.get('/health');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });

    test('should handle CORS properly', async () => {
      const response = await request
        .options('/health')
        .set('Origin', 'https://example.com');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.status).toBe(204);
    });
  });

  describe('Content Negotiation', () => {
    test('should return JSON by default', async () => {
      const response = await request.get('/health');

      expect(response.type).toBe('application/json');
      expect(response.body).toBeInstanceOf(Object);
    });

    test('should handle Accept headers', async () => {
      const response = await request
        .get('/health')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
    });

    test('should reject unsupported content types', async () => {
      const response = await request
        .post('/auth/login')
        .set('Content-Type', 'application/xml')
        .send('<login><email>test@example.com</email></login>');

      expect(response.status).toBe(415);
    });
  });

  describe('Request Validation', () => {
    test('should validate request body size limits', async () => {
      const largePayload = 'x'.repeat(2 * 1024 * 1024); // 2MB

      const response = await request
        .post('/auth/register')
        .send({
          username: 'test',
          displayName: largePayload,
          email: 'test@example.com',
          password: 'password'
        });

      expect(response.status).toBe(413);
    });

    test('should validate query parameters', async () => {
      const response = await request.get('/posts?page=invalid&limit=abc');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate URL parameters', async () => {
      const response = await request.get('/posts/invalid-id-format');

      // Depending on implementation, this might be 400 or 404
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await request.get('/health');
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = 50;
      const promises = Array.from({ length: concurrentRequests }, () =>
        request.get('/health')
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should compress responses when appropriate', async () => {
      const response = await request
        .get('/posts')
        .set('Accept-Encoding', 'gzip');

      // Check if compression is applied for larger responses
      if (response.text.length > 1000) {
        expect(response.headers['content-encoding']).toBe('gzip');
      }
    });
  });
});