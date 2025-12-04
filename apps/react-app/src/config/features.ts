/**
 * Feature Flags Configuration
 * Central control for all platform features
 * Social-first approach: Social features enabled, crypto features designed but gated
 */

export interface FeatureFlags {
  // Social Features (ENABLED - Live and functional)
  social: {
    posts: boolean;
    comments: boolean;
    likes: boolean;
    reposts: boolean;
    bookmarks: boolean;
    follows: boolean;
    feed: boolean;
    trending: boolean;
    explore: boolean;
    search: boolean;
    hashtags: boolean;
    mentions: boolean;
    notifications: boolean;
    directMessages: boolean;
    groupChats: boolean;
    voiceCalls: boolean;
    videoCalls: boolean;
    stories: boolean;
    polls: boolean;
    mediaUploads: boolean;
  };

  // Community Features (ENABLED - Live and functional)
  communities: {
    create: boolean;
    join: boolean;
    post: boolean;
    channels: boolean;
    roles: boolean;
    moderation: boolean;
    events: boolean;
    announcements: boolean;
    rules: boolean;
    analytics: boolean;
  };

  // User Features (ENABLED - Live and functional)
  users: {
    profiles: boolean;
    avatars: boolean;
    banners: boolean;
    bios: boolean;
    verification: boolean;
    privacy: boolean;
    blocking: boolean;
    muting: boolean;
    reporting: boolean;
  };

  // Authentication (ENABLED - Live and functional)
  auth: {
    emailPassword: boolean;
    oauth: boolean;
    mfa: boolean;
    passkeys: boolean;
    walletConnect: boolean; // For identity only
  };

  // Crypto/Web3 Features (DESIGNED but GATED - Coming Soon)
  crypto: {
    // Wallet
    walletManagement: boolean;
    tokenBalances: boolean;
    transactionHistory: boolean;
    multiChain: boolean;

    // NFTs
    nftGallery: boolean; // View NFTs from connected wallet
    nftMarketplace: boolean;
    nftMinting: boolean;
    nftTrading: boolean;
    nftCollections: boolean;

    // DeFi
    defi: boolean;
    trading: boolean;
    staking: boolean;
    liquidity: boolean;
    lending: boolean;

    // Tokens
    tokenEconomics: boolean;
    tokenGating: boolean;
    tokenRewards: boolean;
    cryptoTipping: boolean;

    // DAO
    governance: boolean;
    proposals: boolean;
    voting: boolean;

    // Blockchain
    onChainIdentity: boolean;
    smartContracts: boolean;
  };

  // Premium Features (DESIGNED but GATED)
  premium: {
    subscriptions: boolean;
    premiumBadge: boolean;
    customization: boolean;
    analytics: boolean;
    api: boolean;
  };

  // Experimental (DISABLED)
  experimental: {
    ai: boolean;
    metaverse: boolean;
    ar: boolean;
  };
}

/**
 * Default feature flags configuration
 * Social-first: All social features ON, crypto features OFF
 */
export const defaultFeatureFlags: FeatureFlags = {
  //  SOCIAL FEATURES - LIVE
  social: {
    posts: true,
    comments: true,
    likes: true,
    reposts: true,
    bookmarks: true,
    follows: true,
    feed: true,
    trending: true,
    explore: true,
    search: true,
    hashtags: true,
    mentions: true,
    notifications: true,
    directMessages: true,
    groupChats: true,
    voiceCalls: true,
    videoCalls: true,
    stories: true,
    polls: true,
    mediaUploads: true,
  },

  //  COMMUNITY FEATURES - LIVE
  communities: {
    create: true,
    join: true,
    post: true,
    channels: true,
    roles: true,
    moderation: true,
    events: true,
    announcements: true,
    rules: true,
    analytics: true,
  },

  //  USER FEATURES - LIVE
  users: {
    profiles: true,
    avatars: true,
    banners: true,
    bios: true,
    verification: true,
    privacy: true,
    blocking: true,
    muting: true,
    reporting: true,
  },

  //  AUTHENTICATION - LIVE
  auth: {
    emailPassword: true,
    oauth: true,
    mfa: true,
    passkeys: true,
    walletConnect: true, // For identity/login only
  },

  // = CRYPTO/WEB3 - COMING SOON (All false)
  crypto: {
    walletManagement: false,
    tokenBalances: false,
    transactionHistory: false,
    multiChain: false,
    nftGallery: true, // View NFTs from connected wallet (read-only)
    nftMarketplace: false,
    nftMinting: false,
    nftTrading: false,
    nftCollections: false,
    defi: false,
    trading: false,
    staking: false,
    liquidity: false,
    lending: false,
    tokenEconomics: false,
    tokenGating: false,
    tokenRewards: false,
    cryptoTipping: false,
    governance: false,
    proposals: false,
    voting: false,
    onChainIdentity: false,
    smartContracts: false,
  },

  // = PREMIUM - COMING SOON
  premium: {
    subscriptions: false,
    premiumBadge: false,
    customization: false,
    analytics: false,
    api: false,
  },

  // = EXPERIMENTAL - DISABLED
  experimental: {
    ai: false,
    metaverse: false,
    ar: false,
  },
};

/**
 * Feature flag hook
 */
export const useFeatureFlags = (): FeatureFlags => {
  // In production, this could fetch from API or environment
  // For now, return static config
  return defaultFeatureFlags;
};

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (
  category: keyof FeatureFlags,
  feature: string
): boolean => {
  const flags = defaultFeatureFlags[category] as Record<string, boolean>;
  return flags?.[feature] ?? false;
};

export default defaultFeatureFlags;
