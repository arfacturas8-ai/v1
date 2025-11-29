import request from 'supertest';
import { app } from '../../src/app';
import { generateAuthToken, createTestUser, cleanupTestData } from '../helpers/test-data';

describe('API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testServer: any;

  beforeAll(async () => {
    // Create test user and generate auth token
    const testUser = await createTestUser({
      email: 'integration-test@cryb.app',
      username: 'integrationtest',
      password: 'TestPassword123!'
    });
    testUserId = testUser.id;
    authToken = generateAuthToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - should register new user', async () => {
      const userData = {
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        displayName: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('registered'),
        user: expect.objectContaining({
          email: userData.email,
          username: userData.username,
          displayName: userData.displayName
        })
      });

      expect(response.body.user.password).toBeUndefined();
    });

    test('POST /api/auth/login - should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration-test@cryb.app',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        token: expect.any(String),
        user: expect.objectContaining({
          email: 'integration-test@cryb.app',
          username: 'integrationtest'
        })
      });
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration-test@cryb.app',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials')
      });
    });

    test('POST /api/auth/refresh - should refresh valid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        token: expect.any(String)
      });
    });

    test('POST /api/auth/logout - should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('logged out')
      });
    });
  });

  describe('User Profile Endpoints', () => {
    test('GET /api/users/profile - should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          id: testUserId,
          email: 'integration-test@cryb.app',
          username: 'integrationtest'
        })
      });
    });

    test('PUT /api/users/profile - should update user profile', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          displayName: 'Updated Name',
          bio: 'Updated bio'
        })
      });
    });

    test('GET /api/users/:userId - should get public user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          id: testUserId,
          username: 'integrationtest',
          displayName: expect.any(String)
        })
      });

      // Should not include private information
      expect(response.body.user.email).toBeUndefined();
    });
  });

  describe('Posts Endpoints', () => {
    let testPostId: string;

    test('POST /api/posts - should create new post', async () => {
      const postData = {
        title: 'Integration Test Post',
        content: 'This is a test post for integration testing',
        type: 'text',
        communityId: '1',
        tags: ['test', 'integration']
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        post: expect.objectContaining({
          title: postData.title,
          content: postData.content,
          type: postData.type,
          authorId: testUserId,
          score: 0,
          voteCount: 0
        })
      });

      testPostId = response.body.post.id;
    });

    test('GET /api/posts/:postId - should get post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPostId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        post: expect.objectContaining({
          id: testPostId,
          title: 'Integration Test Post',
          content: 'This is a test post for integration testing'
        })
      });
    });

    test('PUT /api/posts/:postId - should update post (author only)', async () => {
      const updateData = {
        content: 'Updated post content'
      };

      const response = await request(app)
        .put(`/api/posts/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        post: expect.objectContaining({
          content: 'Updated post content',
          edited: true
        })
      });
    });

    test('POST /api/posts/:postId/vote - should vote on post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ voteType: 'upvote' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        post: expect.objectContaining({
          score: 1,
          voteCount: 1
        })
      });
    });

    test('GET /api/posts - should get posts feed', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ limit: 10, offset: 0, sort: 'hot' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        posts: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            score: expect.any(Number)
          })
        ]),
        pagination: expect.objectContaining({
          total: expect.any(Number),
          limit: 10,
          offset: 0
        })
      });
    });

    test('DELETE /api/posts/:postId - should delete post (author only)', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('deleted')
      });

      // Verify post is deleted
      await request(app)
        .get(`/api/posts/${testPostId}`)
        .expect(404);
    });
  });

  describe('Comments Endpoints', () => {
    let testPostId: string;
    let testCommentId: string;

    beforeAll(async () => {
      // Create a post for commenting
      const postResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Post for Comments Test',
          content: 'Testing comments functionality',
          type: 'text',
          communityId: '1'
        });
      testPostId = postResponse.body.post.id;
    });

    test('POST /api/posts/:postId/comments - should create comment', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        comment: expect.objectContaining({
          content: commentData.content,
          postId: testPostId,
          authorId: testUserId,
          score: 0,
          parentId: null
        })
      });

      testCommentId = response.body.comment.id;
    });

    test('POST /api/comments/:commentId/reply - should reply to comment', async () => {
      const replyData = {
        content: 'This is a reply to the comment'
      };

      const response = await request(app)
        .post(`/api/comments/${testCommentId}/reply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        comment: expect.objectContaining({
          content: replyData.content,
          parentId: testCommentId,
          postId: testPostId
        })
      });
    });

    test('GET /api/posts/:postId/comments - should get post comments', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPostId}/comments`)
        .query({ sort: 'best' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        comments: expect.arrayContaining([
          expect.objectContaining({
            id: testCommentId,
            content: 'This is a test comment',
            replies: expect.any(Array)
          })
        ])
      });
    });

    test('POST /api/comments/:commentId/vote - should vote on comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ voteType: 'upvote' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        comment: expect.objectContaining({
          score: 1
        })
      });
    });
  });

  describe('Server Management Endpoints', () => {
    let testServerId: string;

    test('POST /api/servers - should create new server', async () => {
      const serverData = {
        name: 'Integration Test Server',
        description: 'A server for integration testing',
        isPublic: true
      };

      const response = await request(app)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serverData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        server: expect.objectContaining({
          name: serverData.name,
          description: serverData.description,
          ownerId: testUserId
        })
      });

      testServerId = response.body.server.id;
    });

    test('GET /api/servers/:serverId - should get server details', async () => {
      const response = await request(app)
        .get(`/api/servers/${testServerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        server: expect.objectContaining({
          id: testServerId,
          name: 'Integration Test Server',
          channels: expect.any(Array),
          members: expect.any(Array)
        })
      });
    });

    test('POST /api/servers/:serverId/join - should join server', async () => {
      // Create another user for joining test
      const newUser = await createTestUser({
        email: 'joiner@test.com',
        username: 'joiner',
        password: 'Password123!'
      });
      const joinerToken = generateAuthToken(newUser);

      const response = await request(app)
        .post(`/api/servers/${testServerId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('joined')
      });
    });

    test('GET /api/servers - should get user servers', async () => {
      const response = await request(app)
        .get('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        servers: expect.arrayContaining([
          expect.objectContaining({
            id: testServerId,
            name: 'Integration Test Server'
          })
        ])
      });
    });
  });

  describe('Channel Management Endpoints', () => {
    let testServerId: string;
    let testChannelId: string;

    beforeAll(async () => {
      // Create a server for channel tests
      const serverResponse = await request(app)
        .post('/api/servers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Channel Test Server',
          description: 'For testing channels'
        });
      testServerId = serverResponse.body.server.id;
    });

    test('POST /api/servers/:serverId/channels - should create channel', async () => {
      const channelData = {
        name: 'test-channel',
        type: 'text',
        description: 'A test channel'
      };

      const response = await request(app)
        .post(`/api/servers/${testServerId}/channels`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(channelData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        channel: expect.objectContaining({
          name: channelData.name,
          type: channelData.type,
          serverId: testServerId
        })
      });

      testChannelId = response.body.channel.id;
    });

    test('GET /api/channels/:channelId - should get channel details', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        channel: expect.objectContaining({
          id: testChannelId,
          name: 'test-channel',
          type: 'text'
        })
      });
    });

    test('GET /api/channels/:channelId/messages - should get channel messages', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannelId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 50 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        messages: expect.any(Array),
        hasMore: expect.any(Boolean)
      });
    });
  });

  describe('File Upload Endpoints', () => {
    test('POST /api/upload/image - should upload image file', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        file: expect.objectContaining({
          url: expect.stringMatching(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/),
          filename: expect.any(String),
          size: expect.any(Number),
          type: 'image/jpeg'
        })
      });
    });

    test('POST /api/upload/avatar - should upload user avatar', async () => {
      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', Buffer.from('fake-avatar-data'), {
          filename: 'avatar.png',
          contentType: 'image/png'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          avatar: expect.stringMatching(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/)
        })
      });
    });

    test('POST /api/upload/file - should handle file size limits', async () => {
      // Create a large fake file (>10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app)
        .post('/api/upload/file')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, {
          filename: 'large-file.txt',
          contentType: 'text/plain'
        })
        .expect(413);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('File too large')
      });
    });
  });

  describe('Search Endpoints', () => {
    test('GET /api/search/posts - should search posts', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'integration test', limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        results: expect.any(Array),
        total: expect.any(Number),
        query: 'integration test'
      });
    });

    test('GET /api/search/users - should search users', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'integration', limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            username: expect.stringContaining('integration'),
            displayName: expect.any(String)
          })
        ])
      });
    });

    test('GET /api/search/servers - should search servers', async () => {
      const response = await request(app)
        .get('/api/search/servers')
        .query({ q: 'test', limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        results: expect.any(Array),
        total: expect.any(Number)
      });
    });
  });

  describe('Notification Endpoints', () => {
    test('GET /api/notifications - should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 20 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        notifications: expect.any(Array),
        unreadCount: expect.any(Number)
      });
    });

    test('PUT /api/notifications/:notificationId/read - should mark notification as read', async () => {
      // First create a notification by having another user interact
      const notificationsResponse = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      if (notificationsResponse.body.notifications.length > 0) {
        const notificationId = notificationsResponse.body.notifications[0].id;

        const response = await request(app)
          .put(`/api/notifications/${notificationId}/read`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          notification: expect.objectContaining({
            id: notificationId,
            read: true
          })
        });
      }
    });
  });

  describe('Analytics Endpoints', () => {
    test('GET /api/analytics/dashboard - should get dashboard analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        analytics: expect.objectContaining({
          postsCount: expect.any(Number),
          commentsCount: expect.any(Number),
          karma: expect.any(Number),
          serversJoined: expect.any(Number)
        })
      });
    });

    test('GET /api/analytics/servers/:serverId - should get server analytics (admin only)', async () => {
      // This test would only work if the user is a server admin
      const response = await request(app)
        .get(`/api/analytics/servers/${testServerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Could be 200 (if admin) or 403 (if not admin)
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          success: true,
          analytics: expect.objectContaining({
            memberCount: expect.any(Number),
            messageCount: expect.any(Number),
            activeUsers: expect.any(Number)
          })
        });
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on login attempts', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      };

      // Make multiple failed requests
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData);
      }

      // Next request should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('rate limit')
      });
    });

    test('should enforce rate limits on API requests', async () => {
      // Make multiple requests rapidly
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        (response) => response.status === 'fulfilled' && 
        response.value.status === 429
      );

      // Should have some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid JSON')
      });
    });

    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('validation'),
        errors: expect.any(Array)
      });
    });

    test('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Unauthorized')
      });
    });

    test('should handle not found resources', async () => {
      const response = await request(app)
        .get('/api/posts/999999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found')
      });
    });
  });
});