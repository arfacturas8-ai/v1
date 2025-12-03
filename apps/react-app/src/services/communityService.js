/**
 * Community Management Service for CRYB Platform
 * Handles community operations, posts, and comments
 */

import apiService from './api';

class CommunityService {
  constructor() {
    this.endpoints = {
      communities: '/communities',
      posts: '/posts',
      comments: '/comments',
      karma: '/karma',
      awards: '/awards'
    };
  }

  // Get all communities
  async getCommunities(options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || '1',
        limit: options.limit || '20',
        sort: options.sort || 'popular',
        ...(options.category && { category: options.category }),
        ...(options.search && { search: options.search })
      });

      const response = await apiService.get(`${this.endpoints.communities}?${params.toString()}`);
      
      if (response.success && response.data) {
        return { 
          success: true, 
          communities: response.data.communities || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch communities' };
    } catch (error) {
      console.error('Get communities error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch communities' 
      };
    }
  }

  // Get community by ID
  async getCommunity(communityId) {
    try {
      const response = await apiService.get(`${this.endpoints.communities}/${communityId}`);

      if (response.success && response.data) {
        return { success: true, community: response.data.community };
      }

      return { success: false, error: 'Community not found' };
    } catch (error) {
      console.error('Get community error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch community'
      };
    }
  }

  // Get community by name (slug)
  async getCommunityByName(communityName) {
    try {
      const response = await apiService.get(`${this.endpoints.communities}/${communityName}`);

      if (response.success && response.data) {
        return { success: true, community: response.data.community };
      }

      return { success: false, error: 'Community not found' };
    } catch (error) {
      console.error('Get community by name error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch community'
      };
    }
  }

  // Create new community
  async createCommunity(communityData) {
    try {
      const formData = new FormData();
      
      // Add community data
      formData.append('name', communityData.name);
      formData.append('displayName', communityData.displayName);
      formData.append('description', communityData.description || '');
      formData.append('category', communityData.category || 'general');
      formData.append('isPublic', communityData.isPublic ? 'true' : 'false');
      formData.append('allowPosts', communityData.allowPosts !== false ? 'true' : 'false');
      formData.append('requireApproval', communityData.requireApproval ? 'true' : 'false');
      
      // Add rules if provided
      if (communityData.rules) {
        formData.append('rules', JSON.stringify(communityData.rules));
      }

      // Add icon if provided
      if (communityData.icon) {
        formData.append('icon', communityData.icon);
      }

      // Add banner if provided
      if (communityData.banner) {
        formData.append('banner', communityData.banner);
      }

      const response = await apiService.post(this.endpoints.communities, formData);
      
      if (response.success && response.data) {
        return { success: true, community: response.data.community };
      }

      return { success: false, error: 'Failed to create community' };
    } catch (error) {
      console.error('Create community error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create community' 
      };
    }
  }

  // Update community
  async updateCommunity(communityId, updateData) {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(updateData).forEach(key => {
        if (key === 'icon' || key === 'banner') {
          // Handle file uploads
          if (updateData[key]) {
            formData.append(key, updateData[key]);
          }
        } else if (typeof updateData[key] === 'object') {
          formData.append(key, JSON.stringify(updateData[key]));
        } else {
          formData.append(key, updateData[key]);
        }
      });

      const response = await apiService.put(`${this.endpoints.communities}/${communityId}`, formData);
      
      if (response.success && response.data) {
        return { success: true, community: response.data.community };
      }

      return { success: false, error: 'Failed to update community' };
    } catch (error) {
      console.error('Update community error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update community' 
      };
    }
  }

  // Join community
  async joinCommunity(communityId) {
    try {
      const response = await apiService.post(`${this.endpoints.communities}/${communityId}/join`);
      
      if (response.success && response.data) {
        return { success: true, membership: response.data.membership };
      }

      return { success: false, error: 'Failed to join community' };
    } catch (error) {
      console.error('Join community error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to join community' 
      };
    }
  }

  // Leave community
  async leaveCommunity(communityId) {
    try {
      const response = await apiService.post(`${this.endpoints.communities}/${communityId}/leave`);
      
      return { success: response.success, message: response.message || 'Left community' };
    } catch (error) {
      console.error('Leave community error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to leave community' 
      };
    }
  }

  // Get community posts
  async getPosts(options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || '1',
        limit: options.limit || '25',
        sort: options.sort || 'hot',
        timeRange: options.timeRange || 'all',
        ...(options.communityId && { communityId: options.communityId }),
        ...(options.userId && { userId: options.userId }),
        ...(options.search && { search: options.search })
      });

      const response = await apiService.get(`${this.endpoints.posts}?${params.toString()}`);
      
      if (response.success && response.data) {
        return { 
          success: true, 
          posts: response.data.posts || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch posts' };
    } catch (error) {
      console.error('Get posts error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch posts' 
      };
    }
  }

  // Get post by ID
  async getPost(postId) {
    try {
      const response = await apiService.get(`${this.endpoints.posts}/${postId}`);
      
      if (response.success && response.data) {
        return { success: true, post: response.data.post };
      }

      return { success: false, error: 'Post not found' };
    } catch (error) {
      console.error('Get post error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch post' 
      };
    }
  }

  // Create new post
  async createPost(postData) {
    try {
      const formData = new FormData();
      
      // Add post data
      formData.append('title', postData.title);
      formData.append('content', postData.content || '');
      formData.append('type', postData.type || 'text');
      formData.append('communityId', postData.communityId);
      
      // Add optional fields
      if (postData.url) {
        formData.append('url', postData.url);
      }
      if (postData.tags && postData.tags.length > 0) {
        formData.append('tags', JSON.stringify(postData.tags));
      }
      if (postData.isNSFW) {
        formData.append('isNSFW', 'true');
      }
      if (postData.isSpoiler) {
        formData.append('isSpoiler', 'true');
      }

      // Add media files if provided
      if (postData.media && postData.media.length > 0) {
        postData.media.forEach((file) => {
          formData.append('media', file);
        });
      }

      const response = await apiService.post(this.endpoints.posts, formData);
      
      if (response.success && response.data) {
        return { success: true, post: response.data.post };
      }

      return { success: false, error: 'Failed to create post' };
    } catch (error) {
      console.error('Create post error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create post' 
      };
    }
  }

  // Update post
  async updatePost(postId, updateData) {
    try {
      const response = await apiService.put(`${this.endpoints.posts}/${postId}`, updateData);
      
      if (response.success && response.data) {
        return { success: true, post: response.data.post };
      }

      return { success: false, error: 'Failed to update post' };
    } catch (error) {
      console.error('Update post error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update post' 
      };
    }
  }

  // Delete post
  async deletePost(postId) {
    try {
      const response = await apiService.delete(`${this.endpoints.posts}/${postId}`);
      
      return { success: response.success, message: response.message || 'Post deleted' };
    } catch (error) {
      console.error('Delete post error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to delete post' 
      };
    }
  }

  // Vote on post
  async votePost(postId, voteType) {
    try {
      const response = await apiService.post(`${this.endpoints.posts}/${postId}/vote`, {
        type: voteType // 'up', 'down', or 'remove'
      });
      
      if (response.success && response.data) {
        return { success: true, vote: response.data.vote, karma: response.data.karma };
      }

      return { success: false, error: 'Failed to vote' };
    } catch (error) {
      console.error('Vote post error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to vote' 
      };
    }
  }

  // Save/unsave post
  async savePost(postId, save = true) {
    try {
      const endpoint = save 
        ? `${this.endpoints.posts}/${postId}/save`
        : `${this.endpoints.posts}/${postId}/unsave`;
        
      const response = await apiService.post(endpoint);
      
      return { 
        success: response.success, 
        message: response.message || (save ? 'Post saved' : 'Post unsaved') 
      };
    } catch (error) {
      console.error('Save post error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to save post' 
      };
    }
  }

  // Get post comments
  async getComments(postId, options = {}) {
    try {
      const params = new URLSearchParams({
        sort: options.sort || 'best',
        limit: options.limit || '100',
        ...(options.parentId && { parentId: options.parentId })
      });

      const response = await apiService.get(
        `${this.endpoints.posts}/${postId}/comments?${params.toString()}`
      );
      
      if (response.success && response.data) {
        return { success: true, comments: response.data.comments || [] };
      }

      return { success: false, error: 'Failed to fetch comments' };
    } catch (error) {
      console.error('Get comments error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch comments' 
      };
    }
  }

  // Create comment
  async createComment(postId, content, parentId = null) {
    try {
      const response = await apiService.post(this.endpoints.comments, {
        postId,
        content,
        parentId
      });
      
      if (response.success && response.data) {
        return { success: true, comment: response.data.comment };
      }

      return { success: false, error: 'Failed to create comment' };
    } catch (error) {
      console.error('Create comment error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create comment' 
      };
    }
  }

  // Update comment
  async updateComment(commentId, content) {
    try {
      const response = await apiService.put(`${this.endpoints.comments}/${commentId}`, {
        content
      });
      
      if (response.success && response.data) {
        return { success: true, comment: response.data.comment };
      }

      return { success: false, error: 'Failed to update comment' };
    } catch (error) {
      console.error('Update comment error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update comment' 
      };
    }
  }

  // Delete comment
  async deleteComment(commentId) {
    try {
      const response = await apiService.delete(`${this.endpoints.comments}/${commentId}`);
      
      return { success: response.success, message: response.message || 'Comment deleted' };
    } catch (error) {
      console.error('Delete comment error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to delete comment' 
      };
    }
  }

  // Vote on comment
  async voteComment(commentId, voteType) {
    try {
      const response = await apiService.post(`${this.endpoints.comments}/${commentId}/vote`, {
        type: voteType // 'up', 'down', or 'remove'
      });
      
      if (response.success && response.data) {
        return { success: true, vote: response.data.vote, karma: response.data.karma };
      }

      return { success: false, error: 'Failed to vote' };
    } catch (error) {
      console.error('Vote comment error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to vote' 
      };
    }
  }

  // Get user karma
  async getUserKarma(userId = null) {
    try {
      const endpoint = userId ? `${this.endpoints.karma}/${userId}` : this.endpoints.karma;
      const response = await apiService.get(endpoint);
      
      if (response.success && response.data) {
        return { success: true, karma: response.data.karma };
      }

      return { success: false, error: 'Failed to fetch karma' };
    } catch (error) {
      console.error('Get karma error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch karma' 
      };
    }
  }

  // Get available awards
  async getAwards() {
    try {
      const response = await apiService.get(this.endpoints.awards);
      
      if (response.success && response.data) {
        return { success: true, awards: response.data.awards || [] };
      }

      return { success: false, error: 'Failed to fetch awards' };
    } catch (error) {
      console.error('Get awards error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch awards' 
      };
    }
  }

  // Give award to post
  async giveAward(postId, awardType, message = '') {
    try {
      const response = await apiService.post(`${this.endpoints.posts}/${postId}/award`, {
        awardType,
        message
      });
      
      if (response.success && response.data) {
        return { success: true, award: response.data.award };
      }

      return { success: false, error: 'Failed to give award' };
    } catch (error) {
      console.error('Give award error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to give award' 
      };
    }
  }

  // Give award to comment
  async giveCommentAward(commentId, awardType, message = '') {
    try {
      const response = await apiService.post(`${this.endpoints.comments}/${commentId}/award`, {
        awardType,
        message
      });
      
      if (response.success && response.data) {
        return { success: true, award: response.data.award };
      }

      return { success: false, error: 'Failed to give award' };
    } catch (error) {
      console.error('Give comment award error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to give award' 
      };
    }
  }

  // Report post
  async reportPost(postId, reason, details = '') {
    try {
      const response = await apiService.post(`${this.endpoints.posts}/${postId}/report`, {
        reason,
        details
      });
      
      return { success: response.success, message: response.message || 'Post reported' };
    } catch (error) {
      console.error('Report post error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to report post' 
      };
    }
  }

  // Report comment
  async reportComment(commentId, reason, details = '') {
    try {
      const response = await apiService.post(`${this.endpoints.comments}/${commentId}/report`, {
        reason,
        details
      });
      
      return { success: response.success, message: response.message || 'Comment reported' };
    } catch (error) {
      console.error('Report comment error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to report comment' 
      };
    }
  }

  // Search within communities
  async searchCommunities(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        type: filters.type || 'all', // 'communities', 'posts', 'comments', 'all'
        sort: filters.sort || 'relevance',
        timeRange: filters.timeRange || 'all',
        ...(filters.communityId && { communityId: filters.communityId }),
        ...(filters.author && { author: filters.author })
      });

      const response = await apiService.get(`/search?${params.toString()}`);
      
      if (response.success && response.data) {
        return { 
          success: true, 
          results: response.data.results || {},
          total: response.data.total || 0
        };
      }

      return { success: false, error: 'Search failed' };
    } catch (error) {
      console.error('Search error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Search failed' 
      };
    }
  }

  // Get trending topics
  async getTrendingTopics(timeRange = '24h') {
    try {
      const response = await apiService.get(`/trending?timeRange=${timeRange}`);
      
      if (response.success && response.data) {
        return { success: true, topics: response.data.topics || [] };
      }

      return { success: false, error: 'Failed to fetch trending topics' };
    } catch (error) {
      console.error('Get trending topics error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch trending topics' 
      };
    }
  }

  // Community Member Management
  async getCommunityMembers(communityId, options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || '1',
        limit: options.limit || '50',
        role: options.role || 'all',
        sort: options.sort || 'joinDate',
        ...(options.search && { search: options.search })
      });

      const response = await apiService.get(
        `${this.endpoints.communities}/${communityId}/members?${params.toString()}`
      );
      
      if (response.success && response.data) {
        return { 
          success: true, 
          members: response.data.members || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch community members' };
    } catch (error) {
      console.error('Get community members error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch community members' 
      };
    }
  }

  async updateMemberRole(communityId, userId, role) {
    try {
      const response = await apiService.put(
        `${this.endpoints.communities}/${communityId}/members/${userId}`,
        { role }
      );
      
      if (response.success && response.data) {
        return { success: true, member: response.data.member };
      }

      return { success: false, error: 'Failed to update member role' };
    } catch (error) {
      console.error('Update member role error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update member role' 
      };
    }
  }

  async removeMember(communityId, userId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.communities}/${communityId}/members/${userId}`
      );
      
      return { success: response.success, message: response.message || 'Member removed' };
    } catch (error) {
      console.error('Remove member error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to remove member' 
      };
    }
  }

  async banMember(communityId, userId, reason = '', duration = null) {
    try {
      const response = await apiService.post(
        `${this.endpoints.communities}/${communityId}/members/${userId}/ban`,
        { reason, duration }
      );
      
      return { success: response.success, message: response.message || 'Member banned' };
    } catch (error) {
      console.error('Ban member error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to ban member' 
      };
    }
  }

  async unbanMember(communityId, userId) {
    try {
      const response = await apiService.delete(
        `${this.endpoints.communities}/${communityId}/members/${userId}/ban`
      );
      
      return { success: response.success, message: response.message || 'Member unbanned' };
    } catch (error) {
      console.error('Unban member error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to unban member' 
      };
    }
  }

  // Community Analytics
  async getCommunityAnalytics(communityId, timeRange = '30d') {
    try {
      const response = await apiService.get(
        `${this.endpoints.communities}/${communityId}/analytics?timeRange=${timeRange}`
      );
      
      if (response.success && response.data) {
        return { success: true, analytics: response.data.analytics };
      }

      return { success: false, error: 'Failed to fetch community analytics' };
    } catch (error) {
      console.error('Get community analytics error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch community analytics' 
      };
    }
  }

  // Moderation Queue
  async getModerationQueue(communityId, options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || '1',
        limit: options.limit || '20',
        type: options.type || 'all', // posts, comments, reports, pending
        status: options.status || 'pending'
      });

      const response = await apiService.get(
        `${this.endpoints.communities}/${communityId}/moderation?${params.toString()}`
      );
      
      if (response.success && response.data) {
        return { 
          success: true, 
          queue: response.data.queue || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch moderation queue' };
    } catch (error) {
      console.error('Get moderation queue error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch moderation queue' 
      };
    }
  }

  async moderateContent(communityId, contentId, action, reason = '') {
    try {
      const response = await apiService.post(
        `${this.endpoints.communities}/${communityId}/moderation/${contentId}`,
        { action, reason } // approve, remove, flag
      );
      
      if (response.success && response.data) {
        return { success: true, result: response.data.result };
      }

      return { success: false, error: 'Failed to moderate content' };
    } catch (error) {
      console.error('Moderate content error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to moderate content' 
      };
    }
  }

  // Community Events
  async getCommunityEvents(communityId, options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || '1',
        limit: options.limit || '20',
        upcoming: options.upcoming ? 'true' : 'false',
        past: options.past ? 'true' : 'false'
      });

      const response = await apiService.get(
        `${this.endpoints.communities}/${communityId}/events?${params.toString()}`
      );
      
      if (response.success && response.data) {
        return { 
          success: true, 
          events: response.data.events || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch community events' };
    } catch (error) {
      console.error('Get community events error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch community events' 
      };
    }
  }

  async createCommunityEvent(communityId, eventData) {
    try {
      const response = await apiService.post(
        `${this.endpoints.communities}/${communityId}/events`,
        eventData
      );
      
      if (response.success && response.data) {
        return { success: true, event: response.data.event };
      }

      return { success: false, error: 'Failed to create event' };
    } catch (error) {
      console.error('Create community event error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to create event' 
      };
    }
  }

  // Community Invitations
  async inviteMembers(communityId, inviteData) {
    try {
      const response = await apiService.post(
        `${this.endpoints.communities}/${communityId}/invites`,
        inviteData
      );
      
      if (response.success && response.data) {
        return { success: true, invites: response.data.invites };
      }

      return { success: false, error: 'Failed to send invitations' };
    } catch (error) {
      console.error('Invite members error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to send invitations' 
      };
    }
  }

  // Community Discovery
  async getFeaturedCommunities() {
    try {
      const response = await apiService.get('/communities/featured');
      
      if (response.success && response.data) {
        return { success: true, communities: response.data.communities || [] };
      }

      return { success: false, error: 'Failed to fetch featured communities' };
    } catch (error) {
      console.error('Get featured communities error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch featured communities' 
      };
    }
  }

  async getRecommendedCommunities(userId = null) {
    try {
      const endpoint = userId 
        ? `/communities/recommended?userId=${userId}`
        : '/communities/recommended';
      
      const response = await apiService.get(endpoint);
      
      if (response.success && response.data) {
        return { success: true, communities: response.data.communities || [] };
      }

      return { success: false, error: 'Failed to fetch recommended communities' };
    } catch (error) {
      console.error('Get recommended communities error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch recommended communities' 
      };
    }
  }

  // Community Permissions
  async getCommunityPermissions(communityId, userId = null) {
    try {
      const endpoint = userId
        ? `${this.endpoints.communities}/${communityId}/permissions?userId=${userId}`
        : `${this.endpoints.communities}/${communityId}/permissions`;
      
      const response = await apiService.get(endpoint);
      
      if (response.success && response.data) {
        return { success: true, permissions: response.data.permissions };
      }

      return { success: false, error: 'Failed to fetch permissions' };
    } catch (error) {
      console.error('Get community permissions error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch permissions' 
      };
    }
  }
}

// Create and export singleton instance
const communityService = new CommunityService();

export default communityService;

// Community constants for roles and permissions
export const COMMUNITY_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member'
};

export const COMMUNITY_PERMISSIONS = {
  MANAGE_COMMUNITY: 'manage_community',
  MANAGE_MEMBERS: 'manage_members',
  MODERATE_CONTENT: 'moderate_content',
  MANAGE_ROLES: 'manage_roles',
  CREATE_EVENTS: 'create_events',
  PIN_POSTS: 'pin_posts',
  DELETE_POSTS: 'delete_posts',
  BAN_MEMBERS: 'ban_members'
};

export const MODERATION_ACTIONS = {
  APPROVE: 'approve',
  REMOVE: 'remove',
  FLAG: 'flag',
  LOCK: 'lock',
  PIN: 'pin',
  UNPIN: 'unpin'
};