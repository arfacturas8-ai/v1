import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  totalUpvotes: number;
  followersCount: number;
  followingCount: number;
  postCount: number;
  commentCount: number;
  cakeDay: string;
  isFollowing?: boolean;
  isBlocked?: boolean;
  badges: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }[];
}

interface UserPost {
  id: string;
  title: string;
  content?: string;
  score: number;
  commentCount: number;
  communityName: string;
  createdAt: string;
  imageUrl?: string;
}

const { width } = Dimensions.get('window');

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = route.params as { username: string };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'about'>('posts');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      // In real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProfile: UserProfile = {
        id: 'user1',
        username: username,
        displayName: 'John Developer',
        bio: 'Full-stack developer passionate about React Native and mobile development. Love contributing to open source projects!',
        avatar: 'https://i.pravatar.cc/200?u=' + username,
        banner: 'https://picsum.photos/800/200?random=1',
        totalUpvotes: 12847,
        followersCount: 856,
        followingCount: 234,
        postCount: 127,
        commentCount: 1543,
        cakeDay: '2022-03-15',
        isFollowing: false,
        isBlocked: false,
        badges: [
          { id: '1', name: 'Top Contributor', icon: '🏆', color: '#FFD700' },
          { id: '2', name: 'Helpful', icon: '🤝', color: '#4CAF50' },
          { id: '3', name: 'Early Adopter', icon: '🚀', color: '#2196F3' }
        ]
      };

      const mockPosts: UserPost[] = [
        {
          id: '1',
          title: 'Building a React Native App with TypeScript',
          content: 'Here are some best practices I\'ve learned...',
          score: 234,
          commentCount: 45,
          communityName: 'reactnative',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          imageUrl: 'https://picsum.photos/400/200?random=2'
        },
        {
          id: '2',
          title: 'State Management in Mobile Apps',
          content: 'Comparing different state management solutions...',
          score: 189,
          commentCount: 32,
          communityName: 'programming',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Mobile Performance Optimization Tips',
          content: 'Essential techniques to improve your app performance...',
          score: 156,
          commentCount: 28,
          communityName: 'mobiledev',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setProfile(mockProfile);
      setPosts(mockPosts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      setProfile({
        ...profile,
        isFollowing: !profile.isFollowing,
        followersCount: profile.isFollowing 
          ? profile.followersCount - 1 
          : profile.followersCount + 1
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleBlock = async () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              setProfile(prev => prev ? { ...prev, isBlocked: true } : null);
              Alert.alert('User Blocked', `You have blocked @${username}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to block user');
            }
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out @${username}'s profile on CRYB!`,
        url: `https://cryb.app/u/${username}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleMessage = () => {
    navigation.navigate('DirectMessage', { userId: profile?.id, username });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderHeader = () => (
    <View>
      {/* Banner */}
      {profile?.banner && (
        <Image source={{ uri: profile.banner }} style={styles.banner} />
      )}

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: profile?.avatar || 'https://i.pravatar.cc/200' }} 
            style={styles.avatar}
          />
          <View style={styles.statusIndicator} />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{profile?.displayName}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>
          
          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          {/* Badges */}
          {profile?.badges && profile.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              {profile.badges.map(badge => (
                <View key={badge.id} style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{formatNumber(profile?.totalUpvotes || 0)}</Text>
              <Text style={styles.statLabel}>Upvotes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{formatNumber(profile?.followersCount || 0)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{formatNumber(profile?.followingCount || 0)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{formatNumber(profile?.postCount || 0)}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Cake Day */}
          {profile?.cakeDay && (
            <View style={styles.cakeDay}>
              <MaterialIcons name="cake" size={16} color="#FF4500" />
              <Text style={styles.cakeDayText}>
                Joined {format(new Date(profile.cakeDay), 'MMMM yyyy')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.followButton, profile?.isFollowing && styles.followingButton]}
          onPress={handleFollow}
        >
          <MaterialIcons 
            name={profile?.isFollowing ? "person-remove" : "person-add"} 
            size={18} 
            color="white" 
          />
          <Text style={styles.actionButtonText}>
            {profile?.isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
          <MaterialIcons name="message" size={18} color="#666" />
          <Text style={[styles.actionButtonText, { color: '#666' }]}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="more-vert" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['posts', 'comments', 'about'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPost = (post: UserPost) => (
    <TouchableOpacity key={post.id} style={styles.postItem}>
      <View style={styles.postHeader}>
        <Text style={styles.communityName}>r/{post.communityName}</Text>
        <Text style={styles.postTime}>
          {format(new Date(post.createdAt), 'MMM d')}
        </Text>
      </View>
      
      <Text style={styles.postTitle}>{post.title}</Text>
      
      {post.content && (
        <Text style={styles.postContent} numberOfLines={2}>
          {post.content}
        </Text>
      )}

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      )}

      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <MaterialCommunityIcons name="arrow-up-bold" size={16} color="#666" />
          <Text style={styles.postStatText}>{post.score}</Text>
        </View>
        <View style={styles.postStat}>
          <MaterialIcons name="comment" size={16} color="#666" />
          <Text style={styles.postStatText}>{post.commentCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
        <TouchableOpacity onPress={handleBlock}>
          <MaterialIcons name="block" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadProfile} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        {/* Content based on active tab */}
        <View style={styles.content}>
          {activeTab === 'posts' && (
            <View>
              {posts.map(renderPost)}
              {posts.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialIcons name="post-add" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No posts yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'comments' && (
            <View style={styles.emptyState}>
              <MaterialIcons name="comment" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No comments to show</Text>
            </View>
          )}

          {activeTab === 'about' && profile && (
            <View style={styles.aboutSection}>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Total Upvotes</Text>
                <Text style={styles.aboutValue}>{formatNumber(profile.totalUpvotes)}</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Comments</Text>
                <Text style={styles.aboutValue}>{formatNumber(profile.commentCount)}</Text>
              </View>
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>Member Since</Text>
                <Text style={styles.aboutValue}>
                  {format(new Date(profile.cakeDay), 'MMMM d, yyyy')}
                </Text>
              </View>
              {profile.badges.length > 0 && (
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>Achievements</Text>
                  <View style={styles.achievementsList}>
                    {profile.badges.map(badge => (
                      <Text key={badge.id} style={styles.achievementItem}>
                        {badge.icon} {badge.name}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  banner: {
    width: '100%',
    height: 120,
  },
  profileSection: {
    backgroundColor: 'white',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: typography.h4,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.body1,
    color: '#666',
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: typography.body2,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    gap: spacing.xs,
  },
  badgeIcon: {
    fontSize: typography.caption,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.h6,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: typography.caption,
    color: '#666',
    marginTop: 2,
  },
  cakeDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cakeDayText: {
    fontSize: typography.caption,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
    flex: 1,
  },
  followButton: {
    backgroundColor: '#FF4500',
    borderColor: '#FF4500',
  },
  followingButton: {
    backgroundColor: '#666',
    borderColor: '#666',
  },
  actionButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: 'white',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF4500',
  },
  tabText: {
    fontSize: typography.body2,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FF4500',
  },
  content: {
    flex: 1,
  },
  postItem: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityName: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: '#FF4500',
  },
  postTime: {
    fontSize: typography.caption,
    color: '#666',
  },
  postTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  postContent: {
    fontSize: typography.body2,
    color: '#666',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  postImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  postStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postStatText: {
    fontSize: typography.caption,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyStateText: {
    fontSize: typography.body1,
    color: '#666',
    marginTop: spacing.md,
  },
  aboutSection: {
    backgroundColor: 'white',
    padding: spacing.lg,
  },
  aboutItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutLabel: {
    fontSize: typography.body2,
    color: '#666',
    marginBottom: spacing.xs,
  },
  aboutValue: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#333',
  },
  achievementsList: {
    marginTop: spacing.sm,
  },
  achievementItem: {
    fontSize: typography.body2,
    color: '#333',
    marginBottom: spacing.xs,
  },
});