// @jest imports are available globally
import { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import postsRoutes from '../../src/routes/posts';
import { mockDb, createMockUser, createMockPost, TEST_JWT_TOKEN } from '../setup';

describe('Posts Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify({ logger: false });
    
    // Mock auth middleware
    app.addHook('preHandler', async (request) => {
      if (request.headers.authorization) {
        request.userId = '1';
        request.user = createMockUser();
      }
    });
    
    await app.register(postsRoutes, { prefix: '/posts' });
    await app.ready();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /posts', () => {
    test('should return paginated posts with default sorting', async () => {
      const mockPosts = [
        createMockPost({ title: 'Post 1', score: 100 }),
        createMockPost({ id: '2', title: 'Post 2', score: 50 })
      ];

      mockDb.post.findMany.mockResolvedValue(mockPosts);
      mockDb.post.count.mockResolvedValue(2);

      const response = await app.inject({
        method: 'GET',
        url: '/posts'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.posts).toHaveLength(2);
      expect(body.data.posts[0].title).toBe('Post 1');
      expect(body.data.pagination).toBeDefined();
      expect(body.data.pagination.total).toBe(2);
    });

    test('should handle hot sorting algorithm', async () => {
      const mockPosts = [createMockPost()];
      mockDb.post.findMany.mockResolvedValue(mockPosts);
      mockDb.post.count.mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/posts?sort=hot'
      });

      expect(response.statusCode).toBe(200);
      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { score: 'desc' },
            { createdAt: 'desc' }
          ]
        })
      );
    });

    test('should handle new sorting', async () => {
      const mockPosts = [createMockPost()];
      mockDb.post.findMany.mockResolvedValue(mockPosts);
      mockDb.post.count.mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/posts?sort=new'
      });

      expect(response.statusCode).toBe(200);
      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      );
    });

    test('should handle top sorting', async () => {
      const mockPosts = [createMockPost()];
      mockDb.post.findMany.mockResolvedValue(mockPosts);
      mockDb.post.count.mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/posts?sort=top'
      });

      expect(response.statusCode).toBe(200);
      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { score: 'desc' }
        })
      );
    });

    test('should handle controversial sorting', async () => {
      const mockPosts = [createMockPost()];
      mockDb.post.findMany.mockResolvedValue(mockPosts);
      mockDb.post.count.mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/posts?sort=controversial'
      });

      expect(response.statusCode).toBe(200);
      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { commentCount: 'desc' },
            { viewCount: 'desc' }
          ]
        })
      );
    });

    test('should handle pagination parameters', async () => {
      const mockPosts = [createMockPost()];
      mockDb.post.findMany.mockResolvedValue(mockPosts);
      mockDb.post.count.mockResolvedValue(100);

      const response = await app.inject({
        method: 'GET',
        url: '/posts?page=2&limit=10'
      });

      expect(response.statusCode).toBe(200);
      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      );
    });

    test('should filter by community', async () => {
      const mockPosts = [createMockPost()];
      mockDb.post.findMany.mockResolvedValue(mockPosts);
      mockDb.post.count.mockResolvedValue(1);

      const response = await app.inject({
        method: 'GET',
        url: '/posts?community=testcommunity'
      });

      expect(response.statusCode).toBe(200);
      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            community: { name: 'testcommunity' }
          })
        })
      );
    });

    test('should validate pagination limits', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/posts?limit=200'
      });

      expect(response.statusCode).toBe(400);
    });

    test('should validate sorting options', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/posts?sort=invalid'
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /posts/:id', () => {
    test('should return single post with details', async () => {
      const mockPost = createMockPost();
      mockDb.post.findUnique.mockResolvedValue(mockPost);
      mockDb.post.update.mockResolvedValue(mockPost); // For view count update

      const response = await app.inject({
        method: 'GET',
        url: '/posts/1'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.post.id).toBe('1');
      expect(body.data.post.title).toBe('Test Post');
    });

    test('should increment view count when viewing post', async () => {
      const mockPost = createMockPost();
      mockDb.post.findUnique.mockResolvedValue(mockPost);
      mockDb.post.update.mockResolvedValue({ ...mockPost, viewCount: 1 });

      await app.inject({
        method: 'GET',
        url: '/posts/1'
      });

      expect(mockDb.post.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { viewCount: { increment: 1 } }
      });
    });

    test('should handle non-existent post', async () => {
      mockDb.post.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/posts/nonexistent'
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('not found');
    });

    test('should not show removed posts', async () => {
      const removedPost = createMockPost({ isRemoved: true });
      mockDb.post.findUnique.mockResolvedValue(removedPost);

      const response = await app.inject({
        method: 'GET',
        url: '/posts/1'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /posts', () => {
    test('should create new post with authentication', async () => {
      const newPost = createMockPost({
        title: 'New Post',
        content: 'New content'
      });

      mockDb.post.create.mockResolvedValue(newPost);

      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'New Post',
          content: 'New content',
          type: 'text'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.post.title).toBe('New Post');
      expect(body.data.post.content).toBe('New content');
    });

    test('should require authentication for creating posts', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        payload: {
          title: 'New Post',
          content: 'New content'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should validate post title length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'A'.repeat(301), // Too long
          content: 'Content'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    test('should validate post content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'Valid Title'
          // Missing content
        }
      });

      expect(response.statusCode).toBe(400);
    });

    test('should create post with community', async () => {
      const newPost = createMockPost();
      mockDb.post.create.mockResolvedValue(newPost);
      mockDb.community.findUnique.mockResolvedValue({ id: '1', name: 'testcommunity' });

      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'New Post',
          content: 'New content',
          communityId: '1'
        }
      });

      expect(response.statusCode).toBe(201);
    });

    test('should handle image posts', async () => {
      const imagePost = createMockPost({ 
        type: 'image',
        imageUrl: 'https://example.com/image.jpg'
      });
      mockDb.post.create.mockResolvedValue(imagePost);

      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'Image Post',
          type: 'image',
          imageUrl: 'https://example.com/image.jpg'
        }
      });

      expect(response.statusCode).toBe(201);
    });

    test('should handle link posts', async () => {
      const linkPost = createMockPost({ 
        type: 'link',
        linkUrl: 'https://example.com'
      });
      mockDb.post.create.mockResolvedValue(linkPost);

      const response = await app.inject({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'Link Post',
          type: 'link',
          linkUrl: 'https://example.com'
        }
      });

      expect(response.statusCode).toBe(201);
    });
  });

  describe('PUT /posts/:id', () => {
    test('should update own post', async () => {
      const existingPost = createMockPost({ authorId: '1' });
      const updatedPost = { ...existingPost, title: 'Updated Title' };
      
      mockDb.post.findUnique.mockResolvedValue(existingPost);
      mockDb.post.update.mockResolvedValue(updatedPost);

      const response = await app.inject({
        method: 'PUT',
        url: '/posts/1',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'Updated Title',
          content: 'Updated content'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.post.title).toBe('Updated Title');
    });

    test('should not update others posts', async () => {
      const othersPost = createMockPost({ authorId: '2' });
      mockDb.post.findUnique.mockResolvedValue(othersPost);

      const response = await app.inject({
        method: 'PUT',
        url: '/posts/1',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          title: 'Updated Title'
        }
      });

      expect(response.statusCode).toBe(403);
    });

    test('should require authentication for updates', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/posts/1',
        payload: {
          title: 'Updated Title'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /posts/:id', () => {
    test('should delete own post', async () => {
      const existingPost = createMockPost({ authorId: '1' });
      mockDb.post.findUnique.mockResolvedValue(existingPost);
      mockDb.post.delete.mockResolvedValue(existingPost);

      const response = await app.inject({
        method: 'DELETE',
        url: '/posts/1',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    test('should not delete others posts', async () => {
      const othersPost = createMockPost({ authorId: '2' });
      mockDb.post.findUnique.mockResolvedValue(othersPost);

      const response = await app.inject({
        method: 'DELETE',
        url: '/posts/1',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /posts/:id/vote', () => {
    test('should upvote post', async () => {
      const post = createMockPost();
      mockDb.post.findUnique.mockResolvedValue(post);
      mockDb.vote.findUnique.mockResolvedValue(null);
      mockDb.vote.create.mockResolvedValue({ id: '1', userId: '1', postId: '1', type: 'up' });

      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/vote',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          type: 'up'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    test('should downvote post', async () => {
      const post = createMockPost();
      mockDb.post.findUnique.mockResolvedValue(post);
      mockDb.vote.findUnique.mockResolvedValue(null);
      mockDb.vote.create.mockResolvedValue({ id: '1', userId: '1', postId: '1', type: 'down' });

      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/vote',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          type: 'down'
        }
      });

      expect(response.statusCode).toBe(200);
    });

    test('should handle changing vote', async () => {
      const post = createMockPost();
      const existingVote = { id: '1', userId: '1', postId: '1', type: 'up' };
      
      mockDb.post.findUnique.mockResolvedValue(post);
      mockDb.vote.findUnique.mockResolvedValue(existingVote);
      mockDb.vote.update.mockResolvedValue({ ...existingVote, type: 'down' });

      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/vote',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          type: 'down'
        }
      });

      expect(response.statusCode).toBe(200);
    });

    test('should remove vote when voting same type', async () => {
      const post = createMockPost();
      const existingVote = { id: '1', userId: '1', postId: '1', type: 'up' };
      
      mockDb.post.findUnique.mockResolvedValue(post);
      mockDb.vote.findUnique.mockResolvedValue(existingVote);
      mockDb.vote.delete.mockResolvedValue(existingVote);

      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/vote',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          type: 'up'
        }
      });

      expect(response.statusCode).toBe(200);
    });

    test('should require authentication for voting', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/vote',
        payload: {
          type: 'up'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should validate vote type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/posts/1/vote',
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`
        },
        payload: {
          type: 'invalid'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});