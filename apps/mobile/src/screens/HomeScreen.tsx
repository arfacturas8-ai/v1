import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { MainStackParamList } from '../navigation/MainNavigator';
import apiService from '../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface FeedItem {
  id: string;
  type: 'post' | 'server-activity' | 'announcement';
  title: string;
  content: string;
  author: string;
  timestamp: string;
  serverName?: string;
  imageUrl?: string;
  likes: number;
  comments: number;
}

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format timestamps
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Helper function to get timestamp value for sorting
  const getTimestampValue = useCallback((timestamp: string) => {
    if (timestamp === 'Just now') return Date.now();
    if (timestamp.includes('m ago')) return Date.now() - parseInt(timestamp) * 60000;
    if (timestamp.includes('h ago')) return Date.now() - parseInt(timestamp) * 3600000;
    if (timestamp.includes('d ago')) return Date.now() - parseInt(timestamp) * 86400000;
    return new Date(timestamp).getTime();
  }, []);

  const loadFeed = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch posts and communities from API to populate feed
      const [postsResponse, communitiesResponse] = await Promise.all([
        apiService.getPosts(undefined, 'hot', 15),
        apiService.getCommunities()
      ]);

      const feedItems: FeedItem[] = [];

      // Add posts to feed
      if (postsResponse && Array.isArray(postsResponse)) {
        const postFeedItems: FeedItem[] = postsResponse.map(post => ({
          id: post.id,
          type: 'post' as const,
          title: post.title,
          content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
          author: post.author.username,
          timestamp: formatTimestamp(post.createdAt),
          serverName: post.community.name,
          likes: post.votes,
          comments: post.commentCount,
          imageUrl: post.images && post.images.length > 0 ? post.images[0] : undefined,
        }));
        feedItems.push(...postFeedItems);
      }

      // Add recent communities as server activities
      if (communitiesResponse && Array.isArray(communitiesResponse)) {
        const recentCommunities = communitiesResponse
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
          
        const communityFeedItems: FeedItem[] = recentCommunities.map(community => ({
          id: `community-${community.id}`,
          type: 'server-activity' as const,
          title: `New Community: ${community.name}`,
          content: community.description,
          author: 'CRYB Platform',
          timestamp: formatTimestamp(community.createdAt),
          serverName: community.name,
          likes: community.memberCount || 0,
          comments: 0,
        }));
        feedItems.push(...communityFeedItems);
      }

      // Sort feed items by timestamp
      feedItems.sort((a, b) => {
        const timeA = getTimestampValue(a.timestamp);
        const timeB = getTimestampValue(b.timestamp);
        return timeB - timeA;
      });

      setFeedData(feedItems);
    } catch (error) {
      console.error('Error loading feed:', error);
      setError('Failed to load feed. Please try again.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  // Load feed on component mount
  useEffect(() => {
    const initializeFeed = async () => {
      setLoading(true);
      await loadFeed();
      setLoading(false);
    };
    
    initializeFeed();
  }, [loadFeed]);

  const handleItemPress = useCallback((item: FeedItem) => {
    if (item.type === 'server-activity' && item.serverName) {
      // Navigate to server
      navigation.navigate('Server', {
        serverId: 'server-1',
        serverName: item.serverName,
      });
    }
  }, [navigation]);

  const renderFeedItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity 
      style={[styles.feedItem, { backgroundColor: colors.card }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.feedItemHeader}>
        <View style={styles.feedItemType}>
          <Ionicons 
            name={item.type === 'announcement' ? 'megaphone' : 
                 item.type === 'server-activity' ? 'people' : 'document-text'}
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.feedItemTypeText, { color: colors.primary }]}>
            {item.type === 'announcement' ? 'Announcement' :
             item.type === 'server-activity' ? 'Server Activity' : 'Post'}
          </Text>
        </View>
        <Text style={[styles.feedItemTimestamp, { color: colors.textSecondary }]}>
          {item.timestamp}
        </Text>
      </View>

      <Text style={[styles.feedItemTitle, { color: colors.text }]}>
        {item.title}
      </Text>
      
      <Text style={[styles.feedItemContent, { color: colors.textSecondary }]}>
        {item.content}
      </Text>

      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.feedItemImage} />
      )}

      <View style={styles.feedItemFooter}>
        <View style={styles.feedItemAuthor}>
          <Text style={[styles.feedItemAuthorText, { color: colors.textSecondary }]}>
            by {item.author}
          </Text>
          {item.serverName && (
            <Text style={[styles.feedItemServerName, { color: colors.primary }]}>
              in {item.serverName}
            </Text>
          )}
        </View>

        <View style={styles.feedItemActions}>
          <View style={styles.feedItemAction}>
            <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.feedItemActionText, { color: colors.textSecondary }]}>
              {item.likes}
            </Text>
          </View>
          <View style={styles.feedItemAction}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.feedItemActionText, { color: colors.textSecondary }]}>
              {item.comments}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Welcome back, {user?.username || 'User'}!
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Stay connected with your communities
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
        >
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('CreateServer')}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Communities' })}
        >
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Communities</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Activity
      </Text>
    </View>
  );

  if (loading) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={feedData}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No posts yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {error ? error : 'Be the first to share something with the community!'}
            </Text>
            {error && (
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={onRefresh}
              >
                <Text style={[styles.retryButtonText, { color: colors.background }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            )}
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.h4,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.body2,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  quickActionText: {
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: 'bold',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  feedItem: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  feedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  feedItemType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedItemTypeText: {
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  feedItemTimestamp: {
    fontSize: typography.caption,
  },
  feedItemTitle: {
    fontSize: typography.body1,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  feedItemContent: {
    fontSize: typography.body2,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  feedItemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  feedItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedItemAuthor: {
    flex: 1,
  },
  feedItemAuthorText: {
    fontSize: typography.caption,
  },
  feedItemServerName: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  feedItemActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  feedItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  feedItemActionText: {
    fontSize: typography.caption,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: typography.h5,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.body1,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  retryButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: typography.body1,
    fontWeight: '600',
  },
});