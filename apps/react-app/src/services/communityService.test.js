/**
 * Comprehensive tests for communityService
 */
import communityService from './communityService';
import apiService from './api';

jest.mock('./api');

describe('communityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Communities CRUD
  describe('getCommunities', () => {
    it('fetches communities with default options', async () => {
      const mockResponse = {
        success: true,
        data: {
          communities: [{ id: '1', name: 'test-community', displayName: 'Test Community' }],
          pagination: { page: 1, total: 1 }
        }
      };
      apiService.get.mockResolvedValue(mockResponse);

      const result = await communityService.getCommunities();

      expect(result.success).toBe(true);
      expect(result.communities).toHaveLength(1);
      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/communities'));
    });

    it('applies pagination and filters', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { communities: [] } });

      await communityService.getCommunities({ page: 2, limit: 50, sort: 'new', category: 'gaming' });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('page=2');
      expect(callArg).toContain('limit=50');
      expect(callArg).toContain('sort=new');
      expect(callArg).toContain('category=gaming');
    });

    it('handles API errors', async () => {
      apiService.get.mockRejectedValue(new Error('Network error'));

      const result = await communityService.getCommunities();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getCommunity', () => {
    it('fetches community by ID', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { community: { id: '1', name: 'test' } } });

      const result = await communityService.getCommunity('test-community');

      expect(result.success).toBe(true);
      expect(apiService.get).toHaveBeenCalledWith('/communities/test-community');
    });

    it('handles community not found', async () => {
      apiService.get.mockRejectedValue(new Error('Not found'));

      const result = await communityService.getCommunity('invalid');

      expect(result.success).toBe(false);
    });
  });

  describe('createCommunity', () => {
    it('creates community with basic data', async () => {
      const communityData = { name: 'new-community', displayName: 'New Community', description: 'Test desc', isPublic: true };
      apiService.post.mockResolvedValue({ success: true, data: { community: { id: '1' } } });

      const result = await communityService.createCommunity(communityData);

      expect(apiService.post).toHaveBeenCalledWith('/communities', expect.any(FormData));
      expect(result.success).toBe(true);
    });

    it('creates community with icon and banner', async () => {
      const icon = new File(['icon'], 'icon.png');
      const banner = new File(['banner'], 'banner.png');
      apiService.post.mockResolvedValue({ success: true, data: { community: {} } });

      await communityService.createCommunity({ name: 'test', displayName: 'Test', icon, banner });

      const formData = apiService.post.mock.calls[0][1];
      expect(formData.get('icon')).toBe(icon);
      expect(formData.get('banner')).toBe(banner);
    });

    it('handles creation error', async () => {
      apiService.post.mockRejectedValue(new Error('Creation failed'));

      const result = await communityService.createCommunity({ name: 'test', displayName: 'Test' });

      expect(result.success).toBe(false);
    });
  });

  describe('updateCommunity', () => {
    it('updates community data', async () => {
      apiService.put.mockResolvedValue({ success: true, data: { community: {} } });

      const result = await communityService.updateCommunity('com-1', { displayName: 'Updated' });

      expect(apiService.put).toHaveBeenCalledWith('/communities/com-1', expect.any(FormData));
      expect(result.success).toBe(true);
    });
  });

  describe('joinCommunity', () => {
    it('joins community successfully', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { membership: {} } });

      const result = await communityService.joinCommunity('com-1');

      expect(apiService.post).toHaveBeenCalledWith('/communities/com-1/join');
      expect(result.success).toBe(true);
    });
  });

  describe('leaveCommunity', () => {
    it('leaves community successfully', async () => {
      apiService.post.mockResolvedValue({ success: true });

      const result = await communityService.leaveCommunity('com-1');

      expect(apiService.post).toHaveBeenCalledWith('/communities/com-1/leave');
      expect(result.success).toBe(true);
    });
  });

  // Posts
  describe('getPosts', () => {
    it('fetches posts with default options', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { posts: [{ id: '1' }] } });

      const result = await communityService.getPosts();

      expect(result.success).toBe(true);
      expect(result.posts).toHaveLength(1);
    });

    it('fetches posts with filters', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { posts: [] } });

      await communityService.getPosts({ communityId: 'com-1', sort: 'top', timeRange: 'week' });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('communityId=com-1');
      expect(callArg).toContain('sort=top');
      expect(callArg).toContain('timeRange=week');
    });
  });

  describe('getPost', () => {
    it('fetches post by ID', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { post: { id: '1', title: 'Test Post' } } });

      const result = await communityService.getPost('post-1');

      expect(apiService.get).toHaveBeenCalledWith('/posts/post-1');
      expect(result.success).toBe(true);
    });
  });

  describe('createPost', () => {
    it('creates text post', async () => {
      const postData = { title: 'Test Post', content: 'Content', type: 'text', communityId: 'com-1' };
      apiService.post.mockResolvedValue({ success: true, data: { post: { id: '1' } } });

      const result = await communityService.createPost(postData);

      expect(apiService.post).toHaveBeenCalledWith('/posts', expect.any(FormData));
      expect(result.success).toBe(true);
    });

    it('creates post with media files', async () => {
      const media = [new File(['image'], 'test.jpg'), new File(['image2'], 'test2.jpg')];
      const postData = { title: 'Test', communityId: 'com-1', media };
      apiService.post.mockResolvedValue({ success: true, data: { post: {} } });

      await communityService.createPost(postData);

      const formData = apiService.post.mock.calls[0][1];
      expect(formData.getAll('media')).toHaveLength(2);
    });
  });

  describe('updatePost', () => {
    it('updates post content', async () => {
      apiService.put.mockResolvedValue({ success: true, data: { post: {} } });

      const result = await communityService.updatePost('post-1', { content: 'Updated content' });

      expect(apiService.put).toHaveBeenCalledWith('/posts/post-1', { content: 'Updated content' });
      expect(result.success).toBe(true);
    });
  });

  describe('deletePost', () => {
    it('deletes post successfully', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await communityService.deletePost('post-1');

      expect(apiService.delete).toHaveBeenCalledWith('/posts/post-1');
      expect(result.success).toBe(true);
    });
  });

  describe('votePost', () => {
    it('upvotes post', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { vote: 'up', karma: 100 } });

      const result = await communityService.votePost('post-1', 'up');

      expect(apiService.post).toHaveBeenCalledWith('/posts/post-1/vote', { type: 'up' });
      expect(result.success).toBe(true);
    });

    it('downvotes post', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { vote: 'down', karma: -1 } });

      await communityService.votePost('post-1', 'down');

      expect(apiService.post).toHaveBeenCalledWith('/posts/post-1/vote', { type: 'down' });
    });
  });

  describe('savePost', () => {
    it('saves post', async () => {
      apiService.post.mockResolvedValue({ success: true });

      const result = await communityService.savePost('post-1', true);

      expect(apiService.post).toHaveBeenCalledWith('/posts/post-1/save');
      expect(result.success).toBe(true);
    });

    it('unsaves post', async () => {
      apiService.post.mockResolvedValue({ success: true });

      await communityService.savePost('post-1', false);

      expect(apiService.post).toHaveBeenCalledWith('/posts/post-1/unsave');
    });
  });

  // Comments
  describe('getComments', () => {
    it('fetches post comments', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { comments: [{ id: '1', content: 'Test comment' }] } });

      const result = await communityService.getComments('post-1');

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/posts/post-1/comments'));
      expect(result.success).toBe(true);
      expect(result.comments).toHaveLength(1);
    });

    it('fetches comments with sorting', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { comments: [] } });

      await communityService.getComments('post-1', { sort: 'top', limit: '50' });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('sort=top');
      expect(callArg).toContain('limit=50');
    });
  });

  describe('createComment', () => {
    it('creates top-level comment', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { comment: { id: '1' } } });

      const result = await communityService.createComment('post-1', 'My comment');

      expect(apiService.post).toHaveBeenCalledWith('/comments', { postId: 'post-1', content: 'My comment', parentId: null });
      expect(result.success).toBe(true);
    });

    it('creates reply comment', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { comment: {} } });

      await communityService.createComment('post-1', 'Reply', 'comment-1');

      expect(apiService.post).toHaveBeenCalledWith('/comments', expect.objectContaining({ parentId: 'comment-1' }));
    });
  });

  describe('updateComment', () => {
    it('updates comment content', async () => {
      apiService.put.mockResolvedValue({ success: true, data: { comment: {} } });

      const result = await communityService.updateComment('comment-1', 'Updated content');

      expect(apiService.put).toHaveBeenCalledWith('/comments/comment-1', { content: 'Updated content' });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteComment', () => {
    it('deletes comment successfully', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await communityService.deleteComment('comment-1');

      expect(apiService.delete).toHaveBeenCalledWith('/comments/comment-1');
      expect(result.success).toBe(true);
    });
  });

  describe('voteComment', () => {
    it('votes on comment', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { vote: 'up', karma: 10 } });

      const result = await communityService.voteComment('comment-1', 'up');

      expect(apiService.post).toHaveBeenCalledWith('/comments/comment-1/vote', { type: 'up' });
      expect(result.success).toBe(true);
    });
  });

  // Karma & Awards
  describe('getUserKarma', () => {
    it('gets current user karma', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { karma: { post: 100, comment: 50 } } });

      const result = await communityService.getUserKarma();

      expect(apiService.get).toHaveBeenCalledWith('/karma');
      expect(result.success).toBe(true);
    });

    it('gets specific user karma', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { karma: {} } });

      await communityService.getUserKarma('user-1');

      expect(apiService.get).toHaveBeenCalledWith('/karma/user-1');
    });
  });

  describe('getAwards', () => {
    it('fetches available awards', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { awards: [{ id: '1', name: 'Gold' }] } });

      const result = await communityService.getAwards();

      expect(apiService.get).toHaveBeenCalledWith('/awards');
      expect(result.success).toBe(true);
    });
  });

  describe('giveAward', () => {
    it('gives award to post', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { award: {} } });

      const result = await communityService.giveAward('post-1', 'gold', 'Great post!');

      expect(apiService.post).toHaveBeenCalledWith('/posts/post-1/award', { awardType: 'gold', message: 'Great post!' });
      expect(result.success).toBe(true);
    });
  });

  describe('giveCommentAward', () => {
    it('gives award to comment', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { award: {} } });

      const result = await communityService.giveCommentAward('comment-1', 'silver');

      expect(apiService.post).toHaveBeenCalledWith('/comments/comment-1/award', { awardType: 'silver', message: '' });
      expect(result.success).toBe(true);
    });
  });

  // Reporting
  describe('reportPost', () => {
    it('reports post', async () => {
      apiService.post.mockResolvedValue({ success: true });

      const result = await communityService.reportPost('post-1', 'spam', 'This is spam');

      expect(apiService.post).toHaveBeenCalledWith('/posts/post-1/report', { reason: 'spam', details: 'This is spam' });
      expect(result.success).toBe(true);
    });
  });

  describe('reportComment', () => {
    it('reports comment', async () => {
      apiService.post.mockResolvedValue({ success: true });

      const result = await communityService.reportComment('comment-1', 'harassment');

      expect(apiService.post).toHaveBeenCalledWith('/comments/comment-1/report', { reason: 'harassment', details: '' });
      expect(result.success).toBe(true);
    });
  });

  // Search & Discovery
  describe('searchCommunities', () => {
    it('searches with query', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { results: {}, total: 0 } });

      const result = await communityService.searchCommunities('gaming', { type: 'communities' });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('q=gaming');
      expect(callArg).toContain('type=communities');
      expect(result.success).toBe(true);
    });
  });

  describe('getTrendingTopics', () => {
    it('fetches trending topics', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { topics: ['topic1', 'topic2'] } });

      const result = await communityService.getTrendingTopics('24h');

      expect(apiService.get).toHaveBeenCalledWith('/trending?timeRange=24h');
      expect(result.success).toBe(true);
    });
  });

  describe('getFeaturedCommunities', () => {
    it('fetches featured communities', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { communities: [] } });

      const result = await communityService.getFeaturedCommunities();

      expect(apiService.get).toHaveBeenCalledWith('/communities/featured');
      expect(result.success).toBe(true);
    });
  });

  describe('getRecommendedCommunities', () => {
    it('fetches recommended communities for current user', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { communities: [] } });

      await communityService.getRecommendedCommunities();

      expect(apiService.get).toHaveBeenCalledWith('/communities/recommended');
    });

    it('fetches recommended communities for specific user', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { communities: [] } });

      await communityService.getRecommendedCommunities('user-1');

      expect(apiService.get).toHaveBeenCalledWith('/communities/recommended?userId=user-1');
    });
  });

  // Member Management
  describe('getCommunityMembers', () => {
    it('fetches community members', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { members: [], pagination: {} } });

      const result = await communityService.getCommunityMembers('com-1', { page: 1, limit: 50 });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('/communities/com-1/members');
      expect(callArg).toContain('page=1');
      expect(result.success).toBe(true);
    });
  });

  describe('updateMemberRole', () => {
    it('updates member role', async () => {
      apiService.put.mockResolvedValue({ success: true, data: { member: {} } });

      const result = await communityService.updateMemberRole('com-1', 'user-1', 'moderator');

      expect(apiService.put).toHaveBeenCalledWith('/communities/com-1/members/user-1', { role: 'moderator' });
      expect(result.success).toBe(true);
    });
  });

  describe('removeMember', () => {
    it('removes member from community', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await communityService.removeMember('com-1', 'user-1');

      expect(apiService.delete).toHaveBeenCalledWith('/communities/com-1/members/user-1');
      expect(result.success).toBe(true);
    });
  });

  describe('banMember', () => {
    it('bans member with reason and duration', async () => {
      apiService.post.mockResolvedValue({ success: true });

      const result = await communityService.banMember('com-1', 'user-1', 'spam', '7d');

      expect(apiService.post).toHaveBeenCalledWith('/communities/com-1/members/user-1/ban', { reason: 'spam', duration: '7d' });
      expect(result.success).toBe(true);
    });
  });

  describe('unbanMember', () => {
    it('unbans member', async () => {
      apiService.delete.mockResolvedValue({ success: true });

      const result = await communityService.unbanMember('com-1', 'user-1');

      expect(apiService.delete).toHaveBeenCalledWith('/communities/com-1/members/user-1/ban');
      expect(result.success).toBe(true);
    });
  });

  // Analytics & Moderation
  describe('getCommunityAnalytics', () => {
    it('fetches community analytics', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { analytics: { members: 100, posts: 500 } } });

      const result = await communityService.getCommunityAnalytics('com-1', '30d');

      expect(apiService.get).toHaveBeenCalledWith('/communities/com-1/analytics?timeRange=30d');
      expect(result.success).toBe(true);
    });
  });

  describe('getModerationQueue', () => {
    it('fetches moderation queue', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { queue: [], pagination: {} } });

      const result = await communityService.getModerationQueue('com-1', { type: 'posts', status: 'pending' });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('/communities/com-1/moderation');
      expect(callArg).toContain('type=posts');
      expect(result.success).toBe(true);
    });
  });

  describe('moderateContent', () => {
    it('moderates content', async () => {
      apiService.post.mockResolvedValue({ success: true, data: { result: {} } });

      const result = await communityService.moderateContent('com-1', 'content-1', 'approve', 'Looks good');

      expect(apiService.post).toHaveBeenCalledWith('/communities/com-1/moderation/content-1', { action: 'approve', reason: 'Looks good' });
      expect(result.success).toBe(true);
    });
  });

  // Events
  describe('getCommunityEvents', () => {
    it('fetches community events', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { events: [], pagination: {} } });

      const result = await communityService.getCommunityEvents('com-1', { upcoming: true });

      const callArg = apiService.get.mock.calls[0][0];
      expect(callArg).toContain('/communities/com-1/events');
      expect(callArg).toContain('upcoming=true');
      expect(result.success).toBe(true);
    });
  });

  describe('createCommunityEvent', () => {
    it('creates community event', async () => {
      const eventData = { title: 'Game Night', date: '2024-12-25', description: 'Join us!' };
      apiService.post.mockResolvedValue({ success: true, data: { event: {} } });

      const result = await communityService.createCommunityEvent('com-1', eventData);

      expect(apiService.post).toHaveBeenCalledWith('/communities/com-1/events', eventData);
      expect(result.success).toBe(true);
    });
  });

  // Invitations & Permissions
  describe('inviteMembers', () => {
    it('sends invitations', async () => {
      const inviteData = { emails: ['test@test.com'], message: 'Join us!' };
      apiService.post.mockResolvedValue({ success: true, data: { invites: [] } });

      const result = await communityService.inviteMembers('com-1', inviteData);

      expect(apiService.post).toHaveBeenCalledWith('/communities/com-1/invites', inviteData);
      expect(result.success).toBe(true);
    });
  });

  describe('getCommunityPermissions', () => {
    it('fetches current user permissions', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { permissions: {} } });

      const result = await communityService.getCommunityPermissions('com-1');

      expect(apiService.get).toHaveBeenCalledWith('/communities/com-1/permissions');
      expect(result.success).toBe(true);
    });

    it('fetches specific user permissions', async () => {
      apiService.get.mockResolvedValue({ success: true, data: { permissions: {} } });

      await communityService.getCommunityPermissions('com-1', 'user-1');

      expect(apiService.get).toHaveBeenCalledWith('/communities/com-1/permissions?userId=user-1');
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('handles network errors', async () => {
      apiService.get.mockRejectedValue(new Error('Network error'));

      const result = await communityService.getCommunity('test');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('handles API errors with custom messages', async () => {
      apiService.post.mockRejectedValue({ data: { message: 'Custom error' }, message: 'Post failed' });

      const result = await communityService.createPost({ title: 'Test', communityId: 'com-1' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Custom error');
    });
  });
});
