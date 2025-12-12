/**
 * ==============================================
 * CRYB PLATFORM - ANALYTICS SERVICE
 * ==============================================
 * Comprehensive analytics service for the CRYB platform frontend.
 * Provides methods to track and retrieve analytics data from backend.
 *
 * Covers endpoints from:
 * - analytics.ts (basic server/user/community analytics)
 * - crash-proof-analytics.ts (dashboard, realtime, tracking, privacy)
 * - enhanced-analytics.ts (search analytics, performance, recommendations)
 * - admin-analytics.ts (platform overview, content, business, exports)
 * ==============================================
 */

import apiService from './api.js';
import { getErrorMessage } from '../utils/errorUtils.js';

class AnalyticsService {
  constructor() {
    this.endpoints = {
      // Basic Analytics (analytics.ts)
      basic: {
        server: '/analytics/servers',
        user: '/analytics/me',
        community: '/analytics/communities'
      },

      // Crash-Proof Analytics (crash-proof-analytics.ts)
      crashProof: {
        dashboard: '/crash-proof-analytics/dashboard',
        realtime: '/crash-proof-analytics/realtime',
        track: '/crash-proof-analytics/track',
        serverAnalytics: '/crash-proof-analytics/servers',
        userEngagement: '/crash-proof-analytics/users',
        consent: '/crash-proof-analytics/consent',
        gdprRequest: '/crash-proof-analytics/gdpr-request',
        health: '/crash-proof-analytics/health',
        clearCache: '/crash-proof-analytics/cache',
        export: '/crash-proof-analytics/export'
      },

      // Enhanced Analytics (enhanced-analytics.ts)
      search: {
        dashboard: '/enhanced-analytics/search/dashboard',
        performance: '/enhanced-analytics/search/performance',
        trending: '/enhanced-analytics/search/trending',
        profile: '/enhanced-analytics/search/profile',
        export: '/enhanced-analytics/search/export',
        realtime: '/enhanced-analytics/search/realtime',
        analyze: '/enhanced-analytics/search/queries/analyze',
        recommendations: '/enhanced-analytics/search/recommendations',
        health: '/enhanced-analytics/health'
      },

      // Admin Analytics (admin-analytics.ts)
      admin: {
        overview: '/admin-analytics/overview',
        userActivity: '/admin-analytics/users/activity',
        userRetention: '/admin-analytics/users/retention',
        contentMetrics: '/admin-analytics/content/metrics',
        messages: '/admin-analytics/communication/messages',
        voice: '/admin-analytics/communication/voice',
        revenue: '/admin-analytics/business/revenue',
        nft: '/admin-analytics/business/nft',
        systemPerformance: '/admin-analytics/system/performance',
        export: '/admin-analytics/export'
      }
    };
  }

  // ==============================================
  // USER ANALYTICS
  // ==============================================

  /**
   * Get current user's analytics
   * @returns {Promise<Object>} User analytics data
   */
  async getUserAnalytics() {
    try {
      const response = await apiService.get(this.endpoints.basic.user);
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user analytics'
      };
    }
  }

  /**
   * Get user engagement metrics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<Object>} User engagement data
   */
  async getUserEngagement(userId, days = 30) {
    try {
      const response = await apiService.get(
        `${this.endpoints.crashProof.userEngagement}/${userId}/engagement?days=${days}`
      );
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get user engagement:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user engagement'
      };
    }
  }

  // ==============================================
  // PAGE VIEW & EVENT TRACKING
  // ==============================================

  /**
   * Track a page view
   * @param {string} pageUrl - URL of the page
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Tracking result
   */
  async trackPageView(pageUrl, metadata = {}) {
    try {
      const sessionId = this._getOrCreateSessionId();

      const response = await apiService.post(this.endpoints.crashProof.track, {
        type: 'page_view',
        sessionId,
        metadata: {
          url: pageUrl,
          title: document.title,
          referrer: document.referrer,
          ...metadata
        }
      }, { auth: false });

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to track page view:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to track page view'
      };
    }
  }

  /**
   * Track a custom event
   * @param {string} eventName - Name of the event
   * @param {Object} properties - Event properties
   * @returns {Promise<Object>} Tracking result
   */
  async trackEvent(eventName, properties = {}) {
    try {
      const sessionId = this._getOrCreateSessionId();

      const response = await apiService.post(this.endpoints.crashProof.track, {
        type: 'custom',
        sessionId,
        metadata: {
          event: eventName,
          ...properties
        }
      }, { auth: false });

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to track event:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to track event'
      };
    }
  }

  /**
   * Track an error occurrence
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Tracking result
   */
  async trackError(error, context = {}) {
    try {
      const sessionId = this._getOrCreateSessionId();

      const response = await apiService.post(this.endpoints.crashProof.track, {
        type: 'custom',
        sessionId,
        metadata: {
          event: 'error',
          errorMessage: error.message,
          errorStack: error.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          ...context
        }
      }, { auth: false });

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (err) {
      console.error('Failed to track error:', err);
      return {
        success: false,
        data: null,
        error: getErrorMessage(err, 'Failed to track error')
      };
    }
  }

  /**
   * Track message sent event
   * @param {Object} metadata - Message metadata
   * @returns {Promise<Object>} Tracking result
   */
  async trackMessageSent(metadata = {}) {
    try {
      const sessionId = this._getOrCreateSessionId();

      const response = await apiService.post(this.endpoints.crashProof.track, {
        type: 'message_sent',
        sessionId,
        metadata
      }, { auth: false });

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to track message:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to track message'
      };
    }
  }

  /**
   * Track search event
   * @param {Object} metadata - Search metadata
   * @returns {Promise<Object>} Tracking result
   */
  async trackSearch(metadata = {}) {
    try {
      const sessionId = this._getOrCreateSessionId();

      const response = await apiService.post(this.endpoints.crashProof.track, {
        type: 'search',
        sessionId,
        metadata
      }, { auth: false });

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to track search:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to track search'
      };
    }
  }

  /**
   * Track voice activity event
   * @param {Object} metadata - Voice activity metadata
   * @returns {Promise<Object>} Tracking result
   */
  async trackVoiceActivity(metadata = {}) {
    try {
      const sessionId = this._getOrCreateSessionId();

      const response = await apiService.post(this.endpoints.crashProof.track, {
        type: 'voice_activity',
        sessionId,
        metadata
      }, { auth: false });

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to track voice activity:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to track voice activity'
      };
    }
  }

  /**
   * Track interaction event
   * @param {Object} metadata - Interaction metadata
   * @returns {Promise<Object>} Tracking result
   */
  async trackInteraction(metadata = {}) {
    try {
      const sessionId = this._getOrCreateSessionId();

      const response = await apiService.post(this.endpoints.crashProof.track, {
        type: 'interaction',
        sessionId,
        metadata
      }, { auth: false });

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to track interaction:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to track interaction'
      };
    }
  }

  // ==============================================
  // COMMUNITY ANALYTICS
  // ==============================================

  /**
   * Get community analytics (moderator only)
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Community analytics data
   */
  async getCommunityAnalytics(communityId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.basic.community}/${communityId}`
      );
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get community analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch community analytics'
      };
    }
  }

  /**
   * Get engagement metrics for a community
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Engagement metrics
   */
  async getEngagementMetrics(communityId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.basic.community}/${communityId}`
      );

      // Extract engagement-specific metrics
      const engagementData = {
        activeUsers: response.data?.activeUsers || 0,
        postCount: response.data?.postCount || 0,
        commentCount: response.data?.commentCount || 0,
        engagementRate: response.data?.activeUsers && response.data?.memberCount
          ? (response.data.activeUsers / response.data.memberCount) * 100
          : 0
      };

      return {
        success: true,
        data: engagementData,
        error: null
      };
    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch engagement metrics'
      };
    }
  }

  /**
   * Get growth metrics for a community
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Growth metrics
   */
  async getGrowthMetrics(communityId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.basic.community}/${communityId}`
      );

      // Extract growth-specific metrics
      const growthData = {
        memberCount: response.data?.memberCount || 0,
        postCount: response.data?.postCount || 0,
        activeUsers: response.data?.activeUsers || 0,
        // Note: Backend doesn't provide historical data yet
        // These would need to be calculated from time-series data
        memberGrowthRate: 0,
        contentGrowthRate: 0
      };

      return {
        success: true,
        data: growthData,
        error: null
      };
    } catch (error) {
      console.error('Failed to get growth metrics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch growth metrics'
      };
    }
  }

  // ==============================================
  // SERVER ANALYTICS
  // ==============================================

  /**
   * Get server analytics (owner only)
   * @param {string} serverId - Server ID
   * @param {number} days - Number of days to look back (default: 7)
   * @returns {Promise<Object>} Server analytics data
   */
  async getServerAnalytics(serverId, days = 7) {
    try {
      const response = await apiService.get(
        `${this.endpoints.crashProof.serverAnalytics}/${serverId}?days=${days}`
      );
      return {
        success: true,
        data: response.data,
        serverId: response.serverId,
        error: null
      };
    } catch (error) {
      console.error('Failed to get server analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch server analytics'
      };
    }
  }

  /**
   * Get basic server analytics (simplified version)
   * @param {string} serverId - Server ID
   * @returns {Promise<Object>} Server analytics data
   */
  async getBasicServerAnalytics(serverId) {
    try {
      const response = await apiService.get(
        `${this.endpoints.basic.server}/${serverId}`
      );
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get basic server analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch server analytics'
      };
    }
  }

  // ==============================================
  // DASHBOARD & PLATFORM ANALYTICS
  // ==============================================

  /**
   * Get analytics dashboard data
   * @param {Object} options - Dashboard options
   * @param {string} options.timeRange - Time range (1h, 24h, 7d, 30d)
   * @param {string} options.serverId - Optional server ID filter
   * @param {boolean} options.refresh - Force refresh cache
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard({ timeRange = '24h', serverId = null, refresh = false } = {}) {
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(serverId && { serverId }),
        refresh: refresh.toString()
      });

      const response = await apiService.get(
        `${this.endpoints.crashProof.dashboard}?${params.toString()}`
      );

      return {
        success: true,
        data: response.data,
        metadata: response.metadata,
        error: null
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch dashboard data'
      };
    }
  }

  /**
   * Get real-time metrics
   * @returns {Promise<Object>} Real-time metrics
   */
  async getRealtimeMetrics() {
    try {
      const response = await apiService.get(this.endpoints.crashProof.realtime);
      return {
        success: true,
        data: response.data,
        timestamp: response.timestamp,
        error: null
      };
    } catch (error) {
      console.error('Failed to get realtime metrics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch realtime metrics'
      };
    }
  }

  /**
   * Get platform statistics
   * @param {string} period - Time period (24h, 7d, 30d, 90d)
   * @returns {Promise<Object>} Platform stats
   */
  async getPlatformStats(period = '24h') {
    try {
      const response = await apiService.get(
        `${this.endpoints.admin.overview}?period=${period}`
      );
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to get platform stats:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch platform stats'
      };
    }
  }

  /**
   * Get active users count
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Active users data
   */
  async getActiveUsers(timeRange = '24h') {
    try {
      const response = await apiService.get(
        `${this.endpoints.admin.overview}?period=${timeRange}`
      );
      return {
        success: true,
        data: {
          activeUsers: response.active_users,
          totalUsers: response.total_users,
          newUsersToday: response.new_users_today
        },
        error: null
      };
    } catch (error) {
      console.error('Failed to get active users:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch active users'
      };
    }
  }

  /**
   * Get content metrics
   * @param {Object} options - Content metrics options
   * @param {string} options.startDate - Start date (ISO format)
   * @param {string} options.endDate - End date (ISO format)
   * @param {string} options.communityId - Optional community ID filter
   * @returns {Promise<Object>} Content metrics
   */
  async getContentMetrics({ startDate, endDate, communityId } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (communityId) params.append('community_id', communityId);

      const queryString = params.toString();
      const url = queryString
        ? `${this.endpoints.admin.contentMetrics}?${queryString}`
        : this.endpoints.admin.contentMetrics;

      const response = await apiService.get(url);
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to get content metrics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch content metrics'
      };
    }
  }

  // ==============================================
  // SEARCH ANALYTICS
  // ==============================================

  /**
   * Get search analytics dashboard
   * @param {Object} options - Search dashboard options
   * @param {string} options.period - Period (hour, day, week, month)
   * @param {string} options.startDate - Start date (ISO format)
   * @param {string} options.endDate - End date (ISO format)
   * @returns {Promise<Object>} Search analytics dashboard
   */
  async getSearchDashboard({ period = 'day', startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiService.get(
        `${this.endpoints.search.dashboard}?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.timestamp,
        error: null
      };
    } catch (error) {
      console.error('Failed to get search dashboard:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch search dashboard'
      };
    }
  }

  /**
   * Get search performance insights
   * @param {number} hours - Number of hours to analyze (default: 24)
   * @returns {Promise<Object>} Search performance insights
   */
  async getSearchPerformance(hours = 24) {
    try {
      const response = await apiService.get(
        `${this.endpoints.search.performance}?hours=${hours}`
      );
      return {
        success: true,
        data: response.data,
        period: response.period,
        timestamp: response.timestamp,
        error: null
      };
    } catch (error) {
      console.error('Failed to get search performance:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch search performance'
      };
    }
  }

  /**
   * Get trending search queries
   * @param {string} period - Period (hour, day, week)
   * @param {number} limit - Number of results (default: 20)
   * @returns {Promise<Object>} Trending queries
   */
  async getTrendingQueries(period = 'day', limit = 20) {
    try {
      const response = await apiService.get(
        `${this.endpoints.search.trending}?period=${period}&limit=${limit}`
      );
      return {
        success: true,
        data: response.data,
        period: response.period,
        count: response.count,
        timestamp: response.timestamp,
        error: null
      };
    } catch (error) {
      console.error('Failed to get trending queries:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch trending queries'
      };
    }
  }

  /**
   * Get user's search profile
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze (default: 30)
   * @returns {Promise<Object>} User search profile
   */
  async getUserSearchProfile(userId, days = 30) {
    try {
      const response = await apiService.get(
        `${this.endpoints.search.profile}/${userId}?days=${days}`
      );
      return {
        success: true,
        data: response.data,
        period: response.period,
        timestamp: response.timestamp,
        error: null
      };
    } catch (error) {
      console.error('Failed to get user search profile:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user search profile'
      };
    }
  }

  /**
   * Get real-time search metrics
   * @returns {Promise<Object>} Real-time search metrics
   */
  async getRealtimeSearchMetrics() {
    try {
      const response = await apiService.get(this.endpoints.search.realtime);
      return {
        success: true,
        data: response.data,
        timestamp: response.timestamp,
        error: null
      };
    } catch (error) {
      console.error('Failed to get realtime search metrics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch realtime search metrics'
      };
    }
  }

  /**
   * Analyze a specific search query
   * @param {string} query - Search query to analyze
   * @param {number} days - Number of days to analyze (default: 7)
   * @returns {Promise<Object>} Query analysis
   */
  async analyzeQuery(query, days = 7) {
    try {
      const response = await apiService.get(
        `${this.endpoints.search.analyze}?query=${encodeURIComponent(query)}&days=${days}`
      );
      return {
        success: true,
        data: response.data,
        timestamp: response.timestamp,
        error: null
      };
    } catch (error) {
      console.error('Failed to analyze query:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to analyze query'
      };
    }
  }

  /**
   * Get search optimization recommendations (admin only)
   * @returns {Promise<Object>} Search recommendations
   */
  async getSearchRecommendations() {
    try {
      const response = await apiService.get(this.endpoints.search.recommendations);
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get search recommendations:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch search recommendations'
      };
    }
  }

  // ==============================================
  // ADMIN ANALYTICS
  // ==============================================

  /**
   * Get admin analytics dashboard (admin only)
   * @param {string} period - Time period (24h, 7d, 30d, 90d)
   * @returns {Promise<Object>} Admin dashboard data
   */
  async getAdminDashboard(period = '24h') {
    try {
      const response = await apiService.get(
        `${this.endpoints.admin.overview}?period=${period}`
      );
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to get admin dashboard:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch admin dashboard'
      };
    }
  }

  /**
   * Get user activity analytics (admin only)
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (ISO format)
   * @param {string} options.endDate - End date (ISO format)
   * @param {string} options.granularity - Granularity (hour, day, week)
   * @returns {Promise<Object>} User activity data
   */
  async getUserActivity({ startDate, endDate, granularity = 'day' } = {}) {
    try {
      const params = new URLSearchParams({ granularity });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiService.get(
        `${this.endpoints.admin.userActivity}?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user activity'
      };
    }
  }

  /**
   * Get user retention analytics (admin only)
   * @returns {Promise<Object>} User retention data
   */
  async getUserRetention() {
    try {
      const response = await apiService.get(this.endpoints.admin.userRetention);
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get user retention:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user retention'
      };
    }
  }

  /**
   * Get messaging analytics (admin only)
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (ISO format)
   * @param {string} options.endDate - End date (ISO format)
   * @param {string} options.granularity - Granularity (hour, day, week)
   * @returns {Promise<Object>} Messaging analytics
   */
  async getMessagingAnalytics({ startDate, endDate, granularity = 'day' } = {}) {
    try {
      const params = new URLSearchParams({ granularity });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiService.get(
        `${this.endpoints.admin.messages}?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get messaging analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch messaging analytics'
      };
    }
  }

  /**
   * Get voice analytics (admin only)
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (ISO format)
   * @param {string} options.endDate - End date (ISO format)
   * @returns {Promise<Object>} Voice analytics
   */
  async getVoiceAnalytics({ startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const queryString = params.toString();
      const url = queryString
        ? `${this.endpoints.admin.voice}?${queryString}`
        : this.endpoints.admin.voice;

      const response = await apiService.get(url);
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get voice analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch voice analytics'
      };
    }
  }

  /**
   * Get revenue analytics (admin only)
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (ISO format)
   * @param {string} options.endDate - End date (ISO format)
   * @returns {Promise<Object>} Revenue analytics
   */
  async getRevenueAnalytics({ startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const queryString = params.toString();
      const url = queryString
        ? `${this.endpoints.admin.revenue}?${queryString}`
        : this.endpoints.admin.revenue;

      const response = await apiService.get(url);
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get revenue analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch revenue analytics'
      };
    }
  }

  /**
   * Get NFT marketplace analytics (admin only)
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (ISO format)
   * @param {string} options.endDate - End date (ISO format)
   * @returns {Promise<Object>} NFT analytics
   */
  async getNFTAnalytics({ startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const queryString = params.toString();
      const url = queryString
        ? `${this.endpoints.admin.nft}?${queryString}`
        : this.endpoints.admin.nft;

      const response = await apiService.get(url);
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get NFT analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch NFT analytics'
      };
    }
  }

  /**
   * Get system performance metrics (admin only)
   * @returns {Promise<Object>} System performance data
   */
  async getSystemPerformance() {
    try {
      const response = await apiService.get(this.endpoints.admin.systemPerformance);
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to get system performance:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch system performance'
      };
    }
  }

  /**
   * Get detailed analytics for a specific resource (admin only)
   * @param {string} resource - Resource type (user, server, community, etc.)
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Detailed analytics
   */
  async getDetailedAnalytics(resource, id) {
    try {
      let endpoint;

      switch (resource) {
        case 'server':
          endpoint = `${this.endpoints.crashProof.serverAnalytics}/${id}`;
          break;
        case 'user':
          endpoint = `${this.endpoints.crashProof.userEngagement}/${id}/engagement`;
          break;
        case 'community':
          endpoint = `${this.endpoints.basic.community}/${id}`;
          break;
        default:
          throw new Error(`Unknown resource type: ${resource}`);
      }

      const response = await apiService.get(endpoint);
      return {
        success: true,
        data: response.data || response,
        error: null
      };
    } catch (error) {
      console.error('Failed to get detailed analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch detailed analytics'
      };
    }
  }

  // ==============================================
  // PRIVACY & CONSENT
  // ==============================================

  /**
   * Record user consent preferences
   * @param {string} userId - User ID
   * @param {Object} consent - Consent preferences
   * @param {boolean} consent.analytics - Analytics consent
   * @param {boolean} consent.functional - Functional consent
   * @param {boolean} consent.marketing - Marketing consent
   * @param {boolean} consent.performance - Performance consent
   * @returns {Promise<Object>} Consent record result
   */
  async recordConsent(userId, consent) {
    try {
      const response = await apiService.post(this.endpoints.crashProof.consent, {
        userId,
        analytics: consent.analytics || false,
        functional: consent.functional !== false, // Default true
        marketing: consent.marketing || false,
        performance: consent.performance || false
      }, { auth: false });

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to record consent:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to record consent'
      };
    }
  }

  /**
   * Submit GDPR data request
   * @param {string} requestType - Request type (access, rectification, erasure, portability, restriction)
   * @param {Object} requestData - Additional request data
   * @returns {Promise<Object>} GDPR request result
   */
  async submitGDPRRequest(requestType, requestData = {}) {
    try {
      const response = await apiService.post(this.endpoints.crashProof.gdprRequest, {
        requestType,
        requestData
      });

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to submit GDPR request:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to submit GDPR request'
      };
    }
  }

  // ==============================================
  // EXPORT FUNCTIONALITY
  // ==============================================

  /**
   * Export analytics data (admin only)
   * @param {Object} filters - Export filters
   * @param {string} filters.type - Export type (users, content, revenue, system)
   * @param {string} filters.format - Export format (json, csv)
   * @param {string} filters.startDate - Start date (ISO format)
   * @param {string} filters.endDate - End date (ISO format)
   * @returns {Promise<Object>} Export result
   */
  async exportAnalytics(filters) {
    try {
      const { type = 'users', format = 'json', startDate, endDate } = filters;

      const params = new URLSearchParams({ format });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiService.get(
        `${this.endpoints.admin.export}/${type}?${params.toString()}`
      );

      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to export analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to export analytics'
      };
    }
  }

  /**
   * Export crash-proof analytics data (admin only)
   * @param {Object} filters - Export filters
   * @param {string} filters.format - Export format (json, csv)
   * @param {string} filters.startDate - Start date (ISO format)
   * @param {string} filters.endDate - End date (ISO format)
   * @param {string} filters.type - Export type (all, messages, users, voice)
   * @returns {Promise<Object>} Export result
   */
  async exportCrashProofAnalytics(filters) {
    try {
      const { format = 'json', startDate, endDate, type = 'all' } = filters;

      const params = new URLSearchParams({ format, type });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiService.get(
        `${this.endpoints.crashProof.export}?${params.toString()}`
      );

      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to export crash-proof analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to export analytics'
      };
    }
  }

  /**
   * Export search analytics data (admin only)
   * @param {Object} filters - Export filters
   * @param {string} filters.format - Export format (json, csv)
   * @param {string} filters.startDate - Start date (ISO format)
   * @param {string} filters.endDate - End date (ISO format)
   * @param {number} filters.limit - Limit results (default: 10000)
   * @returns {Promise<Object>} Export result
   */
  async exportSearchAnalytics(filters) {
    try {
      const { format = 'json', startDate, endDate, limit = 10000 } = filters;

      const params = new URLSearchParams({ format, limit: limit.toString() });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiService.get(
        `${this.endpoints.search.export}?${params.toString()}`
      );

      return {
        success: true,
        data: response.data || response,
        error: null
      };
    } catch (error) {
      console.error('Failed to export search analytics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to export search analytics'
      };
    }
  }

  // ==============================================
  // HEALTH & MAINTENANCE
  // ==============================================

  /**
   * Get analytics service health status
   * @returns {Promise<Object>} Health status
   */
  async getAnalyticsHealth() {
    try {
      const response = await apiService.get(this.endpoints.crashProof.health);
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error('Failed to get analytics health:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch analytics health'
      };
    }
  }

  /**
   * Get search analytics health status
   * @returns {Promise<Object>} Search health status
   */
  async getSearchHealth() {
    try {
      const response = await apiService.get(this.endpoints.search.health);
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to get search health:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch search health'
      };
    }
  }

  /**
   * Clear analytics cache (admin only)
   * @returns {Promise<Object>} Clear cache result
   */
  async clearAnalyticsCache() {
    try {
      const response = await apiService.delete(this.endpoints.crashProof.clearCache);
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.error('Failed to clear analytics cache:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to clear analytics cache'
      };
    }
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  /**
   * Get or create a session ID for tracking
   * @private
   * @returns {string} Session ID
   */
  _getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Format date for API queries
   * @param {Date} date - Date object
   * @returns {string} ISO formatted date string
   */
  formatDate(date) {
    return date.toISOString();
  }

  /**
   * Calculate time range
   * @param {number} days - Number of days
   * @returns {Object} Start and end dates
   */
  getTimeRange(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
