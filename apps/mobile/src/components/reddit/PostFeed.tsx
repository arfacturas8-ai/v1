import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/RealApiService';
import PostCard from './PostCard';
import ErrorBoundary from '../ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  community: {
    id: string;
    name: string;
    avatar?: string;
  };
  votes: number;
  userVote?: 'up' | 'down' | null;
  commentCount: number;
  images?: string[];
  video?: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
  type: 'text' | 'image' | 'video' | 'link' | 'poll';
  url?: string;
  flair?: string;
  awards?: any[];
  saved?: boolean;
}

interface PostFeedProps {
  communityId?: string;
  sortBy?: 'hot' | 'new' | 'top' | 'rising' | 'controversial' | 'gilded';
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
}

const SORT_OPTIONS = [
  { key: 'hot', label: 'Hot', icon: 'flame' },
  { key: 'new', label: 'New', icon: 'time' },
  { key: 'top', label: 'Top', icon: 'trophy' },
  { key: 'rising', label: 'Rising', icon: 'trending-up' },
  { key: 'controversial', label: 'Controversial', icon: 'flash' },
  { key: 'gilded', label: 'Gilded', icon: 'star' },
];

const TIME_RANGES = [
  { key: 'hour', label: 'Hour' },
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All Time' },
];

export default function PostFeed({ 
  communityId, 
  sortBy = 'hot', 
  timeRange = 'all' 
}: PostFeedProps) {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentSort, setCurrentSort] = useState(sortBy);
  const [currentTimeRange, setCurrentTimeRange] = useState(timeRange);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(0);
  
  const offset = useRef(0);

  // Load posts
  const loadPosts = useCallback(async (
    isRefresh = false, 
    loadMore = false,
    sort = currentSort,
    time = currentTimeRange
  ) => {
    if (loadMore && (!hasMore || loadingMore)) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
        offset.current = 0;
        setError(null);
      } else if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const limit = 20;
      const currentOffset = loadMore ? offset.current : 0;

      const fetchedPosts = await apiService.getPosts(
        communityId,
        sort as any,
        limit,
        currentOffset
      );

      const newPosts = Array.isArray(fetchedPosts) ? fetchedPosts : [];
      
      if (isRefresh || !loadMore) {
        setPosts(newPosts);
        offset.current = newPosts.length;
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        offset.current += newPosts.length;
      }

      setHasMore(newPosts.length === limit);
      setError(null);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [communityId, currentSort, currentTimeRange, hasMore, loadingMore]);

  // Initial load
  useEffect(() => {
    loadPosts();
  }, [communityId]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadPosts(true);
  }, [loadPosts]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPosts(false, true);
    }
  }, [loadPosts, loadingMore, hasMore]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: string) => {
    if (newSort !== currentSort) {
      setCurrentSort(newSort as any);
      setShowSortMenu(false);
      offset.current = 0;
      loadPosts(false, false, newSort as any);
    }
  }, [currentSort, loadPosts]);

  // Handle vote
  const handleVote = useCallback(async (postId: string, voteType: 'up' | 'down') => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const wasUpvoted = post.userVote === 'up';
          const wasDownvoted = post.userVote === 'down';
          const isUpvote = voteType === 'up';
          
          let newVotes = post.votes;
          let newUserVote: 'up' | 'down' | null = null;
          
          if (isUpvote) {
            if (wasUpvoted) {
              // Remove upvote
              newVotes -= 1;
              newUserVote = null;
            } else {
              // Add upvote
              newVotes += wasDownvoted ? 2 : 1;
              newUserVote = 'up';
            }
          } else {
            if (wasDownvoted) {
              // Remove downvote
              newVotes += 1;
              newUserVote = null;
            } else {
              // Add downvote
              newVotes -= wasUpvoted ? 2 : 1;
              newUserVote = 'down';
            }
          }
          
          return {
            ...post,
            votes: newVotes,
            userVote: newUserVote,
          };
        }
        return post;
      }));

      // API call
      await apiService.votePost(postId, voteType);
    } catch (err) {
      console.error('Failed to vote:', err);
      // Revert optimistic update on error
      loadPosts(true);
    }
  }, [loadPosts]);

  // Handle save post
  const handleSavePost = useCallback(async (postId: string, save: boolean) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, saved: save } : post
      ));
      
      // TODO: Implement save/unsave API call
      console.log('Save post:', postId, save);
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  }, []);

  // Handle share post
  const handleSharePost = useCallback((post: Post) => {
    // TODO: Implement sharing
    Alert.alert('Share', `Share post: ${post.title}`);
  }, []);

  // Handle report post
  const handleReportPost = useCallback((postId: string) => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Spam', onPress: () => console.log('Report spam:', postId) },
        { text: 'Harassment', onPress: () => console.log('Report harassment:', postId) },
        { text: 'Misinformation', onPress: () => console.log('Report misinformation:', postId) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  // Render sort header
  const renderSortHeader = () => (
    <View style={styles.sortHeader}>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortMenu(!showSortMenu)}
      >
        <Text style={styles.sortButtonText}>
          {SORT_OPTIONS.find(opt => opt.key === currentSort)?.label || 'Hot'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        disabled={refreshing}
      >
        <Ionicons name="refresh" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  // Render sort menu
  const renderSortMenu = () => {
    if (!showSortMenu) return null;
    
    return (
      <View style={styles.sortMenu}>
        {SORT_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortOption,
              currentSort === option.key && styles.sortOptionActive
            ]}
            onPress={() => handleSortChange(option.key)}
          >
            <Ionicons 
              name={option.icon as any} 
              size={16} 
              color={currentSort === option.key ? '#007AFF' : '#666'} 
            />
            <Text style={[
              styles.sortOptionText,
              currentSort === option.key && styles.sortOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render post item
  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onVote={handleVote}
      onSave={handleSavePost}
      onShare={handleSharePost}
      onReport={handleReportPost}
      onPress={() => navigation.navigate('PostDetail' as never, { postId: item.id } as never)}
    />
  );

  // Render loading footer
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more posts...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPosts()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text-outline" size={48} color="#999" />
        <Text style={styles.emptyText}>No posts found</Text>
        <Text style={styles.emptySubtext}>
          {communityId ? 'This community has no posts yet.' : 'Try refreshing or changing your sort order.'}
        </Text>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {renderSortHeader()}
        {renderSortMenu()}
        
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
        />
      </View>
    </ErrorBoundary>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  sortButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#333',
    marginRight: spacing.xs,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  sortMenu: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sortOptionActive: {
    backgroundColor: '#f0f8ff',
  },
  sortOptionText: {
    fontSize: typography.body1,
    color: '#333',
    marginLeft: spacing.md,
  },
  sortOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  loadingText: {
    fontSize: typography.body1,
    color: '#666',
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: typography.body1,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#333',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.body2,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
});