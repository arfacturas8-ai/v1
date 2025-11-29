/**
 * Social Components Exports
 * Complete social follow/friend system for CRYB Platform
 */

// Core Components
export { default as FollowButton } from './FollowButton'
export { default as SocialListsModal } from './SocialListsModal'
export { default as FriendRequestSystem } from './FriendRequestSystem'
export { default as FriendSuggestions } from './FriendSuggestions'
export { default as SocialActivityFeed } from './SocialActivityFeed'
export { default as SocialAnalytics } from './SocialAnalytics'
export { default as SocialPrivacySettings } from './SocialPrivacySettings'
export { default as SocialGraphVisualization } from './SocialGraphVisualization'

// Services
export { default as socialService } from '../../services/socialService'
export { default as socialWebSocketService } from '../../services/socialWebSocketService'

// Hooks
export { default as useSocialRealTime } from '../../hooks/useSocialRealTime'

// Types and Constants
export const SOCIAL_EVENTS = {
  USER_FOLLOWED: 'user_followed',
  USER_UNFOLLOWED: 'user_unfollowed',
  NEW_FOLLOWER: 'new_follower',
  FRIEND_REQUEST_RECEIVED: 'friend_request_received',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
  FRIEND_ADDED: 'friend_added',
  FRIEND_REMOVED: 'friend_removed',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  SOCIAL_NOTIFICATION: 'social_notification'
}

export const RELATIONSHIP_TYPES = {
  FOLLOWER: 'follower',
  FOLLOWING: 'following',
  FRIEND: 'friend',
  MUTUAL: 'mutual',
  BLOCKED: 'blocked'
}

export const SUGGESTION_ALGORITHMS = {
  SMART: 'smart',
  MUTUAL: 'mutual',
  TRENDING: 'trending',
  NEARBY: 'nearby',
  NEW: 'new',
  SIMILAR: 'similar'
}

/**
 * Social Platform Integration Helper
 * Provides a complete social system integration
 */
export class SocialPlatformIntegration {
  constructor(config = {}) {
    this.config = {
      enableRealTime: true,
      enableNotifications: true,
      enableAnalytics: true,
      enablePrivacy: true,
      ...config
    }
  }

  /**
   * Initialize the social platform with all components
   */
  async initialize(userId, authToken) {
    const components = {}

    if (this.config.enableRealTime) {
      const { default: socialWebSocketService } = await import('../../services/socialWebSocketService')
      socialWebSocketService.connect(userId, authToken)
      components.webSocket = socialWebSocketService
    }

    if (this.config.enableAnalytics) {
      const { default: socialService } = await import('../../services/socialService')
      components.analytics = socialService
    }

    return components
  }

  /**
   * Create a complete social hub component
   */
  createSocialHub(props = {}) {
    const { default: FriendsSystem } = require('../FriendsSystem')
    return FriendsSystem
  }

  /**
   * Get social component by name
   */
  getComponent(name) {
    const components = {
      FollowButton: () => import('./FollowButton'),
      SocialLists: () => import('./SocialListsModal'),
      FriendRequests: () => import('./FriendRequestSystem'),
      Suggestions: () => import('./FriendSuggestions'),
      ActivityFeed: () => import('./SocialActivityFeed'),
      Analytics: () => import('./SocialAnalytics'),
      Privacy: () => import('./SocialPrivacySettings'),
      Graph: () => import('./SocialGraphVisualization')
    }

    return components[name] ? components[name]() : null
  }
}

export default SocialPlatformIntegration