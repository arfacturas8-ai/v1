/**
 * Comments Service for CRYB Platform
 * Handles all comment-related API operations
 */

import api from './api';

class CommentsService {
  /**
   * Get comments for a post
   * @param {string} postId 
   * @param {Object} params - Query parameters (page, limit, sort)
   */
  async getPostComments(postId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/posts/${postId}/comments${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get a single comment
   * @param {string} commentId 
   */
  async getComment(commentId) {
    return api.get(`/comments/${commentId}`);
  }

  /**
   * Create a new comment
   * @param {string} postId 
   * @param {Object} commentData 
   */
  async createComment(postId, commentData) {
    return api.post(`/posts/${postId}/comments`, commentData);
  }

  /**
   * Reply to a comment
   * @param {string} parentCommentId 
   * @param {Object} replyData 
   */
  async replyToComment(parentCommentId, replyData) {
    return api.post(`/comments/${parentCommentId}/reply`, replyData);
  }

  /**
   * Update a comment
   * @param {string} commentId 
   * @param {Object} updateData 
   */
  async updateComment(commentId, updateData) {
    return api.patch(`/comments/${commentId}`, updateData);
  }

  /**
   * Delete a comment
   * @param {string} commentId 
   */
  async deleteComment(commentId) {
    return api.delete(`/comments/${commentId}`);
  }

  /**
   * Vote on a comment
   * @param {string} commentId 
   * @param {number} value - Vote value (1 for upvote, -1 for downvote, 0 for remove vote)
   */
  async voteComment(commentId, value) {
    return api.post(`/comments/${commentId}/vote`, { value });
  }

  /**
   * Get vote status for a comment
   * @param {string} commentId 
   */
  async getVoteStatus(commentId) {
    return api.get(`/comments/${commentId}/vote-status`);
  }

  /**
   * Report a comment
   * @param {string} commentId 
   * @param {Object} reportData 
   */
  async reportComment(commentId, reportData) {
    return api.post(`/comments/${commentId}/report`, reportData);
  }

  /**
   * Get comment thread (with all nested replies)
   * @param {string} commentId 
   */
  async getCommentThread(commentId) {
    return api.get(`/comments/${commentId}/thread`);
  }

  /**
   * Get user's comments
   * @param {string} username 
   * @param {Object} params 
   */
  async getUserComments(username, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users/${username}/comments${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Load more replies for a comment
   * @param {string} commentId 
   * @param {Object} params 
   */
  async loadMoreReplies(commentId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/comments/${commentId}/replies${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get top-level comments for a post (no replies)
   * @param {string} postId 
   * @param {Object} params 
   */
  async getTopLevelComments(postId, params = {}) {
    return this.getPostComments(postId, { ...params, topLevel: true });
  }

  /**
   * Collapse/expand comment thread
   * @param {string} commentId 
   * @param {boolean} collapsed 
   */
  async toggleCommentCollapse(commentId, collapsed) {
    // This is typically handled client-side, but can be persisted
    return api.post(`/comments/${commentId}/toggle-collapse`, { collapsed });
  }

  /**
   * Award a comment
   * @param {string} commentId 
   * @param {Object} awardData 
   */
  async awardComment(commentId, awardData) {
    return api.post(`/comments/${commentId}/award`, awardData);
  }

  /**
   * Get comment awards
   * @param {string} commentId 
   */
  async getCommentAwards(commentId) {
    return api.get(`/comments/${commentId}/awards`);
  }

  /**
   * Search comments
   * @param {string} query 
   * @param {Object} params 
   */
  async searchComments(query, params = {}) {
    const searchParams = { q: query, type: 'comments', ...params };
    const queryString = new URLSearchParams(searchParams).toString();
    return api.get(`/search?${queryString}`);
  }
}

export default new CommentsService();