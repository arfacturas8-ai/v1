/**
 * Profile Service for CRYB Platform
 * Handles all profile-related API interactions
 */

import apiService from './api.js'

class ProfileService {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  // Get cached profile or fetch from API
  async getProfile(userId = null) {
    try {
      const endpoint = userId ? `/profile/${userId}` : '/profile'
      const cacheKey = `profile_${userId || 'current'}`
      
      // Check cache first
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const response = await apiService.get(endpoint)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  }

  // Update current user's profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/profile', profileData)
      
      // Clear current user cache
      this.clearCache('profile_current')
      
      return response
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Upload profile avatar
  async uploadAvatar(file) {
    try {
      const response = await apiService.uploadFile('/profile/avatar', file)
      
      // Clear current user cache
      this.clearCache('profile_current')
      
      return response
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  // Upload profile banner
  async uploadBanner(file) {
    try {
      const response = await apiService.uploadFile('/profile/banner', file)
      
      // Clear current user cache
      this.clearCache('profile_current')
      
      return response
    } catch (error) {
      console.error('Error uploading banner:', error)
      throw error
    }
  }

  // Search users by username or display name
  async searchUsers(query, filters = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters
      })
      
      const response = await apiService.get(`/users/search?${params}`)
      return response
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  }

  // Get user activity feed
  async getUserActivity(userId, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      const endpoint = userId 
        ? `/profile/${userId}/activity?${params}`
        : `/profile/activity?${params}`
      
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching user activity:', error)
      throw error
    }
  }

  // Get user posts
  async getUserPosts(userId, page = 1, limit = 20, sortBy = 'newest') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy
      })
      
      const endpoint = userId 
        ? `/profile/${userId}/posts?${params}`
        : `/profile/posts?${params}`
      
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching user posts:', error)
      throw error
    }
  }

  // Get user comments
  async getUserComments(userId, page = 1, limit = 20, sortBy = 'newest') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy
      })
      
      const endpoint = userId 
        ? `/profile/${userId}/comments?${params}`
        : `/profile/comments?${params}`
      
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching user comments:', error)
      throw error
    }
  }

  // Get user statistics
  async getUserStats(userId = null) {
    try {
      const endpoint = userId ? `/profile/${userId}/stats` : '/profile/stats'
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  }

  // Update privacy settings
  async updatePrivacySettings(settings) {
    try {
      const response = await apiService.put('/profile/privacy', settings)
      
      // Clear current user cache
      this.clearCache('profile_current')
      
      return response
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      throw error
    }
  }

  // Get privacy settings
  async getPrivacySettings() {
    try {
      const response = await apiService.get('/profile/privacy')
      return response
    } catch (error) {
      console.error('Error fetching privacy settings:', error)
      throw error
    }
  }

  // Follow/unfollow user
  async toggleFollow(userId) {
    try {
      const response = await apiService.post(`/profile/${userId}/follow`)
      
      // Clear affected user caches
      this.clearCache(`profile_${userId}`)
      this.clearCache('profile_current')
      
      return response
    } catch (error) {
      console.error('Error toggling follow:', error)
      throw error
    }
  }

  // Block/unblock user
  async toggleBlock(userId) {
    try {
      const response = await apiService.post(`/profile/${userId}/block`)
      
      // Clear affected user caches
      this.clearCache(`profile_${userId}`)
      this.clearCache('profile_current')
      
      return response
    } catch (error) {
      console.error('Error toggling block:', error)
      throw error
    }
  }

  // Report user
  async reportUser(userId, reason, details = '') {
    try {
      const response = await apiService.post(`/profile/${userId}/report`, {
        reason,
        details
      })
      return response
    } catch (error) {
      console.error('Error reporting user:', error)
      throw error
    }
  }

  // Get user's followers
  async getFollowers(userId, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      const endpoint = userId 
        ? `/profile/${userId}/followers?${params}`
        : `/profile/followers?${params}`
      
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching followers:', error)
      throw error
    }
  }

  // Get users being followed
  async getFollowing(userId, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      const endpoint = userId 
        ? `/profile/${userId}/following?${params}`
        : `/profile/following?${params}`
      
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching following:', error)
      throw error
    }
  }

  // Get achievement badges
  async getBadges(userId = null) {
    try {
      const endpoint = userId ? `/profile/${userId}/badges` : '/profile/badges'
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching badges:', error)
      throw error
    }
  }

  // Get user communities
  async getUserCommunities(userId, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      const endpoint = userId 
        ? `/profile/${userId}/communities?${params}`
        : `/profile/communities?${params}`
      
      const response = await apiService.get(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching user communities:', error)
      throw error
    }
  }

  // Get recommended users
  async getRecommendedUsers(limit = 10) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })
      
      const response = await apiService.get(`/users/recommended?${params}`)
      return response
    } catch (error) {
      console.error('Error fetching recommended users:', error)
      throw error
    }
  }

  // Get profile themes
  async getProfileThemes() {
    try {
      const response = await apiService.get('/profile/themes')
      return response
    } catch (error) {
      console.error('Error fetching profile themes:', error)
      throw error
    }
  }

  // Update profile theme
  async updateProfileTheme(themeId) {
    try {
      const response = await apiService.put('/profile/theme', { themeId })
      
      // Clear current user cache
      this.clearCache('profile_current')
      
      return response
    } catch (error) {
      console.error('Error updating profile theme:', error)
      throw error
    }
  }

  // Export user data
  async exportUserData() {
    try {
      const response = await apiService.get('/profile/export')
      return response
    } catch (error) {
      console.error('Error exporting user data:', error)
      throw error
    }
  }

  // Deactivate account
  async deactivateAccount(reason = '') {
    try {
      const response = await apiService.post('/profile/deactivate', { reason })
      return response
    } catch (error) {
      console.error('Error deactivating account:', error)
      throw error
    }
  }

  // Validate username availability
  async checkUsernameAvailability(username) {
    try {
      const response = await apiService.get(`/users/check-username?username=${encodeURIComponent(username)}`)
      return response
    } catch (error) {
      console.error('Error checking username:', error)
      throw error
    }
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // Social links validation
  validateSocialLink(platform, url) {
    const patterns = {
      twitter: /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/,
      github: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/,
      linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
      instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
      youtube: /^https?:\/\/(www\.)?youtube\.com\/(channel\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+)\/?$/,
      discord: /^https?:\/\/(www\.)?discord\.gg\/[a-zA-Z0-9]+\/?$/,
      website: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/?.*$/
    }

    return patterns[platform] ? patterns[platform].test(url) : false
  }

  // Profile validation
  validateProfile(profileData) {
    const errors = {}

    // Username validation
    if (profileData.username) {
      if (profileData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters long'
      } else if (profileData.username.length > 20) {
        errors.username = 'Username must be less than 20 characters'
      } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
        errors.username = 'Username can only contain letters, numbers, and underscores'
      }
    }

    // Display name validation
    if (profileData.displayName) {
      if (profileData.displayName.length > 50) {
        errors.displayName = 'Display name must be less than 50 characters'
      }
    }

    // Bio validation
    if (profileData.bio && profileData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }

    // Social links validation
    if (profileData.socialLinks) {
      Object.entries(profileData.socialLinks).forEach(([platform, url]) => {
        if (url && !this.validateSocialLink(platform, url)) {
          errors[`socialLinks.${platform}`] = `Invalid ${platform} URL format`
        }
      })
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

// Create and export singleton instance
const profileService = new ProfileService()

export default profileService