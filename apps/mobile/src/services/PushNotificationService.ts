/**
 * PUSH NOTIFICATION SERVICE
 * Handles Firebase Cloud Messaging and Apple Push Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrashDetector } from '../utils/CrashDetector';
import { ApiService } from './ApiService';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

export interface NotificationData {
  type: 'message' | 'server_invite' | 'friend_request' | 'announcement';
  serverId?: string;
  channelId?: string;
  messageId?: string;
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
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
      if (!this.token || !ApiService.isAuthenticated()) {
        return;
      }

      const deviceId = await this.getDeviceId();
      
      const tokenData: PushNotificationToken = {
        token: this.token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId,
      };

      const response = await ApiService.registerPushToken(tokenData);
      
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
      
      if (data?.type) {
        this.navigateFromNotification(data as NotificationData);
      }
    } catch (error) {
      console.error('[PushNotificationService] Handle notification response error:', error);
    }
  }

  private processNotificationData(data: NotificationData): void {
    try {
      // Update badge count, play sounds, etc.
      switch (data.type) {
        case 'message':
          this.handleMessageNotification(data);
          break;
        case 'server_invite':
          this.handleServerInviteNotification(data);
          break;
        case 'friend_request':
          this.handleFriendRequestNotification(data);
          break;
        case 'announcement':
          this.handleAnnouncementNotification(data);
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
      // Navigation logic would depend on your navigation structure
      // This is a placeholder implementation
      
      switch (data.type) {
        case 'message':
          if (data.channelId && data.serverId) {
            // Navigate to channel
            console.log('[PushNotificationService] Navigate to channel:', data.channelId);
          }
          break;
        case 'server_invite':
          if (data.serverId) {
            // Navigate to server
            console.log('[PushNotificationService] Navigate to server:', data.serverId);
          }
          break;
        case 'friend_request':
          // Navigate to friends screen
          console.log('[PushNotificationService] Navigate to friends');
          break;
        case 'announcement':
          // Navigate to announcements
          console.log('[PushNotificationService] Navigate to announcements');
          break;
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

export const PushNotificationService = PushNotificationService.getInstance();