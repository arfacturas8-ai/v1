/**
 * PUSH NOTIFICATION SERVICE
 * Handles Firebase Cloud Messaging and Apple Push Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrashDetector } from '../utils/CrashDetector';
import apiService from './RealApiService';
import { deepLinkingService } from './DeepLinkingService';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { data } = notification.request.content;
    const priority = data?.priority || 'default';
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: priority === 'high' 
        ? Notifications.AndroidNotificationPriority.HIGH 
        : priority === 'low'
        ? Notifications.AndroidNotificationPriority.LOW
        : Notifications.AndroidNotificationPriority.DEFAULT,
    };
  },
});

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

export interface NotificationData {
  type: 'message' | 'server_invite' | 'friend_request' | 'announcement' | 'like' | 'comment' | 'follow' | 'mention' | 'award' | 'system' | 'post_reply' | 'direct_message';
  serverId?: string;
  channelId?: string;
  messageId?: string;
  userId?: string;
  postId?: string;
  commentId?: string;
  communityId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'default' | 'low';
  category?: string;
  sound?: string;
  badge?: number;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private token: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Request permissions
      const granted = await this.requestPermissions();
      if (!granted) {
        console.warn('[PushNotificationService] Notification permissions not granted');
        return;
      }

      // Get push token
      await this.registerForPushNotifications();

      // Set up notification categories
      await this.setupNotificationCategories();

      // Set up listeners
      this.setupNotificationListeners();

      console.log('[PushNotificationService] Initialized successfully');
    } catch (error) {
      console.error('[PushNotificationService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializePushNotifications' },
        'medium'
      );
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('[PushNotificationService] Push notifications do not work on simulator');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[PushNotificationService] Failed to get push token for push notification');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[PushNotificationService] Permission request error:', error);
      return false;
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      if (!Device.isDevice) {
        return;
      }

      // Get the token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.token = tokenData.data;

      // Store token locally
      await AsyncStorage.setItem('@cryb_push_token', this.token);

      // Send token to backend
      await this.sendTokenToBackend();

      console.log('[PushNotificationService] Push token registered:', this.token);
    } catch (error) {
      console.error('[PushNotificationService] Token registration error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'registerPushToken' },
        'medium'
      );
    }
  }

  private async sendTokenToBackend(): Promise<void> {
    try {
      if (!this.token || !apiService.isAuthenticated()) {
        return;
      }

      const deviceId = await this.getDeviceId();
      
      const tokenData: PushNotificationToken = {
        token: this.token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId,
      };

      const response = await apiService.registerPushToken(this.token, Platform.OS as 'ios' | 'android');
      
      if (!response.success) {
        console.error('[PushNotificationService] Failed to register token with backend:', response.error);
      }
      
      console.log('[PushNotificationService] Token sent to backend');
    } catch (error) {
      console.error('[PushNotificationService] Send token to backend error:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('@cryb_device_id');
      
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('@cryb_device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('[PushNotificationService] Get device ID error:', error);
      return `${Platform.OS}_${Date.now()}`;
    }
  }

  private async setupNotificationCategories(): Promise<void> {
    try {
      // Message category with reply action
      await Notifications.setNotificationCategoryAsync('message', [
        {
          identifier: 'reply',
          buttonTitle: 'Reply',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
          textInput: {
            submitButtonTitle: 'Send',
            placeholder: 'Type a reply...',
          },
        },
        {
          identifier: 'mark_read',
          buttonTitle: 'Mark as Read',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      // Social interactions category
      await Notifications.setNotificationCategoryAsync('social', [
        {
          identifier: 'like',
          buttonTitle: 'Like',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'view',
          buttonTitle: 'View',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);

      // Friend request category
      await Notifications.setNotificationCategoryAsync('friend_request', [
        {
          identifier: 'accept',
          buttonTitle: 'Accept',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'decline',
          buttonTitle: 'Decline',
          options: {
            isDestructive: true,
            isAuthenticationRequired: false,
          },
        },
      ]);

      // Server invite category
      await Notifications.setNotificationCategoryAsync('server_invite', [
        {
          identifier: 'join',
          buttonTitle: 'Join',
          options: {
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'ignore',
          buttonTitle: 'Ignore',
          options: {
            isDestructive: true,
            isAuthenticationRequired: false,
          },
        },
      ]);

      console.log('[PushNotificationService] Notification categories set up');
    } catch (error) {
      console.error('[PushNotificationService] Setup notification categories error:', error);
    }
  }

  private setupNotificationListeners(): void {
    try {
      // Listener for notifications received while app is foregrounded
      this.notificationListener = Notifications.addNotificationReceivedListener(
        (notification) => {
          this.handleNotificationReceived(notification);
        }
      );

      // Listener for when a notification is tapped / activated
      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          this.handleNotificationResponse(response);
        }
      );

      console.log('[PushNotificationService] Notification listeners set up');
    } catch (error) {
      console.error('[PushNotificationService] Setup listeners error:', error);
    }
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    try {
      console.log('[PushNotificationService] Notification received:', notification);
      
      const { title, body, data } = notification.request.content;
      
      // Handle different notification types
      if (data?.type) {
        this.processNotificationData(data as NotificationData);
      }
    } catch (error) {
      console.error('[PushNotificationService] Handle notification received error:', error);
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      console.log('[PushNotificationService] Notification response:', response);
      
      const { data } = response.notification.request.content;
      const { actionIdentifier } = response;
      
      if (data?.type) {
        this.processNotificationAction(actionIdentifier, data as NotificationData);
      }
    } catch (error) {
      console.error('[PushNotificationService] Handle notification response error:', error);
    }
  }

  private async processNotificationAction(actionIdentifier: string, data: NotificationData): Promise<void> {
    try {
      switch (actionIdentifier) {
        case 'reply':
          if (data.messageId || data.postId) {
            // Handle reply functionality
            console.log('[PushNotificationService] Processing reply action for:', data);
          }
          break;
        
        case 'mark_read':
          if (data.messageId) {
            console.log('[PushNotificationService] Mark message as read:', data.messageId);
            // Note: markMessageAsRead not implemented in API service yet
          }
          break;
        
        case 'like':
          if (data.postId) {
            await apiService.votePost(data.postId, 'up');
          } else if (data.commentId) {
            await apiService.voteComment(data.commentId, 'up');
          }
          break;
        
        case 'accept':
          if (data.type === 'friend_request' && data.userId) {
            await apiService.followUser(data.userId);
          }
          break;
        
        case 'decline':
          if (data.type === 'friend_request' && data.userId) {
            console.log('[PushNotificationService] Decline friend request:', data.userId);
            // Note: declineFriendRequest not implemented in API service yet
          }
          break;
        
        case 'join':
          if (data.type === 'server_invite' && data.serverId) {
            await apiService.joinCommunity(data.serverId);
          }
          break;
        
        case 'ignore':
          if (data.type === 'server_invite' && data.serverId) {
            console.log('[PushNotificationService] Ignore server invite:', data.serverId);
            // Note: ignoreServerInvite not implemented in API service yet
          }
          break;
        
        case 'view':
        default:
          // Navigate to the relevant screen
          this.navigateFromNotification(data);
          break;
      }
    } catch (error) {
      console.error('[PushNotificationService] Process notification action error:', error);
    }
  }

  private processNotificationData(data: NotificationData): void {
    try {
      // Update badge count if specified
      if (data.badge !== undefined) {
        this.setBadgeCount(data.badge);
      }

      // Handle different notification types
      switch (data.type) {
        case 'message':
        case 'direct_message':
          this.handleMessageNotification(data);
          break;
        case 'server_invite':
          this.handleServerInviteNotification(data);
          break;
        case 'friend_request':
          this.handleFriendRequestNotification(data);
          break;
        case 'announcement':
        case 'system':
          this.handleAnnouncementNotification(data);
          break;
        case 'like':
        case 'comment':
        case 'post_reply':
          this.handleSocialNotification(data);
          break;
        case 'follow':
          this.handleFollowNotification(data);
          break;
        case 'mention':
          this.handleMentionNotification(data);
          break;
        case 'award':
          this.handleAwardNotification(data);
          break;
        default:
          console.log('[PushNotificationService] Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('[PushNotificationService] Process notification data error:', error);
    }
  }

  private navigateFromNotification(data: NotificationData): void {
    try {
      // Use deep linking service for navigation
      let deepLink: string | null = null;
      
      switch (data.type) {
        case 'message':
        case 'direct_message':
          if (data.channelId && data.messageId) {
            deepLink = deepLinkingService.generateMessageLink(data.channelId, data.messageId);
          } else if (data.channelId && data.serverId) {
            deepLink = deepLinkingService.generateChannelLink(data.serverId, data.channelId);
          } else if (data.userId) {
            // Direct message - navigate to user conversation
            deepLink = `cryb://user/${data.userId}?action=message`;
          }
          break;
          
        case 'server_invite':
          if (data.serverId) {
            deepLink = `cryb://server/${data.serverId}?action=join`;
          }
          break;
          
        case 'friend_request':
          deepLink = `cryb://settings/friends?highlight=${data.userId}`;
          break;
          
        case 'announcement':
        case 'system':
          deepLink = `cryb://notifications?type=announcements`;
          break;
          
        case 'like':
        case 'comment':
        case 'post_reply':
          if (data.postId) {
            deepLink = deepLinkingService.generatePostLink(data.postId, data.communityId);
            if (data.commentId) {
              deepLink += `?commentId=${data.commentId}`;
            }
          }
          break;
          
        case 'follow':
          if (data.userId) {
            deepLink = deepLinkingService.generateUserLink(data.userId);
          }
          break;
          
        case 'mention':
          if (data.postId) {
            deepLink = deepLinkingService.generatePostLink(data.postId, data.communityId);
            if (data.commentId) {
              deepLink += `?commentId=${data.commentId}&highlight=mention`;
            }
          } else if (data.commentId) {
            deepLink = `cryb://comment/${data.commentId}?highlight=mention`;
          }
          break;
          
        case 'award':
          if (data.postId) {
            deepLink = deepLinkingService.generatePostLink(data.postId, data.communityId);
            deepLink += '?highlight=award';
          }
          break;
      }
      
      if (deepLink) {
        console.log('[PushNotificationService] Navigating via deep link:', deepLink);
        deepLinkingService.handleDeepLink(deepLink);
      } else {
        console.warn('[PushNotificationService] Could not generate deep link for notification:', data);
      }
    } catch (error) {
      console.error('[PushNotificationService] Navigate from notification error:', error);
    }
  }

  private handleMessageNotification(data: NotificationData): void {
    // Increment unread count, update chat list, etc.
    console.log('[PushNotificationService] Handling message notification:', data);
  }

  private handleServerInviteNotification(data: NotificationData): void {
    // Show server invite UI, etc.
    console.log('[PushNotificationService] Handling server invite notification:', data);
  }

  private handleFriendRequestNotification(data: NotificationData): void {
    // Update friends list, show notification badge, etc.
    console.log('[PushNotificationService] Handling friend request notification:', data);
  }

  private handleAnnouncementNotification(data: NotificationData): void {
    // Show announcement banner, update feed, etc.
    console.log('[PushNotificationService] Handling announcement notification:', data);
  }

  private handleSocialNotification(data: NotificationData): void {
    // Handle likes, comments, replies
    console.log('[PushNotificationService] Handling social notification:', data);
    
    // Could trigger local cache updates, play sounds, etc.
    if (data.type === 'like') {
      // Update local post like count
    } else if (data.type === 'comment' || data.type === 'post_reply') {
      // Update local comment count
    }
  }

  private handleFollowNotification(data: NotificationData): void {
    // Handle new followers
    console.log('[PushNotificationService] Handling follow notification:', data);
    
    // Could update follower count in local storage
  }

  private handleMentionNotification(data: NotificationData): void {
    // Handle user mentions
    console.log('[PushNotificationService] Handling mention notification:', data);
    
    // High priority notification since user was specifically mentioned
  }

  private handleAwardNotification(data: NotificationData): void {
    // Handle awards received
    console.log('[PushNotificationService] Handling award notification:', data);
    
    // Special handling for awards - maybe show special animation
  }

  // Public methods

  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('[PushNotificationService] Send local notification error:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('[PushNotificationService] All notifications cleared');
    } catch (error) {
      console.error('[PushNotificationService] Clear notifications error:', error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[PushNotificationService] Set badge count error:', error);
    }
  }

  async getPushToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }

    try {
      const storedToken = await AsyncStorage.getItem('@cryb_push_token');
      if (storedToken) {
        this.token = storedToken;
        return storedToken;
      }
    } catch (error) {
      console.error('[PushNotificationService] Get push token error:', error);
    }

    return null;
  }

  async refreshToken(): Promise<void> {
    try {
      await this.registerForPushNotifications();
    } catch (error) {
      console.error('[PushNotificationService] Refresh token error:', error);
    }
  }

  async updateNotificationSettings(settings: {
    likes?: boolean;
    comments?: boolean;
    follows?: boolean;
    mentions?: boolean;
    directMessages?: boolean;
    systemUpdates?: boolean;
  }): Promise<void> {
    try {
      // Store settings locally
      await AsyncStorage.setItem('@cryb_notification_settings', JSON.stringify(settings));
      
      // Send to backend if authenticated
      if (apiService.isAuthenticated()) {
        console.log('[PushNotificationService] Notification settings to send to backend:', settings);
        // Note: updateNotificationSettings not implemented in API service yet
      }
      
      console.log('[PushNotificationService] Notification settings updated:', settings);
    } catch (error) {
      console.error('[PushNotificationService] Update notification settings error:', error);
    }
  }

  async getNotificationSettings(): Promise<any> {
    try {
      const storedSettings = await AsyncStorage.getItem('@cryb_notification_settings');
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
      
      // Default settings
      return {
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        directMessages: true,
        systemUpdates: false,
      };
    } catch (error) {
      console.error('[PushNotificationService] Get notification settings error:', error);
      return null;
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          categoryIdentifier: data?.category,
          sound: data?.sound || 'default',
        },
        trigger,
      });
    } catch (error) {
      console.error('[PushNotificationService] Schedule notification error:', error);
      throw error;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('[PushNotificationService] Cancel notification error:', error);
    }
  }

  async getDeliveredNotifications(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('[PushNotificationService] Get delivered notifications error:', error);
      return [];
    }
  }

  async dismissNotification(identifier: string): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(identifier);
    } catch (error) {
      console.error('[PushNotificationService] Dismiss notification error:', error);
    }
  }

  async testNotification(): Promise<void> {
    try {
      await this.sendLocalNotification(
        'Test Notification',
        'This is a test push notification from CRYB',
        { type: 'test' }
      );
    } catch (error) {
      console.error('[PushNotificationService] Test notification error:', error);
    }
  }

  async unregisterDevice(): Promise<void> {
    try {
      if (this.token && apiService.isAuthenticated()) {
        console.log('[PushNotificationService] Unregistering push token:', this.token);
        // Note: unregisterPushToken not implemented in API service yet
      }
      
      // Clear local token
      await AsyncStorage.removeItem('@cryb_push_token');
      this.token = null;
      
      console.log('[PushNotificationService] Device unregistered successfully');
    } catch (error) {
      console.error('[PushNotificationService] Unregister device error:', error);
    }
  }

  cleanup(): void {
    try {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }

      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }

      console.log('[PushNotificationService] Cleaned up successfully');
    } catch (error) {
      console.error('[PushNotificationService] Cleanup error:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();