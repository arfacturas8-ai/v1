/**
 * Application Constants
 * Centralized constants used throughout the application
 */

export const APP_CONSTANTS = {
  // Post Constants
  POST_MAX_LENGTH: 500,
  POST_MAX_IMAGES: 4,
  POST_MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  COMMENT_MAX_LENGTH: 280,
  BIO_MAX_LENGTH: 160,

  // Username Rules
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 15,
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,

  // Password Rules
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  INFINITE_SCROLL_THRESHOLD: 0.8,

  // Cache Durations (in ms)
  CACHE_SHORT: 1 * 60 * 1000, // 1 minute
  CACHE_MEDIUM: 5 * 60 * 1000, // 5 minutes
  CACHE_LONG: 30 * 60 * 1000, // 30 minutes

  // Debounce Delays
  SEARCH_DEBOUNCE: 300,
  INPUT_DEBOUNCE: 500,
  SCROLL_DEBOUNCE: 100,

  // Toast Durations
  TOAST_SHORT: 2000,
  TOAST_MEDIUM: 4000,
  TOAST_LONG: 6000,

  // Animation Durations
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 250,
  ANIMATION_SLOW: 350,

  // Media Query Breakpoints
  BREAKPOINTS: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // Z-Index Layers
  Z_INDEX: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // NFT Constants
  NFT_IMAGE_SIZE: 512,
  NFT_THUMBNAIL_SIZE: 256,
  COLLECTION_COVER_SIZE: 1200,

  // Wallet Constants
  WALLET_ADDRESS_LENGTH: 42,
  ENS_RESOLUTION_TIMEOUT: 5000,

  // Call Constants
  MAX_CALL_DURATION: 60 * 60 * 1000, // 1 hour
  CALL_RECONNECT_ATTEMPTS: 3,

  // Community Constants
  COMMUNITY_NAME_MAX_LENGTH: 50,
  COMMUNITY_DESC_MAX_LENGTH: 500,
  COMMUNITY_RULES_MAX_LENGTH: 2000,

  // Rate Limits
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_COOLDOWN: 15 * 60 * 1000, // 15 minutes
  MAX_POSTS_PER_HOUR: 50,
  MAX_MESSAGES_PER_MINUTE: 10,

  // File Upload
  MAX_PROFILE_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_BANNER_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_POST_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_MESSAGE_IMAGE_SIZE: 25 * 1024 * 1024, // 25MB

  // Notification Constants
  MAX_NOTIFICATIONS_PER_PAGE: 50,
  NOTIFICATION_FETCH_INTERVAL: 30000, // 30 seconds

  // Search Constants
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_RECENT_SEARCHES: 10,

  // Session Constants
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry

  // WebSocket Constants
  WS_RECONNECT_DELAY: 3000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  WS_PING_INTERVAL: 30000,
  WS_PING_TIMEOUT: 10000,
} as const;

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You need to be logged in to do that.',
  FORBIDDEN: 'You don\'t have permission to do that.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please slow down.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  FILE_TOO_LARGE: 'File is too large.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet.',
  TRANSACTION_FAILED: 'Transaction failed.',
  INSUFFICIENT_BALANCE: 'Insufficient balance.',
  USERNAME_TAKEN: 'Username is already taken.',
  EMAIL_TAKEN: 'Email is already registered.',
  INVALID_USERNAME: 'Invalid username format.',
  INVALID_EMAIL: 'Invalid email address.',
  WEAK_PASSWORD: 'Password is too weak.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
} as const;

export const SUCCESS_MESSAGES = {
  GENERIC: 'Success!',
  POST_CREATED: 'Post created successfully!',
  POST_DELETED: 'Post deleted successfully!',
  COMMENT_POSTED: 'Comment posted!',
  PROFILE_UPDATED: 'Profile updated!',
  FOLLOW_SUCCESS: 'You are now following this user!',
  UNFOLLOW_SUCCESS: 'Unfollowed successfully!',
  MESSAGE_SENT: 'Message sent!',
  WALLET_CONNECTED: 'Wallet connected!',
  WALLET_DISCONNECTED: 'Wallet disconnected!',
  TRANSACTION_SUCCESS: 'Transaction successful!',
  COMMUNITY_CREATED: 'Community created!',
  COMMUNITY_JOINED: 'Joined community!',
  SETTINGS_SAVED: 'Settings saved!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EMAIL_VERIFIED: 'Email verified!',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
} as const;

export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  SEARCH: '/search',
  TRENDING: '/trending',
  CREATE: '/create',
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  USER_PROFILE: '/user/:username',
  POST: '/post/:id',
  NFT: '/nft/:id',
  COLLECTION: '/collection/:id',
  COMMUNITY: '/community/:slug',
  CALLS: '/calls',
  WALLET: '/wallet',
  SETTINGS: '/settings',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  ONBOARDING: '/onboarding',
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  NOT_FOUND: '/404',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recent_searches',
  DRAFT_POST: 'draft_post',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  WALLET_CONNECTED: 'wallet_connected',
  SELECTED_WALLET: 'selected_wallet',
  FEATURE_FLAGS: 'feature_flags',
} as const;

export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MENTION: 'mention',
  REPOST: 'repost',
  QUOTE: 'quote',
  MESSAGE: 'message',
  COMMUNITY_INVITE: 'community_invite',
  COMMUNITY_POST: 'community_post',
  NFT_SOLD: 'nft_sold',
  NFT_OFFER: 'nft_offer',
  PRICE_ALERT: 'price_alert',
  SYSTEM: 'system',
} as const;

export const POST_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  POLL: 'poll',
  LINK: 'link',
  QUOTE: 'quote',
  THREAD: 'thread',
} as const;

export const WALLET_PROVIDERS = {
  METAMASK: 'metamask',
  WALLET_CONNECT: 'walletconnect',
  COINBASE_WALLET: 'coinbase',
  RAINBOW: 'rainbow',
  TRUST_WALLET: 'trust',
} as const;

export const CHAIN_NAMES = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
} as const;

export const EXPLORER_URLS = {
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  8453: 'https://basescan.org',
} as const;

export default APP_CONSTANTS;
