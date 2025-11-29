/**
 * Social Service for CRYB Platform
 * Handles all social relationship interactions (follow/friend/block)
 */

import apiService from './api.js'

class SocialService {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 3 * 60 * 1000 // 3 minutes for social data
    this.realTimeCallbacks = new Map()
  }

  // ==================== FOLLOW SYSTEM ====================

  // Follow a user
  async followUser(userId) {
    try {
      const response = await apiService.post(`/social/follow`, { userId })
      
      // Clear relevant caches
      this.clearRelatedCaches(userId)
      
      // Trigger real-time callbacks
      this.triggerCallbacks('follow', { userId, action: 'follow' })
      
      return response
    } catch (error) {
      console.error('Error following user:', error)
      throw error
    }
  }

  // Unfollow a user
  async unfollowUser(userId) {
    try {
      const response = await apiService.delete(`/social/follow/${userId}`)
      
      // Clear relevant caches
      this.clearRelatedCaches(userId)
      
      // Trigger real-time callbacks
      this.triggerCallbacks('unfollow', { userId, action: 'unfollow' })
      
      return response
    } catch (error) {
      console.error('Error unfollowing user:', error)
      throw error
    }
  }

  // Get followers list
  async getFollowers(userId = null, page = 1, limit = 20, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      })
      
      const endpoint = userId 
        ? `/social/users/${userId}/followers?${params}`
        : `/social/followers?${params}`
      
      const cacheKey = `followers_${userId || 'current'}_${page}_${limit}_${search}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(endpoint)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching followers:', error)
      throw error
    }
  }

  // Get following list
  async getFollowing(userId = null, page = 1, limit = 20, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      })
      
      const endpoint = userId 
        ? `/social/users/${userId}/following?${params}`
        : `/social/following?${params}`
      
      const cacheKey = `following_${userId || 'current'}_${page}_${limit}_${search}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(endpoint)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching following:', error)
      throw error
    }
  }

  // ==================== FRIEND SYSTEM ====================

  // Send friend request
  async sendFriendRequest(userId, message = '') {
    try {
      const response = await apiService.post(`/social/friend-request`, { 
        userId, 
        message 
      })
      
      // Clear relevant caches
      this.clearRelatedCaches(userId)
      
      // Trigger real-time callbacks
      this.triggerCallbacks('friendRequest', { userId, action: 'sent', message })
      
      return response
    } catch (error) {
      console.error('Error sending friend request:', error)
      throw error
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId) {
    try {
      const response = await apiService.post(`/social/friend-request/${requestId}/accept`)
      
      // Clear relevant caches
      this.clearCache('friend-requests')
      this.clearCache('friends')
      
      // Trigger real-time callbacks
      this.triggerCallbacks('friendRequest', { requestId, action: 'accepted' })
      
      return response
    } catch (error) {
      console.error('Error accepting friend request:', error)
      throw error
    }
  }

  // Reject friend request
  async rejectFriendRequest(requestId) {
    try {
      const response = await apiService.post(`/social/friend-request/${requestId}/reject`)
      
      // Clear relevant caches
      this.clearCache('friend-requests')
      
      // Trigger real-time callbacks
      this.triggerCallbacks('friendRequest', { requestId, action: 'rejected' })
      
      return response
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      throw error
    }
  }

  // Remove friend
  async removeFriend(userId) {
    try {
      const response = await apiService.delete(`/social/friend/${userId}`)
      
      // Clear relevant caches
      this.clearRelatedCaches(userId)
      
      // Trigger real-time callbacks
      this.triggerCallbacks('removeFriend', { userId, action: 'removed' })
      
      return response
    } catch (error) {
      console.error('Error removing friend:', error)
      throw error
    }
  }

  // Get friends list
  async getFriends(userId = null, page = 1, limit = 20, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      })
      
      const endpoint = userId 
        ? `/social/users/${userId}/friends?${params}`
        : `/social/friends?${params}`
      
      const cacheKey = `friends_${userId || 'current'}_${page}_${limit}_${search}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(endpoint)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching friends:', error)
      throw error
    }
  }

  // Get friend requests
  async getFriendRequests(type = 'received', page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        type,
        page: page.toString(),
        limit: limit.toString()
      })
      
      const cacheKey = `friend-requests_${type}_${page}_${limit}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(`/social/friend-requests?${params}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching friend requests:', error)
      throw error
    }
  }

  // ==================== BLOCKING SYSTEM ====================

  // Block a user
  async blockUser(userId) {
    try {
      const response = await apiService.post(`/social/block`, { userId })
      
      // Clear relevant caches
      this.clearRelatedCaches(userId)
      
      // Trigger real-time callbacks
      this.triggerCallbacks('block', { userId, action: 'blocked' })
      
      return response
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  // Unblock a user
  async unblockUser(userId) {
    try {
      const response = await apiService.delete(`/social/block/${userId}`)
      
      // Clear relevant caches
      this.clearRelatedCaches(userId)
      
      // Trigger real-time callbacks
      this.triggerCallbacks('unblock', { userId, action: 'unblocked' })
      
      return response
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw error
    }
  }

  // Get blocked users
  async getBlockedUsers(page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      const cacheKey = `blocked-users_${page}_${limit}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(`/social/blocked?${params}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching blocked users:', error)
      throw error
    }
  }

  // ==================== RELATIONSHIP STATUS ====================

  // Get relationship status with specific user
  async getRelationshipStatus(userId) {
    try {
      const cacheKey = `relationship_${userId}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(`/social/relationship/${userId}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching relationship status:', error)
      throw error
    }
  }

  // Get mutual connections
  async getMutualConnections(userId, limit = 10) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })
      
      const cacheKey = `mutual_${userId}_${limit}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(`/social/mutual/${userId}?${params}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching mutual connections:', error)
      throw error
    }
  }

  // ==================== SUGGESTIONS & DISCOVERY ====================

  // Get friend suggestions
  async getFriendSuggestions(limit = 10, algorithm = 'smart') {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        algorithm
      })
      
      const cacheKey = `suggestions_${limit}_${algorithm}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(`/social/suggestions?${params}`)
      
      // Cache the response with shorter expiry for suggestions
      this.setCache(cacheKey, response, 60 * 1000) // 1 minute
      
      return response
    } catch (error) {
      console.error('Error fetching friend suggestions:', error)
      throw error
    }
  }

  // Dismiss suggestion
  async dismissSuggestion(userId) {
    try {
      const response = await apiService.post(`/social/suggestions/dismiss`, { userId })
      
      // Clear suggestions cache
      this.clearCacheByPattern('suggestions_')
      
      return response
    } catch (error) {
      console.error('Error dismissing suggestion:', error)
      throw error
    }
  }

  // ==================== SOCIAL ANALYTICS ====================

  // Get social analytics
  async getSocialAnalytics(userId = null, timeframe = '30d') {
    try {
      const params = new URLSearchParams({ timeframe })
      
      const endpoint = userId 
        ? `/social/analytics/${userId}?${params}`
        : `/social/analytics?${params}`
      
      const cacheKey = `analytics_${userId || 'current'}_${timeframe}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(endpoint)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching social analytics:', error)
      throw error
    }
  }

  // Get network stats
  async getNetworkStats(userId = null) {
    try {
      const endpoint = userId 
        ? `/social/network-stats/${userId}`
        : `/social/network-stats`
      
      const cacheKey = `network-stats_${userId || 'current'}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(endpoint)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching network stats:', error)
      throw error
    }
  }

  // ==================== ACTIVITY FEED ====================

  // Get social activity feed
  async getSocialActivityFeed(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      const cacheKey = `activity-feed_${page}_${limit}_${JSON.stringify(filters)}`
      
      // Check cache first (shorter expiry for activity feed)
      const cached = this.getFromCache(cacheKey, 30 * 1000) // 30 seconds
      if (cached) return cached

      const response = await apiService.get(`/social/activity-feed?${params}`)
      
      // Cache the response
      this.setCache(cacheKey, response, 30 * 1000) // 30 seconds
      
      return response
    } catch (error) {
      console.error('Error fetching activity feed:', error)
      throw error
    }
  }

  // ==================== NOTIFICATION PREFERENCES ====================

  // Update social notification settings
  async updateNotificationSettings(settings) {
    try {
      const response = await apiService.put('/social/notification-settings', settings)
      
      // Clear notification settings cache
      this.clearCache('notification-settings')
      
      return response
    } catch (error) {
      console.error('Error updating notification settings:', error)
      throw error
    }
  }

  // Get social notification settings
  async getNotificationSettings() {
    try {
      const cacheKey = 'notification-settings'
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get('/social/notification-settings')
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      throw error
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  getFromCache(key, customExpiry = null) {
    const cached = this.cache.get(key)
    const expiry = customExpiry || this.cacheExpiry
    
    if (cached && Date.now() - cached.timestamp < expiry) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  setCache(key, data, customExpiry = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: customExpiry || this.cacheExpiry
    })
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  clearCacheByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clearRelatedCaches(userId) {
    // Clear all caches related to this user
    this.clearCacheByPattern(`_${userId}_`)
    this.clearCacheByPattern(`${userId}`)
    this.clearCache('friends')
    this.clearCache('following')
    this.clearCache('followers')
    this.clearCache('suggestions')
    this.clearCache('activity-feed')
  }

  // ==================== REAL-TIME UPDATES ====================

  // Register callback for real-time updates
  registerCallback(event, callback) {
    if (!this.realTimeCallbacks.has(event)) {
      this.realTimeCallbacks.set(event, new Set())
    }
    this.realTimeCallbacks.get(event).add(callback)
    
    // Return unregister function
    return () => {
      const callbacks = this.realTimeCallbacks.get(event)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  // Trigger callbacks for real-time events
  triggerCallbacks(event, data) {
    const callbacks = this.realTimeCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in real-time callback:', error)
        }
      })
    }
  }

  // ==================== BATCH OPERATIONS ====================

  // Batch follow multiple users
  async batchFollow(userIds) {
    try {
      const response = await apiService.post('/social/batch/follow', { userIds })
      
      // Clear relevant caches
      userIds.forEach(userId => this.clearRelatedCaches(userId))
      
      return response
    } catch (error) {
      console.error('Error batch following users:', error)
      throw error
    }
  }

  // Batch unfollow multiple users
  async batchUnfollow(userIds) {
    try {
      const response = await apiService.post('/social/batch/unfollow', { userIds })
      
      // Clear relevant caches
      userIds.forEach(userId => this.clearRelatedCaches(userId))
      
      return response
    } catch (error) {
      console.error('Error batch unfollowing users:', error)
      throw error
    }
  }

  // Export social data
  async exportSocialData() {
    try {
      const response = await apiService.get('/social/export')
      return response
    } catch (error) {
      console.error('Error exporting social data:', error)
      throw error
    }
  }
}

// Create and export singleton instance
const socialService = new SocialService()

export default socialService