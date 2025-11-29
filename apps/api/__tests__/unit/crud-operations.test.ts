import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testData } from '../helpers/test-data';

describe('CRUD Operations', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();

    // Create authenticated user for tests
    const userData = testData.validUser();
    const response = await request(app.server)
      .post('/api/auth/register')
      .send(userData);
    
    authToken = response.body.token;
    userId = response.body.user.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Posts CRUD', () => {
    describe('Create Post', () => {
      it('should create a new post with valid data', async () => {
        const postData = testData.validPost();

        const response = await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(postData.title);
        expect(response.body.content).toBe(postData.content);
        expect(response.body.authorId).toBe(userId);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });

      it('should reject post creation without authentication', async () => {
        const postData = testData.validPost();

        await request(app.server)
          .post('/api/posts')
          .send(postData)
          .expect(401);
      });

      it('should reject post with missing required fields', async () => {
        const response = await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: 'Post without title'
          })
          .expect(400);

        expect(response.body.error).toContain('title is required');
      });

      it('should reject post with title too long', async () => {
        const postData = testData.validPost();
        postData.title = 'x'.repeat(301); // Assuming 300 char limit

        const response = await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData)
          .expect(400);

        expect(response.body.error).toContain('title too long');
      });

      it('should sanitize post content for XSS prevention', async () => {
        const postData = testData.validPost();
        postData.content = '<script>alert("xss")</script>Safe content';

        const response = await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData)
          .expect(201);

        expect(response.body.content).not.toContain('<script>');
        expect(response.body.content).toContain('Safe content');
      });
    });

    describe('Read Posts', () => {
      let postId: number;

      beforeEach(async () => {
        // Create a test post
        const postData = testData.validPost();
        const response = await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData);
        postId = response.body.id;
      });

      it('should get single post by ID', async () => {
        const response = await request(app.server)
          .get(`/api/posts/${postId}`)
          .expect(200);

        expect(response.body.id).toBe(postId);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('content');
        expect(response.body).toHaveProperty('author');
      });

      it('should return 404 for non-existent post', async () => {
        await request(app.server)
          .get('/api/posts/999999')
          .expect(404);
      });

      it('should get paginated list of posts', async () => {
        // Create multiple posts
        const promises = Array(15).fill(0).map((_, i) =>
          request(app.server)
            .post('/api/posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testData.validPost(`Post ${i}`))
        );
        await Promise.all(promises);

        const response = await request(app.server)
          .get('/api/posts?page=1&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('posts');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.posts).toHaveLength(10);
        expect(response.body.pagination.total).toBeGreaterThan(10);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
      });

      it('should filter posts by category', async () => {
        // Create posts with different categories
        await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData.validPost('Tech Post', 'technology'));

        await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData.validPost('Gaming Post', 'gaming'));

        const response = await request(app.server)
          .get('/api/posts?category=technology')
          .expect(200);

        expect(response.body.posts.every((post: any) => post.category === 'technology')).toBe(true);
      });

      it('should sort posts by creation date descending by default', async () => {
        // Create posts with delays to ensure different timestamps
        await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData.validPost('First Post'));

        await new Promise(resolve => setTimeout(resolve, 100));

        await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData.validPost('Second Post'));

        const response = await request(app.server)
          .get('/api/posts')
          .expect(200);

        const posts = response.body.posts;
        expect(new Date(posts[0].createdAt).getTime())
          .toBeGreaterThan(new Date(posts[1].createdAt).getTime());
      });
    });

    describe('Update Post', () => {
      let postId: number;

      beforeEach(async () => {
        const postData = testData.validPost();
        const response = await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData);
        postId = response.body.id;
      });

      it('should update post with valid data', async () => {
        const updateData = {
          title: 'Updated Title',
          content: 'Updated content'
        };

        const response = await request(app.server)
          .put(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.title).toBe(updateData.title);
        expect(response.body.content).toBe(updateData.content);
        expect(response.body.id).toBe(postId);
        expect(new Date(response.body.updatedAt).getTime())
          .toBeGreaterThan(new Date(response.body.createdAt).getTime());
      });

      it('should reject update without authentication', async () => {
        await request(app.server)
          .put(`/api/posts/${postId}`)
          .send({ title: 'Updated Title' })
          .expect(401);
      });

      it('should reject update by non-owner', async () => {
        // Create another user
        const otherUserData = testData.validUser('other@example.com');
        const otherUserResponse = await request(app.server)
          .post('/api/auth/register')
          .send(otherUserData);

        const otherToken = otherUserResponse.body.token;

        await request(app.server)
          .put(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send({ title: 'Hacked Title' })
          .expect(403);
      });

      it('should allow partial updates', async () => {
        const originalResponse = await request(app.server)
          .get(`/api/posts/${postId}`);
        const originalContent = originalResponse.body.content;

        const response = await request(app.server)
          .put(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Only Title Updated' })
          .expect(200);

        expect(response.body.title).toBe('Only Title Updated');
        expect(response.body.content).toBe(originalContent);
      });

      it('should return 404 for non-existent post', async () => {
        await request(app.server)
          .put('/api/posts/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Title' })
          .expect(404);
      });
    });

    describe('Delete Post', () => {
      let postId: number;

      beforeEach(async () => {
        const postData = testData.validPost();
        const response = await request(app.server)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(postData);
        postId = response.body.id;
      });

      it('should delete post successfully', async () => {
        await request(app.server)
          .delete(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        // Verify post is deleted
        await request(app.server)
          .get(`/api/posts/${postId}`)
          .expect(404);
      });

      it('should reject delete without authentication', async () => {
        await request(app.server)
          .delete(`/api/posts/${postId}`)
          .expect(401);
      });

      it('should reject delete by non-owner', async () => {
        // Create another user
        const otherUserData = testData.validUser('other@example.com');
        const otherUserResponse = await request(app.server)
          .post('/api/auth/register')
          .send(otherUserData);

        const otherToken = otherUserResponse.body.token;

        await request(app.server)
          .delete(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(403);
      });

      it('should return 404 for non-existent post', async () => {
        await request(app.server)
          .delete('/api/posts/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should soft delete post (keep in database)', async () => {
        await request(app.server)
          .delete(`/api/posts/${postId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        // Post should not appear in normal queries
        await request(app.server)
          .get(`/api/posts/${postId}`)
          .expect(404);

        // But should be accessible to admin with includeDeleted flag
        // (This would be tested in admin-specific tests)
      });
    });
  });

  describe('Comments CRUD', () => {
    let postId: number;

    beforeEach(async () => {
      const postData = testData.validPost();
      const response = await request(app.server)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);
      postId = response.body.id;
    });

    describe('Create Comment', () => {
      it('should create comment on post', async () => {
        const commentData = testData.validComment(postId);

        const response = await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(commentData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.content).toBe(commentData.content);
        expect(response.body.postId).toBe(postId);
        expect(response.body.authorId).toBe(userId);
      });

      it('should create nested comment reply', async () => {
        // Create parent comment
        const parentCommentData = testData.validComment(postId);
        const parentResponse = await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(parentCommentData);

        const parentCommentId = parentResponse.body.id;

        // Create reply
        const replyData = testData.validComment(postId, parentCommentId);
        const response = await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(replyData)
          .expect(201);

        expect(response.body.parentId).toBe(parentCommentId);
        expect(response.body.postId).toBe(postId);
      });

      it('should reject comment on non-existent post', async () => {
        const commentData = testData.validComment(999999);

        await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(commentData)
          .expect(404);
      });
    });

    describe('Read Comments', () => {
      it('should get comments for a post', async () => {
        // Create multiple comments
        const promises = Array(5).fill(0).map((_, i) =>
          request(app.server)
            .post('/api/comments')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testData.validComment(postId, undefined, `Comment ${i}`))
        );
        await Promise.all(promises);

        const response = await request(app.server)
          .get(`/api/posts/${postId}/comments`)
          .expect(200);

        expect(response.body).toHaveLength(5);
        expect(response.body.every((comment: any) => comment.postId === postId)).toBe(true);
      });

      it('should get nested comments with proper threading', async () => {
        // Create parent comment
        const parentResponse = await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData.validComment(postId));

        const parentId = parentResponse.body.id;

        // Create multiple replies
        const promises = Array(3).fill(0).map((_, i) =>
          request(app.server)
            .post('/api/comments')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testData.validComment(postId, parentId, `Reply ${i}`))
        );
        await Promise.all(promises);

        const response = await request(app.server)
          .get(`/api/posts/${postId}/comments?threaded=true`)
          .expect(200);

        const parentComment = response.body.find((c: any) => c.id === parentId);
        expect(parentComment).toBeDefined();
        expect(parentComment.replies).toHaveLength(3);
      });
    });

    describe('Update Comment', () => {
      let commentId: number;

      beforeEach(async () => {
        const commentData = testData.validComment(postId);
        const response = await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(commentData);
        commentId = response.body.id;
      });

      it('should update comment content', async () => {
        const updateData = { content: 'Updated comment content' };

        const response = await request(app.server)
          .put(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.content).toBe(updateData.content);
        expect(response.body.edited).toBe(true);
        expect(response.body).toHaveProperty('editedAt');
      });

      it('should reject update by non-author', async () => {
        const otherUserData = testData.validUser('other@example.com');
        const otherUserResponse = await request(app.server)
          .post('/api/auth/register')
          .send(otherUserData);

        const otherToken = otherUserResponse.body.token;

        await request(app.server)
          .put(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send({ content: 'Hacked content' })
          .expect(403);
      });
    });

    describe('Delete Comment', () => {
      let commentId: number;

      beforeEach(async () => {
        const commentData = testData.validComment(postId);
        const response = await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(commentData);
        commentId = response.body.id;
      });

      it('should delete comment', async () => {
        await request(app.server)
          .delete(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        // Verify comment is deleted/marked as deleted
        const response = await request(app.server)
          .get(`/api/posts/${postId}/comments`);

        const comment = response.body.find((c: any) => c.id === commentId);
        expect(comment?.deleted).toBe(true);
        expect(comment?.content).toBe('[deleted]');
      });

      it('should preserve comment structure when deleting parent with replies', async () => {
        // Create reply to the comment
        const replyData = testData.validComment(postId, commentId);
        await request(app.server)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(replyData);

        // Delete parent comment
        await request(app.server)
          .delete(`/api/comments/${commentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);

        // Parent should be marked as deleted but structure preserved
        const response = await request(app.server)
          .get(`/api/posts/${postId}/comments?threaded=true`);

        const parentComment = response.body.find((c: any) => c.id === commentId);
        expect(parentComment.deleted).toBe(true);
        expect(parentComment.replies).toHaveLength(1);
      });
    });
  });

  describe('User Profile CRUD', () => {
    describe('Read User Profile', () => {
      it('should get own profile', async () => {
        const response = await request(app.server)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(userId);
        expect(response.body).toHaveProperty('username');
        expect(response.body).toHaveProperty('email');
        expect(response.body).not.toHaveProperty('password');
      });

      it('should get public user profile', async () => {
        const response = await request(app.server)
          .get(`/api/users/${userId}`)
          .expect(200);

        expect(response.body.id).toBe(userId);
        expect(response.body).toHaveProperty('username');
        expect(response.body).not.toHaveProperty('email'); // Email should be private
        expect(response.body).not.toHaveProperty('password');
      });
    });

    describe('Update User Profile', () => {
      it('should update profile information', async () => {
        const updateData = {
          username: 'newusername',
          bio: 'Updated bio',
          location: 'New York'
        };

        const response = await request(app.server)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.username).toBe(updateData.username);
        expect(response.body.bio).toBe(updateData.bio);
        expect(response.body.location).toBe(updateData.location);
      });

      it('should reject duplicate username', async () => {
        // Create another user
        const otherUserData = testData.validUser('other@example.com');
        const otherUserResponse = await request(app.server)
          .post('/api/auth/register')
          .send(otherUserData);

        // Try to update to existing username
        const response = await request(app.server)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ username: otherUserData.username })
          .expect(409);

        expect(response.body.error).toContain('username already taken');
      });
    });
  });
});