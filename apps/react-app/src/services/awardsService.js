/**
 * Awards Service
 * Handles Reddit-style awards (gold, silver, platinum, etc.)
 */

import api from './api.js';

class AwardsService {
  /**
   * Get available awards
   */
  async getAvailableAwards() {
    try {
      const response = await api.get('/awards');
      return response;
    } catch (error) {
      console.error('Error fetching available awards:', error);
      throw error;
    }
  }

  /**
   * Give an award to a post
   */
  async giveAwardToPost(postId, awardType, isAnonymous = false) {
    try {
      const response = await api.post(`/awards/post/${postId}`, {
        awardType,
        isAnonymous
      });
      return response;
    } catch (error) {
      console.error('Error giving award to post:', error);
      throw error;
    }
  }

  /**
   * Give an award to a comment
   */
  async giveAwardToComment(commentId, awardType, isAnonymous = false) {
    try {
      const response = await api.post(`/awards/comment/${commentId}`, {
        awardType,
        isAnonymous
      });
      return response;
    } catch (error) {
      console.error('Error giving award to comment:', error);
      throw error;
    }
  }

  /**
   * Get awards received by user
   */
  async getUserAwards(userId) {
    try {
      const response = await api.get(`/awards/user/${userId}/received`);
      return response;
    } catch (error) {
      console.error('Error fetching user awards:', error);
      throw error;
    }
  }

  /**
   * Get awards given by user
   */
  async getUserAwardsGiven(userId) {
    try {
      const response = await api.get(`/awards/user/${userId}/given`);
      return response;
    } catch (error) {
      console.error('Error fetching awards given:', error);
      throw error;
    }
  }

  /**
   * Get awards for a specific post
   */
  async getPostAwards(postId) {
    try {
      const response = await api.get(`/awards/post/${postId}`);
      return response;
    } catch (error) {
      console.error('Error fetching post awards:', error);
      throw error;
    }
  }

  /**
   * Get awards for a specific comment
   */
  async getCommentAwards(commentId) {
    try {
      const response = await api.get(`/awards/comment/${commentId}`);
      return response;
    } catch (error) {
      console.error('Error fetching comment awards:', error);
      throw error;
    }
  }

  /**
   * Purchase award coins
   */
  async purchaseCoins(packageId) {
    try {
      const response = await api.post('/awards/purchase', {
        packageId
      });
      return response;
    } catch (error) {
      console.error('Error purchasing coins:', error);
      throw error;
    }
  }

  /**
   * Get user's coin balance
   */
  async getCoinBalance() {
    try {
      const response = await api.get('/awards/balance');
      return response;
    } catch (error) {
      console.error('Error fetching coin balance:', error);
      throw error;
    }
  }

  /**
   * Get coin transaction history
   */
  async getCoinHistory(page = 1, limit = 20) {
    try {
      const response = await api.get('/awards/history', {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      console.error('Error fetching coin history:', error);
      throw error;
    }
  }

  /**
   * Get award statistics
   */
  async getAwardStats() {
    try {
      const response = await api.get('/awards/stats');
      return response;
    } catch (error) {
      console.error('Error fetching award stats:', error);
      throw error;
    }
  }
}

export default new AwardsService();
