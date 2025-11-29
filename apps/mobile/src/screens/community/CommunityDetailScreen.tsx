/**
 * COMMUNITY DETAIL SCREEN
 * Shows detailed view of a community with posts, members, and actions
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
  Alert,
  Share,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkContext } from '../../contexts/NetworkContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { 
  Avatar, 
  Button, 
  Card, 
  LoadingSpinner,
  SkeletonLoader,
} from '../../components/ui';
import { PostCard } from '../../components/reddit/PostCard';
import { apiService } from '../../services/ApiService';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

type CommunityDetailScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type CommunityDetailScreenRouteProp = RouteProp<MainStackParamList, 'CommunityDetail'>;

interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineMembers: number;
  isJoined: boolean;
  isModerator: boolean;
  isPrivate: boolean;
  nsfw: boolean;
  category: string;
  rules: {
    id: string;
    title: string;
    description: string;
  }[];
  moderators: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  }[];
  createdAt: string;
  flairEnabled: boolean;
  postTypes: ('text' | 'link' | 'image' | 'video')[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'video';
  url?: string;
  thumbnailUrl?: string;
  score: number;
  upvoteRatio: number;
  commentCount: number;
  viewCount: number;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  community: {
    id: string;
    name: string;
    displayName: string;
  };
  flair?: {
    id: string;
    text: string;
    backgroundColor: string;
    textColor: string;
  };
  nsfw: boolean;
  spoiler: boolean;
  locked: boolean;
  pinned: boolean;
  createdAt: string;
  editedAt?: string;
  userVote?: 'up' | 'down' | null;
  userSaved: boolean;
}

const CommunityDetailScreen: React.FC = () => {
  const navigation = useNavigation<CommunityDetailScreenNavigationProp>();
  const route = useRoute<CommunityDetailScreenRouteProp>();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetworkContext();
  const { user } = useAuthStore();

  const { communityId, communityName } = route.params;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [selectedTab, setSelectedTab] = useState<'posts' | 'about'>('posts');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCommunityData();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [communityId]);

  // Header opacity based on scroll
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const opacity = Math.min(value / 200, 1);
      headerOpacity.setValue(opacity);
    });

    return () => scrollY.removeListener(listener);
  }, []);

  const loadCommunityData = useCallback(async () => {
    try {
      if (!isConnected) {
        setError('No internet connection');
        return;
      }

      setError(null);
      if (!isRefreshing) {
        setIsLoading(true);
      }

      // Mock data for now - replace with actual API calls
      const mockCommunity: Community = {
        id: communityId,
        name: communityName.toLowerCase().replace(/\s+/g, ''),
        displayName: communityName,
        description: 'A vibrant community for discussing all things related to ' + communityName,
        iconUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${communityName}`,
        bannerUrl: 'https://picsum.photos/400/200?random=' + Math.random(),
        memberCount: Math.floor(Math.random() * 50000) + 1000,
        onlineMembers: Math.floor(Math.random() * 500) + 50,
        isJoined: Math.random() > 0.5,
        isModerator: false,
        isPrivate: false,
        nsfw: false,
        category: 'General',
        rules: [
          {
            id: '1',
            title: 'Be respectful',
            description: 'Treat all members with kindness and respect'
          },
          {
            id: '2',
            title: 'Stay on topic',
            description: 'Keep discussions relevant to the community'
          }
        ],
        moderators: [
          {
            id: 'mod1',
            username: 'moderator1',
            displayName: 'Community Moderator',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mod1'
          }
        ],
        createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
        flairEnabled: true,
        postTypes: ['text', 'link', 'image']
      };

      const mockPosts: Post[] = Array.from({ length: 10 }, (_, index) => ({
        id: `post-${index}`,
        title: `Interesting post #${index + 1} in ${communityName}`,
        content: `This is the content of post ${index + 1}. It contains some interesting discussion points about ${communityName}.`,
        type: ['text', 'link', 'image'][Math.floor(Math.random() * 3)] as Post['type'],
        url: Math.random() > 0.7 ? 'https://example.com' : undefined,
        thumbnailUrl: Math.random() > 0.5 ? `https://picsum.photos/300/200?random=${index}` : undefined,
        score: Math.floor(Math.random() * 1000),
        upvoteRatio: 0.7 + Math.random() * 0.3,
        commentCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 5000),
        author: {
          id: `user-${index}`,
          username: `user${index}`,
          displayName: `User ${index}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${index}`
        },
        community: {
          id: communityId,
          name: mockCommunity.name,
          displayName: mockCommunity.displayName
        },
        flair: Math.random() > 0.7 ? {
          id: 'flair1',
          text: 'Discussion',
          backgroundColor: colors.primary,
          textColor: colors.textInverse
        } : undefined,
        nsfw: false,
        spoiler: false,
        locked: false,
        pinned: index === 0,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        userVote: null,
        userSaved: false
      }));

      setCommunity(mockCommunity);
      setPosts(mockPosts);
    } catch (error) {
      console.error('Failed to load community data:', error);
      setError('Failed to load community. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [communityId, communityName, isConnected, isRefreshing, colors]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCommunityData();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [loadCommunityData]);

  const handleJoinCommunity = useCallback(async () => {
    if (!community) return;

    try {
      setIsJoining(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // TODO: Implement actual join/leave API call
      const newJoinedState = !community.isJoined;
      
      setCommunity(prev => prev ? {
        ...prev,
        isJoined: newJoinedState,
        memberCount: prev.memberCount + (newJoinedState ? 1 : -1)
      } : null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to join/leave community:', error);
      Alert.alert('Error', 'Failed to update membership. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }, [community]);

  const handleShareCommunity = useCallback(async () => {
    if (!community) return;

    try {
      await Share.share({
        message: `Check out r/${community.name} on CRYB: ${community.description}`,
        url: `https://cryb.ai/r/${community.name}`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [community]);

  const handleCreatePost = useCallback(() => {
    if (!community) return;
    
    navigation.navigate('CreatePost', {
      communityId: community.id,
      communityName: community.displayName,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [community, navigation]);

  const formatMemberCount = useCallback((count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, []);

  const renderHeader = useCallback(() => {
    if (!community) return null;

    return (
      <View style={styles.headerContainer}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {community.bannerUrl ? (
            <ImageBackground
              source={{ uri: community.bannerUrl }}
              style={styles.banner}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', colors.background + 'CC']}
                style={styles.bannerGradient}
              />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.primary + '80']}
              style={styles.banner}
            />
          )}
        </View>

        {/* Community Info */}
        <View style={[styles.communityInfo, { backgroundColor: colors.background }]}>
          <View style={styles.communityHeader}>
            <Avatar
              size="xl"
              source={community.iconUrl}
              name={community.displayName}
              style={styles.communityAvatar}
            />
            <View style={styles.communityTitleContainer}>
              <Text style={[styles.communityName, { color: colors.text }]}>
                r/{community.name}
              </Text>
              <Text style={[styles.communityDisplayName, { color: colors.textSecondary }]}>
                {community.displayName}
              </Text>
            </View>
          </View>

          <Text style={[styles.communityDescription, { color: colors.textSecondary }]}>
            {community.description}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {formatMemberCount(community.memberCount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Members
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.success }]}>
                {formatMemberCount(community.onlineMembers)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Online
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {new Date(community.createdAt).getFullYear()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Created
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title={community.isJoined ? 'Joined' : 'Join'}
              onPress={handleJoinCommunity}
              variant={community.isJoined ? 'outline' : 'primary'}
              size="md"
              loading={isJoining}
              style={styles.joinButton}
              icon={
                <Ionicons 
                  name={community.isJoined ? 'checkmark' : 'add'} 
                  size={16} 
                  color={community.isJoined ? colors.primary : colors.textInverse} 
                />
              }
            />
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
              onPress={handleShareCommunity}
            >
              <Ionicons name="share-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => {/* TODO: Show community options */}}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'posts' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('posts')}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === 'posts' ? colors.primary : colors.textSecondary }
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'about' && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setSelectedTab('about')}
          >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === 'about' ? colors.primary : colors.textSecondary }
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'posts' && (
          <View style={[styles.sortContainer, { backgroundColor: colors.cardBackground }]}>
            {['hot', 'new', 'top', 'rising'].map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.sortOption,
                  sortBy === sort && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => setSortBy(sort as typeof sortBy)}
              >
                <Text
                  style={[
                    styles.sortText,
                    { color: sortBy === sort ? colors.primary : colors.textSecondary }
                  ]}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [community, colors, selectedTab, sortBy, formatMemberCount, handleJoinCommunity, handleShareCommunity, isJoining]);

  const renderAbout = useCallback(() => {
    if (!community) return null;

    return (
      <View style={styles.aboutContainer}>
        <Card padding="lg" style={{ marginBottom: spacing.md }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Rules</Text>
          {community.rules.map((rule, index) => (
            <View key={rule.id} style={styles.ruleItem}>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>
                {index + 1}. {rule.title}
              </Text>
              <Text style={[styles.ruleDescription, { color: colors.textSecondary }]}>
                {rule.description}
              </Text>
            </View>
          ))}
        </Card>

        <Card padding="lg">
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Moderators</Text>
          {community.moderators.map((mod) => (
            <View key={mod.id} style={styles.moderatorItem}>
              <Avatar size="sm" source={mod.avatar} name={mod.displayName} />
              <View style={styles.moderatorInfo}>
                <Text style={[styles.moderatorName, { color: colors.text }]}>
                  {mod.displayName}
                </Text>
                <Text style={[styles.moderatorUsername, { color: colors.textSecondary }]}>
                  u/{mod.username}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    );
  }, [community, colors, spacing]);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      onVote={(type) => {/* TODO: Implement voting */}}
      onSave={() => {/* TODO: Implement save */}}
      onShare={() => {/* TODO: Implement share */}}
      style={{ marginHorizontal: spacing.md, marginBottom: spacing.sm }}
    />
  ), [navigation, spacing]);

  if (isLoading && !community) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <SkeletonLoader height={200} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader height={120} style={{ marginBottom: spacing.md }} />
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLoader
              key={index}
              height={100}
              style={{ marginBottom: spacing.sm }}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        
        {/* Animated Header */}
        <Animated.View
          style={[
            styles.animatedHeader,
            { 
              backgroundColor: colors.background,
              opacity: headerOpacity,
            }
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {community?.displayName || communityName}
            </Text>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={handleCreatePost}
            >
              <Ionicons name="add" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {selectedTab === 'posts' ? (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderHeader}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            />
          ) : (
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            >
              {renderHeader()}
              {renderAbout()}
            </ScrollView>
          )}
        </Animated.View>

        {/* Floating Action Button */}
        {community?.isJoined && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={handleCreatePost}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={loadCommunityData}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerAction: {
    padding: 8,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 88 : 68,
  },
  bannerContainer: {
    height: 120,
    marginBottom: -40,
  },
  banner: {
    flex: 1,
    position: 'relative',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  communityInfo: {
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 20,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  communityAvatar: {
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'white',
  },
  communityTitleContainer: {
    flex: 1,
  },
  communityName: {
    fontSize: 20,
    fontWeight: '700',
  },
  communityDisplayName: {
    fontSize: 16,
    marginTop: 2,
  },
  communityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  joinButton: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aboutContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  ruleItem: {
    marginBottom: 12,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  moderatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moderatorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  moderatorName: {
    fontSize: 14,
    fontWeight: '500',
  },
  moderatorUsername: {
    fontSize: 12,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingContainer: {
    padding: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export { CommunityDetailScreen };