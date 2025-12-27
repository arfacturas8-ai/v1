/**
 * Posts Service for CRYB Platform
 * Handles all post-related API operations
 */

import api from './api';

class PostsService {
  /**
   * Get posts feed
   * @param {Object} params - Query parameters (page, limit, sort, timeFrame, community)
   */
  async getPosts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/posts${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          posts: response.data.posts || response.data || [],
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

  /**
   * Get trending posts
   * @param {Object} params - Query parameters (page, limit, timeFrame)
   */
  async getTrending(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/posts/trending${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          posts: response.data.posts || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch trending posts' };
    } catch (error) {
      console.error('Get trending posts error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch trending posts'
      };
    }
  }

  /**
   * Get a single post by ID
   * @param {string} postId
   */
  async getPost(postId) {
    try {
      const response = await api.get(`/posts/${postId}`);

      if (response.success && response.data) {
        return { success: true, post: response.data.post || response.data };
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

  /**
   * Create a new post
   * @param {Object} postData
   */
  async createPost(postData) {
    try {
      const response = await api.post('/posts', postData);

      if (response.success && response.data) {
        return { success: true, post: response.data.post || response.data };
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

  /**
   * Update a post
   * @param {string} postId
   * @param {Object} updateData
   */
  async updatePost(postId, updateData) {
    try {
      const response = await api.patch(`/posts/${postId}`, updateData);

      if (response.success && response.data) {
        return { success: true, post: response.data.post || response.data };
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

  /**
   * Delete a post
   * @param {string} postId
   */
  async deletePost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}`);

      return { success: response.success, message: response.message || 'Post deleted' };
    } catch (error) {
      console.error('Delete post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to delete post'
      };
    }
  }

  /**
   * Vote on a post
   * @param {string} postId
   * @param {number} value - Vote value (1 for upvote, -1 for downvote, 0 for remove vote)
   */
  async votePost(postId, value) {
    try {
      const response = await api.post(`/posts/${postId}/vote`, { value });

      if (response.success && response.data) {
        return {
          success: true,
          vote: response.data.vote || response.data,
          karma: response.data.karma
        };
      }

      return { success: false, error: 'Failed to vote on post' };
    } catch (error) {
      console.error('Vote post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to vote on post'
      };
    }
  }

  /**
   * Get vote status for a post
   * @param {string} postId
   */
  async getVoteStatus(postId) {
    try {
      const response = await api.get(`/posts/${postId}/vote-status`);

      if (response.success && response.data) {
        return { success: true, voteStatus: response.data };
      }

      return { success: false, error: 'Failed to get vote status' };
    } catch (error) {
      console.error('Get vote status error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to get vote status'
      };
    }
  }

  /**
   * Save or unsave a post
   * @param {string} postId
   * @param {boolean} saved
   */
  async savePost(postId, saved) {
    try {
      const response = await api.post(`/posts/${postId}/save`, { saved });

      return {
        success: response.success,
        message: response.message || (saved ? 'Post saved' : 'Post unsaved')
      };
    } catch (error) {
      console.error('Save post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to save post'
      };
    }
  }

  /**
   * Get saved posts
   * @param {Object} params - Query parameters (page, limit)
   */
  async getSavedPosts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/posts/saved${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          posts: response.data.posts || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch saved posts' };
    } catch (error) {
      console.error('Get saved posts error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch saved posts'
      };
    }
  }

  /**
   * Report a post
   * @param {string} postId
   * @param {Object} reportData
   */
  async reportPost(postId, reportData) {
    try {
      const response = await api.post(`/posts/${postId}/report`, reportData);

      return {
        success: response.success,
        message: response.message || 'Post reported'
      };
    } catch (error) {
      console.error('Report post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to report post'
      };
    }
  }

  /**
   * Pin or unpin a post (moderator only)
   * @param {string} postId
   * @param {boolean} pinned
   */
  async pinPost(postId, pinned) {
    try {
      const response = await api.post(`/posts/${postId}/pin`, { pinned });

      return {
        success: response.success,
        message: response.message || (pinned ? 'Post pinned' : 'Post unpinned')
      };
    } catch (error) {
      console.error('Pin post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to pin post'
      };
    }
  }

  /**
   * Lock or unlock a post (moderator only)
   * @param {string} postId
   * @param {boolean} locked
   */
  async lockPost(postId, locked) {
    try {
      const response = await api.post(`/posts/${postId}/lock`, { locked });

      return {
        success: response.success,
        message: response.message || (locked ? 'Post locked' : 'Post unlocked')
      };
    } catch (error) {
      console.error('Lock post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to lock post'
      };
    }
  }

  /**
   * Remove a post (moderator only)
   * @param {string} postId
   * @param {string} reason
   */
  async removePost(postId, reason) {
    try {
      const response = await api.post(`/posts/${postId}/remove`, { reason });

      return {
        success: response.success,
        message: response.message || 'Post removed'
      };
    } catch (error) {
      console.error('Remove post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to remove post'
      };
    }
  }

  /**
   * Crosspost to another community
   * @param {string} postId
   * @param {Object} crosspostData
   */
  async crosspost(postId, crosspostData) {
    try {
      const response = await api.post(`/posts/${postId}/crosspost`, crosspostData);

      if (response.success && response.data) {
        return { success: true, post: response.data.post || response.data };
      }

      return { success: false, error: 'Failed to crosspost' };
    } catch (error) {
      console.error('Crosspost error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to crosspost'
      };
    }
  }

  /**
   * Get posts by community
   * @param {string} communityName
   * @param {Object} params
   */
  async getCommunityPosts(communityName, params = {}) {
    return this.getPosts({ ...params, community: communityName });
  }

  /**
   * Get posts by user
   * @param {string} username
   * @param {Object} params
   */
  async getUserPosts(username, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/users/${username}/posts${queryString ? `?${queryString}` : ''}`);

      if (response.success && response.data) {
        return {
          success: true,
          posts: response.data.posts || response.data || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch user posts' };
    } catch (error) {
      console.error('Get user posts error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch user posts'
      };
    }
  }

  /**
   * Search posts
   * @param {string} query
   * @param {Object} params
   */
  async searchPosts(query, params = {}) {
    try {
      const searchParams = { q: query, type: 'posts', ...params };
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await api.get(`/search?${queryString}`);

      if (response.success && response.data) {
        return {
          success: true,
          results: response.data.results || response.data || [],
          total: response.data.total || 0
        };
      }

      return { success: false, error: 'Search failed' };
    } catch (error) {
      console.error('Search posts error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Search failed'
      };
    }
  }

  /**
   * Like a post
   * @param {string} postId
   */
  async likePost(postId) {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Like post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to like post'
      };
    }
  }

  /**
   * Unlike a post
   * @param {string} postId
   */
  async unlikePost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}/like`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Unlike post error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to unlike post'
      };
    }
  }

  /**
   * Repost a post
   * @param {string} postId
   */
  async repost(postId) {
    try {
      const response = await api.post(`/posts/${postId}/repost`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Repost error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to repost'
      };
    }
  }

  /**
   * Unrepost a post
   * @param {string} postId
   */
  async unrepost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}/repost`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Unrepost error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to unrepost'
      };
    }
  }

  /**
   * Bookmark a post
   * @param {string} postId
   */
  async bookmarkPost(postId) {
    try {
      const response = await api.post(`/posts/${postId}/bookmark`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Bookmark error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to bookmark post'
      };
    }
  }

  /**
   * Unbookmark a post
   * @param {string} postId
   */
  async unbookmarkPost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}/bookmark`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Unbookmark error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to unbookmark post'
      };
    }
  }
}

export default new PostsService();