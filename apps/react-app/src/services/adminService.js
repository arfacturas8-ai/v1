/**
 * Admin Service for CRYB Platform
 * Handles all admin-level operations including user management, content moderation,
 * analytics, audit logs, role management, and platform configuration
 */

import apiService from './api.js'

class AdminService {
  constructor() {
    this.endpoints = {
      // Dashboard & Overview
      dashboard: '/admin/dashboard',

      // User Management
      users: '/admin/users',
      userBan: (userId) => `/admin/users/${userId}/ban`,
      userUnban: (userId) => `/admin/users/${userId}/unban`,
      userDelete: (userId) => `/admin/users/${userId}`,
      userVerify: (userId) => `/admin/users/${userId}/verify`,
      userRole: (userId) => `/admin/users/${userId}/role`,

      // Reports & Moderation
      reports: '/admin/reports',
      reportResolve: (reportId) => `/admin/reports/${reportId}/resolve`,

      // Content Management
      content: '/admin/content',
      contentApprove: (contentId) => `/admin/content/${contentId}/approve`,
      contentReject: (contentId) => `/admin/content/${contentId}/reject`,
      contentFlag: (contentId) => `/admin/content/${contentId}/flag`,
      contentRemove: (contentId) => `/admin/content/${contentId}/remove`,

      // Analytics
      analytics: '/admin/analytics',
      analyticsOverview: '/admin-analytics/overview',
      analyticsUsers: '/admin-analytics/users/activity',
      analyticsRetention: '/admin-analytics/users/retention',
      analyticsContent: '/admin-analytics/content/metrics',
      analyticsCommunication: '/admin-analytics/communication/messages',
      analyticsVoice: '/admin-analytics/communication/voice',
      analyticsRevenue: '/admin-analytics/business/revenue',
      analyticsNFT: '/admin-analytics/business/nft',
      analyticsSystem: '/admin-analytics/system/performance',
      analyticsExport: (type) => `/admin-analytics/export/${type}`,

      // Platform Settings
      settings: '/admin/settings',
      settingsUpdate: '/admin/settings',
      maintenance: '/admin/system/maintenance',

      // Audit Logs
      auditLogs: '/admin/audit-logs',
      moderationLogs: '/admin/moderation-logs',

      // Content Seeding (from admin-content.ts)
      contentStats: '/admin-content/stats',
      createContent: '/admin-content/create-content',
      createSampleUsers: '/admin-content/create-sample-users',
      contentAnalytics: '/admin-content/analytics',
      resetPlatform: '/admin-content/reset-platform',
    }
  }

  // ==========================================
  // DASHBOARD & OVERVIEW
  // ==========================================

  /**
   * Get admin dashboard statistics
   * @param {number} days - Number of days for timeframe (default: 30)
   */
  async getDashboardStats(days = 30) {
    try {
      const response = await apiService.get(`${this.endpoints.dashboard}?days=${days}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      throw error
    }
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  /**
   * Get users list with filtering and pagination
   * @param {Object} params - Query parameters
   */
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 50,
        ...(params.search && { search: params.search }),
        ...(params.role && { role: params.role }),
        ...(params.status && { status: params.status }),
        ...(params.verified !== undefined && { verified: params.verified }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
      })

      const response = await apiService.get(`${this.endpoints.users}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch users:', error)
      throw error
    }
  }

  /**
   * Ban a user
   * @param {string} userId - User ID to ban
   * @param {Object} options - Ban options
   */
  async banUser(userId, options = {}) {
    try {
      const response = await apiService.post(this.endpoints.userBan(userId), {
        body: JSON.stringify({
          reason: options.reason || 'Violation of community guidelines',
          duration: options.duration, // Optional: days until unban
          deleteContent: options.deleteContent || false,
          notifyUser: options.notifyUser !== false,
        }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to ban user:', error)
      throw error
    }
  }

  /**
   * Unban a user
   * @param {string} userId - User ID to unban
   * @param {string} reason - Reason for unbanning
   */
  async unbanUser(userId, reason = '') {
    try {
      const response = await apiService.post(this.endpoints.userUnban(userId), {
        body: JSON.stringify({ reason }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to unban user:', error)
      throw error
    }
  }

  /**
   * Delete a user account
   * @param {string} userId - User ID to delete
   */
  async deleteUser(userId) {
    try {
      const response = await apiService.delete(this.endpoints.userDelete(userId))
      return response.data || response
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  /**
   * Verify a user account
   * @param {string} userId - User ID to verify
   */
  async verifyUser(userId) {
    try {
      const response = await apiService.post(this.endpoints.userVerify(userId))
      return response.data || response
    } catch (error) {
      console.error('Failed to verify user:', error)
      throw error
    }
  }

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} role - New role (USER, MODERATOR, ADMIN)
   */
  async updateUserRole(userId, role) {
    try {
      const response = await apiService.put(this.endpoints.userRole(userId), {
        body: JSON.stringify({ role }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to update user role:', error)
      throw error
    }
  }

  /**
   * Bulk user actions
   * @param {string[]} userIds - Array of user IDs
   * @param {string} action - Action to perform (ban, unban, delete, verify)
   * @param {Object} options - Action options
   */
  async bulkUserAction(userIds, action, options = {}) {
    try {
      const response = await apiService.post('/admin/users/bulk', {
        body: JSON.stringify({
          userIds,
          action,
          ...options,
        }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to perform bulk user action:', error)
      throw error
    }
  }

  // ==========================================
  // REPORTS & MODERATION
  // ==========================================

  /**
   * Get reports for moderation
   * @param {Object} params - Query parameters
   */
  async getReports(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 25,
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.priority && { priority: params.priority }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
      })

      const response = await apiService.get(`${this.endpoints.reports}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      throw error
    }
  }

  /**
   * Resolve a report
   * @param {string} reportId - Report ID
   * @param {Object} options - Resolution options
   */
  async resolveReport(reportId, options = {}) {
    try {
      const response = await apiService.post(this.endpoints.reportResolve(reportId), {
        body: JSON.stringify({
          action: options.action, // DISMISS, WARN, SUSPEND, BAN, DELETE_CONTENT
          reason: options.reason,
          duration: options.duration,
          notifyReporter: options.notifyReporter !== false,
          notifyReported: options.notifyReported !== false,
        }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to resolve report:', error)
      throw error
    }
  }

  // ==========================================
  // CONTENT MANAGEMENT
  // ==========================================

  /**
   * Get content for moderation
   * @param {Object} params - Query parameters
   */
  async getContent(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 50,
        ...(params.type && { type: params.type }),
        ...(params.status && { status: params.status }),
        ...(params.flagged !== undefined && { flagged: params.flagged }),
        ...(params.search && { search: params.search }),
      })

      const response = await apiService.get(`${this.endpoints.content}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch content:', error)
      throw error
    }
  }

  /**
   * Approve content
   * @param {string} contentId - Content ID
   */
  async approveContent(contentId) {
    try {
      const response = await apiService.post(this.endpoints.contentApprove(contentId))
      return response.data || response
    } catch (error) {
      console.error('Failed to approve content:', error)
      throw error
    }
  }

  /**
   * Reject content
   * @param {string} contentId - Content ID
   * @param {string} reason - Rejection reason
   */
  async rejectContent(contentId, reason) {
    try {
      const response = await apiService.post(this.endpoints.contentReject(contentId), {
        body: JSON.stringify({ reason }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to reject content:', error)
      throw error
    }
  }

  /**
   * Flag content for review
   * @param {string} contentId - Content ID
   * @param {string} reason - Flag reason
   */
  async flagContent(contentId, reason) {
    try {
      const response = await apiService.post(this.endpoints.contentFlag(contentId), {
        body: JSON.stringify({ reason }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to flag content:', error)
      throw error
    }
  }

  /**
   * Remove content
   * @param {string} contentId - Content ID
   * @param {string} reason - Removal reason
   */
  async removeContent(contentId, reason) {
    try {
      const response = await apiService.post(this.endpoints.contentRemove(contentId), {
        body: JSON.stringify({ reason }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to remove content:', error)
      throw error
    }
  }

  /**
   * Bulk content actions
   * @param {string[]} contentIds - Array of content IDs
   * @param {string} action - Action to perform
   * @param {Object} options - Action options
   */
  async bulkContentAction(contentIds, action, options = {}) {
    try {
      const response = await apiService.post('/admin/content/bulk', {
        body: JSON.stringify({
          contentIds,
          action,
          ...options,
        }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to perform bulk content action:', error)
      throw error
    }
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  /**
   * Get platform analytics
   * @param {Object} params - Query parameters
   */
  async getAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        timeframe: params.timeframe || '30d',
        ...(params.metrics && { metrics: params.metrics.join(',') }),
      })

      const response = await apiService.get(`${this.endpoints.analytics}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      throw error
    }
  }

  /**
   * Get platform overview analytics
   * @param {string} period - Time period (24h, 7d, 30d, 90d)
   */
  async getOverviewAnalytics(period = '24h') {
    try {
      const response = await apiService.get(`${this.endpoints.analyticsOverview}?period=${period}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch overview analytics:', error)
      throw error
    }
  }

  /**
   * Get user activity analytics
   * @param {Object} params - Query parameters
   */
  async getUserActivityAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
        granularity: params.granularity || 'day',
      })

      const response = await apiService.get(`${this.endpoints.analyticsUsers}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch user activity analytics:', error)
      throw error
    }
  }

  /**
   * Get user retention analytics
   */
  async getRetentionAnalytics() {
    try {
      const response = await apiService.get(this.endpoints.analyticsRetention)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch retention analytics:', error)
      throw error
    }
  }

  /**
   * Get content metrics
   * @param {Object} params - Query parameters
   */
  async getContentMetrics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
        ...(params.community_id && { community_id: params.community_id }),
      })

      const response = await apiService.get(`${this.endpoints.analyticsContent}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch content metrics:', error)
      throw error
    }
  }

  /**
   * Get messaging analytics
   * @param {Object} params - Query parameters
   */
  async getMessageAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
        granularity: params.granularity || 'day',
      })

      const response = await apiService.get(`${this.endpoints.analyticsCommunication}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch message analytics:', error)
      throw error
    }
  }

  /**
   * Get voice call analytics
   * @param {Object} params - Query parameters
   */
  async getVoiceAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
      })

      const response = await apiService.get(`${this.endpoints.analyticsVoice}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch voice analytics:', error)
      throw error
    }
  }

  /**
   * Get revenue analytics
   * @param {Object} params - Query parameters
   */
  async getRevenueAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
      })

      const response = await apiService.get(`${this.endpoints.analyticsRevenue}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error)
      throw error
    }
  }

  /**
   * Get NFT marketplace analytics
   * @param {Object} params - Query parameters
   */
  async getNFTAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
      })

      const response = await apiService.get(`${this.endpoints.analyticsNFT}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch NFT analytics:', error)
      throw error
    }
  }

  /**
   * Get system performance analytics
   */
  async getSystemPerformance() {
    try {
      const response = await apiService.get(this.endpoints.analyticsSystem)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch system performance:', error)
      throw error
    }
  }

  /**
   * Export analytics data
   * @param {string} type - Export type (users, content, revenue, system)
   * @param {Object} params - Query parameters
   */
  async exportAnalytics(type, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        format: params.format || 'json',
        ...(params.start_date && { start_date: params.start_date }),
        ...(params.end_date && { end_date: params.end_date }),
      })

      const response = await apiService.get(`${this.endpoints.analyticsExport(type)}?${queryParams}`)
      return response
    } catch (error) {
      console.error('Failed to export analytics:', error)
      throw error
    }
  }

  // ==========================================
  // PLATFORM SETTINGS
  // ==========================================

  /**
   * Get platform settings
   */
  async getSettings() {
    try {
      const response = await apiService.get(this.endpoints.settings)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      throw error
    }
  }

  /**
   * Update platform settings
   * @param {Object} settings - Settings to update
   */
  async updateSettings(settings) {
    try {
      const response = await apiService.put(this.endpoints.settingsUpdate, {
        body: JSON.stringify(settings),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  /**
   * Toggle maintenance mode
   * @param {boolean} enabled - Enable or disable maintenance mode
   * @param {Object} options - Maintenance options
   */
  async setMaintenanceMode(enabled, options = {}) {
    try {
      const response = await apiService.post(this.endpoints.maintenance, {
        body: JSON.stringify({
          enabled,
          message: options.message,
          estimatedDuration: options.estimatedDuration,
        }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to set maintenance mode:', error)
      throw error
    }
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================

  /**
   * Get audit logs
   * @param {Object} params - Query parameters
   */
  async getAuditLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 50,
        ...(params.action && { action: params.action }),
        ...(params.userId && { userId: params.userId }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
      })

      const response = await apiService.get(`${this.endpoints.auditLogs}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      throw error
    }
  }

  /**
   * Get moderation logs
   * @param {Object} params - Query parameters
   */
  async getModerationLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 50,
        ...(params.action && { action: params.action }),
        ...(params.moderatorId && { moderatorId: params.moderatorId }),
        ...(params.targetUserId && { targetUserId: params.targetUserId }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
      })

      const response = await apiService.get(`${this.endpoints.moderationLogs}?${queryParams}`)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch moderation logs:', error)
      throw error
    }
  }

  // ==========================================
  // CONTENT SEEDING (Development/Testing)
  // ==========================================

  /**
   * Get platform statistics
   */
  async getContentStats() {
    try {
      const response = await apiService.get(this.endpoints.contentStats)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch content stats:', error)
      throw error
    }
  }

  /**
   * Create sample content
   * @param {Object} contentData - Content data
   */
  async createSampleContent(contentData) {
    try {
      const response = await apiService.post(this.endpoints.createContent, {
        body: JSON.stringify(contentData),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to create sample content:', error)
      throw error
    }
  }

  /**
   * Create sample users
   * @param {Object} params - Parameters for user creation
   */
  async createSampleUsers(params = {}) {
    try {
      const response = await apiService.post(this.endpoints.createSampleUsers, {
        body: JSON.stringify({
          count: params.count || 10,
          usernames: params.usernames || [],
        }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to create sample users:', error)
      throw error
    }
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics() {
    try {
      const response = await apiService.get(this.endpoints.contentAnalytics)
      return response.data || response
    } catch (error) {
      console.error('Failed to fetch content analytics:', error)
      throw error
    }
  }

  /**
   * Reset platform data (DANGEROUS - Use with caution)
   * @param {string} confirmPhrase - Confirmation phrase
   */
  async resetPlatform(confirmPhrase) {
    try {
      const response = await apiService.post(this.endpoints.resetPlatform, {
        body: JSON.stringify({ confirmPhrase }),
      })
      return response.data || response
    } catch (error) {
      console.error('Failed to reset platform:', error)
      throw error
    }
  }
}

// Export singleton instance
const adminService = new AdminService()
export default adminService
