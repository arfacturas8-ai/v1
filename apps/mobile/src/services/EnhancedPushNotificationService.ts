import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class EnhancedPushNotificationService {
  private static instance: EnhancedPushNotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {}

  static getInstance(): EnhancedPushNotificationService {
    if (!EnhancedPushNotificationService.instance) {
      EnhancedPushNotificationService.instance = new EnhancedPushNotificationService();
    }
    return EnhancedPushNotificationService.instance;
  }

  async initialize(): Promise<string | null> {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      this.expoPushToken = token;

      // Set up notification listeners
      this.setupNotificationListeners();

      // Configure notification channels (Android)
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return token;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  private async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notifications');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('Project ID not found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private setupNotificationListeners(): void {
    // Handle notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Handle user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('calls', {
      name: 'Calls',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 500, 1000],
      sound: 'ringtone',
    });

    await Notifications.setNotificationChannelAsync('community', {
      name: 'Community Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
    });
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    // Custom handling for different notification types
    const data = notification.request.content.data;
    const type = data?.type as string;

    switch (type) {
      case 'message':
        // Handle message notification
        break;
      case 'call':
        // Handle call notification
        break;
      case 'community_post':
        // Handle community post notification
        break;
      default:
        // Handle generic notification
        break;
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    // Navigate to appropriate screen based on notification type
    const data = response.notification.request.content.data;
    const type = data?.type as string;

    // This should be integrated with your navigation service
    switch (type) {
      case 'message':
        // Navigate to chat
        if (data?.roomId) {
          // navigation.navigate('ChatRoom', { roomId: data.roomId });
        }
        break;
      case 'call':
        // Handle incoming call
        if (data?.channelId) {
          // navigation.navigate('VoiceChannel', { channelId: data.channelId });
        }
        break;
      case 'community_post':
        // Navigate to post
        if (data?.postId) {
          // navigation.navigate('PostDetail', { postId: data.postId });
        }
        break;
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  async showLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    return await this.scheduleLocalNotification(title, body, data, null);
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Helper methods for specific notification types
  async notifyNewMessage(
    senderName: string,
    message: string,
    roomId: string
  ): Promise<void> {
    await this.showLocalNotification(`New message from ${senderName}`, message, {
      type: 'message',
      roomId,
    });
  }

  async notifyIncomingCall(
    callerName: string,
    channelId: string,
    isVideo: boolean
  ): Promise<void> {
    await this.showLocalNotification(
      `Incoming ${isVideo ? 'video' : 'voice'} call`,
      `${callerName} is calling...`,
      {
        type: 'call',
        channelId,
        isVideo,
      }
    );
  }

  async notifyCommunityPost(
    communityName: string,
    postTitle: string,
    postId: string
  ): Promise<void> {
    await this.showLocalNotification(
      `New post in ${communityName}`,
      postTitle,
      {
        type: 'community_post',
        postId,
      }
    );
  }
}

export default EnhancedPushNotificationService.getInstance();
