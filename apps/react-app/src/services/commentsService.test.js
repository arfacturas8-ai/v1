/**
 * Tests for commentsService
 */
import commentsService from './commentsService';
import api from './api';

jest.mock('./api');

describe('commentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPostComments', () => {
    it('fetches comments for a post', async () => {
      const mockComments = [
        { id: '1', content: 'First comment', postId: 'post-1' },
        { id: '2', content: 'Second comment', postId: 'post-1' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { comments: mockComments }
      });

      const result = await commentsService.getPostComments('post-1');

      expect(api.get).toHaveBeenCalledWith('/posts/post-1/comments');
      expect(result.success).toBe(true);
      expect(result.data.comments).toEqual(mockComments);
    });

    it('fetches comments with query parameters', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { comments: [] }
      });

      await commentsService.getPostComments('post-1', { page: 2, limit: 20, sort: 'top' });

      expect(api.get).toHaveBeenCalledWith('/posts/post-1/comments?page=2&limit=20&sort=top');
    });

    it('handles fetch errors', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(commentsService.getPostComments('post-1')).rejects.toThrow('Network error');
    });
  });

  describe('getComment', () => {
    it('fetches a single comment', async () => {
      const mockComment = { id: '1', content: 'Test comment' };

      api.get.mockResolvedValue({
        success: true,
        data: mockComment
      });

      const result = await commentsService.getComment('1');

      expect(api.get).toHaveBeenCalledWith('/comments/1');
      expect(result.success).toBe(true);
    });

    it('handles not found', async () => {
      api.get.mockRejectedValue(new Error('Comment not found'));

      await expect(commentsService.getComment('invalid')).rejects.toThrow();
    });
  });

  describe('createComment', () => {
    it('creates a new comment', async () => {
      const commentData = { content: 'New comment' };
      const mockResponse = { id: '1', ...commentData, postId: 'post-1' };

      api.post.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await commentsService.createComment('post-1', commentData);

      expect(api.post).toHaveBeenCalledWith('/posts/post-1/comments', commentData);
      expect(result.success).toBe(true);
      expect(result.data.content).toBe('New comment');
    });

    it('handles validation errors', async () => {
      api.post.mockRejectedValue(new Error('Content is required'));

      await expect(
        commentsService.createComment('post-1', {})
      ).rejects.toThrow('Content is required');
    });
  });

  describe('replyToComment', () => {
    it('creates a reply to a comment', async () => {
      const replyData = { content: 'This is a reply' };

      api.post.mockResolvedValue({
        success: true,
        data: { id: '2', ...replyData, parentCommentId: '1' }
      });

      const result = await commentsService.replyToComment('1', replyData);

      expect(api.post).toHaveBeenCalledWith('/comments/1/reply', replyData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateComment', () => {
    it('updates a comment', async () => {
      const updateData = { content: 'Updated content' };

      api.patch.mockResolvedValue({
        success: true,
        data: { id: '1', ...updateData }
      });

      const result = await commentsService.updateComment('1', updateData);

      expect(api.patch).toHaveBeenCalledWith('/comments/1', updateData);
      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Updated content');
    });

    it('handles unauthorized updates', async () => {
      api.patch.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        commentsService.updateComment('1', { content: 'hack' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteComment', () => {
    it('deletes a comment', async () => {
      api.delete.mockResolvedValue({
        success: true,
        message: 'Comment deleted'
      });

      const result = await commentsService.deleteComment('1');

      expect(api.delete).toHaveBeenCalledWith('/comments/1');
      expect(result.success).toBe(true);
    });

    it('handles delete errors', async () => {
      api.delete.mockRejectedValue(new Error('Not found'));

      await expect(commentsService.deleteComment('invalid')).rejects.toThrow();
    });
  });

  describe('voteComment', () => {
    it('upvotes a comment', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { votes: 1 }
      });

      const result = await commentsService.voteComment('1', 1);

      expect(api.post).toHaveBeenCalledWith('/comments/1/vote', { value: 1 });
      expect(result.success).toBe(true);
    });

    it('downvotes a comment', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { votes: -1 }
      });

      await commentsService.voteComment('1', -1);

      expect(api.post).toHaveBeenCalledWith('/comments/1/vote', { value: -1 });
    });

    it('removes vote', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { votes: 0 }
      });

      await commentsService.voteComment('1', 0);

      expect(api.post).toHaveBeenCalledWith('/comments/1/vote', { value: 0 });
    });
  });

  describe('getVoteStatus', () => {
    it('gets vote status for a comment', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { userVote: 1, totalVotes: 42 }
      });

      const result = await commentsService.getVoteStatus('1');

      expect(api.get).toHaveBeenCalledWith('/comments/1/vote-status');
      expect(result.data.userVote).toBe(1);
    });
  });

  describe('reportComment', () => {
    it('reports a comment', async () => {
      const reportData = { reason: 'spam', details: 'This is spam' };

      api.post.mockResolvedValue({
        success: true,
        message: 'Comment reported'
      });

      const result = await commentsService.reportComment('1', reportData);

      expect(api.post).toHaveBeenCalledWith('/comments/1/report', reportData);
      expect(result.success).toBe(true);
    });
  });

  describe('getCommentThread', () => {
    it('gets comment thread with replies', async () => {
      const mockThread = {
        id: '1',
        content: 'Parent comment',
        replies: [
          { id: '2', content: 'Reply 1' },
          { id: '3', content: 'Reply 2' }
        ]
      };

      api.get.mockResolvedValue({
        success: true,
        data: mockThread
      });

      const result = await commentsService.getCommentThread('1');

      expect(api.get).toHaveBeenCalledWith('/comments/1/thread');
      expect(result.data.replies).toHaveLength(2);
    });
  });

  describe('getUserComments', () => {
    it('gets user comments', async () => {
      const mockComments = [
        { id: '1', content: 'Comment 1', authorUsername: 'testuser' },
        { id: '2', content: 'Comment 2', authorUsername: 'testuser' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { comments: mockComments }
      });

      const result = await commentsService.getUserComments('testuser');

      expect(api.get).toHaveBeenCalledWith('/users/testuser/comments');
      expect(result.data.comments).toHaveLength(2);
    });

    it('gets user comments with pagination', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { comments: [] }
      });

      await commentsService.getUserComments('testuser', { page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/users/testuser/comments?page=2&limit=10');
    });
  });

  describe('loadMoreReplies', () => {
    it('loads more replies for a comment', async () => {
      const mockReplies = [
        { id: '3', content: 'Reply 3' },
        { id: '4', content: 'Reply 4' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { replies: mockReplies }
      });

      const result = await commentsService.loadMoreReplies('1', { page: 2 });

      expect(api.get).toHaveBeenCalledWith('/comments/1/replies?page=2');
      expect(result.data.replies).toHaveLength(2);
    });
  });

  describe('getTopLevelComments', () => {
    it('gets only top-level comments', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { comments: [] }
      });

      await commentsService.getTopLevelComments('post-1');

      expect(api.get).toHaveBeenCalledWith('/posts/post-1/comments?topLevel=true');
    });

    it('passes additional parameters', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { comments: [] }
      });

      await commentsService.getTopLevelComments('post-1', { sort: 'new', limit: 25 });

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('topLevel=true')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('sort=new')
      );
    });
  });

  describe('toggleCommentCollapse', () => {
    it('collapses a comment', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { collapsed: true }
      });

      const result = await commentsService.toggleCommentCollapse('1', true);

      expect(api.post).toHaveBeenCalledWith('/comments/1/toggle-collapse', { collapsed: true });
      expect(result.success).toBe(true);
    });

    it('expands a comment', async () => {
      api.post.mockResolvedValue({
        success: true,
        data: { collapsed: false }
      });

      await commentsService.toggleCommentCollapse('1', false);

      expect(api.post).toHaveBeenCalledWith('/comments/1/toggle-collapse', { collapsed: false });
    });
  });

  describe('awardComment', () => {
    it('awards a comment', async () => {
      const awardData = { awardType: 'gold', message: 'Great comment!' };

      api.post.mockResolvedValue({
        success: true,
        data: { award: awardData }
      });

      const result = await commentsService.awardComment('1', awardData);

      expect(api.post).toHaveBeenCalledWith('/comments/1/award', awardData);
      expect(result.success).toBe(true);
    });
  });

  describe('getCommentAwards', () => {
    it('gets awards for a comment', async () => {
      const mockAwards = [
        { id: '1', type: 'gold', count: 2 },
        { id: '2', type: 'silver', count: 5 }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { awards: mockAwards }
      });

      const result = await commentsService.getCommentAwards('1');

      expect(api.get).toHaveBeenCalledWith('/comments/1/awards');
      expect(result.data.awards).toHaveLength(2);
    });
  });

  describe('searchComments', () => {
    it('searches comments', async () => {
      const mockResults = [
        { id: '1', content: 'Found comment 1' },
        { id: '2', content: 'Found comment 2' }
      ];

      api.get.mockResolvedValue({
        success: true,
        data: { results: mockResults }
      });

      const result = await commentsService.searchComments('test query');

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('q=test+query')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('type=comments')
      );
    });

    it('searches comments with filters', async () => {
      api.get.mockResolvedValue({
        success: true,
        data: { results: [] }
      });

      await commentsService.searchComments('query', { author: 'user1', sort: 'recent' });

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('author=user1')
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('sort=recent')
      );
    });
  });
});
