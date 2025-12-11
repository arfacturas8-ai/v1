/**
 * NOTIFICATION SCREEN
 * Comprehensive notification management with real-time updates and granular controls
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkContext } from '../../contexts/NetworkContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { 
  Avatar, 
  Button, 
  Card,
  LoadingSpinner,
} from '../../components/ui';
import { apiService } from '../../services/ApiService';
import { pushNotificationService } from '../../services/PushNotificationService';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type NotificationScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface NotificationItem {
  id: string;
  type: 'message' | 'server_invite' | 'friend_request' | 'announcement' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  actionData?: {
    serverId?: string;
    channelId?: string;
    userId?: string;
    inviteId?: string;
  };
  priority: 'low' | 'normal' | 'high';
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  messageNotifications: boolean;
  serverInvites: boolean;
  friendRequests: boolean;
  announcements: boolean;
  systemNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation<NotificationScreenNavigationProp>();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetworkContext();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    messageNotifications: true,
    serverInvites: true,
    friendRequests: true,
    announcements: true,
    systemNotifications: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'notifications' | 'settings'>('notifications');
  const [unreadCount, setUnreadCount] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        loadNotifications();
      }
    }, [isLoading])
  );

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
    
    // Update badge count
    pushNotificationService.setBadgeCount(unread);
  }, [notifications]);

  const loadData = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadSettings(),
    ]);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      if (!isConnected) {
        setError('No internet connection');
        return;
      }

      setError(null);
      if (!isRefreshing) {
        setIsLoading(true);
      }

      // Mock notifications for now - replace with actual API call
      const mockNotifications: NotificationItem[] = [
        {
          id: '1',
          type: 'message',
          title: 'New message from Alice',
          message: 'Hey! How are you doing today?',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          isRead: false,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
          actionData: { channelId: 'channel1', serverId: 'server1' },
          priority: 'normal',
        },
        {
          id: '2',
          type: 'server_invite',
          title: 'Server invitation',
          message: 'You have been invited to join "Gaming Community"',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
          avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=server1',
          actionData: { serverId: 'server1', inviteId: 'invite1' },
          priority: 'normal',
        },
        {
          id: '3',
          type: 'friend_request',
          title: 'Friend request',
          message: 'Bob wants to be your friend',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          isRead: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
          actionData: { userId: 'user2' },
          priority: 'normal',
        },
        {
          id: '4',
          type: 'announcement',
          title: 'New features available!',
          message: 'Check out the latest updates to CRYB',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          isRead: true,
          priority: 'high',
        },
        {
          id: '5',
          type: 'system',
          title: 'Security update',
          message: 'Your account security has been updated',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          isRead: true,
          priority: 'high',
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isConnected, isRefreshing]);

  const loadSettings = useCallback(async () => {
    try {
      // Load notification settings from API or local storage
      // For now, use default settings with some user preferences
      const userSettings = user?.settings;
      
      setSettings(prev => ({
        ...prev,
        pushEnabled: userSettings?.pushNotifications ?? true,
        emailEnabled: true, // Could come from user preferences
      }));
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, [user]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [loadData]);

  const handleNotificationPress = useCallback((notification: NotificationItem) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.actionData?.channelId) {
          navigation.navigate('ChatRoom', {
            roomId: notification.actionData.channelId,
            roomName: 'Chat Room',
          });
        }
        break;
      case 'server_invite':
        if (notification.actionData?.serverId) {
          navigation.navigate('Server', {
            serverId: notification.actionData.serverId,
            serverName: 'Server',
          });
        }
        break;
      case 'friend_request':
        // Navigate to friends screen (would need to implement)
        Alert.alert('Friend Request', 'Friend request feature coming soon!');
        break;
      case 'announcement':
      case 'system':
        // Show detailed announcement or system message
        Alert.alert(notification.title, notification.message);
        break;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [navigation]);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            pushNotificationService.clearAllNotifications();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  }, []);

  const handleSettingChange = useCallback((setting: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleQuietHoursChange = useCallback((field: 'enabled' | 'startTime' | 'endTime', value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSaveSettings = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      // TODO: Save settings to API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update push notification service
      if (settings.pushEnabled) {
        await pushNotificationService.refreshToken();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Settings Saved', 'Your notification settings have been updated.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const handleTestNotification = useCallback(async () => {
    try {
      await pushNotificationService.sendLocalNotification(
        'Test Notification',
        'This is a test notification from CRYB!',
        { type: 'test' }
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  }, []);

  const getNotificationIcon = useCallback((type: NotificationItem['type']) => {
    switch (type) {
      case 'message': return 'chatbubble';
      case 'server_invite': return 'people';
      case 'friend_request': return 'person-add';
      case 'announcement': return 'megaphone';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  }, []);

  const getNotificationColor = useCallback((type: NotificationItem['type'], priority: NotificationItem['priority']) => {
    if (priority === 'high') return colors.error;
    
    switch (type) {
      case 'message': return colors.primary;
      case 'server_invite': return colors.info;
      case 'friend_request': return colors.success;
      case 'announcement': return colors.warning;
      case 'system': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  }, [colors]);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  const renderNotificationItem = useCallback((notification: NotificationItem) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        { backgroundColor: colors.cardBackground },
        !notification.isRead && { backgroundColor: colors.primary + '08' }
      ]}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        {notification.avatar ? (
          <Avatar size="md" source={notification.avatar} name={notification.title} />
        ) : (
          <View style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(notification.type, notification.priority) + '20' }
          ]}>
            <Ionicons
              name={getNotificationIcon(notification.type)}
              size={24}
              color={getNotificationColor(notification.type, notification.priority)}
            />
          </View>
        )}
        {!notification.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              { color: colors.text },
              !notification.isRead && { fontWeight: '600' }
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>
        <Text
          style={[
            styles.notificationMessage,
            { color: colors.textSecondary },
            !notification.isRead && { color: colors.text }
          ]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
      </View>
    </TouchableOpacity>
  ), [colors, handleNotificationPress, getNotificationIcon, getNotificationColor, formatTimestamp]);

  const renderNotifications = useCallback(() => (
    <View style={styles.notificationsContainer}>
      {/* Header Actions */}
      <View style={styles.actionsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        <View style={styles.actionButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleMarkAllAsRead}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Mark All Read
              </Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
              onPress={handleClearAll}
            >
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            You're all caught up! New notifications will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.notificationsList}>
          {notifications.map(renderNotificationItem)}
        </View>
      )}
    </View>
  ), [colors, unreadCount, notifications, handleMarkAllAsRead, handleClearAll, renderNotificationItem]);

  const renderSettings = useCallback(() => (
    <View style={styles.settingsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Settings</Text>

      {/* Main Settings */}
      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>General</Text>
        
        {[
          { key: 'pushEnabled' as const, title: 'Push Notifications', description: 'Receive notifications on this device' },
          { key: 'emailEnabled' as const, title: 'Email Notifications', description: 'Receive notifications via email' },
          { key: 'soundEnabled' as const, title: 'Sound', description: 'Play sound for notifications' },
          { key: 'vibrationEnabled' as const, title: 'Vibration', description: 'Vibrate for notifications' },
        ].map((setting) => (
          <TouchableOpacity
            key={setting.key}
            style={styles.settingItem}
            onPress={() => handleSettingChange(setting.key, !settings[setting.key])}
            disabled={isSaving}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {setting.title}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {setting.description}
              </Text>
            </View>
            <View style={[
              styles.switch,
              { backgroundColor: settings[setting.key] ? colors.primary : colors.border },
            ]}>
              <View style={[
                styles.switchThumb,
                { backgroundColor: colors.background },
                settings[setting.key] && styles.switchThumbActive,
              ]} />
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Notification Types */}
      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Notification Types</Text>
        
        {[
          { key: 'messageNotifications' as const, title: 'Messages', description: 'New messages and replies' },
          { key: 'serverInvites' as const, title: 'Server Invites', description: 'Invitations to join servers' },
          { key: 'friendRequests' as const, title: 'Friend Requests', description: 'New friend requests' },
          { key: 'announcements' as const, title: 'Announcements', description: 'App updates and news' },
          { key: 'systemNotifications' as const, title: 'System', description: 'Security and account updates' },
        ].map((setting) => (
          <TouchableOpacity
            key={setting.key}
            style={styles.settingItem}
            onPress={() => handleSettingChange(setting.key, !settings[setting.key])}
            disabled={isSaving}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {setting.title}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {setting.description}
              </Text>
            </View>
            <View style={[
              styles.switch,
              { backgroundColor: settings[setting.key] ? colors.primary : colors.border },
            ]}>
              <View style={[
                styles.switchThumb,
                { backgroundColor: colors.background },
                settings[setting.key] && styles.switchThumbActive,
              ]} />
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Quiet Hours */}
      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Quiet Hours</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => handleQuietHoursChange('enabled', !settings.quietHours.enabled)}
          disabled={isSaving}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Enable Quiet Hours
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Mute notifications during specified hours
            </Text>
          </View>
          <View style={[
            styles.switch,
            { backgroundColor: settings.quietHours.enabled ? colors.primary : colors.border },
          ]}>
            <View style={[
              styles.switchThumb,
              { backgroundColor: colors.background },
              settings.quietHours.enabled && styles.switchThumbActive,
            ]} />
          </View>
        </TouchableOpacity>

        {settings.quietHours.enabled && (
          <View style={styles.quietHoursTime}>
            <Text style={[styles.quietHoursLabel, { color: colors.textSecondary }]}>
              From {settings.quietHours.startTime} to {settings.quietHours.endTime}
            </Text>
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: colors.primary + '20' }]}
              onPress={() => {
                // TODO: Show time picker
                Alert.alert('Time Picker', 'Time picker coming soon!');
              }}
            >
              <Text style={[styles.timeButtonText, { color: colors.primary }]}>
                Change Times
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Test Notification */}
      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Test Notifications</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Send a test notification to verify your settings
        </Text>
        <Button
          title="Send Test Notification"
          onPress={handleTestNotification}
          variant="outline"
          size="md"
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Save Button */}
      <Button
        title="Save Settings"
        onPress={handleSaveSettings}
        variant="primary"
        size="lg"
        loading={isSaving}
        style={{ marginTop: spacing.md }}
      />
    </View>
  ), [colors, spacing, settings, isSaving, handleSettingChange, handleQuietHoursChange, handleSaveSettings, handleTestNotification]);

  if (isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'notifications' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('notifications')}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === 'notifications' ? colors.primary : colors.textSecondary }
              ]}
            >
              Notifications
            </Text>
            {unreadCount > 0 && selectedTab === 'notifications' && (
              <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.tabBadgeText, { color: colors.textInverse }]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'settings' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('settings')}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === 'settings' ? colors.primary : colors.textSecondary }
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              selectedTab === 'notifications' ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              ) : undefined
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Error Display */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {selectedTab === 'notifications' ? renderNotifications() : renderSettings()}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: spacing.sm,
  },
  tabText: {
    fontSize: typography.body1,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.body2,
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.h5,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  // Notifications Tab
  notificationsContainer: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  notificationsList: {
    gap: spacing.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    alignItems: 'flex-start',
  },
  notificationIcon: {
    position: 'relative',
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: typography.body1,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  notificationTime: {
    fontSize: typography.caption,
  },
  notificationMessage: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: typography.h5,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.body2,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Settings Tab
  settingsContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  cardDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingTitle: {
    fontSize: typography.body1,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  quietHoursTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  quietHoursLabel: {
    fontSize: typography.body2,
  },
  timeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeButtonText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

export { NotificationScreen };