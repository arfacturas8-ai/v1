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
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/posts${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get trending posts
   * @param {Object} params - Query parameters (page, limit, timeFrame)
   */
  async getTrending(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/posts/trending${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get a single post by ID
   * @param {string} postId 
   */
  async getPost(postId) {
    return api.get(`/posts/${postId}`);
  }

  /**
   * Create a new post
   * @param {Object} postData 
   */
  async createPost(postData) {
    return api.post('/posts', postData);
  }

  /**
   * Update a post
   * @param {string} postId 
   * @param {Object} updateData 
   */
  async updatePost(postId, updateData) {
    return api.patch(`/posts/${postId}`, updateData);
  }

  /**
   * Delete a post
   * @param {string} postId 
   */
  async deletePost(postId) {
    return api.delete(`/posts/${postId}`);
  }

  /**
   * Vote on a post
   * @param {string} postId 
   * @param {number} value - Vote value (1 for upvote, -1 for downvote, 0 for remove vote)
   */
  async votePost(postId, value) {
    return api.post(`/posts/${postId}/vote`, { value });
  }

  /**
   * Get vote status for a post
   * @param {string} postId 
   */
  async getVoteStatus(postId) {
    return api.get(`/posts/${postId}/vote-status`);
  }

  /**
   * Save or unsave a post
   * @param {string} postId 
   * @param {boolean} saved 
   */
  async savePost(postId, saved) {
    return api.post(`/posts/${postId}/save`, { saved });
  }

  /**
   * Get saved posts
   * @param {Object} params - Query parameters (page, limit)
   */
  async getSavedPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/posts/saved${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Report a post
   * @param {string} postId 
   * @param {Object} reportData 
   */
  async reportPost(postId, reportData) {
    return api.post(`/posts/${postId}/report`, reportData);
  }

  /**
   * Pin or unpin a post (moderator only)
   * @param {string} postId 
   * @param {boolean} pinned 
   */
  async pinPost(postId, pinned) {
    return api.post(`/posts/${postId}/pin`, { pinned });
  }

  /**
   * Lock or unlock a post (moderator only)
   * @param {string} postId 
   * @param {boolean} locked 
   */
  async lockPost(postId, locked) {
    return api.post(`/posts/${postId}/lock`, { locked });
  }

  /**
   * Remove a post (moderator only)
   * @param {string} postId 
   * @param {string} reason 
   */
  async removePost(postId, reason) {
    return api.post(`/posts/${postId}/remove`, { reason });
  }

  /**
   * Crosspost to another community
   * @param {string} postId 
   * @param {Object} crosspostData 
   */
  async crosspost(postId, crosspostData) {
    return api.post(`/posts/${postId}/crosspost`, crosspostData);
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
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/posts${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Search posts
   * @param {string} query 
   * @param {Object} params 
   */
  async searchPosts(query, params = {}) {
    const searchParams = { q: query, type: 'posts', ...params };
    const queryString = new URLSearchParams(searchParams).toString();
    return api.get(`/search?${queryString}`);
  }
}

export default new PostsService();