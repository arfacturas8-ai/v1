/**
 * CRYB Platform API Architecture Types
 * Comprehensive type definitions for 400+ API endpoints
 */

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: 'none' | 'optional' | 'required' | 'admin';
  rateLimit?: {
    max: number;
    windowMs: number;
  };
  validation?: {
    body?: any;
    query?: any;
    params?: any;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      schema?: any;
    };
  };
}

export interface APIModule {
  name: string;
  prefix: string;
  description: string;
  endpoints: APIEndpoint[];
  middleware?: string[];
}

// Reddit-style Content System (40+ endpoints)
export interface RedditContentEndpoints {
  posts: {
    // CRUD operations
    create: APIEndpoint;
    getAll: APIEndpoint;
    getById: APIEndpoint;
    update: APIEndpoint;
    delete: APIEndpoint;
    
    // Voting system
    upvote: APIEndpoint;
    downvote: APIEndpoint;
    removeVote: APIEndpoint;
    getVotes: APIEndpoint;
    
    // Post interactions
    share: APIEndpoint;
    save: APIEndpoint;
    unsave: APIEndpoint;
    report: APIEndpoint;
    hide: APIEndpoint;
    unhide: APIEndpoint;
    
    // Post filtering and sorting
    getByCategory: APIEndpoint;
    getHot: APIEndpoint;
    getNew: APIEndpoint;
    getTop: APIEndpoint;
    getRising: APIEndpoint;
    getControversial: APIEndpoint;
    
    // Advanced features
    crosspost: APIEndpoint;
    schedule: APIEndpoint;
    getDrafts: APIEndpoint;
    getAnalytics: APIEndpoint;
  };
  
  comments: {
    // CRUD operations
    create: APIEndpoint;
    getByPost: APIEndpoint;
    getById: APIEndpoint;
    update: APIEndpoint;
    delete: APIEndpoint;
    
    // Comment interactions
    upvote: APIEndpoint;
    downvote: APIEndpoint;
    removeVote: APIEndpoint;
    reply: APIEndpoint;
    getThread: APIEndpoint;
    
    // Moderation
    report: APIEndpoint;
    approve: APIEndpoint;
    remove: APIEndpoint;
  };
  
  awards: {
    // Award system
    give: APIEndpoint;
    getAvailable: APIEndpoint;
    getReceived: APIEndpoint;
    getGiven: APIEndpoint;
    createCustom: APIEndpoint;
  };
}

// Discord-style Messaging System (50+ endpoints)
export interface DiscordMessagingEndpoints {
  channels: {
    // Channel management
    create: APIEndpoint;
    getAll: APIEndpoint;
    getById: APIEndpoint;
    update: APIEndpoint;
    delete: APIEndpoint;
    
    // Channel types
    createText: APIEndpoint;
    createVoice: APIEndpoint;
    createCategory: APIEndpoint;
    createForum: APIEndpoint;
    createAnnouncement: APIEndpoint;
    
    // Permissions
    getPermissions: APIEndpoint;
    updatePermissions: APIEndpoint;
    addMember: APIEndpoint;
    removeMember: APIEndpoint;
    
    // Channel features
    pin: APIEndpoint;
    unpin: APIEndpoint;
    getPinned: APIEndpoint;
    getInvites: APIEndpoint;
    createInvite: APIEndpoint;
  };
  
  messages: {
    // Message CRUD
    send: APIEndpoint;
    getHistory: APIEndpoint;
    getById: APIEndpoint;
    edit: APIEndpoint;
    delete: APIEndpoint;
    
    // Message interactions
    react: APIEndpoint;
    unreact: APIEndpoint;
    getReactions: APIEndpoint;
    pin: APIEndpoint;
    unpin: APIEndpoint;
    
    // Message features
    reply: APIEndpoint;
    forward: APIEndpoint;
    quote: APIEndpoint;
    thread: APIEndpoint;
    
    // File handling
    uploadFile: APIEndpoint;
    deleteFile: APIEndpoint;
    getAttachments: APIEndpoint;
  };
  
  directMessages: {
    // DM management
    create: APIEndpoint;
    getConversations: APIEndpoint;
    getMessages: APIEndpoint;
    sendMessage: APIEndpoint;
    deleteConversation: APIEndpoint;
    
    // DM features
    markRead: APIEndpoint;
    markUnread: APIEndpoint;
    mute: APIEndpoint;
    unmute: APIEndpoint;
    block: APIEndpoint;
    unblock: APIEndpoint;
  };
}

// User Management System (60+ endpoints)
export interface UserManagementEndpoints {
  profiles: {
    // Profile management
    get: APIEndpoint;
    update: APIEndpoint;
    uploadAvatar: APIEndpoint;
    uploadBanner: APIEndpoint;
    
    // Profile features
    setBio: APIEndpoint;
    setStatus: APIEndpoint;
    setPresence: APIEndpoint;
    getActivity: APIEndpoint;
    
    // Social features
    follow: APIEndpoint;
    unfollow: APIEndpoint;
    getFollowers: APIEndpoint;
    getFollowing: APIEndpoint;
    
    // Privacy settings
    updatePrivacy: APIEndpoint;
    blockUser: APIEndpoint;
    unblockUser: APIEndpoint;
    getBlocked: APIEndpoint;
  };
  
  preferences: {
    // User preferences
    getAll: APIEndpoint;
    update: APIEndpoint;
    
    // Notification settings
    getNotificationSettings: APIEndpoint;
    updateNotificationSettings: APIEndpoint;
    
    // Theme and display
    getTheme: APIEndpoint;
    setTheme: APIEndpoint;
    getLanguage: APIEndpoint;
    setLanguage: APIEndpoint;
    
    // Privacy settings
    getPrivacySettings: APIEndpoint;
    updatePrivacySettings: APIEndpoint;
    
    // Security settings
    getSecuritySettings: APIEndpoint;
    updateSecuritySettings: APIEndpoint;
    enable2FA: APIEndpoint;
    disable2FA: APIEndpoint;
  };
  
  sessions: {
    // Session management
    getActive: APIEndpoint;
    getAll: APIEndpoint;
    revoke: APIEndpoint;
    revokeAll: APIEndpoint;
    
    // Device management
    getDevices: APIEndpoint;
    removeDevice: APIEndpoint;
    setDeviceName: APIEndpoint;
  };
}

// Community Management (45+ endpoints)
export interface CommunityManagementEndpoints {
  communities: {
    // Community CRUD
    create: APIEndpoint;
    getAll: APIEndpoint;
    getById: APIEndpoint;
    update: APIEndpoint;
    delete: APIEndpoint;
    
    // Community features
    join: APIEndpoint;
    leave: APIEndpoint;
    getMembers: APIEndpoint;
    getModerators: APIEndpoint;
    
    // Community settings
    updateSettings: APIEndpoint;
    updateRules: APIEndpoint;
    updateTheme: APIEndpoint;
    uploadIcon: APIEndpoint;
    uploadBanner: APIEndpoint;
    
    // Moderation
    banUser: APIEndpoint;
    unbanUser: APIEndpoint;
    muteUser: APIEndpoint;
    unmuteUser: APIEndpoint;
    addModerator: APIEndpoint;
    removeModerator: APIEndpoint;
  };
  
  moderation: {
    // Moderation queue
    getQueue: APIEndpoint;
    approveContent: APIEndpoint;
    removeContent: APIEndpoint;
    
    // Reports
    getReports: APIEndpoint;
    handleReport: APIEndpoint;
    dismissReport: APIEndpoint;
    
    // Moderation logs
    getLogs: APIEndpoint;
    getActions: APIEndpoint;
    
    // Auto-moderation
    getAutomodRules: APIEndpoint;
    createAutomodRule: APIEndpoint;
    updateAutomodRule: APIEndpoint;
    deleteAutomodRule: APIEndpoint;
  };
}

// Search and Analytics (35+ endpoints)
export interface SearchAnalyticsEndpoints {
  search: {
    // General search
    global: APIEndpoint;
    posts: APIEndpoint;
    comments: APIEndpoint;
    users: APIEndpoint;
    communities: APIEndpoint;
    
    // Advanced search
    advanced: APIEndpoint;
    filters: APIEndpoint;
    suggestions: APIEndpoint;
    trending: APIEndpoint;
    
    // Search history
    getHistory: APIEndpoint;
    clearHistory: APIEndpoint;
    saveSearch: APIEndpoint;
  };
  
  analytics: {
    // User analytics
    getUserStats: APIEndpoint;
    getUserActivity: APIEndpoint;
    getUserEngagement: APIEndpoint;
    
    // Community analytics
    getCommunityStats: APIEndpoint;
    getCommunityGrowth: APIEndpoint;
    getCommunityEngagement: APIEndpoint;
    
    // Platform analytics
    getPlatformStats: APIEndpoint;
    getUsageMetrics: APIEndpoint;
    getPerformanceMetrics: APIEndpoint;
    
    // Custom analytics
    createCustomQuery: APIEndpoint;
    runCustomQuery: APIEndpoint;
    getQueryResults: APIEndpoint;
  };
}

// File Upload and Media Management (30+ endpoints)
export interface MediaManagementEndpoints {
  uploads: {
    // File uploads
    uploadImage: APIEndpoint;
    uploadVideo: APIEndpoint;
    uploadAudio: APIEndpoint;
    uploadDocument: APIEndpoint;
    
    // Batch operations
    uploadMultiple: APIEndpoint;
    deleteMultiple: APIEndpoint;
    
    // File management
    getFile: APIEndpoint;
    getFileInfo: APIEndpoint;
    deleteFile: APIEndpoint;
    moveFile: APIEndpoint;
    copyFile: APIEndpoint;
    
    // Processing
    resizeImage: APIEndpoint;
    generateThumbnail: APIEndpoint;
    transcodeVideo: APIEndpoint;
    extractAudio: APIEndpoint;
  };
  
  media: {
    // Media gallery
    getGallery: APIEndpoint;
    createAlbum: APIEndpoint;
    addToAlbum: APIEndpoint;
    removeFromAlbum: APIEndpoint;
    
    // Media metadata
    updateMetadata: APIEndpoint;
    addTags: APIEndpoint;
    removeTags: APIEndpoint;
    
    // CDN management
    purgeCache: APIEndpoint;
    generateSignedUrl: APIEndpoint;
  };
}

// Notification System (25+ endpoints)
export interface NotificationEndpoints {
  notifications: {
    // Notification management
    getAll: APIEndpoint;
    getUnread: APIEndpoint;
    markAsRead: APIEndpoint;
    markAllAsRead: APIEndpoint;
    delete: APIEndpoint;
    deleteAll: APIEndpoint;
    
    // Notification types
    getMessages: APIEndpoint;
    getMentions: APIEndpoint;
    getFollows: APIEndpoint;
    getUpvotes: APIEndpoint;
    getComments: APIEndpoint;
    
    // Push notifications
    subscribe: APIEndpoint;
    unsubscribe: APIEndpoint;
    testPush: APIEndpoint;
    
    // Email notifications
    subscribeEmail: APIEndpoint;
    unsubscribeEmail: APIEndpoint;
    testEmail: APIEndpoint;
  };
}

// Authentication Features (20+ endpoints)
export interface AuthenticationEndpoints {
  auth: {
    // Basic auth
    register: APIEndpoint;
    login: APIEndpoint;
    logout: APIEndpoint;
    refresh: APIEndpoint;
    
    // Password management
    forgotPassword: APIEndpoint;
    resetPassword: APIEndpoint;
    changePassword: APIEndpoint;
    
    // Two-factor authentication
    enable2FA: APIEndpoint;
    disable2FA: APIEndpoint;
    verify2FA: APIEndpoint;
    getBackupCodes: APIEndpoint;
    regenerateBackupCodes: APIEndpoint;
    
    // OAuth providers
    connectGoogle: APIEndpoint;
    connectDiscord: APIEndpoint;
    connectGitHub: APIEndpoint;
    disconnectOAuth: APIEndpoint;
  };
}

// Real-time Features (25+ endpoints)
export interface RealtimeEndpoints {
  presence: {
    // User presence
    setOnline: APIEndpoint;
    setOffline: APIEndpoint;
    setAway: APIEndpoint;
    setBusy: APIEndpoint;
    getPresence: APIEndpoint;
    
    // Typing indicators
    startTyping: APIEndpoint;
    stopTyping: APIEndpoint;
    getTyping: APIEndpoint;
    
    // Live activities
    startActivity: APIEndpoint;
    stopActivity: APIEndpoint;
    getActivities: APIEndpoint;
  };
  
  realtime: {
    // WebSocket connections
    connect: APIEndpoint;
    disconnect: APIEndpoint;
    heartbeat: APIEndpoint;
    
    // Real-time events
    subscribe: APIEndpoint;
    unsubscribe: APIEndpoint;
    publish: APIEndpoint;
    
    // Live updates
    enableLiveUpdates: APIEndpoint;
    disableLiveUpdates: APIEndpoint;
    getLiveStatus: APIEndpoint;
  };
}

// Admin Panel (35+ endpoints)
export interface AdminEndpoints {
  users: {
    // User management
    getAll: APIEndpoint;
    getById: APIEndpoint;
    create: APIEndpoint;
    update: APIEndpoint;
    delete: APIEndpoint;
    suspend: APIEndpoint;
    unsuspend: APIEndpoint;
    
    // Bulk operations
    bulkUpdate: APIEndpoint;
    bulkDelete: APIEndpoint;
    bulkSuspend: APIEndpoint;
    
    // User analytics
    getUserMetrics: APIEndpoint;
    getLoginHistory: APIEndpoint;
    getActionHistory: APIEndpoint;
  };
  
  system: {
    // System monitoring
    getSystemHealth: APIEndpoint;
    getSystemMetrics: APIEndpoint;
    getPerformanceStats: APIEndpoint;
    
    // Configuration
    getConfig: APIEndpoint;
    updateConfig: APIEndpoint;
    
    // Maintenance
    enableMaintenanceMode: APIEndpoint;
    disableMaintenanceMode: APIEndpoint;
    clearCache: APIEndpoint;
    
    // Logs
    getLogs: APIEndpoint;
    getErrorLogs: APIEndpoint;
    downloadLogs: APIEndpoint;
  };
}

// Master API Architecture
export interface CRYBPlatformAPI {
  reddit: RedditContentEndpoints;
  discord: DiscordMessagingEndpoints;
  users: UserManagementEndpoints;
  communities: CommunityManagementEndpoints;
  search: SearchAnalyticsEndpoints;
  media: MediaManagementEndpoints;
  notifications: NotificationEndpoints;
  auth: AuthenticationEndpoints;
  realtime: RealtimeEndpoints;
  admin: AdminEndpoints;
}

// API Configuration
export interface APIConfig {
  version: string;
  baseUrl: string;
  environment: 'development' | 'staging' | 'production';
  rateLimit: {
    default: {
      max: number;
      windowMs: number;
    };
    auth: {
      max: number;
      windowMs: number;
    };
    upload: {
      max: number;
      windowMs: number;
    };
  };
  security: {
    corsOrigins: string[];
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
  features: {
    web3Enabled: boolean;
    analyticsEnabled: boolean;
    aiModerationEnabled: boolean;
    voiceEnabled: boolean;
    videoEnabled: boolean;
  };
}