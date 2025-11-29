import request from 'supertest';
import { FastifyInstance } from 'fastify';
import app from '../src/app';

describe('CRYB API - Comprehensive Test Suite', () => {
  let server: FastifyInstance;
  let authToken: string;
  let testUserId: string;
  let testCommunityId: string;
  let testPostId: string;
  let testCommentId: string;

  const testUser = {
    username: 'testuser_' + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  const testCommunity = {
    name: 'Test Community ' + Date.now(),
    description: 'A test community for API testing',
    type: 'public',
  };

  beforeAll(async () => {
    server = app;
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Health and Status Endpoints', () => {
    test('GET /health - should return health status', async () => {
      const response = await request(server.server)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });

    test('GET /api/status - should return API status', async () => {
      const response = await request(server.server)
        .get('/api/status')
        .expect(200);

      expect(response.body).toMatchObject({
        api: 'CRYB Platform API',
        version: expect.any(String),
        environment: expect.any(String),
        database: expect.objectContaining({
          status: 'connected'
        }),
        redis: expect.objectContaining({
          status: 'connected'
        }),
      });
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - should register new user', async () => {
      const response = await request(server.server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: expect.any(String),
          username: testUser.username,
          email: testUser.email,
        },
        token: expect.any(String),
      });

      testUserId = response.body.user.id;
      authToken = response.body.token;
    });

    test('POST /api/auth/register - should reject duplicate username', async () => {
      const response = await request(server.server)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('username'),
      });
    });

    test('POST /api/auth/login - should login user', async () => {
      const response = await request(server.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: testUserId,
          username: testUser.username,
          email: testUser.email,
        },
        token: expect.any(String),
      });
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(server.server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });

    test('GET /api/auth/me - should return current user', async () => {
      const response = await request(server.server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: testUserId,
          username: testUser.username,
          email: testUser.email,
        },
      });
    });

    test('GET /api/auth/me - should reject without token', async () => {
      const response = await request(server.server)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('token'),
      });
    });
  });

  describe('Communities Endpoints', () => {
    test('POST /api/communities - should create community', async () => {
      const response = await request(server.server)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCommunity)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        community: {
          id: expect.any(String),
          name: testCommunity.name,
          description: testCommunity.description,
          type: testCommunity.type,
          creator_id: testUserId,
        },
      });

      testCommunityId = response.body.community.id;
    });

    test('GET /api/communities - should list communities', async () => {
      const response = await request(server.server)
        .get('/api/communities')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        communities: expect.arrayContaining([
          expect.objectContaining({
            id: testCommunityId,
            name: testCommunity.name,
          }),
        ]),
      });
    });

    test('GET /api/communities/:id - should get community details', async () => {
      const response = await request(server.server)
        .get(`/api/communities/${testCommunityId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        community: {
          id: testCommunityId,
          name: testCommunity.name,
          description: testCommunity.description,
          member_count: expect.any(Number),
          post_count: expect.any(Number),
        },
      });
    });

    test('POST /api/communities/:id/join - should join community', async () => {
      const response = await request(server.server)
        .post(`/api/communities/${testCommunityId}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('joined'),
      });
    });

    test('PUT /api/communities/:id - should update community (owner only)', async () => {
      const updatedData = {
        description: 'Updated test community description',
      };

      const response = await request(server.server)
        .put(`/api/communities/${testCommunityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        community: expect.objectContaining({
          description: updatedData.description,
        }),
      });
    });
  });

  describe('Posts Endpoints', () => {
    const testPost = {
      title: 'Test Post for API Testing',
      content: 'This is a test post created for API testing purposes.',
      type: 'text',
      community_id: '', // Will be set in test
    };

    test('POST /api/posts - should create post', async () => {
      testPost.community_id = testCommunityId;

      const response = await request(server.server)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPost)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        post: {
          id: expect.any(String),
          title: testPost.title,
          content: testPost.content,
          type: testPost.type,
          community_id: testCommunityId,
          author_id: testUserId,
          upvotes: 0,
          downvotes: 0,
        },
      });

      testPostId = response.body.post.id;
    });

    test('GET /api/posts - should list posts', async () => {
      const response = await request(server.server)
        .get('/api/posts')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        posts: expect.arrayContaining([
          expect.objectContaining({
            id: testPostId,
            title: testPost.title,
          }),
        ]),
      });
    });

    test('GET /api/posts/:id - should get post details', async () => {
      const response = await request(server.server)
        .get(`/api/posts/${testPostId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        post: {
          id: testPostId,
          title: testPost.title,
          content: testPost.content,
          author: expect.objectContaining({
            username: testUser.username,
          }),
          community: expect.objectContaining({
            name: testCommunity.name,
          }),
        },
      });
    });

    test('POST /api/posts/:id/vote - should upvote post', async () => {
      const response = await request(server.server)
        .post(`/api/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'upvote' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        vote: {
          type: 'upvote',
          post_id: testPostId,
          user_id: testUserId,
        },
        post: expect.objectContaining({
          upvotes: 1,
          downvotes: 0,
        }),
      });
    });

    test('POST /api/posts/:id/vote - should change vote to downvote', async () => {
      const response = await request(server.server)
        .post(`/api/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'downvote' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        vote: {
          type: 'downvote',
          post_id: testPostId,
          user_id: testUserId,
        },
        post: expect.objectContaining({
          upvotes: 0,
          downvotes: 1,
        }),
      });
    });

    test('DELETE /api/posts/:id/vote - should remove vote', async () => {
      const response = await request(server.server)
        .delete(`/api/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('removed'),
        post: expect.objectContaining({
          upvotes: 0,
          downvotes: 0,
        }),
      });
    });
  });

  describe('Comments Endpoints', () => {
    const testComment = {
      content: 'This is a test comment for API testing.',
      post_id: '', // Will be set in test
    };

    test('POST /api/comments - should create comment', async () => {
      testComment.post_id = testPostId;

      const response = await request(server.server)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testComment)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        comment: {
          id: expect.any(String),
          content: testComment.content,
          post_id: testPostId,
          author_id: testUserId,
          upvotes: 0,
          downvotes: 0,
        },
      });

      testCommentId = response.body.comment.id;
    });

    test('GET /api/posts/:id/comments - should get post comments', async () => {
      const response = await request(server.server)
        .get(`/api/posts/${testPostId}/comments`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        comments: expect.arrayContaining([
          expect.objectContaining({
            id: testCommentId,
            content: testComment.content,
          }),
        ]),
      });
    });

    test('POST /api/comments/:id/vote - should vote on comment', async () => {
      const response = await request(server.server)
        .post(`/api/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'upvote' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        vote: {
          type: 'upvote',
          comment_id: testCommentId,
          user_id: testUserId,
        },
      });
    });

    test('POST /api/comments - should create reply to comment', async () => {
      const replyComment = {
        content: 'This is a reply to the test comment.',
        post_id: testPostId,
        parent_id: testCommentId,
      };

      const response = await request(server.server)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyComment)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        comment: {
          content: replyComment.content,
          parent_id: testCommentId,
          post_id: testPostId,
        },
      });
    });
  });

  describe('Search Endpoints', () => {
    test('GET /api/search - should search content', async () => {
      const searchQuery = testPost.title.split(' ')[0]; // Use first word of post title

      const response = await request(server.server)
        .get('/api/search')
        .query({ q: searchQuery })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        results: expect.objectContaining({
          posts: expect.any(Array),
          communities: expect.any(Array),
          users: expect.any(Array),
        }),
      });
    });

    test('GET /api/search/posts - should search posts only', async () => {
      const response = await request(server.server)
        .get('/api/search/posts')
        .query({ q: testPost.title })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        posts: expect.arrayContaining([
          expect.objectContaining({
            id: testPostId,
            title: expect.stringContaining(testPost.title),
          }),
        ]),
      });
    });

    test('GET /api/search/communities - should search communities', async () => {
      const response = await request(server.server)
        .get('/api/search/communities')
        .query({ q: testCommunity.name })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        communities: expect.arrayContaining([
          expect.objectContaining({
            id: testCommunityId,
            name: expect.stringContaining(testCommunity.name),
          }),
        ]),
      });
    });
  });

  describe('User Profile Endpoints', () => {
    test('GET /api/users/:id - should get user profile', async () => {
      const response = await request(server.server)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: testUserId,
          username: testUser.username,
          karma: expect.any(Number),
          posts_count: expect.any(Number),
          comments_count: expect.any(Number),
        },
      });
    });

    test('PUT /api/users/profile - should update user profile', async () => {
      const profileUpdate = {
        display_name: 'Updated Display Name',
        bio: 'Updated bio for testing',
      };

      const response = await request(server.server)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: expect.objectContaining({
          display_name: profileUpdate.display_name,
          bio: profileUpdate.bio,
        }),
      });
    });

    test('GET /api/users/:id/posts - should get user posts', async () => {
      const response = await request(server.server)
        .get(`/api/users/${testUserId}/posts`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        posts: expect.arrayContaining([
          expect.objectContaining({
            id: testPostId,
            author_id: testUserId,
          }),
        ]),
      });
    });
  });

  describe('Media Upload Endpoints', () => {
    test('POST /api/uploads/image - should upload image', async () => {
      // Create a fake image buffer
      const fakeImageBuffer = Buffer.from('fake-image-data');

      const response = await request(server.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fakeImageBuffer, 'test-image.png')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        file: {
          url: expect.stringContaining('http'),
          filename: expect.any(String),
          size: expect.any(Number),
          mimetype: expect.stringContaining('image'),
        },
      });
    });

    test('POST /api/uploads/image - should reject invalid file type', async () => {
      const fakeTextBuffer = Buffer.from('not-an-image');

      const response = await request(server.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fakeTextBuffer, 'test.txt')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid file type'),
      });
    });
  });

  describe('Real-time Messaging Endpoints', () => {
    test('GET /api/messages/:channelId - should get channel messages', async () => {
      const response = await request(server.server)
        .get(`/api/messages/${testCommunityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        messages: expect.any(Array),
      });
    });

    test('POST /api/messages - should create message', async () => {
      const testMessage = {
        content: 'Test message for API testing',
        channel_id: testCommunityId,
        type: 'text',
      };

      const response = await request(server.server)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testMessage)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: {
          id: expect.any(String),
          content: testMessage.content,
          channel_id: testCommunityId,
          author_id: testUserId,
          type: testMessage.type,
        },
      });
    });
  });

  describe('Voice/Video Endpoints', () => {
    test('POST /api/voice/room - should create voice room', async () => {
      const roomData = {
        name: 'Test Voice Room',
        community_id: testCommunityId,
        type: 'voice',
      };

      const response = await request(server.server)
        .post('/api/voice/room')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        room: {
          id: expect.any(String),
          name: roomData.name,
          community_id: testCommunityId,
          type: roomData.type,
        },
      });
    });

    test('POST /api/voice/token - should get voice token', async () => {
      const response = await request(server.server)
        .post('/api/voice/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ room: 'test-room' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        token: expect.any(String),
        url: expect.stringContaining('livekit'),
      });
    });
  });

  describe('Notifications Endpoints', () => {
    test('GET /api/notifications - should get user notifications', async () => {
      const response = await request(server.server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        notifications: expect.any(Array),
        unread_count: expect.any(Number),
      });
    });

    test('PUT /api/notifications/:id/read - should mark notification as read', async () => {
      // First, create a notification by commenting on our own post
      await request(server.server)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Another test comment',
          post_id: testPostId,
        });

      // Get notifications to find one to mark as read
      const notificationsResponse = await request(server.server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      if (notificationsResponse.body.notifications.length > 0) {
        const notificationId = notificationsResponse.body.notifications[0].id;

        const response = await request(server.server)
          .put(`/api/notifications/${notificationId}/read`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          notification: expect.objectContaining({
            read: true,
          }),
        });
      }
    });
  });

  describe('Rate Limiting and Security', () => {
    test('should enforce rate limits on auth endpoints', async () => {
      const requests = [];
      
      // Attempt multiple rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(server.server)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        (response) => 
          response.status === 'fulfilled' && 
          response.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 30000);

    test('should sanitize user input', async () => {
      const maliciousInput = {
        title: '<script>alert("xss")</script>Malicious Post',
        content: 'This contains <img src="x" onerror="alert(1)"> XSS',
        type: 'text',
        community_id: testCommunityId,
      };

      const response = await request(server.server)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousInput)
        .expect(201);

      // Check that script tags are removed/escaped
      expect(response.body.post.title).not.toContain('<script>');
      expect(response.body.post.content).not.toContain('<img src="x" onerror=');
    });

    test('should validate request data types', async () => {
      const invalidData = {
        title: 123, // Should be string
        content: [], // Should be string
        type: 'invalid_type', // Should be valid enum
        community_id: 'not-a-uuid', // Should be valid UUID
      };

      const response = await request(server.server)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('validation'),
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent resources', async () => {
      const response = await request(server.server)
        .get('/api/posts/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
      });
    });

    test('should handle invalid UUID formats', async () => {
      const response = await request(server.server)
        .get('/api/posts/invalid-uuid')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid'),
      });
    });

    test('should handle unauthorized access', async () => {
      const response = await request(server.server)
        .post('/api/posts')
        .send({
          title: 'Unauthorized Post',
          content: 'This should fail',
          type: 'text',
          community_id: testCommunityId,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('token'),
      });
    });

    test('should handle forbidden actions', async () => {
      // Try to delete someone else's post (should fail)
      const response = await request(server.server)
        .delete(`/api/posts/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`) // Use different user's token
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('permission'),
      });
    });
  });

  describe('Database Transactions', () => {
    test('should handle transaction rollback on error', async () => {
      // Attempt to create a post with invalid community_id
      const invalidPost = {
        title: 'Transaction Test Post',
        content: 'This should rollback',
        type: 'text',
        community_id: '00000000-0000-0000-0000-000000000000', // Non-existent
      };

      const response = await request(server.server)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPost)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
      });

      // Verify no partial data was created
      const postsResponse = await request(server.server)
        .get('/api/posts')
        .query({ title: invalidPost.title });

      expect(postsResponse.body.posts).not.toContainEqual(
        expect.objectContaining({
          title: invalidPost.title,
        })
      );
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(server.server)
          .get('/api/posts')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    }, 10000);

    test('should handle large payloads efficiently', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB content
      
      const startTime = Date.now();
      
      const response = await request(server.server)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Large Content Test',
          content: largeContent,
          type: 'text',
          community_id: testCommunityId,
        })
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.post.content).toHaveLength(largeContent.length);
      expect(duration).toBeLessThan(2000); // Should handle large payloads quickly
    });
  });
});