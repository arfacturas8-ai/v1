/**
 * CRASH-SAFE NOTIFICATION SERVICE
 * Handles push notifications with comprehensive error handling and permission management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { CrashDetector } from '../utils/CrashDetector';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
  timestamp: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
  categoryId?: string;
  channelId?: string;
  priority?: 'low' | 'normal' | 'high' | 'max';
}

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private isInitialized = false;
  private permissionStatus: NotificationPermissionStatus | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Configure notification behavior
      await this.configureNotifications();

      // Check device compatibility
      const isSupported = await this.checkDeviceSupport();
      if (!isSupported) {
        console.warn('[Notifications] Device does not support push notifications');
        return false;
      }

      // Check and request permissions
      await this.checkPermissions();

      // Register for push notifications if permissions granted
      if (this.permissionStatus?.granted) {
        await this.registerForPushNotifications();
      }

      // Set up notification handlers
      this.setupNotificationHandlers();

      this.isInitialized = true;
      console.log('[Notifications] Service initialized successfully');
      return true;

    } catch (error) {
      console.error('[Notifications] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeNotifications' },
        'high'
      );

      return false;
    }
  }

  private async configureNotifications(): Promise<void> {
    try {
      // Configure how notifications are handled when app is in foreground
      await Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          try {
            const request = notification.request;
            const data = request.content.data;

            // Handle different notification types
            if (data?.type === 'message') {
              return {
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              };
            }

            if (data?.type === 'system') {
              return {
                shouldShowAlert: false,
                shouldPlaySound: false,
                shouldSetBadge: false,
              };
            }

            // Default behavior
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            };
          } catch (error) {
            console.error('[Notifications] Handler error:', error);
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            };
          }
        },
      });

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

    } catch (error) {
      console.error('[Notifications] Configure error:', error);
      throw error;
    }
  }

  private async createNotificationChannels(): Promise<void> {
    try {
      const channels = [
        {
          id: 'messages',
          name: 'Messages',
          description: 'Chat messages and mentions',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4a9eff',
        },
        {
          id: 'voice',
          name: 'Voice Calls',
          description: 'Incoming voice and video calls',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'call_ringtone',
          vibrationPattern: [0, 1000, 500, 1000],
          lightColor: '#00ff00',
        },
        {
          id: 'general',
          name: 'General',
          description: 'General notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          vibrationPattern: [0, 250],
          lightColor: '#ffffff',
        },
        {
          id: 'system',
          name: 'System',
          description: 'System notifications and updates',
          importance: Notifications.AndroidImportance.LOW,
          sound: false,
        },
      ];

      for (const channel of channels) {
        await Notifications.setNotificationChannelAsync(channel.id, channel);
      }

    } catch (error) {
      console.error('[Notifications] Channel creation error:', error);
      throw error;
    }
  }

  private async checkDeviceSupport(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('[Notifications] Must use physical device for push notifications');
        return false;
      }

      if (Platform.OS === 'android') {
        // Check Android version
        const androidVersion = Platform.Version;
        if (typeof androidVersion === 'number' && androidVersion < 21) {
          console.warn('[Notifications] Android version too old for push notifications');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Device support check error:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<NotificationPermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      this.permissionStatus = {
        granted: existingStatus === 'granted',
        canAskAgain: existingStatus !== 'denied',
        status: existingStatus as 'granted' | 'denied' | 'undetermined',
      };

      // Store permission status
      await AsyncStorage.setItem(
        '@cryb_notification_permissions',
        JSON.stringify(this.permissionStatus)
      );

      return this.permissionStatus;
    } catch (error) {
      console.error('[Notifications] Permission check error:', error);
      
      await CrashDetector.reportPermissionError('notifications', String(error));
      
      // Return safe default
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      // Check current permissions first
      await this.checkPermissions();

      if (this.permissionStatus?.granted) {
        return this.permissionStatus;
      }

      if (!this.permissionStatus?.canAskAgain) {
        console.warn('[Notifications] Cannot request permissions - user denied');
        return this.permissionStatus;
      }

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });

      this.permissionStatus = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status as 'granted' | 'denied' | 'undetermined',
      };

      // Store updated permission status
      await AsyncStorage.setItem(
        '@cryb_notification_permissions',
        JSON.stringify(this.permissionStatus)
      );

      if (this.permissionStatus.granted) {
        // Register for push notifications
        await this.registerForPushNotifications();
      }

      return this.permissionStatus;

    } catch (error) {
      console.error('[Notifications] Permission request error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestNotificationPermissions' },
        'medium'
      );

      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      // Get the token that identifies this installation
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.pushToken = token.data;

      // Create token data
      const tokenData: PushToken = {
        token: token.data,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Constants.installationId || 'unknown',
        timestamp: Date.now(),
      };

      // Store token locally
      await AsyncStorage.setItem('@cryb_push_token', JSON.stringify(tokenData));

      // Send token to server
      await this.sendTokenToServer(tokenData);

      console.log('[Notifications] Push token registered:', token.data);

    } catch (error) {
      console.error('[Notifications] Registration error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'registerPushToken' },
        'high'
      );
    }
  }

  private async sendTokenToServer(tokenData: PushToken): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('@auth_token');
      if (!authToken) {
        console.warn('[Notifications] No auth token available');
        return;
      }

      const response = await fetch('http://localhost:3001/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(tokenData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[Notifications] Token sent to server successfully');

    } catch (error) {
      console.error('[Notifications] Server token error:', error);
      
      await CrashDetector.reportNetworkError(error, 'REGISTER_PUSH_TOKEN');
      
      // Don't throw - we can retry later
    }
  }

  private setupNotificationHandlers(): void {
    try {
      // Handle notification received while app is in foreground
      Notifications.addNotificationReceivedListener((notification) => {
        try {
          console.log('[Notifications] Notification received:', notification);
          
          // Handle foreground notification
          this.handleForegroundNotification(notification);
        } catch (error) {
          console.error('[Notifications] Received handler error:', error);
        }
      });

      // Handle notification response (user tapped notification)
      Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          console.log('[Notifications] Notification response:', response);
          
          // Handle notification tap
          this.handleNotificationResponse(response);
        } catch (error) {
          console.error('[Notifications] Response handler error:', error);
        }
      });

    } catch (error) {
      console.error('[Notifications] Handler setup error:', error);
    }
  }

  private handleForegroundNotification(notification: Notifications.Notification): void {
    try {
      const { request } = notification;
      const { content, identifier } = request;
      const { data } = content;

      // Update badge count
      if (data?.badge && typeof data.badge === 'number') {
        this.setBadgeCount(data.badge);
      }

      // Handle different notification types
      switch (data?.type) {
        case 'message':
          // Handle chat message
          this.handleMessageNotification(data);
          break;
        
        case 'voice_call':
          // Handle voice call
          this.handleVoiceCallNotification(data);
          break;
        
        case 'friend_request':
          // Handle friend request
          this.handleFriendRequestNotification(data);
          break;
        
        default:
          console.log('[Notifications] Unknown notification type:', data?.type);
      }

    } catch (error) {
      console.error('[Notifications] Foreground handler error:', error);
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      const { notification, actionIdentifier } = response;
      const { request } = notification;
      const { content } = request;
      const { data } = content;

      console.log('[Notifications] User action:', actionIdentifier);
      console.log('[Notifications] Notification data:', data);

      // Navigate based on notification type
      this.navigateFromNotification(data);

    } catch (error) {
      console.error('[Notifications] Response handler error:', error);
    }
  }

  private handleMessageNotification(data: any): void {
    // Emit event for message notification
    // This would be handled by the chat store
  }

  private handleVoiceCallNotification(data: any): void {
    // Handle voice call notification
    // Show call UI or join call
  }

  private handleFriendRequestNotification(data: any): void {
    // Handle friend request
    // Update friends list
  }

  private navigateFromNotification(data: any): void {
    try {
      // This would integrate with navigation
      // For now, just log the action
      console.log('[Notifications] Should navigate to:', data?.screen, data?.params);
      
    } catch (error) {
      console.error('[Notifications] Navigation error:', error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[Notifications] Badge count error:', error);
    }
  }

  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('[Notifications] Clear badge error:', error);
    }
  }

  async scheduleLocalNotification(payload: NotificationPayload): Promise<string | null> {
    try {
      if (!this.permissionStatus?.granted) {
        console.warn('[Notifications] No permission for local notification');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: payload.sound || 'default',
          badge: payload.badge,
        },
        trigger: null, // Show immediately
      });

      return notificationId;

    } catch (error) {
      console.error('[Notifications] Schedule local error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'scheduleLocalNotification' },
        'medium'
      );

      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('[Notifications] Cancel notification error:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await this.clearBadge();
    } catch (error) {
      console.error('[Notifications] Cancel all notifications error:', error);
    }
  }

  getPermissionStatus(): NotificationPermissionStatus | null {
    return this.permissionStatus;
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async refreshToken(): Promise<void> {
    try {
      if (this.permissionStatus?.granted) {
        await this.registerForPushNotifications();
      }
    } catch (error) {
      console.error('[Notifications] Token refresh error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Cancel all notifications
      await this.cancelAllNotifications();
      
      // Clear stored data
      await AsyncStorage.multiRemove([
        '@cryb_push_token',
        '@cryb_notification_permissions',
      ]);

      // Reset state
      this.pushToken = null;
      this.permissionStatus = null;
      this.isInitialized = false;

    } catch (error) {
      console.error('[Notifications] Cleanup error:', error);
    }
  }
}

export const NotificationService = NotificationService.getInstance();