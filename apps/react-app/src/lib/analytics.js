/**
 * Google Analytics Integration for CRYB Platform
 *
 * Provides utility functions for tracking user interactions,
 * custom events, and conversions.
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''

/**
 * Initialize Google Analytics
 * Should be called once when the app starts
 */
export const initGoogleAnalytics = () => {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    return
  }

  // Load GA script dynamically
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  // Configure GA
  script.onload = () => {
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    })
  }
}

/**
 * Check if Google Analytics is loaded
 */
export const isGALoaded = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Track page views
 */
export const trackPageView = (path) => {
  if (!isGALoaded()) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  })
}

/**
 * Track custom events
 *
 * @param {string} eventName - Name of the event (e.g., 'button_click', 'user_signup')
 * @param {object} eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!isGALoaded()) return

  window.gtag('event', eventName, {
    ...eventParams,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track user interactions
 */
export const trackUserAction = {
  // Authentication events
  signup: (method = 'email') => {
    trackEvent('sign_up', { method })
  },
  login: (method = 'email') => {
    trackEvent('login', { method })
  },
  logout: () => {
    trackEvent('logout')
  },

  // Community events
  joinCommunity: (communityId, communityName) => {
    trackEvent('join_community', {
      community_id: communityId,
      community_name: communityName,
    })
  },
  leaveCommunity: (communityId, communityName) => {
    trackEvent('leave_community', {
      community_id: communityId,
      community_name: communityName,
    })
  },
  createCommunity: (communityId) => {
    trackEvent('create_community', {
      community_id: communityId,
    })
  },

  // Post/Comment events
  createPost: (communityId) => {
    trackEvent('create_post', {
      community_id: communityId,
    })
  },
  createComment: (postId) => {
    trackEvent('create_comment', {
      post_id: postId,
    })
  },
  likePost: (postId) => {
    trackEvent('like_post', {
      post_id: postId,
    })
  },

  // Chat events
  sendMessage: (channelType = 'text') => {
    trackEvent('send_message', {
      channel_type: channelType,
    })
  },
  joinVoiceChannel: (channelId) => {
    trackEvent('join_voice_channel', {
      channel_id: channelId,
    })
  },
  leaveVoiceChannel: (duration) => {
    trackEvent('leave_voice_channel', {
      duration_seconds: duration,
    })
  },

  // Web3 events
  connectWallet: (walletType) => {
    trackEvent('connect_wallet', {
      wallet_type: walletType,
    })
  },
  disconnectWallet: () => {
    trackEvent('disconnect_wallet')
  },
  mintNFT: (nftType) => {
    trackEvent('mint_nft', {
      nft_type: nftType,
    })
  },

  // Feature usage
  searchQuery: (query) => {
    trackEvent('search', {
      search_term: query,
    })
  },
  shareContent: (contentType, platform) => {
    trackEvent('share', {
      content_type: contentType,
      platform: platform,
    })
  },
  reportContent: (contentType) => {
    trackEvent('report_content', {
      content_type: contentType,
    })
  },

  // Engagement
  completeOnboarding: () => {
    trackEvent('complete_onboarding')
  },
  updateProfile: () => {
    trackEvent('update_profile')
  },
  changeTheme: (theme) => {
    trackEvent('change_theme', {
      theme: theme,
    })
  },
}

/**
 * Track exceptions/errors
 */
export const trackException = (description, fatal = false) => {
  if (!isGALoaded()) return

  window.gtag('event', 'exception', {
    description,
    fatal,
  })
}

/**
 * Track timing (for performance monitoring)
 */
export const trackTiming = (category, variable, value, label = '') => {
  if (!isGALoaded()) return

  window.gtag('event', 'timing_complete', {
    name: variable,
    value: value,
    event_category: category,
    event_label: label,
  })
}

/**
 * Set user properties
 */
export const setUserProperties = (properties) => {
  if (!isGALoaded()) return

  window.gtag('set', 'user_properties', properties)
}

/**
 * Set user ID (for cross-device tracking)
 */
export const setUserId = (userId) => {
  if (!isGALoaded()) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
  })
}

export default {
  initGoogleAnalytics,
  trackPageView,
  trackEvent,
  trackUserAction,
  trackException,
  trackTiming,
  setUserProperties,
  setUserId,
  isGALoaded,
}
