/**
 * Tests for postsService
 */
import postsService from './postsService';
import api from './api';

jest.mock('./api');

describe('postsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('fetches posts without parameters', async () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      await postsService.getPosts();

      expect(api.get).toHaveBeenCalledWith('/posts');
    });

    it('fetches posts with pagination', async () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      await postsService.getPosts({ page: 2, limit: 20 });

      expect(api.get).toHaveBeenCalledWith('/posts?page=2&limit=20');
    });

    it('fetches posts with sort parameter', async () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      await postsService.getPosts({ sort: 'new' });

      expect(api.get).toHaveBeenCalledWith('/posts?sort=new');
    });

    it('fetches posts for specific community', async () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      await postsService.getPosts({ community: 'tech' });

      expect(api.get).toHaveBeenCalledWith('/posts?community=tech');
    });
  });

  describe('getTrending', () => {
    it('fetches trending posts', async () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      await postsService.getTrending();

      expect(api.get).toHaveBeenCalledWith('/posts/trending');
    });

    it('fetches trending with timeFrame', async () => {
      api.get.mockResolvedValue({ data: { posts: [] } });

      await postsService.getTrending({ timeFrame: 'week' });

      expect(api.get).toHaveBeenCalledWith('/posts/trending?timeFrame=week');
    });
  });

  describe('getPost', () => {
    it('fetches a single post by ID', async () => {
      const mockPost = { id: '123', title: 'Test Post' };
      api.get.mockResolvedValue({ data: mockPost });

      await postsService.getPost('123');

      expect(api.get).toHaveBeenCalledWith('/posts/123');
    });
  });

  describe('createPost', () => {
    it('creates a new post', async () => {
      const postData = {
        title: 'New Post',
        content: 'Content here',
        community: 'tech'
      };

      api.post.mockResolvedValue({ data: { id: '1', ...postData } });

      await postsService.createPost(postData);

      expect(api.post).toHaveBeenCalledWith('/posts', postData);
    });
  });

  describe('updatePost', () => {
    it('updates an existing post', async () => {
      const updateData = { title: 'Updated Title' };

      api.patch.mockResolvedValue({ data: { success: true } });

      await postsService.updatePost('123', updateData);

      expect(api.patch).toHaveBeenCalledWith('/posts/123', updateData);
    });
  });

  describe('deletePost', () => {
    it('deletes a post', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      await postsService.deletePost('123');

      expect(api.delete).toHaveBeenCalledWith('/posts/123');
    });
  });

  describe('votePost', () => {
    it('upvotes a post', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await postsService.votePost('123', 1);

      expect(api.post).toHaveBeenCalledWith('/posts/123/vote', { value: 1 });
    });

    it('downvotes a post', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await postsService.votePost('123', -1);

      expect(api.post).toHaveBeenCalledWith('/posts/123/vote', { value: -1 });
    });

    it('removes vote from a post', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await postsService.votePost('123', 0);

      expect(api.post).toHaveBeenCalledWith('/posts/123/vote', { value: 0 });
    });
  });

  describe('getVoteStatus', () => {
    it('fetches vote status for a post', async () => {
      api.get.mockResolvedValue({ data: { vote: 1 } });

      await postsService.getVoteStatus('123');

      expect(api.get).toHaveBeenCalledWith('/posts/123/vote-status');
    });
  });
});
