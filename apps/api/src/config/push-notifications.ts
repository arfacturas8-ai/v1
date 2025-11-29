/**
 * Push Notification Configuration
 * Supports FCM (Firebase Cloud Messaging) and APNS (Apple Push Notification Service)
 */

export const pushNotificationConfig = {
  // Firebase Cloud Messaging (Android)
  fcm: {
    enabled: process.env.FCM_ENABLED === 'true',
    projectId: process.env.FCM_PROJECT_ID || 'cryb-platform',
    privateKey: process.env.FCM_PRIVATE_KEY || '',
    clientEmail: process.env.FCM_CLIENT_EMAIL || '',
    // For development/testing, use mock credentials
    useMock: process.env.NODE_ENV === 'development' || !process.env.FCM_PRIVATE_KEY
  },
  
  // Apple Push Notification Service (iOS)
  apns: {
    enabled: process.env.APNS_ENABLED === 'true',
    keyId: process.env.APNS_KEY_ID || '',
    teamId: process.env.APNS_TEAM_ID || '',
    bundleId: process.env.APNS_BUNDLE_ID || 'ai.cryb.app',
    production: process.env.NODE_ENV === 'production',
    // For development/testing, use mock
    useMock: process.env.NODE_ENV === 'development' || !process.env.APNS_KEY_ID
  },

  // Expo Push Notifications (Cross-platform fallback)
  expo: {
    enabled: true,
    accessToken: process.env.EXPO_ACCESS_TOKEN || '',
    useFcmV1: true // Use FCM v1 for better reliability
  },

  // Notification settings
  settings: {
    // Batch notifications to reduce server load
    batchSize: parseInt(process.env.PUSH_BATCH_SIZE || '100'),
    batchDelay: parseInt(process.env.PUSH_BATCH_DELAY || '100'), // ms
    
    // Retry failed notifications
    maxRetries: parseInt(process.env.PUSH_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.PUSH_RETRY_DELAY || '1000'), // ms
    
    // TTL for notifications
    ttl: parseInt(process.env.PUSH_TTL || '86400'), // 24 hours in seconds
    
    // Priority levels
    defaultPriority: 'high' as const,
    
    // Sound and badge
    defaultSound: 'default',
    incrementBadge: true
  },

  // Notification templates
  templates: {
    newMessage: {
      title: 'New Message',
      body: '{{sender}} sent you a message',
      data: { type: 'message', targetId: '{{messageId}}' }
    },
    newFollower: {
      title: 'New Follower',
      body: '{{username}} started following you',
      data: { type: 'follower', targetId: '{{userId}}' }
    },
    postReply: {
      title: 'New Reply',
      body: '{{username}} replied to your post',
      data: { type: 'reply', targetId: '{{postId}}' }
    },
    communityInvite: {
      title: 'Community Invite',
      body: 'You\'ve been invited to join {{communityName}}',
      data: { type: 'invite', targetId: '{{communityId}}' }
    },
    voiceCall: {
      title: 'Incoming Voice Call',
      body: '{{caller}} is calling you',
      data: { type: 'call', targetId: '{{channelId}}' },
      priority: 'critical' as const
    }
  }
};

// Helper to get active push service
export function getActivePushService() {
  if (pushNotificationConfig.fcm.enabled && !pushNotificationConfig.fcm.useMock) {
    return 'fcm';
  }
  if (pushNotificationConfig.apns.enabled && !pushNotificationConfig.apns.useMock) {
    return 'apns';
  }
  if (pushNotificationConfig.expo.enabled) {
    return 'expo';
  }
  return 'mock'; // Fallback to mock for development
}

export default pushNotificationConfig;