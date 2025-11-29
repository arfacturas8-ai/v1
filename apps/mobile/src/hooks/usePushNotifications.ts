import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '../services/PushNotificationService';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface UsePushNotificationsReturn {
  // Permission state
  permissionStatus: NotificationPermissionStatus | null;
  isLoading: boolean;
  
  // Token state
  pushToken: string | null;
  
  // Notification state
  lastNotification: Notifications.Notification | null;
  deliveredNotifications: Notifications.Notification[];
  badgeCount: number;
  
  // Settings
  notificationSettings: any;
  
  // Actions
  requestPermissions: () => Promise<boolean>;
  initializePushNotifications: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  dismissNotification: (identifier: string) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
  scheduleNotification: (title: string, body: string, trigger: any, data?: any) => Promise<string>;
  cancelNotification: (identifier: string) => Promise<void>;
  refreshDeliveredNotifications: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const [deliveredNotifications, setDeliveredNotifications] = useState<Notifications.Notification[]>([]);
  const [badgeCount, setBadgeCountState] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);

  // Check permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      
      setPermissionStatus({
        granted: status === 'granted',
        canAskAgain,
        status,
      });
      
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });

      const granted = status === 'granted';
      
      setPermissionStatus({
        granted,
        canAskAgain,
        status,
      });

      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize push notifications
  const initializePushNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      
      await pushNotificationService.initialize();
      
      const token = await pushNotificationService.getPushToken();
      setPushToken(token);
      
      // Load settings
      const settings = await pushNotificationService.getNotificationSettings();
      setNotificationSettings(settings);
      
      // Get initial badge count
      const currentBadgeCount = await Notifications.getBadgeCountAsync();
      setBadgeCountState(currentBadgeCount);
      
      // Refresh delivered notifications
      await refreshDeliveredNotifications();
      
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update notification settings
  const updateSettings = useCallback(async (settings: any) => {
    try {
      await pushNotificationService.updateNotificationSettings(settings);
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }, []);

  // Badge count management
  const setBadgeCount = useCallback(async (count: number) => {
    try {
      await pushNotificationService.setBadgeCount(count);
      setBadgeCountState(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }, []);

  const clearBadge = useCallback(async () => {
    await setBadgeCount(0);
  }, [setBadgeCount]);

  // Test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await pushNotificationService.testNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, []);

  // Dismiss notifications
  const dismissNotification = useCallback(async (identifier: string) => {
    try {
      await pushNotificationService.dismissNotification(identifier);
      await refreshDeliveredNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, []);

  const dismissAllNotifications = useCallback(async () => {
    try {
      await pushNotificationService.clearAllNotifications();
      setDeliveredNotifications([]);
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    trigger: any,
    data?: any
  ): Promise<string> => {
    try {
      return await pushNotificationService.scheduleNotification(title, body, trigger, data);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }, []);

  // Cancel notification
  const cancelNotification = useCallback(async (identifier: string) => {
    try {
      await pushNotificationService.cancelNotification(identifier);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }, []);

  // Refresh delivered notifications
  const refreshDeliveredNotifications = useCallback(async () => {
    try {
      const notifications = await pushNotificationService.getDeliveredNotifications();
      setDeliveredNotifications(notifications);
    } catch (error) {
      console.error('Error refreshing delivered notifications:', error);
    }
  }, []);

  // Set up notification listeners
  useEffect(() => {
    let notificationListener: any;
    let responseListener: any;

    const setupListeners = () => {
      // Listen for notifications received while app is foregrounded
      notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in hook:', notification);
        setLastNotification(notification);
        refreshDeliveredNotifications();
      });

      // Listen for user interactions with notifications
      responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response in hook:', response);
        setLastNotification(response.notification);
      });
    };

    setupListeners();

    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }, [refreshDeliveredNotifications]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh badge count and delivered notifications when app becomes active
        refreshDeliveredNotifications();
        Notifications.getBadgeCountAsync().then(setBadgeCountState);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [refreshDeliveredNotifications]);

  // Initial setup
  useEffect(() => {
    const initialize = async () => {
      await checkPermissionStatus();
      setIsLoading(false);
    };

    initialize();
  }, [checkPermissionStatus]);

  return {
    // State
    permissionStatus,
    isLoading,
    pushToken,
    lastNotification,
    deliveredNotifications,
    badgeCount,
    notificationSettings,
    
    // Actions
    requestPermissions,
    initializePushNotifications,
    updateSettings,
    setBadgeCount,
    clearBadge,
    sendTestNotification,
    dismissNotification,
    dismissAllNotifications,
    scheduleNotification,
    cancelNotification,
    refreshDeliveredNotifications,
  };
}