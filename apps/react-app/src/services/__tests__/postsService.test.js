import { describe, it, expect, vi, beforeEach } from 'vitest';
import postsService from '../postsService';

jest.mock('../api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('postsService', () => {
  let apiMock;

  beforeEach(async () => {
    apiMock = (await import('../api')).default;
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', content: 'Content 1' },
        { id: '2', title: 'Post 2', content: 'Content 2' },
      ];
      apiMock.get.mockResolvedValue({ success: true, data: mockPosts });

      const result = await postsService.getPosts();

      expect(apiMock.get).toHaveBeenCalledWith('/posts');
      expect(result.data).toEqual(mockPosts);
    });

    it('should handle pagination params', async () => {
      apiMock.get.mockResolvedValue({ success: true, data: [] });

      await postsService.getPosts({ page: 2, limit: 20 });

      expect(apiMock.get).toHaveBeenCalledWith('/posts', {
        params: { page: 2, limit: 20 },
      });
    });
  });

  describe('getPost', () => {
    it('should fetch single post', async () => {
      const mockPost = { id: '1', title: 'Test Post' };
      apiMock.get.mockResolvedValue({ success: true, data: mockPost });

      const result = await postsService.getPost('1');

      expect(apiMock.get).toHaveBeenCalledWith('/posts/1');
      expect(result.data).toEqual(mockPost);
    });
  });

  describe('createPost', () => {
    it('should create post successfully', async () => {
      const newPost = { title: 'New Post', content: 'Content' };
      const mockResponse = { success: true, data: { id: '1', ...newPost } };
      apiMock.post.mockResolvedValue(mockResponse);

      const result = await postsService.createPost(newPost);

      expect(apiMock.post).toHaveBeenCalledWith('/posts', newPost);
      expect(result.data.title).toBe('New Post');
    });

    it('should handle validation errors', async () => {
      const mockError = { success: false, message: 'Title required' };
      apiMock.post.mockResolvedValue(mockError);

      const result = await postsService.createPost({ content: 'No title' });

      expect(result.success).toBe(false);
    });
  });

  describe('updatePost', () => {
    it('should update post successfully', async () => {
      const updates = { title: 'Updated Title' };
      const mockResponse = { success: true, data: { id: '1', ...updates } };
      apiMock.put.mockResolvedValue(mockResponse);

      const result = await postsService.updatePost('1', updates);

      expect(apiMock.put).toHaveBeenCalledWith('/posts/1', updates);
      expect(result.data.title).toBe('Updated Title');
    });
  });

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      apiMock.delete.mockResolvedValue({ success: true });

      const result = await postsService.deletePost('1');

      expect(apiMock.delete).toHaveBeenCalledWith('/posts/1');
      expect(result.success).toBe(true);
    });
  });

  describe('likePost', () => {
    it('should like post successfully', async () => {
      apiMock.post.mockResolvedValue({ success: true });

      const result = await postsService.likePost('1');

      expect(apiMock.post).toHaveBeenCalledWith('/posts/1/like');
      expect(result.success).toBe(true);
    });
  });

  describe('unlikePost', () => {
    it('should unlike post successfully', async () => {
      apiMock.delete.mockResolvedValue({ success: true });

      const result = await postsService.unlikePost('1');

      expect(apiMock.delete).toHaveBeenCalledWith('/posts/1/like');
      expect(result.success).toBe(true);
    });
  });

  describe('searchPosts', () => {
    it('should search posts by query', async () => {
      const mockResults = [{ id: '1', title: 'Search Result' }];
      apiMock.get.mockResolvedValue({ success: true, data: mockResults });

      const result = await postsService.searchPosts('test query');

      expect(apiMock.get).toHaveBeenCalledWith('/posts/search', {
        params: { q: 'test query' },
      });
      expect(result.data).toEqual(mockResults);
    });
  });
});
