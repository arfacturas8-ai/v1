import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, scale } from '../utils/responsive';
import * as Haptics from 'expo-haptics';

interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post_reply' | 'award' | 'message';
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  target?: {
    type: 'post' | 'comment' | 'user';
    id: string;
    preview?: string;
  };
  timestamp: string;
  read: boolean;
}

interface ActivityFeedScreenProps {
  navigation: any;
}

export function ActivityFeedScreen({ navigation }: ActivityFeedScreenProps) {
  const { colors } = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mentions' | 'comments' | 'likes'>('all');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      // TODO: Load activities from API
      // const response = await apiService.getActivities(filter);
      // setActivities(response);

      // Mock data
      setActivities([
        {
          id: '1',
          type: 'like',
          actor: {
            id: 'u1',
            username: 'alice',
            displayName: 'Alice',
          },
          content: 'liked your post',
          target: {
            type: 'post',
            id: 'p1',
            preview: 'My awesome post about React Native',
          },
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
      ]);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  }, [filter]);

  const handleActivityPress = async (item: ActivityItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read
    setActivities(prev =>
      prev.map(a => (a.id === item.id ? { ...a, read: true } : a))
    );

    // Navigate to target
    if (item.target) {
      switch (item.target.type) {
        case 'post':
          navigation.navigate('PostDetail', { postId: item.target.id });
          break;
        case 'comment':
          // Navigate to comment in post
          break;
        case 'user':
          navigation.navigate('UserProfile', { userId: item.target.id });
          break;
      }
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'message-circle';
      case 'follow':
        return 'user-plus';
      case 'mention':
        return 'at-sign';
      case 'post_reply':
        return 'corner-down-right';
      case 'award':
        return 'award';
      case 'message':
        return 'mail';
      default:
        return 'bell';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'like':
        return '#FF4458';
      case 'comment':
        return colors.primary;
      case 'follow':
        return '#00D9A5';
      case 'mention':
        return '#FFB800';
      case 'award':
        return '#FF6B35';
      default:
        return colors.textSecondary;
    }
  };

  const renderActivity = ({ item }: { item: ActivityItem }) => (
    <TouchableOpacity
      onPress={() => handleActivityPress(item)}
      style={[
        styles.activityItem,
        {
          backgroundColor: item.read ? colors.background : colors.card,
          borderLeftColor: item.read ? colors.border : getActivityColor(item.type),
        }
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getActivityColor(item.type) + '20' }
        ]}
      >
        <Feather
          name={getActivityIcon(item.type) as any}
          size={20}
          color={getActivityColor(item.type)}
        />
      </View>

      <View style={styles.activityContent}>
        <Text style={[styles.activityText, { color: colors.text }]}>
          <Text style={{ fontWeight: '600' }}>{item.actor.displayName}</Text>
          {' '}
          {item.content}
        </Text>

        {item.target?.preview && (
          <Text
            style={[styles.targetPreview, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.target.preview}
          </Text>
        )}

        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {getTimeAgo(item.timestamp)}
        </Text>
      </View>

      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );

  const renderFilter = (
    label: string,
    value: 'all' | 'mentions' | 'comments' | 'likes'
  ) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === value ? colors.primary : colors.card,
          borderColor: filter === value ? colors.primary : colors.border,
        }
      ]}
    >
      <Text
        style={[
          styles.filterText,
          { color: filter === value ? '#fff' : colors.text }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilter('All', 'all')}
        {renderFilter('Mentions', 'mentions')}
        {renderFilter('Comments', 'comments')}
        {renderFilter('Likes', 'likes')}
      </View>

      {/* Activities List */}
      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        renderItem={renderActivity}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No activities yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getTimeAgo = (timestamp: string): string => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: scale(20),
    borderWidth: 1,
  },
  filterText: {
    fontSize: typography.body2,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  activityItem: {
    flexDirection: 'row',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: scale(12),
    borderLeftWidth: 3,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: typography.body2,
    lineHeight: typography.body2 * 1.4,
  },
  targetPreview: {
    fontSize: typography.caption,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginLeft: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    fontSize: typography.body1,
    marginTop: spacing.lg,
  },
});
