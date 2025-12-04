/**
 * Environment Configuration
 * Centralized environment variables and configuration
 */

export const environment = {
  // App Info
  APP_NAME: import.meta.env.VITE_APP_NAME || 'CRYB.AI',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',

  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.cryb.ai',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,

  // WebSocket
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://ws.cryb.ai',

  // Authentication
  AUTH_TOKEN_KEY: 'cryb_auth_token',
  AUTH_REFRESH_TOKEN_KEY: 'cryb_refresh_token',
  AUTH_USER_KEY: 'cryb_user',

  // Web3 Configuration
  WALLET_CONNECT_PROJECT_ID: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '',
  SUPPORTED_CHAINS: [1, 137, 42161, 10, 8453], // Ethereum, Polygon, Arbitrum, Optimism, Base
  DEFAULT_CHAIN_ID: 1,

  // RPC URLs (using public RPCs as fallbacks)
  RPC_URLS: {
    1: import.meta.env.VITE_RPC_ETHEREUM || 'https://eth.llamarpc.com',
    137: import.meta.env.VITE_RPC_POLYGON || 'https://polygon.llamarpc.com',
    42161: import.meta.env.VITE_RPC_ARBITRUM || 'https://arbitrum.llamarpc.com',
    10: import.meta.env.VITE_RPC_OPTIMISM || 'https://optimism.llamarpc.com',
    8453: import.meta.env.VITE_RPC_BASE || 'https://base.llamarpc.com',
  },

  // Storage
  LOCAL_STORAGE_PREFIX: 'cryb_',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Upload Configuration
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],

  // CDN
  CDN_URL: import.meta.env.VITE_CDN_URL || 'https://cdn.cryb.ai',

  // Feature Flags
  FEATURES: {
    TRADING: import.meta.env.VITE_FEATURE_TRADING === 'true',
    NFT_MARKETPLACE: import.meta.env.VITE_FEATURE_NFT_MARKETPLACE === 'true',
    NFT_MINTING: import.meta.env.VITE_FEATURE_NFT_MINTING === 'true',
    DEFI: import.meta.env.VITE_FEATURE_DEFI === 'true',
    PORTFOLIO: import.meta.env.VITE_FEATURE_PORTFOLIO === 'true',
    MARKETS: import.meta.env.VITE_FEATURE_MARKETS === 'true',
    BRIDGING: import.meta.env.VITE_FEATURE_BRIDGING === 'true',
    FIAT_ON_RAMP: import.meta.env.VITE_FEATURE_FIAT_ON_RAMP === 'true',
    SEND_CRYPTO: import.meta.env.VITE_FEATURE_SEND_CRYPTO === 'true',
    PRICE_ALERTS: import.meta.env.VITE_FEATURE_PRICE_ALERTS === 'true',
  },

  // Analytics
  ANALYTICS_ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN || '',

  // Error Tracking
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  SENTRY_ENVIRONMENT: import.meta.env.VITE_APP_ENV || 'development',

  // Social
  TWITTER_URL: 'https://twitter.com/crybai',
  DISCORD_URL: 'https://discord.gg/cryb',
  TELEGRAM_URL: 'https://t.me/crybai',

  // Legal
  TERMS_URL: '/legal/terms',
  PRIVACY_URL: '/legal/privacy',
  SUPPORT_EMAIL: 'support@cryb.ai',

  // Performance
  ENABLE_SERVICE_WORKER: import.meta.env.VITE_ENABLE_SW === 'true',
  LAZY_LOAD_IMAGES: true,
  ENABLE_ANALYTICS: import.meta.env.NODE_ENV === 'production',
} as const;

export type Environment = typeof environment;

// Helper to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof environment.FEATURES): boolean => {
  return environment.FEATURES[feature] === true;
};

// Helper to get API URL
export const getApiUrl = (path: string): string => {
  return `${environment.API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// Helper to get CDN URL
export const getCdnUrl = (path: string): string => {
  return `${environment.CDN_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export default environment;
