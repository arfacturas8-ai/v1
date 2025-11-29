import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { MainStackParamList } from '../navigation/MainNavigator';
import apiService from '../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'award' | 'system' | 'post_reply' | 'direct_message';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  target?: {
    id: string;
    type: 'post' | 'comment' | 'user' | 'community';
    title?: string;
  };
  actionUrl?: string;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  directMessages: boolean;
  systemUpdates: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    title: 'New Like',
    message: 'user123 liked your post "Crypto market analysis"',
    isRead: false,
    createdAt: '2024-01-20T10:30:00Z',
    actor: {
      id: 'user123',
      username: 'user123',
      avatarUrl: 'https://via.placeholder.com/40',
    },
    target: {
      id: 'post1',
      type: 'post',
      title: 'Crypto market analysis',
    },
  },
  {
    id: '2',
    type: 'comment',
    title: 'New Comment',
    message: 'alice_crypto commented on your post',
    isRead: false,
    createdAt: '2024-01-20T09:15:00Z',
    actor: {
      id: 'alice',
      username: 'alice_crypto',
      avatarUrl: 'https://via.placeholder.com/40',
    },
  },
  {
    id: '3',
    type: 'follow',
    title: 'New Follower',
    message: 'bob_trader started following you',
    isRead: true,
    createdAt: '2024-01-19T16:45:00Z',
    actor: {
      id: 'bob',
      username: 'bob_trader',
      avatarUrl: 'https://via.placeholder.com/40',
    },
  },
  {
    id: '4',
    type: 'mention',
    title: 'You were mentioned',
    message: 'You were mentioned in "Market predictions for 2024"',
    isRead: true,
    createdAt: '2024-01-19T14:20:00Z',
    target: {
      id: 'post2',
      type: 'post',
      title: 'Market predictions for 2024',
    },
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    message: 'New features are now available! Check out the latest updates.',
    isRead: true,
    createdAt: '2024-01-18T12:00:00Z',
  },
];

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: false,
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  directMessages: true,
  systemUpdates: false,
};

export function NotificationsScreen() {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      if (response && Array.isArray(response)) {
        setNotifications(response);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await apiService.getNotificationSettings();
      if (response) {
        setSettings({ ...defaultSettings, ...response });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteNotification(notificationId);
              setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
            } catch (error) {
              console.error('Error deleting notification:', error);
            }
          },
        },
      ]
    );
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await apiService.updateNotificationSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.target) {
      switch (notification.target.type) {
        case 'post':
          navigation.navigate('PostDetail', { postId: notification.target.id });
          break;
        case 'user':
          navigation.navigate('UserProfile', { userId: notification.actor?.id });
          break;
        case 'community':
          navigation.navigate('CommunityDetail', { communityId: notification.target.id });
          break;
      }
    } else if (notification.actor) {
      navigation.navigate('UserProfile', { userId: notification.actor.id });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'follow':
        return 'person-add';
      case 'mention':
        return 'at';
      case 'award':
        return 'trophy';
      case 'system':
        return 'information-circle';
      case 'post_reply':
        return 'arrow-undo';
      case 'direct_message':
        return 'mail';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return '#e91e63';
      case 'comment':
        return '#2196f3';
      case 'follow':
        return '#4caf50';
      case 'mention':
        return '#ff9800';
      case 'award':
        return '#ffc107';
      case 'system':
        return '#9c27b0';
      default:
        return colors.primary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.isRead ? colors.card : colors.surface,
          borderLeftColor: item.isRead ? 'transparent' : colors.primary,
        },
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>
          
          {item.actor?.avatarUrl && (
            <Image source={{ uri: item.actor.avatarUrl }} style={styles.actorAvatar} />
          )}
          
          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
              {item.message}
            </Text>
          </View>
          
          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <View style={[styles.settingsContainer, { backgroundColor: colors.background }]}>
      <View style={styles.settingsHeader}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>
          Notification Settings
        </Text>
        <TouchableOpacity onPress={() => setShowSettings(false)}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.settingsSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Delivery Methods
        </Text>
        
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Push Notifications
          </Text>
          <Switch
            value={settings.pushEnabled}
            onValueChange={(value) => updateSettings({ pushEnabled: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Email Notifications
          </Text>
          <Switch
            value={settings.emailEnabled}
            onValueChange={(value) => updateSettings({ emailEnabled: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.settingsSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Notification Types
        </Text>
        
        {[
          { key: 'likes', label: 'Likes & Reactions' },
          { key: 'comments', label: 'Comments & Replies' },
          { key: 'follows', label: 'New Followers' },
          { key: 'mentions', label: 'Mentions' },
          { key: 'directMessages', label: 'Direct Messages' },
          { key: 'systemUpdates', label: 'System Updates' },
        ].map(({ key, label }) => (
          <View key={key} style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {label}
            </Text>
            <Switch
              value={settings[key as keyof NotificationSettings] as boolean}
              onValueChange={(value) => updateSettings({ [key]: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        ))}
      </View>
    </View>
  );

  if (showSettings) {
    return renderSettings();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              We'll notify you when something happens
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h5,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  unreadBadge: {
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: typography.caption,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  notificationItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderLeftWidth: 3,
    marginVertical: 1,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.md,
  },
  notificationText: {
    flex: 1,
    marginRight: spacing.md,
  },
  notificationTitle: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: typography.body2,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: typography.caption,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: typography.h6,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: typography.body2,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  settingsContainer: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  settingsTitle: {
    fontSize: typography.h5,
    fontWeight: 'bold',
  },
  settingsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    flex: 1,
  },
});